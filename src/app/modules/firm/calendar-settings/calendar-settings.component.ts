import { Component, HostListener, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { forkJoin } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwTenantCalendarSetting, vwTenantHoliday } from 'src/common/swagger-providers/models';
import { CalendarService, TenantService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../modules/shared/error.json';
import { WORKING_HOURS } from '../../models/office-data';
import { DialogService } from '../../shared/dialog.service';
import { UtilsHelper } from '../../shared/utils.helper';

interface ICalendarPlatform {
  id?: number;
  code?: string;
  name?: string;
  categoryCode?: string;
  icon?: string;
  connect?: boolean;
}

@Component({
  selector: 'app-firm-calendar-settings',
  templateUrl: './calendar-settings.component.html',
  styleUrls: ['./calendar-settings.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class FirmCalendarSettingsComponent implements OnInit, IBackButtonGuard {
  @ViewChild('calendarDisconnectWarning', {static: false}) calendarDisconnectWarning: TemplateRef<any>;

  public calendarHoursForm: FormGroup;
  public workingHours = WORKING_HOURS;
  public ColumnMode = ColumnMode;
  public displayYear: number;
  public currentYear: number;
  public holidayList: Array<vwTenantHoliday> = [];
  public calendarSettings: vwTenantCalendarSetting;
  public calendarPlatform: Array<ICalendarPlatform> = [];
  public userDetails: Iprofile;
  public errorData: any = (errorData as any).default;
  private modalRef: any;
  public holidayForm: FormGroup = this.fb.group({
    id: null,
    date: ['', Validators.required],
    name: ['', Validators.required]
  });
  public iconArr = UtilsHelper.getCalendarIcon();
  public current_date: string;
  public holidayLoading: boolean;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  public extLoading: boolean;
  public hoursLoading: boolean;
  public disable = false;
  public deletedCalendarConnections = [];
  public rows = [];

  public holidayFormSubmitted = false;
  public holidayDateErrMsg = '';
  public holidayNameErrMsg = '';

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private tenantService: TenantService,
    private dialogService: DialogService,
    private toastDisplay: ToastDisplay,
    private router: Router,
    private pagetitle: Title,
    private calendarService: CalendarService
  ) {
    this.displayYear = 2020;
    this.currentYear = 2020;
    this.createWorkingHoursForm();
    router.events.subscribe((val) => {
      if (val instanceof NavigationStart) {
        this.navigateAwayPressed = true;
      }
    });
  }

  ngOnInit() {
    this.pagetitle.setTitle('Calendar Settings');
    this.current_date = new Date().toISOString().split('T')[0];
    this.userDetails = JSON.parse(localStorage.getItem('profile'));
    this.workingHours.forEach((hours, index) => {
      hours.index = index;
      if (hours.value === '00') {
        hours.key = 'Off';
      }
    });
    this.disable = false;
    this.holidayFormSubmitted = false;
    this.getList();
  }

  get f() {
    return this.holidayForm.controls;
  }

  private createWorkingHoursForm() {
    this.calendarHoursForm = this.fb.group({
      mondayOpenHours: new FormControl('00'),
      mondayCloseHours: new FormControl('00'),
      tuesdayOpenHours: new FormControl('00'),
      tuesdayCloseHours: new FormControl('00'),
      wednesdayOpenHours: new FormControl('00'),
      wednesdayCloseHours: new FormControl('00'),
      thursdayOpenHours: new FormControl('00'),
      thursdayCloseHours: new FormControl('00'),
      fridayOpenHours: new FormControl('00'),
      fridayCloseHours: new FormControl('00'),
      saturdayOpenHours: new FormControl('00'),
      saturdayCloseHours: new FormControl('00'),
      sundayOpenHours: new FormControl('00'),
      sundayCloseHours: new FormControl('00')
    });
  }

  /**
   * Get tenant holiday list, calendar setting, calendar platforms
   */
  private getList() {
    this.holidayLoading = true;
    this.extLoading = true;
    this.hoursLoading = true;
    forkJoin([
      this.tenantService.v1TenantHolidayGet({}),
      this.tenantService.v1TenantCalendarSettingsGet({}),
      this.tenantService.v1TenantCalendarPlatformsGet({})
    ]).pipe(
      map(res => {
        return {
          holidayList: JSON.parse(res[0] as any).results,
          calendarSetting: JSON.parse(res[1] as any).results,
          calendarPlatform: JSON.parse(res[2] as any).results,
        };
      }),
      finalize(() => {
      })
    ).subscribe(suc => {
      this.holidayLoading = false;
      this.holidayList = suc.holidayList;
      this.calendarSettings = suc.calendarSetting;
      this.calendarPlatform = suc.calendarPlatform;
      this.rows = this.getOfficeHolidayarray(this.holidayList, this.displayYear)
      if (this.calendarPlatform && this.calendarPlatform.length > 0) {
        this.extLoading = true;
        this.calendarPlatform.map(obj => {
          obj.icon = this.iconArr[obj.code.toLowerCase()];
          obj.connect = false;
        });
        this.extLoading = false;
      }
      if (this.calendarSettings && this.calendarSettings.calendarPlatforms) {
        this.extLoading = true;
        this.calendarSettings.calendarPlatforms.map((obj) => {
          const index = this.calendarPlatform.findIndex(item => item.id === obj.id);
          if (index > -1) {
            this.calendarPlatform[index].connect = true;
          }
        });
        this.extLoading = false;
      }
      if (this.calendarSettings) {
        this.calendarHoursForm.patchValue({
          mondayOpenHours: (this.calendarSettings.mondayCloseHours !== this.calendarSettings.mondayOpenHours) ? (this.calendarSettings.mondayOpenHours) ? UtilsHelper.getworkingHoursFormat(this.calendarSettings.mondayOpenHours) : '00' : '00',
          mondayCloseHours: (this.calendarSettings.mondayCloseHours !== this.calendarSettings.mondayOpenHours) ? (this.calendarSettings.mondayCloseHours) ? UtilsHelper.getworkingHoursFormat(this.calendarSettings.mondayCloseHours) : '00' : '00',
          tuesdayOpenHours: (this.calendarSettings.tuesdayOpenHours !== this.calendarSettings.tuesdayCloseHours) ? (this.calendarSettings.tuesdayOpenHours) ? UtilsHelper.getworkingHoursFormat(this.calendarSettings.tuesdayOpenHours) : '00' : '00',
          tuesdayCloseHours: (this.calendarSettings.tuesdayOpenHours !== this.calendarSettings.tuesdayCloseHours) ? (this.calendarSettings.tuesdayCloseHours) ? UtilsHelper.getworkingHoursFormat(this.calendarSettings.tuesdayCloseHours) : '00' : '00',
          wednesdayOpenHours: (this.calendarSettings.wednesdayOpenHours !== this.calendarSettings.wednesdayCloseHours) ? (this.calendarSettings.wednesdayOpenHours) ? UtilsHelper.getworkingHoursFormat(this.calendarSettings.wednesdayOpenHours) : '00' : '00',
          wednesdayCloseHours: (this.calendarSettings.wednesdayOpenHours !== this.calendarSettings.wednesdayCloseHours) ? (this.calendarSettings.wednesdayCloseHours) ? UtilsHelper.getworkingHoursFormat(this.calendarSettings.wednesdayCloseHours) : '00' : '00',
          thursdayOpenHours: (this.calendarSettings.thursdayOpenHours !== this.calendarSettings.thursdayCloseHours) ? (this.calendarSettings.thursdayOpenHours) ? UtilsHelper.getworkingHoursFormat(this.calendarSettings.thursdayOpenHours) : '00' : '00',
          thursdayCloseHours: (this.calendarSettings.thursdayOpenHours !== this.calendarSettings.thursdayCloseHours) ? (this.calendarSettings.thursdayCloseHours) ? UtilsHelper.getworkingHoursFormat(this.calendarSettings.thursdayCloseHours) : '00' : '00',
          fridayOpenHours: (this.calendarSettings.fridayOpenHours !== this.calendarSettings.fridayCloseHours) ? (this.calendarSettings.fridayOpenHours) ? UtilsHelper.getworkingHoursFormat(this.calendarSettings.fridayOpenHours) : '00' : '00',
          fridayCloseHours: (this.calendarSettings.fridayOpenHours !== this.calendarSettings.fridayCloseHours) ? (this.calendarSettings.fridayCloseHours) ? UtilsHelper.getworkingHoursFormat(this.calendarSettings.fridayCloseHours) : '00' : '00',
          saturdayOpenHours: (this.calendarSettings.saturdayOpenHours !== this.calendarSettings.saturdayCloseHours) ? (this.calendarSettings.saturdayOpenHours) ? UtilsHelper.getworkingHoursFormat(this.calendarSettings.saturdayOpenHours) : '00' : '00',
          saturdayCloseHours: (this.calendarSettings.saturdayOpenHours !== this.calendarSettings.saturdayCloseHours) ? (this.calendarSettings.saturdayCloseHours) ? UtilsHelper.getworkingHoursFormat(this.calendarSettings.saturdayCloseHours) : '00' : '00',
          sundayOpenHours: (this.calendarSettings.sundayOpenHours !== this.calendarSettings.sundayCloseHours) ? (this.calendarSettings.sundayOpenHours) ? UtilsHelper.getworkingHoursFormat(this.calendarSettings.sundayOpenHours) : '00' : '00',
          sundayCloseHours: (this.calendarSettings.sundayOpenHours !== this.calendarSettings.sundayCloseHours) ? (this.calendarSettings.sundayCloseHours) ? UtilsHelper.getworkingHoursFormat(this.calendarSettings.sundayCloseHours) : '00' : '00'
        });
        this.hoursLoading = false;
      } else {
        this.hoursLoading = false;
      }
      this.extLoading = false;
    }, () => {
      this.extLoading = false;
      this.hoursLoading = false;
      this.holidayLoading = false;
    });
  }

  public addCalendar(item: ICalendarPlatform) {
    this.dataEntered = true;
    if (!item.connect) {
      const modalRef = this.modalService.open(this.calendarDisconnectWarning, {
        centered: true,
        keyboard: false,
        backdrop: 'static',
        windowClass: 'md'
      });
      modalRef.result.then(() => {
        item.connect = false;
        this.deletedCalendarConnections.push(item.code);
      }, () => {
        item.connect = true;
        this.deletedCalendarConnections.splice(this.deletedCalendarConnections.indexOf(item.code), 1);
      });
    } else {
      item.connect = true;
      this.deletedCalendarConnections.splice(this.deletedCalendarConnections.indexOf(item.code), 1);
    }
  }

  public getOfficeHolidayarray(item, year) {
    if (item != null) {
      item = item.filter(a => new Date(a.date).getFullYear() === year);
    }
    return item;
  }

  changeDisplayYear(direction: string){
    if(direction === 'forward'){
      this.displayYear++
    }else if(direction === 'back'){
      this.displayYear--
    }
    this.rows = this.getOfficeHolidayarray(this.holidayList, this.displayYear)
  }

  public EditOfficeHoliday(content: any, row = null) {
    if (row) {
      this.holidayForm.setValue({
        id: row.id,
        date: row.date,
        name: row.name
      });
    } else {
      this.holidayForm.reset();
    }
    this.open(content);
  }

  private open(content) {
    this.holidayFormSubmitted = false;
    this.modalRef = this.modalService.open(content, {
      centered: true,
      keyboard: false,
      backdrop: 'static'
    });
    this.modalRef.result.then(res => {
      console.log(res);
    });
  }


  public saveHoliday() {
    this.holidayFormSubmitted = true;
    if (this.holidayForm.invalid) {
      return;
    } else {
      this.disable = true;
      this.modalRef.close(null);
      if (this.holidayForm.controls.id.value == null) {
        this.insertHoliday();
      } else {
        this.updateOfficeHoliday();
      }
    }
  }

  public insertHoliday() {
    this.holidayLoading = true;
    const data = {...this.holidayForm.value};
    data.id = 0;
    data.tenantId = +this.userDetails.tenantId;
    const convertedDate = new Date(data.date);
    convertedDate.setMinutes(convertedDate.getMinutes() + 330);
    data.date = convertedDate.toISOString();
    this.tenantService.v1TenantHolidayPost$Json$Response({body: data}).subscribe(suc => {
      const res: any = suc;
      this.holidayList = JSON.parse(res.body).results;
      this.getOfficeHolidayarray(this.holidayList, this.displayYear)
      this.holidayForm.reset();
      this.disable = false;
      this.holidayLoading = false;
    }, () => {
      this.disable = false;
      this.holidayLoading = false;
    });
  }

  public updateOfficeHoliday() {
    this.holidayLoading = true;
    const data = {...this.holidayForm.value};
    data.tenantId = +this.userDetails.tenantId;
    const convertedDate = new Date(data.date);
    convertedDate.setMinutes(convertedDate.getMinutes() + 330);
    data.date = convertedDate.toISOString();
    this.tenantService.v1TenantHolidayPut$Json$Response({body: data}).subscribe(suc => {
      this.holidayLoading = false;
      const res: any = suc;
      this.holidayList = JSON.parse(res.body).results;
      this.getOfficeHolidayarray(this.holidayList, this.displayYear)
      this.holidayForm.reset();
      this.disable = false;
    }, () => {
      this.holidayLoading = false;
      this.disable = false;
    });
  }

  public deleteOfficeHoliday(id) {
    this.dialogService
      .confirm(
        this.errorData.delete_holiday_tenant_confirm,
        'Delete',
        'Cancel',
        'Delete Holiday'
      ).then(r => {
      if (r) {
        this.tenantService.v1TenantHolidayIdDelete$Response({id}).subscribe(suc => {
          const res: any = suc;
          this.holidayList = JSON.parse(res.body).results;
          this.getOfficeHolidayarray(this.holidayList, this.displayYear)
          this.holidayLoading = false;
        }, () => {
        });
      }
    });
  }

  public saveChanges() {
    this.dataEntered = false;
    const data = {...this.calendarHoursForm.value};
    const daysArr = [
      'mondayOpenHours', 'mondayCloseHours',
      'tuesdayOpenHours', 'tuesdayCloseHours',
      'wednesdayOpenHours', 'wednesdayCloseHours',
      'thursdayOpenHours', 'thursdayCloseHours',
      'fridayOpenHours', 'fridayCloseHours',
      'saturdayOpenHours', 'saturdayCloseHours',
      'sundayOpenHours', 'sundayCloseHours'
    ];
    const isValid = this.validateWorkingHours();
    if (isValid) {
      this.extLoading = true;
      this.holidayLoading = true;
      this.hoursLoading = true;
      daysArr.map(obj => {
        data[obj] = this.getworkingHour(data[obj]);
      });
      const calendarPlatforms = [];
      this.calendarPlatform.map(obj => {
        if (obj.connect) {
          calendarPlatforms.push({id: obj.id, name: obj.name});
        }
      });

      data.id = this.calendarSettings.id;
      data.tenantId = this.userDetails.tenantId;
      data.calendarPlatforms = calendarPlatforms;
      let url;
      if (data.id > 0) {
        url = this.tenantService.v1TenantCalendarSettingsPut$Json$Response({body: data});
      } else {
        url = this.tenantService.v1TenantCalendarSettingsPost$Json$Response({body: data});
      }
      url.subscribe(suc => {
        this.calendarSettings = JSON.parse(suc.body).results;
        this.toastDisplay.showSuccess(this.errorData.calendar_settings_update_success);
        this.extLoading = false;
        this.holidayLoading = false;
        this.hoursLoading = false;
        if (this.deletedCalendarConnections.length) {
          this.calendarService.v1CalendarRevokeExistingPlatformsPost$Json({
            body: this.deletedCalendarConnections
          }).subscribe(() => {});
        }
      }, () => {
        this.extLoading = false;
        this.holidayLoading = false;
        this.hoursLoading = false;
      });
    }
  }

  public getworkingHour(hour: string) {
    if (hour === '00') {
      return this.current_date + 'T00:00:00Z';
    }
    return this.current_date + 'T' + hour + 'Z';
  }

  /**
   * Validate working hours
   */
  public validateWorkingHours() {
    const days = UtilsHelper.getDayslist();
    const isValid = days.every(day => {
      const open = this.calendarHoursForm.value[`${day.name.toLowerCase()}OpenHours`];
      const close = this.calendarHoursForm.value[`${day.name.toLowerCase()}CloseHours`];
      const openIndex = this.workingHours.findIndex(a => a.value === open);
      const closeIndex = this.workingHours.findIndex(a => a.value === close);
      if (open === '00' && close !== '00') {
        return false;
      } else if (open !== '00' || close !== '00') {
        return openIndex < closeIndex;
      } else {
        return true;
      }
    });
    if (!isValid) {
      this.toastDisplay.showError(this.errorData.validation_working_hours);
      return false;
    } else {
      return true;
    }
  }

  hourChange(key, key1) {
    if (this.calendarHoursForm.value[key] === '00') {
      this.calendarHoursForm.controls[key1].setValue('00');
    }
    this.dataEntered = true;
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = true;
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

}
