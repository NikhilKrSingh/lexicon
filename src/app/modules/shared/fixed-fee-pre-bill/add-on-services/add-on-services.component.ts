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
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errors from 'src/app/modules/shared/error.json';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { addBlueBorder, removeAllBorders, removeBlueBorder, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwAddWriteDown } from 'src/common/swagger-providers/models';
import { BillingService, MatterService } from 'src/common/swagger-providers/services';
import { AddOnServiceWriteDownComponent } from './write-down/write-down.component';

@Component({
  selector: 'app-add-on-services',
  templateUrl: './add-on-services.component.html',
  styleUrls: ['./add-on-services.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class AddOnServicesComponent implements OnInit, OnDestroy, OnChanges {
  @Input() prebillingSettings: PreBillingModels.vwPreBilling;
  @Input() isAttorney: boolean;
  @Input() isDisabled = false;
  @Input() billNow = false;
  @Output() readonly validateSaveBtn = new EventEmitter<{selected : Array<PreBillingModels.AddOnService>, type: string}>();
  @Input() viewmode: boolean = true;

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected: number = 1;
  public counter = Array;

  @ViewChild(DatatableComponent, { static: true }) table: DatatableComponent;

  addOnServices: Array<PreBillingModels.AddOnService>;

  currentActive: number;
  writedownActive: number;
  activeAddOn: number;

  expandRowEvent: any;
  expandRowId: number;

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};

  totalWriteDown = 0;

  selected = [];
  public error_data = (errors as any).default;
  writeDownList: any = [];
  loading = false;
  selectedRow: any;

  constructor(
    private store: Store<fromRoot.AppState>,
    private modalService: NgbModal,
    private billingService: BillingService,
    private matterService: MatterService,
    private toastr: ToastDisplay,
    private dialogService: DialogService
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
      const data = this.prebillingSettings.addOnServices || [];

      data.forEach((addon) => {
        if (addon.writeDownList && addon.writeDownList.length > 0) {
          addon.writeDown = _.sumBy(
            addon.writeDownList,
            (w) => w.writeDownAmount || 0
          );
        } else {
          addon.writeDown = 0;
        }
      });

      this.totalWriteDown = _.sumBy(data, (a) => a.writeDown);

      if (allSelected) {
        let selectedRows = [...data];
        this.selected = [...selectedRows];
        this.validateSaveBtn.emit({selected: selectedRows, type: 'addon'});
      } else {
        if (this.selected.length > 0) {
          let selectedRows = [...this.selected];
          selectedRows = selectedRows.map(a => {
            let row = data.find(x => x.id == a.id);
            if (row) {
              return row;
            }

            return a;
          });
          this.selected = [...selectedRows];
          this.validateSaveBtn.emit({selected: selectedRows, type: 'addon'});
        }
      }

      this.addOnServices = [...data];
      this.calcTotalPages();
      UtilsHelper.aftertableInit();

      setTimeout(() => {
        if (this.expandRowEvent) {
          if (this.expandRowId) {
            let row = this.addOnServices.find((a) => a.id == this.expandRowId);
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
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.page.totalPages = Math.ceil(
      this.addOnServices.length / this.page.size
    );
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    UtilsHelper.aftertableInit();
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    UtilsHelper.aftertableInit();
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.page.totalElements = this.addOnServices.length;
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
    if (index == this.currentActive) this.currentActive = null;
  }

  toggleExpandRow(row, expanded, $event) {
    if(this.selectedRow && this.selectedRow.id != row.id){
      this.table.rowDetail.collapseAllRows();
      removeAllBorders('app-add-on-services');
    }
    if (expanded) {
      this.table.rowDetail.toggleExpandRow(row);
      removeBlueBorder($event);
    } else {
      this.table.rowDetail.toggleExpandRow(row);
      addBlueBorder($event);
    }
  }
  onDetailToggle(event){
    this.selectedRow = event.value;
  }

  openWriteDownMenu(index: number): void {
    setTimeout(() => {
      if (this.writedownActive != index) {
        this.writedownActive = index;
      } else {
        this.writedownActive = null;
      }
    }, 50);
  }

  /*** closed menu on body click */
  closeMenu(index: number) {
    if (index == this.writedownActive) this.writedownActive = null;
  }

  public onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
    this.validateSaveBtn.emit({selected: selected, type: 'addon'});
  }

  getAllWriteDownCodes() {
    this.billingService.v1BillingWriteDownCodesGet().pipe(map(UtilsHelper.mapData)).subscribe(res => {
      if (res) {
        this.writeDownList = res || [];
      }
    },err => {
    })
  }

  writeDown(
    row: PreBillingModels.AddOnService,
    $event,
    isAdd: boolean,
    writedown: PreBillingModels.IWriteDown
  ) {
    if (isAdd) {
      $event.target.closest('datatable-body-cell').blur();
    }

    let modal = this.modalService.open(AddOnServiceWriteDownComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg',
    });

    this.totalWriteDown = _.sumBy(row.writeDownList, a => a.writeDownAmount || 0);

    const component = modal.componentInstance;

    component.service = { ...row };
    component.edit = !isAdd;
    component.add = isAdd;

    if (row.serviceAmount >= 0) {
      component.writedownAmount = this.totalWriteDown;
    } else {
      component.writedownAmount = this.totalWriteDown * -1;
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
      component.writedownAmount =
        this.totalWriteDown - writedown.writeDownAmount;
      component.writeDown = writedown.writeDownAmount;
      component.writeDownRow = writedown;
      component.service.writeDownReason = writedown.writeDownNarrative;
    }

    modal.result.then((res) => {
      if (res) {
        let body = {
          writeDownCodeId: res.writeDownCodeId,
          writeDownAmount: res.writeDownAmount,
          writeDownNarrative: res.writeDownNarrative,
          applicableDate: new Date().toJSON(),
          addOnServiceId: row.id,
        } as vwAddWriteDown;

        let observable = this.billingService.v1BillingWriteDownPost$Json({
          body: body,
        });

        if (!isAdd && writedown) {
          body['id'] = writedown.id;
          observable = this.billingService.v1BillingWriteDownPut$Json({
            body: body,
          });
        }

        this.loading = true;

        observable.pipe(map(UtilsHelper.mapData)).subscribe(
          (res) => {
            if (res) {
              this.getPrebilling();
              this.expandRowEvent = $event;
              this.expandRowId = row.id;

              if (isAdd) {
                this.toastr.showSuccess(this.error_data.write_down_add_success);
              } else {
                this.toastr.showSuccess(
                  this.error_data.write_down_update_success
                );
              }
            }
          },
          (err) => {
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
            this.prebillingSettings.addOnServices = res.addOns;
            this.preparedata();
            this.loading = false;
          },
          (err) => {
            this.loading = false;
          }
        );
    }
  }

  viewWriteDown(
    row: PreBillingModels.AddOnService,
    writedown: PreBillingModels.IWriteDown
  ) {
    let modal = this.modalService.open(AddOnServiceWriteDownComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg',
    });

    const component = modal.componentInstance;

    component.service = { ...row };
    component.add = false;
    component.edit = false;

    component.writedownAmount = 0;
    component.writeDown = writedown.writeDownAmount;
    component.service.writeDownReason = writedown.writeDownNarrative;
    component.writeDownRow = writedown;
  }

  deleteWriteDown(
    row: PreBillingModels.AddOnService,
    $event,
    writedown: PreBillingModels.IWriteDown
  ) {
    this.dialogService
      .confirm(
        'You are about to delete an add-on write down from this pre-bill. Do you want to continue?',
        'Yes, delete write-down',
        'Cancel',
        'Delete Add-On Write-Down',
        true,
        'modal-lmd'
      )
      .then((res) => {
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
                    .parentNode.previousElementSibling,
                };
                this.expandRowId = row.id;
                this.getPrebilling();
                this.toastr.showSuccess(
                  this.error_data.write_down_delete_success
                );
              },
              (err) => {
                this.loading = false;
              }
            );
        }
      });
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
