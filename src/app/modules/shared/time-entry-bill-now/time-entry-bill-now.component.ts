import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { TimeWriteDownComponent } from 'src/app/modules/billing/pre-bill/view/time/write-down/write-down.component';
import { PreBillingModels } from 'src/app/modules/models/vw-prebilling';
import { CreateNewTimeEntryComponent } from 'src/app/modules/shared/create-new-time-entry/create-new-time-entry.component';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errors from 'src/app/modules/shared/error.json';
import { addBlueBorder, removeAllBorders, removeBlueBorder, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { ClockService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-time-entry-bill-now',
  templateUrl: './time-entry-bill-now.component.html',
  styleUrls: ['./time-entry-bill-now.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TimeEntryBillNowComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild(DatatableComponent, { static: false }) timeentrytable: DatatableComponent;
  @Input() timekeepingList: Array<PreBillingModels.vwBillingLines> = [];
  @Input() isWorkCompleteFlow = false;
  @Input() loginUser;
  @Input() timeWriteDownBtn;
  @Input() workComplete;
  @Input() matterDetails;
  @Input() lastPrebillDate;
  @Input() page = 'bill';
  @Input() timeEntrySelected;
  @Output() readonly getDetails = new EventEmitter<boolean>();
  @Output() readonly removeWriteDown = new EventEmitter<PreBillingModels.IWriteDown>();
  @Output() readonly validateSaveBtn = new EventEmitter<{ selected: Array<PreBillingModels.vwBillingLines>, type: string }>();
  public selectedRow: PreBillingModels.vwBillingLines;
  public currentActive: number;
  public currentActiveDetls: number;
  public error_data = (errors as any).default;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;


  constructor(
    private dialogService: DialogService,
    private clockService: ClockService,
    private modalService: NgbModal,
    private store: Store<fromRoot.AppState>,
  ) {
    this.permissionList$ = this.store.select('permissions');

  }

  ngOnInit() {
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('timekeepingList')) {
      this.timekeepingList = changes.timekeepingList.currentValue;
      this.processData();
      removeAllBorders('app-time-entry-bill-now');
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
          t.amount = t.amount * -1;
        }
        if (t.note && t.note.lastUpdated) {
          t.note.lastUpdated = moment(new Date(moment(t.note.lastUpdated).format('MM/DD/YYYY h:mm:ss A') + ' UTC')).format('MM/DD/YY, h:mm A');
        }
        if (t.writeDown && t.writeDown.length > 0) {
          t.writeDown.map((item) => {
            item.createdAt = moment(new Date(moment(item.createdAt).format('MM/DD/YYYY h:mm:ss A') + ' UTC')).format('MM/DD/YY, h:mm A');
          });
        }
      });
    }
  }

  /**
   *
   * @param row Display
   */
  toggleExpandRow(row, expanded, $event) {
    if (this.selectedRow && this.selectedRow.id != row.id) {
      this.timeentrytable.rowDetail.collapseAllRows();
      removeAllBorders('app-time-entry-bill-now');
    }
    this.timeentrytable.rowDetail.toggleExpandRow(row);

    if (expanded) {
      removeBlueBorder($event);
    } else {
      addBlueBorder($event);
    }
  }

  onDetailToggle(event) {
    this.selectedRow = event.value;
  }

  /*** open menu on action click */
  openMenu(index: number, event, details?): void {
    const active = details ? 'currentActiveDetls' : 'currentActive';

    setTimeout(() => {
      if (this[active] !== index) {
        this[active] = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        event.target
          .closest('.datatable-row-wrapper')
          .classList.add('datatable-row-hover');
      } else {
        this[active] = null;
        event.target
          .closest('.datatable-row-wrapper')
          .classList.remove('datatable-row-hover');
      }
    }, 50);
  }

  /**
   * closed menu on body click
   */
  onClickedOutside(index: number, details?) {
    const active = details ? 'currentActiveDetls' : 'currentActive';
    if (index === this[active]) {
      this[active] = null;
    }
  }

  /**
   * Get summany of hours
   */
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

  /**
   * Get summary of amount
   */
  getSummaryOfAmount(cells: number[]) {
    const filteredCells = cells.filter(cell => !!cell);
    const sum = filteredCells.reduce((a, b) => a + b, 0);
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
   * Get summaary of billable to client
   */
  getSummaryOfBillable(cells: PreBillingModels.vwBillingDisbursementType[]) {
    const filteredCells = cells.filter(cell => (cell.billableTo.name === 'Client' || cell.billableTo.name === 'Both') && !!cell.billableTo.amount);
    let sum = 0;
    if (filteredCells) {
      sum = _.sumBy(filteredCells, a => a.billableTo.amount || 0);
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
              this.getDetails.emit(true);
            }
          },
            () => {
            });
      }
    });
  }

  /**
   * Add time entry
   */
  addEditTimeEntry(action, row: PreBillingModels.vwBillingLines) {
    const modalRef = this.modalService.open(CreateNewTimeEntryComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'create-new-time-entry modal-xlg'
    });
    const component = modalRef.componentInstance;
    if (this.matterDetails.clientName.isCompany) {
      component.searchclient = this.matterDetails.clientName.company;
    } else {
      component.searchclient = this.matterDetails.clientName.lastName + ', ' +
        this.matterDetails.clientName.firstName;
    }
    component.searchMatter = this.matterDetails.matterNumber + ' - ' + this.matterDetails.matterName;
    component.clientDetail = this.matterDetails.clientName;
    component.matterDetail = this.matterDetails;
    if (action === 'edit') {
      component.isEdit = true;
    }
    component.timeEntryDetails = row;
    component.previousPrebillGenerated = moment(this.lastPrebillDate).format('MM/DD/YYYY');

    modalRef.result.then((res) => {
      if (res) {
        this.getDetails.emit(true);
      }
    });
  }

  /**
   * Add/Edit write down for time entry
   */
  public timeWriteDown(row: PreBillingModels.vwBillingLines, action, detsils: PreBillingModels.IWriteDown) {
    const modalRef = this.modalService.open(TimeWriteDownComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'create-new-time-entry modal-xlg'
    });
    modalRef.componentInstance.rowDetails = { ...row };
    modalRef.componentInstance.type = 'timeentry';
    if (action === 'add') {
      modalRef.componentInstance.billedAmount = Math.round(row.amount).toLocaleString();
    }
    if (action === 'edit') {
      modalRef.componentInstance.isEdit = true;
      modalRef.componentInstance.writeDownDetails = detsils;
      modalRef.componentInstance.title = 'Edit Time Write-Down';
      modalRef.componentInstance.rowDetails.amount += detsils.writeDownAmount || 0;
    }
    if (action === 'view') {
      modalRef.componentInstance.isView = true;
      modalRef.componentInstance.title = 'View Time Write-Down';
      modalRef.componentInstance.writeDownDetails = detsils;
    }

    modalRef.result.then((res) => {
      if (res && res.action) {
        this.getDetails.emit(true);
      }
    });
  }
  public removeWriteDownTime(row: PreBillingModels.IWriteDown) {
    this.removeWriteDown.emit(row);
  }

  public onSelectRow(event?: any) {
    if (event && event.selected) {
      this.timeEntrySelected = event.selected;
    } else {
      this.timeEntrySelected = [];
    }
    this.validateSaveBtn.emit({ selected: event.selected, type: 'timeentry' });
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
