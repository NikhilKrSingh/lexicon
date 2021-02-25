import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { UsioOwnerDetailModule } from '../usio-setup/usio-owner-details/usio-owner-details.module';
import { OwnerConfirmationComponent } from './owner-confirmation/owner-confirmation.component';
import { OwnerInformationRoutingModule } from './owner-information-routing.module';
import { OwnerInformationComponent } from './owner-information.component';

@NgModule({
  declarations: [OwnerInformationComponent, OwnerConfirmationComponent],
  imports: [
    OwnerInformationRoutingModule,
    CommonModule,
    SharedModule,
    UsioOwnerDetailModule
  ]
})
export class OwnerInformationModule { }
