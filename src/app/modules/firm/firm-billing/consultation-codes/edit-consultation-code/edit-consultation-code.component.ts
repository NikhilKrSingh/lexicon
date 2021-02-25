import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsultationCodeError } from 'src/app/modules/models/used-billing-code.model';
import { vwLookupValuesBilling } from 'src/app/modules/models/vw-id-name-billing-codes';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BILLING_CODE_TYPES } from 'src/app/modules/models/billing-code-type-list';
import {
  vwConsultationFeeCode,
  vwIdCodeName,
} from 'src/common/swagger-providers/models';
import * as errors from '../../../../shared/error.json';

@Component({
  selector: 'app-edit-consultation-code',
  templateUrl: './edit-consultation-code.component.html',
  styleUrls: ['./edit-consultation-code.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class EditConsultationCodeComponent implements OnInit {
  consultationCode: vwConsultationFeeCode;
  consultationCodeForm: FormGroup;
  public typeList = BILLING_CODE_TYPES;
  public selectedType: any = 6;
  public pressedSave: boolean = false;
  consultationBillTypes: Array<vwIdCodeName>;
  openConsultationFeeType: vwIdCodeName;
  consultationCodeError: ConsultationCodeError;
  allBillingCodeListItems: Array<vwLookupValuesBilling>;
  public hideRate: boolean = false;
  public previousRate: number;
  error_data = (errors as any).default;

  zeroEntered = false;

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder) {
    this.consultationCodeError = new ConsultationCodeError();
  }

  ngOnInit() {
    this.setListItems();

    if (this.consultationCode) {
      this.consultationCodeForm = this.fb.group({
        code: [this.consultationCode.code, [Validators.required]],
        name: [this.consultationCode.name, [Validators.required]],
        billType: [this.consultationCode.billTypeId, Validators.required],
        rate: [this.consultationCode.rate],
      });

      if (this.consultationCode.billTypeName == 'Open') {
        this.selectBillType({ name: 'Open' });
      }

      this.consultationCodeForm.patchValue({
        rate: (+this.consultationCodeForm.value.rate || 0).toFixed(2),
      });

      this.consultationCodeForm.controls['code'].disable();
    }
  }

  private setListItems() {
    this.consultationBillTypes = this.allBillingCodeListItems.filter(
      (a) => a.categoryCode == 'CONSULTATION_FEE_BILL_TYPE'
    );

    this.openConsultationFeeType = this.consultationBillTypes.find(
      (a) => a.code == 'OPEN'
    );
  }

  selectBillType(item) {
    if (item.name == 'Open') {
      this.previousRate = this.consultationCodeForm.value.rate;
      this.consultationCodeForm.patchValue({
        rate: null,
      });
    } else {
      this.consultationCodeForm.patchValue({
        rate: this.previousRate,
      });
    }
  }

  close() {
    this.activeModal.close(null);
  }

  validateConsultationFeeCode() {
    const form = this.consultationCodeForm.getRawValue();

    this.consultationCodeError = new ConsultationCodeError();

    if (!form.name) {
      this.consultationCodeError.name = true;
      this.consultationCodeError.nameMessage = this.error_data.name_error;
    }

    if (!form.billType) {
      this.consultationCodeError.billType = true;
      this.consultationCodeError.billTypeMessage = this.error_data.bill_type_error;
    }

    if (form.billType == this.openConsultationFeeType.id) {
      this.consultationCodeError.rate = false;
      this.consultationCodeError.rateMessage = null;
    } else {
      if (!form.rate) {
        this.consultationCodeError.rate = true;
        this.consultationCodeError.rateMessage = this.error_data.consult_fee_code_rate_error;
      }
    }
  }

  save() {
    const form = this.consultationCodeForm.getRawValue();

    this.consultationCodeError = new ConsultationCodeError();

    if (!form.name) {
      this.consultationCodeError.name = true;
      this.consultationCodeError.nameMessage = this.error_data.name_error;
    }

    if (!form.billType) {
      this.consultationCodeError.billType = true;
      this.consultationCodeError.billTypeMessage = this.error_data.bill_type_error;
    }

    if (form.billType == this.openConsultationFeeType.id) {
      this.consultationCodeError.rate = false;
      this.consultationCodeError.rateMessage = null;
    } else {
      if (!form.rate) {
        this.consultationCodeError.rate = true;
        this.consultationCodeError.rateMessage = this.error_data.consult_fee_code_rate_error;
      }
    }

    this.pressedSave = true;

    if (this.consultationCodeError.hasError()) {
      return;
    }

    if (!this.consultationCodeForm.invalid) {
      const consultationCode = {
        name: form.name,
        rate:
          form.billType == this.openConsultationFeeType.id ? null : +form.rate,
        billTypeId: form.billType,
        code: form.code,
        id: this.consultationCode.id,
        status: this.consultationCode.status,
      } as vwConsultationFeeCode;

      this.activeModal.close(consultationCode);
    }
  }

  rateKeyEnter(e) {
    let keyCode = e.keyCode;
    if ((e.target.value == '' || e.target.value == '$') && keyCode == 48) {
      this.zeroEntered = true;
    } else {
      this.zeroEntered = false;
    }

    return true;
  }

  public formatRate() {
    if (this.consultationCodeForm.value && (+this.consultationCodeForm.value.rate || this.zeroEntered)) {
      this.consultationCodeForm.patchValue({
        rate: (+this.consultationCodeForm.value.rate).toFixed(2),
      });
    } else {
      this.consultationCodeForm.patchValue({
        rate: null
      });
    }
  }
}
