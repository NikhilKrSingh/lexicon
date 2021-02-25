import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { forkJoin, interval, Subscription } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page, vwMatterResponse } from 'src/app/modules/models';
import { vwPaymentHierarchy } from 'src/app/modules/models/payment-hierarchy.model';
import { vwPaymentToMatterResponse } from 'src/app/modules/models/post-payment-response';
import { vwInvoiceCompact, vwPartialPaymentSuccess } from 'src/app/modules/models/vw-invoice-compact';
import { UsioTrustAccountType, vwPostPaymentDetails } from 'src/app/modules/models/vw-post-payment-details';
import { CommonReceiptPdfComponent } from 'src/app/modules/shared/receipt-pdf/receipt-pdf.component';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { PostPaymentService } from 'src/app/service/post-payment.service';
import { vwAddressDetails, vwClient, vwCreditCard, vwECheck, vwIdCodeName } from 'src/common/swagger-providers/models';
import { BillingService, ClientService, DmsService, MatterService, MiscService, OfficeService, PersonService, TenantService, TrustAccountService, UsioService } from 'src/common/swagger-providers/services';
import * as errors from '../../../shared/error.json';

@Component({
  selector: 'app-post-payment',
  templateUrl: './post-payment.component.html',
  styleUrls: ['./post-payment.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class PostPaymentComponent
  implements OnInit, IBackButtonGuard, OnDestroy {
  public matterId: number;
  public requestRemainingAmount: boolean = true;
  public disableRemaning: boolean = false;
  public amountToPay: string = '0';
  public remainingAmount: string = '0';
  public paymentMethod: string;
  public step = 'postpayment';
  public addCreditCard = false;
  public addECheck = false;
  public paymentMethodTypesList: Array<vwIdCodeName> = [];
  public selectedPaymentMethod: { id?: number; code?: string; name?: string };
  public matterDetails: vwMatterResponse;
  public creditCardList: vwCreditCard[] = [];
  public echeckList: vwECheck[] = [];
  public createFlag = true;
  public error_data = (errors as any).default;
  public selectedCreditCard: number;
  public selectedECheck: number;
  public selectedCreditCardDetaiols: vwCreditCard;
  public selectedECheckDetails: vwECheck;
  public checkNumber: string;
  public cardNumber: string;
  public isPersonal = 'personal';
  public displayMessage = false;
  public message = 'Insufficient Funds';
  public primaryAddress: any;
  public successMsg: string;
  public failMsg: string;
  public dateErrMsg = '';
  public amountErrMsg = '';
  isTrustAccountEnabled = false;
  currentBalance = 0;

  showPaymentMethodLoader = true;
  disablePostPay = false;
  showPostLoader = false;
  showAddMethodLoader = false;

  checkNumberMissing: string;
  public selectedOperatingAccount: any = null;
  public operatingAccountError: boolean = false;
  public isAchDisabled: any = null;
  public isCreditCardDisabled: any = null;
  public operatingAccount: any = null;
  loaderCallback = () => {
    this.showPostLoader = false;
  };

  @ViewChild('postPaymentCheckImageInput', { static: false }) public postPaymentCheckImageInput: ElementRef<HTMLInputElement>;

  selectedFile: File;
  postPaymentCheckFileContent: string;
  public postPaymentCheckUploadFile = false;
  public postPaymentCheckErrMsg = '';
  public postPaymentCheckErr = false;
  public postPaymentCheck = false;
  closeResult: string;
  public modalReference: any;

  @ViewChild('receiptMatter', { static: false }) receiptPdfMatter: CommonReceiptPdfComponent;
  @ViewChild('receiptTrust', { static: false }) receiptPdfTrust: CommonReceiptPdfComponent;

  postObject: any = {};
  trustTransactionPostObject: any = {};
  clientDetail: vwClient = {};
  payments: Array<vwPaymentHierarchy>;

  paymentDate = new Date().toJSON();

  states: Array<vwIdCodeName>;
  officeDetails: any;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  sameDayACHStatus = false;
  isTimeBefore12PmCt = false;
  isCheckedSameDayACH = false;
  printReceiptSub: Subscription;

  unpaidInvoices: Array<vwInvoiceCompact>;
  partialPaymentCheckResponse: vwPartialPaymentSuccess;
  public accountType: UsioTrustAccountType = null;
  public officeId: number = null;
  public page = new Page();
  public searchText: string = null;
  public pageSelected: number = 1;
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selectPageSize = new FormControl('10');
  public loading: boolean = false;
  public originalOperatingTrustBankList: any[] = [];
  public bankId: number = null;
  public selectedOperatingAccountList: any[] = []
  public operatingTrustBankList: any[] = [];
  public transactionAccountFilterList: any[] = [];
  public merchantAccountFilterList: any[] = [];
  public transactionAccountFilterId: number = null;
  public merchantAccountFilterId: number = null;
  public ColumnMode: ColumnMode;
  public SelectionType = SelectionType;
  pollingTimeData: any;
  public formSubmitted: boolean = false;
  public selectedOperatingAccountId : number;

  @ViewChild( DatatableComponent, { static: false }) table: DatatableComponent;

  paymentResponse: vwPaymentToMatterResponse;

  tenantDetails: any;
  receiptTemplate: any;
  type: any;
  postPaymentName: string;
  clientId: number;

  dateOfPaymentFilter = (d: Date) => {
    return moment().isSameOrAfter(moment(d), 'days');
  }

  constructor(
    private modalService: NgbModal,
    private dmsService: DmsService,
    private activatedRoute: ActivatedRoute,
    private billingService: BillingService,
    private matterService: MatterService,
    private toastDisplay: ToastDisplay,
    private postPaymentService: PostPaymentService,
    private clientService: ClientService,
    private miscService: MiscService,
    private personService: PersonService,
    private trustAccountService: TrustAccountService,
    private officeService: OfficeService,
    private router: Router,
    private pagetitle: Title,
    private sharedService: SharedService,
    private usioService: UsioService,
    private tenantService: TenantService
  ) {
    router.events.subscribe(val => {
      if (val instanceof NavigationStart === true) {
        this.navigateAwayPressed = true;
      }
    });

    this.printReceiptSub = this.sharedService.printReceipt$.subscribe(() => {
      this.showPostLoader = false;
    });

    this.page.size = 10;
    this.page.pageNumber = 0;
  }

  async ngOnInit() {
    this.successMsg = this.error_data.payment_success;
    this.failMsg = this.error_data.payment_failed;
    if (
      this.activatedRoute.snapshot.queryParams.matterId !== null &&
      this.activatedRoute.snapshot.queryParams.matterId !== undefined
    ) {
      this.matterId = parseInt(
        this.activatedRoute.snapshot.queryParams.matterId,
        10
      );
      this.officeId = parseInt(
        this.activatedRoute.snapshot.queryParams.officeId,
        10
      );
      this.clientId = parseInt(this.activatedRoute.snapshot.queryParams.clientId);

      if (this.matterId > 0) {
        this.getUnpaidInvoices();
      }

      this.getOperatingAccount();
    }
    this.type = this.activatedRoute.snapshot.queryParams.type;
    this.getList();
    this.getStates();
    this.getTimeStatus();
    this.getTimeStatusOnInit();
    this.getTenantDetailsAndReceiptTemplate();
    this.amountToPay = (+this.amountToPay).toFixed(2);
  }

  ngOnDestroy() {
    if (this.printReceiptSub) {
      this.printReceiptSub.unsubscribe();
    }
    if (this.pollingTimeData) {
      this.pollingTimeData.unsubscribe();
    }
  }

  private getTenantDetailsAndReceiptTemplate() {
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

  private getBillingSettings() {
    this.billingService
      .v1BillingSettingsTenantTenantIdGet({
        tenantId: this.tenantDetails.tenantId,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res) => {
          let billingSettings: any;
          if (res && res.length > 0) {
            billingSettings = res[0];
          } else {
            billingSettings = {};
          }

          if (billingSettings.receiptTemplateId) {
            this.getTemplate(billingSettings.receiptTemplateId);
          }
        },
        () => {
        }
      );
  }

  private getTemplate(receiptTemplateId) {
    this.billingService
      .v1BillingGetreceipttemplatebyidTemplateIdGet({
        templateId: receiptTemplateId,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.receiptTemplate = res;
      });
  }

  getTimeStatus() {
    try {
      this.pollingTimeData = interval(60000)
        .pipe(switchMap(() => this.getTime()))
        .subscribe(
          suc => {
            let res: any = suc;
            let resp = JSON.parse(res.body).results;
            this.isTimeBefore12PmCt = resp;
            if(!this.isTimeBefore12PmCt && this.isCheckedSameDayACH){
              this.isCheckedSameDayACH = false;
            }
          }, err => {
            console.log(err);
          });
    } catch (ex) {
      console.log(ex);
    }
  }

  getTimeStatusOnInit(){
    this.usioService.v1UsioCheckCtTimeGet$Response().subscribe(
      suc => {
        let res: any = suc;
        let resp = JSON.parse(res.body).results;
        this.isTimeBefore12PmCt = resp;
      }, err => {
        console.log(err);
      }
    );
  }

  getTime(){
    return this.usioService.v1UsioCheckCtTimeGet$Response({});
  }

  private getUnpaidInvoices() {
    this.matterService.v1MatterUnpaidInvoicesMatterIdGet({
      matterId: this.matterId
    })
    .pipe(map(UtilsHelper.mapData))
    .subscribe(res => {
      this.unpaidInvoices = res || [];
    });
  }

  private getClientInfo() {
    this.clientService
      .v1ClientClientIdGet({
        clientId: this.matterDetails.clientName.id
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        this.clientDetail = res;
        if (res.addresses && res.addresses.length > 0) {
          this.primaryAddress = res.addresses.find(
            obj => obj.addressTypeName.toLowerCase() === 'primary'
          );

          if (!this.primaryAddress) {
            this.primaryAddress = {};
          }
        }
      });
  }

  private getOfficeAddress() {
    if (this.matterDetails.matterPrimaryOffice) {
      this.officeService
        .v1OfficeIdGet({
          id: this.matterDetails.matterPrimaryOffice.id
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(res => {
          this.officeDetails = res;
        });
    }
  }

  private getList() {
    this.showPaymentMethodLoader = true;

    forkJoin([
      this.billingService.v1BillingPaymentmethodtypesGet$Response({}),
      this.matterService.v1MatterMatterIdGet({ matterId: this.matterId }),
      this.billingService.v1BillingPaymentHierachiesMatterIdGet$Response({
        matterId: this.matterId
      }),
      this.usioService.v1UsioPostPaymentDetailsGet$Response({
        matterId: this.matterId
      }),
      this.clientService
      .v1ClientClientIdGet({
        clientId: this.clientId
      })
    ])
      .pipe(
        map(res => {
          return {
            paymentMethodTypes: JSON.parse(res[0].body as any).results,
            matterDetails: JSON.parse(res[1] as any).results,
            payments: JSON.parse(res[2].body as any).results,
            postPaymentDetails: JSON.parse(res[3].body as any).results,
            clientDetail: JSON.parse(res[4] as any).results
          };
        })
      )
      .subscribe(
        res => {
          this.clientDetail = res.clientDetail;
          this.paymentMethodTypesList = res.paymentMethodTypes || [];
          this.paymentMethodTypesList = this.paymentMethodTypesList.filter(
            a => a.code != 'CHARGEBACK'
          );
          this.paymentMethodTypesList = this.paymentMethodTypesList.filter(
            a => a.code != 'PRIMARY_RETAINER_TRUST'
          );
          this.paymentMethodTypesList = this.paymentMethodTypesList.filter(
            a => a.code != 'TRUST_TRANSFER'
          );
          this.matterDetails = res.matterDetails;
          this.payments = res.payments || [];
          const totalInvoiced = _.sumBy(this.payments, p => p.totalAmount);
          const totalPaid = _.sumBy(this.payments, p => p.totalPaid);

          let sumAmout = totalInvoiced - totalPaid;
          sumAmout = Math.max(sumAmout, 0);

          this.remainingAmount = sumAmout.toFixed(2);
          this.amountToPay = this.remainingAmount;

          this.paymentMethod = 'CASH';
          this.selectedPaymentMethod = this.paymentMethodTypesList.find(
            item => item.code === this.paymentMethod
          );
          if (+this.remainingAmount === 0) {
            this.requestRemainingAmount = false;
            this.disableRemaning = true;
          }

          const postPaymentDetails = res.postPaymentDetails || {} as vwPostPaymentDetails;

          this.sameDayACHStatus = postPaymentDetails.achProcessingStatus;
          this.accountType = postPaymentDetails.usioTrustAccountType;
          this.isTrustAccountEnabled = postPaymentDetails.trustAccountStatus;
          this.currentBalance = postPaymentDetails.primaryRetainerTrustDetails ? postPaymentDetails.primaryRetainerTrustDetails.currnetBalance || 0 : 0;
          this.postPaymentName  = this.type == 'matter'? this.matterDetails.matterName : this.clientDetail.isCompany ? this.clientDetail.companyName : this.clientDetail.lastName +' '+ this.clientDetail.firstName;

          this.pagetitle.setTitle(
            'Post Payment - ' + this.postPaymentName
          );

          this.getPaymentMethods();
          this.getClientInfo();
          this.getOfficeAddress();

          this.showPaymentMethodLoader = false;
        },
        e => {
          this.showPaymentMethodLoader = false;
          this.loading = false;
        }
      );
  }

  get hasAmountToPay() {
    return this.dateErrMsg || this.amountErrMsg
      ? false
      : this.requestRemainingAmount
      ? +this.remainingAmount > 0
      : this.amountToPay && +this.amountToPay > 0;
  }

  public getPaymentMethods() {
    if (this.matterDetails && this.matterDetails.clientName) {
      this.matterService
        .v1MatterPaymentMethodsbymatterMatterIdGet({
          matterId: this.matterDetails.id
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(res => {
          if (res) {
            this.creditCardList = res.creditCards;
            this.echeckList = res.eChecks;
            this.showAddMethodLoader = false;
          }
        }, () => {
          this.showAddMethodLoader = false;
        });
    }
  }

  getStates(): void {
    this.miscService.v1MiscStatesGet$Response({}).subscribe(
      (res: any) => {
        this.states = JSON.parse(res.body).results;
      },
      err => {}
    );
  }

  //#region [Save CC and E-Check]

  public saveCreditCard(res: any) {
    this.showAddMethodLoader = true;
    const creditCard = res.creditCardInfo;
    const address = res.address;
    creditCard.person = {
      id: this.clientDetail.id
    };

    if (creditCard.isSameAsPrimary) {
      this._saveCreditCard(creditCard);
      this.updateAddress(address, 1, 'primary');
    } else {
      this.createAddress(address, addressId => {
        creditCard.addressId = addressId;
        this._saveCreditCard(creditCard);
      });
    }
  }

  private _saveCreditCard(creditCard: vwCreditCard) {
    creditCard.id = 0;

    const request = {
      ...creditCard
    };

    this.billingService
      .v1BillingPaymentMethodPost$Json({
        body: request
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res > 0) {
            this.addMatterPaymentMethod(
              res,
              creditCard.autoPay,
              creditCard.suspendAutoPay,
              () => {
                this.toastDisplay.showSuccess(
                  this.error_data.add_credit_card_success
                );
                this.selectedCreditCard = res;
                this.addCreditCard = false;
                this.getPaymentMethods();
              }
            );
          } else {
            this.toastDisplay.showError(this.error_data.error_occured);
            this.hideLoader();
          }
        },
        () => {
          this.hideLoader();
        }
      );
  }

  public saveEcheck(res: any) {
    this.showAddMethodLoader = true;
    const echeck = res.echeckInfo;
    const address = res.address;
    echeck.person = {
      id: this.clientDetail.id
    };

    if (echeck.isSameAsPrimary) {
      this._saveECheck(echeck);
      this.updateAddress(address, 1, 'primary');
    } else {
      this.createAddress(address, addressId => {
        echeck.addressId = addressId;
        this._saveECheck(echeck);
      });
    }
  }

  private _saveECheck(echeck: vwECheck) {
    const request: vwECheck = {
      ...echeck
    };
    this.billingService
      .v1BillingEcheckPost$Json({
        body: request
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res > 0) {
            this.addMatterPaymentMethod(
              res,
              echeck.autoPay,
              echeck.suspendAutoPay,
              () => {
                this.toastDisplay.showSuccess(
                  this.error_data.add_echeck_success
                );
                this.selectedECheck = res;
                this.addECheck = false;
                this.getPaymentMethods();
              }
            );
          } else {
            this.toastDisplay.showError(this.error_data.error_occured);
            this.hideLoader();
          }
        },
        () => {
          this.hideLoader();
        }
      );
  }

  private hideLoader() {
    this.showAddMethodLoader = false;
  }

  private createAddress(
    res: vwAddressDetails,
    onSuccess: (id: number) => void
  ) {
    const address = {
      address1: res.address1,
      address2: res.address2,
      addressTypeId: 2,
      addressTypeName: 'billing',
      city: res.city,
      state: String(res.state),
      zipCode: res.zipCode,
      personId: this.matterDetails.clientName.id
    } as vwAddressDetails;

    this.personService
      .v1PersonAddressPost$Json({
        body: address
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {})
      )
      .subscribe(
        response => {
          if (response > 0) {
            address.id = response;
            this.getClientInfo();
            onSuccess(response);
          } else {
            this.toastDisplay.showError(this.error_data.address_update_error);
          }
        },
        () => {}
      );
  }

  private updateAddress(
    res: vwAddressDetails,
    addressTypeId: number,
    addressTypeName: string
  ) {
    const address = {
      id: res.id,
      address1: res.address1,
      address2: res.address2,
      addressTypeId,
      addressTypeName,
      city: res.city,
      state: String(res.state),
      zipCode: res.zipCode,
      personId: this.matterDetails.clientName.id
    } as vwAddressDetails;

    this.personService
      .v1PersonAddressPut$Json({
        body: address
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {})
      )
      .subscribe(
        response => {
          if (response > 0) {
            this.getClientInfo();
          }
        },
        () => {}
      );
  }

  private addMatterPaymentMethod(
    paymentMethodId: number,
    isAutopay: boolean,
    suspendAutoPay: boolean,
    onSuccess = () => {}
  ) {
    this.matterService
      .v1MatterPaymentMethodsPost$Json({
        body: [
          {
            matterId: this.matterDetails.id,
            paymentMethodId,
            isAutopay,
            isSuspend: suspendAutoPay
          }
        ]
      })
      .subscribe(
        () => {
          onSuccess();
        },
        () => {}
      );
  }

  //#endregion [Save CC and E-Check]

  public selectPaymentMethod(event) {
    this.isCheckedSameDayACH = false;
    this.dataEntered = true;
    this.selectedPaymentMethod = this.paymentMethodTypesList.find(
      item => item.code === this.paymentMethod
    );
  }


  public changeRequestRemaining(event) {
    this.dataEntered = true;
    this.amountToPay = this.requestRemainingAmount ? this.remainingAmount : '0';
    this.amountToPay = (+this.amountToPay).toFixed(2);
    this.amountErrMsg=null;
    this.validateAmount();
  }

  public reviewPayment() {
    this.formSubmitted = true;
    if((+this.amountToPay <= 0) && !this.requestRemainingAmount){
      this.validateAmount();
      return false;
    }

    if (this.paymentMethod === 'CHECK' && !this.checkNumber) {
      this.checkNumberMissing = this.error_data.check_number_required;
      return false;
    } else {
      this.checkNumberMissing = null;
    }

    if (this.paymentMethod === 'CHECK' && !!this.selectedFile) {
      if (this.selectedFile.size > 5000000) {
        return;
      }
    }

    if (this.paymentMethod === 'CHECK' && !!this.selectedFile) {
      if (
        !this.selectedFile.type.match('.jpeg') &&
        !this.selectedFile.type.match('.png')
      ) {
        return;
      }
    }

    if (this.paymentMethod === 'CREDIT_CARD' && !this.selectedCreditCard) {
      this.toastDisplay.showError(this.error_data.credit_card_required);
      return false;
    }

    if (this.paymentMethod === 'CREDIT_CARD' && this.selectedCreditCard) {
      this.selectedCreditCardDetaiols = this.creditCardList.find(
        item => item.id === this.selectedCreditCard
      );
    }

    if (this.paymentMethod === 'E-CHECK' && !this.selectedECheck) {
      this.toastDisplay.showError(this.error_data.e_check_required);
      return false;
    }

    if (this.paymentMethod === 'E-CHECK' && this.selectedECheck) {
      this.selectedECheckDetails = this.echeckList.find(
        item => item.id === this.selectedECheck
      );
    }

    if(!this.selectedOperatingAccount){
        this.operatingAccountError = true;
        return false;
    }

    if (this.dateErrMsg) {
      return false;
    }

    this.step = 'review';
    this.displayMessage = false;

    this.postObject = {
      amountToPay: +this.amountToPay,
      clientId: +this.clientDetail.id,
      creditCardId: null,
      eCheckId: null,
      initialConsultation: false,
      method: this.selectedPaymentMethod.id,
      methodType: this.selectedPaymentMethod.name,
      postingDate: new Date(),
      remainingBalDueDate: null,
      invoiceEmail: null,
      checkNumber: this.checkNumber ? this.checkNumber : null,
      routingNumber: this.selectedECheckDetails
        ? this.selectedECheckDetails.routingNumber
        : null,
      accountNumber: this.selectedECheckDetails
        ? this.selectedECheckDetails.accountNumber
        : null,
      paymentDetails: {
        billingAddress: this.officeDetails.address
      }
    };
    this.formSubmitted = false;
  }

  /**
   * Allow only number
   *
   * @param event Keyboard Event
   */
  chkNumber(event) {
    const k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k == 8 || k == 9;
  }

  public postPayment(partialPaymentModal) {
    this.dataEntered = false;
    this.disablePostPay = true;
    const formdata = new FormData();
    formdata.append('Id', '0');
    formdata.append('ClientId', this.matterDetails.clientName.id.toString());
    formdata.append('MatterId', this.matterDetails.id.toString());
    this.type == 'potential-client' ?  formdata.append('initialConsultation','true'):null;

    formdata.append(
      'Method',
      this.paymentMethod === 'primary'
        ? '0'
        : this.selectedPaymentMethod.id.toString()
    );
    formdata.append('AmountToPay', this.amountToPay.toString());
    if(this.selectedOperatingAccount!=null)
    formdata.append('OperatingBankAccountId',this.selectedOperatingAccount.usioBankAccountId);
    else
    formdata.append('OperatingBankAccountId',this.bankId.toString());
    formdata.append(
      'PostingDate',
      moment(this.paymentDate).format('YYYY-MM-DD') + 'T00:00:00'
    );

    if (this.paymentMethod === 'CHECK') {
      formdata.append('CheckNumber', this.checkNumber.toString());
    }

    if (this.paymentMethod === 'primary') {
      formdata.append('IsPrimaryRetainerTrust', true.toString());
    }

    if (this.paymentMethod === 'CREDIT_CARD') {
      formdata.append(
        'CreditCardId',
        this.selectedCreditCardDetaiols.id.toString()
      );

      this.postObject.paymentDetails = {
        name: this.selectedCreditCardDetaiols.companyName
          ? this.selectedCreditCardDetaiols.companyName
          : this.selectedCreditCardDetaiols.lastName +
            ', ' +
            this.selectedCreditCardDetaiols.firstName,
        billingAddress: this.officeDetails.address
      };

      this.postObject.cardNumber = this.selectedCreditCardDetaiols.cardNumber;
    }

    if (this.paymentMethod === 'E-CHECK') {
      formdata.append('ECheckId', this.selectedECheck.toString());
      formdata.append('SameDayACH', this.isCheckedSameDayACH.toString());
      this.postObject.paymentDetails = {
        name:
          this.selectedECheckDetails.lastName +
          ', ' +
          this.selectedECheckDetails.firstName,
        routingNumber: this.selectedECheckDetails.routingNumber,
        accountNumber: this.selectedECheckDetails.accountNumber,
        billingAddress: this.officeDetails.address
      };
    }

    this.postObject.isFullPayment = this.requestRemainingAmount;
    this.postObject.amountRemaining = +this.remainingAmount - +this.amountToPay;
    if (this.postObject.amountRemaining < 0) {
      this.postObject.amountRemaining = 0;
    }

    if (this.paymentMethod === 'CREDIT_CARD' && this.unpaidInvoices.length > 1) {
      this.showPostLoader = true;
      this.disablePostPay = true;
      this.partialPaymentCheck(formdata, partialPaymentModal);
    } else {
      if (this.createFlag) {
        this.createFlag = false;
        this.showPostLoader = true;
        if (this.selectedFile) {
          this.dmsFileUpload(formdata);
        } else {
          this.postPaymentMethod(formdata);
        }
      } else {
        this.disablePostPay = false;
        this.showPostLoader = false;
      }
    }
  }

  private partialPaymentCheck(formdata: FormData, partialPaymentModalTemplate) {
    this.postPaymentService.v1BillingPartialPaymentCheckPost(formdata)
    .subscribe(res => {
      this.createFlag = true;
      this.partialPaymentCheckResponse = res;

      if (this.partialPaymentCheckResponse &&
        this.partialPaymentCheckResponse.results) {
          if (
            this.partialPaymentCheckResponse.results.actualAmountToPay !=
            this.partialPaymentCheckResponse.results.originalAmountToPay
          ) {

            this.showPostLoader = false;
            this.disablePostPay = false;

            this.modalService.open(partialPaymentModalTemplate, {
              centered: true,
              backdrop: 'static'
            }).result.then(res => {
              if (res) {
                this.showPostLoader = true;
                this.disablePostPay = true;

                formdata.set('AmountToPay', this.partialPaymentCheckResponse.results.actualAmountToPay.toString());
                this.postObject.amountToPay = this.partialPaymentCheckResponse.results.actualAmountToPay;
                this.postObject.amountRemaining = +this.remainingAmount - this.partialPaymentCheckResponse.results.actualAmountToPay;

                this.postPaymentMethod(formdata);
              } else {
                this.createFlag = true;
                this.showPostLoader = false;
                this.disablePostPay = false;
              }
            });
          } else {
            this.showPostLoader = true;
            this.disablePostPay = true;

            this.postPaymentMethod(formdata);
          }
        } else {
          this.createFlag = true;
          this.displayMessage = true;
          this.showPostLoader = false;
          this.disablePostPay = false;
          this.message = this.error_data.partial_payment_check_error;
        }
    },
    err => {
      this.createFlag = true;
      this.displayMessage = true;
      this.showPostLoader = false;
      this.disablePostPay = false;
      if (err && err.error) {
        if (err.error.split(':').length > 1) {
          this.message = err.error.split(':')[1];
        }
      }

      if (this.message) {
        this.message = this.message.replace(';', '');
      }
    });
  }

  postPaymentMethod(body) {
    this.loaderCallback = () => {
      this.showPostLoader = false;
      this.disablePostPay = false;
      this.step = 'complete';
    };

    this.postPaymentService.v1PostPaymentPostToMatterBalance(body).subscribe(
      res => {
        this.paymentResponse = res.results;
        this.createFlag = true;
        this.trustTransactionPostObject = {...this.postObject};

        if (this.paymentResponse) {
          this.postObject.postingDate = this.paymentResponse.paymentPostingDate;

          if (this.paymentResponse.paymentAuthCode) {
            this.postObject.authCode = this.paymentResponse.paymentAuthCode;
          } else {
            this.postObject.authCode = this.paymentResponse.paymentId;
          }

          this.postObject.paymentId = this.paymentResponse.paymentId;

          this.postObject.amountToPay = this.paymentResponse.amountToOperatingAccount;

          this.trustTransactionPostObject.postingDate = this.paymentResponse.trustTransactionHistoryPostingDate;
          if (this.paymentResponse.trustTransactionHistoryAuthCode) {
            this.trustTransactionPostObject.authCode = this.paymentResponse.trustTransactionHistoryAuthCode;
          } else {
            this.trustTransactionPostObject.authCode = this.paymentResponse.trustTransactionHistoryId;
          }

          this.trustTransactionPostObject.paymentId = this.paymentResponse.trustTransactionHistoryId;
          this.trustTransactionPostObject.targetAccount = 'Trust';
          this.trustTransactionPostObject.amountToPay = this.paymentResponse.amountToTrust;
          this.trustTransactionPostObject.amountRemaining = 0;

          if (this.paymentMethod == "primary") {
            this.loaderCallback();
          }
        } else {
          this.showPostLoader = false;
          this.disablePostPay = false;
        }
      },
      err => {
        this.createFlag = true;
        this.displayMessage = true;
        this.showPostLoader = false;
        this.disablePostPay = false;
        if (err && err.error && typeof err.error === 'string') {
          this.message = err.error;
        }
      }
    );
  }

  dmsFileUpload(formdata) {
    const fileBody: any = {
      file: this.selectedFile
    };
    let params = {
      body: fileBody
    };
    this.dmsService.v1DmsCheckImageFileUploadPost(params).subscribe(
      (res: any) => {
        res = JSON.parse(res).results;
        formdata.append('ScannedCheckImgUrl', res);
        this.postPaymentMethod(formdata);
      },
      err => {
        this.showPaymentMethodLoader = false;
      }
    );
  }

  public printReceipt() {
    if (this.receiptPdfMatter && this.receiptPdfTrust) {
      if (this.receiptPdfMatter) {
        this.showPostLoader = true;
        this.receiptPdfMatter.printPdf(false);
      }

      if (this.receiptPdfTrust) {
        this.showPostLoader = true;
        this.receiptPdfTrust.printPdf();
      }
    } else {
      if (this.receiptPdfMatter) {
        this.showPostLoader = true;
        this.receiptPdfMatter.printPdf();
      }

      if (this.receiptPdfTrust) {
        this.showPostLoader = true;
        this.receiptPdfTrust.printPdf();
      }
    }
  }

  applyFilter(): void {
    this.dateErrMsg = '';
    if (this.paymentDate) {
      if (moment(this.paymentDate).isAfter(moment(), 'day')) {
        this.dateErrMsg = this.error_data.payment_date_cant_in_future;
      } else {
        this.dataEntered = true;
      }
    } else {
      this.dateErrMsg = this.error_data.select_payment_date;
    }
  }

  formatAmount(){
    this.amountToPay = (+this.amountToPay).toFixed(2);
  }

  validateAmount() {
    this.amountErrMsg = '';
    if ((+this.amountToPay <= 0)) {
      this.amountErrMsg = this.error_data.pay_amount_is_required;
    } else {
      const amount = this.requestRemainingAmount
        ? +this.remainingAmount
        : +this.amountToPay;
      if (this.paymentMethod === 'primary') {
        if (amount > this.currentBalance) {
          this.amountErrMsg = this.error_data.cannot_pay_from_primary_trust;
        }
      }
    }
  }

  selectFile() {
    this.postPaymentCheckImageInput.nativeElement.click();
  }

  uploadFile(files: File[]) {
    let file = files[0];
    this.selectedFile = file;
    this.postPaymentCheckErr = false;
    this.postPaymentCheck = true;
    this.postPaymentCheckUploadFile = true;

    if (!file.type.match('.jpeg') && !file.type.match('.png')) {
      this.postPaymentCheckUploadFile = false;
      this.postPaymentCheckImageInput.nativeElement.value = null;
      this.postPaymentCheckErrMsg = this.error_data.payment_check_Image_format_error;
      this.postPaymentCheckErr = true;
      this.postPaymentCheck = true;
      return;
    } else if (file.size > 5000000) {
      this.postPaymentCheckImageInput.nativeElement.value = null;
      this.postPaymentCheckUploadFile = false;
      this.postPaymentCheckErr = true;
      this.postPaymentCheckErrMsg = this.error_data.payment_check_Image_File_Size;
      this.postPaymentCheck = true;
      return;
    }
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.postPaymentCheckFileContent = reader.result as string;
    };
    reader.onerror = function(error) {
      console.log('Error: ', error);
    };
  }

  onPaymentClose() {
    this.postPaymentCheck = false;
    this.postPaymentCheckUploadFile = false;
    this.selectedFile = null;
    this.postPaymentCheckFileContent = '';
  }

  open(content: any, className: any, winClass) {
    this.modalReference = this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static'
      })
      .result.then(
        result => {
          this.closeResult = `Closed with: ${result}`;
        },
        reason => {
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

   /** Calculates Total Page Table **/
   public calculateTotalPage() {
    this.page.totalPages = Math.ceil(this.operatingTrustBankList.length / this.page.size);
  }

  /****** Triggers When Row Selected From Table *****/
  public onSelect(rows: any) {
    this.bankId = rows && rows.usioBankAccountId ? +rows.usioBankAccountId : null;
  }

  /****** Data Table Items per page *****/
  public pageSizeChange(): void {
    this.page.size = +this.selectPageSize.value;
    this.calculateTotalPage();
  }

  /****** Change Page Drop Down */
  public changePageDropDown(e) {
    this.pageSelected = e.page;
  }

  /** Changes Data Table Page **/
  public changePage() {
    this.page.pageNumber = +this.pageSelected;
  }

  public counter(): Array<any> {
    return new Array(this.page.totalPages);
  }

  /****** Triggers When Filter Applied ******/
  public applyFilterOperatingAccount() {
    let rows = [...this.originalOperatingTrustBankList];
    if (this.searchText) {
      rows = this.originalOperatingTrustBankList.filter(f => {
        return (
          (f.name || '').toLowerCase().includes(this.searchText.toLowerCase()) ||
          (f.merchantAccountNumber.substr(f.merchantAccountNumber.length - 4) || '').toLowerCase().includes(this.searchText.toLowerCase())
        );
      });
    }

    if(this.paymentMethod  == 'CREDIT_CARD' || this.paymentMethod  == 'E-CHECK') {
      rows = rows.filter(f => {
        return (f && f.isMerchantAccount && ((this.paymentMethod  == 'CREDIT_CARD' && f.isCreditCardAccount) || (this.paymentMethod  == 'E-CHECK' && f.isAchAccount)));
      })
    }
    this.operatingTrustBankList = [...rows];
    this.calculateTotalPage();
  }

  /******* Gets Operating Accountl List ****/
  public async getOperatingAccount() {
    this.loading = true;
    // await this.getOfficeId();
    try {
      const resp: any = await this.usioService
        .v1UsioGetUsioOfficeBankAccountsGet({ officeId: this.officeId, usioAccountTypeId: 1})
        .toPromise();
      if(JSON.parse(resp as any).results) {
        this.originalOperatingTrustBankList = JSON.parse(resp as any).results;
        this.operatingTrustBankList = [...this.originalOperatingTrustBankList];
        if(this.originalOperatingTrustBankList.length == 1) {
          this.onSelect(this.originalOperatingTrustBankList[0]);
        }
      }
      this.calculateTotalPage();
      this.loading = false;
    } catch (error) {
      this.loading = false;
    }
  }

  /******* Gets Office Id  ***/
  public async getOfficeId() {
    try {
      let resp:any = await this.usioService
        .v1UsioGetOfficeIdGet({matterId: this.matterId})
        .toPromise();
      resp = JSON.parse(resp as any).results;
      if(resp) {
        this.officeId = +resp;
      }
    } catch (error) {

    }
  }

  public selectedAccount(event?) {
    this.selectedOperatingAccount = event;
    this.selectedOperatingAccountId= this.selectedOperatingAccount.usioBankAccountId;
    this.operatingAccount = event;
    this.operatingAccountError = false;
    if(event) {
      if(!event.isMerchantAccount){
        this.isCheckedSameDayACH = false;
      }
      if(!event.isMerchantAccount && ((this.paymentMethod == 'CREDIT_CARD') || (this.paymentMethod == 'E-CHECK'))) {
        this.paymentMethod = null;
      } else {
        if((this.paymentMethod == 'CREDIT_CARD') && !event.isCreditCardAccount) {
          this.paymentMethod = null;
        }
        if((this.paymentMethod == 'E-CHECK') && !event.isAchAccount) {
          this.paymentMethod = null;
        }
      }
    }
  }

  public checkAchCreditStatus(event) {
    if(event) {
      this.isAchDisabled = event.isAchDisabled;
      this.isCreditCardDisabled = event.isCreditCardAccountDisabled;
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
