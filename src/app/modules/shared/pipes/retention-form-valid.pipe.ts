import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'retentionFormValid'
})
export class RetentionFormValidPipe implements PipeTransform {

  transform(value: any, component = 'all'): any {
    if ((component === 'all' || component === 'basic') && value.basic && value.basic.isNotBasicInformationValidate()) {
      return true;
    }
    if ((component === 'all' || component === 'matter') && value.matter && value.matter.isNotMatterDetailsValidate()) {
      return true;
    }
    if ((component === 'all' || component === 'billing') && value.billing && value.billing.isNotValidBillingInformation()) {
      return true;
    }
    if ((component === 'all' || component === 'trust') && value.trust && !value.trust.returnTrustBankAccountData()) {
      return true;
    }
    return false;
  }

}
