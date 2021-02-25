import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { BillingSettingsSharedModule } from '../shared/billing-settings/billing-settings.module';
import { SharedModule } from '../shared/shared.module';
import { AuditHistoryComponent } from './audit-history/audit-history.component';
import { CreateEmployeeComponent } from './create/create.component';
import { GeneralinfoComponent } from './create/generalinfo/generalinfo.component';
import { SettingsComponent } from './create/settings/settings.component';
import { EmployeeAdminRoutingModule } from './employee-admin-routing.module';
import { ListComponent } from './list/list.component';
import { EditContactComponent } from './profile/edit-employee-info/edit-contact/edit-contact.component';
import { EditDatesComponent } from './profile/edit-employee-info/edit-date/edit-date.component';
import { EditStateComponent } from './profile/edit-employee-info/edit-state/edit-state.component';
import { EditOfficeComponent } from './profile/edit-employee-info/office/office.component';
import { EditPersonalInfoComponent } from './profile/edit-employee-info/personal-info/personal-info.component';
import { EditReportingRelationshipsComponent } from './profile/edit-employee-info/reporting-relationships/reporting-relationships.component';
import { TimeZoneLabelPipe } from './profile/edit-employee-info/timezone-label.pipe';
import { EditWorkingHoursComponent } from './profile/edit-employee-info/working-hours/working-hours.component';
import { DisbursementSettingsComponent } from './profile/profile-info-details/disbursement-settings/disbursement-settings.component';
import { EmployeeProfileBaseRateComponent } from './profile/profile-info-details/employee-profile-base-rate/employee-profile-base-rate.component';
import { GroupsComponent } from './profile/profile-info-details/groups/groups.component';
import { EmployeeProfileInitialConsultsComponent } from './profile/profile-info-details/initial-consults/initial-consults.component';
import { EmployeeProfileMattersComponent } from './profile/profile-info-details/matters/matters.component';
import { EmployeeNotesComponent } from './profile/profile-info-details/notes/notes.component';
import { EmployeeProfileInfoDetailsComponent } from './profile/profile-info-details/profile-info-details.component';
import { EmployeeRateTablesComponent } from './profile/profile-info-details/rate-tables/rate-tables.component';
import { EmployeeReportingRelationsComponent } from './profile/profile-info-details/reporting-relations/reporting-relations.component';
import { ProfileComponent } from './profile/profile.component';
import { EmployeeAdminRateTableComponent } from './shared/rate-table/rate-table.component';
import { WorkingHoursPickerComponent } from './shared/working-hours-picker/working-hours-picker.component';

@NgModule({
  imports: [
    CommonModule,
    EmployeeAdminRoutingModule,
    SharedModule,
    NgxDatatableModule,
    BillingSettingsSharedModule
  ],
  declarations: [
    ProfileComponent,
    ListComponent,
    AuditHistoryComponent,
    CreateEmployeeComponent,
    SettingsComponent,
    GeneralinfoComponent,
    EditPersonalInfoComponent,
    EditWorkingHoursComponent,
    EditReportingRelationshipsComponent,
    EditOfficeComponent,
    WorkingHoursPickerComponent,
    EmployeeProfileInfoDetailsComponent,
    EmployeeProfileMattersComponent,
    EmployeeProfileInitialConsultsComponent,
    EmployeeRateTablesComponent,
    DisbursementSettingsComponent,
    EmployeeReportingRelationsComponent,
    EmployeeNotesComponent,
    EditDatesComponent,
    EmployeeAdminRateTableComponent,
    EditContactComponent,
    EditStateComponent,
    GroupsComponent,
    EmployeeProfileBaseRateComponent,
    TimeZoneLabelPipe
  ],
  entryComponents: [
    EditPersonalInfoComponent,
    EditWorkingHoursComponent,
    EditReportingRelationshipsComponent,
    EditOfficeComponent,
    GeneralinfoComponent,
    EditDatesComponent,
    EditContactComponent,
    EditStateComponent
  ]
})
export class EmployeeAdminModule {}
