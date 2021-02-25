import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'officeStatus'
})
export class OfficeStatusPipe implements PipeTransform {
  todayDate = new Date();
  
  transform(
    effectiveDate: any,
    status: any,
  ) {
    if (effectiveDate !== null) {
      return new Date(effectiveDate) > this.todayDate ? 'Pending' : status;
    } else {
      return status;
    }
  }

}
