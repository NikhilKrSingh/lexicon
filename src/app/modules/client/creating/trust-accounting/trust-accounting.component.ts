import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatterTrustAccountModel } from 'src/app/modules/models/matter-trust-account.model';
import * as Constant from 'src/app/modules/shared/const';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { TrustAccountService } from 'src/common/swagger-providers/services/trust-account.service';
import * as errors from '../../../shared/error.json';

@Component({
  selector: 'app-client-trust-accounting',
  templateUrl: './trust-accounting.component.html',
  styleUrls: ['./trust-accounting.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ClientTrustAccountingComponent implements OnInit, OnDestroy {
  officeId: any;
  @Input() BILLING_MANAGEMENTisAdmin:boolean = false;
  @Input() BILLING_MANAGEMENTisEdit:boolean = false;
  matterTrustAccountId: number = 0;
  matterAdmin = true;
  matterAdminEdit = true;

  closeResult: string;
  public messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound,
  };

  gracePeriod = 0;
  overPaymentOption = true;
  loadingIndicator = true;
  reorderable = true;
  public trustPaymentGracePeriod: number = 0;
  trustPaymentGracePeriodForm: FormGroup;
  minTrustBalanceForm: FormGroup;
  public matterTrustAccountDetails: MatterTrustAccountModel;
  public trustAccountingForm: FormGroup;
  public primaryRetainerTrustAccountName: string = '-';
  public isFirmTrustBankAccountExists: boolean = false;
  public error_data = (errors as any).default;

  trustOnlyAccountData: any = [];
  nextTrustNumber: number = 1;

  propertyHeldInTrustData: any = [];

  MatterLawOfficeChangeSub: Subscription;
  primaryTrustLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private trustAccountService: TrustAccountService,
    private sharedService: SharedService
  ) {
    this.MatterLawOfficeChangeSub = this.sharedService.MatterLawOfficeChange$.subscribe(
      (office) => {
        this.officeId = office;

        if (this.officeId) {
          this.getPrimaryRetainerTrustAccountName();
        } else {
          this.primaryRetainerTrustAccountName = '-';
        }
      }
    );
  }

  ngOnInit() {
    this.trustPaymentGrace();
    this.minTrustBalance();
    this.initializeTrustAccountingForm();
    this.getFirmTrustBankAccount();
  }

  ngOnDestroy() {
    if (this.MatterLawOfficeChangeSub) {
      this.MatterLawOfficeChangeSub.unsubscribe();
    }
  }

  initializeTrustAccountingForm() {
    this.trustAccountingForm = this.formBuilder.group({
      minTrustBalance: ['', [Validators.required]],
    });
  }

  minTrustBalance() {
    this.minTrustBalanceForm = this.formBuilder.group({
      minTrustBalance: new FormControl(''),
    });
    let val = 0;
    this.minTrustBalanceForm.controls['minTrustBalance'].setValue(
      val.toFixed(2)
    );
  }

  trustPaymentGrace() {
    this.trustPaymentGracePeriodForm = this.formBuilder.group({
      trustPaymentGracePeriod: new FormControl({value:'0',disabled: !this.BILLING_MANAGEMENTisAdmin && !this.BILLING_MANAGEMENTisEdit}),
    });
  }

  overPaymentCheck() {
    this.overPaymentOption = !this.overPaymentOption;
  }

  modifyMinTrustBal() {
    let minTrustBalance = this.minTrustBalanceForm.value['minTrustBalance']
      ? this.minTrustBalanceForm.value['minTrustBalance']
      : 0;
    if (minTrustBalance && typeof minTrustBalance == 'string') {
      minTrustBalance = parseFloat(minTrustBalance);
      minTrustBalance = Number(minTrustBalance).toFixed(2);
    } else {
      minTrustBalance = Number(minTrustBalance).toFixed(2);
    }
    this.minTrustBalanceForm.controls['minTrustBalance'].setValue(
      minTrustBalance
    );
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
    let minTrustBalance = this.minTrustBalanceForm.value['minTrustBalance']
      ? this.minTrustBalanceForm.value['minTrustBalance']
      : 0;
    if (minTrustBalance && typeof minTrustBalance == 'string') {
      minTrustBalance = parseFloat(minTrustBalance);
    }

    let matterTrustAccount = {
      clientId: 0,
      matterId: 0,
      minimumTrustBalance: minTrustBalance,
      trustBalanceGracePeriod:
        +this.trustPaymentGracePeriodForm.value['trustPaymentGracePeriod'] || 0,
      targetAccountForOverPayment: this.overPaymentOption ? 0 : 1,
      id: 0,
      trustNumber: 1,
    };

    let matterTrustOnlyAccounts = this.trustOnlyAccountData;
    let matterPropertyHeldInTrusts = this.propertyHeldInTrustData;

    return {
      matterTrustAccount: matterTrustAccount,
      matterTrustOnlyAccounts: matterTrustOnlyAccounts,
      matterPropertyHeldInTrusts: matterPropertyHeldInTrusts,
    };
  }

  changeUp() {
    if(!this.BILLING_MANAGEMENTisAdmin || !this.BILLING_MANAGEMENTisEdit){
      return;
    }
    let val =
      this.trustPaymentGracePeriodForm.value['trustPaymentGracePeriod'] || 0;
    if (typeof val === 'string') {
      val = parseInt(val);
    }
    val = val + 1;
    this.trustPaymentGracePeriodForm.controls[
      'trustPaymentGracePeriod'
    ].setValue(val);
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
      this.trustPaymentGracePeriodForm.controls[
        'trustPaymentGracePeriod'
      ].setValue(val);
    } else {
      this.trustPaymentGracePeriodForm.controls[
        'trustPaymentGracePeriod'
      ].setValue(0);
    }
  }

  getPrimaryRetainerTrustAccountName() {
    this.primaryTrustLoading = true;
    this.trustAccountService
      .v1TrustAccountGetOfficeTrustAccountsGet({ officeId: this.officeId })
      .pipe(
        finalize(() => {
          this.primaryTrustLoading = false;
        })
      )
      .subscribe((data: any) => {
        const res: any = JSON.parse(data);
        if (res && res.results) {
          if (res.results.length > 0) {
            let selected = res.results
              .filter((d) => {
                return d.isSelected;
              })
              .map((d) => {
                return d.name;
              });
            this.primaryRetainerTrustAccountName =
              selected.length > 0 ? selected[0] : '';
          }
        }
      });
  }

  getFirmTrustBankAccount() {
    this.trustAccountService
      .v1TrustAccountGetFirmTrustAccountSettingsGet$Response()
      .subscribe((data: {}) => {
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
