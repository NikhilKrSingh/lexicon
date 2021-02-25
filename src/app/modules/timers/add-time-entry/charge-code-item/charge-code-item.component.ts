import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as moment from 'moment';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { Subscription } from 'rxjs';
import { vwChargeCodeItem } from 'src/app/modules/models/timer.model';
import * as errors from 'src/app/modules/shared/error.json';
import { padNumber, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { CommonValidationService } from 'src/app/service/common-validation.service';
import { vwBillingSettings } from 'src/common/swagger-providers/models';
import { ClockService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-charge-code-item',
  templateUrl: './charge-code-item.component.html',
  styleUrls: ['./charge-code-item.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ChargeCodeItemComponent implements OnInit, OnDestroy {
  private originalChargeCodes: any[];
  @Input() filterChargeCodeListPopUP: Array<any> = [];
  @Input() billingSettings: vwBillingSettings;

  @Input() id: number;
  @Input() client: any;
  @Input() matter: any;
  @Input() loginUser: any;
  code: string;
  loading = false;

  @Input() data: vwChargeCodeItem;
  @Output() readonly delete = new EventEmitter();
  @Output() readonly timeWorkedChange = new EventEmitter();

  errorData = (errors as any).default;

  public chargeCodeErrMsg = '';
  public notesErrMsg = '';
  public billingNarrativeErrMsg = '';
  public dateOfServiceErrMsg = '';
  public timerWorkedErrMsg = '';
  public dateOfServiceGreaterThenTodayErrMsg = '';
  public datePipe = new DatePipe('en-US');
  public baseRate: number = 0;
  showChargeCode = false;

  scollOpts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;

  timeEntryForm: FormGroup;

  disbursementTypeDetail: any;
  valueMustError: boolean;

  hours: number;
  minutes: number;
  total_hours: number;
  rate: any;

  currencyPipe = new CurrencyPipe('en-US');
  billingAmount: number;
  searchCodeText: any;

  public todayDate = Date();

  validateChargeCodeSub: Subscription;
  newChargeCodeListSub: Subscription;

  dateFilter = (d: Date) => {
    return moment().isSameOrAfter(moment(d), 'd');
  };

  constructor(
    private commmonValidationService: CommonValidationService,
    private fb: FormBuilder,
    private clockService: ClockService,
  ) {
    if (this.matter && this.matter.id) {
      this.getUserBaseRate();
    }
    this.validateChargeCodeSub = this.commmonValidationService.validateChargeCode$.subscribe(
      (res) => {
        if (res == this.id) {
          this.validationChargeCode();
        }
      }
    );

    this.newChargeCodeListSub = this.commmonValidationService.newChargeCodeList.subscribe(
      (codeList) => {
        this.assignCodeList(codeList);
      }
    );

    this.timeEntryForm = this.fb.group({
      timeWorked: null,
    });

    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.scollOpts = {
      position: 'right',
      barBackground: '#413a93',
      barOpacity: '1',
      barWidth: '4',
      barBorderRadius: '4',
      barMargin: '2px',
      gridOpacity: '1',
      gridBackground: '#e7edf3',
      gridWidth: '8',
      gridMargin: '0',
      gridBorderRadius: '4',
      alwaysVisible: true,
    };

    this.todayDate = this.datePipe.transform(this.todayDate, 'MM-dd-yyyy');
  }

  ngOnInit() {
    this.originalChargeCodes = [...this.filterChargeCodeListPopUP];
  }

  ngOnDestroy() {
    if (this.validateChargeCodeSub) {
      this.validateChargeCodeSub.unsubscribe();
    }

    if (this.newChargeCodeListSub) {
      this.newChargeCodeListSub.unsubscribe();
    }
  }

  assignCodeList(codes) {
    this.filterChargeCodeListPopUP = [...codes];
    this.originalChargeCodes = [...this.filterChargeCodeListPopUP];
    if (!!this.data.chargeCodeName) {
      let filteredChargeCodeList = [];
      filteredChargeCodeList = this.filterChargeCode(this.data.chargeCodeName);
      if (filteredChargeCodeList.length) {
        this.filterChargeCodeListPopUP = filteredChargeCodeList;
      } else {
        this.disbursementTypeDetail = null;
        this.data.resetChargeCode();
      }
    }
  }

  formatDate = (date: any) => {
    if (date) {
      return this.datePipe.transform(date, 'MM/dd/yyyy');
    } else {
      return ' -';
    }
  };

  validationChargeCode() {
    this.chargeCodeErrMsg = '';
    this.dateOfServiceErrMsg = '';
    this.notesErrMsg = '';
    this.billingNarrativeErrMsg = '';
    this.timerWorkedErrMsg = '';
    this.dateOfServiceGreaterThenTodayErrMsg = '';

    if (!this.data.dateOfService) {
      this.dateOfServiceErrMsg = this.errorData.date_of_service_error;
    }

    if (this.data.isInvalidBillingNarrative(this.client)) {
      this.billingNarrativeErrMsg = this.errorData.billing_narrative_error;
    } else {
      this.billingNarrativeErrMsg = null;
    }

    if (!this.data.chargeCodeId) {
      this.chargeCodeErrMsg = this.errorData.charge_code_error;
    }

    if (!this.data.notes) {
      this.notesErrMsg = this.errorData.note_error;
    }

    if (
      !!this.data.timerWorked &&
      !this.data.timerWorked.hour &&
      !this.data.timerWorked.minutes
    ) {
      this.timerWorkedErrMsg = this.errorData.timer_worked_error;
    }

    if (
      this.data.dateOfService &&
      moment(this.data.dateOfService).isAfter(moment(), 'd')
    ) {
      this.dateOfServiceGreaterThenTodayErrMsg = this.errorData.date_of_service_greater_then_error;
    }
    return;
  }

  public updateFilter(event) {
    this.data.rate = 0;
    let val = event.target.value;
    val = (val || '').trim();
    if (!!val) {
      this.filterChargeCodeListPopUP = this.filterChargeCode(val);
    } else {
      this.showChargeCode = true;
      this.filterChargeCodeListPopUP = [...this.originalChargeCodes];
      this.disbursementTypeDetail = null;
      this.data.resetChargeCode();
    }
  }

  private matchName(item: any, searchValue: string, fieldName): boolean {
    const searchName = item[fieldName]
      ? item[fieldName].toString().toUpperCase()
      : '';
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  async selectChargeCode(selectedChargeCodeItem) {
    this.data.chargeCodeName =
      selectedChargeCodeItem.code + ' - ' + selectedChargeCodeItem.description;
    this.data.chargeCodeId = selectedChargeCodeItem.id;
    this.data.chargeCodeType = selectedChargeCodeItem.type;
    this.disbursementTypeDetail = selectedChargeCodeItem;
    this.data.disbursementTypeDetail = selectedChargeCodeItem;
    this.showChargeCode = false;
    await this.getUserBaseRate();
    if (this.matter && this.matter.isFixedFee) {
      this.data.chargeCodeType == selectedChargeCodeItem.type;
    }

    if (
      this.disbursementTypeDetail &&
      this.disbursementTypeDetail.billingTo.code == 'OVERHEAD'
    ) {
      this.timeEntryForm.get('visibleToClient').patchValue(false);
    }

    if (
      this.disbursementTypeDetail &&
      this.disbursementTypeDetail.billingTo.code == 'OVERHEAD'
    ) {
      this.data.billingNarrative = null;
      this.billingNarrativeErrMsg = null;
    }

    this.chargeCodeErrMsg = null;

    this.calculateBillableAmount();
  }

  calculateBillableAmount() {
    if (this.matter && this.matter.isFixedFee) {
      this.data.rate = 0;
    } else {
      if (this.timeEntryForm && this.timeEntryForm.value.timeWorked && this.matter && this.client && this.data.dateOfService ) {
        if (
          this.disbursementTypeDetail &&
          this.disbursementTypeDetail.billingType
        ) {
          if (this.disbursementTypeDetail.billingType.code === 'HOURLY') {
            this.data.rate = this.baseRate * +this.total_hours;
          } else if (this.disbursementTypeDetail.billingType.code === 'FIXED') {
            this.data.rate = this.baseRate;
          }
        } else {
          this.data.rate = this.baseRate * +this.total_hours;
        }
      }
    }
  }

  clearDropDown() {
    this.showChargeCode = false;
  }

  /**
   * Function Of DropDown Actions
   */
  public actionDropDown(event?, type?: string) {
    if (this.loading) {
      return;
    }

    if (this.filterChargeCodeListPopUP.length) {
      this.selectChargeCode(this.filterChargeCodeListPopUP[0]);
      this.showChargeCode = false;
    }

    if (event) {
      event.focus();
    }
  }

  deleteChargeCode() {
    this.delete.emit(this.id);
  }

  timeworkedChange() {
    this.valueMustError = false;
    let hours = 0;
    let minutes = 0;
    let isError = false;
    this.data.rate = 0;
    this.timeWorkedChange.emit();
    const timeWorked = this.timeEntryForm.controls.timeWorked.value;
    isError = this.checkTime(timeWorked.replace(/\s/g, '').split(''));
    if (isError) {
      this.resetTimeWorked(timeWorked && timeWorked.length > 0);
    } else {
      if (timeWorked.includes(':')) {
        const hoursMinutes = timeWorked.split(/[.:]/);
        hours = hoursMinutes[0] ? parseInt(hoursMinutes[0], 10) : 0;
        minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
      } else if (timeWorked.includes('.') || !isNaN(timeWorked)) {
        const decimalTimeString = timeWorked;
        let decimalTime = parseFloat(decimalTimeString);
        decimalTime = decimalTime * 60 * 60;
        let isNegative = decimalTime < 0 ? -1 : 1;
        hours = Math.floor(Math.abs(decimalTime) / (60 * 60));
        hours = hours * isNegative;
        decimalTime = decimalTime - hours * 60 * 60;
        minutes = Math.floor(Math.abs(decimalTime) / 60);
        minutes = minutes * isNegative;
        decimalTime = decimalTime - minutes * 60;
      } else if (timeWorked.includes('h')) {
        const hoursMinutes = timeWorked.split(/[.h]/);
        hours = parseInt(hoursMinutes[0], 10);
        minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
      } else if (timeWorked.includes('m')) {
        const hoursMinutes = timeWorked.split(/[.m]/);
        hours = 0;
        minutes = hoursMinutes[0] ? parseInt(hoursMinutes[0], 10) : 0;
      } else if (timeWorked.includes('h') && timeWorked.includes('m')) {
        const hoursMinutes = timeWorked.split(/[.h]/);
        hours = parseInt(hoursMinutes[0], 10);
        const min = timeWorked.split(/[.m]/);
        minutes = min[0] ? parseInt(min[0], 10) : 0;
        this.setTime(hours, minutes);
      } else {
        this.resetTimeWorked(timeWorked && timeWorked.length > 0);
        isError = true;
      }
      if (!isError) {
        let parsed  = UtilsHelper.parseMinutes(minutes, hours);
        hours = parsed.hours;
        minutes = parsed.minutes;
        this.setTime(hours, minutes);
      }
    }
  }
  private checkTime(val: string[]) {
    let isError = false;
    val.forEach((timeObj: string) => {
      timeObj = timeObj
        .replace(':', '')
        .replace('.', '')
        .replace('h', '')
        .replace('m', '');
      if ((timeObj >= '0' && timeObj <= '9') || timeObj === '') {
        isError = false;
      } else {
        isError = true;
      }
    });
    return isError;
  }

  private setTime(hours: number, minutes: number) {
    this.valueMustError = false;
    if (hours === 0 && minutes === 0) {
      const finalText = this.getTimeString(hours, minutes);
      this.timeEntryForm.patchValue({
        timeWorked: null,
      });
    } else if (isNaN(hours) || isNaN(minutes)) {
      this.data.timerWorked = {
        hour: 0,
        minutes: 0,
      };

      this.resetTimeWorked();
    } else {
      if (this.billingSettings && this.billingSettings.timeRoundingInterval) {
        if (this.billingSettings && this.billingSettings.timeRoundingInterval) {
          if (minutes >= 0) {
            minutes =
              Math.ceil(minutes / this.billingSettings.timeRoundingInterval) *
              this.billingSettings.timeRoundingInterval;
          } else {
            minutes =
              Math.ceil(Math.abs(minutes) / this.billingSettings.timeRoundingInterval) *
              this.billingSettings.timeRoundingInterval;
            minutes = minutes * -1;
          }
        }
      }

      if (minutes == 60) {
        hours = hours >= 0 ? hours + 1 : hours - 1;
        minutes = 0;
      }

      this.hours = hours;
      this.minutes = minutes;

      const finalText = this.getTimeString(hours, minutes);
      this.timeEntryForm.patchValue({
        timeWorked: finalText,
      });

      if (this.hours < 0 || this.minutes < 0) {
        this.total_hours = (Math.abs(this.hours) * 60 + Math.abs(this.minutes)) / 60;
        this.total_hours = this.total_hours * -1;
      } else {
        this.total_hours = (Math.abs(this.hours) * 60 + Math.abs(this.minutes)) / 60;
      }
    }
    this.calculateBillableAmount();
    this.timeWorkedChange.emit();
  }

  getTimeString(hour: string | number, min: string | number) {
    const timeDisplay = localStorage.getItem('timeformat');
    if (min >= 60) {
      hour = +hour + 1;
      min = +min - 60;
    }

    this.data.timerWorked = {
      hour: +hour,
      minutes: +min,
    };

    let isNegative = hour == 0 && +min < 0;

    if (timeDisplay === 'jira') {
      if (isNegative) {
        return '-0h' + ' ' + Math.abs(+min) + 'm';
      } else {
        return hour + 'h' + ' ' + Math.abs(+min) + 'm';
      }
    } else if (timeDisplay === 'standard') {
      if (isNegative) {
        return '-0' + ':' + padNumber(Math.abs(+min));
      } else {
        return hour + ':' + padNumber(Math.abs(+min));
      }
    } else if (timeDisplay === 'decimal') {
      const hoursMinutes = (hour + ':' + min).split(/[.:]/);
      const hours = parseInt(hoursMinutes[0], 10);
      const minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
      return (hours + minutes / 60).toFixed(2);
    } else {
      if (isNegative) {
        return '-0h' + ' ' + Math.abs(+min) + 'm';
      } else {
        return hour + 'h' + ' ' + Math.abs(+min) + 'm';
      }
    }
  }

  private resetTimeWorked(showError = true) {
    this.data.rate = 0;
    if (showError) {
      this.valueMustError = true;
    }
  }

  onChargeCodeFocus() {
    this.getUserBaseRate();
    if (!!this.data.chargeCodeName) {
      this.filterChargeCodeListPopUP = this.filterChargeCode(
        this.data.chargeCodeName
      );
    } else {
      this.disbursementTypeDetail = null;
      this.filterChargeCodeListPopUP = this.originalChargeCodes;
      this.data.resetChargeCode();
    }
    this.showChargeCode = true;
  }

  filterChargeCode(val) {
    val = (val || '').trim();
    const temp = this.originalChargeCodes.filter(
      (item) =>
        this.matchName(item, val, 'code') ||
        this.matchName(item, val, 'description')
    );
    return temp;
  }

  get isBillingNarratibeDisabled() {
    return (
      (this.client && this.client.role == 'Potential Client') ||
      (this.data &&
        this.data.disbursementTypeDetail &&
        (this.data.disbursementTypeDetail.billingTo.code == 'OVERHEAD' ||
          this.data.disbursementTypeDetail.type == 'FIXED_FEE' ||
          this.data.disbursementTypeDetail.type == 'FIXED_FEE_ADD_ON'))
    );
  }

  /**
   * Function to copy Billing Narative to Notes
   */
  public copytoNote() {
    if (this.data.billingNarrative) {
      this.billingNarrativeErrMsg = null;
    }

    if (this.data.notes.trim() == '') {
      this.data.notes = this.data.billingNarrative;
    }

    if (this.data.notes) {
      this.notesErrMsg = null;
    }
  }

  public noteBlur() {
    if (this.data.notes) {
      this.notesErrMsg = null;
    }
  }

  public timeWorkedBlur() {
    this.calculateBillableAmount();
    if (this.timeEntryForm.value.timeWorked) {
      this.timerWorkedErrMsg = null;
    }
  }

  public onDateBlur() {
    if (this.data.dateOfService) {
      this.dateOfServiceErrMsg = null;

      if (
        this.data.dateOfService &&
        moment(this.data.dateOfService).isSameOrBefore(moment(), 'd')
      ) {
        this.dateOfServiceGreaterThenTodayErrMsg = null;
      }
    }

    if (!this.data.dateOfService || !this.timeEntryForm.get('timeWorked').value || !this.matter || !this.client) {
      this.data.rate = 0;
    } else {
      this.data.rate = Math.abs(this.baseRate * this.total_hours);
    }
  }

  async getUserBaseRate() {
    const data = {
      matterId: this.matter.id,
      loggedInPersonId: this.loginUser.id
    };
    this.loading = true;
    const res = await this.clockService.v1ClockMatterBaserateGet(data)
      .toPromise();
    if (res != null) {
      this.baseRate = +JSON.parse(res as any).results;
      this.loading = false;
    } else {
      this.loading = false;
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
  checkNumber(event){
    return UtilsHelper.checkNumber(event);
  }
}
