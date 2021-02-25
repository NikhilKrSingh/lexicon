import { CurrencyPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'usdCurrency',
})
export class UsdCurrenyPipe implements PipeTransform {
  constructor(private cp: CurrencyPipe) {}

  transform(value: any): any {
    return this.cp.transform(value || 0, 'USD', 'symbol', '1.2-2');
  }
}
