import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { debounceTime, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { ClientPaymentMethodComponent } from 'src/app/modules/client/creating/billing-info/client-payment-method/client-payment-method.component';
import { PaymentPlanModel } from 'src/app/modules/models/payment-model';
import * as errors from 'src/app/modules/shared/error.json';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { vwAddress, vwAddressDetails, vwCreditCard, vwIdCodeName } from 'src/common/swagger-providers/models';
import { ClientService, MiscService, PlacesService } from 'src/common/swagger-providers/services';
import { REGEX_DATA } from '../../../const';
import { UtilsHelper } from '../../../utils.helper';
import { NewBillingPaymentMethodComponent } from '../../new-payment-method/new-payment-method.component';
import { PaymentMethodCreateMatterComponent } from '../../payment-method-create-matter/payment-method-create-matter.component';
import { PaymentMethodNewWizardComponent } from '../../payment-method-new-wizard/payment-method-new-wizard.component';
import { BillingPaymentMethodComponent } from '../payment-method.component';

@Component({
  selector: 'app-add-credit-card',
  templateUrl: './add-credit-card.component.html',
  styleUrls: ['./add-credit-card.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddCreditCardComponent implements OnInit {
  primaryAddress: vwAddress;
  creditCard: vwCreditCard;
  states: Array<vwIdCodeName>;
  paymentPlanList: Array<PaymentPlanModel>;

  address: vwAddress;
  creditCardForm: FormGroup;
  error_data = (errors as any).default;
  toggleAutopay = false;

  paymentComponent: BillingPaymentMethodComponent | NewBillingPaymentMethodComponent;
  paymentMatterComponent: PaymentMethodCreateMatterComponent;
  paymentNewMatterComponent: PaymentMethodNewWizardComponent;
  validateAutoPay: (
    e: vwCreditCard,
    c: BillingPaymentMethodComponent | NewBillingPaymentMethodComponent
  ) => boolean;
  validateMatterAutoPay: (
    e: vwCreditCard,
    c: PaymentMethodCreateMatterComponent
  ) => boolean;
  validateNewMatterAutoPay: (
    e: vwCreditCard,
    c: PaymentMethodNewWizardComponent
  ) => boolean;
  createFrom: string;
  isValidAutoPay = true;
  public autopay_warning: string;
  formSubmitted = false;

  paymentNewClientComponent: ClientPaymentMethodComponent;
  validateNewClientAutoPay: (e: vwCreditCard, c: ClientPaymentMethodComponent) => boolean;

  public autoPayMattersTitle: string =
    'No matters will auto-pay using this credit card';
  public selectedMatters: Array<any> = [];
  public mattersList: Array<any> = [];
  public autoPayDisabled: boolean = true;
  public clientId: number;
  public autoPaySelectionsValid: boolean = true;
  public notCreateFrom: boolean;
  stateCitySubscription: any;
  stateList: any[];
  cityList: any[];
  singleState: any;
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
    private placeService: PlacesService,
  ) {
    this.creditCard = {
      firstName: '',
      lastName: '',
      companyName: '',
      cardNumber: '',
      cvv: '',
      expirationDate: ''
    };
  }

  async ngOnInit() {
    if (this.createFrom == undefined) {
      this.notCreateFrom = true;
    }
    this.route.queryParams.subscribe(params => {
      this.clientId = +params['clientId']
    });
    this.autopay_warning = this.error_data.activ_auto_pay_warning;
    // this.getStates();
    this.creditCardForm = this.fb.group({
      isCompany: [false, Validators.required],
      firstName: [this.creditCard.firstName, [Validators.required, PreventInject]],
      lastName: [this.creditCard.lastName, [Validators.required, PreventInject]],
      companyName: [this.creditCard.companyName, PreventInject],
      cardNumber: [null, Validators.required],
      expirationDate: [null, Validators.required],
      CVV: [null, Validators.required],
      isSameAsPrimary: false,
      address: [null, [Validators.required, PreventInject]],
      address2: [null, PreventInject],
      city: [null, [Validators.required, PreventInject]],
      state: [null, Validators.required],
      zipCode: [null, Validators.required],
      autoPay: false
    });

    if (this.paymentPlanList && this.paymentPlanList.length > 0) {
      this.creditCardForm.controls.autoPay.disable();
    }

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

    this.creditCardForm.controls.autoPay.valueChanges.subscribe(value => {
      if (value) {
        const creditCard = {
          id: this.creditCard ? this.creditCard.id : null,
          autoPay: value
        } as vwCreditCard;
        if (this.createFrom === 'creatematter') {
          this.isValidAutoPay = this.validateMatterAutoPay(
            creditCard,
            this.paymentMatterComponent
            );
        } else if (this.createFrom === 'newmatter') {
          this.isValidAutoPay = this.validateNewMatterAutoPay(creditCard, this.paymentNewMatterComponent);
        } else if (this.createFrom === 'create-client') {
          this.isValidAutoPay = this.validateNewClientAutoPay(creditCard, this.paymentNewClientComponent);
        } else {
            this.isValidAutoPay = this.validateAutoPay(
              creditCard,
              this.paymentComponent
            );
            this.autoPayDisabled = false
        }
      } else {

        this.isValidAutoPay = true;
        this.autoPayDisabled = true;
      }
      if (this.autoPayDisabled == false) {

        this.getMatterList();
      }
    });
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    this.formSubmitted = true;

    if (!this.creditCardForm.valid) {
      return;
    }

    this.autoPaySelectionsValid = (!this.isValidAutoPay && this.selectedMatters.length > 0 || this.isValidAutoPay) ? true : false;
    if (!this.autoPaySelectionsValid) {
      if (this.notCreateFrom && this.clientId) {
        return;
      }
    }

    const form = this.creditCardForm.value;
    if (form.address) {
      form.address = form.address.substring(0,39);
    }
    if (form.address2) {
      form.address2 = form.address2.substring(0,39);
    }
    const isValid = this.validateCreditCardAndExipryDate(form);
    if (isValid) {
      this.saveCreditCard(form);
    }
  }

  private saveCreditCard(form: any) {
    const expirationDate = form.expirationDate;
    const month = expirationDate.slice(0, 2);
    const year = expirationDate.slice(-4);

    const expdate = `${month}/${year}`;

    const creditCardInfo = {
      firstName: form.firstName,
      lastName: form.lastName,
      isCompany: form.isCompany,
      companyName: form.companyName,
      id: this.creditCard.id,
      cardNumber: form.cardNumber,
      autoPay: this.toggleAutopay ? false : form.autoPay,
      isSameAsPrimary: form.isSameAsPrimary,
      expirationDate: expdate,
      cvv: form.CVV
    } as vwCreditCard;

    const address = {
      id: this.creditCard.id ? this.address.id : null,
      address1: form.address,
      address2: form.address2,
      city: form.city,
      state: String(form.state),
      zipCode: form.zipCode
    } as vwAddressDetails;

    if (creditCardInfo.isSameAsPrimary) {
      address.id = this.primaryAddress.id;
    } else {
      if (this.creditCard.isSameAsPrimary) {
        address.id = null;
      }
    }

    creditCardInfo.addressId = address.id;

    const selectedMatters = this.selectedMatters

    this.activeModal.close({
      creditCardInfo,
      address,
      selectedMatters
    });
  }

  private validateCreditCardAndExipryDate(form: any) {
    const creditCardNumber = form.cardNumber;
    const expirationDate = form.expirationDate;

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

    if (expirationDate) {
      const month = expirationDate.slice(0, 2);
      const year = expirationDate.slice(-4);

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

  getStates(): void {
    this.miscService.v1MiscStatesGet$Response({}).subscribe(
      (res: any) => {
        this.states = JSON.parse(res.body).results;
      },
      err => {}
    );
  }

  personal() {
    this.creditCardForm.controls.companyName.clearValidators();
    this.creditCardForm.controls.firstName.setValidators([
      Validators.required, PreventInject
    ]);
    this.creditCardForm.controls.lastName.setValidators([
      Validators.required, PreventInject
    ]);

    this.creditCardForm.controls.companyName.patchValue(null);

    this.creditCardForm.controls.firstName.updateValueAndValidity();
    this.creditCardForm.controls.lastName.updateValueAndValidity();
    this.creditCardForm.controls.companyName.updateValueAndValidity();
    this.creditCardForm.updateValueAndValidity();
  }

  company() {
    this.creditCardForm.controls.firstName.clearValidators();
    this.creditCardForm.controls.lastName.clearValidators();

    this.creditCardForm.controls.firstName.patchValue(null);
    this.creditCardForm.controls.lastName.patchValue(null);

    this.creditCardForm.controls.companyName.setValidators([
      Validators.required, PreventInject
    ]);
    this.creditCardForm.controls.firstName.updateValueAndValidity();
    this.creditCardForm.controls.lastName.updateValueAndValidity();
    this.creditCardForm.controls.companyName.updateValueAndValidity();
    this.creditCardForm.updateValueAndValidity();
  }

  sameAsPrimary() {
    if (this.creditCardForm.value.isSameAsPrimary) {
      this.stateList = [];
      this.cityList = [];
      this.singleState = null;
      this.creditCardForm.patchValue({
        address: this.primaryAddress.address,
        address2: this.primaryAddress.address2,
        city: this.primaryAddress.city,
        state: this.primaryState ? this.primaryState.code : this.primaryAddress.state,
        zipCode: this.primaryAddress.zip
      });
      if (this.primaryState) {
        this.singleState = this.primaryState.name;
      } else {
        this.getCityState(this.primaryAddress.zip, true);
      }
    } else {
      this.creditCardForm.patchValue({
        address: null,
        address2: null,
        city: null,
        state: null,
        zipCode: null
      });
      this.singleState = null;
    }
    this.creditCardForm.updateValueAndValidity();
  }

  /********** Form Controls ******/
  get f() {
    return this.creditCardForm.controls;
  }

  getMattersSelected(event: any) {
    this.autoPayMattersTitle = '';
    this.selectedMatters = [];
    if (!event.length) {
      this.autoPayMattersTitle =
        'No matters will auto-pay using this credit card';
    } else {
      this.selectedMatters = event;
      this.autoPayMattersTitle =
        event.length == this.mattersList.length ? 'All' : event.length;
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

  autoPay() {
  }

  getMatterList() {
    if (this.clientId > 0) {
      let data = {
        clientId: this.clientId,
        paymentMethodId: 0
      };
      this.clientService.v1ClientMatterListForAutoPayClientIdGet(data).subscribe(
        suc => {
          const res: any = suc;
          let mattersList = JSON.parse(res).results;
          mattersList.forEach(matter => {
            matter.name = matter.matterNumber + ' - ' + matter.matterName;
            matter.email = matter.billingType;
            matter.id = matter.matterId;
          })
          this.mattersList = [...mattersList]
        },
        err => {
          console.log(err);
        }
      );
    }
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
              this.creditCardForm.controls.state.setValue(this.stateList.length ? this.stateList[0].code : null);
              this.creditCardForm.controls.city.setValue(this.cityList.length ? this.cityList[0] : null);
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
    this.creditCardForm.controls.state.setValue(null);
    this.creditCardForm.controls.city.setValue(null);
    if (input.length > 0 && input.length < 3) {
      this.validZipErr = true;
    }
  }

  /******* set State and City  ******/
  public setStateCity() {
    const state = this.creditCardForm.get('state').value;
    const city = this.creditCardForm.get('city').value;
    const stateIndex = this.stateList.findIndex(st => st && st.code && (st.code == state));
    const cityIndex = this.cityList.indexOf(city);
    this.validZipErr = this.stateList.length && this.cityList.length ? false : true;
    this.creditCardForm.controls.state.setValue(stateIndex > -1 && this.stateList.length ? this.stateList[stateIndex].code : this.stateList[0] && this.stateList[0].code  ? this.stateList[0].code || '' : '');
    this.creditCardForm.controls.city.setValue(cityIndex > -1 && this.cityList.length ? this.cityList[cityIndex] : this.cityList [0] || '');
  }

  /***** Validates zip code ****/
  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k === 8 || k === 9;
  }
}
