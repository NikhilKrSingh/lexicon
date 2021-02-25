import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { AuthService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-document-portal-login',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DocumentPortalSettingsComponent implements OnInit, OnDestroy {

  alltabs1: string[] = ['Profile', 'Password'];
  selecttabs1 = this.alltabs1[0];
  userDetails: any = {};
  changePasswordForm: FormGroup;
  private unsubscribeAll: Subject<any>;

  viewPassword = false;
  viewNewPassword = false;

  constructor(
    private fb: FormBuilder,
    private toaster: ToastDisplay,
    private router: Router,
    private authService: AuthService
  ) {
    this.unsubscribeAll = new Subject();
  }

  ngOnInit() {
    this.userDetails = JSON.parse(localStorage.getItem('profile'));
    if (this.userDetails) {
      this.userDetails.name = this.userDetails.lastName ? this.userDetails.firstName + ' ' + this.userDetails.lastName : this.userDetails.firstName;
      this.initForm();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  initForm() {
    this.changePasswordForm = this.fb.group({
      oldPassword: [null, Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(7),
        this.regexValidator(new RegExp('^(?=.*?[0-9])(?=.*?[A-Z])(?=.*?[a-z])'), { alphaNumeric: '' }),
        this.regexValidator(new RegExp('^(?=.*?[!@#£$%^&*()])'), { specialCharacter: '' })
      ]],
      confirmPassword: ['', [
        Validators.required,
        this.confirmPasswordValidator
      ]]
    });

    this.changePasswordForm.get('newPassword').valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(() => {
        this.changePasswordForm.get('confirmPassword').updateValueAndValidity();
      });
  }

  get f() {
    return this.changePasswordForm.controls;
  }

  confirmPasswordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {

    if (!control.parent || !control) {
      return null;
    }

    const newPassword = control.parent.get('newPassword');
    const confirmPassword = control.parent.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    if (confirmPassword.value === '') {
      return null;
    }

    if (newPassword.value === confirmPassword.value) {
      return null;
    }

    return { passwordsNotMatching: true };
  }

  regexValidator(regex: RegExp, error: ValidationErrors): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {

      if (!control.value) {
        return null;
      }
      const valid = regex.test(control.value);

      return valid ? null : error;
    };
  }

  changePassword() {
    if (this.changePasswordForm.invalid) {
      return;
    }

    const obj = {
      newPassword: this.changePasswordForm.get('newPassword').value,
      oldPassword: this.changePasswordForm.get('oldPassword').value,
      userID: this.userDetails.id
    };
    this.authService.v1AuthResetPortalUserPasswordPost$Json({ body: obj}).subscribe((res: any) => {
      if (res) {
        localStorage.setItem('token', res);
        this.toaster.showSuccess('Password changed.');
        this.router.navigate(['/dmsportal/dashboard']);
      }
    }, err => {
    });
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
