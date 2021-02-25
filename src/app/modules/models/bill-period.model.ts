import { vwBillingSettings } from 'src/common/swagger-providers/models';

export interface IBillPeriod {
  "billFrequencyDay"?: number;
  "billFrequencyRecursOn"?: number;
  "billFrequencyStartingDate"?: string;
  "billFrequencyNextDate"?: string;
  "billFrequencyQuantity"?: number;
  "billFrequencyDuration"?: number;
  "billFrequencyDurationType"?: string;
  "effectiveBillFrequencyStartingDate"?: string;
  "effectiveBillFrequencyNextDate"?: string;
  "effectiveIsInherited"?: boolean;
  "defaultFirmBillingFreq"?: boolean;
  "effectiveDate"?: string;
  "isInherited"?: boolean;
  "billingSettings"?: vwBillingSettings;
  "repeatType"?: number | null;
  "billWhenHoliday"?: number | null;
}
