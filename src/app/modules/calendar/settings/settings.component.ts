import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import * as _ from 'lodash';
import { finalize, map } from 'rxjs/operators';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as errors from 'src/app/modules/shared/error.json';
import { vwResultSet } from 'src/common/models/vwResultSet';
import { vwCalendarSettings, vwEmployee, vwIdCodeName, vwIdName, vwSecurityGroupNotification, vwTenantCalendarSetting } from 'src/common/swagger-providers/models';
import { AuthService, CalendarService, EmployeeService, MiscService, TenantService } from 'src/common/swagger-providers/services';
import { IndexDbService } from '../../../index-db.service';
import { IAuthorize } from '../../models/calendar.model';
import { vwEmailTemplate } from '../../models/email-templates.model';
import { UtilsHelper } from '../../shared/utils.helper';

interface IPassValidArr {
  chrLength: boolean;
  oneCapital: boolean;
  oneNumber: boolean;
  oneSpecial: boolean;
}

@Component({
  selector: 'app-calendar-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CalendarSettingsComponent implements OnInit, IBackButtonGuard {
  public userDetails;
  public calendarSettings: vwCalendarSettings;
  public authUrl: string;
  public calendarArr: Array<IAuthorize> = [];
  public redirectUrl: string;
  public errorData: any = (errors as any).default;
  public existCalendar: boolean = false;
  public timeZones: Array<vwIdName>;
  public timezone: number;
  private error_data = (errors as any).default;
  public eventNotificationUnits: Array<vwIdCodeName>;
  public tenantCalendarSettings: vwTenantCalendarSetting;
  alltabs = [
    'Calendar',
    'Email Notifications'
  ];
  selecttabs1 = this.alltabs[0];
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  public disable: boolean = false;
  public emailDisable: boolean = false;
  public employee: vwEmployee;
  emailTemplateLoading: boolean;
  calendarLoading: boolean;
  public emailTemplateList: vwEmailTemplate[] = [];
  public groupByEmailTemplateList = [];
  public _groupByEmailTemplateList = [];

  loading = true;
  public originalTimeZone: any;
  calendarPlatform: { authorize: boolean; name: string; connected: string; icon: string; email: any; code: string; id: number; profileId: number; }[];
  syncing: boolean;

  constructor(
    private toastr: ToastDisplay,
    private miscService: MiscService,
    private calendarService: CalendarService,
    private tenantService: TenantService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    public indexDbService: IndexDbService,
    private pagetitle: Title,
    private employeeService: EmployeeService,
  ) {
    this.userDetails = JSON.parse(localStorage.getItem('profile'));
    this.calendarSettings = {};

    this.eventNotificationUnits = [
      {
        code: 'Minutes',
        name: 'Minutes'
      },
      {
        code: 'Hours',
        name: 'Hours'
      },
      {
        code: 'Weeks',
        name: 'Weeks'
      },
      {
        code: 'Month',
        name: 'Month'
      }
    ];

    this.calendarPlatform = [
      {
        authorize: false,
        name: 'Connect to iCloud Calendar account',
        connected: 'Now connected to iCloud Calendar account',
        icon: '/assets/images/Calendar/iCloud.png',
        email: this.userDetails.email,
        code: 'apple',
        id: 0,
        profileId: 0
      },
      {
        authorize: false,
        name: 'Connect to Google Calendar account',
        connected: 'Now connected to Google Calendar account',
        icon: '/assets/images/Calendar/g-calendar.svg',
        email: this.userDetails.email,
        code: 'google',
        id: 0,
        profileId: 0
      },
      {
        authorize: false,
        name: 'Connect to Microsoft 365 account',
        connected: 'Now connected to Microsoft 365 account',
        icon: '/assets/images/Calendar/m-365.svg',
        email: this.userDetails.email,
        code: 'office365',
        id: 0,
        profileId: 0
      },
      {
        authorize: false,
        name: 'Connect to Microsoft Outlook account',
        connected: 'Now connected to  Microsoft Outlook account',
        icon: '/assets/images/Calendar/m-outlook.svg',
        email: this.userDetails.email,
        code: 'live_connect',
        id: 0,
        profileId: 0
      },
      {
        authorize: false,
        name: 'Connect to Microsoft Exchange account',
        connected: 'Now connected to Microsoft Exchange account',
        icon: '/assets/images/Calendar/m-exchange.svg',
        email: this.userDetails.email,
        code: 'exchange',
        id: 0,
        profileId: 0
      }
    ];
    this.calendarArr = [];
    router.events.subscribe((val) => {
      if (val instanceof NavigationStart) {
        this.navigateAwayPressed = true;
      }
    });
  }
  private userID: number;

  ngOnInit() {
    this.pagetitle.setTitle("Settings");
    this.redirectUrl = `${window.location.protocol}//${window.location.host}/calendar/settings`;
    this.loadTimeZones();
    this.loadCalendarSettings();
    this.getAuthUrl();
    this.getCalendarSettings();
    this.getEmployeeBasicDetails();
    let code = this.activatedRoute.snapshot.queryParams.code;
    if (code) {
      this.configureCalendar(code);
    }
    this.userID = JSON.parse(localStorage.getItem('profile')).id;
    this.disable = false;
    this.emailDisable = false;
  }

  /**
 * Get Employee Details
 */
  getEmployeeBasicDetails() {
    this.emailTemplateLoading = true;
    this.employeeService
      .v1EmployeeIdGet({
        id: this.userDetails.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        }),
        finalize(() => {
          this.emailTemplateLoading = false;
          this.getEmailTemplateOfEmployeeid();
        })
      )
      .subscribe(emp => {
        this.employee = emp;
        this.emailDisable = this.employee && this.employee.isInheritNotification;
        this.emailTemplateLoading = false;
      }, () => {
        this.emailTemplateLoading = false;
      });
  }
  /**
* Get Employee Email Template
*/
  public getEmailTemplateOfEmployeeid() {
    this.emailTemplateLoading = true;
    this.employeeService.v1EmployeeNotificationSettingsEmployeeIdPost$Response({ employeeId: this.userDetails.id })
      .subscribe(s => {
        let results: any = s.body;
        let actualData: vwResultSet = JSON.parse(results);
        if (actualData !== null && actualData !== undefined) {
          this.emailTemplateList = actualData.results.emailTemplates;
          if (this.emailTemplateList && this.emailTemplateList.length) {
            let data = [];
            let emailTemplates = _.groupBy(
              this.emailTemplateList,
              (a) => a.templateGroupName
            );
            for (let template in emailTemplates) {
              data.push({
                templateGroupName: template,
                templateGroupData: _.sortBy(emailTemplates[template], (a) => (a.description || '').toLowerCase()),
              });
            }
            data = _.sortBy(data, (a) => (a.templateGroupName || '').toLowerCase());
            this.groupByEmailTemplateList = data;
            this._groupByEmailTemplateList = UtilsHelper.clone(this.groupByEmailTemplateList);
            this.emailTemplateLoading = false;
          } else {
            this.emailTemplateLoading = false;
          }
        } else {
          this.emailTemplateLoading = false;
        }
      }, err => {
        this.emailTemplateLoading = false;
      })
  }

  private loadTimeZones() {
    this.loading = true;
    this.miscService
      .v1MiscTimezonesGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.timeZones = res;
          this.timeZones = _.orderBy(this.timeZones,["name"],"asc");
        }
        this.loading = false;
      }, () => {
        this.loading = false;
      });
  }

  private loadCalendarSettings() {
    this.calendarLoading = true;
    this.calendarService
      .v1CalendarSettingsPersonIdGet({
        personId: this.userDetails.id
      })
      .pipe(
        map(UtilsHelper.mapData)
      )
      .subscribe(
        res => {
          this.calendarLoading = false;
          if (res) {
            this.calendarSettings = res;
            this.calendarSettings.personId = this.userDetails.id;
            this.originalTimeZone = this.calendarSettings.timeZoneId;
          }
        },
        () => {
          this.calendarLoading = false;
        }
      );
  }

  private getCalendarSettings() {
    this.calendarLoading = true;
    this.tenantService
      .v1TenantCalendarSettingsGet({})
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
        })
      ).subscribe(res => {
        if (res) {
          this.tenantCalendarSettings = res;
          let selectedCalendar = [];
          if (this.tenantCalendarSettings && this.tenantCalendarSettings.calendarPlatforms) {
            selectedCalendar = this.tenantCalendarSettings.calendarPlatforms.map(obj => obj.code);
          }
          this.calendarArr = this.calendarPlatform.filter(item => selectedCalendar.indexOf(item.code) > -1);
          this.getConfiguredCalendar();
          this.calendarLoading = false;
        }
      }, () => {
        this.calendarLoading = false;
      });
  }

  public saveWorkingHours(calendarSettings: vwCalendarSettings) {
    if (calendarSettings) {
      this.dataEntered = true;
      this.calendarSettings = calendarSettings;
      this.saveChanges(true);
    }
  }

  public selectTab(tab) {
    if (this.selecttabs1 != tab) {
      this.selecttabs1 = tab;
      if (this.selecttabs1 == 'Email Notifications' && this._groupByEmailTemplateList) {
        this.groupByEmailTemplateList = UtilsHelper.clone(this._groupByEmailTemplateList);
      }
    }
  }

  public changeNotificationFlag() {
    if (this.employee && this.employee.isInheritNotification) {
      if (this.groupByEmailTemplateList && this.groupByEmailTemplateList.length > 0) {
        for (let group in this.groupByEmailTemplateList) {
          if (this.groupByEmailTemplateList[group]) {
            for (let template of this.groupByEmailTemplateList[group].templateGroupData) {
              template.isVisible = true;
            }
          }
        }
      }
    } else {
      this.emailDisable = false;
    }
  }

  /**
   * Save employe email notification settings
   */
  public saveEmailNotifications() {
    this.emailDisable = true;
    this.loading = true;
    this.updateEmployeeNotificationFlag();
  }

  public updateEmployeeNotificationFlag() {
    let body = {
      employeeId: this.userDetails.id,
      isInhertiNotification: this.employee.isInheritNotification
    }
    this.employeeService.v1EmployeeNotificationFlagPut$Json({ body: body })
      .pipe(map(res => {
        return JSON.parse(res as any).results as any;
      }))
      .subscribe(res => {
        if (res) {
          this.updateEmailNotificationSetting();
        } else {
          this.toastr.showError(this.error_data.error_occured);
          this.emailDisable = true;
          this.loading = false;
        }
      }, () => {
        this.emailDisable = false;
        this.loading = false;
      });
  }

  public updateEmailNotificationSetting() {
    let allTemplates = [];

    for (let temp in this.groupByEmailTemplateList) {
      allTemplates.push(...this.groupByEmailTemplateList[temp].templateGroupData)
    }

    let emailNotificationBody = {
      personId: this.userDetails.id,
      notifications: allTemplates.map((v) => {
        return {
          emailTemplateCode: v.emailTemplateCode,
          isVisible: v.isVisible
        } as vwSecurityGroupNotification
      })
    };

    this.employeeService.v1EmployeeAddOrUpdateNotificationSettingsPost$Json({ body: emailNotificationBody })
      .pipe(map(res => {
        return JSON.parse(res as any).results as any;
      }),finalize(() => {
        this.loading = false
      }))
      .subscribe(res => {
        if (res) {
          this.toastr.showSuccess(this.error_data.email_notification_success);
          this.emailDisable = false;
        } else {
          this.toastr.showError(this.error_data.error_occured);
          this.emailDisable = false;
        }

        if (this.employee && this.employee.isInheritNotification) {
          this.emailDisable = true;
        }
        this.loading = false;
      }, () => {
        this.emailDisable = false;
        this.loading = false;
      });
  }

  public saveChanges(saveWorkingHours = false) {
    this.disable = true;
    const settings = {
      ...this.calendarSettings
    };

    settings.eventWithTravelQuantity = +settings.eventWithTravelQuantity;
    settings.eventWithoutTravelQuantity = +settings.eventWithoutTravelQuantity;

    if (settings.timeZoneId != this.originalTimeZone) {
      this.calendarService
        .v1CalendarSettingsIgnoretimezonecheckPut$Response({
          personId: this.userDetails.id,
          ignoreTimezoneCheck: false
        })
        .subscribe((data: {}) => {
          const res: any = data;
          if (res && res.body) {
            const parsedRes = JSON.parse(res.body);
          } else {
          }
        });
    }
    this.dataEntered = false;

    this.calendarService
      .v1CalendarSettingsPost$Json({
        body: settings
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        })
      )
      .subscribe(
        res => {
          if (res) {
            this.toastr.showSuccess(
              saveWorkingHours
                ? this.error_data.working_hours_update_success
                : this.error_data.calendar_settings_update_success
            );
            this.loadCalendarSettings();
            this.disable = false;
          } else {
            this.disable = false;
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {
        }
      );
  }

  /**
   *
   *
   * @memberof CalendarSettingsComponent
   */
  public getAuthUrl() {
    this.calendarService
      .v1CalendarAuthGet$Response({ callbackUrl: this.redirectUrl })
      .subscribe(
        res => {
          this.authUrl = JSON.parse(res.body as any).results;
        },
        err => {
          console.log(err);
        }
      );
  }

  /**
   * Configure calendar
   *
   * @memberof CalendarSettingsComponent
   */
  public configureCalendar(code) {
    this.syncing = true;
    this.calendarService
      .v1CalendarConfigurePost$Json({
        body: { personId: this.userDetails.id, email: this.userDetails.email, code: code, callBackURL: this.redirectUrl }
      })
      .subscribe(
        res => {
          let response = JSON.parse(res as any).results;
          if (response.url) {
            localStorage.setItem('showMessage', 'true');
            window.location.href = response.url;
            this.syncing = false;
          } else {
            this.syncing = false;
            localStorage.setItem('showMessage', 'false');
            this.toastr.showError(this.errorData.server_error);
          }
        },
        err => {
          this.syncing = false;
          this.toastr.showError(this.errorData.server_error);
          console.log(err);
        }
      );
  }

  public getConfiguredCalendar() {
    this.calendarLoading = true;
    this.calendarService
      .v1CalendarPersonIdGet$Response({ personId: this.userDetails.id })
      .subscribe(
        res => {
          this.calendarArr.map(obj => {
            obj.authorize = false;
          });
          if(localStorage.getItem('showMessage') === 'true') {
            this.toastr.showSuccess(this.errorData.configure_calendar);
            localStorage.removeItem('showMessage');
          }
          this.calendarLoading = false;
          let response = JSON.parse(res.body as any).results;
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
          let existCalendar = this.calendarArr.find(item => item.authorize);
          this.existCalendar = !!existCalendar;
        },
        err => {
          this.calendarLoading = false;
          console.log(err);
        }
      );
  }

  public revoke(item: IRevokeObject) {
    this.calendarService
      .v1CalendarRevokeIdDelete$Response({
        id: item.id,
        profileId: item.profileId
      })
      .subscribe(
        res => {
          let response = JSON.parse(res.body as any).results;
          if (response && response > 0) {
            this.getConfiguredCalendar();
            this.toastr.showSuccess(this.errorData.calendar_revoke);
            this.dataEntered = true;
          } else {
            this.toastr.showError(this.errorData.server_error);
          }
        },
        err => {
          console.log(err);
        }
      );
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = true;
  }

  onTimeZoneChange(newValue) {
    if (newValue !== this.calendarSettings.timeZoneId) {
      this.dataEntered = true;
    }
  }

  withTravelChange(newValue) {
    this.calendarSettings.eventWithTravelEnable = newValue;
    if (newValue !== this.calendarSettings.eventWithTravelEnable) {
      this.dataEntered = true;
    }
  }

  withoutTravelChange(newValue) {
    this.calendarSettings.eventWithoutTravelEnable = newValue;
    if (newValue !== this.calendarSettings.eventWithoutTravelEnable) {
      this.dataEntered = true;
    }
  }

  selectUnits() {
    this.dataEntered = true;
  }

  selectAuthorize() {
    this.dataEntered = true;
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}

interface IRevokeObject {
  authorize?: boolean
  name?: string
  icon?: string
  email?: string
  code?: string
  id?: number
  profileId?: string
}
