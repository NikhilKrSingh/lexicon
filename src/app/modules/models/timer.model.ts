import * as moment from 'moment';
import { vwSubmitTimer } from 'src/common/swagger-providers/models';

export interface vwMatterName {
  id: number;
  number: string;
  name: string;
  isFixedFee: boolean;
}

export interface vwClientName {
  id: number;
  name: string;
  isCompany: boolean;
  firstName: string;
  lastName: string;
  companyName: string;
}

export interface Value {
  ticks: number;
  days: number;
  hours: number;
  milliseconds: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  totalHours: number;
  totalMilliseconds: number;
  totalMinutes: number;
  totalSeconds: number;
}

export interface Hour {
  hasValue: boolean;
  value: Value;
}

export interface vwTimer {
  id: number;
  tenantId: number;
  personId: number;
  matter: vwMatterName;
  client: vwClientName;
  isRunning: boolean;
  hours: Hour;
  totalSeconds: number;
  isTimeEntryCreated: boolean;
  lastUpdated: string;
  createdOn: string;

  isRemainingTimer?: boolean;
  previousTotalTimeWorked?: number;
}

export class vwChargeCodeItem {
  timerWorked: vwTimerWorked;
  suggestedTimerEntry: number;
  dateOfService: string;
  chargeCodeId: number;
  chargeCodeName: string;
  chargeCodeType: string;
  billingNarrative: string;
  notes: string;
  visibleToClient: boolean;
  rate: any;

  disbursementTypeDetail: any;

  constructor(date: string = null, suggestedTimerEntry: number = null) {
    this.visibleToClient = false;
    this.timerWorked = new vwTimerWorked();
    this.dateOfService = date;
    this.suggestedTimerEntry = suggestedTimerEntry;
    this.billingNarrative = '';
    this.notes = '';
    this.chargeCodeId = null;
    this.chargeCodeName = null;
    this.rate = 0;
  }

  isInvalid(clientDetail) {
    if (
      !this.dateOfService ||
      this.isInvalidBillingNarrative(clientDetail) ||
      !this.chargeCodeId ||
      !this.notes ||
      (!!this.timerWorked &&
        !this.timerWorked.hour &&
        !this.timerWorked.minutes) ||
      (this.dateOfService && moment(this.dateOfService).isAfter(moment(), 'd'))
    ) {
      return true;
    } else {
      return false;
    }
  }

  isInvalidBillingNarrative(client: any) {
    if (client && client.role == 'Potential Client') {
      return false;
    } else {
      if (!this.billingNarrative) {
        if (
          this.disbursementTypeDetail &&
          (this.disbursementTypeDetail.billingTo.code == 'OVERHEAD' ||
            this.disbursementTypeDetail.type == 'FIXED_FEE' ||
            this.disbursementTypeDetail.type == 'FIXED_FEE_ADD_ON')
        ) {
          return false;
        } else {
          return true;
        }
      }

      return false;
    }
  }

  resetChargeCode() {
    this.chargeCodeId = null;
    this.chargeCodeName = '';
    this.chargeCodeType = null;
    this.disbursementTypeDetail = null;
  }
}

export class vwTimerWorked {
  hour: number;
  minutes: number;

  constructor() {
    this.hour = 0;
    this.minutes = 0;
  }
}

export class vwAddTimeEntryResponse {
  submitTimer: vwSubmitTimer;
  remainingTimer: vwTimer;
}
