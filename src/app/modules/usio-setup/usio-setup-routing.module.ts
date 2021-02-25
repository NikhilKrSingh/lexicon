import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddBankAccountComponent } from './add-bank-account/add-bank-account.component';
import { BankAccountComponent } from './bank-account/bank-account.component';
import { ResendOwnerInfoEmailComponent } from './resend-owner-info-email/resend-owner-info-email.component';
import { UsioOwnerDetailsComponent } from './usio-owner-details/usio-owner-details.component';
import { UsioSetupComponent } from './usio-setup.component';

const routes: Routes = [
  { path: '', component: UsioSetupComponent, pathMatch: 'full' },
  {path: 'usio-setup', component: UsioSetupComponent},
  {path: 'bank-account-details', component: BankAccountComponent},
  {path: 'add-bank-account', component: AddBankAccountComponent},
  {path: 'owner-details', component: UsioOwnerDetailsComponent},
  {path: 'resend-owner-info-email', component: ResendOwnerInfoEmailComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsioSetupRoutingModule { }