import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxMaskModule } from 'ngx-mask';
import { MatterModule } from '../../matter/matter.module';
import { BillingSettingsSharedModule } from '../../shared/billing-settings/billing-settings.module';
import { SharedModule } from '../../shared/shared.module';
import { ClientAddNoteComponent } from './add-note/add-note.component';
import { ClientBasicInfoComponent } from './basic-info/basic-info.component';
import { ClientBillingInfoComponent } from './billing-info/billing-info.component';
import { ClientPaymentMethodComponent } from './billing-info/client-payment-method/client-payment-method.component';
import { ClientRateTableComponent } from './billing-info/client-rate-table/client-rate-table.component';
import { AddClientEventComponent } from './calendar-event/add-client-event/add-client-event.component';
import { ClientCalendarEventComponent } from './calendar-event/calendar-event.component';
import { CreateClientRoutingModule } from './create-client-routing.module';
import { ClientCreatingComponent } from './creating.component';
import { ClientAttorneySearchComponent } from './matter-details/attorney-search/attorney-search.component';
import { ClientMatterDetailsComponent } from './matter-details/matter-details.component';
import { ClientPropertyHeldInTrustComponent } from './trust-accounting/client-property-held-in-trust/client-property-held-in-trust.component';
import { ClientTrustOnlyAccountComponent } from './trust-accounting/client-trust-only-account/client-trust-only-account.component';
import { ClientTrustAccountingComponent } from './trust-accounting/trust-accounting.component';
import { ClientUploadDocumentComponent } from './upload-document/upload-document.component';
import { MalihuScrollbarModule } from 'ngx-malihu-scrollbar';


@NgModule({
  declarations: [
    ClientAddNoteComponent,
    ClientBasicInfoComponent,
    ClientBillingInfoComponent,
    ClientCalendarEventComponent,
    ClientMatterDetailsComponent,
    ClientTrustAccountingComponent,
    ClientUploadDocumentComponent,
    ClientCreatingComponent,
    ClientRateTableComponent,
    AddClientEventComponent,
    ClientTrustOnlyAccountComponent,
    ClientPropertyHeldInTrustComponent,
    ClientPaymentMethodComponent,
    ClientAttorneySearchComponent,
  ],
  exports: [
    ClientAddNoteComponent,
    ClientBasicInfoComponent,
    ClientBillingInfoComponent,
    ClientCalendarEventComponent,
    ClientMatterDetailsComponent,
    ClientTrustAccountingComponent,
    ClientUploadDocumentComponent,
    ClientCreatingComponent,
    ClientRateTableComponent,
    ClientAttorneySearchComponent
  ],
  imports: [
    NgxDatatableModule,
    SharedModule,
    CommonModule,
    CreateClientRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgxMaskModule.forRoot(),
    MalihuScrollbarModule.forRoot(),
    BillingSettingsSharedModule,
    MatterModule
  ],
  entryComponents: [
    AddClientEventComponent,
    ClientRateTableComponent,
    ClientAttorneySearchComponent
  ],
})
export class CreateClientModule {}
