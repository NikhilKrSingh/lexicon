import { vwFullPerson, vwIdCodeName, vwIdName, vwMatterEventInvitees, vwRecurringEvent } from "src/common/swagger-providers/models";

export interface vwMatterEventInviteesExtended extends vwMatterEventInvitees {
  proposedTime?: any;
  proposalTimeString?: string;
}

export interface vwMatterEventsDetails  {
  afterTravelTimeHours?: number;
  afterTravelTimeMinutes?: number;
  beforeTravelTimeHours?: number;
  beforeTravelTimeMinutes?: number;
  client?: vwFullPerson;
  description?: null | string;
  empTimezone?: null | string;
  endDateTime?: null | string;
  eventLocation?: null | string;
  eventProposedTimeId?: number;
  eventType?: vwIdCodeName;
  id?: number;
  invitees?: null | Array<vwMatterEventInviteesExtended>;
  isAllDayEvent?: boolean;
  isDeleteAllProposal?: boolean;
  isOutOfOfficeAllDay?: boolean;
  isRecurringEvent?: boolean;
  matter?: vwIdName;
  office?: vwIdName;
  privacy?: vwIdCodeName;
  recurringEvent?: vwRecurringEvent;
  startDateTime?: null | string;
  status?: vwIdCodeName;
  title?: null | string;
  upcommingReccuringEventsTypeId?: null | number;
}
