import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { BILLING_CODE_TYPES } from 'src/app/modules/models/billing-code-type-list';
import { DisbursementTypeError } from 'src/app/modules/models/used-billing-code.model';
import * as errors from 'src/app/modules/shared/error.json';
import {
  vwDisbursement, vwIdCodeName
} from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-edit-disbursement-type',
  templateUrl: './edit-disbursement-type.component.html',
  encapsulation: ViewEncapsulation.Emulated,
})
export class EditDisbursementTypeComponent implements OnInit {
  disbursement: vwDisbursement;
  disbursementTypeList: Array<vwIdCodeName>;
  billingTypeList: Array<vwIdCodeName>;
  openBillType: vwIdCodeName;
  hardDisbursementType: vwIdCodeName;
  disbursementForm: FormGroup;
  public disable: boolean = false;
  public typeList = BILLING_CODE_TYPES;
  public selectedType: any = 2;

  error_data = (errors as any).default;
  disbursementError = new DisbursementTypeError();

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private toastr: ToastDisplay
  ) {}

  ngOnInit() {
    if (this.disbursement) {
      this.disbursementForm = this.fb.group({
        code: [this.disbursement.code, [Validators.required]],
        description: [this.disbursement.description, [Validators.required]],
        billType: [this.disbursement.billType.id, [Validators.required]],
        disbursementType: [this.disbursement.type.id, [Validators.required]],
        billingTo: [
          this.disbursement.isBillableToClient ? '1' : '0',
          Validators.required,
        ],
        rateAmount: [this.disbursement.rate ? (this.disbursement.rate).toFixed(2) : null, [Validators.required]],
        changeNotes: [''],
      });
      this.disbursementForm.controls['code'].disable();
      this.hardDisbursementType = this.disbursementTypeList.find(
        (a) => a.code == 'HARD'
      );
      if (
        this.hardDisbursementType &&
        this.disbursement.type.id == this.hardDisbursementType.id
      ) {
        this.disbursementForm.controls['billingTo'].disable();
      }
      if (this.isBillTypeOpen) {
        this.disbursementForm.controls['rateAmount'].setValue(null);
        this.disbursementForm.controls['rateAmount'].clearValidators();
        this.disbursementForm.controls['rateAmount'].updateValueAndValidity();
      }
    }
    this.disable = false;
  }

  get isBillTypeOpen() {
    if (this.disbursementForm) {
      let billType = this.disbursementForm.controls['billType'].value;
      return billType == this.openBillType.id;
    } else {
      return false;
    }
  }

  changeBillType() {
    let type = this.disbursementForm.controls['billType'].value;
    if (type == this.openBillType.id) {
      this.disbursementForm.controls['rateAmount'].setValue(null);
      this.disbursementForm.controls['rateAmount'].clearValidators();
    } else {
      this.disbursementForm.controls['rateAmount'].setValidators([
        Validators.required,
      ]);
    }

    this.disbursementForm.controls['rateAmount'].updateValueAndValidity();
  }

  changeDisbursementType() {
    let type = this.disbursementForm.controls['disbursementType'].value;
    if (type == this.hardDisbursementType.id) {
      this.disbursementForm.controls['billingTo'].setValue('1');
      this.disbursementForm.controls['billingTo'].disable();
    } else {
      this.disbursementForm.controls['billingTo'].enable();
    }
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    let form = this.disbursementForm.value;
    this.disbursementError = new DisbursementTypeError();

    if (!form.description) {
      this.disbursementError.name = true;
      this.disbursementError.nameMessage = this.error_data.name_error;
    }

    if (!this.isBillTypeOpen) {
      let rate = parseFloat(form.rateAmount as any);

      if (!form.rateAmount || !rate || isNaN(rate)) {
        this.disbursementError.rate = true;
        this.disbursementError.rateMessage = this.error_data.rate_error;
      }
    }

    if (this.disbursementError.hasError()) {
      return;
    }

    if (form.disbursementType != this.hardDisbursementType.id) {
      if (form.billingTo != '0' && form.billingTo != '1') {
        this.toastr.showError(this.error_data.billable_to_error);
        return;
      }
    }

    this.disable = true;

    const disbursement = {
      code: this.disbursement.code,
      description: form.description,
      billType: {
        id: +form.billType,
      },
      type: {
        id: +form.disbursementType,
      },
      isBillableToClient:
        form.disbursementType == this.hardDisbursementType.id
          ? true
          : form.billingTo == 1,
      rate: this.isBillTypeOpen ? null : +form.rateAmount,
      tenant: {
        id: this.disbursement.tenant.id,
      },
      id: this.disbursement.id,
      changeNotes: form.changeNotes,
    } as vwDisbursement;

    this.activeModal.close(disbursement);
  }

  public formatRate() {
    if (this.disbursementForm.value.rateAmount) {
      this.disbursementForm.patchValue({
        rateAmount: (+this.disbursementForm.value.rateAmount).toFixed(2)
      });
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
