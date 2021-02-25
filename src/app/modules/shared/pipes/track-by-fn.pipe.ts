import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trackByFn'
})
export class TrackByFnPipe implements PipeTransform {

  transform(obj:any,key:any): any {
    return (obj) => obj[key];
  }

}
