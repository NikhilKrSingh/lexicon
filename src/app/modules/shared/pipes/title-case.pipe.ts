import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'titleCase'
})
export class TitleCasePipe implements PipeTransform {

  transform(val: any): any {
    return val.charAt(0).toUpperCase() + val.slice(1);
  }

}
