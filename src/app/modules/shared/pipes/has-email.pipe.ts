import { Pipe, PipeTransform } from '@angular/core';
import { vwInvoice } from '../../models/vw-invoice';

@Pipe({
  name: 'hasEmail',
})
export class HasEmailPipe implements PipeTransform {
  transform(row: vwInvoice) {
    if (row && row.emailInfo) {
      if (row.emailInfo.email) {
        return true;
      }

      return (
        (row.emailInfo.primaryContact && row.emailInfo.primaryContact.email) ||
        (row.emailInfo.billingContact && row.emailInfo.billingContact.email)
      );
    } else {
      return false;
    }
  }
}
