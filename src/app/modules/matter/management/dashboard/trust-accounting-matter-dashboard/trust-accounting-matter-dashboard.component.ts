import { Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { Subscription } from 'rxjs';
import { vwMatterResponse } from 'src/app/modules/models';
import { MatterTrustAccountModel } from 'src/app/modules/models/matter-trust-account.model';
import * as Constant from 'src/app/modules/shared/const';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { TrustAccountService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../../shared/error.json';
import { UtilsHelper } from '../../../../shared/utils.helper';

@Component({
  selector: 'app-trust-accounting-matter-dashboard',
  templateUrl: './trust-accounting-matter-dashboard.component.html',
  styleUrls: ['./trust-accounting-matter-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TrustAccountingMatterDashboardComponent implements OnInit, OnDestroy {
  public primaryRetainerArray = [];
  @Input() clientId: any;
  @Input() matterId: any;
  @Input() officeId:any;
  @Input() matterAdmin: any;
  @Input() matterAdminEdit: any;
  @Input() permissionList: any;
  @Input() matterDetails: vwMatterResponse;

  matterTrustAccountId: number;
  public pageType = 'matterDashboard';
  public counter = Array;
  public trustAccountingForm: FormGroup;
  trustPaymentGracePeriodForm: FormGroup;
  minTrustBalanceForm: FormGroup;
  minimumPrimaryRetainerTrustBalance = 0;
  public SelectionType = SelectionType;
  public selected = [];
  public errorData: any = (errorData as any).default;
  public messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound
  };
  public primaryRetainerTrustNumber: number;
  gracePeriod = 0;
  originalGracePeriod = 0;
  overPaymentOption = true;
  originalMinimumPrimaryRetainerTrustBalance = 0;

  originalOverPaymentOption = true;
  loadingIndicator = true;
  reorderable = true;
  public lastIndex = 0;
  public matterTrustAccountDetails: MatterTrustAccountModel;
  isPermission = true;
  isEdit = false;
  public primaryRetainerTrustAccountName = '';

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  closeResult: string;

  propertyheldRows = [];
  public postPaymentBtn = false;
  public currentBalance: number;
  public minimumRetainerTrustBalance: number;

  isPrimaryLoading = true;
  trustSettingLoading = true;
  reloadPrimaryTrustBalanceSub: Subscription;

  constructor(
    private formBuilder: FormBuilder,
    private trustAccountService: TrustAccountService,
    private sharedService: SharedService
  ) { }

  ngOnInit() {
    this.isPermission = this.matterAdmin || this.matterAdminEdit;
    this.checkPostPaymentButtonPermissions();
    this.getMatterTrustAccountDetails();
    this.initializeTrustAccountingForm();
    this.trustPaymentGrace();
    this.minTrustBalance();
    this.reloadPrimaryTrustBalanceSub = this.sharedService.reloadPrimaryTrustBalance$.subscribe(() => {
      this.GetPrimaryRetainerTrustDetails();
    });
  }

  ngOnDestroy() {
    if (this.reloadPrimaryTrustBalanceSub) {
      this.reloadPrimaryTrustBalanceSub.unsubscribe();
    }
  }

  getMatterTrustAccountDetails() {
    this.trustSettingLoading = true;
    return this.trustAccountService.v1TrustAccountGetMatterTrustAccountInfoGet$Response({ matterId: +this.matterId, clientId: +this.clientId }).subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        const parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.matterTrustAccountDetails = parsedRes.results;
          if (this.matterTrustAccountDetails) {
            this.matterTrustAccountId = this.matterTrustAccountDetails.id;
            this.primaryRetainerTrustNumber = this.matterTrustAccountDetails['trustNumber'];
            this.minTrustBalanceForm.get('minTrustBalance').setValue(Number(this.matterTrustAccountDetails.minimumTrustBalance).toFixed(2));

            this.trustPaymentGracePeriodForm.get('trustPaymentGracePeriod').setValue(this.matterTrustAccountDetails.trustBalanceGracePeriod);

            if (this.matterTrustAccountDetails.targetAccountForOverPayment == "0") {
              this.overPaymentOption = true;
            } else {
              this.overPaymentOption = false;
            }
            this.GetPrimaryRetainerTrustDetails();
          } else {
            this.createMatterTrustAccountInfo();
          }
        }
      }
      this.trustSettingLoading = false;
    }, () => {
      this.trustSettingLoading = false;
    });
  }

  async createMatterTrustAccountInfo() {
    let resp: any;
    try {
      const body: any = new MatterTrustAccountModel();
      body.MatterId = this.matterId;
      body.ClientId = this.clientId;
      resp = await this.trustAccountService.v1TrustAccountAddMatterTrustAccountPost$Json$Response({ body }).toPromise();
      if (resp) {
        this.getMatterTrustAccountDetails();
      }
    } catch (err) {
    }
  }
  initializeTrustAccountingForm() {
    this.trustAccountingForm = this.formBuilder.group({
      minTrustBalance: ['', [Validators.required, Validators.min(0)]]
    });
    this.trustAccountingForm.get('minTrustBalance').setValue(0.00);
  }

  overPaymentCheck() {
    this.overPaymentOption = !this.overPaymentOption;
  }

  trustPaymentGrace() {
    this.trustPaymentGracePeriodForm = this.formBuilder.group({
      trustPaymentGracePeriod: [{value:0,disabled: !this.permissionList.BILLING_MANAGEMENTisAdmin && !this.permissionList.BILLING_MANAGEMENTisEdit },[Validators.required, Validators.min(0)]]
    });
  }

  minTrustBalance() {
    this.minTrustBalanceForm = this.formBuilder.group({
      minTrustBalance: [0, [Validators.required, Validators.min(0)]]
    });
    let val = 0;
    this.minTrustBalanceForm.get('minTrustBalance').setValue(val.toFixed(2));
  }

  isCheckValidForms() {
    if (this.trustPaymentGracePeriodForm.valid && this.minTrustBalanceForm.valid) {
      return true;
    } else {
      return false;
    }
  }

  editBtn() {
    this.isEdit = true;
    this.originalMinimumPrimaryRetainerTrustBalance = this.minTrustBalanceForm.get('minTrustBalance').value;
    this.originalGracePeriod = this.trustPaymentGracePeriodForm.get('trustPaymentGracePeriod').value;
    this.originalOverPaymentOption = this.overPaymentOption;
  }

  cancelBtn() {
    this.isEdit = false;
    this.overPaymentOption = this.originalOverPaymentOption;
    this.minTrustBalanceForm.get('minTrustBalance').setValue(this.originalMinimumPrimaryRetainerTrustBalance);
    this.trustPaymentGracePeriodForm.get('trustPaymentGracePeriod').setValue(this.originalGracePeriod);
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

  saveBtn() {
    if (!this.isCheckValidForms()) {
      return;
    }
    let resp: any;
    try {
      const data: any = new MatterTrustAccountModel();
      let minTrustBalance = this.minTrustBalanceForm.value['minTrustBalance'] ? this.minTrustBalanceForm.value['minTrustBalance'] : 0;
      if (minTrustBalance && typeof minTrustBalance == "string") {
        minTrustBalance = parseFloat(minTrustBalance);
      }
      data.minimumTrustBalance = minTrustBalance;
      data.trustBalanceGracePeriod = this.trustPaymentGracePeriodForm.get('trustPaymentGracePeriod').value;
      data.MatterId = +this.matterId;
      data.ClientId = +this.clientId;
      data.targetAccountForOverPayment = this.overPaymentOption ? 0 : 1;
      data.id = this.matterTrustAccountDetails.id;
      resp = this.trustAccountService.v1TrustAccountUpdateMatterTrustAccountPut$Json$Response({ body: data }).toPromise();
      if (resp) {
        this.isEdit = false;
      }
    } catch (err) {
    }
  }

  /****
  * function to check post payment button permission
  */
  async checkPostPaymentButtonPermissions(): Promise<any> {
    let resp: any = await this.trustAccountService.v1TrustAccountGetTrustAccountStatusGet$Response().toPromise();
    resp = JSON.parse(resp.body as any).results;
    if (resp) {
      if (this.permissionList) {
        this.postPaymentBtn = (this.permissionList.BILLING_MANAGEMENTisAdmin || this.permissionList.BILLING_MANAGEMENTisEdit) ? true : false;
      }
      if (!this.postPaymentBtn) {
        this.postPaymentBtn = UtilsHelper.checkPermissionOfRepBingAtn(this.matterDetails);
      }
    }
  }
  private GetPrimaryRetainerTrustDetails() {
    this.trustAccountService.v1TrustAccountGetPrimaryRetainerTrustDetailsGet$Response({ matterId: +this.matterId })
      .subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            this.currentBalance = parsedRes.results.currnetBalance ? parsedRes.results.currnetBalance : 0;
            this.minimumRetainerTrustBalance = parsedRes.results.minimumRetainerTrustBalance ? parsedRes.results.minimumRetainerTrustBalance : 0;
            this.isPrimaryLoading = false;
          }
        }
          this.isPrimaryLoading = false;
      }, () => {
          this.isPrimaryLoading = false;
      });
  }
}
