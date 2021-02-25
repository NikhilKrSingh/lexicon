import { vwIdName } from 'src/common/swagger-providers/models';

/* tslint:disable */
export interface IAddress {
  address1?: string;
  address2?: string;
  city?: string;
  id?: number;
  state?: string;
  zipCode?: string;
  isSameAsPrimary?: boolean;
}

export interface ICreditCards {
  new?: boolean;
  addressId?: null | number;
  autoPay?: null | boolean;
  cardNumber: null | string;
  cardType?: null | string;
  companyName?: null | string;
  confirmationId?: null | string;
  cvv: null | string;
  expirationDate: null | string;
  firstName?: null | string;
  id?: number;
  isCompany?: null | boolean;
  isSameAsPrimary?: null | boolean;
  lastName?: null | string;
  person?: vwIdName;
  suspendAutoPay?: null | boolean;
  updateToUSIO?: null | boolean;
  address?: IAddress;
  addressDetails?: IAddress;
  oriCardNumber?: string;
}

export interface IECheck  {
  new?: boolean;
  accountNumber: null | string;
  addressId?: null | number;
  autoPay?: null | boolean;
  firstName: null | string;
  id?: number;
  isSameAsPrimary?: null | boolean;
  lastName: null | string;
  person?: vwIdName;
  routingNumber: null | string;
  state?: null | string;
  suspendAutoPay?: null | boolean;
  address?: IAddress;
  addressDetails?: IAddress;
}

