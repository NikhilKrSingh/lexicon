import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthRoutingModule } from './auth-routing.module';
import { DmsActivationComponent } from './dms-activation/dms-activation.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { LoginComponent } from './login/login.component';
import { PasswordStrengthComponent } from './password-strength/password-strength.component';
import { ResetpassComponent } from './resetpass/resetpass.component';

@NgModule({
  declarations: [
    LoginComponent,
    ForgotPasswordComponent,
    PasswordStrengthComponent,
    ResetpassComponent,
    DmsActivationComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AuthModule { }
