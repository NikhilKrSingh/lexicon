import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { AccountLedgerHistoryComponent } from './account-ledger-history/account-ledger-history.component';
import { ArAgingComponent } from './ar-aging/ar-aging.component';
import { ArCriteriaComponent } from './ar-criteria/ar-criteria.component';
import { BaseHoursComponent } from './base-hours/base-hours.component';
import { BillableHoursDetailComponent } from './billable-hours-detail/billable-hours-detail.component';
import { BillableHoursRollupComponent } from './billable-hours-rollup/billable-hours-rollup.component';
import { BillingActivityReportComponent } from './billing-activity-report/billing-activity-report.component';
import { CashRequirementRollupReportComponent } from './cash-requirement-rollup-report/cash-requirement-rollup-report.component';
import { CashTransferReportComponent } from './cash-transfer-report/cash-transfer-report.component';
import { CheckRequestReportComponent } from './check-request-report/check-request-report.component';
import { ClientDetailsComponent } from './client-details/client-details.component';
import { ConsultationActivityComponent } from './consultation-activity/consultation-activity.component';
import { CreditCardTransactionComponent } from './credit-card-transaction/credit-card-transaction.component';
import { DateRangeReportComponent } from './date-range-report/date-range-report.component';
import { DisbursementsJournalComponent } from './disbursements-journal/disbursements-journal.component';
import { InsufficientFundsReportComponent } from './insufficient-funds-report/insufficient-funds-report.component';
import { MatterPaidTotalRollupComponent } from './matter-paid-total-rollup/matter-paid-total-rollup.component';
import { MatterPaidComponent } from './matter-paid/matter-paid.component';
import { MatterStatusComponent } from './matter-status/matter-status.component';
import { NetCreditBalanceComponent } from './net-credit-balance/net-credit-balance.component';
import { NoTrustTransactionReportComponent } from './no-trust-transaction-report/no-trust-transaction-report.component';
import { OutstandingArCcComponent } from './outstanding-ar-cc/outstanding-ar-cc.component';
import { PaymentHistoryComponent } from './payment-history/payment-history.component';
import { PotentialClientComponent } from './potential-client/potential-client.component';
import { ReportingRoutingModule } from './reporting-routing.module';
import { ReportingComponent } from './reporting/reporting.component';
import { TimeEntriesAttorneyComponent } from './time-entries-attorney/time-entries-attorney.component';
import { TotalAmountBilledComponent } from './total-amount-billed/total-amount-billed.component';
import { TotalRealizationComponent } from './total-realization/total-realization.component';
import { TrustArReportComponent } from './trust-ar-report/trust-ar-report.component';
import { TrustLedgerHistoryComponent } from './trust-ledger-history/trust-ledger-history.component';
import { TrustReplenishmentReportComponent } from './trust-replenishment-report/trust-replenishment-report.component';
import { UserAccountDetailsComponent } from './user-account-details/user-account-details.component';
import { WipAgingReportComponent } from './wip-aging-report/wip-aging-report.component';
import { WipDetailComponent } from './wip-detail/wip-detail.component';
import { WriteDownsComponent } from './write-downs/write-downs.component';
import { WriteOffsComponent } from './write-offs/write-offs.component';
import { DailyDepositComponent } from './daily-deposit/daily-deposit.component';

@NgModule({
  declarations: [
    ReportingComponent,
    BillingActivityReportComponent,
    CreditCardTransactionComponent,
    NetCreditBalanceComponent,
    ArAgingComponent,
    ArCriteriaComponent,
    TotalAmountBilledComponent,
    MatterStatusComponent,
    TotalRealizationComponent,
    PaymentHistoryComponent,
    MatterPaidComponent,
    MatterPaidTotalRollupComponent,
    AccountLedgerHistoryComponent,
    BaseHoursComponent,
    BillableHoursDetailComponent,
    BillableHoursRollupComponent,
    TimeEntriesAttorneyComponent,
    ConsultationActivityComponent,
    PotentialClientComponent,
    DateRangeReportComponent,
    TrustLedgerHistoryComponent,
    CashTransferReportComponent,
    CheckRequestReportComponent,
    CashRequirementRollupReportComponent,
    TrustArReportComponent,
    TrustReplenishmentReportComponent,
    NoTrustTransactionReportComponent,
    WriteDownsComponent,
    WriteOffsComponent,
    OutstandingArCcComponent,
    WipAgingReportComponent,
    ClientDetailsComponent,
    UserAccountDetailsComponent,
    WipDetailComponent,
    InsufficientFundsReportComponent,
    DisbursementsJournalComponent,
    DailyDepositComponent,
  ],
  imports: [
    CommonModule,
    ReportingRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
  ],
})
export class ReportingModule {}
