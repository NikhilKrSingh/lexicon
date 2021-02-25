import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'substrByLength'
})
export class SubstrByLengthPipe implements PipeTransform {

  transform(value: any, length: number): any {
    if (value) {
      value = `${value}`;
      return value.substr(value.length - length)
    }
  }

}
