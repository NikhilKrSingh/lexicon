import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { vwBillingSettings } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-edit-fixed-fee-settings',
  templateUrl: './edit-fixed-fee-settings.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class EditFixedFeeSettingsComponent implements OnInit {
  billingSettings: vwBillingSettings;
  changeNotes: string;

  constructor(private activeModal: NgbActiveModal) {}

  ngOnInit() {}

  change() {
    if (!this.billingSettings.isFixedAmount) {
      this.billingSettings.fixedAmount = null;
    }
  }

  dismiss() {
    this.activeModal.close(null);
  }

  close() {
    this.activeModal.close(this.billingSettings);
  }
}
