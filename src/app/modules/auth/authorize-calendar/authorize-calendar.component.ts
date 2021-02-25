import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { AuthService, BillingService, CalendarService, ObjectVisibilityService, TenantService } from 'src/common/swagger-providers/services';
import { vwBillingSettings } from '../../../../common/swagger-providers/models/vw-billing-settings';
import { CommonService } from '../../../service/common.service';
import * as fromRoot from '../../../store';
import * as errorData from '../../shared/error.json';
import { SharedService } from '../../shared/sharedService';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-authorize-calendar',
  templateUrl: './authorize-calendar.component.html',
  styleUrls: ['./authorize-calendar.component.scss']
})
export class AuthorizeCalendarComponent implements OnInit {
  nextUrl: any;
  syncing: boolean;
  shouldLogout: boolean = true;

  constructor(
    private activateRoute: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private toastDisplay: ToastDisplay,
    private calendarService: CalendarService,
    private tenantService: TenantService,
    private appConfigService: AppConfigService,
    private pageTitle: Title,
    private store: Store<fromRoot.AppState>,
    private commonService: CommonService,
    private billingService: BillingService,
    private sharedService: SharedService,
    private objectVisibilityService: ObjectVisibilityService
  ) {
    this.calendarArr = [];
  }

  public viewPassword = false;
  public password = '';
  public errorData: any = (errorData as any).default;
  public calendarArr: any = [];
  public redirectUrl: string;
  public authUrl: string;
  public userDetails = JSON.parse(localStorage.getItem('profile'));
  public platformLoading = false;
  public calendarPlatforms = [
    {
      authorize: false,
      name: 'Connect to iCloud Calendar account',
      icon: '/assets/images/icloud.png',
      email: this.userDetails.email,
      code: 'apple',
      id: 0,
      profileId: 0
    },
    {
      authorize: false,
      name: 'Now connected to Google Calendar account',
      icon: 'assets/images/calendar.png',
      email: this.userDetails.email,
      code: 'google',
      id: 0,
      profileId: 0
    },
    {
      authorize: false,
      name: 'Connect to Microsoft 365 account',
      icon: '/assets/images/office.png',
      email: this.userDetails.email,
      code: 'office365',
      id: 0,
      profileId: 0
    },
    {
      authorize: false,
      name: 'Connect to Microsoft Outlook account',
      icon: 'assets/images/outlook.png',
      email: this.userDetails.email,
      code: 'live_connect',
      id: 0,
      profileId: 0
    },
    {
      authorize: false,
      name: 'Connect to Microsoft Exchange account',
      icon: '/assets/images/exchange.png',
      email: this.userDetails.email,
      code: 'exchange',
      id: 0,
      profileId: 0
    }
  ];

  ngOnInit() {
    this.pageTitle.setTitle('Activate Your Account');
    this.platformLoading = true;
    const code = this.activateRoute.snapshot.queryParams.code;
    this.nextUrl = this.activateRoute.snapshot.queryParams.returnUrl;
    this.tenantService.v1TenantCalendarSettingsGet().subscribe((results: any) => {
      const calendarArr = JSON.parse(results).results.calendarPlatforms;
      const activePlatforms = [];
      calendarArr.forEach(calendar => {
        const configuredCalendar = this.calendarPlatforms.filter(item => item.code === calendar.code);
        if (configuredCalendar.length > 0) {
          const calendarData = configuredCalendar[0];
          calendarData.id = calendar.id;
          calendarData.profileId = calendar.vendorProfileId;
          activePlatforms.push(calendarData);
        }
      });
      this.calendarArr = activePlatforms;
      this.platformLoading = false;
      this.redirectUrl = `${window.location.protocol}//${window.location.host}/authorize-calendar`;
      this.getAuthUrl();
      this.getConfiguredCalendar();
      if (code) {
        this.configureCalendar(code);
      }
    }, () => {
      this.platformLoading = false;
    });
    window.onbeforeunload = () => {
      if (this.shouldLogout) {
        this.commonService.isLogOutRequest.next(true);
      }
    }
  }

  public activate() {
    const authCalendar = this.calendarArr.find(obj => obj.authorize);
    if (!authCalendar) {
      this.toastDisplay.showError(this.errorData.required_calendar);
      return;
    }
    this.setObjectVisibility();
  }

  goToRoute(cal) {
    this.shouldLogout = false;
    window.location.href = this.authUrl + '&provider_name=' + cal.code;
  }

  public configureCalendar(code) {
    this.syncing = true;
    this.calendarService
      .v1CalendarConfigurePost$Json({
        body: {personId: this.userDetails.id, email: this.userDetails.email, code, callBackURL: this.redirectUrl}
      })
      .subscribe(
        res => {
          const response = JSON.parse(res as any).results;
          if (response.url) {
            localStorage.setItem('showMessage', 'true');
            window.location.href = response.url;
          } else {
            this.syncing = false;
            localStorage.setItem('showMessage', 'false');
            this.toastDisplay.showError(this.errorData.server_error);
          }
        },
        err => {
          this.syncing = false;
          this.toastDisplay.showError(this.errorData.server_error);
        }
      );
  }

  public getConfiguredCalendar() {
    this.calendarService
      .v1CalendarPersonIdGet$Response({personId: this.userDetails.id})
      .subscribe(
        res => {
          const response = JSON.parse(res.body as any).results;
          if(localStorage.getItem('showMessage') === 'true') {
            this.toastDisplay.showSuccess(this.errorData.configure_calendar);
            localStorage.removeItem('showMessage');
          }
          this.shouldLogout = true;
          if (response && response.length > 0) {
            let index;
            response.map(obj => {
              index = this.calendarArr.findIndex(
                item => item.code === obj.vendorProfileName
              );
              if (index > -1) {
                this.calendarArr[index].authorize = true;
                this.calendarArr[index].id = obj.id;
                this.calendarArr[index].profileId = obj.vendorProfileId;
              }
            });
          }
        },
        err => {
          console.log(err);
        }
      );
  }

  public getAuthUrl() {
    this.calendarService
      .v1CalendarAuthGet$Response({callbackUrl: this.redirectUrl})
      .subscribe(
        res => {
          this.authUrl = JSON.parse(res.body as any).results;
        },
        err => {
          console.log(err);
        }
      );
  }

  setObjectVisibility() {
    this.objectVisibilityService.v1ObjectVisibilityUserGet({})
      .pipe(map(response => {
          return JSON.parse(response as any).results as any[];
        })
      ).subscribe(permission => {
      const permisionList = permission || [];
      const pList = {};
      if (permisionList && permisionList.length > 0) {
        permisionList.map((obj) => {
          UtilsHelper.permission.map((item) => {
            pList[obj.code + item] = pList.hasOwnProperty(obj.code + item) ? ((pList[obj.code + item]) ? true : obj[item]) : obj[item];
          });
        });
      }
      this.store.dispatch(new fromRoot.GetPermissionSuccessAction(pList));
      this.getTimeFormat();
      if (this.nextUrl) {
        this.router.navigateByUrl(this.nextUrl);
      } else {
        this.router.navigate(['/timekeeping']);
      }
      this.commonService.isLoginRequest.next(true);
    });
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
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
