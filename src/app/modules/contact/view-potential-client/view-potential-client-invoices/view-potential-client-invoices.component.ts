import { Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as JSZip from 'jszip';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Options } from 'ng5-slider';
import { Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page } from 'src/app/modules/models';
import { vwBillToClientEmailAndPrintResponse, vwBillToClientResponse, vwBulkInvoiceHTML } from 'src/app/modules/models/bill-to-client.model';
import { vwInvoice } from 'src/app/modules/models/vw-invoice';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { DisplayReverseChargeComponent } from 'src/app/modules/shared/display-reverse-charge/display-reverse-charge.component';
import * as errors from 'src/app/modules/shared/error.json';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { InvoiceService } from 'src/app/service/invoice.service';
import { vwBillToClientPrintAndEmail, vwBillToClientPrintAndEmailItem, vwIdCodeName, vwSendInvoice } from 'src/common/swagger-providers/models';
import { BillingService, MatterService, PotentialClientBillingService, TenantService, TrustAccountService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../../store';

@Component({
  selector: 'app-view-potential-client-invoices',
  templateUrl: './view-potential-client-invoices.component.html',
  styleUrls: ['./view-potential-client-invoices.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ViewPotentialClientInvoicesComponent implements OnInit {
  error_data = (errors as any).default;
  @Input() clientDetail: any;

  errorData = (errors as any).default;

  originalInvoiceList: Array<vwInvoice>;
  invoiceList: Array<vwInvoice>;
  selectedInvoiceList: Array<vwInvoice>;
  selectedTableRow = [];
  selectedInvoice: any;

  @Input() matterId: number;

  invoiceStatusList: Array<any>;
  clientList: Array<vwIdCodeName>;
  sentByList: Array<vwIdCodeName>;

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public invoiceDetls: vwInvoice;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild('invoicePDF', { static: false }) invoicePDF: ElementRef<HTMLDivElement>;

  currentActive: number;

  description: string;
  dateGenerated: Date;
  dateSent: Date;
  dueDate: Date;
  invoicePref: number;
  clientId: number;
  sentById: number;

  rate_min = 100;
  rate_max = 1000;

  rateMin: number = 100;
  rateMax: number = 1000;
  rateOptions: Options = {
    floor: 100,
    ceil: 1000,
    translate: opt => {
      return '$' + opt.toLocaleString('en-US');
    }
  };

  paidInvoiceStatus: vwIdCodeName;
  notIssuedStatus: vwIdCodeName;

  modalOptions: NgbModalOptions;
  closeResult: string;
  hasBillingPermission = false;
  permissionSubscribe: Subscription;
  public loading = true;
  public permissionList: any = {};
  startServiceDate = null;
  endServiceDate = null;
  startBilledDate = null;
  endBilledDate = null;
  titleInvoicePreference = null;
  selectedStatus: Array<number> = [];
  public titleInvoiceStatus = 'Select invoice status';
  private modalRef: NgbModalRef;
  htmlNeedInvoiceIds = [];
  totalInvoiceids = [];
  selectedAction: string;
  private invoiceHTMLs: Array<vwBulkInvoiceHTML> = [];
  bulkDownloadResponse: vwBillToClientResponse;
  public bulkDownload = false;
  public disableBulkEmail = false;
  loginUser: any;
  invoiceTemplateDetails: any;
  tenantDetails: any;
  logoSub: Subscription;
  default_logo_url: string;
  trustAccountStatus: boolean = false;
  missingClientEmails: Array<vwInvoice> = [];
  clientEmail: string = '';
  tenantTierName: string;
  constructor(
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private matterService: MatterService,
    private router: Router,
    private invoiceService: InvoiceService,
    private modalService: NgbModal,
    private store: Store<fromRoot.AppState>,
    private dialogService: DialogService,
    private potentialClientBillingService : PotentialClientBillingService,
    private tenantService: TenantService,
    private appConfigService: AppConfigService,
    private trustAccountService: TrustAccountService,
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;

    this.selectedInvoiceList = [];

    this.logoSub = this.invoiceService
      .loadImage(this.appConfigService.appConfig.default_logo)
      .subscribe((blob) => {
        const a = new FileReader();
        a.onload = (e) => {
          this.default_logo_url = (e.target as any).result;
        };
        a.readAsDataURL(blob);
      });

    this.getDefaultInvoiceTemplate();
    this.getTenantProfile();
    this.checkTrustAccountStatus().then((res) => {});
  }

  ngOnInit() {
    this.loginUser = UtilsHelper.getLoginUser();
    if (this.loginUser && this.loginUser.tenantTier) {
      this.tenantTierName = this.loginUser.tenantTier.tierName;
    }

    if (this.clientDetail && this.clientDetail.id) {
      this.getListItems();
      this.getInvoiceList();

      this.permissionSubscribe = this.store
        .select('permissions')
        .subscribe(obj => {
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
      this.clientEmail = this.clientDetail.isCompany ? this.clientDetail.primaryContactPerson && this.clientDetail.primaryContactPerson.email : this.clientDetail.email;
    } else {
      this.loading = false;
    }
  }

  private getDefaultInvoiceTemplate() {
    this.billingService
      .v1BillingGetDefaultInvoiceTemplateGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.invoiceTemplateDetails = res;
      });
  }

  private getTenantProfile() {
    this.tenantService
      .v1TenantProfileGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res) => {
          this.tenantDetails = res;
        },
        () => {}
      );
  }

  async checkTrustAccountStatus(): Promise<any> {
    let resp: any = await this.trustAccountService
      .v1TrustAccountGetTrustAccountStatusGet$Response()
      .toPromise();
    resp = JSON.parse(resp.body as any).results;
    if (resp) {
      this.trustAccountStatus = resp;
    }
  }

  onSelectRow({ selected }) {
    this.selectedTableRow.splice(0, this.selectedTableRow.length);
    this.selectedTableRow.push(...selected);
  }

  getListItems() {
    this.billingService
      .v1BillingInvoicestatusGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res && res.length) {
          this.invoiceStatusList = res.filter(x =>
            UtilsHelper.invoiceStatusCodes().includes(x.code)
          );
        } else {
          this.invoiceStatusList = [];
        }
      });
  }

  getInvoiceList(populateListItems = true) {
    this.potentialClientBillingService
      .v1PotentialClientBillingInvoicesContactIdGet({
        contactId: this.clientDetail.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          if (res) {
            this.invoiceList = res;
            this.originalInvoiceList = [...res];

            this.calcTotalPages();
            UtilsHelper.aftertableInit();
            this.assignRangeSliderProperties();
            if (populateListItems) {
              this.populateList();
            }
            this.loading = false;
          } else {
            this.showError();
            this.loading = false;
          }
        },
        err => {
          console.log(err);
          this.loading = false;
        },
        () => {}
      );
  }

  private populateList() {
    if (this.invoiceList) {
      this.clientList = this.invoiceList
        .filter(a => a.client)
        .map(a => {
          return a.client;
        });

      this.sentByList = this.invoiceList
        .filter(a => a.sentByPersonId)
        .map(a => {
          return a.sentByPersonId;
        });
    }
  }

  private showError() {
    this.toastr.showError(this.errorData.error_occured);
  }

  private assignRangeSliderProperties() {
    if (this.invoiceList && this.invoiceList.length > 0) {
      this.rate_min = _.minBy(
        this.invoiceList,
        a => a.totalInvoiced
      ).totalInvoiced;

      this.rate_max = _.maxBy(
        this.invoiceList,
        a => a.totalInvoiced
      ).totalInvoiced;

      this.rateMin = Math.floor(this.rate_min);
      this.rateMax = Math.ceil(this.rate_max);

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
    this.calcTotalPages();
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
    if (index === this.currentActive) {
      this.currentActive = null;
    }
  }

  /**
   * select rows
   *
   * @param {*} { selected }
   */
  public onSelect({ selected }) {
    this.selectedInvoiceList.splice(0, this.selectedInvoiceList.length);
    this.selectedInvoiceList.push(...selected);
  }

  public onSelectSingle(row) {
    this.selectedInvoice = row;
  }

  applyFilter() {
    let rows = [...this.originalInvoiceList];

    if (this.description && this.description.trim() != '') {
      const text = this.description.trim().toLowerCase();

      rows = rows.filter(
        a =>
          a.id.toString().includes(text) ||
          this.matchName(a.client, 'name', text) ||
          this.matchName(a.sentByPersonId, 'name', text)
      );
    }

    if (this.clientId) {
      rows = rows.filter(a => this.compareId(a.client, this.clientId));
    }

    if (this.sentById) {
      rows = rows.filter(a => this.compareId(a.sentByPersonId, this.sentById));
    }

    if (this.selectedStatus && this.selectedStatus.length) {
      rows = rows.filter(
        (a: any) =>
          a.invoiceStatusId &&
          this.selectedStatus.includes(a.invoiceStatusId.id)
      );
    }

    if (this.invoicePref) {
      rows = rows.filter(a =>
        this.compareId(a.invoicePreference, this.invoicePref)
      );
    }

    if (this.dateGenerated) {
      rows = rows.filter(
        a =>
          a.generated &&
          +new Date(a.generated).setHours(0, 0, 0, 0) ==
            +new Date(this.dateGenerated).setHours(0, 0, 0, 0)
      );
    }

    if (this.dateSent) {
      rows = rows.filter(
        a =>
          a.sent &&
          +new Date(a.sent).setHours(0, 0, 0, 0) ==
            +new Date(this.dateSent).setHours(0, 0, 0, 0)
      );
    }

    if (this.dueDate) {
      rows = rows.filter(
        a =>
          a.due &&
          +new Date(a.due).setHours(0, 0, 0, 0) ==
            +new Date(this.dueDate).setHours(0, 0, 0, 0)
      );
    }

    if (this.rateMin) {
      rows = rows.filter(a => a.totalInvoiced >= Math.floor(this.rateMin));
    }

    if (this.rateMax) {
      rows = rows.filter(a => a.totalInvoiced <= Math.ceil(this.rateMax));
    }

    if (this.startServiceDate !== null) {
      rows = rows.filter(a =>
        !a.generated
          ? false
          : moment(a.generated).isSameOrAfter(this.startServiceDate, 'd')
      );
    }

    if (this.endServiceDate !== null) {
      rows = rows.filter(a =>
        !a.generated
          ? false
          : moment(a.generated).isSameOrBefore(this.endServiceDate, 'd')
      );
    }

    if (this.startBilledDate !== null) {
      rows = rows.filter(a =>
        !a.billedDate
          ? false
          : moment(a.billedDate).isSameOrAfter(this.startBilledDate, 'd')
      );
    }

    if (this.endBilledDate !== null) {
      rows = rows.filter(a =>
        !a.billedDate
          ? false
          : moment(a.billedDate).isSameOrBefore(this.endBilledDate, 'd')
      );
    }

    if (this.description) {
      rows = rows.filter(
        a =>
          this.matchName(a, 'id', this.description) ||
          this.matchName(a.client, 'name', this.description) ||
          this.matchName(a.matter, 'name', this.description) ||
          this.matchName(a.sentByPersonId, 'name', this.description)
      );
    }

    this.invoiceList = rows;
    this.table.offset = 0;
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

  downloadInvoices() {
    if (this.selectedTableRow && this.selectedTableRow.length === 1) {
      this.router.navigate([`/billing/invoices/pdf`], {
        queryParams: {
          invoiceId: this.selectedTableRow[0].id,
          print: 1,
          pClientId: this.clientDetail.id
        }
      });
    }
  }

  printToPDF(row: vwInvoice) {
    this.router.navigate([`/billing/invoices/pdf`], {
      queryParams: {
        invoiceId: row.id,
        print: 1,
        pClientId: this.clientDetail.id
      }
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
            this.toastr.showSuccess(this.error_data.invoice_send_success);
          } else {
            this.invoiceService.refreshInvoiceList$.next(true);
            this.toastr.showError(this.error_data.invoice_send_failed);
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
      this.toastr.showSuccess(this.error_data.invoice_send_success);
      this.loading = false;
    }
  }

  emailInvoiceAndMarkAsMailed(row: vwInvoice) {
    this.invoiceService.sendEmail$.next({
      invoiceId: row.id,
      markAsMailed: 1
    });
  }

  bulkAction(action: string) {
    this.selectedAction = action;
    this.invoiceHTMLs = [];

    this.totalInvoiceids = this.selectedTableRow ? this.selectedTableRow.map((a) => a.id) : [];
    this.htmlNeedInvoiceIds = this.selectedTableRow
      ? this.selectedTableRow.filter((a) => !a.invoiceFileId).map((a) => a.id)
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
          this.bulkDownload = false;
          this.disableBulkEmail = false;
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

  private bulkDownloadInvoicesAndSendEmail(body) {
    this.billingService
      .v1BillingBulkInvoicesPrintAndSendDownloadLinkPost$Json({
        body
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(() => { });

    this.toastr.showSuccess(this.error_data.bulk_download_invoices_message);
    this.selectedTableRow = [];
    this.getInvoiceList();
    this.bulkDownload = false;
  }

  getContactTypeObj (type: string) {
    return this.clientDetail.corporateContacts.find(d => d.code === type);
  }

  private bulkDownloadInvoice() {
    const invoicesEmailDetail = this.selectedTableRow.map((a) => {
      const neededHTML = this.invoiceHTMLs.find((x) => x.prebillId == a.id);
      return {
        emailInfo: {
          billingContact: this.getContactTypeObj('Billing Contact'),
          email: (this.clientEmail) ? this.clientEmail : null,
          primaryContact: this.getContactTypeObj('Primary Contact'),
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

            this.selectedTableRow = [];
            this.getInvoiceList();
            this.bulkDownload = false;
            this.loading = false;

            if (this.bulkDownloadResponse && this.bulkDownloadResponse.failedItems.length > 0) {
              this.toastr.showError(
                `${this.bulkDownloadResponse.failedItems.length} of ${this.selectedTableRow.length} unbilled invoices download failed`
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

  public emailPrint(emailPrintInvoice, action: string) {
    if (this.selectedTableRow && this.selectedTableRow.length == 0) {
      return;
    }

    this.disableBulkEmail = true;
    this.modalService
      .open(emailPrintInvoice, {
        centered: true,
        backdrop: 'static',
      })
      .result.then((res) => {
        if (res) {
          this.sendBulkEmail();
        } else {
          this.bulkDownload = false;
          this.disableBulkEmail = false;
        }
      });
  }

  private sendBulkEmail() {
    this.selectedAction = 'email';
    this.invoiceHTMLs = [];
    this.totalInvoiceids = this.selectedTableRow ? this.selectedTableRow.map((a) => a.id) : [];

    this.htmlNeedInvoiceIds = this.selectedTableRow
      ? this.selectedTableRow.filter((a) => !a.invoiceFileId).map((a) => a.id)
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

  private _sendEmail() {
    const invoicesEmailDetail = this.selectedTableRow
      .filter((x) => this.totalInvoiceids.includes(x.id))
      .map((a) => {
        const neededHTML = this.invoiceHTMLs.find((x) => x.prebillId == a.id);
        return {
          emailInfo: {
            billingContact: this.getContactTypeObj('Billing Contact'),
            email: (this.clientEmail) ? this.clientEmail : null,
            primaryContact: this.getContactTypeObj('Primary Contact'),
            updateBillingContactEmail: false,
            updateClientEmail: false,
            updatePrimaryContactEmail: false,
          },
          invoiceInfo: neededHTML
            ? neededHTML.invoiceHTML
            : this.getDefaultInvoiceHTML(a),
          invoiceFileId: a.invoiceFileId,
          print: true,
          sendEmail: (this.clientEmail) ? true : false,
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
            if (
              res.failedInvoicesToEmail.length > 0 ||
              res.failedInvoicesToPrint.length > 0
            ) {
              if (res.failedInvoicesToEmail.length > 0) {
                this.toastr.showError(`${res.failedInvoicesToEmail.length} of ${this.selectedTableRow.length} invoices failed to send`);
              }

              if (res.failedInvoicesToPrint.length > 0) {
                this.toastr.showError(`${res.failedInvoicesToPrint.length} of ${this.selectedTableRow.length} invoices failed to print`);
              }
            } else {
              if (body.invoices.length > 1) {
                if (body.invoices.every((a) => a.print && !a.sendEmail)) {
                  this.toastr.showSuccess(this.error_data.invoice_bulk_print_success);
                } else if (
                  body.invoices.every((a) => !a.print && a.sendEmail)
                ) {
                  this.toastr.showSuccess(this.error_data.invoice_bulk_send_success);
                } else {
                  this.toastr.showSuccess(this.error_data.invoice_bulk_send_and_print_success);
                }
              } else {
                if (body.invoices.every((a) => a.print && !a.sendEmail)) {
                  this.toastr.showSuccess(this.error_data.invoice_print_success);
                } else if (
                  body.invoices.every((a) => !a.print && a.sendEmail)
                ) {
                  this.toastr.showSuccess(this.error_data.invoice_send_success);
                } else {
                  this.toastr.showSuccess(this.error_data.invoice_send_and_print_success);
                }
              }
            }

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

            this.selectedTableRow = [];
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

  reverseInvoice(row) {
    this.modalService
      .open(DisplayReverseChargeComponent, {
        centered: true,
        windowClass: 'modal-xlg',
        backdrop: 'static'
      })
      .result.then(res => {
        if (res) {
          const body = {
            invoiceId: row.id,
            clientId: row.client.id,
            matterId: row.matter ? row.matter.id : 0,
            nextInvoicePreference: res.nextInvoicePreference,
            billNarrative: res.billNarrative,
            visibleToClient: res.visibleToClient,
            noteToFile: res.noteToFile,
            dateOfReveresal: moment().format('YYYY-MM-DD')
          };
          this.loading = true;
          this.billingService
            .v1BillingReversebillpreferencePut$Json({ body })
            .subscribe(
              () => {
                this.loading = false;
                if (UtilsHelper.getTenantTierDetails()) {
                  if (row.id && row.client.id && row.matter.id) {
                    this.router.navigate([`contact/edit-charges-potential-client`], {
                      queryParams: {
                        invoiceId: row.id,
                        clientId: row.client.id,
                        matterId: row.matter.id,
                        pageType: 'potentialClient'
                      }
                    });
                  }
                } else {
                  this.toastr.showSuccess(
                    this.errorData.reverse_invoice_success
                  );
                  this.getInvoiceList();
                }
              },
              err => {
                this.loading = false;
              }
            );
        }
      });
  }

  public clearFilter(key: string) {
    switch (key) {
      case 'status':
        {
          this.selectedStatus = [];

          this.invoiceStatusList.forEach(item => (item.checked = false));
          this.titleInvoiceStatus = 'Select invoice status';
          this.applyFilter();
        }
        break;
    }
  }

  public selectStatus(event: any) {
    this.titleInvoiceStatus = '';
    if (event.length > 0) {
      this.titleInvoiceStatus = event.length;
    } else {
      this.titleInvoiceStatus = 'All';
    }
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.invoiceList) {
      return this.invoiceList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

}
