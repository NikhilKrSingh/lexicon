import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { AuthService } from 'src/common/swagger-providers/services';
import { REGEX_DATA } from '../../../shared/const';
import * as errorData from '../../../shared/error.json';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  @Output() readonly nextStep = new EventEmitter<string>();

  public resetEmail: string;
  public callFlag = true;
  public email: string;
  public isValidEmail = false;
  public errorData: any = (errorData as any).default;
  public displaySection = 'first';
  public emailform: FormGroup;


  constructor(
    private authService: AuthService,
    private toastDisplay: ToastDisplay,
    private builder: FormBuilder,

  ) { }

  ngOnInit() {
    this.emailform = this.builder.group({
      email: ['', [Validators.required, Validators.email, Validators.pattern(REGEX_DATA.Email)]]
    });
  }

  public validateEmail() {
    const regex = REGEX_DATA.Email;
    this.isValidEmail = regex.test(String(this.email).toLowerCase()) ? true : false;
  }

  /**
   * Send reset password link
   */
  sendLink() {
    if (this.callFlag) {
      this.callFlag = false;
      this.authService
        .v1AuthPasswordResetRequestPost$Json$Response({
          isDmsPortal: true,
          body: {
            email: this.email,
            type: 'forgetpassword'
          }
        })
        .pipe(
          finalize(() => {
          })
        )
        .subscribe(
          suc => {
            this.toastDisplay.showSuccess('Password reset link sent.');
            this.callFlag = true;
            this.displaySection = 'second';
          },
          err => {
            this.callFlag = true;
          }
        );
    }
  }

  onEnter() {
    if (this.isValidEmail) {
      this.sendLink();
    }
  }
}
