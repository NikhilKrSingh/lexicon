import { Injectable } from '@angular/core';
import { vwBillingSettings, vwIdCodeName } from 'src/common/swagger-providers/models';
import { UtilsHelper } from './utils.helper';

export interface IBillGeneratetionPeriod {
  start: string;
  end: string;
}

@Injectable({
  providedIn: 'root',
})
export class BillingSettingsHelper {
  getBillGenerationPeriod(billingSettings: vwBillingSettings): IBillGeneratetionPeriod {
    if (billingSettings && billingSettings.billFrequencyStartingDate) {
      const end = this.getNextBillDate(
        billingSettings.billFrequencyDuration,
        billingSettings.billFrequencyQuantity,
        billingSettings.billFrequencyStartingDate
      );
      const start = this.getLastBillDate(
        billingSettings.billFrequencyDuration,
        billingSettings.billFrequencyQuantity,
        end,
        billingSettings.billFrequencyStartingDate
      );
      return <IBillGeneratetionPeriod>{
        start,
        end,
      };
    } else {
      return <IBillGeneratetionPeriod>{
        start: null,
        end: null,
      };
    }
  }

  private getNextBillDate(
    billFrequencyDuration: vwIdCodeName,
    billFrequencyQuantity: number,
    lastBillDate: string
  ) {
    let nextBillDate: string;
    if (billFrequencyDuration.code === 'WEEKS') {
      nextBillDate = UtilsHelper.addWeeks(lastBillDate, billFrequencyQuantity);
    } else if (billFrequencyDuration.code === 'MONTHS') {
      nextBillDate = UtilsHelper.addMonths(lastBillDate, billFrequencyQuantity);
    } else if (billFrequencyDuration.code === 'DAYS') {
      nextBillDate = UtilsHelper.addDays(lastBillDate, billFrequencyQuantity);
    } else {
      nextBillDate = UtilsHelper.addWeeks(lastBillDate, 2);
    }
    return nextBillDate;
  }

  private getLastBillDate(
    billFrequencyDuration: vwIdCodeName,
    billFrequencyQuantity: number,
    endDate: string,
    startDate: string
  ) {
    let d = new Date(endDate);
    const s = new Date(startDate);
    if (billFrequencyDuration.code === 'WEEKS') {
      d.setDate(d.getDate() - 7 * billFrequencyQuantity);
    } else if (billFrequencyDuration.code === 'MONTHS') {
      d.setMonth(d.getMonth() - billFrequencyQuantity);
    } else if (billFrequencyDuration.code === 'DAYS') {
      d.setDate(d.getDate() - billFrequencyQuantity);
    } else {
      d.setDate(d.getDate() - 7 * billFrequencyQuantity);
    }

    if (+d < +s) {
      d = s;
    }

    return d.toJSON();
  }
}
