import { vwFullPerson, vwIdName } from 'src/common/swagger-providers/models';

export class vwTotalTimesheet {
  billableHours = 0;
  billableRate = 0;
  billableCost = 0;

  nonbillableHours = 0;
  nonbillableRate = 0;
  nonbillableCost = 0;

  totalHours = 0;
  totalRate = 0;
  totalCost = 0;

  lastTimesheetDate: string;
}

export interface vwAllTimesheetInfo {
  myTimesheetInfo: vwMyTimesheetModel[];
  employeeList: Array<vwFullPerson>;
}

export interface vwMyTimesheetModel {
  id: number;
  matterClientClocks: MatterClientClock[];
  totalCount: number;
  totalHours: number;
  totalMinutes: number;
  dateOfService: string;
}

export interface MatterClientClock {
  targetMatter: vwIdName;
  isFixedFeeMatter?: (boolean | null)[];
  targetClient: TargetClient;
  disbursementTypes: DisbursementType[];
  totalCount: number;
  totalHours: number;
  totalMinutes: number;
}

interface DisbursementType {
  id: number;
  officeId?: any;
  personId?: any;
  onStart?: any;
  onEnd?: any;
  description: string;
  disbursementDescription: string;
  code: string;
  dateOfService: string;
  type: vwIdName;
  isBillableToClient: boolean;
  rate: number;
  billType: vwIdName;
  hours: number;
  minutes: number;
  writeOffHours: number;
  writeOffMinutes: number;
  writeDownAmount?: any;
}

interface TargetClient {
  id: number;
  firstName: string;
  lastName: string;
  companyName?: string | string;
  clientFlag?: any;
  email?: (null | string)[];
  jobTitle?: any;
  isVisible: boolean;
  isCompany: boolean;
  primaryOffice?: vwIdName
  associationTypeId: number;
  associationTypeName?: any;
  associations?: any;
  phones: Phone[];
  role?: any;
  preferredContactMethod?: any;
  doNotContact?: any;
  doNotContactReason?: any;
  personPhoto?: any;
  doNotSchedule?: any;
  blockId?: any;
  description?: any;
}

interface Phone {
  id: number;
  number: string;
  type: string;
  isPrimary: boolean;
  personId: number;
}
