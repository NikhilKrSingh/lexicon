import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared.module';
import { AddOnServicesComponent } from './add-on-services/add-on-services.component';
import { AddOnServiceWriteDownComponent } from './add-on-services/write-down/write-down.component';
import { DeleteFixedFeeWriteDownComponent } from './fixed-fee-services/delete-write-down/delete-write-down.component';
import { FixedFeeServicesComponent } from './fixed-fee-services/fixed-fee-services.component';
import { FixedFeeWriteDownComponent } from './fixed-fee-services/write-down/write-down.component';

@NgModule({
  declarations: [
    FixedFeeServicesComponent,
    AddOnServicesComponent,
    AddOnServiceWriteDownComponent,
    FixedFeeWriteDownComponent,
    DeleteFixedFeeWriteDownComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [
    FixedFeeServicesComponent,
    AddOnServicesComponent,
    AddOnServiceWriteDownComponent,
    FixedFeeWriteDownComponent,
    DeleteFixedFeeWriteDownComponent,
  ],
  entryComponents: [
    AddOnServiceWriteDownComponent,
    FixedFeeWriteDownComponent,
    DeleteFixedFeeWriteDownComponent,
  ],
})
export class FixedFeePreBillSharedModule {}
