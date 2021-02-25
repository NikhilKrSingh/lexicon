import { vwIdName, vwWriteDownDetailList } from 'src/common/swagger-providers/models';

export interface IvwFixedFee {
  code?: null | string;
  fixedFeeAddOnId?: null | number;
  id?: number;
  isCustom?: null | boolean;
  matterId?: number;
  prebillId?: null | number;
  serviceAmount?: number;
  serviceName?: null | string;
  status?: vwIdName | string;
  tenantId?: number;
  writeDown?: null | number;
  writeDownAt?: null | string;
  writeDownList?: null | Array<vwWriteDownDetailList>;
  writeDownReason?: null | string;
  description?: string;
  amount?: number | null | string;
  oriAmount?: number | null;
  isVisible?: boolean | null;
  isCustomAddOn?: boolean | null;
}
