export interface Idata {
  id?: number;
  person?: { id?: number; name?: string };
  matter?: { id?: number; name?: string };
  fixedAmount?: number;
  invoiceDelivery?: {
    id?: number;
    code?: string;
    name?: string;
    email?: string;
    primaryPhone?: string;
  };
  minimumTrustBalance?: number;
  billFrequencyQuantity?: number;
  billFrequencyDuration?: {
    id?: number;
    code?: string;
    name?: string;
    email?: string;
    primaryPhone?: string;
  };
  billFrequencyStartingDate?: string;
  daysToPayInvoices?: number;
  timeEntryGracePeriod?: number;
  timeRoundingInterval?: number;
  timeDisplayFormat?: number;
  isFixedAmount?: boolean;
  paymentPlans?: boolean;
  fixedFeeIsFullAmount?: boolean;
  fixedFeeAmountToPay?: number;
  fixedFeeRemainingAmount?: number;
  fixedFeeDueDate?: string;
  fixedFeeBillOnWorkComplete?: boolean;
  invoiceAddressId?: number;
  billingAddressId?: number;
  isWorkComplete?: boolean;
  invoiceTemplateId?: number;
  receiptTemplateId?: number;
  operatingRoutingNumber?: string;
  operatingAccountNumber?: string;
  changeNotes?: string;
  isInherited?: boolean;
}

export interface IAdrs {
  id: number;
  address?: string;
  address2: string;
  city?: string;
  state?: string;
  zip?: string;
  zipCode?: string;
  addressTypeId: number;
  addressTypeName: string;
  personId?: number;
  address1?: string;
}

export interface IGender {
  val: string;
  text: string;
}

export interface IName {
  name: string;
}
