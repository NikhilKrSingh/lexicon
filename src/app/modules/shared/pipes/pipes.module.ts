import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AccountTypePipe, IsSourceTypePipe, IsTargetTypePipe, SourceTypePipe, TransactionTypePipe } from './account-type.pipe';
import { AttorneyNameDisplayPipe } from './attorney-name-display.pipe';
import { BillingPhoneDisplayPipe } from './billing-phone-display.pipe';
import { CardTypePipe } from './card-type.pipe';
import { CategoryActionPipe } from './category-action.pipe';
import { CommonServicePipe } from './common-service.pipe';
import { ContactTypePipe } from './contact-type.pipe';
import { CorporateContactExistPipe } from './corporate-contact-exist.pipe';
import { CounterPipe } from './counter.pipe';
import { CreditCardNumberPipe } from './credit-card-number.pipe';
import { ExpiredMonthYearPipe } from './expired-month-year.pipe';
import { GetContactFilterMapPipe } from './get-contact-filter-map.pipe';
import { GetDocIconPipe } from './get-doc-icon.pipe';
import { GetMomentDateFormatPipe } from './get-moment-date-format.pipe';
import { GetSanitizeUrlPipe } from './get-sanitize-url.pipe';
import { GetValueByKeyTypePipe } from './get-value-by-key-type.pipe';
import { HasEmailPipe } from './has-email.pipe';
import { HighlightPipe } from './highlight.pipe';
import { IncludePipe } from './include.pipe';
import { IndexfinderPipe } from './indexfinder.pipe';
import { JurisdictionMatterStateDisplayPipe } from './jurisdiction-matter-state-display.pipe';
import { NextActionPipe } from './next-action.pipe';
import { OfficeHolidayListPipe } from './office-holiday-list.pipe';
import { OfficeHolidayPipe } from './office-holiday.pipe';
import { OfficeStatusPipe } from './office-status.pipe';
import { OrderByPipe } from './orderBy.pipe';
import { PartyCounselWitnessNameDisplayPipe } from './party-counsel-witness-name-display.pipe';
import { PaymentMethodDisablePipe } from './payment-method-disable.pipe';
import { TimeMappedValuePipe, TotalAvailablityPipe } from './pc-scheduling.pipe';
import { PhoneFormatterPipe } from './phone-formatter.pipe';
import { PreferredContactPipe } from './preferred-contact.pipe';
import { RankDisplayPipe } from './rank-display.pipe';
import { RefundSourcePipe } from './refund-source.pipe';
import { RetentionFormValidPipe } from './retention-form-valid.pipe';
import { RoutingNumberPipe } from './routing-number.pipe';
import { SafeHTMLPipe } from './safe-html.pipe';
import { SafeResourcePipe } from './safe-resource.pipe';
import { SecondsTohhmmssPipe } from './second-to-hhmmss.pipe';
import { SliceByLengthPipe } from './slice-by-length.pipe';
import { SlicePipe } from './slice.pipe';
import { SubstrByLengthPipe } from './substr-by-length.pipe';
import { SuggestedTimeEntryPipe } from './suggested-time-entry.pipe';
import { TierPreferredContactPipe } from './tier-preferred-contact.pipe';
import { TimeFormatterPipe } from './time-formatter.pipe';
import { TimeSummaryPipe } from './time-summary.pipe';
import { TitleCasePipe } from './title-case.pipe';
import { ToFixedPipe } from './to-fixed.pipe';
import { TrackByFnPipe } from './track-by-fn.pipe';
import { TrackByObjPipe } from './track-by-obj.pipe';
import { TruncateFileNamePipe } from './truncate-file-name.pipe';
import { TruncatePipe } from './truncate.pipe';
import { TrustOnlyNumberDisplayPipe } from './trust-only-number-display.pipe';
import { UsdCurrenyPipe } from './usd-currency.pipe';
import { WidgetNamePipe } from './widget-name.pipe';
import { WorkingHoursPipe } from './working-hours.pipe';
import { ClientNameSlicePipe } from './client-name-slice.pipe';

