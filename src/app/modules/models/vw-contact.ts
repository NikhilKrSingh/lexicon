export interface vwContact {
  id: number;
  name: string;
  preferredContact: string;
  email: string;
  client: string;
  matterType: string;
  associationType: string;
  clientId: string;
  companyName: string;
  jobTitle: string;
  phones: string;
  officeName: string;
  doNotContact: boolean | null;
  isClientAssociation: boolean | null;
  isCorporate: boolean | null;
  isPotentialClient: boolean | null;
  isCompany: boolean | null;
  attorney: string;
  isVisible: boolean;
  isArchived: boolean;
  doNotContactReason: string;
  archiveReason: string;
  primaryContact: vwPrimaryContact;
  corporateContactTypes: string[];
  company?: string;
  sort?: number;
  firstName?: string;
  lastName?: string;
  isPrimary?: boolean;
  status?: string;
  type?: string;
  matterName?: string;
  clientName?: string;
  conflictObject?: null;
  preferredContactMethod?: null;
  office?:string | null;
}

export interface vwPrimaryContact {
  id: number;
  name: string;
  email: string;
  phones: vwPhoneType[];
}

export interface vwPhoneType {
  id: number;
  type: string;
  number: string;
}
