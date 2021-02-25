import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { ClientPaymentMethodComponent } from 'src/app/modules/client/creating/billing-info/client-payment-method/client-payment-method.component';
import { PaymentPlanModel } from 'src/app/modules/models/payment-model';
import * as errors from 'src/app/modules/shared/error.json';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { vwAddress, vwAddressDetails, vwBillingSettings, vwECheck, vwIdCodeName } from 'src/common/swagger-providers/models';
import { ClientService, MiscService, PlacesService } from 'src/common/swagger-providers/services';
import { UtilsHelper } from '../../../utils.helper';
import { NewBillingPaymentMethodComponent } from '../../new-payment-method/new-payment-method.component';
import { PaymentMethodCreateMatterComponent } from '../../payment-method-create-matter/payment-method-create-matter.component';
import { PaymentMethodNewWizardComponent } from '../../payment-method-new-wizard/payment-method-new-wizard.component';
import { BillingPaymentMethodComponent } from '../payment-method.component';

@Component({
  selector: 'app-add-echeck',
  templateUrl: './add-echeck.component.html',
  styleUrls: ['./add-echeck.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddEcheckComponent implements OnInit {
  echeck: vwECheck;
  request: Subscription;
  echeckform: FormGroup;
  error_data = (errors as any).default;
  displayautopaymsg: boolean = false;
  bankName: string = null;
  toggleAutopay: boolean = false;
  editSuspendMode: boolean = false;
  primaryAddress: vwAddress;
  address: vwAddress;
  states: Array<vwIdCodeName>;
  billingSettings: vwBillingSettings;
  paymentPlanList: Array<PaymentPlanModel>;

  paymentMatterComponent: PaymentMethodCreateMatterComponent;
  validateMatterAutoPay: (e: vwECheck, c: PaymentMethodCreateMatterComponent) => boolean;

  createFrom: string;

  paymentComponent: BillingPaymentMethodComponent | NewBillingPaymentMethodComponent;
  validateAutoPay: (e: vwECheck, c: BillingPaymentMethodComponent | NewBillingPaymentMethodComponent) => boolean;

  paymentNewMatterComponent: PaymentMethodNewWizardComponent;
  validateNewMatterAutoPay: (e: vwECheck, c: PaymentMethodNewWizardComponent) => boolean;

  paymentNewClientComponent: ClientPaymentMethodComponent;
  validateNewClientAutoPay: (e: vwECheck, c: ClientPaymentMethodComponent) => boolean;

  isValidAutoPay: boolean = true;
  public autopay_warning: string;
  formSubmitted: boolean;
  public autoPayMattersTitle: string =
    'No matters will auto-pay using this e-check';
  public selectedMatters: Array<any> = [];
  public mattersList: Array<any> = [];
  public autoPayDisabled: boolean = true;
  public clientId: number;
  public autoPaySelectionsValid: boolean = true;
  public notCreateFrom: boolean;
  stateCitySubscription: Subscription;
  stateList: any[] = [];
  cityList: any[] = [];
  singleState: any = null;
  validZipErr = false;
  primaryState:any
  isPotentialClient = false;

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private tostr: ToastDisplay,
    private miscService: MiscService,
    private clientService: ClientService,
    private route: ActivatedRoute,
    private placeService: PlacesService
  ) {
    this.echeck = {} as vwECheck;
  }

  async ngOnInit() {
    if (this.createFrom == undefined) {
      this.notCreateFrom = true;
    }
    this.route.queryParams.subscribe(params => {
      this.clientId = +params['clientId'];
    });
    this.autopay_warning = this.error_data.activ_auto_pay_warning;
    // this.getStates();
    if (this.echeck.id) {
      this.echeckform = this.fb.group({
        firstName: [this.echeck.firstName, [Validators.required, PreventInject]],
        lastName: [this.echeck.lastName, [Validators.required, PreventInject]],
        accountNumber: [
          this.echeck.accountNumber,
          [Validators.required, Validators.minLength(12)]
        ],
        routingNumber: [
          this.echeck.routingNumber,
          [Validators.required, Validators.minLength(9)]
        ],
        isSameAsPrimary: this.echeck.isSameAsPrimary,
        address: [this.address.address, [Validators.required, PreventInject]],
        address2: [this.address.address2, PreventInject],
        city: [this.address.city, [Validators.required, PreventInject]],
        state: [this.address.state, Validators.required],
        zipCode: [this.address.zip, Validators.required],
        autoPay: this.echeck.autoPay
      });
      if (this.echeck.autoPay) {
        this.displayautopaymsg = true;
        this.editSuspendMode = true;
      }
      this.getBankName(this.echeckform.value.routingNumber);
    } else {
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
    }

    if (this.paymentPlanList && this.paymentPlanList.length > 0) {
      this.echeckform.controls['autoPay'].disable();
    }

    this.echeckform.controls['isSameAsPrimary'].valueChanges.subscribe(res => {
      if (res) {
        this.stateList = [];
        this.cityList = [];
        this.singleState = null;
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
        if (this.echeck.id) {
          this.stateList = [];
          this.cityList= [];
          this.singleState = null;
          this.echeckform.patchValue({
            address: this.address.address,
            address2: this.address.address2,
            city: this.address.city,
            state: this.address.state,
            zipCode: this.address.zip
          });
          // this.singleState = this.address.state;
          this.getCityState(this.address.zip, true);
        } else {
          this.echeckform.patchValue({
            address: null,
            address2: null,
            city: null,
            state: null,
            zipCode: null
          });
          this.singleState = null;
        }
      }
    });


    this.echeckform.controls['routingNumber'].valueChanges.subscribe(value => {
    });

    this.echeckform.controls['autoPay'].valueChanges.subscribe(value => {
      if (value) {
        let eCheckInfo = {
          id: this.echeck ? this.echeck.id : null,
          autoPay: value
        } as vwECheck;
        if (this.createFrom === 'creatematter') {
          this.isValidAutoPay = this.validateMatterAutoPay(eCheckInfo, this.paymentMatterComponent);
        } else if (this.createFrom === 'newmatter') {
          this.isValidAutoPay = this.validateNewMatterAutoPay(eCheckInfo, this.paymentNewMatterComponent);
        } else if (this.createFrom === 'create-client') {
          this.isValidAutoPay = this.validateNewClientAutoPay(eCheckInfo, this.paymentNewClientComponent);
        } else {
          this.isValidAutoPay = this.validateAutoPay(eCheckInfo, this.paymentComponent);
          this.autoPayDisabled = false;
        }
      } else {
        this.isValidAutoPay = true;
        this.autoPayDisabled = true;
      }
      if (this.autoPayDisabled == false) {
        this.getMatterList();
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

  getStates(): void {
    this.miscService.v1MiscStatesGet$Response({}).subscribe(
      (res: any) => {
        this.states = JSON.parse(res.body).results;
      },
      err => {}
    );
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
    this.activeModal.close(null);
  }

  save() {
    this.formSubmitted = true;
    if (this.echeckform.invalid) {
      return;
    }
    this.autoPaySelectionsValid = (!this.isValidAutoPay && this.selectedMatters.length > 0 || this.isValidAutoPay) ? true : false;
    if (!this.autoPaySelectionsValid) {
      if (this.notCreateFrom && this.clientId) {
        return;
      }
    }
    this.echeckform.patchValue({
      autoPay: this.toggleAutopay ? false : this.echeckform.value.autoPay
    });

    let eCheckInfo = {
      firstName: this.echeckform.value.firstName,
      lastName: this.echeckform.value.lastName,
      id: this.echeckform.value.id,
      accountNumber: this.echeckform.value.accountNumber,
      autoPay: this.toggleAutopay ? false : this.echeckform.value.autoPay,
      isSameAsPrimary: this.echeckform.value.isSameAsPrimary,
      routingNumber: this.echeckform.value.routingNumber,
      state: this.echeckform.value.state
    } as vwECheck;

    let address = {
      id: this.echeck.id ? this.address.id : null,
      address1: this.echeckform.value.address,
      address2: this.echeckform.value.address2,
      city: this.echeckform.value.city,
      state: String(this.echeckform.value.state),
      zipCode: this.echeckform.value.zipCode
    } as vwAddressDetails;

    if (eCheckInfo.isSameAsPrimary) {
      address.id = this.primaryAddress.id;
    } else {
      if (this.echeck.isSameAsPrimary) {
        address.id = null;
      }
    }

    eCheckInfo.addressId = address.id;

    const selectedMatters = this.selectedMatters;

    this.activeModal.close({
      echeckInfo: eCheckInfo,
      address: address,
      selectedMatters
    });
  }

  toggleAutoPay(type?: string) {
    if (this.toggleAutopay) {
      this.echeckform.controls['autoPay'].disable();
    } else {
      this.echeckform.controls['autoPay'].enable();
    }
  }

  /******* Form Controls ********/
  get f() {
    return this.echeckform.controls;
  }

  getMattersSelected(event: any) {
    this.autoPayMattersTitle = '';
    this.selectedMatters = [];
    if (!event.length) {
      this.autoPayMattersTitle =
        'No matters will auto-pay using this e-check';
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
      'No matters will auto-pay using this e-check';
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
    this.validZipErr = this.stateList.length && this.cityList.length ? false : true;
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
