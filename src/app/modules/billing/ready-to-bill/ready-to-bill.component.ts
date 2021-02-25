import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as JSZip from 'jszip';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as errors from 'src/app/modules/shared/error.json';
import { InvoiceService } from 'src/app/service/invoice.service';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwBillToClientPrintAndEmail, vwBillToClientPrintAndEmailItem, vwBulkPrint, vwIdCodeName, vwSendInvoice } from 'src/common/swagger-providers/models';
import { BillingService } from 'src/common/swagger-providers/services';
import { Page } from '../../models';
import { vwBillToClientEmailAndPrintResponse, vwBillToClientResponse, vwBulkInvoiceHTML, vwBulkInvoicePreference, vwBulkReadyToBillHTML, vwSuccessBillToClient } from '../../models/bill-to-client.model';
import { TenantTier } from '../../models/tenant-tier.enum';
import { vwBulkReadyToBillPrint } from '../../models/vw-bulk-ready-to-bill';
import { PreBillingModels } from '../../models/vw-prebilling';
import { calculateTotalPages } from '../../shared/math.helper';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-ready-to-bill',
  templateUrl: './ready-to-bill.component.html',
  styleUrls: ['./ready-to-bill.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ReadyToBillComponent implements OnInit, OnDestroy {
  @ViewChild('billClient', { static: false }) BillToClient: any;

  @Input() tenantTierName: string;
  @Input() invoiceTemplateDetails: any;
  @Input() tenantDetails: any;
  @Input() loginUser: any;
  @Input() default_logo_url: any;
  @Input() trustAccountStatus: boolean;

  public timekeepingList: Array<PreBillingModels.vwBillingLines> = [];
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  private permissionSubscribe: Subscription;
  private filterSub: any;

  error_data = (errors as any).default;

  private loggedInUser: any;
  public originalReadyToBillList: Array<PreBillingModels.vwPreBilling>;
  public permissionList: any = {};
  public page = new Page();
  public pageSelected = 1;
  public SelectionType = SelectionType;
  public counter = Array;
  public limitArray: Array<number> = [10, 30, 50, 100];
  public startServiceDate: string;
  public endServiceDate: string;
  public filterName = 'Apply Filter';
  public titleInvoicePreference = 'Select invoice preferences';
  public selectedInvoice: Array<number> = [];
  public matterDetails: any;
  public loading = true;
  invoicePrefList: Array<any>;
  selectedPrebill: PreBillingModels.vwPreBilling;
  public billedToClientAmt: {
    name: string;
    amount: any;
    invoicePreference: any;
  } = {
    name: '',
    amount: 0,
    invoicePreference: 0,
  };

  paperInvoice: vwIdCodeName;
  electronicInvoice: vwIdCodeName;
  paperAndElectronicInvoice: vwIdCodeName;

  public ColumnMode = ColumnMode;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  currentActive: number;

  public selected: Array<PreBillingModels.vwPreBilling> = [];
  public pageSelector = new FormControl('10');

  public readyToBillList: Array<PreBillingModels.vwPreBilling> = [];
  sendEmail: boolean;
  print: boolean;
  public description: string;

  TenantTier = TenantTier;
  billToClientResponse: vwSuccessBillToClient;
  bulkBillToClientResponse: vwBillToClientResponse;
  bulkPreference: vwBulkInvoicePreference;
  private invoiceHTMLs: Array<vwBulkInvoiceHTML>;

  disableBulkAction = false;

  bulkDownloadResponse: vwBillToClientResponse;
  private bulkInvoiceHTMLs: Array<vwBulkReadyToBillHTML>;

  constructor(
    private modalService: NgbModal,
    private billingService: BillingService,
    private store: Store<fromRoot.AppState>,
    private router: Router,
    private invoiceService: InvoiceService,
    private toastr: ToastDisplay,
    private pagetitle: Title
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');

    this.bulkPreference = {} as vwBulkInvoicePreference;
  }

  ngOnInit() {
    this.pagetitle.setTitle('Ready to Bill');
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });

    this.getReadyToBillList();

    this.filterSub = this.invoiceService.filter.subscribe((text) => {
      this.description = text;
      this.applyFilter();
    });
  }

  ngOnDestroy() {
    if (this.filterSub) {
      this.filterSub.unsubscribe();
    }

    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  getReadyToBillList(loadList = true) {
    this.loading = true;
    this.disableBulkAction = false;
    this.billingService
      .v1BillingReadyToBilListGet()
      .pipe(
        map((res) => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {})
      )
      .subscribe(
        (res) => {
          if (res) {
            this.assignTableData(res, loadList);
            this.loading = false;
          } else {
            this.loading = false;
          }
        },
        () => {
          this.loading = false;
        }
      );

    this.billingService
      .v1BillingInvoicedeliveryListGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        if (res) {
          this.invoicePrefList = res;
        } else {
          this.invoicePrefList = [];
        }
        this.paperInvoice = this.invoicePrefList.find(
          (a) => a.code === 'PAPER'
        );
        this.electronicInvoice = this.invoicePrefList.find(
          (a) => a.code === 'ELECTRONIC'
        );
        this.paperAndElectronicInvoice = this.invoicePrefList.find(
          (a) => a.code === 'PAPER_AND_ELECTRONIC'
        );
      });
  }
  /**
   *  assigns TableData
   */

  private assignTableData(res, loadList = true) {
    let response: any = res;
    if (this.permissionList.BILLING_MANAGEMENTisViewOnly) {
      response = response.filter((list) => {
        if (
          (list.responsibleAttorney &&
            list.responsibleAttorney.id == this.loggedInUser.id) ||
          (list.billingAttorney &&
            list.billingAttorney.id == this.loggedInUser.id)
        ) {
          return true;
        }
        return false;
      });
    }

    this.originalReadyToBillList = [...response];
    this.originalReadyToBillList = _.sortBy(this.originalReadyToBillList, (a) =>
      a.person ? a.person.name.toLowerCase() : ''
    );

    this.page.totalElements = this.readyToBillList.length;
    this.page.totalPages = Math.ceil(
      this.readyToBillList.length / this.page.size
    );

    this.assignRangeSliderProperties();
    UtilsHelper.aftertableInit();
    this.applyFilter();
  }

  /**
   *Function to select invoice preferences
   */
  public selectInvoice(event) {
    this.titleInvoicePreference = '';
    if (event.length > 0) {
      this.titleInvoicePreference = event.length;
    } else {
      this.titleInvoicePreference = 'All';
    }
  }

  /**
   *  Function for clearing filter
   */

  public clearFilter(key: string) {
    switch (key) {
      case 'Invoice':
        {
          this.selectedInvoice = [];
          this.invoicePrefList.forEach((item) => (item.checked = false));
          this.titleInvoicePreference = 'Select invoice preferences';
          this.applyFilter();
        }
        break;
    }
  }

  applyFilter() {
    if (!this.originalReadyToBillList) {
      return;
    }

    let rows = [...this.originalReadyToBillList];

    if (this.selectedInvoice.length) {
      let temp = [];
      if (this.selectedInvoice && this.selectedInvoice.length > 0) {
        if (this.selectedInvoice && this.selectedInvoice.length) {
          this.originalReadyToBillList.forEach((invoice) => {
            if (invoice.invoicePreference && invoice.invoicePreference.id) {
              if (this.selectedInvoice.includes(invoice.invoicePreference.id)) {
                temp.push(invoice);
              }
            }
          });
        }
      }
      rows = [...temp];
    }

    if (this.startServiceDate) {
      rows = rows.filter((a) =>
        !a.createdAt
          ? false
          : moment(a.createdAt).isSameOrAfter(this.startServiceDate, 'd')
      );
    }

    if (this.endServiceDate) {
      rows = rows.filter((a) =>
        !a.createdAt
          ? false
          : moment(a.createdAt).isSameOrBefore(this.endServiceDate, 'd')
      );
    }

    if (this.description) {
      rows = rows.filter(
        (a) =>
          this.matchName(a.person, 'name', this.description) ||
          this.matchName(a.matter, 'name', this.description)
      );
    }

    this.readyToBillList = [];
    this.readyToBillList = rows;
    this.updateDatatableFooterPage();
  }

  private matchName(item: any, fieldName, searchValue: string): boolean {
    const searchName =
      item && item[fieldName] ? item[fieldName].toString().toLowerCase() : '';
    return searchName.search(searchValue) > -1;
  }

  /**
   * Update footer
   */
  updateDatatableFooterPage() {
    this.page.totalElements = this.readyToBillList.length;
    this.page.totalPages = Math.ceil(
      this.readyToBillList.length / this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
  }

  /**
   * Assign Range Slider Properties
   */
  private assignRangeSliderProperties() {
    if (this.readyToBillList && this.readyToBillList.length > 0) {
    }
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateDatatableFooterPage();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  /**
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.page.totalPages = Math.ceil(
      this.readyToBillList.length / this.page.size
    );
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    UtilsHelper.aftertableInit();
  }

  /**
   * For datatable checkbox
   */

  public onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  /**
   * calculates total page
   */

  public calcTotalPages() {
    this.page.totalElements = this.readyToBillList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
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
    if (index == this.currentActive) {
      this.currentActive = null;
    }
  }

  previewReadyToBill(row: PreBillingModels.vwPreBilling) {
    this.router.navigate(['/billing/ready-to-bill/preview-invoice'], {
      queryParams: {
        readyTobillId: row.id,
        matterId: row.matter.id,
      },
    });
  }

  billToClient(row: PreBillingModels.vwPreBilling) {
    if (row) {
      this.selectedPrebill = row;
      this.billedToClientAmt.name = row.matter.name;
      this.billedToClientAmt.amount = row.billedAmount;
      if (row.invoicePreference) {
        this.billedToClientAmt.invoicePreference = row.invoicePreference;
        const invoicePref = row.invoicePreference.id;

        this.sendEmail =
          invoicePref == this.electronicInvoice.id ||
          invoicePref == this.paperAndElectronicInvoice.id;

        this.print =
          invoicePref == this.paperInvoice.id ||
          invoicePref == this.paperAndElectronicInvoice.id;
      }

      this.modalService
        .open(this.BillToClient, {
          centered: true,
          backdrop: 'static',
        })
        .result.then((res) => {
          if (res) {
            this.loading = true;
            this.disableBulkAction = true;
            this.submitBillNow(row);
          } else {
            this.disableBulkAction = false;
          }
        });
    }
  }

  /******* function to bill to client */
  private submitBillNow(row: PreBillingModels.vwPreBilling) {
    this.loading = true;
    const prebills = [row.id];
    this.billingService
      .v1BillingBillToClientPost$Json({
        body: { prebills },
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res) => {
          if (res) {
            if (res.failedItems && res.failedItems > 0) {
              this.toastr.showError(this.error_data.bill_single_invoice_failed);
              this.disableBulkAction = false;
            } else {
              this.billToClientResponse = res.succededItems[0];
            }
          } else {
            this.toastr.showError(this.error_data.server_error);
            this.disableBulkAction = false;
          }
          this.loading = false;
        },
        () => {
          this.loading = false;
          this.disableBulkAction = false;
          this.getReadyToBillList();
        }
      );
  }

  /**
   *  Send Email and Print
   */
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

            this.getReadyToBillList();
            this.toastr.showSuccess(this.error_data.bill_to_client_success);
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

  public bulkBillToClient(BulkbillClientTemplate) {
    this.invoiceHTMLs = [];

    let prebillIds = this.selected ? this.selected.map((a) => a.id) : [];

    this.bulkPreference = {
      canEmail: this.selected.some((a) => this.canSendEmail(a)),
      canPrint: this.selected.some((a) => this.canPrintInvoice(a)),
    };

    this.bulkPreference.sendEmail = this.bulkPreference.canEmail;
    this.bulkPreference.print = this.bulkPreference.canPrint;

    if (prebillIds.length > 0) {
      if (prebillIds.length == 1) {
        this.billToClient(this.selected[0]);
      } else {
        this.modalService
          .open(BulkbillClientTemplate, {
            centered: true,
            backdrop: 'static',
            windowClass: 'modal-lmd',
          })
          .result.then((res) => {
            if (res) {
              this.loading = true;
              this.disableBulkAction = true;
              this.submitBulkBillNow(prebillIds);
            } else {
              this.disableBulkAction = false;
            }
          });
      }
    } else {
      this.toastr.showError(
        this.error_data.select_alteast_one_unbilled_invoice
      );
    }
  }

  private submitBulkBillNow(prebillIds: Array<number>) {
    this.billingService
      .v1BillingBillToClientPost$Json({
        body: {
          prebills: prebillIds,
        },
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res) => {
          if (res) {
            this.bulkBillToClientResponse = res;
          } else {
            this.toastr.showError(this.error_data.server_error);
            this.disableBulkAction = false;
          }
          this.loading = false;
        },
        () => {
          this.loading = false;
          this.getReadyToBillList();
          this.disableBulkAction = false;
        }
      );
  }

  public sendEmailAndPrintBulk(invoiceHTML: vwSendInvoice, prebillId: number) {
    this.invoiceHTMLs.push({
      prebillId: prebillId,
      invoiceHTML: invoiceHTML,
    });

    if (
      this.invoiceHTMLs.length ==
      this.bulkBillToClientResponse.succededItems.length
    ) {
      let invoicesEmailDetail = this.selected.map((a) => {
        return {
          emailInfo: {
            billingContact: a.emailInfo.billingContact,
            email: a.emailInfo.email,
            primaryContact: a.emailInfo.primaryContact,
            updateBillingContactEmail: false,
            updateClientEmail: false,
            updatePrimaryContactEmail: false,
          },
          invoiceInfo: this.invoiceHTMLs.find((x) => x.prebillId == a.id)
            .invoiceHTML,
          print: this.canPrintInvoice(a),
          sendEmail: this.canSendEmail(a),
        } as vwBillToClientPrintAndEmailItem;
      });

      let body: vwBillToClientPrintAndEmail = {
        invoices: invoicesEmailDetail,
        print: this.bulkPreference.print,
        sendEmail: this.bulkPreference.sendEmail,
      };

      this.billingService
        .v1BillingBillToClientEmailAndPrintPost$Json({
          body: body,
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(
          (res: vwBillToClientEmailAndPrintResponse) => {
            if (res) {
              if (this.bulkPreference.print) {
                let files = res.invoicesToPrint.map((invoice) => {
                  return UtilsHelper.base64toFile(
                    invoice.bytes,
                    `invoice_${invoice.invoiceId}_${moment(new Date()).format(
                      'MMDDYYYYHHMMSS'
                    )}.pdf`,
                    'application/pdf'
                  );
                });

                const zip = new JSZip();
                const name = 'Invoices.zip';

                files.forEach((f) => {
                  zip.file(f.name, f);
                });

                zip.generateAsync({ type: 'blob' }).then((content) => {
                  if (content) {
                    saveAs(content, name);
                  }
                });
              }
              this.getReadyToBillList();
              this.disableBulkAction = false;

              if (this.bulkBillToClientResponse.failedItems.length > 0) {
                this.toastr.showError(
                  `${this.bulkBillToClientResponse.failedItems.length} of ${this.selected.length} unbilled invoices failed`
                );
              } else {
                this.toastr.showSuccess(
                  this.error_data.bill_bulk_invoice_success
                );
              }

              this.selected = [];
            } else {
              this.toastr.showError(this.error_data.server_error);
              this.getReadyToBillList();
              this.disableBulkAction = false;
            }
          },
          () => {
            this.getReadyToBillList();
            this.disableBulkAction = false;
          }
        );
    }
  }

  private canSendEmail(row: PreBillingModels.vwPreBilling) {
    return (
      row.invoicePreference &&
      (row.invoicePreference.id == this.electronicInvoice.id ||
        row.invoicePreference.id == this.paperAndElectronicInvoice.id)
    );
  }

  private canPrintInvoice(row: PreBillingModels.vwPreBilling) {
    return (
      row.invoicePreference &&
      (row.invoicePreference.id == this.paperInvoice.id ||
        row.invoicePreference.id == this.paperAndElectronicInvoice.id)
    );
  }

  public downloadUnbilledInvoices() {
    if (this.selected.length > 0) {
      this.bulkInvoiceHTMLs = [];
      this.loading = true;
      this.disableBulkAction = true;

      let prebillIds = this.selected ? this.selected.map((a) => a.id) : [];

      this.billingService
        .v1BillingBulkDownloadReadyToBillOptimizedPost$Json({
          body: {
            prebills: prebillIds,
          },
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(
          (res) => {
            if (res) {
              this.bulkDownloadResponse = res;
            } else {
              this.toastr.showError(this.error_data.server_error);
              this.getReadyToBillList();
              this.disableBulkAction = false;
            }
            this.loading = false;
          },
          () => {
            this.loading = false;
            this.getReadyToBillList();
            this.disableBulkAction = false;
          }
        );
    }
  }

  public downloadAndPrintBulk(
    invoiceHTML: vwBulkReadyToBillPrint,
    prebillId: number
  ) {
    this.bulkInvoiceHTMLs.push({
      prebillId: prebillId,
      invoiceHTML: {
        ...invoiceHTML,
        readyToBillId: prebillId,
      },
    });

    if (
      this.bulkInvoiceHTMLs.length ==
      this.bulkDownloadResponse.succededItems.length
    ) {
      let bulkPrintInvoices: any = this.selected.map((a) => {
        return this.bulkInvoiceHTMLs.find((x) => x.prebillId == a.id)
          .invoiceHTML;
      });

      let body: vwBulkPrint = {
        invoices: bulkPrintInvoices,
      };

      if (body.invoices.length > 5) {
        this.bulkDownloadInvoicesAndSendEmail(body);
      } else {
        this.bulkDownloadInvoices(body);
      }
    }
  }

  private bulkDownloadInvoices(body) {
    this.billingService
      .v1BillingBulkPrintPost$Json({
        body: body,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res: vwBillToClientEmailAndPrintResponse) => {
          if (res) {
            let files = res.invoicesToPrint.map((invoice) => {
              return UtilsHelper.base64toFile(
                invoice.bytes,
                `invoice_${invoice.invoiceId}_${invoice.matterId}_${moment(
                  new Date()
                ).format('MMDDYYYYHHMMSS')}.pdf`,
                'application/pdf'
              );
            });

            if (files.length > 1) {
              const zip = new JSZip();
              const name = 'Invoices.zip';

              files.forEach((f) => {
                zip.file(f.name, f);
              });

              zip.generateAsync({ type: 'blob' }).then((content) => {
                if (content) {
                  saveAs(content, name);
                }
              });
              this.toastr.showSuccess(this.error_data.download_bulk_success);
            } else {
              saveAs(files[0]);
              this.toastr.showSuccess(this.error_data.download_single_success);
            }

            this.selected = [];
            this.getReadyToBillList();
            this.disableBulkAction = false;
          } else {
            this.toastr.showError(this.error_data.server_error);
            this.getReadyToBillList();
            this.disableBulkAction = false;
          }
        },
        () => {
          this.getReadyToBillList();
          this.disableBulkAction = false;
        }
      );
  }

  private bulkDownloadInvoicesAndSendEmail(body) {
    this.billingService
      .v1BillingBulkReadyToBillPrintAndSendDownloadLinkPost$Json({
        body: body,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(() => {});

    this.toastr.showSuccess(this.error_data.bulk_download_invoices_message);
    this.selected = [];
    this.getReadyToBillList();
    this.disableBulkAction = false;
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj['prebillId'] || obj : index ;
  }

  get footerHeight() {
    if (this.readyToBillList) {
      return this.readyToBillList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
