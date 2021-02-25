import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { BillGenFrequencyAuditHistoryComponent } from './billing-settings/bill-gen-frequency/bill-gen-frequency-audit-history/bill-gen-frequency-audit-history.component';
import { BillGenFrequencyComponent } from './billing-settings/bill-gen-frequency/bill-gen-frequency.component';
import { InvoicesComponent } from './billing-settings/invoices/invoices.component';
import { OperatingAccountComponent } from './billing-settings/operating-account/operating-account.component';
import { PaymentPlansComponent } from './billing-settings/payment-plans/payment-plans.component';
import { BillingSettingsComponent } from './billing-settings/settings.component';
import { TimeEntryGracePeriodComponent } from './billing-settings/time-entry-grace-period/time-entry-grace-period.component';
import { TimeRoudingIntervalComponent } from './billing-settings/time-rouding-interval/time-rouding-interval.component';
import { FirmChargeCodeAuditHistoryComponent } from './charge-codes/charge-code-audit-history/charge-code-audit-history.component';
import { FirmChargeCodesComponent } from './charge-codes/charge-codes.component';
import { CreateChargeCodeComponent } from './charge-codes/create-charge-code/create-charge-code.component';
import { EditChargeCodeComponent } from './charge-codes/edit-charge-code/edit-charge-code.component';
import { CommonCreateCodeComponent } from './common-create-code/common-create-code.component';
import { AddDisbursementTypeComponent } from './disbursement/add-disbursement-type/add-disbursement-type.component';
import { DisbursementAuditHistoryComponent } from './disbursement/disbursement-audit-history/disbursement-audit-history.component';
import { FirmDisbursementTypesComponent } from './disbursement/disbursement.component';
import { EditDisbursementTypeComponent } from './disbursement/edit-disbursement-type/edit-disbursement-type.component';
import { BulkApprovalComponent } from './document-setting/bulk-approval/bulk-approval.component';
import { DocumentCategoriesComponent } from './document-setting/document-categories/document-categories.component';
import { DocumentPortalAccessComponent } from './document-setting/document-portal-access/document-portal-access.component';
import { DocumentSettingComponent } from './document-setting/document-setting.component';
import { ESignatureComponent } from './document-setting/e-signature/e-signature.component';
import { LexiconDocuSyncComponent } from './document-setting/lexicon-docu-sync/lexicon-docusync.component';
import { MatterFolderStructureComponent } from './document-setting/matter-folder-structure/matter-folder-structure.component';
import { PortalAccessHistoryComponent } from './document-setting/portal-access-history/portal-access-history.component';
import { PortalAccountsComponent } from './document-setting/portal-accounts/portal-accounts.component';

import { EditReversedCheckCodeComponent } from './reversed-check-code/edit-reversed-check-code/edit-reversed-check-code.component';
import { ReversedCheckCodeComponent } from './reversed-check-code/reversed-check-code.component';
import { EditWriteDownComponent } from './write-down/edit-write-down/edit-write-down.component';
import { WriteDownComponent } from './write-down/write-down.component';
import { EditWriteOffComponent } from './write-off/edit-write-off/edit-write-off.component';
import { WriteOffComponent } from './write-off/write-off.component';
import { ConsultationCodesComponent } from './consultation-codes/consultation-codes.component';
import { EditConsultationCodeComponent } from './consultation-codes/edit-consultation-code/edit-consultation-code.component';



import { ConfirmModelComponent } from './rate-table/create-rate-table/confirm-model/confirm-model.component';
import { CreateRateTableComponent } from './rate-table/create-rate-table/create-rate-table.component';
import { FirmRateTableAuditHistoryComponent } from './rate-table/rate-table-audit-history/rate-table-audit-history.component';
import { FirmRateTableComponent } from './rate-table/rate-table/rate-table.component';
import { SetRatesComponent } from './rate-table/set-rates/set-rates.component'


import { ConfirmDemoModelComponent } from './demo-table/create-demo-table/confirm-demo-model/confirm-demo-model.component';
import { CreateDemoTableComponent } from './demo-table/create-demo-table/create-demo-table.component';
import { FirmDemoTableAuditHistoryComponent } from './demo-table/demo-table-audit-history/demo-table-audit-history.component';
import { FirmDemoTableComponent } from './demo-table/demo-table/demo-table.component';
import { SetDemoComponent } from './demo-table/set-demo/set-demo.component'

@NgModule({
  declarations: [
    FirmChargeCodesComponent,
    FirmDisbursementTypesComponent,
    BillingSettingsComponent,
    CreateChargeCodeComponent,
    EditChargeCodeComponent,
    AddDisbursementTypeComponent,
    EditDisbursementTypeComponent,
    BillGenFrequencyComponent,
    InvoicesComponent,
    TimeEntryGracePeriodComponent,
    TimeRoudingIntervalComponent,
    DocumentPortalAccessComponent,
    PaymentPlansComponent,
    DisbursementAuditHistoryComponent,
    BillGenFrequencyAuditHistoryComponent,
    FirmChargeCodeAuditHistoryComponent,



    FirmRateTableComponent,
    FirmRateTableAuditHistoryComponent,


    FirmDemoTableComponent,
    FirmDemoTableAuditHistoryComponent,



    DocumentSettingComponent,
    BulkApprovalComponent,
    MatterFolderStructureComponent,
    DocumentCategoriesComponent,
    PortalAccessHistoryComponent,
    PortalAccountsComponent,
    OperatingAccountComponent,
    ESignatureComponent,
    LexiconDocuSyncComponent,
    CommonCreateCodeComponent,
    WriteOffComponent,
    EditWriteOffComponent,
    WriteDownComponent,
    EditWriteDownComponent,
    ReversedCheckCodeComponent,
    EditReversedCheckCodeComponent,


    CreateRateTableComponent,
    SetRatesComponent,
    ConfirmModelComponent,


    CreateDemoTableComponent,
    SetDemoComponent,
    ConfirmDemoModelComponent,




    ConsultationCodesComponent,
    EditConsultationCodeComponent
  ],
  imports: [CommonModule, SharedModule, RouterModule],
  entryComponents: [
    CommonCreateCodeComponent,
    CreateChargeCodeComponent,
    EditChargeCodeComponent,
    AddDisbursementTypeComponent,
    EditDisbursementTypeComponent,
    EditWriteOffComponent,
    EditWriteDownComponent,
    EditReversedCheckCodeComponent,
    
    
    SetRatesComponent,
    ConfirmModelComponent,

  SetDemoComponent,
  ConfirmDemoModelComponent,

    EditConsultationCodeComponent
  ],
  exports: [
    BillingSettingsComponent,
    FirmChargeCodesComponent,
    FirmDisbursementTypesComponent,
    FirmChargeCodeAuditHistoryComponent,
    WriteOffComponent,
    WriteDownComponent,
    ReversedCheckCodeComponent,
    ConsultationCodesComponent,
    EditConsultationCodeComponent
  ]
})
export class FirmBillingModule {}
