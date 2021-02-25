import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../shared/shared.module';
import { ExterenalDMSRoutingModule } from './external-dms-routing.module';
import { DocumentPortalLayoutComponent } from './layout/document-portal-layout/document-portal-layout.component';
import { DocumentPortalSidebarComponent } from './layout/document-portal-layout/document-portal-sidebar/document-portal-sidebar.component';
import { DocumentPortalTopBarComponent } from './layout/document-portal-layout/document-portal-top-bar/document-portal-top-bar.component';
import { ViewFileComponent } from './view-file/view-file.component';

@NgModule({
  declarations: [
    DocumentPortalLayoutComponent,
    DocumentPortalTopBarComponent,
    DocumentPortalSidebarComponent,
    ViewFileComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ExterenalDMSRoutingModule,
    AuthModule,
    SharedModule
  ]
})
export class ExternalDmsModule { }
