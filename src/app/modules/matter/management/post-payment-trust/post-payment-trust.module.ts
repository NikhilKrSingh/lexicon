import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { MatterSharedModule } from '../shared/shared.module';
import { PostPaymentTrustComponent } from './post-payment-trust.component';

@NgModule({
  declarations: [PostPaymentTrustComponent],
  imports: [CommonModule, SharedModule, RouterModule, MatterSharedModule],
  exports: [PostPaymentTrustComponent],
})
export class MatterPostPaymentTrustModule {}
