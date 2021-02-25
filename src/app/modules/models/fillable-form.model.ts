export class CorporateContactVendorError {
  firstName: boolean;
  firstNameMessage: string;
  lastName: boolean;
  lastNameMessage: string;
  email: boolean;
  emailMessage: string;
  jobTitle: boolean;
  jobTitleMessage: string;

  hasError() {
    return this.firstName || this.lastName || this.email || this.jobTitle;
  }
}

export class CreateNoteError {
  note: boolean;
  noteMessage: string;

  hasError() {
    return this.note;
  }
}

export class AssociationVendorError {
  firstName: boolean;
  firstNameMessage: string;
  lastName: boolean;
  lastNameMessage: string;
  email: boolean;
  emailMessage: string;
  companyName: boolean;
  companyNameMessage: string;
  changeNotes: boolean;
  changeNotesMessage: string;

  hasError() {
    return this.firstName || this.lastName || this.email || this.companyName || this.changeNotes;
  }
}

export class MatterFormError {
  matterName: boolean;
  matterNameMessage: string;
  matterDate: boolean;
  matterDateMessage: string;
  caseNumbers: boolean;
  caseNumbersMessage: string;
  officeId: boolean;
  officeIdMessage: string;
  practiceArea: boolean;
  practiceAreaMessage: string;
  jurisdictionStateId: boolean;
  jurisdictionStateIdMessage: string;
  jurisdictionCounty: boolean;
  jurisdictionCountyMessage: string;
  trustName: boolean;
  trustNameMessage: string;
  matterTypeId: boolean;
  matterTypeIdMessage: string;
  originatingAttorney: boolean;
  originatingAttorneyMessage: string;

  hasError() {
    return this.matterName || this.matterDate || this.caseNumbers || this.officeId || this.practiceArea || this.jurisdictionStateId || this.jurisdictionCounty || this.trustName || this.matterTypeId || this.originatingAttorney;
  }
}

export class CreditCardFormError {
  firstName: boolean;
  firstNameMessage: string;
  lastName: boolean;
  lastNameMessage: string;
  companyName: boolean;
  companyNameMessage: string;
  cardNumber: boolean;
  cardNumberMessage: string;
  expirationDate: boolean;
  expirationDateMessage: string;
  CVV: boolean;
  CVVMessage: string;
  address: boolean;
  addressMessage: string;
  address2: boolean;
  address2Message: string;
  city: boolean;
  cityMessage: string;
  state: boolean;
  stateMessage: string;
  zipCode: boolean;
  zipCodeMessage: string;

  hasError() {
    return this.firstName || this.lastName || this.companyName || this.cardNumber || this.expirationDate || this.CVV || this.address || this.address2 || this.city || this.state || this.zipCode;
  }
}

export class CustomRateError {
  changeNotes: boolean;
  changeNotesMessage: string;
  customRate: boolean;
  customRateMessage: string;

  hasError() {
    return this.changeNotes || this.customRate;
  }
}

export class AddressFormError {
  address: boolean;
  addressMessage: string;
  address2: boolean;
  address2Message: string;
  city: boolean;
  cityMessage: string;
  state: boolean;
  stateMessage: string;
  zipCode: boolean;
  zipCodeMessage: string;
  notes: boolean;
  notesMessage: string;

  hasError() {
    return this.address || this.address2 || this.city || this.state || this.zipCode || this.notes;
  }
}

export class NameFormError {
  name: boolean;
  nameMessage: string;

  hasError() {
    return this.name;
  }
}

export class DescriptionFormError {
  description: boolean;
  descriptionMessage: string;
  value: boolean;
  valueMessage: string;

  hasError() {
    return this.description || this.value;
  }
}

export class ECheckFormError {
  firstName: boolean;
  firstNameMessage: string;
  lastName: boolean;
  lastNameMessage: string;
  routingNumber: boolean;
  routingNumberMessage: string;
  accountNumber: boolean;
  accountNumberMessage: string;
  address: boolean;
  addressMessage: string;
  address2: boolean;
  address2Message: string;
  city: boolean;
  cityMessage: string;
  state: boolean;
  stateMessage: string;
  zipCode: boolean;
  zipCodeMessage: string;

  hasError() {
    return this.firstName || this.lastName || this.routingNumber || this.accountNumber || this.address || this.address2 || this.city || this.state || this.zipCode;
  }
}

export class TimeFormError {
  dateOfService: boolean;
  dateOfServiceMessage: string;
  timeWorked: boolean;
  timeWorkedMessage: string;
  description: boolean;
  descriptionMessage: string;
  note: boolean;
  noteMessage: string;
  chargeCode: boolean;
  chargeCodeMessage: string;

  hasError() {
    return this.dateOfService || this.timeWorked || this.description || this.note || this.chargeCode
  }
}

export class EventFormError {
  title: boolean;
  titleMessage: string;
  eventType: boolean;
  eventTypeMessage: string;
  startDate: boolean;
  startDateMessage: string;
  startTime: boolean;
  startTimeMessage: string;
  endTime: boolean;
  endTimeMessage: string;
  endDate: boolean;
  endDateMessage: string;
  selctedClentName: boolean;
  selctedClentNameMessage: string;
  eventLocation: boolean;
  eventLocationMessage: string;
  description: boolean;
  descriptionMessage: string;
  hoursBefore: boolean;
  hoursBeforeMessage: string;
  minutesBefore: boolean;
  minutesBeforeMessage: string;
  hoursAfter: boolean;
  hoursAfterMessage: string;
  minutesAfter: boolean;
  minutesAfterMessage: string;

  hasError() {
    return this.title || this.eventType || this.startDate || this.startTime || this.endTime || this.endDate || this.selctedClentName || this.eventLocation || this.description || this.hoursBefore || this.minutesBefore || this.hoursAfter || this.minutesAfter
  }
}