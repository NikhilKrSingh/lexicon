export class vwInvoiceCompact {
  id: number;
  tenantId: number;
  preBillId: number;
  initialConsultId?: any;
  matterId: number;
  totalInvoiced: number;
  totalPaid: number;
  amountToPay: number;
}

export class vwPartialPaymentSuccess {
  results: {
    originalAmountToPay: number;
    actualAmountToPay: number;
  };
}
