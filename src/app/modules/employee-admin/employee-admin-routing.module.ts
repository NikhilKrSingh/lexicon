import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackButtonRouteGuard } from 'src/app/guards/back-button-deactivate.guard';
import { EmployeeGuard } from 'src/app/guards/permission-guard.service';
import { AuditHistoryComponent } from './audit-history/audit-history.component';
import { CreateEmployeeComponent } from './create/create.component';
import { ListComponent } from './list/list.component';
import { ProfileComponent } from './profile/profile.component';



const routes: Routes = [
  { path: '', component: ListComponent, pathMatch: 'full' },
  {
    path: 'list',
    component: ListComponent,
    canActivate: [EmployeeGuard],
    data: { type: 'list' },
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [EmployeeGuard],
    data: { type: 'list' },
  },
  { path: 'audit-history', component: AuditHistoryComponent },
  {
    path: 'create',
    component: CreateEmployeeComponent,
    canActivate: [EmployeeGuard],
    canDeactivate: [BackButtonRouteGuard],
    data: { type: 'admin' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmployeeAdminRoutingModule {}
