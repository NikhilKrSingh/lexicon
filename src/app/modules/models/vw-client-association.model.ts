export interface vwClientAssociation {
  id: number;
  personId: number;
  clientId: number;
  matterId: number;
  associationTypeId: number;
  person: string;
  client: string;
  matterName?: any;
  associationType: string;
  jobTitle: string;
  cellPhone?: string;
  primaryPhone?: string;
  email: string;
  isSharedByOther: boolean;
  firstName: string;
  lastName: string;
  status: string;
}
