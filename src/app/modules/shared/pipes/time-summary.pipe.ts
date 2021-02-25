import { CurrencyPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { vwTimeSummary } from '../../models/time-overview';

@Pipe({
  name: 'timeSummary',
})
export class TimeSummaryPipe implements PipeTransform {
  cp = new CurrencyPipe('en-US');

  transform(time: vwTimeSummary, displayFormat = 'jira', fromTooltip = false): string {
    let summary = '';

    if (time) {
      let hours = time.hours || 0;
      let minutes = time.minutes || 0;

      if (minutes > 60) {
        hours += Math.floor(minutes / 60);
        minutes = minutes % 60;
      }

      if (displayFormat == 'jira') {
        if (hours < 0) {
          summary = `-${Math.abs(hours)}h ${Math.abs(minutes)}m`;
        } else {
          if (minutes < 0 && hours == 0) {
            summary = `-$0h ${Math.abs(minutes)}m`;
          } else {
            summary = `${hours}h ${minutes}m`;
          }
        }
      } else if (displayFormat == 'standard') {
        if (hours < 0) {
          summary = `-${Math.abs(hours)}:${Math.abs(minutes)}`;
        } else {
          if (minutes < 0 && hours == 0) {
            summary = `-0:${Math.abs(minutes)}`;
          } else {
            summary = `${hours}:${minutes}`;
          }
        }
      } else if (displayFormat == 'decimal') {
        const hoursMinutes = (hours + ':' + minutes).split(/[.:]/);
        const h = parseInt(hoursMinutes[0], 10);
        const m = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
        summary = (h + m / 60).toFixed(2);
      } else {
        if (hours < 0) {
          summary = `-${Math.abs(hours)}h ${Math.abs(minutes)}m`;
        } else {
          if (minutes < 0 && hours == 0) {
            summary = `-$0h ${Math.abs(minutes)}m`;
          } else {
            summary = `${hours}h ${minutes}m`;
          }
        }
      }

      if (fromTooltip) {
        summary += ` / `;
      } else {
        summary += ` | `;
      }

      summary += this.cp.transform(time.amount || 0, 'USD', 'symbol', '1.2-2');
    }

    return summary;
  }
}
