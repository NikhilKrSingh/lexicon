import { vwIdCodeName, vwIdName, vwPersonPhone } from 'src/common/swagger-providers/models';
import { vwContact } from './vw-contact';

export class MatterListSearchOption {
  officeId: number;
  casePhaseId: number;
  openDate: string;
  statusId: number;
  closeDate: string;
  billTypeId: number;
}

export interface vwAttorneyViewModel {
  id: number;
  sort?: number;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  primaryOffice?: any;
  isPrimary?: boolean;
  office?: vwIdName;
  phones: Array<vwPersonPhone>;
  description?: any;
  company?: string;
  name?: string;
  isCompany?: boolean;
  displayDescription?: boolean;

  fullName?: string;
}

export interface vwMatterPerson {
  id: number;
  firstName: string;
  lastName: string;
  matterId: number;
  companyName: string;
  email: string;
  primaryPhone: any;
  isActive: boolean;
  associationTypeId: number;
  associationTypeName: string;
  isCompany?: boolean;

  uniqueNumber?: number;
}

export interface vwConflictResponse {
  clientId: number;
  matterId: number;
  blockedPersons: Array<vwAttorneyViewModel>;
  conflictPersons: vwConflictPerson[];
}

export interface vwConflictPerson {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  company?: string;
  conflictObjectType: string;
  conflictType: vwIdName;
  matterName: vwIdName;
  clientName: vwIdName;
  phones: vwIdName[];
  status: string;
  initialConsultDate?: string;
  clientOrPCGroup: vwIdCodeName;
}

export interface vwAssociationTypes {
  associationTypeId: number;
  associationTypeName: string;
}

export interface vwMatterResponse {
  billType: any;
  id: number;
  matterNumber: string;
  matterName: string;
  caseNumbers: vwIdName[];
  matterPractices: vwIdName[];
  matterOpenDate: string;
  matterCloseDate: string;
  matterPrimaryOffice: vwIdName;
  matterStatus: vwIdName;
  jurisdictionStateId: number;
  jurisdictionCounty: string;
  isBlockedForCurrentUser: boolean;
  clientName: vwContact;
  responsibleAttorney?: vwAttorneyViewModel[];
  responsibleAttorny?: vwAttorneyViewModel[];
  billingAttorney: vwAttorneyViewModel[];
  attorneys: vwAttorneyViewModel[];
  practiceArea: vwIdName[];
  matterType: vwIdName;
  isContingentCase: boolean;
  isPlainTiff: boolean;
  isFixedFee?: any;
  isWorkComplete?: any;
  opposingParties: vwOpposingParty[];
  vendors: vwOpposingParty[];
  opposingCounsles: vwOpposingCounselWitness[];
  expertWitnesses: vwOpposingCounselWitness[];
  subsidiaries: vwOpposingCounselWitness[];
  primaryOffice: vwIdName;
  openDate: string;
  status: any;
  cname?: string;
  rname?: string;
  trustName?:string;
  trustExecutionDate?:string;
  displayClientName?:string;
}

export interface vwOpposingCounselWitness {
  id: number;
  sort: number;
  firstName: string;
  lastName: string;
  company: string;
  statusId: number;
  status: string;
}

export interface vwOpposingParty {
  id: number;
  sort: number;
  firstName: string;
  lastName: string;
  type: string;
  statusId: number;
  status: string;
  company: string;
}

export interface vwBlockedUsersResponse {
  personId: number;
  blockId: number;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  status: string;
  primaryOffice: string;
}

export interface vwBlockedPersonResponse {
  persons: Array<any>;
}
