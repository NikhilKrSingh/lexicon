import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, LoginGuard } from 'src/app/guards/auth-guard.service';
import { DocumentPortalLayoutComponent } from './layout/document-portal-layout/document-portal-layout.component';
import { ViewFileComponent } from './view-file/view-file.component';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
    canActivate: [LoginGuard],
    data: { redirect: true }
  },
  {
    path: '',
    component: DocumentPortalLayoutComponent,
    loadChildren: () => import('./document-portal/document-portal.module').then(m => m.DocumentPortalModule),
    canActivate: [AuthGuard],
    data: { redirect: true }
  },
  {
    path: 'downloadFile',
    component: ViewFileComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExterenalDMSRoutingModule { }
