import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxMaskModule } from 'ngx-mask';

import { BillingSettingsSharedModule } from 'src/app/modules/shared/billing-settings/billing-settings.module';
import { SharedModule } from 'src/app/modules/shared/shared.module';

import { PotentialClientBillingDetailsComponent } from './potential-client-billing-details.component';
import { NewConsulationFeeComponent } from './new-consulation-fee/new-consulation-fee.component';
import { AddEditConsulationComponent } from './new-consulation-fee/add-edit-consulation/add-edit-consulation.component';
import { BillNowComponent } from './bill-now/bill-now.component';

@NgModule({
  declarations: [
    PotentialClientBillingDetailsComponent,
    NewConsulationFeeComponent,
    AddEditConsulationComponent,
    BillNowComponent,
  ],
  exports: [
    PotentialClientBillingDetailsComponent,
    NewConsulationFeeComponent,
    AddEditConsulationComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    NgxDatatableModule,
    BillingSettingsSharedModule,
    NgxMaskModule.forRoot(),
  ],
  entryComponents: [AddEditConsulationComponent, NewConsulationFeeComponent],
})
export class PotentialClientBillingDetailsModule {}
