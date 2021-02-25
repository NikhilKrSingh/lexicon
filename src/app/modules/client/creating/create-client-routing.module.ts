import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackButtonRouteGuard } from 'src/app/guards/back-button-deactivate.guard';
import { CreateClientGuard } from 'src/app/guards/permission-guard.service';
import { ClientCreatingComponent } from './creating.component';

const routes: Routes = [
  {
    path: 'create',
    component: ClientCreatingComponent,
    canActivate: [CreateClientGuard],
    canDeactivate: [BackButtonRouteGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CreateClientRoutingModule {}
