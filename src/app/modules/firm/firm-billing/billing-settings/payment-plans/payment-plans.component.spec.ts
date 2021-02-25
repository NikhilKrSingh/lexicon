import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { SelectService } from 'src/app/service/select.service';

import { PaymentPlansComponent } from './payment-plans.component';

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
  "paymentPlans": null,
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

describe('PaymentPlansComponent', () => {
  let component: PaymentPlansComponent;
  let fixture: ComponentFixture<PaymentPlansComponent>;
  let selectService: SelectService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports:[
        SharedModule
      ],
      declarations: [ PaymentPlansComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentPlansComponent);
    selectService = TestBed.get(SelectService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInIt if paymentplan null should default selected no', async(() => {
    component.billingSettings = billingSettingMock;

    component.ngOnInit();
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      let checked = fixture.debugElement.query(By.css('#no'));
      expect(checked.nativeElement.checked).toBe(true);
      expect(component.billingSettings.paymentPlans).toBe(false);
    });
  }));

  it('paymentplan select yes should set value true', async(() => {
    component.billingSettings = billingSettingMock;
    spyOn(component, 'paymentChange').and.callThrough();
    spyOn(selectService, 'newSelection').and.callThrough();
    fixture.detectChanges();

    let checked = fixture.debugElement.query(By.css('#yes'));
    checked.nativeElement.dispatchEvent(new Event('change'));

    fixture.detectChanges();
    fixture.whenStable().then(() => {
      expect(component.billingSettings.paymentPlans).toBe(true);
      expect(component.paymentChange).toHaveBeenCalled();
      expect(selectService.newSelection).toHaveBeenCalledWith('clicked!');
    });
  }));

});
