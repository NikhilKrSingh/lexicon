import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getContactFilterMap'
})
export class GetContactFilterMapPipe implements PipeTransform {

  transform(corporateContacts: any, type: string): any {
    return corporateContacts
      .filter((obj: { code: any }) => obj.code === type)
      .map(({name}) => name);
  }

}
