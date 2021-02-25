import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashComponent } from './dash/dash.component';
import { DashmainComponent } from './dashmain/dashmain.component';

const routes: Routes = [
  {path: '', component: DashmainComponent, pathMatch: 'full'},
  {path: 'dash', component: DashComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],

  exports: [RouterModule]
})
export class DashboardRoutingModule { }
