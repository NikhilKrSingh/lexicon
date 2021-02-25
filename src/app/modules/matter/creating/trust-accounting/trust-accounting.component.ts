import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalOptions, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IStep } from 'src/app/modules/models';
import { MatterTrustAccountModel } from 'src/app/modules/models/matter-trust-account.model';
import * as Constant from 'src/app/modules/shared/const';
import { TrustAccountService } from 'src/common/swagger-providers/services/trust-account.service';
import * as errors from '../../../shared/error.json';

@Component({
  selector: 'app-trust-accounting',
  templateUrl: './trust-accounting.component.html',
  styleUrls: ['./trust-accounting.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TrustAccountingComponent implements OnInit {
  @Input() clientId: any;
  @Input() matterId: any;
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
  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private trustAccountService: TrustAccountService,
    private toastDisplay: ToastDisplay,
  ) {
  }

  ngOnInit() {
    this.getFirmTrustBankAccount();
    this.getPrimaryRetainerTrustAccountName();
    console.log("clientid create matter", this.clientId);
    this.getMatterTrustAccountDetails();
    this.trustPaymentGrace();
    console.log("matterid create matter", this.matterId);
    this.minTrustBalance();
    this.initializeTrustAccountingForm();
  }

  initializeTrustAccountingForm() {
    this.trustAccountingForm = this.formBuilder.group({
      minTrustBalance: ['', [Validators.required]]
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
      trustPaymentGracePeriod: new FormControl('')
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
      data.trustBalanceGracePeriod = this.trustPaymentGracePeriodForm.value['trustPaymentGracePeriod'];
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
    return this.trustAccountService.v1TrustAccountGetMatterTrustAccountInfoGet$Response({ matterId: +this.matterId, clientId: +this.clientId }).subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.matterTrustAccountDetails = parsedRes.results;
          if (this.matterTrustAccountDetails) {
            this.matterTrustAccountId = this.matterTrustAccountDetails.id;
            if (this.matterTrustAccountDetails.minimumTrustBalance > 0) {
              this.minTrustBalanceForm.controls['minTrustBalance'].setValue(this.matterTrustAccountDetails.minimumTrustBalance);
            }
            this.trustPaymentGracePeriodForm.controls['trustPaymentGracePeriod'].setValue(this.matterTrustAccountDetails.trustBalanceGracePeriod);
            if (this.matterTrustAccountDetails.targetAccountForOverPayment == "0") {
              this.overPaymentOption = true;
            } else {
              this.overPaymentOption = false;
            }
          } else {
            this.createMatterTrustAccountInfo();
          }
        }
      }
    });
  }
  async createMatterTrustAccountInfo() {
    let resp: any;
    try {
      var body: any = new MatterTrustAccountModel();
      body.MatterId = this.matterId;
      body.ClientId = this.clientId;
      resp = await this.trustAccountService.v1TrustAccountAddMatterTrustAccountPost$Json$Response({ body }).toPromise();
      if (resp) {
        this.getMatterTrustAccountDetails();
      }
    } catch (err) {
    }
  }
  getPrimaryRetainerTrustAccountName() {
    return this.trustAccountService.v1TrustAccountGetPrimaryRetainerTrustBankAccountGet$Response({ matterId: +this.matterId }).subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.primaryRetainerTrustAccountName = parsedRes.results;
        }
      }
    });
  }
  getFirmTrustBankAccount(){
    return this.trustAccountService.v1TrustAccountGetFirmTrustBankAccountGet$Response({ matterId: +this.matterId }).subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.isFirmTrustBankAccountExists = parsedRes.results;
        }
      }
    });
  }
}
