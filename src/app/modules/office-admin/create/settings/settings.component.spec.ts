import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { reducers } from 'src/app/store';
import { BillingService, TenantService } from 'src/common/swagger-providers/services';
import { OfficeAdminBillingComponent } from '../../billing/billing.component';
import { SettingsComponent } from './settings.component';

const billingSettingMock = JSON.stringify({
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDM4NjM3NDIsImV4cCI6MTYwMzkwNjk0MiwiaWF0IjoxNjAzODYzNzQyfQ.z0eihFBBU6UXzIthYKxXD5SlLsiwQpM2umE6c8kph_4",
  "results": [
    {
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
      "billFrequencyStartingDate": "2020-10-15T00:00:00",
      "billFrequencyNextDate": "2020-10-15T00:00:00",
      "effectiveBillFrequencyQuantity": null,
      "effectiveBillFrequencyDuration": null,
      "effectiveBillFrequencyDay": null,
      "effectiveBillFrequencyRecursOn": null,
      "effectiveIsInherited": null,
      "effectiveBillFrequencyStartingDate": null,
      "effectiveBillFrequencyNextDate": "2020-10-09T00:00:00",
      "repeatType": 2,
      "billWhenHoliday": 3,
      "effectiveRepeatType": null,
      "effectiveMonthlyRecursOn": null,
      "effectiveBillWhenHoliday": null,
      "daysToPayInvoices": 10,
      "timeEntryGracePeriod": 0,
      "timeEntryGracePeriodAt": "2020-10-28T00:00:00+00:00",
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
      "needToUpdateChildRecords": false
    }
  ]
});

const holiDayMock = JSON.stringify({
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDM4NjM3NDIsImV4cCI6MTYwMzkwNjk0MiwiaWF0IjoxNjAzODYzNzQyfQ.z0eihFBBU6UXzIthYKxXD5SlLsiwQpM2umE6c8kph_4",
  "results": [
    {
      "id": 159,
      "tenantId": 1006,
      "name": "New Year's Day",
      "date": "2020-01-01T00:00:00"
    },
    {
      "id": 160,
      "tenantId": 1006,
      "name": "Martin Luther King Jr. Day",
      "date": "2020-01-20T00:00:00"
    },
    {
      "id": 161,
      "tenantId": 1006,
      "name": "Presidents' Day",
      "date": "2020-02-17T00:00:00"
    }
  ]
});


const calendarSettingMock = JSON.stringify({
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDM4NjM3NDIsImV4cCI6MTYwMzkwNjk0MiwiaWF0IjoxNjAzODYzNzQyfQ.z0eihFBBU6UXzIthYKxXD5SlLsiwQpM2umE6c8kph_4",
    "results": {
      "id": 2,
      "tenantId": 1006,
      "mondayOpenHours": "2020-10-28T07:00:00+00:00",
      "mondayCloseHours": "2020-10-28T15:00:00+00:00",
      "tuesdayOpenHours": "2020-10-28T09:30:00+00:00",
      "tuesdayCloseHours": "2020-10-28T17:00:00+00:00",
      "wednesdayOpenHours": "2020-10-28T01:00:00+00:00",
      "wednesdayCloseHours": "2020-10-28T17:00:00+00:00",
      "thursdayOpenHours": "2020-10-28T02:00:00+00:00",
      "thursdayCloseHours": "2020-10-28T16:30:00+00:00",
      "fridayOpenHours": "2020-10-28T09:30:00+00:00",
      "fridayCloseHours": "2020-10-28T19:30:00+00:00",
      "saturdayOpenHours": "2020-10-28T00:00:00+00:00",
      "saturdayCloseHours": "2020-10-28T00:00:00+00:00",
      "sundayOpenHours": "2020-10-28T00:00:00+00:00",
      "sundayCloseHours": "2020-10-28T00:00:00+00:00",
      "calendarPlatforms": null
    }
});

const opratingAccountsMock = [
  {
    "id": 0,
    "usioBankAccountId": 31,
    "name": "yusuf pathan",
    "isMerchantAccount": true,
    "isCreditCardAccount": true,
    "isAchAccount": true,
    "nonMerchantAccountNumber": null,
    "merchantAccountNumber": "testSettlementAN",
    "lastTransactionDate": "2020-10-07T13:23:16.577",
    "isSelected": false,
    "status": null
  },
  {
    "id": 0,
    "usioBankAccountId": 11,
    "name": "eleven",
    "isMerchantAccount": false,
    "isCreditCardAccount": null,
    "isAchAccount": null,
    "nonMerchantAccountNumber": null,
    "merchantAccountNumber": null,
    "lastTransactionDate": "2020-10-15T10:11:02.867",
    "isSelected": false,
    "status": null
  }
];

