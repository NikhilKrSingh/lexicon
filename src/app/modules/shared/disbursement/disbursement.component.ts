import { CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { DisbursementWriteDownComponent } from 'src/app/modules/billing/pre-bill/view/disbursements/write-down/write-down.component';
import { PreBillingModels } from 'src/app/modules/models/vw-prebilling';
import * as errors from 'src/app/modules/shared/error.json';
import { addBlueBorder, removeAllBorders, removeBlueBorder, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwBillingSettings, vwDisbursementType, vwIdCodeName, vwRecordDisbursement } from 'src/common/swagger-providers/models';
import { BillingService, DmsService, TenantService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import { BillingSettingsHelper, IBillGeneratetionPeriod } from '../billing-settings-helper';
import { DialogService } from '../dialog.service';
import { RecordDisbursementComponent } from '../record-disbursement/record-disbursement.component';

@Component({
  selector: 'app-disbursement',
  templateUrl: './disbursement.component.html',
  styleUrls: ['./disbursement.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DisbursementComponent implements OnInit, OnDestroy {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @Input() disbursementList: Array<PreBillingModels.vwBillingLines> = [];
  @Input() isWorkCompleteFlow = false;
  @Input() loginUser;
  @Input() timeWriteDownBtn;
  @Input() workComplete;
  @Input() disbursementSelected;
  @Input() isBillNow = true;
  @Output() readonly getDetails = new EventEmitter<boolean>();
  @Output() readonly removeWriteDown = new EventEmitter<PreBillingModels.IWriteDown>();
  @Output() readonly validateSaveBtn = new EventEmitter<{ selected: Array<PreBillingModels.vwBillingLines>, type: string }>();

  // Disbursment
  @Input() officeBillingSettings: vwBillingSettings;
  @Input() matterDetails: any = {};
  @Input() firmDetails: any = {};
  disbusementStatusList: Array<vwIdCodeName>;
  disbursementTypes: Array<vwDisbursementType>;
  billGenerationPeriod: IBillGeneratetionPeriod;
  public errorData = (errors as any).default;
  @Input() prebillingSettings: PreBillingModels.vwPreBilling;
  // Disbursment
  public currentActive: number;
  public currentActiveDetls: number;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public writeDownBtn = false;
  public selectedRow: PreBillingModels.vwBillingLines;
  loading = false;
  private permissionSubscribe: Subscription;
  public permissionList: any = {};

  constructor(
    private modalService: NgbModal,
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private billingSettingsHelper: BillingSettingsHelper,
    private tenantService: TenantService,
    private dmsService: DmsService,
    private dialogService: DialogService,
    private store: Store<fromRoot.AppState>,
  ) { }

  ngOnDestroy(): void {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  ngOnInit(): void {
    if (this.matterDetails) {
      this.getDetails.next(true);
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
    if (this.matterDetails) {
      this.getOfficeBillingSettings();
      this.getTenantData();
    }
    // permission Subscribe
    this.permissionSubscribe = this.store.select('permissions').subscribe((obj) => {
      if (obj && obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('workComplete')) {
      this.workComplete = changes.workComplete.currentValue;
    }
    if (changes.hasOwnProperty('timeWriteDownBtn')) {
      this.writeDownBtn = changes.timeWriteDownBtn.currentValue;
    }
    if (changes.hasOwnProperty('disbursementList')) {
      this.disbursementList = changes.disbursementList.currentValue;
      removeAllBorders('app-disbursement');
    }
  }

  /**
   *
   * @param row Display
   */
  toggleExpandRow(row, expanded, $event) {
    if (this.selectedRow && this.selectedRow.id != row.id) {
      this.table.rowDetail.collapseAllRows();
      removeAllBorders('app-disbursement');
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


  /*** open menu on action click */
  openMenu(index: number, event): void {
    setTimeout(() => {
      if (this.currentActive !== index) {
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

  /*** open menu on action click */
  openMenudetls(index: number, event): void {
    setTimeout(() => {
      if (this.currentActiveDetls !== index) {
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
   * Get summary for disbursement amount
   */
  public getSummaryOfAmountDisb(cells: number[]) {
    const filteredCells = cells.filter(cell => !!cell);
    const sum = filteredCells.reduce((a, b) => a + b, 0);
    if (sum) {
      let cp = new CurrencyPipe('en-US');
      return cp.transform(sum || 0, 'USD', 'symbol', '1.2-2');
    } else {
      return null;
    }
  }

  /**
   * function to get total of billable client account
   */
  get getBillableAccount() {
    const filteredRows = this.disbursementList.filter(list => list.disbursementType.isBillable);
    const sum = filteredRows.reduce((a, b) => {
      return a + b.amount;
    }, 0);
    if (sum) {
      let cp = new CurrencyPipe('en-US');
      return cp.transform(sum || 0, 'USD', 'symbol', '1.2-2');
    } else {
      return null;
    }

  }

  /**
   * closed menu on body click
   */
  onClickedOutsidedetls(event: any, index: number) {
    if (index === this.currentActiveDetls) {
      this.currentActiveDetls = null;
    }
  }

  /**
   * closed menu on body click
   */
  onClickedOutside(event: any, index: number) {
    if (index === this.currentActive) {
      this.currentActive = null;
    }
  }

  /**
   * Add/Edit write down for time entry
   */
  disbWriteDown(row: PreBillingModels.vwBillingLines, action: string, detsils: PreBillingModels.IWriteDown) {
    const modalRef = this.modalService.open(DisbursementWriteDownComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'create-new-time-entry modal-xlg'
    });
    modalRef.componentInstance.rowDetails = { ...row };
    if (action === 'add') {
      modalRef.componentInstance.billedAmount = row.amount;
    }
    if (action === 'edit') {
      modalRef.componentInstance.writeDownDetails = detsils;
      modalRef.componentInstance.title = 'Edit Disbursement Write-Down';
      modalRef.componentInstance.rowDetails.amount += detsils.writeDownAmount || 0;
      modalRef.componentInstance.isEdit = true;
    }
    if (action === 'view') {
      modalRef.componentInstance.isView = true;
      modalRef.componentInstance.title = 'View Disbursement Write-Down';
      modalRef.componentInstance.writeDownDetails = detsils;
    }

    modalRef.result.then(res => {
      if (res) {
        this.getDetails.emit(true);
      }
    });
  }


  public removeWriteDownDisb(row: PreBillingModels.IWriteDown) {
    this.removeWriteDown.emit(row);
  }

  public onSelect(event?: any) {
    this.disbursementSelected = (event && event.selected) ? event.selected : [];
    this.validateSaveBtn.emit({ selected: event.selected, type: 'disbursement' });
  }

  recordDisbursement() {
    const modalRef = this.modalService.open(RecordDisbursementComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    const component = modalRef.componentInstance;

    component.searchclient = this.matterDetails.clientName.isCompany ? this.matterDetails.clientName.company : this.matterDetails.clientName.lastName + ', ' + this.matterDetails.clientName.firstName;
    component.searchMatter = this.matterDetails.matterNumber + ' - ' + this.matterDetails.matterName;
    component.clientDetail = this.matterDetails.clientName;
    component.matterDetail = this.matterDetails;
    component._disbursementTypes = this.disbursementTypes;
    component.recordDisbursement = {
      disbursementType: {},
      note: {
        isVisibleToClient: false,
        applicableDate: new Date() as any,
        name: ''
      },
      dateOfService: new Date() as any,
      applicableDate: new Date() as any
    };

    component.officeBillingSettings = this.officeBillingSettings;
    component.matterDetails = this.matterDetails;
    component.common = true;
    modalRef.result.then((res: any) => {
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

        res.status = this.disbusementStatusList.find(
          a => a.code === 'RECORDED'
        );

        this.addDisbursement(res);
      }
    });
  }
  public addDisbursement(record: vwRecordDisbursement) {
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
          this.loading = false;
          if (res > 0) {
            this.getDetails.next(true);
            this.toastr.showSuccess(
              this.errorData.record_disbursement_success
            );
          } else {
            this.toastr.showError(this.errorData.error_occured);
          }
        },
        () => {
          this.loading = false;
        }
      );
  }
  private getOfficeBillingSettings() {
    this.billingService
      .v1BillingSettingsOfficeOfficeIdGet({
        officeId: this.matterDetails.matterPrimaryOffice.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwBillingSettings>;
        })
      )
      .subscribe(res => {
        if (res && res.length > 0) {
          this.officeBillingSettings = res[0];
        } else {
          this.officeBillingSettings = {};
        }

        this.billGenerationPeriod = this.billingSettingsHelper.getBillGenerationPeriod(
          this.officeBillingSettings
        );
      });
  }
  private getTenantData() {
    this.tenantService
      .v1TenantGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        })
      )
      .subscribe(res => {
        this.firmDetails = res;
      });
  }

  delete(row: vwRecordDisbursement, $event) {
    if ($event.target) {
      $event.target.closest('datatable-body-cell').blur();
    }
    this.dialogService
      .confirm(
        this.isBillNow ? this.errorData.remove_disbursement_bill_now_message : this.errorData.remove_disbursement_edit_charges_message,
        'Yes, Remove Disbursement',
        'Cancel',
        this.isBillNow ? this.errorData.remove_disbursement_bill_now : this.errorData.remove_disbursement_edit_charges,
        true
      )
      .then(res => {
        if (res) {
          this.loading = true;
          this.billingService
            .v1BillingRecordRecordDisbursementIdDelete({
              recordDisbursementId: row.id
            })
            .subscribe(
              resp => {
                const response = JSON.parse(resp as any).results as number;
                if (response > 0) {
                  if (row.receiptFile) {
                    this.dmsService
                      .v1DmsFileDeleteIdDelete({ id: row.receiptFile.id })
                      .pipe(map(UtilsHelper.mapData))
                      .subscribe(() => {
                        this.getDetails.next(true);
                        this.loading = false;
                      }, () => {
                        this.loading = false;
                      });
                  } else {
                    this.loading = false;
                    this.getDetails.next(true);
                  }
                  this.toastr.showSuccess(
                    this.errorData.delete_disbursement_success
                  );
                } else {
                  this.loading = false;
                  this.toastr.showError(this.errorData.error_occured);
                }
              },
              () => {
                this.loading = false;
              }
            );
        }
      });
  }
  edit(row: vwRecordDisbursement, $event) {
    this.loading = true;
    this.billingService.v1BillingRecordRecordDisbursementIdGet({ recordDisbursementId: row.id }).subscribe((resp: any) => {
      this.loading = false;
      resp = JSON.parse(resp).results;
      if ($event.target) {
        $event.target.closest('datatable-body-cell').blur();
      }
      const modalRef = this.modalService.open(RecordDisbursementComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        size: 'xl'
      });

      if (!resp.note) {
        resp.note = {
          isVisibleToClient: false,
          applicableDate: new Date() as any,
          name: ''
        };
      }

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
      component.common = true;
      component._disbursementTypes = this.disbursementTypes;
      component.recordDisbursement = resp;
      component.officeBillingSettings = this.officeBillingSettings;
      component.matterDetails = this.matterDetails;
      modalRef.result.then((res: vwRecordDisbursement) => {
        if (res) {
          if (res && res.createdBy) {
            delete res.createdBy;
          }

          if (res && res.note && !res.note.name) {
            res.note = null;
          }

          if (res && res.note && res.note.createdBy) {
            delete res.note.createdBy;
          }

          if (!res.disbursementType.isBillableToClient) {
            res.finalBilledAmount = -res.finalBilledAmount;
          }
          this.updateDisbursement(res);
        }
      });
    }, () => {
      this.loading = false;
    });
  }
  public updateDisbursement(record: vwRecordDisbursement) {
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
          this.loading = false;
          if (res > 0) {
            this.getDetails.emit(true);
            this.toastr.showSuccess(
              this.errorData.update_disbursement_success
            );
          } else {
            this.toastr.showError(this.errorData.error_occured);
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
}
