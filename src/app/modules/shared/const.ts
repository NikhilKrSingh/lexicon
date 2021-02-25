'use strict';

export let SharedConstant = {
  DateFormat: 'YYYY-MM-DD',
  TimeFormat: 'T00:00:00.000Z',
  NoDataFound: 'No data found.',
  TableNoDataFoundTransferQue : "No data to display.",
  ApplyFilter: 'Apply Filter',
  PC: 'Potential Client',
  CC: 'Corporate Contact',
  CA: 'Client Association',
  NoDataFoundDisbursements: 'No disbursements recorded'
};

export let OfficeConstant = {
  ApplyFilter: 'Apply Filter',
  PracticeArea: 'Practice Area(s)',
  PrimaryOfficeFilter: 'primaryOffice',
  DefaultDay: '00',
  SelectPracticeAreas: 'Select Practice Areas'
};

export let ContactConstant = {
  DoNotContact: 'Do Not Contact'
};

export let Status = {
  Archived: 'Archived',
  Active: 'Active',
  Inactive: 'Inactive'
};

export let AuthConstant = {
  Invalid_user: 'invalid_user',
  Link_expired: 'link_expired',
  Invalid_email: 'invalid_email',
  Invalid_password: 'invalid_password',
  Invalid_email_password: 'Invalid email address or password.',
  Invalid_Portal : 'Portal does not exists, for this client.',
  account_disabled : 'That account has been disabled.'
};

export enum PersonRole {
  Client = 'Client',
  PotentialClient = 'Potential Client',
  Employee = 'Employee'
}

export const REGEX_DATA = {
  Email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,5}))$/,
  VISA: /^(?:4[0-9]{12}(?:[0-9]{3})?)$/,
  MSTR: /^(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}$/,
  AMEX: /^(?:3[47][0-9]{13})$/,
  DISC: /^(?:6(?:011|5[0-9][0-9])[0-9]{12})$/
};

export let ClientAssociation = {
  Vendor: 'Vendor',
  Subsidiary: 'Subsidiary',
  OpposingParty: 'Opposing Party',
  OpposingCounsel: 'Opposing Counsel',
  ExpertWitness: 'Expert Witness',
};
