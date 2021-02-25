export interface vwPCUnbilledBalance {
  unbilledConsultationFee: number;
}

export interface vwPCBilledBalance {
  lastInvoiceId: number;
  lastInvoiceDate?: any;
  lastInvoiceAmount: number;
  latestPayments: number;
  latestWriteOffs: number;
  latestRefunds: number;
  outstandingBalance: number;
}
