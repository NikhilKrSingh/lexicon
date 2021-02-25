import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackButtonRouteGuard } from 'src/app/guards/back-button-deactivate.guard';
import { BillingGuard } from 'src/app/guards/permission-guard.service';
import { BillingComponent } from './billing.component';
import { EditChargesComponent } from './invoices/edit-charges/edit-charges.component';
import { InvoicePdfComponent } from './invoices/invoice-pdf/invoice-pdf.component';
import { PreviewPreBillInvoiceComponent } from './pre-bill/view/preview-invoice/preview-invoice.component';
import { PreBillViewComponent } from './pre-bill/view/view.component';
import { ReadyToBillPreviewInvoiceComponent } from './ready-to-bill/preview-invoice/preview-invoice.component';

const routes: Routes = [
  {
    path: '',
    component: BillingComponent,
    canActivate: [BillingGuard],
    data: { type: 'edit' },
  },
  { path: 'pre-bills', redirectTo: '', pathMatch: 'full' },
  { path: 'pre-bills/list', redirectTo: '', pathMatch: 'full' },
  { path: 'pre-bills/view', component: PreBillViewComponent },
  {
    path: 'pre-bills/preview-invoice',
    component: PreviewPreBillInvoiceComponent,
  },
  {
    path: 'ready-to-bill/preview-invoice',
    component: ReadyToBillPreviewInvoiceComponent,
  },
  {
    path: 'invoices/pdf',
    component: InvoicePdfComponent,
  },
  {
    path: 'invoices',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'invoice/edit-charges',
    component: EditChargesComponent,
    canDeactivate: [BackButtonRouteGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BillingRoutingModule {}
