import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackButtonRouteGuard } from 'src/app/guards/back-button-deactivate.guard';
import { AccountingIntegrationGuard, BillingGuard, DocumentGuard, FirmAccountingGuard, TenantGuard } from 'src/app/guards/permission-guard.service';
import { SettingComponent } from '../timekeeping/setting/setting.component';
import { AccountSettingsComponent } from './account-settings/account-settings.component';
import { AddAccountComponent } from './account-settings/add-account/add-account.component';
import { AccountingIntegrationsMappingComponent } from './accounting-integrations-mapping/accounting-integrations-mapping.component';
import { AccountingIntegrationsComponent } from './accounting-integrations/accounting-integrations.component';
import { BillingCodeRangesComponent } from './billing-code-ranges/billing-code-ranges.component';
import { EditBillingCodeRangesComponent } from './billing-code-ranges/edit-billing-code-ranges/edit-billing-code-ranges.component';
import { BillingCodeComponent } from './billing-code/billing-code.component';
import { FirmCalendarSettingsComponent } from './calendar-settings/calendar-settings.component';
import { ContentTemplateComponent } from './content-template/content-template.component';
import { BillGenFrequencyAuditHistoryComponent } from './firm-billing/billing-settings/bill-gen-frequency/bill-gen-frequency-audit-history/bill-gen-frequency-audit-history.component';
import { BillingSettingsComponent } from './firm-billing/billing-settings/settings.component';
import { FirmChargeCodeAuditHistoryComponent } from './firm-billing/charge-codes/charge-code-audit-history/charge-code-audit-history.component';
import { FirmChargeCodesComponent } from './firm-billing/charge-codes/charge-codes.component';
import { DisbursementAuditHistoryComponent } from './firm-billing/disbursement/disbursement-audit-history/disbursement-audit-history.component';
import { FirmDisbursementTypesComponent } from './firm-billing/disbursement/disbursement.component';
import { DocumentSettingComponent } from './firm-billing/document-setting/document-setting.component';
import { ReplaceDocumentComponent } from './firm-billing/document-setting/replace-document/replace-document.component';
import { UploadDocumentComponent } from './firm-billing/document-setting/upload-document/upload-document.component';




import { CreateRateTableComponent } from './firm-billing/rate-table/create-rate-table/create-rate-table.component';
import { FirmRateTableAuditHistoryComponent } from './firm-billing/rate-table/rate-table-audit-history/rate-table-audit-history.component';
import { FirmRateTableComponent } from './firm-billing/rate-table/rate-table/rate-table.component';


import { CreateDemoTableComponent } from './firm-billing/demo-table/create-demo-table/create-demo-table.component';
import { FirmDemoTableAuditHistoryComponent } from './firm-billing/demo-table/demo-table-audit-history/demo-table-audit-history.component';
import { FirmDemoTableComponent } from './firm-billing/demo-table/demo-table/demo-table.component';



import { FixedFreeServiceComponent } from './fixed-free-service/fixed-free-service.component';
import { GeneralComponent } from './general/general.component';
import { HierarchyComponent } from './hierarchy/hierarchy.component';
import { JobFamiliesCreateComponent } from './job-families/create/job-families-create.component';
import { JobFamiliesComponent } from './job-families/job-families.component';
import { PreviewTemplateComponent } from './content-template/preview-template/preview-template.component';

