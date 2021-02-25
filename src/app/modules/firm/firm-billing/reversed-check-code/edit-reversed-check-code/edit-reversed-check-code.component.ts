import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BILLING_CODE_TYPES } from 'src/app/modules/models/billing-code-type-list';
import { vwWriteDownCode } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-edit-reversed-check-code',
  templateUrl: './edit-reversed-check-code.component.html',
  styleUrls: ['./edit-reversed-check-code.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class EditReversedCheckCodeComponent implements OnInit {
  writeDownCode: any ;
  reversedCheckForm: FormGroup;
  public typeList = BILLING_CODE_TYPES;
  public selectedType: any = 5;
  public pressedSave: boolean = false;

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder) {}

  ngOnInit() {
    if (this.writeDownCode) {
      this.reversedCheckForm = this.fb.group({
        code: [this.writeDownCode.code, [Validators.required]],
        name: [this.writeDownCode.description, [Validators.required]],
      });
      this.reversedCheckForm.controls['code'].disable();
    }
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    this.pressedSave = true;
    let form = this.reversedCheckForm.value;
    if (!this.reversedCheckForm.invalid) {
      const writeDown = {
        code: this.writeDownCode.code,
        description: form.name,
        id: this.writeDownCode.id,
        status: this.writeDownCode.status,
        tenantId: this.writeDownCode.tenantId,
      } as vwWriteDownCode;

      this.activeModal.close(writeDown);
    }
  }
}