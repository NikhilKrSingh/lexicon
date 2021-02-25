import { Component, EventEmitter, Input, OnDestroy,OnChanges, OnInit, Output, ViewEncapsulation, } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs/Rx';
import { map } from 'rxjs/operators';

import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import {
  BillingService, ClientService,
  MatterService,
  PotentialClientBillingService,
  TenantService
} from 'src/common/swagger-providers/services';
import { vwPCBilledBalance, vwPCUnbilledBalance, } from 'src/app/modules/models/pc-billing.model';
import * as fromRoot from '../../../../store';
import * as fromPermissions from '../../../../store/reducers/permission.reducer';
import * as moment from "moment";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import {
  vwBillToClientEmailAndPrintResponse,
  vwDefaultInvoice,
  vwSuccessBillToClient
} from "../../../models/bill-to-client.model";
import { vwSendInvoice } from "../../../../../common/swagger-providers/models/vw-send-invoice";
import { vwBillToClientPrintAndEmail } from "../../../../../common/swagger-providers/models/vw-bill-to-client-print-and-email";
import { InvoiceService } from "../../../../service/invoice.service";
import { AppConfigService } from "../../../../app-config.service";
import { Router } from "@angular/router";
import { ToastDisplay } from 'src/app/guards/toast-service';

@Component({
  selector: 'app-potential-client-billing-details',
  templateUrl: './potential-client-billing-details.component.html',
  styleUrls: ['./potential-client-billing-details.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class PotentialClientBillingDetailsComponent
  implements OnInit, OnDestroy,OnChanges {
  @Input() clientDetail: any;
  @Input() potentialClient: any;
  @Input() prebillId: number;
  @Input() matterDetails: any;
  @Input() balanceDue: number = null;
  @Input() invoiceId: number;

  @Output() readonly goToLedgerHistoryTab = new EventEmitter();
  @Output() readonly goToInvoicesTab = new EventEmitter();
  @Output() readonly refreshNotes = new EventEmitter();
  @Output() readonly isBillingInProgress = new EventEmitter()

  clientDetails: any;
  sendEmail: boolean = true;
  print = true;
  unbilledFeeStatus: boolean;
  writeOffAccordian: boolean;
  billedBalance: vwPCBilledBalance;
  billedBalanceLoading: boolean = true;
  unbilledBalance: vwPCUnbilledBalance;
  unbilledBalanceLoading: boolean = true;
  feesAccordian: boolean;

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public isConsultAttorney: boolean;
  public billNowMessage: string;
  public chargesBillNow: boolean;
  public billToClientResponse: vwSuccessBillToClient;
  invoiceTemplateDetails: vwDefaultInvoice;
  tenantDetails: any;
  clientEmailInfo: any;
  loginUser: any;
  default_logo_url = '';
  isEmailPresent = false;

  constructor(
    private store: Store<fromRoot.AppState>,
    private potentialClientBillingService: PotentialClientBillingService,
    private matterService: MatterService,
    private modalService: NgbModal,
    private billingService: BillingService,
    private tenantService: TenantService,
    private clientService: ClientService,
    private invoiceService: InvoiceService,
    private appConfigService: AppConfigService,
    private router: Router,
    private toastr: ToastDisplay
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.invoiceService.loadImage(this.appConfigService.appConfig.default_logo).subscribe(blob => {
      const a = new FileReader();
      a.onload = (e) => {
        this.default_logo_url = (e.target as any).result;
      };
      a.readAsDataURL(blob);
    });
  }

  ngOnInit() {
    this.clientDetails = this.clientDetail;
    this.loginUser = UtilsHelper.getLoginUser();
    if (this.clientDetails) {
      this.getBalances();
      this.isEmailPresent = this.clientDetail.isCompany ? this.clientDetail.primaryContactPerson && this.clientDetail.primaryContactPerson.email : this.clientDetail.email
    }
    this.isConsultAttorney = UtilsHelper.checkPermissionOfConsultAtn(this.clientDetails);
    this.getDefaultInvoiceTemplate();
    this.getTenantProfile();
    this.getClientEmailInfo();
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }
  ngOnChanges(changes) {
    if(changes.clientDetail && changes.clientDetail.currentValue){
      this.clientDetails = changes.clientDetail.currentValue
    }
  }


  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  scrollToFees($element) {
    let div = document.querySelector('.contactInfo') as HTMLDivElement;
    setTimeout(() => {
      const heightDiv = +document.getElementById('cfSection').offsetTop +  div.offsetHeight + 120;
      document.querySelector('html, body').scrollTo({ top: heightDiv, behavior: 'smooth' });
    });
    // $element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.feesAccordian = true;
    this.unbilledFeeStatus = true;
  }

  scrollToWriteOff($element) {
   let div = document.querySelector('.contactInfo') as HTMLDivElement;
    setTimeout(() => {
      const heightDiv =
        +document.getElementById('writeOffSection').offsetTop +  div.offsetHeight + 120;
      document.querySelector('html, body').scrollTo({ top: heightDiv, behavior: 'smooth' });
    });
    // $element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.writeOffAccordian = true;
  }

  public getBalances() {
    this.potentialClientBillingService
      .v1PotentialClientBillingBillingWidgetDetailsContactIdGet({
        contactId: this.clientDetails.id,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (balances) => {
          this.billedBalance = balances.billedBalance;
          this.billedBalance.outstandingBalance =
            this.billedBalance.lastInvoiceAmount -
            this.billedBalance.latestPayments -
            this.billedBalance.latestWriteOffs +
            this.billedBalance.latestRefunds;
          this.unbilledBalance = balances.unbilledBalance;
          this.billedBalanceLoading = false;
          this.unbilledBalanceLoading = false;
        },
        () => {
          this.billedBalanceLoading = false;
          this.unbilledBalanceLoading = false;
        }
      );
  }

  public refreshBillingWidget() {
    this.getBalances();
    this.refreshNotes.emit();
  }

  billNow(billNowPopup) {
    this.isBillingInProgress.emit(true);
    this.chargesBillNow = false;
    this.billNowMessage = `There are currently no pending  consultation fees for this potential client. Do you want to generate an invoice based on its current balance?`;
    this.matterService.v1MatterUnbilleditemsMatteridGet({matterid: this.clientDetail.matterId})
      .pipe(map(UtilsHelper.mapData))
      .subscribe((result: any) => {
        if (result.consultationFees && result.consultationFees.length) {
          this.chargesBillNow = true;
          this.billNowMessage = 'This will begin the pre-bill review for any pending consultation fees on this potential client. Are you sure you want to continue?';
        }
        this.isBillingInProgress.emit(false);
        this.print = true;
        if (this.isEmailPresent) {
          this.sendEmail = true
        }
        this.modalService.open(billNowPopup, {
          centered: true,
          backdrop: 'static',
          keyboard: false,
        }).result.then(resp => {
          if (resp) {
            switch (resp) {
              case true:
                this.router.navigate(['/contact/bill-potential-client'], {
                  queryParams: {clientId: this.clientDetail.id}
                });
                break;

              case 'zeroInvoice':
                this.submitBillNow();
                break;
            }
          }
        });
      })
  }

  private getDefaultInvoiceTemplate() {
    this.billingService.v1BillingGetDefaultInvoiceTemplateGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        this.invoiceTemplateDetails = res;
      });
  }

  private getTenantProfile() {
    this.tenantService
      .v1TenantProfileGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          this.tenantDetails = res;
        },
        () => {
        }
      );
  }

  public submitBillNow() {
    const body: any = {
      matterId: +this.clientDetail.matterId,
      totalBillAmount: 0,
      appURL: this.appConfigService.APP_URL,
      consultationFees: [],
      invoiceDueDate: moment(new Date(), 'YYYY-MM-DD')
    };

    this.isBillingInProgress.emit(true);
    this.matterService.v1MatterUnbilleditemsBillToClientPost$Json({
      body
    })
      .pipe(
        map(UtilsHelper.mapData)
      )
      .subscribe(res => {
        this.billToClientResponse = res;
      },
      () => {
        this.isBillingInProgress.emit(false);
      });
  }

  private getClientEmailInfo() {
    this.clientService.v1ClientClientEmailInfoClientIdGet({
      clientId: this.clientDetail.id
    }).pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        if (res) {
          this.clientEmailInfo = res;
        } else {
          this.clientEmailInfo = {};
        }
      });
  }

  sendEmailAndPrint(invoiceHTML: vwSendInvoice) {
    const body: vwBillToClientPrintAndEmail = {
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
      sendEmail: this.sendEmail
    };

    this._sendEmailAndPrint(body);
    this.toastr.showSuccess('Invoice has been generated.');
    this.goToInvoicesTab.emit();
    this.isBillingInProgress.emit(false);
  }

  private _sendEmailAndPrint(body) {
    this.billingService.v1BillingBillToClientEmailAndPrintPost$Json({
      body
    }).pipe(map(UtilsHelper.mapData))
      .subscribe((res: vwBillToClientEmailAndPrintResponse) => {
        if (res) {
          if (this.print) {
            const file = UtilsHelper.base64toFile(
              res.invoicesToPrint[0].bytes,
              `invoice_${this.billToClientResponse.invoiceId}_${moment(new Date()).format('MMDDYYYYHHMMSS')}.pdf`,
              'application/pdf'
            );
            saveAs(file);

            const url = URL.createObjectURL(file);
            window.open(url, '_blank');
          }
        }
      }, () => {
      });
  }
}
