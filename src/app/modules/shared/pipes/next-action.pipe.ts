import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nextAction',
})
export class NextActionPipe implements PipeTransform {
  constructor(private dp: DatePipe) {}

  transform(clientDetail: any) {
    if (clientDetail) {
      return clientDetail.nextActionNote
        ? clientDetail.nextActionDate
          ? this.dp.transform(clientDetail.nextActionDate, 'MM/dd/yyyy')
          : 'Yes'
        : 'No';
    } else {
      return '';
    }
  }
}
