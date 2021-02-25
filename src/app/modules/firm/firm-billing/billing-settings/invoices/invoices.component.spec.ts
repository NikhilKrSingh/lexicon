import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SharedModule } from 'src/app/modules/shared/shared.module';

import { InvoicesComponent } from './invoices.component';

let billingSettingMock = {
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
};

describe('InvoicesComponent', () => {
  let component: InvoicesComponent;
  let fixture: ComponentFixture<InvoicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule
      ],
      declarations: [ InvoicesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set day to pay invoice value', async(() => {
    component.billingSettings = billingSettingMock;
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      let dayText = fixture.debugElement.query(By.css('#day-text'));
      expect(dayText.nativeElement.value).toBe('10');
    });
  }));
});
