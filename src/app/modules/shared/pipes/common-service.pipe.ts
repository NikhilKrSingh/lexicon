import { Pipe, PipeTransform } from '@angular/core';
import { CommonService } from 'src/app/service/common.service';

@Pipe({
  name: 'commonService'
})
export class CommonServicePipe implements PipeTransform {
  constructor(
    public commonService: CommonService,
  ) {
    
  }
  transform(
    value: string,
    methodName: string,
    notFilled?: boolean
  ) {
    if(methodName == 'getFileImage'){
      return this.commonService.getFileImage(value, notFilled);
    }else if(methodName == 'splitPath'){
      let list = value.split('quarto-dms-data/').pop().split('/');
      return list;
    }else if(methodName == 'formatKiloBytes'){
      return this.commonService.formatKiloBytes(value);
    }else if(methodName === 'lowercaseText') {
      return value.toLowerCase();
    }else if(methodName === 'getFileExtension') {
      return value.substr(value.lastIndexOf('.') + 1).toLowerCase();
    }else if (methodName == 'trimText') {
      return value.trim();
    }else if(methodName == 'getTruncatedName'){
      return this.commonService.getTruncatedName(value);
    } 
  }

}
