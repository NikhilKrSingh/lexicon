import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getValueByKeyType'
})
export class GetValueByKeyTypePipe implements PipeTransform {

  transform(array: any[], key: string, type: any, value: any): any {
    let arrayObj = array.find(a => (type !== null) ? a[key] === type : a[key]);

    if (typeof arrayObj === 'object') {
      if (arrayObj.hasOwnProperty(key)) {
        return arrayObj[value];
      }
    } else {
      return '';
    }
  }

}
