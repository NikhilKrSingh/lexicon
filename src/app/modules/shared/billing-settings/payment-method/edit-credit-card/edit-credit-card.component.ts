import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { debounceTime, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { ClientPaymentMethodComponent } from 'src/app/modules/client/creating/billing-info/client-payment-method/client-payment-method.component';
import { CreditCardFormError } from 'src/app/modules/models/fillable-form.model';
import { PaymentPlanModel } from 'src/app/modules/models/payment-model';
import * as errors from 'src/app/modules/shared/error.json';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { vwAddress, vwCreditCard, vwIdCodeName } from 'src/common/swagger-providers/models';
import { ClientService, MiscService, PlacesService } from 'src/common/swagger-providers/services';
import { REGEX_DATA } from '../../../const';
import { UtilsHelper } from '../../../utils.helper';
import { NewBillingPaymentMethodComponent } from '../../new-payment-method/new-payment-method.component';
import { PaymentMethodCreateMatterComponent } from '../../payment-method-create-matter/payment-method-create-matter.component';
import { PaymentMethodNewWizardComponent } from '../../payment-method-new-wizard/payment-method-new-wizard.component';
import { BillingPaymentMethodComponent } from '../payment-method.component';

@Component({
  selector: 'app-edit-credit-card',
  templateUrl: './edit-credit-card.component.html',
  styleUrls: ['./edit-credit-card.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class EditCreditCardComponent implements OnInit {
  primaryAddress: vwAddress;
  creditCard: vwCreditCard;
  states: Array<vwIdCodeName>;
  paymentPlanList: Array<PaymentPlanModel>;

  address: vwAddress;
  displayautopaymsg: boolean = false;
  editSuspendMode: boolean = false;
  error_data = (errors as any).default;

  paymentComponent: BillingPaymentMethodComponent | NewBillingPaymentMethodComponent;
  validateAutoPay: (
    e: vwCreditCard,
    c: BillingPaymentMethodComponent | NewBillingPaymentMethodComponent
  ) => boolean;

  isValidAutoPay: boolean = true;

  showSection1 = true;
  showSection2 = false;
  showSection3 = false;

  creditCardForm: FormGroup;
  addressForm: FormGroup;
  autoPayForm: FormGroup;
  public autopay_warning: string;
  creditCardFormError: CreditCardFormError;

  createFrom: string;
  paymentMatterComponent: PaymentMethodCreateMatterComponent;
  paymentNewMatterComponent: PaymentMethodNewWizardComponent;
  validateNewClientAutoPay: (
    e: vwCreditCard,
    c: ClientPaymentMethodComponent
  ) => boolean;
  paymentNewClientComponent: ClientPaymentMethodComponent;
  validateNewMatterAutoPay: (
    e: vwCreditCard,
    c: PaymentMethodNewWizardComponent
  ) => boolean;

  public autoPayMattersTitle: string =
    'No matters will auto-pay using this credit card';
  public selectedMatters: Array<any> = [];
  public mattersList: Array<any> = [];
  public autoPayDisabled: boolean = true;
  public clientId: number;
  public autoPaySelectionsValid: boolean = true;
  public formSubmitted: boolean = false;
  public notCreateFrom: boolean;
  public disableAll: boolean;
  public suspendSelected: boolean;
  public fromClient: boolean;
  stateCitySubscription: any;
  stateList: any[];
  cityList: any[];
  singleState: any;
  public isSameAsPrimary: boolean;
  validZipErr = false;
  primaryState:any;
  isPotentialClient = false;

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private toastDisplay: ToastDisplay,
    private miscService: MiscService,
    private clientService: ClientService,
    private route: ActivatedRoute,
    private placeService: PlacesService
  ) {
    this.creditCard = {
      firstName: '',
      lastName: '',
      companyName: '',
      cardNumber: '',
      cvv: '',
      expirationDate: ''
    };
    this.creditCardFormError = new CreditCardFormError();
  }

  async ngOnInit() {
    if (this.createFrom == undefined) {
      this.notCreateFrom = true;
    } else {
      this.notCreateFrom = false;
    }
    this.route.queryParams.subscribe(params => {
      this.clientId = +params['clientId'];
    });
    if (this.clientId.toString() == "NaN") {
      this.fromClient = false;
    } else {
      this.fromClient = true;
    }
    this.autopay_warning = this.error_data.activ_auto_pay_warning;
    // this.getStates();

    let cardNumber = 'XXXXXXXXXXXX' + this.creditCard.cardNumber;

    if (this.creditCard.cardNumber && this.creditCard.cardNumber.length == 16) {
      cardNumber = 'XXXXXXXXXXXX' + this.creditCard.cardNumber.slice(-4);
    }

    if (this.creditCard.isCompany) {
      this.creditCardForm = this.fb.group({
        isCompany: [this.creditCard.isCompany],
        firstName: null,
        lastName: null,
        companyName: [
          this.creditCard.companyName,
          [Validators.required, PreventInject]
        ],
        cardNumber: [
          cardNumber,
          [Validators.required, Validators.minLength(16)]
        ],
        expirationDate: [this.creditCard.expirationDate, Validators.required],
        CVV: [null, [Validators.required]]
      });
    } else {
      this.creditCardForm = this.fb.group({
        isCompany: [this.creditCard.isCompany],
        firstName: [
          this.creditCard.firstName,
          [Validators.required, PreventInject]
        ],
        lastName: [
          this.creditCard.lastName,
          [Validators.required, PreventInject]
        ],
        companyName: null,
        cardNumber: [
          cardNumber,
          [Validators.required, Validators.minLength(16)]
        ],
        expirationDate: [this.creditCard.expirationDate, Validators.required],
        CVV: [null, [Validators.required]]
      });
    }

    if (this.creditCard.isSameAsPrimary) {
      const code = (this.primaryState) ? this.primaryState.code: this.primaryAddress.state;
      const primaryAdd = this.primaryAddress.address ? this.primaryAddress.address.substring(0, 39): this.primaryAddress.address;
      const primaryAdd2 = this.primaryAddress.address2 ? this.primaryAddress.address2.substring(0, 39): this.primaryAddress.address2;
      this.addressForm = this.fb.group({
        isSameAsPrimary: this.creditCard.isSameAsPrimary,
        address: [
          primaryAdd,
          [Validators.required, PreventInject]
        ],
        address2: [primaryAdd2, PreventInject],
        city: [this.primaryAddress.city, [Validators.required, PreventInject]],
        state: [code, Validators.required],
        zipCode: [this.primaryAddress.zip, Validators.required]
      });
      this.singleState = (this.primaryState) ? this.primaryState.name: this.primaryAddress.state;
      this.getCityState(this.primaryAddress.zip, true);
    } else {
      const primaryAdd = this.address.address ? this.address.address.substring(0, 39): this.address.address;
      const primaryAdd2 = this.address.address2 ? this.address.address2.substring(0, 39): this.address.address2;
      this.addressForm = this.fb.group({
        isSameAsPrimary: this.creditCard.isSameAsPrimary,
        address: [primaryAdd, [Validators.required, PreventInject]],
        address2: [primaryAdd2, PreventInject],
        city: [this.address.city, [Validators.required, PreventInject]],
        state: [this.address.state, Validators.required],
        zipCode: [this.address.zip, Validators.required]
      });
      this.singleState = this.address.state;
      this.getCityState(this.address.zip, true)
    }

    this.autoPayForm = this.fb.group({
      autoPay: this.creditCard.autoPay,
      toggleAutoPay: this.creditCard.suspendAutoPay
    });

    if (this.creditCard.autoPay) {
      this.editSuspendMode = true;
      this.autoPayDisabled = false;

      if (this.creditCard.suspendAutoPay) {
        this.autoPayForm.controls['autoPay'].disable();
        if (this.fromClient) {
          this.getMatterList('disableSelected');
        }
      } else {
        if (this.fromClient) {
          this.getMatterList('alreadySelected');
        }
      }
    }

    if (this.paymentPlanList && this.paymentPlanList.length > 0) {
      this.autoPayForm.controls['autoPay'].disable();
      this.autoPayForm.controls['toggleAutoPay'].disable();
    }

    this.addressForm.controls['isSameAsPrimary'].valueChanges.subscribe(res => {
      if (res) {
        this.stateList = [];
        this.cityList = [];
        this.singleState = null;
        this.addressForm.patchValue({
          address: this.primaryAddress.address,
          address2: this.primaryAddress.address2,
          city: this.primaryAddress.city,
          state: (this.primaryState) ? this.primaryState.code: this.primaryAddress.state,
          zipCode: this.primaryAddress.zip
        });
        if (this.primaryState) {
          this.singleState = this.primaryState.name;
        } else {
          this.getCityState(this.primaryAddress.zip, true);
        }
      } else {
        if (this.creditCard.id) {
          this.singleState = null;
          this.stateList = [];
          this.cityList = [];
          this.addressForm.patchValue({
            address: this.address.address,
            address2: this.address.address2,
            city: this.address.city,
            state: this.address.state,
            zipCode: this.address.zip
          });
          // this.singleState = this.address.state;
          this.getCityState(this.address.zip, true);
        } else {
          this.addressForm.patchValue({
            address: null,
            address2: null,
            city: null,
            state: null,
            zipCode: null
          });
          this.singleState = null;
        }
      }

      this.creditCardForm.updateValueAndValidity();
    });

    this.creditCardForm.controls['isCompany'].valueChanges.subscribe(value => {
      if (value) {
        this.creditCardForm.controls['firstName'].clearValidators();
        this.creditCardForm.controls['lastName'].clearValidators();

        this.creditCardForm.controls['firstName'].patchValue(null);
        this.creditCardForm.controls['lastName'].patchValue(null);

        this.creditCardForm.controls['companyName'].setValidators([
          Validators.required
        ]);
      } else {
        this.creditCardForm.controls['companyName'].clearValidators();
        this.creditCardForm.controls['firstName'].setValidators([
          Validators.required
        ]);
        this.creditCardForm.controls['lastName'].setValidators([
          Validators.required
        ]);

        this.creditCardForm.controls['companyName'].patchValue(null);
      }

      this.creditCardForm.controls['firstName'].updateValueAndValidity();
      this.creditCardForm.controls['lastName'].updateValueAndValidity();
      this.creditCardForm.controls['companyName'].updateValueAndValidity();
      this.creditCardForm.updateValueAndValidity();
    });

    this.autoPayForm.controls['toggleAutoPay'].valueChanges.subscribe(value => {
      if (value) {
        this.autoPayForm.controls['autoPay'].disable();
        this.suspendSelected = true;
        if (this.fromClient) {
          this.getMatterList('disableSelected');
        }
      } else if (this.autoPayForm.get('autoPay').value == true) {
        this.suspendSelected = false;
        this.autoPayForm.controls['autoPay'].enable();
        this.autoPayDisabled = false;
        if (this.fromClient) {
          this.getMatterList('alreadySelected');
        }
      } else {
        this.autoPayForm.controls['autoPay'].enable();
        this.autoPayDisabled = true;
        this.suspendSelected = false;
        this.clrMatters();
      }

      this.autoPayForm.updateValueAndValidity();
    });

    this.autoPayForm.controls['autoPay'].valueChanges.subscribe(value => {
      if (value) {
        let creditCard = {
          id: this.creditCard ? this.creditCard.id : null,
          autoPay: value
        } as vwCreditCard;

        if (this.createFrom === 'newmatter') {
          this.isValidAutoPay = this.validateNewMatterAutoPay(
            creditCard,
            this.paymentNewMatterComponent
          );
        } else if (this.createFrom === 'create-client') {
          this.isValidAutoPay = this.validateNewClientAutoPay(
            creditCard,
            this.paymentNewClientComponent
          );
        } else {
          this.isValidAutoPay = this.validateAutoPay(
            creditCard,
            this.paymentComponent
          );
          this.autoPayDisabled = false;
        }
      } else {
        this.isValidAutoPay = true;
        this.autoPayDisabled = true;
        this.clrMatters();
      }
      if (this.autoPayDisabled == false && this.fromClient) {
        this.getMatterList('new');
      }
    });

    if (this.primaryAddress && this.primaryAddress.zip) {
      const input = this.primaryAddress.zip;
      const resp:any = await this.placeService.v1PlacesZipcodeInputGet({input})
      .pipe(map(UtilsHelper.mapData))
      .toPromise();
      if(resp.stateFullName) {
        const stateList = []
        resp.stateFullName.forEach((state, index) => stateList.push({name: state, code: resp.state[index]}));
        if (stateList.length) {
          this.primaryState = stateList.find(x => x.code == this.primaryAddress.state);
        }
      }
    }
  }

  checkNumber(event) {
    let k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k == 8 || k == 9;
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    this.formSubmitted = true;

    this.autoPaySelectionsValid =
      (!this.autoPayDisabled && this.selectedMatters.length > 0) ||
      this.autoPayDisabled;

    if ((!this.autoPaySelectionsValid && this.notCreateFrom && this.fromClient) ||this.creditCardForm.invalid || this.addressForm.invalid) {
      return;
    }

    let autoPayForm = this.autoPayForm.getRawValue();

    let ccForm = this.creditCardForm.value;

    let expirationDate = ccForm.expirationDate;
    let month = expirationDate.slice(0, 2);
    let year = expirationDate.slice(-4);

    let expdate = `${month}/${year}`;

    let form = this.addressForm.value;
    if (form.address) {
      form.address = form.address.substring(0,39);
    }
    if (form.address2) {
      form.address2 = form.address2.substring(0,39);
    }

    let creditCardInfo = {
      firstName: ccForm.firstName,
      lastName: ccForm.lastName,
      id: this.creditCard.id,
      cardNumber: ccForm.cardNumber,
      expirationDate: expdate,
      cvv: ccForm.CVV,
      isSameAsPrimary: form.isSameAsPrimary,
      addressId: form.isSameAsPrimary && this.primaryAddress ? this.primaryAddress.id : this.address.id,
      autoPay: this.creditCard.autoPay,
      suspendAutoPay: this.creditCard.suspendAutoPay,
      isCompany: ccForm.isCompany,
      companyName: ccForm.companyName,
      updateToUSIO: true
    } as vwCreditCard;

    let address = {
      isSameAsPrimary: form.isSameAsPrimary,
      id: this.creditCard.id ? this.primaryAddress && form.isSameAsPrimary ? this.primaryAddress.id : this.address.id : null,
      address1: form.address,
      address2: form.address2,
      city: form.city,
      state: String(form.state),
      zipCode: form.zipCode
    };

    creditCardInfo.isSameAsPrimary = address.isSameAsPrimary;

    creditCardInfo.autoPay = autoPayForm.autoPay;
    creditCardInfo.suspendAutoPay = autoPayForm.toggleAutoPay;

    const selectedMatters = this.selectedMatters;

    this.activeModal.close({
      cc: creditCardInfo,
      address: address,
      selectedMatters
    });
  }


  private validateExpiryDate(form: any) {
    let expirationDate = form.expirationDate;
    let isValid = true;

    if (expirationDate) {
      let month = expirationDate.slice(0, 2);
      let year = expirationDate.slice(-4);

      if (
        month > 12 ||
        year <
          new Date()
            .getFullYear()
            .toString()
            .slice(-4) ||
        expirationDate.length < 5
      ) {
        this.toastDisplay.showError(
          this.error_data.credit_card_expiry_date_invalid
        );
        return false;
      } else {
        isValid = true;
      }
    } else {
      this.toastDisplay.showError(
        this.error_data.credit_card_expiry_date_invalid
      );
      return false;
    }

    return isValid;
  }

  private validateCreditCardNumer(form) {
    let creditCardNumber = form.cardNumber;

    let isValid = true;

    if (
      creditCardNumber &&
      (REGEX_DATA.VISA.test(creditCardNumber) ||
        REGEX_DATA.MSTR.test(creditCardNumber) ||
        REGEX_DATA.AMEX.test(creditCardNumber) ||
        REGEX_DATA.DISC.test(creditCardNumber))
    ) {
      isValid = true;
    } else {
      this.toastDisplay.showError(this.error_data.credit_card_notvalid);
      return false;
    }

    return isValid;
  }

  getStates(): void {
    this.miscService.v1MiscStatesGet$Response({}).subscribe(
      (res: any) => {
        this.states = JSON.parse(res.body).results;
      },
      err => {}
    );
  }

  /********** Form Controls Account Details******/
  get f() {
    return this.creditCardForm.controls;
  }

  /******* Form Controls Address Details */
  get a() {
    return this.addressForm.controls;
  }

  getMattersSelected(event: any) {
    this.autoPayMattersTitle = '';
    this.selectedMatters = [];
    if (!event.length) {
      this.autoPayMattersTitle =
        'No matters will auto-pay using this credit card';
    } else {
      this.selectedMatters = this.mattersList.filter(a => a.checked);
      this.autoPayMattersTitle =
      this.selectedMatters.length == this.mattersList.length ? 'All' : this.selectedMatters.length == 0 ? 'No matters will auto-pay using this credit card' : this.selectedMatters.length.toString();
      this.autoPaySelectionsValid = true;
    }
  }

  onMultiSelectSelectedOptions(event: any) {}

  clrMatters() {
    this.selectedMatters = [];
    this.autoPayMattersTitle =
      'No matters will auto-pay using this credit card';
    this.mattersList.forEach(item => (item.checked = false));
  }

  applyMatterFilter(event: any) {}

  autoPay() {}

  getMatterList(type: string) {
    this.disableAll = false;
    let data = {
      clientId: this.clientId,
      paymentMethodId: this.creditCard.id
    };
    this.clientService.v1ClientMatterListForAutoPayClientIdGet(data).subscribe(
      suc => {
        const res: any = suc;
        let mattersList = JSON.parse(res).results;
        mattersList.forEach(matter => {
          matter.name = matter.matterNumber + ' - ' + matter.matterName;
          matter.email = matter.billingType;
          matter.id = matter.matterId;
        });
        let list = [...mattersList];

        if (list.length) {
          this.selectedMatters = [];
          list.forEach(matter => {
            if (matter.isSelected) {
              matter.checked = true;
              this.selectedMatters.push(matter);
            }
          });
        }

        if (type == 'disableSelected') {
          list = this.selectedMatters;
          list.forEach(matter => {
            matter.disabled = true;
          })
          this.disableAll = true;
          this.mattersList = [...list];
        } else {
          this.mattersList = [...list];
        }

        if (this.selectedMatters.length > 0) {
          this.autoPayMattersTitle = this.selectedMatters.length.toString();
        }
      },
      err => {
        console.log(err);
      }
    );
  }

   /***** Get state and city by zip-code ****/
   public getCityState(searchString, isStateCityExist?:boolean)  {
    const input = (searchString || '').trim();
      if(input.length >= 3) {
        this.validZipErr = false;
        if(this.stateCitySubscription)
          this.stateCitySubscription.unsubscribe();

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

              if(isStateCityExist) {
                this.setStateCity();
              } else {
                this.addressForm.controls.state.setValue(this.stateList.length ? this.stateList[0].code : null);
                this.addressForm.controls.city.setValue(this.cityList.length ? this.cityList[0] : null);
              }

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
    this.addressForm.controls.state.setValue(null);
    this.addressForm.controls.city.setValue(null);
    if (input.length > 0 && input.length < 3) {
      this.validZipErr = true;
    }
  }

  /******* set State and City  ******/
  public setStateCity() {
    const state = this.addressForm.get('state').value;
    const city = this.addressForm.get('city').value;
    const stateIndex = this.stateList.findIndex(st => st && st.code && (st.code == state));
    const cityIndex = this.cityList.indexOf(city);
    this.validZipErr = this.stateList.length && this.cityList.length ? false : true;
    this.addressForm.controls.state.setValue(stateIndex > -1 && this.stateList.length ? this.stateList[stateIndex].code : this.stateList[0] && this.stateList[0].code  ? this.stateList[0].code || '' : '');
    this.addressForm.controls.city.setValue(cityIndex > -1 && this.cityList.length ? this.cityList[cityIndex] : this.cityList [0] || '');
    if(this.addressForm.value.isSameAsPrimary){
      this.singleState = stateIndex > -1 && this.stateList.length ? this.stateList[stateIndex].name : this.stateList[0];
    }
  }
}
