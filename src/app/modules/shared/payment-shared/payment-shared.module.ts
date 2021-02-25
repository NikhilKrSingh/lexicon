import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SharedModule } from '../shared.module';
import { MatterSharedModule } from 'src/app/modules/matter/management/shared/shared.module';

import { RefundComponent } from './refund/refund.component';
import { TransactionHistoryComponent } from './transaction-history/transaction-history.component';
import { ChargebackComponent } from './transaction-history/chargeback/chargeback.component';
import { PaymentAccountDetailComponent } from './transaction-history/account-detail/account-detail.component';
import { PostPaymentComponent } from './post-payment/post-payment.component';

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule, MatterSharedModule],
  declarations: [
    RefundComponent,
    TransactionHistoryComponent,
    ChargebackComponent,
    PaymentAccountDetailComponent,
    PostPaymentComponent,
  ],
  exports: [
    RefundComponent,
    TransactionHistoryComponent,
    ChargebackComponent,
    PaymentAccountDetailComponent,
    PostPaymentComponent,
  ],
  entryComponents: [
    RefundComponent,
    TransactionHistoryComponent,
    ChargebackComponent,
    PostPaymentComponent,
  ],
  providers: [CurrencyPipe],
})
export class PaymentSharedModule {}
