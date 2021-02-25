import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trustOnlyNumberDisplay'
})
export class TrustOnlyNumberDisplayPipe implements PipeTransform {

  transform(item: any): any {
    let names = item.name.split(item.trustNumber + ' - ');
    if (names.length > 1) {
      return names[1];
    } else {
      return item.name;
    }
  }

}
