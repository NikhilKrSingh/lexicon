import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackButtonRouteGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ContactGuard } from 'src/app/guards/permission-guard.service';
import { AllContactsComponent } from './all-contacts/all-contacts.component';
import { CancelInitialConsultationComponent } from './cancel-initial-consultation/cancel-initial-consultation.component';
import { ClientAssociationComponent } from './client-association/client-association.component';
import { CorporateContactComponent } from './corporate-contact/corporate-contact.component';
import { CreateClientAssociationComponent } from './create-client-association/create-client-association.component';
import { CreateCorporateContactComponent } from './create-corporate-contact/create-corporate-contact.component';
import { DoNotContactComponent } from './do-not-contact/do-not-contact.component';
import { EditCorporateContactComponent } from './edit-corporate-contact/edit-corporate-contact.component';
import { EditMatterDetailsComponent } from './edit-matter-details/edit-matter-details.component';
import { EditPotentialClientAssociationsComponent } from './edit-potential-client-associations/edit-potential-client-associations.component';
import { EditPotentialClientComponent } from './edit-potential-client/edit-potential-client.component';
import { ManageInitialConsultationComponent } from './manage-initial-consultation/manage-initial-consultation.component';
import { MarkNoShowComponent } from './mark-no-show/mark-no-show.component';
import { NewClientRetentionIntakeComponent } from './new-client-retention-intake/new-client-retention-intake.component';
import { PotentialClientComponent } from './potential-client/potential-client.component';
import { ReassignClientComponent } from './reassign-client/reassign-client.component';
import { RescheduleInitialConsultationComponent } from './reschedule-initial-consultation/reschedule-initial-consultation.component';
import { ViewPotentialClientComponent } from './view-potential-client/view-potential-client.component';
import { RefundComponent } from '../shared/payment-shared/refund/refund.component';
import { BillNowComponent } from "./view-potential-client/potential-client-billing-details/bill-now/bill-now.component";
import { BillNowPreviewInvoiceComponent } from '../shared/bill-now-preview-invoice/bill-now-preview-invoice.component';
import { EditChargesPotentialClientComponent } from './view-potential-client/view-potential-client-invoices/edit-charges-potential-client/edit-charges-potential-client.component';

import { PostPaymentComponent } from '../shared/payment-shared/post-payment/post-payment.component';
const routes: Routes = [
  {
    path: 'all-contact',
    component: AllContactsComponent,
    canActivate: [ContactGuard],
    data: { type: 'view' }
  },
  {
    path: 'potential-client',
    component: PotentialClientComponent,
    canActivate: [ContactGuard],
    data: { type: 'view' }
  },
  {
    path: 'corporate-contact',
    component: CorporateContactComponent,
    canActivate: [ContactGuard],
    data: { type: 'view' }
  },
  {
    path: 'client-associations',
    component: ClientAssociationComponent,
    canActivate: [ContactGuard],
    data: { type: 'view' }
  },
  {
    path: 'view-potential-client',
    component: ViewPotentialClientComponent,
    canActivate: [ContactGuard],
    data: { type: 'view' }
  },
  { path: 'edit-potential-client', component: EditPotentialClientComponent },
  {
    path: 'edit-potential-client-associations',
    component: EditPotentialClientAssociationsComponent
  },
  {
    path: 'reassign-client',
    component: ReassignClientComponent,
    canActivate: [ContactGuard],
    canDeactivate: [BackButtonRouteGuard],
    data: { type: 'edit' }
  },
  {
    path: 'edit-matter-details',
    component: EditMatterDetailsComponent,
    canActivate: [ContactGuard],
    canDeactivate: [BackButtonRouteGuard],
    data: { type: 'edit' }
  },
  {
    path: 'manage-initial-consultation',
    component: ManageInitialConsultationComponent
  },
  {
    path: 'reschedule-initial-consultation',
    component: RescheduleInitialConsultationComponent
  },
  {
    path: 'cancel-initial-consultation',
    component: CancelInitialConsultationComponent
  },
  { path: 'mark-no-show', component: MarkNoShowComponent },
  {
    path: 'create-client-association',
    component: CreateClientAssociationComponent,
    canActivate: [ContactGuard],
    canDeactivate: [BackButtonRouteGuard],
    data: { type: 'edit' }
  },
  {
    path: 'edit-client-association',
    component: CreateClientAssociationComponent,
    canDeactivate: [BackButtonRouteGuard],
    data: { type: 'edit' }
  },
  {
    path: 'create-corporate-contact',
    component: CreateCorporateContactComponent,
    canDeactivate: [BackButtonRouteGuard],
    data: { type: 'edit' }
  },
  {
    path: 'edit-corporate-contact',
    component: EditCorporateContactComponent,
    canActivate: [ContactGuard],
    data: { type: 'edit' }
  },
  { path: 'do-not-contact', component: DoNotContactComponent },
  {
    path: 'client-conversion',
    component: NewClientRetentionIntakeComponent,
    canActivate: [ContactGuard],
    canDeactivate: [BackButtonRouteGuard],
    data: { type: 'edit' }
  },
  {
    path: 'refund-potential-client',
    component: RefundComponent,
    canDeactivate: [BackButtonRouteGuard]
  },
  {
    path: 'bill-potential-client',
    component: BillNowComponent,
    canDeactivate: [BackButtonRouteGuard]
  },
  {
    path: 'post-payment',
    component: PostPaymentComponent,
    canDeactivate: [BackButtonRouteGuard]
  },
  { path: 'bill-now-invoice', component: BillNowPreviewInvoiceComponent },
  {
    path: 'edit-charges-potential-client',
    component: EditChargesPotentialClientComponent,
    canDeactivate: [BackButtonRouteGuard]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContactRoutingModule {}
