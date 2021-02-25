import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FixedFeePreBillSharedModule } from '../../shared/fixed-fee-pre-bill/fixed-fee-pre-bill.module';
import { RecordDisbursementComponent } from '../../shared/record-disbursement/record-disbursement.component';
import { SharedModule } from '../../shared/shared.module';
import { PreBillListComponent } from './list/list.component';
import { PreBillRoutingModule } from './pre-bill-routing.module';
import { AccountReceivableDisbursementsComponent } from './view/account-receivable-disbursements/account-receivable-disbursements.component';
import { ViewPreBillingDisbursementsComponent } from './view/disbursements/disbursements.component';
import { PreviewPreBillInvoiceComponent } from './view/preview-invoice/preview-invoice.component';
import { ViewPreBillingTimeComponent } from './view/time/time.component';
import { PreBillViewComponent } from './view/view.component';
import { PreBillWriteOffComponent } from './view/write-off/write-off.component';

@NgModule({
  declarations: [
    PreBillListComponent,
    PreBillViewComponent,
    ViewPreBillingTimeComponent,
    ViewPreBillingDisbursementsComponent,
    AccountReceivableDisbursementsComponent,
    PreBillWriteOffComponent,
    PreviewPreBillInvoiceComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    PreBillRoutingModule,
    FixedFeePreBillSharedModule,
  ],
  exports: [
    PreBillListComponent,
    PreBillViewComponent,
    ViewPreBillingTimeComponent,
    ViewPreBillingDisbursementsComponent,
    AccountReceivableDisbursementsComponent,
    PreBillWriteOffComponent,
    PreviewPreBillInvoiceComponent,
  ],
  entryComponents: [
    RecordDisbursementComponent,
  ]
})
export class PreBillModule {}
