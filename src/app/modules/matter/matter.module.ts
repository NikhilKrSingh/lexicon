import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ThemeService } from 'ng2-charts';
import { MalihuScrollbarModule } from 'ngx-malihu-scrollbar';

import { ClientBackButtonRouteGuard } from '../../guards/client-back-button-deactivate.guard';
import { BillingSettingsSharedModule } from '../shared/billing-settings/billing-settings.module';
import { FixedFeePreBillSharedModule } from '../shared/fixed-fee-pre-bill/fixed-fee-pre-bill.module';
import { SharedModule } from '../shared/shared.module';
import { PaymentSharedModule } from '../shared/payment-shared/payment-shared.module';
import { TrustTransactionHistoryModule } from './management/dashboard/trust-transaction-history/trust-transaction-history.module';

import { TrustAccountingComponent } from './creating/trust-accounting/trust-accounting.component';
import { AlertComponent } from './management/alert/alert.component';
import { CreateMatterAlertComponent } from './management/alert/create-alert/create-alert.component';
import { MatterActivityHistoryComponent } from './management/dashboard/activity-history/activity-history.component';
import { AddMatterNoteComponent } from './management/dashboard/add-note/add-note.component';
import { BillNowComponent } from './management/dashboard/bill-now/bill-now.component';
import { BillNowWriteOffComponent } from './management/dashboard/bill-now/write-off/write-off.component';
import { CloseMatterComponent } from './management/dashboard/close-matter/close-matter.component';
import { CorporateContactComponent } from './management/dashboard/corporate-contact/corporate-contact.component';
import { DashboardComponent } from './management/dashboard/dashboard.component';
import { MatterDocumentsComponent } from './management/dashboard/documents/documents.component';
import { MatterInvoicesComponent } from './management/dashboard/invoices/invoices.component';
import { MatterDashboardAssociationsComponent } from './management/dashboard/matter-dashboard-associations/matter-dashboard-associations.component';
import { MatterProgressComponent } from './management/dashboard/matter-progress/matter-progress.component';
import { MatterDashboardNotesComponent } from './management/dashboard/notes/notes.component';
import { MatterDashboardOverviewComponent } from './management/dashboard/overview/overview.component';
import { ReopenMatterComponent } from './management/dashboard/reopen-matter/reopen-matter.component';
import { TrustAccountingMatterDashboardComponent } from './management/dashboard/trust-accounting-matter-dashboard/trust-accounting-matter-dashboard.component';
import { AddBlockedEmployeeComponent } from './management/edit/blocked-employee/blocked-employee.component';
import { EditComponent } from './management/edit/edit.component';
import { ListComponent } from './management/list/list.component';
import { MatterPostPaymentTrustModule } from './management/post-payment-trust/post-payment-trust.module';
import { ReAssignComponent } from './management/re-assign/re-assign.component';
import { MatterRoutingModule } from './matter-routing.module';
import { AddNotesComponent } from './new-matter-wizard/add-notes/add-notes.component';
import { BillingInformationComponent } from './new-matter-wizard/billing-information/billing-information.component';
import { RateTableComponent } from './new-matter-wizard/billing-information/rate-table/rate-table.component';
import { AddEventComponent } from './new-matter-wizard/create-calendar-event-new/add-event/add-event.component';
import { CreateCalendarEventNewComponent } from './new-matter-wizard/create-calendar-event-new/create-calendar-event-new.component';
import { AttorneySearchComponent } from './new-matter-wizard/matter-details/attorney-search/attorney-search.component';
import { MatterDetailsComponent } from './new-matter-wizard/matter-details/matter-details.component';
import { NewMatterWizardComponent } from './new-matter-wizard/new-matter-wizard.component';
import { TrustAccountComponent } from './new-matter-wizard/trust-account/trust-account.component';
import { TrustBankAccountsComponent } from './new-matter-wizard/trust-bank-accounts/trust-bank-accounts.component';
import { UploadDocumentNewComponent } from './new-matter-wizard/upload-document-new/upload-document-new.component';

@NgModule({
  imports: [
    CommonModule,
    MatterRoutingModule,
    SharedModule,
    MalihuScrollbarModule.forRoot(),
    BillingSettingsSharedModule,
    FixedFeePreBillSharedModule,
    MatterPostPaymentTrustModule,
    TrustTransactionHistoryModule,
    PaymentSharedModule,
  ],
  declarations: [
    ListComponent,
    ReAssignComponent,
    DashboardComponent,
    EditComponent,
    AlertComponent,
    AddMatterNoteComponent,
    MatterDashboardOverviewComponent,
    MatterDashboardNotesComponent,
    MatterActivityHistoryComponent,
    CreateMatterAlertComponent,
    CloseMatterComponent,
    AddBlockedEmployeeComponent,
    MatterInvoicesComponent,
    CorporateContactComponent,
    MatterDocumentsComponent,
    MatterProgressComponent,
    ReopenMatterComponent,
    BillNowComponent,
    BillNowWriteOffComponent,
    TrustAccountingComponent,
    TrustAccountingMatterDashboardComponent,
    NewMatterWizardComponent,
    MatterDetailsComponent,
    BillingInformationComponent,
    CreateCalendarEventNewComponent,
    TrustAccountComponent,
    UploadDocumentNewComponent,
    AddNotesComponent,
    RateTableComponent,
    AttorneySearchComponent,
    AddEventComponent,
    MatterDashboardAssociationsComponent,
    TrustBankAccountsComponent,
  ],
  exports: [
    MatterDetailsComponent,
    BillingInformationComponent,
    CreateCalendarEventNewComponent,
    TrustAccountComponent,
    UploadDocumentNewComponent,
    AddNotesComponent,
    TrustBankAccountsComponent,
  ],
  providers: [ThemeService, ClientBackButtonRouteGuard],
  entryComponents: [
    AddMatterNoteComponent,
    CreateMatterAlertComponent,
    CloseMatterComponent,
    AddBlockedEmployeeComponent,
    CorporateContactComponent,
    ReopenMatterComponent,
    RateTableComponent,
    AttorneySearchComponent,
    AddEventComponent,
  ],
})
export class MatterModule {}
