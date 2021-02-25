import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { vwMatterResponse } from 'src/app/modules/models';
import { PreBillingModels } from 'src/app/modules/models/vw-prebilling';
import { CreateNewTimeEntryComponent } from 'src/app/modules/shared/create-new-time-entry/create-new-time-entry.component';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errors from 'src/app/modules/shared/error.json';
import { addBlueBorder, removeAllBorders, removeBlueBorder, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { BillingService, ClockService, MatterService } from 'src/common/swagger-providers/services';
import { TimeWriteDownComponent } from './write-down/write-down.component';
import { ToastDisplay } from 'src/app/guards/toast-service';

@Component({
  selector: 'app-view-pre-billing-time',
  templateUrl: './time.component.html',
  styleUrls: ['./time.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ViewPreBillingTimeComponent implements OnChanges, OnInit, OnDestroy {
  @Input() prebillingSettings: PreBillingModels.vwPreBilling;
  @Input() isBillingAttorney: boolean;
  @Input() viewmode: boolean;
  @Input() matterDetails: vwMatterResponse;
  @Output() readonly selectedPreBill = new EventEmitter();
  @Output() readonly updateList = new EventEmitter<boolean>();

  closeResult: string;

  public isEdit: boolean = false;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  timekeepingList: Array<PreBillingModels.vwBillingLines>;
  selectedTimeList: Array<PreBillingModels.vwBillingLines>;
  currentActive: number;
  public matterId: number;
  public previousPrebillGenerated: string;
  public rows: Array<any> = [];
  public oriArr: Array<any> = [];
  public columns: any = [];
  public myTimesheetDetail: Array<any> = [];
  public arr: any = [-1, -2];
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public error_data = (errors as any).default;
  public currentActiveDetls: number;
  public loginUser: any;
  public isWriteDown: Boolean = true;
  public show = false;
  selectedRow: any;
  constructor(
    private store: Store<fromRoot.AppState>,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private matterService: MatterService,
    private clockService: ClockService,
    private dialogService: DialogService,
    private billingService: BillingService,
    private toasterDisplay: ToastDisplay,
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.timekeepingList = [];
  }

  ngOnInit() {
    this.loginUser = UtilsHelper.getLoginUser();
    this.route.queryParams.subscribe(params => {
      let matterId = params['matterId'];
      this.matterId = +matterId;
    });

    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('prebillingSettings')) {
      let newData = changes.prebillingSettings.currentValue;
      this.timekeepingList = newData.timeEntries || [];
      this.selectedTimeList = [...this.timekeepingList];
      this.calculateAmount();
      this.processData();
      UtilsHelper.aftertableInit();

      if (changes.hasOwnProperty('prebillingSettings')) {
        removeAllBorders('app-view-pre-billing-time');
      }
    }
    if (changes.hasOwnProperty('viewmode')) {
      this.viewmode = changes.viewmode.currentValue;
    }
    if (changes.hasOwnProperty('isBillingAttorney')) {
      this.isBillingAttorney = changes.isBillingAttorney.currentValue;
    }
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  private processData() {
    if (this.timekeepingList && this.timekeepingList.length > 0) {
      this.timekeepingList.forEach(t => {
        if (t.isNegative) {
          if (t.hours) {
            t.hours.isNegative = true;
          }

          if (t.disbursementType) {
            t.disbursementType.isNegative = true;
            if (t.disbursementType.billableTo) {
              t.disbursementType.billableTo.amount = t.disbursementType.billableTo.amount * -1;
            }
          }

          t.amount  = t.amount * -1;
        }
      });
    }
  }

  private calculateAmount() {
    this.timekeepingList.forEach(time => {
      if (time.disbursementType.billingType.name == 'Fixed') {
        time.amount = time.disbursementType.rate;
      } else {
        const tmin = time.hours.value.hours * 60 + time.hours.value.minutes;
        time.amount = tmin * (time.disbursementType.rate / 60);
      }
      time.oriAmount = time.amount;
      if (time.writeDown && time.writeDown.length > 0) {
        let sum = _.sumBy(time.writeDown, a => a.writeDownAmount || 0);
        time.amount = time.amount - sum;
      }
    });
  }

  getSummaryOfTime(cells: PreBillingModels.Hours[]) {
    try {
      const filteredCells = cells.filter(cell => !!cell.hasValue);
      let sumhours = filteredCells.reduce((a, b) => {
        if (b.isNegative) {
          return a - b.value.hours;
        } else {
          return a + b.value.hours;
        }
      }, 0);

      let sumMinutes = filteredCells.reduce((a, b) => {
        if (b.isNegative) {
          return a - b.value.minutes;
        } else {
          return a + b.value.minutes;
        }
      }, 0);
      sumhours += Math.floor(Math.abs(sumMinutes) / 60);
      sumMinutes = sumMinutes % 60;
      if (sumhours) {
        if (sumMinutes) {
          if (sumhours < 0 || sumMinutes < 0) {
            return `-${Math.abs(sumhours)}h ${Math.abs(sumMinutes)}m`;
          } else {
            return `${sumhours}h ${sumMinutes}m`;
          }
        } else {
          if (sumhours >= 0) {
            return `${sumhours}h`;
          } else {
            return `-${Math.abs(sumhours)}h`;
          }
        }
      } else {
        if (sumMinutes >= 0) {
          return `${sumMinutes}m`;
        } else {
          return `-${Math.abs(sumMinutes)}m`;
        }
      }
    } catch {
      return null;
    }
  }

  getSummaryOfAmount(cells: number[]) {
    const filteredCells = cells.filter(cell => !!cell);
    let sum = filteredCells.reduce((a, b) => a + b, 0);
    if (sum) {
      return sum.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } else {
      return null;
    }
  }

  /**
   * function to get total of billable client account
   */
  get getBillableAccount() {
    const filteredRows = this.timekeepingList.filter(list => ((list.disbursementType && list.disbursementType.billableTo && list.disbursementType.billableTo.name === "Client") || (list.disbursementType && list.disbursementType.billableTo && list.disbursementType.billableTo.name === "Both")));
    let sum = 0;
    if (filteredRows) {
      filteredRows.map(item => {
        sum = sum + item.amount;
      })
    }
    if (sum) {
      return sum.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } else {
      return null;
    }
  }

  /*** open menu on action click */
  openMenu(index: number, event): void {
    setTimeout(() => {
      if (this.currentActive != index) {
        this.currentActive = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        event.target
          .closest('.datatable-row-wrapper')
          .classList.add('datatable-row-hover');
      } else {
        this.currentActive = null;
        event.target
          .closest('.datatable-row-wrapper')
          .classList.remove('datatable-row-hover');
      }
    }, 50);
  }

  /*** closed menu on body click */
  onClickedOutside(event: any, index: number) {
    if (index == this.currentActive) this.currentActive = null;
  }

  toggleExpandRow(row, expanded, $event) {
    if (this.selectedRow && this.selectedRow.id != row.id) {
      this.table.rowDetail.collapseAllRows();
      removeAllBorders('app-view-pre-billing-time');
    }
    this.table.rowDetail.toggleExpandRow(row);
    if (expanded) {
      removeBlueBorder($event);
    } else {
      addBlueBorder($event);
    }
  }
  onDetailToggle(event) {
    this.selectedRow = event.value;
  }

  addTimeEntry(action, row: PreBillingModels.vwBillingLines, size?) {
    let modalRef = this.modalService.open(CreateNewTimeEntryComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size,
      windowClass: 'modal-xlg'
    });
    let component = modalRef.componentInstance;
    if (this.matterDetails.clientName.isCompany) {
      component.searchclient = this.matterDetails.clientName.company;
    } else {
      component.searchclient = this.matterDetails.clientName.lastName + ', ' +
        this.matterDetails.clientName.firstName
    }
    component.searchMatter = this.matterDetails.matterNumber + ' - ' + this.matterDetails.matterName;
    component.clientDetail = this.matterDetails.clientName;
    component.matterDetail = this.matterDetails;
    component.preBillId = this.prebillingSettings.id;
    if (action === 'edit') {
      component.isEdit = true;
    }
    component.timeEntryDetails = row;
    if (this.prebillingSettings && this.prebillingSettings.createdAt) {
      component.lastBillDate = (this.prebillingSettings.lastBillDate) ? moment(this.prebillingSettings.lastBillDate).format('MM/DD/YYYY') :
        moment(this.matterDetails.matterOpenDate).format('MM/DD/YYYY');
      component.createdAt = moment(this.prebillingSettings.createdAt).format('MM/DD/YYYY');
    }

    modalRef.result.then((res) => {
      if (res) {
        this.updateList.emit(true);
      }
    });
  }

  /**
   * Remove time entry
   */
  public removeTimeEntry(row: PreBillingModels.vwBillingLines) {
    this.dialogService.confirm(
      this.error_data.time_entry_delete_warning_message,
      'Yes, remove time',
      'Cancel',
      'Remove Time from Pre-Bill',
      true,
      'modal-lmd'
    ).then(response => {
      if (response) {
        this.clockService
          .v1ClockDelete$Json({ body: { id: row.id } })
          .pipe(map(UtilsHelper.mapData))
          .subscribe(res => {
            if (res) {
              this.toasterDisplay.showSuccess(
                this.error_data.time_entry_deleted_successfully
              );
              this.updateList.emit(true);
            }
          },
            () => {
            });
      }
    });
  }

  /**
  * Get details of time entry, disbusment, write offs
  */
  public getDetails() {
    this.matterService.v1MatterUnbilleditemsMatteridGet({ matterid: this.matterId })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        this.timekeepingList = res.timeEntries;
        this.calculateAmount();
      }, (err) => {
      });
  }

  /*** open menu on action click */
  openMenudetls(index: number, event): void {
    setTimeout(() => {
      if (this.currentActiveDetls != index) {
        this.currentActiveDetls = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        event.target
          .closest('.datatable-row-wrapper')
          .classList.add('datatable-row-hover');
      } else {
        this.currentActiveDetls = null;
        event.target
          .closest('.datatable-row-wrapper')
          .classList.remove('datatable-row-hover');
      }
    }, 50);
  }
  /**
   * closed menu on body click
   * @param event
   * @param index
   */
  onClickedOutsidedetls(event: any, index: number) {
    if (index == this.currentActiveDetls) this.currentActiveDetls = null;
  }

  /**
   * Add/Edit write down for time entry
   * @param row
   * @param action
   */
  public timeWriteDown(row: PreBillingModels.vwBillingLines, action, detsils: PreBillingModels.IWriteDown) {
    let modalRef = this.modalService.open(TimeWriteDownComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'create-new-time-entry modal-xlg'
    });
    modalRef.componentInstance.rowDetails = {...row};
    modalRef.componentInstance.type = 'timeentry';

    if (action == 'add') {
      modalRef.componentInstance.billedAmount = Number(row.amount).toFixed(2);
    }

    if (action === 'edit') {
      modalRef.componentInstance.isEdit = true;
      modalRef.componentInstance.writeDownDetails = detsils;
      modalRef.componentInstance.title = "Edit Time Write-Down";
      modalRef.componentInstance.rowDetails.amount += detsils.writeDownAmount || 0;
    }

    if (action === 'view') {
      modalRef.componentInstance.isView = true;
      modalRef.componentInstance.title = "View Time Write-Down";
      modalRef.componentInstance.writeDownDetails = detsils;
      modalRef.componentInstance.rowDetails.amount += detsils.writeDownAmount || 0;
    }

    modalRef.result.then((res) => {
      if (res && res.action) {
        this.updateList.emit(true);
      }
    });
  }

  public removeWriteDown(row: PreBillingModels.IWriteDown) {
    this.dialogService.confirm(
      this.error_data.time_write_down_delete_warning_message,
      'Yes, delete',
      'Cancel',
      'Delete Write-Down',
      true,
      ''
    ).then(response => {
      if (response) {
        this.billingService.v1BillingWriteDownIdDelete({ id: row.id })
          .pipe(map(UtilsHelper.mapData))
          .subscribe(res => {
            if (res) {
              this.toasterDisplay.showSuccess('Time entry write-down deleted.');
              this.updateList.emit(true);
            }
          },
            () => {
            });
      }
    });
  }

  /**
   * select rows
   */
  public onSelectDisbursement({ selected }) {
    this.selectedTimeList.splice(
      0,
      this.selectedTimeList.length
    );
    this.selectedTimeList.push(...selected);
    this.selectedPreBill.emit({ type: 'time', selected: this.selectedTimeList })
  }

  rowIdentity = (row) => { return row.id }

  changeToggleEntryWrite(type) {
    if (type === 'write') {
      this.isWriteDown = true;
    } else {
      this.isWriteDown = false;
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
