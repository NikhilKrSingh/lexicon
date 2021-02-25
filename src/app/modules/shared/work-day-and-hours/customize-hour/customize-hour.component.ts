import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { getWorkingHour, IWorkingDay, IWorkingHours } from 'src/app/modules/models/office-data';
import * as errors from 'src/app/modules/shared/error.json';
import { vwCalendarSettings } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-customize-hour',
  templateUrl: './customize-hour.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class CustomizeDayAndHourComponent implements OnInit {
  ColumnMode = ColumnMode;
  workingHoursList: Array<IWorkingDay>;
  calendarSettings: vwCalendarSettings;
  workingHours: Array<IWorkingHours> = [];
  current_date: string;
  error_data = (errors as any).default;
  timezones: any;
  selectedZone: any;

  changeNotes: string;

  constructor(
    private activeModal: NgbActiveModal,
    private toastr: ToastDisplay
  ) {
    let d = new Date();
    this.current_date = d.toISOString().split('T')[0];
  }

  ngOnInit() {
    let d = new Date();
    this.workingHours.push({
      index: -1,
      value: 'Off',
      key: 'Off'
    });

    for (let index = 0; index < 48; index++) {
      let d1 = new Date(d.setHours(0, index * 30, 0, 0));
      this.workingHours.push({
        index: index,
        value: d1.toLocaleTimeString('en-US', {
          hour12: false
        }),
        key: d1.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      });
    }
    if (this.workingHoursList) {
      this.workingHoursList.forEach(day => {
        if (day.open && day.close) {
          if (day.open == day.close) {
            day.open = 'Off';
            day.close = 'Off';
          } else {
            day.open = this.toWorkingHours(day.open);
            day.close = this.toWorkingHours(day.close);
          }
        }
      });
      for(const data of this.workingHoursList) {
        data['openValue'] = this.formatHours(data.open);
        data['closeValue'] = this.formatHours(data.close);
      }
    }
    if(this.calendarSettings.timeZoneId){
      this.selectedZone = this.calendarSettings.timeZoneId;
    }
  }

  /**
   * Converts working hour time to time format (hh:mm:00)
   * @param hour Working hour time with date
   */
  toWorkingHours(hour: string) {
    let d1 = hour.split('+')[0];
    return new Date(d1).toLocaleTimeString('en-US', {
      hour12: false
    });
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    let isValid = false;

    try {
      isValid = this.workingHoursList.every(a => {
        if (a.open == 'Off' && a.close == 'Off') {
          return true;
        } else if (a.open == 'Off' && a.close != 'Off') {
          return false;
        } else if (a.open != 'Off' && a.close == 'Off') {
          return false;
        } else {
          let openIndex = this.workingHours.find(h => h.value == a.open).index;
          let closeIndex = this.workingHours.find(h => h.value == a.close)
            .index;

          return openIndex < closeIndex;
        }
      });
    } catch {
      isValid = false;
    }

    if (isValid) {
      this.assignValues();
      this.activeModal.close({
        workingHours: this.workingHoursList,
        changeNotes: this.changeNotes,
        timezone: this.selectedZone
      });
    } else {
      this.toastr.showError(this.error_data.validation_working_hours);
    }
  }

  assignValues() {
    if (this.workingHoursList) {
      this.workingHoursList.forEach(day => {
        day.open = this.getworkingHour(day.open);
        day.close = this.getworkingHour(day.close);
      });
    }
  }

  hourChange(hr: IWorkingDay) {
    if(hr.open == 'Off') {
      hr.close = 'Off';
    }
  }

  getworkingHour(hour: string) {
    if (hour == 'Off') {
      return this.current_date + 'T00:00:00';
    }

    if (hour.includes('24')) {
      hour = hour.replace('24', '00');
    }

    return this.current_date + 'T' + hour;
  }

  formatHours(hour: string) {
    if (hour == 'Off') {
      return hour;
    }
    return this.current_date + 'T' + hour;
  }

  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k == 8 || k == 9;
  }

  public clickOnInherit(row) {
    let hr = getWorkingHour(row.name);
    let day = this.workingHoursList[row.index];
    day.open = this.calendarSettings[hr.open];
    day.close = this.calendarSettings[hr.close];

    if (day.open == day.close) {
      day.open = 'Off';
      day.close = 'Off';
    } else {
      day.open = this.toWorkingHours(day.open);
      day.close = this.toWorkingHours(day.close);
    }
  }
}
