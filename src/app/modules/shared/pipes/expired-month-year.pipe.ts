import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'expiredMonthYear'
})
export class ExpiredMonthYearPipe implements PipeTransform {

  transform(value: string): any {
    if (value) {
      let month = value.slice(0, 2);
      let year = value.slice(3);
      return `${month}/${year}`;
    }
  }

}
