import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import * as errorData from 'src/app/modules/shared/error.json';
import { vwBillingSettings, vwRate } from 'src/common/swagger-providers/models';
import { BillingService, ClockService, EmployeeService, MatterService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { PreBillingModels } from '../../models/vw-prebilling';
import { IBillGeneratetionPeriod } from '../billing-settings-helper';
import { padNumber, UtilsHelper } from '../utils.helper';

@Component({
  selector: 'app-create-new-time-entry',
  templateUrl: './create-new-time-entry.component.html',
  styleUrls: ['./create-new-time-entry.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CreateNewTimeEntryComponent implements OnInit, OnDestroy {
  public isEdit = false;
  public timeKeeperLoading = true;
  public dateOfService = new FormControl(new Date(), [Validators.required]);
  public clientID = new FormControl('', [Validators.required]);
  public matterID = new FormControl('', [Validators.required]);
  public disbursementTypeID = new FormControl('', [Validators.required]);
  public timeWorked = new FormControl('', [Validators.required]);
  public rates = new FormControl(0, [Validators.required]);
  public description = new FormControl('', [
    Validators.required,
    Validators.maxLength(1000)
  ]);
  public visibleToClient = new FormControl(false);
  public note = new FormControl('', [Validators.required]);
  public timeEntryForm: FormGroup = this.builder.group({
    dateOfService: this.dateOfService,
    timeWorked: this.timeWorked,
    description: this.description,
    visibleToClient: this.visibleToClient,
    note: this.note
  });

  public searchclient: string;
  public searchMatter: string;
  public code: string;
  public rate = 0;
  public disbursementTypeDetail: any;
  public chargeCodes: Array<any> = [];
  public originalChargeCodes: Array<any> = [];
  public filterdisbursementTypeList: Array<any> = [];
  public attendanceList: Array<any> = [];
  public originalArr: Array<any> = [];
  public filterdisbursementTypeListPopUP: Array<any> = [];
  public errorData: any = (errorData as any).default;
  public timeWorkedModel: any;
  public billingSettings: vwBillingSettings;
  public hours: number;
  public minutes: number;
  public changeNote: string;
  public previousPrebillGenerated: string = null;
  public lastBillDate: string = null;
  public createdAt: string = null;
  public clientDetail: any = null;
  public matterDetail: any = null;
  public timekeeperDetail: any = null;
  public localClientMatterDetails: any;
  public timeEntryDetails: PreBillingModels.vwBillingLines;
  public currentDate = new Date();
  public dateReset = false;
  public preBillId: number;
  public clientListPopUp: Array<any> = [];
  public matterListPopUp: Array<any> = [];
  public isSearchLoading = false;
  public isMatterSearchLoading = false;
  public clientSubscribe: Subscription;
  public originalClientList: any[];
  public originalMatterList: any[];
  public matterSubscribe: Subscription;
  public total_hours = 0;
  public disable = false;
  public disabledClient = false;
  public disabledMatter = false;
  public billGenerationPeriod: IBillGeneratetionPeriod;
  public loading = false;
  loginUser: any;
  public formSubmitted = false;
  public clientError = false;
  public matterError = false;
  public chargeCodeError = false;
  public chargePrefix = '$';
  public incorrectMatter = false;
  public incorrectClient = false;
  public timekeeperDetailfilter: any = null;
  public incorrectTimekeeper: boolean;
  public disabledTimekeeper = false;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public searchEmployee: string;
  public isTimekeepingSearchLoading = false;
  public employeeList: Array<any> = [];
  public employeeListPopUp: Array<any> = [];
  private employeeSubscribe: Subscription;
  public baseRate: number;
  selectedChargeCode: any;
  public timeworkedInputPlaceholder;

  constructor(
    private activeModal: NgbActiveModal,
    private builder: FormBuilder,
    private billingService: BillingService,
    private toastDisplay: ToastDisplay,
    private clockService: ClockService,
    private changeDetectorRef: ChangeDetectorRef,
    private matterService: MatterService,
    private employeeService: EmployeeService,
    private store: Store<fromRoot.AppState>
  ) {
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.timeworkedInputPlaceholder = this.getTimeString(0,0);
    this.loginUser = UtilsHelper.getLoginUser();
    const data = {
      matter: this.searchMatter,
      client: this.searchclient
    };
    this.localClientMatterDetails = data;
    this.getChargeCode();
    this.getBillingSettings();
    if (this.isEdit && this.timeEntryDetails) {
      this.timeEntryForm.patchValue({
        dateOfService: this.timeEntryDetails.date,
        timeWorked:
          this.timeEntryDetails.hours.value.hours +
          ':' +
          this.timeEntryDetails.hours.value.minutes,
        description: this.timeEntryDetails.description,
        visibleToClient: this.timeEntryDetails.note.isVisibleToClient,
        note: this.timeEntryDetails.note.content
      });
      this.searchEmployee = this.timeEntryDetails['timeKeeper'] ? this.timeEntryDetails['timeKeeper'] : null;
      if (this.timeEntryDetails.hours.value.hours < 0 || this.timeEntryDetails.hours.value.minutes < 0) {
        this.total_hours = (Math.abs(this.timeEntryDetails.hours.value.hours) * 60 + Math.abs(this.timeEntryDetails.hours.value.minutes)) / 60;
        this.total_hours = this.total_hours * -1;
      } else {
        this.total_hours = (Math.abs(this.timeEntryDetails.hours.value.hours) * 60 + Math.abs(this.timeEntryDetails.hours.value.minutes)) / 60;
      }
      this.rate = this.timeEntryDetails['rate'] * this.total_hours;
    }
    this.disable = false;
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
        if (
          this.permissionList.TIMEKEEPING_SELFisEdit
        ) {
          this.loading = true;
          this.employeeService
            .v1EmployeeIdGet({
              id: this.loginUser.id
            })
            .pipe(
              map(res => {
                return JSON.parse(res as any).results as any;
              }),
              finalize(() => {
                this.loading = false;
                this.timeKeeperLoading = false;
              })
            )
            .subscribe(emp => {
              this.timekeeperDetail = emp;
              this.searchEmployee =
                this.timekeeperDetail.lastName +
                ', ' +
                this.timekeeperDetail.firstName;
              this.incorrectTimekeeper = false;
              this.getChargeCode();
            });
        } else {
          this.timeKeeperLoading = false;
        }
        this.disabledTimekeeper = !!(!this.permissionList.TIMEKEEPING_OTHERSisAdmin &&
          this.permissionList.TIMEKEEPING_SELFisEdit);
      }
    });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }
  get f() {
    return this.timeEntryForm.controls;
  }

  public getChargeCode(onSuccess = () => { }, type = null) {
    if (this.matterDetail && this.matterDetail.id) {
      this.getMatterLevelChargeCode(onSuccess, type);
      this.getUserBaseRate();
    } else {
      this.getTenantLevelChargeCode(onSuccess, type);
    }
  }

  private getTenantLevelChargeCode(onSuccess = () => { }, type) {
    if (this.loginUser) {
      this.loading = true;
      this.billingService
        .v1BillingRateTenantTenantIdGet({ tenantId: this.loginUser.tenantId })
        .subscribe(
          suc => {
            const res: any = suc;
            const list = JSON.parse(res).results;
            if (list && list.length > 0) {
              this.chargeCodes = list;
              if (this.matterDetail && this.matterDetail.id === 0) {
                this.chargeCodes = this.chargeCodes.filter(
                  a => a.billingTo && a.billingTo.code === 'OVERHEAD'
                );
              } else {
                this.chargeCodes = this.chargeCodes.filter(
                  a =>
                    a.billingTo &&
                    (a.billingTo.code === 'BOTH' ||
                      a.billingTo.code === 'CLIENT')
                );
              }

              if (this.isEdit) {
                this.chargeCodes = this.chargeCodes.filter(
                  a =>
                    a.status === 'Active' ||
                    a.id === this.timeEntryDetails.disbursementType.id
                );
              } else {
                this.chargeCodes = this.chargeCodes.filter(
                  a => a.status === 'Active'
                );
              }

              this.originalChargeCodes = [...this.chargeCodes];
              if (
                this.isEdit &&
                this.timeEntryDetails &&
                this.timeEntryDetails.disbursementType
              ) {
                const selectedChargeCode = this.chargeCodes.find(
                  item => item.code === this.timeEntryDetails.disbursementType.code
                );
                if (selectedChargeCode) {
                  this.selectChargeCode(selectedChargeCode);
                  this.modelChanged();
                }
              }
              this.loading = false;
            }
            onSuccess();
          },
          err => {
            this.loading = false;
          }
        );
    }
  }

  private getMatterLevelChargeCode(onSuccess = () => { }, type = null) {
    this.loading = true;
    this.billingService
      .v1BillingChargecodesMatterMatterIdGet({
        matterId: this.matterDetail.id
      })
      .subscribe(
        suc => {
          const res: any = suc;
          const list = JSON.parse(res).results;
          if (list && list.length > 0) {
            this.chargeCodes = list;
            this.chargeCodes = this.chargeCodes.filter(
              (a) =>
                a.billingTo &&
                (a.billingTo.code == 'BOTH' || a.billingTo.code == 'CLIENT')
            );
            this.chargeCodes.forEach(code => {
              code.number = Number(code.code);
            });
            this.chargeCodes = this.chargeCodes.sort(
              (a, b) => {
                return a.number - b.number;
              }
            );
            if (this.isEdit) {
              this.chargeCodes = this.chargeCodes.filter(
                a =>
                  a.status === 'Active' ||
                  a.id === this.timeEntryDetails.disbursementType.id
              );
            } else {
              this.chargeCodes = this.chargeCodes.filter(
                a => a.status === 'Active'
              );
            }
            this.originalChargeCodes = [...this.chargeCodes];
            if (
              this.isEdit &&
              this.timeEntryDetails &&
              this.timeEntryDetails.disbursementType
            ) {
              const selectedChargeCode = this.chargeCodes.find(
                item => item.code === this.timeEntryDetails.disbursementType.code
              );
              if (selectedChargeCode) {
                this.selectChargeCode(selectedChargeCode);
                this.modelChanged();
              }
            }
          }
          this.loading = false;
          onSuccess();
        },
        err => {
          this.loading = false;
        }
      );
  }

  private getBillingSettings() {
    const user = localStorage.getItem('profile')
      ? JSON.parse(localStorage.getItem('profile'))
      : null;
    if (user) {
      this.billingService
        .v1BillingSettingsTenantTenantIdGet({
          tenantId: user.tenantId
        })
        .pipe(
          map(res => {
            return JSON.parse(res as any).results[0] as vwBillingSettings;
          }),
          finalize(() => { })
        )
        .subscribe(billingSettings => {
          this.billingSettings = billingSettings || {};
        });
    }
  }

  public updateFilter(event?, type?) {
    this.rate = 0;
    let val: any = '';
    if (event) {
      val = event.target.value;
    }
    if (val !== '') {
      this.filterdisbursementTypeListPopUP = [];
      const temp = this.originalChargeCodes.filter(
        item =>
          this.matchName(item, val, 'code') ||
          this.matchName(item, val, 'description')
      );
      if (type === '1') {
        this.filterdisbursementTypeList = temp;
      } else {
        this.filterdisbursementTypeListPopUP = temp;
      }
    } else {
      this.filterdisbursementTypeList = [];
      this.filterdisbursementTypeListPopUP = [...this.originalChargeCodes];
      this.disbursementTypeDetail = null;
      this.attendanceList = this.originalArr;
      this.rate = 0;
      this.chargePrefix = '$';
      this.code = null;
    }
  }

  private matchName(item: any, searchValue: string, fieldName): boolean {
    const searchName = item[fieldName]
      ? item[fieldName].toString().toUpperCase()
      : '';
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  public selectChargeCode(item: vwRate) {
    this.selectedChargeCode = item;
    this.chargeCodeError = false;
    this.chargePrefix = this.baseRate < 0 ? '-$' : '$';
    this.code = item.code;
    this.disbursementTypeDetail = item;
    this.filterdisbursementTypeListPopUP = [];
    this.getUserBaseRate();
    if (this.matterDetail && this.matterDetail.isFixedFee) {
      this.rate = 0;
      this.chargePrefix = '$';
      if (
        this.disbursementTypeDetail &&
        (this.disbursementTypeDetail.billingTo.code === 'OVERHEAD' ||
          this.disbursementTypeDetail.type === 'FIXED_FEE' ||
          this.disbursementTypeDetail.type === 'FIXED_FEE_ADD_ON')
      ) {
        this.timeEntryForm.get('description').patchValue(null);
      }
    } else {
      if (item && item.billingType && item.billingType.code === 'HOURLY') {
        const timeWorked: string = this.timeEntryForm.controls.timeWorked.value;
        if (timeWorked && this.timeEntryForm.get('dateOfService').value && this.clientDetail) {
          this.rate = Math.abs(this.baseRate * +this.total_hours);
          this.chargePrefix = this.rate < 0 ? '-$' : '$';
        }
      }
    }

    if (item && item.billingTo && item.billingTo.code === 'OVERHEAD') {
      this.timeEntryForm.get('description').patchValue(null);
      this.timeEntryForm.get('visibleToClient').patchValue(false);
    }
  }

  getRate(item: vwRate) {
    if (item.isCustom) {
      return +item.customRateAmount;
    } else {
      return +item.rateAmount;
    }
  }

  modelChanged() {
    let hours = 0;
    let minutes = 0;
    let isError = false;
    const timeWorked = this.timeEntryForm.controls.timeWorked.value;
    isError = this.checkTime(timeWorked.replace(/\s/g, '').split(''));
    if (isError) {
      this.resetTimeWorked(timeWorked && timeWorked.length > 0);
    } else {
      if (timeWorked.includes(':')) {
        const hoursMinutes = timeWorked.split(/[.:]/);
        hours = hoursMinutes[0] ? parseInt(hoursMinutes[0], 10) : 0;
        minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
      } else if (timeWorked.includes('.') || !isNaN(timeWorked)) {
        let decimalTime = parseFloat(timeWorked);
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
        let parsed  = UtilsHelper.parseMinutes(minutes, hours);
        hours = parsed.hours;
        minutes = parsed.minutes;
        this.setTime(hours, minutes);
      }
    }
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

      this.timeEntryForm.patchValue({
        timeWorked: finalText
      });

      this.toastDisplay.showError('Value must be larger than 0');
    } else if (isNaN(hours) || isNaN(minutes)) {
      this.resetTimeWorked(false);
    } else {
      if (this.billingSettings && this.billingSettings.timeRoundingInterval) {
        if (minutes >= 0) {
          minutes =
            Math.ceil(minutes / this.billingSettings.timeRoundingInterval) *
            this.billingSettings.timeRoundingInterval;
        } else {
          minutes =
            Math.ceil(Math.abs(minutes) / this.billingSettings.timeRoundingInterval) *
            this.billingSettings.timeRoundingInterval;
          minutes = minutes * -1;
        }
      }

      if (minutes == 60) {
        hours = hours >= 0 ? hours + 1 : hours - 1;
        minutes = 0;
      }

      this.hours = hours;
      this.minutes = minutes;

      const finalText = this.getTimeString(hours, minutes);
      this.timeEntryForm.patchValue({
        timeWorked: finalText
      });

      if (this.hours < 0 || this.minutes < 0) {
        this.total_hours = (Math.abs(this.hours) * 60 + Math.abs(this.minutes)) / 60;
        this.total_hours = this.total_hours * -1;
      } else {
        this.total_hours = (Math.abs(this.hours) * 60 + Math.abs(this.minutes)) / 60;
      }

      if (this.matterDetail && this.matterDetail.isFixedFee) {
        this.rate = 0;
      } else {
        if (
          this.disbursementTypeDetail &&
          this.disbursementTypeDetail.billingType &&
          this.disbursementTypeDetail.billingType.code === 'HOURLY' &&
          this.timeEntryForm.get('dateOfService').value &&
          this.clientDetail
        ) {
          this.rate = Math.abs(this.baseRate * this.total_hours);
          this.changeDetectorRef.detectChanges();
          if (this.baseRate * +this.total_hours < 0) {
            this.chargePrefix = '-$';
          } else {
            this.chargePrefix = '$';
          }
        } else {
          if (this.timeEntryForm.get('dateOfService').value &&
            this.clientDetail) {
            this.rate = Math.abs(this.baseRate * this.total_hours);
            this.changeDetectorRef.detectChanges();
            if (this.baseRate * +this.total_hours < 0) {
              this.chargePrefix = '-$';
            } else {
              this.chargePrefix = '$';
            }
          }
        }

        if (
          this.disbursementTypeDetail &&
          this.disbursementTypeDetail.billingTo &&
          this.disbursementTypeDetail.billingTo.code === 'OVERHEAD'
        ) {
          this.timeEntryForm.get('description').patchValue(null);
          this.rate = 0;
          this.chargePrefix = '$';
        }
      }
    }
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

  private resetTimeWorked(showError = true) {
    if (this.disbursementTypeDetail) {
      this.rate = 0;
      this.chargePrefix = this.baseRate < 0 ? '-$' : '$';
    }

    // if (showError) {
    //   this.toastDisplay.showError('Value must be a number');
    // }

    this.timeEntryForm.patchValue({
      timeWorked: ''
    });
  }

  public enterTime(addAnother = false, timeworkedInput: any = null) {
    this.formSubmitted = true;
    if (this.isBillingNarratibeDisabled) {
      this.timeEntryForm.get('description').disable();
    } else {
      this.timeEntryForm.get('description').enable();
    }

    if (!this.clientDetail) {
      this.clientError = true;
    }

    if (!this.matterDetail) {
      this.matterError = true;
    }

    if (!this.disbursementTypeDetail) {
      this.chargeCodeError = true;
    }

    if (!this.timekeeperDetail) {
      this.incorrectTimekeeper = true;
    }

    if (
      !this.timeEntryForm.valid ||
      !this.clientDetail ||
      !this.matterDetail ||
      !this.timekeeperDetail ||
      !this.disbursementTypeDetail
    ) {
      return;
    }

    const data = { ...this.timeEntryForm.value };

    const profile = localStorage.getItem('profile');
    if (profile) {
      const person = JSON.parse(profile);
      const currDate = new Date();
      const item: any = {};
      item.dateOfService =
        moment(data.dateOfService).format(Constant.SharedConstant.DateFormat) +
        Constant.SharedConstant.TimeFormat;
      item.description = data.description;
      if (this.matterDetail.isFixedFee) {
        if (this.disbursementTypeDetail.type !== 'HOURY_CODE') {
          item.targetChargeCode = this.disbursementTypeDetail;
        } else {
          item.disbursementType = {
            id: this.disbursementTypeDetail.id,
            code: this.disbursementTypeDetail.code,
            billingTo: this.disbursementTypeDetail.billingTo
          };
        }
      } else {
        item.disbursementType = {
            id: this.disbursementTypeDetail.id,
            code: this.disbursementTypeDetail.code,
            billingTo: this.disbursementTypeDetail.billingTo
          };
      }
      item.hours = +this.hours;
      item.minutes = +this.minutes;

      if (this.hours === 24 && this.minutes === 0) {
        item.hours = 23;
        item.minutes = 59;
      }

      if (item.hours > 24 || (item.hours === 24 && item.minutes > 0)) {
        this.toastDisplay.showError(
          'You cannot enter more than 24 hours of time worked in a single day.'
        );
        return;
      }

      item.note = {
        isVisibleToClient:
          data.visibleToClient === null ? false : data.visibleToClient,
        content: data.note,
        applicableDate: currDate,
        name: 'enterTime'
      };
      item.person = { id: this.timekeeperDetail.id };
      const rate = this.chargePrefix.replace(/\$/g, '') + this.rate;
      item.rate = +rate;
      item.status = { id: 1 };
      item.targetClient = this.clientDetail;
      item.targetMatter = this.matterDetail;

      const clientName = item.targetClient.isCompany
        ? item.targetClient.companyName || item.targetClient.company
        : item.targetClient.lastName + ', ' + item.targetClient.firstName;
      const matterName =
        item.targetMatter.matterNumber +
        ' - ' +
        (item.targetMatter.matterName || '');
      const timekeeperName =
        this.timekeeperDetail.lastName + ', ' + this.timekeeperDetail.firstName;

      if (this.searchMatter.trim() !== matterName.trim() && this.isEdit) {
        this.incorrectMatter = true;
      }

      if (this.searchclient.trim() !== clientName.trim() && this.isEdit) {
        this.incorrectClient = true;
      }

      if (
        this.incorrectClient ||
        this.incorrectMatter ||
        this.incorrectTimekeeper
      ) {
        return;
      }

      if (this.searchEmployee.trim() !== timekeeperName.trim()) {
        this.incorrectTimekeeper = true;
      }

      if (this.preBillId) {
        item['preBillId'] = this.preBillId;
      }

      if (
        this.localClientMatterDetails &&
        (this.searchMatter != this.localClientMatterDetails.matter ||
          this.searchclient != this.localClientMatterDetails.client) &&
        this.isEdit
      ) {
        item.status = { id: 1 };
        item.preBillId = null;
      }

      let observable;
      if (this.isEdit && this.timeEntryDetails) {
        item['id'] = this.timeEntryDetails.id;
        observable = this.clockService.v1ClockPut$Json({ body: item });
      } else {
        observable = this.clockService.v1ClockPost$Json({ body: item });
      }

      this.loading = true;
      this.disable = true;

      observable.subscribe(
        suc => {
          const res: any = suc;
          const list = JSON.parse(res).results;
          if (list) {
            this.reset(addAnother, timeworkedInput);
            if (!addAnother) {
              this.close('add');
            } else {
              this.timeEntryForm.get('description').enable();
            }
            this.disable = false;
            if(this.isEdit){
              this.toastDisplay.showSuccess(
                errorData.time_entry_updated_successfully
              );
            }else {
              this.toastDisplay.showSuccess(
                errorData.time_entry_saved_successfully
              );
            }
          }
          this.loading = false;
        },
        err => {
          this.disable = false;
          this.loading = false;
        }
      );
    }
  }

  public isDisable() {
    if (
      !this.timeEntryForm.valid ||
      this.clientDetail === null ||
      this.matterDetail === null ||
      this.timekeeperDetail === null ||
      this.disbursementTypeDetail === null
    ) {
      return true;
    }
    return false;
  }

  public isItToday(date) {
    if (date) {
      return new Date(date).toDateString() === this.currentDate.toDateString();
    }
    return false;
  }

  public reset(addAnother = false, timeworkedInput: any =  null) {
    if (addAnother) {
      this.selectChargeCode(this.selectedChargeCode);
      this.timeEntryForm.patchValue({
        note: '',
        description: '',
        timeWorked: ''
      });

      if (timeworkedInput) {
        timeworkedInput.focus();
      }
    } else {
      this.timeEntryForm.reset();
      this.dateReset = true;
      this.searchclient = '';
      this.searchMatter = '';
      this.selectedChargeCode = null;
      this.code = '';
      this.matterDetail = null;
      this.clientDetail = null;
      this.searchEmployee = '';
      this.disbursementTypeDetail = null;
    }

    setTimeout(() => {
      this.dateReset = false;
    }, 50);

    this.rate = 0;
    this.chargePrefix = '$';
    this.formSubmitted = false;
    this.disable = false;
    this.incorrectClient = false;
    this.incorrectMatter = false;
    this.incorrectTimekeeper = false;
  }

  close(res) {
    this.activeModal.close(res);
  }

  /**
   * Clears charge code on outside click
   */
  public clearChargeCode() {
    this.filterdisbursementTypeListPopUP = [];
  }

  /**
   * Function to copy Billing Narative to Notes
   */
  public copytoNote() {
    if (!this.timeEntryForm.controls['note'].value || (this.timeEntryForm.controls['note'].value && this.timeEntryForm.controls['note'].value.trim() == '')) {
      this.timeEntryForm.controls['note'].patchValue(
        this.timeEntryForm.controls['description'].value
      );
    }
  }

  get isBillingNarratibeDisabled() {
    return (
      (this.clientDetail && this.clientDetail.role === 'Potential Client') ||
      (this.disbursementTypeDetail &&
        (this.disbursementTypeDetail.billingTo.code === 'OVERHEAD' ||
          this.disbursementTypeDetail.type === 'FIXED_FEE' ||
          this.disbursementTypeDetail.type === 'FIXED_FEE_ADD_ON'))
    );
  }

  get isMatterCleared() {
    if (!this.matterDetail && this.code) {
      this.code = null;
    }
    return !this.matterDetail;
  }

  private addoverhead(type: string, value: string, arr) {
    const v = value ? value.toLowerCase() : '';
    if (type === 'client') {
      if ('overhead'.match(v)) {
        return arr.push({ id: 0, lastName: 'Overhead' });
      }
    } else {
      if ('overhead'.match(v)) {
        return arr.push({ id: 0, matterName: 'Overhead' });
      }
    }
  }

  public updateClientFilter(event, type) {
    if (
      event.code === 'ArrowDown' ||
      event.code === 'ArrowUp' ||
      event.code === 'ArrowRight' ||
      event.code === 'ArrowLeft'
    ) {
      return;
    }
    let val = event.target.value;
    val = val || '';
    val = val.trim();

    if (val !== '') {
      if (this.clientSubscribe) {
        this.clientSubscribe.unsubscribe();
      }
      this.isSearchLoading = true;
      this.clientSubscribe = this.clockService
        .v1ClockClientsSearchGet({ search: val })
        .subscribe(
          suc => {
            const res: any = suc;
            const list = JSON.parse(res).results;
            this.originalClientList = list;
            this.addoverhead('client', val, list);
            if (list && list.length > 0) {
              list.map(obj => {
                obj.preferredPhone = obj.preferredPhone
                  ? '(' +
                  obj.preferredPhone.substr(0, 3) +
                  ') ' +
                  obj.preferredPhone.substr(3, 3) +
                  '-' +
                  obj.preferredPhone.substr(6, 4)
                  : '-';
              });
            }
            if (list.length) {
              this.clientListPopUp = list;
            }
            this.isSearchLoading = false;
          },
          err => {
            this.isSearchLoading = false;
          }
        );
    } else {
      this.clientDetail = null;
      this.clientListPopUp = [];
      this.isSearchLoading = false;
    }
  }

  public updateMatterFilter(event, type) {
    if (
      event.code === 'ArrowDown' ||
      event.code === 'ArrowUp' ||
      event.code === 'ArrowRight' ||
      event.code === 'ArrowLeft' ||
      this.searchMatter === 'Overhead'
    ) {
      return;
    }
    let val =  (this.searchMatter) ? this.searchMatter.trim() : '';

    if (val && val.length > 2) {
      if (this.matterSubscribe) {
        this.matterSubscribe.unsubscribe();
      }
      let param = {};
      if (this.clientDetail !== null && type === '2') {
        param = { search: val, clientId: +this.clientDetail.id };
      } else {
        param = { search: val };
      }
      this.isMatterSearchLoading = true;
      this.matterSubscribe = this.clockService
        .v1ClockMattersSearchGet(param)
        .subscribe(
          suc => {
            const res: any = suc;
            const list = JSON.parse(res).results;
            const newList = [];
            list.forEach(matter => {
              const matterName = (matter.matterName || '').trim();
              matter.matterName = matterName;
              newList.push(matter);
            });
            const sortedList = newList.sort((a, b) =>
              a.matterName.localeCompare(b.matterName)
            );
            this.originalMatterList = sortedList;
            this.addoverhead('matter', val, list);
            this.matterListPopUp = list;
            this.isMatterSearchLoading = false;
          },
          err => {
            this.isMatterSearchLoading = false;
          }
        );
    } else {
      this.matterDetail = null;
      this.matterListPopUp = [];
      this.isMatterSearchLoading = false;
    }
  }

  clearDropDown(actionOn: string) {
    switch (actionOn) {
      case 'clientListPopUp': {
        this.clientListPopUp = [];
        break;
      }

      case 'matterListPopUp': {
        this.matterListPopUp = [];
        break;
      }
      case 'employeeListPopUp': {
        this.employeeListPopUp = [];
        break;
      }
    }
  }

  public actionDropDown(event?, type?: string) {
    if (this.loading) {
      return;
    }
    if (this.clientListPopUp.length) {
      this.selectClient(this.clientListPopUp[0]);
      this.clientListPopUp = [];
      this.clientSubscribe.unsubscribe();
    }
    if (this.matterListPopUp.length) {
      this.selectMatter(this.matterListPopUp[0]);
      this.matterListPopUp = [];
      if (this.matterSubscribe != null) {
        this.matterSubscribe.unsubscribe();
      }
    }
    if (this.employeeListPopUp.length) {
      this.selectTimekeeper(this.employeeListPopUp[0]);
      this.employeeListPopUp = [];
      if (this.employeeSubscribe != null) {
        this.employeeSubscribe.unsubscribe();
      }
    }
    if (event) {
      if (event.x && event.y) {
        this.timeEntryForm
          .get('visibleToClient')
          .patchValue(!this.timeEntryForm.get('visibleToClient').value);
        event.y.focus();
      } else {
        event.focus();
        if (type === 'code') {
          this.code = ' ';
        }
      }
    }
  }

  public selectClient(item, isMatterPresent = false) {
    this.clientError = false;
    this.matterListPopUp = [];
    this.filterdisbursementTypeListPopUP = [];
    this.searchclient = item.isCompany
      ? item.companyName || item.company
      : !item.firstName
        ? item.lastName
        : item.lastName + ', ' + item.firstName;
    this.clientDetail = item;
    this.clientListPopUp = [];
    this.searchMatter = null;
    this.matterDetail = null;
    this.incorrectClient = false;
    this.incorrectMatter = false;

    if (item.id === 0) {
      this.disabledMatter = true;
      this.rate = 0;
      this.chargePrefix = '$';
      this.code = null;
      this.disbursementTypeDetail = null;
      this.timeEntryForm.get('visibleToClient').patchValue(false);
      this.selectMatter({ id: 0, matterName: 'Overhead' }, 'overhead');
    } else {
      if (!isMatterPresent) {
        this.disabledMatter = false;
        this.matterBasedOnClients({ clientId: item.id });
      }
    }
  }

  public selectMatter(item, type?) {
    this.matterError = false;
    this.matterListPopUp = [];
    this.filterdisbursementTypeListPopUP = [];
    if (item['client'] != null) {
      this.searchclient = item['client'].isCompany
        ? item['client'].companyName
        : item['client'].lastName + ', ' + item['client'].firstName;
      this.clientDetail = item['client'];
      this.incorrectClient = false;
    }
    this.searchMatter =
      item.id === 0
        ? item.matterName
        : item.matterNumber + ' - ' + (item.matterName || '');
    this.matterDetail = item;
    this.matterListPopUp = [];
    if (item.id === 0) {
      this.disabledMatter = true;
      this.rate = 0;
      this.chargePrefix = '$';
      this.code = ' ';
      this.disbursementTypeDetail = null;
      this.searchclient = 'Overhead';
      this.clientDetail = { id: 0, lastName: 'Overhead' };
      this.incorrectClient = false;
    } else {
      this.disabledMatter = false;
    }
    this.getChargeCode(() => { }, type);

    if (type == ' ') {
      const temp = this.originalChargeCodes.filter(
        item =>
          this.matchName(item, type, 'code') ||
          this.matchName(item, type, 'description')
      );
      this.filterdisbursementTypeListPopUP = [...temp];
      this.code = ' ';
    }
  }

  public async matterBasedOnClients(clientId: any) {
    let resp: any;
    try {
      resp = await this.matterService
        .v1MatterClientClientIdGet(clientId)
        .toPromise();
      if (resp != null) {
        let response = [...(JSON.parse(resp).results as Array<any>)];

        response = response || [];
        response = response.filter(a => a.status && a.status.name == 'Open');

        this.matterListPopUp  = [...response];
        this.originalMatterList = [...this.matterListPopUp];
        this.loading = false;
      }
    } catch (error) {
      this.loading = false;
    }
  }

  setClientList() {
    this.clientListPopUp = this.originalClientList;
  }

  setMatterList() {
    this.matterListPopUp = this.originalMatterList;
  }

  // *** Get Employees/Timekeepers */
  setEmployeeList() {
    this.employeeListPopUp = this.employeeList;
  }

  public updateTimekeeperFilter(event, type) {
    this.rate = 0;
    if (
      event.code === 'ArrowDown' ||
      event.code === 'ArrowUp' ||
      event.code === 'ArrowRight' ||
      event.code === 'ArrowLeft'
    ) {
      return;
    }
    let val = event.target.value;
    val = val || '';
    val = val.trim();

    if (val !== '') {
      if (this.employeeSubscribe) {
        this.employeeSubscribe.unsubscribe();
      }

      let param = {};
      param = { search: val };

      this.isTimekeepingSearchLoading = true;
      this.employeeSubscribe = this.employeeService
        .v1EmployeeTimekeepersearchGet(param)
        .subscribe(
          (res: any) => {
            const response = JSON.parse(res);
            this.employeeList = response.results;
            if (this.employeeList && this.employeeList.length > 0) {
              this.employeeList.forEach(employee => {
                if (employee.phones) {
                  employee.phones.forEach(phone => {
                    if (phone.isPrimary) {
                      employee.preferredPhone = phone.number;
                    }
                  });
                }
              });
              this.employeeList.map(obj => {
                obj.preferredPhone = obj.preferredPhone
                  ? '(' +
                  obj.preferredPhone.substr(0, 3) +
                  ') ' +
                  obj.preferredPhone.substr(3, 3) +
                  '-' +
                  obj.preferredPhone.substr(6, 4)
                  : '-';
              });
            }
            if (!this.permissionList.TIMEKEEPING_SELFisEdit) {
              this.employeeList = this.employeeList.filter(
                ({ id }) => id !== this.loginUser.id
              );
            }
            this.employeeListPopUp = this.employeeList;
            this.isTimekeepingSearchLoading = false;
          },
          err => {
            console.log(err);
            this.isTimekeepingSearchLoading = false;
          }
        );
    } else {
      this.employeeList = [];
      this.employeeListPopUp = [];
      this.timekeeperDetail = null;
      this.timekeeperDetailfilter = null;
      this.isTimekeepingSearchLoading = false;
    }
  }

  public selectTimekeeper(item) {
    this.searchEmployee = item.lastName + ', ' + item.firstName;
    this.timekeeperDetail = item;
    this.employeeListPopUp = [];
    this.incorrectTimekeeper = false;
    this.getUserBaseRate();
  }

  async getUserBaseRate() {
    if (this.matterDetail && this.matterDetail.id && ((this.timekeeperDetail && this.timekeeperDetail.id) || (this.timeEntryDetails && this.timeEntryDetails.id))) {
      const data = {
        matterId: this.matterDetail.id,
        loggedInPersonId: this.timekeeperDetail ? this.timekeeperDetail.id : this.timeEntryDetails.person ? this.timeEntryDetails.person.id : this.loginUser.id
      };
      this.loading = true;
      const res = await this.clockService.v1ClockMatterBaserateGet(data)
        .toPromise();
      if (res != null) {
        const rateData = +JSON.parse(res as any).results;
        this.baseRate = this.isEdit && rateData === 0 && this.timeEntryDetails.disbursementType ? this.timeEntryDetails.disbursementType.rate : rateData;
        this.checkDate();
        this.loading = false;
      } else {
        this.loading = false;
      }
    } else {
      this.baseRate = 0;
      this.checkDate();
    }
  }

  checkDate() {
    if (!this.timeEntryForm.get('dateOfService').value || !this.timeEntryForm.get('timeWorked').value || !this.clientDetail) {
      this.rate = 0;
      this.chargePrefix = '$';
    } else {
      this.rate = Math.abs(this.baseRate * this.total_hours);
      this.changeDetectorRef.detectChanges();
      if (this.baseRate * +this.total_hours < 0) {
        this.chargePrefix = '-$';
      } else {
        this.chargePrefix = '$';
      }
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
  checkNumber(event){
    return UtilsHelper.checkNumber(event);
  }
}
