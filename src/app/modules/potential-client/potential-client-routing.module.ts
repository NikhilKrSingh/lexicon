import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackButtonRouteGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ContactGuard } from 'src/app/guards/permission-guard.service';
import { IndividualPotentialClientComponent } from './individual/individual.component';
import { NewPotentialClientIntakeComponent } from './new-potential-client-intake/new-potential-client-intake.component';

const routes: Routes = [
  {
    path: 'new-potential-client-intake',
    component: NewPotentialClientIntakeComponent,
    canActivate: [ContactGuard],
    canDeactivate: [BackButtonRouteGuard],
    data: { type: 'edit' },
  },
  {
    path: 'individual',
    component: IndividualPotentialClientComponent,
    canActivate: [ContactGuard],
    canDeactivate: [BackButtonRouteGuard],
    data: { type: 'edit' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PotentialClientRoutingModule {}
