import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { BillingCodeHelper } from 'src/app/modules/models/used-billing-code.model';
import { PreBillingModels } from 'src/app/modules/models/vw-prebilling';
import { BillingService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../../shared/error.json';

@Component({
  selector: 'app-add-on-service-write-down',
  templateUrl: './write-down.component.html',
  encapsulation: ViewEncapsulation.Emulated,
})
export class AddOnServiceWriteDownComponent implements OnInit {
  add = true;
  edit = true;
  service: any;

  writedownAmount: any;
  rateAmount = 0;

  writeDown = 0;
  amountToBeBilled: number;
  writeDownRow: any;

  public errorData: any = (errorData as any).default;
  public writeDownForm: FormGroup;
  public writeDownDetails: any;
  writeDownList: any = [];
  public formSubmitted:  boolean =  false;
  public jselected:any;
  public billedAmount:any;
  public writeDownAmountErr:boolean = false;
  public amountToBilled: string;


  constructor(
    private activeModal: NgbActiveModal,
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private builder: FormBuilder,
  ) {
    this.service = {} as PreBillingModels.FixedFeeService;
    this.createForm();
  }

  ngOnInit() {
    this.rateAmount = this.service.serviceAmount - this.writedownAmount;
    this.amountToBeBilled = this.rateAmount - this.writeDown;

    this.writeDownList = BillingCodeHelper.getSortedList(this.writeDownList);

    if (this.add) {
      this.service.writeDownReason = null;
    }

    this.amountToBilled = (this.amountToBeBilled).toString();
    if (this.edit) {
      setTimeout(() => {
        this.updateForm();
      }, 1);
    }
    setTimeout(() => {
      this.writedownAmount = (this.writeDown).toFixed(2);
      this.onWriteDownValueChange(this.writedownAmount,'writedown');
    }, 1);

  }

  /***
  * function to create form
  */
  createForm(): void{
    this.writeDownForm = this.builder.group({
      writeDownCodeId: new FormControl('', [Validators.required]),
      writeDownAmount: ['0', [Validators.required, Validators.min(0.1)]],
      writeDownNarrative: ['', Validators.required]
    });
  }

  get f() {
    return this.writeDownForm.controls;
  }

  /***
   * function to update form
   */
  updateForm() {
    this.writeDownForm.patchValue({
      writeDownCodeId: (this.writeDownRow.writeDownCode.id) ? (this.writeDownRow.writeDownCode.id): -1,
      writeDownAmount: (this.writeDownRow.writeDownAmount) ? this.writeDownRow.writeDownAmount.toFixed(2): 0,
      writeDownNarrative: (this.writeDownRow.writeDownNarrative) ? this.writeDownRow.writeDownNarrative: ''
    });
  }

  /**
   * function to trigger when write down value change
   */
  onWriteDownValueChange(value:any, type:string): void {
    this.writeDownAmountErr = false;
    if(value) {
      if (typeof value === 'string') {
        let repVal = value.replace('$','').replace(/\,/g,'');
        value = Number(repVal).toFixed(2);
      } else {
        value = Number(value).toFixed(2);
      }

      if (type === 'writedown') {
        if (this.rateAmount < +value) {
          if (this.rateAmount < +value) {
            this.writeDownAmountErr = true;
          } else {
            this.writeDownForm.controls['writeDownAmount'].setValue((this.writedownAmount).toFixed(2));
          }
        }
        this.billedAmount = (+this.rateAmount - + this.writeDownForm.controls['writeDownAmount'].value).toFixed(2);
      } else {
        if (this.rateAmount < +value) {
          this.billedAmount = this.rateAmount.toFixed(2);
        }
        this.writeDownForm.controls['writeDownAmount'].setValue((this.rateAmount - +this.billedAmount).toFixed(2));
      }
    }
    if(+this.billedAmount < 0) {
      if(!this.edit) this.writeDownAmountErr = true;
    }
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    this.formSubmitted = true;

    let formVal = this.writeDownForm.value;
    if(this.writeDownAmountErr) {
      this.toastr.showError(this.errorData.writedown_amount_error);
      return;
    }

    if(formVal.writeDownAmount === '') {
      this.toastr.showError(this.errorData.writedown_required);
      return;
    }

    if(formVal.writeDownAmount === '0' || formVal.writeDownAmount === '0.00') {
      this.toastr.showError(this.errorData.writedown_min);
      return;
    }

     // stop here if form is invalid
     if (this.writeDownForm.invalid) {
      return;
    }

    this.activeModal.close({
      writeDownCodeId: formVal.writeDownCodeId,
      writeDownAmount: Number(Number(formVal.writeDownAmount).toFixed(2)),
      writeDownNarrative: formVal.writeDownNarrative
    });
  }
}
