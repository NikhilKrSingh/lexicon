import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsioOwnerDetailsComponent } from '../usio-setup/usio-owner-details/usio-owner-details.component';
import { OwnerConfirmationComponent } from './owner-confirmation/owner-confirmation.component';

const routes: Routes = [
  {path: 'owner-details', component: UsioOwnerDetailsComponent},
  {path: 'verify', component: OwnerConfirmationComponent},  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OwnerInformationRoutingModule { }