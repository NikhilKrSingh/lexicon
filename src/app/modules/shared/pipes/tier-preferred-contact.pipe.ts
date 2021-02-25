import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tierPreferredContact'
})
export class TierPreferredContactPipe implements PipeTransform {

  transform(row: any, isEmerging: boolean): any {
    if (row) {
      if (row.preferredContactMethod == 'Email') {
        return row.email;
      } else if (
        row.preferredContactMethod == 'Text' ||
        row.preferredContactMethod == 'Call' ||
        row.preferredContactMethod == 'Cell'
      ) {
        if (isEmerging && row.preferredContactMethod === 'Text') {
          return '--';
        } else {
          if (row.phones) {
            let numberRec = row.phones.find(a => a.isPrimary);
            let number = (numberRec) ? `${numberRec.number}` : '';

            return number
              ? '(' +
              number.substr(0, 3) +
              ') ' +
              number.substr(3, 3) +
              '-' +
              number.substr(6, 4)
              : '-';
          } else {
            return '--';
          }
        }
      } else {
        return '--';
      }
    }
  }

}
