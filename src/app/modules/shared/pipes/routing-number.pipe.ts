import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appRoutingNumber'
})

export class RoutingNumberPipe implements PipeTransform {
  transform(value: string): any {
    if (value && value.length === 9) {
      // return value.replace(/^(.{4})(.{6})(.*)$/, "$1 $2 $3");
      return value.match(/.{1,3}/g).join(' ');
    } else {
      return '';
    }
  }
}
