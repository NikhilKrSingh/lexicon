import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SupportGuard } from 'src/app/guards/permission-guard.service';
import { AllNotificationsComponent } from './all-notifications/all-notifications.component';
import { SettingsComponent } from './settings/settings.component';
import { SupportComponent } from './support/support.component';

const routes: Routes = [
  { path: 'all', component: AllNotificationsComponent,},
  {path: 'settings', component: SettingsComponent,},
   {path: 'support', component: SupportComponent, canActivate: [SupportGuard]},
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotificationsRoutingModule { }
