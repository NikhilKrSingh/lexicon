import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { AddPostPaymentCreditCardComponent } from './add-credit-card/add-credit-card.component';
import { AddPostPaymentEcheckComponent } from './add-echeck/add-echeck.component';

@NgModule({
  declarations: [
    AddPostPaymentCreditCardComponent,
    AddPostPaymentEcheckComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [
    AddPostPaymentCreditCardComponent,
    AddPostPaymentEcheckComponent
  ]
})
export class MatterSharedModule { }
