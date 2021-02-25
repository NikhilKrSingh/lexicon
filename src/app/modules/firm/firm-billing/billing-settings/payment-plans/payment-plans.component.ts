import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { SelectService } from 'src/app/service/select.service';
import { vwBillingSettings } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-payment-plans',
  templateUrl: './payment-plans.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class PaymentPlansComponent implements OnInit {
  @Input() billingSettings: vwBillingSettings;

  constructor(
    private selectService: SelectService
  ) { }

  ngOnInit() {
    if(this.billingSettings.paymentPlans == null){
      this.billingSettings.paymentPlans=false;
    }
  }

  paymentChange() {
    this.selectService.newSelection('clicked!');
  }
}
