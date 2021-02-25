import { CommonModule, CurrencyPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxMaskModule } from 'ngx-mask';
import { NgSlimScrollModule } from 'ngx-slimscroll';
import { SharedModule } from '../shared/shared.module';
import { MytimesheetComponent } from './mytimesheet/mytimesheet.component';
import { TimekeepingRoutingModule } from './timekeeping-routing.module';
import { TimekeepingComponent } from './timekeeping/timekeeping.component';

@NgModule({
  declarations: [MytimesheetComponent, TimekeepingComponent],
  imports: [
    CommonModule,
    TimekeepingRoutingModule,
    NgxMaskModule.forRoot(),
    SharedModule,
    NgxDatatableModule,
    NgSlimScrollModule
  ],
  providers:[CurrencyPipe]
})
export class TimekeepingModule { }
