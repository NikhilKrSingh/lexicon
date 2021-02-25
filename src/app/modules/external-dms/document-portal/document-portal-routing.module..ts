import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/guards/auth-guard.service';
import { DocumentPortalComponent } from './document-portal.component';
import { SendDocumentComponent } from './send-document/send-document.component';
import { DocumentPortalSettingsComponent } from './settings/settings.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full'},
  { path: 'dashboard', component: DocumentPortalComponent, canActivate: [AuthGuard], data: { redirect: true }},
  { path: 'send-document', component: SendDocumentComponent, canActivate: [AuthGuard], data: { redirect: true }},
  { path: 'settings', component: DocumentPortalSettingsComponent, canActivate: [AuthGuard], data: { redirect: true }},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DocumentPortalRoutingModule { }
