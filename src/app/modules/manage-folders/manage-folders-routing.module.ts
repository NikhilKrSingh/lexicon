import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackButtonRouteGuard } from 'src/app/guards/back-button-deactivate.guard';
import { DocumentManagementComponent } from './document-management/document-management.component';
import { GenerateDocumentComponent } from './generate-document/generate-document.component';
import { ReplaceDocumentComponent } from './replace-document/replace-document.component';
import { UploadDocvComponent } from './upload-docv/upload-docv.component';
import { ViewDocumentComponent } from './view-document/view-document.component';

const routes: Routes = [
  { path: '', component: DocumentManagementComponent, pathMatch: 'full' },
  { path: 'document', component: DocumentManagementComponent },
  { path: 'view-document', component: ViewDocumentComponent },
  { path: 'upload-document', component: UploadDocvComponent },
  { path: 'replace-document', component: ReplaceDocumentComponent},
  { path: 'generate-document', component: GenerateDocumentComponent, canDeactivate: [BackButtonRouteGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManageFoldersRoutingModule { }
