export interface vwPotentialClient {
  id: number;
  name: string;
  preferredContact?: string;
  primaryContactPerson?: vwPrimaryContactPerson;
  email?: string;
  client?: any;
  matterType?: any;
  associationType?: any;
  clientId?: any;
  companyName?: string;
  jobTitle?: string;
  phones?: string;
  officeName: string;
  doNotContact: boolean;
  isClientAssociation?: any;
  isCorporate?: any;
  isPotentialClient?: any;
  isCompany: boolean;
  attorney?: string;
  isVisible: boolean;
  isArchived: boolean;
  doNotContactReason?: string;
  archiveReason?: string;
  primaryContact?: any;
  corporateContactTypes?: any;
  status: any;
}

export interface vwPrimaryContactPerson {
  id: number;
  code?: any;
  name: string;
  email: string;
  primaryPhone?: string;
}
