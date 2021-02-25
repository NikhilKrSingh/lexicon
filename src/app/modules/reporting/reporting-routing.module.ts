import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  ReportingAccountingFlag,
  ReportingBillingOrResponsibleAttorneyFlag,
  ReportingClientDetailFlag,
  ReportingConsultAttorneyFlag,
  ReportingPermissionFlag,
  ReportingPermissionOrBillingOrResponsibleAttorneyFlag,
  ReportingTimeKeepingFlag,
  ReportingUserAccountDetailFlag,
  ReportingAccuntingAdminOrUserFlag,
} from 'src/app/guards/permission-guard.service';
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

const routes: Routes = [
  {
    path: '',
    component: ReportingComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'billing-activity-report',
    canActivate: [ReportingPermissionFlag],
    component: BillingActivityReportComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'credit-card-transaction',
    canActivate: [ReportingPermissionFlag],
    component: CreditCardTransactionComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'net-credit-balance',
    canActivate: [ReportingBillingOrResponsibleAttorneyFlag],
    component: NetCreditBalanceComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'ar-aging',
    canActivate: [ReportingBillingOrResponsibleAttorneyFlag],
    component: ArAgingComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'ar-criteria',
    canActivate: [ReportingBillingOrResponsibleAttorneyFlag],
    component: ArCriteriaComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'total-amount-billed',
    canActivate: [ReportingPermissionFlag],
    component: TotalAmountBilledComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'matter-status',
    canActivate: [ReportingBillingOrResponsibleAttorneyFlag],
    component: MatterStatusComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'total-realization',
    canActivate: [ReportingPermissionFlag],
    component: TotalRealizationComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'payment-history',
    canActivate: [ReportingBillingOrResponsibleAttorneyFlag],
    component: PaymentHistoryComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'matter-paid',
    canActivate: [ReportingPermissionFlag],
    component: MatterPaidComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'matter-paid-total-rollup',
    canActivate: [ReportingPermissionFlag],
    component: MatterPaidTotalRollupComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'account-ledger-history',
    canActivate: [ReportingPermissionFlag],
    component: AccountLedgerHistoryComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'base-hours',
    canActivate: [ReportingTimeKeepingFlag],
    component: BaseHoursComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'billable-hours-detail',
    canActivate: [ReportingBillingOrResponsibleAttorneyFlag],
    component: BillableHoursDetailComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'billable-hours-rollup',
    canActivate: [ReportingPermissionFlag],
    component: BillableHoursRollupComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'time-entries-attorney',
    canActivate: [ReportingTimeKeepingFlag],
    component: TimeEntriesAttorneyComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'consultation-activity',
    canActivate: [ReportingConsultAttorneyFlag],
    component: ConsultationActivityComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'potential-client',
    canActivate: [ReportingConsultAttorneyFlag],
    component: PotentialClientComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'trust-ledger-history',
    canActivate: [ReportingBillingOrResponsibleAttorneyFlag],
    component: TrustLedgerHistoryComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'cash-transfer-report',
    canActivate: [ReportingAccountingFlag],
    component: CashTransferReportComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'check-request-report',
    canActivate: [ReportingAccountingFlag],
    component: CheckRequestReportComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'trust-vs-ar',
    canActivate: [ReportingPermissionOrBillingOrResponsibleAttorneyFlag],
    component: TrustArReportComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'cash-requirement-rollup',
    canActivate: [ReportingAccountingFlag],
    component: CashRequirementRollupReportComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'trust-replenishment',
    canActivate: [ReportingPermissionOrBillingOrResponsibleAttorneyFlag],
    component: TrustReplenishmentReportComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'no-recent-trust-transactions',
    canActivate: [ReportingPermissionOrBillingOrResponsibleAttorneyFlag],
    component: NoTrustTransactionReportComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'write-downs',
    canActivate: [ReportingPermissionOrBillingOrResponsibleAttorneyFlag],
    component: WriteDownsComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'write-offs',
    canActivate: [ReportingPermissionOrBillingOrResponsibleAttorneyFlag],
    component: WriteOffsComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'outstanding-ar-cc',
    component: OutstandingArCcComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'wip-aging-report',
    canActivate: [ReportingPermissionOrBillingOrResponsibleAttorneyFlag],
    component: WipAgingReportComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'wip-detail',
    canActivate: [ReportingPermissionOrBillingOrResponsibleAttorneyFlag],
    component: WipDetailComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'user-account-details',
    canActivate: [ReportingUserAccountDetailFlag],
    component: UserAccountDetailsComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'client-details',
    canActivate: [ReportingClientDetailFlag],
    component: ClientDetailsComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'insufficient-funds-report',
    canActivate: [ReportingPermissionFlag],
    component: InsufficientFundsReportComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'disbursements-journal',
    canActivate: [ReportingPermissionOrBillingOrResponsibleAttorneyFlag],
    component: DisbursementsJournalComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
  {
    path: 'daily-deposit',
    canActivate: [ReportingAccuntingAdminOrUserFlag],
    component: DailyDepositComponent,
    pathMatch: 'full',
    data: { type: 'root' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportingRoutingModule {}
