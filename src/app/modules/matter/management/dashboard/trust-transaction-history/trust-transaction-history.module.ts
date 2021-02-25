import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/modules/shared/shared.module';

import { TrustTransactionHistoryComponent } from './trust-transaction-history.component';
import { AccountDetailComponent } from './account-detail/account-detail.component';
import { ChargeBackTrustTransactionComponent } from './charge-back-trust-transaction/charge-back-trust-transaction.component';

@NgModule({
  declarations: [
    TrustTransactionHistoryComponent,
    AccountDetailComponent,
    ChargeBackTrustTransactionComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [TrustTransactionHistoryComponent],
  entryComponents: [ChargeBackTrustTransactionComponent],
})
export class TrustTransactionHistoryModule {}
