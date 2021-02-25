export class TrustOnlyAccountsModel {
  id: number;
  matterTrustAccountId?: number;
  name?: string;
  amount?: number;
  trustNumber?: any;
}

export interface vwTrustOnlyAccount {
  id: number;
  name: string;
  tenantId?: number;
  matterTrustAccountId?: number;
  amount?: number;
}
