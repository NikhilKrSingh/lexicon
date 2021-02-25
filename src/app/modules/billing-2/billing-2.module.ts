import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Billing2RoutingModule } from './billing-2-routing.module';
import { MassUpdateRatesComponent } from './mass-update-rates/mass-update-rates.component';


@NgModule({
  declarations: [
    MassUpdateRatesComponent
  ],
  imports: [
    CommonModule,
    Billing2RoutingModule
  ]
})
export class Billing2Module { }
