import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { debounceTime, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { REGEX_DATA } from 'src/app/modules/shared/const';
import * as errors from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwAddress, vwAddressDetails, vwCreditCard, vwIdCodeName } from 'src/common/swagger-providers/models';
import { MiscService, PlacesService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-add-post-payment-credit-card',
  templateUrl: './add-credit-card.component.html',
  styleUrls: ['./add-credit-card.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class AddPostPaymentCreditCardComponent implements OnInit {
  @Input() primaryAddress: vwAddress;
  @Input() states: Array<vwIdCodeName>;

  address: vwAddress;
  creditCardForm: FormGroup;
  error_data = (errors as any).default;

  @Output() readonly saveCC = new EventEmitter<any>();
  @Output() readonly cancel = new EventEmitter();
  stateCitySubscription: any;
  stateList: any[];
  cityList: any[];
  singleState: any = null;
  primaryState: any;
  formSubmitted: boolean;
  validZipErr: boolean;
  constructor(
    private fb: FormBuilder,
    private toastDisplay: ToastDisplay,
    private miscService: MiscService,
    private placeService: PlacesService
  ) {}

  async ngOnInit() {
    this.creditCardForm = this.fb.group({
      isCompany: [false, Validators.required],
      firstName: [null, Validators.required],
      lastName: [null, Validators.required],
      companyName: [null],
      cardNumber: [null, Validators.required],
      expirationDate: [null, Validators.required],
      CVV: [null, Validators.required],
      isSameAsPrimary: false,
      address: [null, Validators.required],
      address2: null,
      city: [null, Validators.required],
      state: [null, Validators.required],
      zipCode: [null, Validators.required],
      autoPay: false,
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
    this.creditCardForm.controls['isSameAsPrimary'].valueChanges.subscribe(
      (res) => {
        if (res) {
          this.cityList = [];
          this.stateList = [];
          this.creditCardForm.patchValue({
            address: this.primaryAddress.address,
            address2: this.primaryAddress.address2,
            city: this.primaryAddress.city,
            state: (this.primaryState) ? this.primaryState.code: this.primaryAddress.state,
            zipCode: this.primaryAddress.zip,
          });
          if (this.primaryState) {
            this.singleState = this.primaryState.name;
          } else {
            this.getCityState(this.primaryAddress.zip, true)
          };
        } else {
          this.cityList = [];
          this.stateList = [];
          this.singleState = null;
          this.creditCardForm.patchValue({
            address: null,
            address2: null,
            city: null,
            state: null,
            zipCode: null,
          });
        }

        this.creditCardForm.updateValueAndValidity();
      }
    );

    this.creditCardForm.controls['isCompany'].valueChanges.subscribe(
      (value) => {
        if (value) {
          this.creditCardForm.controls['firstName'].clearValidators();
          this.creditCardForm.controls['lastName'].clearValidators();

          this.creditCardForm.controls['firstName'].patchValue(null);
          this.creditCardForm.controls['lastName'].patchValue(null);

          this.creditCardForm.controls['companyName'].setValidators([
            Validators.required,
          ]);
        } else {
          this.creditCardForm.controls['companyName'].clearValidators();
          this.creditCardForm.controls['firstName'].setValidators([
            Validators.required,
          ]);
          this.creditCardForm.controls['lastName'].setValidators([
            Validators.required,
          ]);

          this.creditCardForm.controls['companyName'].patchValue(null);
        }

        this.creditCardForm.controls['firstName'].updateValueAndValidity();
        this.creditCardForm.controls['lastName'].updateValueAndValidity();
        this.creditCardForm.controls['companyName'].updateValueAndValidity();
        this.creditCardForm.updateValueAndValidity();
      }
    );
  }

  close() {
    this.cancel.emit();
  }

  save() {
      this.formSubmitted = true;
      
      if (!this.creditCardForm.valid) {
        return;
      }

      let form = this.creditCardForm.value;

      let isValid = this.validateCreditCardAndExipryDate(form);
      if (isValid) {
        this.saveCreditCard(form);
      }
  }

  private saveCreditCard(form: any) {
    let expirationDate = form.expirationDate;
    let month = expirationDate.slice(0, 2);
    let year = expirationDate.slice(-4);

    let expdate = `${month}/${year}`;

    let creditCardInfo = {
      firstName: form.firstName,
      lastName: form.lastName,
      isCompany: form.isCompany,
      companyName: form.companyName,
      id: 0,
      cardNumber: form.cardNumber,
      autoPay: false,
      suspendAutoPay: false,
      isSameAsPrimary: form.isSameAsPrimary,
      expirationDate: expdate,
      cvv: form.CVV,
    } as vwCreditCard;

    let address = {
      address1: form.address,
      address2: form.address2,
      city: form.city,
      state: String(form.state),
      zipCode: form.zipCode,
    } as vwAddressDetails;

    if (creditCardInfo.isSameAsPrimary) {
      address.id = this.primaryAddress.id;
    }

    creditCardInfo.addressId = address.id;

    this.saveCC.emit({
      creditCardInfo: creditCardInfo,
      address: address,
    });
  }

  private validateCreditCardAndExipryDate(form: any) {
    let creditCardNumber = form.cardNumber;
    let expirationDate = form.expirationDate;

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
      let month = expirationDate.slice(0, 2);
      let year = expirationDate.slice(-4);

      if (
        month > 12 ||
        year < new Date().getFullYear().toString().slice(-4) ||
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

  /***** Get state and city by zip-code ****/
  public getCityState(searchString, isStateCityExist?:boolean)  {
    const input = (searchString || '').trim();
    if(this.stateCitySubscription){
      this.stateCitySubscription.unsubscribe();
    } 
    if(input.length >= 3) {
      this.validZipErr = false;
        this.stateList = [];
        this.cityList = [];
        this.singleState = null;
        this.stateCitySubscription =  this.placeService.v1PlacesZipcodeInputGet({input})
        .pipe(debounceTime(500), map(UtilsHelper.mapData))
        .subscribe((res) => {
          if(res) {
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
  get f() {
    return this.creditCardForm.controls;
  }
}
