import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { DocumentPortalRoutingModule } from './document-portal-routing.module.';
import { DocumentPortalComponent } from './document-portal.component';
import { SendDocumentComponent } from './send-document/send-document.component';
import { DocumentPortalSettingsComponent } from './settings/settings.component';

@NgModule({
  declarations: [
    DocumentPortalSettingsComponent,
    DocumentPortalComponent,
    SendDocumentComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    DocumentPortalRoutingModule
  ]
})
export class DocumentPortalModule { }
