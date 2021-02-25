import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { SharedModule } from '../shared/shared.module';
import { CalendarRoutingModule } from './calendar-routing.module';
import { CalendarComponent } from './calendar/calendar.component';
import { CreateEventComponent } from './create-event/create-event.component';
import { EditEventComponent } from './edit-event/edit-event.component';
import { ProposeNewTimeComponent } from './propose-new-time/propose-new-time.component';
import { CalendarSettingsComponent } from './settings/settings.component';

@NgModule({
  declarations: [
    CalendarComponent,
    CalendarSettingsComponent,
    CreateEventComponent,
    EditEventComponent,
    ProposeNewTimeComponent,
  ],
  imports: [
    CommonModule,
    CalendarRoutingModule,
    FullCalendarModule,
    SharedModule
  ]
})
export class CalendarModule {}
