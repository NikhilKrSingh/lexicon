import { AfterViewInit, Component, ElementRef, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ModalDismissReasons, NgbModal
} from "@ng-bootstrap/ng-bootstrap";
import * as _ from 'lodash';
import { fromEvent, Subscription } from 'rxjs';
import { debounceTime, map, take } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { REGEX_DATA } from 'src/app/modules/shared/const';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { EmployeeService, MiscService, PlacesService, SecurityGroupService, UsioService } from 'src/common/swagger-providers/services';
import { TrustAccountService } from 'src/common/swagger-providers/services/trust-account.service';
import * as errorData from '../../../shared/error.json';


@Component({
  selector: 'app-add-account',
  templateUrl: './add-account.component.html',
  styleUrls: ['./add-account.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddAccountComponent implements OnInit, AfterViewInit {
  public merchantAccountForm: FormGroup;
  public ownerForm: FormGroup;
  public stateList: Array<any>;
  public ownersList: any = [];
  public ownerShip = [
    { id: 1, name: 'Partnership Public' },
    { id: 2, name: 'C-Corp Private' },
    { id: 3, name: 'S-Corp Private' },
    { id: 4, name: 'Sole Prop' },
    { id: 5, name: 'Partnership Private' },
    { id: 6, name: 'LLC Private' },
    { id: 7, name: 'Not For Profit' },
    { id: 8, name: 'C-Corp Public' },
    { id: 9, name: 'S-Corp Public' },
    { id: 10, name: 'Government Agency' },
    { id: 11, name: 'LLC Public' }
  ];
  closeResult: string;
  formSubmitted = false;
  selectedState: any;
  selectedOwnerShip: any;
  editableRow = new FormControl('', [
    Validators.required,
    Validators.email,
    Validators.maxLength(50),
    Validators.pattern(REGEX_DATA.Email)
  ]);
  ownerIndex = 0;
  public dateReset: boolean = false;
  public isMerchant: boolean = null;
  public errorData: any = (errorData as any).default;
  public oformSubmitted: boolean = false;
  public transactionTypeError: boolean = false;
  public loading: boolean = false;
  public offsetValue;
  public topbarHeight: number;
  public merchantCategoryList: any[] = [];
  public naicsCodeList: any[] = [];
  feesRoutingError = false;
  settlmentRoutingError = false;
  feesAccountError = false;
  settlmentAccountError = false;
  urlError = false;
  visibleFullFormControl = false;
  trustAccountingFlag: boolean = false;
  public creditCard: boolean = false;
  public currentDate: Date;
  public naicsError: boolean = false;
  public mccError: boolean = false;
  naicsCodesBuffer = [];
  bufferSize = 50;
  numberOfItemsFromEndBeforeFetchingMore = 10;
  scrollLoading = false;
  public nameErr: string = '';
  public accountErr: string = '';
  stateCitySubscription: Subscription;
  cityList: any[] = [];
  singleState: any = null;
  public disableCCTrustOption = false;
  public validZipErr = false;
  constructor(
    private builder: FormBuilder,
    private misc: MiscService,
    private employeeService: EmployeeService,
    private toastDisplay: ToastDisplay,
    private usioService: UsioService,
    private modalService: NgbModal,
    private router: Router,
    private el: ElementRef,
    private trustAccountService: TrustAccountService,
    private securityGroupService: SecurityGroupService,
    private placeService: PlacesService,
  ) {}

  ngOnInit() {
    let dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - 1);
    this.currentDate = dateObj;
    this.initilizeForm();
    this.getMerchantCategoryCodes();
    // this.getState();
    this.checkTrustAccountStatus();
  }
  ngAfterViewInit() {
    const elements = document.querySelectorAll('.scrolling-steps');
    this.offsetValue =
      elements && elements.length > 0 ? elements[0].getBoundingClientRect() : 0;
    const ele = document.querySelectorAll('.top-bar');
    this.topbarHeight =
      ele && ele.length > 0 ? ele[0].getBoundingClientRect().height : 0;
  }
  initilizeForm() {
    this.merchantAccountForm = this.builder.group({
      name: new FormControl('', [
        Validators.required,
        Validators.maxLength(50)
      ]),
      isMerchantAccount: new FormControl(),
      usioAccountTypeId: new FormControl(null, [Validators.required])
    });
  }
  // public getState() {
  //   this.loading = true;
  //   this.misc.v1MiscStatesGet$Response({}).subscribe(
  //     suc => {
  //       const res: any = suc;
  //       this.stateList = JSON.parse(res.body).results;
  //       this.loading = false;
  //     },
  //     err => {
  //       this.loading = false;
  //     }
  //   );
  // }

  async checkTrustAccountStatus(): Promise<any> {
    this.loading = true;
    let resp: any = await this.trustAccountService
      .v1TrustAccountGetTrustAccountStatusGet$Response()
      .toPromise();
    resp = JSON.parse(resp.body as any).results;
    if (resp) {
      this.trustAccountingFlag = true;
    } else {
      this.trustAccountingFlag = false;
      this.merchantAccountForm.patchValue({
        usioAccountTypeId: true
      });
      $('input[formcontrolname=usioAccountTypeId]').attr('disabled', 'true');
    }
    this.loading = false;
  }
  changeAccountType(value) {
    if (value == 3) {
      this.merchantAccountForm.patchValue({
        isCreditCardAccount: true
      });
      $('input[formcontrolname=isCreditCardAccount]').attr('disabled', 'true');
      $('input[formcontrolname=isAchAccount]').attr('disabled', 'true');
      if (this.merchantAccountForm.controls.isAchAccount) {
        this.merchantAccountForm.controls.isAchAccount.setValue(false);
      }
      this.creditCard = true;
    } else {
      if (this.creditCard) {
        this.merchantAccountForm.patchValue({
          isCreditCardAccount: null
        });
        this.creditCard = false;
      }
      $('input[formcontrolname=isCreditCardAccount]').removeAttr('disabled');
      $('input[formcontrolname=isAchAccount]').removeAttr('disabled');
    }
  }

  async manageFormControl(event, value) {
    this.accountErr = '';
    if (event.target.checked && value == 'true') {
      this.disableCCTrustOption = false;
      this.merchantAccountForm.addControl(
        'isCreditCardAccount',
        new FormControl(null)
      );
      this.merchantAccountForm.addControl(
        'isAchAccount',
        new FormControl(null)
      );
      this.merchantAccountForm.addControl(
        'businessName',
        new FormControl('', [
          Validators.required,
          Validators.maxLength(50),
          Validators.minLength(2)
        ])
      );
      this.merchantAccountForm.addControl(
        'email',
        new FormControl('', [
          Validators.required,
          Validators.email,
          Validators.maxLength(50),
          Validators.pattern(REGEX_DATA.Email)
        ])
      );
      this.merchantAccountForm.addControl(
        'legalBusinessName',
        new FormControl('', [
          Validators.required,
          Validators.maxLength(50),
          Validators.minLength(2)
        ])
      );
      this.merchantAccountForm.addControl('ownershipTypeId', new FormControl());
      this.merchantAccountForm.addControl(
        'businessDescription',
        new FormControl('')
      );
      this.merchantAccountForm.addControl(
        'businessStartDate',
        new FormControl('')
      );
      this.merchantAccountForm.addControl(
        'merchantCategoryCode',
        new FormControl(null, [Validators.maxLength(10)])
      );
      this.merchantAccountForm.addControl(
        'naicsCode',
        new FormControl(null, [Validators.maxLength(10)])
      );
      this.merchantAccountForm.addControl(
        'federalTaxIdOrSsn',
        new FormControl('', [Validators.minLength(9), Validators.maxLength(9)])
      );
      this.merchantAccountForm.addControl(
        'phoneNo',
        new FormControl('', [
          Validators.maxLength(10),
          Validators.minLength(10)
        ])
      );
      this.merchantAccountForm.addControl(
        'website',
        new FormControl('', Validators.maxLength(50))
      );
      this.merchantAccountForm.addControl(
        'address1',
        new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50)
        ])
      );
      this.merchantAccountForm.addControl(
        'address2',
        new FormControl('', [Validators.minLength(2), Validators.maxLength(50)])
      );
      this.merchantAccountForm.addControl(
        'city',
        new FormControl('', [
          Validators.required,
          Validators.maxLength(38),
          Validators.minLength(2)
        ])
      );
      this.merchantAccountForm.addControl(
        'stateCode',
        new FormControl(null, [Validators.required])
      );
      this.merchantAccountForm.addControl(
        'postalCode',
        new FormControl('', [
          Validators.required
        ])
      );
      this.merchantAccountForm.addControl(
        'isSettlementPersonal',
        new FormControl('', [Validators.required])
      );
      this.merchantAccountForm.addControl(
        'settlementAccountName',
        new FormControl('', [
          Validators.required,
          Validators.maxLength(50),
          Validators.minLength(2)
        ])
      );
      this.merchantAccountForm.addControl(
        'settlementAccountRoutingNumber',
        new FormControl('', [
          Validators.required,
          Validators.maxLength(9),
          Validators.minLength(9)
        ])
      );
      this.merchantAccountForm.addControl(
        'settlementAccountNumber',
        new FormControl('', [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(20)
        ])
      );
      this.merchantAccountForm.addControl(
        'isFeesSettlementPersonal',
        new FormControl('', [Validators.required])
      );
      this.merchantAccountForm.addControl(
        'feesSettlementAccountName',
        new FormControl('', [
          Validators.required,
          Validators.maxLength(50),
          Validators.minLength(2)
        ])
      );
      this.merchantAccountForm.addControl(
        'feesSettlementAccountRoutingNumber',
        new FormControl('', [
          Validators.required,
          Validators.minLength(9),
          Validators.maxLength(9)
        ])
      );
      this.merchantAccountForm.addControl(
        'feesSettlementAccountNumber',
        new FormControl('', [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(20)
        ])
      );
      this.merchantAccountForm.addControl(
        'ownerEmail1',
        new FormControl('', [
          Validators.required,
          Validators.maxLength(50),
          Validators.pattern(REGEX_DATA.Email)
        ])
      );
      this.merchantAccountForm.addControl('ownerEmail2', new FormControl(''));
      this.merchantAccountForm.addControl('ownerEmail3', new FormControl(''));
      this.merchantAccountForm.addControl('ownerEmail4', new FormControl(''));

      this.ownerForm = this.builder.group({
        ownerEmail1: new FormControl('', [
          Validators.required,
          Validators.maxLength(50),
          Validators.pattern(REGEX_DATA.Email)
        ]),
        ownerEmail2: new FormControl('', [
          Validators.pattern(REGEX_DATA.Email)
        ]),
        ownerEmail3: new FormControl('', [
          Validators.pattern(REGEX_DATA.Email)
        ]),
        ownerEmail4: new FormControl('', [Validators.pattern(REGEX_DATA.Email)])
      });

      this.merchantAccountForm.removeControl('nonMerchaneAccountNumber');
      this.merchantAccountForm.removeControl(
        'nonMerchaneAccountRountingNumber'
      );
      this.isMerchant = true;
    }
    if (event.target.checked && value == 'false') {
      this.disableCCTrustOption = true;
      this.merchantAccountForm.controls.usioAccountTypeId.setValue(null);
      this.merchantAccountForm.addControl(
        'nonMerchaneAccountNumber',
        new FormControl('', [
          Validators.required,
          Validators.maxLength(20),
          Validators.minLength(4)
        ])
      );
      this.merchantAccountForm.addControl(
        'nonMerchaneAccountRountingNumber',
        new FormControl('', [Validators.required])
      );
      this.merchantAccountForm.removeControl('isCreditCardAccount');
      this.merchantAccountForm.removeControl('isAchAccount');
      this.merchantAccountForm.removeControl('businessName');
      this.merchantAccountForm.removeControl('email');
      this.merchantAccountForm.removeControl('legalBusinessName');
      this.merchantAccountForm.removeControl('ownershipTypeId');
      this.merchantAccountForm.removeControl('businessDescription');
      this.merchantAccountForm.removeControl('businessStartDate');
      this.merchantAccountForm.removeControl('merchantCategoryCode');
      this.merchantAccountForm.removeControl('naicsCode');
      this.merchantAccountForm.removeControl('federalTaxIdOrSsn');
      this.merchantAccountForm.removeControl('phoneNo');
      this.merchantAccountForm.removeControl('website');
      this.merchantAccountForm.removeControl('address1');
      this.merchantAccountForm.removeControl('address2');
      this.merchantAccountForm.removeControl('city');
      this.merchantAccountForm.removeControl('stateCode');
      this.merchantAccountForm.removeControl('postalCode');
      this.merchantAccountForm.removeControl('isSettlementPersonal');
      this.merchantAccountForm.removeControl('settlementAccountName');
      this.merchantAccountForm.removeControl('settlementAccountRoutingNumber');
      this.merchantAccountForm.removeControl('settlementAccountNumber');
      this.merchantAccountForm.removeControl('isFeesSettlementPersonal');
      this.merchantAccountForm.removeControl('feesSettlementAccountName');
      this.merchantAccountForm.removeControl(
        'feesSettlementAccountRoutingNumber'
      );
      this.merchantAccountForm.removeControl('feesSettlementAccountNumber');
      this.merchantAccountForm.removeControl('ownerEmail1');
      this.merchantAccountForm.removeControl('ownerEmail2');
      this.merchantAccountForm.removeControl('ownerEmail3');
      this.merchantAccountForm.removeControl('ownerEmail4');

      this.isMerchant = false;
    }
  }

  private scrollToFirstInvalidControl() {
    const firstInvalidControl: HTMLElement = this.el.nativeElement.querySelector(
      '.ng-invalid'
    );
    if (firstInvalidControl) {
      window.scroll({
        top: this.getTopOffset(firstInvalidControl),
        left: 0,
        behavior: 'smooth'
      });
      fromEvent(window, 'scroll')
        .pipe(debounceTime(100), take(1))
        .subscribe(() => firstInvalidControl.focus());
    }
  }
  private getTopOffset(controlEl: HTMLElement): number {
    const labelOffset = 50;
    return (
      controlEl.getBoundingClientRect().top +
      window.scrollY -
      (this.offsetValue.height + this.topbarHeight + labelOffset)
    );
  }

  saveAccount() {
    let body = null;
    this.formSubmitted = true;
    if (this.merchantAccountForm.value.isMerchantAccount) {
      this.visibleFullFormControl = true;
    }
    if (this.merchantAccountForm.valid) {
      if (this.nameErr || this.accountErr) {
        window.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
        return;
      }
      if (this.isMerchant) {
        if (
          !(
            this.merchantAccountForm.value.isAchAccount ||
            this.merchantAccountForm.value.isCreditCardAccount
          )
        ) {
          this.transactionTypeError = true;
          return;
        }
        body = {
          name: this.merchantAccountForm.value.name,
          isMerchantAccount: this.isMerchant,
          nonMerchaneAccountNumber: this.merchantAccountForm.value
            .nonMerchaneAccountNumber,
          nonMerchaneAccountRountingNumber: this.merchantAccountForm.value
            .nonMerchaneAccountRountingNumber,
          usioAccountTypeId: +this.merchantAccountForm.value.usioAccountTypeId,
          isCreditCardAccount: this.merchantAccountForm.value
            .isCreditCardAccount
            ? true
            : false,
          isAchAccount: this.merchantAccountForm.value.isAchAccount
            ? true
            : false,
          businessName: this.merchantAccountForm.value.businessName,
          email: this.merchantAccountForm.value.email,
          legalBusinessName: this.merchantAccountForm.value.legalBusinessName,
          ownershipTypeId: parseInt(
            this.merchantAccountForm.value.ownershipTypeId
          ),
          businessDescription: this.merchantAccountForm.value
            .businessDescription,
          businessStartDate: this.merchantAccountForm.value.businessStartDate
            ? this.merchantAccountForm.value.businessStartDate
            : null,
          merchantCategoryCode: this.merchantAccountForm.value
            .merchantCategoryCode,
          naicsCode: this.merchantAccountForm.value.naicsCode,
          federalTaxIdOrSsn: this.merchantAccountForm.value.federalTaxIdOrSsn,
          phoneNo: this.merchantAccountForm.value.phoneNo,
          website: this.merchantAccountForm.value.website,
          address1: this.merchantAccountForm.value.address1,
          address2: this.merchantAccountForm.value.address2,
          city: this.merchantAccountForm.value.city,
          stateCode: this.merchantAccountForm.value.stateCode,
          postalCode: this.merchantAccountForm.value.postalCode,
          isSettlementPersonal: this.merchantAccountForm.value
            .isSettlementPersonal
            ? true
            : false,
          settlementAccountName: this.merchantAccountForm.value
            .settlementAccountName,
          settlementAccountRoutingNumber: this.merchantAccountForm.value
            .settlementAccountRoutingNumber,
          settlementAccountNumber: this.merchantAccountForm.value
            .settlementAccountNumber,
          isFeesSettlementPersonal: this.merchantAccountForm.value
            .isFeesSettlementPersonal
            ? true
            : false,
          feesSettlementAccountName: this.merchantAccountForm.value
            .feesSettlementAccountName,
          feesSettlementAccountRoutingNumber: this.merchantAccountForm.value
            .feesSettlementAccountRoutingNumber,
          feesSettlementAccountNumber: this.merchantAccountForm.value
            .feesSettlementAccountNumber,
          ownerEmail1: this.merchantAccountForm.value.ownerEmail1,
          ownerEmail2: this.merchantAccountForm.value.ownerEmail2,
          ownerEmail3: this.merchantAccountForm.value.ownerEmail3,
          ownerEmail4: this.merchantAccountForm.value.ownerEmail4,
          ownershipInfo: {
            ownershipTypeId:
              this.selectedOwnerShip && this.selectedOwnerShip.id
                ? this.selectedOwnerShip.id
                : null,
            ownershipName:
              this.selectedOwnerShip && this.selectedOwnerShip.name
                ? this.selectedOwnerShip.name
                : null
          },
          stateInfo: {
            stateId:
              this.selectedState && this.selectedState.id
                ? this.selectedState.id
                : null,
            stateName:
              this.selectedState && this.selectedState.code
                ? this.selectedState.code
                : null
          }
        };
      } else {
        const accno = this.merchantAccountForm.value.nonMerchaneAccountNumber;
        body = {
          name: this.merchantAccountForm.value.name,
          isMerchantAccount: this.isMerchant,
          nonMerchaneAccountNumber: accno,
          nonMerchaneAccountRountingNumber: this.merchantAccountForm.value
            .nonMerchaneAccountRountingNumber,
          usioAccountTypeId: +this.merchantAccountForm.value.usioAccountTypeId
        };
      }
      this.loading = true;
      this.usioService
        .v1UsioAddUsioBankAccountPost$Json$Response({ body })
        .subscribe(
          suc => {
            this.urlError = this.settlmentRoutingError = this.feesRoutingError = this.settlmentAccountError = this.feesAccountError = this.naicsError = this.mccError = false;
            let res: any = suc;
            let resp = JSON.parse(res.body).results;
            this.loading = false;
            if (resp.status == 'success') {
              this.toastDisplay.showSuccess(
                'Account details saved.'
              );
              this.router.navigate(['/firm/account-settings']);
            } else {
              if (resp.validationErrors || resp.status == 'failure') {
                if (resp.validationErrors) {
                  resp.validationErrors.filter(err => {
                    if (err.fieldName == 'routingNumber') {
                      this.settlmentRoutingError = true;
                    }
                    if (err.fieldName == 'accountNumber') {
                      this.settlmentAccountError = true;
                    }
                    if (err.fieldName == 'feesRoutingNumber') {
                      this.feesRoutingError = true;
                    }
                    if (err.fieldName == 'feesAccountNumber') {
                      this.feesAccountError = true;
                    }
                    if (err.fieldName == 'url') {
                      this.urlError = true;
                    }
                    if (err.fieldName == 'name') {
                      this.nameErr = err.errorDescription;
                      window.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
                    }
                    if (err.fieldName == 'settlementAccountNumberIsUse') {
                      this.accountErr = err.errorDescription;
                      window.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
                    }
                  });
                }
                if (resp.message && resp.message.includes('Invalid NAICS Code')) {
                  this.naicsError = true;
                }
                if (resp.message && resp.message.includes('Invalid MCC Code')) {
                  this.mccError = true;
                }

                this.scrollToFirstInvalidControl();
              }
            }
            this.loading = false;
          },
          err => {
            this.loading = false;
          }
        );
    } else {
      this.scrollToFirstInvalidControl();
      if (
        !(
          this.merchantAccountForm.value.isAchAccount ||
          this.merchantAccountForm.value.isCreditCardAccount
        )
      ) {
        this.transactionTypeError = true;
      }
      return;
    }
    this.formSubmitted = false;
    this.transactionTypeError = false;
  }
  selectState(event) {
    this.selectedState = event;
  }
  selectOwner(event) {
    this.selectedOwnerShip = event;
  }
  clearAccountErr() {
    this.accountErr = '';
  }
  clearNameErr() {
    this.nameErr = '';
  }
  openPersonalinfo(content: any, className, winClass, row = {}, index = null) {
    this.editableRow.patchValue(row);
    this.ownerIndex = index;

    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
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

  manageOwnerDetails() {
  }

  saveOwners() {
    this.oformSubmitted = true;
    if (!this.ownerForm.valid && this.ownersList.length == 0) {
      return;
    }
    if (this.ownerForm.value.ownerEmail1 && this.ownersList.length <= 0) {
      this.ownersList.push(this.ownerForm.value.ownerEmail1);
    }
    if (this.ownerForm.value.ownerEmail2 && this.ownersList.length <= 1) {
      this.ownersList.push(this.ownerForm.value.ownerEmail2);
    }
    if (this.ownerForm.value.ownerEmail3 && this.ownersList.length <= 2) {
      this.ownersList.push(this.ownerForm.value.ownerEmail3);
    }
    if (this.ownerForm.value.ownerEmail4 && this.ownersList.length <= 3) {
      this.ownersList.push(this.ownerForm.value.ownerEmail4);
    }
    this.modalService.dismissAll();
    this.ownerForm.reset();
    this.updateOwnerDetails();
    this.oformSubmitted = false;
  }

  updateOwnerDetails() {
    this.merchantAccountForm.patchValue({
      ownerEmail1: this.ownersList[0] ? this.ownersList[0] : '',
      ownerEmail2: this.ownersList[1] ? this.ownersList[1] : '',
      ownerEmail3: this.ownersList[2] ? this.ownersList[2] : '',
      ownerEmail4: this.ownersList[3] ? this.ownersList[3] : ''
    });
  }

  EditOwner() {
    this.oformSubmitted = true;
    if (!this.editableRow.valid) {
      return;
    }
    this.ownersList[this.ownerIndex] = this.editableRow.value;

    this.updateOwnerDetails();
    this.modalService.dismissAll();
    this.oformSubmitted = false;
  }
  deleteOwner(index) {
    this.ownersList.splice(index, 1);

    this.updateOwnerDetails();
  }

  get f() {
    return this.merchantAccountForm.controls;
  }

  get o() {
    return this.ownerForm.controls;
  }

  public checkErrorTransaction() {
    if (
      this.merchantAccountForm.value.isAchAccount ||
      this.merchantAccountForm.value.isCreditCardAccount
    ) {
      this.transactionTypeError = false;
    }
  }

  public async getMerchantCategoryCodes() {
    this.loading = true;
    try {
      let resp: any = await this.usioService
        .v1UsioGetMerchantCategoryCodesGet()
        .toPromise();
      resp = JSON.parse(resp).results;
      if (resp && resp.codes) {
        this.merchantCategoryList = resp.codes.filter(item => {
          return item && item.type && item.type == 'MCC';
        });

        this.naicsCodeList = resp.codes.filter(item => {
          return item && item.type && item.type == 'NAICS';
        });
        this.naicsCodesBuffer = this.naicsCodeList.slice(0, this.bufferSize);
      }
      this.loading = false;
    } catch (error) {
      this.loading = false;
    }
  }

  getError(err) {
    console.log(err);
  }

  /***** function to allow number with character limit */
  numberWithMaxDigit(event) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    if (event.target.value.length >= 17) {
      return false;
    }
    return true;
  }

  federalTaxDigit(event) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    if (event.target.value.length >= 9) {
      return false;
    }
    return true;
  }

  onScrollToEnd() {
    this.fetchMore();
  }

  onScroll({ end }) {
    if (this.scrollLoading || this.naicsCodeList.length <= this.naicsCodesBuffer.length) {
      return;
    }

    if (
      end + this.numberOfItemsFromEndBeforeFetchingMore >=
      this.naicsCodesBuffer.length
    ) {
      this.fetchMore();
    }
  }

  private fetchMore() {
    const len = this.naicsCodesBuffer.length;
    const more = this.naicsCodeList.slice(len, this.bufferSize + len);
    this.scrollLoading = true;
    // using timeout here to simulate backend API delay
    setTimeout(() => {
      this.scrollLoading = false;
      this.naicsCodesBuffer = this.naicsCodesBuffer.concat(more);
    }, 200);
  }

  /***** Get state and city by zip-code ****/
  public getCityState(searchString)  {
    const input = (searchString || '').trim();
    if(this.stateCitySubscription) 
      this.stateCitySubscription.unsubscribe();
      if(input.length >= 3) {
        this.validZipErr = false;
        this.merchantAccountForm.controls.stateCode.setValue(null);
        this.merchantAccountForm.controls.city.setValue(null);
        this.stateCitySubscription =  this.placeService.v1PlacesZipcodeInputGet({input})
        .pipe(debounceTime(500), map(UtilsHelper.mapData))
        .subscribe((res) => {
          if(res) {
            this.stateList = [];
            this.cityList = [];
            this.singleState = null;
            if(res.stateFullName && res.stateFullName.length)
              res.stateFullName.forEach((state, index) => this.stateList.push({name: state, code: res.state[index]}))
            if(res.city && res.city.length)
              this.cityList = [...res.city]
            _.sortBy(this.stateList);
            _.sortBy(this.cityList);
            if(this.stateList.length == 1)
              this.singleState = this.stateList[0].name;
            this.merchantAccountForm.controls.stateCode.setValue(this.stateList.length ? this.stateList[0].code : null);
            this.merchantAccountForm.controls.city.setValue(this.cityList.length ? this.cityList[0] : null);
            if (!this.stateList.length || !this.cityList.length) {
              setTimeout(() => {
                this.validZipErr = true;
              }, 100)
            }
          }
        });
        return;
      }
    this.stateList = [];
    this.cityList = [];
    this.singleState = null;
    this.validZipErr = false;
    this.merchantAccountForm.controls.stateCode.setValue(null);
    this.merchantAccountForm.controls.city.setValue(null);
    if (input.length > 0 && input.length < 3) {
      this.validZipErr = true;
    }
  }

  /***** Validates zip code ****/
  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k === 8 || k === 9;
  }

  cancelClick()
  {
    if(!this.loading)
    {
    this.router.navigate(['/firm/account-settings']);
    }
  }
}
