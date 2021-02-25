import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import * as moment from 'moment';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { InvoiceService } from 'src/app/service/invoice.service';
import { vwBillingSettings, vwClient, vwReceiptTemplate } from 'src/common/swagger-providers/models';
import { BillingService, TenantService } from 'src/common/swagger-providers/services';
import { vwTenantProfile } from '../../models/firm-settinngs.model';
import { RoutingNumberPipe } from '../pipes/routing-number.pipe';
import { SharedService } from '../sharedService';
import { UtilsHelper } from '../utils.helper';

@Component({
  selector: 'app-common-receipt-pdf',
  templateUrl: './receipt-pdf.component.html',
  styleUrls: ['./receipt-pdf.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class CommonReceiptPdfComponent implements OnInit, OnChanges {
  @Input() clientData: any;
  @Input() recordData: any;
  @Input() isInitialConsultation = false;

  @Input() isMatterPayment = false;
  @Input() matterId: number;

  @Input() isPaymentToTrust = false;

  @ViewChild('receiptPdf', { static: false }) receiptPdf: ElementRef<HTMLDivElement>;

  tenantDetails: vwTenantProfile;
  billingSettings: vwBillingSettings;

  receiptTemplate: vwReceiptTemplate;
  receiptHTML: string;

  @Input() callback: () => void;

  loginuser: any;

  @Input() tenant_details: any;
  @Input() receipt_template: any;

  constructor(
    private invoiceService: InvoiceService,
    private tenantService: TenantService,
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private sharedService: SharedService
  ) {
    this.loginuser = UtilsHelper.getLoginUser();
  }

  ngOnInit() {
    if (this.tenant_details && this.receipt_template) {
      this.tenantDetails = this.tenant_details;
      this.receiptTemplate = this.receipt_template;
      this.loadReceiptInfo();
    } else {
      this.tenantService
      .v1TenantProfileGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res) => {
          this.tenantDetails = res;
          this.getBillingSettings();
        },
        () => {
        }
      );
    }
  }

  ngOnChanges() {
    if (this.clientData && this.recordData && this.receiptTemplate) {
      this.loadReceiptInfo();
    }
  }

  private getBillingSettings() {
    this.billingService
      .v1BillingSettingsTenantTenantIdGet({
        tenantId: this.tenantDetails.tenantId,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res) => {
          if (res && res.length > 0) {
            this.billingSettings = res[0];
          } else {
            this.billingSettings = {} as vwBillingSettings;
          }

          if (this.billingSettings.receiptTemplateId) {
            this.getTemplate();
          } else {
            this.toastr.showError('No Default Receipt Template Found.');
          }
        },
        () => {
        }
      );
  }

  private getTemplate() {
    this.billingService
      .v1BillingGetreceipttemplatebyidTemplateIdGet({
        templateId: this.billingSettings.receiptTemplateId,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.receiptTemplate = res;

        this.loadReceiptInfo();
      });
  }

  private loadReceiptInfo() {
    if (this.receiptTemplate) {
      this.receiptHTML = this.receiptTemplate.templateContent;

      this.replace('[FirmName]', this.tenantDetails.tenantName);

      let recordData = this.recordData;
      let clientData = this.clientData;

      let dp = new DatePipe('en-US');
      let cp = new CurrencyPipe('en-US');

      if (
        recordData &&
        recordData.paymentDetails &&
        recordData.paymentDetails.billingAddress
      ) {

        if (recordData.paymentDetails.billingAddress.address2) {
          this.replace(
            '[Address1]',
            recordData.paymentDetails.billingAddress.address1 ||
            recordData.paymentDetails.billingAddress.street
          );

          this.replace(
            '[Address2]',
            recordData.paymentDetails.billingAddress.address2 || ' '
          );
        } else {
          this.replace(
            '[Address1],',
            recordData.paymentDetails.billingAddress.address1 ||
            recordData.paymentDetails.billingAddress.street
          );
          this.replace(
            '[Address2]',
            recordData.paymentDetails.billingAddress.address2 || ' '
          );
        }

        this.replace('[City]', recordData.paymentDetails.billingAddress.city);
        this.replace('[State]', recordData.paymentDetails.billingAddress.state);
        this.replace(
          '[Zip]',
          recordData.paymentDetails.billingAddress.zip ||
            recordData.paymentDetails.billingAddress.zipCode
        );
      } else {
        if (
          clientData &&
          clientData.addresses &&
          clientData.addresses.length > 0
        ) {
          let address = clientData.addresses[0];

          this.replace('[Address1]', address.address);
          this.replace('[Address2]', address.address2 || ' ');
          this.replace('[City]', address.city);
          this.replace('[State]', address.state);
          this.replace('[Zip]', address.zip);
        }
      }

      if (
        recordData.methodType === 'Cash' ||
        recordData.methodType === 'Check' ||
        recordData.methodType == 'E-Check'
      ) {
        this.replace(/\[PaymentModeClass\]/g, 'd-block-1');
        this.replace(/\[CreditCardClass\]/g, 'd-none');
        this.replace(
          '[PaymentMode]',
          recordData.methodType === 'Check' ? 'Check' : recordData.methodType
        );
      } else {
        this.replace(/\[PaymentModeClass\]/g, 'd-none');
      }

      if (recordData.methodType === 'Credit Card') {
        this.replace(/\[CreditCardClass\]/g, 'd-block-1');
        this.replace('[CardHolderName]', recordData.paymentDetails.name);
        this.replace('[CardNumber]', 'xxxx xxxx xxxx ' + recordData.cardNumber);
      } else {
        this.replace(/\[CreditCardClass\]/g, 'd-none');
      }

      if (recordData.methodType === 'Check') {
        this.replace(/\[CheckClass\]/g, 'd-block-1');
        this.replace('[CheckNumber]', recordData.checkNumber);
      } else {
        this.replace(/\[CheckClass\]/g, 'd-none');
      }

      let routingNumberPipe = new RoutingNumberPipe();

      if (recordData.methodType === 'E-Check') {
        this.replace(/\[E-CheckClass\]/g, 'd-block-1');
        this.replace('[ECheckName]', recordData.paymentDetails.name);
        this.replace(
          '[RoutingNumber]',
          routingNumberPipe.transform(recordData.routingNumber)
        );
        this.replace(
          '[AccountNumber]',
          '---- ---- ' + recordData.accountNumber.substr(recordData.accountNumber.length - 4)
        );
      } else {
        this.replace(/\[E-CheckClass\]/g, 'd-none');
      }

      if (recordData.authCode && recordData.methodType != 'Cash') {
        this.replace(/\[AuthCodeClass\]/g, 'd-block-1');
        this.replace('[AuthCode]', recordData.authCode);
      } else {
        this.replace(/\[AuthCodeClass\]/g, 'd-none');
      }

      this.replace('[TargetAccount]', recordData.targetAccount || 'Operating');
      this.replace('[ReferenceNumber]', recordData.paymentId);
      this.replace('[ClientID]', clientData.id);
      this.replace(
        '[RemainingBalance]',
        recordData.waiveRemainingAmount == 'Yes' && !recordData.isFullPayment
          ? '$0.00(waived)'
          : recordData.amountRemaining && !recordData.isFullPayment
          ? cp.transform(recordData.amountRemaining, 'USD', 'symbol', '1.2-2')
          : '$0.00'
      );

      if (recordData.remainingBalDueDate) {
        this.replace('[DueDateClass]', 'd-block-1');
        this.replace('[DueDate]', dp.transform(recordData.remainingBalDueDate, 'MM/dd/yyyy'));
      } else {
        this.replace('[DueDateClass]', 'd-none');
      }

      let taxAmount = 0;

      if (!String(recordData.postingDate).includes('Z')) {
        recordData.postingDate = recordData.postingDate + 'Z';
      }

      this.replace('[AmountToPay]', cp.transform(recordData.amountToPay, 'USD', 'symbol', '1.2-2'));
      this.replace('[Tax]', cp.transform(taxAmount, 'USD', 'symbol', '1.2-2'));
      this.replace('[TotalAmount]', cp.transform(recordData.amountToPay, 'USD', 'symbol', '1.2-2'));
      this.replace('[PaymentDate]', dp.transform(recordData.postingDate, 'MM/dd/yyyy h:mm a'));

      this.sendEmail();
    }
  }

  private replace(key, value) {
    try {
      if (value == null || value == undefined) {
        this.receiptHTML = this.receiptHTML.replace(key, key);
      } else {
        this.receiptHTML = this.receiptHTML.replace(key, value);
      }
    } catch {
      this.receiptHTML = this.receiptHTML.replace(key, key);
    }
  }

  printPdf(stopLoader = true) {
    if (this.receiptPdf) {
      const pdf = this.receiptPdf.nativeElement.innerHTML;
      this.invoiceService.printPDF(pdf).subscribe(
        (res) => {
          const file = UtilsHelper.base64toFile(
            res.results,
            `Receipt_${moment(new Date()).format('MMDDYYYYHHMMSS')}.pdf`,
            'application/pdf'
          );
          saveAs(file);
          if (stopLoader) {
            this.sharedService.printReceipt$.next(true);
          }
        },
        (error) => {
          this.sharedService.printReceipt$.next(true);
        }
      );
    }
  }

  private sendEmail() {
    if (this.isInitialConsultation) {
      setTimeout(() => {
        this.sendConsultationEmail(this.clientData);
      }, 100);
    }

    if (this.isMatterPayment) {
      setTimeout(() => {
        this.sendMatterPaymentEmail(this.clientData);
      }, 100);
    }

    if (this.isPaymentToTrust) {
      setTimeout(() => {
        this.sendPaymentToTrustEmail(this.clientData);
      }, 100);
    }

    if (this.callback) {
      this.callback();
    }
  }

  sendConsultationEmail(pc: vwClient) {
    if (this.receiptPdf) {
      const pdf = this.receiptPdf.nativeElement.innerHTML;
      this.billingService.v1BillingInitialconsultPaymentemailSendPut$Json({
        body: {
          clientId: pc.id,
          paymentAmount: +this.recordData.amountToPay,
          receiptHTML: btoa(unescape(encodeURIComponent(pdf))),
          consulationDate: this.recordData.initialConsultationDate
        }
      }).subscribe(
        (res) => {
        },
        (error) => {
        }
      );
    }
  }

  sendMatterPaymentEmail(pc: vwClient) {
    if (this.receiptPdf) {
      const pdf = this.receiptPdf.nativeElement.innerHTML;
      this.billingService.v1BillingMatterPaymentEmailSendMatterIdPost$Json({
        matterId: this.matterId,
        body: {
          clientId: pc.id,
          paymentAmount: +this.recordData.amountToPay,
          receiptHTML: btoa(unescape(encodeURIComponent(pdf))),
          paymentId: this.recordData.paymentId
        }
      }).subscribe(
        (res) => {
        },
        (error) => {
        }
      );
    }
  }

  private saveMatterPaymentReceipt(pc: vwClient, isTrust = false) {
    if (this.receiptPdf) {
      const pdf = this.receiptPdf.nativeElement.innerHTML;
      this.billingService.v1BillingReceiptUploadPut$Json({
        body: {
          receiptHTML: btoa(unescape(encodeURIComponent(pdf))),
          matterId: this.matterId,
          paymentId: isTrust ? 0 : this.recordData.paymentId,
          trustTransactionHistoryId: isTrust ? this.recordData.paymentId : 0
        }
      }).subscribe(
        (res) => {
        },
        (error) => {
        }
      );
    }
  }

  sendPaymentToTrustEmail(pc: vwClient) {
    if (this.receiptPdf) {
      const pdf = this.receiptPdf.nativeElement.innerHTML;
      this.billingService.v1BillingMatterTrustpaymentEmailSendMatterIdPost$Json({
        matterId: this.matterId,
        body: {
          clientId: pc.id,
          receiptHTML: btoa(unescape(encodeURIComponent(pdf))),
          paymentToTrustId: this.recordData.paymentId
        }
      }).subscribe(
        (res) => {
        },
        (error) => {
        }
      );
    }
  }
}
