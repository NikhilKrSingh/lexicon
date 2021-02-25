import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PreBillListComponent } from './list/list.component';
import { PreviewPreBillInvoiceComponent } from './view/preview-invoice/preview-invoice.component';
import { PreBillViewComponent } from './view/view.component';

const routes: Routes = [
  { path: 'list', component: PreBillListComponent },
  { path: 'view', component: PreBillViewComponent },
  { path: 'preview-invoice', component: PreviewPreBillInvoiceComponent },
  { path: '', redirectTo: 'list', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PreBillRoutingModule {}