const routes: Routes = [
  {
    path: 'general',
    component: GeneralComponent,
    canActivate: [TenantGuard],
    canDeactivate: [BackButtonRouteGuard],
  },
  {
    path: 'hierarchy',
    component: HierarchyComponent,
    canActivate: [TenantGuard],
  },
  {
    path: 'charge-codes',
    component: FirmChargeCodesComponent,
    canActivate: [BillingGuard],
    data: { type: 'admin' },
  },
  {
    path: 'disbursement-types',
    component: FirmDisbursementTypesComponent,
    canActivate: [BillingGuard],
    data: { type: 'admin' },
  },
  {
    path: 'disbursement-audit-history',
    component: DisbursementAuditHistoryComponent,
  },
  {
    path: 'bill-gen-frequency-audit-history',
    component: BillGenFrequencyAuditHistoryComponent,
  },
  {
    path: 'billing-settings',
    component: BillingSettingsComponent,
    canActivate: [BillingGuard],
    data: { type: 'admin' },
    canDeactivate: [BackButtonRouteGuard],
  },
  {
    path: 'account-settings',
    component: AccountSettingsComponent,
    canActivate: [FirmAccountingGuard],
    data: { type: 'admin' },
    canDeactivate: [BackButtonRouteGuard],
  },
  {
    path: 'accounting-integrations',
    component: AccountingIntegrationsComponent,
    canActivate: [AccountingIntegrationGuard],
    data: { type: 'admin' },
    canDeactivate: [BackButtonRouteGuard],
  },
  {
    path: 'accounting-integrations-mapping',
    component: AccountingIntegrationsMappingComponent,
    canActivate: [AccountingIntegrationGuard],
    data: { type: 'admin' },
    canDeactivate: [BackButtonRouteGuard],
  },
  {
    path: 'document-setting',
    component: DocumentSettingComponent,
    canActivate: [DocumentGuard],
    canDeactivate: [BackButtonRouteGuard],
  },
  {
    path: 'document-setting/upload-document',
    component: UploadDocumentComponent,
    canActivate: [DocumentGuard],
  },
  {
    path: 'document-setting/replace-document',
    component: ReplaceDocumentComponent,
    canActivate: [DocumentGuard],
  },
  {
    path: 'document-setting/:tab',
    component: DocumentSettingComponent,
    canActivate: [DocumentGuard],
    canDeactivate: [BackButtonRouteGuard],
  },
  {
    path: 'calendar-settings',
    component: FirmCalendarSettingsComponent,
    canActivate: [TenantGuard],
    canDeactivate: [BackButtonRouteGuard],
  },
  {
    path: 'timekeeping-setting',
    component: SettingComponent,
    pathMatch: 'full',
    canDeactivate: [BackButtonRouteGuard],
  },
  {
    path: 'charge-code-audit-hisory',
    component: FirmChargeCodeAuditHistoryComponent,
  },
  
  




  {
    path: 'rate-table',
    component: FirmRateTableComponent,
    canActivate: [BillingGuard],
    data: { type: 'bill' },
  },
  {
    path: 'create-rate-table',
    component: CreateRateTableComponent,
    canActivate: [BillingGuard],
    data: { type: 'bill' },
  },
  {
    path: 'edit-rate-table',
    component: CreateRateTableComponent,
    canActivate: [BillingGuard],
    data: { type: 'bill' },
  },
  {
    path: 'view-rate-table',
    component: CreateRateTableComponent,
    canActivate: [BillingGuard],
    data: { type: 'bill' },
  },
  {
    path: 'rate-table-audit-history',
    component: FirmRateTableAuditHistoryComponent,
  },





{
    path: 'demo-table',
    component: FirmDemoTableComponent,
    canActivate: [BillingGuard],
    data: { type: 'bill' },
  },
  {
    path: 'create-demo-table',
    component: CreateDemoTableComponent,
    canActivate: [BillingGuard],
    data: { type: 'bill' },
  },
  {
    path: 'edit-demo-table',
    component: CreateDemoTableComponent,
    canActivate: [BillingGuard],
    data: { type: 'bill' },
  },
  {
    path: 'view-demo-table',
    component: CreateDemoTableComponent,
    canActivate: [BillingGuard],
    data: { type: 'bill' },
  },
  {
    path: 'demo-table-audit-history',
    component: FirmDemoTableAuditHistoryComponent,
  },




  {
    path: 'content-template',
    component: ContentTemplateComponent,
    canActivate: [BillingGuard],
    canDeactivate: [BackButtonRouteGuard],
    data: { type: 'admin' },
  },
  {
    path: 'content-template/preview-template/:templateId',
    component: PreviewTemplateComponent,
    canActivate: [BillingGuard],
    data: { type: 'admin' },
  },
  {
    path: 'fixed-fee-services',
    component: FixedFreeServiceComponent,
    canActivate: [BillingGuard],
    data: { type: 'admin' },
  },
  {
    path: 'billing-codes',
    component: BillingCodeComponent,
    canActivate: [BillingGuard],
    data: { type: 'bill' },
  },
  {
    path: 'job-families',
    component: JobFamiliesComponent,
  },
  {
    path: 'job-families/create',
    component: JobFamiliesCreateComponent,
  },
  {
    path: 'job-families/edit/:jobFamilyId',
    component: JobFamiliesCreateComponent,
  },
  {
    path: 'code-ranges',
    component: BillingCodeRangesComponent,
  },
  {
    path: 'edit-code-ranges',
    component: EditBillingCodeRangesComponent,
  },
  {
    path: 'add-account',
    component: AddAccountComponent,
  },
  {
    canActivate: [TenantGuard],
    data: { type: 'admin' },
  },
  { path: '', redirectTo: 'general', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FirmRoutingModule {}
