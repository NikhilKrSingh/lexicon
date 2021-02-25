import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AddBankAccountComponent } from './add-bank-account/add-bank-account.component';
import { BankAccountComponent } from './bank-account/bank-account.component';
import { ResendOwnerInfoEmailComponent } from './resend-owner-info-email/resend-owner-info-email.component';
import { UsioOwnerDetailModule } from './usio-owner-details/usio-owner-details.module';
import { UsioSetupRoutingModule } from './usio-setup-routing.module';
import { UsioSetupComponent } from './usio-setup.component';

@NgModule({
  declarations: [UsioSetupComponent, BankAccountComponent, AddBankAccountComponent, ResendOwnerInfoEmailComponent],
  imports: [
    CommonModule,
    SharedModule,
    UsioSetupRoutingModule,
    UsioOwnerDetailModule
  ]
})
export class UsioSetupModule { }
