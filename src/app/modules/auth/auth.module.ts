import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from "../shared/shared.module";
import { ActiveAccountComponent } from './active-account/active-account.component';
import { AuthRoutingModule } from './auth-routing.module';
import { AuthorizeCalendarComponent } from './authorize-calendar/authorize-calendar.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { LoginComponent } from './login/login.component';
import { PasswordStrengthComponent } from './password-strength/password-strength.component';
import { ResetpassComponent } from './resetpass/resetpass.component';
import { TypoComponent } from './typo/typo.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    LoginComponent,
    TypoComponent,
    ResetpassComponent,
    ActiveAccountComponent,
    ForgotPasswordComponent,
    PasswordStrengthComponent,
    AuthorizeCalendarComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    MatProgressSpinnerModule
  ]
})
export class AuthModule { }
