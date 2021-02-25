import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cardType',
})
export class CardTypePipe implements PipeTransform {
  transform(ccCardType: string): string {
    if (ccCardType == 'AMEX') {
      return 'AMEX';
    }

    if (ccCardType == 'MSTR') {
      return 'Mastercard';
    }

    if (ccCardType == 'DISC') {
      return 'Discover';
    }

    if (ccCardType == 'VISA') {
      return 'Visa';
    }

    return ccCardType;
  }
}
