import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { UsioOwnerDetailsComponent } from './usio-owner-details.component';

@NgModule({
  declarations: [UsioOwnerDetailsComponent],
  exports: [UsioOwnerDetailsComponent],
  imports: [
    CommonModule,
    SharedModule,
  ]
})
export class UsioOwnerDetailModule { }
