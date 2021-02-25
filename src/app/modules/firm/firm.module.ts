import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { GridsterModule } from 'angular-gridster2';
import { SharedModule } from '../shared/shared.module';
import { SettingComponent } from '../timekeeping/setting/setting.component';
import { AccountSettingsComponent } from './account-settings/account-settings.component';
import { AddAccountComponent } from './account-settings/add-account/add-account.component';
import { AccountingIntegrationsMappingComponent } from './accounting-integrations-mapping/accounting-integrations-mapping.component';
import { AccountingIntegrationsComponent } from './accounting-integrations/accounting-integrations.component';
import { BillingCodeRangesComponent } from './billing-code-ranges/billing-code-ranges.component';
import { EditBillingCodeRangesComponent } from './billing-code-ranges/edit-billing-code-ranges/edit-billing-code-ranges.component';
import { BillingCodeComponent } from './billing-code/billing-code.component';
import { FirmCalendarSettingsComponent } from './calendar-settings/calendar-settings.component';
import { AddTemplateComponent } from './content-template/add-template/add-template.component';
import { ContentTemplateComponent } from './content-template/content-template.component';
import { InvoiceCustomContentComponent } from './content-template/invoice-custom-content/invoice-custom-content.component';
import { ReceiptTemplateComponent } from './content-template/receipt-template/receipt-template.component';
import { DashboardConfigurationComponent } from './dashboard-configuration/dashboard-configuration.component';
import { ReplaceDocumentComponent } from './firm-billing/document-setting/replace-document/replace-document.component';
import { UploadDocumentComponent } from './firm-billing/document-setting/upload-document/upload-document.component';
import { FirmBillingModule } from './firm-billing/firm-billing.module';
import { FirmRoutingModule } from './firm-routing.module';
import { FixedFeeAddOnComponent } from './fixed-fee-add-on/fixed-fee-add-on.component';
import { FixedFreeServiceComponent } from './fixed-free-service/fixed-free-service.component';
import { GeneralComponent } from './general/general.component';
import { MatterTypeComponent } from './general/matter-type/matter-type.component';
import { PracticeAreaComponent } from './general/practice-area/practice-area.component';
import { CreateCustomHierarchyLevelComponent } from './hierarchy/custom-level/custom-level.component';
import { CreateCustomHierarchyNodeComponent } from './hierarchy/custom-node/custom-node.component';
import { DeleteHierarchyLevelComponent } from './hierarchy/delete-level/delete-level.component';
import { DeleteHierarchyNodeComponent } from './hierarchy/delete-node/delete-node.component';
import { HierarchyComponent } from './hierarchy/hierarchy.component';
import { JobFamiliesCreateComponent } from './job-families/create/job-families-create.component';
import { JobFamiliesComponent } from './job-families/job-families.component';
import { JobFamiliesEmployeesComponent } from './job-families/job-families-employees/job-families-employees.component';
import { SetRatesComponent } from './job-families/set-rates/set-rates.component';
import { PreviewTemplateComponent } from './content-template/preview-template/preview-template.component';

@NgModule({
  declarations: [
    GeneralComponent,
    HierarchyComponent,
    PracticeAreaComponent,
    MatterTypeComponent,
    CreateCustomHierarchyNodeComponent,
    CreateCustomHierarchyLevelComponent,
    DeleteHierarchyLevelComponent,
    DeleteHierarchyNodeComponent,
    FirmCalendarSettingsComponent,
    SettingComponent,
    ContentTemplateComponent,
    InvoiceCustomContentComponent,
    ReceiptTemplateComponent,
    AddTemplateComponent,
    FixedFreeServiceComponent,
    UploadDocumentComponent,
    BillingCodeComponent,
    JobFamiliesComponent,
    FixedFeeAddOnComponent,
    BillingCodeRangesComponent,
    EditBillingCodeRangesComponent,
    ReplaceDocumentComponent,
    AccountSettingsComponent,
    AddAccountComponent,
    JobFamiliesCreateComponent,
    DashboardConfigurationComponent,
    AccountingIntegrationsComponent,
    AccountingIntegrationsMappingComponent,
    JobFamiliesEmployeesComponent,
    SetRatesComponent,
    PreviewTemplateComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    FirmRoutingModule,
    FirmBillingModule,
    GridsterModule
  ],
  entryComponents: [
    PracticeAreaComponent,
    MatterTypeComponent,
    CreateCustomHierarchyNodeComponent,
    CreateCustomHierarchyLevelComponent,
    DeleteHierarchyLevelComponent,
    DeleteHierarchyNodeComponent,
    AddTemplateComponent,
    JobFamiliesEmployeesComponent,
    SetRatesComponent
  ]
})
export class FirmModule {}
