import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { debounceTime, map } from 'rxjs/operators';
import { AddressFormError } from 'src/app/modules/models/fillable-form.model';
import * as errorData from 'src/app/modules/shared/error.json';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { vwAddressDetails, vwIdCodeName } from 'src/common/swagger-providers/models';
import { PlacesService } from 'src/common/swagger-providers/services';
import { UtilsHelper } from '../../utils.helper';

@Component({
  selector: 'app-edit-invoice-address',
  templateUrl: './edit-invoice-address.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class EditInvoiceAddressComponent implements OnInit {
  address: vwAddressDetails;
  primaryAddress: vwAddressDetails;
  changeNotes: string;
  isSameAsPrimaryAddress = false;

  stateList: Array<vwIdCodeName>;

  addressForm: FormGroup;
  addressFormError: AddressFormError;
  public errorData: any = (errorData as any).default;
  addressFormVisible: boolean = false;
  validZipErr: boolean;
  cityList: any[];
  singleState: any;
  formSubmitted: boolean = false;
  stateCitySubscription: any;
  primaryState: any;
  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder,
    private placeService: PlacesService) {
    this.address = {};
    this.addressFormError = new AddressFormError();
  }

  async ngOnInit() {
    if (this.isSameAsPrimaryAddress) {
      const code = (this.primaryState) ? this.primaryState.code: this.primaryAddress.state;
      const primaryAdd = this.primaryAddress.address1 ? this.primaryAddress.address1.substring(0, 39): this.primaryAddress.address1;
      const primaryAdd2 = this.primaryAddress.address2 ? this.primaryAddress.address2.substring(0, 39): this.primaryAddress.address2;
      this.addressForm = this.fb.group({
        id: this.address.id,
        isSameAsPrimaryAddress: this.isSameAsPrimaryAddress,
        address1: [
          primaryAdd,
          [Validators.required, PreventInject]
        ],
        address2: [primaryAdd2, PreventInject],
        city: [this.primaryAddress.city, [Validators.required, PreventInject]],
        state: [code, Validators.required],
        zipCode: [this.primaryAddress.zipCode, Validators.required],
        changeNotes: [null, PreventInject]
      });
      this.singleState = (this.primaryState) ? this.primaryState.name: this.primaryAddress.state;
      this.getCityState(this.primaryAddress.zipCode, true);
    } else {
      const primaryAdd = this.address.address1 ? this.address.address1.substring(0, 39): this.address.address1;
      const primaryAdd2 = this.address.address2 ? this.address.address2.substring(0, 39): this.address.address2;
      this.addressForm = this.fb.group({
        id: this.address.id,
        isSameAsPrimaryAddress: this.isSameAsPrimaryAddress,
        address1: [primaryAdd, [Validators.required, PreventInject]],
        address2: [primaryAdd2, PreventInject],
        city: [this.address.city, [Validators.required, PreventInject]],
        state: [this.address.state, Validators.required],
        zipCode: [this.address.zipCode, Validators.required],
        changeNotes: [null, PreventInject]
      });
      this.singleState = this.address.state;
      this.getCityState(this.address.zipCode, true)
    }
    if (this.address && this.address.zipCode) {
      const input = this.address.zipCode;
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

  public sameAsPrimary(event) {
    if(this.addressForm.value && this.addressForm.value.isSameAsPrimaryAddress){
    let address =  this.primaryAddress ? this.primaryAddress : this.address;
    if (address) {
      if(address.zipCode){
        this.getCityState(address.zipCode, true);
      }
      this.addressForm.patchValue({
        id: this.address.id,
        address1: address.address1,
        address2: address.address2,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        changeNotes: null
      });
    }
  }
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    this.formSubmitted = true;
    let data = { ...this.addressForm.value };

    if (!data.address1) {
      this.addressFormError.address = true;
      this.addressFormError.addressMessage = this.errorData.address_error
    } else if (data.address1 && this.addressForm.controls.address1.invalid) {
      this.addressFormError.address = true;
      this.addressFormError.addressMessage = this.errorData.insecure_input
    } else {
      this.addressFormError.address = false;
    }

    if (data.address2 && this.addressForm.controls.address2.invalid) {
      this.addressFormError.address2 = true;
      this.addressFormError.address2Message = this.errorData.insecure_input
    } else {
      this.addressFormError.address2 = false;
    }

    if (!data.city) {
      this.addressFormError.city = true;
      this.addressFormError.cityMessage = this.errorData.city_error
    } else if (data.city && this.addressForm.controls.city.invalid) {
      this.addressFormError.city = true;
      this.addressFormError.cityMessage = this.errorData.insecure_input
    } else {
      this.addressFormError.city = false;
    }

    if (!data.state) {
      this.addressFormError.state = true;
      this.addressFormError.stateMessage = this.errorData.state_error
    } else {
      this.addressFormError.state = false;
    }

    if (!data.zipCode || this.validZipErr) {
      this.addressFormError.zipCode = true;
      // this.addressFormError.zipCodeMessage = this.errorData.zip_code_error
    } else {
      this.addressFormError.zipCode = false;
    }

    if (data.changeNotes && this.addressForm.controls.changeNotes.invalid) {
      this.addressFormError.notes = true;
      this.addressFormError.notesMessage = this.errorData.insecure_input
    } else {
      this.addressFormError.notes = false;
    }

    if (this.addressFormError.hasError()) {
      return;
    }
    this.activeModal.close(this.addressForm.value);
  }

  public getCityState(searchString, isStateCityExist?) {
    const input = (searchString || '').trim();
    if(this.stateCitySubscription){
      this.stateCitySubscription.unsubscribe();
    }
    if(input.length >= 3) {
      this.validZipErr = false;
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
            if(this.stateList.length == 1){
              this.singleState = this.stateList[0].name;
            }
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

  public setStateCity() {
    const state = this.addressForm.get('state').value;
    const city = this.addressForm.get('city').value;
    const stateIndex = this.stateList.findIndex(st => st && st.code && (st.code == state));
    const cityIndex = this.cityList.indexOf(city);
    this.validZipErr = this.stateList.length && this.cityList.length ? false : true;
    this.addressForm.controls.state.setValue(stateIndex > -1 && this.stateList.length ? this.stateList[stateIndex].code : this.stateList[0] && this.stateList[0].code  ? this.stateList[0].code || '' : '');
    this.addressForm.controls.city.setValue(cityIndex > -1 && this.cityList.length ? this.cityList[cityIndex] : this.cityList[0] || '');
    if(this.addressForm.value.isSameAsPrimary){
      this.singleState = stateIndex > -1 && this.stateList.length ? this.stateList[stateIndex].name : this.stateList[0];
    }
  }
}
