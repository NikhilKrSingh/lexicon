import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgbDropdownConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as JSZip from 'jszip';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Options } from 'ng5-slider';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as errors from 'src/app/modules/shared/error.json';
import { InvoiceService } from 'src/app/service/invoice.service';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwBillToClientPrintAndEmail, vwBillToClientPrintAndEmailItem, vwIdCodeName, vwSendInvoice } from 'src/common/swagger-providers/models';
import { BillingService } from 'src/common/swagger-providers/services';
import { Page } from '../../models';
import { vwBillToClientEmailAndPrintResponse, vwBillToClientResponse, vwBulkInvoiceHTML, vwBulkInvoicePreference } from '../../models/bill-to-client.model';
import { vwInvoice, vwMessage } from '../../models/vw-invoice';
import { DialogService } from '../../shared/dialog.service';
import { DisplayReverseChargeComponent } from '../../shared/display-reverse-charge/display-reverse-charge.component';
import { calculateTotalPages } from '../../shared/math.helper';
import { removeAllBorders, UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-billing-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  providers: [InvoicesComponent],
})
export class InvoicesComponent implements OnInit, OnDestroy {
  error_data = (errors as any).default;

  originalInvoiceList: Array<vwInvoice>;
  invoiceList: Array<vwInvoice>;
  invoiceStatusList: Array<any>;
  invoicePrefList: Array<any>;
  clientList: Array<vwIdCodeName>;
  matterList: Array<vwIdCodeName>;
  sentByList: Array<vwIdCodeName>;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public startServiceDate: string = null;
  public endServiceDate: string = null;
  public startBilledDate: string = null;
  public endBilledDate: string = null;
  public selected: Array<vwInvoice> = [];
  public filterName = 'Apply Filter';
  public titleInvoicePreference = 'Select invoice preferences';
  public titleInvoiceStatus = 'Select invoice status';
  public selectedStatus: Array<number> = [];
  public selectedInvoice: Array<number> = [];
  private invoiceHTMLs: Array<vwBulkInvoiceHTML> = [];
  public disableBulkEmail = false;
  public clienMissingEmailAddress = '';

  @Input() public tenantTierName: string;

  @Input() invoiceTemplateDetails: any;
  @Input() tenantDetails: any;
  @Input() loginUser: any;
  @Input() default_logo_url: any;
  @Input() trustAccountStatus: boolean;
  @ViewChild('saveAndSendEmail', { static: false }) public saveAndSendEmail: ElementRef<HTMLInputElement>;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  currentActive: number;
  description: string;
  dateGenerated: Date;
  dateSent: Date;
  dueDate: Date;
  invoiceStatus: number;
  invoicePref: number;
  clientId: number;
  matterId: number;
  sentById: number;
  rate_min = 100;
  rate_max = 1000;
  rateMin = 100;
  rateMax = 1000;
  rateOptions: Options = {
    floor: 100,
    ceil: 1000,
    translate: (opt) => {
      return '$' + opt.toLocaleString('en-US');
    },
  };
  paperInvoice: vwIdCodeName;
  electronicInvoice: vwIdCodeName;
  paperAndElectronicInvoice: vwIdCodeName;
  bulkPreference: vwBulkInvoicePreference;

  private refreshInvoiceListSub: Subscription;
  private filterSub: Subscription;

  public loading = true;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  private loggedInUser: any;
  bulkDownloadResponse: vwBillToClientResponse;
  public bulkDownload = false;
  hasBillingPermission = false;
  missingClientEmails: Array<vwInvoice> = [];
  removedInvoicesFromEmail: Array<vwInvoice> = [];

  htmlNeedInvoiceIds = [];
  totalInvoiceids = [];
  selectedAction: string;

  bulkEmailAndPrintInvoicesTitle: string;
  bulkEmailAndPrintInvoicesButton: string;
  bulkInvoicePreference: vwBulkInvoicePreference;

  allSelected: boolean;

  loaderCallBack = () => {
    this.loading = false;
  }
  selectedRow: any;

