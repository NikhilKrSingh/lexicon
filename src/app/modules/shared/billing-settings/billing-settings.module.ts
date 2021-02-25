import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RecordDisbursementComponent } from '../record-disbursement/record-disbursement.component';
import { SharedModule } from '../shared.module';
import { BillingDetailComponent } from './billing-details/billing-details.component';
import { AddOnServiceComponent } from './billing-info/add-on-service/add-on-service.component';
import { BillingInfoComponent } from './billing-info/billing-info.component';
import { PaymentPlanComponent } from './billing-info/payment-plan/payment-plan.component';
import { BillingStepComponent } from './billing-step/billing-step.component';
import { CustomizeRateComponent } from './customize-rate/customize-rate.component';
import { MatterDisbursementsComponent } from './disbursements/disbursements.component';
import { EditBillIssuanceFrequnecyComponent } from './edit-bill-issuance-frequnecy/edit-bill-issuance-frequnecy.component';
import { EditFixedFeeSettingsComponent } from './edit-fixed-fee-settings/edit-fixed-fee-settings.component';
import { EditInvoiceAddressComponent } from './edit-invoice-address/edit-invoice-address.component';
import { EditInvoicePreferencesComponent } from './edit-invoice-preferences/edit-invoice-preferences.component';
import { PaymentMethodCreateMatterComponent } from './payment-method-create-matter/payment-method-create-matter.component';
import { AddCreditCardComponent } from './payment-method/add-credit-card/add-credit-card.component';
import { AddEcheckComponent } from './payment-method/add-echeck/add-echeck.component';
import { EditCreditCardComponent } from './payment-method/edit-credit-card/edit-credit-card.component';
import { EditEcheckComponent } from './payment-method/edit-echeck/edit-echeck.component';
import { BillingPaymentMethodComponent } from './payment-method/payment-method.component';
import { BillingRateTableComponent } from './rate-table/rate-table.component';
import { MatterRecordWriteOffComponent } from './write-offs/record-write-off/record-write-off.component';
import { MatterWriteOffsComponent } from './write-offs/writeoffs.component';
import { NewBillingDetailsComponent } from './new-billing-details/new-billing-details.component';
// import { NewWriteOffsComponent } from './new-write-offs/new-write-offs.component';
import { RecordWriteOffComponent } from './new-write-offs/record-write-off/record-write-off.component';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NewBillingPaymentMethodComponent } from './new-payment-method/new-payment-method.component';
import { NewBillingPaymentPlanComponent } from './new-payment-plan/new-payment-plan.component';
import { NewBillingDisbursementsComponent } from './new-billing-disbursements/new-billing-disbursements.component';
import { NewBillingRateTableComponent } from './new-billing-rate-table/new-billing-rate-table.component'
import {EditInvoicePreferencesAndAddressComponent} from './edit-invoice-preferences-and-address/edit-invoice-preferences-and-address.component';
import { NewChargesBreakdownComponent } from './new-charges-breakdown/new-charges-breakdown.component';
import { NewTotalHoursComponent } from './new-total-hours/new-total-hours.component'

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    NgxDaterangepickerMd.forRoot()
  ],
  declarations: [
    EditBillIssuanceFrequnecyComponent,
    EditInvoicePreferencesComponent,
    EditFixedFeeSettingsComponent,
    CustomizeRateComponent,
    EditInvoiceAddressComponent,
    BillingInfoComponent,
    BillingPaymentMethodComponent,
    BillingRateTableComponent,
    BillingDetailComponent,
    MatterDisbursementsComponent,
    AddCreditCardComponent,
    AddEcheckComponent,
    AddOnServiceComponent,
    PaymentPlanComponent,
    EditEcheckComponent,
    EditCreditCardComponent,
    MatterWriteOffsComponent,
    MatterRecordWriteOffComponent,
    BillingStepComponent,
    PaymentMethodCreateMatterComponent,
    NewBillingDetailsComponent,
    // NewWriteOffsComponent,
    RecordWriteOffComponent,
    NewBillingPaymentMethodComponent,
    NewBillingPaymentPlanComponent,
    NewBillingDisbursementsComponent,
    NewBillingRateTableComponent,
    EditInvoicePreferencesAndAddressComponent,
    NewChargesBreakdownComponent,
    NewTotalHoursComponent
  ],
  exports: [
    EditBillIssuanceFrequnecyComponent,
    EditInvoicePreferencesComponent,
    EditFixedFeeSettingsComponent,
    CustomizeRateComponent,
    EditInvoiceAddressComponent,
    BillingInfoComponent,
    BillingDetailComponent,
    MatterDisbursementsComponent,
    BillingPaymentMethodComponent,
    PaymentPlanComponent,
    AddOnServiceComponent,
    MatterWriteOffsComponent,
    MatterRecordWriteOffComponent,
    BillingStepComponent,
    PaymentMethodCreateMatterComponent,
    NewBillingDetailsComponent,
    // NewWriteOffsComponent,
    RecordWriteOffComponent,
    NewBillingPaymentMethodComponent,
    NewBillingPaymentPlanComponent,
    NewBillingDisbursementsComponent,
    EditInvoicePreferencesAndAddressComponent
  ],
  entryComponents: [
    EditBillIssuanceFrequnecyComponent,
    EditInvoicePreferencesComponent,
    EditFixedFeeSettingsComponent,
    CustomizeRateComponent,
    EditInvoiceAddressComponent,
    BillingInfoComponent,
    BillingDetailComponent,
    MatterDisbursementsComponent,
    AddCreditCardComponent,
    AddEcheckComponent,
    EditEcheckComponent,
    EditCreditCardComponent,
    PaymentPlanComponent,
    AddOnServiceComponent,
    MatterRecordWriteOffComponent,
    RecordDisbursementComponent,
    NewBillingDetailsComponent,
    // NewWriteOffsComponent,
    RecordWriteOffComponent,
    EditInvoicePreferencesAndAddressComponent
  ]
})
export class BillingSettingsSharedModule { }
