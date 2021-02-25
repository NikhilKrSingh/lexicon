import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { SharedModule } from '../shared/shared.module';
import { ResultsComponent } from './results/results.component';
import { SearchRoutingModule } from './search-routing.module';

@NgModule({
  declarations: [ResultsComponent],
  imports: [
    CommonModule,
    SearchRoutingModule,
    NgxDatatableModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ]
})
export class SearchModule { }
