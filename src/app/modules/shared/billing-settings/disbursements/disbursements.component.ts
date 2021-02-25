import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page, vwMatterResponse } from 'src/app/modules/models';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwBillingSettings, vwDisbursement, vwDisbursementType, vwIdCodeName, vwRecordDisbursement } from 'src/common/swagger-providers/models';
import { BillingService, DmsService } from 'src/common/swagger-providers/services';
import * as errors from '../../error.json';
import { RecordDisbursementComponent } from '../../record-disbursement/record-disbursement.component';
import { UnsavedChangedClientDialogComponent } from "../../unsaved-changed-client-dialog/unsaved-changed-client-dialog.component";
import { removeAllBorders, UtilsHelper } from '../../utils.helper';

@Component({
  selector: 'app-billing-disbursements',
  templateUrl: './disbursements.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class MatterDisbursementsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() matterDetails: vwMatterResponse;
  @Input() firmDetails: Tenant;
  @Input() officeBillingSettings: vwBillingSettings;

  @Input() isEditRateTable: boolean;
  @Input() updateDisbursMent: Date = null;
  @Output() readonly isEditRateTableChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() isCustomBillingRate: boolean;
  @Output() readonly isCustomBillingRateChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() rateTables = [];
  @Output() readonly rateTablesChange: EventEmitter<any> = new EventEmitter<any>();

  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  disbursements: Array<vwRecordDisbursement>;
  originalDisbursements: Array<vwRecordDisbursement>;
  disbursementTypes: Array<vwDisbursementType>;
  disbusementStatusList: Array<vwIdCodeName>;
  error_data = (errors as any).default;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};

  loading = false;
  selectedRow: any;

  constructor(
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private modalService: NgbModal,
    private store: Store<fromRoot.AppState>,
    private dialogService: DialogService,
    private dmsService: DmsService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    if (this.matterDetails) {
      this.getDisbursements();
      this.getDisbursementType();

      this.billingService
        .v1BillingDisbursementstatusListGet()
        .pipe(
          map(res => {
            return JSON.parse(res as any).results;
          })
        )
        .subscribe(res => {
          this.disbusementStatusList = res;
        });
    }
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('updateDisbursMent')) {
      this.getDisbursementType();
    }
  }

  public getDisbursementType() {
    if (this.matterDetails && this.matterDetails.id) {
      this.billingService.v1BillingDisbursementTypeMatterMatterIdGet({matterId: this.matterDetails.id})
        .pipe(
          map(res => {
            return JSON.parse(res as any).results;
          })
        )
        .subscribe(res => {
          this.disbursementTypes = res;
        });
    }
  }

  private getDisbursements() {
    this.loading = true;
    this.billingService
      .v1BillingRecordMatterMatterIdGet({
        matterId: this.matterDetails.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res: Array<vwRecordDisbursement>) => {
        if (res) {
          this.disbursements = res;
          this.originalDisbursements = [...this.disbursements];

          this.calcTotalPages();
        }
      });
  }

  /**
   * Change Page size from Paginator
   */
  changePageSize() {
    this.page.size = this.pageSelector.value;
    this.calcTotalPages();
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.calcTotalPages();
    }
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.page.totalElements = this.disbursements.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
  }

  toggleExpandRow(row: vwDisbursement) {
    if(this.selectedRow && this.selectedRow.id != row.id){
      this.table.rowDetail.collapseAllRows();
      removeAllBorders('app-billing-disbursements');
    }
    this.table.rowDetail.toggleExpandRow(row);
  }
  onDetailToggle(event) {
    this.selectedRow = event.value;
  }

  edit(row: vwRecordDisbursement, $event) {
    $event.target.closest('datatable-body-cell').blur();
    if (
      row &&
      row.status &&
      (row.status.code == 'RECORDED' ||
        row.status.code == 'PENDING_APPROVAL' ||
        row.status.code == 'NEEDS_FURTHER_REVIEW' ||
        row.status.code == 'APPROVED')
    ) {
      if (this.isEditRateTable) {
        const unsavedChangedClientDialogComponentNgbModalRef = this.modalService.open(UnsavedChangedClientDialogComponent, {
          windowClass: 'modal-md',
          centered: true,
          backdrop: 'static',
        });
        unsavedChangedClientDialogComponentNgbModalRef.componentInstance.isCustomBillingRate = this.isCustomBillingRate;
        unsavedChangedClientDialogComponentNgbModalRef.componentInstance.rateTables = this.rateTables;
        unsavedChangedClientDialogComponentNgbModalRef.result.then((result) => {
          this.isCustomBillingRate = result.isCustomBillingRate;
          this.rateTables = result.rateTables && result.rateTables.length ? result.rateTables : [];
          this.isCustomBillingRateChange.emit(this.isCustomBillingRate);
          this.rateTablesChange.emit(this.rateTables);
        }, () => {
          this.isEditRateTable = false;
          this.isEditRateTableChange.emit(false);
          this.openEditDisbursementModal(row);
        });
      } else {
        this.isEditRateTable = false;
        this.isEditRateTableChange.emit(false);
        this.openEditDisbursementModal(row);
      }
    }
  }

  openEditDisbursementModal(row) {
    const modalRef = this.modalService.open(RecordDisbursementComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });

    if (!row.note) {
      row.note = {
        isVisibleToClient: false,
        applicableDate: new Date() as any,
        name: ''
      };
    }
    modalRef.componentInstance.common = true;
    modalRef.componentInstance.searchclient = this.matterDetails.clientName.isCompany ? this.matterDetails.clientName.company : this.matterDetails.clientName.lastName + ', ' + this.matterDetails.clientName.firstName;
    modalRef.componentInstance.searchMatter = this.matterDetails.matterNumber + ' - ' + this.matterDetails.matterName;
    modalRef.componentInstance.clientDetail = this.matterDetails.clientName;
    modalRef.componentInstance.matterDetail = this.matterDetails;


    modalRef.componentInstance._disbursementTypes = this.disbursementTypes;
    modalRef.componentInstance.recordDisbursement = JSON.parse(JSON.stringify(row));
    modalRef.componentInstance.officeBillingSettings = this.officeBillingSettings;
    modalRef.componentInstance.matterDetails = this.matterDetails;

    modalRef.result.then((res: vwRecordDisbursement) => {
      if (res) {
        if (res && res.note && !res.note.name) {
          res.note = null;
        }
        if (res.disbursementType && !res.disbursementType.isBillableToClient) {
          res.finalBilledAmount = -res.finalBilledAmount;
        }

        this.updateDisbursement(res);
      }
    });
  }

  private updateDisbursement(record: vwRecordDisbursement) {
    this.loading = true;
    this.billingService
      .v1BillingRecordPut$Json({
        body: record
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        }),
        finalize(() => {
        })
      )
      .subscribe(
        res => {
          if (res > 0) {
            this.getDisbursements();
            this.toastr.showSuccess(
              this.error_data.update_disbursement_success
            );
          } else {
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  delete(row: vwRecordDisbursement, $event) {
    $event.target.closest('datatable-body-cell').blur();

    if (
      row &&
      row.status &&
      (row.status.code === 'RECORDED' ||
        row.status.code === 'PENDING_APPROVAL' ||
        row.status.code === 'NEEDS_FURTHER_REVIEW' ||
        row.status.code == 'APPROVED')
    ) {
      this.dialogService
        .confirm(
          this.error_data.delete_disbursement_confirm,
          'Delete',
          'Cancel',
          'Delete Disbursement'
        )
        .then(res => {
          if (res) {
            this.loading = true;
            this.billingService
              .v1BillingRecordRecordDisbursementIdDelete({
                recordDisbursementId: row.id
              })
              .pipe(
                map(res => {
                  return JSON.parse(res as any).results as number;
                }),
                finalize(() => {
                })
              )
              .subscribe(
                res => {
                  if (res > 0) {
                    if (row.receiptFile) {
                      this.dmsService
                      .v1DmsFileDeleteIdDelete({id: row.receiptFile.id})
                      .pipe(map(UtilsHelper.mapData))
                      .subscribe(res => {
                        this.getDisbursements();
                      }, () => {
                      });
                    } else {
                      this.getDisbursements();
                    }
                    this.toastr.showSuccess(
                      this.error_data.delete_disbursement_success
                    );
                  } else {
                    this.toastr.showError(this.error_data.error_occured);
                  }
                },
                () => {
                  this.loading = false;
                }
              );
          }
        });
    }
  }

  recordDisbursement() {
    if (this.isEditRateTable) {
      const unsavedChangedClientDialogComponentNgbModalRef = this.modalService.open(UnsavedChangedClientDialogComponent, {
        windowClass: 'modal-md',
        centered: true,
        backdrop: 'static',
      });
      unsavedChangedClientDialogComponentNgbModalRef.componentInstance.isCustomBillingRate = this.isCustomBillingRate;
      unsavedChangedClientDialogComponentNgbModalRef.componentInstance.rateTables = this.rateTables;
      unsavedChangedClientDialogComponentNgbModalRef.result.then((result) => {
        this.isCustomBillingRate = result.isCustomBillingRate;
        this.rateTables = result.rateTables && result.rateTables.length ? result.rateTables : [];
        this.isCustomBillingRateChange.emit(this.isCustomBillingRate);
        this.rateTablesChange.emit(this.rateTables);
      }, () => {
        this.isEditRateTable = false;
        this.isEditRateTableChange.emit(false);
        this.openDisbursementModal();
      });
    } else {
      this.isEditRateTable = false;
      this.isEditRateTableChange.emit(false);
      this.openDisbursementModal();
    }
  }

  openDisbursementModal() {
    const modalRef = this.modalService.open(RecordDisbursementComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance._disbursementTypes = this.disbursementTypes;
    modalRef.componentInstance.recordDisbursement = {
      disbursementType: {},
      note: {
        isVisibleToClient: false,
        applicableDate: new Date() as any,
        name: ''
      },
      dateOfService: new Date() as any,
      applicableDate: new Date() as any
    };

    modalRef.componentInstance.officeBillingSettings = this.officeBillingSettings;
    modalRef.componentInstance.matterDetails = this.matterDetails;

    modalRef.result.then((res: vwRecordDisbursement) => {
      if (res) {
        if (res && res.note && !res.note.name) {
          res.note = null;
        }

        res.matter = {
          id: this.matterDetails.id
        };

        res.office = {
          id: this.matterDetails.matterPrimaryOffice.id
        };

        res.tenant = {
          id: this.firmDetails.id
        };

        res.person = {
          id: this.matterDetails.clientName.id
        };

        let recordedStatus = this.disbusementStatusList.find(
          a => a.code === 'RECORDED'
        );

        res.status = recordedStatus;

        this.addDisbursement(res);
      }
    });
  }

  private addDisbursement(record: vwRecordDisbursement) {
    this.loading = true;

    this.billingService
      .v1BillingRecordPost$Json({
        body: record
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        }),
        finalize(() => {
        })
      )
      .subscribe(
        res => {
          if (res > 0) {
            this.getDisbursements();
            this.toastr.showSuccess(
              this.error_data.record_disbursement_success
            );
          } else {
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {
          this.loading = false;
        }
      );
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.disbursements) {
      return this.disbursements.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
