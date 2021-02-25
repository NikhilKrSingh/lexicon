import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'officeHoliday'
})
export class OfficeHolidayPipe implements PipeTransform {

  transform(
    item: Array<any>,
    year: any,
  ) {
    if (item != null) {
      item = item.filter(a => new Date(a.date).getFullYear() === year);
    }
    return item; 
  }

}
