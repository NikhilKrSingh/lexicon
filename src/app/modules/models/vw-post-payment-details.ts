export interface vwPostPaymentDetails {
  achProcessingStatus: boolean;
  usioTrustAccountType: UsioTrustAccountType;
  trustAccountStatus: boolean;
  primaryRetainerTrustDetails: PrimaryRetainerTrustDetails;
}

interface PrimaryRetainerTrustDetails {
  matterId: number;
  currnetBalance: number;
  minimumRetainerTrustBalance: number;
}

export interface UsioTrustAccountType {
  isMerchantAccount: boolean;
  isCreditCardAccount: boolean;
  isAchAccount: boolean;
}
