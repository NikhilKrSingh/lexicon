import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import {
  vwDisbursement, vwIdCodeName
} from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-add-disbursement-type',
  templateUrl: './add-disbursement-type.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class AddDisbursementTypeComponent implements OnInit {
  disbursementTypeList: Array<vwIdCodeName>;
  billingTypeList: Array<vwIdCodeName>;
  openBillType: vwIdCodeName;
  hardDisbursementType: vwIdCodeName;
  disbursementForm: FormGroup;
  firmDetails: Tenant;

  maxCode: string;
  public disable: boolean = false;

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder) {

  }

  ngOnInit() {
    this.createDisbursementForm();
    this.disbursementForm.controls['billingTo'].disable();
    this.disbursementForm.updateValueAndValidity();
    this.disable = false;
  }

  get isBillTypeOpen() {
    if (this.disbursementForm) {
      let billType = this.disbursementForm.controls['billType'].value;
      return billType == this.openBillType ? this.openBillType.id : null;
    } else {
      return false;
    }
  }

  createDisbursementForm(): void {
    this.disbursementForm = this.fb.group({
      code: [{ value: this.maxCode, disabled:true }],
      description: ['', [Validators.required]],
      billType: [null, [Validators.required]],
      disbursementType: [null, [Validators.required]],
      billingTo: [null, Validators.required],
      rateAmount: [null, [Validators.required]]
    });
  }

  changeBillType() {
    let type = this.disbursementForm.controls['billType'].value;
    if (type == this.openBillType.id) {
      this.disbursementForm.controls['rateAmount'].setValue(null);
      this.disbursementForm.controls['rateAmount'].clearValidators();
    } else {
      this.disbursementForm.controls['rateAmount'].setValidators([
        Validators.required
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
      this.disbursementForm.controls['billingTo'].setValue(null);
      this.disbursementForm.controls['billingTo'].enable();
    }
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    this.disable = true;
    let form = this.disbursementForm.value;
    const disbursement = {
      code: '-1',
      description: form.description,
      billType: {
        id: +form.billType
      },
      type: {
        id: +form.disbursementType
      },
      isBillableToClient: form.disbursementType == this.hardDisbursementType.id ? true : form.billingTo == 1,
      rate: this.isBillTypeOpen ? null : +form.rateAmount,
      tenant: {
        id: this.firmDetails.id
      }
    } as vwDisbursement;

    this.activeModal.close(disbursement);
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
