import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'paymentMethodDisable'
})
export class PaymentMethodDisablePipe implements PipeTransform {

  transform(type: any, accountType: any): any {
    if(type.code=='CREDIT_CARD'){
      if(!accountType.isCreditCardAccount || !accountType.isMerchantAccount){
        return true;
      }
    }
    if(type.code == 'E-CHECK' && !accountType.isAchAccount){
        return true
    }
  }

}
