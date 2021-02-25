import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BILLING_CODE_TYPES } from 'src/app/modules/models/billing-code-type-list';
import { vwWriteDownCode } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-edit-write-down',
  templateUrl: './edit-write-down.component.html',
  styleUrls: ['./edit-write-down.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class EditWriteDownComponent implements OnInit {
  writeDownCode: vwWriteDownCode;
  writeDownForm: FormGroup;
  public typeList = BILLING_CODE_TYPES;
  public selectedType: any = 4;
  public pressedSave: boolean = false;

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder) {}

  ngOnInit() {
    if (this.writeDownCode) {
      this.writeDownForm = this.fb.group({
        code: [this.writeDownCode.code, [Validators.required]],
        name: [this.writeDownCode.name, [Validators.required]],
      });
      this.writeDownForm.controls['code'].disable();
    }
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    this.pressedSave = true;
    let form = this.writeDownForm.value;
    if (!this.writeDownForm.invalid) {
      const writeDown = {
        code: this.writeDownCode.code,
        name: form.name,
        id: this.writeDownCode.id,
        status: this.writeDownCode.status,
        tenantId: this.writeDownCode.tenantId,
      } as vwWriteDownCode;

      this.activeModal.close(writeDown);
    }
  }
}
