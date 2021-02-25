import { vwBillingSettings, vwPaymentPlan } from 'src/common/swagger-providers/models';
import { IMatterFixedFeeService } from './fixed-free-services.model';
import { vwInvoice } from './vw-invoice';

export interface PaymentPlanModel extends vwPaymentPlan {
  echeckDetail: any;
  creditCard: any;
  billFrequencyLookUpName: string;
  balanceDue?: number;
}

export interface vwFixedFeeSettingsResponse {
  fixedFeeService: Array<IMatterFixedFeeService>;
  billingSettings: vwBillingSettings;
  paymentPlan: PaymentPlanModel;
  invoices: vwInvoice[];
}

export interface IautoPay {
  autoPay?: boolean,
  autoPayType?: string;
  accountNumber?: string;
  cardNumber?: string;
  cardType?: string;
};

