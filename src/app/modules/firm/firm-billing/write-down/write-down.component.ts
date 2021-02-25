import { Component, EventEmitter, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { BillingCodeTypesEnum } from 'src/app/modules/models/billing-code.type.js';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { Page } from 'src/app/modules/models/page';
import { vwUsedBillingCodes } from 'src/app/modules/models/used-billing-code.model';
import { vwLookupValuesBilling } from 'src/app/modules/models/vw-id-name-billing-codes';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper.js';
import { vwDisbursement, vwIdCodeName, vwRate, vwWriteDownCode } from 'src/common/swagger-providers/models';
import { BillingService, TenantService } from 'src/common/swagger-providers/services';
import * as errors from '../../../shared/error.json';
import { CommonCreateCodeComponent } from '../common-create-code/common-create-code.component';
import { EditWriteDownComponent } from './edit-write-down/edit-write-down.component';

@Component({
  selector: 'app-write-down',
  templateUrl: './write-down.component.html',
  styleUrls: ['./write-down.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class WriteDownComponent implements OnInit {
	error_data = (errors as any).default;
  firmDetails: Tenant;
  originalWriteDownCodes: Array<vwWriteDownCode>;
  writeDownCodes: Array<vwWriteDownCode>;
  statusList: Array<any>;
  billingTo: number;
  billType: number;
  status: string;
  name: string;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public loading = true;
  originalChargeCodes: Array<vwRate>;
  chargeCodes: Array<vwRate>;
  currentActive: number;

  @Output() readonly modalType = new EventEmitter<any>();

   @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  listLoaded = false;
  usedCodeRange: vwUsedBillingCodes;
  public selected: Array<vwWriteDownCode> = [];
  showDisableBulkAction = false;
  showEnableBulkAction = false;
  selectedCode: vwWriteDownCode;
  tenantTierName: string;
  showCodeSelectionWarning = false;
  isBulkEnableDisable = false;
  selectedEnableDisableIds = [];

  listItems: Array<vwLookupValuesBilling> = [];

  constructor(
  	private modalService: NgbModal,
    private billingService: BillingService,
    private tenantService: TenantService,
    private toastr: ToastDisplay,
    private router: Router,
    private pagetitle: Title,
    private activeModal: NgbActiveModal
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.statusList = [
      {
        id: 'Active',
        name: 'Active'
      },
      {
        id: 'Disabled',
        name: 'Disabled'
      }
    ];
  }


  ngOnInit() {
    this.pagetitle.setTitle('Write-Down Codes');
    const userInfo: any = UtilsHelper.getLoginUser();
    if (userInfo && userInfo.tenantTier) {
      this.tenantTierName = userInfo.tenantTier.tierName;
      this.firmDetails = {
        id: userInfo.tenantId
      } as any;
    }

    if (this.firmDetails) {
      this.getUsedBillingCodes(() => {
        this.getListItems();
      });
    } else {
      this.showError();
    }
  }

  private getUsedBillingCodes(onSuccess = () => {}) {
    this.billingService
      .v1BillingUsedBillingCodesGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.usedCodeRange = res;
        onSuccess();
      }, () => {
        this.loading = false;
      });
  }

  private showError() {
    this.loading = false;
  }

  private getListItems() {
    this.billingService.v1BillingBillingcodelistitemsGet().pipe(
      map(res => {
        return JSON.parse(res as any).results as Array<vwLookupValuesBilling>;
      })
    ).pipe(
        finalize(() => {
          this.getWriteDownCodes();
        })
      )
      .subscribe(res => {
        if (res && res.length > 0) {
          this.listItems = res || [];
          this.listLoaded = true;
        } else {
          this.listLoaded = true;
        }
      }, () => {
        this.loading = false;
      });
  }

  private getWriteDownCodes() {
    this.billingService
      .v1BillingWriteDownCodesGet({
        tenantId: this.firmDetails.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwWriteDownCode[];
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          if (res) {
            this.name = null;
            this.originalWriteDownCodes = res || [];
            this.originalWriteDownCodes = _.orderBy(
              this.originalWriteDownCodes,
              a => a.code,
              'asc'
            );
            this.writeDownCodes = [...this.originalWriteDownCodes];

            this.page.totalElements = this.originalWriteDownCodes.length;
            this.page.totalPages = Math.ceil(
              this.originalWriteDownCodes.length / this.page.size
            );
            this.loading = false;

            this.applyFilter();
          } else {
            this.showError();
            this.loading = false;
          }
        },
        () => {
          this.showError();
          this.loading = false;
        }
      );
  }


  createWriteDownCode() {
    let modalRef = this.modalService.open(CommonCreateCodeComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.firmDetails = this.firmDetails;
    modalRef.componentInstance.allBillingCodeListItems = this.listItems;
    modalRef.componentInstance.modalType = 'writeDown';
    modalRef.componentInstance.name = this.name;
    modalRef.componentInstance.usedCodeRange = this.usedCodeRange;

    modalRef.result.then(res => {
      if (res) {
        if (res.modalType == 'disbursement') {
        	this.loading = true;
          this.billingService
            .v1BillingDisbursementTypePost$Json({
              body: res
            })
            .pipe(
              map(res => {
                return JSON.parse(res as any).results as number;
              })
            )
            .subscribe(
              id => {
                if (id > 0) {
                  this.getUsedBillingCodes(() => {
                    this.toastr.showSuccess(
                      this.error_data.disbursement_type_add_success
                    );
                    this.loading = false;
                  });
                } else {
                  this.showError();
                }
              },
              () => {
                this.showError();
              }
            );
        }
        if (res.modalType == 'hourly') {
          this.loading = true;
          this.billingService
            .v1BillingRatePost$Json({
              body: res
            })
            .pipe(
              map(res => {
                return JSON.parse(res as any).results as number;
              })
            )
            .subscribe(
              rateId => {
                if (rateId > 0) {
                  this.getUsedBillingCodes(() => {
                    this.toastr.showSuccess(
                      this.error_data.charge_code_add_success
                    );
                    this.loading = false;
                  });
                } else {
                  this.loading = false;
                }
              },
              () => {
                this.loading = false;
              }
            );
        }
        if (res.modalType == 'writeOff') {
          this.loading = true;
          this.billingService
            .v1BillingWriteOffCodePost$Json({
              body: res
            })
            .pipe(
              map(res => {
                return JSON.parse(res as any).results as number;
              })
            )
            .subscribe(
              rateId => {
                if (rateId > 0) {
                  this.getUsedBillingCodes(() => {
                    this.toastr.showSuccess(
                      this.error_data.write_off_code_add_success
                    );
                    this.loading = false;
                  });
                } else {
                  this.showError();
                }
              },
              () => {
                this.showError();
              }
            );
        }
        if (res.modalType == 'writeDown') {
          this.loading = true;
          this.billingService
            .v1BillingWriteDownCodePost$Json({
              body: res
            })
            .pipe(
              map(res => {
                return JSON.parse(res as any).results as number;
              })
            )
            .subscribe(
              rateId => {
                if (rateId > 0) {
                  this.getUsedBillingCodes(() => {
                    this.toastr.showSuccess(
                      this.error_data.write_down_code_add_success
                    );
                    this.getWriteDownCodes();
                  });
                } else {
                  this.showError();
                }
              },
              () => {
                this.showError();
              }
            );
        }
        if (res.modalType == 'reversedCheckCode') {
          let body = {"code":res.code,"description":res.name,"modalType":res.modalType,tenantId:this.firmDetails.id};
          this.loading = true;
          this.billingService
            .v1BillingReversedcheckreasonCreatePost$Json$Response({
              body: body
            })
            .pipe(
              map(res => {
                return JSON.parse(res.body as any).results as number;
              })
            )
            .subscribe(
              rateId => {
                if (rateId > 0) {
                  this.getUsedBillingCodes(() => {
                    this.toastr.showSuccess(
                      this.error_data.reversed_code_add_success
                    );
                    this.loading = false;
                  });
                } else {
                  this.showError();
                }
              },
              () => {
                this.showError();
              }
            );
        }

        if (res.modalType == 'consultation') {
          let body = {
            code: res.code,
            name: res.name,
            rate: res.rate,
            billTypeId: res.billTypeId
          };
          this.loading = true;

          this.billingService
            .v1BillingConsultationFeeCodePost$Json$Response({
              body: body
            })
            .pipe(
              map(res => {
                return JSON.parse(res.body as any).results as number;
              })
            )
            .subscribe(
              rateId => {
                if (rateId > 0) {
                  this.getUsedBillingCodes(() => {
                    this.toastr.showSuccess(
                      this.error_data.consultation_code_add_success
                    );
                    this.loading = false;
                  });
                } else {
                  this.showError();
                }
              },
              () => {
                this.showError();
              }
            );
        }
      }
    });
  }

  editWriteDownCode(writeDownCode: vwWriteDownCode, $event = null) {
    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }
    let modalRef = this.modalService.open(EditWriteDownComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    const component = modalRef.componentInstance;
    component.writeDownCode = writeDownCode;
    modalRef.result.then(res => {
      if (res) {
        this.loading = true;
        this.billingService
          .v1BillingWriteDownCodePut$Json({
            body: res
          })
          .pipe(
            map(res => {
              return JSON.parse(res as any).results as number;
            })
          )
          .subscribe(
            rateId => {
              if (rateId > 0) {
                this.toastr.showSuccess(
                  this.error_data.write_down_code_update_success
                );
                this.getWriteDownCodes();
              } else {
                this.loading = false;
              }
            },
            () => {
              this.showError();
            }
          );
      }
    });
  }

  open(content, row: any = null, $event?) {
    if (
      this.selected &&
      this.selected.length &&
      this.selected.length > 1 &&
      row == null
    ) {
      this.isBulkEnableDisable = true;
    } else {
      this.isBulkEnableDisable = false;
      if (this.selected && this.selected.length == 1 && row == null) {
        this.selectedCode = this.selected[0];
      } else if (row && row != null) {
        this.selectedCode = row;
      }
    }

    if ($event != '') {
      $event.target.closest('datatable-body-cell').blur();
    }

    this.modalService.open(content, {
      centered: true,
      backdrop: 'static',
      windowClass: 'modal-smd'
    });
  }

  bulkWriteDownEnableDisable(isEnable, isBulk) {
    this.loading = true;
    this.showDisableBulkAction = false;
    this.showEnableBulkAction = false;
    this.selectedEnableDisableIds = [];
    if (isBulk) {
      if (this.selected && this.selected.length) {
        this.selected.forEach(ele => {
          this.selectedEnableDisableIds.push(Number(ele.id));
        });
      }
    } else {
      this.selectedEnableDisableIds.push(Number(this.selectedCode.id));
    }

    let body = {
      billingCodeType: BillingCodeTypesEnum.WRITE_DOWN_CODE as any,
      ids: this.selectedEnableDisableIds,
      isEnable: isEnable
    };

    this.billingService
      .v1BillingEnableDisableBillingCodesPost$Json({ body })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          if (res) {
            this.selected = [];
            this.showCodeSelectionWarning = false;
            this.showDisableBulkAction = false;
            this.showEnableBulkAction = false;
            if (isBulk)
              isEnable
                ? this.toastr.showSuccess(
                    this.error_data.bulk_enable_write_down_msg
                  )
                : this.toastr.showSuccess(
                    this.error_data.bulk_disable_write_down_msg
                  );
            else
              isEnable
                ? this.toastr.showSuccess(this.error_data.enable_write_down_msg)
                : this.toastr.showSuccess(this.error_data.disable_write_down_msg);
            this.getWriteDownCodes();
          } else {
            this.showError();
            this.loading = false;
          }
        },
        () => {
          this.showError();
          this.loading = false;
        }
      );
  }

  onEnableDisableWriteDownCode(isEnable) {
    this.bulkWriteDownEnableDisable(isEnable, this.isBulkEnableDisable);
  }


  applyFilter() {
    if (!this.originalWriteDownCodes) {
      return;
    }

    let rows = [...this.originalWriteDownCodes];

    if (this.status) {
      rows = rows.filter(a => a.status == this.status);
    }

    if (this.name && this.name.trim() != '') {
      rows = rows.filter(
        a =>
          (a.name || '').toLowerCase().includes(this.name.toLowerCase()) ||
          (a.code.toString() || '')
            .toLowerCase()
            .includes(this.name.toLowerCase())
      );
    }

    this.writeDownCodes = rows;
    this.calcTotalPages();
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.page.totalElements = this.writeDownCodes.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
  }


  /*** open menu on action click */
  openMenu(index: number, event): void {
    event.stopPropagation();
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
    if (index == this.currentActive) {
      this.currentActive = null;
    }
  }

  /**
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.page.totalPages = Math.ceil(
      this.writeDownCodes.length / this.page.size
    );
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
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
   * For datatable checkbox
   */
  public onSelect({ selected }) {
    if (selected && selected.length) {
      let activeFilter = selected.filter(v => v.status == 'Active');
      let disableFilter = selected.filter(v => v.status == 'Disabled');
      if (
        activeFilter &&
        activeFilter.length &&
        activeFilter.length == selected.length
      ) {
        this.showDisableBulkAction = true;
        this.showEnableBulkAction = false;
        this.showCodeSelectionWarning = false;
      } else if (
        disableFilter &&
        disableFilter.length &&
        disableFilter.length == selected.length
      ) {
        this.showDisableBulkAction = false;
        this.showEnableBulkAction = true;
        this.showCodeSelectionWarning = false;
      } else {
        this.showDisableBulkAction = false;
        this.showEnableBulkAction = false;
        this.showCodeSelectionWarning = true;
      }
    } else {
      this.showDisableBulkAction = false;
      this.showEnableBulkAction = false;
      this.showCodeSelectionWarning = false;
    }
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.writeDownCodes) {
      return this.writeDownCodes.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}












