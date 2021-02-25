import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FixedFeePreBillSharedModule } from '../shared/fixed-fee-pre-bill/fixed-fee-pre-bill.module';
import { IndexfinderPipe } from '../shared/pipes/indexfinder.pipe';
import { SharedModule } from '../shared/shared.module';
import { BillingRoutingModule } from './billing-routing.module';
import { BillingComponent } from './billing.component';
import { EditChargesComponent } from './invoices/edit-charges/edit-charges.component';
import { InvoicePdfComponent } from './invoices/invoice-pdf/invoice-pdf.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { PreBillModule } from './pre-bill/pre-bill.module';
import { ReadyToBillPreviewInvoiceComponent } from './ready-to-bill/preview-invoice/preview-invoice.component';
import { ReadyToBillComponent } from './ready-to-bill/ready-to-bill.component';

@NgModule({
  declarations: [
    InvoicesComponent,
    InvoicePdfComponent,
    BillingComponent,
    ReadyToBillComponent,
    ReadyToBillPreviewInvoiceComponent,
    EditChargesComponent
  ],
  imports: [CommonModule, BillingRoutingModule, PreBillModule, SharedModule, FixedFeePreBillSharedModule],
  exports:[IndexfinderPipe]
})
export class BillingModule {}
