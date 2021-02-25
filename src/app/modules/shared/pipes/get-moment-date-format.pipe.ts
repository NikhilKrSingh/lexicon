import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';
@Pipe({
  name: 'getMomentDateFormat'
})
export class GetMomentDateFormatPipe implements PipeTransform {

  momentObj = moment;
  
  transform(
    value: string,
    format: string,
    utc: boolean
  ): any {
    if(utc) {
      return this.momentObj.utc(value).local().format(format);
    } else {
      return this.momentObj(value).format(format);
    }
  }

}
