import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { BrMaskerModule } from 'br-mask';
import { NgxMaskModule } from 'ngx-mask';

import { CreateClientModule } from '../client/creating/create-client.module';
import { MatterModule } from '../matter/matter.module';
import { BillingSettingsSharedModule } from '../shared/billing-settings/billing-settings.module';
import { SharedModule } from '../shared/shared.module';
import { ContactRoutingModule } from './contact-routing.module';
import { PotentialClientBillingDetailsModule } from './view-potential-client/potential-client-billing-details/potential-client-billing-details.module';

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
import { BasicDetailsComponent } from './new-client-retention-intake/basic-details/basic-details.component';
import { NewClientRetentionIntakeComponent } from './new-client-retention-intake/new-client-retention-intake.component';
import { PotentialClientComponent } from './potential-client/potential-client.component';
import { PCAdvanceSearchComponent } from './reassign-client/advance-search/advance-search.component';
import { ReassignClientComponent } from './reassign-client/reassign-client.component';
import { RecordInitialComponent } from './record-initial/record-initial.component';
import { RescheduleInitialConsultationComponent } from './reschedule-initial-consultation/reschedule-initial-consultation.component';
import { InitialConsultationComponent } from './view-potential-client/initial-consultation/initial-consultation.component';
import { ViewPotentialClientComponent } from './view-potential-client/view-potential-client.component';
import { AddCompanyComponent } from './create-corporate-contact/add-company/add-company.component';
import { PaymentSharedModule } from '../shared/payment-shared/payment-shared.module';
import { ViewPotentialClientInvoicesComponent } from './view-potential-client/view-potential-client-invoices/view-potential-client-invoices.component';
import { EditChargesPotentialClientComponent } from './view-potential-client/view-potential-client-invoices/edit-charges-potential-client/edit-charges-potential-client.component';

@NgModule({
  declarations: [
    AllContactsComponent,
    PotentialClientComponent,
    CorporateContactComponent,
    ClientAssociationComponent,
    ViewPotentialClientComponent,
    EditPotentialClientComponent,
    EditPotentialClientAssociationsComponent,
    ReassignClientComponent,
    EditMatterDetailsComponent,
    ManageInitialConsultationComponent,
    RescheduleInitialConsultationComponent,
    CancelInitialConsultationComponent,
    MarkNoShowComponent,
    CreateClientAssociationComponent,
    CreateCorporateContactComponent,
    EditCorporateContactComponent,
    DoNotContactComponent,
    RecordInitialComponent,
    InitialConsultationComponent,
    NewClientRetentionIntakeComponent,
    BasicDetailsComponent,
    PCAdvanceSearchComponent,
    AddCompanyComponent,
    ViewPotentialClientInvoicesComponent,
    EditChargesPotentialClientComponent
  ],
  imports: [
    CommonModule,
    ContactRoutingModule,
    SharedModule,
    NgxDatatableModule,
    BrMaskerModule,
    BillingSettingsSharedModule,
    MatterModule,
    NgxMaskModule.forRoot(),
    CreateClientModule,
    PaymentSharedModule,
    PotentialClientBillingDetailsModule,
  ],
  entryComponents: [PCAdvanceSearchComponent, AddCompanyComponent],
})
export class ContactModule {}
