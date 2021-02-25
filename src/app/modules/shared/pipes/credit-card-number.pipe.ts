import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appCreditCardNumber'
})

export class CreditCardNumberPipe implements PipeTransform {
  transform(value: number): any {
    if(value && parseFloat(value as any) > 0) {
      let str = String(value);
      let last4 = str.slice(-4);
      return '---- ---- ---- ' + last4;
    } else {
      return '';
    }
  }
}
