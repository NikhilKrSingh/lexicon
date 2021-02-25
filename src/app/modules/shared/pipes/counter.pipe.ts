import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'counterPipe'
})
export class CounterPipe implements PipeTransform {

  transform(
    length: number,
  ) {
    return Array(length);    
  }

}
