import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as errors from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { vwAddress, vwAddressDetails, vwBillingSettings, vwECheck, vwIdCodeName } from 'src/common/swagger-providers/models';
import { MiscService, PlacesService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-add-post-payment-echeck',
  templateUrl: './add-echeck.component.html',
  styleUrls: ['./add-echeck.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddPostPaymentEcheckComponent implements OnInit {
  @Input() primaryAddress: vwAddress;
  @Input() states: Array<vwIdCodeName>;

  request: Subscription;
  echeckform: FormGroup;
  error_data = (errors as any).default;
  bankName: string;
  address: vwAddress;
  billingSettings: vwBillingSettings;
  public formSubmitted: boolean = false;

  @Output() readonly saveEcheck = new EventEmitter<any>();
  @Output() readonly cancel = new EventEmitter();
  stateCitySubscription: any;
  stateList: any[];
  cityList: any[];
  singleState: any;
  validZipErr = false;
  primaryState: any;

  constructor(
    private fb: FormBuilder,
    private tostr: ToastDisplay,
    private miscService: MiscService,
    private placeService: PlacesService
  ) {}

  async ngOnInit() {
    
    this.echeckform = this.fb.group({
      firstName: [null, [Validators.required, PreventInject]],
      lastName: [null, [Validators.required, PreventInject]],
      accountNumber: [null, [Validators.required, Validators.minLength(12)]],
      routingNumber: [null, [Validators.required, Validators.minLength(9)]],
      isSameAsPrimary: false,
      address: [null, [Validators.required, PreventInject]],
      address2: [null, PreventInject],
      city: [null, [Validators.required, PreventInject]],
      state: [null, Validators.required],
      zipCode: [null, Validators.required],
      autoPay: false
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
    this.echeckform.controls['isSameAsPrimary'].valueChanges.subscribe(res => {
      if (res) {
        this.stateList = [];
        this.cityList = [];
        this.singleState = null;
        this.validZipErr = false;
        this.echeckform.patchValue({
          address: this.primaryAddress.address,
          address2: this.primaryAddress.address2,
          city: this.primaryAddress.city,
          state: (this.primaryState) ? this.primaryState.code: this.primaryAddress.state,
          zipCode: this.primaryAddress.zip
        });
        if (this.primaryState) {
          this.singleState = this.primaryState.name;
        } else {
          this.getCityState(this.primaryAddress.zip, true)
        };
      } else {
        this.singleState = null;
        this.stateList = [];
        this.cityList = [];
        this.echeckform.patchValue({
          address: null,
          address2: null,
          city: null,
          state: null,
          zipCode: null
        });
      }
    });

    this.echeckform.controls['routingNumber'].valueChanges.subscribe(value => {
      if (value && value.length == 9) {
        this.getBankName(value);
      } else {
        this.bankName = null;
      }
    });
  }

  private getBankName(routingNumber: string) {
    this.bankName = null;

    if (this.request) {
      this.request.unsubscribe();
    }

    this.request = this.miscService
      .v1MiscRoutingInfoGet$Response({ routingNumber: routingNumber })
      .subscribe(
        res => {
          const bank = JSON.parse(res.body as any).results;
          this.bankName = bank.customer_name;
        },
        () => {
          this.bankName = null;
        }
      );
  }

  close() {
    this.cancel.emit();
  }

  save() {
    this.formSubmitted = true;
    if (this.echeckform.valid) {
      let eCheckInfo = {
        firstName: this.echeckform.value.firstName,
        lastName: this.echeckform.value.lastName,
        id: this.echeckform.value.id,
        accountNumber: this.echeckform.value.accountNumber,
        autoPay: false,
        suspendAutoPay: false,
        isSameAsPrimary: this.echeckform.value.isSameAsPrimary,
        routingNumber: this.echeckform.value.routingNumber,
        state: this.echeckform.value.state
      } as vwECheck;

      let address: vwAddressDetails = {
        address1: this.echeckform.value.address,
        address2: this.echeckform.value.address2,
        city: this.echeckform.value.city,
        state: String(this.echeckform.value.state),
        zipCode: this.echeckform.value.zipCode
      };

      if (eCheckInfo.isSameAsPrimary) {
        console.log(this.primaryAddress.id);
        address.id = this.primaryAddress.id;
      }

      eCheckInfo.addressId = address.id;

      this.saveEcheck.emit({
        echeckInfo: eCheckInfo,
        address: address
      });
    } else {
      return;
    }
  }

  /***** Get state and city by zip-code ****/
  public getCityState(searchString, isStateCityExist?:boolean)  {
    const input = (searchString || '').trim();
    if(this.stateCitySubscription) 
      this.stateCitySubscription.unsubscribe();
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
            if(this.stateList.length == 1)
              this.singleState = this.stateList[0].name;

              if(isStateCityExist) {
                this.setStateCity();
              } else {
                this.echeckform.controls.state.setValue(this.stateList.length ? this.stateList[0].code : null);
                this.echeckform.controls.city.setValue(this.cityList.length ? this.cityList[0] : null);
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
    this.echeckform.controls.state.setValue(null);
    this.echeckform.controls.city.setValue(null);
    if (input.length > 0 && input.length < 3) {
      this.validZipErr = true;
    }
  }

  /******* set State and City  ******/
  public setStateCity() {
    const state = this.echeckform.get('state').value;
    const city = this.echeckform.get('city').value;
    const stateIndex = this.stateList.findIndex(st => st && st.code && (st.code == state));
    const cityIndex = this.cityList.indexOf(city);
    this.echeckform.controls.state.setValue(stateIndex > -1 && this.stateList.length ? this.stateList[stateIndex].code : this.stateList[0] && this.stateList[0].code  ? this.stateList[0].code || '' : '');
    this.echeckform.controls.city.setValue(cityIndex > -1 && this.cityList.length ? this.cityList[cityIndex] : this.cityList [0] || '');
  }

  /***** Validates zip code ****/
  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k === 8 || k === 9;
  }
}