@NgModule({
  declarations: [
    TimeSummaryPipe,
    IncludePipe,
    CounterPipe,
    IndexfinderPipe,
    PhoneFormatterPipe,
    ContactTypePipe,
    CommonServicePipe,
    TrackByFnPipe,
    TrackByObjPipe,
    TimeFormatterPipe,
    CategoryActionPipe,
    ToFixedPipe,
    TruncateFileNamePipe,
    SlicePipe,
    JurisdictionMatterStateDisplayPipe,
    AttorneyNameDisplayPipe,
    PartyCounselWitnessNameDisplayPipe,
    BillingPhoneDisplayPipe,
    TrustOnlyNumberDisplayPipe,
    PaymentMethodDisablePipe,
    TierPreferredContactPipe,
    GetContactFilterMapPipe,
    GetValueByKeyTypePipe,
    SliceByLengthPipe,
    ExpiredMonthYearPipe,
    SubstrByLengthPipe,
    RankDisplayPipe,
    CorporateContactExistPipe,
    OfficeHolidayPipe,
    PreferredContactPipe,
    WorkingHoursPipe,
    OfficeHolidayListPipe,
    OfficeStatusPipe,
    RetentionFormValidPipe,
    GetDocIconPipe,
    GetMomentDateFormatPipe,
    GetSanitizeUrlPipe,
    TitleCasePipe,
    SafeResourcePipe,
    HighlightPipe,
    CreditCardNumberPipe,
    RoutingNumberPipe,
    TruncatePipe,
    SafeHTMLPipe,
    OrderByPipe,
    SuggestedTimeEntryPipe,
    SecondsTohhmmssPipe,
    WidgetNamePipe,
    TimeMappedValuePipe,
    TotalAvailablityPipe,
    CardTypePipe,
    AccountTypePipe,
    SourceTypePipe,
    TransactionTypePipe,
    UsdCurrenyPipe,
    IsSourceTypePipe,
    IsTargetTypePipe,
    NextActionPipe,
    RefundSourcePipe,
    ClientNameSlicePipe,
    HasEmailPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    TimeSummaryPipe,
    IncludePipe,
    CounterPipe,
    IndexfinderPipe,
    PhoneFormatterPipe,
    ContactTypePipe,
    CommonServicePipe,
    TrackByFnPipe,
    TrackByObjPipe,
    TimeFormatterPipe,
    CategoryActionPipe,
    ToFixedPipe,
    TruncateFileNamePipe,
    SlicePipe,
    JurisdictionMatterStateDisplayPipe,
    AttorneyNameDisplayPipe,
    PartyCounselWitnessNameDisplayPipe,
    BillingPhoneDisplayPipe,
    TrustOnlyNumberDisplayPipe,
    PaymentMethodDisablePipe,
    TierPreferredContactPipe,
    GetContactFilterMapPipe,
    GetValueByKeyTypePipe,
    SliceByLengthPipe,
    ExpiredMonthYearPipe,
    SubstrByLengthPipe,
    RankDisplayPipe,
    CorporateContactExistPipe,
    OfficeHolidayPipe,
    PreferredContactPipe,
    WorkingHoursPipe,
    OfficeHolidayListPipe,
    OfficeStatusPipe,
    RetentionFormValidPipe,
    GetDocIconPipe,
    GetMomentDateFormatPipe,
    GetSanitizeUrlPipe,
    TitleCasePipe,
    SafeResourcePipe,
    HighlightPipe,
    CreditCardNumberPipe,
    RoutingNumberPipe,
    TruncatePipe,
    SafeHTMLPipe,
    OrderByPipe,
    SuggestedTimeEntryPipe,
    SecondsTohhmmssPipe,
    WidgetNamePipe,
    TimeMappedValuePipe,
    TotalAvailablityPipe,
    CardTypePipe,
    AccountTypePipe,
    SourceTypePipe,
    TransactionTypePipe,
    UsdCurrenyPipe,
    IsSourceTypePipe,
    IsTargetTypePipe,
    NextActionPipe,
    RefundSourcePipe,
    ClientNameSlicePipe,
    HasEmailPipe
  ]
})
export class PipesModule { }
