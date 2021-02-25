import { vwAccountInfoModel } from './vw-trust-transaction';

export interface ILedgerHistory {
  amount: any;
  applicableDate?: string;
  credit?: number;
  creditCard: {
    id?: number;
    code?: string;
    name?: string;
    email?: string;
    primaryPhone?: string;
  };
  debit: null;
  eCheck: {
    code?: string;
    email?: string;
    id?: number;
    name?: string;
    primaryPhone?: string;
  };
  id?: number;
  noteToFile?: string;
  paymentMethodType?: string;
  postedBy?: string;
  postingDate?: string;
  status?: string;
  type?: string;
  endingBalance?: number;
  chargeBackPaymentId?: number;
  confirmationId?: string;
  chargeBackReason?: string;
  initialPostingDate?: string;
  isExpandedRow?: boolean;
  checkNumber: string;
  accountInfo: vwAccountInfoModel;
  primaryRetainerTrustBankAccount: vwAccountInfoModel;
}
