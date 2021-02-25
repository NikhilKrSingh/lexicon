import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { saveAs } from 'file-saver';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { OfficeDetail, SendEmailEvent, vwInvoice } from 'src/app/modules/models/vw-invoice';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { InvoiceService } from 'src/app/service/invoice.service';
import { vwBillingSettings, vwBillNowModel, vwCustomContent, vwInvoiceTemplate } from 'src/common/swagger-providers/models';
import { BillingService, TenantService, TrustAccountService } from 'src/common/swagger-providers/services';
import { PreBillingModels } from '../../models/vw-prebilling';
import * as errors from '../error.json';
import { InvoicePDFHelper } from '../invoice-pdf-helper';

@Component({
  selector: 'app-common-invoice-pdf',
  templateUrl: './invoice-pdf.component.html',
  styleUrls: ['./invoice-pdf.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CommonInvoicePdfComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('invoicePDF', { static: false }) invoicePDF: ElementRef<HTMLDivElement>;

  @ViewChild('invoiceDetailsPage', { static: false }) invoiceDetailsPage: ElementRef<HTMLDivElement>;

  @ViewChild('timeEntryDetailsPage', { static: false }) timeEntryDetailsPage: ElementRef<HTMLDivElement>;

  @ViewChild('fixedFeeDetailsPage', { static: false }) fixedFeeDetailsPage: ElementRef<HTMLDivElement>;

  @ViewChild('disbursementDetailsPage', { static: false }) disbursementDetailsPage: ElementRef<HTMLDivElement>;

  @ViewChild('invoiceHeader', { static: false }) invoiceHeader: ElementRef<HTMLDivElement>;

  @ViewChild('mainContent', { static: false }) mainContent: ElementRef<HTMLDivElement>;

  @ViewChild('invoiceFooter', { static: false }) invoiceFooter: ElementRef<HTMLDivElement>;

  @ViewChild('trustAccountContent', { static: false }) trustAccountContent: ElementRef<HTMLDivElement>;

  @ViewChild('trustAccountSummary', { static: false }) trustAccountSummary: ElementRef<HTMLDivElement>;

  @Input() public invoiceId: number;

  @Input() public print: number;

  @Input() public email: number;

  @Input() public prebillId: number;

  @Input() public matterId: number;
  @Input() public isPCBilling = false;

  @Input() public billNowData: vwBillNowModel;

  @Input() public isWorkCompleteFlow: boolean;

  @Input() callback: () => void;
  @Output() readonly getInvoiceDetails = new EventEmitter<any>();

  @Input() default_invoice: any;
  @Input() matter_settings: any;

  public invoiceDetails: vwInvoice;
  public today = new Date();

  public totalBalance: number;
  public totalPayment: number;
  public lastBalanceDate: string;
  public lastBalanceTotal: number;
  public lastBalancePaid: number;

  public totalFees: number;
  public totalHours: number;
  public totalDisbursements: number;

  public totalinitialConsultCharge: number = 0;
  /**
   * Last time entry date
   */
  public lastTimeEntry: string;

  public error_data = (errors as any).default;
  private sendEmailSub;

  private tenantDetails: any;
  private billingSettings: vwBillingSettings;
  public matterBillingSettings: vwBillingSettings;
  private invoiceTemplate: vwInvoiceTemplate;
  public customContent: vwCustomContent;
  public invoiceHTML: string;

  private invoiceCoverHTML: string;

  private markAsMailed = 0;
  private totalPayemntFromLastInvoice = 0;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  opts: ISlimScrollOptions;
  public loading: boolean;
  trustAccountEnabled = false;
  public trustAccountDetails = {
    totalAmount: 0
  };
  public moneyHandHTML = '';
  public downloadInvoiceSub;
  public printInvoiceSub;
  public loadLogoSub;
  public downloadInvoice: boolean = false;

  private default_logo_url: any;
  public printLoading = false;

  constructor(
    private invoiceService: InvoiceService,
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private tenantService: TenantService,
    private trustAccountService: TrustAccountService,
    private appConfigService: AppConfigService
  ) {
    this.sendEmailSub = this.invoiceService.sendEmail$.subscribe((evt: SendEmailEvent) => {
      if (evt) {
        this.invoiceId = evt.invoiceId;
        this.markAsMailed = evt.markAsMailed;
        this.getTrustAccountingStatus().then(() => {
          this.loadInvoiceInfo();
        });
      }
    });

    this.downloadInvoiceSub = this.invoiceService.downloadInvoice$.subscribe((evt: number) => {
      if (evt) {
        this.invoiceId = evt
        this.downloadInvoice = true;
        this.getTrustAccountingStatus().then(() => {
          this.loadInvoiceInfo();
        });
      }
    });

    this.loadLogoSub = this.invoiceService.loadImage(this.appConfigService.appConfig.default_logo).subscribe(blob => {
      const a = new FileReader();
      a.onload = (e) => {
        this.default_logo_url = (e.target as any).result;
      };
      a.readAsDataURL(blob);
    });

    this.printInvoiceSub = this.invoiceService.printInvoice$.subscribe(res => {
      if (res) {
        this.printPDF();
      }
    });
  }

  ngOnInit() {
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.opts = {
      position: 'right',
      barBackground: '#413a93',
      barOpacity: '1',
      barWidth: '4',
      barBorderRadius: '4',
      barMargin: '2px',
      gridOpacity: '1',
      gridBackground: '#e7edf3',
      gridWidth: '8',
      gridMargin: '0',
      gridBorderRadius: '4',
      alwaysVisible: true,
    };
  }

  private getDefaultTemplate(onSuccess = () => { }) {
    let userProfile = UtilsHelper.getLoginUser();
    if (userProfile && userProfile.tenantId) {
      this.tenantDetails = {
        tenantId: userProfile.tenantId,
        internalLogo: UtilsHelper.getLogo()
      };
      this.getBillingSettings(onSuccess);
    } else {
      this.tenantService
      .v1TenantProfileGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          this.tenantDetails = res;
          this.getBillingSettings(onSuccess);
        },
        () => {}
      );
    }
  }

  private getBillingSettings(onSuccess = () => { }) {
    this.billingService
      .v1BillingSettingsTenantTenantIdGet({
        tenantId: this.tenantDetails.tenantId
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res: any[]) => {
        if (res && res.length > 0) {
          this.billingSettings = res[0];
        } else {
          this.billingSettings = {} as vwBillingSettings;
        }

        if (this.billingSettings.invoiceTemplateId) {
          this.getTemplateAndCustomContent(onSuccess);
        } else {
          this.toastr.showError(
            'Default Invoice Template is not set for tenant.'
          );
        }
      });
  }

  private getTemplateAndCustomContent(onSuccess = () => { }) {
    this.billingService
      .v1BillingGetinvoicetemplatebyidTemplateIdGet({
        templateId: this.billingSettings.invoiceTemplateId
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        this.invoiceTemplate = res;
        this.billingService
          .v1BillingGetinvoicetemplatecontentTemplateIdGet({
            templateId: this.invoiceTemplate.id
          })
          .pipe(map(UtilsHelper.mapData))
          .subscribe(res => {
            this.customContent = res;

            if (this.invoiceDetails.isLegacyTemplate) {
              this.invoiceService.getInvoicePDFHTML().subscribe(templateHTML => {
                this.invoiceHTML = templateHTML;
                if (onSuccess) {
                  onSuccess();
                }
              });
            } else {
              this.invoiceHTML = this.invoiceTemplate.templateContent;
              if (onSuccess) {
                onSuccess();
              }
            }
          });
        this.loading = false;
      });
  }

  private getMatterBillingSettings(matterId: number, onSuccess = () => { }) {
    this.billingService
      .v1BillingSettingsMatterMatterIdGet({
        matterId: matterId
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res: any[]) => {
        if (res && res.length > 0) {
          this.matterBillingSettings = res[0];
        } else {
          this.matterBillingSettings = {} as vwBillingSettings;
        }

        onSuccess();
      });
  }

  ngOnDestroy() {
    if (this.sendEmailSub) {
      this.sendEmailSub.unsubscribe();
    }

    if (this.downloadInvoiceSub) {
      this.downloadInvoiceSub.unsubscribe();
    }

    if (this.loadLogoSub) {
      this.loadLogoSub.unsubscribe();
    }

    if (this.printInvoiceSub) {
      this.printInvoiceSub.unsubscribe();
    }
  }

  ngOnChanges() {
    this.getTrustAccountingStatus().then(() => {
      if (this.invoiceId) {
        this.loadInvoiceInfo();
      }

      if (this.prebillId) {
        this.loadPrebillInfo();
      }

      if (this.matterId) {
        this.loadInvoiceInfoForMatter();
      }
    });
  }

  private loadPrebillInfo() {
    this.billingService
      .v1BillingInvoiceByPrebillPrebillIdPost$Json({
        prebillId: this.prebillId,
        body: this.billNowData
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          if (this.email != 1) {
          }
        })
      )
      .subscribe(res => {
        if (res) {
          this.invoiceDetails = res;
          this.getMatterBillingSettings(this.invoiceDetails.matter.id, () => {
            this.calculateTotals();
          });
        }
      });
  }

  loadInvoiceInfo() {
    this.loading = true;
    this.billingService
      .v1BillingInvoiceInvoiceIdGet({
        invoiceId: this.invoiceId
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          if (this.email != 1) {
          }
        })
      )
      .subscribe((res: any) => {
        if (res) {
          this.invoiceDetails = res;
          if (this.isPCBilling) {
            this.invoiceDetails.initialConsult = true;
          }
          this.getInvoiceDetails.emit(this.invoiceDetails);
          if (this.invoiceDetails.initialConsult) {
            this.calculateTotals();
          } else {
            this.getMatterBillingSettings(this.invoiceDetails.matter.id, () => {
              this.calculateTotals();
            });
          }
        } else {
          this.loading = false;
        }
      });
  }

  loadInvoiceInfoForMatter() {
    this.billNowData.isWorkComplete = Boolean(this.isWorkCompleteFlow);
    this.billingService
      .v1BillingInvoiceForBillNowMatterIdPost$Json({
        matterId: this.matterId,
        body: this.billNowData
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          if (this.email != 1) {
          }
        })
      )
      .subscribe(res => {
        if (res) {
          this.invoiceDetails = res;
          if (this.isPCBilling) {
            this.invoiceDetails.initialConsult = true;
          }
          this.getInvoiceDetails.emit(this.invoiceDetails);
          if (this.invoiceDetails.initialConsult) {
            this.calculateTotals();
          } else {
            if (this.matter_settings) {
              this.matterBillingSettings = this.matter_settings;
              this.calculateTotals();
            } else {
              this.getMatterBillingSettings(this.invoiceDetails.matter.id, () => {
                this.calculateTotals();
              });
            }
          }
        }
      });
  }

  get primaryOffice(): OfficeDetail {
    if (this.invoiceDetails) {
      return {
        address: this.invoiceDetails.clientAddress.find(a => a['addressTypeName'] == 'invoice') ||
        this.invoiceDetails.clientAddress.find(a => a['addressTypeName'] == 'primary') ||
        {}
      } as OfficeDetail;
    } else {
      return {
        address: {}
      } as OfficeDetail;
    }
  }

  private calculateTotals() {
    this.totalBalance = 0;
    this.totalPayment = 0;
    this.lastBalancePaid = 0;
    this.lastBalanceTotal = 0;
    this.lastBalanceDate = null;

    this.totalFees = 0;
    this.totalHours = 0;
    this.totalDisbursements = 0;

    if (this.invoiceDetails) {
      const reposnce: any = this.invoiceDetails;
      if (reposnce.initialConsult) {
        this.totalinitialConsultCharge = reposnce.totalPaid;

        if (this.invoiceDetails.isLegacyTemplate) {
          if (this.invoiceDetails.consultations.length > 0) {
            const consultation = this.invoiceDetails.consultations[0];

            let timeEntry = {} as PreBillingModels.vwBillingLines;
            timeEntry.date = consultation.initialConsultationDate;
            timeEntry.person = {
              name: consultation.consultAttorney ? consultation.consultAttorney.name : ''
            };
            timeEntry.isNegative = false;
            timeEntry.hours = {
              value: {
                hours: consultation.durationOfConsultationHours || 0,
                minutes: consultation.durationOfConsultationMinutes || 0,
                totalHours: parseFloat(consultation.durationOfConsultationHours + '.' + consultation.durationOfConsultationMinutes)
              }
            }
            timeEntry.description = consultation.rateDetails.description;

            this.invoiceDetails.timeEntries = [timeEntry];

            if (consultation.rateDetails.billingType.name == 'Fixed') {
              this.totalFees = consultation.rateDetails.rateAmount;
            } else {
              const tmin =
                timeEntry.hours.value.hours * 60 + timeEntry.hours.value.minutes;
              this.totalFees = tmin * (consultation.rateDetails.rateAmount / 60);
            }

            this.totalHours = timeEntry.hours.value.totalHours;
          }
        } else {
          if (this.invoiceDetails.consultationFees && this.invoiceDetails.consultationFees.length > 0) {
            this.invoiceDetails.consultationFees.forEach(res => {
              res.total_hrs = (res.consultationFeeList.totalHours * 60 + res.consultationFeeList.totalMins) / 60;
              if (res.consultationFeeList.isNegetive || res.consultationFeeList.displayAmount < 0) {
                res.total_hrs = res.total_hrs * -1;
              }

              this.totalHours += res.total_hrs;
              this.totalFees += res.consultationFeeList.displayAmount;
            });
          }
        }
      } else {
        if (!this.invoiceDetails.isFixedFee) {
          if (this.invoiceDetails.timeEntries && this.invoiceDetails.timeEntries.length > 0) {
            this.invoiceDetails.timeEntries = this.invoiceDetails.timeEntries.filter(
              a =>
                !a.disbursementType.billableTo ||
                (a.disbursementType.billableTo && a.disbursementType.billableTo.name != 'Overhead')
            );
          }

          this.invoiceDetails.timeEntries.forEach(timeEntry => {
              if (timeEntry.disbursementType.billingType.name == 'Fixed') {
                if (timeEntry.isNegative) {
                  this.totalFees -= timeEntry.disbursementType.rate;
                } else {
                  this.totalFees += timeEntry.disbursementType.rate;
                }
              } else {
                if (timeEntry.hoursBilled != undefined || timeEntry.hoursBilled != null) {
                  this.totalFees += timeEntry.amount || 0;
                } else {
                  const tmin = timeEntry.hours.value.hours * 60 + timeEntry.hours.value.minutes;
                  if (timeEntry.isNegative) {
                    this.totalFees -= tmin * (timeEntry.disbursementType.rate / 60);
                  } else {
                    this.totalFees += tmin * (timeEntry.disbursementType.rate / 60);
                  }
                }
              }

              if (timeEntry.hoursBilled != undefined || timeEntry.hoursBilled != null) {
                this.totalHours += timeEntry.hoursBilled || 0;
              } else {
                if (timeEntry.isNegative) {
                  this.totalHours -= timeEntry.hours.value.totalHours;
                } else {
                  this.totalHours += timeEntry.hours.value.totalHours;
                }
              }

              timeEntry.writeDownAmount = _.sumBy(timeEntry.writeDown || [], a => a.writeDownAmount || 0);
              if (timeEntry.isNegative) {
                timeEntry.writeDownAmount = timeEntry.writeDownAmount * -1;
              }
              this.totalFees = this.totalFees - (timeEntry.writeDownAmount || 0);
          });

          if (this.invoiceDetails.timeEntries.length > 0) {
            this.lastTimeEntry = this.invoiceDetails.timeEntries[
              this.invoiceDetails.timeEntries.length - 1
            ].date;
          }
        } else {
          if (this.invoiceDetails.fixedFeeService && this.invoiceDetails.fixedFeeService.length > 0) {
            this.totalFees = _.sumBy(this.invoiceDetails.fixedFeeService, a => a.rateAmount || 0);
          } else {
            this.totalFees = 0;
          }

          this.totalFees += _.sumBy(this.invoiceDetails.addOnServices || [], a => a.serviceAmount);
        }

        this.invoiceDetails.recordDisbursement = this.invoiceDetails.recordDisbursement.filter(disbursement => {
          if (
            disbursement.disbursementType &&
            disbursement.disbursementType.isBillable
          ) {
            return true;
          }
          return false;
        });

        this.invoiceDetails.recordDisbursement.forEach(disbursement => {
            if (
              disbursement.disbursementType &&
              disbursement.disbursementType.isBillable
            ) {
              this.totalDisbursements += disbursement.amount;
            }

            disbursement.writeDownAmount = _.sumBy(disbursement.writeDown || [], a => a.writeDownAmount || 0);
            if (disbursement.amount < 0) {
              disbursement.writeDownAmount = disbursement.writeDownAmount * -1;
            }
            this.totalDisbursements = this.totalDisbursements - (disbursement.writeDownAmount || 0);
        });

        if (this.invoiceDetails.isFixedFee) {
          let totalWriteDown = 0;

          if (this.invoiceDetails.fixedFeeService && this.invoiceDetails.fixedFeeService.length > 0) {
            this.invoiceDetails.fixedFeeService.forEach(a => {
              a.writeDown = _.sumBy(
                a.writeDownList || [],
                a => a.writeDownAmount
              ) || 0;

              if (a.rateAmount < 0) {
                a.writeDown = a.writeDown * -1;
              }
            });

            totalWriteDown = _.sumBy(this.invoiceDetails.fixedFeeService, a => a.writeDown || 0);
          }

          this.invoiceDetails.addOnServices.forEach(addon => {
            addon.writeDown = _.sumBy(addon.writeDownList, a => a.writeDownAmount || 0);
            if (addon.serviceAmount < 0) {
              addon.writeDown = addon.writeDown * -1;
            }
          });

          totalWriteDown += _.sumBy(this.invoiceDetails.addOnServices, addon => addon.writeDown || 0);
          this.totalFees = this.totalFees - totalWriteDown;
        }
      }

      this.lastBalanceTotal = this.invoiceDetails.startingBalance || 0;
      this.lastBalancePaid = this.invoiceDetails.payments || 0;

      if (this.invoiceDetails.primaryRetainerTrust) {
        let totalAmount = this.invoiceDetails.primaryRetainerTrust.currentBalance || 0;
        this.invoiceDetails.trustAccounts.forEach(element => {
          totalAmount += (element.currentBalance || 0 );
        });
        this.trustAccountDetails.totalAmount = totalAmount;
      }

      if (this.invoiceDetails.generated == '0001-01-01T00:00:00' || !this.invoiceDetails.generated) {
        this.invoiceDetails.generated = this.today.toJSON();
      }

      if (this.invoiceDetails.lastTransactionDate == '0001-01-01T00:00:00' || !this.invoiceDetails.lastTransactionDate) {
        this.invoiceDetails.lastTransactionDate = this.invoiceDetails.generated;
      }
    }

    if (this.email == 1) {
      if (this.default_invoice) {
        this.invoiceTemplate = this.default_invoice.invoiceTemplate;
        this.invoiceHTML = this.invoiceTemplate.templateContent;
        this.customContent = this.default_invoice.customContent;
        this.tenantDetails = this.invoiceDetails.tenantProfile;
        this.createInvoiceHTML();
          setTimeout(() => {
            this.sendEmail();
          }, 200)
      } else {
        this.getDefaultTemplate(() => {
          this.createInvoiceHTML();
          setTimeout(() => {
            this.sendEmail();
          }, 200);
        });
      }
    } else if (this.downloadInvoice) {
      this.getDefaultTemplate(() => {
        this.createInvoiceHTML();
        setTimeout(() => {
          this.printPDF();
        }, 200);
      });
    } else {
      setTimeout(() => {
        this.getTemplateAndCreateHTML();
      }, 100);
    }
  }

  private getTemplateAndCreateHTML() {
    if (this.default_invoice) {
      this.invoiceTemplate = this.default_invoice.invoiceTemplate;
      this.invoiceHTML = this.invoiceTemplate.templateContent;
      this.customContent = this.default_invoice.customContent;
      this.tenantDetails = this.invoiceDetails.tenantProfile;
      this.createInvoiceHTML();
    } else {
      this.getDefaultTemplate(() => {
        if (this.invoiceDetails.isLegacyTemplate) {
          this.createLegacyInvoiceHTML();
        } else {
          this.createInvoiceHTML();
        }
      });
    }
  }

  private createInvoiceHTML() {
    let dp = new DatePipe('en-US');
    let np = new DecimalPipe('en-US');

    if (this.invoiceTemplate && this.customContent) {

      this.replace('[EIN]', this.customContent.ein);
      this.replace(/\[TenantLogo\]/g, this.tenantDetails['internalLogo'] || this.default_logo_url);

      this.replace('[DISCLAIMERTEXT]', this.customContent.disclaimerText);
      this.replace(/\[DisclaimerText\]/g, this.customContent.disclaimerText);

      this.replace('[PAYMENT INSTRUCTIONS]', this.customContent.paymentText);
      this.replace(/\[PaymentInstructionText\]/g, this.customContent.paymentText);

      this.replace(/\[CurrentDate\]/g, dp.transform(this.invoiceDetails.generated || this.today, 'longDate'));
      this.replace(
        '[ClientName]',
        this.invoiceDetails.client.name
      );

      this.replace('[Address1]', this.primaryOffice.address.street || this.primaryOffice.address['address1'] || '');

      if (this.primaryOffice.address.address2) {
        this.replace('[Address2]', this.primaryOffice.address.address2 || '');
      } else {
        this.replace('[Address2] <br>', ' ');
      }

      this.replace('[City]', this.primaryOffice.address.city || '');
      this.replace('[State]', this.primaryOffice.address.state || '');
      this.replace('[Zip]', this.primaryOffice.address.zipCode || '');
      this.replace('[InvoiceID]', ' ' + this.invoiceDetails.id);
      this.replace(/\[InvoiceNumber\]/g, ' ' + this.invoiceDetails.id);
      this.replace('[ClientID]', ' ' + (this.invoiceDetails.client['uniqueNumber'] || this.invoiceDetails.client.id));
      this.replace(/\[ClientNumber\]/g, ' ' + (this.invoiceDetails.client['uniqueNumber'] || this.invoiceDetails.client.id));

      if (this.invoiceDetails.initialConsult) {
        this.replace(/\[MatterID\]/g, ' PC');
      } else {
        this.replace(/\[MatterID\]/g, ' ' + (this.invoiceDetails.matter['matterNumber'] || this.invoiceDetails.matter.id));
      }

      if (this.invoiceDetails.initialConsult) {
        this.replace(/\[MatterNumber\]/g, ' PC');
      } else {
        this.replace(/\[MatterNumber\]/g, ' ' + (this.invoiceDetails.matter['matterNumber'] || this.invoiceDetails.matter.id));
      }

      if (this.lastBalanceDate) {
        this.replace(
          '[BalanceDate]',
          dp.transform(this.lastBalanceDate, 'MMMM d, y')
        );
      } else {
        this.replace('[BalanceDate]', ' ');
      }

      if (this.invoiceDetails.initialConsult && this.invoiceDetails.isLegacyTemplate) {
        this.replace(
          '[BalanceAmount]',
          np.transform(0, '1.2-2')
        );
        this.replace(
          '[PaymentAmount]',
          np.transform(this.invoiceDetails.totalPaid, '1.2-2')
        );

        this.replace(
          '[TotalBalance]',
          `(${np.transform(this.invoiceDetails.totalPaid, '1.2-2')})`
        );
      } else {
        if (this.lastBalanceTotal >= 0) {
          this.replace(
            '[BalanceAmount]',
            np.transform(this.lastBalanceTotal, '1.2-2')
          );
        } else {
          this.replace(
            '[BalanceAmount]',
            `(${np.transform(Math.abs(this.lastBalanceTotal), '1.2-2')})`
          );
        }

        if (this.lastBalancePaid == 0) {
          this.replace(
            '[PaymentAmount]',
            `${np.transform(this.lastBalancePaid, '1.2-2')}`
          );
        } else if (this.lastBalancePaid > 0) {
          this.replace(
            '[PaymentAmount]',
            `(${np.transform(this.lastBalancePaid, '1.2-2')})`
          );
        } else {
          this.replace(
            '[PaymentAmount]',
            `${np.transform(this.lastBalancePaid * -1, '1.2-2')}`
          );
        }

        if (this.lastBalanceTotal - this.lastBalancePaid >= 0) {
          this.replace(
            '[TotalBalance]',
            np.transform(this.lastBalanceTotal - this.lastBalancePaid, '1.2-2')
          );
        } else {
          this.replace(
            '[TotalBalance]',
            `(${np.transform(
              this.lastBalancePaid - this.lastBalanceTotal,
              '1.2-2'
            )})`
          );
        }
      }

      this.replace('[CurrentYear]', dp.transform(this.today, 'yyyy'));


      if (this.invoiceDetails.initialConsult && this.invoiceDetails.isLegacyTemplate) {
        this.replace('[TotalFees]', np.transform(this.invoiceDetails.totalInvoiced, '1.2-2'));

        this.replace(
          '[TotalDisbursements]',
          np.transform(0, '1.2-2')
        );


        this.replace(
          '[TotalFeesAndDisbursements]',
          np.transform(this.invoiceDetails.totalInvoiced, '1.2-2')
        );

        this.replace(
          '[TotalFeesAndDisbursements]',
          np.transform(this.invoiceDetails.totalInvoiced, '1.2-2')
        );

        this.replace(
          '[TotalBalancePaymentAndFeesAndDisbursements]',

          np.transform(
            this.invoiceDetails.totalInvoiced - this.invoiceDetails.totalPaid,
            '1.2-2'
          )
        );

        this.replace(
          '[Total]',

          np.transform(
            this.invoiceDetails.totalInvoiced - this.invoiceDetails.totalPaid,
            '1.2-2'
          )
        );
      } else {
        if (this.totalFees >= 0) {
          this.replace(
            '[TotalFees]',
            np.transform(this.totalFees, '1.2-2')
          );
        } else {
          this.replace(
            '[TotalFees]',
            `(${np.transform(this.totalFees * -1, '1.2-2')})`
          );
        }

        if (this.totalDisbursements >= 0) {
          this.replace(
            '[TotalDisbursements]',
            np.transform(this.totalDisbursements, '1.2-2')
          );
        } else {
          this.replace(
            '[TotalDisbursements]',
            `(${np.transform(this.totalDisbursements * -1, '1.2-2')})`
          );
        }

        const TotalFeesAndDisbursements = this.totalFees + this.totalDisbursements;
        if (TotalFeesAndDisbursements >= 0) {
          this.replace(
            '[TotalFeesAndDisbursements]',
            np.transform(TotalFeesAndDisbursements, '1.2-2')
          );

          this.replace(
            '[TotalFeesAndDisbursements]',
            np.transform(TotalFeesAndDisbursements, '1.2-2')
          );
        } else {
          this.replace(
            '[TotalFeesAndDisbursements]',
            `(${np.transform(TotalFeesAndDisbursements * -1, '1.2-2')})`
          );

          this.replace(
            '[TotalFeesAndDisbursements]',
            `(${np.transform(TotalFeesAndDisbursements * -1, '1.2-2')})`
          );
        }

        let TotalBalancePaymentAndFeesAndDisbursements = this.lastBalanceTotal -
        this.lastBalancePaid +
        this.totalFees +
        this.totalDisbursements;

        if (TotalBalancePaymentAndFeesAndDisbursements >= 0) {
          this.replace(
            '[TotalBalancePaymentAndFeesAndDisbursements]',
            np.transform(
              TotalBalancePaymentAndFeesAndDisbursements,
              '1.2-2'
            )
          );

          this.replace(
            '[Total]',
            np.transform(
              TotalBalancePaymentAndFeesAndDisbursements,
              '1.2-2'
            )
          );
        } else {
          this.replace(
            '[TotalBalancePaymentAndFeesAndDisbursements]',
            `(${np.transform(
              Math.abs(TotalBalancePaymentAndFeesAndDisbursements),
              '1.2-2'
            )})`
          );

          this.replace(
            '[Total]',
            `(${np.transform(
              Math.abs(TotalBalancePaymentAndFeesAndDisbursements),
              '1.2-2'
            )})`
          );
        }
      }

      this.replace(/\[MatterName\]/g, ' ' + this.invoiceDetails.matter.name || 'N/A');
      this.replace(/\[LastTransactionDate\]/g, dp.transform(this.invoiceDetails.lastTransactionDate, 'longDate'));

      let preparedHTML = InvoicePDFHelper.PrepareHTML(
        dp,
        np,
        this.invoiceHTML,
        this.invoiceDetails,
        this.matterBillingSettings,
        this.today,
        this.totalHours,
        this.totalFees,
        this.totalDisbursements,
        this.trustAccountEnabled,
        this.trustAccountDetails
      );

      this.invoiceHTML = preparedHTML.div.innerHTML;
      this.invoiceCoverHTML = preparedHTML.coverPage.innerHTML;
      this.invoiceHeader = preparedHTML.invoiceHeader;
      this.invoiceFooter = preparedHTML.invoiceFooter;

      if (this.callback && this.email != 1) {
        this.callback();
      }
    } else {
      this.loading = false;
    }
  }

  private createLegacyInvoiceHTML() {
    let dp = new DatePipe('en-US');
    let np = new DecimalPipe('en-US');

    if (this.invoiceTemplate && this.customContent) {
      this.replace('[EIN]', this.customContent.ein);
      this.replace('[TenantLogo]', this.tenantDetails['internalLogo'] || this.default_logo_url);
      this.replace('[DISCLAIMERTEXT]', this.customContent.disclaimerText);
      this.replace('[PAYMENT INSTRUCTIONS]', this.customContent.paymentText);
      this.replace('[CurrentDate]', dp.transform(this.invoiceDetails.generated || this.today, 'longDate'));
      this.replace(
        '[ClientName]',
        this.invoiceDetails.client.name
      );
      this.replace('[Address1]', this.primaryOffice.address.street || this.primaryOffice.address['address1'] || '');

      if (this.primaryOffice.address.address2) {
        this.replace('[Address2]', this.primaryOffice.address.address2 || '');
      } else {
        this.replace('[Address2] <br>', ' ');
      }

      this.replace('[City]', this.primaryOffice.address.city || '');
      this.replace('[State]', this.primaryOffice.address.state || '');
      this.replace('[Zip]', this.primaryOffice.address.zipCode || '');
      this.replace('[InvoiceID]', ' ' + this.invoiceDetails.id);
      this.replace('[ClientID]', ' ' + (this.invoiceDetails.client['uniqueNumber'] || this.invoiceDetails.client.id));

      if (this.invoiceDetails.initialConsult) {
        this.replace(/\[MatterID\]/g, ' N/A');
      } else {
        this.replace(/\[MatterID\]/g, ' ' + (this.invoiceDetails.matter['matterNumber'] || this.invoiceDetails.matter.id));
      }

      if (this.lastBalanceDate) {
        this.replace(
          '[BalanceDate]',
          dp.transform(this.lastBalanceDate, 'MMMM d, y')
        );
      } else {
        this.replace('[BalanceDate]', ' ');
      }

      if (this.invoiceDetails.initialConsult) {
        this.replace(
          '[BalanceAmount]',
          np.transform(0, '1.2-2')
        );
        this.replace(
          '[PaymentAmount]',
          np.transform(this.invoiceDetails.totalPaid, '1.2-2')
        );

        this.replace(
          '[TotalBalance]',
          `(${np.transform(this.invoiceDetails.totalPaid, '1.2-2')})`
        );
      } else {
        if (this.lastBalanceTotal >= 0) {
          this.replace(
            '[BalanceAmount]',
            np.transform(this.lastBalanceTotal, '1.2-2')
          );
        } else {
          this.replace(
            '[BalanceAmount]',
            `(${np.transform(Math.abs(this.lastBalanceTotal), '1.2-2')})`
          );
        }

        if (this.lastBalancePaid > 0) {
          this.replace(
            '[PaymentAmount]',
            `(${np.transform(this.lastBalancePaid, '1.2-2')})`
          );
        } else {
          this.replace(
            '[PaymentAmount]',
            `${np.transform(this.lastBalancePaid, '1.2-2')}`
          );
        }

        if (this.lastBalanceTotal - this.lastBalancePaid >= 0) {
          this.replace(
            '[TotalBalance]',
            np.transform(this.lastBalanceTotal - this.lastBalancePaid, '1.2-2')
          );
        } else {
          this.replace(
            '[TotalBalance]',
            `(${np.transform(
              this.lastBalancePaid - this.lastBalanceTotal,
              '1.2-2'
            )})`
          );
        }
      }

      this.replace('[CurrentYear]', dp.transform(this.today, 'yyyy'));


      if (this.invoiceDetails.initialConsult) {
        this.replace('[TotalFees]', np.transform(this.invoiceDetails.totalInvoiced, '1.2-2'));

        this.replace(
          '[TotalDisbursements]',
          np.transform(0, '1.2-2')
        );


        this.replace(
          '[TotalFeesAndDisbursements]',
          np.transform(this.invoiceDetails.totalInvoiced, '1.2-2')
        );

        this.replace(
          '[TotalFeesAndDisbursements]',
          np.transform(this.invoiceDetails.totalInvoiced, '1.2-2')
        );

        this.replace(
          '[TotalBalancePaymentAndFeesAndDisbursements]',

          np.transform(
            this.invoiceDetails.totalInvoiced - this.invoiceDetails.totalPaid,
            '1.2-2'
          )
        );
      } else {
        if (this.totalFees >= 0) {
          this.replace(
            '[TotalFees]',
            np.transform(this.totalFees, '1.2-2')
          );
        } else {
          this.replace(
            '[TotalFees]',
            `(${np.transform(this.totalFees * -1, '1.2-2')})`
          );
        }

        if (this.totalDisbursements >= 0) {
          this.replace(
            '[TotalDisbursements]',
            np.transform(this.totalDisbursements, '1.2-2')
          );
        } else {
          this.replace(
            '[TotalDisbursements]',
            `(${np.transform(this.totalDisbursements * -1, '1.2-2')})`
          );
        }

        const TotalFeesAndDisbursements = this.totalFees + this.totalDisbursements;
        if (TotalFeesAndDisbursements >= 0) {
          this.replace(
            '[TotalFeesAndDisbursements]',
            np.transform(TotalFeesAndDisbursements, '1.2-2')
          );

          this.replace(
            '[TotalFeesAndDisbursements]',
            np.transform(TotalFeesAndDisbursements, '1.2-2')
          );
        } else {
          this.replace(
            '[TotalFeesAndDisbursements]',
            `(${np.transform(TotalFeesAndDisbursements * -1, '1.2-2')})`
          );

          this.replace(
            '[TotalFeesAndDisbursements]',
            `(${np.transform(TotalFeesAndDisbursements * -1, '1.2-2')})`
          );
        }

        let TotalBalancePaymentAndFeesAndDisbursements = this.lastBalanceTotal -
        this.lastBalancePaid +
        this.totalFees +
        this.totalDisbursements;

        if (TotalBalancePaymentAndFeesAndDisbursements >= 0) {
          this.replace(
            '[TotalBalancePaymentAndFeesAndDisbursements]',
            np.transform(
              TotalBalancePaymentAndFeesAndDisbursements,
              '1.2-2'
            )
          );
        } else {
          this.replace(
            '[TotalBalancePaymentAndFeesAndDisbursements]',
            `(${np.transform(
              Math.abs(TotalBalancePaymentAndFeesAndDisbursements),
              '1.2-2'
            )})`
          );
        }
      }

      this.invoiceCoverHTML = this.invoiceHTML;
      this.invoiceCoverHTML = this.invoiceCoverHTML.replace('[MainContent]', '<br />');

      let mainContent = this.mainContent.nativeElement.innerHTML;

      this.replace('[MainContent]', mainContent);
      this.replace(/\[MatterName\]/g, this.invoiceDetails.matter.name || 'N/A');

      if (this.trustAccountEnabled && this.trustAccountContent && this.trustAccountContent.nativeElement) {
        let Content = this.trustAccountContent.nativeElement.innerHTML;
        this.replace('[TrustAccountingSummary]', Content);
        this.replace('trust-accounting-section', 'd-block');

        this.invoiceCoverHTML = this.invoiceCoverHTML.replace('[TrustAccountingSummary]', Content);
        this.invoiceCoverHTML = this.invoiceCoverHTML.replace('trust-accounting-section', 'd-block-1');
      }

      if (this.callback && this.email != 1) {
        this.callback();
      }
    }
  }

  private replace(key, value) {
    if (value == null || value == undefined) {
      this.invoiceHTML = this.invoiceHTML.replace(key, key);
    } else {
      this.invoiceHTML = this.invoiceHTML.replace(key, value);
    }
  }

  get disbursements() {
    if (this.invoiceDetails && this.invoiceDetails.recordDisbursement) {
      return this.invoiceDetails.recordDisbursement.filter(
        a => a.disbursementType && a.disbursementType.isBillable
      );
    } else {
      return [];
    }
  }

  private sendLegacyInvoiceEmail() {
    let header = this.invoiceHeader.nativeElement.innerHTML;

    header = header.replace(/PAGENUMBER/g, '{page}');

    let pages = [];

    if (this.invoiceDetails.initialConsult) {
      pages.push(this.timeEntryDetailsPage.nativeElement.innerHTML);

      if (this.trustAccountEnabled) {
        pages.push(this.trustAccountSummary.nativeElement.innerHTML);
      }
    } else {
      if (this.invoiceDetails.isFixedFee) {
        pages.push(this.fixedFeeDetailsPage.nativeElement.innerHTML);
        pages.push(this.disbursementDetailsPage.nativeElement.innerHTML);
      } else {
        pages.push(this.timeEntryDetailsPage.nativeElement.innerHTML);
        pages.push(this.disbursementDetailsPage.nativeElement.innerHTML);
      }

      if (this.trustAccountEnabled) {
        pages.push(this.trustAccountSummary.nativeElement.innerHTML);
      }
    }

    let invoiceDetailsHTML = this.invoiceDetailsPage.nativeElement.innerHTML;
    let invoiceCoverHTML = this.invoiceCoverHTML.replace(/\[MatterName\]/g, this.invoiceDetails.matter.name || 'N/A');
    let footerHTML = this.invoiceFooter.nativeElement.innerHTML;

    let request: any = {
      invoiceId: this.invoiceId,
      headerText: header,
      coverPage: invoiceCoverHTML,
      invoiceDetailsPage: invoiceDetailsHTML,
      pages: pages,
      footerText: footerHTML,
      matterId: this.invoiceDetails.matter.id || 0,
      clientId: this.invoiceDetails.client.id || 0,
      markAsMailed: this.markAsMailed
    };

    this.billingService
      .v1BillingInvoiceSendPut$Json({
        body: request
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
        })
      )
      .subscribe(res => {
        if (res > 0) {
          this.invoiceService.refreshInvoiceList$.next(true);
          this.invoiceService.message$.next({
            type: 'Success',
            errors: [
              this.error_data.invoice_send_success
            ]
          });
        } else {
          this.invoiceService.refreshInvoiceList$.next(true);
          this.invoiceService.message$.next({
            type: 'Error',
            errors: [
              this.error_data.invoice_send_failed
            ]
          });
        }
      }, () => {
        if (this.callback) {
          this.callback();
        }
      });
  }

  printLegacyInvoicePDF() {
    if (this.invoicePDF) {
      let header = this.invoiceHeader.nativeElement.innerHTML;

      header = header.replace(/PAGENUMBER/g, '{page}');

      let pages = [];

      if (this.invoiceDetails.initialConsult) {
        pages.push(this.timeEntryDetailsPage.nativeElement.innerHTML);

        if (this.trustAccountEnabled) {
          pages.push(this.trustAccountSummary.nativeElement.innerHTML);
        }
      } else {
        if (this.invoiceDetails.isFixedFee) {
          pages.push(this.fixedFeeDetailsPage.nativeElement.innerHTML);
          pages.push(this.disbursementDetailsPage.nativeElement.innerHTML);
        } else {
          pages.push(this.timeEntryDetailsPage.nativeElement.innerHTML);
          pages.push(this.disbursementDetailsPage.nativeElement.innerHTML);
        }

        if (this.trustAccountEnabled) {
          pages.push(this.trustAccountSummary.nativeElement.innerHTML);
        }
      }

      let invoiceDetailsHTML = this.invoiceDetailsPage.nativeElement.innerHTML;
      this.invoiceCoverHTML = this.invoiceCoverHTML.replace(/\[MatterName\]/g, this.invoiceDetails.matter.name || 'N/A');
      let footerHTML = this.invoiceFooter.nativeElement.innerHTML;

      const request: any = {
        invoiceId: this.invoiceId,
        coverPage: this.invoiceCoverHTML,
        headerText: header,
        invoiceDetailsPage: invoiceDetailsHTML,
        pages: pages,
        footerText: footerHTML,
        matterId: this.invoiceDetails.matter.id || 0
      };
      this.loading = true;
      this.printLoading = true;

      if (this.invoiceDetails.invoiceFileId > 0) {
        this.billingService.v1BillingPrintInvoiceDetailsInvoiceIdGet({
          invoiceId: this.invoiceDetails.id
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(
          res => {
            this.loading = false;
            this.printLoading = false;
            let file = UtilsHelper.base64toFile(
              res,
              `invoice_${this.invoiceId}_${moment(new Date()).format('MMDDYYYYHHMMSS')}.pdf`,
              'application/pdf'
            );
            saveAs(file);
            this.invoiceService.downloadInvoiceComplete$.next(true);
            this.toastr.showSuccess(this.error_data.invoice_print_success);
          },
          () => {
            this.invoiceService.downloadInvoiceComplete$.next(true);
            this.loading = false;
            this.printLoading = false;
          }
        );
      } else {
        this.billingService.v1BillingPrintInvoiceDetailsPost$Json({
          body: request
        })
          .pipe(map(UtilsHelper.mapData))
          .subscribe(
            res => {
              this.loading = false;
              this.printLoading = false;
              let file = UtilsHelper.base64toFile(
                res,
                `invoice_${this.invoiceId}_${moment(new Date()).format('MMDDYYYYHHMMSS')}.pdf`,
                'application/pdf'
              );
              saveAs(file);
              this.invoiceService.downloadInvoiceComplete$.next(true);
              this.toastr.showSuccess(this.error_data.invoice_print_success);
            },
            () => {
              this.invoiceService.downloadInvoiceComplete$.next(true);
              this.loading = false;
              this.printLoading = false;
            }
          );
      }
    }
  }

  private sendEmail() {
    if (this.invoiceDetails.isLegacyTemplate) {
      this.sendLegacyInvoiceEmail();
      return;
    }

    let header = this.invoiceHeader.nativeElement.innerHTML;
    header = header.replace(/PAGENUMBER/g, '{page}');

    let footerHTML = this.invoiceFooter.nativeElement.innerHTML;

    let div = document.createElement('div');
    div.innerHTML = this.invoiceHTML;

    let pages = [];

    if (this.invoiceDetails.initialConsult) {
      if (this.invoiceDetails.consultationFees && this.invoiceDetails.consultationFees.length > 0) {
        let hourlyMatterPage = div.querySelector('#page-hourly-matter');
        pages.push(this.getHTML(hourlyMatterPage.innerHTML));

        let hourlyMatterPage1 = div.querySelector('#page-hourly-matter-1');
        if (hourlyMatterPage1 && !hourlyMatterPage1.classList.contains('d-none')) {
          pages.push(this.getHTML(hourlyMatterPage1.innerHTML));
        }
      }
    } else {
      if (this.invoiceDetails.isFixedFee) {
        let fixedFeeMatterPage = div.querySelector('#page-fixed-fee-matter');
        if (fixedFeeMatterPage && !fixedFeeMatterPage.classList.contains('d-none')) {
          pages.push(this.getHTML(fixedFeeMatterPage.innerHTML));
        }

        let fixedFeeMatterPage1 = div.querySelector('#page-fixed-fee-matter-1');
        if (fixedFeeMatterPage1 && !fixedFeeMatterPage1.classList.contains('d-none')) {
          pages.push(this.getHTML(fixedFeeMatterPage1.innerHTML));
        }
      } else {
        let hourlyMatterPage = div.querySelector('#page-hourly-matter');
        if (hourlyMatterPage && !hourlyMatterPage.classList.contains('d-none')) {
          pages.push(this.getHTML(hourlyMatterPage.innerHTML));
        }

        let hourlyMatterPage1 = div.querySelector('#page-hourly-matter-1');
        if (hourlyMatterPage1 && !hourlyMatterPage1.classList.contains('d-none')) {
          pages.push(this.getHTML(hourlyMatterPage1.innerHTML));
        }
      }

      if (this.trustAccountEnabled) {
        let trustAccountingPage = div.querySelector('#page-trust-accounting');
        pages.push(this.getHTML(trustAccountingPage.innerHTML));
      }
    }

    let request: any = {
      invoiceId: this.invoiceId,
      headerText: header,
      coverPage: this.invoiceCoverHTML,
      invoiceDetailsPage: this.invoiceHTML,
      pages: pages,
      footerText: footerHTML,
      matterId: this.invoiceDetails.matter.id || 0,
      clientId: this.invoiceDetails.client.id || 0,
      markAsMailed: this.markAsMailed
    };

    this.billingService
      .v1BillingInvoiceSendPut$Json({
        body: request
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
        })
      )
      .subscribe(res => {
      }, () => {
        if (this.callback) {
          this.callback();
        }
      });

      this.invoiceService.refreshInvoiceList$.next(true);
      this.invoiceService.message$.next({
        type: 'Success',
        errors: [
          this.error_data.invoice_send_success
        ]
      });
  }

  printPDF() {
    if (this.invoiceDetails.isLegacyTemplate) {
      this.printLegacyInvoicePDF();
      return;
    }

    if (this.invoicePDF) {
      let header = this.invoiceHeader.nativeElement.innerHTML;
      header = header.replace(/PAGENUMBER/g, '{page}');

      let footerHTML = this.invoiceFooter.nativeElement.innerHTML;

      let div = document.createElement('div');
      div.innerHTML = this.invoiceHTML;

      let pages = [];

      if (this.invoiceDetails.initialConsult) {
        if (this.invoiceDetails.consultationFees && this.invoiceDetails.consultationFees.length > 0) {
          let hourlyMatterPage = div.querySelector('#page-hourly-matter');
          pages.push(this.getHTML(hourlyMatterPage.innerHTML));

          let hourlyMatterPage1 = div.querySelector('#page-hourly-matter-1');
          if (hourlyMatterPage1 && !hourlyMatterPage1.classList.contains('d-none')) {
            pages.push(this.getHTML(hourlyMatterPage1.innerHTML));
          }
        }
      } else {
        if (this.invoiceDetails.isFixedFee) {
          let fixedFeeMatterPage = div.querySelector('#page-fixed-fee-matter');
          if (fixedFeeMatterPage && !fixedFeeMatterPage.classList.contains('d-none')) {
            pages.push(this.getHTML(fixedFeeMatterPage.innerHTML));
          }

          let fixedFeeMatterPage1 = div.querySelector('#page-fixed-fee-matter-1');
          if (fixedFeeMatterPage1 && !fixedFeeMatterPage1.classList.contains('d-none')) {
            pages.push(this.getHTML(fixedFeeMatterPage1.innerHTML));
          }
        } else {
          let hourlyMatterPage = div.querySelector('#page-hourly-matter');
          if (hourlyMatterPage && !hourlyMatterPage.classList.contains('d-none')) {
            pages.push(this.getHTML(hourlyMatterPage.innerHTML));
          }

          let hourlyMatterPage1 = div.querySelector('#page-hourly-matter-1');
          if (hourlyMatterPage1 && !hourlyMatterPage1.classList.contains('d-none')) {
            pages.push(this.getHTML(hourlyMatterPage1.innerHTML));
          }
        }

        if (this.trustAccountEnabled) {
          let trustAccountingPage = div.querySelector('#page-trust-accounting');
          pages.push(this.getHTML(trustAccountingPage.innerHTML));
        }
      }

      const request: any = {
        invoiceId: this.invoiceId,
        coverPage: this.invoiceCoverHTML,
        headerText: header,
        invoiceDetailsPage: this.invoiceHTML,
        pages: pages,
        footerText: footerHTML,
        matterId: this.invoiceDetails.matter.id || 0,
        clientId: this.invoiceDetails.client.id
      };

      this.printLoading = false;

      if (this.invoiceDetails.invoiceFileId > 0) {
        this.billingService.v1BillingPrintInvoiceDetailsInvoiceIdGet({
          invoiceId: this.invoiceDetails.id
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(
          res => {
            this.printLoading = false;
            let file = UtilsHelper.base64toFile(
              res,
              `invoice_${this.invoiceId}_${moment(new Date()).format('MMDDYYYYHHMMSS')}.pdf`,
              'application/pdf'
            );
            saveAs(file);
            this.invoiceService.downloadInvoiceComplete$.next(true);
            // this.toastr.showSuccess(this.error_data.invoice_print_success);
          },
          () => {
            this.invoiceService.downloadInvoiceComplete$.next(true);
            this.printLoading = false;
          }
        );
      } else {
        this.billingService.v1BillingPrintInvoiceDetailsPost$Json({
          body: request
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(
          res => {
            this.printLoading = false;
            let file = UtilsHelper.base64toFile(
              res,
              `invoice_${this.invoiceId}_${moment(new Date()).format('MMDDYYYYHHMMSS')}.pdf`,
              'application/pdf'
            );
            saveAs(file);
            this.invoiceService.downloadInvoiceComplete$.next(true);
            // this.toastr.showSuccess(this.error_data.invoice_print_success);
          },
          () => {
            this.invoiceService.downloadInvoiceComplete$.next(true);
            this.printLoading = false;
          }
        );
      }
    }
  }

  private getHTML(html: string) {
    let div = document.createElement('div');
    div.innerHTML = this.invoiceHTML;

    let wrapper = div.querySelector('.wrapper');

    if (wrapper) {
      wrapper.innerHTML = html;
      html = div.innerHTML;
    }

    return html;
  }

  async getTrustAccountingStatus(): Promise<any> {
    try {
      let resp: any = await this.trustAccountService.v1TrustAccountGetTrustAccountStatusGet$Response().toPromise();
      resp = JSON.parse(resp.body as any).results;
      if (resp) {
        this.trustAccountEnabled = resp;
      }
    } catch (ex) {
      console.log(ex);
    }
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
