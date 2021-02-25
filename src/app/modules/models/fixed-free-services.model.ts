import { vwWriteDownDetailList, vwBillNowModel } from 'src/common/swagger-providers/models';

export interface IFixedFreeServices {
  id?: number;
  tenantId?: number;
  description?: string;
  amount?: number;
  isVisible?: boolean;
  status?: string;
  selected?: boolean;

  isEditing?: boolean;
  rateAmount?: number;
  originalAmount?: number;
  isCustom?: boolean;
}

export interface IMatterFixedFeeService {
  id: number;
  fixedFeeId: number;
  code?: string;
  tenantId: number;
  matterId: number;
  rateAmount: number;
  isCustom?: any;
  status?: any;
  description?: any;
  writeDown?: any;
  writeDownReason?: any;
  writeDownAt?: any;
  writeDownList?: Array<vwWriteDownDetailList>;
}

export class vwCheckMatterHasUnBilledItems {
  hasUnbilledItems?: boolean;
  unbilledItems: vwBillNowModel;
}
