import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClientBackButtonRouteGuard } from '../../../guards/client-back-button-deactivate.guard';
import { BillingComponent } from './billing/billing.component';
import { CorporateComponent } from './corporate/corporate.component';
import { ReassignClientComponent } from './reassign-client/reassign-client.component';

const routes: Routes = [
  {path: 'individual', component: CorporateComponent, canDeactivate: [ClientBackButtonRouteGuard]},
  {path: 'corporate', component: CorporateComponent, canDeactivate: [ClientBackButtonRouteGuard]},
  {path: 'billing', component: BillingComponent},
  {path: 'reassign-client', component: ReassignClientComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [ClientBackButtonRouteGuard]
})
export class ClientViewRoutingModule { }
