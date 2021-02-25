import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import SimpleCrypto from 'simple-crypto-js';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { AuthService, CalendarService, TenantService } from 'src/common/swagger-providers/services';
import { environment } from 'src/environments/environment';
import { IAuthorize } from '../../models/calendar.model';
import * as errorData from '../../shared/error.json';

@Component({
  selector: 'app-active-account',
  templateUrl: './active-account.component.html',
  styleUrls: ['./active-account.component.scss']
})
export class ActiveAccountComponent implements OnInit {

  constructor(
    private activateRoute: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private toastDisplay: ToastDisplay,
    private calendarService: CalendarService,
    private appConfigService: AppConfigService,
    private pagetitle: Title,
    private tenantService: TenantService
  ) {
    this.calendarArr = [];
  }
  public viewPassword = false;
  public password = '';
  private passwordResetId: string;
  private userID: string;
  private connString:string;
  private callFlag = true;
  public passwordFlag = false;
  public step = 'second';
  public errorData: any = (errorData as any).default;
  public calendarArr: Array<IAuthorize> = [];
  public calendarPlatforms: Array<IAuthorize> = [
    {
      authorize: false,
      name: 'Connect to iCloud Calendar account',
      icon: '/assets/images/icloud.png',
      email: '',
      code: 'apple',
      id: 0,
      profileId: 0
    },
    {
      authorize: false,
      name: 'Now connected to Google Calendar account',
      icon: 'assets/images/calendar.png',
      email: '',
      code: 'google',
      id: 0,
      profileId: 0
    },
    {
      authorize: false,
      name: 'Connect to Microsoft 365 account',
      icon: '/assets/images/office.png',
      email: '',
      code: 'office365',
      id: 0,
      profileId: 0
    },
    {
      authorize: false,
      name: 'Connect to Microsoft Outlook account',
      icon: 'assets/images/outlook.png',
      email: '',
      code: 'live_connect',
      id: 0,
      profileId: 0
    },
    {
      authorize: false,
      name: 'Connect to Microsoft Exchange account',
      icon: '/assets/images/exchange.png',
      email: '',
      code: 'exchange',
      id: 0,
      profileId: 0
    }
  ];
  public redirectUrl: string;
  public authUrl: string;
  public existCalendar = false;
  public calendarLoading = false;
  public userDetails;
  private simpleCrypto = new SimpleCrypto(environment.secretKey);

  ngOnInit() {
    this.pagetitle.setTitle("Activate Your Account");
    this.redirectUrl = `${window.location.protocol}//${window.location.host}/activate-account`;
    this.userID = this.activateRoute.snapshot.queryParams.uid;
    this.connString = this.activateRoute.snapshot.queryParams.xyz;
    if (this.userID) {
      localStorage.setItem('userID', this.userID);
    } else {
      this.userID = localStorage.getItem('userID');
    }
    if (this.connString) {
      localStorage.setItem('connString', this.connString);
    } else {
      this.connString = localStorage.getItem('connString');
    }
    const code = this.activateRoute.snapshot.queryParams.code;
    if (!this.userID) {
      window.location.href = this.appConfigService.appConfig.Common_Login;
    }
    this.calendarLoading = true;
    this.tenantService.v1TenantCalendarPlatformsExternalGet({connString: this.connString, uid: this.userID}).subscribe((results: any) => {
      const calendarArr = JSON.parse(results).results && JSON.parse(results).results.length ? JSON.parse(results).results : [];
      const activePlatforms = [];
      calendarArr.forEach((calendar: any) => {
        const configuredCalendar = this.calendarPlatforms.filter(item => item.code === calendar.code);
        if (configuredCalendar.length > 0) {
          const calendarData: any = configuredCalendar[0];
          calendarData.id = calendar.id;
          calendarData.profileId = calendar.vendorProfileId;
          activePlatforms.push(calendarData);
        }
        this.getConfiguredCalendar();
      });
      this.calendarLoading = false;
      this.calendarArr = activePlatforms;
      this.getAuthUrl();
      if (!this.calendarArr.length) {
        window.location.href = this.appConfigService.appConfig.Common_Login;
      }
      if (code) {
        this.step = 'second';
        this.configureCalendar(code);
      }
    }, () => {
      this.calendarLoading = false;
    });
  }

  setPasswordFlag(value) {
    this.passwordFlag = value;
  }

  public next() {
    localStorage.setItem('encp', this.simpleCrypto.encrypt(this.password));
    this.step = 'second';
  }

  public activate() {
    const authCalendar = this.calendarArr.find(obj => obj.authorize);
    if (!authCalendar) {
      this.toastDisplay.showError(this.errorData.required_calendar);
      return;
    }
    this.toastDisplay.showSuccess(this.errorData.login_Invitation);
    window.location.href = this.appConfigService.appConfig.Common_Login;
  }

  public getAuthUrl() {
    this.calendarLoading = true;
    this.calendarService
      .v1CalendarAuthExternalGet$Response({ callbackUrl: this.redirectUrl })
      .subscribe(
        res => {
          this.calendarLoading = false;
          this.authUrl = JSON.parse(res.body as any).results;
        },
        err => {
          this.calendarLoading = false;
          console.log(err);
        }
      );
  }

  public configureCalendar(code) {
    this.calendarLoading = true;
    this.calendarService
      .v1CalendarConfigureExternalPost$Json({
        body: { uid: this.userID, code, callBackURL: this.redirectUrl, connString: this.connString }
      })
      .subscribe(
        res => {
          const response = JSON.parse(res as any).results;
          if (response.url) {
            localStorage.setItem('showMessage', 'true');
            window.location.href = response.url;
          } else if (response === -1) {
            this.calendarLoading = false;
            localStorage.setItem('showMessage', 'false');
            this.toastDisplay.showError(this.errorData.not_found_calendar);
          } else {
            this.calendarLoading = false;
            localStorage.setItem('showMessage', 'false');
            this.toastDisplay.showError(this.errorData.server_error);
          }
        },
        err => {
          this.calendarLoading = false;
          console.log(err);
        }
      );
  }

  public getConfiguredCalendar() {
    this.calendarService
      .v1CalendarCalendarExternalPersonIdGet$Response({ personId: -1, uid: this.userID ,connString:this.connString})
      .subscribe(
        res => {
          const response = JSON.parse(res.body as any).results;
          if (response && response.length > 0) {
            if(localStorage.getItem('showMessage') === 'true') {
              this.toastDisplay.showSuccess(this.errorData.configure_calendar);
              localStorage.removeItem('showMessage');
            }
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
            const existCalendar = this.calendarArr.find(item => item.authorize);
            this.existCalendar = !!existCalendar;
          }
        },
        err => {
          console.log(err);
        }
      );
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
