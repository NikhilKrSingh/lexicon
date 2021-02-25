import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page } from 'src/app/modules/models';
import { vwBillToClientEmailAndPrintResponse, vwSuccessBillToClient } from 'src/app/modules/models/bill-to-client.model';
import { PreBillingModels } from 'src/app/modules/models/vw-prebilling';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errors from 'src/app/modules/shared/error.json';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { InvoiceService } from 'src/app/service/invoice.service';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwBillToClientPrintAndEmail, vwIdCodeName, vwSendInvoice } from 'src/common/swagger-providers/models';
import { BillingService, MiscService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-pre-bill-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class PreBillListComponent implements OnInit, OnDestroy {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  error_data = (errors as any).default;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public startServiceDate: string = null;
  public endServiceDate: string = null;
  public titleStatus: string = 'Select status';
  public selectedStatus: Array<any> = [];
  public filterName: string = 'Apply Filter';

  prebillingList: Array<PreBillingModels.vwPreBilling>;
  originalPreBillingList: Array<PreBillingModels.vwPreBilling>;
  clientList: Array<vwIdCodeName>;
  preBillStatusList: Array<any>;
  fixedFeeMatterList: Array<vwIdCodeName>;
  assigneeList: Array<vwIdCodeName>;
  description: string;
  clientName: number;
  dateGenerated: Date;
  dateGeneratedEnd: Date;
  issuanceDate: Date;
  issuanceDateEnd: Date;
  lastActionDate: Date;
  lastActionDateEnd: Date;
  fixedFeeMatter: number;
  assignee: number;
  disbursementStatus: number;
  currentActive: number;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public loggedInUser: any;
  public loading = true;

  private filterSub: Subscription;

  paperInvoice: vwIdCodeName;
  electronicInvoice: vwIdCodeName;
  paperAndElectronicInvoice: vwIdCodeName;
  invoicePrefList: Array<vwIdCodeName>;

  sendEmail: boolean;
  print: boolean;

  selectedPrebill: PreBillingModels.vwPreBilling;
  billToClientResponse: vwSuccessBillToClient;

  @Input() invoiceTemplateDetails: any;
  @Input() tenantDetails: any;
  @Input() default_logo_url: any;
  @Input() loginUser: any;
  @Input() trustAccountStatus: boolean;

  constructor(
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private store: Store<fromRoot.AppState>,
    private miscService: MiscService,
    private dialogService: DialogService,
    private pagetitle: Title,
    private invoiceService: InvoiceService,
    private modalService: NgbModal
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');
    this.fixedFeeMatterList = [
      {
        id: 1,
        name: 'Yes',
      },
      {
        id: 0,
        name: 'No',
      },
    ];
  }

  ngOnInit() {
    this.pagetitle.setTitle("Pre-Bills");
    this.getPrebillList(true);
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
    const profile = localStorage.getItem('profile');
    if (profile) {
      this.loggedInUser = JSON.parse(profile);
    }

    this.filterSub = this.invoiceService.filter.subscribe((res) => {
      this.description = res;
      this.applyFilter();
    });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }

    if (this.filterSub) {
      this.filterSub.unsubscribe();
    }
  }

  private getPrebillList(loadItems = false, msg: string = null) {
    this.billingService
      .v1BillingPrebillingGet()
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        (list) => {
          if (list) {
            this.originalPreBillingList = list;
            if (this.permissionList.BILLING_MANAGEMENTisViewOnly) {
              this.originalPreBillingList = this.originalPreBillingList.filter(
                (prebilling) => {
                  if (
                    prebilling.preBillStatus &&
                    prebilling.preBillStatus.code == 'PENDING_APPROVAL' &&
                    ((prebilling.concernedPerson &&
                      prebilling.concernedPerson.id == this.loggedInUser.id) ||
                      (prebilling.billingPerson &&
                        prebilling.billingPerson.id == this.loggedInUser.id))
                  ) {
                    return true;
                  }
                  return false;
                }
              );
            }
            this.prebillingList = [...this.originalPreBillingList];
            this.page.totalElements = this.prebillingList.length;

            this.page.totalPages = Math.ceil(
              this.prebillingList.length / this.page.size
            );
            UtilsHelper.aftertableInit();

            if (loadItems) {
              this.applyFilter();
              this.loadListItems();
              this.loadClientList();
              this.populateAssigneeList();
            }
            if (msg) {
              this.toastr.showSuccess(msg);
            }
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  private loadListItems() {
    this.billingService
      .v1BillingPrebillstatusGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        if (res) {
          this.preBillStatusList = res;
        } else {
          this.preBillStatusList = [];
        }
      });
  }

  private loadClientList() {
    this.miscService
      .v1MiscClientsGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        if (res && res.length > 0) {
          this.clientList = res.map((a) => {
            if (a.isCompany) {
              return {
                id: a.id,
                name: a.companyName,
              } as vwIdCodeName;
            } else {
              return {
                id: a.id,
                name: `${a.lastName}${a.firstName ? ', ' : ''}${a.firstName}`,
              } as vwIdCodeName;
            }
          });

          this.clientList = _.uniqBy(this.clientList, (a) => a.id);
          this.clientList = _.orderBy(this.clientList, (a) =>
            a.name.toLowerCase()
          );
          this.loading = false;
        } else {
          this.loading = false;
        }
      }, () => {
          this.loading = false;
      });

    this.billingService
      .v1BillingInvoicedeliveryListGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        if (res) {
          this.invoicePrefList = res;
          this.paperInvoice = this.invoicePrefList.find(
            (a) => a.code === 'PAPER'
          );
          this.electronicInvoice = this.invoicePrefList.find(
            (a) => a.code === 'ELECTRONIC'
          );
          this.paperAndElectronicInvoice = this.invoicePrefList.find(
            (a) => a.code === 'PAPER_AND_ELECTRONIC'
          );
        } else {
          this.invoicePrefList = [];
        }
      });
    this.loading = false;
  }

  private populateAssigneeList() {
    if (this.prebillingList) {
      this.assigneeList = this.prebillingList
        .filter((a) => a.concernedPerson && a.concernedPerson.id)
        .map((p) => {
          return {
            id: p.concernedPerson.id,
            name: p.concernedPerson.name,
          } as vwIdCodeName;
        });
    }
  }

  /**
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.page.totalPages = Math.ceil(
      this.prebillingList.length / this.page.size
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
    if (this.pageSelected == 1) {
      this.calcTotalPages();
    } else {
      UtilsHelper.aftertableInit();
    }
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
    this.page.totalElements = this.prebillingList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
  }

  public applyFilter() {
    if (!this.originalPreBillingList) {
      return;
    }

    let rows = [...this.originalPreBillingList];
    if (this.selectedStatus.length) {
      let temp = [];
      if (this.selectedStatus && this.selectedStatus.length > 0) {
        this.originalPreBillingList.forEach((status) => {
          if (status.preBillStatus && status.preBillStatus.id) {
            if (this.selectedStatus.includes(status.preBillStatus.id)) {
              temp.push(status);
            }
          }
        });
        rows = [...temp];
      }
    }

    if (this.startServiceDate !== null) {
      rows = rows.filter((a) =>
        a.createdAt
          ? moment(a.createdAt).isSameOrAfter(this.startServiceDate, 'd')
          : false
      );
    }

    if (this.endServiceDate !== null) {
      rows = rows.filter((a) =>
        a.createdAt
          ? moment(a.createdAt).isSameOrBefore(this.endServiceDate, 'd')
          : false
      );
    }

    if (this.description) {
      rows = rows.filter(
        (a) =>
          this.matchName(a.person, 'name', this.description) ||
          this.matchName(a.matter, 'name', this.description) ||
          this.matchName(a.matter, 'matterNumber', this.description)
      );
    }

    this.prebillingList = [];
    this.prebillingList = [...rows];
    this.calcTotalPages();
  }

  public selectStatus(event: any) {
    this.titleStatus = '';
    if (event.length > 0) {
      this.titleStatus = event.length;
    } else {
      this.titleStatus = 'All';
    }
  }

  public clearFilter(key: string) {
    switch (key) {
      case 'status':
        {
          this.selectedStatus = [];
          this.preBillStatusList.forEach((item) => (item.checked = false));
          this.titleStatus = 'Select invoice status';
          this.applyFilter();
        }
        break;
    }
  }

  private matchName(item: any, fieldName, searchValue: string): boolean {
    const searchName =
      item && item[fieldName] ? item[fieldName].toString().toLowerCase() : '';
    return searchName.search(searchValue) > -1;
  }

  private compareId(item: any, id: number): boolean {
    const searchName = item ? item.id : null;
    return searchName == id;
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
    if (index == this.currentActive) {
      this.currentActive = null;
    }
  }

  forceGenerateInvoice(row: PreBillingModels.vwPreBilling, billClientTemplate) {
    this.selectedPrebill = row;

    if (row.invoicePreference) {
      let invoicePref = row.invoicePreference.id;
      this.sendEmail =
        invoicePref == this.electronicInvoice.id ||
        invoicePref == this.paperAndElectronicInvoice.id;
      this.print =
        invoicePref == this.paperInvoice.id ||
        invoicePref == this.paperAndElectronicInvoice.id;
    }

    this.modalService
      .open(billClientTemplate, {
        centered: true,
        backdrop: 'static',
        keyboard: false
      })
      .result.then((response) => {
        if (response) {
          this.loading = true;
          if (this.preBillStatusList) {
            const approvedPreBillStatus = this.preBillStatusList.find(
              (a) => a.code === 'APPROVED'
            );
            if (
              row.preBillStatus &&
              row.preBillStatus.id == approvedPreBillStatus.id
            ) {
              this.billToClient(row);
            } else {
              this.changeStatus(row, approvedPreBillStatus.id, () => {
                this.billToClient(row);
              });
            }
          } else {
            this.loading = false;
            this.toastr.showError('Not able to fetch Pre Bill Status List');
          }
          this.description = null;
        }
      });
  }

  private billToClient(row: PreBillingModels.vwPreBilling) {
    this.billingService
      .v1BillingBillToClientPost$Json({
        body: {
          prebills: [row.id],
        },
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res) => {
          if (res) {
            if (res.failedItems && res.failedItems > 0) {
              this.toastr.showError(this.error_data.bill_single_invoice_failed);
              this.loading = false;
            } else {
              this.billToClientResponse = res.succededItems[0];
            }
          } else {
            this.toastr.showError(this.error_data.server_error);
            this.loading = false;
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  public sendEmailAndPrint(invoiceHTML: vwSendInvoice) {
    let body: vwBillToClientPrintAndEmail = {
      invoices: [
        {
          invoiceInfo: invoiceHTML,
          emailInfo: {
            billingContact: this.selectedPrebill.emailInfo.billingContact,
            primaryContact: this.selectedPrebill.emailInfo.primaryContact,
            updatePrimaryContactEmail: false,
            updateBillingContactEmail: false,
            updateClientEmail: false,
            email: this.selectedPrebill.emailInfo.email,
          },
          print: this.print,
          sendEmail: this.sendEmail,
        },
      ],
      print: this.print,
      sendEmail: this.sendEmail,
    };

    this.billingService
      .v1BillingBillToClientEmailAndPrintPost$Json({
        body: body,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res: vwBillToClientEmailAndPrintResponse) => {
          if (res) {
            if (this.print) {
              let file = UtilsHelper.base64toFile(
                res.invoicesToPrint[0].bytes,
                `invoice_${this.billToClientResponse.invoiceId}_${moment(
                  new Date()
                ).format('MMDDYYYYHHMMSS')}.pdf`,
                'application/pdf'
              );
              saveAs(file);

              let url = URL.createObjectURL(file);
              window.open(url, '_blank');
            }
            this.getPrebillList(false, this.error_data.bill_to_client_success);
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  approveInvoice(row: PreBillingModels.vwPreBilling) {
    if (this.preBillStatusList) {
      this.billingService
        .v1BillingForceApproveprebillPut({
          prebillId: row.id,
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(
          (res) => {
            if (res > 0) {
              this.description = null;
              this.getPrebillList(false, 'Pre-bill approved.');
            } else {
              this.toastr.showError(
                'Some error occured while approving Pre-bill'
              );
            }
          },
          () => { }
        );
    }
  }

  private generateInvoice(row: PreBillingModels.vwPreBilling) {
    this.billingService
      .v1BillingPrebillingGenerateinvoicePrebillidGet({
        prebillid: row.id,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res) => {
          if (res > 0) {
            this.getPrebillList(false, 'Invoice generated for pre-bill.');
            this.loading = false;
          } else {
            this.loading = false;
            this.toastr.showError(
              'Some error occured while generating invoice'
            );
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  private changeStatus(
    row: PreBillingModels.vwPreBilling,
    statusId: number,
    onSuccess: () => void
  ) {
    this.billingService
      .v1BillingPrebillingPut$Json({
        body: {
          id: row.id,
          statusId,
        },
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res) => {
          if (res > 0) {
            onSuccess();
            this.loading = false;
          } else {
            this.loading = false;
            this.toastr.showError(
              'Some Error occured while updating pre-bill status'
            );
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  /**
   * function to check date if future date or past date
   */
  checkDate(date: any) {
    let className = '';
    if (moment(date).isBefore(moment(new Date()).format('MM/DD/YYYY'))) {
      className = 'text-danger';
    }
    return className;
  }

  public forceApprovePreBill(row) {
    let currentDate = moment(new Date()).format('MM/DD/YY');
    if (row.concernedDate) {
      currentDate = moment(row.concernedDate).format('MM/DD/YY');
    }
    this.dialogService
      .confirm(
        'Are you sure you want to force-approve this pre-bill? All charges will be applied to the client’s Balance Due. An invoice will be available to send to the client on the next Bill Issuance date (' +
        currentDate +
        ').',
        'Yes, force-approve',
        'Cancel',
        'Force-Approve Pre-Bill',
        true,
        'modal-lmd'
      )
      .then((response) => {
        if (response) {
          this.loading = true;

          this.billingService
            .v1BillingForceApproveprebillPut({ prebillId: row.id })
            .pipe(map(UtilsHelper.mapData))
            .subscribe(
              (res) => {
                this.getPrebillList(false, 'Pre-bill approved.');
                this.loading = false;
              },
              () => {
                this.loading = false;
              }
            );
        }
      });
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.prebillingList) {
      return this.prebillingList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