const billingSettingsMock = {
  "billFrequencyDay": 5,
  "billFrequencyRecursOn": 15,
  "billFrequencyStartingDate": "2020-11-15",
  "billFrequencyNextDate": "2020-12-15",
  "billFrequencyQuantity": 1,
  "billFrequencyDuration": 21,
  "billFrequencyDurationType": "MONTHS",
  "isInherited": true,
  "effectiveDate": "2020-11-15",
  "effectiveBillFrequencyNextDate": "03/12/2021",
  "billingSettings": {},
  "repeatType": 2,
  "billWhenHoliday": 3
};

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let billingService: BillingService;
  let tenantService: TenantService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        StoreModule.forRoot(reducers),
        SharedModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
      ],
      declarations: [
        SettingsComponent,
        OfficeAdminBillingComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsComponent);
    billingService = TestBed.get(BillingService);
    tenantService = TestBed.get(TenantService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  beforeAll(() => {
    const storeLocal = {
      "tenantTier": {
        "tierLevel": 2,
        "tierName": "Ascending"
      },
      "id": 1304,
      "userName": "adminLex@yopmail.com",
      "password": "1otYec3T5BXeGjL8X6zgcDhVNhk32rlfbuEOwATQoSE=",
      "tenantId": 1006,
      "officeId": 5,
      "salutation": null,
      "companyName": null,
      "firstName": "Admin",
      "middleName": "",
      "lastName": "Lexicon dev",
      "suffix": null,
      "email": "adminLex@yopmail.com",
      "maidenName": "",
      "nickName": "",
      "commonName": "",
      "jobTitle": "Tenant Admin",
      "primaryPhone": null,
      "cellPhone": null,
      "fax": null,
      "employmentStartDate": null,
      "employmentEndDate": null,
      "primaryContactId": null,
      "addressId": null,
      "isCompany": false,
      "role": null,
      "preferredContactMethod": null,
      "uniqueNumber": 0,
      "isVisible": true,
      "isArchived": false,
      "groups": [
        {
          "id": 179,
          "name": "TenantAdmin"
        },
        {
          "id": 180,
          "name": "Responsible Attorney"
        },
        {
          "id": 181,
          "name": "Originating Attorney"
        },
        {
          "id": 193,
          "name": "Attorney"
        },
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 195,
          "name": "Billing Attorney"
        },
        {
          "id": 294,
          "name": "Consult Attorney"
        },
        {
          "id": 361,
          "name": "Admin Setting TC1"
        }
      ]
    };
    UtilsHelper.setObject('profile', storeLocal);
  });

  afterEach(() => {
    localStorage.removeItem('office');
  });

  afterAll(() =>  {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getBillingListItem by tenantId should called in ngOnInIt', () => {
    spyOn(billingService, 'v1BillingSettingsTenantTenantIdGet').and.returnValue(of(billingSettingMock as any));

    component.ngOnInit();

    expect(component.billingSettings.id).toBe(59);
    expect(component.settingForm.value.timeEntryRounding).toBe(7);
  });

  it('getOfficeHoliday should be called in ngOnInIt', () => {
    spyOn(tenantService, 'v1TenantHolidayGet').and.returnValue(of(holiDayMock as any));
    spyOn(component, 'calcTotalPages');

    component.ngOnInit();

    expect(component.officeHolidayList.length).toBe(3);
    expect(component.calcTotalPages).toHaveBeenCalled();
  });

  it('getHolidaysAndWorkingHours should be called in ngOnInIt', () => {
    spyOn(tenantService, 'v1TenantCalendarSettingsGet').and.returnValue(of(calendarSettingMock as any));
    component.ngOnInit();

    expect(component.settingForm.value.mondayOpen).toContain('07:00:00');
  });

  it('getOpratingAccountsDetails event should set operating account', () => {
    component.getOpratingAccountsDetails(opratingAccountsMock);

    expect(component.opratingAccounts.length).toBe(2);
  });

  it('click next save object to localStorage', () => {
    component.opratingAccounts = opratingAccountsMock;
    component.billFrequencySetting = billingSettingsMock;

    component.next();

    const localData = UtilsHelper.getObject('office');
    expect(component.formSubmitted).toBe(true);
    expect(localData.settings.billFrequencyNextDate).toContain('2020-12-15');
    expect(localData.settings.billFrequencyDuration).toBe(21);
    expect(localData.settings.billFrequencyDurationType).toContain('MONTH');
    expect(localData.settings.billFrequencyQuantity).toBe(1);
    expect(localData.settings.billFrequencyRecursOn).toBe(15);
    expect(localData.settings.isInherited).toBe(true);
    expect(localData.settings.officeDisbursementTypeList.length).toBe(0);
    expect(localData.settings.officeHolidayList.length).toBe(0);
    expect(localData.settings.officeRateList.length).toBe(0);
    expect(localData.settings.opratingAccounts.length).toBe(2);
    expect(localData.settings.timeEntryRounding).toBe(0);
  });
});
