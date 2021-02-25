import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { LogTimeComponent } from './log-time/log-time.component';
import { TopbarComponent } from './topbar.component';

@NgModule({
  declarations: [TopbarComponent, LogTimeComponent],
  imports: [CommonModule, SharedModule, RouterModule],
  exports: [TopbarComponent, LogTimeComponent],
  entryComponents: [LogTimeComponent],
})
export class TopbarModule {}
