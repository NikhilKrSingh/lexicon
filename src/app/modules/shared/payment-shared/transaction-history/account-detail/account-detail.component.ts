import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { ILedgerHistory } from 'src/app/modules/models/ledger-history.model';

@Component({
  selector: 'app-payment-account-detail',
  templateUrl: './account-detail.component.html',
  encapsulation: ViewEncapsulation.Emulated,
})
export class PaymentAccountDetailComponent implements OnInit {
  @Input() row: ILedgerHistory;
  @Input() isPaymentMethod = false;

  constructor() {}

  ngOnInit() {}
}
