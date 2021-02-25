import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'corporateContactExist'
})
export class CorporateContactExistPipe implements PipeTransform {

  transform(corporateContactList: any[], type: string): any {
    let exist = false;
    if (type === 'Primary') {
      exist = corporateContactList.some((e) => e.isPrimary);
    }
    if (type === 'Billing') {
      exist = corporateContactList.some((e) => e.isBilling);
    }
    return exist;
  }

}
