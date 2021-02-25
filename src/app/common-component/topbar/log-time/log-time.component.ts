import { ChangeDetectorRef, Component, ElementRef, EventEmitter, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { ErrorJsonObject } from 'src/app/modules/models/error.model';
import { vwMyTimesheetModel } from 'src/app/modules/models/timesheet.model';
import * as Constant from 'src/app/modules/shared/const';
import * as errorData from 'src/app/modules/shared/error.json';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { padNumber, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwBillingSettings, vwRate } from 'src/common/swagger-providers/models';
import { BillingService, ClockService, EmployeeService, MatterService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';

@Component({
  selector: 'app-log-time',
  templateUrl: './log-time.component.html',
  styleUrls: ['./log-time.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class LogTimeComponent implements OnInit, OnDestroy {
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;

  public arr: any = [-1, -2];
  public clientList: Array<any> = [];
  public matterList: Array<any> = [];
  public employeeList: Array<any> = [];
  public clientListPopUp: Array<any> = [];
  public matterListPopUp: Array<any> = [];
  public employeeListPopUp: Array<any> = [];
  public disbursementTypeList: Array<any> = [];
  public originalChargeCodes: Array<any> = [];
  public filterdisbursementTypeList: Array<any> = [];
  public attendanceList: Array<any> = [];
  public originalArr: Array<any> = [];
  public filterdisbursementTypeListPopUP: Array<any> = [];

  public dateOfService = new FormControl(new Date(), [Validators.required]);
  public timeWorked = new FormControl('', [Validators.required]);
  public rates = new FormControl(0, [Validators.required]);
  public description = new FormControl('', [
    Validators.required,
    Validators.maxLength(1000)
  ]);
  public visibleToClient = new FormControl(false);
  public note = new FormControl('', [Validators.required]);
  public rate = 0;
  public code: string;
  public clientDetail: any = null;
  public matterDetail: any = null;
  public timekeeperDetail: any = null;
  public disbursementTypeDetail: any = null;
  public searchclient: string;
  public searchMatter: string;
  public searchEmployee: string;
  public currentDate = new Date();
  public isEdit = false;
  public changeNote = '';
  public id = 0;

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public matterDetailfilter: any = null;

  private clientSubscribe: Subscription;
  private matterSubscribe: Subscription;
  private employeeSubscribe: Subscription;
  public statusArr: Array<{ name: string }> = [
    { name: 'Approved' },
    { name: 'Recorded' },
    { name: 'Pending Approval' },
    { name: 'Needs Further Review' },
    { name: 'Deferred' },
    { name: 'Final' }
  ];
  public billableArr: Array<{ name: string; value: boolean }> = [
    { name: 'Billable', value: true },
    { name: 'Non Billable', value: false }
  ];
  public timeEntryForm: FormGroup;
  public clientDetailfilter: any = null;
  public timekeeperDetailfilter: any = null;
  public errorData: ErrorJsonObject = (errorData as any).default;
  public billingSettings: vwBillingSettings;
  public hours: number;
  public minutes: number;
  public dateReset = false;
  public loginUser: any;
  public matterId: any;
  public total_hours = 0;

  public loading = true;
  public matterIds: Array<number> = [];
  public disable = false;
  public disabledMatter = false;
  public timeString = {hour: 0, min: 0};

  @ViewChild('chargeCode', { static: false }) chargecode: ElementRef;
  incorrectDisbursementType: boolean;
  incorrectClient: boolean;
  incorrectMatter: boolean;
  public isSearchLoading = false;
  public isSearchLoadingMatterOverHead = false;
  public isTimekeepingSearchLoading = false;
  public chargePrefix = '$';
  public incorrectTimekeeper: boolean;
  public disabledTimekeeper = false;
  public baseRate = 0;
  formSubmitted: boolean = false;
  clientError: boolean = false;
  matterError: boolean = false;
  chargeCodeError: boolean = false;
  valueMustError: boolean = false;

  constructor(
    private clockService: ClockService,
    private builder: FormBuilder,
    private billingService: BillingService,
    private store: Store<fromRoot.AppState>,
    private toastDisplay: ToastDisplay,
    private activeModal: NgbActiveModal,
    private sharedService: SharedService,
    private matterService: MatterService,
    private changeDetectorRef: ChangeDetectorRef,
    private employeeService: EmployeeService
  ) {
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.disable = false;
    this.loginUser = UtilsHelper.getLoginUser();
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
              })
            )
            .subscribe(emp => {
              this.timekeeperDetail = emp;
              this.searchEmployee =
                this.timekeeperDetail.lastName +
                ', ' +
                this.timekeeperDetail.firstName;
              this.incorrectTimekeeper = false;
              this.loading = false;
              this.getChargeCode();
            });
        } else {
          this.getChargeCode();
        }

        if (!this.permissionList.TIMEKEEPING_OTHERSisAdmin &&
          this.permissionList.TIMEKEEPING_SELFisEdit) {
          this.disabledTimekeeper = true;
        } else {
          this.disabledTimekeeper = false;
        }
      }
    });
    this.addConfigs();
    this.getBillingSettings();
    this.timeEntryForm = this.builder.group({
      dateOfService: this.dateOfService,
      timeWorked: this.timeWorked,
      description: this.description,
      visibleToClient: this.visibleToClient,
      note: this.note
    });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  private getBillingSettings() {
    if (this.loginUser) {
      this.billingService
        .v1BillingSettingsTenantTenantIdGet({
          tenantId: this.loginUser.tenantId
        })
        .pipe(
          map(res => {
            return JSON.parse(res as any).results[0] as vwBillingSettings;
          }),
          finalize(() => { })
        )
        .subscribe(
          billingSettings => {
            this.billingSettings = billingSettings || {};
          },
          () => { }
        );
    }
  }

  public getChargeCode(onSuccess = () => { }, type = null) {
    if (this.matterDetail && this.matterDetail.id) {
      this.getMatterLevelChargeCode(onSuccess, type);
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
              this.disbursementTypeList = list;
              if (this.matterDetail && this.matterDetail.id === 0) {
                this.disbursementTypeList = this.disbursementTypeList.filter(
                  a => a.billingTo && a.billingTo.code == 'OVERHEAD'
                );
              } else {
                this.disbursementTypeList = this.disbursementTypeList.filter(
                  a =>
                    a.billingTo &&
                    (a.billingTo.code == 'BOTH' ||
                      a.billingTo.code == 'CLIENT')
                );
              }
              this.disbursementTypeList = this.disbursementTypeList.filter(
                a => a.status == 'Active'
              );
              this.originalChargeCodes = [...this.disbursementTypeList];
              if (this.matterDetail && this.matterDetail.id === 0) {
                this.filterdisbursementTypeListPopUP = [
                  ...this.disbursementTypeList
                ];
              }
            }
            onSuccess();
            this.loading = false;
          },
          err => {
            this.loading = false;
            console.log(err);
          }
        );
    }
  }

  private getMatterLevelChargeCode(onSuccess = () => { }, type) {
    this.loading = true;
    this.filterdisbursementTypeListPopUP = [];
    this.filterdisbursementTypeList = [];
    this.billingService
      .v1BillingChargecodesMatterMatterIdGet({
        matterId: this.matterDetail.id
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        suc => {
          const res: any = suc;
          const list = JSON.parse(res).results;
          if (list && list.length > 0) {
            this.disbursementTypeList = list;
            this.disbursementTypeList = this.disbursementTypeList.filter(
              (a) =>
                a.billingTo &&
                (a.billingTo.code == 'BOTH' || a.billingTo.code == 'CLIENT')
            );
            this.disbursementTypeList.forEach(code => {
              code.number = Number(code.code);
            })
            this.disbursementTypeList = this.disbursementTypeList.sort(
              (a, b) => {
                return a.number - b.number;
              }
            );
            this.disbursementTypeList = this.disbursementTypeList.filter(
              a => a.status == 'Active'
            );
            this.originalChargeCodes = [...this.disbursementTypeList];
            if (type === ' ') {
              this.filterdisbursementTypeListPopUP = [
                ...this.disbursementTypeList
              ];
            }
          }
          onSuccess();
        },
        err => {
          this.loading = false;
          console.log(err);
        }
      );
    ;
  }

  public updateFilter(event, type) {
    this.rate = 0;
    let val = event.target.value;
    if (val !== '') {
      val = (val || '').trim();
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
      this.filterdisbursementTypeListPopUP = this.originalChargeCodes;
      this.disbursementTypeDetail = null;
      this.attendanceList = this.originalArr;
      this.rate = 0;
      this.chargePrefix = '$';
    }
  }

  public updateClientFilter(event, type) {
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

    if (val && (val !== '') && (val.length > 2)) {
      if (this.clientSubscribe) {
        this.clientSubscribe.unsubscribe();
      }
      this.isSearchLoading = true;
      this.clientSubscribe = this.clockService
        .v1ClockClientsSearchusingindexGet({ search: val })
        .subscribe(
          suc => {
            const res: any = suc;
            this.clientList = JSON.parse(res).results;
            if (this.clientList && this.clientList.length > 0) {
              this.clientList.map(obj => {
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
            this.addoverhead('client', val, this.clientList);
            this.clientListPopUp = _.orderBy(this.clientList, ['lastName', 'firstName'], ['asc']);
            this.isSearchLoading = false;
          },
          err => {
            console.log(err);
            this.isSearchLoading = false;
          }
        );
    } else {
      this.clientList = [];
      this.clientListPopUp = [];
      this.clientDetail = null;
      this.clientDetailfilter = null;
      this.filterList();
      this.isSearchLoading = false;
    }
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
      if (this.clientDetailfilter !== null && type === '1') {
        param = { search: val, clientId: +this.clientDetailfilter.id };
      } else if (this.clientDetail !== null && type === '2') {
        param = { search: val, clientId: +this.clientDetail.id };
      } else {
        param = { search: val };
      }
      this.isSearchLoadingMatterOverHead = true;
      this.matterSubscribe = this.clockService
        .v1ClockMattersSearchGet(param)
        .subscribe(
          suc => {
            const res: any = suc;
            const list = JSON.parse(res).results;
            const newList = [];
            list.forEach(matter => {
              matter.matterName = (matter.matterName) ? matter.matterName.trim() : '';
              newList.push(matter);
            });
            const sortedList = newList.sort((a, b) =>
              a.matterName.localeCompare(b.matterName)
            );
            this.matterList = sortedList;
            this.addoverhead('matter', val, sortedList);
            this.matterListPopUp = sortedList;
            this.isSearchLoadingMatterOverHead = false;
          },
          err => {
            console.log(err);
            this.isSearchLoadingMatterOverHead = false;
          }
        );
    } else {
      this.matterList = [];
      this.matterListPopUp = [];
      this.matterDetail = null;
      this.matterDetailfilter = null;
      this.filterList();
    }
  }

  private matchName(item: any, searchValue: string, fieldName): boolean {
    const searchName = item[fieldName]
      ? item[fieldName].toString().toUpperCase()
      : '';
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  public addConfigs() {
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.opts = {
      position: 'right',
      barBackground: '#413a93',
      barOpacity: '1',
      barWidth: '4',
      barBorderRadius: '4',
      barMargin: '2px',
      gridOpacity: '1',
      gridBackground: '#e7edf3',
      gridWidth: '8',
      gridMargin: '0',
      gridBorderRadius: '4',
      alwaysVisible: false
    };
  }

  public selectClient(item) {
    this.clientError = false;
    this.matterListPopUp = [];
    this.filterdisbursementTypeListPopUP = [];
    this.searchclient = item.isCompany
      ? item.companyName
      : item.lastName + ', ' + item.firstName;
    this.clientDetail = item;
    this.clientListPopUp = [];
    this.searchMatter = null;
    this.matterDetail = null;
    this.incorrectClient = false;
    this.incorrectMatter = false;
    this.loading = true;
    if (item.id === 0) {
      this.disabledMatter = true;
      this.rate = 0;
      this.chargePrefix = '$';
      this.code = null;
      this.disbursementTypeDetail = null;
      this.incorrectDisbursementType = false;
      this.timeEntryForm.get('visibleToClient').patchValue(false);
      this.selectMatter({ id: 0, matterName: 'Overhead' }, 'overhead');
    } else {
      this.disabledMatter = false;
      this.matterBasedOnClients({ clientId: item.id });
    }
  }

  public selectMatter(item, type?) {
    this.matterError = false;
    this.searchMatter = item.matterName + ' (' + item.matterNumber + ')';
    this.incorrectMatter = false;
    this.matterListPopUp = [];
    this.filterdisbursementTypeListPopUP = [];
    if (item.client != null) {
      this.searchclient = item.client.isCompany
        ? item.client.companyName
        : item.client.lastName + ', ' + item.client.firstName;
      this.clientDetail = item.client;
      this.incorrectClient = false;
    }
    this.searchMatter =
      item.id === 0
        ? item.matterName
        : item.matterName + ' - ' + item.matterNumber;
    this.matterDetail = item;
    this.getUserBaseRate();
    this.matterListPopUp = [];
    if (item.id === 0) {
      this.disabledMatter = true;
      this.rate = 0;
      this.chargePrefix = '$';
      this.code = ' ';
      this.disbursementTypeDetail = null;
      this.searchclient = 'Overhead';
      this.incorrectClient = false;
      this.incorrectDisbursementType = false;
      this.clientDetail = { id: 0, lastName: 'Overhead' };
    } else if (type == 'oneMatter') {
      this.incorrectMatter = false;
      this.disabledMatter = true;
      this.code = ' ';
    } else {
      this.disabledMatter = false;
    }
    this.getChargeCode(() => { }, type);

    if (type == ' ' || type == 'oneMatter') {
      type = ' ';
      const temp = this.originalChargeCodes.filter(
        item =>
          this.matchName(item, type, 'code') ||
          this.matchName(item, type, 'description')
      );
      this.filterdisbursementTypeListPopUP = [...temp];
      this.code = ' ';
      this.incorrectDisbursementType = false;
    }
  }

  public selectChargeCode(item: vwRate) {
    this.chargeCodeError = false;
    this.clientListPopUp = [];
    this.matterListPopUp = [];
    this.chargePrefix = this.baseRate < 0 ? '-$' : '$';
    this.code = item.code;
    this.incorrectDisbursementType = false;
    this.disbursementTypeDetail = item;
    this.filterdisbursementTypeListPopUP = [];
    if (
      this.disbursementTypeDetail &&
      this.disbursementTypeDetail.billingTo.code == 'OVERHEAD'
    ) {
      this.timeEntryForm.get('visibleToClient').patchValue(false);
    }
    this.getUserBaseRate();
    if (this.matterDetail.isFixedFee) {
      this.rate = 0;
      this.chargePrefix = '$';
      if (
        this.disbursementTypeDetail &&
        (this.disbursementTypeDetail.billingTo.code == 'OVERHEAD' ||
          this.disbursementTypeDetail.type == 'FIXED_FEE' ||
          this.disbursementTypeDetail.type == 'FIXED_FEE_ADD_ON')
      ) {
        this.timeEntryForm.get('description').patchValue(null);
      }
    } else {
      if (item && item.billingType && item.billingType.code === 'HOURLY') {
        const timeWorked: string = this.timeEntryForm.controls.timeWorked.value;
        if (timeWorked && this.timeEntryForm.get('dateOfService').value && this.clientDetail) {
          if (this.baseRate < 0) {
            this.rate = Math.abs(this.baseRate * +this.total_hours);
            this.chargePrefix = '-$';
          } else {
            this.rate = Math.abs(this.baseRate * +this.total_hours);
            this.chargePrefix = '$';
          }
        }
      }

      if (item && item.billingTo && item.billingTo.code === 'OVERHEAD') {
        this.timeEntryForm.get('description').patchValue(null);
        this.rate = 0;
        this.chargePrefix = '$';
      }
    }
  }

  get f() {
    return this.timeEntryForm.controls;
  }

  public enterTime(addAnother = false, timeWorkedInput: HTMLInputElement = null) {
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
      !this.disbursementTypeDetail ||
      !this.timekeeperDetail ||
      this.valueMustError
    ) {
      return;
    }
    if (this.loginUser) {
      if (!this.clientDetail || !this.matterDetail) {
        return;
      }

      const data = { ...this.timeEntryForm.value };
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
        ? item.targetClient.companyName
        : item.targetClient.lastName == 'Overhead' ? item.targetClient.lastName : item.targetClient.lastName + ', ' + item.targetClient.firstName;
      const matterName = item.targetMatter.matterName == 'Overhead' ? item.targetMatter.matterName :
        item.targetMatter.matterName + ' - ' + item.targetMatter.matterNumber;
      const timekeeperName =
        this.timekeeperDetail.lastName + ', ' + this.timekeeperDetail.firstName;

      if (item.disbursementType) {
        if (this.code !== item.disbursementType.code) {
          this.incorrectDisbursementType = true;
        } else {
          this.incorrectDisbursementType = false;
        }
      } else if (item.targetChargeCode) {
        if (this.code !== item.targetChargeCode.code) {
          this.incorrectDisbursementType = true;
        } else {
          this.incorrectDisbursementType = false;
        }
      }

      if (this.searchMatter.trim() !== matterName.trim()) {
        this.incorrectMatter = true;
      }

      if (this.searchclient.trim() !== clientName.trim()) {
        this.incorrectClient = true;
      }

      if (this.searchEmployee.trim() !== timekeeperName.trim()) {
        this.incorrectTimekeeper = true;
      }

      if (
        this.incorrectClient ||
        this.incorrectMatter ||
        this.incorrectTimekeeper ||
        this.incorrectDisbursementType
      ) {
        return;
      }

      this.loading = true;
      this.disable = true;
      if (
        item.disbursementType &&
        item.disbursementType.billingTo &&
        item.disbursementType.billingTo.code === 'OVERHEAD'
      ) {
        item.isOverhead = true;
      }

      if (item.targetChargeCode) {
        item.targetChargeCode.isCustom = item.targetChargeCode.isCustom || false;
      }

      this.clockService.v1ClockPost$Json({ body: item }).subscribe(
        suc => {
          const res: any = suc;
          const list = JSON.parse(res).results;
          if (list) {
            this.matterIds.push(item.targetMatter.id);
            this.reset('addAnother', timeWorkedInput);
            if (!addAnother) {
              this.close();
            }
            this.toastDisplay.showSuccess(
              this.errorData.time_entry_saved_successfully
            );
            this.disable = false;
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
    if (this.isBillingNarratibeDisabled) {
      this.timeEntryForm.get('description').disable();
    } else {
      this.timeEntryForm.get('description').enable();
    }
    return (
      !this.timeEntryForm.valid ||
      this.clientDetail === null ||
      this.matterDetail === null ||
      this.timekeeperDetail === null ||
      this.disbursementTypeDetail === null
    );
  }

  public isItToday(date) {
    if (date) {
      return new Date(date).toDateString() === this.currentDate.toDateString();
    }
    return false;
  }

  public reset(action?, timeWorkedInput: HTMLInputElement = null) {
    if (action === 'cancel') {
      this.timeEntryForm.reset();
      this.dateReset = true;
      this.searchclient = '';
      this.searchMatter = '';
      this.searchEmployee = '';
      this.code = '';
      this.incorrectMatter = false;
      this.incorrectDisbursementType = false;
      this.incorrectClient = false;
      this.incorrectTimekeeper = false;
    } else {
      if (timeWorkedInput) {
        timeWorkedInput.focus();
      }
    }

    this.timeEntryForm.patchValue({
      dateOfService: new Date()
    });
    setTimeout(() => {
      this.dateReset = false;
    }, 50);

    this.formSubmitted = false;
    this.valueMustError = false;
    this.disable = false;
    this.incorrectClient = false;
    this.incorrectMatter = false;
    this.incorrectTimekeeper = false;
    this.incorrectDisbursementType = false;
    this.rate = 0;
    this.chargePrefix = '$';
    this.timeEntryForm.controls.note.patchValue('');
    this.timeEntryForm.controls.description.patchValue('');
    this.timeEntryForm.controls.timeWorked.patchValue('');
  }

  getAmount(matter, dType) {
    if (matter && !matter.isFixedFeeMatter) {
      if (dType.billType && dType.billType.code == 'HOURLY') {
        const minRate = +dType.rate / 60;
        return (dType.hours * 60 + dType.minutes) * minRate;
      } else {
        return dType.rate;
      }
    } else {
      return 0;
    }
  }

  private filterList() {
    if (this.clientDetailfilter || this.matterDetailfilter) {
      const tempOriginalArray: vwMyTimesheetModel[] = JSON.parse(
        JSON.stringify(this.originalArr)
      );

      const temp = tempOriginalArray.filter(obj => {
        if (obj.matterClientClocks && obj.matterClientClocks.length > 0) {
          if (this.clientDetailfilter && this.matterDetailfilter) {
            const tempArr1 = obj.matterClientClocks.filter(
              tc =>
                tc.targetMatter.id === this.matterDetailfilter.id &&
                tc.targetClient.id === this.clientDetailfilter.id
            );
            if (tempArr1 && tempArr1.length > 0) {
              obj.matterClientClocks = tempArr1;
              obj.totalHours = _.sumBy(
                obj.matterClientClocks,
                a => a.totalHours
              );
              obj.totalMinutes = _.sumBy(
                obj.matterClientClocks,
                a => a.totalMinutes
              );
              return true;
            }
          } else if (this.clientDetailfilter) {
            const tempArr1 = obj.matterClientClocks.filter(
              tc => tc.targetClient.id === this.clientDetailfilter.id
            );
            if (tempArr1 && tempArr1.length > 0) {
              obj.matterClientClocks = tempArr1;
              obj.totalHours = _.sumBy(
                obj.matterClientClocks,
                a => a.totalHours
              );
              obj.totalMinutes = _.sumBy(
                obj.matterClientClocks,
                a => a.totalMinutes
              );
              return true;
            }
          } else if (this.matterDetailfilter) {
            const tempArr1 = obj.matterClientClocks.filter(
              tc => tc.targetMatter.id === this.matterDetailfilter.id
            );
            if (tempArr1 && tempArr1.length > 0) {
              obj.matterClientClocks = tempArr1;
              obj.totalHours = _.sumBy(
                obj.matterClientClocks,
                a => a.totalHours
              );
              obj.totalMinutes = _.sumBy(
                obj.matterClientClocks,
                a => a.totalMinutes
              );
              return true;
            }
          }
        }
      });
      this.attendanceList = [...temp];
    } else {
      this.attendanceList = [...this.originalArr];
    }

    const lia = this.attendanceList.map(
      ({ matterClientClocks }) => matterClientClocks
    );
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

      this.toastDisplay.showError(this.errorData.value_must_be_greater_than_0);
    } else if (isNaN(hours) || isNaN(minutes)) {
      this.resetTimeWorked();
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
          this.rate = Math.abs(this.baseRate * +this.total_hours);
          this.changeDetectorRef.detectChanges();
          if (this.baseRate * +this.total_hours < 0) {
            this.chargePrefix = '-$';
          } else {
            this.chargePrefix = '$';
          }
        } else {
          if (this.timeEntryForm.get('dateOfService').value && this.clientDetail) {
            this.rate = Math.abs(this.baseRate * +this.total_hours);
            this.changeDetectorRef.detectChanges();
            if (this.baseRate * +this.total_hours < 0) {
              this.chargePrefix = '-$';
            } else {
              this.chargePrefix = '$';
            }
          }
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
    this.rate = 0;
    this.chargePrefix = this.baseRate < 0 ? '-$' : '$';
    if (showError) {
      this.rate = 0;
      this.chargePrefix = this.baseRate < 0 ? '-$' : '$';
      // this.toastDisplay.showError(this.errorData.value_must_be_number);
    }

    this.timeEntryForm.patchValue({
      timeWorked: ''
    });
  }

  close() {
    if (this.matterIds.length > 0) {
      this.sharedService.refreshTimekeeping$.next(this.matterIds);
    }
    this.activeModal.close();
  }

  /**
   * Function to copy Billing Narative to Notes
   */
  public copytoNote() {
    if (!this.timeEntryForm.controls.note.value || (this.timeEntryForm.controls.note.value && this.timeEntryForm.controls.note.value.trim() == '')) {
      this.timeEntryForm.controls.note.patchValue(
        this.timeEntryForm.controls.description.value
      );
    }
  }

  /**
   * Function Of Time Entery Form For DropDown Actions
   */
  public actionDropDown(event?, type?: string) {
    if (this.loading) {
      return;
    }
    if (this.clientListPopUp.length) {
      this.selectClient(this.clientListPopUp[0]);
      if (this.searchclient === 'Overhead') {
        this.clientList = [];
        this.clientSubscribe.unsubscribe();
        this.chargecode.nativeElement.focus();
        return;
      }
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
    if (this.filterdisbursementTypeListPopUP.length) {
      this.selectChargeCode(this.filterdisbursementTypeListPopUP[0]);
      this.filterdisbursementTypeListPopUP = [];
    }
    if (event) {
      if (event.x && event.y) {
        this.timeEntryForm
          .get('visibleToClient')
          .patchValue(!this.timeEntryForm.get('visibleToClient').value);
        event.y.focus();
      } else {
        event.focus();
        if (type == 'code') {
          this.code = ' ';
          this.incorrectDisbursementType = false;
        }
      }
    }
  }

  /**
   *  clears search list dropdown
   */
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

      case 'filterdisbursementTypeListPopUP': {
        this.filterdisbursementTypeListPopUP = [];
        break;
      }

      case 'employeeListPopUp': {
        this.employeeListPopUp = [];
        break;
      }
    }
  }

  /**
   * fetch matter list associated with client.
   * @param clientId
   */
  public async matterBasedOnClients(clientId: any) {
    try {
      const resp: any = await this.matterService
        .v1MatterClientClientIdGet(clientId)
        .toPromise();
      if (resp != null) {
        let response = [...(JSON.parse(resp).results as Array<any>)];

        response = response || [];
        response = response.filter(a => a.status && a.status.name == 'Open');

        if (response.length === 1) {
          this.matterDetail = response[0];
          this.getUserBaseRate();
          this.selectMatter(this.matterDetail, 'oneMatter');
        } else if (response.length > 1) {
          this.matterListPopUp = response;
          this.matterList = response;
          this.disabledMatter = false;
        }

        this.loading = false;
      }
    } catch (error) {
      console.log(error);
      this.loading = false;
    }
  }

  setChargeCodes() {
    this.filterdisbursementTypeListPopUP = this.originalChargeCodes;
  }

  setClientList() {
    this.clientListPopUp = this.clientList;
  }

  setMatterList() {
    this.matterListPopUp = this.matterList;
  }

  get isBillingNarratibeDisabled() {
    return (
      (this.clientDetail && this.clientDetail.role == 'Potential Client') ||
      (this.disbursementTypeDetail &&
        (this.disbursementTypeDetail.billingTo.code == 'OVERHEAD' ||
          this.disbursementTypeDetail.type == 'FIXED_FEE' ||
          this.disbursementTypeDetail.type == 'FIXED_FEE_ADD_ON'))
    );
  }

  get isMatterCleared() {
    if (!this.matterDetail && this.code) {
      this.code;
      this.code = null;
    }
    return !this.matterDetail;
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
      this.filterList();
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
    if (this.matterDetail && this.matterDetail.id && this.timekeeperDetail && this.timekeeperDetail.id) {
      const data = {
        matterId: this.matterDetail.id,
        loggedInPersonId: this.timekeeperDetail.id
      };
      this.loading = true;
      const res = await this.clockService.v1ClockMatterBaserateGet(data)
        .toPromise();
      if (res != null) {
        this.baseRate = +JSON.parse(res as any).results;
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
  
  checkNumber(event) {
    return UtilsHelper.checkNumber(event);
  }
}
