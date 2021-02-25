export interface vwOfficeDetails {
  stateName: string;
  id: number;
  name: string;
  status: Status;
  openingDate: string;
  closingDate?: any;
  effectiveDate?: any;
  acceptsInitialConsultation: boolean;
  timeZone?: any;
  addressId: number;
  address: Address;
  practiceAreas: PracticeArea[];
  officeHoliday: OfficeHoliday[];
  phones: Phone[];
  sundayOpen: string;
  sundayClose: string;
  mondayOpen: string;
  mondayClose: string;
  tuesdayOpen: string;
  tuesdayClose: string;
  wednesdayOpen: string;
  wednesdayClose: string;
  thursdayOpen: string;
  thursdayClose: string;
  fridayOpen: string;
  fridayClose: string;
  saturdayOpen: string;
  saturdayClose: string;
  echelon: any[];
  notes: string;
  lastBillingDate?: any;
  billingStartDate: string;
  designatedContact: vwDesignatedContact;
  isDesignatedContactOther: boolean;
}

export interface vwDesignatedContact {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: vwDesignatedContactPhone;
}

export interface vwDesignatedContactPhone {
  id?: number;
  number: string;
  type?: string;
  isPrimary?: boolean;
  personId?: number;
}

interface Phone {
  id: number;
  personId?: any;
  officeId: number;
  type: string;
  sort?: any;
  countryCodeId?: any;
  number: string;
  isPrimary: boolean;
  createdBy: number;
  createdAt: string;
  updatedBy: number;
  lastUpdated: string;
  isActive: boolean;
}

interface OfficeHoliday {
  id: number;
  officeId: number;
  name: string;
  date: string;
  createdBy: number;
  createdAt: string;
  updatedBy: number;
  lastUpdated: string;
  isActive: boolean;
  office?: any;
}

interface PracticeArea {
  id: number;
  name: string;
  tenantId: number;
  createdBy: number;
  createdAt: string;
  updatedBy: number;
  lastUpdated: string;
  isActive: boolean;
}

interface Address {
  id: number;
  guid: string;
  personId?: any;
  addressTypeId?: any;
  addressTypeName?: any;
  name: string;
  street: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  lat: any;
  lon: any;
  image?: any;
  googlePlaceId: string;
  createdBy: number;
  createdAt: string;
  updatedBy: number;
  lastUpdated: string;
  isActive: boolean;
  office: any[];
}

interface Status {
  id: number;
  status: string;
  createdBy: number;
  createdAt: string;
  updatedBy: number;
  lastUpdated: string;
  isActive: boolean;
}
