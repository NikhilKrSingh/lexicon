export interface vwFixedFeeServices {
  id: number;
  tenantId: number;
  description: string;
  amount: number | null;
  isVisible: boolean | null;
  status: string;
}
