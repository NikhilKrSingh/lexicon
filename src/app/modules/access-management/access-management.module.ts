import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { SharedModule } from '../shared/shared.module';
import { AccessManagementRoutingModule } from './access-management-routing.module';
import { AuditHistoryComponent } from './audit-history/audit-history.component';
import { CreateComponent } from './create/create.component';
import { ListComponent } from './list/list.component';
import { ViewComponent } from './view/view.component';
import { AddUsersComponent } from './create/add-users/add-users.component';

@NgModule({
  declarations: [
    ListComponent,
    CreateComponent,
    ViewComponent,
    AuditHistoryComponent,
    AddUsersComponent
  ],
  imports: [
    CommonModule,
    AccessManagementRoutingModule,
    SharedModule,
    NgxDatatableModule,
    FormsModule,
    ReactiveFormsModule
  ],
  entryComponents: [AddUsersComponent]
})
export class AccessManagementModule {}
