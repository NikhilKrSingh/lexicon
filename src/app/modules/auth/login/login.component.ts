import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { finalize, map } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import { CommonService } from 'src/app/service/common.service';
import { jwtValidation } from 'src/common/CommonService/jwtValidation.service';
import { vwBillingSettings } from 'src/common/swagger-providers/models';
import { AuthService, BillingService, CalendarService, ObjectVisibilityService, TenantService } from 'src/common/swagger-providers/services';
import { IndexDbService } from '../../../index-db.service';
import * as fromRoot from '../../../store';
import * as errorData from '../../shared/error.json';
import { SharedService } from '../../shared/sharedService';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  tuckerAllenAccountSubscription: Subscription;
  isTuckerAllenUser: boolean = false;
  constructor(
    public indexDbService: IndexDbService,
    private authService: AuthService,
    private builder: FormBuilder,
    private router: Router,
    private activateRoute: ActivatedRoute,
    private toastDisplay: ToastDisplay,
    private objectVisibilityService: ObjectVisibilityService,
    private store: Store<fromRoot.AppState>,
    private sharedService: SharedService,
    private billingService: BillingService,
    public JWTservice: jwtValidation,
    private appConfigService: AppConfigService,
    private pagetitle: Title,
    private commomService: CommonService,
    private tenantService: TenantService,
    private calendarService: CalendarService
  ) {
    this.indexDbService.clearDatabase(); // clear data from indexdb

    if (UtilsHelper.getToken()) {
      this.router.navigate(['/dashboard']);
    }
  }

  public errorData: any = (errorData as any).default;
  public logout_msg: string;
  public viewPassword = false;
  public callFlag = true;
  private returnUrl: string;
  public invalidCredential = false;
  invalidPortal = false;
  public userName = new FormControl('', [
    Validators.required,
    Validators.maxLength(1000)
  ]);

  public password = new FormControl('', [
    Validators.required,
    Validators.maxLength(1000)
  ]);

  public isRememberMe = new FormControl(false, []);

  public loginForm: FormGroup = this.builder.group({
    userName: this.userName,
    password: this.password,
    isRememberMe: this.isRememberMe
  });
  public displayMessage = false;
  public permissionList: any = {};

  ngOnInit() {
    this.pagetitle.setTitle('Log In');
    document
      .getElementById('appFavicon')
      .setAttribute('href', 'assets/favicon/default-favicon.png');
    this.logout_msg = this.errorData.logout_success;
    this.returnUrl = this.activateRoute.snapshot.queryParams.returnUrl;
    const jwt = this.activateRoute.snapshot.queryParams.tknlgn;
    localStorage.setItem('jwtToken', jwt);
    if (!jwt) {
      window.location.href = this.appConfigService.appConfig.Common_Login;
    } else {
      this.JWTservice.getAll(jwt).subscribe(
        res => {
          if (res && res.status !== 500 && res.status !== 400) {
            const obj = res['results'];
            this.loginForm.get('userName').setValue(obj.email);
            this.loginForm.get('password').setValue(obj.connectionString);
            const logindata = {
              userName: obj.email,
              isRememberMe: false,
              connectionString: obj.connectionString,
              reportingConnectionString: obj.reportingConnectionString
            };
            this.authService
              .v1AuthExternalAuthPost$Json({ body: logindata })
              .subscribe(
                async s => {
                  this.callFlag = true;
                  const res = JSON.parse(s as any);
                  if (res.status !== 500 && res.status !== 400) {
                    localStorage.removeItem('contact_Id');
                    localStorage.setItem('token', res.token);
                    localStorage.setItem(
                      'profile',
                      JSON.stringify(res.results)
                    );
                    localStorage.setItem('tenantId', res.results.tenantId);
                    await this.sharedService.getTuckerAllenAccount();
                    this.sharedService.getProfilePicture();
                    if (
                      res.results &&
                      res.results.userName.indexOf('yopmail.com') > -1
                    ) {
                      this.setObjectVisibility();
                    } else {
                      this.calendarService
                        .v1CalendarPersonIdGet({ personId: res.results.id })
                        .subscribe((data: any) => {
                          const user =
                            JSON.parse(data).results &&
                            JSON.parse(data).results[0]
                              ? JSON.parse(data).results[0]
                              : null;
                          if (!user || !user.vendorProfileId) {
                            this.tenantService
                              .v1TenantCalendarSettingsGet()
                              .subscribe((calendarPlatforms: any) => {
                                const platforms = JSON.parse(calendarPlatforms)
                                  .results.calendarPlatforms;
                                if (platforms && platforms.length) {
                                  this.router.navigate(
                                    ['/authorize-calendar'],
                                    {
                                      queryParams: { returnUrl: this.returnUrl }
                                    }
                                  );
                                } else {
                                  this.setObjectVisibility();
                                }
                              });
                          } else {
                            this.setObjectVisibility();
                          }
                        });
                    }
                  }
                },
                err => {
                  this.callFlag = true;
                  this.invalidPortal = true;
                }
              );
          }
        },
        error => {
          window.location.href = this.appConfigService.appConfig.Common_Login;
        }
      );
    }
    this.sharedService.logout$.subscribe(res => {
      if (res) {
        this.displayMessage = true;
        setTimeout(() => {
          this.displayMessage = false;
          this.sharedService.setLogout(false);
        }, 5000);
      }
    });
    this.tuckerAllenAccountSubscription = this.sharedService.isTuckerAllenAccount$.subscribe(res => {
      this.isTuckerAllenUser = res ? true : false;
    });
  }

  public doLogin() {
    if (this.callFlag) {
      this.callFlag = false;
      this.authService
        .v1AuthPost$Json({ body: this.loginForm.value })
        .subscribe(
          s => {
            this.callFlag = true;
            const res = JSON.parse(s as any);
            if (res.status !== 500 && res.status !== 400) {
              localStorage.removeItem('contact_Id');
              localStorage.setItem('token', res.token);
              localStorage.setItem('profile', JSON.stringify(res.results));
              this.sharedService.getTuckerAllenAccount();
              this.sharedService.getProfilePicture();
              this.objectVisibilityService
                .v1ObjectVisibilityUserGet({})
                .pipe(
                  map(response => {
                    return JSON.parse(response as any).results as any[];
                  })
                )
                .subscribe(permission => {
                  const permisionList = permission || [];
                  const pList = {};
                  if (permisionList && permisionList.length > 0) {
                    permisionList.map(obj => {
                      UtilsHelper.permission.map(item => {
                        pList[obj.code + item] = pList.hasOwnProperty(
                          obj.code + item
                        )
                          ? pList[obj.code + item]
                            ? true
                            : obj[item]
                          : obj[item];
                      });
                    });
                  }
                  this.store.dispatch(
                    new fromRoot.GetPermissionSuccessAction(pList)
                  );
                  this.toastDisplay.showSuccess(this.errorData.login_success);
                  this.getTimeFormat();
                  if (this.returnUrl) {
                    this.router.navigateByUrl(this.returnUrl);
                  } else {
                    this.router.navigate(['/dashboard']);
                  }
                });
            }
          },
          err => {
            this.callFlag = true;
            this.invalidCredential =
              err.error === Constant.AuthConstant.Invalid_email ||
              err.error === Constant.AuthConstant.Invalid_password ||
              err.error === Constant.AuthConstant.Invalid_email_password;
          }
        );
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
          finalize(() => {})
        )
        .subscribe(
          billingSettings => {
            if (billingSettings) {
              if (billingSettings.timeDisplayFormat) {
                const format = billingSettings.timeDisplayFormat;
                const type =
                  format === 1
                    ? 'jira'
                    : format === 2
                    ? 'standard'
                    : format === 3
                    ? 'decimal'
                    : 'jira';
                localStorage.setItem('timeformat', type);
              }
            }
          },
          () => {}
        );
    }
  }

  login() {
    window.location.href = this.appConfigService.appConfig.Common_Logout;
  }

  setObjectVisibility() {
    this.objectVisibilityService
      .v1ObjectVisibilityUserGet({})
      .pipe(
        map(response => {
          return JSON.parse(response as any).results as any[];
        })
      )
      .subscribe(permission => {
        const permisionList = permission || [];
        const pList: any = {};
        if (permisionList && permisionList.length > 0) {
          permisionList.map(obj => {
            UtilsHelper.permission.map(item => {
              pList[obj.code + item] = pList.hasOwnProperty(obj.code + item)
                ? pList[obj.code + item]
                  ? true
                  : obj[item]
                : obj[item];
            });
          });
        }
        this.store.dispatch(new fromRoot.GetPermissionSuccessAction(pList));
        this.getTimeFormat();
        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else if (this.isTuckerAllenUser) {
          this.router.navigate(['/dashboard']);
          localStorage.setItem('from-login', 'true');
        } else if ((pList.TIMEKEEPING_OTHERSisAdmin || pList.TIMEKEEPING_OTHERSisViewOnly || (pList.TIMEKEEPING_SELFisNoVisibility && (pList.TIMEKEEPING_OTHERSisAdmin || pList.TIMEKEEPING_OTHERSisViewOnly)))) {
          this.router.navigate(['/timekeeping/all-timesheets']);
          localStorage.setItem('from-login', 'true');
        } else if (pList.TIMEKEEPING_OTHERSisNoVisibility) {
          this.router.navigate(['/timekeeping/my-timesheet']);
          localStorage.setItem('from-login', 'true');
        } else {
          this.router.navigate(['/calendar']);
          localStorage.setItem('from-login', 'true');
        }
        this.commomService.isLoginRequest.next(true);
      });
  }
}
