import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AddEditFirmTrustAccountComponent } from './setting/add-edit-firm-trust-account/add-edit-firm-trust-account.component';
import { SettingComponent } from './setting/setting.component';
import { TrustAccountRoutingModule } from './trust-account-routing.module';

@NgModule({
  declarations: [SettingComponent, AddEditFirmTrustAccountComponent],
  imports: [
    CommonModule,
    SharedModule,
    TrustAccountRoutingModule,
  ],
  entryComponents: [
    AddEditFirmTrustAccountComponent
  ]
})
export class TrustAccountModule { }
