import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeMappedValue',
})
export class TimeMappedValuePipe implements PipeTransform {
  transform(attr: any): string {
    let aTimes = attr.availableTimes.filter((item) => item.isAvailable);
    if (aTimes) {
      if (aTimes.length > 8) {
        let timesList = [];
        for (let i = 0; i < 8; i++) {
          timesList.push(aTimes[i]);
        }
        return (
          timesList.map((e) => e.name).join(', ') +
          ' (+' +
          (aTimes.length - 8) +
          ' more)'
        );
      } else {
        return aTimes.map((e) => e.name).join(', ');
      }
    } else {
      return '';
    }
  }
}

@Pipe({
  name: 'totalAvailablity',
})
export class TotalAvailablityPipe implements PipeTransform {
  transform(times: any): string {
    if (times) {
      let aTimes = times.filter((item) => item.isAvailable);
      return aTimes.length > 1
        ? aTimes.length + ' Available Times:'
        : aTimes.length + ' Available Time:';
    } else {
      return 0 + ' Available Time:';
    }
  }
}
