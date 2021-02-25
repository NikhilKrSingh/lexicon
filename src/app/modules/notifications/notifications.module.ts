import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { SharedModule } from '../shared/shared.module';
import { AllNotificationsComponent } from './all-notifications/all-notifications.component';
import { NotificationsRoutingModule } from './notifications-routing.module';
import { SettingsComponent } from './settings/settings.component';
import { SupportComponent } from './support/support.component';

@NgModule({
  declarations: [SupportComponent, AllNotificationsComponent, SettingsComponent,],
  imports: [
    CommonModule,
      NotificationsRoutingModule,
      FormsModule,
      ReactiveFormsModule,
      NgxDatatableModule,
      SharedModule
  ]
})
export class NotificationsModule { }
