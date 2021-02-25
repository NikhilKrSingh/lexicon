import { PreBillingModels } from 'src/app/modules/models/vw-prebilling';
import { vwAddressDetails, vwIdName, vwMatterWriteOff } from 'src/common/swagger-providers/models';
import { vwBillNowClientEmailInfo } from './bill-to-client.model';

export interface vwUpdateStatus {
  invoiceId: number;
  statusId: number;
}

export interface vwInvoice {
  id: number;
  tenantId?: vwIdName;
  preBillId: number;
  generated: string;
  billedDate: string;
  sentByPersonId: vwIdName;
  sent: string;
  due: string;
  invoicePreference?: vwIdName;
  totalInvoiced: number;
  totalPaid: number;
  statusId: vwIdName;
  printStatusId: vwIdName;
  emailStatusMessage: string;
  printStatusMessage: string;
  matter: vwIdMatterNumer;
  client: vwIdClientName;
  recordDisbursement: PreBillingModels.vwBillingLines[];
  timeEntries: PreBillingModels.vwBillingLines[];
  tenantProfile: TenantProfile;
  clientAddress: vwAddressDetails[];
  lastInvoices: vwInvoice[];
  officeDetails: Array<OfficeDetail>;
  initialConsult: boolean;
  consultations: Consultation[];
  consultationFees: ConsultationFee[];
  isFixedFee: boolean;
  fixedFeeService: PreBillingModels.FixedFeeService[];
  addOnServices: PreBillingModels.AddOnService[];
  matterOpenDate: Date;
  writeOffList: Array<vwMatterWriteOff>;
  paymentAndOtherCredits: vwPaymentAndOtherCredit[];
  primaryRetainerTrust: vwTustBalance;
  trustAccounts: vwTustBalance[];
  primaryRetainerTrustSummary: vwTrustBalanceSummary;
  trustOnlyAccountsSummary: vwTrustBalanceSummary;
  lastTransactionDate: string;
  invoiceFileId: number;
  isCompany: boolean;
  emailInfo: vwBillNowClientEmailInfo;
  missingEmailAddress?: string;
  hasError?: boolean;
  startingBalance?: number;
  endingBalance?: number;
  payments?: number;

  isLegacyTemplate?: boolean;
}

interface vwIdMatterNumer {
  id: number;
  name: string;
  matterNumber: number;
}

interface vwIdClientName {
  id: number;
  name: string;
  uniqueNumber: number;
}

export interface vwTrustBalanceSummary {
  startingBalance: number;
  endingBalance: number;
  credits: number;
  debits: number;
}

export interface vwTustBalance {
  id: number;
  name: string;
  currentBalance: number;
}

export interface vwPaymentAndOtherCredit {
  id: number;
  invoiceId: number;
  matterId: number;
  code: string;
  totalAmount: number;
  totalPaid: number;
  statusId?: any;
  lastUpdated: string;
  dueDate?: any;
}

export interface OfficeDetail {
  id: number;
  name: string;
  status?: any;
  openingDate: string;
  closingDate?: any;
  effectiveDate?: any;
  acceptsInitialConsultation: boolean;
  timeZone?: any;
  addressId: number;
  address: Address;
  practiceAreas?: any;
  officeHoliday?: any;
  phones?: any;
  sundayOpen?: any;
  sundayClose?: any;
  mondayOpen?: any;
  mondayClose?: any;
  tuesdayOpen?: any;
  tuesdayClose?: any;
  wednesdayOpen?: any;
  wednesdayClose?: any;
  thursdayOpen?: any;
  thursdayClose?: any;
  fridayOpen?: any;
  fridayClose?: any;
  saturdayOpen?: any;
  saturdayClose?: any;
  echelon?: any;
  notes?: any;
  lastBillingDate?: any;
  billingStartDate?: any;
}

interface Address {
  id: number;
  guid: string;
  personId?: any;
  addressTypeId?: any;
  addressTypeName?: any;
  name: string;
  street: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  lat: number;
  lon: number;
  image?: any;
  googlePlaceId?: any;
  createdBy: number;
  createdAt: string;
  updatedBy: number;
  lastUpdated: string;
  isActive: boolean;
  office: any[];
}

interface TenantProfile {
  id: number;
  tenantId: number;
  tenantName: string;
  esign: boolean;
  internalLogo: string;
  timeRoundInterval?: any;
  timeDisplayFormat?: any;
  changeStatusNotes?: any;
}

export interface SendEmailEvent {
  invoiceId: number;
  markAsMailed?: number;
}

interface ConsultationFee {
  consultationFeeList: ConsultationFeeList;
  writeDownDetailList: WriteDownDetailList[];
  total_hrs: number;
}
interface WriteDownDetailList {
  writeDownDateTime: string;
  code: string;
  name: string;
  writeDownAmount: number;
  originalAmount: number;
  id: number;
  timeEntryId: number;
  writeDownCodeId: number;
  writeDownNarrative: string;
}

interface ConsultationFeeList {
  dateOfService: string;
  code: string;
  name: string;
  status: string;
  originalAmount: number;
  displayAmount: number;
  timeEntered: string;
  enterBy: string;
  note: string;
  writeDownAmount: number;
  id: number;
  totalHours: number;
  totalMins: number;
  billType: string;
  billingNarrative: string;
  isNegetive: boolean;
  rate: number;
}
export interface vwMessage {
  type: string;
  errors: Array<string>;
}

interface Consultation {
  id: number;
  contactId: number;
  tenantId: number;
  initialConsultationDate: string;
  rateId: number;
  rateDetails: RateDetails;
  consultAttorney?: any;
  durationOfConsultationHours: number;
  durationOfConsultationMinutes: number;
  amountDue: number;
  decision?: any;
  isFullPayment: boolean;
  otherAmount?: any;
  waiveAmount: boolean;
  remainingBalanceDueDate: string;
  paymentMethodLookUp: number;
  sendInvoiceType?: any;
  sendInvoiceEmail?: any;
  isActive?: any;
}

interface RateDetails {
  id: number;
  office?: any;
  person?: any;
  matter?: any;
  tenant: any;
  code: string;
  description: string;
  billingType: any;
  billingTo: any;
  rateAmount: number;
  customRateAmount?: any;
  isCustom?: any;
  changeNotes?: any;
  createdBy: string;
  createdAt: string;
}
