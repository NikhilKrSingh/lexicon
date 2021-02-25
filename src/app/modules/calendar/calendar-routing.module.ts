import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackButtonRouteGuard } from 'src/app/guards/back-button-deactivate.guard';
import { CalendarComponent } from './calendar/calendar.component';
import { CreateEventComponent } from './create-event/create-event.component';
import { EditEventComponent } from './edit-event/edit-event.component';
import { ProposeNewTimeComponent } from './propose-new-time/propose-new-time.component';
import { CalendarSettingsComponent } from './settings/settings.component';

const routes: Routes = [
  { path: 'list', component: CalendarComponent },
  { path: 'settings', component: CalendarSettingsComponent, canDeactivate: [BackButtonRouteGuard] },
  { path: 'create-event', component: CreateEventComponent, canDeactivate: [BackButtonRouteGuard] },
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  { path : 'edit-event/:eventId' , component : EditEventComponent},
  { path : 'propose-new-time/:eventId' , component : ProposeNewTimeComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CalendarRoutingModule {}
