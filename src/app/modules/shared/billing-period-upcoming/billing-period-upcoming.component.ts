import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import * as moment from 'moment';
import { debounceTime, finalize, map } from 'rxjs/operators';
import { SelectService } from 'src/app/service/select.service';
import { vwBillingSettings, vwIdCodeName } from 'src/common/swagger-providers/models';
import { BillingService } from 'src/common/swagger-providers/services';
import { IBillPeriod } from '../../models';
import { IBillingSettings } from '../../models/billing-setting.model';
import { UtilsHelper } from '../utils.helper';

@Component({
  selector: 'app-billing-period-upcoming',
  templateUrl: './billing-period-upcoming.component.html',
  styleUrls: ['./billing-period-upcoming.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BillingPeriodUpcomingComponent implements OnInit, OnChanges {
  @Input() billingSettings: vwBillingSettings;
  @Input() pageType: string = 'createoffice';
  @Input() officeId: number = 0;
  @Input() isFormSubmitted = false;
  @Output() readonly sendValue = new EventEmitter<any>();
  @Output() readonly updateValue = new EventEmitter<string>();

  public billFrequencyList: Array<vwIdCodeName> = [];
  public billingSettingsForm: FormGroup;
  public repeatsOn: Array<{ name: string; selected: boolean }> = [
    { name: 'Sunday', selected: false },
    { name: 'Monday', selected: false },
    { name: 'Tuesday', selected: false },
    { name: 'Wednesday', selected: false },
    { name: 'Thursday', selected: false },
    { name: 'Friday', selected: false },
    { name: 'Saturday', selected: false }
  ];
  public recursOnList: Array<{ id?: number; name?: string }> = [];
  public billWhenHolidayList: Array<{ id?: number; name?: string }> = UtilsHelper.getGrneratePreBilllist();
  public recurringName: Array<string> = [
    'First',
    'Second',
    'Third',
    'Fourth',
    'Last'
  ];
  public selectedDuration: vwIdCodeName = { code: '', name: '' };
  public selectedRecursDay: { id?: number; name?: string };
  public selectedDay: string = '';
  public selectedDayNumber: number;
  public startDate: string;
  public endDate: string;
  public minDate;
  public localDate: string;
  userDetils: any = {};
  public loading: boolean = false;
  public effectiveDateDisplay: string;
  public displayNextEffectiveDate: string;
  public billingSettingsTenent: vwBillingSettings;

  constructor(
    private billingService: BillingService,
    private builder: FormBuilder,
    private selectService: SelectService
  ) {
    this.userDetils = UtilsHelper.getLoginUser();
    this.startDate = moment().format('MM/DD/YYYY');
    this.billingSettingsForm = this.builder.group({
      billFrequencyQuantity: 0,
      billFrequencyDuration: '',
      isInherited: true,
      isWorkComplete: false,
      billingFrequencyRecursDay: null,
      effectiveDate: null,
      repeatType: 1,
      billWhenHoliday: 1
    });
  }

  ngOnInit() {
    this.getBillingSettings();
    this.getFrequencyListItem();
    this.billingSettingsForm.controls['billFrequencyQuantity'].valueChanges
      .pipe(debounceTime(100))
      .subscribe((text: string) => {
        this.updateValue.emit('update');
        this.getNextBillDate(this.selectedDuration, +text, this.startDate);
      });
    this.billingSettingsForm.controls.repeatType
      .valueChanges.pipe(debounceTime(100)).subscribe((text: number) => {
        if (
          this.pageType === 'setfirmlevel' || this.pageType === 'editoffice' ||
          this.pageType === 'createoffice' || this.pageType === 'editclient' ||
          this.pageType === 'editmatter'
        ) {
          if (!this.billingSettingsForm.value.isInherited) {
            this.billingSettingsForm.patchValue({billingFrequencyRecursDay: null});
            this.billingSettingsForm.get("billingFrequencyRecursDay").markAsUntouched();
          }
        }
      this.setRepeatOn(text);
      this.emitValue();
    });
  }

  ngOnChanges(changes) {
    if (changes.billingSettings && changes.billingSettings.currentValue) {
      this.billingSettings = changes.billingSettings.currentValue;
      this.billingSettingsForm.patchValue({
        billFrequencyDuration: this.billingSettings.effectiveBillFrequencyDuration ? this.billingSettings.effectiveBillFrequencyDuration.id : null,
        billFrequencyQuantity: this.billingSettings.effectiveBillFrequencyQuantity ? this.billingSettings.effectiveBillFrequencyQuantity : null,
        isInherited: this.pageType === 'setfirmlevel' ? false : this.billingSettings.effectiveIsInherited == null ? false : this.billingSettings.effectiveIsInherited,
        isWorkComplete: this.billingSettings.isWorkComplete && !this.billingSettings.effectiveBillFrequencyRecursOn ? this.billingSettings.isWorkComplete: false,
        billingFrequencyRecursDay: this.billingSettings.effectiveBillFrequencyRecursOn ? this.billingSettings.effectiveBillFrequencyRecursOn : null,
        effectiveDate: null,
        repeatType: (this.billingSettings.effectiveRepeatType) ? (this.billingSettings.effectiveRepeatType) : 1,
        billWhenHoliday: (this.billingSettings.effectiveBillWhenHoliday) ? (this.billingSettings.effectiveBillWhenHoliday) : 1
      });
      this.selectDay(
        this.billingSettings.effectiveBillFrequencyDay === 0 ||
          this.billingSettings.effectiveBillFrequencyDay
          ? this.billingSettings.effectiveBillFrequencyDay
          : moment().day(),
        false
      );
      this.selectedDuration = this.billingSettings.effectiveBillFrequencyDuration;
      setTimeout(() => {
        this.getNextBillDate(
          this.selectedDuration,
          +this.billingSettings.effectiveBillFrequencyQuantity,
          this.startDate,
          false
        );
      }, 100);
    }
  }

  public setRepeatOn(text) {
    this.recursOnList = [];
    if (text === 2) {
      var name = '';
      for (let i = 1; i <= 31; i++) {
        this.recursOnList.push({id: i, name: i + ((i==1) ? 'st': (i==2) ? 'nd': (i==3) ? 'rd' : 'th') + ' of the month'});
      }
    } else {
      this.recurringName.map((item, index1) => {
        this.recursOnList.push({id: index1 + 1, name: item + ' ' + this.repeatsOn[this.selectedDayNumber].name + ' of the month'});
      });
    }
  }

  private getFrequencyListItem() {
    this.loading = true;
    this.billingService
      .v1BillingBillfrequencyListGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        res => {
          if (res && res.length > 0) {
            this.billFrequencyList = res.filter(item => item.code !== 'DAYS');
          }
        },
        err => {
          this.loading = false;
        }
      );
  }

  private getNextBillDate(
    billFrequencyDuration: vwIdCodeName,
    billFrequencyQuantity: number,
    lastBillDate: string,
    defaultDate: boolean = true
  ) {
    let days = this.repeatsOn.findIndex(item => item.selected);
    if (days > -1 && billFrequencyDuration) {
      if (billFrequencyDuration.code === 'WEEKS') {
        this.endDate = UtilsHelper.addWeeksForBillPeriod(
          lastBillDate,
          days,
          billFrequencyQuantity
        );
      } else if (billFrequencyDuration.code === 'MONTHS') {
        this.endDate = UtilsHelper.addMonthForBillPeriod(
          lastBillDate,
          billFrequencyQuantity,
          days,
          +this.billingSettingsForm.value.billingFrequencyRecursDay
        );
      }
      let neDt;
      if (this.billingSettingsForm.value.effectiveIsInherited) {
        neDt = this.getEffectiveDate(
          billFrequencyDuration,
          this.billingSettings.effectiveBillFrequencyStartingDate,
          days
        );
      } else {
        neDt = defaultDate
          ? this.getEffectiveDate(billFrequencyDuration, lastBillDate, days)
          : this.billingSettings.effectiveBillFrequencyStartingDate;
      }
      this.displayNextEffectiveDate = this.getEffectiveDateUpcoming(
        billFrequencyDuration,
        neDt,
        days
      );
      this.sendValue.emit({
        billFrequencyDay: days,
        billFrequencyRecursOn: +this.billingSettingsForm.value.billingFrequencyRecursDay,
        billFrequencyStartingDate: this.startDate,
        billFrequencyNextDate: neDt,
        billFrequencyQuantity: billFrequencyQuantity,
        billFrequencyDuration: billFrequencyDuration.id,
        billFrequencyDurationType: billFrequencyDuration.code,
        isInherited: this.billingSettingsForm.value.effectiveIsInherited,
        isWorkComplete: this.billingSettingsForm.value.isWorkComplete,
        effectiveDate: neDt,
        effectiveBillFrequencyNextDate: this.getEffectiveDateUpcoming(billFrequencyDuration, neDt, days),
        billingSettings: this.billingSettings,
        repeatType: +this.billingSettingsForm.value.repeatType,
        billWhenHoliday: +this.billingSettingsForm.value.billWhenHoliday
      });
      this.billingSettingsForm.controls['effectiveDate'].setValue(
        new Date(neDt)
      );
    }
  }

  private getEffectiveDate(billFrequencyDuration, lastBillDate, days) {
    if (billFrequencyDuration.code === 'WEEKS') {
      return UtilsHelper.addWeeksForBillPeriod(lastBillDate, days, 1);
    } else if (billFrequencyDuration.code === 'MONTHS') {
      if (+this.billingSettingsForm.value.repeatType === 2) {
        return UtilsHelper.getNextmonthDate(new Date(), +this.billingSettingsForm.value.billFrequencyQuantity, days, +this.billingSettingsForm.value.billingFrequencyRecursDay);
      } else {
        return UtilsHelper.addMonthForBillPeriod(lastBillDate, 1, days, +this.billingSettingsForm.value.billingFrequencyRecursDay);
      }
    }
  }

  private getEffectiveDateUpcoming(billFrequencyDuration, lastBillDate, days) {
    if (billFrequencyDuration.code === 'WEEKS') {
      return UtilsHelper.addWeeksForBillPeriod(lastBillDate,  days,  +this.billingSettingsForm.value.billFrequencyQuantity);
    } else if (billFrequencyDuration.code === 'MONTHS') {
      if (+this.billingSettingsForm.value.repeatType === 2) {
        if (+this.billingSettingsForm.value.billingFrequencyRecursDay == +moment(lastBillDate).add(+this.billingSettingsForm.value.billFrequencyQuantity, 'M').format('DD')) {
          return moment(lastBillDate).add(+this.billingSettingsForm.value.billFrequencyQuantity, 'M').format('MM/DD/YYYY');
        } else {
          return moment(lastBillDate).add(+this.billingSettingsForm.value.billFrequencyQuantity, 'M').endOf('month').format('MM/DD/YYYY');
        }
      } else {
        return UtilsHelper.addMonthForBillPeriod(lastBillDate, +this.billingSettingsForm.value.billFrequencyQuantity,
          days, +this.billingSettingsForm.value.billingFrequencyRecursDay
        );
      }
    }
  }

  public defaultInharitChange(event) {
    this.selectService.newSelection('clicked!');
    if (this.billingSettingsForm.value.isInherited) {
      this.selectDay(
        this.billingSettingsTenent.billFrequencyDay === 0 ||
          this.billingSettingsTenent.billFrequencyDay
          ? this.billingSettingsTenent.billFrequencyDay
          : moment().day()
      );
      this.billingSettingsForm.patchValue({
        billFrequencyDuration: this.billingSettingsTenent.billFrequencyDuration.id,
        billFrequencyQuantity: this.billingSettingsTenent.billFrequencyQuantity,
        billingFrequencyRecursDay: this.billingSettingsTenent.billFrequencyRecursOn,
        billWhenHoliday: this.billingSettingsTenent.billWhenHoliday,
        repeatType: this.billingSettingsTenent.repeatType,
        isWorkComplete: false,
      });
      this.selectedDuration = this.billingSettingsTenent.billFrequencyDuration;
      this.getNextBillDate(
        this.selectedDuration,
        +this.billingSettingsTenent.billFrequencyQuantity,
        this.startDate
      );
    } else {
      this.selectDay(
        this.billingSettings.effectiveBillFrequencyDay === 0 ||
          this.billingSettings.effectiveBillFrequencyDay
          ? this.billingSettings.effectiveBillFrequencyDay
          : moment().day()
      );
      this.billingSettingsForm.patchValue({
        billFrequencyDuration: this.billingSettings.effectiveBillFrequencyDuration.id,
        billFrequencyQuantity: this.billingSettings.effectiveBillFrequencyQuantity,
        billingFrequencyRecursDay: this.billingSettings.effectiveBillFrequencyRecursOn,
        billWhenHoliday: 1,
        repeatType: this.billingSettings.effectiveRepeatType,
        isWorkComplete: false
      });
      this.selectedDuration = this.billingSettings.effectiveBillFrequencyDuration;
      this.getNextBillDate(
        this.selectedDuration,
        +this.billingSettings.effectiveBillFrequencyQuantity,
        this.startDate
      );
    }
  }

  public onSelectRecursDay(event) {
    this.updateValue.emit('update');
    this.selectedRecursDay = event;
    this.getNextBillDate(
      this.selectedDuration,
      +this.billingSettingsForm.value.billFrequencyQuantity,
      this.startDate
    );
    this.selectService.newSelection('clicked!');
  }

  public onSelectDur(event) {
    this.selectService.newSelection('clicked!');
    this.updateValue.emit('update');
    this.selectedDuration = event;
    if (this.selectedDuration && this.selectedDuration.code === 'MONTHS') {
      this.billingSettingsForm.patchValue({
        repeatType: 1,
        billingFrequencyRecursDay: null
      });
    } else {
      this.billingSettingsForm.patchValue({billingFrequencyRecursDay: null});
      this.billingSettingsForm.get("billingFrequencyRecursDay").markAsUntouched();
    }
    this.getNextBillDate(
      this.selectedDuration,
      +this.billingSettingsForm.value.billFrequencyQuantity,
      this.startDate
    );
  }

  public selectDay(index: number, first: boolean = true) {
    this.selectService.newSelection('clicked!');
    if (first) {
      this.updateValue.emit('update');
    }
    this.repeatsOn.map(item => (item.selected = false));
    this.repeatsOn[index].selected = true;
    this.selectedDay = this.repeatsOn[index].name;
    this.selectedDayNumber = index;
    this.setRepeatOn(this.billingSettingsForm.value.repeatType);
    this.selectedRecursDay = this.recursOnList.find(item =>
      item.id == +this.billingSettingsForm.value.billingFrequencyRecursDay
    );
    this.getNextBillDate(
      this.selectedDuration,
      +this.billingSettingsForm.value.billFrequencyQuantity,
      this.startDate
    );
  }

  public emitValue() {
    this.sendValue.emit({
      billFrequencyDay: this.selectedDayNumber,
      billFrequencyRecursOn: +this.billingSettingsForm.value.billingFrequencyRecursDay,
      billFrequencyStartingDate: this.startDate,
      billFrequencyNextDate: this.billingSettingsForm.value.effectiveDate,
      billFrequencyQuantity: +this.billingSettingsForm.value.billFrequencyQuantity,
      billFrequencyDuration: +this.selectedDuration.id,
      billFrequencyDurationType: this.selectedDuration.code,
      isInherited: this.billingSettingsForm.value.isInherited,
      isWorkComplete: this.billingSettingsForm.value.isWorkComplete,
      effectiveDate: this.billingSettingsForm.value.effectiveDate,
      effectiveBillFrequencyNextDate: this.displayNextEffectiveDate,
      billingSettings: this.billingSettings,
      repeatType: +this.billingSettingsForm.value.repeatType,
      billWhenHoliday: +this.billingSettingsForm.value.billWhenHoliday
    });
  }

  public selectDate() {
    this.updateValue.emit('update');
    let newEffectiveDate = this.getEffectiveDateUpcoming(
      this.selectedDuration,
      this.billingSettingsForm.value.effectiveDate,
      this.repeatsOn.findIndex(item => item.selected)
    );
    if (newEffectiveDate === moment(this.effectiveDateDisplay).format('MM/DD/YYYY')) {
      this.displayNextEffectiveDate = this.getEffectiveDateUpcoming(
        this.selectedDuration,
        moment(this.billingSettingsForm.value.effectiveDate).add(1, 'days').format('MM/DD/YYYY'),
        this.repeatsOn.findIndex(item => item.selected)
      );
    } else {
      this.displayNextEffectiveDate = newEffectiveDate;
    }
    this.emitValue();
    this.selectService.newSelection('clicked!');
  }

  public checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k == 8 || k == 9;
  }

  public myFilter = (d: Date): boolean => {
    const day = d.getDay();
    if (this.selectedDuration.code === 'WEEKS') {
      return day === this.selectedDayNumber;
    } else if (
      this.selectedDuration.code === 'MONTHS' &&
      this.billingSettingsForm.value.billingFrequencyRecursDay
    ) {
      let weekDayNumbe = +this.billingSettingsForm.value.billingFrequencyRecursDay;
      if (+this.billingSettingsForm.value.repeatType === 2) {
        let totalDays = moment(d).daysInMonth();
        if (totalDays < weekDayNumbe) {
          weekDayNumbe = totalDays;
        }
        return +moment(d).format('DD') === weekDayNumbe;
      } else {
        if (+this.billingSettingsForm.value.billingFrequencyRecursDay === 5) {
          if (weekDayNumbe === 5 && UtilsHelper.getAmountOfWeekDaysInMonth(moment(d).startOf('month'), this.selectedDayNumber) !== 5) {
            weekDayNumbe = UtilsHelper.getAmountOfWeekDaysInMonth(moment(d).startOf('month'), this.selectedDayNumber);
          }
        }
        return day === this.selectedDayNumber && this.weekAndDay(d) === weekDayNumbe;
      }
    } else {
      return false;
    }
  };

  public weekAndDay(date) {
    let day = date.getDate();
    day = day % 7 == 0 ? day - 1 : day;
    let prefixes = ['1', '2', '3', '4', '5'];
    return +prefixes[0 | (day / 7)];
  }

  public displayName(item) {
    let name = item ? item.name : '';
    return this.billingSettingsForm.value.billFrequencyQuantity === 1
      ? name.slice(0, -1)
      : name;
  }

  private getBillingSettings() {
    let observal = this.billingService.v1BillingSettingsTenantTenantIdGet({
      tenantId: this.userDetils.tenantId
    });
    if ((this.pageType === 'editclient' || this.pageType === 'matter' || this.pageType === 'client' || this.pageType === 'editmatter') && this.officeId) {
      observal = this.billingService.v1BillingSettingsOfficeOfficeIdGet({
        officeId: this.officeId
      })
    }
    observal.pipe(
      map(res => {
        return JSON.parse(res as any).results[0] as IBillingSettings;
      }),
      finalize(() => {
      })
    )
      .subscribe(billingSettings => {
        if (billingSettings) {
          this.billingSettingsTenent = billingSettings;
        } else {
          this.billingSettingsTenent = {};
        }
      }, () => {
        this.loading = false;
      });
  }

  setInheritedFlag() {
    this.emitValue();
  }
}
