import { vwBillingSettings, vwIdName, vwNote } from 'src/common/swagger-providers/models';

export namespace PreBillingModels {
  export interface vwPreBilling {
    id: number;
    office?: any;
    person: vwIdName;
    matter: vwIdName;
    tenant: vwIdName;
    concernedPerson?: any;
    concernedDate: string;
    nameDescription?: any;
    billedHours?: any;
    billedAmount: number;
    isBillableToClient: boolean;
    writeOffHours?: any;
    writeOffAmount?: any;
    discountAmount?: any;
    preBillStatus: PreBillStatus;
    lastUpdated: string;
    createdAt: string;
    rate?: any;
    isFixed: boolean;
    fixedAmount?: any;
    recordDisbursement: vwBillingLines[];
    timeEntries: any[];
    fixedFeeService: FixedFeeService[];
    addOnServices: AddOnService[];
    matterBillingSetting: vwBillingSettings;
    matterWriteOffs: MatterWriteOff[];
    billingPerson?: any;
    lastBillDate?: string;
    isCompany: boolean;
    emailInfo: EmailInfo;
    invoicePreference: vwIdName;
  }

  export interface EmailInfo {
    email: string;
    primaryContact?: any;
    billingContact?: any;
  }

  export interface MatterWriteOff {
    id: number;
    matterId: number;
    applicableDate: string;
    writeOffAmount: number;
    changeNotes?: any;
    billingNarrative: string;
    visibleToClient: boolean;
    prebillId: number;
    statusId?: any;
    billTimingId?: any;
    invoiceId?: any;
    createdAt: string;
    createdBy: string;
    writeDowns?: any;
  }

  export interface PreBillStatus {
    id: number;
    code: string;
    name: string;
    email?: any;
    primaryPhone?: any;
  }

  export interface AddOnService {
    id: number;
    tenantId: number;
    matterId: number;
    serviceName: string;
    serviceAmount: number;
    writeDown?: number;
    writeDownReason?: any;
    prebillId?: any;
    writeDownList: Array<IWriteDown>;
  }

  export interface FixedFeeService {
    id: number;
    fixedFeeId: number;
    tenantId: number;
    matterId: number;
    rateAmount: number;
    isCustom: boolean;
    status: string;
    description: string;
    writeDown?: number;
    writeDownReason?: any;
    writeDownList: Array<IWriteDown>;
    totalWriteDown?: number;
  }

  export interface IWriteDown {
    id?: number;
    applicableDate?: string;
    writeDownAmount?: number;
    writeDownHours?: string;
    writeDownNarrative?: string;
    changeNotes?: string;
    createdBy?: string;
    createdAt?: string;
    writeDownCodeId?: number;
  }

  export interface vwBillingLines {
    id: number;
    date: string;
    person: vwIdName;
    note: vwNote;
    isNegative?: boolean;
    hours: Hours | null;
    hoursBilled?: number;
    description: string;
    amount: number | null;
    disbursementType: vwBillingDisbursementType;
    writeDownAmount?: number;
    writeDown?: Array<IWriteDown>;
    createdBy?: any;
    createdOn?: string;
    oriAmount?: number | null;
    totalWriteDownAmount?: number;
    status?: vwIdName;
  }

  export interface Hours {
    hasValue?: boolean;
    value: Value;
    isNegative?: boolean;
  }

  export interface Value {
    ticks?: number;
    days?: number;
    hours: number;
    milliseconds?: number;
    minutes: number;
    seconds?: number;
    totalDays?: number;
    totalHours: number;
    totalMilliseconds?: number;
    totalMinutes?: number;
    totalSeconds?: number;
  }

  export interface vwBillingDisbursementType {
    id: number;
    code: string;
    description: string;
    isBillable: boolean | null;
    rate: number | null;
    billingType: vwIdName;
    billableTo?: { id: number; name?: string; amount?: number };
    isNegative: boolean;
  }

  export interface PaymentPlan {
    totalAmount: number;
    amountPaid: number;
    amountRemaining: number;
    billingDeferred: boolean;
    isDeferredUntilWorkComplete: boolean;
    deferredUntilDate: string;
  }

  export interface IUnbilleditems {
    nextPrebillDate?: any;
    lastPrebillDate: any;
    timeEntries: vwBillingLines[];
    disbursements: vwBillingLines[];
    matterWriteOffs: any[];
    addOns: AddOnService[];
    fixedFeeServices?: FixedFeeService[];
    issuenceDate?: string;
  }
}
