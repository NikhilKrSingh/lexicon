import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'contactType'
})
export class ContactTypePipe implements PipeTransform {

  transform(item?: any): any {
    let type: string;
    if (item.metaData[10].name === 'True') {
      type = 'Client Association';
    } else if (item.metaData[11].name === 'True') {
      type = 'Corporate Contact';
    } else if (item.metaData[12].name === 'True') {
      type = 'Potential Client';
    } else {
      type = '--';
    }
    return type;
  }

}
