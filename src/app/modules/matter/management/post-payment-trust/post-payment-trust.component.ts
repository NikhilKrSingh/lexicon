import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import * as moment from 'moment';
import { interval, Observable, Subscription } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwMatterResponse } from 'src/app/modules/models';
import { CommonReceiptPdfComponent } from 'src/app/modules/shared/receipt-pdf/receipt-pdf.component';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwAddressDetails, vwClient, vwCreditCard, vwECheck, vwIdCodeName } from 'src/common/swagger-providers/models';
import { BillingService, ClientService, DmsService, MatterService, MiscService, OfficeService, PersonService, TrustAccountService, UsioService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../../store';
import * as fromPermissions from '../../../../store/reducers/permission.reducer';
import * as errors from '../../../shared/error.json';

@Component({
  selector: 'app-post-payment-trust',
  templateUrl: './post-payment-trust.component.html',
  styleUrls: ['./post-payment-trust.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class PostPaymentTrustComponent
  implements OnInit, OnDestroy, IBackButtonGuard {
  @ViewChild(CommonReceiptPdfComponent, { static: false }) receiptPdf: CommonReceiptPdfComponent;

  @ViewChild('paymentCheckImageInput', { static: false }) public paymentCheckImageInput: ElementRef<HTMLInputElement>;

  selectedFile: File;
  paymentCheckFileContent: string;


  public matterId: number;
  public matterDetails: vwMatterResponse;
  public dateErrMsg = '';
  public amountErrMsg = '';
  public linkExpirationDate = new Date();
  public form: FormGroup;
  public paymentMethodTypesList: Array<vwIdCodeName> = [];
  public selectedPaymentMethod: { id?: number; code?: string; name?: string };
  public trustErrMsg = '';
  public allTrustAccountList: Array<any> = [];
  public selectedTrust: string = null;
  states: Array<vwIdCodeName>;
  public primaryAddress: any;
  clientDetail: vwClient = {};
  public selectedECheck: any;
  public error_data = (errors as any).default;
  public creditCardList: vwCreditCard[] = [];
  public echeckList: vwECheck[] = [];
  public addECheck = false;
  public paymentMethod: string;
  public addCreditCard = false;
  public selectedCreditCard: any;
  public checkNumber: string;
  public reviewPayment = false;
  public step = 'postPayment';
  public postObject: any = {};
  successMsg = '';
  selectedCreditCardDetails: vwCreditCard;
  selectedECheckDetails: vwECheck;

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};

  public paymentCheckErrMsg = '';
  public paymentCheckUploadFile = false;
  public paymentCheckErr = false;
  public paymentCheck = false;
  closeResult: string;
  public modalReference: any;

  isLoading = false;
  errorMessage: string;
  fail_msg: string;
  officeDetails: any;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  sameDayACHStatus = false;
  isTimeBefore12PmCt = false;
  isCheckedSameDayACH = false;
  pollingTimeData: any;

  checkNumberMissing: string;
  accountType:any;

  loaderCallback = () => {
    this.isLoading = false;
  }

  printReceiptSub: Subscription;

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder,
    private billingService: BillingService,
    private route: ActivatedRoute,
    private router: Router,
    private matterService: MatterService,
    private clientService: ClientService,
    private miscService: MiscService,
    private toastDisplay: ToastDisplay,
    private personService: PersonService,
    private store: Store<fromRoot.AppState>,
    private trustAccountService: TrustAccountService,
    private officeService: OfficeService,
    private pagetitle: Title,
    private dmsService: DmsService,
    private sharedService: SharedService,
    public usioService: UsioService,
  ) {
    this.permissionList$ = this.store.select('permissions');
    router.events.subscribe(val => {
      if (val instanceof NavigationStart === true) {
        this.navigateAwayPressed = true;
      }
    });

    this.printReceiptSub = this.sharedService.printReceipt$.subscribe(() => {
      this.isLoading = false;
    });
  }

  async ngOnInit() {
    this.successMsg = this.error_data.payment_success;
    this.fail_msg = this.error_data.payment_to_trust_failed;

    this.matterId = +this.route.snapshot.queryParamMap.get('matterId') || null;
    if (!this.matterId) {
      this.toastDisplay.showError(this.error_data.select_matter_first);
      return this.router.navigate(['/matter/list']);
    }
    else{
      this.checkUsioTrustAccountType();
    }

    this.createForm();
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });

    this.getMatterDetails();
    this.getAchProcessingStatus();
    this.getTimeStatus();
    this.getTimeStatusOnInit();
  }

  getAchProcessingStatus(){
    this.usioService.v1UsioGetTenantAchSettingsGet$Response().subscribe(
      suc => {
        let res: any = suc;
        let resp = JSON.parse(res.body).results;
        this.sameDayACHStatus = resp;
      }, err => {
        console.log(err);
      }
    );
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

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }

    if (this.printReceiptSub) {
      this.printReceiptSub.unsubscribe();
    }

    if (this.pollingTimeData) {
      this.pollingTimeData.unsubscribe();
    }
  }

  /**** function to create form */
  createForm(): void {
    this.form = this.fb.group({
      payment_date: [new Date(), [Validators.required]],
      payment_target: ['primary'],
      payment_amount: [null, [Validators.required]],
      paymentMethod: []
    });
  }

  async checkUsioTrustAccountType(){
    try {
      this.isLoading = true;
      let resp: any = await this.usioService
        .v1UsioCheckUsioTrustAccountTypeGet$Response({ matterId: this.matterId })
        .toPromise();
      this.accountType = JSON.parse(resp.body).results;

    } catch (err) {
      this.isLoading = false;
    }
  }

  /*** function to get billing payment method */
  async getPaymentMethod(): Promise<any> {
    let resp: any = await this.billingService
      .v1BillingPaymentmethodtypesGet$Response({})
      .toPromise();
    resp = JSON.parse(resp.body as any).results;
    this.paymentMethodTypesList = resp || [];
    this.paymentMethodTypesList = this.paymentMethodTypesList.filter(
      a => a.code != 'CHARGEBACK'
    );
    this.paymentMethodTypesList = this.paymentMethodTypesList.filter(
      a => a.code != 'PRIMARY_RETAINER_TRUST'
    );
    this.paymentMethodTypesList = this.paymentMethodTypesList.filter(
      a => a.code != 'TRUST_TRANSFER'
    );
    this.form.controls['paymentMethod'].setValue('CASH');
    this.selectedPaymentMethod = this.paymentMethodTypesList.find(
      item => item.code === 'CASH'
    );

    this.paymentMethodTypesList = _.orderBy(
      this.paymentMethodTypesList,
      ['name'],
      ['asc']
    );
  }

  /**** function to get matter detail */
  async getMatterDetails(): Promise<any> {
    try {
      this.isLoading = true;
      let resp: any = await this.matterService
        .v1MatterMatterIdGet({ matterId: this.matterId })
        .toPromise();
      this.matterDetails = JSON.parse(resp as any).results;
      this.pagetitle.setTitle("Post Payment to Trust - " + this.matterDetails.matterName);
      this.checkPermission();
    } catch (err) {
      this.isLoading = false;
      this.router.navigate(['/matter/list']);
    }
  }

  /**** function to check permission to prevent direct page access */
  async checkPermission(): Promise<any> {
    let permission = false;
    let resp: any = await this.trustAccountService
      .v1TrustAccountGetTrustAccountStatusGet$Response()
      .toPromise();
    resp = JSON.parse(resp.body as any).results;
    if (resp) {
      if (this.permissionList) {
        permission =
          this.permissionList.BILLING_MANAGEMENTisAdmin ||
            this.permissionList.BILLING_MANAGEMENTisEdit
            ? true
            : false;
      }
      if (!permission) {
        permission = UtilsHelper.checkPermissionOfRepBingAtn(
          this.matterDetails
        );
      }
    }
    if (!permission) {
      this.toastDisplay.showPermissionError();
      this.isLoading = false;
    } else {
      this.getPaymentMethod();
      if(this.form.value.payment_target == 'trust')
      this.getAllTrustAccount();
      this.getStates();
      this.getPaymentMethods();
      this.getClientInfo();
      this.getOfficeAddress();
    }
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

  /******* function to get all trust only account */
  async getAllTrustAccount(): Promise<any> {
    let resp: any = await this.trustAccountService
      .v1TrustAccountGetAllTrustAccountsGet$Response({
        matterId: this.matterId
      })
      .toPromise();
    resp = JSON.parse(resp.body as any).results;
    this.allTrustAccountList = resp;

    this.allTrustAccountList.forEach(x => {
      if (x.trustNumber) {
        x.name = x.trustNumber + ' - ' + x.name;
      }
    });
  }

  /***** function to apply filter after date changed */
  applyFilter(): void {
    if (this.form.value && this.form.value.payment_date) {
      this.dateErrMsg = '';
      if (moment(this.form.value.payment_date).isAfter(moment(), 'day')) {
        this.dateErrMsg = 'Date of Payment cannot be in the future';
      } else {
        this.dataEntered = true;
      }
    } else {
      this.dateErrMsg = 'Select a Date of Payment';
    }
  }

  /**** function to review payment */
  review(value: any) {
    this.dateErrMsg = '';
    this.trustErrMsg = '';
    this.amountErrMsg = '';
    this.errorMessage = null;
    this.checkNumberMissing = null;

    let error = false;
    if (!this.selectedTrust && value.payment_target == 'trust') {
      this.trustErrMsg = 'Select a Payment Target';
    }
    if (!value.payment_date) {
      this.dateErrMsg = 'Select a Date of Payment';
      error = true;
    }
    if (value.payment_date) {
      if (moment(value.payment_date).isAfter(moment(), 'day')) {
        this.dateErrMsg = 'Date of Payment cannot be in the future';
        error = true;
      }
    }

    if (!parseFloat(value.payment_amount)) {
      this.amountErrMsg = 'Enter a positive Amount to Pay';
      error = true;
    }

    if (value.paymentMethod === 'CHECK' && !this.checkNumber) {
      this.checkNumberMissing = this.error_data.check_number_required;
      error = true;
    }

    if (value.paymentMethod === 'CHECK' && !!this.selectedFile) {
      if (this.selectedFile.size > 5000000) {
        return;
      }
    }

    if (value.paymentMethod === 'CHECK' && !!this.selectedFile) {
      if ((!this.selectedFile.type.match('.jpeg') && !this.selectedFile.type.match('.png'))) {
        return;
      }
    }

    if (value.paymentMethod === 'CREDIT_CARD' && !this.selectedCreditCard) {
      return this.toastDisplay.showError(this.error_data.credit_card_required);
    }

    if (value.paymentMethod === 'CREDIT_CARD' && this.selectedCreditCard) {
      this.selectedCreditCardDetails = this.creditCardList.find(
        item => item.id === this.selectedCreditCard
      );
    }

    if (value.paymentMethod === 'E-CHECK' && !this.selectedECheck) {
      return this.toastDisplay.showError(this.error_data.e_check_required);
    }

    if (value.paymentMethod === 'E-CHECK' && this.selectedECheck) {
      this.selectedECheckDetails = this.echeckList.find(
        item => item.id === this.selectedECheck
      );
    }

    if (value.payment_target == 'trust') {
      this.form.value['trust_account_name'] = this.selectedTrust;
    }

    switch (value.paymentMethod) {
      case 'CREDIT_CARD':
        this.form.value['card_details'] = this.selectedCreditCard;
        break;
      case 'CHECK':
        this.form.value['check_details'] = this.checkNumber;
        break;
      case 'E-CHECK':
        this.form.value['e_check_detials'] = this.selectedECheck;
        break;
      default:
    }

    if (error) return;

    if (this.form.valid) {
      this.postObject = {
        amountToPay: +this.form.value.payment_amount,
        clientId: +this.clientDetail.id,
        creditCardId: null,
        eCheckId: null,
        initialConsultation: false,
        method: this.selectedPaymentMethod.id,
        methodType: this.selectedPaymentMethod.name,
        postingDate: new Date(),
        remainingBalDueDate: null,
        invoiceEmail: null,
        targetAccount: 'Trust',
        checkNumber: this.checkNumber ? this.checkNumber : null,
        routingNumber: this.selectedECheckDetails
          ? this.selectedECheckDetails.routingNumber
          : null,
        accountNumber: this.selectedECheckDetails
          ? this.selectedECheckDetails.accountNumber
          : null,
        paymentDetails: {
          billingAddress: this.officeDetails && this.officeDetails.address ? this.officeDetails.address : null
        }
      };
      this.step = 'reviewPayment';
    }
  }

  /***** function to trigger when payment method change */
  public selectPaymentMethod(event) {
    this.isCheckedSameDayACH = false;
    this.dataEntered = true;
    this.selectedCreditCard = null;
    this.checkNumber = null;
    this.selectedECheck = null;
    const value = event && event.code ? event.code : 'CASH';
    this.selectedPaymentMethod = this.paymentMethodTypesList.find(
      item => item.code === value
    );
  }

  /**** function to trigger when select/diselect trust */
  trustChange(event) {
    if (event) {
      this.dataEntered = true;
      this.trustErrMsg = '';
    }
  }

  paymentTargetChange(type: string) {
    this.dataEntered = true;
    switch (type) {
      case 'primary':
        this.trustErrMsg = '';
        this.selectedTrust = null;
        break;
      case 'trust':
        this.getAllTrustAccount();
        break;
    }
  }

  PostPayment() {
    this.dataEntered = false;
    let body = {
      clientId: this.matterDetails.clientName.id,
      matterId: this.matterDetails.id,
      method: this.selectedPaymentMethod.id,
      matterTrustOnlyAccountId:
        this.form.value.payment_target == 'trust'
          ? this.form.value.trust_account_name
          : 0,
      isPrimaryRetainerTrust:
        this.form.value.payment_target == 'primary' ? true : false,
      amountToPay: +this.form.value.payment_amount,
      checkNumber:
        this.form.value.paymentMethod == 'CHECK'
          ? this.form.value.check_details
          : null,
      creditCardId:
        this.form.value.paymentMethod == 'CREDIT_CARD'
          ? +this.form.value.card_details
          : 0,
      eCheckId:
        this.form.value.paymentMethod == 'E-CHECK'
          ? this.form.value.e_check_detials
          : 0,
      sameDayACH:
      this.form.value.paymentMethod == 'E-CHECK'
      ? this.isCheckedSameDayACH.toString() : null,
      postingDate:
        moment(this.form.value.payment_date).format('YYYY-MM-DD') + 'T00:00:00'
    };

    if (this.form.value.paymentMethod === 'CREDIT_CARD') {
      this.postObject.paymentDetails = {
        name: this.selectedCreditCardDetails.companyName
          ? this.selectedCreditCardDetails.companyName
          : this.selectedCreditCardDetails.lastName +
          ', ' +
          this.selectedCreditCardDetails.firstName,
        billingAddress: this.officeDetails.address
      };

      this.postObject.cardNumber = this.selectedCreditCardDetails.cardNumber;
    }

    if (this.form.value.paymentMethod === 'E-CHECK') {
      this.postObject.paymentDetails = {
        name:
          this.selectedECheckDetails.lastName +
          ', ' +
          this.selectedECheckDetails.firstName,
        routingNumber: this.selectedECheckDetails.routingNumber,
        accountNumber: String(this.selectedECheckDetails.accountNumber),
        billingAddress: this.officeDetails.address
      };
    }

    this.isLoading = true;

    this.loaderCallback = () => {
      this.isLoading = false;
      this.step = 'confirmPayment';
    };
    if (this.selectedFile) {
      this.dmsFileUpload(body);
    } else {
      this.postPaymentMethod(body);
    }
  }

  dmsFileUpload(body) {
    const fileBody: any = {
      file: this.selectedFile
    };
    let params = {
      body: fileBody
    }
    this.dmsService.v1DmsCheckImageFileUploadPost(params)
      .subscribe(
        (res: any) => {
          res = JSON.parse(res).results;
          body['ScannedCheckImgUrl'] = res;
          this.postPaymentMethod(body);
        },
        err => {
          this.isLoading = false;
        }
      );
  }
  postPaymentMethod(body) {
    this.billingService
      .v1BillingPostPaymentForTrustPost$Json({ body })
      .subscribe(
        (res: any) => {
          res = JSON.parse(res).results;
          if (res) {
            this.postObject.paymentId = res.paymentId;
            this.postObject.authCode = res.confirmationNumber;
            this.postObject.postingDate = res.postingDate;
          }
        },
        err => {
          if (err && err.error) {
            let res = err.error.split(':');
            if (err.error.split(':').length > 1) {
              this.errorMessage = err.error.split(':')[1];
            } else if (err.error.split(';').length > 1) {
              this.errorMessage = err.error.split(';')[1]
                ? err.error.split(';')[1]
                : err.error.split(';')[0];
            }
          }
          this.isLoading = false;
        }
      );
  }
  public printReceipt() {
    if (this.receiptPdf) {
      this.isLoading = true;
      this.receiptPdf.printPdf();
    }
  }

  public saveCreditCard(res: any) {
    let creditCard = res.creditCardInfo;
    let address = res.address;
    creditCard.person = {
      id: this.clientDetail.id
    };

    this.isLoading = true;

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
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.isLoading = false;
        })
      )
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
                this.getPaymentMethods(true);
              }
            );
          } else {
            this.toastDisplay.showError(this.error_data.error_occured);
          }
        },
        () => { }
      );
  }

  getStates(): void {
    this.miscService.v1MiscStatesGet$Response({}).subscribe(
      (res: any) => {
        this.states = JSON.parse(res.body).results;
      },
      err => { }
    );
  }

  chkNumber(event, allowDecimal = false) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    let allow = (k >= 48 && k <= 57) || k == 8 || k == 9;
    if (allowDecimal) {
      return allow || k == 46;
    } else {
      return allow;
    }
  }

  chkCheckNumber(){
    if(this.checkNumber) {
      this.checkNumberMissing = '';
    } else {
      this.checkNumberMissing = this.error_data.check_number_required;
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
            obj => obj.addressTypeName.toLowerCase() === 'primary'
          );

          if (!this.primaryAddress) {
            this.primaryAddress = {};
          }
        }
      });
  }
  public saveEcheck(res: any) {
    let echeck = res.echeckInfo;
    let address = res.address;
    echeck.person = {
      id: this.clientDetail.id
    };

    this.isLoading = true;

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
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.isLoading = false;
        })
      )
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
                this.getPaymentMethods(true);
              }
            );
          } else {
            this.toastDisplay.showError(this.error_data.error_occured);
          }
        },
        () => { }
      );
  }

  public getPaymentMethods(detail?: boolean) {
    if (this.matterId) {
      this.matterService
        .v1MatterPaymentMethodsbymatterMatterIdGet({
          matterId: this.matterId
        })
        .pipe(
          map(UtilsHelper.mapData),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe(res => {
          if (res) {
            this.creditCardList = res.creditCards;
            this.echeckList = res.eChecks;

            if (
              detail &&
              this.paymentMethod === 'CREDIT_CARD' &&
              this.selectedCreditCard
            ) {
              this.selectedCreditCardDetails = this.creditCardList.find(
                item => item.id === this.selectedCreditCard
              );
            }

            if (
              detail &&
              this.paymentMethod === 'E-CHECK' &&
              this.selectedECheck
            ) {
              this.selectedECheckDetails = this.echeckList.find(
                item => item.id === this.selectedECheck
              );
            }
          }
        });
    }
  }

  private addMatterPaymentMethod(
    paymentMethodId: number,
    isAutopay: boolean,
    suspendAutoPay: boolean,
    onSuccess = () => { }
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
        () => { }
      );
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
        finalize(() => { })
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
        () => { }
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
        finalize(() => { })
      )
      .subscribe(
        response => {
          if (response > 0) {
            this.getClientInfo();
          }
        },
        () => { }
      );
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = true;
  }

  selectFile() {
    this.paymentCheckImageInput.nativeElement.click();
  }

  uploadFile(files: File[]) {
    let file = files[0];
    this.selectedFile = file;
    this.paymentCheckErr = false;
    this.paymentCheck = true;
    this.paymentCheckUploadFile = true;
    if (!file.type.match('.jpeg') && !file.type.match('.png')) {
      this.paymentCheckUploadFile = false;
      this.paymentCheckImageInput.nativeElement.value = null;
      this.paymentCheckErrMsg = this.error_data.payment_check_Image_format_error;
      this.paymentCheckErr = true;
      this.paymentCheck = true;
      return
    }
    else if (file.size > 5000000) {
      this.paymentCheckImageInput.nativeElement.value = null;
      this.paymentCheckUploadFile = false;
      this.paymentCheckErr = true;
      this.paymentCheckErrMsg = this.error_data.payment_check_Image_File_Size;
      this.paymentCheck = true;
      return
    }
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.paymentCheckFileContent = reader.result as string;
    };
    reader.onerror = function (error) {
      console.log('Error: ', error);
    };
  }

  onPaymentClose() {
    this.paymentCheck = false;
    this.paymentCheckUploadFile = false;
    this.selectedFile = null;
    this.paymentCheckFileContent = '';
  }
  validateAmount() {
    this.amountErrMsg = '';
    if (!parseFloat(this.form.value.payment_amount)) {
      this.amountErrMsg = 'Enter a positive Amount to pay';
    }
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
  focusoutOfAmount() {
    if (this.form.value.payment_amount) {
      this.form.get('payment_amount').setValue((+this.form.value.payment_amount).toFixed(2));
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
