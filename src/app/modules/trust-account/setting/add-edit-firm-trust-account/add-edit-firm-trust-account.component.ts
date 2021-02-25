import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { FirmTrustAccountModel } from 'src/app/modules/models/firm-trust-bank-account-model';
import { UpdateFirmTrustBankAccount } from 'src/app/modules/models/update-firm-trust-bank-account.model';
import { MiscService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../shared/error.json';

@Component({
  selector: 'app-add-edit-firm-trust-account',
  templateUrl: './add-edit-firm-trust-account.component.html',
  styleUrls: ['./add-edit-firm-trust-account.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddEditFirmTrustAccountComponent implements OnInit {

  public trustAccountDetails: any;
  public trustAccountForm: FormGroup;
  public bankName: string;
  public request: Subscription;
  public type: string;
  public action: string;
  public title: string;
  public btnName: string;
  public Id: number;
  public iscreditCardBankAccount: boolean;
  public routingNumberErrorFlag: boolean = false;
  public accountNumberErrorFlag: boolean = false;
  public errorMessageRouting: string;
  public errorMessageAccount: string;
  public errorData: any = (errorData as any).default;
  public accountNameErrMsg = '';
  public routingNumberErrMsg = '';
  public accountNumberErrMsg = '';
  public firmTrustFormsubmitted = false;

  submitted = false;

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private miscService: MiscService
  ) { }

  ngOnInit() {
    this.type;
    if (this.type == 'firmbank') {
      this.iscreditCardBankAccount = false;
    } else {
      this.iscreditCardBankAccount = true;
    }
    if (this.trustAccountDetails) {
      this.Id = this.trustAccountDetails.id ? this.trustAccountDetails.id : 0;
      this.trustAccountForm = this.fb.group({
        accountName: [this.trustAccountDetails.accountName, Validators.required],
        routingNumber: [this.trustAccountDetails.routingNumber, Validators.required],
        accountNumber: [this.trustAccountDetails.accountNumber, Validators.required]
      });
    } else {
      this.Id = 0;
      this.iscreditCardBankAccount = this.iscreditCardBankAccount;
      this.trustAccountForm = this.fb.group({
        accountName: [null, Validators.required],
        routingNumber: [null, Validators.required],
        accountNumber: [null, Validators.required]
      });
    }
    this.trustAccountForm.controls['routingNumber'].valueChanges.subscribe(value => {
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
    this.request = this.miscService.v1MiscRoutingInfoGet$Response({ routingNumber: routingNumber })
      .subscribe(res => {
        const bank = JSON.parse(res.body as any).results;
        this.bankName = bank.customer_name;
      }, () => {
        this.bankName = null;
      });
  }

  get f() {
    return this.trustAccountForm.controls;
  }

  validationAddEditFirmTrust() {
    let isValid = true;
    this.accountNameErrMsg = '';
    this.routingNumberErrMsg = '';
    this.accountNumberErrMsg = '';

    if (!this.trustAccountForm.value['accountName']) {
      this.accountNameErrMsg = this.errorData.trust_bank_account_name_error;
      isValid = false;
    }
    if (!this.trustAccountForm.value['routingNumber']) {
      this.routingNumberErrorFlag = false;
      this.routingNumberErrMsg = this.errorData.trust_bank_routing_number_error;
      isValid = false;
    }


    if (this.trustAccountForm.value['routingNumber'] && this.trustAccountForm.value['routingNumber'].toString().length != 9) {
      this.routingNumberErrMsg = '';
      this.routingNumberErrorFlag = true;
      this.errorMessageRouting = this.errorData.routing_number_error_message;
      isValid = false;
    }

    if (!this.trustAccountForm.value['accountNumber']) {
      this.accountNumberErrorFlag = false;
      this.accountNumberErrMsg = this.errorData.trust_bank_account_number_error;
      isValid = false;
    }

    if (this.trustAccountForm.value['accountNumber'] && this.trustAccountForm.value['accountNumber'].toString().length != 12) {
      this.accountNumberErrMsg = '';
      this.accountNumberErrorFlag = true;
      this.errorMessageAccount = this.errorData.account_number_error_message;
      isValid = false;
    }
    return isValid;
  }




  save() {
    this.submitted = true;
    let isValid = this.validationAddEditFirmTrust();
    if (isValid) {
      if (this.Id == 0) {
        var data = new FirmTrustAccountModel()
        data.isCreditCardBankAccount = this.iscreditCardBankAccount;
        data.accountName = this.trustAccountForm.value['accountName']
        data.accountNumber = this.trustAccountForm.value['accountNumber']
        data.routingNumber = this.trustAccountForm.value['routingNumber']
        this.activeModal.close({ data: data });
      } else {
        var dataOfUpdateFirm = new UpdateFirmTrustBankAccount()
        dataOfUpdateFirm.id = this.trustAccountDetails.id ? this.trustAccountDetails.id : 0;
        dataOfUpdateFirm.accountName = this.trustAccountForm.value['accountName']
        dataOfUpdateFirm.accountNumber = this.trustAccountForm.value['accountNumber']
        dataOfUpdateFirm.routingNumber = this.trustAccountForm.value['routingNumber']
        this.activeModal.close({ data: dataOfUpdateFirm });
      }
    }
    else {
      return;
    }
  }

  close() {
    this.activeModal.close({ data: null });
  }

  changeAccountName() {
    if (this.submitted) {
      if (!this.trustAccountForm.value['accountName']) {
        this.accountNameErrMsg = this.errorData.trust_bank_account_name_error;
      } else {
        this.accountNameErrMsg = '';
      }
    }
  }

  changeAccountNumber() {
    if (this.submitted) {
      if (!this.trustAccountForm.value['accountNumber']) {
        this.accountNumberErrorFlag = false;
        this.accountNumberErrMsg = this.errorData.trust_bank_account_number_error
      } else {
        if (this.trustAccountForm.value['accountNumber'].toString().length != 12) {
          this.accountNumberErrMsg = '';
          this.accountNumberErrorFlag = true;
          this.errorMessageAccount = this.errorData.account_number_error_message;
        } else {
          this.accountNumberErrorFlag = false;
          this.errorMessageAccount = '';
          this.accountNumberErrMsg = '';
        }
      }
    }
  }

  changeRoutingNumber() {
    if (this.submitted) {
      if (!this.trustAccountForm.value['routingNumber']) {
        this.routingNumberErrorFlag = false;
        this.routingNumberErrMsg = this.errorData.trust_bank_routing_number_error
      } else {
        if (this.trustAccountForm.value['routingNumber'].toString().length != 9) {
          this.routingNumberErrMsg = '';
          this.routingNumberErrorFlag = true;
          this.errorMessageRouting = this.errorData.routing_number_error_message;
        } else {
          this.routingNumberErrorFlag = false;
          this.errorMessageRouting = '';
          this.routingNumberErrMsg = '';
        }
      }
    }
  }
}
