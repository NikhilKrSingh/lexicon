import { vwAddressDetails, vwCreditCard } from 'src/common/swagger-providers/models';

export namespace AddPaymentMethodModels {
  export interface AddPaymentMethodEvent {
    selectedMatters: any;
    creditCardInfo: vwCreditCard;
    address?: vwAddressDetails;
  }
}
