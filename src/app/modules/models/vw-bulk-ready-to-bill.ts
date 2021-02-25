import { vwSendInvoice } from 'src/common/swagger-providers/models';

export interface vwBulkReadyToBillPrint extends vwSendInvoice {
  readyToBillId?: number;
}