  constructor(
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private router: Router,
    private invoiceService: InvoiceService,
    config: NgbDropdownConfig,
    private store: Store<fromRoot.AppState>,
    private pagetitle: Title,
    private modalService: NgbModal,
    private dialogService: DialogService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.invoiceList = [];
    this.permissionList$ = this.store.select('permissions');

    config.placement = 'bottom-left';
    config.autoClose = true;

    this.refreshInvoiceListSub = this.invoiceService.refreshInvoiceList$.subscribe(
      (res) => {
        if (res) {
          this.getInvoiceList();
        }
      }
    );

    this.filterSub = this.invoiceService.filter.subscribe((text) => {
      this.description = text;
      this.applyFilter();
    });

    this.bulkPreference = {} as vwBulkInvoicePreference;
  }

  ngOnInit() {
    this.pagetitle.setTitle('Invoices');
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (
            this.permissionList.BILLING_MANAGEMENTisEdit ||
            this.permissionList.BILLING_MANAGEMENTisAdmin
          ) {
            this.hasBillingPermission = true;
          }
        }
      }
    });
    this.loggedInUser = UtilsHelper.getObject('profile');
    this.getListItems();
    this.getInvoiceList();
  }

  ngOnDestroy() {
    if (this.refreshInvoiceListSub) {
      this.refreshInvoiceListSub.unsubscribe();
    }
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }

    if (this.filterSub) {
      this.filterSub.unsubscribe();
    }
  }

  getListItems() {
    this.billingService
      .v1BillingInvoicestatusGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        if (res && res.length) {
          this.invoiceStatusList = res.filter(x => UtilsHelper.invoiceStatusCodes().includes(x.code));
        } else {
          this.invoiceStatusList = [];
        }
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

          this.invoicePrefList = [];

          this.invoicePrefList.push(this.electronicInvoice);
          this.invoicePrefList.push(this.paperInvoice);
          this.invoicePrefList.push(this.paperAndElectronicInvoice);
        } else {
          this.invoicePrefList = [];
        }
      });
  }

  getInvoiceList() {
    this.loading = true;
    this.removeSelection();
    this.billingService
      .v1BillingInvoiceListGet()
      .pipe(
        map((res) => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => { })
      )
      .subscribe(
        (res) => {
          if (res) {
            this.assignTableData(res);
            this.loading = false;
          } else {
            this.showError();
            this.loading = false;
          }
        },
        () => {
          this.loading = false;
          this.showError();
        }
      );
  }

  private assignTableData(res) {
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
    response = _.orderBy(response, ['id', 'generated'], ['desc']);
    this.invoiceList = [...response];
    this.originalInvoiceList = [...response];
    this.applyFilter();
    this.page.totalElements = this.invoiceList.length;
    this.page.totalPages = Math.ceil(this.invoiceList.length / this.page.size);
    this.assignRangeSliderProperties();
    UtilsHelper.aftertableInit();
  }

  private showError() { }

  private assignRangeSliderProperties() {
    if (this.invoiceList && this.invoiceList.length > 0) {
      this.rate_min = _.minBy(
        this.invoiceList,
        (a) => a.totalInvoiced
      ).totalInvoiced;

      this.rate_max = _.maxBy(
        this.invoiceList,
        (a) => a.totalInvoiced
      ).totalInvoiced;

      this.rate_min = Math.max(0, this.rate_min - 1);
      this.rate_max = this.rate_max + 1;

      this.rateMin = this.rate_min;
      this.rateMax = this.rate_max;

      this.rateOptions.floor = this.rateMin;
      this.rateOptions.ceil = this.rateMax;

      this.rateOptions = { ...this.rateOptions };
    }
  }

  /**
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateDatatableFooterPage();
    }
    UtilsHelper.aftertableInit();
    this.checkParentCheckbox();
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
    this.page.totalElements = this.invoiceList.length;
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
  onClickedOutside(index: number) {
    if (index === this.currentActive) {
      this.currentActive = null;
    }
  }

  applyFilter() {
    let rows = [];
    if (this.originalInvoiceList && this.originalInvoiceList.length) {
      rows = [...this.originalInvoiceList];
    }
    if (rows.length) {
      if (this.selectedInvoice.length) {
        const temp = [];
        if (this.selectedInvoice && this.selectedInvoice.length > 0) {
          if (this.selectedInvoice && this.selectedInvoice.length) {
            rows.forEach((invoice) => {
              if (invoice.invoicePreference && invoice.invoicePreference.id) {
                if (
                  this.selectedInvoice.includes(invoice.invoicePreference.id)
                ) {
                  temp.push(invoice);
                }
              }
            });
          }
        }
        rows = [...temp];
      }

      if (this.selectedStatus && this.selectedStatus.length) {
        rows = rows.filter((a: any) => a.invoiceStatusId && this.selectedStatus.includes(a.invoiceStatusId.id));
      }

      if (this.startServiceDate !== null) {
        rows = rows.filter((a) =>
          !a.generated
            ? false
            : moment(a.generated).isSameOrAfter(this.startServiceDate, 'd')
        );
      }

      if (this.endServiceDate !== null) {
        rows = rows.filter((a) =>
          !a.generated
            ? false
            : moment(a.generated).isSameOrBefore(this.endServiceDate, 'd')
        );
      }

      if (this.startBilledDate !== null) {
        rows = rows.filter((a) =>
          !a.billedDate
            ? false
            : moment(a.billedDate).isSameOrAfter(this.startBilledDate, 'd')
        );
      }

      if (this.endBilledDate !== null) {
        rows = rows.filter((a) =>
          !a.billedDate
            ? false
            : moment(a.billedDate).isSameOrBefore(this.endBilledDate, 'd')
        );
      }

      if (this.description) {
        rows = rows.filter(
          (a) =>
            this.matchName(a, 'id', this.description) ||
            this.matchName(a.client, 'name', this.description) ||
            this.matchName(a.matter, 'name', this.description) ||
            this.matchName(a.sentByPersonId, 'name', this.description)
        );
      }

      this.invoiceList = [];
      this.invoiceList = [...rows];
      this.updateDatatableFooterPage();
    }
  }


  public onMultiSelectSelectedOptions(event) {
  }

  public selectInvoice(event) {
    this.titleInvoicePreference = '';
    if (event.length > 0) {
      this.titleInvoicePreference = event.length;
    } else {
      this.titleInvoicePreference = 'All';
    }
  }

  public selectStatus(event) {
    this.titleInvoiceStatus = '';
    if (event.length > 0) {
      this.titleInvoiceStatus = event.length;
    } else {
      this.titleInvoiceStatus = 'All';
    }
  }

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

      case 'status':
        {
          this.selectedStatus = [];
          this.invoiceStatusList.forEach((item) => (item.checked = false));
          this.titleInvoiceStatus = 'Select invoice status';
          this.applyFilter();
        }
        break;
    }
  }

  /**
   *
   */
  updateDatatableFooterPage() {
    this.page.totalElements = this.invoiceList.length;
    this.page.totalPages = Math.ceil(this.invoiceList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
    this.checkParentCheckbox();
    UtilsHelper.aftertableInit();
  }

  /**
   * For datatable checkbox
   */

  public onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  private matchName(item: any, fieldName, searchValue: string): boolean {
    const searchName =
      item && item[fieldName] ? item[fieldName].toString().toLowerCase() : '';
    return searchName.search(searchValue) > -1;
  }

  printToPDF(row: vwInvoice) {
    this.router.navigate([`/billing/invoices/pdf`], {
      queryParams: {
        invoiceId: row.id,
        print: 1,
      },
    });
  }

  emailInvoice(row: vwInvoice) {
    this.loading = true;
    if (row.invoiceFileId > 0) {
      this.billingService
        .v1BillingInvoiceSendInvoiceIdMarkAsMailedGet({
          invoiceId: row.id,
          markAsMailed: -1,
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe((res) => {
          if (res > 0) {
            this.invoiceService.refreshInvoiceList$.next(true);
            this.invoiceService.message$.next({
              type: 'Success',
              errors: [this.error_data.invoice_send_success],
            });
          } else {
            this.invoiceService.refreshInvoiceList$.next(true);
            this.invoiceService.message$.next({
              type: 'Error',
              errors: [this.error_data.invoice_send_failed],
            });
          }
          this.loading = false;
        }, () => {
          this.loading = false;
        });
    } else {
      this.invoiceService.sendEmail$.next({
        invoiceId: row.id,
        markAsMailed: 0,
      });
    }
  }

  emailInvoiceAndMarkAsMailed(row: vwInvoice) {
    this.loading = true;
    if (row.invoiceFileId > 0) {
      this.billingService
        .v1BillingInvoiceSendInvoiceIdMarkAsMailedGet({
          invoiceId: row.id,
          markAsMailed: 1,
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe((res) => {
          if (res > 0) {
            this.invoiceService.refreshInvoiceList$.next(true);
            this.invoiceService.message$.next({
              type: 'Success',
              errors: [this.error_data.invoice_send_success],
            });
          } else {
            this.invoiceService.refreshInvoiceList$.next(true);
            this.invoiceService.message$.next({
              type: 'Error',
              errors: [this.error_data.invoice_send_failed],
            });
          }
          this.loading = false;
        }, () => {
          this.loading = false;
        });
    } else {
      this.invoiceService.sendEmail$.next({
        invoiceId: row.id,
        markAsMailed: 1,
      });
      this.loading = false;
    }
  }

  markAsMailed(row: vwInvoice) { }

  bulkAction(action: string) {
    this.selectedAction = action;
    this.invoiceHTMLs = [];

    this.totalInvoiceids = this.selected ? this.selected.map((a) => a.id) : [];
    this.htmlNeedInvoiceIds = this.selected
      ? this.selected.filter((a) => !a.invoiceFileId).map((a) => a.id)
      : [];

    if (this.htmlNeedInvoiceIds.length > 0) {
      this.loading = true;
      this.bulkDownload = true;
      this.disableBulkEmail = true;

      this.billingService
        .v1BillingBulkDownloadInvoicesPost$Json({
          body: {
            invoices: this.htmlNeedInvoiceIds,
          },
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe((resp) => {
          if (resp && resp.succededItems && resp.succededItems.length) {
            this.bulkDownloadResponse = resp;
            (this.bulkDownloadResponse as any).action = action;
            return;
          }
          this.loading = false;
          this.bulkDownload = false;
          this.disableBulkEmail = false;
        }, () => {
          this.loading = false;
        });
    } else {
      if (this.selectedAction === 'print') {
        this.loading = true;
        this.bulkDownload = true;
        this.disableBulkEmail = true;
        this.bulkDownloadInvoice();
      } else {
        this.bulkDownload = true;
        this.disableBulkEmail = true;
        this.sendBulkEmail();
      }
    }
  }

  public downloadAndEmailInvoiceBulk(
    invoiceHTML: vwSendInvoice,
    prebillId: number
  ) {
    this.invoiceHTMLs.push({
      prebillId,
      invoiceHTML,
    });

    if (this.htmlNeedInvoiceIds.length === this.invoiceHTMLs.length) {
      if (this.selectedAction === 'print') {
        this.bulkDownloadInvoice();
      } else {
        this._sendEmail();
      }
    }
  }

  private getDefaultInvoiceHTML(a: vwInvoice) {
    return {
      clientId: a.client.id,
      matterId: a.matter.id,
      invoiceId: a.id,
      email: 'string',
      coverPage: 'string',
      invoiceDetailsPage: 'string',
      headerText: 'string',
      footerText: 'string',
      pages: ['string'],
      markAsMailed: 0,
      loggedinPersonId: this.loginUser.id,
    };
  }

  private bulkDownloadInvoice() {
    const invoicesEmailDetail = this.selected.map((a) => {
      const neededHTML = this.invoiceHTMLs.find((x) => x.prebillId == a.id);
      return {
        emailInfo: {
          billingContact: a.emailInfo.billingContact,
          email: a.emailInfo.email,
          primaryContact: a.emailInfo.primaryContact,
          updateBillingContactEmail: false,
          updateClientEmail: false,
          updatePrimaryContactEmail: false,
        },
        invoiceInfo: neededHTML
          ? neededHTML.invoiceHTML
          : this.getDefaultInvoiceHTML(a),
        invoiceFileId: a.invoiceFileId,
        print: true,
        sendEmail: false,
      } as vwBillToClientPrintAndEmailItem;
    });

    const body: vwBillToClientPrintAndEmail = {
      invoices: invoicesEmailDetail,
      print: true,
      sendEmail: false,
    };

    if (body.invoices.length > 10) {
      this.bulkDownloadInvoicesAndSendEmail(body);
      return;
    }

    this.billingService
      .v1BillingBillToClientEmailAndPrintPost$Json({
        body
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res: vwBillToClientEmailAndPrintResponse) => {
          if (res) {
            const files = res.invoicesToPrint.map((invoice) => {
              return UtilsHelper.base64toFile(
                invoice.bytes,
                `invoice_${invoice.invoiceId}_${moment(new Date()).format(
                  'MMDDYYYYHHMMSS'
                )}.pdf`,
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
            } else {
              saveAs(files[0]);
            }

            this.selected = [];
            this.getInvoiceList();
            this.bulkDownload = false;
            this.loading = false;

            if (this.bulkDownloadResponse.failedItems.length > 0) {
              this.toastr.showError(
                `${this.bulkDownloadResponse.failedItems.length} of ${this.selected.length} unbilled invoices download failed`
              );
            } else {
              if (body.invoices.length > 1) {
                this.toastr.showSuccess(this.error_data.download_bulk_success);
              } else {
                this.toastr.showSuccess(
                  this.error_data.download_single_success
                );
              }
            }
          } else {
            this.toastr.showError(this.error_data.server_error);
            this.getInvoiceList();
            this.bulkDownload = false;
          }
        },
        () => {
          this.getInvoiceList();
          this.bulkDownload = false;
          this.loading = false;
        }
      );
  }

  private bulkDownloadInvoicesAndSendEmail(body) {
    this.billingService
      .v1BillingBulkInvoicesPrintAndSendDownloadLinkPost$Json({
        body
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(() => { });

    this.toastr.showSuccess(this.error_data.bulk_download_invoices_message);
    this.selected = [];
    this.getInvoiceList();
    this.bulkDownload = false;
  }

  private sendBulkEmail() {
    this.selectedAction = 'email';
    this.invoiceHTMLs = [];
    this.totalInvoiceids = this.selected ? this.selected.map((a) => a.id) : [];

    this.htmlNeedInvoiceIds = this.selected
      ? this.selected.filter((a) => !a.invoiceFileId).map((a) => a.id)
      : [];

    if (this.htmlNeedInvoiceIds.length > 0) {
      this.loading = true;
      this.bulkDownload = true;
      this.disableBulkEmail = true;

      this.billingService
        .v1BillingBulkDownloadInvoicesPost$Json({
          body: {
            invoices: this.htmlNeedInvoiceIds,
          },
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe((resp) => {
          if (resp && resp.succededItems && resp.succededItems.length) {
            this.bulkDownloadResponse = resp;
            (this.bulkDownloadResponse as any).action = 'email';
            return;
          }
          this.loading = false;
          this.bulkDownload = false;
          this.disableBulkEmail = false;
        }, () => {
          this.loading = false;
        });
    } else {
      this.bulkDownload = true;
      this.disableBulkEmail = true;
      this._sendEmail();
      this.loading = false;
    }
  }

  private _sendEmail() {
    const invoicesEmailDetail = this.selected
      .filter((x) => this.totalInvoiceids.includes(x.id))
      .map((a) => {
        const neededHTML = this.invoiceHTMLs.find((x) => x.prebillId == a.id);

        let isMissingEmail: vwInvoice;
        if (this.missingClientEmails) {
          isMissingEmail = this.missingClientEmails.find((x) => x.id == a.id);
        }

        return {
          emailInfo: {
            billingContact: a.emailInfo.billingContact,
            email: isMissingEmail
              ? isMissingEmail.missingEmailAddress
              : a.emailInfo.email,
            primaryContact: a.emailInfo.primaryContact,
            updateBillingContactEmail: false,
            updateClientEmail: !!isMissingEmail,
            updatePrimaryContactEmail: false,
          },
          invoiceInfo: neededHTML
            ? neededHTML.invoiceHTML
            : this.getDefaultInvoiceHTML(a),
          invoiceFileId: a.invoiceFileId,
          print: this.canPrintInvoice(a),
          sendEmail: this.canSendEmail(a),
        } as vwBillToClientPrintAndEmailItem;
      });

    const body: vwBillToClientPrintAndEmail = {
      invoices: invoicesEmailDetail,
      print: true,
      sendEmail: true,
    };

    this.loading = true;

    this.billingService
      .v1BillingBillToClientEmailAndPrintPost$Json({
        body
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res: vwBillToClientEmailAndPrintResponse) => {
          if (res) {
            const message: vwMessage = {
              type: 'Success',
              errors: [],
            };

            if (
              res.failedInvoicesToEmail.length > 0 ||
              res.failedInvoicesToPrint.length > 0
            ) {
              message.type = 'Error';
              if (res.failedInvoicesToEmail.length > 0) {
                message.errors.push(
                  `${res.failedInvoicesToEmail.length} of ${this.selected.length} invoices failed to send`
                );
              }

              if (res.failedInvoicesToPrint.length > 0) {
                message.errors.push(
                  `${res.failedInvoicesToPrint.length} of ${this.selected.length} invoices failed to print`
                );
              }
            } else {
              message.type = 'Success';

              if (body.invoices.length > 1) {
                if (body.invoices.every((a) => a.print && !a.sendEmail)) {
                  message.errors = [this.error_data.invoice_bulk_print_success];
                } else if (
                  body.invoices.every((a) => !a.print && a.sendEmail)
                ) {
                  message.errors = [this.error_data.invoice_bulk_send_success];
                } else {
                  message.errors = [
                    this.error_data.invoice_bulk_send_and_print_success,
                  ];
                }
              } else {
                if (body.invoices.every((a) => a.print && !a.sendEmail)) {
                  message.errors = [this.error_data.invoice_print_success];
                } else if (
                  body.invoices.every((a) => !a.print && a.sendEmail)
                ) {
                  message.errors = [this.error_data.invoice_send_success];
                } else {
                  message.errors = [
                    this.error_data.invoice_send_and_print_success,
                  ];
                }
              }
            }

            this.invoiceService.message$.next(message);

            if (res.invoicesToPrint.length > 0) {
              const files = res.invoicesToPrint.map((invoice) => {
                return UtilsHelper.base64toFile(
                  invoice.bytes,
                  `invoice_${invoice.invoiceId}_${moment(new Date()).format(
                    'MMDDYYYYHHMMSS'
                  )}.pdf`,
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
              } else {
                saveAs(files[0]);
              }
            }

            this.selected = [];
            this.getInvoiceList();
            this.bulkDownload = false;
            this.disableBulkEmail = false;
          } else {
            this.toastr.showError(this.error_data.server_error);
            this.getInvoiceList();
            this.bulkDownload = false;
            this.disableBulkEmail = false;
          }
        },
        () => {
          this.getInvoiceList();
          this.bulkDownload = false;
          this.disableBulkEmail = false;
        }
      );
  }

  public emailPrint(emailPrintInvoice, action: string) {
    if (this.selected && this.selected.length == 0) {
      return;
    }

    this.disableBulkEmail = true;
    this.removedInvoicesFromEmail = [];

    this.bulkInvoicePreference = {
      canEmail: this.selected.some((a) => this.canSendEmail(a)),
      canPrint: this.selected.some((a) => this.canPrintInvoice(a)),
    };

    if (
      this.bulkInvoicePreference.canEmail &&
      this.bulkInvoicePreference.canPrint
    ) {
      this.bulkEmailAndPrintInvoicesTitle = this.error_data.bulk_email_and_print_invoices;
      this.bulkEmailAndPrintInvoicesButton = this.error_data.bulk_email_and_print_invoices_btn;
    } else if (
      this.bulkInvoicePreference.canEmail &&
      !this.bulkInvoicePreference.canPrint
    ) {
      this.bulkEmailAndPrintInvoicesTitle = this.error_data.bulk_email_invoices;
      this.bulkEmailAndPrintInvoicesButton = this.error_data.bulk_email_invoices_btn;
    } else {
      this.bulkEmailAndPrintInvoicesTitle = this.error_data.bulk_print_invoices;
      this.bulkEmailAndPrintInvoicesButton = this.error_data.bulk_print_invoices_btn;
    }

    this.modalService
      .open(emailPrintInvoice, {
        centered: true,
        backdrop: 'static',
      })
      .result.then((res) => {
        if (res) {
          if (this.bulkInvoicePreference.canEmail) {
            const missingClientEmails = this.selected.filter(
              (a) => !a.isCompany && !a.emailInfo.email && this.canSendEmail(a)
            );

            this.missingClientEmails = JSON.parse(
              JSON.stringify(missingClientEmails)
            );

            if (missingClientEmails.length > 0) {
              this.modalService
                .open(this.saveAndSendEmail, {
                  centered: true,
                  backdrop: 'static',
                  windowClass: 'modal-slg app-billing-invoices-dialog',
                })
                .result.then((res) => {
                  if (res) {
                    if (res == 'cancel') {
                      this.bulkDownload = false;
                      this.disableBulkEmail = false;
                    } else if (res == 'sendEmailAfterMissingEmail') {
                      this.sendEmailAfterMissingEmail();
                    } else {
                      this.sendBulkEmail();
                    }
                  } else {
                    this.bulkDownload = false;
                    this.disableBulkEmail = false;
                  }
                });
            } else {
              this.sendBulkEmail();
            }
          } else {
            this.sendBulkEmail();
          }
        } else {
          this.bulkDownload = false;
          this.disableBulkEmail = false;
        }
      });
  }

  public checkAndSendEmail(missingClientEmails, modal) {
    missingClientEmails.forEach((a) => {
      a.hasError = false;
    });

    const missingEmails = missingClientEmails.filter(
      (a) => !a.missingEmailAddress
    );

    if (missingEmails.length > 0) {
      missingEmails.forEach((a) => {
        a.hasError = true;
      });
    } else {
      modal.close('sendEmailAfterMissingEmail');
    }
  }

  public removeMissingFromQueue() {
    this.removedInvoicesFromEmail = this.missingClientEmails.filter(
      (a) => !a.missingEmailAddress
    );
  }

  private canSendEmail(row: vwInvoice) {
    return (
      row.invoicePreference &&
      (row.invoicePreference.id == this.electronicInvoice.id ||
        row.invoicePreference.id == this.paperAndElectronicInvoice.id)
    );
  }

  private canPrintInvoice(row: vwInvoice) {
    return (
      row.invoicePreference &&
      (row.invoicePreference.id == this.paperInvoice.id ||
        row.invoicePreference.id == this.paperAndElectronicInvoice.id)
    );
  }

  public get missingClientName() {
    if (
      this.removedInvoicesFromEmail &&
      this.removedInvoicesFromEmail.length > 0
    ) {
      return this.removedInvoicesFromEmail.map((a) => a.client.name).join(', ');
    }
  }

  public sendEmailAfterMissingEmail() {
    this.selectedAction = 'email';
    this.invoiceHTMLs = [];
    this.totalInvoiceids = this.selected ? this.selected.map((a) => a.id) : [];

    this.htmlNeedInvoiceIds = this.selected
      ? this.selected.filter((a) => !a.invoiceFileId).map((a) => a.id)
      : [];

    this.totalInvoiceids = this.totalInvoiceids.filter(
      (a) => !this.removedInvoicesFromEmail.some((x) => x.id == a)
    );

    this.htmlNeedInvoiceIds = this.htmlNeedInvoiceIds.filter(
      (a) => !this.removedInvoicesFromEmail.some((x) => x.id == a)
    );

    if (this.totalInvoiceids.length > 0) {
      if (this.htmlNeedInvoiceIds.length > 0) {
        this.loading = true;
        this.bulkDownload = true;
        this.disableBulkEmail = true;

        this.billingService
          .v1BillingBulkDownloadInvoicesPost$Json({
            body: {
              invoices: this.htmlNeedInvoiceIds,
            },
          })
          .pipe(map(UtilsHelper.mapData))
          .subscribe((resp) => {
            if (resp && resp.succededItems && resp.succededItems.length) {
              this.bulkDownloadResponse = resp;
              (this.bulkDownloadResponse as any).action = 'email';
              return;
            }
            this.loading = false;
            this.bulkDownload = false;
            this.disableBulkEmail = false;
          }, () => {
            this.loading = false;
          });
      } else {
        this.bulkDownload = true;
        this.disableBulkEmail = true;
        this._sendEmail();
      }
    } else {
      this.loading = false;
      this.bulkDownload = false;
      this.disableBulkEmail = false;
    }
  }

  toggleExpandRow(row) {
    if(this.selectedRow && this.selectedRow.id != row.id){
      this.table.rowDetail.collapseAllRows();
      removeAllBorders('app-billing-invoices');
    }
    this.table.rowDetail.toggleExpandRow(row);
  }
  onDetailToggle(event) {
    this.selectedRow = event.value;
  }

  reverseInvoice(row) {
    this.modalService.open(DisplayReverseChargeComponent, {
        centered: true,
        windowClass: 'modal-xlg',
        backdrop: 'static',
      })
      .result.then((res) => {
        if (res) {
          const body = {
            invoiceId: row.id,
            clientId: (row.initialConsult) ? row.client.id : 0,
            matterId: (row.matter) ? row.matter.id : 0,
            nextInvoicePreference: res.nextInvoicePreference,
            billNarrative: res.billNarrative,
            visibleToClient: res.visibleToClient,
            noteToFile: res.noteToFile,
            dateOfReveresal: moment().format('YYYY-MM-DD')
          }
          this.loading = true;
          this.billingService.v1BillingReversebillpreferencePut$Json({body}).subscribe(() => {
            this.loading = false;
            if (UtilsHelper.getTenantTierDetails()) {
              if (row.initialConsult) {
                if (row.id && row.client.id && row.matter.id) {
                  this.router.navigate([`contact/edit-charges-potential-client`], {
                    queryParams: {
                      invoiceId: row.id,
                      clientId: row.client.id,
                      matterId: row.matter.id,
                      pageType: 'billingInvoice'
                    }
                  });
                }
              } else {
                if (row.id && row.matter.id) {
                  this.router.navigate([`billing/invoice/edit-charges`], {
                    queryParams: {
                      invoiceId: row.id,
                      matterId: row.matter.id
                    },
                  });
                }
              }
            } else {
              this.toastr.showSuccess(this.error_data.reverse_invoice_success);
              this.getInvoiceList();
            }
          }, err => {
            this.loading = false;
          });
        }
      });
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj['prebillId'] || obj : index ;
  }

  get footerHeight() {
    if (this.invoiceList) {
      return this.invoiceList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  /**** function to select/deselect only displayed page record */
  selectDeselectRecords() {
    this.allSelected = !this.allSelected
    this.table.bodyComponent.temp.forEach(row => {
      const index = this.invoiceList.findIndex(list => list.id === row.id);
      if (index > -1) {
        this.invoiceList[index]['selected'] = this.allSelected;
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
    this.invoiceList.forEach(list => {
      const selectedIds = this.selected.filter(selected => selected.id === list.id);
      if (selectedIds.length > 0) {
        list['selected'] = true;
      }
    });

    this.checkParentCheckbox();
  }

  checkParentCheckbox() {
    setTimeout(() => {
      const currentArr = []
      this.table.bodyComponent.temp.forEach(row => {
        const existing = this.invoiceList.filter(list => list.id === row.id)[0];
        if (existing) {
          currentArr.push(existing)
        }
      });
      this.allSelected = currentArr.length && currentArr.every(row => row.selected);
    }, 100)
  }

  /*** function to remove selection */
  removeSelection() {
    this.invoiceList.forEach(list => {
      list['selected'] = false;
    })
    this.selected = [];
    this.checkParentCheckbox();
  }
}

