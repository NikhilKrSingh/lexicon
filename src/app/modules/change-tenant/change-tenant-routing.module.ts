import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ChangeTenantComponent } from './change-tenant.component';

const routes: Routes = [
  { path: '', component: ChangeTenantComponent, pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChangeTenantRoutingModule { }
