import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trackByObj'
})
export class TrackByObjPipe implements PipeTransform {

  transform(obj:any): any {
    return (obj) => obj;
  }

}
