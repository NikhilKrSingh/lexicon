import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MassUpdateRatesComponent } from './mass-update-rates/mass-update-rates.component';

const routes: Routes = [
  { path: 'mass-update-rates', component: MassUpdateRatesComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class Billing2RoutingModule { }
