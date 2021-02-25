import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'preferredContact'
})
export class PreferredContactPipe implements PipeTransform {

  transform(row: any) {
    if (row) {
      if (row.preferredContactMethod == 'Email') {
        return row.email;
      } else if (
        row.preferredContactMethod == 'Text' ||
        row.preferredContactMethod == 'Call' ||
        row.preferredContactMethod == 'Cell'
      ) {
        if (row.phones) {
          let number1 = row.phones.find((a) => a.isPrimary);
          let number = (number1) ? number1.number : null

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
      } else {
        return '--';
      }
    }
  }

}
