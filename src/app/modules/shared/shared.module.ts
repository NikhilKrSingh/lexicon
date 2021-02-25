import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { ChartsModule } from 'ng2-charts';
import { CurrencyMaskModule } from 'ng2-currency-mask';
import { Ng5SliderModule } from 'ng5-slider';
import { EllipsisModule } from "ngx-ellipsis";
import { MalihuScrollbarModule } from 'ngx-malihu-scrollbar';
import { NgxMaskModule } from 'ngx-mask';
import { NgSlimScrollModule } from 'ngx-slimscroll';
import { NgxTinymceModule } from 'ngx-tinymce';
import { DisbursementWriteDownComponent } from '../billing/pre-bill/view/disbursements/write-down/write-down.component';
import { TimeWriteDownComponent } from '../billing/pre-bill/view/time/write-down/write-down.component';
import { DocumentManagementComponent } from '../manage-folders/document-management/document-management.component';
import { UploadDocumentComponent } from '../manage-folders/upload-document/upload-document.component';
import { DocumentComponent } from '../matter/creating/upload-document/upload-document.component';
import { AccountingCreditCardTransactionComponent } from './accounting-credit-card-transaction/accounting-credit-card-transaction.component';
import { AccountingEcheckTransactionComponent } from './accounting-echeck-transaction/accounting-echeck-transaction.component';
import { AccountingManualBankTarnsferComponent } from './accounting-manual-bank-tarnsfer/accounting-manual-bank-tarnsfer.component';
import { AccountingPaperCheckTransactionComponent } from './accounting-paper-check-transaction/accounting-paper-check-transaction.component';
import { AddBlockedEmployeeNewMatterWizardComponent } from './add-blocked-employee-new-matter-wizard/add-blocked-employee-new-matter-wizard.component';
import { AddBlockedEmployeeComponent } from './add-blocked-employee/add-blocked-employee.component';
import { AddClientNoteComponent } from './add-client-note/add-client-note.component';
import { AddEditCorpContactsComponent } from './add-edit-corp-contacts/add-edit-corp-contacts.component';
import { AddExpertWitnessesComponent } from './add-expert-witnesses/add-expert-witnesses.component';
import { AddOpposingCounselComponent } from './add-opposing-counsel/add-opposing-counsel.component';
import { AddOpposingPartyComponent } from './add-opposing-party/add-opposing-party.component';
import { AddTimeZoneComponent } from './add-time-zone/add-time-zone.component';
import { AddVendorComponent } from './add-vendor/add-vendor.component';
import { AssociationSearchComponent } from './association-search/association-search.component';
import { FixedFeeSharedComponent } from './billing-codes/fixed-fee-shared/fixed-fee-shared.component';
import { BillingOperatingListComponent } from './billing-operating-list/billing-operating-list.component';
import { BillingPeriodUpcomingComponent } from './billing-period-upcoming/billing-period-upcoming.component';
import { BillingPeriodComponent } from './billing-period/billing-period.component';
import { PaymentMethodNewWizardComponent } from './billing-settings/payment-method-new-wizard/payment-method-new-wizard.component';
import { CalendarListComponent } from './calendar-list/calendar-list.component';
import { CalendarTimelineViewComponent } from './calendar-timeline-view/calendar-timeline-view.component';
import { CardComponent } from './card/card.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ConflictCheckDialogComponent } from './conflict-check-dialog/conflict-check-dialog.component';
import { CorporateContactViewComponent } from './corporate-contact-view/corporate-contact-view.component';
import { CorporateSearchComponent } from './corporate-search/corporate-search.component';
import { CreateCalendarEventComponent } from './create-calendar-event/create-calendar-event.component';
import { CreateNewTimeEntryComponent } from './create-new-time-entry/create-new-time-entry.component';
import { CustomCashMultiselectDropdownComponent } from './custom-cash-multiselect-dropdown/custom-cash-multiselect-dropdown.component';
import { CustomMultiselectDropdownComponent } from './custom-multiselect-dropdown/custom-multiselect-dropdown.component';
import { CustomTooltipComponent } from './custom-tooltip/custom-tooltip.component';
import { DatePickerComponent } from './date-picker/date-picker.component';
import { DateRangePickerComponent } from './date-range-picker/date-range-picker.component';
import { AutoCloseOutsideClickDirective } from './directives/auto-close-outside-click.directive';
import { FileDragAndDropDirective } from './directives/file-drap-and-drop.directive';
import { TwoDigitDecimaNumberDirective } from './directives/two-digit-decimal-number.directive';
import { DisbursementRatesComponent } from './disbursement-rates/disbursement-rates.component';
import { SetDisbursementRatesComponent } from './disbursement-rates/set-disbursement-rates/set-disbursement-rates.component';
import { DisbursementComponent } from './disbursement/disbursement.component';
import { DisplayReverseChargeComponent } from './display-reverse-charge/display-reverse-charge.component';
import { FirmCreditCardTrustAccountsComponent } from './firm-credit-card-trust-accounts/firm-credit-card-trust-accounts.component';
import { FirmTrustBankAccountsComponent } from './firm-trust-bank-accounts/firm-trust-bank-accounts.component';
import { FixedFeeMatterComponent } from './fixed-fee-matter/fixed-fee-matter.component';
import { InvoiceExtendedPdfComponent } from './invoice-extended-pdf/invoice-extended-pdf.component';
import { CommonInvoicePdfComponent } from './invoice-pdf/invoice-pdf.component';
import { LoaderComponent } from './loader/loader.component';
import { MultiitemListComponent } from './multiitem-list/multiitem-list.component';
import { MultiLevelDropdownComponent } from './multilevel-dropdown/multilevel-dropdown.component';
import { MultiLevelFolderDropdownComponent } from './multilevel-folder-dropdown/multilevel-folder-dropdown.component';
import { MultiSelectDropdownComponent } from './multiselect-dropdown/multiselect-dropdown.component';
import { OfficeTrustBankAccountComponent } from './office-trust-bank-account/office-trust-bank-account.component';
import { PipesModule } from './pipes/pipes.module';
import { PropertyHeldInTrustNewMatterWizardComponent } from './property-held-in-trust-new-matter-wizard/property-held-in-trust-new-matter-wizard';
import { PropertyHeldInTrustComponent } from './property-held-in-trust/property-held-in-trust.component';
import { RateTableModalComponent } from './rate-table-modal/rate-table-modal.component';
import { ReadMoreComponent } from './read-more/read-more.component';
import { CommonReceiptPdfComponent } from './receipt-pdf/receipt-pdf.component';
import { RecordDisbursementComponent } from './record-disbursement/record-disbursement.component';
import { SearchLoaderComponent } from './search-loader/search-loader.component';
import { SendForESignComponent } from './send-for-esign/send-for-esign.component';
import { TablePaginatorComponent } from './table-paginator/table-paginator.component';
import { TaskBuilderComponent } from './task-builder/task-builder.component';
import { TimeEntryBillNowComponent } from './time-entry-bill-now/time-entry-bill-now.component';
import { TrustOnlyAccountCommonComponent } from './trust-only-account-common/trust-only-account-common.component';
import { TrustOnlyAccountNewMatterWizardCommonComponent } from './trust-only-account-new-matter-wizard-common/trust-only-account-new-matter-wizard-common';
import { TrustTransferSourceComponent } from './trust-transfer-source/trust-transfer-source.component';
import { UnsavedChangedClientDialogComponent } from './unsaved-changed-client-dialog/unsaved-changed-client-dialog.component';
import { UnsavedChangedDialogComponent } from './unsaved-changed-dialog/unsaved-changed-dialog.component';
import { ValidationMessageComponent } from './validation-message/validation-message.component';
import { WarningDialogComponent } from './warning-dialog/warning-dialog.component';
import { WarningDynamicDialogComponent } from './warning-dynamic-dialog/warning-dynamic-dialog.component';
import { WarningMessageDialogComponent } from './warning-message-dialog/warning-message-dialog.component';
import { CustomizeDayAndHourComponent } from './work-day-and-hours/customize-hour/customize-hour.component';
import { WorkDayAndHoursComponent } from './work-day-and-hours/work-day-and-hours.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { DecimalMaxlengthPipe } from './pipes/decimal-maxlength.pipe';
import { NewWriteOffsComponent } from '../../modules/shared/billing-settings/new-write-offs/new-write-offs.component';
import { BillNowPreviewInvoiceComponent } from './bill-now-preview-invoice/bill-now-preview-invoice.component';
@NgModule({
  declarations: [
    MultiSelectDropdownComponent,
    ReadMoreComponent,
    TablePaginatorComponent,
    MultiLevelDropdownComponent,
    AutoCloseOutsideClickDirective,
    CardComponent,
    ConfirmDialogComponent,
    AddOpposingPartyComponent,
    AddOpposingCounselComponent,
    AddExpertWitnessesComponent,
    AssociationSearchComponent,
    MultiitemListComponent,
    AddVendorComponent,
    AddBlockedEmployeeComponent,
    FileDragAndDropDirective,
    TwoDigitDecimaNumberDirective,
    CorporateContactViewComponent,
    MultiLevelFolderDropdownComponent,
    CreateCalendarEventComponent,
    CalendarListComponent,
    CalendarTimelineViewComponent,
    WorkDayAndHoursComponent,
    CustomizeDayAndHourComponent,
    CommonInvoicePdfComponent,
    DatePickerComponent,
    WarningDialogComponent,
    AddClientNoteComponent,
    CreateNewTimeEntryComponent,
    CommonReceiptPdfComponent,
    UploadDocumentComponent,
    DocumentComponent,
    DocumentManagementComponent,
    ConflictCheckDialogComponent,
    TimeWriteDownComponent,
    DisbursementWriteDownComponent,
    TaskBuilderComponent,
    BillingPeriodComponent,
    PropertyHeldInTrustComponent,
    TrustOnlyAccountCommonComponent,
    BillingPeriodUpcomingComponent,
    FirmTrustBankAccountsComponent,
    FirmCreditCardTrustAccountsComponent,
    LoaderComponent,
    ValidationMessageComponent,
    UnsavedChangedDialogComponent,
    UnsavedChangedClientDialogComponent,
    TrustTransferSourceComponent,
    CorporateSearchComponent,
    SendForESignComponent,
    CustomMultiselectDropdownComponent,
    CustomCashMultiselectDropdownComponent,
    InvoiceExtendedPdfComponent,
    AccountingManualBankTarnsferComponent,
    AccountingPaperCheckTransactionComponent,
    AccountingCreditCardTransactionComponent,
    AccountingEcheckTransactionComponent,
    FixedFeeSharedComponent,
    FixedFeeMatterComponent,
    PaymentMethodNewWizardComponent,
    TrustOnlyAccountNewMatterWizardCommonComponent,
    PropertyHeldInTrustNewMatterWizardComponent,
    AddBlockedEmployeeNewMatterWizardComponent,
    OfficeTrustBankAccountComponent,
    AddTimeZoneComponent,
    WarningMessageDialogComponent,
    SearchLoaderComponent,
    AddEditCorpContactsComponent,
    TimeEntryBillNowComponent,
    DisbursementComponent,
    BillingOperatingListComponent,
    RecordDisbursementComponent,
    DisplayReverseChargeComponent,
    RateTableModalComponent,
    SetDisbursementRatesComponent,
    DisbursementRatesComponent,
    CustomTooltipComponent,
    DateRangePickerComponent,
    WarningDynamicDialogComponent,
    DecimalMaxlengthPipe,
    NewWriteOffsComponent,
    BillNowPreviewInvoiceComponent,
  ],
  imports: [
    FullCalendarModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgSlimScrollModule,
    NgxDatatableModule,
    RouterModule,
    NgSelectModule,
    ChartsModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    NgbModule,
    Ng5SliderModule,
    MalihuScrollbarModule.forRoot(),
    NgxTinymceModule.forRoot({
      baseURL: '//cdnjs.cloudflare.com/ajax/libs/tinymce/5.3.2/'
    }),
    NgxMaskModule.forRoot(),
    MatProgressSpinnerModule,
    CurrencyMaskModule,
    EllipsisModule,
    PipesModule,
    NgxDaterangepickerMd.forRoot()
  ],
  exports: [
    MultiSelectDropdownComponent,
    CustomMultiselectDropdownComponent,
    CustomCashMultiselectDropdownComponent,
    FormsModule,
    ReactiveFormsModule,
    NgSlimScrollModule,
    ReadMoreComponent,
    TablePaginatorComponent,
    MultiLevelDropdownComponent,
    NgxDatatableModule,
    AutoCloseOutsideClickDirective,
    CardComponent,
    ConfirmDialogComponent,
    AddOpposingPartyComponent,
    AddOpposingCounselComponent,
    AddExpertWitnessesComponent,
    AssociationSearchComponent,
    MultiitemListComponent,
    AddVendorComponent,
    AddBlockedEmployeeComponent,
    FileDragAndDropDirective,
    NgSelectModule,
    ChartsModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    NgbModule,
    Ng5SliderModule,
    NgxTinymceModule,
    NgxMaskModule,
    TwoDigitDecimaNumberDirective,
    CorporateContactViewComponent,
    MultiLevelFolderDropdownComponent,
    CreateCalendarEventComponent,
    CalendarListComponent,
    CalendarTimelineViewComponent,
    WorkDayAndHoursComponent,
    CommonInvoicePdfComponent,
    DatePickerComponent,
    AddClientNoteComponent,
    CreateNewTimeEntryComponent,
    UploadDocumentComponent,
    DocumentComponent,
    DocumentManagementComponent,
    ConflictCheckDialogComponent,
    TimeWriteDownComponent,
    DisbursementWriteDownComponent,
    CommonReceiptPdfComponent,
    TaskBuilderComponent,
    BillingPeriodComponent,
    PropertyHeldInTrustComponent,
    TrustOnlyAccountCommonComponent,
    BillingPeriodUpcomingComponent,
    FirmTrustBankAccountsComponent,
    FirmCreditCardTrustAccountsComponent,
    LoaderComponent,
    ValidationMessageComponent,
    UnsavedChangedDialogComponent,
    UnsavedChangedClientDialogComponent,
    TrustTransferSourceComponent,
    CorporateSearchComponent,
    SendForESignComponent,
    InvoiceExtendedPdfComponent,
    AccountingManualBankTarnsferComponent,
    AccountingPaperCheckTransactionComponent,
    AccountingCreditCardTransactionComponent,
    AccountingEcheckTransactionComponent,
    FixedFeeSharedComponent,
    FixedFeeMatterComponent,
    PaymentMethodNewWizardComponent,
    TrustOnlyAccountNewMatterWizardCommonComponent,
    PropertyHeldInTrustNewMatterWizardComponent,
    AddBlockedEmployeeNewMatterWizardComponent,
    OfficeTrustBankAccountComponent,
    AddTimeZoneComponent,
    RouterModule,
    SearchLoaderComponent,
    AddEditCorpContactsComponent,
    TimeEntryBillNowComponent,
    DisbursementComponent,
    BillingOperatingListComponent,
    RecordDisbursementComponent,
    DisplayReverseChargeComponent,
    SetDisbursementRatesComponent,
    DisbursementRatesComponent,
    CustomTooltipComponent,
    DateRangePickerComponent,
    WarningDynamicDialogComponent,
    PipesModule,
    DecimalMaxlengthPipe,
    NewWriteOffsComponent,
    BillNowPreviewInvoiceComponent,
    
  ],
  entryComponents: [
    ConfirmDialogComponent,
    AddOpposingPartyComponent,
    AddOpposingCounselComponent,
    AddExpertWitnessesComponent,
    AssociationSearchComponent,
    AddBlockedEmployeeComponent,
    CreateCalendarEventComponent,
    CalendarListComponent,
    CustomizeDayAndHourComponent,
    WarningDialogComponent,
    AddClientNoteComponent,
    CreateNewTimeEntryComponent,
    ConflictCheckDialogComponent,
    TimeWriteDownComponent,
    DisbursementWriteDownComponent,
    UnsavedChangedDialogComponent,
    UnsavedChangedClientDialogComponent,
    FixedFeeMatterComponent,
    AddTimeZoneComponent,
    WarningMessageDialogComponent,
    AddBlockedEmployeeNewMatterWizardComponent,
    AddEditCorpContactsComponent,
    DisplayReverseChargeComponent,
    RateTableModalComponent,
    SetDisbursementRatesComponent,
    DateRangePickerComponent,
    WarningDynamicDialogComponent,
    NewWriteOffsComponent,
  ],
  providers: [NgbActiveModal]
})
export class SharedModule {}
