import { vwBillingSettings, vwPaymentPlan } from 'src/common/swagger-providers/models';
import { IMatterFixedFeeService } from './fixed-free-services.model';
import { PaymentPlanModel } from './payment-model';
import { vwInvoice } from './vw-invoice';

export interface IFixedFreeGetResponse {
  fixedFeeService: IMatterFixedFeeService[];
  billingSettings: vwBillingSettings;
  paymentPlan: PaymentPlanModel;
  invoices: Array<vwInvoice>
}
export interface IAddOnAndFixedFeeResponse {
  matterUnbilledItems: any;
  raddOnServices: any[];
  fixedFeeRes: IFixedFreeGetResponse;
}
