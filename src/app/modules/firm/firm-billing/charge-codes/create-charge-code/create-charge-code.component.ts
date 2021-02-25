import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { vwIdCodeName, vwRate } from 'src/common/swagger-providers/models';
import * as errors from '../../../../shared/error.json';
@Component({
  selector: 'app-create-charge-code',
  templateUrl: './create-charge-code.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class CreateChargeCodeComponent implements OnInit {
  firmDetails: Tenant;
  billingToList: Array<vwIdCodeName>;
  billingTypeList: Array<vwIdCodeName>;
  error_data = (errors as any).default;
  public chargeForm:FormGroup;
  public selectedType:any;
  public typeList=[{id:1,name:'Hourly Code'},{id:2,name:'Disbursement Type'}]
  maxCode: string;
  public disable: boolean = false;
  constructor(
    private modalService: NgbModal,
    private activeModal: NgbActiveModal,
    private toastr: ToastDisplay,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.createChargeForm();
    this.disable = false;
  }

  /***** function to create charge form */
  createChargeForm(): void {
    this.chargeForm = this.fb.group({
      code: [{ value: this.maxCode, disabled:true }],
      description: ['', Validators.required],
      billingType: [null, Validators.required],
      billableTo: [null, Validators.required],
      rateAmount: [null, Validators.required]
    });
    if(this.billingTypeList.length > 0){
      this.chargeForm.patchValue({billingType:this.billingTypeList[0].id});
    }
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    let form = this.chargeForm.value;
    if (!form.description) {
      this.toastr.showError(this.error_data.validation_charge_code_description);
      this.disable = false;
      return;
    }
    if (!form.billingType) {
      this.toastr.showError(this.error_data.validation_charge_code_bill_type);
      this.disable = false;
      return;
    }
    if (!form.billableTo) {
      this.toastr.showError(this.error_data.validation_charge_code_billate_to);
      this.disable = false;
      return;
    }
    let rate = parseFloat(form.rateAmount as any);

    if (!form.rateAmount || !rate || isNaN(rate)) {
      this.toastr.showError(this.error_data.validation_charge_code_rate_amount);
      this.disable = false;
      return;
    }
    this.disable = true;

    const chargeCode = {
      description: form.description,
      rateAmount: rate,
      billingTo: {
        id: +form.billableTo
      },
      billingType: {
        id: +form.billingType
      },
      tenant: {
        id: +this.firmDetails.id
      },
      code: '-1'
    } as vwRate;
    this.activeModal.close(chargeCode);
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
