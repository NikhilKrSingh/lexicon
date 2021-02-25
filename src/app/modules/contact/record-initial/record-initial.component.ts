import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { forkJoin, interval } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service.js';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import * as Constant from 'src/app/modules/shared/const';
import { PostPaymentService } from 'src/app/service/post-payment.service.js';
import { SelectService } from 'src/app/service/select.service';
import {
  vwClient,
  vwConsultationInvoice,
  vwCreditCard,
  vwECheck,
  vwRate,
  vwRecordInitialConsultation
} from 'src/common/swagger-providers/models';
import {
  BillingService,
  ClientService,
  ContactsService,
  DmsService,
  MiscService,
  PersonService,
  TenantService,
  UsioService
} from 'src/common/swagger-providers/services';
import { IPRofile, Page } from '../../models';
import { REGEX_DATA } from '../../shared/const.js';
import * as errors from '../../shared/error.json';
import { CommonReceiptPdfComponent } from '../../shared/receipt-pdf/receipt-pdf.component';
import { UtilsHelper } from '../../shared/utils.helper.js';

@Component({
  selector: 'app-record-initial',
  templateUrl: './record-initial.component.html',
  styleUrls: ['./record-initial.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class RecordInitialComponent
  implements OnInit, IBackButtonGuard, OnDestroy, AfterViewInit {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild(CommonReceiptPdfComponent, { static: false })  receiptPdf: CommonReceiptPdfComponent;
  public payment = 'fullamount';
  public pageMode = 'record';
  public postPaymentbtn = 'Post Payment';
  public clientId: number;
  public state: string;
  public firmDetails: Tenant;
  public clientDetail: vwClient;
  public rateList: Array<vwRate>;
  public selectedRate: vwRate;
  public selectedRateId: number;
  public decision: string;
  public amountDue = '0';
  public cardType: string;
  public durationOfConsultation: string;
  public decisionArr: Array<{ key: string; value: string }> = [
    { key: 'decided_to_retain', value: 'Decided to retain' },
    { key: 'decided_not_to_retain', value: 'Decided not to retain' },
    { key: 'has_not_yet_decided', value: 'Has not yet decided' }
  ];
  public enterAmount = '0';
  public waiveRemainingAmount = 'No';
  public dueDate: string;
  public dueDateForRemainingBalance;
  public routingNumber: string;
  public accountNumber: string;
  public echeckFname: string;
  public echeckLname: string;
  public initialConsultationDate: string;
  public amountRemaining = '0';
  public amountOld = 0;
  public invoiceEmail: string;
  public invoiceType = 'print';
  public paymentMethodTypesList: Array<{
    id?: number;
    code?: string;
    name?: string;
  }> = [];
  public paymentMethod: string = null;
  public selectedPaymentMethod: { id?: number; code?: string; name?: string };
  public checkNumber: string;
  public paymentForm: FormGroup;
  public errorData: any = (errors as any).default;
  public addressForm: FormGroup;
  public addressECheckForm: FormGroup;
  public emailform: FormGroup;
  public stateList: Array<any> = [];
  public postObject: any;
  public paymentDetails: any;
  public clientDetails: any;
  public userDetails: IPRofile;
  public todayDate: any;
  public emailError: string = null;
  public displayPostingDate: string;
  public displayRemainingBalDueDate: string;
  public durationConsultationNumeric: number;
  public hours: number;
  public minutes: number;
  public invoiceId = 0;
  public isPersonal = 'personal';
  public displayMessage = false;
  public message = 'Insufficient Funds';
  public success_msg: string;
  public fail_msg: string;
  public loading: boolean;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pangeSelected = 1;
  public counter = Array;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public officeId: number = null;
  public selectedOperatingAccount: any = null;
  public operatingAccountError: boolean = false;

  @ViewChild('recordInitialCheckImageInput', { static: false })  public recordInitialCheckImageInput: ElementRef<HTMLInputElement>;

  selectedFile: File;
  recordInitialCheckFileContent: string;
  public recordInitialCheckUploadFile = false;
  public recordInitialCheckErrMsg = '';
  public recordInitialCheckErr = false;
  public recordInitialCheck = false;
  closeResult: string;
  public modalReference: any;

  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  public paymentPermission: any = null;
  public isAchDisabled: any = null;
  public isCreditCardDisabled: any = null;
  public operatingAccount: any = null;
  sameDayACHStatus = false;
  isTimeBefore12PmCt = false;
  isCheckedSameDayACH = false;
  pollingTimeData: any;

  constructor(
    private modalService: NgbModal,
    private dmsService: DmsService,
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService,
    private billingService: BillingService,
    private builder: FormBuilder,
    private toastDisplay: ToastDisplay,
    private personService: PersonService,
    private miscServcice: MiscService,
    private contactService: ContactsService,
    private tenantService: TenantService,
    private postPaymentService: PostPaymentService,
    private selectService: SelectService,
    private pagetitle: Title,
    private appConfigService: AppConfigService,
    private usioService: UsioService
  ) {
    router.events.subscribe(val => {
      if (val instanceof NavigationStart) {
        this.navigateAwayPressed = true;
      }
    });
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    this.success_msg = this.errorData.payment_success;
    this.fail_msg = this.errorData.payment_failed;
    const date = new Date();
    this.todayDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    this.userDetails = JSON.parse(localStorage.getItem('profile'));
    this.paymentForm = this.builder.group({
      cardNumber: ['', [Validators.required]],
      expirationDate: ['', Validators.required],
      CVV: [null, Validators.required],
      id: 0,
      autoPay: false,
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      companyName: ['', Validators.required],
      isSameAsPrimary: true
    });
    this.addressForm = this.builder.group({
      address1: ['', Validators.required],
      address2: [''],
      state: [null, Validators.required],
      city: [null, Validators.required],
      zip: [null, Validators.required],
      addressTypeId: [2],
      addressTypeName: ['billing']
    });
    this.addressECheckForm = this.builder.group({
      address1: ['', Validators.required],
      address2: [''],
      state: [null, Validators.required],
      city: [null, Validators.required],
      zipCode: [null, Validators.required],
      addressTypeId: [2],
      addressTypeName: ['billing']
    });
    this.emailform = this.builder.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(REGEX_DATA.Email)
        ]
      ]
    });
    this.route.queryParams.subscribe(params => {
      this.clientId = params.clientId;
      this.state = params.state;
      if (!this.clientId) {
        this.router.navigate(['/contact/potential-client']);
      } else {
        this.getList();
      }
    });
    this.getStates();
    this.getAchProcessingStatus();
    this.getTimeStatus();
    this.getTimeStatusOnInit();
    this.selectService.newSelection$.forEach(event => {
      if (event) {
        this.dataEntered = true;
      }
    });
    this.enterAmount = (+this.enterAmount).toFixed(2);
    this.amountDue = (+this.amountDue).toFixed(2);
    this.amountRemaining = (+this.amountRemaining).toFixed(2);
  }

  ngOnDestroy() {
    if (this.pollingTimeData) {
      this.pollingTimeData.unsubscribe();
    }
  }

  getAchProcessingStatus() {
    this.usioService.v1UsioGetTenantAchSettingsGet$Response().subscribe(
      suc => {
        let res: any = suc;
        let resp = JSON.parse(res.body).results;
        this.sameDayACHStatus = resp;
      },
      err => {
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
            if (!this.isTimeBefore12PmCt && this.isCheckedSameDayACH) {
              this.isCheckedSameDayACH = false;
            }
          },
          err => {
            console.log(err);
          }
        );
    } catch (ex) {
      console.log(ex);
    }
  }

  getTimeStatusOnInit() {
    this.usioService.v1UsioCheckCtTimeGet$Response().subscribe(
      suc => {
        let res: any = suc;
        let resp = JSON.parse(res.body).results;
        this.isTimeBefore12PmCt = resp;
      },
      err => {
        console.log(err);
      }
    );
  }

  getTime() {
    return this.usioService.v1UsioCheckCtTimeGet$Response({});
  }

  ngAfterViewInit() {
    this.getUsioPaymentMethodPermission();
  }
  public updateForm() {
    if (this.isPersonal === 'personal') {
      this.paymentForm.controls.companyName.clearValidators();
      this.paymentForm.controls.lastName.setValidators([Validators.required]);
      this.paymentForm.controls.firstName.setValidators([Validators.required]);
    } else {
      this.paymentForm.controls.companyName.setValidators([
        Validators.required
      ]);
      this.paymentForm.controls.lastName.clearValidators();
      this.paymentForm.controls.firstName.clearValidators();
    }
  }

  /**
   * Get client detail and rate table list
   */
  private getList() {
    this.loading = true;
    forkJoin([
      this.clientService.v1ClientClientIdGet({ clientId: this.clientId }),
      this.billingService.v1BillingRateTenantTenantIdGet({
        tenantId: this.userDetails.tenantId
      }),
      this.billingService.v1BillingPaymentmethodtypesGet$Response({})
    ])
      .pipe(
        map(
          res => {
            this.loading = false;
            return {
              clientDetail: JSON.parse(res[0] as any).results as vwClient,
              rateList: JSON.parse(res[1] as any).results as Array<vwRate>,
              paymentMethodTypes: JSON.parse(res[2].body as any).results
            };
          },
          () => {
            this.loading = false;
          }
        ),
        finalize(() => {})
      )
      .subscribe(
        suc => {
          this.clientDetail = suc.clientDetail;
          if (!!this.clientDetail.initialConsultDate) {
            this.initialConsultationDate = this.clientDetail.initialConsultDate;
          }
          if (this.clientDetail.isCompany) {
            this.pagetitle.setTitle(this.clientDetail.companyName);
          } else {
            this.pagetitle.setTitle(
              this.clientDetail.firstName + ' ' + this.clientDetail.lastName
            );
          }
          this.invoiceEmail = this.clientDetail.email;
          const originRateList = suc.rateList;
          if (originRateList && originRateList.length > 0) {
            this.rateList = originRateList.filter(
              obj =>
                obj.billingTo.code === 'POTENTIAL_CLIENT' ||
                obj.billingTo.code === 'BOTH'
            );
          }
          this.officeId =
            this.clientDetail &&
            this.clientDetail.consultationLawOffice &&
            this.clientDetail.consultationLawOffice.id
              ? +this.clientDetail.consultationLawOffice.id
              : null;
          this.updateDatatableFooterPage();
          this.paymentMethodTypesList = suc.paymentMethodTypes || [];
          this.paymentMethodTypesList = this.paymentMethodTypesList.filter(a =>
            this.appConfigService.valid_payment_methods.some(x => x == a.code)
          );
          this.paymentMethod = 'CASH';
          this.selectedPaymentMethod = this.paymentMethodTypesList.find(
            item => item.code === this.paymentMethod
          );
          this.loading = false;
        },
        () => {
          this.loading = false;
        }
      );
  }

  /**
   * select rate____-____-____-____
   * @param rate
   */
  public selectRate(rate) {
    this.dataEntered = true;
    this.selectedRate = rate;
    this.selectedRateId = rate.id;
    if (
      this.selectedRate &&
      this.selectedRate.billingType &&
      this.selectedRate.billingType.code === 'FIXED'
    ) {
      this.amountDue = this.selectedRate.rateAmount.toFixed(2);
    }
    this.enterAmount = this.amountDue;
  }

  /**
   * Handle enter hourse duration
   */
  public enterHours() {
    this.amountDue = (
      this.durationConsultationNumeric * +this.selectedRate.rateAmount
    ).toFixed(2);
    this.enterAmount = this.amountDue;
  }

  public formatTime() {
    if (this.durationOfConsultation) {
      this.durationOfConsultation =
        this.durationOfConsultation && this.durationOfConsultation[0] === '.'
          ? '0' + this.durationOfConsultation
          : this.durationOfConsultation;
      this.tenantService
        .v1TenantFormattimeTimeGet({
          time: this.durationOfConsultation.toString()
        })
        .subscribe(s => {
          const res: any = s;
          this.durationOfConsultation = JSON.parse(res).results;
        });

      this.tenantService
        .v1TenantFormattimeNumericTimeGet$Response({
          time: this.durationOfConsultation.toString()
        })
        .subscribe(s => {
          const res: any = s.body;
          this.durationConsultationNumeric = +JSON.parse(res).results;
          this.enterHours();
        });
    }
  }

  /**
   * Handle eneter amount event
   */
  public enterAmountFn() {
    if (+this.amountDue >= +this.enterAmount) {
      this.amountRemaining = (+this.amountDue - +this.enterAmount).toFixed(2);
      this.amountOld = +this.enterAmount;
    } else {
      setTimeout(() => {
        this.enterAmount = this.amountOld.toFixed(2);
        this.amountRemaining = (+this.amountDue - +this.enterAmount).toFixed(2);
      }, 50);
    }
    // setTimeout(() => {
    //   this.enterAmount = (+this.enterAmount).toFixed(2);
    // }, 1500);
  }

  public selectPaymentMethod() {
    this.isCheckedSameDayACH = false;
    this.selectedOperatingAccount = null;
    this.dataEntered = true;
    // Reset forms
    this.addressForm.reset();
    this.addressECheckForm.reset();
    this.paymentForm.reset();
    this.checkNumber = '';
    this.echeckFname = '';
    this.echeckLname = '';
    this.routingNumber = '';
    this.accountNumber = '';
    this.selectedPaymentMethod = this.paymentMethodTypesList.find(
      item => item.code === this.paymentMethod
    );
  }

  /**
   * only allow number
   * @param event
   */
  chkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k == 8 || k == 9;
  }

  public reviewPayment() {
    this.displayMessage = false;
    if (!this.initialConsultationDate) {
      this.toastDisplay.showError(this.errorData.initial_const_date_required);
      return;
    }
    if (!this.selectedRate) {
      this.toastDisplay.showError(this.errorData.charge_code_required);
      return;
    }
    if (this.selectedRate && this.selectedRate.billingType.code === 'HOURLY') {
      if (!this.durationOfConsultation) {
        this.toastDisplay.showError(
          this.errorData.duration_of_consultation_required
        );
        return;
      }
    }
    if (this.payment === 'otheramount') {
      if (!this.enterAmount || +this.enterAmount < 0) {
        this.toastDisplay.showError(this.errorData.other_amount_required);
        return;
      }
    } else {
      if (!this.amountDue || +this.amountDue == 0) {
        this.toastDisplay.showError(this.errorData.amount_due_required);
        return;
      }
    }

    if (!this.decision) {
      this.toastDisplay.showError(this.errorData.decision_required);
      return;
    }
    if (
      this.payment === 'otheramount' &&
      this.waiveRemainingAmount === 'No' &&
      !this.dueDateForRemainingBalance
    ) {
      this.toastDisplay.showError(
        this.errorData.due_date_remaining_balance_required
      );
      return;
    }
    if (this.paymentMethod === 'CHECK' && !this.checkNumber) {
      this.toastDisplay.showError(this.errorData.check_number_required);
      return;
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
    if (this.paymentMethod === 'E-CHECK' && !this.routingNumber) {
      this.toastDisplay.showError(this.errorData.routing_number_required);
      return;
    }
    if (
      this.paymentMethod === 'E-CHECK' &&
      this.routingNumber &&
      this.routingNumber.length < 9
    ) {
      this.toastDisplay.showError(this.errorData.valid_routing_number_required);
      return;
    }
    if (this.paymentMethod === 'E-CHECK' && !this.accountNumber) {
      this.toastDisplay.showError(this.errorData.account_number_required);
      return;
    }
    if (
      this.paymentMethod === 'E-CHECK' &&
      this.accountNumber &&
      this.accountNumber.length < 12
    ) {
      this.toastDisplay.showError(this.errorData.valid_account_number_required);
      return;
    }
    if (this.paymentMethod === 'E-CHECK' && !this.echeckFname) {
      this.toastDisplay.showError(this.errorData.echeck_first_name_error);
      return;
    }
    if (this.paymentMethod === 'E-CHECK' && !this.echeckLname) {
      this.toastDisplay.showError(this.errorData.echeck_last_name_error);
      return;
    }
    if (this.paymentMethod === 'CREDIT_CARD' && !this.addressForm.valid) {
      this.toastDisplay.showError(this.errorData.billing_address_required);
      return;
    }
    if (this.paymentMethod === 'E-CHECK' && !this.addressECheckForm.valid) {
      this.toastDisplay.showError(this.errorData.billing_address_required);
      return;
    }
    if (this.paymentMethod === 'CREDIT_CARD') {
      if (
        this.paymentForm.value.cardNumber.match(
          /^3[47]\d{1,2}(| |-)\d{6}\1\d{6}$/
        ) ||
        this.paymentForm.value.cardNumber.match(
          /^6(?:011|5\d\d)(| |-)(?:\d{4}\1){2}\d{4}$/
        ) ||
        this.paymentForm.value.cardNumber.match(
          /^5[1-5]\d{2}(| |-)(?:\d{4}\1){2}\d{4}$/
        ) ||
        this.paymentForm.value.cardNumber.match(
          /^4\d{3}(| |-)(?:\d{4}\1){2}\d{4}$/
        )
      ) {
        if (
          this.paymentForm.value.cardNumber.match(
            /^3[47]\d{1,2}(| |-)\d{6}\1\d{6}$/
          )
        ) {
          this.cardType = 'American Express';
        } else if (
          this.paymentForm.value.cardNumber.match(
            /^6(?:011|5\d\d)(| |-)(?:\d{4}\1){2}\d{4}$/
          )
        ) {
          this.cardType = 'Discover';
        } else if (
          this.paymentForm.value.cardNumber.match(
            /^5[1-5]\d{2}(| |-)(?:\d{4}\1){2}\d{4}$/
          )
        ) {
          this.cardType = 'Master Card';
        } else if (
          this.paymentForm.value.cardNumber.match(
            /^4\d{3}(| |-)(?:\d{4}\1){2}\d{4}$/
          )
        ) {
          this.cardType = 'Visa';
        } else {
          this.cardType = null;
        }
      } else {
        this.toastDisplay.showError(this.errorData.credit_card_notvalid);
        return;
      }
      let month;
      let year;
      if (this.paymentForm.value.expirationDate) {
        month = this.paymentForm.value.expirationDate.slice(0, 2);
        year = this.paymentForm.value.expirationDate.slice(-4);

        if (
          month > 12 ||
          year <
            new Date()
              .getFullYear()
              .toString()
              .slice(-4) ||
          this.paymentForm.value.expirationDate.length < 5
        ) {
          this.toastDisplay.showError(
            this.errorData.credit_card_expiry_date_invalid
          );
          return false;
        }
      } else {
        this.toastDisplay.showError(
          this.errorData.credit_card_expiry_date_invalid
        );
        return false;
      }
    }

    if (
      this.invoiceType === 'email' &&
      !UtilsHelper.validateEmail(this.invoiceEmail)
    ) {
      this.toastDisplay.showError(this.errorData.email_not_valid);
      return;
    }
    if (
      (this.paymentMethod == 'CREDIT_CARD' ||
        this.paymentMethod == 'E-CHECK' ||
        this.paymentMethod == 'CASH' ||
        this.paymentMethod == 'CHECK' ||
        this.paymentMethod == 'PRIMARY_RETAINER_TRUST') &&
      this.selectedOperatingAccount == null &&
        (this.paymentMethod == 'CREDIT_CARD' || this.paymentMethod == 'E-CHECK')
    ) {
      this.operatingAccountError = true;
      return;
    }
    let methodId: any = this.paymentMethodTypesList.filter(
      item => item.code == this.paymentMethod
    );
    methodId = methodId[0];
    this.displayPostingDate = moment(new Date()).format('MM/DD/YYYY');
    this.displayRemainingBalDueDate = moment(
      this.dueDateForRemainingBalance
    ).format('MM/DD/YYYY');
    this.postObject = {
      amountToPay: +this.amountDue,
      clientId: +this.clientId,
      creditCardId: null,
      eCheckId: null,
      initialConsultation: !!this.initialConsultationDate,
      method: methodId.id,
      methodType: methodId.name,
      initialConsultationDate: this.initialConsultationDate,
      postingDate: this.initialConsultationDate,
      amountRemaining: this.amountRemaining
        ? parseInt(this.amountRemaining, 2)
        : null,
      description: 'Inital Consultation',
      remainingBalDueDate: this.dueDateForRemainingBalance,
      invoiceEmail: null,
      cardexpiryDate: this.paymentForm.value.expirationDate
        ? this.paymentForm.value.expirationDate
        : null,
      cardNumber: this.paymentForm.value.cardNumber
        ? this.paymentForm.value.cardNumber.substr(12, 4)
        : null,
      checkNumber: this.checkNumber ? this.checkNumber : null,
      routingNumber: this.routingNumber ? this.routingNumber : null,
      accountNumber: this.accountNumber ? this.accountNumber : null
    };
    if (this.payment == 'otheramount') {
      this.postObject.amountToPay = this.enterAmount;
      this.postObject.invoiceEmail =
        this.invoiceType == 'email' ? this.invoiceEmail : null;
    }

    if (this.payment == 'otheramount' && this.waiveRemainingAmount == 'No') {
      if (this.invoiceType == 'email') {
        this.postPaymentbtn = 'Post Payment & Send Invoice';
      } else {
        this.postPaymentbtn = 'Post Payment & Print Invoice';
      }
    } else {
      this.postPaymentbtn = ' Post Payment';
    }

    if (this.paymentMethod === 'CREDIT_CARD') {
      this.postObject.paymentDetails = {
        name:
          this.paymentForm.value.firstName +
          ' ' +
          this.paymentForm.value.lastName,
        billingAddress: this.addressForm.value
      };
    }

    if (this.paymentMethod === 'E-CHECK') {
      this.postObject.paymentDetails = {
        name: this.echeckFname + ' ' + this.echeckLname,
        routingNumber: this.routingNumber,
        accountNumber: this.accountNumber,
        billingAddress: this.addressECheckForm.value
      };
    }

    this.postObject.waiveRemainingAmount = this.waiveRemainingAmount;
    this.postObject.isFullPayment = this.payment !== 'otheramount';
    this.pageMode = 'review';
    if (this.pageMode == 'review') {
      this.dataEntered = true;
    }
    this.operatingAccountError = false;
  }

  public addPayment() {
    this.dataEntered = false;
    this.loading = true;
    this.addInitalConsultationRecord(initialConsultationId => {
      if (
        this.payment === 'otheramount' &&
        this.waiveRemainingAmount !== 'Yes'
      ) {
        this.generateInvoice(initialConsultationId);
      } else {
        if (this.paymentMethod == 'CREDIT_CARD') {
          this.createAddress();
        } else if (this.paymentMethod == 'E-CHECK') {
          this.createAddressECheck();
        } else {
          this.postPayment();
        }
      }
    });
  }

  private generateInvoice(initialConsultationId: number) {
    const test = { ...this.postObject };
    const data = {
      clientId: test.clientId,
      due: test.remainingBalDueDate,
      invoicePreference: this.invoiceType === 'print' ? 22 : 23,
      totalInvoiced: +this.amountDue,
      totalPaid: +this.enterAmount,
      initialConsultId: initialConsultationId
    } as vwConsultationInvoice;

    this.billingService
      .v1BillingGenerateRemainingInvoicePost$Json({ body: data })
      .subscribe(
        suc => {
          const res: any = suc;
          const list = JSON.parse(res).results;
          this.invoiceId = +list;
          if (this.paymentMethod == 'CREDIT_CARD') {
            this.createAddress();
          } else if (this.paymentMethod == 'E-CHECK') {
            this.createAddressECheck();
          } else {
            this.postPayment();
          }
        },
        err => {
          console.log(err);
        }
      );
  }

  /**
   *
   * @param creditCard
   * Function to save credit card and return id
   */
  private saveCreditCard(creditCard: vwCreditCard, addressId: number) {
    creditCard.id = 0;

    creditCard.person = {
      id: +this.clientId,
      name: null
    };

    if (this.isPersonal === 'company') {
      creditCard.isCompany = true;
    }

    creditCard.addressId = addressId;
    creditCard.isSameAsPrimary = false;

    this.billingService
      .v1BillingPaymentMethodPost$Json({
        body: creditCard
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res > 0) {
            this.toastDisplay.showSuccess(
              this.errorData.add_credit_card_success
            );
            this.postObject.creditCardId = res;
          } else {
            this.toastDisplay.showError(this.errorData.error_occured);
          }
          this.postPayment();
        },
        () => {}
      );
  }

  /**
   *
   * @param res
   * Functon to create address for the credit card
   * @param onSuccess
   */
  private createAddress() {
    if (this.addressForm.valid) {
      const address = { ...this.addressForm.value };
      address.zipCode = address.zip;
      address.personId = +this.clientId;

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
              this.saveCreditCard(this.paymentForm.value, response);
            } else {
              this.toastDisplay.showError(this.errorData.address_update_error);
            }
          },
          () => {}
        );
    }
  }

  private createAddressECheck() {
    if (this.addressECheckForm.valid) {
      const address = { ...this.addressECheckForm.value };
      address.zipCode = address.zip;
      address.personId = +this.clientId;

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
              this.addEcheck(response);
            } else {
              this.toastDisplay.showError(this.errorData.address_update_error);
            }
          },
          () => {}
        );
    }
  }

  /**
   *
   * Function to add ECHECK
   */
  public addEcheck(addressId: number) {
    const echeck = {
      person: {
        id: +this.clientId
      },
      firstName: this.echeckFname,
      lastName: this.echeckLname,
      accountNumber: this.accountNumber,
      routingNumber: this.routingNumber,
      addressId,
      autoPay: false
    } as vwECheck;

    this.billingService
      .v1BillingEcheckPost$Json({
        body: echeck
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res > 0) {
            this.toastDisplay.showSuccess(this.errorData.add_echeck_success);
            this.postObject.eCheckId = res;
          } else {
            this.toastDisplay.showError(this.errorData.error_occured);
          }
          this.postPayment();
        },
        () => {}
      );
  }

  /**
   *
   * Function to gtet the states for credit card
   */
  public getStates() {
    this.miscServcice.v1MiscStatesGet$Response().subscribe(
      res => {
        this.stateList = JSON.parse(res.body as any).results;
      },
      () => {}
    );
  }

  public chkString(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 65 && k <= 90) || k >= 97 || k <= 122;
  }

  /**
   *
   * Function to post the added payment
   */
  public postPayment() {
    this.loading = true;
    const data = { ...this.postObject };
    if (data.amountRemaining) {
      data.invoicePayment = data.amountRemaining;
    }
    delete data.amountRemaining;
    delete data.description;
    delete data.remainingBalDueDate;
    delete data.invoiceEmail;
    delete data.cardexpiryDate;
    delete data.cardNumber;
    delete data.methodType;
    if (!data.checkNumber) {
      delete data.checkNumber;
    }
    if (!data.creditCardId) {
      delete data.creditCardId;
    }
    if (!data.eCheckId) {
      delete data.eCheckId;
    }
    if (!data.checkNumber) {
      delete data.checkNumber;
    }

    const formdata = new FormData();
    formdata.append('Id', '0');
    formdata.append('ClientId', data.clientId);
    if (this.payment === 'otheramount') {
      formdata.append('InvoiceId', this.invoiceId.toString());
    }
    formdata.append('Method', data.method.toString());
    formdata.append('AmountToPay', data.amountToPay.toString());

    if (this.paymentMethod === 'CHECK') {
      formdata.append('CheckNumber', this.checkNumber.toString());
    }
    if (this.paymentMethod === 'CREDIT_CARD') {
      formdata.append('CreditCardId', data.creditCardId.toString());
    }

    if (this.paymentMethod === 'E-CHECK') {
      formdata.append('ECheckId', data.eCheckId.toString());
      formdata.append('SameDayACH', this.isCheckedSameDayACH.toString());
    }

    if (this.selectedFile) {
      this.dmsFileUpload(formdata);
    } else {
      this.recordInitialMethod(formdata);
    }
  }

  dmsFileUpload(body) {
    const fileBody: any = {
      file: this.selectedFile
    };
    const params = {
      body: fileBody
    };
    this.dmsService.v1DmsCheckImageFileUploadPost(params).subscribe(
      (res: any) => {
        res = JSON.parse(res).results;
        body.append('ScannedCheckImgUrl', res);
        this.recordInitialMethod(body);
      },
      () => {
        this.loading = false;
      }
    );
  }

  recordInitialMethod(formdata) {
    this.postPaymentService.v1PostPaymentPost(formdata).subscribe(
      async res => {
        try {
          this.postObject.paymentId = res.results;
          let resp: any = await this.billingService
            .v1BillingPostPaymentbyPostPaymentIdGet({
              postPaymentId: res.results
            })
            .toPromise();
          resp = JSON.parse(resp).results;

          this.postObject.postingDate = resp.postingDate;

          if (resp && resp.confirmationId) {
            this.postObject.authCode = resp.confirmationId;
          } else {
            this.postObject.authCode = res.results;
          }
          this.loading = false;
          this.toastDisplay.showSuccess('Payment Confirmed');
          this.pageMode = 'paymentsuccess';
        } catch (err) {
          this.loading = false;
          this.toastDisplay.showError(
            'Error occurred while getting payment details'
          );
        }
      },
      err => {
        this.loading = false;
        console.log(err);
        this.displayMessage = true;
        if (err && err.error) {
          const res = err.error.split(':');
          if (res.length > 1) {
            this.message = res[1];
          }
        }
      }
    );
  }

  /**
   *
   * Function to add intial record consultaion
   */
  public addInitalConsultationRecord(
    callback = (initialConsultationId: any) => {}
  ) {
    const test = { ...this.postObject };

    const hours = Math.floor(this.durationConsultationNumeric);
    const minutes = Math.round((this.durationConsultationNumeric - hours) * 60);

    const data: vwRecordInitialConsultation = {
      id: 0,
      contactId: test.clientId,
      tenantId: 0,
      initialConsultationDate: this.initialConsultationDate,
      rateId: this.selectedRateId,
      amountDue: +this.amountDue,
      decision: this.decision,
      isFullPayment: this.payment !== 'otheramount',
      otherAmount: +this.enterAmount,
      waiveAmount: this.waiveRemainingAmount !== 'No',
      remainingBalanceDueDate: test.remainingBalDueDate,
      paymentMethodLookUp: test.method,
      sendInvoiceType: this.invoiceType,
      sendInvoiceEmail: this.invoiceType === 'print' ? '' : this.invoiceEmail,
      isActive: true,
      consultAttorney: this.clientDetail.consultAttorney
    };
    if (hours || minutes) {
      data.durationOfConsultationHours = hours;
      data.durationOfConsultationMinutes = minutes;
    }

    this.contactService
      .v1ContactsAddrecordinitialconsultationPost$Json({ body: data })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          callback(res);
        },
        err => {
          this.loading = false;
          console.log(err);
        }
      );
  }

  async printReceipt() {
    if (this.receiptPdf) {
      this.receiptPdf.printPdf();
    }
  }

  getTenantDetails() {
    this.tenantService
      .v1TenantGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Tenant;
        })
      )
      .subscribe(
        tenant => {
          this.firmDetails = tenant;
          if (this.firmDetails) {
            this.getReceiptTemplateId();
          } else {
            this.toastDisplay.showError('No Settings Found');
          }
        },
        () => {}
      );
  }

  public getReceiptTemplateId() {
    this.billingService
      .v1BillingSettingsTenantTenantIdGet$Response({
        tenantId: this.firmDetails.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res.body as any).results[0] as any;
        }),
        finalize(() => {})
      )
      .subscribe(
        billingSettings => {
          if (billingSettings.receiptTemplateId) {
            this.getReceiptTemplateByID(billingSettings.receiptTemplateId);
          } else {
            this.toastDisplay.showError('No Receipt Found');
          }
        },
        () => {}
      );
  }

  public getReceiptTemplateByID(templateId: number) {
    this.billingService
      .v1BillingGetreceipttemplatebyidTemplateIdGet$Response({ templateId })
      .subscribe(
        res => {
          const template = JSON.parse(res.body as any).results;
          let content = template.templateContent;
          const index = content.indexOf(',');
          content = content.substr(index + 1, content.length);
          const file = UtilsHelper.base64toFile(
            content,
            `receipt_${1_0}.pdf`,
            'application/pdf'
          );
          saveAs(file);
        },
        err => {
          console.log(err);
        }
      );
  }

  public validateEmail() {
    this.emailError = UtilsHelper.validateEmail(this.invoiceEmail)
      ? null
      : 'error';
    console.log(this.invoiceEmail, '>...', this.emailError);
  }

  /**
   * Allow only number
   *
   * @param {*} event
   * @returns
   * @memberof GeneralinfoComponent
   */
  checkNumberz(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k == 8 || k == 9;
  }

  getNumber(num) {
    return num && !isNaN(+num) ? num : '0';
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(
    event: KeyboardEvent
  ) {
    this.dataEntered = true;
  }

  decisionChange() {
    this.dataEntered = true;
  }

  changePaymentAmount() {
    this.dataEntered = true;
  }

  @HostListener('window:popstate', ['$event']) onPopState(event) {
    if (this.pageMode == 'record') {
      this.cancel();
    }
    if (this.pageMode == 'review') {
      this.cancelOnReview();
    }
  }

  cancel() {
    this.dataEntered = false;
    this.router.navigate(['/contact/manage-initial-Consultation'], {
      queryParams: {
        clientId: this.clientId,
        state: this.state
      }
    });
  }

  cancelOnReview() {
    this.dataEntered = false;
    this.pageMode = 'record';
  }

  selectFile() {
    this.recordInitialCheckImageInput.nativeElement.click();
  }

  uploadFile(files: File[]) {
    const file = files[0];
    this.selectedFile = file;
    this.recordInitialCheckErr = false;
    this.recordInitialCheck = true;
    this.recordInitialCheckUploadFile = true;

    if (!file.type.match('.jpeg') && !file.type.match('.png')) {
      this.recordInitialCheckUploadFile = false;
      this.recordInitialCheckImageInput.nativeElement.value = null;
      this.recordInitialCheckErrMsg = this.errorData.payment_check_Image_format_error;
      this.recordInitialCheckErr = true;
      this.recordInitialCheck = true;
      return;
    } else if (file.size > 5000000) {
      this.recordInitialCheckImageInput.nativeElement.value = null;
      this.recordInitialCheckUploadFile = false;
      this.recordInitialCheckErr = true;
      this.recordInitialCheckErrMsg = this.errorData.payment_check_Image_File_Size;
      this.recordInitialCheck = true;
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.recordInitialCheckFileContent = reader.result as string;
    };
    reader.onerror = function(error) {
      console.log('Error: ', error);
    };
  }

  onRecordInitialClose() {
    this.recordInitialCheck = false;
    this.recordInitialCheckUploadFile = false;
    this.selectedFile = null;
    this.recordInitialCheckFileContent = '';
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

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    }
    UtilsHelper.aftertableInit();
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.rateList.length;
    this.page.totalPages = Math.ceil(this.rateList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
  }

  public selectedAccount(event?) {
    this.selectedOperatingAccount = event;
    this.operatingAccount = event;
    this.operatingAccountError = false;
    if (event) {
      if (!event.isMerchantAccount) {
        this.isCheckedSameDayACH = false;
      }
      if (
        !event.isMerchantAccount &&
        (this.paymentMethod == 'CREDIT_CARD' || this.paymentMethod == 'E-CHECK')
      ) {
        this.paymentMethod = null;
      } else {
        if (this.paymentMethod == 'CREDIT_CARD' && !event.isCreditCardAccount) {
          this.paymentMethod = null;
        }
        if (this.paymentMethod == 'E-CHECK' && !event.isAchAccount) {
          this.paymentMethod = null;
        }
      }
    }
  }

  public async getUsioPaymentMethodPermission() {
    this.loading = true;
    try {
      let resp: any = await this.usioService
        .v1UsioGetMatterIdGet({ clientId: this.clientId })
        .toPromise();
      resp = JSON.parse(resp as any).results;
      if (resp) {
        resp = await this.usioService
          .v1UsioCheckUsioTrustAccountTypeGet({ matterId: resp })
          .toPromise();
        resp = JSON.parse(resp as any).results;
        if (resp) {
          this.paymentPermission = resp;
          console.log(this.paymentPermission);
        }
      }
      this.loading = false;
    } catch (error) {
      this.loading = false;
    }
  }

  public checkAchCreditStatus(event) {
    if (event) {
      this.isAchDisabled = event.isAchDisabled;
      this.isCreditCardDisabled = event.isCreditCardAccountDisabled;
    }
  }

  public onBlurEnterAmount() {
    this.enterAmount = (+this.enterAmount).toFixed(2);
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.rateList) {
      return this.rateList.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
