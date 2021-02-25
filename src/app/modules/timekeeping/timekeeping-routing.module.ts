import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TimekeepingGuard } from 'src/app/guards/permission-guard.service';
import { MytimesheetComponent } from './mytimesheet/mytimesheet.component';
import { TimekeepingComponent } from './timekeeping/timekeeping.component';

const routes: Routes = [
  {path: 'my-timesheet', canActivate: [TimekeepingGuard], component: MytimesheetComponent, pathMatch: 'full'},
  {path: 'all-timesheets', canActivate: [TimekeepingGuard], component: TimekeepingComponent, pathMatch: 'full'},
  {path: '', redirectTo: 'all-timesheets', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TimekeepingRoutingModule {
}
