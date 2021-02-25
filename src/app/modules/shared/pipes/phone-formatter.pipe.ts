import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneFormatter'
})
export class PhoneFormatterPipe implements PipeTransform {
  transform(phone: string): any {
    let formattedPhone;
    if (phone && phone !== '--' && phone !== '') {
      formattedPhone = '(' + phone.substr(0, 3) + ') ' + phone.substr(3, 3) + '-' + phone.substr(6, 4);
    } else {
      formattedPhone = (phone) ? phone : '--';
    }
    return formattedPhone;
  }
}
