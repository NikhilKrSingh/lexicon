export interface IPRofile {
  id?: number;
  name?: string;
  userName?: string;
  password?: string;
  tenantId?: number;
  officeId?: number;
  salutation?: string;
  companyName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  email?: string;
  maidenName?: string;
  nickName?: string;
  commonName?: string;
  jobTitle?: string;
  primaryPhone?: string;
  cellPhone?: string;
  fax?: string;
  employmentStartDate?: string;
  employmentEndDate?: string;
  primaryContactId?: number;
  addressId?: number;
  isCompany?: boolean;
  role?: string;
  preferredContactMethod: "Email"
  isVisible?: boolean;
  isArchived?: boolean;
  groups: Array<{id?: number; name?: string;}>
}
