import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-fixed-fee-shared',
  templateUrl: './fixed-fee-shared.component.html',
  styleUrls: ['./fixed-fee-shared.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class FixedFeeSharedComponent implements OnInit {

  @Input() selectedTypeId: number;
  @Input() action: any;
  @Input() modalHeader: string;
  @Input() loader: boolean = false;
  @Output() readonly resultData = new EventEmitter<any>();

  public fixedFeeServiceFormCreateEdit: FormGroup;
  public formSubmitted: boolean = false;
  public message: string;
  public typeList: Array<any>;

  constructor(private builder: FormBuilder) { }

  ngOnInit() {
    this.createFixedFeeServiceForm();
    if(this.modalHeader) {
      this.message = this.modalHeader.substr(this.modalHeader.indexOf('F'), this.modalHeader.length);
    }

    this.typeList = [
      {
        id: 1,
        name: 'Fixed Fee Service'
      },
      {
        id: 2,
        name: 'Fixed Fee Add-On'
      }
    ];
  }

  /**
    * Configuring form
    */
   private createFixedFeeServiceForm() {
    this.fixedFeeServiceFormCreateEdit = this.builder.group({
      code : [!(this.action.chargeCode === '-1') ? this.action.chargeCode : '', Validators.required],
      name: ['', Validators.required],
      amount: [null, Validators.required]
    });

    if(this.action.type === 'Edit' ) {
      const data = this.action.data;
      this.f['code'].patchValue(data.code);
      this.f['name'].patchValue(data.description);
      this.f['amount'].patchValue(data.amount);
    }
  }

  /**
   * get form controls.
   */
  get f() {
    return this.fixedFeeServiceFormCreateEdit.controls;
  }

  /**
   * checks is form valid.
   */
  private isFormValid(): boolean {
    this.formSubmitted = true;
    return this.fixedFeeServiceFormCreateEdit.valid;
  }

  /**
   * Emits Fixed Fee Service Disable, Enable, Edit data.
   */
  public actionEmit(action?: string) {
    switch(action !== 'Close' ? this.action.type : action) {
      case 'Create' :
      case 'Edit':
        if(!this.isFormValid() ||  this.action.chargeCode === '-1') {
          return;
        }
        return this.resultData.emit(this.f);

      case 'Enable':
      case 'Disable':
        return this.resultData.emit(this.action.type === 'Enable' ?  true : false);

      case 'Close':
      return this.resultData.emit('Close');
    }
  }

  /***** function to remove amount prefix */
  removePrefix(event?: any): void {
    if (event) {
      const key = event.keyCode || event.charCode;
      if( key == 8 || key == 46 ) {
        if(+this.fixedFeeServiceFormCreateEdit.controls['amount'].value <= 0) {
          this.fixedFeeServiceFormCreateEdit.controls['amount'].setValue(null);
        }
      }
    }
    if(!this.fixedFeeServiceFormCreateEdit.controls['amount'].value) {
      this.fixedFeeServiceFormCreateEdit.controls['amount'].setValue(null);
    }
  }

  public formatRate() {
    if (this.fixedFeeServiceFormCreateEdit.value.amount) {
      this.fixedFeeServiceFormCreateEdit.patchValue({
        amount: (+this.fixedFeeServiceFormCreateEdit.value.amount).toFixed(2)
      });
    }
  }
}
