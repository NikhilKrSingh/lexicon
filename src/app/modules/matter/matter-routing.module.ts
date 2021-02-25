import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackButtonRouteGuard } from 'src/app/guards/back-button-deactivate.guard';
import { MatterGuard } from 'src/app/guards/permission-guard.service';
import { ClientBackButtonRouteGuard } from "../../guards/client-back-button-deactivate.guard";
import { AlertComponent } from './management/alert/alert.component';
import { BillNowComponent } from './management/dashboard/bill-now/bill-now.component';
import { CorporateContactComponent } from "./management/dashboard/corporate-contact/corporate-contact.component";
import { DashboardComponent } from './management/dashboard/dashboard.component';
import { EditComponent } from './management/edit/edit.component';
import { ListComponent } from './management/list/list.component';
import { PostPaymentTrustComponent } from './management/post-payment-trust/post-payment-trust.component';
import { PostPaymentComponent } from '../shared/payment-shared/post-payment/post-payment.component';
import { ReAssignComponent } from './management/re-assign/re-assign.component';
import { RefundComponent } from '../shared/payment-shared/refund/refund.component';
import { NewMatterWizardComponent } from './new-matter-wizard/new-matter-wizard.component';
import { BillNowPreviewInvoiceComponent } from '../shared/bill-now-preview-invoice/bill-now-preview-invoice.component';

const routes: Routes = [
  {
    path: 'create',
    component: NewMatterWizardComponent,
    canActivate: [MatterGuard],
    canDeactivate: [BackButtonRouteGuard],
    data: { type: 'admin' }
  },
  {
    path: 'list',
    component: ListComponent,
    canActivate: [MatterGuard],
    data: { type: 'list' }
  },
  { path: 'dashboard', component: DashboardComponent, canDeactivate: [ClientBackButtonRouteGuard] },
  {
    path: 'reassign',
    component: ReAssignComponent,
    canDeactivate: [BackButtonRouteGuard],
    data: { type: 'reassign' }
  },
  {
    path: 'edit',
    component: EditComponent,
    canActivate: [MatterGuard],
    canDeactivate: [BackButtonRouteGuard],
    data: { type: 'edit' }
  },
  { path: 'alert', component: AlertComponent },
  {
    path: 'post-payment',
    component: PostPaymentComponent,
    canDeactivate: [BackButtonRouteGuard]
  },
  {
    path: 'post-payment-trust',
    component: PostPaymentTrustComponent,
    canDeactivate: [BackButtonRouteGuard]
  },
  {
    path: 'refund-client-trust',
    component: RefundComponent,
    canDeactivate: [BackButtonRouteGuard]
  },
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  { path: 'bill-now', component: BillNowComponent },
  { path: 'bill-now-invoice', component: BillNowPreviewInvoiceComponent },
  { path: 'modify-corporate-contact', component: CorporateContactComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [ClientBackButtonRouteGuard]
})
export class MatterRoutingModule {}
