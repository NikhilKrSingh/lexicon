import { vwBillingSettings, vwCustomContent, vwIdName, vwInvoiceTemplate, vwNameEmail, vwSendInvoice } from 'src/common/swagger-providers/models';
import { vwBulkReadyToBillPrint } from './vw-bulk-ready-to-bill';
import { vwInvoice } from './vw-invoice';

export class vwSuccessBillToClient {
  invoiceId: number;
  prebillId: number;
  invoice: vwInvoice;
  matterBillingSettings: vwBillingSettings;
}

export class vwDefaultInvoice {
  invoiceTemplate: vwInvoiceTemplate;
  customContent: vwCustomContent;
}

export interface vwBillToClientEmailAndPrintResponse {
  failedInvoicesToEmail: number[];
  failedInvoicesToPrint: number[];
  invoicesToPrint: vwPrintInvoiceResponse[];
}

export interface vwPrintInvoiceResponse {
  invoiceId: number;
  matterId: number;
  bytes: string;
}

export interface vwBillNowClientEmailInfo {
  client: vwIdName;
  isCompany: boolean;
  email: string;
  primaryContact: vwNameEmail;
  billingContact: vwNameEmail;
}

export interface vwBillToClientResponse {
  succededItems: vwSuccessBillToClient[];
  failedItems: number[];
}

export interface vwBulkInvoicePreference {
  canPrint: boolean;
  canEmail: boolean;

  sendEmail?: boolean;
  print?: boolean;
}

export interface vwBulkInvoiceHTML {
  prebillId: number;
  invoiceHTML: vwSendInvoice;
}

export interface vwBulkReadyToBillHTML {
  prebillId: number;
  invoiceHTML: vwBulkReadyToBillPrint;
}
