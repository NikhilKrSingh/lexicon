import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from 'src/app/modules/shared/shared.module';

import { TimeEntryGracePeriodComponent } from './time-entry-grace-period.component';
import * as _ from 'lodash';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { By } from '@angular/platform-browser';

let billingSettingMock = {
  "billingSettings": {
    "currentValue": {
      "id": 59,
      "office": null,
      "person": null,
      "matter": null,
      "tenant": {
        "id": 1006,
        "name": "Flash 1.0"
      },
      "billFrequencyQuantity": 1,
      "billFrequencyDuration": {
        "id": 21,
        "code": "MONTHS",
        "name": "Months",
        "email": null,
        "primaryPhone": null,
        "uniqueNumber": 0
      },
      "billFrequencyDay": 5,
      "billFrequencyRecursOn": 15,
      "isInherited": null,
      "billFrequencyStartingDate": "2020-11-13T00:00:00",
      "billFrequencyNextDate": "2020-11-13T00:00:00",
      "effectiveBillFrequencyQuantity": null,
      "effectiveBillFrequencyDuration": null,
      "effectiveBillFrequencyDay": null,
      "effectiveBillFrequencyRecursOn": null,
      "effectiveIsInherited": null,
      "effectiveBillFrequencyStartingDate": null,
      "effectiveBillFrequencyNextDate": "2020-12-31T00:00:00",
      "repeatType": 2,
      "billWhenHoliday": 3,
      "effectiveRepeatType": null,
      "effectiveMonthlyRecursOn": null,
      "effectiveBillWhenHoliday": null,
      "daysToPayInvoices": 10,
      "timeEntryGracePeriod": 0,
      "timeEntryGracePeriodAt": "2020-11-20T00:00:00+00:00",
      "timeRoundingInterval": 7,
      "timeDisplayFormat": 1,
      "invoiceDelivery": {
        "id": 23,
        "code": "ELECTRONIC",
        "name": "Electronic Only",
        "email": null,
        "primaryPhone": null,
        "uniqueNumber": 0
      },
      "isFixedAmount": null,
      "fixedAmount": null,
      "minimumTrustBalance": null,
      "paymentPlans": false,
      "fixedFeeIsFullAmount": null,
      "fixedFeeAmountToPay": null,
      "fixedFeeRemainingAmount": null,
      "fixedFeeDueDate": null,
      "fixedFeeBillOnWorkComplete": null,
      "invoiceAddressId": null,
      "isWorkComplete": null,
      "invoiceTemplateId": 24,
      "receiptTemplateId": 6,
      "operatingRoutingNumber": "122105155",
      "operatingAccountNumber": "231453645676",
      "changeNotes": "1 week",
      "needToUpdateChildRecords": true
    },
    "firstChange": true
  },
  "editBillUpcoming": {
    "currentValue": false,
    "firstChange": true
  },
  "editBill": {
    "currentValue": false,
    "firstChange": true
  },
  "isFormSubmitted": {
    "currentValue": false,
    "firstChange": true
  },
  "notIsEdit": {
    "currentValue": true,
    "firstChange": true,
    "previousValue": undefined
  }
};

