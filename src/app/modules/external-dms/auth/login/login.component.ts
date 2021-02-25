import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IndexDbService } from 'src/app/index-db.service';
import * as Constant from 'src/app/modules/shared/const';
import { jwtValidation } from 'src/common/CommonService/jwtValidation.service';
import { vwBillingSettings } from 'src/common/swagger-providers/models';
import { AuthService, BillingService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../shared/error.json';
import { SharedService } from '../../../shared/sharedService';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  errorData: any = (errorData as any).default;
  viewPassword = false;
  callFlag = true;
  returnUrl = '';
  invalidCredential = false;
  loginForm: FormGroup;
  displayMessage = false;
  invalidPortal = false;
  errorMsgFlag = false;
  logout_msg: string;
  erroMsg: string;
  logoutMsg = '';

  constructor(
    private authService: AuthService,
    private builder: FormBuilder,
    private router: Router,
    private activateRoute: ActivatedRoute,
    private toastDisplay: ToastDisplay,
    private sharedService: SharedService,
    private billingService: BillingService,
    public JWTservice: jwtValidation,
    private appConfigService: AppConfigService,
    public indexDbService: IndexDbService
  ) { }

  ngOnInit() {
    console.log('login Quarto UI ');
    this.logout_msg = this.errorData.logout_success;
    this.checkPath();
    this.initForm();
    this.returnUrl = this.activateRoute.snapshot.queryParams.returnUrl || null;
    const jwt = this.activateRoute.snapshot.queryParams.tknlgn;

    if (!jwt) {
      console.log('jwt not found ');
      window.location.href = this.appConfigService.appConfig.Common_Login;
    }
    else {
      console.log('jwt found ');
      this.JWTservice.getAll(jwt).subscribe((res) => {
        console.log('in get all ');
        if (res && res.status !== 500 && res.status !== 400) {
          console.log('response of 200 get all ');
          const obj = res['results'];
          this.loginForm.get('userName').setValue(obj.email);
          this.loginForm.get('password').setValue(obj.connectionString);
          const logindata = {
            userName: obj.email,
            isRememberMe: false,
            connectionString: obj.connectionString,
            reportingConnectionString: obj.reportingConnectionString
          };
          console.log('calling exter authentication portal ');
          this.authService.v1AuthExternalAuthenticatePortalPost$Json({ body: logindata }).subscribe(s => {
            console.log('response authentication portal ');
            this.callFlag = true;
            const res = JSON.parse(s as any);
            if (res.status !== 500 && res.status !== 400) {
              console.log('response authentication portal ');
              localStorage.setItem('isDMSUser', 'TrUe');
              localStorage.setItem('token', res.token);
              localStorage.setItem('profile', JSON.stringify(res.results));
              localStorage.setItem('isSharedLink', 'true');
              localStorage.removeItem('contact_Id');
              this.getTimeFormat();
              this.router.navigate(['/dmsportal/dashboard']);
            }

          }, err => {
            this.callFlag = true;
            if (
              err.error === Constant.AuthConstant.Invalid_email ||
              err.error === Constant.AuthConstant.Invalid_password
            ) {
              this.invalidCredential = true;
            } else if (err.error === Constant.AuthConstant.Invalid_Portal) {
              this.invalidPortal = true;
            } else if (err.error === Constant.AuthConstant.account_disabled) {
              this.toastDisplay.showError(Constant.AuthConstant.account_disabled);
              setTimeout(() => {
                window.location.href = this.appConfigService.appConfig.Common_Logout;
              }, 4000);
            } else {
              this.invalidCredential = false;
              window.location.href = this.appConfigService.appConfig.Common_Logout;
            }
          });
        }
      },
        error => {
          console.log('error in authentication portal in get all');
          window.location.href = this.appConfigService.appConfig.Common_Logout;
        });
    }

    this.sharedService.logout$.subscribe((res) => {
      if (res) {
        this.displayMessage = true;
        setTimeout(() => { this.displayMessage = false; this.sharedService.setLogout(false); }, 5000);
      }
    });
  }

  checkPath() {
    const pathArray = window.location.pathname.split('/');
    if (pathArray.includes('d')) {
      const index = pathArray.indexOf('d');
      const fileId = pathArray[index + 1];
      const fileTenantId = pathArray[index + 2];
      localStorage.setItem('fileId', fileId);
      localStorage.setItem('fileTenantId', fileTenantId);
    }
  }

  initForm() {
    this.loginForm = this.builder.group({
      userName: ['', [Validators.required, Validators.maxLength(1000)]],
      password: ['', [Validators.required, Validators.maxLength(1000)]],
      isRememberMe: [false]
    });
  }

  doLogin() {
    if (this.callFlag) {
      this.callFlag = false;
      this.authService.v1AuthExternalAuthenticatePortalPost$Json({ body: this.loginForm.value }).subscribe(s => {
        this.callFlag = true;
        const res = JSON.parse(s as any);
        if (res.status !== 500 && res.status !== 400) {
          localStorage.setItem('isDMSUser', 'True');
          localStorage.setItem('token', res.token);
          localStorage.setItem('profile', JSON.stringify(res.results));
          localStorage.setItem('isSharedLink', 'true');
          localStorage.removeItem('contact_Id');
          this.getTimeFormat();
          this.toastDisplay.showSuccess(this.errorData.login_success);
          this.router.navigate(['/dmsportal/dashboard']);
        }
      }, err => {
        this.callFlag = true;
        if (
          err.error === Constant.AuthConstant.Invalid_email ||
          err.error === Constant.AuthConstant.Invalid_password ||
          err.error === Constant.AuthConstant.Invalid_email_password
        ) {
          this.invalidCredential = true;
        } else {
          this.invalidCredential = false;
        }
      });
    }
  }

  private getTimeFormat() {
    const profile = localStorage.getItem('profile');
    if (profile) {
      const person = JSON.parse(profile);
      this.billingService
        .v1BillingSettingsTenantTenantIdGet({
          tenantId: +person.tenantId
        })
        .pipe(
          map(res => {
            return JSON.parse(res as any).results[0] as vwBillingSettings;
          }),
          finalize(() => {
          })
        )
        .subscribe(
          billingSettings => {
            if (billingSettings) {
              if (billingSettings.timeDisplayFormat) {
                const format = billingSettings.timeDisplayFormat;
                const type = format === 1 ? 'jira' : format === 2 ? 'standard' : format === 3 ? 'decimal' : 'jira';
                localStorage.setItem('timeformat', type);
              }
            }
          },
          () => {
          }
        );
    }
  }
  public doLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('profile');
    localStorage.removeItem('logo');

    this.indexDbService.clearDatabase();
    this.sharedService.setLogout(true);
  }
  login() {
    window.location.href = this.appConfigService.appConfig.Common_Logout;
  }
}
