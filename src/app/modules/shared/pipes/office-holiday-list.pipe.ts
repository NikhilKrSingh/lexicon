import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';

@Pipe({
  name: 'officeHolidayList'
})
export class OfficeHolidayListPipe implements PipeTransform {

  transform(
    item: Array<any>,
    year: any,
  ) {
    if (item != null) {
      item = item.filter(a => new Date(a.date).getFullYear() === year);
      if(item && item.length){
        item = _.orderBy(item, ['date'], ['asc']);
      }
    }
    return item;
  }

}
