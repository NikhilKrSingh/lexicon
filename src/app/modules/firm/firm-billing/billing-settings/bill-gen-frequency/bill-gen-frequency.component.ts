import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewEncapsulation } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { IBillPeriod } from 'src/app/modules/models';
import { IBillingSettings, IDisplaySettings } from 'src/app/modules/models/billing-setting.model';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';

@Component({
  selector: 'app-bill-gen-frequency',
  templateUrl: './bill-gen-frequency.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class BillGenFrequencyComponent implements OnInit, OnChanges {
  @Input() billingSettings: IBillingSettings;
  @Input() editBillUpcoming: boolean = false;
  @Input() editBill: boolean = false;
  @Input() isFormSubmitted:boolean = false;
  @Output() readonly editBillFreq = new EventEmitter<string>();
  @Output() readonly removeUpcomingFreq = new EventEmitter<boolean>();
  @Output() readonly sendValue = new EventEmitter<IBillPeriod>();

  public pageType: string = 'setfirmlevel';
  public changeNotes: string;
  public showUpcoming: boolean = false;
  public billFrequencyDurationName: string = '';
  public billFrequencyDayObj: {value?: number; name?: string};
  public effectiveBillFrequencyDayObj: {value?: number; name?: string};
  public recurringName: Array<string> = ['First', 'Second', 'Third', 'Fourth', 'Last'];
  public upcomingChangesDisplay: IDisplaySettings;
  public billFrequencyEndDate: string;

  constructor(
    private dialogService: DialogService
  ) {
  }

  ngOnInit() {
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('billingSettings')) {
      this.billingSettings = changes.billingSettings.currentValue;
      if (this.billingSettings && Object.keys(this.billingSettings).length > 0) {
        let daysList = UtilsHelper.getDayslistn();
        this.setValue(null, 'settings');
        this.billFrequencyDurationName = (this.billingSettings.billFrequencyQuantity == 1) ? (this.billingSettings.billFrequencyDuration) ? this.billingSettings.billFrequencyDuration.name.slice(0, -1) : '' : (this.billingSettings.billFrequencyDuration) ? this.billingSettings.billFrequencyDuration.name : '';
        this.billFrequencyDayObj = daysList.find(item => item.value === this.billingSettings.billFrequencyDay);
      }
      if (changes.hasOwnProperty('editBillUpcoming')) {
        if (changes.editBillUpcoming.currentValue === false && this.billingSettings) {
          this.setValue(null, 'settings');
        }
      }
    }
  }

  public getValue(data: IBillPeriod) {
    this.setValue(data, 'changes');
    this.sendValue.emit(data);
  }

  public editBilling() {
    this.editBill = true;
    this.editBillFreq.emit('basic');
  }
  public editUpcoming() {
    this.editBillUpcoming = true;
    this.showUpcoming = true
    this.editBillFreq.emit('upcoming');
  }

  /**
   * Remove upcoming billing frequency changes
   */
  public removeUpcoming() {
    this.dialogService
    .confirm(
      'Are you sure you want to delete the upcoming billing frequency settings at the firm level? This will leave the current settings active.',
      'Yes, delete upcoming changes',
      'Cancel',
      'Delete Upcoming Changes',
      true
    )
    .then(response => {
      if (response) {
        this.removeUpcomingFreq.emit(true);
      }
    });
  }

  public setValue(item, type) {
    let daysList = UtilsHelper.getDayslistn();
    if (type === 'changes') {
      let day: number = item.billFrequencyDay;
      this.effectiveBillFrequencyDayObj = daysList.find(item => item.value === day);
      let fDuration =  {
        code: item.billFrequencyDurationType,
        id: item.billFrequencyDuration,
        name: _.capitalize(item.billFrequencyDurationType)
      }
      this.upcomingChangesDisplay = {
        effectiveBillFrequencyDuration : fDuration,
        effectiveBillFrequencyQuantity : item.billFrequencyQuantity,
        effectiveBillFrequencyStartingDate : item.effectiveDate,
        effectiveBillFrequencyRecursOn: item.billFrequencyRecursOn
      }
    } else {
      this.effectiveBillFrequencyDayObj = daysList.find(item => item.value === this.billingSettings.effectiveBillFrequencyDay);
      this.upcomingChangesDisplay = {
        effectiveBillFrequencyDuration : this.billingSettings.effectiveBillFrequencyDuration,
        effectiveBillFrequencyQuantity : this.billingSettings.effectiveBillFrequencyQuantity,
        effectiveBillFrequencyStartingDate : this.billingSettings.effectiveBillFrequencyStartingDate,
        effectiveBillFrequencyRecursOn : this.billingSettings.effectiveBillFrequencyRecursOn
      }
      if (this.billingSettings.effectiveBillFrequencyStartingDate) {
        this.billFrequencyEndDate = moment(this.billingSettings.effectiveBillFrequencyStartingDate).add(-1, 'days').format('MM/DD/YYYY');
      }
    }
    this.effectiveBillFrequencyDayObj = {...this.effectiveBillFrequencyDayObj};
  }

}
