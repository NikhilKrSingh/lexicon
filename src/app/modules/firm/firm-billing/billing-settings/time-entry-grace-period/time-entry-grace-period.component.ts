import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewEncapsulation } from '@angular/core';
import * as moment from 'moment';
import { vwBillingSettings } from 'src/common/swagger-providers/models';
import { padNumber, UtilsHelper } from '../../../../shared/utils.helper';

@Component({
  selector: 'app-time-entry-grace-period',
  templateUrl: './time-entry-grace-period.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class TimeEntryGracePeriodComponent implements OnInit, OnChanges {
  @Input() billingSettings: vwBillingSettings;
  @Output() readonly enableDisabledTimeEntryButton = new EventEmitter<boolean>();
  @Input() notIsEdit:boolean
  isAM = false;
  hour:any = '11';
  minutes:any = '59';
  todayDate = moment(new Date()).format('YYYY-MM-DD');
  public isEdit:boolean = false;
  constructor() {
    console.log(new Date());
   }

  ngOnInit() {
    if(this.billingSettings && this.billingSettings.timeEntryGracePeriodAt) {
      let time:any = UtilsHelper.getworkingHoursFormat(this.billingSettings.timeEntryGracePeriodAt);
      time = time.split(":");
      if(time && time[0]) {
        let d1:any = this.billingSettings.timeEntryGracePeriodAt.split('+')[0];
        this.todayDate = moment(d1.split('T')[0]).format('YYYY-MM-DD');
        this.isAM = true;
        if(time[0] > 12) {
          this.isAM = false;
          time[0] -= 12;
        }
        this.hour = time[0];
        this.minutes = time[1]
      }
    } else {
      this.setEntryGraceVal();
    }
    this.enableDisabledTimeEntryButton.emit(true);
    console.log('----billingSettings----', this.billingSettings);
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('notIsEdit')) {
      let editChanges:boolean = changes.notIsEdit.currentValue;
      if(editChanges) {
        this.isEdit = false;
      }
    }
  }

  checkNumber(event){
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    let allow = (k >= 48 && k <= 57) || k == 8 || k == 9;
    return allow;
  }
  setAmPm(value) {
    this.isAM = value;
    this.setEntryGraceVal();
  }

  setEntryGraceVal(): void {
    const hourVal = parseInt(this.hour, 10) + (!this.isAM ? 12 : 0);
    this.billingSettings.timeEntryGracePeriodAt = this.todayDate + 'T' + padNumber(hourVal) + ':' + padNumber(this.minutes) + ':00';
  }

  onTimeChange(type) {
    if (parseInt(this[type], 10) < 10) {
      this[type] = '0' + this[type];
    }
    this.setEntryGraceVal();
  }

  /***** function to hide edit button and enable  */
  edit():void {
    this.isEdit = true;
    this.enableDisabledTimeEntryButton.emit(false);
  }

  /**** function to increse/decrease hour */
  changeHour(type:string): void {
    switch (type) {
      case 'up':
        if(+this.hour < 12) {
          this.hour = +this.hour + 1;
          this.onTimeChange('hour')
        }
        break;
      case 'down':
        if(+this.hour > 0) {
          this.hour = +this.hour -1;
          this.onTimeChange('hour')
        }
        break;
    }
  }

  /**** function to increse/decrease hour */
  changeMinute(type:string): void {
    switch (type) {
      case 'up':
        if(+this.minutes < 59) {
          this.minutes = +this.minutes + 1;
          this.onTimeChange('minutes')
        }
        break;
      case 'down':
        if(+this.minutes > 0) {
          this.minutes = +this.minutes -1;
          this.onTimeChange('minutes')
        }
        break;
    }
  }
}
