import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AccountingRoutingModule } from './accounting-routing.module';
import { AccountingTransferQueueComponent } from './transfer-queue/accounting-transfer-queue/accounting-transfer-queue.component';
import { NewTrustTransferComponent } from './transfer-queue/new-trust-transfer/new-trust-transfer.component';
import { ReviewTrustTranferComponent } from './transfer-queue/review-trust-tranfer/review-trust-tranfer.component';
import { TransferQueueComponent } from './transfer-queue/transfer-queue.component';

@NgModule({
  declarations: [TransferQueueComponent, NewTrustTransferComponent, ReviewTrustTranferComponent, AccountingTransferQueueComponent],
  imports: [
    CommonModule,
    AccountingRoutingModule,
    SharedModule,
  ]
})
export class AccountingModule { }
