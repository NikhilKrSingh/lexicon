import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RichTextEditorAllModule } from '@syncfusion/ej2-angular-richtexteditor';
import { BillingSettingsSharedModule } from '../shared/billing-settings/billing-settings.module';
import { SharedModule } from '../shared/shared.module';
import { OfficeAdminBillingComponent } from './billing/billing.component';
import { CustomizeOfficeRateComponent } from './billing/customize-rate/customize-rate.component';
import { BasicComponent } from './create/basic/basic.component';
import { CreateComponent } from './create/create.component';
import { DocumentsComponent } from './create/documents/documents.component';
import { OfficeEmployeeComponent } from './create/employee/employee.component';
import { LawOfficeNotesComponent } from './create/law-office-notes/law-office-notes.component';
import { NotificationsComponent } from './create/notifications/notifications.component';
import { SettingsComponent } from './create/settings/settings.component';
import { TrustAccountComponent } from './create/trust-account/trust-account.component';
import { DesignatedContactComponent } from './designated-contact/designated-contact.component';
import { ClientListComponent } from './detail/client-list/client-list.component';
import { DetailComponent } from './detail/detail.component';
import { ListComponent } from './list/list.component';
import { officeAdminRoutingModule } from './office-admin-routing.module';
import { TrustAccountSettingComponent } from './trust-account-setting/trust-account-setting.component';

@NgModule({
  declarations: [
    ListComponent,
    CreateComponent,
    DetailComponent,
    BasicComponent,
    OfficeEmployeeComponent,
    SettingsComponent,
    DocumentsComponent,
    LawOfficeNotesComponent,
    NotificationsComponent,
    OfficeAdminBillingComponent,
    CustomizeOfficeRateComponent,
    TrustAccountComponent,
    TrustAccountSettingComponent,
    ClientListComponent,
    DesignatedContactComponent
  ],
  imports: [
    CommonModule,
    officeAdminRoutingModule,
    SharedModule,
    RichTextEditorAllModule,
    BillingSettingsSharedModule
  ],
  entryComponents: [CustomizeOfficeRateComponent]
})
export class officeAdminModule {}
