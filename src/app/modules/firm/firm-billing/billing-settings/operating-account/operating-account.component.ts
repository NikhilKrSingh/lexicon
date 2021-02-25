import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { vwBillingSettings } from 'src/common/swagger-providers/models';
import * as errorData from '../../../../../modules/shared/error.json';

@Component({
  selector: 'app-operating-account',
  templateUrl: './operating-account.component.html',
  styleUrls: ['./operating-account.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class OperatingAccountComponent implements OnInit {
  public displayMessage: boolean = false;
  public success_msg: string;
  public errorData: any = (errorData as any).default;
  @Input() isFormSubmitted: boolean = false;
  @Input() billingSettings: vwBillingSettings;
  @Input() set reset(reset: boolean) {
    if (reset) {
      this.displayMessage = true;
    } else {
      this.displayMessage = false;
    }
  }

  constructor() { }

  ngOnInit() {
    this.success_msg = this.errorData.operating_account_validated;
  }

  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k == 8 || k == 9;
  }
}
