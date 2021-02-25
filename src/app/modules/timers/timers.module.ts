import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AddTimeEntryComponent } from './add-time-entry/add-time-entry.component';
import { ChargeCodeItemComponent } from './add-time-entry/charge-code-item/charge-code-item.component';
import { TimersComponent } from './timers.component';

@NgModule({
  declarations: [
    TimersComponent,
    AddTimeEntryComponent,
    ChargeCodeItemComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [TimersComponent],
  entryComponents: [
    TimersComponent,
    AddTimeEntryComponent,
    ChargeCodeItemComponent,
  ],
  providers: [DatePipe],
})
export class TimersModule {}
