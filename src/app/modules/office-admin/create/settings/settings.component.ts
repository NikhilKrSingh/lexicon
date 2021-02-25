import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalDismissReasons, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IBillPeriod, IEmployeeCreateStepEvent, Page } from 'src/app/modules/models';
import { WORKING_HOURS } from 'src/app/modules/models/office-data';
import * as Constant from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwBillingSettings, vwIdCodeName } from 'src/common/swagger-providers/models';
import { BillingService, TenantService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../shared/error.json';
import { calculateTotalPages } from "../../../shared/math.helper";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  @ViewChild(DatatableComponent, {static: false}) table: DatatableComponent;
  @Output() readonly nextStep = new EventEmitter<IEmployeeCreateStepEvent>();
  @Output() readonly prevStep = new EventEmitter<IEmployeeCreateStepEvent>();
  @Input() isTrustAccountEnabled: boolean;
  public displayYear: number;
  public currentYear: number;
  errorData: any = (errorData as any).default;
  rateList: Array<any> = [];
  disbursementTypeList: Array<any> = [];
  officeHolidayList: Array<any> = [];
  calendarSettings: any;
  closeResult: string;
  ColumnMode = ColumnMode;
  selected = [];
  firmDetails: any;
  messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound
  };
  modalRef: NgbModalRef;
  officeHolidayForm: FormGroup;
  settingForm: FormGroup;
  workingHours = WORKING_HOURS;
  timeEntryRoundingList: Array<vwIdCodeName> = [{id: 5, name: '5 minutes'}, {id: 6, name: '6 minutes'}, {
    id: 7,
    name: '7 minutes'
  }, {id: 10, name: '10 minutes'}, {id: 15, name: '15 minutes'}];
  timeEntryReminderList: Array<vwIdCodeName> = [];
  addHoliday = true;
  timeEntryReminderCheck = false;
  userDetils: any = {};
  holidayId = '';
  public selectedRateTable: any[] = [];
  public selectedDisbursementType: any[] = [];
  public billingSettings: vwBillingSettings;
  public billFrequencySetting: IBillPeriod;
  formSubmitted: boolean;
  officeHolidayFormSubmitted: boolean;

  public page = new Page();
  public pageSelector = new FormControl('10');
  public pageSelected = new FormControl(1);
  public limitArray: Array<number> = [10, 30, 50, 100];
  public counter = Array;
  public afterGetingDetails: boolean = true;

  @ViewChild('table', { static: false }) holidayTable: DatatableComponent;
  public opratingAccounts = [];

  constructor(
    private builder: FormBuilder,
    private toastDisplay: ToastDisplay,
    private modalService: NgbModal,
    private billingService: BillingService,
    private dialogService: DialogService,
    private tenantService: TenantService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.timeEntryReminderList = [
      {
        id: 2,
        name: '2 days'
      },
      {
        id: 4,
        name: '4 days'
      }
    ];
  }

  ngOnInit() {
    this.initForm();
    this.displayYear = new Date().getFullYear();
    this.currentYear = new Date().getFullYear();
    this.userDetils = JSON.parse(localStorage.getItem('profile'));
    const data = UtilsHelper.getObject('office');
    if (data && data.settings && Object.keys(data.settings).length) {
      const info = data.settings;
      this.billingSettings = data.settings;
      this.billingSettings.billFrequencyDuration = {
        code: data.settings.billFrequencyDurationType,
        id: data.settings.billFrequencyDuration,
        name: _.capitalize(data.settings.billFrequencyDurationType)
      }
      if (info.officeRateList && info.officeRateList.length) {
        this.selectedRateTable = info.officeRateList;
        this.rateList = info.officeRateList;
      }
      if (info.officeDisbursementTypeList && info.officeDisbursementTypeList.length) {
        this.selectedDisbursementType = info.officeDisbursementTypeList;
        this.disbursementTypeList = info.officeDisbursementTypeList;
      }
      this.officeHolidayList = info.officeHolidayList && info.officeHolidayList.length ? info.officeHolidayList : [];
      this.calcTotalPages();
      this.settingForm.patchValue(info);

      this.timeEntryReminderCheck = info.timeEntryReminder ? true : false;
      this.disableField();
      this.afterGetingDetails = false;
    } else {
      this.getBillingListItem();
      this.getOfficeHoliday();
      this.getHolidaysAndWorkingHours();
    }
  }

  initForm() {
    this.settingForm = this.builder.group({
      timeEntryRounding: null,
      timeEntryReminder: [{value: null, disabled: true}],
      mondayOpen: '00',
      mondayClose: '00',
      tuesdayOpen: '00',
      tuesdayClose: '00',
      wednesdayOpen: '00',
      wednesdayClose: '00',
      thursdayOpen: '00',
      thursdayClose: '00',
      fridayOpen: '00',
      fridayClose: '00',
      saturdayOpen: '00',
      saturdayClose: '00',
      sundayOpen: '00',
      sundayClose: '00'
    });

    this.officeHolidayForm = this.builder.group({
      id: 0,
      date: ['', [Validators.required]],
      name: ['', [Validators.required]]
    });
  }

  public getOfficeHoliday() {
    this.tenantService
      .v1TenantHolidayGet()
      .subscribe(
        (res: any) => {
          this.officeHolidayList = JSON.parse(res).results;
          this.calcTotalPages();
        });
  }

  public getOfficeHolidayArray(item, year) {
    if (item != null) {
      item = item.filter(a => new Date(a.date).getFullYear() === year);
    }
    return item;
  }

  private getBillingListItem() {
    this.billingService
      .v1BillingSettingsTenantTenantIdGet({tenantId: this.userDetils.tenantId})
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {
          this.afterGetingDetails = false;
        })
      )
      .subscribe((res: any) => {
        if (res && res.length) {
          if (res[0].timeRoundingInterval) {
            this.settingForm.patchValue({
              timeEntryRounding: res[0].timeRoundingInterval
            });
          }
          this.billingSettings = res[0];
        }
      });
  }

  public officeHoliday(content: any, row, index?) {
    if (row === '') {
      this.officeHolidayForm.reset();
      this.addHoliday = true;
      this.holidayId = '';
    } else {
      this.addHoliday = false;
      if (row.id === 0) {
        this.holidayId = index;
      }
      this.officeHolidayForm.setValue({
        id: row.id,
        date: row.date ? new Date(row.date) : null,
        name: row.name
      });
    }

    this.open(content, '');
  }

  public insertOfficeHoliday() {
    this.officeHolidayFormSubmitted = true;
    if (this.officeHolidayForm.invalid) {
      return;
    }
    const data = {...this.officeHolidayForm.value};
    data.id = 0;
    data.tenantId = this.userDetils.tenantId;
    const convertedDate = new Date(data.date);
    convertedDate.setMinutes(convertedDate.getMinutes() + 330);
    data.date = convertedDate.toISOString();
    const tmp = [...this.officeHolidayList];
    tmp.push(data);
    this.officeHolidayList = [...tmp];
    this.calcTotalPages();
    this.reset(this.officeHolidayForm);
  }

  public updateOfficeHoliday() {
    this.officeHolidayFormSubmitted = true;
    if (this.officeHolidayForm.invalid) {
      return;
    }
    const tmp = [...this.officeHolidayList];
    const data = {...this.officeHolidayForm.value};
    data.tenantId = this.userDetils.tenantId;
    const convertedDate = new Date(data.date);
    convertedDate.setMinutes(convertedDate.getMinutes() + 330);
    data.date = convertedDate.toISOString();
    const idx = data.id === 0 ? +this.holidayId : tmp.findIndex(x => x.id === data.id);
    if (idx > -1) {
      tmp.splice(idx, 1, data);
    }
    this.officeHolidayList = [...tmp];
    this.holidayId = '';
    this.calcTotalPages();
    this.reset(this.officeHolidayForm);
  }

  public deleteOfficeHoliday(id, index) {
    this.dialogService
      .confirm(
        this.errorData.delete_holiday_confirm,
        'Delete',
        'Cancel',
        'Delete Holiday'
      )
      .then(r => {
        if (r) {
          const tmp = [...this.officeHolidayList];
          const idx = id === 0 ? index : tmp.findIndex(x => x.id === id);
          if (idx > -1) {
            tmp.splice(idx, 1);
          }
          this.officeHolidayList = [...tmp];
          this.calcTotalPages();
        }
      });
  }

  public getValue(data: IBillPeriod) {
    this.billFrequencySetting = {...data};
    this.billFrequencySetting.effectiveDate = moment(this.billFrequencySetting.effectiveDate).format('YYYY-MM-DD');
  }

  getOpratingAccountsDetails(event){
    this.opratingAccounts = event;
  }

  next() {
    this.formSubmitted = true;
    if(this.opratingAccounts.length == 0){
      return;
    }
    const isValid = this.validateWorkingHours();
    if (isValid) {
      const data = {...this.settingForm.value};
      data.timeEntryRounding = +data.timeEntryRounding;
      if (this.timeEntryReminderCheck) {
        data.timeEntryReminder = +data.timeEntryReminder;
      }
      if (this.billFrequencySetting && (
        !this.billFrequencySetting.billFrequencyQuantity ||
        !this.billFrequencySetting.billFrequencyDuration
      )) {
        return;
      }
      if (this.billFrequencySetting && this.billFrequencySetting.billFrequencyDurationType === 'MONTHS') {
        if (!this.billFrequencySetting.billFrequencyRecursOn) {
          return;
        }
      }

      let effectivePeriod = UtilsHelper.getFinalEffectiveDate(this.billFrequencySetting.effectiveDate, this.billFrequencySetting);
      this.billFrequencySetting.billFrequencyStartingDate = moment(effectivePeriod.previosEffectiveDate).format('YYYY-MM-DD');
      this.billFrequencySetting.billFrequencyNextDate = moment(effectivePeriod.newEffectiveDate).format('YYYY-MM-DD');
      const settings = {...this.billFrequencySetting};
      delete settings.billingSettings;
      delete settings.effectiveDate;
      const tmp: any = UtilsHelper.getObject('office') ? UtilsHelper.getObject('office') : {};
      tmp.settings = Object.assign({}, data, settings);

      if (!tmp.settings.officeHolidayList) {
        tmp.settings.officeHolidayList = {};
      }
      if (!tmp.settings.officeRateList) {
        tmp.settings.officeRateList = [];
      }
      if (!tmp.settings.officeDisbursementTypeList) {
        tmp.settings.officeDisbursementTypeList = [];
      }

      tmp.settings.officeRateList = this.rateList;
      tmp.settings.officeDisbursementTypeList = this.disbursementTypeList;
      tmp.settings.officeHolidayList = this.officeHolidayList;
      tmp.settings.opratingAccounts = this.opratingAccounts;
      UtilsHelper.setObject('office', tmp);
      if (this.isTrustAccountEnabled) {
        this.nextStep.emit({
          nextStep: 'trustaccount',
          currentStep: 'settings',
        });
      } else {
        this.nextStep.emit({
          nextStep: 'lawofficenotes',
          currentStep: 'settings',
        });
      }
    }

  }

  /**
   * Validates Working hours on click on Next Button
   */
  validateWorkingHours() {
    const days = UtilsHelper.getDayslist();
    const isValid = days.every(day => {
      const open = this.settingForm.value[`${day.name.toLowerCase()}Open`];
      const close = this.settingForm.value[`${day.name.toLowerCase()}Close`];

      const openIndex = this.workingHours.findIndex(a => a.value === open);
      const closeIndex = this.workingHours.findIndex(a => a.value === close);

      if (open === '00' && close === '00') {
        return true;
      } else if (open === '00' && close !== '00') {
        return false;
      } else if (open !== '00' && close === '00') {
        return false;
      } else {
        return openIndex < closeIndex;
      }
    });
    if (!isValid) {
      this.toastDisplay.showError(this.errorData.validation_working_hours);
      return false;
    } else {
      return true;
    }
  }

  open(content: any, className) {
    this.modalRef = this.modalService.open(content, {
      size: className,
      centered: true,
      backdrop: 'static'
    });

    this.modalRef.result.then(
      result => {
        this.closeResult = `Closed with: ${result}`;
      },
      reason => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  public onSelect({selected}) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  public reset(forms: FormGroup) {
    forms.reset();
    this.officeHolidayFormSubmitted = false;
    this.modalRef.close();
  }

  public prev() {
    this.prevStep.emit({
      currentStep: 'settings',
      prevStep: 'employee',
    });
  }

  public disableField() {
    if (this.timeEntryReminderCheck) {
      this.settingForm.get('timeEntryReminder').enable();
    } else {
      this.settingForm.get('timeEntryReminder').disable();
    }
  }

  public onHourChange(day: string) {
    try {
      const open = this.settingForm.controls[`${day}Open`].value;
      const close = this.settingForm.controls[`${day}Close`];

      if (open === '00') {
        close.setValue('00');
      }
    } catch (ex) {
      console.log(ex);
    }
  }

  public validateHour(day: string) {
    try {
      const open = this.settingForm.controls[`${day}Open`].value;
      const close = this.settingForm.controls[`${day}Close`].value;

      const isValid = this.isValidHours(open, close);
      if (!isValid) {
        this.toastDisplay.showError(this.errorData.validation_working_hours);
      }
    } catch (ex) {
      console.log(ex);
    }
  }

  public isValidHours(open: string, close: string) {
    if (open === '00' && close === '00') {
      return true;
    } else {
      const openIndex = this.workingHours.findIndex(a => a.value === open);
      const closeIndex = this.workingHours.findIndex(a => a.value === close);

      return openIndex < closeIndex;
    }
  }

  private getHolidaysAndWorkingHours() {
    this.tenantService.v1TenantCalendarSettingsGet().subscribe(res => {
      this.calendarSettings = JSON.parse(res as any).results;
      this.settingForm.patchValue({
        mondayOpen: this.formatTimings(this.calendarSettings.mondayOpenHours),
        mondayClose: this.formatTimings(this.calendarSettings.mondayCloseHours),
        tuesdayOpen: this.formatTimings(this.calendarSettings.tuesdayOpenHours),
        tuesdayClose: this.formatTimings(this.calendarSettings.tuesdayCloseHours),
        wednesdayOpen: this.formatTimings(this.calendarSettings.wednesdayOpenHours),
        wednesdayClose: this.formatTimings(this.calendarSettings.wednesdayCloseHours),
        thursdayOpen: this.formatTimings(this.calendarSettings.thursdayOpenHours),
        thursdayClose: this.formatTimings(this.calendarSettings.thursdayCloseHours),
        fridayOpen: this.formatTimings(this.calendarSettings.fridayOpenHours),
        fridayClose: this.formatTimings(this.calendarSettings.fridayCloseHours),
        saturdayOpen: this.formatTimings(this.calendarSettings.saturdayOpenHours),
        saturdayClose: this.formatTimings(this.calendarSettings.saturdayCloseHours),
        sundayOpen: this.formatTimings(this.calendarSettings.sundayOpenHours),
        sundayClose: this.formatTimings(this.calendarSettings.sundayCloseHours)
      });
    });
  }

  private formatTimings(value): string {
    const formatted = UtilsHelper.getworkingHoursFormat(value);
    return formatted !== '00:00:00' ? formatted : '00';
  }

  rateValues(value) {
    this.rateList = value;
  }

  disbursementValues(values) {
    this.disbursementTypeList = values;
  }


  /**
   * Change Page size from Paginator
   */
  changePageSize() {
    this.page.size = this.pageSelector.value;
    this.calcTotalPages();
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected.value - 1;
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected.patchValue(e.page);
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.page.totalElements = this.officeHolidayList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected.patchValue(1);
    if (this.holidayTable) {
      this.holidayTable.offset = 0;
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
