import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page } from 'src/app/modules/models';
import { PreBillingModels } from 'src/app/modules/models/vw-prebilling';
import * as errors from 'src/app/modules/shared/error.json';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { addBlueBorder, removeAllBorders, removeBlueBorder, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwAddWriteDown } from 'src/common/swagger-providers/models';
import { BillingService, MatterService } from 'src/common/swagger-providers/services';
import { DeleteFixedFeeWriteDownComponent } from './delete-write-down/delete-write-down.component';
import { FixedFeeWriteDownComponent } from './write-down/write-down.component';

@Component({
  selector: 'app-fixed-fee-services',
  templateUrl: './fixed-fee-services.component.html',
  styleUrls: ['./fixed-fee-services.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class FixedFeeServicesComponent implements OnInit, OnChanges, OnDestroy {
  @Input() prebillingSettings: PreBillingModels.vwPreBilling;
  @Input() isAttorney: boolean;
  @Input() isDisabled = false;
  @Output() readonly validateSaveBtn = new EventEmitter<{ selected: Array<PreBillingModels.FixedFeeService>, type: string }>();
  @Input() billNow = false;
  @Input() viewmode = true;

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;

  expandRowEvent: any;
  expandRowId: any;

  @ViewChild(DatatableComponent, {static: true}) table: DatatableComponent;

  fixedFeeServices: Array<PreBillingModels.FixedFeeService>;

  currentActive: number;
  fixedFeeActive: number;

  @Input() isSelected = true;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};

  public error_data = (errors as any).default;
  writeDownList: any = [];
  loading = false;

  selected: Array<PreBillingModels.FixedFeeService> = [];
  selectedRow: any;

  constructor(
    private store: Store<fromRoot.AppState>,
    private modalService: NgbModal,
    private billingService: BillingService,
    private matterService: MatterService,
    private toastr: ToastDisplay
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;

    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.preparedata(true);

    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
    this.getAllWriteDownCodes();
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('viewmode')) {
      this.viewmode = changes.viewmode.currentValue;
    }
  }

  private preparedata(allSelected = false) {
    if (this.prebillingSettings) {
      const data = this.prebillingSettings.fixedFeeService || [];
      this.fixedFeeServices = [...data];
      this.calcTotalPages();
      UtilsHelper.aftertableInit();

      this.fixedFeeServices.forEach(a => {
        a.totalWriteDown = _.sumBy(a.writeDownList, (item) => item.writeDownAmount || 0
        );
      });

      if (allSelected) {
        const selectedRows = [...data];
        this.validateSaveBtn.emit({selected: selectedRows, type: 'fixedfee'});
        this.selected = [...selectedRows];
      } else {
        if (this.selected.length > 0) {
          const selectedRows = [...this.selected];
          selectedRows.forEach(a => {
            const row = data.find(x => x.id == a.id);
            if (row) {
              a.writeDownList = row.writeDownList;
            }
          });
          this.validateSaveBtn.emit({selected: selectedRows, type: 'fixedfee'});
          this.selected = [...selectedRows];
        }
      }

      setTimeout(() => {
        if (this.expandRowEvent) {
          if (this.expandRowId) {
            const row = this.fixedFeeServices.find((a) => a.id == this.expandRowId);
            if (row && row.writeDownList && row.writeDownList.length > 0) {
              this.table.rowDetail.toggleExpandRow(row);
              addBlueBorder(this.expandRowEvent);
            } else {
              removeBlueBorder(this.expandRowEvent);
            }
          }
          this.expandRowEvent = null;
          this.expandRowId = null;
        }
      }, 500);
    }
  }

  rowIdentity = (a) => a.id;

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.page.totalElements = this.fixedFeeServices.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
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
    if (index == this.currentActive) { this.currentActive = null; }
  }

  openWriteDownMenu(index: number): void {
    setTimeout(() => {
      if (this.fixedFeeActive != index) {
        this.fixedFeeActive = index;
      } else {
        this.fixedFeeActive = null;
      }
    }, 50);
  }

  /*** closed menu on body click */
  closeMenu(index: number) {
    if (index == this.fixedFeeActive) { this.fixedFeeActive = null; }
  }

  toggleExpandRow(row, expanded, $event) {
    if(this.selectedRow && this.selectedRow.id != row.id){
      this.table.rowDetail.collapseAllRows();
      removeAllBorders('app-fixed-fee-services');
    }
    if (expanded) {
      this.table.rowDetail.toggleExpandRow(row);
      removeBlueBorder($event);
    } else {
      this.table.rowDetail.toggleExpandRow(row);
      addBlueBorder($event);
    }
  }
  onDetailToggle(event) {
    this.selectedRow = event.value;
  }

  getAllWriteDownCodes() {
    this.billingService.v1BillingWriteDownCodesGet().pipe(map(UtilsHelper.mapData)).subscribe(res => {
      if (res) {
        this.writeDownList = res || [];
      }
    }, () => {
    });
  }

  writeDown(
    row: PreBillingModels.FixedFeeService,
    $event,
    isAdd: boolean,
    writedown: PreBillingModels.IWriteDown
  ) {
    if (isAdd) {
      $event.target.closest('datatable-body-cell').blur();
    }

    const modal = this.modalService.open(FixedFeeWriteDownComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg',
    });

    const component = modal.componentInstance;

    component.service = {...row};
    component.edit = !isAdd;
    component.add = isAdd;

    if (row.rateAmount >= 0) {
      component.writedownAmount = row.totalWriteDown;
    } else {
      component.writedownAmount = row.totalWriteDown * -1;
    }

    if (isAdd) {
      component.writeDownList = this.writeDownList.filter(d => {
        return d.status === 'Active';
      });
    } else {
      component.writeDownList = this.writeDownList.filter(d => {
        return d.status === 'Active' || writedown.writeDownCodeId == d.id;
      });
    }

    if (!isAdd) {
      component.writedownAmount = row.totalWriteDown - writedown.writeDownAmount;
      component.writeDown = writedown.writeDownAmount;
      component.writeDownRow = writedown;
      component.service.writeDownReason = writedown.writeDownNarrative;
    }

    modal.result.then((res) => {
      if (res) {
        const body = {
          writeDownCodeId: res.writeDownCodeId,
          writeDownAmount: res.writeDownAmount,
          writeDownNarrative: res.writeDownNarrative,
          applicableDate: new Date().toJSON(),
          fixedFeeServiceMappingId: row.id,
        } as vwAddWriteDown;

        let observable = this.billingService.v1BillingWriteDownPost$Json({
          body,
        });

        if (!isAdd && writedown) {
          body.id = writedown.id;
          observable = this.billingService.v1BillingWriteDownPut$Json({
            body,
          });
        }

        this.loading = true;

        observable.pipe(map(UtilsHelper.mapData)).subscribe(
          (result) => {
            if (result) {
              this.expandRowEvent = $event;
              this.expandRowId = row.id;
              this.getPrebilling();
              if (isAdd) {
                this.toastr.showSuccess(this.error_data.write_down_add_success);
              } else {
                this.toastr.showSuccess(
                  this.error_data.write_down_update_success
                );
              }
            }
          },
          () => {
            this.loading = false;
          }
        );
      }
    });
  }

  getPrebilling() {
    if (!this.billNow) {
      this.billingService
        .v1BillingPrebillingPreBillIdGet({
          preBillId: this.prebillingSettings.id,
        })
        .pipe(
          map(UtilsHelper.mapData),
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res && res.length > 0) {
            this.prebillingSettings = res[0];
            this.preparedata();
          }
        });
    } else {
      this.matterService
        .v1MatterUnbilleditemsMatteridGet({
          matterid: this.prebillingSettings.matter.id,
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(
          (res: PreBillingModels.IUnbilleditems) => {
            this.prebillingSettings.fixedFeeService = res.fixedFeeServices;
            this.preparedata();
            this.loading = false;
          },
          () => {
            this.loading = false;
          }
        );
    }
  }

  viewWriteDown(
    row: PreBillingModels.FixedFeeService,
    writedown: PreBillingModels.IWriteDown
  ) {
    const modal = this.modalService.open(FixedFeeWriteDownComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg',
    });

    const component = modal.componentInstance;

    component.service = {...row};
    component.add = false;
    component.edit = false;

    component.writedownAmount = 0;
    component.writeDown = writedown.writeDownAmount;
    component.service.writeDownReason = writedown.writeDownNarrative;
    component.writeDownRow = writedown;
  }

  deleteWriteDown(
    row: PreBillingModels.FixedFeeService,
    $event,
    writedown: PreBillingModels.IWriteDown
  ) {
    const modal = this.modalService.open(DeleteFixedFeeWriteDownComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-lmd',
    });

    modal.result.then((res) => {
      if (res) {
        this.loading = true;
        this.billingService
          .v1BillingWriteDownIdDelete({
            id: writedown.id,
          })
          .pipe(map(UtilsHelper.mapData))
          .subscribe(
            () => {
              this.expandRowEvent = {
                target: $event.target.closest('table').parentElement
                  .previousElementSibling,
              };
              this.expandRowId = row.id;
              this.getPrebilling();
              this.toastr.showSuccess(
                this.error_data.write_down_delete_success
              );
            },
            () => {
              this.loading = false;
            }
          );
      }
    });
  }

  public onSelect({selected}) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
    this.validateSaveBtn.emit({selected, type: 'fixedfee'});
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
