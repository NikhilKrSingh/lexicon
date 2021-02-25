import { vwIdName } from 'src/common/swagger-providers/models';

export enum PAYMENT_HIERARCHY_CODE {
  FIXED_FEE = 'FIXED_FEE',
  FIXED_FEE_ADD_ON = 'FIXED_FEE_ADD_ON',
  DISBURSEMENT = 'DISBURSEMENT',
  WRITE_OFF = 'WRITE_OFF',
  AR_BALANCE = 'AR_BALANCE',
}

export interface vwPaymentHierarchy {
  id: number;
  invoiceId: number;
  matterId: number;
  code: string;
  totalAmount: number;
  totalPaid: number;
  statusId: vwIdName;
  lastUpdated: string;
  dueDate: string;
  prebillId: number;
}
