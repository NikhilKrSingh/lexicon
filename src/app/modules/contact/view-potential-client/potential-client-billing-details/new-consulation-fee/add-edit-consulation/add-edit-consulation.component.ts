import {
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { Page } from 'src/app/modules/models';
import {
  BillingService,
  MiscService,
  PotentialClientBillingService,
} from 'src/common/swagger-providers/services';
import { padNumber, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { ErrorJsonObject } from 'src/app/modules/models/error.model';
import * as errorData from 'src/app/modules/shared/error.json';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedService } from 'src/app/modules/shared/sharedService';
import {Router} from "@angular/router";

@Component({
  selector: 'app-add-edit-consulation',
  templateUrl: './add-edit-consulation.component.html',
  styleUrls: ['./add-edit-consulation.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class AddEditConsulationComponent implements OnInit {
  action: string;
  selectedRow: any;
  public dateReset = false;
  public addEditConsultationForm: FormGroup;
  public consulationCode: any[] = [];
  public orgConsulationCode: any[] = [];
  clientDetails: any;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  public ColumnMode = ColumnMode;
  public page = new Page();
  public counter = Array;
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 20];
  public pageSelected = 1;
  public selected: any = [];
  public recordList = [];
  public rate: any;
  public chargePrefix = '$';
  public baseRate = 0;
  public errorData = (errorData as any).default;
  hours: number;
  minutes: number;
  total_hours: number;
  consultationSelected: any;
  formSubmitted: boolean = false;
  dateOfServiceError = false;
  validDuration = true;
  public error_data: any = (errorData as any).default;
  searchInput: any;
  amountVisible: boolean = true;
  loadder = false;

  dateOfServiceFilter = (d: Date) => {
    return moment().isSameOrAfter(moment(d), 'days');
  };

  constructor(
    private billingService: BillingService,
    private builder: FormBuilder,
    private miscService: MiscService,
    private toastDisplay: ToastDisplay,
    private changeDetectorRef: ChangeDetectorRef,
    private potentialClientBillingService: PotentialClientBillingService,
    private modalService: NgbActiveModal,
    private sharedService : SharedService,
    private router: Router
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    if (this.action == 'edit') {
      this.getConsultationDetails();
    }
    this.getConsultationCode();
    this.getCategoryRecord();
    this.initForm();
  }

  initForm() {
    this.addEditConsultationForm = this.builder.group({
      id: 0,
      dateOfService: [new Date(), [Validators.required]],
      consultationCodeId: ['', [Validators.required]],
      recordStatus: ['', [Validators.required]],
      billingNarrative: ['', [Validators.required]],
      consulation_duration: ['', [Validators.required]],
      note: ['', [Validators.required]],
      isVisibleToClient: false,
    });
  }

  get f() {
    return this.addEditConsultationForm.controls;
  }

  getRowClass(row): string {
    let cssClass = '';
    if (row.selected) {
      cssClass = 'expanded-row';
    }
    return cssClass;
  }

  get footerHeight() {
    if (this.consulationCode) {
      return this.consulationCode.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }

  getConsultationDetails() {
    this.loadder = true;
    this.potentialClientBillingService
      .v1PotentialClientBillingConsultationFeeIdGet$Response({
        id: this.selectedRow.consultationFeeList.id,
      })
      .subscribe((res: any) => {
        res = JSON.parse(res.body as any).results;
        this.addEditConsultationForm.patchValue({
          id: res.id,
          dateOfService: res.dateOfService,
          consultationCodeId: res.consultationCodeId,
          recordStatus: res.recordStatus,
          billingNarrative: res.billingNarrative,
          consulation_duration: res.hours + ':' + res.minutes,
          note: ' ',
          isVisibleToClient: false,
        });
        this.rate = res.totalRate;
        this.manageEditActivity();
        this.loadder = false;
      });
  }

  manageEditActivity() {
    let selectedCode = this.consulationCode.filter((item) => {
      if (item.id == this.addEditConsultationForm.value.consultationCodeId) {
        return item;
      }
    });
    if (selectedCode.length > 0) {
      this.onSelect(selectedCode[0]);
    }
    this.modelChanged();
  }

  getCategoryRecord() {
    this.miscService
      .v1MiscLookUpGet$Response({ categoryCode: 'RETENTION_STATUS' })
      .subscribe((res: any) => {
        res = JSON.parse(res.body as any).results;
        this.recordList = res;
        if(this.clientDetails.consultationFeeRecordStatus && this.clientDetails.consultationFeeRecordStatus.id){
          this.addEditConsultationForm.patchValue({ recordStatus: this.clientDetails.consultationFeeRecordStatus.id });
        }else{
          this.recordList.filter((item) => {
            if (item.code == 'NOT_YET_DECIDED') {
              this.addEditConsultationForm.patchValue({ recordStatus: item.id });
            }
          });
        }

      });
  }

  getConsultationCode() {
    this.loadder = true;
    this.billingService
      .v1BillingConsultationFeeCodesGet$Response({})
      .subscribe((res: any) => {
        this.loadder = false;
        res = JSON.parse(res.body as any).results;
        this.orgConsulationCode = res;

        if (this.action == 'add') {
          this.orgConsulationCode = this.orgConsulationCode.filter(
            (a) => a.status == 'Active'
          );
          if (this.orgConsulationCode.length == 1) {
            this.onSelect(this.orgConsulationCode[0]);
          }
        } else {
          this.orgConsulationCode = this.orgConsulationCode.filter(
            (a) =>
              a.status == 'Active' ||
              a.id == this.selectedRow.consultationFeeList.consultationFeeCodeId
          );
        }

        this.consulationCode = [...this.orgConsulationCode];
        this.manageEditActivity();
        this.updateFooterPage();
      }, () => {
        this.loadder = false;
      });
  }

  searchConsultation(value) {
    if (value && value.length > 0) {
      this.consulationCode = this.orgConsulationCode.filter(
        (item) =>
          this.matchName(item, value, 'code') ||
          this.matchName(item, value, 'name')
      );
    } else {
      this.consulationCode = this.orgConsulationCode;
    }
  }

  private matchName(item: any, searchValue: string, fieldName): boolean {
    let searchName;
    searchName = item[fieldName]
      ? item[fieldName].toString().toUpperCase()
      : '';
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateFooterPage();
  }

  /**
   * Change page number
   *
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateFooterPage();
    }
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }
  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
  }

  onSelect(row: any) {
    this.selected = row;
    this.consultationSelected = row;
    this.baseRate = row.rate;
    this.addEditConsultationForm.patchValue({
      consultationCodeId: row.id,
      totalRate: row.rate,
    });

    this.consulationCode.forEach((a) => {
      if (a.id == row.id) {
        a.selected = true;
      } else {
        a.selected = false;
      }
    });

    this.consulationCode = [...this.consulationCode];

    if (this.addEditConsultationForm.value.consulation_duration) {
      this.modelChanged();
    }
  }

  /** update Associations table footer page count */
  updateFooterPage() {
    this.page.totalElements = this.orgConsulationCode.length;
    this.page.totalPages = Math.ceil(
      this.orgConsulationCode.length / this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

  public copytoNote() {
    if (
      !this.addEditConsultationForm.controls.note.value ||
      (this.addEditConsultationForm.controls.note.value &&
        this.addEditConsultationForm.controls.note.value.trim() == '')
    ) {
      this.addEditConsultationForm.controls.note.patchValue(
        this.addEditConsultationForm.controls.billingNarrative.value
      );
    }
  }

  modelChanged() {
    let hours = 0;
    let minutes = 0;
    let isError = false;
    const timeWorked = this.addEditConsultationForm.controls
      .consulation_duration.value;
    isError = this.checkTime(timeWorked.replace(/\s/g, '').split(''));
    if (isError) {
      this.resetTimeWorked(timeWorked && timeWorked.length > 0);
    } else {
      if (timeWorked.includes(':')) {
        const hoursMinutes = timeWorked.split(/[.:]/);
        hours = hoursMinutes[0] ? parseInt(hoursMinutes[0], 10) : 0;
        minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
      } else if (timeWorked.includes('.') || !isNaN(timeWorked)) {
        const decimalTimeString = timeWorked;
        let decimalTime = parseFloat(decimalTimeString);
        decimalTime = decimalTime * 60 * 60;
        const isNegative = decimalTime < 0 ? -1 : 1;
        hours = Math.floor(Math.abs(decimalTime) / (60 * 60));
        hours = hours * isNegative;
        decimalTime = decimalTime - hours * 60 * 60;
        minutes = Math.floor(Math.abs(decimalTime) / 60);
        minutes = minutes * isNegative;
        decimalTime = decimalTime - minutes * 60;
      } else if (timeWorked.includes('h')) {
        const hoursMinutes = timeWorked.split(/[.h]/);
        hours = parseInt(hoursMinutes[0], 10);
        minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
      } else if (timeWorked.includes('m')) {
        const hoursMinutes = timeWorked.split(/[.m]/);
        hours = 0;
        minutes = hoursMinutes[0] ? parseInt(hoursMinutes[0], 10) : 0;
      } else if (timeWorked.includes('h') && timeWorked.includes('m')) {
        const hoursMinutes = timeWorked.split(/[.h]/);
        hours = parseInt(hoursMinutes[0], 10);
        const min = timeWorked.split(/[.m]/);
        minutes = min[0] ? parseInt(min[0], 10) : 0;
        this.setTime(hours, minutes);
      } else {
        this.resetTimeWorked(timeWorked && timeWorked.length > 0);
        isError = true;
      }
      if (!isError) {
        let parsed = UtilsHelper.parseMinutes(minutes, hours);
        hours = parsed.hours;
        minutes = parsed.minutes;
        this.setTime(hours, minutes);
      }
    }
  }

  private resetTimeWorked(showError = true) {
    this.rate = 0;
    this.chargePrefix = this.baseRate < 0 ? '-$' : '$';
    if (showError) {
      this.rate = 0;
      this.chargePrefix = this.baseRate < 0 ? '-$' : '$';
    }
    this.addEditConsultationForm.patchValue({
      consulation_duration: '',
    });
    this.hours = 0;
    this.minutes = 0;
  }

  private checkTime(val: string[]) {
    let isError = false;
    val.forEach((timeObj: string) => {
      timeObj = timeObj
        .replace(':', '')
        .replace('.', '')
        .replace('h', '')
        .replace('m', '');
      isError = !((timeObj >= '0' && timeObj <= '9') || timeObj === '');
    });
    return isError;
  }

  private setTime(hours: number, minutes: number) {
    if (hours === 0 && minutes === 0) {
      const finalText = this.getTimeString(hours, minutes);
      this.addEditConsultationForm.patchValue({
        consulation_duration: finalText,
      });

      this.hours = 0;
      this.minutes = 0;

      this.toastDisplay.showError(this.errorData.consutlation_duration_must_be_non_zero);
    } else if (isNaN(hours) || isNaN(minutes)) {
      this.resetTimeWorked();
    } else {
      if (minutes == 60) {
        hours = hours >= 0 ? hours + 1 : hours - 1;
        minutes = 0;
      }

      this.hours = hours;
      this.minutes = minutes;

      const finalText = this.getTimeString(hours, minutes);
      this.addEditConsultationForm.patchValue({
        consulation_duration: finalText,
      });

      if (this.hours < 0 || this.minutes < 0) {
        this.total_hours =
          (Math.abs(this.hours) * 60 + Math.abs(this.minutes)) / 60;
        this.total_hours = this.total_hours * -1;
      } else {
        this.total_hours =
          (Math.abs(this.hours) * 60 + Math.abs(this.minutes)) / 60;
      }
      if (
        this.consultationSelected &&
        this.consultationSelected.billTypeName &&
        this.consultationSelected.billTypeName === 'Hourly' &&
        this.addEditConsultationForm.get('dateOfService').value
      ) {
        this.rate = Math.abs(this.baseRate * +this.total_hours);
        this.amountVisible = true;
        this.changeDetectorRef.detectChanges();
        if (this.baseRate * +this.total_hours < 0) {
          this.chargePrefix = '-$';
        } else {
          this.chargePrefix = '$';
        }
      } else if (
        this.consultationSelected &&
        this.consultationSelected.billTypeName &&
        this.consultationSelected.billTypeName === 'Open' &&
        this.addEditConsultationForm.get('dateOfService').value
      ) {
        this.rate = 0;
        this.amountVisible = false;
        this.changeDetectorRef.detectChanges();
      } else {
        if (this.addEditConsultationForm.get('dateOfService').value) {
          this.rate = Math.abs(this.baseRate);
          this.amountVisible = true;
          this.changeDetectorRef.detectChanges();
          if (this.baseRate * +this.total_hours < 0) {
            this.chargePrefix = '-$';
          } else {
            this.chargePrefix = '$';
          }
        }
      }
    }

    this.blurAmtFormat();
  }

  getTimeString(hour: string | number, min: string | number) {
    const timeDisplay = localStorage.getItem('timeformat');
    if (min >= 60) {
      hour = +hour + 1;
      min = +min - 60;
    }

    const isNegative = hour == 0 && +min < 0;

    if (timeDisplay === 'jira') {
      if (isNegative) {
        return '-0h' + ' ' + Math.abs(+min) + 'm';
      } else {
        return hour + 'h' + ' ' + Math.abs(+min) + 'm';
      }
    } else if (timeDisplay === 'standard') {
      if (isNegative) {
        return '-0' + ':' + padNumber(Math.abs(+min));
      } else {
        return hour + ':' + padNumber(Math.abs(+min));
      }
    } else if (timeDisplay === 'decimal') {
      const hoursMinutes = (hour + ':' + min).split(/[.:]/);
      const hours = parseInt(hoursMinutes[0], 10);
      const minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
      return (hours + minutes / 60).toFixed(2);
    } else {
      if (isNegative) {
        return '-0h' + ' ' + Math.abs(+min) + 'm';
      } else {
        return hour + 'h' + ' ' + Math.abs(+min) + 'm';
      }
    }
  }

  dateOfServiceChage() {
    this.dateOfServiceError = false;
    let ds = this.addEditConsultationForm.value.dateOfService;
    if (ds) {
      if (ds && moment(ds).isAfter(moment(), 'days')) {
        this.dateOfServiceError = true;
      } else {
        this.dateOfServiceError = false;
      }
    }
  }

  validateDuration() {
    this.validDuration = true;

    if (!this.hours && !this.minutes) {
      this.validDuration = false;
    }
  }

  save(isBillNow = false) {
    this.formSubmitted = true;
    this.validateDuration();
    if (this.addEditConsultationForm.valid && this.rate > 0 && !this.dateOfServiceError && this.validDuration) {
      let data = {
        id: 0,
        potentialClientId: this.clientDetails.id,
        targetMatterId: this.clientDetails.matterId,
        dateOfService: this.addEditConsultationForm.value.dateOfService,
        consultationCodeId: this.selected.id,
        hours: this.hours,
        minutes: this.minutes,
        totalRate: parseFloat(this.rate),
        recordStatus: this.addEditConsultationForm.value.recordStatus,
        billingNarrative: this.addEditConsultationForm.value.billingNarrative,
        note: {
          id: 0,
          name: 'note',
          rivisionNumber: 0,
          noteType: '',
          applicableDate: moment().toJSON(),
          content: this.addEditConsultationForm.value.note,
          isVisibleToClient: this.addEditConsultationForm.value
            .isVisibleToClient,
        },
      };
      this.sharedService.updateDecisionStatus$.emit(this.addEditConsultationForm.value.recordStatus);

      if (this.action == 'add') {
        this.loadder = true;
        this.potentialClientBillingService
          .v1PotentialClientBillingAddConsultationFeePost$Json$Response({
            body: data,
          })
          .subscribe(
            (res: any) => {
              res = JSON.parse(res.body as any).results;
              if (res) {
                this.toastDisplay.showSuccess('Initial consultation recorded.');
                this.modalService.close(res);
                if (isBillNow) {
                  this.router.navigate(['/contact/bill-potential-client'], {
                    queryParams: {clientId: this.clientDetails.id}
                  });
                }
              }
            },
            () => {
              this.loadder = false;
            }
          );
      } else {
        this.loadder = true;
        data.id = this.addEditConsultationForm.value.id;
        this.potentialClientBillingService
          .v1PotentialClientBillingUpdateConsultationFeePut$Json$Response({
            body: data,
          })
          .subscribe(
            (res: any) => {
              res = JSON.parse(res.body as any).results;
              if (res) {
                this.toastDisplay.showSuccess('Initial consultation updated.');
                this.modalService.close(res);
              }
            },
            () => {
              this.loadder = false;
            }
          );
      }
    }
  }

  blurAmtFormat() {
    if (this.rate) {
      this.rate = parseFloat(this.rate).toFixed(2);
    } else {
      this.rate = '0.00';
    }
  }

  close() {
    this.modalService.close('');
  }
}
