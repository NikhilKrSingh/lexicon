import { vwFullPerson, vwIdName } from 'src/common/swagger-providers/models';
import { IOffice } from '.';

export class ShowCaledarFilterOptions {
  eventType: boolean;
  client: boolean;
  client_client?: boolean;
  client_potential_client?: boolean;
  matter: boolean;
  invitees: boolean;
  invitee_employee?: boolean;
  invitee_client?: boolean;
  invitee_potential_client?: boolean;
  people?:boolean;

  hideClient() {
    this.client = false;
    this.client_client = false;
    this.client_potential_client = false;
  }

  hideInvitees() {
    this.invitees = false;
    this.invitee_client = false;
    this.invitee_employee = false;
    this.invitee_potential_client = false;
  }
}

export class CaledarFilterOptions {
  eventTypes: Array<IOffice>;
  client: ClientFilterOptions;
  matters: Array<IOffice>;
  invitee: InviteeFilterOptions;

  constructor() {
    this.eventTypes = [];
    this.client = new ClientFilterOptions();
    this.invitee = new InviteeFilterOptions();
    this.matters = [];
  }

  getClientFilters() {
    return this.client.clients.length + this.client.potentialClients.length;
  }

  getInviteeFilters() {
    return (
      this.invitee.employees.length +
      this.invitee.clients.length +
      this.invitee.potentialClients.length
    );
  }
}

export class ClientFilterOptions {
  clients: Array<IOffice>;
  potentialClients: Array<IOffice>;

  constructor() {
    this.clients = [];
    this.potentialClients = [];
  }
}

export class InviteeFilterOptions {
  employees: Array<IOffice>;
  clients: Array<IOffice>;
  potentialClients: Array<IOffice>;

  constructor() {
    this.employees = [];
    this.clients = [];
    this.potentialClients = [];
  }
}

export class CalendarSearchResult {
  type: string;
  person?: vwFullPerson;
  matter?: IOffice;
  employee?: vwIdName;
}


export interface ISearchUser {
  clientNumber: any;
  colorCode?: string;
  name?: string;
  associationTypeId?: number;
  associationTypeName?: string;
  associations?: string;
  blockId?: number;
  clientFlag?: boolean;
  companyName?: string;
  description?: string;
  doNotContact?: boolean;
  doNotContactReason?: string;
  doNotSchedule?: boolean;
  associatedWithClient?: boolean;
  email?: string;
  firstName?: string;
  id?: number;
  isCompany?: boolean;
  isVisible?: boolean;
  jobTitle?: string;
  lastName?: string;
  personPhoto?: string;
  phones?: string;
  preferredContactMethod?: string;
  primaryOffice?: string;
  role?: string;

  subId?: any;
  clientName?: any;
  primaryOfficeName?: any;
  responsibleAttorney?: any;
  timezone?: any;
  matterNumber?: any;
}
