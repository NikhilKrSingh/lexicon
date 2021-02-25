import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginGuard } from 'src/app/guards/auth-guard.service';
import { ActiveAccountComponent } from './active-account/active-account.component';
import { AuthorizeCalendarComponent } from './authorize-calendar/authorize-calendar.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { LoginComponent } from './login/login.component';
import { ResetpassComponent } from './resetpass/resetpass.component';
import { TypoComponent } from './typo/typo.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
  { path: 'resetpass', component: ResetpassComponent, canActivate: [LoginGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [LoginGuard] },
  { path: 'activate-account', component: ActiveAccountComponent, canActivate: [LoginGuard] },
  { path: 'authorize-calendar', component: AuthorizeCalendarComponent },
  { path: 'typo', component: TypoComponent, canActivate: [LoginGuard] },
  { path: '', component: TypoComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
