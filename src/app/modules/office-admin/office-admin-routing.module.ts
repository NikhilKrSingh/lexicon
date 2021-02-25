import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackButtonRouteGuard } from 'src/app/guards/back-button-deactivate.guard';
import { OfficeGuard } from 'src/app/guards/permission-guard.service';
import { CreateComponent } from './create/create.component';
import { DetailComponent } from './detail/detail.component';
import { ListComponent } from './list/list.component';

const routes: Routes = [
  { path: '', component: ListComponent, pathMatch: 'full' },
  {
    path: 'list',
    component: ListComponent,
    canActivate: [OfficeGuard],
    data: { type: 'list' },
  },
  {
    path: 'detail',
    component: DetailComponent,
    canActivate: [OfficeGuard],
    canDeactivate: [BackButtonRouteGuard],
    data: { type: 'list' },
  },
  {
    path: 'create',
    component: CreateComponent,
    canActivate: [OfficeGuard],
    canDeactivate: [BackButtonRouteGuard],
    data: { type: 'admin' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class officeAdminRoutingModule {}
