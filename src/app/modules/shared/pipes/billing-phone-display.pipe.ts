import { Pipe, PipeTransform } from '@angular/core';
import { vwPersonPhone } from 'src/common/swagger-providers/models';

@Pipe({
  name: 'billingPhoneDisplay'
})
export class BillingPhoneDisplayPipe implements PipeTransform {

  transform(phones: any): any {
    if (phones) {
      let phone = phones.find(a => a.isPrimary);
      if (phone) {
        return phone.number;
      } else {
        return '';
      }
    } else {
      return '';
    }
  }

}
