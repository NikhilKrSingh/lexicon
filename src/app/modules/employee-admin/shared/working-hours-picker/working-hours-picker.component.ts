import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-working-hours-picker',
  templateUrl: './working-hours-picker.component.html'
})
export class WorkingHoursPickerComponent implements OnInit {
  @Input() openHours: string;
  @Output() readonly openHoursChange = new EventEmitter<string>();
  @Input() closeHours: string;
  @Output() readonly closeHoursChange = new EventEmitter<string>();

  public open: string;
  public close: string;
  public hoursList: Array<{ key: string; value: string }>;
  public current_date: string;

  constructor() {
    this.hoursList = [];
    this.createHoursList();
    let d = new Date();
    this.current_date = d.toISOString().split('T')[0];
  }

  ngOnInit() {
    if (this.openHours && this.closeHours) {
      if (this.openHours == this.closeHours) {
        this.open = 'Off';
        this.close = 'Off';
      } else {
        this.open = this.toWorkingHours(this.openHours);
        this.close = this.toWorkingHours(this.closeHours);
      }
    }
  }

  /**
   * Create Dropdown List for Picking Hours
   * @memberof WorkingHoursPickerComponent
   */
  createHoursList() {
    this.hoursList = [];
    let d = new Date();
    this.hoursList.push({
      key: 'Off',
      value: 'Off'
    });

    for (let index = 0; index < 48; index++) {
      let d1 = new Date(d.setHours(0, index * 30, 0, 0));
      this.hoursList.push({
        key: d1.toLocaleTimeString('en-US', {
          hour12: false
        }),
        value: d1.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      });
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

  /**
   * Callback event on Changing Open Hours
   * @param $event open hours
   */
  oepnChange($event: string) {
    if ($event == 'Off') {
      this.close = 'Off';
      let d = this.getworkingHour('00:00:00');
      this.openHoursChange.emit(d);
      this.closeHoursChange.emit(d);
    } else {
      let d = this.getworkingHour(this.open);
      this.openHoursChange.emit(d);
    }
  }

  /**
   * Callback Event on Changing Close Hours
   * @param $event Close Hours
   */
  closeChange($event: string) {
    if ($event == 'Off') {
      this.open = 'Off';
      let d = this.getworkingHour('00:00:00');
      this.closeHoursChange.emit(d);
      this.openHoursChange.emit(d);
    } else {
      let d = this.getworkingHour(this.close);
      this.closeHoursChange.emit(d);
    }
  }

  /**
   * Get working hours
   *
   * @private
   * @param {string} hour
   * @returns
   * @memberof WorkingHoursPickerComponent
   */
  private getworkingHour(hour: string) {
    return this.current_date + 'T' + hour + 'Z';
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
