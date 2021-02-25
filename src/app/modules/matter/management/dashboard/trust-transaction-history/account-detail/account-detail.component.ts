import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { vwTrustTransaction } from 'src/app/modules/models/vw-trust-transaction';

@Component({
  selector: 'app-account-detail',
  templateUrl: './account-detail.component.html',
  encapsulation: ViewEncapsulation.Emulated,
})
export class AccountDetailComponent implements OnInit {
  @Input() row: vwTrustTransaction;
  @Input() isSource = true;

  constructor() {}

  ngOnInit() {}
}
