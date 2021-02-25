import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StoreModule } from '@ngrx/store';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { reducers } from 'src/app/store';
import * as _ from 'lodash';
import { BillGenFrequencyComponent } from './bill-gen-frequency.component';
import { DialogService } from 'src/app/modules/shared/dialog.service';

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
  }
};

let billPeriodMock = {
  "billFrequencyDay": 5,
  "billFrequencyRecursOn": 15,
  "billFrequencyStartingDate": "11/20/2020",
  "billFrequencyQuantity": 1,
  "billFrequencyDurationType": "",
  "isInherited": false,
  "billingSettings": {
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
  "repeatType": 2,
  "billWhenHoliday": 3
};


describe('BillGenFrequencyComponent', () => {
  let component: BillGenFrequencyComponent;
  let fixture: ComponentFixture<BillGenFrequencyComponent>;
  let dialogService: DialogService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        HttpClientTestingModule,
        StoreModule.forRoot(reducers),
      ],
      declarations: [ BillGenFrequencyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BillGenFrequencyComponent);
    dialogService = TestBed.get(DialogService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnChange should set billing setting property', () => {
    spyOn(UtilsHelper, 'getDayslistn').and.callThrough();
    spyOn(component, 'setValue').and.callThrough();

    component.ngOnChanges(billingSettingMock);
    fixture.detectChanges();

    expect(component.billFrequencyDurationName).toBe('Month');
    expect(UtilsHelper.getDayslistn).toHaveBeenCalled();
    expect(component.billFrequencyDayObj).toEqual({ value: 5, name: 'Friday' });
    expect(component.setValue).toHaveBeenCalledWith(null, 'settings');
    expect(component.setValue).toHaveBeenCalledTimes(2);
    expect(component.billFrequencyEndDate).toBeUndefined();
  });

  it('edit billing click should emit value', () => {
    spyOn(component.editBillFreq, 'emit').and.callThrough();
    component.billingSettings = billingSettingMock.billingSettings.currentValue;
    fixture.detectChanges();

    let editBilling = fixture.debugElement.query(By.css('#edit-billing'));
    editBilling.nativeElement.click();

    expect(component.editBillFreq.emit).toHaveBeenCalledWith('basic');
    expect(component.editBill).toBe(true);
  });

  it('edit upcoming function should emit value', () => {
    spyOn(component.editBillFreq, 'emit').and.callThrough();

    component.editUpcoming();

    expect(component.editBillUpcoming).toBe(true);
    expect(component.showUpcoming).toBe(true);
    expect(component.editBillFreq.emit).toHaveBeenCalledWith('upcoming');
  });

  it('remove upcoming function should display confirm dialog emit value', fakeAsync (() => {
    spyOn(dialogService, 'confirm').and.returnValue(Promise.resolve(true));
    spyOn(component.removeUpcomingFreq, 'emit').and.callThrough();

    component.removeUpcoming();
    tick(1);

    expect(dialogService.confirm).toHaveBeenCalledWith('Are you sure you want to delete the upcoming billing frequency settings at the firm level? This will leave the current settings active.',
    'Yes, delete upcoming changes',
    'Cancel',
    'Delete Upcoming Changes',
    true);
    expect(component.removeUpcomingFreq.emit).toHaveBeenCalledWith(true);
    flush();
  }));

  it('get billing period data should emit data', () => {
    spyOn(component, 'setValue').and.callThrough();
    spyOn(component.sendValue, 'emit').and.callThrough();

    component.getValue(billPeriodMock);

    expect(component.setValue).toHaveBeenCalled();
    expect(component.sendValue.emit).toHaveBeenCalledWith(billPeriodMock);
  });
});
