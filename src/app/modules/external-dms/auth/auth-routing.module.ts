import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginGuard } from 'src/app/guards/auth-guard.service';
import { DmsActivationComponent } from './dms-activation/dms-activation.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { LoginComponent } from './login/login.component';
import { ResetpassComponent } from './resetpass/resetpass.component';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard], data: { redirect: true } },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [LoginGuard], data: { redirect: true } },
  { path: 'resetpass', component: ResetpassComponent, canActivate: [LoginGuard], data: { redirect: true } },
  { path: 'activate', component: DmsActivationComponent, canActivate: [LoginGuard], data: { redirect: true } }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
