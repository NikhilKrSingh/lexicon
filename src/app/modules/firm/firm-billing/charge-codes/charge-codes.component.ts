import { AfterViewInit, Component, EventEmitter, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { Options } from 'ng5-slider';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { BillingCodeTypesEnum } from 'src/app/modules/models/billing-code.type.js';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { Page } from 'src/app/modules/models/page';
import { vwUsedBillingCodes } from 'src/app/modules/models/used-billing-code.model';
import { vwLookupValuesBilling } from 'src/app/modules/models/vw-id-name-billing-codes';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper.js';
import {
  vwAddConsultationFeeCode,
  vwDisbursement, vwIdCodeName, vwRate
} from 'src/common/swagger-providers/models';
import {
  BillingService,
  TenantService
} from 'src/common/swagger-providers/services';
import * as errors from '../../../shared/error.json';
import { CommonCreateCodeComponent } from '../common-create-code/common-create-code.component';
import { EditChargeCodeComponent } from './edit-charge-code/edit-charge-code.component';

@Component({
  selector: 'app-charge-codes',
  templateUrl: './charge-codes.component.html',
  styleUrls: ['./charge-codes.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class FirmChargeCodesComponent implements OnInit, AfterViewInit {
  error_data = (errors as any).default;
  firmDetails: Tenant;
  originalChargeCodes: Array<vwRate>;
  chargeCodes: Array<vwRate>;
  billingToList: Array<vwIdCodeName>;
  billingTypeList: Array<vwIdCodeName> = [];
  hourlyBillingTypeList: any = [];
  statusList: any;
  billingTo: number;
  billType: number;
  status: string;
  description: string;
  originalDisbursementTypes = [];
  public selected: Array<vwRate> = [];
  showDisableBulkAction = false;
  showEnableBulkAction = false;
  selectedCode: vwRate;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public loading = true;
  @Output() readonly modalType = new EventEmitter<any>();

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  currentActive: number;
  tenantTierName: string;
  showCodeSelectionWarning = false;
  isBulkEnableDisable = false;
  selectedEnableDisableIds = [];

  usedCodeRange: vwUsedBillingCodes;
  public listLoaded = false;

  listItems: Array<vwLookupValuesBilling> = [];
  allSelected: boolean;

  constructor(
    private modalService: NgbModal,
    private billingService: BillingService,
    private tenantService: TenantService,
    private toastr: ToastDisplay,
    private router: Router,
    private pagetitle: Title
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.statusList = [
      {
        id: 'Active',
        name: 'Active',
      },
      {
        id: 'Disabled',
        name: 'Disabled',
      },
    ];
  }
  public tables: any = {
    tableArr: [],
    frozenRightArr: []
  };

  ngOnInit() {
    this.pagetitle.setTitle('Charge Codes');
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

  ngAfterViewInit() {
    window.onresize = () => {
      this.initScrollDetector([this.table]);
      window.onresize = () => {
        UtilsHelper.checkDataTableScroller(this.tables);
      };
    };
  }

  /**** Calls when resize screen *****/
  public initScrollDetector(tableArr = []) {
    this.tables.tableArr = [...tableArr];
    this.tables.frozenRightArr = []
    this.tables.tableArr.forEach(x => this.tables.frozenRightArr.push(false));
  }
  private getUsedBillingCodes(onSuccess = () => { }) {
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

  private getListItems() {
    this.billingService.v1BillingBillingcodelistitemsGet().pipe(
      map(res => {
        return JSON.parse(res as any).results as Array<vwLookupValuesBilling>;
      })
    ).pipe(
        finalize(() => {
          this.getChargeCodes();
        })
      )
      .subscribe(res => {
        if (res && res.length > 0) {
          const listItems = res || [];
          this.listItems = listItems;
          this.billingToList = listItems.filter(a => a.categoryCode == 'RATE_BILLING_TO');
          this.hourlyBillingTypeList = listItems.filter(a => a.categoryCode == 'RATE_BILLING_TYPE');
          this.billingTypeList = listItems.filter(a => a.categoryCode == 'RATE_BILLING_TYPE');

          this.listLoaded = true;
        } else {
          this.listLoaded = true;
        }
      });
  }

  private showError() {
    this.loading = false;
  }

  private getChargeCodes(loadListItems = true) {
    this.billingService
      .v1BillingRateTenantTenantIdGet({
        tenantId: this.firmDetails.id,
      })
      .pipe(
        map((res) => {
          return JSON.parse(res as any).results as vwRate[];
        }),
        finalize(() => { })
      )
      .subscribe(
        (res) => {
          if (res) {
          this.removeSelection();
            this.description = null;
            this.originalChargeCodes = res;
            this.chargeCodes = [...this.originalChargeCodes];
            
            this.calcTotalPages();
            this.initScrollDetector([this.table]);
            UtilsHelper.checkDataTableScroller(this.tables);

            this.applyFilter();
            this.loading = false;
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

  /**
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
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
    this.checkParentCheckbox();
    UtilsHelper.aftertableInit();
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
    this.changePage();
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.page.totalElements = this.chargeCodes.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
    this.checkParentCheckbox();
    UtilsHelper.aftertableInit();
  }

  applyFilter() {
    let rows = [...this.originalChargeCodes];

    if (this.status) {
      rows = rows.filter((a) => a.status == this.status);
    }
    if (this.description && this.description.trim() != '') {
      rows = rows.filter(
        (a) =>
          (a.description || '')
            .toLowerCase()
            .includes(this.description.toLowerCase()) ||
          (a.code || '').toLowerCase().includes(this.description.toLowerCase())
      );
    }
    this.chargeCodes = rows;
    this.calcTotalPages();
  }

  createChargeCode() {
    let modalRef = this.modalService.open(CommonCreateCodeComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.firmDetails = this.firmDetails;
    modalRef.componentInstance.allBillingCodeListItems = this.listItems;
    modalRef.componentInstance.modalType = 'hourly';
    modalRef.componentInstance.usedCodeRange = this.usedCodeRange;

    modalRef.result.then((res) => {
      if (res) {
        if (res.modalType == 'disbursement') {
          this.loading = true;
          this.billingService
            .v1BillingDisbursementTypePost$Json({
              body: res,
            })
            .pipe(
              map((res) => {
                return JSON.parse(res as any).results as number;
              })
            )
            .subscribe(
              (id) => {
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
              body: res,
            })
            .pipe(
              map((res) => {
                return JSON.parse(res as any).results as number;
              })
            )
            .subscribe(
              (rateId) => {
                if (rateId > 0) {
                  this.getUsedBillingCodes(() => {
                    this.toastr.showSuccess(
                      this.error_data.charge_code_add_success
                    );
                    this.getChargeCodes(false);
                  });
                } else {
                  this.loading = false;
                }
              },
              () => {
                this.showError();
              }
            );
        }
        if (res.modalType == 'writeOff') {
          this.loading = true;
          this.billingService
            .v1BillingWriteOffCodePost$Json({
              body: res,
            })
            .pipe(
              map((res) => {
                return JSON.parse(res as any).results as number;
              })
            )
            .subscribe(
              (rateId) => {
                if (rateId > 0) {
                  this.getUsedBillingCodes(() => {
                    this.toastr.showSuccess(
                      this.error_data.write_off_code_add_success
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
          } as vwAddConsultationFeeCode;
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

  editChargeCode(chargeCode: vwRate, $event = null) {

    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }
    let modalRef = this.modalService.open(EditChargeCodeComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.chargeCode = { ...chargeCode };
    modalRef.componentInstance.billingToList = this.billingToList;
    modalRef.componentInstance.billingTypeList = this.billingTypeList;
    modalRef.result.then((res) => {
      if (res) {
        this.loading = true;
        this.billingService
          .v1BillingRatePut$Json({
            body: res,
          })
          .pipe(
            map((res) => {
              return JSON.parse(res as any).results as number;
            })
          )
          .subscribe(
            (rateId) => {
              if (rateId > 0) {
                this.toastr.showSuccess(
                  this.error_data.charge_code_update_success
                );
                this.getChargeCodes(false);
              } else {
                this.loading = false;
              }
            },
            () => {
              this.loading = false;
            }
          );
      }
    });
  }

  openAuditHistory(row: vwRate) {
    this.router.navigate(['/firm/charge-code-audit-hisory'], {
      queryParams: {
        id: row.id,
      },
    });
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
   * For datatable checkbox
   */
  public onSelect({ selected }) {
    if (selected && selected.length) {
      let activeFilter = selected.filter((v) => v.status == 'Active');
      let disableFilter = selected.filter((v) => v.status == 'Disabled');
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

  bulkHourlyEnableDisable(isEnable, isBulk) {
    this.loading = true;
    this.showDisableBulkAction = false;
    this.showEnableBulkAction = false;
    this.selectedEnableDisableIds = [];
    if (isBulk) {
      if (this.selected && this.selected.length) {
        this.selected.forEach((ele) => {
          this.selectedEnableDisableIds.push(Number(ele.id));
        });
      }
    } else {
      this.selectedEnableDisableIds.push(Number(this.selectedCode.id));
    }

    let body = {
      billingCodeType: BillingCodeTypesEnum.HOURLY_CODE as any,
      ids: this.selectedEnableDisableIds,
      isEnable: isEnable,
    };

    this.billingService
      .v1BillingEnableDisableBillingCodesPost$Json({ body })
      .pipe(
        map((res) => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => { })
      )
      .subscribe(
        (res) => {
          if (res) {
            this.selected = [];
            this.showCodeSelectionWarning = false;
            this.showDisableBulkAction = false;
            this.showEnableBulkAction = false;
            if (isBulk)
              isEnable
                ? this.toastr.showSuccess(
                  this.error_data.bulk_enable_hourly_msg
                )
                : this.toastr.showSuccess(
                  this.error_data.bulk_disable_hourly_msg
                );
            else
              isEnable
                ? this.toastr.showSuccess(this.error_data.enable_hourly_msg)
                : this.toastr.showSuccess(this.error_data.disable_hourly_msg);
            this.getChargeCodes(false);
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

  onEnableDisableHourlyCode(isEnable) {
    this.bulkHourlyEnableDisable(isEnable, this.isBulkEnableDisable);
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
      windowClass: 'modal-smd',
    });
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.chargeCodes) {
      return this.chargeCodes.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  /**** function to select/deselect only displayed page record */
  selectDeselectRecords() {
    this.allSelected = !this.allSelected
    this.table.bodyComponent.temp.forEach(row => {
      const index = this.chargeCodes.findIndex(list => list.id === row.id);
      if (index > -1) {
        this.chargeCodes[index]['selected'] = this.allSelected;
      }
      const existingIndex = this.selected.findIndex(list => list.id === row.id);
      if (existingIndex > -1 && !row.selected) {
        this.selected.splice(existingIndex, 1)
      } else if (row.selected && existingIndex === -1) {
        this.selected.push(row);
      }
    })
    this.setSelected();
  }

  /******* function to select/deselect child checkbox  */
  changeChildSelection(row) {
    row.selected = !row.selected
    const existingIndex = this.selected.findIndex(list => list.id === row.id);
    if (existingIndex > -1 && !row.selected) {
      this.selected.splice(existingIndex, 1)
    } else if (row.selected && existingIndex === -1) {
      this.selected.push(row);
    }
    this.setSelected();
  }

  setSelected() {
    this.chargeCodes.forEach(list => {
      const selectedIds = this.selected.filter(selected => selected.id === list.id);
      if (selectedIds.length > 0) {
        list['selected'] = true;
      }
    });

    if (this.selected && this.selected.length) {
      let activeFilter = this.selected.filter((v) => v.status == 'Active');
      let disableFilter = this.selected.filter((v) => v.status == 'Disabled');
      if (
        activeFilter &&
        activeFilter.length &&
        activeFilter.length == this.selected.length
      ) {
        this.showDisableBulkAction = true;
        this.showEnableBulkAction = false;
        this.showCodeSelectionWarning = false;
      } else if (
        disableFilter &&
        disableFilter.length &&
        disableFilter.length == this.selected.length
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

    this.checkParentCheckbox();
  }

  checkParentCheckbox() {
    setTimeout(() => {
      const currentArr = []
      this.table.bodyComponent.temp.forEach(row => {
        const existing = this.chargeCodes.filter(list => list.id === row.id)[0];
        if (existing) {
          currentArr.push(existing)
        }
      });
      this.allSelected = currentArr.length && currentArr.every(row => row.selected);
    }, 100)
  }

  /*** function to remove selection */
  removeSelection() {
    if (this.chargeCodes && this.chargeCodes.length) {
      this.chargeCodes.forEach(list => {
        list['selected'] = false;
      })
    }
    this.selected = [];
    this.checkParentCheckbox();
  }
}
