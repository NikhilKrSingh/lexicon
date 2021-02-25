import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BILLING_CODE_TYPES } from 'src/app/modules/models/billing-code-type-list';
import { WriteOffCodeError } from 'src/app/modules/models/used-billing-code.model';
import * as errors from 'src/app/modules/shared/error.json';
import { vwWriteOffCode } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-edit-write-off',
  templateUrl: './edit-write-off.component.html',
  styleUrls: ['./edit-write-off.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class EditWriteOffComponent implements OnInit {
  writeOffCode: vwWriteOffCode;
  writeOffForm: FormGroup;
  public typeList = BILLING_CODE_TYPES;
  public selectedType: any = 3;
  public pressedSave: boolean = false;
  writeOffCodeError = new WriteOffCodeError();
  error_data = (errors as any).default;

  constructor(private activeModal: NgbActiveModal, private fb: FormBuilder) {}

  ngOnInit() {
    if (this.writeOffCode) {
      this.writeOffForm = this.fb.group({
        code: [this.writeOffCode.code, [Validators.required]],
        name: [this.writeOffCode.name, [Validators.required]],
      });
      this.writeOffForm.controls['code'].disable();
    }
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    this.pressedSave = true;
    let form = this.writeOffForm.value;
    this.writeOffCodeError = new WriteOffCodeError();

    if (!form.name) {
      this.writeOffCodeError.name = true;
      this.writeOffCodeError.nameMessage = this.error_data.name_error;
    }

    if (this.writeOffCodeError.hasError()) {
      return;
    }

    if (!this.writeOffForm.invalid) {
      const writeOff = {
        code: this.writeOffCode.code,
        name: form.name,
        id: this.writeOffCode.id,
        status: this.writeOffCode.status,
        tenantId: this.writeOffCode.tenantId,
      } as vwWriteOffCode;

      this.activeModal.close(writeOff);
    }
  }
}
