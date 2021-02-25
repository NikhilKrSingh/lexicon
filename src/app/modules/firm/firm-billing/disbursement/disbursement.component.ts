import { AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { Options } from 'ng5-slider';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { BillingCodeTypesEnum } from 'src/app/modules/models/billing-code.type';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { Page } from 'src/app/modules/models/page';
import { vwUsedBillingCodes } from 'src/app/modules/models/used-billing-code.model';
import { vwLookupValuesBilling } from 'src/app/modules/models/vw-id-name-billing-codes';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwDisbursement, vwIdCodeName, vwRate } from 'src/common/swagger-providers/models';
import { BillingService, TenantService } from 'src/common/swagger-providers/services';
import * as errors from '../../../shared/error.json';
import { CommonCreateCodeComponent } from '../common-create-code/common-create-code.component';
import { EditDisbursementTypeComponent } from './edit-disbursement-type/edit-disbursement-type.component';

@Component({
  selector: 'app-disbursement-types',
  templateUrl: './disbursement.component.html',
  styleUrls: ['./disbursement.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class FirmDisbursementTypesComponent implements OnInit, AfterViewInit {
  @ViewChild(DatatableComponent, {static: false}) table: DatatableComponent;
  public closeResult: string;
  firmDetails: Tenant;
  error_data = (errors as any).default;
  originalDisbursementTypes: Array<vwDisbursement>;
  disbursementTypes: Array<vwDisbursement>;
  disbursementTypeList: Array<vwIdCodeName>;
  statusList: Array<vwIdCodeName>;
  openBillingType: vwIdCodeName;
  disbursementBillingTypeList: any = [];
  disbursementModalTypeCode: any;
  billType: number;
  billableTo: number;
  status: number;
  disbursementType: number;
  description: string;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public loading = true;
  public visible = false;
  originalChargeCodes: Array<vwRate>;
  billingToClientList: any = [];
  currentActive: number;
  public selected = [];
  tenantTierName: string;
  showCodeSelectionWarning = false;
  isBulkEnableDisable = false;
  selectedEnableDisableIds = [];
  showDisableBulkAction = false;
  showEnableBulkAction = false;
  selectedCode: vwDisbursement;

  usedCodeRange: vwUsedBillingCodes;
  listLoaded = false;

  listItems: Array<vwLookupValuesBilling> = [];

  constructor(
    private modalService: NgbModal,
    private billingService: BillingService,
    private tenantService: TenantService,
    private toastr: ToastDisplay,
    private pagetitle: Title
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.disbursementTypes = [];
    this.originalDisbursementTypes = [];
    this.billingToClientList = [
      {
        id: 1,
        name: 'Yes',
      },
      {
        id: 2,
        name: 'No',
      },
    ];

    this.statusList = [
      {
        id: 1,
        name: 'Active',
      },
      {
        id: 2,
        name: 'Disabled',
      },
    ];
  }

  public tables: any = {
    tableArr: [],
    frozenRightArr: []
  };

  ngOnInit() {
    this.pagetitle.setTitle('Disbursement Types');
    const userInfo: any = UtilsHelper.getLoginUser();
    if (userInfo && userInfo.tenantTier) {
      this.tenantTierName = userInfo.tenantTier.tierName;
      this.firmDetails = {
        id: userInfo.tenantId
      } as any;
    }

    if (this.firmDetails) {
      this.getUsedBillingCodes(() => {
        this.getListHourly();
      });
    } else {
      this.showError();
    }
  }

  ngAfterViewInit() {
    this.initScrollDetector([this.table]);

    window.onresize = () => {
      UtilsHelper.checkDataTableScroller(this.tables);
    };
  }

  /**** Calls when resize screen *****/
  public initScrollDetector(tableArr = []) {
    this.tables.tableArr = [...tableArr];
    this.tables.frozenRightArr = []
    this.tables.tableArr.forEach(x => this.tables.frozenRightArr.push(false));
  }

  private getUsedBillingCodes(onSuccess = () => {
  }) {
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

  private getListHourly() {
    this.billingService.v1BillingBillingcodelistitemsGet().pipe(
      map(res => {
        return JSON.parse(res as any).results as Array<vwLookupValuesBilling>;
      })
    ).pipe(
      finalize(() => {
        this.getDisbusementTypes(true);
      })
    )
      .subscribe(res => {
        if (res && res.length > 0) {
          const listItems = res || [];
          this.listItems = listItems;
          this.disbursementBillingTypeList = listItems.filter(a => a.categoryCode == 'DISBURSEMENT_TYPE_BILL_TYPE');
          this.disbursementTypeList = listItems.filter(a => a.categoryCode == 'DISBURSEMENT_TYPE_TYPE');
          this.openBillingType = this.disbursementBillingTypeList.find(
            a => a.code === 'OPEN'
          );
          this.listLoaded = true;
        } else {
          this.disbursementBillingTypeList = [];
          this.disbursementTypeList = [];
        }
      });
  }

  private getDisbusementTypes(loadListItems = false) {
    this.billingService
      .v1BillingDisbursementTypeTenantTenantIdGet({
        tenantId: this.firmDetails.id,
      })
      .pipe(
        map((res) => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {
        })
      )
      .subscribe((res) => {
        if (res) {
          this.description = null;
          this.originalDisbursementTypes = res;
          this.disbursementTypes = [...this.originalDisbursementTypes];
          this.page.totalElements = this.originalDisbursementTypes.length;
          this.page.totalPages = Math.ceil(
            this.originalDisbursementTypes.length / this.page.size
          );

          this.applyFilter();
          UtilsHelper.aftertableInit();
          this.initScrollDetector([this.table]);
          UtilsHelper.checkDataTableScroller(this.tables);
          this.loading = false;
        } else {
          this.showError();
          this.loading = false;
        }
      }, () => {
        this.loading = false;
      });
  }

  private showError() {
    this.loading = false;
  }

  /**
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.page.totalPages = Math.ceil(
      this.disbursementTypes.length / this.page.size
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
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.page.totalElements = this.disbursementTypes.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
  }

  open(content, row: any = null, event, className: any, windowClass?: any) {
    this.selected = row;
    event.target.closest('datatable-body-cell').blur();
    this.disbursementModalTypeCode = row.code;
    this.modalService
      .open(content, {
        size: className,
        windowClass,
        centered: true,
        backdrop: 'static',
      })
      .result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
        this.selected = [];
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  applyFilter() {
    let rows = [...this.originalDisbursementTypes];

    if (this.disbursementType) {
      rows = rows.filter((a) => a.type.id == this.disbursementType);
    }

    if (this.billType) {
      rows = rows.filter((a) => a.billType.id == this.billType);
    }

    if (this.billableTo) {
      let isBillableToClient = this.billableTo == 1;
      rows = rows.filter((a) => a.isBillableToClient == isBillableToClient);
    }

    if (this.status) {
      if (this.status == 2) {
        rows = rows.filter((a) => a.status == 'Disabled');
      }
      if (this.status == 1) {
        rows = rows.filter((a) => a.status == 'Active');
      }
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

    this.disbursementTypes = rows;
    this.calcTotalPages();
  }

  createDisbursementType() {
    const modalRef = this.modalService.open(CommonCreateCodeComponent, {
      keyboard: false,
      backdrop: 'static',
      centered: true,
    });

    const component = modalRef.componentInstance;
    component.allBillingCodeListItems = this.listItems;
    component.firmDetails = this.firmDetails;
    component.modalType = 'disbursement';
    component.usedCodeRange = this.usedCodeRange;

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
                    this.getDisbusementTypes();
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
                    this.loading = false;
                  });
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
          let body = {
            "code": res.code,
            "description": res.name,
            "modalType": res.modalType,
            tenantId: this.firmDetails.id
          };
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

  onClickedOutside(event: any, index: number) {
    if (index == this.currentActive) {
      this.currentActive = null;
    }
  }

  editDisbursementType(item: vwDisbursement, $event = null) {
    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }
    const modalRef = this.modalService.open(EditDisbursementTypeComponent, {
      keyboard: false,
      backdrop: 'static',
      centered: true,
    });
    const component = modalRef.componentInstance;
    component.billingTypeList = this.disbursementBillingTypeList;
    component.disbursementTypeList = this.disbursementTypeList;
    component.disbursement = item;
    component.openBillType = this.openBillingType;
    modalRef.result.then((res) => {
      if (res) {
        this.loading = true;
        this.billingService
          .v1BillingDisbursementTypePut$Json({
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
                this.toastr.showSuccess(
                  this.error_data.disbursement_type_edit_success
                );
                this.getDisbusementTypes();
              } else {
                this.showError();
              }
            },
            () => {
              this.showError();
            }
          );
      }
    });
  }

  /**
   * For datatable checkbox
   */
  public onSelect({selected}) {
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
      billingCodeType: BillingCodeTypesEnum.DISBURSEMENT_TYPE as any,
      ids: this.selectedEnableDisableIds,
      isEnable: isEnable,
    };

    this.billingService
      .v1BillingEnableDisableBillingCodesPost$Json({body})
      .pipe(
        map((res) => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {
        })
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
                this.error_data.bulk_enable_disbursement_msg
                )
                : this.toastr.showSuccess(
                this.error_data.bulk_disable_disbursement_msg
                );
            else
              isEnable
                ? this.toastr.showSuccess(
                this.error_data.enable_disbursement_msg
                )
                : this.toastr.showSuccess(
                this.error_data.disable_disbursement_msg
                );
            this.getDisbusementTypes(false);
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

  onEnableDisableDisbursement(isEnable) {
    this.bulkHourlyEnableDisable(isEnable, this.isBulkEnableDisable);
  }

  openConfirm(content, row: any = null, $event) {
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
      } else if (row) {
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

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.disbursementTypes) {
      return this.disbursementTypes.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
