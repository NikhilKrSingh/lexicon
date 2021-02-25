import { vwIdCodeName, vwIdName } from 'src/common/swagger-providers/models';

export interface IBillingSettings  {
  billFrequencyDuration?: vwIdCodeName;
  billFrequencyQuantity?: null | number;
  billFrequencyStartingDate?: null | string;
  changeNotes?: null | string;
  daysToPayInvoices?: null | number;
  fixedAmount?: null | number;
  fixedFeeAmountToPay?: null | number;
  fixedFeeBillOnWorkComplete?: null | boolean;
  fixedFeeDueDate?: null | string;
  fixedFeeIsFullAmount?: null | boolean;
  isWorkComplete?: null | boolean;
  fixedFeeRemainingAmount?: null | number;
  id?: number;
  invoiceAddressId?: null | number;
  invoiceDelivery?: vwIdCodeName;
  invoiceTemplateId?: null | number;
  isFixedAmount?: null | boolean;
  matter?: vwIdName;
  minimumTrustBalance?: null | number;
  office?: vwIdName;
  operatingAccountNumber?: null | string;
  operatingRoutingNumber?: null | string;
  paymentPlans?: null | boolean;
  person?: vwIdName;
  receiptTemplateId?: null | number;
  tenant?: vwIdName;
  timeDisplayFormat?: null | number;
  timeEntryGracePeriod?: null | number;
  timeRoundingInterval?: null | number;
  billFrequencyDay?: null | number;
  billFrequencyRecursOn?: null | number;
  billFrequencyNextDate?: null | string;
  effectiveDate?: null | string;
  isInherited?: null | boolean;
  needToUpdateChildRecords?: null | boolean;
  effectiveBillFrequencyQuantity?: null | number;
  effectiveBillFrequencyDuration?: vwIdCodeName;
  effectiveBillFrequencyDay?: null | number;
  effectiveBillFrequencyRecursOn?: null | number;
  effectiveIsInherited?: null | boolean;
  effectiveBillFrequencyStartingDate?:  null | string;
  effectiveBillFrequencyNextDate?:  null | string;
  billWhenHoliday?: null | number;
  repeatType?: null | number;
  effectiveRepeatType?: null | number;
  effectiveBillWhenHoliday?: null | number;
};

export interface IDisplaySettings {
  effectiveBillFrequencyDuration?: vwIdCodeName;
  effectiveBillFrequencyQuantity?: null | number;
  effectiveBillFrequencyStartingDate?:  null | string;
  effectiveBillFrequencyRecursOn?:  null | number;
}
