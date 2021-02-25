import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { DetailsComponent } from './details/details.component';
import { ImportListComponent } from './import-list/import-list.component';
import { ImportRoutingModule } from './import-routing.module';
import { RunImportComponent } from './run-import/run-import.component';

@NgModule({
  declarations: [ImportListComponent, DetailsComponent,RunImportComponent],
  imports: [
    CommonModule,
    ImportRoutingModule,
    SharedModule
  ]
})
export class ImportModule { }
