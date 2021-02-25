import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map } from 'rxjs/operators';
import { AddTimeZoneComponent } from 'src/app/modules/shared/add-time-zone/add-time-zone.component';
import { vwCalendarSettings, vwTimezoneName } from 'src/common/swagger-providers/models';
import { CalendarService, MiscService } from 'src/common/swagger-providers/services';
import { UtilsHelper } from '../../modules/shared/utils.helper';

@Component({
  selector: 'app-timezone-message',
  templateUrl: './timezone-message.component.html',
  styleUrls: ['./timezone-message.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TimezoneMessageComponent implements OnInit {
  public displayMismatchedTZAlert: boolean = false;
  public timeZones;
  public currentTZ;
  public settingsTZ;
  public calendarSettings: vwCalendarSettings;
  loggedinUser: any;
  public ignoreTimeZone: boolean = false;
  public ignoredCheck: boolean = false;
  public currentTZOutsideUS: boolean = false;
  public timezoneName: vwTimezoneName
  public machineTZ: any;

  constructor(
    private calendarService: CalendarService,
    private miscService: MiscService,
    private router: Router,
    private modalService: NgbModal
  ) {
    const profile = localStorage.getItem('profile');
    if (profile) {
      this.loggedinUser = JSON.parse(profile);
    }
  }

  ngOnInit() {
    this.checkTimeZone();
    this.calendarService
      .v1CalendarSettingsPersonIdGet({
        personId: this.loggedinUser.id
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.calendarSettings = res;
          this.ignoreTimeZone = this.calendarSettings.ignoreTimezoneCheck;
          if (this.ignoreTimeZone === false || this.ignoreTimeZone === null) {
            let timeZoneId = Intl.DateTimeFormat().resolvedOptions().timeZone
            this.timezoneName = { timezoneId: timeZoneId }
            this.miscService.v1MiscGetTimezoneNamePost$Json$Response({
              body: this.timezoneName
            }).subscribe((data: {}) => {
              const res: any = data;
              if (res && res.body) {
                const parsedRes = JSON.parse(res.body);
                this.machineTZ = parsedRes.results
                this.doTimeZonesMatch();
              }
            })
          }
        }
      });
  }

  checkTimeZone() {
    if (localStorage.getItem('from-login')) {
      this.calendarSettings = {};
      this.calendarService
        .v1CalendarSettingsPersonIdGet({
          personId: this.loggedinUser.id
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(
          res => {
            if (res) {
              this.calendarSettings = res;
              UtilsHelper.setObject('calendarView', this.calendarSettings.calendarView);
              UtilsHelper.setObject('userTimezone', this.calendarSettings.timeZoneId);
              if (this.calendarSettings.timeZoneId === null) {
                this.openAddTimeZone();
              }
            }
          },
          () => { }
        );
    }
  }

  openAddTimeZone() {
    this.modalService.open(AddTimeZoneComponent, {
      centered: true,
      windowClass: 'modal-smd',
      backdrop: 'static'
    });
  }

  doTimeZonesMatch() {
    if (this.calendarSettings.timeZoneId) {
      this.miscService
        .v1MiscTimezonesGet()
        .pipe(map(UtilsHelper.mapData))
        .subscribe(
          res => {
            if (res) {
              this.timeZones = res;
              this.timeZones.forEach(tz => {
                if (tz.id == this.calendarSettings.timeZoneId) {
                  this.settingsTZ = tz;
                }
                if (tz.id == this.machineTZ) {
                  this.currentTZ = tz;
                  this.currentTZOutsideUS = false;
                }
              });
              if (this.currentTZ && this.currentTZ === this.settingsTZ) {
                this.displayMismatchedTZAlert = false;
              } else if (this.currentTZ && this.currentTZ != this.settingsTZ) {
                this.displayMismatchedTZAlert = true;
              } else {
                this.displayMismatchedTZAlert = true;
                this.currentTZOutsideUS = true;
              }
            }
          },
          () => {}
        );
    }
  }

  openCalSettings() {
    if (this.loggedinUser) {
      this.router.navigate(['/calendar/settings']);
      this.displayMismatchedTZAlert = !this.displayMismatchedTZAlert;
    }
  }

  isSelected(event) {
    if (event.target.checked) {
      this.ignoredCheck = true;
    } else {
      this.ignoredCheck = false;
    }
  }

  onClose() {
    if (this.ignoredCheck === true) {
      this.calendarService
        .v1CalendarSettingsIgnoretimezonecheckPut$Response({
          personId: this.loggedinUser.id,
          ignoreTimezoneCheck: true
        })
        .subscribe((data: {}) => {
          const res: any = data;
          if (res && res.body) {
            const parsedRes = JSON.parse(res.body);
          } else {

          }
        });
    }

  }
}
