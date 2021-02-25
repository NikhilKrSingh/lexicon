import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import {debounceTime, finalize, map} from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwMatterResponse } from 'src/app/modules/models';
import { vwBillingSettings, vwCreditCard, vwECheck, vwIdCodeName, vwPaymentPlan } from 'src/common/swagger-providers/models';
import { BillingService, FixedFeeServiceService, MatterService } from 'src/common/swagger-providers/services';
import * as errors from '../../../error.json';
import { UtilsHelper } from '../../../utils.helper';

@Component({
  selector: 'app-payment-plan',
  templateUrl: './payment-plan.component.html',
  styleUrls: ['./payment-plan.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class PaymentPlanComponent implements OnInit {
  paymentPlan: vwPaymentPlan;
  matterId: number;
  balanceDue: number;
  matterBillingDetails: vwBillingSettings;
  matterDetails: vwMatterResponse;
  paymentPlanForm: FormGroup;
  ccId: number;
  echeckId: number;
  showAutoPayWarning: boolean = false;
  editPaymentPlan: boolean = true;
  editAutoPay: boolean = false;
  public ColumnMode = ColumnMode;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild('tableECheck', { static: false }) tableECheck: DatatableComponent;
  originalcreditCardList: Array<vwCreditCard>;
  creditCardList: Array<vwCreditCard>;
  originalecheckList: Array<vwECheck>;
  echeckList: Array<vwECheck>;
  error_data = (errors as any).default;
  selectedRow: any;
  selectedType: string;
  billFrequencyList: Array<vwIdCodeName>;
  estimatedPayoffDate: string;
  nextPaymentDate: string;
  changeNotes: string;
  removeBillUpcoming: boolean = false;
  showUpcoming: boolean = false;
  editBillUpcoming: boolean = false;
  public repeatsOn: Array<{ name: string; selected: boolean }> = [
    { name: 'Sunday', selected: false },
    { name: 'Monday', selected: false },
    { name: 'Tuesday', selected: false },
    { name: 'Wednesday', selected: false },
    { name: 'Thursday', selected: false },
    { name: 'Friday', selected: false },
    { name: 'Saturday', selected: false },
  ];
  public recursOnList: Array<{ id?: number; name?: string }> = [];
  public recurringName: Array<string> = [
    'First',
    'Second',
    'Third',
    'Fourth',
    'Last',
  ];
  public billWhenHolidayList: Array<{ id?: number; name?: string }> = UtilsHelper.getGeneratePaymentPlanBillList();
  public selectedDuration: vwIdCodeName = { code: '', name: '' };
  public selectedRecursDay: { id?: number; name?: string };
  public selectedDay: string = '';
  public startDate: string;
  public endDate: string;
  public billFrequencyDayObj: {value?: number; name?: string};
  public effectiveBillFrequencyDayObj: {value?: number; name?: string};
  loading: boolean = false;
  today = new Date();
  displayUntillDate: string;
  upcomingChangesDisplay;

  dateTimeFilter: (d: Date) => boolean;
  cycleOff: number = 0;
  hasFrequencyOrDayChanged: boolean = false;
  currentAmountToPay: number;
  correctEffectiveDate: string;
  selectedDayNumber: number;

  constructor(
    private activeModal: NgbActiveModal,
    private billingService: BillingService,
    private fb: FormBuilder,
    private toastr: ToastDisplay,
    private matterService: MatterService,
    private fixedFeeServiceService: FixedFeeServiceService
  ) {
    this.paymentPlanForm = this.fb.group({
      billFrequencyLookup: [null, [Validators.required]],
      billFrequencyQuantity: [null, [Validators.required]],
      amountToPay: [null, [Validators.required]],
      isAutoPay: false,
      billingFrequencyRecursDay: [''],
      effectiveDate: [null, [Validators.required]],
      billWhenHoliday: 1,
      repeatType: 1
    });

    this.today.setHours(0, 0, 0);
  }

  ngOnInit() {
    if (this.paymentPlan) {
      this.changeNotes = this.paymentPlan.changeNotes;
      this.setDisplayItem();
    }
    if (!this.matterDetails.isFixedFee && !this.paymentPlan) {
      this.paymentPlanForm.patchValue({
        billFrequencyLookup: this.matterBillingDetails.billFrequencyDuration.id,
        billFrequencyQuantity: this.matterBillingDetails.billFrequencyQuantity,
        billingFrequencyRecursDay: this.matterBillingDetails.billFrequencyRecursOn,
        effectiveDate: this.matterBillingDetails.billFrequencyNextDate,
      });

      this.selectedDuration = this.matterBillingDetails.billFrequencyDuration;
    }

    this.getBillFrequencyList();
    this.getPaymentMethods();

    if (this.paymentPlan) {
      this.paymentPlanForm.patchValue({
        billFrequencyLookup: this.paymentPlan.billFrequencyLookUp,
        billFrequencyQuantity: this.paymentPlan.billFrequencyQuantity,
        amountToPay: this.paymentPlan.amountToPay,
        isAutoPay: this.paymentPlan.isAutoPay,
        billingFrequencyRecursDay: this.paymentPlan.billFrequencyRecursOn,
        effectiveDate: this.paymentPlan.effectiveDate,
        repeatType: this.paymentPlan.repeatType,
        billWhenHoliday: this.paymentPlan.billWhenHoliday
      });

      this.currentAmountToPay = this.paymentPlan.amountToPay;

      this.nextPaymentDate = this.paymentPlan.nextPaymentDate;
      this.estimatedPayoffDate = this.paymentPlan.estimatedPayoffDate;
      this.ccId = this.paymentPlan.cCardId;
      this.echeckId = this.paymentPlan.echeckId;
      this.correctEffectiveDate = this.paymentPlan.nextPaymentDate;

      let index = this.paymentPlan.billFrequencyDay;
      this.repeatsOn.map((item) => (item.selected = false));
      this.repeatsOn[index].selected = true;
      this.selectedDay = this.repeatsOn[index].name;
      this.recursOnList = [];
      this.selectedDayNumber = index;
      this.setRepeatOn(this.paymentPlan.repeatType);
      this.recurringName.map((item, index1) => {
        this.recursOnList.push({
          id: index1 + 1,
          name: item + ' ' + this.repeatsOn[index].name + ' of the month',
        });
      });

      this.selectedRecursDay = this.recursOnList.find(
        (a) => a.id == this.paymentPlan.billFrequencyRecursOn
      );
    }

    this.paymentPlanForm.controls['isAutoPay'].valueChanges.subscribe((res) => {
      if (!res) {
        this.ccId = 0;
        this.echeckId = 0;
      }
    });
    this.paymentPlanForm.controls.repeatType
      .valueChanges.pipe(debounceTime(100)).subscribe((text: number) => {
      this.setRepeatOn(text);
      this.paymentPlanForm.patchValue({
        billingFrequencyRecursDay: null
      });
    });
  }

  public setRepeatOn(text) {
    this.recursOnList = [];
    if (text === 2) {
      for (let i = 1; i <= 31; i++) {
        this.recursOnList.push({id: i, name: i + ((i==1) ? 'st': (i==2) ? 'nd': (i==3) ? 'rd' : 'th') + ' of the month'});
      }
    } else {
      this.recurringName.map((item, index1) => {
        this.recursOnList.push({id: index1 + 1, name: item + ' ' + this.repeatsOn[this.selectedDayNumber].name + ' of the month'});
      });
    }
  }

  private getBillFrequencyList() {
    this.billingService
      .v1BillingBillfrequencyListGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        if (res) {
          this.billFrequencyList = res;
          this.billFrequencyList = this.billFrequencyList.filter(
            (a) => a.code !== 'DAYS'
          );

          if (this.paymentPlan) {
            this.selectedDuration = this.billFrequencyList.find(
              (a) => a.id == this.paymentPlan.billFrequencyLookUp
            );

            this.setFilter();
          } else {
            if (!this.matterDetails.isFixedFee && this.matterBillingDetails.billFrequencyDay) {
              if (this.matterBillingDetails.billFrequencyNextDate) {
                let currentEffectiveDate = moment(this.matterBillingDetails.billFrequencyNextDate);
                if (moment().isAfter(currentEffectiveDate, 'day')) {
                  this.selectDay(this.matterBillingDetails.billFrequencyDay);
                } else {
                  const index = this.matterBillingDetails.billFrequencyDay;
                  this.repeatsOn.map((item) => (item.selected = false));
                  this.repeatsOn[index].selected = true;
                  this.selectedDay = this.repeatsOn[index].name;
                  this.recursOnList = [];
                  this.selectedDayNumber = index;

                  this.recurringName.map((item, index1) => {
                    this.recursOnList.push({
                      id: index1 + 1,
                      name: item + ' ' + this.repeatsOn[index].name + ' of the month',
                    });
                  });

                  if (this.selectedDuration && this.selectedDuration.code == 'MONTHS') {
                    if (this.paymentPlanForm.value.billingFrequencyRecursDay) {
                      this.selectedRecursDay = this.recursOnList.find(
                        (item) =>
                          item.id == this.paymentPlanForm.value.billingFrequencyRecursDay
                      );
                    }
                  } else {
                    this.selectedRecursDay = null;
                    this.paymentPlanForm.patchValue({
                      billingFrequencyRecursDay: null
                    });
                  }

                  this.setFilter();
                }
              } else {
                this.selectDay(this.matterBillingDetails.billFrequencyDay);
              }
            }
          }
        }
      });
  }

  public get hasAutoPaymentMethod() {
    let isAutopay = false;

    if (this.originalcreditCardList && this.originalcreditCardList.length > 0) {
      isAutopay = this.originalcreditCardList.some((a) => a.autoPay);
    }

    if (!isAutopay) {
      if (this.originalecheckList && this.originalecheckList.length > 0) {
        isAutopay = this.originalecheckList.some((a) => a.autoPay);
      }
    }

    return isAutopay;
  }

  private getPaymentMethods() {
    this.matterService
      .v1MatterPaymentMethodsbymatterMatterIdGet({
        matterId: this.matterId,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        if (res) {
          this.creditCardList = res.creditCards;
          this.originalcreditCardList = JSON.parse(
            JSON.stringify(this.creditCardList)
          );
          for (const data of this.creditCardList) {
            data['expiryDate'] = this.getExpiryDate(data.expirationDate);
          }

          this.echeckList = res.eChecks;
          this.originalecheckList = JSON.parse(JSON.stringify(this.echeckList));
        }
      });
  }

  public getExpiryDate(expirationDate: string) {
    let month = expirationDate.slice(0, 2);
    let year = expirationDate.slice(-4);

    return `${month}/${year}`;
  }

  onSelect(row: any, type: string) {
    this.selectedRow = row;
    this.selectedType = type;

    if (this.selectedType == 'cc') {
      this.ccId = this.selectedRow.id;
      this.echeckId = null;
    } else {
      this.echeckId = this.selectedRow.id;
      this.ccId = null;
    }

    if (this.isAnyOtherAutoPay()) {
      this.showAutoPayWarning = true;
    } else {
      this.showAutoPayWarning = false;
    }
  }

  isAnyOtherAutoPay() {
    let echeckAutoPay = this.originalecheckList.find((list) => list.autoPay);

    if (echeckAutoPay) {
      return true;
    }

    let ccAutopay = this.originalcreditCardList.find((list) => list.autoPay);

    if (ccAutopay) {
      return true;
    }

    return false;
  }

  validateAmount() {
    let data = this.paymentPlanForm.value;
    if (+data.amountToPay > this.balanceDue || !(+data.amountToPay)) {
      this.toastr.showError(
        'Please enter amount less than or equal to current balance due'
      );

      this.paymentPlanForm.patchValue({
        amountToPay: null,
      });

      this.estimatedPayoffDate = null;

      this.paymentPlanForm.updateValueAndValidity();
    } else {
      this.calcEsitmatedPayofflDate();
    }
  }

  public calcEsitmatedPayofflDate() {
    let data = this.paymentPlanForm.value;
    let payOffAmount = 0;
    let newEffectiveDate = moment(this.paymentPlanForm.value.effectiveDate).format('MM/DD/YYYY');
    if (this.paymentPlan && this.paymentPlan.id && moment(newEffectiveDate).isAfter(moment(new Date()))) {
      this.cycleOff = this.getCurrentEstimatedPayoffDate(newEffectiveDate);
      if (this.cycleOff) {
        payOffAmount = this.cycleOff * this.paymentPlan.amountToPay;
      }
    }
    let billFrequencyQuantity = +data.billFrequencyQuantity;
    let billFrequencyLookup = +data.billFrequencyLookup;

    let billFrequencyDuration = this.billFrequencyList.find(
      (a) => a.id == billFrequencyLookup
    );

    if (billFrequencyQuantity && billFrequencyDuration && data.amountToPay) {
      if (this.selectedDuration.code == 'WEEKS' && this.selectedDay) {
        this.getEstimatedDate(payOffAmount);
      } else if (
        this.selectedDuration.code == 'MONTHS' &&
        this.selectedDay &&
        this.selectedRecursDay
      ) {
        this.getEstimatedDate(payOffAmount);
      } else {
        this.nextPaymentDate = null;
        this.estimatedPayoffDate = null;
      }
    } else {
      this.nextPaymentDate = null;
      this.estimatedPayoffDate = null;
    }
    this.hasFrequencyOrDayChanged = true;
    this.setValue('changes');
  }

  private getEstimatedDate(payOffAmount) {
    let data = this.paymentPlanForm.value;
    let balanceDue = (payOffAmount) ? (this.balanceDue - payOffAmount) : this.balanceDue;
    let cycles = Math.ceil(balanceDue / +data.amountToPay);
    let currentCycle = 1;
    let startDate = moment(this.paymentPlanForm.value.effectiveDate).format('MM/DD/YYYY');

    if (!this.paymentPlan) {
      this.nextPaymentDate = moment(this.paymentPlanForm.value.effectiveDate).format('MM/DD/YYYY');
    } else {
      if (this.hasFrequencyOrDayChanged) {
        let newEffectiveDate = moment(this.paymentPlanForm.value.effectiveDate);
        let nextPaymentDate = moment(this.paymentPlan.nextPaymentDate);

        if (newEffectiveDate.isBefore(nextPaymentDate)) {
          this.nextPaymentDate = newEffectiveDate.clone().format('MM/DD/YYYY');
        } else {
          this.nextPaymentDate = this.paymentPlan.nextPaymentDate;
        }
      }
    }
    if (cycles > 1) {
      while (currentCycle < cycles) {
        this.getNextBillDate(
          this.selectedDuration,
          +this.paymentPlanForm.value.billFrequencyQuantity,
          startDate
        );
        if (moment(startDate).isAfter(moment(new Date()))) {
          if (currentCycle === 1) {
            this.correctEffectiveDate = startDate;
          }
          currentCycle = currentCycle + 1;
        }
        startDate = this.endDate;
      }
      this.estimatedPayoffDate = this.endDate;
    } else {
      this.estimatedPayoffDate = moment(this.paymentPlanForm.value.effectiveDate).format('MM/DD/YYYY');
    }
  }

  close() {
    this.activeModal.close(null);
  }

  sendForApproval(action: string = null) {
    if (this.paymentPlanForm.valid) {
      let data = this.paymentPlanForm.value;

      if (data.isAutoPay) {
        if (this.ccId > 0 || this.echeckId > 0) {
          this.saveData(action);
        } else {
          this.toastr.showError('Please select a credit card or e-check');
        }
      } else {
        this.saveData(action);
      }
    }
  }

  private saveData(action: string) {
    let data = this.paymentPlanForm.value;

    const plan = <vwPaymentPlan> {
      cCardId: this.ccId,
      echeckId: this.echeckId,
      changeNotes: this.changeNotes,
      isAutoPay: data.isAutoPay,
      effectiveDate:
        moment(this.correctEffectiveDate).format('YYYY-MM-DD') + 'T00:00:00'
    };
    if (this.paymentPlan) {
      let newEffectiveDate = moment(this.paymentPlanForm.value.effectiveDate);
      let currentDate = moment(new Date());
      if (newEffectiveDate.isAfter(currentDate)) {
        plan.billFrequencyDay = this.paymentPlan.billFrequencyDay;
        plan.billFrequencyRecursOn = this.paymentPlan.billFrequencyRecursOn;
        plan.billFrequencyLookUp = this.paymentPlan.billFrequencyLookUp;
        plan.billFrequencyQuantity = this.paymentPlan.billFrequencyQuantity;
        plan.amountToPay = this.paymentPlan.amountToPay;
        plan.estimatedPayoffDate = this.paymentPlan.estimatedPayoffDate;
        plan.nextPaymentDate = moment(this.correctEffectiveDate).format('YYYY-MM-DD') + 'T00:00:00';
        plan.repeatType = this.paymentPlan.repeatType;
        plan.billWhenHoliday = this.paymentPlan.billWhenHoliday;

        plan.pendingBillFrequencyDay = this.repeatsOn.findIndex((a) => a.selected);
        plan.pendingBillFrequencyRecursOn = data.billingFrequencyRecursDay;
        plan.pendingBillFrequencyLookUp = +data.billFrequencyLookup;
        plan.pendingBillFrequencyQuantity = +data.billFrequencyQuantity;
        plan.pendingAmountToPay = +data.amountToPay;
        plan.pendingEstimatedPayoffDate = moment(this.estimatedPayoffDate).format('YYYY-MM-DD') + 'T00:00:00';
        plan.pendingRepeatType = +data.repeatType;
        plan.pendingBillWhenHoliday = +data.billWhenHoliday;
      } else {
        plan.billFrequencyDay = this.repeatsOn.findIndex((a) => a.selected);
        plan.billFrequencyRecursOn = data.billingFrequencyRecursDay;
        plan.billFrequencyLookUp = +data.billFrequencyLookup;
        plan.billFrequencyQuantity = +data.billFrequencyQuantity;
        plan.amountToPay = +data.amountToPay;
        plan.estimatedPayoffDate = moment(this.estimatedPayoffDate).format('YYYY-MM-DD') + 'T00:00:00';
        plan.nextPaymentDate = moment(this.correctEffectiveDate).format('YYYY-MM-DD') + 'T00:00:00';
        plan.repeatType = +data.repeatType;
        plan.billWhenHoliday = +data.billWhenHoliday;
        plan.pendingBillFrequencyDay = null;
        plan.pendingBillFrequencyRecursOn = null;
        plan.pendingBillFrequencyLookUp = null;
        plan.pendingBillFrequencyQuantity = null;
      }
    }
    if (!plan.billFrequencyQuantity) {
      plan.billFrequencyDay = this.repeatsOn.findIndex((a) => a.selected);
      plan.billFrequencyRecursOn = data.billingFrequencyRecursDay;
      plan.billFrequencyLookUp = +data.billFrequencyLookup;
      plan.billFrequencyQuantity = +data.billFrequencyQuantity;
      plan.amountToPay = +data.amountToPay;
      plan.estimatedPayoffDate = moment(this.estimatedPayoffDate).format('YYYY-MM-DD') + 'T00:00:00';
      plan.nextPaymentDate = moment(this.correctEffectiveDate).format('YYYY-MM-DD') + 'T00:00:00';
      plan.repeatType = +data.repeatType;
      plan.billWhenHoliday = +data.billWhenHoliday;
    }

    let obs = [];

    if (this.originalecheckList && this.originalecheckList.length > 0) {
      let echeckAutoPay = this.originalecheckList.find((list) => list.autoPay);

      if (echeckAutoPay) {
        obs.push(this.suspendAutopay(echeckAutoPay.id));
      }
    }

    if (this.originalcreditCardList && this.originalcreditCardList.length) {
      let ccAutopay = this.originalcreditCardList.find((list) => list.autoPay);

      if (ccAutopay) {
        obs.push(this.suspendAutopay(ccAutopay.id));
      }
    }

    if (obs.length > 0 && data.isAutoPay) {
      forkJoin([...obs]).subscribe((res) => {
        if (this.paymentPlan && this.paymentPlan.id) {
          this.updateBillingSettings(plan, action);
        } else {
          this.activeModal.close(plan);
        }
      });
    } else {
      if (this.paymentPlan && this.paymentPlan.id) {
        this.updateBillingSettings(plan, action);
      } else {
        this.activeModal.close(plan);
      }
    }
  }

  private suspendAutopay(paymentMethodId: number) {
    return this.matterService.v1MatterPaymentMethodsPut$Json({
      body: [
        {
          matterId: this.matterId,
          paymentMethodId: paymentMethodId,
          isAutopay: true,
          isSuspend: true,
        },
      ],
    });
  }

  public selectDay(index: number) {
    this.repeatsOn.map((item) => (item.selected = false));
    this.repeatsOn[index].selected = true;
    this.selectedDay = this.repeatsOn[index].name;
    this.recursOnList = [];
    this.selectedDayNumber = index;

    this.recurringName.map((item, index1) => {
      this.recursOnList.push({
        id: index1 + 1,
        name: item + ' ' + this.repeatsOn[index].name + ' of the month',
      });
    });

    if (this.selectedDuration && this.selectedDuration.code == 'MONTHS') {
      if (this.paymentPlanForm.value.billingFrequencyRecursDay) {
        this.selectedRecursDay = this.recursOnList.find(
          (item) =>
            item.id == this.paymentPlanForm.value.billingFrequencyRecursDay
        );
      }
    } else {
      this.selectedRecursDay = null;
    }
    this.setRepeatOn(this.paymentPlanForm.value.repeatType);
    this.setFilter();
    this.hasFrequencyOrDayChanged = true;
    this.setDefaultEffectiveDate();
    this.calcEsitmatedPayofflDate();
  }

  private getNextBillDate(
    billFrequencyDuration: vwIdCodeName,
    billFrequencyQuantity: number,
    lastBillDate: string
  ) {
    let days = this.repeatsOn.findIndex((item) => item.selected);
    if (days > -1) {
      if (billFrequencyDuration.code === 'WEEKS') {
        this.endDate = UtilsHelper.addWeeksForBillPeriod(
          lastBillDate,
          days,
          billFrequencyQuantity
        );
      } else if (billFrequencyDuration.code === 'MONTHS' && this.paymentPlanForm.value.billingFrequencyRecursDay) {
        this.endDate = UtilsHelper.addMonthForBillPeriod(
          lastBillDate,
          billFrequencyQuantity,
          days,
          +this.paymentPlanForm.value.billingFrequencyRecursDay
        );
      }
    }
  }

  public onSelectRecursDay(event) {
    this.selectedRecursDay = event;
    this.setDefaultEffectiveDate();
    this.setFilter();
    this.calcEsitmatedPayofflDate();
  }

  private setFilter() {
    if (this.selectedDay) {
      if (this.selectedRecursDay) {
        this.dateTimeFilter = (d: Date) => {
          let days = [];
          let dayIndex = this.recursOnList.findIndex(
            (a) => a == this.selectedRecursDay
          );

          const day = moment(d).startOf('month').day(this.selectedDay);
          if (day.date() > 7) {
            day.add(7, 'd');
          }

          days.push(day.clone());

          const month = day.month();

          while (month === day.month()) {
            day.add(7, 'd');
            if (month == day.month()) {
              days.push(day.clone());
            }
          }

          let requiredDay =
            dayIndex < days.length - 1 ? days[dayIndex] : days[days.length - 1];
          return moment(d).isSame(requiredDay);
        };
      } else {
        let index = this.repeatsOn.findIndex((a) => a.selected);
        this.dateTimeFilter = (d: Date) => {
          let day = d.getDay();
          return day == index;
        };
      }
    }
  }

  public onSelectDur(event) {
    this.selectedDuration = event;
    if (this.selectedDuration.code == 'WEEKS') {
      this.selectedRecursDay = null;
      this.paymentPlanForm.patchValue({
        billingFrequencyRecursDay: null,
      });
      this.paymentPlanForm.controls[
        'billingFrequencyRecursDay'
      ].clearValidators();
    } else {
      this.paymentPlanForm.controls['billingFrequencyRecursDay'].setValidators([
        Validators.required,
      ]);
    }

    this.paymentPlanForm.controls[
      'billingFrequencyRecursDay'
    ].updateValueAndValidity();
    this.paymentPlanForm.updateValueAndValidity();

    this.setFilter();
    this.hasFrequencyOrDayChanged = true;

    this.setDefaultEffectiveDate();
    this.calcEsitmatedPayofflDate();
  }

  private setDefaultEffectiveDate() {
    if (this.selectedDuration) {
      let day = this.repeatsOn.findIndex((a) => a.selected);

      if (this.selectedDuration.code == 'WEEKS') {
        if (this.selectedDay) {
          this.paymentPlanForm.patchValue({
            effectiveDate: this.getWeeklyDay(day),
          });
        } else {
          this.paymentPlanForm.patchValue({
            effectiveDate: null,
          });
        }
      } else if (this.selectedDuration.code == 'MONTHS') {
        if (this.selectedRecursDay) {
          let index = this.recursOnList.findIndex(
            (a) => a == this.selectedRecursDay
          );
          this.paymentPlanForm.patchValue({
            effectiveDate: this.getMonthlyDay(index),
          });
        } else if (this.selectedDay) {
          this.paymentPlanForm.patchValue({
            effectiveDate: this.getWeeklyDay(day),
          });
        } else {
          this.paymentPlanForm.patchValue({
            effectiveDate: null,
          });
        }
      }
    } else {
      this.paymentPlanForm.patchValue({
        effectiveDate: null,
      });
    }
  }

  private getWeeklyDay(day: number) {
    let d = new Date();

    while (d.getDay() != day) {
      d.setDate(d.getDate() + 1);
    }

    d.setHours(0, 0, 0);
    return d;
  }

  private getMonthlyDay(dayIndex: number) {
    let days = [];

    const day = moment().startOf('month').day(this.selectedDay);
    if (day.date() > 7) {
      day.add(7, 'd');
    }

    days.push(day.clone());

    const month = day.month();

    while (month === day.month()) {
      day.add(7, 'd');
      if (month == day.month()) {
        days.push(day.clone());
      }
    }

    let requiredDay =
      dayIndex < days.length - 1 ? days[dayIndex] : days[days.length - 1];
    if (!requiredDay || (requiredDay && requiredDay.isBefore(moment(), 'd'))) {
      days = [];

      const day = moment()
        .add(1, 'month')
        .startOf('month')
        .day(this.selectedDay);

      if (day.date() > 7) {
        day.add(7, 'd');
      }

      days.push(day.clone());

      const month = day.month();

      while (month === day.month()) {
        day.add(7, 'd');

        if (month == day.month()) {
          days.push(day.clone());
        }
      }
    }

    requiredDay =
      dayIndex < days.length - 1 ? days[dayIndex] : days[days.length - 1];
    return requiredDay.toDate();
  }

  public checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k == 8 || k == 9;
  }

  public getCurrentEstimatedPayoffDate(newEffectiveDate) {
    let cycleOff = 0;
    let startDate = moment(new Date()).format('MM/DD/YYYY');
    let selectedDuration =  this.billFrequencyList.find(
      (a) => a.id == this.selectedDuration.id
    );
    this.getNextBillDate(
      selectedDuration,
      this.paymentPlan.billFrequencyQuantity,
      startDate
    );
    if (this.endDate) {
      while (moment(newEffectiveDate).isAfter(moment(this.endDate))) {
        cycleOff = cycleOff + 1;
        this.getNextBillDate(
          selectedDuration,
          this.paymentPlan.billFrequencyQuantity,
          this.endDate
        );
      }
    }
    return cycleOff;
  }

  public editUpcoming() {
    this.showUpcoming = true;
    this.editBillUpcoming = true;
    this.removeBillUpcoming = false;
    this.hasFrequencyOrDayChanged = false;
    this.estimatedPayoffDate = this.paymentPlan.pendingEstimatedPayoffDate;
    this.paymentPlanForm.patchValue({
      billFrequencyLookup: (this.paymentPlan.pendingBillFrequencyLookUp) ? this.paymentPlan.pendingBillFrequencyLookUp : this.paymentPlan.billFrequencyLookUp,
      billFrequencyQuantity: this.paymentPlan.pendingBillFrequencyQuantity,
      billingFrequencyRecursDay: this.paymentPlan.pendingBillFrequencyRecursOn,
      effectiveDate: this.paymentPlan.effectiveDate,
      amountToPay: this.paymentPlan.pendingAmountToPay
    });
    this.selectedDuration = this.billFrequencyList.find(
      (a) => a.id == this.paymentPlan.pendingBillFrequencyLookUp
    );
  }

  public cancelUpcoming() {
    this.showUpcoming = false;
    this.editBillUpcoming = false;
    this.hasFrequencyOrDayChanged = false;
    this.removeBillUpcoming = false;
    this.setValue('settings');
  }

  public removeUpcoming() {
    this.paymentPlan.pendingBillFrequencyDay = null;
    this.paymentPlan.pendingBillFrequencyRecursOn = null;
    this.paymentPlan.pendingBillFrequencyLookUp = null;
    this.paymentPlan.pendingBillFrequencyQuantity = null;
    this.paymentPlan.pendingAmountToPay = null;
    this.paymentPlan.pendingEstimatedPayoffDate = null;
    this.updateBillingSettings(this.paymentPlan);
  }

  public setDisplayItem() {
    if (this.paymentPlan) {
      let daysList = UtilsHelper.getDayslistn();
      this.billFrequencyDayObj = daysList.find(item => item.value === this.paymentPlan.billFrequencyDay);
      if (this.paymentPlan.pendingBillFrequencyQuantity) {
        this.effectiveBillFrequencyDayObj = daysList.find(item => item.value === this.paymentPlan.pendingBillFrequencyDay);
        this.setValue('settings');
      }
      this.displayUntillDate = moment(this.paymentPlan.effectiveDate).add(-1, 'days').format('MM/DD/YYYY');
    }
  }

  private updateBillingSettings(plan, action: string = null) {
    plan.matterId = this.matterDetails.id;
    plan.id = this.paymentPlan.id;
    this.loading = true;
    this.fixedFeeServiceService.v1FixedFeeServicePaymentPlanPut$Json({
      body: plan
    })
    .pipe(map(UtilsHelper.mapData),
    finalize(() => {
    }))
    .subscribe(res => {
      if (res > 0) {
        if (action === 'autopay') {
          this.activeModal.close(plan);
        } else {
          if (moment(this.paymentPlanForm.value.effectiveDate).isAfter(moment())) {
            this.toastr.showSuccess(this.error_data.edit_payment_plan_success);
            this.getPaymentPlanList();
          } else {
            this.activeModal.close(plan);
          }
        }
      } else {
        this.toastr.showError(this.error_data.edit_payment_plan_error);
      }
    },
    () => {
      this.loading = false;
    });
  }

  private getPaymentPlanList() {
    this.fixedFeeServiceService.v1FixedFeeServicePaymentPlanMatteridGet({
      matterid: this.matterDetails.id
    })
    .pipe(map(UtilsHelper.mapData),
    finalize(() => {
      this.loading = false;
    }))
    .subscribe(res => {
      if (res && res.length > 0) {
        this.editBillUpcoming = false;
        this.hasFrequencyOrDayChanged = false;
        this.removeBillUpcoming = false;
        this.paymentPlan = res[0];
        this.estimatedPayoffDate = this.paymentPlan.estimatedPayoffDate;
        this.setDisplayItem();
        this.paymentPlanForm.patchValue({effectiveDate: this.paymentPlan.effectiveDate});
      }
    }, () => {
      this.loading = false;
    });
  }

  public setValue(type) {
    let daysList = UtilsHelper.getDayslistn();
    if (type === 'changes') {
      let data = this.paymentPlanForm.value;
      let days = this.repeatsOn.findIndex((item) => item.selected);
      this.effectiveBillFrequencyDayObj = daysList.find(item => item.value === days);
      let lookUpName = this.billFrequencyList.find(item => item.id === data.billFrequencyLookup);
      this.upcomingChangesDisplay = {
        pendingAmountToPay : data.amountToPay,
        pendingBillFrequencyQuantity : +data.billFrequencyQuantity,
        pendingBillFrequencyLookUpName : (lookUpName) ? lookUpName.name : null,
        pendingBillFrequencyRecursOn: data.billingFrequencyRecursDay,
        pendingRepeatType: data.pendingRepeatType,
        pendingBillWhenHoliday: data.pendingBillWhenHoliday,
        effectiveDate: data.effectiveDate,
      }
    } else {
      this.effectiveBillFrequencyDayObj = daysList.find(item => item.value === this.paymentPlan.pendingBillFrequencyDay);
      this.upcomingChangesDisplay = {
        pendingAmountToPay : this.paymentPlan.pendingAmountToPay,
        pendingBillFrequencyQuantity : this.paymentPlan.pendingBillFrequencyQuantity,
        pendingBillFrequencyLookUpName : this.paymentPlan.pendingBillFrequencyLookUpName,
        pendingBillFrequencyRecursOn: this.paymentPlan.pendingBillFrequencyRecursOn,
        pendingRepeatType: this.paymentPlan.pendingRepeatType,
        pendingBillWhenHoliday: this.paymentPlan.pendingBillWhenHoliday,
        effectiveDate: this.paymentPlan.effectiveDate,
      }
    }
  }
}
