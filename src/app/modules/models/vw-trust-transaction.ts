import { vwIdName } from 'src/common/swagger-providers/models';

export interface vwTrustTransaction {
  id: number;
  clientId: number;
  matterId: number;
  transactionType: vwIdName;
  amount: number;
  endingBalance: number;
  postingDate: string;
  createdAt: string;
  processingDate: string;
  sourceAccountDetails: vwAccountDetails;
  sourceIsPrimaryTrust: boolean;
  sourceTrustOnlyAccountId: number;
  targetIsPrimaryTrust: boolean;
  targetTrustOnlyAccountId: number;
  targetAccountDetails: vwAccountDetails;
  description?: any;
  confirmationNumber?: any;
  status: string;
  postedBy: vwIdName;
  targetEndingBalance: number;
  reasonForRejection: string;
  targetMatterId: number;

  chargeBackTrustTransactionHistoryId: number;
  chargeBackReason: string;
}

export interface vwAccountDetails {
  eCheckDetails?: any;
  ccDetails?: any;
  trustOnlyAccount?: vwIdTrustNumber;
  accountType: string;
  checkNumber?: any;
  primaryRetainerTrustBankAccount?: vwAccountInfoModel;
  usioBankAccount?: vwAccountInfoModel;
}

export interface vwIdTrustNumber {
  id: number;
  name: string;
  trustNumber?: number;
}

export interface vwAccountInfoModel {
  bankId: number;
  accountName: string;
  accountNumber: string;
  accountRoutingNumber?: any;
  accountType: string;
}
