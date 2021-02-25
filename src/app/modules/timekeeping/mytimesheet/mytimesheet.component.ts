import { ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errorData from 'src/app/modules/shared/error.json';
import { vwBillingSettings, vwRate } from 'src/common/swagger-providers/models';
import { BillingService, ClockService, EmployeeService, MatterService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { ErrorJsonObject } from '../../models/error.model';
import { vwMyTimesheetModel } from '../../models/timesheet.model';
import { SharedService } from '../../shared/sharedService';
import { padNumber, UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-mytimesheet',
  templateUrl: './mytimesheet.component.html',
  styleUrls: ['./mytimesheet.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class MytimesheetComponent implements OnInit, OnDestroy {
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;

  modalOptions: NgbModalOptions;
  closeResult: string;

  public myTimesheetDetail: any = null;
  public TimesheetDetail: any = null;
  public arr: any = [-1, -2];
  public showGrid = false;
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
  public rate: any = 0;
  public code: string;
  public code1: string;
  public clientDetail: any = null;
  public matterDetail: any = null;
  public timekeeperDetail: any = null;
  public disbursementTypeDetail: any = null;
  public searchclient = '';
  public searchMatter = '';
  public searchEmployee = '';
  private modalRef: NgbModalRef;
  public currentDate = new Date();
  public isEdit = false;
  public changeNote = '';
  public id = 0;
  public viewTimeEntryobj: any = null;
  public baseRate = 0;
  public totalBillableHours: string;
  public totalNonBillableHours: string;
  public totalHours: string;

  public BillableRate = 0;
  public NonBillableRate = 0;
  public TotalRate = 0;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public matterDetailfilter: any = null;
  public searchMatterfilter: string;
  public dateGenerated: any;
  public timeEntryForm: FormGroup = this.builder.group({
    dateOfService: this.dateOfService,
    timeWorked: this.timeWorked,
    description: this.description,
    visibleToClient: this.visibleToClient,
    note: this.note
  });

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
    {
      name: 'Non Billable',
      value: false
    }
  ];
  public statusModel: string;
  public billableStatusModel: boolean;
  public fromEmployeeProfile: boolean;
  public searchclientfilter: string;
  public clientDetailfilter: any = null;
  public timekeeperDetailfilter: any = null;
  public errorData: any = (errorData as any).default;
  public timeWorkedModel: any;
  public billingSettings: vwBillingSettings;
  public hours: number;
  public minutes: number;
  public dateReset = false;
  public loginUser: any;
  public matterId: any;
  private matterNumber: string;
  public total_hours = 0;

  public personId: any;
  public personName: any;
  public loading = true;
  public TimeDisplayFormat: any;
  public isCreate: boolean;
  public disabledClient = false;
  public disabledMatter = false;
  private refreshTimekeepingSubscription: Subscription;
  public disable = false;
  public editLoading = false;
  public chargeCodeLoading = false;
  originalClientList: any;
  originalClientListPopup: any;
  originalMatterList: any[];
  originalMatterListPopup: any[];
  public editTimeDetails: any;

  public formSubmitted = false;
  public clientError = false;
  public matterError = false;
  public chargeCodeError = false;
  public valueMustError = false;

  incorrectDisbursementType: boolean;
  incorrectClient: boolean;
  incorrectMatter: boolean;
  public currentActive: string;
  userDetails = JSON.parse(localStorage.getItem('profile'));
  redirectUrl: string;
  public isSearchLoading = false;
  public isSearch2Loading = false;
  public isMatterSearchLoading = false;
  public isMatterSearch2Loading = false;
  public chargePrefix = '$';

  startDate: any;
  endDate: any;

  public isTimekeepingSearchLoading = false;
  public incorrectTimekeeper = false;
  public disabledTimekeeper = false;
  selectedChargeCode: any;
  timeStringPlaceholder;

  enableEnterTime = false;
  selectedRow: any;

  constructor(
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private clockService: ClockService,
    private builder: FormBuilder,
    private billingService: BillingService,
    private dialogService: DialogService,
    private store: Store<fromRoot.AppState>,
    private toastDisplay: ToastDisplay,
    private sharedService: SharedService,
    private toastr: ToastDisplay,
    private pagetitle: Title,
    private matterService: MatterService,
    private changeDetectorRef: ChangeDetectorRef,
    private employeeService: EmployeeService,
    private router: Router
  ) {
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.disable = false;
    this.timeStringPlaceholder = this.getTimeString(0,0);
    this.route.queryParams.subscribe(params => {
      let matterId = params['matterId'];
      let personId = +params['personId'];
      this.personName = decodeURI(params['name']);
      if (!personId) {
        this.pagetitle.setTitle('My Timesheet');
      } else {
        this.pagetitle.setTitle(this.personName + "'s Timesheet");
      }
      this.fromEmployeeProfile = params['fromEmployeeProfile'];

      if (personId) {
        this.personId = +personId;
      }

      if (matterId) {
        this.matterId = matterId;
        this.matterNumber = params['matterNumber'];
      }

      if (this.personId) {
        this.checkStatus();
      } else {
        this.enableEnterTime = true;
      }
    });

    this.loginUser = UtilsHelper.getLoginUser();
    this.totalHours = this.getTimeString(0, 0);
    this.totalBillableHours = this.getTimeString(0, 0);
    this.totalNonBillableHours = this.getTimeString(0, 0);
    this.addConfigs();
    this.getMyTimesheetInfo();
    this.getChargeCode();
    this.getBillingSettings();

    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (!this.personId && (this.permissionList.TIMEKEEPING_OTHERSisAdmin || this.permissionList.TIMEKEEPING_OTHERSisViewOnly) && !this.permissionList.TIMEKEEPING_SELFisEdit) {
            this.router.navigate(['/timekeeping/all-timesheets']);
          }
          if (!this.permissionList.TIMEKEEPING_OTHERSisAdmin) {
            this.disabledTimekeeper = true;
          } else {
            this.disabledTimekeeper = false;
          }
        }
      }
    });

    this.refreshTimekeepingSubscription = this.sharedService.refreshTimekeeping$.subscribe(
      () => {
        this.getMyTimesheetInfo();
      }
    );
  }

  get f() {
    return this.timeEntryForm.controls;
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }

    if (this.refreshTimekeepingSubscription) {
      this.refreshTimekeepingSubscription.unsubscribe();
    }
  }

  private checkStatus() {
    this.employeeService.v1EmployeeIdGet({
      id: this.personId
    })
    .pipe(map(UtilsHelper.mapData))
    .subscribe(res => {
      this.enableEnterTime = res.isVisible == true;
    });
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
            if (
              this.billingSettings &&
              this.billingSettings.timeRoundingInterval
            ) {
              let roundingInterval =
                '00' + this.billingSettings.timeRoundingInterval;
            }
            if (this.billingSettings.timeDisplayFormat) {
              this.TimeDisplayFormat = String(
                this.billingSettings.timeDisplayFormat
              );
              const type =
                this.billingSettings.timeDisplayFormat === 1
                  ? 'jira'
                  : this.billingSettings.timeDisplayFormat === 2
                    ? 'standard'
                    : this.billingSettings.timeDisplayFormat === 3
                      ? 'decimal'
                      : 'jira';
              localStorage.setItem('timeformat', type);
              this.isCreate = false;
            } else {
              this.isCreate = true;
            }
          },
          () => { }
        );
    }
  }

  public getMyTimesheet() {
    if (this.loginUser) {
      this.clockService
        .v1ClockPersonPersonIdGet({ personId: this.loginUser.id })
        .subscribe(
          suc => {
            const res: any = suc;
            const list = JSON.parse(res).results;
            if (list && list.length > 0) {
              this.myTimesheetDetail = list.filter((obj: { id: any }) =>
                this.arr.includes(obj.id)
              );
              this.TimesheetDetail = list.filter(
                (obj: { id: any }) => !this.arr.includes(obj.id)
              )[0];
            }
          },
          err => {
            console.log(err);
          }
        );
    }
  }

  public getMyTimesheetInfo() {
    this.editLoading = false;
    if (this.loginUser) {
      this.editLoading = true;
      let param = { personId: 0, startSunOfWeek: null, endSatOfWeek: null };
      if (this.dateGenerated && this.dateGenerated.length > 0) {
        param = {
          personId: this.loginUser.id,
          startSunOfWeek: this.dateGenerated[0].toDateString(),
          endSatOfWeek: this.dateGenerated[1].toDateString()
        };
      } else {
        this.endDate = new Date();
        const curr = new Date();
        curr.setDate(curr.getDate() - 6);
        this.startDate = curr;
        param = {
          personId: this.loginUser.id,
          startSunOfWeek: this.startDate.toDateString(),
          endSatOfWeek: this.endDate.toDateString()
        };
        this.dateGenerated = [this.startDate, this.endDate];
      }

      if (this.personId) {
        param.personId = this.personId;
      }

      this.clockService.v1ClockPersonMatterPersonIdGet(param).subscribe(
        suc => {
          const res: any = suc;
          const list = JSON.parse(res).results;
          if (list && list.length > 0) {
            list.sort((a, b) => {
              const aDate: any = new Date(a.dateOfService);
              const bDate: any = new Date(b.dateOfService);
              return bDate - aDate;
            });
            this.attendanceList = list;
            this.attendanceList = this.checkTodayDateInAttendance();
            this.originalArr = [...this.attendanceList];
            const lia = this.attendanceList.map(
              ({ matterClientClocks }) => matterClientClocks
            );
            this.filterList();
            this.getAllInfo(lia);
          } else {
            this.attendanceList = [];
          }
          if (this.matterId) {
            this.getMatterbaseOnQueryParam(this.matterNumber);
          } else {
            this.editLoading = false;
            this.loading = false;
          }
        },
        err => {
          console.log(err);
          this.editLoading = false;
          this.loading = false;
        }
      );
    }
  }

  getAllInfo(data) {
    let billableHour = 0;
    let billableMin = 0;
    let nonbillableHour = 0;
    let nonbillableMin = 0;
    this.BillableRate = 0;
    this.NonBillableRate = 0;
    for (let i = 0; i < data.length; i++) {
      const element = data[i];
      for (let j = 0; j < element.length; j++) {
        const item = element[j];
        if (item) {
          for (let k = 0; k < item.disbursementTypes.length; k++) {
            const dType = item.disbursementTypes[k];
            if (dType.isBillableToClient) {
              const billable = this.BillableToClient(dType);
              billableHour += billable.billableHour;
              billableMin += billable.billableMin;
              this.billableToclientRate(dType, item);
            } else {
              if (
                item.disbursementTypes &&
                item.disbursementTypes.length > 0 &&
                item.disbursementTypes[0].type &&
                item.disbursementTypes[0].type.code === 'OVERHEAD'
              ) {
                item.targetMatter = { id: 0, matterName: 'Overhead' };
                item.targetClient = { id: 0, lastName: 'Overhead' };
              }
              const nonBillable = this.notBillableToClient(dType, item);
              nonbillableHour += nonBillable.nonbillableHour;
              nonbillableMin += nonBillable.nonbillableMin;
              this.notBillableToClientRate(dType, item);
            }
            item.disbursementTypes[k][
              'editDeleteFlag'
            ] = this.getTimeEditDelete(item.disbursementTypes[k]);
          }
        }
      }
    }
    this.getBillableHours(billableHour, billableMin);
    this.getNonBillableHours(nonbillableHour, nonbillableMin);
    this.getTotalHoursModel(
      billableHour,
      billableMin,
      nonbillableHour,
      nonbillableMin
    );
    this.TotalRate = this.BillableRate + this.NonBillableRate;
  }

  private getBillableHours(billableHour, billableMin) {
    this.totalBillableHours = this.gethoursInString(billableHour, billableMin);
  }

  private getNonBillableHours(h, m) {
    this.totalNonBillableHours = this.gethoursInString(h, m);
  }

  private getTotalHoursModel(
    billableHour,
    billableMin,
    nonbillableHour,
    nonbillableMin
  ) {
    this.totalHours = this.gethoursInString(
      billableHour + nonbillableHour,
      billableMin + nonbillableMin
    );
  }

  private gethoursInString(hour, min) {
    const tmin = hour * 60 + min;
    const hours = Math.floor(tmin / 60);
    const minutes = tmin % 60;
    return this.getTimeString(hours, minutes);
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
        .pipe(
          map(UtilsHelper.mapData),
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe(
          suc => {
            const list = suc;
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
              if (
                this.matterDetail &&
                this.matterDetail.id === 0 &&
                type !== 'edit'
              ) {
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
    }
  }

  private getMatterLevelChargeCode(onSuccess = () => { }, type = null) {
    this.loading = true;
    this.chargeCodeLoading = true;
    this.billingService
      .v1BillingChargecodesMatterMatterIdGet({
        matterId: this.matterDetail.id
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.chargeCodeLoading = false;
        })
      )
      .subscribe(
        suc => {
          const res: any = suc;
          const list = JSON.parse(res).results;
          if (list && list.length > 0) {
            this.disbursementTypeList = list || [];
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
            if (this.isEdit) {
              this.disbursementTypeList = this.disbursementTypeList.filter(
                a => a.status == 'Active' || a.code == this.code
              );
            } else {
              this.disbursementTypeList = this.disbursementTypeList.filter(
                a => a.status == 'Active'
              );
            }
            this.originalChargeCodes = [...this.disbursementTypeList];
            if (type === ' ' && type !== 'edit') {
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
  }

  enterTimeNew(content: any, className, winClass) {
    this.originalMatterListPopup = UtilsHelper.clone([]);
    this.originalClientListPopup = UtilsHelper.clone([]);
    this.clientListPopUp = UtilsHelper.clone([]);
    this.matterListPopUp = UtilsHelper.clone([]);
    this.searchclient = '';
    this.clientDetail = null;
    this.searchMatter = '';
    this.loading = true;
    let timekeeperId;
    if (this.personId) {
      timekeeperId = this.personId;
    } else {
      timekeeperId = this.loginUser.id;
    }
    if (!this.permissionList.TIMEKEEPING_SELFisEdit && this.permissionList.TIMEKEEPING_OTHERSisAdmin && this.loginUser.id == this.personId) {
      this.loading = false;
    } else {
      this.employeeService
        .v1EmployeeIdGet({
          id: timekeeperId
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
        });
    }

    this.timeEntryForm.patchValue({
      dateOfService: new Date()
    });
    this.timeEntryForm.get('description').enable();
    this.openPersonalinfo(content, className, winClass);
  }

  openPersonalinfo(content: any, className, winClass) {
    this.modalRef = this.modalService.open(content, {
      size: className,
      centered: true,
      windowClass: winClass,
      backdrop: 'static'
    });
    this.modalRef.result.then(
      result => {
        this.disabledClient = false;
        this.disabledMatter = false;
        this.closeResult = `Closed with: ${result}`;
      },
      reason => {
        this.disabledClient = false;
        this.disabledMatter = false;
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  private getDismissReason(reason: any): string {
    this.isEdit = false;
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  public getTotalHours() {
    const obj = this.myTimesheetDetail;
    if (obj && obj.length > 0) {
      let totalmin = 0;
      obj.forEach(element => {
        totalmin += element.hours * 60 + element.minutes;
      });
      const hours = Math.floor(totalmin / 60);
      const minutes = totalmin % 60;
      return hours + 'h ' + minutes + 'm';
    }
    return '0h 00m';
  }

  public getBillableTotalHours(id) {
    const item = this.myTimesheetDetail;
    if (item && item.length > 0) {
      let totalmin = 0;
      const data = item.filter((obj: { id: any }) => obj.id === id)[0];
      totalmin = data.hours * 60 + data.minutes;
      const hours = Math.floor(totalmin / 60);
      const minutes = totalmin % 60;
      return hours + 'h ' + minutes + 'm';
    }
    return '0h 00m';
  }

  public getTotalRate() {
    const obj = this.myTimesheetDetail;
    if (obj && obj.length > 0) {
      let total = 0;
      obj.forEach(element => {
        if (!element.isFixedFeeMatter) {
          total += !element.Rate ? 0 : element.rate;
        }
      });

      return total;
    }
    return 0;
  }

  public getBillableTotalRate(id) {
    const item = this.myTimesheetDetail;
    if (item && item.length > 0) {
      let total = 0;
      const data = item.filter((obj: { id: any }) => obj.id === id)[0];
      total = !data.Rate ? 0 : data.rate;
      return total;
    }
    return 0;
  }

  public updateFilter(event, type) {
    this.rate = 0;
    if (
      event.code === 'ArrowDown' ||
      event.code === 'ArrowUp' ||
      event.code === 'ArrowRigtht' ||
      event.code === 'ArrowLeft'
    ) {
      return;
    }
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
      this.filterdisbursementTypeListPopUP = [];
      this.disbursementTypeDetail = null;
      this.attendanceList = this.originalArr;
      this.attendanceList = this.checkTodayDateInAttendance();
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

      if (type == 2) {
        this.isSearch2Loading = true;
      } else {
        this.isSearchLoading = true;
      }

      this.clientSubscribe = this.clockService
        .v1ClockClientsSearchusingindexGet({ search: val })
        .subscribe(
          suc => {
            const res: any = suc;
            const list = JSON.parse(res).results;
            this.originalClientList = list;
            this.originalClientListPopup = list;
            this.addoverhead('client', val, list);
            if (type === '1') {
              this.clientList = list;
            } else {
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
                this.clientListPopUp = _.orderBy(list, ['lastName', 'firstName'], ['asc']);
              }
            }
            if (type == 2) {
              this.isSearch2Loading = false;
            } else {
              this.isSearchLoading = false;
            }
          },
          err => {
            console.log(err);
            if (type == 2) {
              this.isSearch2Loading = false;
            } else {
              this.isSearchLoading = false;
            }
          }
        );
    } else {
      this.clientList = [];
      this.clientListPopUp = [];
      this.clientDetail = null;
      this.clientDetailfilter = null;
      this.filterList();
      if (type == 2) {
        this.isSearch2Loading = false;
      } else {
        this.isSearchLoading = false;
      }
    }
  }

  private addoverhead(type: string, value: string, arr) {
    let v = value ? value.toLowerCase() : '';
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
    let val =  (event && event.target && event.target.value) ? event.target.value.trim() : '';
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
      this.isMatterSearchLoading = true;
      if (type == '1') {
        this.isMatterSearch2Loading = true;
      }
      this.matterSubscribe = this.clockService
        .v1ClockMattersSearchGet(param)
        .subscribe(
          suc => {
            const res: any = suc;
            const list = JSON.parse(res).results;
            let newList = [];
            list.forEach(matter => {
              let matterName = (matter.matterName || '').trim();
              matter.matterName = matterName;
              newList.push(matter);
            });
            const sortedList = newList.sort((a, b) =>
              a.matterName.localeCompare(b.matterName)
            );
            this.originalMatterList = sortedList;
            this.originalMatterListPopup = sortedList;
            if (type === '1') {
              this.addoverhead('matter', val, sortedList);
              this.matterList = sortedList;
            } else {
              this.addoverhead('matter', val, list);
              this.matterListPopUp = list;
            }
            this.isMatterSearchLoading = false;
            if (type == '1') {
              this.isMatterSearch2Loading = false;
            }
          },
          err => {
            console.log(err);
            this.isMatterSearchLoading = false;
            if (type == '1') {
              this.isMatterSearch2Loading = false;
            }
          }
        );
    } else {
      this.matterList = [];
      this.matterListPopUp = [];
      this.matterDetail = null;
      this.matterDetailfilter = null;
      this.filterList();
      this.isMatterSearchLoading = false;
    }
  }

  public getMatterbaseOnQueryParam(matterNumber) {
    this.loading = true;
    let param = { search: matterNumber };
    this.matterSubscribe = this.clockService
      .v1ClockMattersSearchGet(param)
      .subscribe(
        suc => {
          const res: any = suc;
          const list = JSON.parse(res).results ? JSON.parse(res).results : [];
          if (list.length > 0) {
            let matter = list.find(a => a.id == this.matterId);
            if (matter) {
              this.selectMatterFilter(matter);
            }
          }
          this.loading = false;
          this.editLoading = false;
        },
        err => {
          console.log(err);
          this.loading = false;
          this.editLoading = false;
        }
      );
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

  /**
   * Function Of Time Entery Form For DropDown Actions
   */
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
        if (type === 'code') {
          this.code = ' ';
        }
      }
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

  public selectClient(item, isMatterPresent = false) {
    this.clientError = false;
    this.matterListPopUp = [];
    this.filterdisbursementTypeListPopUP = [];
    this.searchclient = item.isCompany
      ? item.companyName
      : !item.firstName
        ? item.lastName
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
      this.incorrectDisbursementType = false;
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

  public selectClientFilter(item) {
    this.searchclientfilter = item.isCompany
      ? item.companyName
      : item.firstName
        ? item.lastName + ', ' + item.firstName
        : item.lastName;
    this.clientDetailfilter = item;
    this.clientList = [];
    this.filterList();

    this.searchMatterfilter = '';
    this.matterDetailfilter = null;

    if (item.id > 0) {
      this.matterList = [];
      this.matterBasedOnClients({ clientId: item.id }, true);
    } else {
      if (item.id == 0) {
        this.matterList = [{ id: 0, matterName: 'Overhead' }];
      } else {
        this.matterList = [];
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
        : item.matterName + ' - ' + item.matterNumber;
    this.matterDetail = item;
    this.getUserBaseRate();
    this.matterListPopUp = [];
    this.incorrectMatter = false;
    if (item.id === 0) {
      this.disabledMatter = true;
      this.rate = 0;
      this.chargePrefix = '$';
      this.code = ' ';
      this.disbursementTypeDetail = null;
      this.searchclient = 'Overhead';
      this.clientDetail = { id: 0, lastName: 'Overhead' };
      this.incorrectClient = false;
      this.incorrectDisbursementType = false;
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
    }
  }

  public async matterBasedOnClients(clientId: any, filter = false) {
    let resp: any;

    if (filter) {
      this.isMatterSearchLoading = true;
    }

    try {
      resp = await this.matterService
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
          this.disabledMatter = false;
          this.originalMatterList = [...response];
          this.originalMatterListPopup = [...response];
          this.loading = false;

          if (filter) {
            this.matterList = UtilsHelper.clone(this.originalMatterList);
            this.isMatterSearchLoading = false;
          } else {
            this.matterListPopUp = UtilsHelper.clone(this.originalMatterListPopup);
          }
        }
      }
    } catch (error) {
      console.log(error);
      this.loading = false;
      if (filter) {
        this.isMatterSearchLoading = false;
      }
    }
  }

  public selectMatterFilter(item) {
    this.searchMatterfilter = item.id
      ? item.matterName + ' (' + item.matterNumber + ')'
      : item.matterName;
    this.matterDetailfilter = item;
    this.matterList = [];

    if (item.client) {
      this.searchclientfilter = item.client.isCompany
      ? item.client.companyName
      : item.client.firstName
        ? item.client.lastName + ', ' + item.client.firstName
        : item.client.lastName;
      this.clientDetailfilter = item.client;
    }

    this.filterList();
  }

  public selectChargeCode(item: vwRate) {
    this.selectedChargeCode = item;
    this.chargeCodeError = false;
    this.clientListPopUp = [];
    this.matterListPopUp = [];
    this.chargePrefix = this.baseRate < 0 ? '-$' : '$';
    this.code = item.code;
    this.disbursementTypeDetail = item;
    this.filterdisbursementTypeListPopUP = [];
    if (this.isBillingNarratibeDisabled) {
      this.timeEntryForm.get('description').disable();
    } else {
      this.timeEntryForm.get('description').enable();
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
        const timeWorked: string = this.timeEntryForm.controls['timeWorked']
          .value;
        if (timeWorked && this.timeEntryForm.get('dateOfService').value && this.clientDetail) {
          const rate = this.baseRate * +this.total_hours;
          this.rate = Math.abs(rate);
          this.chargePrefix = rate > 0 ? '$' : '-$';
        }
      }

      if (item && item.billingTo && item.billingTo.code === 'OVERHEAD') {
        this.timeEntryForm.get('description').patchValue(null);
        this.rate = 0;
        this.chargePrefix = '$';
      }
    }
    if (
      this.disbursementTypeDetail &&
      this.disbursementTypeDetail.billingTo.code == 'OVERHEAD'
    ) {
      this.timeEntryForm.get('visibleToClient').patchValue(false);
    }
  }

  private getRate(item: vwRate) {
    if (item.isCustom) {
      return +item.customRateAmount;
    } else {
      return +item.rateAmount;
    }
  }

  public selectChargeCode1(item) {
    this.code1 = item.code;
    this.filterdisbursementTypeList = [];
    this.statusChange(this.code1, 'code');
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

      if (
        item.disbursementType &&
        item.disbursementType.billingTo &&
        item.disbursementType.billingTo.code === 'OVERHEAD'
      ) {
        item.isOverhead = true;
      }

      this.loading = true;
      this.disable = true;
      this.clockService.v1ClockPost$Json({ body: item }).subscribe(
        suc => {
          const res: any = suc;
          const list = JSON.parse(res).results;
          if (list) {
            this.reset(addAnother, timeWorkedInput);
            if (!addAnother) {
              this.modalRef.close();
            } else {
              this.timeEntryForm.get('description').enable();
            }
            this.toastDisplay.showSuccess(
              this.errorData.time_entry_saved_successfully
            );
            this.getMyTimesheetInfo();
          }
          this.loading = false;
          this.disable = false;
        },
        err => {
          this.disable = false;
          this.loading = false;
        }
      );
    }
  }

  public isDisable() {
    if (!this.timeEntryForm.valid || !this.matterDetail || !this.clientDetail || !this.timekeeperDetail) {
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

  public reset(action?, timeWorkedInput: HTMLInputElement = null) {
    if(action == true) {
      this.selectChargeCode(this.selectedChargeCode);
      this.timeEntryForm.patchValue({
        note: '',
        description: '',
        timeWorked: ''
      });

      if (timeWorkedInput) {
        timeWorkedInput.focus();
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
    {
      if (action === 'cancel') {
        this.timeEntryForm.reset();
        this.dateReset = true;
        this.searchclient = '';
        this.searchMatter = '';
        this.searchEmployee = '';
        this.code = '';
        this.incorrectClient = false;
        this.incorrectMatter = false;
        this.incorrectDisbursementType = false;
        this.incorrectTimekeeper = false;
      }
    }
    setTimeout(() => {
      this.dateReset = false;
    }, 50);

    this.formSubmitted = false;
    this.rate = 0;
    this.chargePrefix = '$';
    this.valueMustError = false;
    this.disable = false;
    this.incorrectClient = false;
    this.incorrectMatter = false;
    this.incorrectTimekeeper = false;
    this.incorrectDisbursementType = false;
  }

  public editTime(content, date, item, dType) {
    this.editLoading = true;
    this.editTimeDetails = dType;
    this.timeEntryForm.setValue({
      dateOfService: date,
      timeWorked: this.getTimeString(dType.hours, dType.minutes),
      description: dType.description,
      visibleToClient: dType.note.isVisibleToClient,
      note: dType.note.content
    });
    this.searchclient =
      item.targetClient && item.targetClient.id
        ? item.targetClient.isCompany
          ? item.targetClient.companyName
          : item.targetClient.firstName + ',' + item.targetClient.lastName
        : 'Overhead';
    this.searchMatter =
      item.targetMatter && item.targetMatter.id
        ? item.targetMatter.name + ' (' + item.targetMatter.id + ')'
        : 'Overhead';
    this.searchEmployee = item.disbursementTypes[0].person.id ? item.disbursementTypes[0].person.lastName + ', ' + item.disbursementTypes[0].person.firstName : item.disbursementTypes[0].createdBy;
    this.clientDetail = item.targetClient;
    this.matterDetail = item.targetMatter;
    this.timekeeperDetail = item.disbursementTypes[0].person;
    this.matterDetail['isFixedFee'] = item.isFixedFeeMatter;
    this.getUserBaseRate();
    if (this.matterDetail.isFixedFee) {
      this.rate = 0;
      this.chargePrefix = '$';
      this.code = dType.code;
    } else {
      this.code = dType.code;
      if (dType.billType && dType.billType.code == 'HOURLY') {
        const minRate = +dType.rate / 60;
        this.rate = (dType.hours * 60 + dType.minutes) * minRate;
      } else {
        this.rate = dType.rate;
      }
      this.chargePrefix = this.rate < 0 ? '-$' : '$';
    }
    this.disabledMatter = item.targetMatter && item.targetMatter.id === 0;
    if (
      (dType &&
        dType.type &&
        (dType.type.code === 'OVERHEAD' ||
          dType.type.code === 'Fixed Fee' ||
          dType.type.code === 'Fixed Fee Addon')) ||
      (this.clientDetail &&
        (this.clientDetail.role == 'Potential Client' ||
          this.clientDetail.role == 'Contact'))
    ) {
      this.timeEntryForm.get('description').disable();
    } else {
      this.timeEntryForm.get('description').enable();
    }
    this.isEdit = true;
    this.incorrectClient = false;
    this.incorrectMatter = false;
    this.incorrectDisbursementType = false;
    const openEditTime = (content, dType) => {
      this.editLoading = false;
      this.disbursementTypeDetail =
        this.disbursementTypeList.find(a => a.code == dType.code) || dType;
      this.id = dType.id;
      this.modelChanged();
      this.openPersonalinfo(content, '', 'modal-xlg');
    };

    this.getChargeCode(() => {
      openEditTime(content, dType);
    }, 'edit');
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

  public ViewTime(content, date, item, dType) {
    const view: any = {};
    view.client =
      item.targetClient && item.targetClient.id
        ? item.targetClient.isCompany
          ? item.targetClient.companyName
          : item.targetClient.firstName + ', ' + item.targetClient.lastName
        : 'Overhead';

    view.matter =
      item.targetMatter && item.targetMatter.id
        ? item.targetMatter.name + ' (' + item.targetMatter.id + ')'
        : 'Overhead';
    view.dateOfService = date;
    view.code = dType.code;
    view.disbursementTypeDetail = dType;
    view.timeWorked =
      dType.hours.toString() + 'h ' + dType.minutes.toString() + 'm';
    view.Narrative = dType.description;
    view.visibleToClient = dType.note.isVisibleToClient;
    view.note = dType.note.content;
    view.status = dType.status;
    view.billType = dType.billType;

    if (dType.billType && dType.billType.code == 'HOURLY') {
      const minRate = +dType.rate / 60;
      view.amount = (dType.hours * 60 + dType.minutes) * minRate;
    } else {
      view.amount = dType.rate;
    }

    this.viewTimeEntryobj = view;
    this.openPersonalinfo(content, '', 'modal-xlg');
  }

  public updateTime() {
    this.formSubmitted = true;

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
      this.disable = true;
      const data = { ...this.timeEntryForm.value };
      const currDate = new Date();
      const item: any = {};
      item.dateOfService = data.dateOfService;
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
      item.note = {
        isVisibleToClient: data.visibleToClient,
        content: data.note,
        applicableDate: currDate,
        name: 'enterTime'
      };
      item.person = { id: this.timekeeperDetail.id };
      const rate = this.chargePrefix.replace(/\$/g, '') + this.rate;
      item.rate = +rate;
      item.status = { id: this.editTimeDetails.status.id };
      item.targetClient = this.clientDetail;
      item.targetMatter = this.matterDetail;
      item.id = this.id;
      if (
        item.disbursementType &&
        item.disbursementType.billingTo &&
        item.disbursementType.billingTo.code === 'OVERHEAD'
      ) {
        item.isOverhead = true;
      }
      this.loading = true;
      this.clockService.v1ClockPut$Json({ body: item }).subscribe(
        suc => {
          const res: any = suc;
          const list = JSON.parse(res).results;
          if (list) {
            this.reset();
            this.isEdit = false;
            this.modalRef.close();
            this.toastDisplay.showSuccess(
              this.errorData.time_entry_updated_successfully
            );
            this.getMyTimesheetInfo();
            this.disable = false;
          }
        },
        err => {
          console.log(err);
          this.disable = false;
          this.loading = false;
        }
      );
    }
  }

  public async deleteTime(dType) {
    const resp: any = await this.dialogService.confirm(
      this.errorData.time_entry_delete_confirm,
      'Delete',
      'Cancel',
      'Delete Time Entry',
    );
    if (resp) {
      this.editLoading = true;
      const item = { id: dType.id, description: dType.description };
      this.clockService.v1ClockDelete$Json({ body: item }).subscribe(
        suc => {
          this.toastr.showSuccess(
            this.errorData.time_entry_deleted_successfully
          );
          this.getMyTimesheetInfo();
        },
        err => {
          this.editLoading = false;

          console.log(err);
        }
      );
    }
  }

  public statusChange(value, type) {
    if (this.originalArr && this.originalArr.length > 0) {
      let tempArrstatus, tempArr1, temp, tempBillArr, tempCodeArr;
      temp = this.originalArr.filter(obj => {
        if (obj.matterClientClocks && obj.matterClientClocks.length > 0) {
          tempArr1 = obj.matterClientClocks.filter(obj1 => {
            if (this.statusModel) {
              if (obj1.disbursementTypes && obj1.disbursementTypes.length > 0) {
                tempArrstatus = obj.matterClientClocks[0].disbursementTypes.find(
                  item => item.status && item.status.name === this.statusModel
                );
                if (tempArrstatus) {
                  return true;
                }
              }
            }
            if (this.billableStatusModel) {
              if (obj1.disbursementTypes && obj1.disbursementTypes.length > 0) {
                tempBillArr = obj.matterClientClocks[0].disbursementTypes.find(
                  item => item.isBillableToClient === this.billableStatusModel
                );
                if (tempBillArr) {
                  return true;
                }
              }
            }
            if (this.code1) {
              if (obj1.disbursementTypes && obj1.disbursementTypes.length > 0) {
                tempCodeArr = obj1.disbursementTypes.filter(
                  (tc: { code: any }) => tc.code === this.code1
                );
                if (tempCodeArr && tempCodeArr.length > 0) {
                  return true;
                }
              }
            }
          });
          if (tempArr1 && tempArr1.length > 0) {
            return true;
          }
        }
      });
      this.attendanceList = temp;
      this.attendanceList = this.checkTodayDateInAttendance();
      if (!value) {
        this.attendanceList = [...this.originalArr];
        this.attendanceList = this.checkTodayDateInAttendance();
        this.filterList();
      }
    }
  }

  checkTodayDateInAttendance() {
    const tempArr = [];
    for(const data of this.attendanceList) {
      data['isToday'] = this.isItToday(data.dateOfService);
      data['totalTime'] = this.getTimeString(data.totalHours, data.totalMinutes);
      tempArr.push(data);
      if(data.matterClientClocks && data.matterClientClocks.length) {
        for(const matter of data.matterClientClocks) {
          matter['matterStr'] = this.getTimeString(matter.totalHours, matter.totalMinutes);
          if(matter.disbursementTypes && matter.disbursementTypes.length) {
            for(const type of matter.disbursementTypes) {
              type['calAmount'] = this.getAmount(matter, type);
              type['timeStr'] = this.getTimeString(type.hours, type.minutes);
            }
          }
        }
      }
    }
    return tempArr;
  }

  public EnterTimeForDate(content: any, date: any, item) {
    this.timeEntryForm.get('description').enable();
    this.timeEntryForm.setValue({
      dateOfService: date,
      timeWorked: '',
      description: '',
      visibleToClient: false,
      note: ''
    });
    this.loading = true;
    let timekeeperId;
    if (this.personId) {
      timekeeperId = this.personId;
    } else {
      timekeeperId = this.loginUser.id;
    }
    if (!this.permissionList.TIMEKEEPING_SELFisEdit && this.permissionList.TIMEKEEPING_OTHERSisAdmin && this.loginUser.id == this.personId) {
      this.selecctClientorMatter(item);
    } else {
      this.employeeService
        .v1EmployeeIdGet({
          id: timekeeperId
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
          this.selecctClientorMatter(item);
        });
    }

    this.timeEntryForm.get('description').enable();
    this.openPersonalinfo(content, '', 'modal-xlg');
  }

  selecctClientorMatter(item){
    if (item.targetClient) {
      this.selectClient(item.targetClient, true);
      this.disabledClient = true;
    }
    if (item.targetMatter) {
      let matterDetails = {
        matterName: item.targetMatter.name || item.targetMatter.matterName,
        matterNumber: item.targetMatter.id,
        id: item.targetMatter.id
      };
      this.selectMatter(matterDetails);
      this.disabledMatter = true;
    }
  }

  private filterList() {
    if (this.clientDetailfilter || this.matterDetailfilter) {
      let tempOriginalArray: vwMyTimesheetModel[] = JSON.parse(
        JSON.stringify(this.originalArr)
      );

      let temp = tempOriginalArray.filter(obj => {
        if (obj.matterClientClocks && obj.matterClientClocks.length > 0) {
          if (this.clientDetailfilter && this.matterDetailfilter) {
            let tempArr1 = obj.matterClientClocks.filter(
              tc =>
                tc.targetClient &&
                tc.targetMatter &&
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
            let tempArr1 = obj.matterClientClocks.filter(
              tc =>
                tc.targetClient &&
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
          } else if (this.matterDetailfilter) {
            let tempArr1 = obj.matterClientClocks.filter(
              tc =>
                tc.targetMatter &&
                tc.targetMatter.id === this.matterDetailfilter.id
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
      this.attendanceList = this.checkTodayDateInAttendance();
    } else {
      this.attendanceList = [...this.originalArr];
      this.attendanceList = this.checkTodayDateInAttendance();
    }

    const lia = this.attendanceList.map(
      ({ matterClientClocks }) => matterClientClocks
    );
    this.getAllInfo(lia);
  }

  modelChanged() {
    this.valueMustError = false;
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
        let isNegative = decimalTime < 0 ? -1 : 1;
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
      if ((timeObj >= '0' && timeObj <= '9') || timeObj === '') {
        isError = false;
      } else {
        isError = true;
      }
    });
    return isError;
  }

  private setTime(hours: number, minutes: number) {
    this.valueMustError = false;
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
    let isNegative = hour == 0 && +min < 0;
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
      this.chargePrefix =
        this.baseRate < 0 ? '-$' : '$';
    }

    if (showError) {
      this.valueMustError = true;
    }
  }

  public updateSetting() {
    const settings = this.billingSettings;
    settings.timeDisplayFormat = +this.TimeDisplayFormat;

    this.billingService
      .v1BillingSettingsPut$Json({
        body: settings
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        })
      )
      .subscribe(
        id => {
          if (id > 0) {
            const type =
              settings.timeDisplayFormat === 1
                ? 'jira'
                : settings.timeDisplayFormat === 2
                ? 'standard'
                : settings.timeDisplayFormat === 3
                ? 'decimal'
                : 'jira';
            localStorage.setItem('timeformat', type);
            this.addConfigs();
            this.getChargeCode();
            this.getBillingSettings();
            this.getMyTimesheetInfo();
            this.modalService.dismissAll();
            this.toastr.showSuccess(
              this.errorData.timekeeping_settings_save_success
            );
          } else {
            this.showError();
          }
        },
        () => { }
      );
  }

  createSettings() {
    const settings = {
      tenant: {
        id: this.loginUser.tenantId
      },
      timeDisplayFormat: +this.TimeDisplayFormat
    } as vwBillingSettings;

    this.billingService
      .v1BillingSettingsPost$Json({
        body: settings
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        })
      )
      .subscribe(
        id => {
          if (id > 0) {
            this.addConfigs();
            this.getMyTimesheetInfo();
            this.getChargeCode();
            this.getBillingSettings();
            this.getMyTimesheetInfo();
            this.modalService.dismissAll();
            this.toastr.showSuccess(
              this.errorData.timekeeping_settings_save_success
            );
          } else {
            this.showError();
          }
        },
        () => { }
      );
  }

  private showError() {
    this.toastr.showError(this.errorData.error_occured);
  }

  /**
   * Function to copy Billing Narative to Notes
   */
  copytoNote() {
    if (!this.timeEntryForm.controls['note'].value || (this.timeEntryForm.controls['note'].value && this.timeEntryForm.controls['note'].value.trim() == '')) {
      this.timeEntryForm.controls['note'].patchValue(
        this.timeEntryForm.controls['description'].value
      );
    }
  }

  /**
   * calculates total hour of billable to client
   */

  private BillableToClient(
    dType: any
  ): { billableHour: number; billableMin: number } {
    let billableHour = 0;
    let billableMin = 0;

    if (!dType.isNegative) {
      return {
        billableHour: billableHour += dType.hours,
        billableMin: billableMin += dType.minutes
      };
    } else {
      return {
        billableHour: billableHour -= dType.hours,
        billableMin: billableMin -= dType.minutes
      };
    }
  }

  /**
   * calculates total hour of not billable to client
   */
  private notBillableToClient(
    dType: any,
    item: any
  ): { nonbillableHour: number; nonbillableMin: number } {
    let nonbillableHour = 0;
    let nonbillableMin = 0;

    if (!dType.isNegative) {
      return {
        nonbillableHour: nonbillableHour += dType.hours,
        nonbillableMin: nonbillableMin += dType.minutes
      };
    } else {
      return {
        nonbillableHour: nonbillableHour -= dType.hours,
        nonbillableMin: nonbillableMin -= dType.minutes
      };
    }
  }

  /**
   * calculates total rate of billable to client
   */
  private billableToclientRate(dType: any, item: any) {
    const tmin = dType.hours * 60 + dType.minutes;

    if (!item.isFixedFeeMatter && !dType.isNegative) {
      if (dType.billType && dType.billType.code == 'HOURLY') {
        this.BillableRate += tmin * (dType.rate / 60);
      } else {
        this.BillableRate += dType.rate;
      }
    } else {
      if (dType.billType && dType.billType.code == 'HOURLY') {
        this.BillableRate -= tmin * (dType.rate / 60);
      } else {
        this.BillableRate -= dType.rate;
      }
    }
  }

  /**
   * calculates total rate of not billable to client
   */
  private notBillableToClientRate(dType: any, item: any): void {
    const tmin = dType.hours * 60 + dType.minutes;
    if (!item.isFixedFeeMatter && !dType.isNegative) {
      if (dType.billType && dType.billType.code == 'HOURLY') {
        this.NonBillableRate += tmin * (dType.rate / 60);
      } else {
        this.NonBillableRate += dType.rate;
      }
    } else {
      if (dType.billType && dType.billType.code == 'HOURLY') {
        this.NonBillableRate -= tmin * (dType.rate / 60);
      } else {
        this.NonBillableRate -= dType.rate;
      }
    }
  }

  setChargeCodes() {
    this.filterdisbursementTypeListPopUP = this.originalChargeCodes;
  }

  setClientList() {
    this.clientListPopUp = this.originalClientListPopup;
  }

  setMatterList() {
    this.matterListPopUp = this.originalMatterListPopup;
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

  openMenu(index: string, event): void {
    setTimeout(() => {
      if (this.currentActive != index) {
        this.currentActive = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        event.target
          .closest('.dropdown-hover-table')
          .classList.add('datatable-row-hover');
      } else {
        this.currentActive = null;
        event.target
          .closest('.dropdown-hover-table')
          .classList.remove('datatable-row-hover');
      }
    }, 50);
  }
  get isMatterCleared() {
    if (!this.matterDetail && this.code) {
      this.code = null;
    }
    return !this.matterDetail;
  }
  onClickedOutside(event: any, index: string) {
    if (index === this.currentActive) {
      this.currentActive = null;
    }
  }

  public getTimeEditDelete(type) {
    if (type && type.status && type.status.name === 'Billed') {
      return false;
    } else {
      if (
        type &&
        (this.permissionList.BILLING_MANAGEMENTisEdit ||
          this.permissionList.BILLING_MANAGEMENTisAdmin)
      ) {
        return true;
      } else if (
        type &&
        type.status &&
        type.person &&
        (type.status.name === 'Recorded' || type.status.name === 'Deferred') &&
        (this.permissionList.TIMEKEEPING_OTHERSisAdmin || (type.person.id === this.loginUser.id && this.permissionList.TIMEKEEPING_SELFisEdit))
      ) {
        return true;
      } else {
        return false;
      }
    }
  }

  //*** Get Employees/Timekeepers */
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
    if (this.matterDetail && this.matterDetail.id && ((this.timekeeperDetail && this.timekeeperDetail.id) || (this.editTimeDetails && this.editTimeDetails.person && this.editTimeDetails.person.id))) {
      const data = {
        matterId: this.matterDetail.id,
        loggedInPersonId: this.timekeeperDetail ? this.timekeeperDetail.id : this.editTimeDetails ? this.editTimeDetails.person.id : this.loginUser.id
      };
      this.loading = true;
      const res = await this.clockService.v1ClockMatterBaserateGet(data)
        .toPromise();
      if (res != null) {
        const rateData = +JSON.parse(res as any).results;
        this.baseRate = this.isEdit && rateData === 0 ? this.editTimeDetails.rate : rateData;
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
      this.rate = Math.abs(this.baseRate * +this.total_hours);
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
  toggle(matter, index){
    let selectedMatter = this.attendanceList[index];
    selectedMatter.matterClientClocks.map(item => {
      if(item != matter){
        item.showGrid = false;      
      } else {
        matter.showGrid=!matter.showGrid;
      }
    });
  }

  onDetailToggle(matter){
    this.selectedRow = matter;
  }
}
