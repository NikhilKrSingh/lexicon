import { vwIdName } from 'src/common/swagger-providers/models';

export class Tenant {
  id: number;
  name: string;
  guid: string;
  primaryContactId: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  lastUpdated: string;
  isActive: string;
  office: Array<vwIdName>;
}

export class vwPracticeAreaList {
  id: number;
  name: number;
  createdBy: string;
  createdDate: string;
}

export class PracticeArea {
  id: number;
  name: string;
  tenantId: number;
  createdBy: number;
  createdAt: string;
  updatedBy: number;
  lastUpdated: string;
  isActive: boolean;
}

export interface vwTenantProfile {
  faviconicon: any;
  id: number;
  tenantId: number;
  tenantName: string;
  esign: boolean;
  internalLogo: string;
  timeRoundInterval: number;
  timeDisplayFormat: number;
  changeStatusNotes: string;
}
