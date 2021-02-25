export interface vwPaymentToMatterResponse {
  paymentId: number;
  trustTransactionHistoryId: number;
  paymentAuthCode: string;
  paymentGatewayStatusCode: string;
  paymentGatewayStatusMessage: string;
  paymentPostingDate: string;
  trustTransactionHistoryAuthCode: string;
  trustTransactionHistoryGatewayStatusCode: string;
  trustTransactionHistoryGatewayStatusMessage: string;
  trustTransactionHistoryPostingDate: string;

  amountToOperatingAccount: number;
  amountToTrust: number;
}
