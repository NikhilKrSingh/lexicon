import { Pipe, PipeTransform } from '@angular/core';
import { RefunSources } from '../../models/refund-source.enum';

@Pipe({
  name: 'refundSourceName',
})
export class RefundSourcePipe implements PipeTransform {
  transform(val: string) {
    if (val == RefunSources.TRUST) {
      return 'Trust-Only Account';
    } else if (val == RefunSources.MATTER) {
      return 'Matter Balance';
    } else if (val == RefunSources.POTENTIALCLIENT) {
      return 'Potential Client Balance';
    } else {
      return '1 - Primary Retainer Trust';
    }
  }
}
