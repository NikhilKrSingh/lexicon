import { EventEmitter, Injectable } from '@angular/core';
import { vwBillingSettings } from 'src/common/swagger-providers/models';

@Injectable({
  providedIn: 'root',
})
export class CommonValidationService {
  public validateChargeCode$ = new EventEmitter<number>(false);
  public newChargeCodeList = new EventEmitter<any[]>(false);

  public isValidOperatingAccounting = new EventEmitter<boolean>(false);
  public isValidEditGenerationFrequency = new EventEmitter<boolean>(false);
  billingSettings: vwBillingSettings;
}
