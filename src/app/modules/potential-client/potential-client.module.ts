import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxMaskModule } from 'ngx-mask';
import { SharedModule } from '../shared/shared.module';
import { ContactAttorneyComponent } from './individual/contact-attorney/contact-attorney.component';
import { ContactBasicComponent } from './individual/contact-basic/contact-basic.component';
import { ContactMatterComponent } from './individual/contact-matter/contact-matter.component';
import { ContactNotesComponent } from './individual/contact-notes/contact-notes.component';
import { ContactSchedulingComponent } from './individual/contact-scheduling/contact-scheduling.component';
import { IndividualPotentialClientComponent } from './individual/individual.component';
import { BasicMatterInfoComponent } from './new-potential-client-intake/basic-matter-info/basic-matter-info.component';
import { ClientAssociationComponent } from './new-potential-client-intake/client-association/client-association.component';
import { ContactInfoComponent } from './new-potential-client-intake/contact-info/contact-info.component';
import { NewPotentialClientIntakeComponent } from './new-potential-client-intake/new-potential-client-intake.component';
import { NotesComponent } from './new-potential-client-intake/notes/notes.component';
import { SchedulingComponent } from './new-potential-client-intake/scheduling/scheduling.component';
import { PotentialClientRoutingModule } from './potential-client-routing.module';

@NgModule({
  declarations: [
    IndividualPotentialClientComponent,
    ContactBasicComponent,
    ContactMatterComponent,
    ContactAttorneyComponent,
    ContactSchedulingComponent,
    ContactNotesComponent,
    NewPotentialClientIntakeComponent,
    BasicMatterInfoComponent,
    ContactInfoComponent,
    ClientAssociationComponent,
    SchedulingComponent,
    NotesComponent
  ],
  imports: [
    CommonModule,
    PotentialClientRoutingModule,
    NgxMaskModule.forRoot(),
    SharedModule,
    NgxDatatableModule
  ]
})
export class PotentialClientModule {}
