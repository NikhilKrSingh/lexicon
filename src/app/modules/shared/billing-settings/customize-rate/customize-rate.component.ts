import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { CustomRateError } from 'src/app/modules/models/fillable-form.model';
import * as errors from 'src/app/modules/shared/error.json';
import { vwRate } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-customize-rate',
  templateUrl: './customize-rate.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class CustomizeRateComponent implements OnInit {
  rate: vwRate;

  customRate: number;
  changeNotes: string;

  error_data = (errors as any).default;
  customRateError: CustomRateError;

  constructor(
    private activeModal: NgbActiveModal,
    private toastr: ToastDisplay
  ) {
    this.customRateError = new CustomRateError();

  }

  ngOnInit() {
    if (this.rate && this.rate.isCustom) {
      this.customRate = this.rate.customRateAmount;
    }
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    let firstChar: string;
    if (this.changeNotes) {
      firstChar = this.changeNotes.charAt(0)
    }
    const pattern = '[a-zA-Z0-9_]'
    if (this.changeNotes && !firstChar.match(pattern)) {
      this.customRateError.changeNotes = true;
      this.customRateError.changeNotesMessage = this.error_data.insecure_input;
    } else {
      this.customRateError.changeNotes = false;
    }

    if (!this.customRate) {
      this.customRateError.customRate = true;
      this.customRateError.customRateMessage = this.error_data.custom_rate_error;
    } else {
      this.customRateError.customRate = false;
    }

    if (this.customRateError.hasError()) {
      return;
    }
    if (this.customRate) {
      this.activeModal.close({
        rate: this.rate,
        customRate: +this.customRate,
        changeNotes: this.changeNotes
      });
    }
  }
}
