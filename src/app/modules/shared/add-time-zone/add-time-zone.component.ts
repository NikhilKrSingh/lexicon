import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as errors from 'src/app/modules/shared/error.json';
import { vwCalendarSettings, vwIdName } from 'src/common/swagger-providers/models';
import { CalendarService, MiscService } from 'src/common/swagger-providers/services';
import { UtilsHelper } from '../utils.helper';

@Component({
  selector: 'app-add-time-zone',
  templateUrl: './add-time-zone.component.html',
  styleUrls: ['./add-time-zone.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddTimeZoneComponent implements OnInit {
  public timeZones: Array<vwIdName>;
  public timezone: number;
  public loading: boolean = true;
  public calendarSettings: vwCalendarSettings;
  public userDetails;
  public error_data = (errors as any).default;
  public noSelectedTimeZone: boolean = true;
  public formSubmitted: boolean = false;
  public saveLoading: boolean = false;

  constructor(
    private miscService: MiscService,
    private calendarService: CalendarService,
    private toastr: ToastDisplay,
    private activeModal: NgbActiveModal
  ) {
    this.userDetails = JSON.parse(localStorage.getItem('profile'));
    this.calendarSettings = {};
  }

  ngOnInit() {
    this.loadTimeZones();
    this.loadCalendarSettings();
  }

  private loadCalendarSettings() {
    this.loading = true;
    this.calendarService
      .v1CalendarSettingsPersonIdGet({
        personId: this.userDetails.id
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res) {
            this.calendarSettings = res;
            this.calendarSettings.personId = this.userDetails.id;
          }
          this.loading = false;
        },
        () => {
          this.loading = false;
        }
      );
  }

  private loadTimeZones() {
    this.loading = true;
    this.miscService
      .v1MiscSystemtimezonesGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res) {
            this.timeZones = res;
            this.loading = false;
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  public save() {
    this.formSubmitted = true;
    const settings = {
      ...this.calendarSettings
    };
    if (this.calendarSettings.timeZoneId) {
      this.saveLoading = true;
      this.noSelectedTimeZone = false;
    } else {
      this.noSelectedTimeZone = true;
      return;
    }
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
            this.saveLoading = false;
            this.toastr.showSuccess(this.error_data.time_zone_update_success);
            localStorage.removeItem('from-login');
            this.activeModal.close();
          } else {
            this.saveLoading = false;
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {
          this.saveLoading = false;
        }
      );
  }
}
