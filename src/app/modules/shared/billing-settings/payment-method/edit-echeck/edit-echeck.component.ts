import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { ClientPaymentMethodComponent } from 'src/app/modules/client/creating/billing-info/client-payment-method/client-payment-method.component';
import { ECheckFormError } from 'src/app/modules/models/fillable-form.model';
import { PaymentPlanModel } from 'src/app/modules/models/payment-model';
import * as errors from 'src/app/modules/shared/error.json';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { vwAddress, vwBillingSettings, vwECheck, vwIdCodeName } from 'src/common/swagger-providers/models';
import { ClientService, MiscService, PlacesService } from 'src/common/swagger-providers/services';
import { UtilsHelper } from '../../../utils.helper';
import { NewBillingPaymentMethodComponent } from '../../new-payment-method/new-payment-method.component';
import { PaymentMethodNewWizardComponent } from '../../payment-method-new-wizard/payment-method-new-wizard.component';
import { BillingPaymentMethodComponent } from '../payment-method.component';

@Component({
  selector: 'app-edit-echeck',
  templateUrl: './edit-echeck.component.html',
  styleUrls: ['./edit-echeck.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class EditEcheckComponent implements OnInit {
  echeck: vwECheck;
  request: Subscription;
  error_data = (errors as any).default;
  displayautopaymsg: boolean = false;
  bankName: string;
  editSuspendMode: boolean = false;
  primaryAddress: vwAddress;
  address: vwAddress;
  states: Array<vwIdCodeName>;
  billingSettings: vwBillingSettings;
  paymentPlanList: Array<PaymentPlanModel>;

  paymentComponent: BillingPaymentMethodComponent | NewBillingPaymentMethodComponent;
  validateAutoPay: (e: vwECheck, c: BillingPaymentMethodComponent | NewBillingPaymentMethodComponent) => boolean;
  paymentNewMatterComponent: PaymentMethodNewWizardComponent;
  validateNewMatterAutoPay: (
    e: vwECheck,
    c: PaymentMethodNewWizardComponent
  ) => boolean;
  isValidAutoPay: boolean = true;

  showSection1 = true;
  showSection2 = false;
  showSection3 = false;

  echeckform: FormGroup;
  addressForm: FormGroup;
  autoPayForm: FormGroup;
  public autopay_warning: string;
  eCheckFormError: ECheckFormError;
  createFrom: string;
  paymentNewClientComponent: ClientPaymentMethodComponent;
  validateNewClientAutoPay: (
    e: vwECheck,
    c: ClientPaymentMethodComponent
  ) => boolean;

  public autoPayMattersTitle: string =
    'No matters will auto-pay using this e-check';
  public selectedMatters: Array<any> = [];
  public mattersList: Array<any> = [];
  public autoPayDisabled: boolean = true;
  public clientId: number;
  public autoPaySelectionsValid: boolean = true;
  public notCreateFrom: boolean;
  public formSubmitted: boolean = false;
  public disableAll: boolean;
  public suspendSelected: boolean;
  public fromClient: boolean;
  stateCitySubscription: any;
  stateList: any[];
  cityList: any[];
  singleState: any;
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
    this.eCheckFormError = new ECheckFormError();
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
    if (this.clientId.toString() == 'NaN') {
      this.fromClient = false;
    } else {
      this.fromClient = true;
    }
    this.autopay_warning = this.error_data.activ_auto_pay_warning;
    // this.getStates();
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
      ]
    });

    if (this.echeck.isSameAsPrimary) {
      const code = (this.primaryState) ? this.primaryState.code: this.primaryAddress.state;
      this.addressForm = this.fb.group({
        isSameAsPrimary: this.echeck.isSameAsPrimary,
        address: [
          this.primaryAddress.address,
          [Validators.required, PreventInject]
        ],
        address2: [this.primaryAddress.address2, PreventInject],
        city: [this.primaryAddress.city, [Validators.required, PreventInject]],
        state: [code, Validators.required],
        zipCode: [this.primaryAddress.zip, Validators.required]
      });
      this.singleState = (this.primaryState) ? this.primaryState.name: this.primaryAddress.state;
      this.getCityState(this.primaryAddress.zip, true);
    } else {
      this.addressForm = this.fb.group({
        isSameAsPrimary: this.echeck.isSameAsPrimary,
        address: [this.address.address, [Validators.required, PreventInject]],
        address2: [this.address.address2, PreventInject],
        city: [this.address.city, [Validators.required, PreventInject]],
        state: [this.address.state, Validators.required],
        zipCode: [this.address.zip, Validators.required]
      });
      this.singleState = this.address.state;
      this.getCityState(this.address.zip, true);
    }

    this.autoPayForm = this.fb.group({
      autoPay: this.echeck.autoPay,
      toggleAutoPay: this.echeck.suspendAutoPay
    });

    if (this.echeck.autoPay) {
      this.editSuspendMode = true;
      this.autoPayDisabled = false;

      if (this.echeck.suspendAutoPay) {
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

    this.getBankName(this.echeckform.value.routingNumber);

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
          this.getCityState(this.primaryAddress.zip, true)
        };
      } else {
        if (this.echeck.id) {
          this.stateList = [];
          this.cityList = [];
          this.singleState = null;
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
    });

    this.echeckform.controls['routingNumber'].valueChanges.subscribe(value => {
      if (value && value.length == 9) {
        this.getBankName(value);
      } else {
        this.bankName = null;
      }
    });

    this.autoPayForm.controls['autoPay'].valueChanges.subscribe(value => {
      if (value) {
        let eCheckInfo = {
          id: this.echeck ? this.echeck.id : null,
          autoPay: value
        } as vwECheck;

        if (this.createFrom === 'newmatter') {
          this.isValidAutoPay = this.validateNewMatterAutoPay(
            eCheckInfo,
            this.paymentNewMatterComponent
          );
        } else if (this.createFrom === 'create-client') {
          this.isValidAutoPay = this.validateNewClientAutoPay(
            eCheckInfo,
            this.paymentNewClientComponent
          );
        } else {
          this.isValidAutoPay = this.validateAutoPay(
            eCheckInfo,
            this.paymentComponent
          );
          this.autoPayDisabled = false;
        }
      } else {
        this.isValidAutoPay = true;
        this.autoPayDisabled = true;
        this.clrMatters();
      }
      if (this.autoPayDisabled == false && this.fromClient && !this.editSuspendMode) {
        this.getMatterList('new');
      }
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

    this.autoPaySelectionsValid =
      (!this.autoPayDisabled && this.selectedMatters.length > 0) ||
      this.autoPayDisabled;

    if (
      (!this.autoPaySelectionsValid && this.notCreateFrom && this.fromClient) ||
      this.echeckform.invalid || this.addressForm.invalid
    ) {
      return;
    }

    let echeck = { ...this.echeck };
    let autoPayForm = this.autoPayForm.getRawValue();

    echeck.autoPay = autoPayForm.autoPay;
    echeck.suspendAutoPay = autoPayForm.toggleAutoPay;

    const selectedMatters = this.selectedMatters;

    let ecForm = this.echeckform.value;
    let form = this.addressForm.value;

    let eCheckInfo = {
      firstName: ecForm.firstName,
      lastName: ecForm.lastName,
      id: this.echeck.id,
      accountNumber: ecForm.accountNumber,
      routingNumber: ecForm.routingNumber,
      state: ecForm.state,
      isSameAsPrimary: form.isSameAsPrimary,
      addressId: form.isSameAsPrimary && this.primaryAddress ? this.primaryAddress.id : this.address.id,
      autoPay: echeck.autoPay,
      suspendAutoPay: echeck.suspendAutoPay,
    } as vwECheck;

    let address = {
      isSameAsPrimary: form.isSameAsPrimary,
      id: this.echeck.id ? this.primaryAddress && form.isSameAsPrimary ? this.primaryAddress.id : this.address.id : null,
      address1: form.address,
      address2: form.address2,
      city: form.city,
      state: String(form.state),
      zipCode: form.zipCode
    };

    eCheckInfo.isSameAsPrimary = address.isSameAsPrimary;

    this.activeModal.close({
      echeck: eCheckInfo,
      address: address,
      selectedMatters
    });
  }

  /******* Form Controls Account Details********/
  get f() {
    return this.echeckform.controls;
  }

  /******** Form Controls Address Details ******/
  get a() {
    return this.addressForm.controls;
  }

  getMattersSelected(event: any) {
    this.autoPayMattersTitle = '';
    this.selectedMatters = [];
    if (!event.length) {
      this.autoPayMattersTitle = 'No matters will auto-pay using this e-check';
    } else {
      this.selectedMatters = this.mattersList.filter(a => a.checked);
      this.autoPayMattersTitle =
      this.selectedMatters.length == this.mattersList.length ? 'All' : this.selectedMatters.length == 0 ? 'No matters will auto-pay using this e-check' : this.selectedMatters.length.toString();
      this.autoPaySelectionsValid = true;
    }
  }

  onMultiSelectSelectedOptions(event: any) {}

  clrMatters() {
    this.selectedMatters = [];
    this.autoPayMattersTitle = 'No matters will auto-pay using this e-check';
    this.mattersList.forEach(item => (item.checked = false));
  }

  applyMatterFilter(event: any) {}

  autoPay() {}

  getMatterList(type: string) {
    this.disableAll = false;
    let data = {
      clientId: this.clientId,
      paymentMethodId: this.echeck.id
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
          });
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
    this.addressForm.controls.state.setValue(stateIndex > -1 && this.stateList.length ? this.stateList[stateIndex].code : this.stateList[0] && this.stateList [0].code ?  this.stateList [0].code || '' : '');
    this.addressForm.controls.city.setValue(cityIndex > -1 && this.cityList.length ? this.cityList[cityIndex] : this.cityList [0] || '');
    if(this.addressForm.value.isSameAsPrimary){
      this.singleState = stateIndex > -1 && this.stateList.length ? this.stateList[stateIndex].name : this.stateList[0];
    }
  }

  /****** Allow only numbers ****/
  checkNumber(event) {
    let k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k == 8 || k == 9;
  }
}
