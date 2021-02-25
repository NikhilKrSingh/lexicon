import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxMaskModule } from 'ngx-mask';
import { ClientBackButtonRouteGuard } from '../../../guards/client-back-button-deactivate.guard';
import { BillingSettingsSharedModule } from '../../shared/billing-settings/billing-settings.module';
import { SharedModule } from '../../shared/shared.module';
import { CreateClientModule } from '../creating/create-client.module';
import { AssociationsComponent } from './associations/associations.component';
import { BillingComponent } from './billing/billing.component';
import { ClientViewRoutingModule } from './client-view-routing.module';
import { CorporateComponent } from './corporate/corporate.component';
import { ClientViewNotesComponent } from './notes/notes.component';
import { ReassignClientComponent } from './reassign-client/reassign-client.component';
import { AddBlockedUsersComponent } from './corporate/add-blocked-users/add-blocked-users.component';

@NgModule({
  declarations: [
    CorporateComponent,
    BillingComponent,
    AssociationsComponent,
    ClientViewNotesComponent,
    ReassignClientComponent,
    AddBlockedUsersComponent
  ],
  imports: [
    NgxDatatableModule,
    SharedModule,
    CommonModule,
    ClientViewRoutingModule,
    FormsModule,
    BillingSettingsSharedModule,
    ReactiveFormsModule,
    NgxMaskModule.forRoot(),
    CreateClientModule
  ],
  providers: [ClientBackButtonRouteGuard],
  entryComponents: [AddBlockedUsersComponent]
})
export class ClientViewModule {}
