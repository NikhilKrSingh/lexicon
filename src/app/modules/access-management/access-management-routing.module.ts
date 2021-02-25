import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackButtonRouteGuard } from 'src/app/guards/back-button-deactivate.guard';
import { AccessGuard } from 'src/app/guards/permission-guard.service';
import { AuditHistoryComponent } from './audit-history/audit-history.component';
import { CreateComponent } from './create/create.component';
import { ListComponent } from './list/list.component';
import { ViewComponent } from './view/view.component';

const routes: Routes = [
  { path: '', component: ListComponent, pathMatch: 'full' },
  {path: 'list', component: ListComponent, canActivate: [AccessGuard]},
  {path: 'audit-history', component: AuditHistoryComponent, canActivate: [AccessGuard]},
  {path: 'create', component: CreateComponent, canActivate: [AccessGuard], canDeactivate: [BackButtonRouteGuard]},
  {path: 'view', component: ViewComponent, canActivate: [AccessGuard]},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccessManagementRoutingModule { }
