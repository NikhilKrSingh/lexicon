import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sliceByLength'
})
export class SliceByLengthPipe implements PipeTransform {

  transform(value: any, length: number): any {
    if (length === 1) {
      return value.slice(0, -1);
    } else {
      return value;
    }
  }

}
