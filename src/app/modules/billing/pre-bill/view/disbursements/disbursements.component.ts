import { CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { PreBillingModels } from 'src/app/modules/models/vw-prebilling';
import { BillingSettingsHelper, IBillGeneratetionPeriod } from 'src/app/modules/shared/billing-settings-helper';
import * as Constant from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errors from 'src/app/modules/shared/error.json';
import { RecordDisbursementComponent } from 'src/app/modules/shared/record-disbursement/record-disbursement.component';
import { addBlueBorder, removeAllBorders, removeBlueBorder, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwBillingSettings, vwDisbursementType, vwIdCodeName, vwRecordDisbursement } from 'src/common/swagger-providers/models';
import { BillingService, DmsService, TenantService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../../../store';
import { DisbursementWriteDownComponent } from './write-down/write-down.component';

@Component({
  selector: 'app-view-pre-billing-disbursements',
  templateUrl: './disbursements.component.html',
  styleUrls: ['./disbursements.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ViewPreBillingDisbursementsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() prebillingSettings: PreBillingModels.vwPreBilling;
  @Input() isBillingAttorney: boolean;
  @Output() readonly updateList = new EventEmitter();
  @Output() readonly selectedPreBill = new EventEmitter();
  @Input() viewmode: boolean;

  // Disbursment
  @Input() officeBillingSettings: vwBillingSettings;
  @Input() matterDetails: any = {};
  @Input() firmDetails: any = {};
  disbusementStatusList: Array<vwIdCodeName>;
  disbursementTypes: Array<vwDisbursementType>;
  billGenerationPeriod: IBillGeneratetionPeriod;

  // Disbursment

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFoundDisbursements };
  public currentActiveDetls: number;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  disbursementList: Array<PreBillingModels.vwBillingLines>;
  selectedDisbursementList: Array<PreBillingModels.vwBillingLines>;
  currentActive: number;
  public selectedRow: any;
  public errorData = (errors as any).default;
  loading = false;
  private permissionSubscribe: Subscription;
  public permissionList: any = {};

  constructor(
    private modalService: NgbModal,
    private dialogService: DialogService,
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private billingSettingsHelper: BillingSettingsHelper,
    private tenantService: TenantService,
    private dmsService: DmsService,
    private store: Store<fromRoot.AppState>
  ) {
    this.disbursementList = [];
  }
  ngOnDestroy(): void {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }
  ngOnInit(): void {
    if (this.matterDetails) {
      this.updateList.next(true);
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
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  ngOnChanges(changes) {
    if (this.prebillingSettings) {
      this.disbursementList = this.prebillingSettings.recordDisbursement || [];
      this.calculateAmount();
      this.selectedDisbursementList = [...this.disbursementList];
      UtilsHelper.aftertableInit();
    }
    if (changes.hasOwnProperty('viewmode')) {
      this.viewmode = changes.viewmode.currentValue;
    }

    if (changes.hasOwnProperty('prebillingSettings')) {
      removeAllBorders('app-view-pre-billing-disbursements');
    }
  }

  /***
   * function to calculate total amount(amount - write down amount)
   */
  private calculateAmount() {
    this.disbursementList.map(list => {
      list.oriAmount = list.amount;
      if (list.writeDown && list.writeDown.length > 0) {
        const sum = _.sumBy(list.writeDown, a => a.writeDownAmount || 0);
        list.amount = list.amount - sum;
      }
    });
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

  /*** closed menu on body click */
  onClickedOutside(event: any, index: number) {
    if (index === this.currentActive) {
      this.currentActive = null;
    }
  }

  toggleExpandRow(row, expanded, $event) {
    if (this.selectedRow && this.selectedRow.id != row.id) {
      this.table.rowDetail.collapseAllRows();
      removeAllBorders('app-view-pre-billing-disbursements');
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

  writeDown(row: PreBillingModels.vwBillingLines, action: string, detsils: PreBillingModels.IWriteDown) {
    const modalRef = this.modalService.open(DisbursementWriteDownComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'create-new-time-entry modal-xlg'
    });

    modalRef.componentInstance.rowDetails = { ...row };

    switch (action) {
      case 'add':
        modalRef.componentInstance.isEdit = true;
        modalRef.componentInstance.billedAmount = row.amount;
        break;
      case 'edit':
        modalRef.componentInstance.writeDownDetails = detsils;
        modalRef.componentInstance.rowDetails.amount += detsils.writeDownAmount || 0;
        modalRef.componentInstance.title = 'Edit Disbursement Write-Down';
        modalRef.componentInstance.isEdit = true;
        break;
      case 'view':
        modalRef.componentInstance.isView = true;
        modalRef.componentInstance.title = 'View Disbursement Write-Down';
        modalRef.componentInstance.writeDownDetails = detsils;
        break;
    }

    modalRef.result.then(res => {
      if (res) {
        this.updateList.emit(true);
      }
    });
  }

  /**
   * Get summary of amount
   */
  getSummaryOfAmount(cells: number[]) {
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
   * select rows
   *
   */
  public onSelectDisbursement({ selected }) {
    this.selectedDisbursementList.splice(
      0,
      this.selectedDisbursementList.length
    );
    this.selectedDisbursementList.push(...selected);
    this.selectedPreBill.emit({ type: 'disbursement', selected: this.selectedDisbursementList });
  }

  rowIdentity = (row: any) => row.id;

  /**
   * closed menu on body click
   */
  onClickedOutsidedetls(event: any, index: number) {
    if (index === this.currentActiveDetls) {
      this.currentActiveDetls = null;
    }
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

  /****
   * function to call when try to delete the write down
   */
  async removeWriteDown(row: PreBillingModels.IWriteDown) {
    const resp: any = await this.dialogService.confirm(
      this.errorData.time_write_down_delete_warning_message,
      'Yes, delete',
      'Cancel',
      'Delete Write-Down',
      true,
      ''
    );
    if (resp) {
      try {
        await this.billingService.v1BillingWriteDownIdDelete({ id: row.id }).toPromise();
        this.toastr.showSuccess('Disbursement write-down deleted');
        this.updateList.emit(true);
      } catch (err) {
      }
    }
  }
  recordDisbursement() {
    const modalRef = this.modalService.open(RecordDisbursementComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
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
        res.preBillId = this.prebillingSettings.id;

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

        const recordedStatus = this.disbusementStatusList.find(
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
          this.loading = false;
          if (res > 0) {
            this.updateList.next(true);
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
        this.errorData.delete_pre_bill_disbursement_confirm,
        'Yes, Remove Disbursement',
        'Cancel',
        'Remove Disbursement from Pre-Bill',
        true
      )
      .then(res => {
        if (res) {
          this.billingService
            .v1BillingRecordRecordDisbursementIdDelete({
              recordDisbursementId: row.id
            })
            .pipe(
              map(response => {
                return JSON.parse(response as any).results as number;
              }),
              finalize(() => {
              })
            )
            .subscribe(
              resp => {
                if (resp > 0) {
                  if (row.receiptFile) {
                    this.dmsService
                      .v1DmsFileDeleteIdDelete({ id: row.receiptFile.id })
                      .pipe(map(UtilsHelper.mapData))
                      .subscribe(() => {
                        this.updateList.next(true);
                      }, () => {
                      });
                  } else {
                    this.updateList.next(true);
                  }
                  this.toastr.showSuccess(
                    this.errorData.delete_disbursement_success
                  );
                } else {
                  this.toastr.showError(this.errorData.error_occured);
                }
              },
              () => {
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
          this.loading = false;
          if (res > 0) {
            this.updateList.emit(true);
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
