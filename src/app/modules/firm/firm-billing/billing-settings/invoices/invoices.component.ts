import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { vwBillingSettings } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class InvoicesComponent implements OnInit {
  @Input() billingSettings: vwBillingSettings;

  constructor() { }

  ngOnInit() {
  }

}
