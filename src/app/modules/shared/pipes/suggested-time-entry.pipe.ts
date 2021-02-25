import { Pipe, PipeTransform } from '@angular/core';
import { padNumber } from '../utils.helper';

@Pipe({
  name: 'suggestedTimeEntry',
})
export class SuggestedTimeEntryPipe implements PipeTransform {
  /**
   * value in minutes
   */
  transform(value: number): string {
    return this.gethoursInString(value);
  }

  gethoursInString(time: number) {
    let hour = Math.floor(time / 60);
    let min = Math.floor(time - hour * 60);
    if (min >= 60) {
      hour = +hour + 1;
      min = +min - 60;
    }
    const timeDisplay = localStorage.getItem('timeformat');

    if (timeDisplay === 'jira') {
      return hour + 'h' + ' ' + min + 'm';
    } else if (timeDisplay === 'standard') {
      return hour + ':' + padNumber(+min);
    } else if (timeDisplay === 'decimal') {
      const hoursMinutes = (hour + ':' + min).split(/[.:]/);
      const hours = parseInt(hoursMinutes[0], 10);
      const minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
      return (hours + minutes / 60).toFixed(2);
    } else {
      return hour + 'h' + ' ' + min + 'm';
    }
  }
}
