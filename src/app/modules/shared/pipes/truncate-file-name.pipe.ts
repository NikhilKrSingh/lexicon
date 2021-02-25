import { Pipe, PipeTransform } from '@angular/core';
import { SharedService } from 'src/app/modules/shared/sharedService'

@Pipe({
  name: 'truncateFileName'
})
export class TruncateFileNamePipe implements PipeTransform {
  constructor(
    public sharedService: SharedService
  ){

  }

  transform(value: any): any {
    if(value.name.length > 24){
      return value.name.substr(0, 24)+'...'+ this.sharedService.getFileExtension(value.name)
    } else {
      return value.name
    }
  }

}
