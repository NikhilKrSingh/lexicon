import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'indexfinder'
})
export class IndexfinderPipe implements PipeTransform {

  transform(
    value : Array<any>,
    name: string,
  ) {
    return value.indexOf(name);
  }
}
