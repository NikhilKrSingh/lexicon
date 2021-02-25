import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, finalize, map } from 'rxjs/operators';
import { Page } from 'src/app/modules/models';
import { SelectService } from 'src/app/service/select.service';
import { vwBillingSettings, vwIdCodeName } from 'src/common/swagger-providers/models';
import { BillingService, UsioService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { IBillPeriod } from '../../models';
import { IBillingSettings } from '../../models/billing-setting.model';
import { UtilsHelper } from '../utils.helper';

@Component({
  selector: 'app-billing-period',
  templateUrl: './billing-period.component.html',
  styleUrls: ['./billing-period.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BillingPeriodComponent implements OnInit, OnChanges {
  @Input() billingSettings: vwBillingSettings;
  @Input() pageType = 'createoffice';
  @Input() opratingaccount = 'Create';
  @Input() officeId = 0;
  @Input() recall = false;
  @Input() isFormSubmitted = false;
  @Input() visibleOpratingAccount = 'true';
  @Output() readonly sendValue = new EventEmitter<any>();
  @Input() matterOpenDate = null;
  @Output() readonly getOpratingAccountsDetails = new EventEmitter<any>();
  @Output() readonly updateAccounts = new EventEmitter<any>();
  @Output() readonly editAccount = new EventEmitter<any>();

  @Input() billFrequencyList1: Array<vwIdCodeName> = [];
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
  public billWhenHolidayList: Array<{
    id?: number;
    name?: string;
  }> = UtilsHelper.getGrneratePreBilllist();
  public recurringName: Array<string> = [
    'First',
    'Second',
    'Third',
    'Fourth',
    'Last'
  ];
  public selectedDuration: vwIdCodeName = { code: '', name: '' };
  public selectedRecursDay: { id?: number; name?: string };
  public selectedDay = '';
  public selectedDayNumber: number;
  public startDate: string;
  public endDate: string;
  public displayStartDate: string;
  public displayEndDate: string;
  public minDate;
  public maxDate;
  public localDate: string;
  userDetils: any = {};
  public loading = false;
  public effectiveDateDisplay: string;
  public billingSettingsTenent: vwBillingSettings;
  public bankType: string = null;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  public page = new Page();
  public originalOfficeBankList: Array<any> = [];
  public officeBankList: Array<any> = [];
  public selectPageSize = new FormControl('10');
  public pageSelected: number = 1;
  public limitArray: Array<number> = [10, 30, 50, 100];
  public SelectionType = SelectionType;
  public selectedRowsLength: number = 0;
  public searchText: string = null;
  selectedOpratingAccounts = [];
  next = false;
  merchantAccountFilterList = [
    { id: 1, name: 'Yes' },
    { id: 2, name: 'No' }
  ];
  merchantAccountFilterId: any;
  transactionAccountFilterList = [
    { id: 1, name: 'Credit Card' },
    { id: 2, name: 'ACH' }
  ];
  transactionAccountFilterId = [];
  public title = 'All';
  opratingAccountReadOnlyFlag = false;
  orgSelectedBankList = [];
  alreadySaved = [];
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  private permissionSubscribe: Subscription;
  public isEditPermission : boolean = false;
  public changeFromOnchange : boolean = false;
  public isCheckboxHidden : boolean = true;

  constructor(
    private billingService: BillingService,
    private builder: FormBuilder,
    private selectService: SelectService,
    public usioService: UsioService,
    private store: Store<fromRoot.AppState>
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.page.size = 10;
    this.page.pageNumber = 0;
    this.userDetils = UtilsHelper.getLoginUser();
    const data = UtilsHelper.getObject('office');

    this.startDate = moment().format('MM/DD/YYYY');
    this.billingSettingsForm = this.builder.group({
      billFrequencyQuantity: [0, Validators.required],
      billFrequencyDuration: ['', Validators.required],
      isInherited: true,
      billingFrequencyRecursDay: [null, Validators.required],
      effectiveDate: [null, Validators.required],
      repeatType: 1,
      billWhenHoliday: 1,
      isWorkComplete: false
    });
  }

  public async getUsioTenantTrustBankAccounts() {
    try {
      this.loading = true;
      const resp = await this.usioService
        .v1UsioGetUsioTenantBankAccountsGet({
          officeId: this.officeId,
          usioAccountTypeId: 1
        })
        .toPromise();
      let response = JSON.parse(resp as any).results;
      const sortedResp = response.sort((a, b) => a.name.localeCompare(b.name));
      this.originalOfficeBankList = sortedResp;
      this.officeBankList = [...this.originalOfficeBankList];

      if(this.originalOfficeBankList.length == 1){
        this.onSelect({selected:this.originalOfficeBankList});
        this.opratingAccountReadOnlyFlag = true;
      }
      if(this.originalOfficeBankList.length>0)
      this.isCheckboxHidden = false

      let selectedArray = [];

      if (this.officeId > 0) {
        this.originalOfficeBankList.filter(orgAcc => {
          if (orgAcc.isSelected) {
            selectedArray.push(orgAcc);
          }
        });
        this.onSelect({ selected: selectedArray });
      }

      if (this.opratingaccount == 'View') {
        this.officeBankList = selectedArray;
        this.orgSelectedBankList = selectedArray;
      }

      this.loading = false;
      this.updateDatatableFooterPage();
    } catch (error) {
      this.loading = false;
    }
  }

    /****** Triggers When Filter Applied ******/
    public applyFilter() {

      let rows;
      if(this.opratingaccount == 'View'){
        rows = [...this.orgSelectedBankList];
      }
      else{
        rows = [...this.originalOfficeBankList];
      }

      if (this.searchText) {
        rows = rows.filter(f => {
          return (
            (f.name || '').toLowerCase().includes(this.searchText.toLowerCase()) ||
            (f.merchantAccountNumber && f.merchantAccountNumber.substr(f.merchantAccountNumber.length - 4) || '').toLowerCase().includes(this.searchText.toLowerCase())
            || (f.nonMerchantAccountNumber && f.nonMerchantAccountNumber.substr(f.nonMerchantAccountNumber.length - 4) || '').toLowerCase().includes(this.searchText.toLowerCase())
            );
        });
      }

    if (this.merchantAccountFilterId) {
      if (this.merchantAccountFilterId == 1) {
        rows = rows.filter(item => {
          if (item.isMerchantAccount) {
            return item;
          }
        });
      } else {
        rows = rows.filter(item => {
          if (!item.isMerchantAccount) {
            return item;
          }
        });
      }
    }
    if (
      this.transactionAccountFilterId &&
      this.transactionAccountFilterId.length > 0
    ) {
      if (this.transactionAccountFilterId.length == 1) {
        switch (this.transactionAccountFilterId[0]) {
          case 1:
            rows = rows.filter(acc => {
              if (acc.isCreditCardAccount) {
                return acc;
              }
            });
            break;
          case 2:
            rows = rows.filter(acc => {
              if (acc.isAchAccount) {
                return acc;
              }
            });
            break;
        }
      }
    }

    this.officeBankList = [...rows];
    this.updateDatatableFooterPage();
  }
  public getSelectedStatus(event) {
    this.title = '';
    if (event.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'All';
    }
  }


  /****** Data Table Items per page *****/
  public pageSizeChange(): void {
    this.page.size = +this.selectPageSize.value;
    this.updateDatatableFooterPage();
  }

  /****** Change Page Drop Down */
  public changePageDropDown(e) {
    this.pageSelected = e.page;
  }

  /******* Changes Data Table Page ******/
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateDatatableFooterPage();
    }
  }

  /****** Triggers When Row Selected From Table *****/
  public onSelect(rows: any) {
    if(rows.selected) {
      this.getOpratingAccountsDetails.emit(rows.selected);
      this.selectedOpratingAccounts = rows.selected;
      this.selectedRowsLength =  rows.selected.length;
      this.next = false;
    }
    if(this.officeId > 0){
      this.updateAccounts.emit(this.selectedOpratingAccounts);
    }
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.officeBankList.length;
    this.page.totalPages = Math.ceil(
      this.officeBankList.length / this.page.size
    );
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    UtilsHelper.aftertableInit();
  }

  ngOnInit() {
    this.getFrequencyListItem();
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if(this.permissionList.ACCOUNTINGisAdmin)
          {
            this.isEditPermission=true;
          }
        }
      }
    });
    this.getBillingSettings();
    this.getUsioTenantTrustBankAccounts();
    this.billingSettingsForm.controls.billFrequencyQuantity.valueChanges
      .pipe(debounceTime(100))
      .subscribe((text: string) => {
        this.getNextBillDate(this.selectedDuration, +text, this.startDate);
      });
    this.billingSettingsForm.controls.repeatType.valueChanges
      .pipe(debounceTime(100))
      .subscribe((text: number) => {
        if (
          (this.pageType === 'setfirmlevel' || this.pageType === 'editoffice' ||
          this.pageType === 'createoffice' || this.pageType === 'editclient' ||
          this.pageType === 'editmatter' || this.pageType === 'matter' ||
          this.pageType === 'client' || this.pageType === 'createclient') &&
          !this.changeFromOnchange
        ) {
          if (!this.billingSettingsForm.value.isInherited) {
            this.billingSettingsForm.patchValue({
              billingFrequencyRecursDay: null
            });
            this.billingSettingsForm
              .get('billingFrequencyRecursDay')
              .markAsUntouched();
          }
        }
        if (this.changeFromOnchange) {
          this.changeFromOnchange = false;
        }
        this.setRepeatOn(text);
        this.emitValue();
      });
  }

  ngOnChanges(changes) {
    if (changes.billingSettings && changes.billingSettings.currentValue) {
      this.billingSettings = changes.billingSettings.currentValue;
      if (this.billingSettings) {
        this.changeFromOnchange = true;
        this.billingSettingsForm.patchValue({
          billFrequencyDuration: this.billingSettings.billFrequencyDuration
            ? this.billingSettings.billFrequencyDuration.id
            : null,
          billFrequencyQuantity: this.billingSettings.billFrequencyQuantity
            ? this.billingSettings.billFrequencyQuantity
            : null,
          isInherited:
            this.pageType === 'setfirmlevel' ||
            this.pageType === 'creatematter' ||
            this.pageType === 'client'
              ? false
              : this.billingSettings.isInherited == null && !this.billingSettings.isWorkComplete && this.pageType !== 'editclient'
              ? true
              : this.billingSettings.isInherited,
          isWorkComplete: this.billingSettings.isWorkComplete ? this.billingSettings.isWorkComplete : false,
          billingFrequencyRecursDay: this.billingSettings.billFrequencyRecursOn
            ? this.billingSettings.billFrequencyRecursOn
            : null,
          effectiveDate: null,
          repeatType: this.billingSettings.repeatType
            ? this.billingSettings.repeatType
            : 1,
          billWhenHoliday: this.billingSettings.billWhenHoliday
            ? this.billingSettings.billWhenHoliday
            : 1
        });
        this.selectDay(
          this.billingSettings.billFrequencyDay === 0 ||
            this.billingSettings.billFrequencyDay
            ? this.billingSettings.billFrequencyDay
            : moment().day()
        );
        this.selectedDuration = this.billingSettings.billFrequencyDuration;
        setTimeout(() => {
          this.getNextBillDate(
            this.selectedDuration,
            +this.billingSettings.billFrequencyQuantity,
            this.startDate,
            false
          );
        }, 100);
      }
    }

    if (changes.isFormSubmitted && changes.isFormSubmitted.currentValue) {
      this.next = true;
    }


    if(changes.recall && changes.recall.currentValue){
      this.merchantAccountFilterId = this.searchText = null;
      this.transactionAccountFilterId = [];
      this.getUsioTenantTrustBankAccounts();
    }
    if(changes.opratingaccount && changes.opratingaccount.currentValue == 'View'){
      this.officeBankList = [...this.orgSelectedBankList];
      this.getUsioTenantTrustBankAccounts();
    }
  }

  public setRepeatOn(text) {
    this.recursOnList = [];
    if (text === 2) {
      var name = '';
      for (let i = 1; i <= 31; i++) {
        this.recursOnList.push({
          id: i,
          name: `${UtilsHelper.ordinal_suffix_of_number(i)} of the month`
        });
      }
    } else {
      this.recurringName.map((item, index1) => {
        this.recursOnList.push({
          id: index1 + 1,
          name:
            item +
            ' ' +
            this.repeatsOn[this.selectedDayNumber].name +
            ' of the month'
        });
      });
    }
  }

  private getFrequencyListItem() {
    if(this.billFrequencyList1 && this.billFrequencyList1.length){
      this.billFrequencyList = this.billFrequencyList1;
    } else {
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
  }

  private getNextBillDate(
    billFrequencyDuration: vwIdCodeName,
    billFrequencyQuantity: number,
    lastBillDate: string,
    defaultDate: boolean = true
  ) {
    const days = this.repeatsOn.findIndex(item => item.selected);
    if (days > -1 && billFrequencyDuration) {
      if (billFrequencyDuration.code === 'WEEKS') {
        this.endDate = UtilsHelper.addWeeksForBillPeriod(
          lastBillDate,
          days,
          billFrequencyQuantity
        );
      } else if (
        billFrequencyDuration.code === 'MONTHS' &&
        this.billingSettingsForm.value.billingFrequencyRecursDay
      ) {
        this.endDate = UtilsHelper.addMonthForBillPeriod(
          lastBillDate,
          billFrequencyQuantity,
          days,
          +this.billingSettingsForm.value.billingFrequencyRecursDay
        );
      } else {
      }
      let neDt;
      if (this.billingSettingsForm.value.isInherited) {
        neDt = this.getEffectiveDate(billFrequencyDuration, lastBillDate, days);
      } else {
        neDt = defaultDate
          ? this.getEffectiveDate(billFrequencyDuration, lastBillDate, days)
          : this.billingSettings.billFrequencyNextDate;
      }
      // if (
      //   this.pageType === 'matter' ||
      //   this.pageType === 'client' ||
      //   this.pageType === 'createclient'
      // ) {
      //   neDt = this.endDate;
      // }
      this.sendValue.emit({
        billFrequencyDay: days,
        billFrequencyRecursOn: +this.billingSettingsForm.value
          .billingFrequencyRecursDay,
        billFrequencyStartingDate: this.startDate,
        billFrequencyNextDate: neDt,
        billFrequencyQuantity,
        billFrequencyDuration: billFrequencyDuration.id,
        billFrequencyDurationType: billFrequencyDuration.code,
        isInherited: this.billingSettingsForm.value.isInherited,
        isWorkComplete: this.billingSettingsForm.value.isWorkComplete,

        effectiveDate: neDt,
        effectiveBillFrequencyNextDate: this.getEffectiveDateUpcoming(
          billFrequencyDuration,
          neDt,
          days
        ),
        billingSettings: this.billingSettings,
        repeatType: +this.billingSettingsForm.value.repeatType,
        billWhenHoliday: +this.billingSettingsForm.value.billWhenHoliday
      });
      if (this.pageType === 'createoffice') {
        let selectedDate = neDt;
        this.displayCurrentPrd(selectedDate, days, billFrequencyDuration, billFrequencyQuantity);
        this.billingSettingsForm.controls.effectiveDate.setValue(new Date(selectedDate));
      // } else if (this.pageType === 'creatematter' || this.pageType === 'client' || this.pageType === 'createclient') {
      //   const selectedDate = neDt;
      //   this.displayCurrentPrd(
      //     selectedDate,
      //     days,
      //     billFrequencyDuration,
      //     billFrequencyQuantity
      //   );
      //   this.billingSettingsForm.controls.effectiveDate.setValue(
      //     new Date(selectedDate)
      //   );
      } else {
        this.displayCurrentPrd(neDt, days, billFrequencyDuration, billFrequencyQuantity);
        this.billingSettingsForm.controls.effectiveDate.setValue(
          new Date(neDt)
        );
      }
    }
  }

  private getEffectiveDate(billFrequencyDuration, lastBillDate, days) {
    if (billFrequencyDuration.code === 'WEEKS') {
      return UtilsHelper.addWeeksForBillPeriod(lastBillDate, days, 1);
    } else if (
      billFrequencyDuration.code === 'MONTHS' &&
      this.billingSettingsForm.value.billingFrequencyRecursDay
    ) {
      if (+this.billingSettingsForm.value.repeatType === 2) {
        return UtilsHelper.getNextmonthDate(
          lastBillDate,
          1,
          days,
          +this.billingSettingsForm.value.billingFrequencyRecursDay
        );
      } else {
        return UtilsHelper.addMonthForBillPeriod(
          lastBillDate,
          1,
          days,
          +this.billingSettingsForm.value.billingFrequencyRecursDay
        );
      }
    }
  }

  private getEffectiveDateUpcoming(billFrequencyDuration, lastBillDate, days) {
    if (billFrequencyDuration.code === 'WEEKS') {
      return UtilsHelper.addWeeksForBillPeriod(
        lastBillDate,
        days,
        +this.billingSettingsForm.value.billFrequencyQuantity
      );
    } else if (billFrequencyDuration.code === 'MONTHS') {
      return UtilsHelper.addMonthForBillPeriod(
        lastBillDate,
        +this.billingSettingsForm.value.billFrequencyQuantity,
        days,
        +this.billingSettingsForm.value.billingFrequencyRecursDay
      );
    }
  }

  public defaultInharitChange(event) {
    this.selectService.newSelection('clicked!');
    const settings = this.billingSettingsForm.value.isInherited
      ? this.billingSettingsTenent
      : this.billingSettings;
    this.selectDay(
      settings.billFrequencyDay === 0 || settings.billFrequencyDay
        ? settings.billFrequencyDay
        : moment().day()
    );
    this.billingSettingsForm.patchValue({
      billFrequencyDuration: settings.billFrequencyDuration.id,
      billFrequencyQuantity: settings.billFrequencyQuantity,
      billingFrequencyRecursDay: settings.billFrequencyRecursOn,
      billWhenHoliday: (this.billingSettingsForm.value.isInherited) ? settings.billWhenHoliday : 1,
      repeatType: settings.repeatType,
      isWorkComplete: false
    });
    this.selectedDuration = settings.billFrequencyDuration;
    this.getNextBillDate(
      this.selectedDuration,
      +settings.billFrequencyQuantity,
      this.startDate
    );
    this.setRepeatOn(this.billingSettingsForm.value.repeatType);
    this.selectedRecursDay = this.recursOnList.find(
      item =>
        item.id == +this.billingSettingsForm.value.billingFrequencyRecursDay
    );
  }

  public onSelectRecursDay(event) {
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
    this.selectedDuration = event;
    if (this.selectedDuration && this.selectedDuration.code === 'MONTHS') {
      this.billingSettingsForm.patchValue({
        repeatType: 1,
        billingFrequencyRecursDay: null
      });
    } else {
      this.billingSettingsForm.patchValue({ billingFrequencyRecursDay: null });
      this.billingSettingsForm
        .get('billingFrequencyRecursDay')
        .markAsUntouched();
    }
    this.getNextBillDate(
      this.selectedDuration,
      +this.billingSettingsForm.value.billFrequencyQuantity,
      this.startDate
    );
  }

  public selectDay(index: number) {
    this.selectService.newSelection('clicked!');
    this.repeatsOn.map(item => (item.selected = false));
    this.repeatsOn[index].selected = true;
    this.selectedDay = this.repeatsOn[index].name;
    this.selectedDayNumber = index;
    this.setRepeatOn(this.billingSettingsForm.value.repeatType);
    this.selectedRecursDay = this.recursOnList.find(
      item =>
        item.id == +this.billingSettingsForm.value.billingFrequencyRecursDay
    );
    this.getNextBillDate(
      this.selectedDuration,
      +this.billingSettingsForm.value.billFrequencyQuantity,
      this.startDate
    );
  }

  public emitValue() {
    if (this.billingSettingsForm.value.isWorkComplete) {
      this.sendValue.emit({
        billFrequencyDay: null,
        billFrequencyRecursOn: null,
        billFrequencyStartingDate: null,
        billFrequencyNextDate: null,
        billFrequencyQuantity: null,
        billFrequencyDuration: null,
        billFrequencyDurationType: null,
        isInherited: false,
        isWorkComplete: true,
        effectiveDate: new Date(),
        effectiveBillFrequencyNextDate: null,
        billingSettings: this.billingSettings,
        repeatType: null,
        billWhenHoliday: null
      });
    } else {
      this.sendValue.emit({
        billFrequencyDay: this.selectedDayNumber,
        billFrequencyRecursOn: +this.billingSettingsForm.value
          .billingFrequencyRecursDay,
        billFrequencyStartingDate: this.startDate,
        billFrequencyNextDate: this.billingSettingsForm.value.effectiveDate,
        billFrequencyQuantity: +this.billingSettingsForm.value
          .billFrequencyQuantity,
        billFrequencyDuration: +this.selectedDuration.id,
        billFrequencyDurationType: this.selectedDuration.code,
        isInherited: this.billingSettingsForm.value.isInherited,
        isWorkComplete: this.billingSettingsForm.value.isWorkComplete,
        effectiveDate: this.billingSettingsForm.value.effectiveDate,
        effectiveBillFrequencyNextDate: this.getEffectiveDateUpcoming(
          this.selectedDuration,
          this.billingSettingsForm.value.effectiveDate,
          this.repeatsOn.findIndex(item => item.selected)
        ),
        billingSettings: this.billingSettings,
        repeatType: +this.billingSettingsForm.value.repeatType,
        billWhenHoliday: +this.billingSettingsForm.value.billWhenHoliday
      });
    }
  }

  public selectDate() {
    this.emitValue();
    const days = this.repeatsOn.findIndex(item => item.selected);
    this.displayCurrentPrd(
      this.billingSettingsForm.value.effectiveDate,
      days,
      this.selectedDuration,
      +this.billingSettingsForm.value.billFrequencyQuantity
    );
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
      let weekDayNumbe = +this.billingSettingsForm.value
        .billingFrequencyRecursDay;
      if (+this.billingSettingsForm.value.repeatType === 2) {
        let totalDays = moment(d).daysInMonth();
        if (totalDays < weekDayNumbe) {
          weekDayNumbe = totalDays;
        }
        return +moment(d).format('DD') === weekDayNumbe;
      } else {
        if (+this.billingSettingsForm.value.billingFrequencyRecursDay === 5) {
          if (
            weekDayNumbe === 5 &&
            UtilsHelper.getAmountOfWeekDaysInMonth(
              moment(d).startOf('month'),
              this.selectedDayNumber
            ) !== 5
          ) {
            weekDayNumbe = UtilsHelper.getAmountOfWeekDaysInMonth(
              moment(d).startOf('month'),
              this.selectedDayNumber
            );
          }
        }
        return (
          day === this.selectedDayNumber && this.weekAndDay(d) === weekDayNumbe
        );
      }
    } else {
      return false;
    }
  };

  public weekAndDay(date) {
    let day = date.getDate();
    day = day % 7 == 0 ? day - 1 : day;
    const prefixes = ['1', '2', '3', '4', '5'];
    return +prefixes[0 | (day / 7)];
  }

  public displayName(item) {
    const name = item ? item.name : '';
    return this.billingSettingsForm.value.billFrequencyQuantity === 1
      ? name.slice(0, -1)
      : name;
  }

  private getBillingSettings() {
    this.loading = true;
    let observal = this.billingService.v1BillingSettingsTenantTenantIdGet({
      tenantId: this.userDetils.tenantId
    });
    if (
      (this.pageType === 'matter' ||
        this.pageType === 'client' ||
        this.pageType === 'editmatter' || this.pageType === 'editclient') &&
      this.officeId
    ) {
      observal = this.billingService.v1BillingSettingsOfficeOfficeIdGet({
        officeId: this.officeId
      });
    }
    observal
      .pipe(
        map(res => {
          return JSON.parse(res as any).results[0] as IBillingSettings;
        }),
        finalize(() => {})
      )
      .subscribe(
        billingSettings => {
          if (billingSettings) {
            this.billingSettingsTenent = billingSettings;
          } else {
            this.billingSettingsTenent = {};
          }
          this.loading = false;
        },
        () => {
          this.loading = false;
        }
      );
  }

  private displayCurrentPrd(
    selectedDate,
    days,
    billFrequencyDuration,
    billFrequencyQuantity
  ) {
    const data = {
      billFrequencyDurationType: billFrequencyDuration.code,
      billFrequencyDay: days,
      billFrequencyQuantity,
      billFrequencyRecursOn: +this.billingSettingsForm.value
        .billingFrequencyRecursDay,
      repeatType: +this.billingSettingsForm.value.repeatType
    };
    const effectivePeriod = UtilsHelper.getFinalEffectiveDate(
      moment(selectedDate).format('MM/DD/YYYY'),
      data
    );
    this.displayStartDate = moment(effectivePeriod.previosEffectiveDate).format(
      'MM/DD/YYYY'
    );
    this.displayEndDate = moment(effectivePeriod.newEffectiveDate).format(
      'MM/DD/YYYY'
    );
  }

  clearFilter() {
    this.transactionAccountFilterId = [];
    this.transactionAccountFilterList.filter(obj => {
      return obj['checked'] = false;
    });
    this.title = 'All';
    this.officeBankList = [...this.originalOfficeBankList];
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.officeBankList) {
      return this.officeBankList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
  editOperatingAccount(){
    this.officeBankList = this.originalOfficeBankList;
    this.updateDatatableFooterPage()
  }
}
