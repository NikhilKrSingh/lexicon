import { CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import * as moment from 'moment';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime, map, take } from 'rxjs/operators';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwMatterResponse } from 'src/app/modules/models';
import { RefunSources } from 'src/app/modules/models/refund-source.enum';
import { CommonReceiptPdfComponent } from 'src/app/modules/shared/receipt-pdf/receipt-pdf.component';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwCreditCard, vwECheck, vwIdCodeName } from 'src/common/swagger-providers/models';
import { BillingService, ClientService, DmsService, MatterService, OfficeService, TrustAccountService, UsioService, PotentialClientBillingService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../../store';
import * as message from '../../../shared/error.json';

@Component({
  selector: 'app-refund',
  templateUrl: './refund.component.html',
  styleUrls: ['./refund.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class RefundComponent
  implements OnInit, OnDestroy, IBackButtonGuard, AfterViewInit {
  @ViewChild(CommonReceiptPdfComponent, { static: false })
  receiptPdf: CommonReceiptPdfComponent;

  permissionSubscribe: any;
  matterId: any;
  matterDetails: vwMatterResponse;
  step = 'post';
  paymentMethodTypesList: Array<vwIdCodeName> = [];
  selectedPaymentMethod: { id?: number; code?: string; name?: string };
  allTrustAccountList = [];
  creditCardList = [];
  echeckList = [];
  refundForm: FormGroup;
  trustErrMsg = '';
  selectedTrust = null;
  currentBalance = null;
  selectedECheck = null;
  permissionList: any = {};
  dateErrMsg = '';
  checkNumber = null;
  amountErrMsg = '';
  notesErrMsg = '';

  messages = (message as any).default;
  selectedCreditCardDetails: vwCreditCard;
  selectedECheckDetails: vwECheck;
  selectedCreditCard = null;
  clientDetail: any = {};
  primaryAddress: any = {};
  matterPrimaryOfficeId = 0;
  isPaperCheckReq = false;
  postObject: any = {};
  refundFullAmount = false;

  PRIMARY = RefunSources.PRIMARY;
  TRUST = RefunSources.TRUST;
  MATTER = RefunSources.MATTER;
  POTENTIALCLIENT = RefunSources.POTENTIALCLIENT;

  showPaymentTargetLoader = true;
  showPaymentSourceLoader = false;
  showPostLoader = false;

  errorMessage: string;
  faiMsg: string;

  officeDetails: any;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;

  operatingAccountList = [];
  selectedOperatingAccountList: any = null;
  selectedOperatingAccount: any = null;
  officeId: number;

  @ViewChild('refundCheckImageInput', { static: false })
  public refundCheckImageInput: ElementRef<HTMLInputElement>;

  selectedFile: File;
  refundCheckFileContent: string;
  public refundCheckUploadFile = false;
  public refundCheckErrMsg = '';
  public refundCheckErr = false;
  public refundCheck = false;
  closeResult: string;
  public isPaymentRestrict = false;
  public modalReference: any;
  public checkTrustPaymentMethod: any = {
    isCreditCardAccount: true,
    isMerchantAccount: true,
    isAchAccount: true,
    isOfficeCreditCardAccount: true
  };

  loaderCallback = () => {
    this.showPostLoader = false;
  };

  printReceiptSub: Subscription;
  public amountWarningMsg: boolean = false;
  public loadingMatter: boolean = true;
  public matterWarningMsgCount: number = 0;
  public matterBalance: number = 0;
  public tempPaymentMethod: any;
  public availableRefundDetails: any = null;
  public loading = false;
  public offsetValue;
  public topbarHeight;
  operatingBankAccountId: number = 0;
  public errorOperatingAccount: boolean = false;
  public isCCorEcheckDisable: boolean = false;

  public operatingTrustAccountList: any[] = [];
  public tempSelectedOperatingAccount: any = null;
  public refundAmmount: number = 0;
  public operatingAccountName: string = null;
  public merchantAccountNumber: string = null;
  public matterUsioResponse: any;
  public refundErrorMessage: string = null;
  public proceed: string;
  public refundCheckAmount: number;

  public clientDetails: any;
  public clientId: string;
  public pcBalance: number = 0;

  state: string;
  public disabledList: any[] = [];

  constructor(
    private modalService: NgbModal,
    private dmsService: DmsService,
    private matterService: MatterService,
    private route: ActivatedRoute,
    private router: Router,
    private toaster: ToastDisplay,
    private billingService: BillingService,
    private trustAccountService: TrustAccountService,
    private fb: FormBuilder,
    private store: Store<fromRoot.AppState>,
    private toastDisplay: ToastDisplay,
    private clientService: ClientService,
    private currencyPipe: CurrencyPipe,
    private officeService: OfficeService,
    private pagetitle: Title,
    private sharedService: SharedService,
    private usioService: UsioService,
    private el: ElementRef,
    private potentialClientBillingService: PotentialClientBillingService
  ) {
    router.events.subscribe(val => {
      if (val instanceof NavigationStart === true) {
        this.navigateAwayPressed = true;
      }
    });

    this.printReceiptSub = this.sharedService.printReceipt$.subscribe(() => {
      this.showPostLoader = false;
    });
  }

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('matterId')) {
      this.matterId = this.route.snapshot.queryParamMap.get('matterId');
    } else if (this.route.snapshot.queryParamMap.get('clientId')) {
      this.clientId = this.route.snapshot.queryParamMap.get('clientId');
    } else {
      this.toaster.showError(this.messages.select_matter_first);
      this.router.navigate(['/matter/list']);
    }
    this.initRefundForm();

    this.permissionSubscribe = this.store
      .select('permissions')
      .subscribe(obj => {
        if (obj.loaded) {
          if (obj && obj.datas) {
            this.permissionList = obj.datas;
            if (this.permissionList) {
              const hasPermission =
                this.permissionList.BILLING_MANAGEMENTisAdmin ||
                this.permissionList.BILLING_MANAGEMENTisEdit
                  ? true
                  : false;
              if (hasPermission) {
                if (this.matterId) {
                  this.getMatterDetails(true);
                } else {
                  this.getClientDetail(true);
                }
              } else {
                if (this.matterId) {
                  this.getMatterDetails(false);
                } else {
                  this.getClientDetail(false);
                }
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
        }
      });

    this.faiMsg = this.messages.refund_from_trust_failed;

    if (this.matterId) {
      this.getMatterBalance();
      this.getOfficeId();
    } else {
      this.getPCBalance();
      this.getOfficeIdForPC();
    }
  }

  ngAfterViewInit() {
    const elements = document.querySelectorAll('.scrolling-steps');
    this.offsetValue =
      elements && elements.length > 0 ? elements[0].getBoundingClientRect() : 0;
    const ele = document.querySelectorAll('.top-bar');
    this.topbarHeight =
      ele && ele.length > 0 ? ele[0].getBoundingClientRect().height : 0;
  }

  ngOnDestroy() {
    if (this.printReceiptSub) {
      this.printReceiptSub.unsubscribe();
    }
  }

  initRefundForm() {
    let refundSource;
    if (this.matterId) {
      refundSource = this.MATTER;
    } else if (this.clientId) {
      refundSource = this.POTENTIALCLIENT;
    }
    this.refundForm = this.fb.group({
      refundSource: [refundSource, Validators.required],
      refundDate: [new Date(), Validators.required],
      refundTarget: [null],
      refundAmount: [null, Validators.required],
      notes: ['', Validators.required]
    });
  }

  async getMatterDetails(hasPermission): Promise<any> {
    try {
      const resp: any = await this.matterService
        .v1MatterMatterIdGet({ matterId: this.matterId })
        .toPromise();
      this.matterDetails = JSON.parse(resp as any).results;
      this.pagetitle.setTitle(
        'Refund Client - ' + this.matterDetails.matterName
      );
      if (
        this.matterDetails &&
        this.matterDetails.matterPrimaryOffice &&
        this.matterDetails.matterPrimaryOffice.id
      ) {
        this.matterPrimaryOfficeId = this.matterDetails.matterPrimaryOffice.id;
      }
      this.checkPermission(hasPermission);
      this.loadingMatter = false;
    } catch (err) {
      this.loadingMatter = false;
      this.showPaymentTargetLoader = false;
      this.showPaymentSourceLoader = false;
      this.router.navigate(['/matter/list']);
    }
  }

  async getClientDetail(hasPermission): Promise<any> {
    try {
      const resp: any = await this.clientService
        .v1ClientClientIdGet({
          clientId: Number(this.clientId),
          isPotentialClient: true
        })
        .toPromise();
      this.clientDetails = JSON.parse(resp).results;
      if (this.clientDetails.companyName) {
        this.pagetitle.setTitle(
          'Refund Potential Client - ' + this.clientDetails.companyName
        );
      } else {
        this.pagetitle.setTitle(
          'Refund Potential Client - ' +
            this.clientDetails.firstName +
            ' ' +
            this.clientDetails.lastName
        );
      }
      this.checkPermission(hasPermission);
      this.officeId = this.clientDetails.consultationLawOffice.id;
      this.getOfficeOperatingAccountList();
      this.loadingMatter = false;
      this.showPaymentTargetLoader = false;
    } catch (err) {
      this.loadingMatter = false;
      this.showPaymentTargetLoader = false;
      this.showPaymentSourceLoader = false;
      this.router.navigate(['/contact/potential-client']);
    }
  }

  async checkPermission(hasPermission): Promise<any> {
    let permission = false;
    let resp: any = await this.trustAccountService
      .v1TrustAccountGetTrustAccountStatusGet$Response()
      .toPromise();
    resp = JSON.parse(resp.body as any).results;
    if (resp) {
      if (hasPermission) {
        this.initAsyncCalls();
      } else {
        if (this.matterDetails) {
          permission = UtilsHelper.checkPermissionOfRepBingAtn(
            this.matterDetails
          );
        } else {
          permission = UtilsHelper.checkPermissionOfConsultAtn(
            this.clientDetails
          );
        }

        if (!permission) {
          this.toastDisplay.showPermissionError();
        } else {
          this.initAsyncCalls();
        }
      }
    } else {
      this.toastDisplay.showPermissionError();
    }
  }

  initAsyncCalls() {
    this.getPaymentMethod();
    if (this.matterDetails) {
      this.getSavedCardAndEChecks();
      this.getClientInfo();
      this.getPrimaryRetainerInfo();
    } else if (this.clientDetails) {
      this.getCreditCards(Number(this.clientId));
      this.getEcheckList(Number(this.clientId));
    }
    this.getOfficeAddress();
    if (this.matterPrimaryOfficeId) {
      this.getPaperCheck();
    }
  }

  private getCreditCards(clientId) {
    this.billingService
      .v1BillingPaymentMethodPersonIdGet({
        personId: clientId
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res) {
            this.creditCardList = res;
            if (this.creditCardList.length == 0) {
              this.disablePaymentMethod(this.creditCardList);
            }
          }
        },
        () => {}
      );
  }

  private getEcheckList(clientId) {
    this.billingService
      .v1BillingEcheckPersonPersonIdGet$Response({
        personId: clientId
      })
      .subscribe(
        response => {
          if (response) {
            this.echeckList = JSON.parse(response.body as any).results;
            if (this.echeckList.length == 0) {
              this.disablePaymentMethod(this.echeckList);
            }
          }
        },
        () => {}
      );
  }
  async getPrimaryRetainerInfo(): Promise<any> {
    let resp: any = await this.trustAccountService
      .v1TrustAccountGetPrimaryRetainerTrustDetailsGet({
        matterId: this.matterDetails.id
      })
      .toPromise();
    resp = JSON.parse(resp).results;
    this.currentBalance = resp.matterTrustbalance || 0;
    this.showPaymentTargetLoader = false;
  }

  async getPaymentMethod(): Promise<any> {
    this.loadingMatter = true;
    this.showPaymentTargetLoader = true;
    try {
      let resp: any = await this.billingService
        .v1BillingPaymentmethodtypesGet$Response({})
        .toPromise();
      resp = JSON.parse(resp.body as any).results;
      resp = resp.filter(x => x.code !== 'CASH');
      resp = resp.filter(a => a.code != 'CHARGEBACK');
      resp = resp.filter(a => a.code != 'PRIMARY_RETAINER_TRUST');
      resp = resp.filter(a => a.code != 'TRUST_TRANSFER');

      resp.forEach(x => {
        if (x.code === 'CREDIT_CARD') {
          x.order = 1;
        }
        if (x.code === 'E-CHECK') {
          x.order = 2;
        }
        if (x.code === 'CHECK') {
          x.order = 3;
        }
      });
      this.paymentMethodTypesList = _.sortBy(resp, 'order');
      if (this.operatingAccountList.length == 1 && resp)
        this.OnOperatingAccountChanged(this.operatingAccountList[0]);
      this.showPaymentTargetLoader = false;
      this.loadingMatter = false;
    } catch (error) {
      console.log(error);

      this.showPaymentTargetLoader = false;
      this.loadingMatter = false;
    }
  }

  async getSavedCardAndEChecks() {
    let res: any = await this.matterService
      .v1MatterPaymentMethodsbymatterMatterIdGet({
        matterId: this.matterId
      })
      .toPromise();
    res = JSON.parse(res).results;
    if (res.creditCards.length < 1 || res.eChecks.length < 1) {
      this.disablePaymentMethod(res);
    }
    this.creditCardList =
      res && res.creditCards && res.creditCards.length ? res.creditCards : [];
    this.echeckList =
      res && res.eChecks && res.eChecks.length ? res.eChecks : [];
  }

  disablePaymentMethod(list) {
    setTimeout(() => {
      this.paymentMethodTypesList.forEach((x, i) => {
        const el = document.getElementById(i.toString()) as HTMLInputElement;
        const dis =
          (((list.creditCards && list.creditCards.length < 1) ||
            list.length == 0) &&
            x.code == 'CREDIT_CARD') ||
          (((list.eChecks > 0 && list.eChecks.length < 1) ||
            list.length == 0) &&
            x.code == 'E-CHECK')
            ? true
            : false;
        el.disabled = dis;
        if (dis) {
          this.disabledList.push(x);
          if (el.value == 'on') {
            this.refundForm.get('refundTarget').setValue(null);
          }
        }
      });
    }, 50);
  }

  async getAllTrustAccount(): Promise<any> {
    let resp: any = await this.trustAccountService
      .v1TrustAccountGetAllTrustAccountsGet$Response({
        matterId: this.matterId
      })
      .toPromise();
    resp = JSON.parse(resp.body as any).results;
    this.allTrustAccountList = resp;
    this.allTrustAccountList.forEach(x => {
      const bal = x.matterTrustAmount ? x.matterTrustAmount : 0;
      x.text = x.name + ' - Balance: ' + this.currencyPipe.transform(bal);
      if (x.trustNumber) {
        x.text = x.trustNumber + ' - ' + x.text;
      }
      x.disabled = !x.matterTrustAmount;
    });
  }

  async getPaperCheck(): Promise<any> {
    let resp: any = await this.trustAccountService
      .v1TrustAccountGetOfficeTrustAccountSettingsGet({
        officeId: this.matterPrimaryOfficeId
      })
      .toPromise();
    resp = JSON.parse(resp).results;
    if (resp) {
      this.isPaperCheckReq = resp.isPaperChaeckRequired;
    }
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
            obj => obj.addressTypeName.toLowerCase() === this.PRIMARY
          );

          if (!this.primaryAddress) {
            this.primaryAddress = {};
          }
        }
      });
  }

  private getOfficeAddress() {
    let officeId;
    if (this.matterDetails && this.matterDetails.matterPrimaryOffice) {
      officeId = this.matterDetails.matterPrimaryOffice.id;
    } else if (this.clientDetails) {
      officeId = this.officeId;
    }
    this.officeService
      .v1OfficeIdGet({
        id: officeId
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        this.officeDetails = res;
      });
  }
  selectPaymentMethod(event) {
    if (this.refundForm.get('refundSource').value == 'matter')
      this.faiMsg = this.messages.refund_from_matter_failed;
    this.dataEntered = true;
    this.selectedCreditCard = null;
    this.checkNumber = null;
    this.selectedECheck = null;
    const value = event.code;
    this.selectedPaymentMethod = this.paymentMethodTypesList.find(
      item => item.code === value
    );
  }

  trustChange(event) {
    this.refundForm.get('refundTarget').setValue(null);
    this.dataEntered = true;
    this.checkTrustPaymentMethod = {
      isCreditCardAccount: true,
      isMerchantAccount: true,
      isAchAccount: true,
      isOfficeCreditCardAccount: true
    };
    if (event) {
      this.trustErrMsg = '';
    }
    if (parseFloat(this.refundForm.get('refundAmount').value)) {
      this.validateAmount();
    }
    this.checkRestrictPaymnet();
  }

  refundSourceChanged(type: string) {
    this.selectedOperatingAccount = null;
    this.dataEntered = true;
    this.amountErrMsg = '';
    switch (type) {
      case this.PRIMARY:
        this.errorOperatingAccount = false;
        this.clearRadioPaymentMethod();
        this.trustErrMsg = '';
        this.selectedTrust = null;
        if (this.operatingAccountList.length > 1) {
        }
        this.checkRestrictPaymnet();
        break;

      case this.MATTER:
        this.errorOperatingAccount = false;
        if (!this.isPaymentRestrict) {
          this.clearRadioPaymentMethod();
        }
        if (this.operatingAccountList.length == 1) {
          this.selectedOperatingAccount = this.tempSelectedOperatingAccount;
          this.OnOperatingAccountChanged(null);
        }
        if (this.operatingAccountList.length > 1) {
          this.GetRestrictPaymentStatus();
          this.selectedOperatingAccountList = null;
        }
        this.trustErrMsg = '';
        this.selectedTrust = null;
        break;

      case this.TRUST:
        this.errorOperatingAccount = false;
        this.getAllTrustAccount();
        if (this.operatingAccountList.length > 1) {
          this.selectedOperatingAccountList = null;
        }
        this.clearRadioPaymentMethod();
        this.checkRestrictPaymnet();
        break;
    }

    if (parseFloat(this.refundForm.get('refundAmount').value)) {
      this.validateAmount();
      this.refundFullAmount = false;
    }
  }

  /****** clears radio ***/
  public clearRadioPaymentMethod() {
    if (this.operatingAccountList.length > 1) {
      this.selectedOperatingAccountList = null;
      this.selectedOperatingAccount = null;
    }
    if (this.refundForm.get('refundTarget').value) {
      this.refundForm.get('refundTarget').setValue(null);
    }

    this.paymentMethodTypesList.forEach((x, i) => {
      const el = document.getElementById(i.toString()) as HTMLInputElement;
      if (this.disabledList.length > 0) {
        this.disabledList.forEach(y => {
          if (x == y) {
            el.disabled = true;
            if (el.value) {
              this.refundForm.get('refundTarget').setValue(null);
            }
          } else {
            el.disabled = false;
          }
        })
      }
    });
    this.checkTrustPaymentMethod = {
      isCreditCardAccount: true,
      isMerchantAccount: true,
      isAchAccount: true,
      isOfficeCreditCardAccount: true
    };
  }

  review() {
    this.refundForm.controls.notes.setValue(
      this.refundForm.controls.notes.value.trim()
    );
    this.trustErrMsg = '';
    this.dateErrMsg = '';
    this.amountErrMsg = '';
    this.notesErrMsg = '';
    this.errorMessage = null;
    this.amountWarningMsg = false;
    let error = false;
    const value = this.refundForm.value;
    const refundAmount = parseFloat(this.refundForm.get('refundAmount').value);

    if (
      (value.refundSource === this.MATTER ||
        value.refundSource === this.POTENTIALCLIENT) &&
      this.matterWarningMsgCount < 1
    ) {
      if (this.matterBalance + refundAmount > 0) {
        this.amountWarningMsg = true;
        this.matterWarningMsgCount = 1;
      } else {
        this.amountWarningMsg = false;
      }

      if (!this.selectedOperatingAccountList) {
        this.errorOperatingAccount = true;
      }
    } else {
      this.matterWarningMsgCount = 0;
      this.amountWarningMsg = false;
    }

    if (!this.selectedTrust && value.refundSource === this.TRUST) {
      this.scrollToFirstInvalidControl();
      this.trustErrMsg = this.messages.select_refund_source;
      error = true;
    }

    if (!value.refundDate) {
      this.dateErrMsg = this.messages.select_refund_date;
      this.scrollToFirstInvalidControl();
      error = true;
    }

    if (value.refundDate) {
      if (moment(value.refundDate).isAfter(moment(), 'day')) {
        this.dateErrMsg = this.messages.refund_date_cant_in_future;
        error = true;
      }
    }

    error = this.validateAmount();

    if (!value.notes) {
      this.notesErrMsg = this.messages.note_required_refund;
      error = true;
    }

    if (
      error ||
      this.notesErrMsg ||
      this.amountErrMsg ||
      this.dateErrMsg ||
      this.trustErrMsg ||
      this.errorOperatingAccount
    ) {
      return true;
    }

    const paymentMethod = this.refundForm.get('refundTarget').value;
    this.tempPaymentMethod = paymentMethod;
    if (!paymentMethod) {
      this.toastDisplay.showError(this.messages.select_refund_target);
      return true;
    }

    if (paymentMethod === 'CHECK' && !!this.selectedFile) {
      if (this.selectedFile.size > 5000000) {
        return true;
      }
    }

    if (paymentMethod === 'CHECK' && !!this.selectedFile) {
      if (
        !this.selectedFile.type.match('.jpeg') &&
        !this.selectedFile.type.match('.png')
      ) {
        return true;
      }
    }

    if (paymentMethod === 'CREDIT_CARD' && !this.selectedCreditCard) {
      this.toastDisplay.showError(this.messages.credit_card_required);
      return true;
    }

    if (paymentMethod === 'CREDIT_CARD' && this.selectedCreditCard) {
      this.selectedCreditCardDetails = this.creditCardList.find(
        item => item.id === this.selectedCreditCard
      );
    }

    if (paymentMethod === 'E-CHECK' && !this.selectedECheck) {
      this.toastDisplay.showError(this.messages.e_check_required);
      return true;
    }

    if (paymentMethod === 'E-CHECK' && this.selectedECheck) {
      this.selectedECheckDetails = this.echeckList.find(
        item => item.id === this.selectedECheck
      );
    }
  }

  chkNumber(event, allowDecimal = false) {
    this.amountWarningMsg = false;
    const k = event.keyCode ? event.keyCode : event.which;
    const allow = (k >= 48 && k <= 57) || k == 8 || k == 9;

    return allowDecimal ? allow || k == 46 : allow;
  }

  formatToMoney() {
    if (this.refundForm.get('refundAmount').value) {
      const refundAmount = parseFloat(
        this.refundForm.get('refundAmount').value
      );
      this.refundForm.get('refundAmount').setValue(refundAmount.toFixed(2));
    }
  }

  applyFilter(): void {
    this.dateErrMsg = '';
    if (this.refundForm.value.refundDate) {
      if (moment(this.refundForm.value.refundDate).isAfter(moment(), 'day')) {
        this.dateErrMsg = this.messages.refund_date_cant_in_future;
      } else {
        this.dataEntered = true;
      }
    } else {
      this.dateErrMsg = this.messages.select_refund_date;
    }
  }

  onRefundChange(event): void {
    this.dataEntered = true;
    let amount = null;
    if (event && event.target) {
      const type = this.refundForm.get('refundSource').value;
      if (type === this.TRUST && this.selectedTrust && event.target.checked) {
        const trustAcc = this.allTrustAccountList.find(
          x => x.id === this.selectedTrust
        );
        amount = trustAcc.matterTrustAmount;
      } else if (type === this.PRIMARY && event.target.checked) {
        amount = this.currentBalance;
      } else if (type === this.MATTER && event.target.checked) {
        amount = this.matterBalance;
      } else if (type === this.POTENTIALCLIENT && event.target.checked) {
        amount = this.pcBalance;
      }

      if (amount) {
        this.refundForm.controls.refundAmount.setValue(Math.abs((+amount)).toFixed(2));
      }
      this.validateAmount();
    }
  }

  get isPCrefundResultInDue() {
    if (this.refundForm) {
      const refundAmount = this.refundForm.get('refundAmount').value;
      if (refundAmount) {
        return +refundAmount + this.pcBalance > 0;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  get isMatterrefundResultInDue() {
    if (this.refundForm) {
      const refundAmount = this.refundForm.get('refundAmount').value;
      if (refundAmount) {
        return +refundAmount + this.matterBalance > 0;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  validateAmount() {
    this.amountErrMsg = '';
    let error = false;
    const refundAmount = parseFloat(this.refundForm.get('refundAmount').value);
    if (!refundAmount) {
      this.amountErrMsg = this.messages.refund_amount_is_required;
      this.scrollToFirstInvalidControl();
      error = true;
    } else {
      const type = this.refundForm.get('refundSource').value;
      if (type === this.PRIMARY) {
        if (refundAmount > this.currentBalance) {
          this.amountErrMsg = this.messages.refund_not_more_than_balance;
          error = true;
        }
      } else if (type === this.TRUST) {
        if (this.selectedTrust) {
          const trustAcc = this.allTrustAccountList.find(
            x => x.id === this.selectedTrust
          );
          if (trustAcc && trustAcc.matterTrustAmount) {
            if (refundAmount > trustAcc.matterTrustAmount) {
              this.amountErrMsg = this.messages.refund_not_more_than_balance;
              error = true;
            }
          } else {
            this.amountErrMsg = this.messages.select_other_trust_account;
            error = true;
          }
        } else {
          this.amountErrMsg = this.messages.select_trust_account;
          error = true;
        }
      }
    }

    return error;
  }

  validateInput(key): void {
    switch (key) {
      case 'notes':
        this.notesErrMsg = !this.refundForm.value.notes
          ? this.messages.refund_amount_is_required
          : '';
        break;
    }
  }

  printReceipt() {
    if (this.receiptPdf) {
      this.showPostLoader = true;
      this.receiptPdf.printPdf();
    }
  }

  async refund() {
    try {
      this.dataEntered = false;
      const data = {
        clientId: this.matterDetails
          ? this.matterDetails.clientName.id
          : this.clientDetails
          ? this.clientDetails.id
          : 0,
        matterId: this.matterDetails
          ? this.matterDetails.id
          : this.clientDetails
          ? this.clientDetails.matterId
          : 0,
        method: this.selectedPaymentMethod.id,
        matterTrustOnlyAccountId:
          this.refundForm.get('refundSource').value === this.TRUST
            ? this.selectedTrust
            : 0,
        isPrimaryRetainerTrust:
          this.refundForm.get('refundSource').value === this.PRIMARY
            ? true
            : false,
        sourceFirmOperatignAccountId:
          this.refundForm.get('refundSource').value === this.MATTER ||
          this.refundForm.get('refundSource').value === this.POTENTIALCLIENT
            ? this.selectedOperatingAccountList //add in SourceFirmOperatingAccountId once have it
            : null,
        checkNumber:
          this.refundForm.value.refundTarget === 'CHECK'
            ? this.checkNumber
            : null,
        creditCardId:
          this.refundForm.value.refundTarget === 'CREDIT_CARD'
            ? this.selectedCreditCard
            : 0,
        eCheckId:
          this.refundForm.value.refundTarget === 'E-CHECK'
            ? this.selectedECheck
            : 0,
        refundDate:
          moment(this.refundForm.value.refundDate).format('YYYY-MM-DD') +
          'T00:00:00',
        notes: this.refundForm.get('notes').value,
        amountToRefund: 0,
        isPotentialClient: this.clientDetails ? true : null
      };

      if (
        this.refundForm.value.refundTarget === 'E-CHECK' ||
        this.refundForm.value.refundTarget === 'CREDIT_CARD'
      ) {
        data.amountToRefund = this.availableRefundDetails.balance;
      } else {
        data.amountToRefund = parseFloat(
          this.refundForm.get('refundAmount').value
        );
      }
      this.showPostLoader = true;

      this.loaderCallback = () => {
        this.showPostLoader = false;
      };

      if (this.selectedFile) {
        this.dmsFileUpload(data);
      } else {
        this.checkRefund(data);
      }
    } catch (e) {
      this.showPostLoader = false;
    }
  }

  dmsFileUpload(body) {
    const fileBody: any = {
      file: this.selectedFile
    };
    let params = {
      body: fileBody
    };
    this.dmsService.v1DmsCheckImageFileUploadPost(params).subscribe(
      (res: any) => {
        res = JSON.parse(res).results;
        body['ScannedCheckImgUrl'] = res;
        this.checkRefund(body);
      },
      err => {
        this.showPostLoader = false;
      }
    );
  }

  checkRefund(data) {
    if (this.proceed == 'add check') {
      let dataCopyCheck = { ...data };
      let originalData = { ...data };
      dataCopyCheck.checkNumber = this.checkNumber;
      dataCopyCheck.creditCardId = dataCopyCheck.eCheckId = 0;

      let checkMethod = this.paymentMethodTypesList.find(
        a => a.code == 'CHECK'
      );
      dataCopyCheck.method = checkMethod ? checkMethod.id : 44;
      dataCopyCheck.amountToRefund = this.refundCheckAmount;

      this.refundMethod(originalData, resp => {
        this.refundMethod(dataCopyCheck);
        this.loaderCallback();
        if (this.selectedPaymentMethod.code != 'CHECK') {
          if (resp.usioResponseCode == 'success') {
            this.step = 'confirm';
          }
        } else {
          this.step = 'confirm';
        }
      });
    } else {
      this.refundMethod(data, resp => {
        this.loaderCallback();
        if (this.selectedPaymentMethod.code != 'CHECK') {
          if (resp.usioResponseCode == 'success') {
            this.step = 'confirm';
          }
        } else {
          this.step = 'confirm';
        }
      });
    }
  }

  refundMethod(data, callBack = resp => {}) {
    if (
      this.refundForm.value.refundSource === this.MATTER ||
      this.refundForm.value.refundSource === this.POTENTIALCLIENT
    ) {
      this.showPostLoader = true;
      this.billingService
        .v1BillingRefundFromMatterBalancePost$Json({ body: data })
        .subscribe(
          (resp: any) => {
            resp = JSON.parse(resp).results;
            this.postObject.paymentId = resp.trustTransactionId;
            this.postObject.postingDate = resp.postingDate;
            this.postObject.authCode = resp.confirmationNumber;
            this.errorMessage = resp.usioResponseMessage;
            callBack(resp);
          },
          err => {
            if (err && err.error) {
              if (err.error.split(':').length > 1) {
                this.errorMessage = err.error.split(':')[1];
              } else if (err.error.split(';').length > 1) {
                this.errorMessage = err.error.split(';')[1]
                  ? err.error.split(';')[1]
                  : err.error.split(';')[0];
              }
            }
            this.showPostLoader = false;
          }
        );
    } else {
      this.showPostLoader = true;
      this.billingService
        .v1BillingRefundFromTrustPost$Json({ body: data })
        .subscribe(
          (resp: any) => {
            resp = JSON.parse(resp).results;
            this.postObject.paymentId = resp.trustTransactionId;
            this.postObject.postingDate = resp.postingDate;
            this.postObject.authCode = resp.confirmationNumber;
            this.errorMessage = resp.usioResponseMessage;
            callBack(resp);
          },
          err => {
            if (err && err.error) {
              if (err.error.split(':').length > 1) {
                this.errorMessage = err.error.split(':')[1];
              } else if (err.error.split(';').length > 1) {
                this.errorMessage = err.error.split(';')[1]
                  ? err.error.split(';')[1]
                  : err.error.split(';')[0];
              }
            }
            this.showPostLoader = false;
          }
        );
    }
  }

  selectFile() {
    this.refundCheckImageInput.nativeElement.click();
  }

  uploadFile(files: File[]) {
    let file = files[0];
    this.selectedFile = file;
    this.refundCheckErr = false;
    this.refundCheck = true;
    this.refundCheckUploadFile = true;

    if (!file.type.match('.jpeg') && !file.type.match('.png')) {
      this.refundCheckUploadFile = false;
      this.refundCheckImageInput.nativeElement.value = null;
      this.refundCheckErrMsg = this.messages.payment_check_Image_format_error;
      this.refundCheckErr = true;
      this.refundCheck = true;
      return;
    } else if (file.size > 5000000) {
      this.refundCheckImageInput.nativeElement.value = null;
      this.refundCheckUploadFile = false;
      this.refundCheckErr = true;
      this.refundCheckErrMsg = this.messages.payment_check_Image_File_Size;
      this.refundCheck = true;
      return;
    }

    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.refundCheckFileContent = reader.result as string;
    };
    reader.onerror = function(error) {
      console.log('Error: ', error);
    };
  }

  onRefundClose() {
    this.refundCheck = false;
    this.refundCheckUploadFile = false;
    this.selectedFile = null;
    this.refundCheckFileContent = '';
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

  async getMatterBalance(): Promise<any> {
    let resp: any = await this.billingService
      .v1BillingGetPaymentHierachiesWithPendingPaymentsMatterIdGet({
        matterId: this.matterId
      })
      .toPromise();
    resp = JSON.parse(resp).results;
    if (resp) {
      let totalAmount: number = 0;
      let totalPaid: number = 0;
      resp.forEach(invoice => {
        totalAmount += invoice.totalAmount;
        totalPaid += invoice.totalPaid;
      });
      this.matterBalance = totalAmount - totalPaid;
    }
  }

  async getPCBalance(): Promise<any> {
    let resp: any = await this.potentialClientBillingService
      .v1PotentialClientBillingGetPaymentHierachiesWithPendingPaymentsContactIdGet(
        {
          contactId: Number(this.clientId)
        }
      )
      .toPromise();
    resp = JSON.parse(resp).results;
    if (resp) {
      let totalAmount: number = 0;
      let totalPaid: number = 0;
      resp.forEach(invoice => {
        totalAmount += invoice.totalAmount;
        totalPaid += invoice.totalPaid;
      });
      this.pcBalance = totalAmount - totalPaid;
    }
  }

  public async checkRestrictPaymnet() {
    try {
      this.isPaymentRestrict = false;
      let resp: any = await this.usioService
        .v1UsioCheckUsioTrustAccountTypeGet({ matterId: +this.matterId })
        .toPromise();
      resp = JSON.parse(resp as any).results;
      if (resp) {
        this.checkTrustPaymentMethod = resp;
        this.disableRefundTarget(resp);
      }
    } catch {}
  }

  public disableRefundTarget(paymentMethod, reset = true) {
    setTimeout(() => {
      this.paymentMethodTypesList.forEach((x, i) => {
        const el = document.getElementById(i.toString()) as HTMLInputElement;
        if (paymentMethod) {
          const dis =
            (!paymentMethod.isMerchantAccount &&
              (x.code == 'CREDIT_CARD' || x.code == 'E-CHECK')) ||
            ((this.refundForm.get('refundSource').value == 'primary' ||
              this.refundForm.get('refundSource').value == 'trust') &&
              paymentMethod.isMerchantAccount &&
              paymentMethod.isOfficeCreditCardAccount &&
              (x.code == 'CREDIT_CARD' || x.code == 'E-CHECK')) ||
            (paymentMethod.isMerchantAccount &&
              x.code == 'CREDIT_CARD' &&
              !paymentMethod.isCreditCardAccount) ||
            (paymentMethod.isMerchantAccount &&
              x.code == 'E-CHECK' &&
              !paymentMethod.isAchAccount)
              ? true
              : false;
          el.disabled = dis;
          if (dis) {
            if (el.value == 'on' && reset) {
              this.refundForm.get('refundTarget').setValue(null);
            }
          }
        }
      });
    }, 100);
  }

  public async getOfficeId() {
    try {
      const resp = await this.usioService
        .v1UsioGetOfficeIdGet({ matterId: this.matterId })
        .toPromise();
      this.officeId = JSON.parse(resp as any).results;
      if (this.officeId > 0) {
        this.getOfficeOperatingAccountList();
      }
    } catch (error) {}
  }

  public async getOfficeIdForPC() {
    try {
      const resp = await this.usioService
        .v1UsioGetOfficeIdForPcGet({
          contactId: +this.clientId
        })
        .toPromise();
      this.officeId = JSON.parse(resp as any).results;
      if (this.officeId > 0) {
        this.getOfficeOperatingAccountList();
      }
    } catch (error) {}
  }

  public async getOfficeOperatingAccountList() {
    try {
      const resp = await this.usioService
        .v1UsioGetUsioOfficeBankAccountsGet({
          officeId: this.officeId,
          usioAccountTypeId: 1
        })
        .toPromise();
      this.operatingAccountList = JSON.parse(resp as any).results;
      if (
        this.operatingAccountList != null ||
        this.operatingAccountList !== undefined
      ) {
        this.operatingAccountList.forEach(element => {
          if (!element.isMerchantAccount) {
            element.merchantAccountNumber = element.nonMerchantAccountNumber;
          }
        });
      }
      if (this.operatingAccountList.length == 1) {
        this.selectedOperatingAccountList = this.operatingAccountList[0].usioBankAccountId;
        this.selectedOperatingAccount = this.operatingAccountList[0];
        this.operatingBankAccountId = this.operatingAccountList[0].usioBankAccountId;
        this.operatingAccountName = this.operatingAccountList[0].name;
        this.merchantAccountNumber = this.operatingAccountList[0].merchantAccountNumber;
      }
    } catch (error) {}
  }
  OnOperatingAccountChanged(model) {
    this.isPaymentRestrict = false;
    this.selectedTrust = null;
    if (model) {
      this.selectedOperatingAccount = model;
    }
    this.checkTrustPaymentMethod = this.selectedOperatingAccount;
    this.errorOperatingAccount = false;
    setTimeout(() => {
      this.paymentMethodTypesList.forEach((x, i) => {
        const el = document.getElementById(i.toString()) as HTMLInputElement;
        if (this.selectedOperatingAccount) {
          const dis =
            (!this.selectedOperatingAccount.isMerchantAccount &&
              (x.code == 'CREDIT_CARD' || x.code == 'E-CHECK')) ||
            (this.selectedOperatingAccount.isMerchantAccount &&
              x.code == 'CREDIT_CARD' &&
              !this.selectedOperatingAccount.isCreditCardAccount) ||
            (this.selectedOperatingAccount.isMerchantAccount &&
              x.code == 'E-CHECK' &&
              !this.selectedOperatingAccount.isAchAccount)
              ? true
              : false;
          el.disabled = dis;
          if (this.disabledList.length > 0) {
            this.disabledList.forEach(y => {
              if (x == y) {
                el.disabled = true;
              }
            });
          }
          if (dis && model) {
            if (el.value) {
              this.refundForm.get('refundTarget').setValue(null);
            }
          }
        }
      });
    }, 500);
  }

  isDisabled(type) {
    if (type.code == 'CREDIT_CARD') {
      if (
        !this.checkTrustPaymentMethod.isCreditCardAccount ||
        !this.checkTrustPaymentMethod.isMerchantAccount
      ) {
        if (this.refundForm.get('refundTarget').value == 'CREDIT_CARD') {
          this.refundForm.get('refundTarget').setValue('');
        }
        return true;
      }
    }
    if (type.code == 'E-CHECK' && !this.checkTrustPaymentMethod.isAchAccount) {
      if (this.refundForm.get('refundTarget').value == 'E-CHECK') {
        this.refundForm.get('refundTarget').setValue('');
      }
      return true;
    }
  }

  public async GetRestrictPaymentStatus(): Promise<any> {
    this.loadingMatter = true;
    try {
      let resp: any = await this.trustAccountService
        .v1TrustAccountGetRestrictPaymentStatusGet({ matterId: +this.matterId })
        .toPromise();
      resp = JSON.parse(resp as any).results;

      if (resp) {
        this.isPaymentRestrict = resp;
        this.DisablePaymentType();
      }
      this.loadingMatter = false;
    } catch {
      this.loadingMatter = false;
    }
  }

  public resolvePayment(status: boolean = false) {
    let paymentMethod = this.tempPaymentMethod;
    if (this.proceed == 'check') {
      this.tempPaymentMethod = paymentMethod = this.refundForm.value.refundTarget =
        'CHECK';
      this.selectedPaymentMethod = this.paymentMethodTypesList.find(
        a => a.code == 'CHECK'
      );
    }

    if (this.refundForm.valid) {
      this.postObject = {
        amountToPay: +this.refundForm.value.refundAmount,
        clientId: +this.clientDetail.id,
        methodType: this.selectedPaymentMethod.name,
        checkNumber: paymentMethod === 'CHECK' ? this.checkNumber : null,
        routingNumber:
          paymentMethod === 'E-CHECK'
            ? this.selectedECheckDetails.routingNumber
            : null,
        accountNumber:
          paymentMethod === 'E-CHECK'
            ? this.selectedECheckDetails.accountNumber
            : null,
        paymentDetails: {
          billingAddress: this.officeDetails.address
        }
      };

      if (paymentMethod === 'CREDIT_CARD') {
        this.postObject.paymentDetails = {
          name: this.selectedCreditCardDetails.companyName
            ? this.selectedCreditCardDetails.companyName
            : this.selectedCreditCardDetails.lastName +
              ', ' +
              this.selectedCreditCardDetails.firstName,
          billingAddress: this.officeDetails.address
        };
        this.postObject.cardNumber = this.selectedCreditCardDetails.cardNumber;

        if (this.proceed != 'add check') {
          this.availableRefundDetails = {
            balance: this.postObject.amountToPay
          };
        }
      }

      if (paymentMethod === 'E-CHECK') {
        this.postObject.paymentDetails = {
          name:
            this.selectedECheckDetails.lastName +
            ', ' +
            this.selectedECheckDetails.firstName,
          routingNumber: this.selectedECheckDetails.routingNumber,
          accountNumber: String(this.selectedECheckDetails.accountNumber),
          billingAddress: this.officeDetails.address
        };

        if (this.proceed != 'add check') {
          this.availableRefundDetails = {
            balance: this.postObject.amountToPay
          };
        }
      }

      this.step = 'review';
    }
    if (status) {
      this.modalService.dismissAll();
    }

    // if (
    //   this.availableRefundDetails &&
    //   this.availableRefundDetails.balance != 0
    // ) {
    //   this.refundForm
    //     .get('refundAmount')
    //     .setValue(this.availableRefundDetails.balance.toFixed(2));
    // }
  }

  public checkAvailableRefunds(modal?) {
    if (this.review()) {
      return;
    }
    const paymentMethod: any = this.refundForm.get('refundTarget').value;
    if (paymentMethod !== 'CHECK') {
      this.checkNumber = null;
    }
    if (
      (this.refundForm.get('refundSource').value == this.MATTER ||
        this.refundForm.get('refundSource').value == this.POTENTIALCLIENT) &&
      (paymentMethod == 'CREDIT_CARD' || paymentMethod == 'E-CHECK') &&
      this.selectedOperatingAccount &&
      this.selectedOperatingAccount.isMerchantAccount
    ) {
      switch (paymentMethod) {
        case 'E-CHECK':
          this.checkRefundBalance(modal);
          break;
        case 'CREDIT_CARD':
          this.checkRefundBalance(modal);
          break;
      }
    } else if (
      (this.refundForm.get('refundSource').value == 'primary' ||
        this.refundForm.get('refundSource').value == 'trust') &&
      (paymentMethod == 'CREDIT_CARD' || paymentMethod == 'E-CHECK')
    ) {
      switch (paymentMethod) {
        case 'E-CHECK':
          this.checkTrustRefundAmount(modal);
          break;
        case 'CREDIT_CARD':
          this.checkTrustRefundAmount(modal);
          break;
      }
    } else {
      this.resolvePayment();
    }
  }

  public async checkTrustRefundAmount(modal) {
    let refundSource = this.refundForm.get('refundSource').value;
    const body = {
      creditCardId: +this.selectedCreditCard,
      echeckId: +this.selectedECheck,
      matterId: +this.matterId,
      refundAmount: +this.refundForm.get('refundAmount').value,
      IsPrimaryRetainer:
        this.refundForm.get('refundSource').value === 'primary' ? true : false,
      TrustAccountId:
        this.refundForm.get('refundSource').value === 'trust'
          ? this.selectedTrust
          : 0
    };
    this.loading = true;
    try {
      let resp: any;
      switch (refundSource) {
        case this.PRIMARY:
          resp = await this.matterService
            .v1MatterCheckSufficientTrustRefundBalancePost$Json({ body })
            .toPromise();
          break;
        case this.TRUST:
          resp = await this.matterService
            .v1MatterCheckSufficientTrustRefundBalancePost$Json({ body })
            .toPromise();
          break;
      }

      this.availableRefundDetails = JSON.parse(resp as any).results;
      this.loading = false;
      if (
        !this.availableRefundDetails.isRefund ||
        (!this.availableRefundDetails.isRefund &&
          !this.availableRefundDetails.isACHFundsAvailable)
      ) {
        this.refundCheckAmount =
          +body.refundAmount - this.availableRefundDetails.balance;
        this.openInsufficientRefundModal(modal);
      } else if (
        this.availableRefundDetails.isThirdStatShow &&
        this.availableRefundDetails.isACHFundsAvailable
      ) {
        this.openInsufficientRefundModal(modal);
      } else {
        this.resolvePayment();
      }
    } catch (error) {
      this.loading = false;
    }
  }

  public openInsufficientRefundModal(modal) {
    this.open(modal, '', 'modal-lmd');
  }

  private scrollToFirstInvalidControl() {
    setTimeout(() => {
      const firstInvalidControl: HTMLElement = this.el.nativeElement.querySelector(
        '.ng-invalid'
      );

      // firstInvalidControl.focus(); //without smooth behavior
      window.scroll({
        top: this.getTopOffset(firstInvalidControl),
        left: 0,
        behavior: 'smooth'
      });

      fromEvent(window, 'scroll')
        .pipe(debounceTime(100), take(1))
        .subscribe(() => firstInvalidControl.focus());
    }, 100);
  }

  private getTopOffset(controlEl: HTMLElement): number {
    const labelOffset = 50;
    return (
      controlEl.getBoundingClientRect().top +
      window.scrollY -
      (this.offsetValue.height + this.topbarHeight + labelOffset)
    );
  }

  DisablePaymentType() {
    setTimeout(() => {
      this.paymentMethodTypesList.forEach((x, i) => {
        const el = document.getElementById(i.toString()) as HTMLInputElement;
        const dis =
          (this.isPaymentRestrict &&
            (x.code == 'CREDIT_CARD' || x.code == 'E-CHECK') &&
            (this.refundForm.get('refundSource').value == this.TRUST ||
              this.refundForm.get('refundSource').value == this.PRIMARY)) ||
          (!this.isPaymentRestrict &&
            !this.checkTrustPaymentMethod.isMerchantAccount &&
            (x.code == 'CREDIT_CARD' || x.code == 'E-CHECK'))
            ? true
            : false;
        el.disabled = dis;
        if (this.disabledList.length > 0) {
          this.disabledList.forEach(y => {
            if (x == y) {
              el.disabled = true;
            }
          });
        }
        if (dis) {
          if (el.value == 'on') {
            this.refundForm.get('refundTarget').setValue(null);
          }
        }
      });
    }, 50);
  }

  /*** Adjust payment ****/
  public adjustPayment() {
    let paymentSource = this.refundForm.get('refundSource').value;
    switch (paymentSource) {
      case this.MATTER:
        this.OnOperatingAccountChanged(null);
        break;

      case this.TRUST:
        this.disableRefundTarget(this.checkTrustPaymentMethod, false);
        break;
    }
  }

  public async checkRefundBalance(modal) {
    let refundSource = this.refundForm.get('refundSource').value;
    if (this.review()) {
      return;
    }
    const body = {
      creditCardId: +this.selectedCreditCard,
      echeckId: +this.selectedECheck,
      matterId: +this.matterId,
      refundAmount: +this.refundForm.get('refundAmount').value,
      OperatingBankAccountId:
        this.operatingAccountList.length == 1
          ? +this.operatingBankAccountId
          : +this.selectedOperatingAccountList
    };

    if (this.clientDetails) {
      body.matterId = this.clientDetails.matterId;
    }

    this.loading = true;
    try {
      let resp: any;
      switch (refundSource) {
        case this.MATTER:
        case this.POTENTIALCLIENT:
          resp = await this.matterService
            .v1MatterCheckSufficientRefundAmtPost$Json({ body })
            .toPromise();
          break;
      }

      this.availableRefundDetails = JSON.parse(resp as any).results;
      this.loading = false;
      if (
        !this.availableRefundDetails.isRefund ||
        (!this.availableRefundDetails.isRefund &&
          !this.availableRefundDetails.isACHFundsAvailable)
      ) {
        this.refundCheckAmount =
          body.refundAmount - this.availableRefundDetails.balance;
        this.openInsufficientRefundModal(modal);
      } else if (
        this.availableRefundDetails.isThirdStatShow &&
        this.availableRefundDetails.isACHFundsAvailable
      ) {
        this.openInsufficientRefundModal(modal);
      } else {
        this.resolvePayment();
      }
    } catch (error) {
      this.loading = false;
    }
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }
}
