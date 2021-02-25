import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UtilsHelper } from "../../../../shared/utils.helper";
import { Title } from "@angular/platform-browser";
import { PreBillingModels } from "../../../../models/vw-prebilling";
import { InvoiceService } from "../../../../../service/invoice.service";
import { AppConfigService } from "../../../../../app-config.service";
import { Store } from "@ngrx/store";
import * as fromRoot from "../../../../../store";
import { vwBillToClientEmailAndPrintResponse, vwDefaultInvoice } from "../../../../models/bill-to-client.model";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastDisplay } from "../../../../../guards/toast-service";
import { map } from "rxjs/operators";
import { TenantService } from "../../../../../../common/swagger-providers/services/tenant.service";
import {
  BillingService,
  ClientService,
  MatterService, PotentialClientBillingService,
  TrustAccountService
} from "../../../../../../common/swagger-providers/services";
import { vwSendInvoice } from "../../../../../../common/swagger-providers/models/vw-send-invoice";
import { vwBillToClientPrintAndEmail } from "../../../../../../common/swagger-providers/models/vw-bill-to-client-print-and-email";
import * as moment from "moment";
import { SelectionType, ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { CurrencyPipe } from "@angular/common";
import { AddEditConsulationComponent } from "../new-consulation-fee/add-edit-consulation/add-edit-consulation.component";
import { ModalDismissReasons, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { TimeWriteDownComponent } from "../../../../billing/pre-bill/view/time/write-down/write-down.component";
import { DialogService } from "../../../../shared/dialog.service";
import * as errors from "../../../../shared/error.json";

@Component({
  selector: 'app-bill-now',
  templateUrl: './bill-now.component.html',
  styleUrls: ['./bill-now.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BillNowComponent implements OnInit {
  @ViewChild(DatatableComponent, {static: false}) table: DatatableComponent;
  loginUser: any;
  permissionSubscribe: any;
  permissionList$: any;
  permissionList: any;
  prebillingSettings: PreBillingModels.vwPreBilling;
  invoiceTemplateDetails: vwDefaultInvoice;
  tenantDetails: any;
  clientEmailInfo: any;
  default_logo_url = '';
  clientId: any;
  loading: boolean = true;
  invoicePrefList: any;
  paperInvoice: any;
  electronicInvoice: any;
  paperAndElectronicInvoice: any;
  trustAccountEnabled: any;
  clientDetails: any;
  emailAddressToUpdate: any;
  print: boolean;
  sendEmail: boolean;
  billToClientResponse: any;
  paymentDueDate: any;
  consultationFees: any = [];
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  selectedConsultationFees: any = [];
  selectedRow: any;
  private closeResult: string;
  currentActive: any;
  currentActiveDetls: number;
  isAdmin: boolean;
  isWriteDownAdmin: boolean;
  public error_data = (errors as any).default;
  reveredInvoiceAmount: any;
  private newWriteDowns: any = [];
  totalBillAmount: number = 0;
  isEmailPresent: any;

  state: string;


  constructor(
    private pagetitle: Title,
    private invoiceService: InvoiceService,
    private appConfigService: AppConfigService,
    private store: Store<fromRoot.AppState>,
    private route: ActivatedRoute,
    private toastr: ToastDisplay,
    private tenantService: TenantService,
    private billingService: BillingService,
    private trustAccountService: TrustAccountService,
    private clientService: ClientService,
    private matterService: MatterService,
    private modalService: NgbModal,
    private dialogService: DialogService,
    private potentialClientBillingService: PotentialClientBillingService,
    private router: Router
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.prebillingSettings = {} as PreBillingModels.vwPreBilling;
    this.getTenantProfile();

    this.invoiceService.loadImage(this.appConfigService.appConfig.default_logo).subscribe(blob => {
      const a = new FileReader();
      a.onload = (e) => {
        this.default_logo_url = (e.target as any).result;
      };
      a.readAsDataURL(blob);
    });
  }

  ngOnInit() {
    this.pagetitle.setTitle('Bill Now');
    this.loginUser = UtilsHelper.getLoginUser();
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;

          let loginUserAttorny = UtilsHelper.checkPermissionOfConsultAtn(
            this.clientDetails
          );

          if (
            loginUserAttorny ||
            this.permissionList.BILLING_MANAGEMENTisEdit ||
            this.permissionList.BILLING_MANAGEMENTisAdmin ||
            this.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin ||
            this.permissionList.CLIENT_CONTACT_MANAGEMENTisEdit
          ) {
            this.isAdmin = true;
          }

          if (
            loginUserAttorny ||
            this.permissionList.BILLING_MANAGEMENTisEdit ||
            this.permissionList.BILLING_MANAGEMENTisAdmin
          ) {
            this.isWriteDownAdmin = true;
          }

          if (
            this.permissionList.CLIENT_CONTACT_MANAGEMENTisEdit ||
            this.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin
          ) {
            this.state = 'edit';
          } else {
            this.state = 'view';
          }
        }
      }
    });
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'];

      if (this.clientId) {
        this.getClientDetails();
        this.getClientEmailInfo();
        this.getInvoicePreferences();
        this.getDefaultInvoiceTemplate();
        this.checkTrustAccountStatus();
      } else {

        this.loading = false;
      }
    });
  }

  getClientDetails() {
    this.clientService
      .v1ClientClientIdGet({clientId: this.clientId})
      .subscribe(
        (res) => {
          this.clientDetails = JSON.parse(res as any).results;
          this.isEmailPresent = this.clientDetails.isCompany ? this.clientDetails.primaryContactPerson && this.clientDetails.primaryContactPerson.email : this.clientDetails.email
          this.getUnbilledItems();
          this.getReversedInvoiceInfo();
        },
        (err) => {
        }
      );
  }

  private checkTrustAccountStatus() {
    this.trustAccountService.v1TrustAccountGetTrustAccountStatusGet$Response().toPromise().then(res => {
      let resp = JSON.parse(res.body as any).results;
      if (resp) {
        this.trustAccountEnabled = resp;
      }
    });
  }

  private getInvoicePreferences() {
    this.billingService.v1BillingInvoicedeliveryListGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.invoicePrefList = res;
          this.paperInvoice = this.invoicePrefList.find(
            a => a.code === 'PAPER'
          );
          this.electronicInvoice = this.invoicePrefList.find(
            a => a.code === 'ELECTRONIC'
          );
          this.paperAndElectronicInvoice = this.invoicePrefList.find(
            a => a.code === 'PAPER_AND_ELECTRONIC'
          );
        } else {
          this.invoicePrefList = [];
        }
      });
  }

  private getDefaultInvoiceTemplate() {
    this.billingService.v1BillingGetDefaultInvoiceTemplateGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        this.invoiceTemplateDetails = res;
      });
  }

  private getTenantProfile() {
    const userInfo: any = UtilsHelper.getLoginUser();
    if (userInfo && userInfo.tenantId) {
      this.tenantDetails = {
        tenantId: userInfo.tenantId
      } as any;
      this.getTenantBillingSettings();
    } else {
      this.tenantService
      .v1TenantProfileGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          this.tenantDetails = res;
          this.getTenantBillingSettings();
        },
        () => {
        }
      );
    }
  }

  getTenantBillingSettings() {
    this.billingService.v1BillingSettingsTenantTenantIdGet({tenantId: this.tenantDetails.tenantId})
      .pipe(map(UtilsHelper.mapData))
      .subscribe((result) => {
        const paymentDueDate = moment(new Date()).add(result[0].daysToPayInvoices, 'days');
        this.paymentDueDate = paymentDueDate.toDate();
      })
  }

  public previewInvoice() {
    let queryParams: any = {
      matterId: this.clientDetails.matterId,
      clientId: this.clientDetails.id
    };
    const consultationFeesId = [];
    this.consultationFees.map((obj) => {
      consultationFeesId.push(obj.consultationFeeList.id);
    });
    queryParams.consultationFeesId = consultationFeesId.join();
    this.router.navigate(['/contact/bill-now-invoice'], {
      queryParams: queryParams
    });
  }

  private getClientEmailInfo() {
    this.clientService.v1ClientClientEmailInfoClientIdGet({
      clientId: this.clientId
    }).pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.clientEmailInfo = res;
      });
  }

  public sendEmailAndPrint(invoiceHTML: vwSendInvoice, emailAddressNotonFile) {
    let body: vwBillToClientPrintAndEmail = {
      invoices: [
        {
          invoiceInfo: invoiceHTML,
          emailInfo: {
            billingContact: this.clientEmailInfo.billingContact,
            primaryContact: this.clientEmailInfo.primaryContact,
            updatePrimaryContactEmail: false,
            updateBillingContactEmail: false,
            updateClientEmail: false,
            email: this.clientEmailInfo.email
          },
          print: this.print,
          sendEmail: this.sendEmail
        }
      ],
      print: this.print,
      sendEmail: this.sendEmail && !!this.isEmailPresent
    };

    this._sendEmailAndPrint(body);
    this.redirectToBillingTab();
  }

  private _sendEmailAndPrint(body) {
    this.billingService.v1BillingBillToClientEmailAndPrintPost$Json({
      body: body
    })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res: vwBillToClientEmailAndPrintResponse) => {
        if (res) {
          if (this.print) {
            let file = UtilsHelper.base64toFile(
              res.invoicesToPrint[0].bytes,
              `invoice_${this.billToClientResponse.invoiceId}_${moment(new Date()).format('MMDDYYYYHHMMSS')}.pdf`,
              'application/pdf'
            );
            saveAs(file);

            let url = URL.createObjectURL(file);
            window.open(url, '_blank');
          }
        }
      }, () => {
        this.loading = false;
      });
  }

  redirectToBillingTab() {
    this.toastr.showSuccess(this.error_data.bill_to_potential_client_success);
    this.router.navigate(['/contact/view-potential-client'], {queryParams: {clientId: this.clientDetails.id}});
  }

  getUnbilledItems() {
    this.matterService.v1MatterUnbilleditemsMatteridGet({matterid: this.clientDetails.matterId})
      .pipe(map(UtilsHelper.mapData))
      .subscribe((result: any) => {
        if (result.consultationFees && result.consultationFees.length) {
          this.consultationFees = [...result.consultationFees];
          this.selectedConsultationFees = [...this.consultationFees];
        }
        this.loading = false;
      })
  }

  public getSummaryOfAmount(cells: number[]) {
    const filteredCells = cells.filter(cell => !!cell);
    const sum = filteredCells.reduce((a, b) => a + b, 0);
    if (sum) {
      let cp = new CurrencyPipe('en-US');
      return cp.transform(sum || 0, 'USD', 'symbol', '1.2-2');
    } else {
      return null;
    }
  }

  onSelectRow($event) {
    this.selectedConsultationFees = ($event && $event.selected) ? $event.selected : [];
  }

  addConsulation(action, row = null, $event) {
    if ($event && $event.target && row && $event.target.closest('datatable-body-cell')) {
      $event.target.closest('datatable-body-cell').blur();
    }

    let modalRef = this.modalService.open(AddEditConsulationComponent, {
      centered: true,
      keyboard: false,
      backdrop: 'static',
    });
    if (action == 'edit') {
      modalRef.componentInstance.selectedRow = row;
    }
    modalRef.componentInstance.action = action;
    modalRef.componentInstance.clientDetails = this.clientDetails;
    modalRef.result.then((res) => {
      if (res) {
        this.getUnbilledItems();
      }
    });
  }

  openModal(row, content, className: any = null, winClass: any = null) {
    this.selectedRow = row;
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
      })
      .result.then(
      (result) => {
        this.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  getDismissReason(reason) {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  deleteConsultation() {
    this.potentialClientBillingService
      .v1PotentialClientBillingConsultationFeeIdDelete$Response({
        id: this.selectedRow.consultationFeeList.id,
      })
      .subscribe((res) => {
        res = JSON.parse(res.body as any).results;
        if (res) {
          this.modalService.dismissAll();
          this.toastr.showSuccess('Consultation fee successfully deleted.');
          this.getUnbilledItems();
          this.selectedRow = null;
        }
      });
  }

  witeDown(row, action, details) {
    row = {
      id: row.consultationFeeList.id,
      amount: row.consultationFeeList.displayAmount,
      oriAmount: row.consultationFeeList.displayAmount,
      date:
        action == 'add'
          ? row.consultationFeeList.dateOfService
          : row.writeDownDetailList.length > 0
          ? row.writeDownDetailList[0].writeDownDateTime
          : null,
      person: {name: row.consultationFeeList.timeKeeper},
      disbursementType: {
        code: row.consultationFeeList.code,
        description: row.consultationFeeList.name,
        isBillable: null,
      },
      status: {
        name: row.consultationFeeList.status
      },
      hours: {
        value: {
          hours: row.consultationFeeList.totalHours,
          minutes: row.consultationFeeList.totalMins,
        },
      },
      writeDown:
        row.writeDownDetailList.length > 0
          ? [
            {
              writeDownAmount: row.writeDownDetailList[0].writeDownAmount,
              writeDownCode: {
                code: row.writeDownDetailList[0].code,
                name: row.writeDownDetailList[0].name,
              },
            },
          ]
          : null,
    };
    details = {
      id: details ? details.id : null,
      writeDownAmount: details ? details.writeDownAmount : null,
      writeDownCode: details
        ? {
          code: details.code,
          name: details.name,
          id: details.writeDownCodeId,
          WriteDownCodeId: details.writeDownCodeId,
        }
        : null,
      writeDownNarrative: details ? details.writeDownNarrative : null
    };
    let modalRef = this.modalService.open(TimeWriteDownComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'create-new-time-entry modal-xlg',
    });
    this.onClickedOutside();
    modalRef.componentInstance.rowDetails = {...row};
    modalRef.componentInstance.writeDownDetails = {...details};
    modalRef.componentInstance.type = 'consultation';

    if (action == 'add') {
      modalRef.componentInstance.billedAmount = Math.round(
        row.amount
      ).toString();
      modalRef.componentInstance.title = 'Consultation Fee Write-Down';
    }

    if (action === 'edit') {
      modalRef.componentInstance.isEdit = true;
      modalRef.componentInstance.writeDownDetails = details;
      modalRef.componentInstance.title = 'Edit Consultation Fee Write-Down';
      modalRef.componentInstance.rowDetails.amount +=
        details.writeDownAmount || 0;
    }

    if (action === 'view') {
      modalRef.componentInstance.isView = true;
      modalRef.componentInstance.title = 'View Consultation Fee Write-Down';
      modalRef.componentInstance.writeDownDetails = details;
      modalRef.componentInstance.rowDetails.amount +=
        details.writeDownAmount || 0;
    }

    modalRef.result.then((res) => {
      if (res && res.action) {
        if (res.action === 'add') {
          this.newWriteDowns.push(res.id);
        }
        this.getUnbilledItems();
      }
    });
  }

  getRowClass(row): string {
    let cssClass = '';
    if (row.isExpended) {
      cssClass = 'expanded-row';
    }
    return cssClass;
  }

  async removeWriteDown(row) {
    const resp: any = await this.dialogService.confirm(
      'You are about to delete a time write-down from this pre-bill, Do you want to continue?',
      'Yes, delete Write-Down',
      'Cancel',
      'Delete Consultation Fee Write-Down',
      true,
      ''
    );
    if (resp) {
      try {
        await this.billingService
          .v1BillingWriteDownIdDelete({id: row.id})
          .toPromise();
        this.toastr.showSuccess('Consultation Fee Write-Down deleted.');
        this.getUnbilledItems();
      } catch (err) {
      }
    }
  }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
    row['isExpended'] = !row['isExpended'];
  }


  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  private getReversedInvoiceInfo() {
    this.billingService.v1BillingGetCancelledInvoiceAmountMatterIdGet({
      matterId: this.clientDetails.matterId
    })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        this.reveredInvoiceAmount = res;
      });
  }


  onClickedOutside() {
    this.currentActive = null;
  }

  onClickedOutsidedetls(event: any, index: number) {
    if (index === this.currentActiveDetls) {
      this.currentActiveDetls = null;
    }
  }

  openMenudetls(index: number, event): void {
    setTimeout(() => {
      if (this.currentActiveDetls !== index) {
        this.currentActiveDetls = index;
      } else {
        this.currentActiveDetls = null;
      }
    }, 50);
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  public cancel() {
    this.dialogService.confirm(
      this.error_data.pc_cancel_bill_now_warning_message,
      'Yes, Cancel Bill Now',
      'Cancel',
      'Cancel Bill Now',
      true,
      'modal-lmd'
    ).then(response => {
      if (response) {
        if (this.newWriteDowns.length > 0) {
          this.matterService.v1MatterCancelBillnowPost$Json({body: {writeDownIds: this.newWriteDowns}})
            .pipe(map(UtilsHelper.mapData))
            .subscribe(res => {
                this.router.navigate(['/contact/view-potential-client'], {
                    queryParams: {
                    clientId: this.clientDetails.id,
                    state: this.state
                  }}
                );
              },
              () => {
              });
        } else {
          this.router.navigate(['/contact/view-potential-client'], {
            queryParams: {
              clientId: this.clientDetails.id,
              state: this.state
            }}
          );
        }
      }
    });
  }

  billToClient(billToClientWarningTemplate) {
    this.totalBillAmount = 0;
    this.print = true;
    if (this.isEmailPresent) {
      this.sendEmail = true;
    }
    this.selectedConsultationFees.forEach(consultationFee => {
      this.totalBillAmount += consultationFee.consultationFeeList.displayAmount
    })
    this.totalBillAmount = this.totalBillAmount - this.reveredInvoiceAmount;
    const consultationFeesId = [];
    this.selectedConsultationFees.map((obj) => {
      consultationFeesId.push(obj.consultationFeeList.id);
    });

    let body = {
      matterId: +this.clientDetails.matterId,
      totalBillAmount: this.totalBillAmount,
      appURL: this.appConfigService.APP_URL,
      consultationFees: consultationFeesId,
      invoiceDueDate: this.paymentDueDate
    }
    this.modalService.open(billToClientWarningTemplate, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    }).result.then(res => {
      if (res) {
        this.submitBillNow(body);
      }
    });
  }

  public submitBillNow(body) {
    this.loading = true;
    this.matterService.v1MatterUnbilleditemsBillToClientPost$Json({
      body: body
    })
      .pipe(
        map(UtilsHelper.mapData)
      )
      .subscribe(res => {
          if (res) {
            this.billToClientResponse = res;
          } else {
            this.toastr.showError(this.error_data.server_error);
          }
        },
        () => {
          this.loading = false;
        });
  }


}
