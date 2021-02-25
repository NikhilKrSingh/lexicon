import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'workingHours'
})
export class WorkingHoursPipe implements PipeTransform {

  transform(open: string, close: string) {
    if (open && close) {
      if (open === close && open.includes('00:00:00') && close.includes('00:00:00')) {
        return 'Closed';
      } else if (open == close && open == '00' && close == '00') {
        return 'Closed';
      } else {
        const opening = this.tConvert(open);
        const closing = this.tConvert(close);

        return `${opening} - ${closing}`;
      }
    } else {
      return '-';
    }
  }

  public tConvert(time) {
    time = time.substr(0, 5);
    time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

    if (time.length > 1) {
      time = time.slice(0);
      time = time.slice(1);
      time[5] = +time[0] < 12 ? 'am' : 'pm'; // Set AM/PM
      time[0] = +time[0] % 12 || 12; // Adjust hours
    }
    return time.join('');
  }

}