describe('TimeEntryGracePeriodComponent', () => {
  let component: TimeEntryGracePeriodComponent;
  let fixture: ComponentFixture<TimeEntryGracePeriodComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule
      ],
      declarations: [ TimeEntryGracePeriodComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeEntryGracePeriodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('input property should set date and time on ngOnInIt', () => {
    component.billingSettings = billingSettingMock.billingSettings.currentValue;
    spyOn(UtilsHelper, 'getworkingHoursFormat').and.callThrough();
    spyOn(component.enableDisabledTimeEntryButton, 'emit').and.callThrough();

    component.ngOnInit();

    expect(UtilsHelper.getworkingHoursFormat).toHaveBeenCalled();
    expect(component.todayDate).toBe('2020-11-20');
    expect(component.isAM).toBe(true);
    expect(component.hour).toBe('00');
    expect(component.minutes).toBe('00');
    expect(component.enableDisabledTimeEntryButton.emit).toHaveBeenCalledWith(true);
  });

  it('timeEntryGracePeriodAt null should set default current date time', () => {
    let billingsettings = _.cloneDeep(billingSettingMock.billingSettings.currentValue);
    billingsettings.timeEntryGracePeriodAt = null;
    component.billingSettings = billingsettings;
    spyOn(component, 'setEntryGraceVal').and.callThrough();
    spyOn(component.enableDisabledTimeEntryButton, 'emit').and.callThrough();

    component.ngOnInit();

    expect(component.setEntryGraceVal).toHaveBeenCalled();
    expect(component.enableDisabledTimeEntryButton.emit).toHaveBeenCalledWith(true);
  });

  it('isEdit false should disable fields', async(() => {
    component.billingSettings = billingSettingMock.billingSettings.currentValue;
    component.isEdit = false;

    fixture.detectChanges();

    let daysField = fixture.debugElement.query(By.css('#days-text'));
    let hourField = fixture.debugElement.query(By.css('#end-time'));
    let minutes = fixture.debugElement.query(By.css('#end-time-two'));
    fixture.whenStable().then(() => {
      expect(daysField.nativeElement.disabled).toBe(true);
      expect(hourField.nativeElement.disabled).toBe(true);
      expect(minutes.nativeElement.disabled).toBe(true);
    });
  }));

  it('checknumber function should called while entered days', () => {
    component.billingSettings = billingSettingMock.billingSettings.currentValue;
    component.isEdit = true;
    spyOn(component, 'checkNumber').and.callThrough();

    fixture.detectChanges();

    let daysField = fixture.debugElement.query(By.css('#days-text'));
    daysField.nativeElement.value = 5;
    daysField.nativeElement.dispatchEvent(new KeyboardEvent('keypress', { key: '5' }))
    expect(component.checkNumber).toHaveBeenCalled();
  });

  it('checknumber function should called while entered days', () => {
    component.billingSettings = billingSettingMock.billingSettings.currentValue;
    component.isEdit = true;
    spyOn(component, 'checkNumber').and.callThrough();

    fixture.detectChanges();

    let daysField = fixture.debugElement.query(By.css('#days-text'));
    daysField.nativeElement.value = 5;
    daysField.nativeElement.dispatchEvent(new KeyboardEvent('keypress', { key: '5' }))
    expect(component.checkNumber).toHaveBeenCalled();
  });

  it('edit icon click should enable editing and emit values', () => {
    component.isEdit = false;
    spyOn(component, 'edit').and.callThrough();
    spyOn(component.enableDisabledTimeEntryButton, 'emit').and.callThrough();

    fixture.detectChanges();

    let edit = fixture.debugElement.query(By.css('#edit-click'));
    edit.nativeElement.dispatchEvent(new Event('click'));

    expect(component.edit).toHaveBeenCalled();
    expect(component.enableDisabledTimeEntryButton.emit).toHaveBeenCalledWith(false);
  });

  it('change hour up should set value', () => {
    spyOn(component, 'changeHour').and.callThrough();
    spyOn(component, 'onTimeChange').and.callThrough();
    spyOn(component, 'setEntryGraceVal').and.callThrough();

    let hourChangeUp = fixture.debugElement.queryAll(By.css('.up-spin'));
    hourChangeUp[0].nativeElement.dispatchEvent(new Event('click'));

    expect(component.changeHour).toHaveBeenCalled();
    expect(component.hour).toBe(12);
    expect(component.onTimeChange).toHaveBeenCalledWith('hour');
    expect(component.setEntryGraceVal).toHaveBeenCalled();
  });

  it('change hour down should set value', () => {
    spyOn(component, 'changeHour').and.callThrough();
    spyOn(component, 'onTimeChange').and.callThrough();
    spyOn(component, 'setEntryGraceVal').and.callThrough();

    let hourChangeDown = fixture.debugElement.queryAll(By.css('.down-spin'));
    hourChangeDown[0].nativeElement.dispatchEvent(new Event('click'));
    hourChangeDown[0].nativeElement.dispatchEvent(new Event('click'));

    expect(component.changeHour).toHaveBeenCalled();
    expect(component.hour).toBe('09');
    expect(component.onTimeChange).toHaveBeenCalledWith('hour');
    expect(component.setEntryGraceVal).toHaveBeenCalled();
  });

  it('change minutes up should set value', () => {
    component.minutes = '55';
    spyOn(component, 'changeMinute').and.callThrough();
    spyOn(component, 'onTimeChange').and.callThrough();
    spyOn(component, 'setEntryGraceVal').and.callThrough();

    fixture.detectChanges();

    let minuteChangeUp = fixture.debugElement.queryAll(By.css('.up-spin'));
    minuteChangeUp[1].nativeElement.dispatchEvent(new Event('click'));
    expect(component.changeMinute).toHaveBeenCalled();
    expect(component.minutes).toBe(56);
    expect(component.onTimeChange).toHaveBeenCalledWith('minutes');
    expect(component.setEntryGraceVal).toHaveBeenCalled();
  });

  it('change minutes up should set value', () => {
    spyOn(component, 'changeMinute').and.callThrough();
    spyOn(component, 'onTimeChange').and.callThrough();
    spyOn(component, 'setEntryGraceVal').and.callThrough();

    let minuteChangeDown = fixture.debugElement.queryAll(By.css('.down-spin'));
    minuteChangeDown[1].nativeElement.dispatchEvent(new Event('click'));

    expect(component.changeMinute).toHaveBeenCalled();
    expect(component.minutes).toBe(58);
    expect(component.onTimeChange).toHaveBeenCalledWith('minutes');
    expect(component.setEntryGraceVal).toHaveBeenCalled();
  });

  it('click on am should set value', () => {
    component.isEdit = true;
    spyOn(component, 'setEntryGraceVal').and.callThrough();
    fixture.detectChanges();

    let amBtn = fixture.debugElement.queryAll(By.css('#set-am'));
    amBtn[0].nativeElement.dispatchEvent(new Event('click'));

    expect(component.setEntryGraceVal).toHaveBeenCalled();
    expect(component.isAM).toBe(true);
  });

  it('ngOnChange should set edit mode', () => {
    component.ngOnChanges(billingSettingMock);
    fixture.detectChanges();
    expect(component.isEdit).toBe(false);
  });
});
