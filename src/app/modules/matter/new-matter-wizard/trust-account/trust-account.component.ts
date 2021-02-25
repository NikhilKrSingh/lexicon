import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { NgbModal, NgbModalOptions, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IStep } from 'src/app/modules/models';
import { MatterTrustAccountModel } from 'src/app/modules/models/matter-trust-account.model';
import * as Constant from 'src/app/modules/shared/const';
import { TrustAccountService } from 'src/common/swagger-providers/services/trust-account.service';
import * as errors from '../../../shared/error.json';

@Component({
  selector: 'app-trust-account',
  templateUrl: './trust-account.component.html',
  styleUrls: ['./trust-account.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TrustAccountComponent implements OnInit, OnChanges {
  @Input() BILLING_MANAGEMENTisAdmin:boolean = false;
  @Input() BILLING_MANAGEMENTisEdit:boolean = false;
  @Input() clientId: any;
  @Input() matterId: any;
  @Input() officeId: any;
  @Input() pageType: "matter";
  matterTrustAccountId: number;
  matterAdmin = true;
  matterAdminEdit = true;
  @Output() readonly nextStep = new EventEmitter<IStep>();
  @Output() readonly prevStep = new EventEmitter<IStep>();
  modalOptions: NgbModalOptions;
  closeResult: string;
  public messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound
  };
  gracePeriod = 0;
  overPaymentOption = true;
  loadingIndicator = true;
  reorderable = true;
  private modalRef: NgbModalRef;
  public trustPaymentGracePeriod: number = 0;
  trustPaymentGracePeriodForm: FormGroup;
  minTrustBalanceForm: FormGroup;
  public matterTrustAccountDetails: MatterTrustAccountModel;
  public trustAccountingForm: FormGroup;
  public primaryRetainerTrustAccountName: string = "";
  public isFirmTrustBankAccountExists: boolean = false;
  public error_data = (errors as any).default;

  trustOnlyAccountData: any = [];
  nextTrustNumber: number = 1;

  propertyHeldInTrustData: any = [];

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private trustAccountService: TrustAccountService,
    private toastDisplay: ToastDisplay,
  ) {
  }

  ngOnInit() {
    this.trustPaymentGrace();
    this.minTrustBalance();
    this.initializeTrustAccountingForm();
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('officeId')) {
      this.officeId = changes.officeId.currentValue;
      if (this.officeId) {
        this.getPrimaryRetainerTrustAccountName();
        this.getMatterTrustAccountDetails();
        this.getFirmTrustBankAccount();
      }
    }
  }

  initializeTrustAccountingForm() {
    this.trustAccountingForm = this.formBuilder.group({
      minTrustBalance: []
    });
  }

  minTrustBalance() {
    this.minTrustBalanceForm = this.formBuilder.group({
      minTrustBalance: new FormControl('')
    });
    let val = 0;
    this.minTrustBalanceForm.controls['minTrustBalance'].setValue(val.toFixed(2));
  }

  trustPaymentGrace() {
    this.trustPaymentGracePeriodForm = this.formBuilder.group({
      trustPaymentGracePeriod: new FormControl({value:'',disabled: !this.BILLING_MANAGEMENTisAdmin && !this.BILLING_MANAGEMENTisEdit})
    });
  }

  overPaymentCheck() {
    this.overPaymentOption = !this.overPaymentOption;
  }

  modifyMinTrustBal() {
    let minTrustBalance = this.minTrustBalanceForm.value['minTrustBalance'] ? this.minTrustBalanceForm.value['minTrustBalance'] : 0;
    if (minTrustBalance && typeof minTrustBalance == "string") {
      minTrustBalance = parseFloat(minTrustBalance);
      minTrustBalance = Number(minTrustBalance).toFixed(2);
    }else{
      minTrustBalance = Number(minTrustBalance).toFixed(2);
    }
    this.minTrustBalanceForm.controls['minTrustBalance'].setValue(minTrustBalance);
  }

  receiveTrustOnlyAccountData($event) {
    this.trustOnlyAccountData = $event;
  }

  recieveTrustNumber($event) {
    this.nextTrustNumber = $event;
  }

  recieveTrustNumberPropery($event) {
    this.nextTrustNumber = $event;
  }

  recievePropertyHeldInTrustData($event) {
    this.propertyHeldInTrustData = $event;
  }

  /* Parent component shared */
  trustAccountData() {

    let minTrustBalance = this.minTrustBalanceForm.value['minTrustBalance'] ? this.minTrustBalanceForm.value['minTrustBalance'] : 0;
    if (minTrustBalance && typeof minTrustBalance == "string") {
      minTrustBalance = parseFloat(minTrustBalance);
    }

    let matterTrustAccount = {
      clientId: 0,
      matterId: 0,
      minimumTrustBalance: minTrustBalance,
      trustBalanceGracePeriod: +this.trustPaymentGracePeriodForm.value['trustPaymentGracePeriod'],
      targetAccountForOverPayment: this.overPaymentOption ? 0 : 1,
      id: 0,
      trustNumber: 1
    };

    let matterTrustOnlyAccounts = this.trustOnlyAccountData;
    let matterPropertyHeldInTrusts = this.propertyHeldInTrustData;

    return {matterTrustAccount: matterTrustAccount, matterTrustOnlyAccounts: matterTrustOnlyAccounts, matterPropertyHeldInTrusts: matterPropertyHeldInTrusts};
  }

  changeUp() {
    if(!this.BILLING_MANAGEMENTisAdmin && !this.BILLING_MANAGEMENTisEdit){
      return;
    }
    let val = this.trustPaymentGracePeriodForm.value['trustPaymentGracePeriod'];
    if (typeof val === 'string') {
      val = parseInt(val);
    }
    val = val + 1;
    this.trustPaymentGracePeriodForm.controls['trustPaymentGracePeriod'].setValue(val);
  }

  changeDown() {
    if(!this.BILLING_MANAGEMENTisAdmin && !this.BILLING_MANAGEMENTisEdit){
      return;
    }
    let val = this.trustPaymentGracePeriodForm.value['trustPaymentGracePeriod'];
    if (typeof val === 'string') {
      val = parseInt(val);
    }
    val = val - 1;
    if (val >= 0) {
      this.trustPaymentGracePeriodForm.controls['trustPaymentGracePeriod'].setValue(val);
    } else {
      this.trustPaymentGracePeriodForm.controls['trustPaymentGracePeriod'].setValue(0);
    }
  }

  next() {
    if(!this.isFirmTrustBankAccountExists){
      this.toastDisplay.showError(this.error_data.primary_retainer_trustbank_required);
      return;
    }
    let resp: any;
    try {
      var data: any = new MatterTrustAccountModel();
      let minTrustBalance = this.minTrustBalanceForm.value['minTrustBalance'] ? this.minTrustBalanceForm.value['minTrustBalance'] : 0;
      if (minTrustBalance && typeof minTrustBalance == "string") {
        minTrustBalance = parseFloat(minTrustBalance);
      }
      data.minimumTrustBalance = minTrustBalance;
      data.trustBalanceGracePeriod = +this.trustPaymentGracePeriodForm.value['trustPaymentGracePeriod'];
      data.MatterId = +this.matterId;
      data.ClientId = +this.clientId;
      data.targetAccountForOverPayment = this.overPaymentOption ? 0 : 1;
      data.id = this.matterTrustAccountDetails.id;
      resp = this.trustAccountService.v1TrustAccountUpdateMatterTrustAccountPut$Json$Response({ body: data }).toPromise();
      if (resp) {
        this.nextStep.emit({ next: 'calendar', current: 'trustaccount' });
      }
    } catch (err) {
    }
  }

  prev() {
    this.prevStep.emit({
      current: 'trustaccount',
      next: 'billing'
    });
  }

  getMatterTrustAccountDetails() {
    return this.trustAccountService.v1TrustAccountGetOfficeTrustAccountSettingsGet$Response({ officeId: this.officeId }).subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.matterTrustAccountDetails = parsedRes.results;
          if (this.matterTrustAccountDetails) {
            this.matterTrustAccountId = this.matterTrustAccountDetails.id;
            this.trustPaymentGracePeriodForm.controls['trustPaymentGracePeriod'].setValue(this.matterTrustAccountDetails.trustBalanceGracePeriod);
          }
        }
      }
    });
  }

  getPrimaryRetainerTrustAccountName() {
    return this.trustAccountService.v1TrustAccountGetOfficeTrustAccountsGet({ officeId: this.officeId }).subscribe((data: any) => {
      const res: any = JSON.parse(data);
      if (res && res.results) {
          if (res.results.length > 0) {
          let selected = res.results.filter(d => {
              return d.isSelected
          }).map(d => {
              return d.name;
          })
          this.primaryRetainerTrustAccountName = (selected.length > 0) ? selected[0] : '';
        }
      }
    });
  }

  getFirmTrustBankAccount(){
    return this.trustAccountService.v1TrustAccountGetFirmTrustAccountSettingsGet$Response().subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          if (parsedRes.results != null) {
            if (parsedRes.results.targetAccountsForOverPayments === 0) {
              this.isFirmTrustBankAccountExists = true;
              this.overPaymentOption = true;
            } else {
              this.overPaymentOption = false;
            }
          }
        }
      }
    });
  }

}
