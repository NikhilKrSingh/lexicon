import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'include'
})
export class IncludePipe implements PipeTransform {

  transform(
    list: Array<any>,
    index: any,
  ) {
    return list.includes(index);    
  }
}
