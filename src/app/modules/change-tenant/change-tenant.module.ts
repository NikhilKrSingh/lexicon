import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChangeTenantRoutingModule } from './change-tenant-routing.module';
import { ChangeTenantComponent } from './change-tenant.component';
import { SharedModule } from "../shared/shared.module";


@NgModule({
  declarations: [ChangeTenantComponent],
  imports: [
    CommonModule,
    ChangeTenantRoutingModule,
    SharedModule
  ]
})
export class ChangeTenantModule { }
