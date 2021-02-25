import { Component, EventEmitter, OnInit, Output,ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IEmployeeCreateStepEvent } from 'src/app/modules/models';
import { CustomizeMatterRateComponent } from 'src/app/modules/shared/billing-settings/index';
import * as errors from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwCalendarSettings, vwEmployee, vwRate } from 'src/common/swagger-providers/models';
import {
  AuthService,
  BillingService,
  EmployeeService,
  MiscService,
  OfficeService,
  PersonService
} from 'src/common/swagger-providers/services';
import { WORKING_HOURS } from '../../../models/office-data';
import * as errorData from '../../../shared/error.json';
import { fromEvent } from 'rxjs';
import { debounceTime, take } from 'rxjs/operators';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  @Output() readonly prevStep = new EventEmitter<IEmployeeCreateStepEvent>();

  public formSubmitted = false;
  public error_data = (errors as any).default;
  public employee: vwEmployee;
  public calendarSettings: any = {};
  public rateList: Array<vwRate>;
  public originalRateList: Array<vwRate>;
  public selectedRate: vwRate;
  public tempFormData: any;
  public errorData: any = (errorData as any).default;
  public submitAction = true;
  public timeZones: any;
  public workingHours = WORKING_HOURS;
  public loading = false;
  public jobFamilyDetail: any = {
    baseRate: null
  };
  public jobFamilyBaseRate: any = null;
  public offsetValue;
  public topbarHeight: number;

  constructor(
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private modalService: NgbModal,
    private employeeService: EmployeeService,
    private router: Router,
    private officeService: OfficeService,
    private personService: PersonService,
    private authService: AuthService,
    private miscService: MiscService,
    private el: ElementRef,
  ) {
  }

  ngOnInit() {
    this.calendarSettings.timeZone = null;
    this.loadTimeZones();
    this.tempFormData = UtilsHelper.getObject('employee_general');
    const info = UtilsHelper.getObject('employee_setting');
    if (this.tempFormData && this.tempFormData.data && this.tempFormData.data.primaryOffice) {
      this.loading = true;
      forkJoin([
        this.officeService.v1OfficeIdGet$Response({
          id: this.tempFormData.data.primaryOffice.id
        }),
        this.billingService.v1BillingRateOfficeOfficeIdGet$Response({
          officeId: this.tempFormData.data.primaryOffice.id
        })
      ]).pipe(
        map(res => {
          return {
            officeDetails: JSON.parse(res[0].body as any).results,
            rateList: JSON.parse(res[1].body as any).results
          };
        }),
        finalize(() => {
        })
      ).subscribe(
        res => {
          if (res) {
            this.rateList = res.rateList;
            if (info && info.rateTable) {
              this.selectedRate = info.rateTable;
            }
            this.originalRateList = [...this.rateList];
            if (res.officeDetails) {
              if (info && info.workHour) {
                this.calendarSettings = info.workHour;
                return;
              }
              this.setOfficeHours(res.officeDetails);
            }
            this.loading = false;
          } else {
            this.loading = false;
          }
        },
        () => {
          this.loading = false;
        }
      );
    }
    if (this.tempFormData && this.tempFormData.data && this.tempFormData.data.jobFamily) {
      this.employeeService.v1EmployeeJobFamilyJobfamilyidGet({jobfamilyid: this.tempFormData.data.jobFamily})
        .subscribe((result: any) => {
          this.jobFamilyDetail = JSON.parse(result).results;
          this.jobFamilyDetail.baseRate = this.jobFamilyDetail.baseRate ? Number(this.jobFamilyDetail.baseRate).toFixed(2) : '0.00';
          this.jobFamilyBaseRate = this.jobFamilyDetail.baseRate;
        });
    }
  }

  ngAfterViewInit() {
    const ele = document.querySelectorAll('.top-bar');
    this.topbarHeight =
      ele && ele.length > 0 ? ele[0].getBoundingClientRect().height : 0;
  }


  private scrollToFirstInvalidControl() {
    const firstInvalidControl: HTMLElement = this.el.nativeElement.querySelector(
      '.emp-frm .has-error'
    );
    if (firstInvalidControl) {
      window.scroll({
        top: this.getTopOffset(firstInvalidControl),
        left: 0,
        behavior: 'smooth'
      });
      fromEvent(window, 'scroll')
        .pipe(debounceTime(100), take(1))
        .subscribe(() => firstInvalidControl.focus());
    }
  }
  private getTopOffset(controlEl: HTMLElement): number {
    const labelOffset = 300;
    return (
      controlEl.getBoundingClientRect().top +
      window.scrollY -
      (this.topbarHeight + labelOffset)
    );
  }

  setCurrencyValue() {
    if (this.jobFamilyBaseRate) {
      this.jobFamilyBaseRate = Number(this.jobFamilyBaseRate).toFixed(2);
    } else {
      this.jobFamilyBaseRate = null;
    }
  }

  setJobFamilyBaseRate() {
    this.jobFamilyBaseRate = this.jobFamilyDetail.baseRate;
  }

  public loadTimeZones() {
    this.miscService
      .v1MiscTimezonesGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.timeZones = res;
        }
      });
  }

  /**
   * function to add office hours
   */
  setOfficeHours(officeDetails) {
    const primaryOfficeTimezone = (this.timeZones) ? this.timeZones.filter(obj => obj.id === officeDetails.timeZone)[0] : null;
    this.calendarSettings = {
      mondayOpenHours: officeDetails.mondayOpen,
      mondayCloseHours: officeDetails.mondayClose,
      tuesdayOpenHours: officeDetails.tuesdayOpen,
      tuesdayCloseHours: officeDetails.tuesdayClose,
      wednesdayOpenHours: officeDetails.wednesdayOpen,
      wednesdayCloseHours: officeDetails.wednesdayClose,
      thursdayOpenHours: officeDetails.thursdayOpen,
      thursdayCloseHours: officeDetails.thursdayClose,
      fridayOpenHours: officeDetails.fridayOpen,
      fridayCloseHours: officeDetails.fridayClose,
      saturdayOpenHours: officeDetails.saturdayOpen,
      saturdayCloseHours: officeDetails.saturdayClose,
      sundayOpenHours: officeDetails.sundayOpen,
      sundayCloseHours: officeDetails.sundayClose,
      timeZone: primaryOfficeTimezone ? primaryOfficeTimezone.id : null
    };
  }

  hourChange(key, key1) {
    if (this.calendarSettings[key] == '00') {
      this.calendarSettings[key1] = '00';
    }
  }

  customizeRate() {
    if (this.selectedRate) {
      const modalRef = this.modalService.open(CustomizeMatterRateComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false
      });
      modalRef.componentInstance.rate = this.selectedRate;
      modalRef.result.then(() => {
      });
    }
  }

  /**
   * function to select rate table
   */
  selectedRateRow(event: any) {
    this.selectedRate = event;
    this.storeRateAndWork('rateTable', this.selectedRate);
  }

  public saveChanges(settings: vwCalendarSettings) {
    this.calendarSettings = {...settings};
    this.storeRateAndWork('workHour', this.calendarSettings);
  }

  /***
   * function to store rate table and work hours value
   */
  storeRateAndWork(type: string, data: any) {
    const tmp: any = UtilsHelper.getObject('employee_setting') ? UtilsHelper.getObject('employee_setting') : {};
    tmp[type] = data;
    UtilsHelper.setObject('employee_setting', tmp);
  }

  async finish() {
    this.formSubmitted = true;
    if (this.calendarSettings.timeZone === null) {
      this.scrollToFirstInvalidControl();
      return;
    }
    if (!this.jobFamilyBaseRate) {
      return;
    }
    if (!this.validateWorkingHours()) {
      return;
    }
    localStorage.setItem('save', 'true');
    const generalData = {...this.tempFormData.data};
    let fileData: any;
    if (generalData.profileImage) {
      fileData = this.readFileObject(generalData.profileImage);
    }
    delete generalData.initialConsultations;
    delete generalData.primaryPhoneNumber;
    delete generalData.cellPhoneNumber;
    delete generalData.fax;
    delete generalData.retainer;
    delete generalData.profileImage;
    const calendarSettings: any = {...this.calendarSettings};
    const d = new Date();
    const d1 = d.toISOString().split('T')[0];
    calendarSettings.mondayOpenHours = this.hour(calendarSettings.mondayOpenHours, d1).replace('+00:00', '');
    calendarSettings.mondayCloseHours = this.hour(calendarSettings.mondayCloseHours, d1).replace('+00:00', '');
    calendarSettings.tuesdayOpenHours = this.hour(calendarSettings.tuesdayOpenHours, d1).replace('+00:00', '');
    calendarSettings.tuesdayCloseHours = this.hour(calendarSettings.tuesdayCloseHours, d1).replace('+00:00', '');
    calendarSettings.wednesdayOpenHours = this.hour(calendarSettings.wednesdayOpenHours, d1).replace('+00:00', '');
    calendarSettings.wednesdayCloseHours = this.hour(calendarSettings.wednesdayCloseHours, d1).replace('+00:00', '');
    calendarSettings.thursdayOpenHours = this.hour(calendarSettings.thursdayOpenHours, d1).replace('+00:00', '');
    calendarSettings.thursdayCloseHours = this.hour(calendarSettings.thursdayCloseHours, d1).replace('+00:00', '');
    calendarSettings.fridayOpenHours = this.hour(calendarSettings.fridayOpenHours, d1).replace('+00:00', '');
    calendarSettings.fridayCloseHours = this.hour(calendarSettings.fridayCloseHours, d1).replace('+00:00', '');
    calendarSettings.saturdayOpenHours = this.hour(calendarSettings.saturdayOpenHours, d1).replace('+00:00', '');
    calendarSettings.saturdayCloseHours = this.hour(calendarSettings.saturdayCloseHours, d1).replace('+00:00', '');
    calendarSettings.sundayOpenHours = this.hour(calendarSettings.sundayOpenHours, d1).replace('+00:00', '');
    calendarSettings.sundayCloseHours = this.hour(calendarSettings.sundayCloseHours, d1).replace('+00:00', '');
    const body: any = {
      generalInfo: generalData,
      settings: calendarSettings
    };
    body.settings.rates = this.selectedRate;
    body.settings.baseRate = parseFloat(this.jobFamilyBaseRate);
    body.settings.isCustom = this.jobFamilyBaseRate !== this.jobFamilyDetail.baseRate;
    this.submitAction = true;
    try {
      this.loading = true;
      let resp: any = await this.employeeService.v1EmployeeFullPost$Json$Response({body}).toPromise();
      resp = JSON.parse(resp.body);
      this.rsndActEml(this.tempFormData.data.email);
      if (resp.results === 0) {
        this.submitAction = false;
        this.toastr.showError(this.errorData.email_exist);
        return;
      }
      this.toastr.showSuccess('Employee created.');
      this.loading = true;
      if (!fileData) {
        this.employeeCreated();
        return;
      }
      this.uploadFileToDB(resp.results, fileData, () => {
      });
    } catch (err) {
      this.submitAction = false;
      this.loading = true;
    }
    this.formSubmitted = false;
  }

  rsndActEml(email) {
  }

  private hour(hr: string, d) {
    if (hr) {
      if (hr == '00') {
        return d + 'T00:00:00+00:00Z';
      } else {
        return d + 'T' + hr + '+00:00Z';
      }
    } else {
      return null;
    }
  }

  /**
   * function to go back to first step
   */
  prev(): void {
    this.prevStep.emit({
      currentStep: 'settings',
      prevStep: 'generalinfo',
    });
  }

  /***
   * function to uplaod file
   */
  public uploadFileToDB(id, file, onSuccess: () => void) {
    const body = {
      file
    };
    this.personService
      .v1PersonPhotoPersonIdPost({
        personId: id,
        body: body as any
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        }),
        finalize(() => {
          this.employeeCreated();
          this.submitAction = false;
        })
      )
      .subscribe(
        () => {
          if (onSuccess) {
            onSuccess();
          }
        },
        error => {
          console.log(error);
        }
      );
  }

  /**
   * common function to execute when employee created
   */
  employeeCreated(): void {
    this.router.navigate(['/employee/list']);
    localStorage.removeItem('employee_profile');
    localStorage.removeItem('employee_general');
    localStorage.removeItem('employee_setting');
  }

  /**
   * function to read encoding file object
   */
  readFileObject(data: any): any {
    if (localStorage.getItem('employee_profile')) {
      const byteString = atob(localStorage.getItem('employee_profile').split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ia], {type: data.type});
      return new File([blob], data.name, {type: data.type});
    }
  }

  /**
   * Validate working hours
   */
  public validateWorkingHours() {
    const days = UtilsHelper.getDayslist();
    const isValid = days.every(day => {
      const open = this.calendarSettings[`${day.name.toLowerCase()}OpenHours`];
      const close = this.calendarSettings[`${day.name.toLowerCase()}CloseHours`];
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
      this.toastr.showError(this.errorData.validation_working_hours);
      return false;
    } else {
      return true;
    }
  }

}
