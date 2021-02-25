import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'decimalMaxLength',
  pure: false
})

export class DecimalMaxlengthPipe implements PipeTransform {
  transform(decimalValue: any): any {
    if(decimalValue && decimalValue.value){
      return decimalValue.value.includes('.')? 19:16;
    } else {
      return 16;
    }
  }
}
