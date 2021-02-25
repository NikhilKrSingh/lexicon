import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule } from 'ngx-toastr';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { BillGenFrequencyComponent } from './bill-gen-frequency/bill-gen-frequency.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { OperatingAccountComponent } from './operating-account/operating-account.component';
import { PaymentPlansComponent } from './payment-plans/payment-plans.component';

import { BillingSettingsComponent } from './settings.component';
import { TimeEntryGracePeriodComponent } from './time-entry-grace-period/time-entry-grace-period.component';
import { TimeRoudingIntervalComponent } from './time-rouding-interval/time-rouding-interval.component';
import * as _ from 'lodash';
import { BillingService, TenantService } from 'src/common/swagger-providers/services';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { reducers } from 'src/app/store';
import { DialogService } from 'src/app/modules/shared/dialog.service';

let profileMock = {
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

let firmDetailsMock = {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDYxOTU0NzEsImV4cCI6MTYwNjIzODY3MSwiaWF0IjoxNjA2MTk1NDcxfQ.H9aLSZk7k1iIA70sz3pZARVZr8l8G7zGprpQJ6zdii8",
    "results": {
      "id": 1006,
      "name": "Flash 1.0",
      "appName": "https://sc1.lexiconservices.com/",
      "guid": "dcb04bbb-c123-485b-833b-33028ed12ced",
      "primaryContactId": null,
      "createdBy": 8,
      "createdAt": "2019-12-24T05:54:33.28",
      "updatedBy": 8226,
      "lastUpdated": "2020-11-23T11:15:27.987",
      "isActive": true,
      "office": []
    }
};

let billingSettingsMock = {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDYxOTU0NzEsImV4cCI6MTYwNjIzODY3MSwiaWF0IjoxNjA2MTk1NDcxfQ.H9aLSZk7k1iIA70sz3pZARVZr8l8G7zGprpQJ6zdii8",
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
        "timeEntryGracePeriodAt": "2020-11-24T00:00:00+00:00",
        "timeRoundingInterval": null,
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
};

let tenantProfileMock = {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDYxOTU0NzEsImV4cCI6MTYwNjIzODY3MSwiaWF0IjoxNjA2MTk1NDcxfQ.H9aLSZk7k1iIA70sz3pZARVZr8l8G7zGprpQJ6zdii8",
    "results": {
      "id": 7,
      "tenantId": 1006,
      "tenantName": "Flash 1.0",
      "esign": null,
      "internalLogo": null,
      "faviconicon": null,
      "timeRoundInterval": null,
      "timeDisplayFormat": null,
      "changeStatusNotes": null,
      "tier": {
        "tierLevel": 2,
        "tierName": "Ascending"
      },
      "logo": null,
      "favicon": null
    }
};

let billingSettingResMock = {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDYxOTU0NzEsImV4cCI6MTYwNjIzODY3MSwiaWF0IjoxNjA2MTk1NDcxfQ.H9aLSZk7k1iIA70sz3pZARVZr8l8G7zGprpQJ6zdii8",
    "results": 59
};

let billPeriodMock = {
    "billFrequencyDay": 5,
    "billFrequencyRecursOn": 0,
    "billFrequencyStartingDate": "11/20/2020",
    "billFrequencyNextDate": "2020-11-13T00:00:00",
    "effectiveDate": "2020-11-13T00:00:00",
    "effectiveBillFrequencyNextDate": "2020-11-13T00:00:00",
    "billFrequencyQuantity": 15,
    "billFrequencyDuration": 15,
    "billFrequencyDurationType": "MONTHS",
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

describe('BillingSettingsComponent', () => {
  let component: BillingSettingsComponent;
  let fixture: ComponentFixture<BillingSettingsComponent>;
  let router: Router;
  let tenantService: TenantService;
  let billingService: BillingService;
  let toastr: ToastDisplay;
  let dialogService: DialogService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        HttpClientTestingModule,
        RouterTestingModule,
        ToastrModule.forRoot({
            closeButton: true
        }),
        BrowserAnimationsModule,
        StoreModule.forRoot(reducers),
      ],
      declarations: [
        BillingSettingsComponent,
        OperatingAccountComponent,
        BillGenFrequencyComponent,
        InvoicesComponent,
        TimeEntryGracePeriodComponent,
        TimeRoudingIntervalComponent,
        PaymentPlansComponent,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BillingSettingsComponent);
    router = TestBed.get(Router);
    tenantService = TestBed.get(TenantService);
    billingService = TestBed.get(BillingService);
    toastr = TestBed.get(ToastDisplay);
    dialogService = TestBed.get(DialogService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInIt should set tabs based on Ascending tenant tier ', () => {
    UtilsHelper.setObject('profile', profileMock);
    spyOn(component, 'setTabsBasedOnTenant').and.callThrough();

    component.ngOnInit();

    expect(component.alltabs.length).toBe(4);
    expect(component.tenantTierName).toContain('Ascending');
    expect(component.setTabsBasedOnTenant).toHaveBeenCalled();
  });

  it('ngOnInIt should set tabs based on Emerging tenant tier ', () => {
    let profileMockEmerging = _.cloneDeep(profileMock);
    profileMockEmerging.tenantTier.tierName = 'Emerging';
    UtilsHelper.setObject('profile', profileMockEmerging);
    spyOn(component, 'setTabsBasedOnTenant').and.callThrough();

    component.ngOnInit();

    expect(component.alltabs.length).toBe(4);
    expect(component.tenantTierName).toContain('Emerging');
    expect(component.setTabsBasedOnTenant).toHaveBeenCalled();
  });

  it('ngOnInIt should set tabs based on Iconic tenant tier ', () => {
    let profileMockIconic = _.cloneDeep(profileMock);
    profileMockIconic.tenantTier.tierName = 'Iconic';
    UtilsHelper.setObject('profile', profileMockIconic);
    spyOn(component, 'setTabsBasedOnTenant').and.callThrough();
    spyOn(tenantService, 'v1TenantGet').and.returnValue(of(JSON.stringify(firmDetailsMock) as any));

    component.ngOnInit();

    expect(component.alltabs.length).toBe(5);
    expect(component.tenantTierName).toContain('Iconic');
    expect(component.setTabsBasedOnTenant).toHaveBeenCalled();
  });

  it('ngOnInIt should called getTenantdetails, getbillingSetting, getTenantProfile, billingSettingsUpdate', () => {
    spyOn(tenantService, 'v1TenantGet').and.returnValue(of(JSON.stringify(firmDetailsMock) as any));
    spyOn(billingService, 'v1BillingSettingsTenantTenantIdGet').and.returnValue(of(JSON.stringify(billingSettingsMock) as any));
    spyOn(tenantService, 'v1TenantProfileGet').and.returnValue(of(JSON.stringify(tenantProfileMock) as any));
    spyOn(billingService, 'v1BillingSettingsPut$Json').and.returnValue(of(JSON.stringify(billingSettingResMock) as any));

    component.ngOnInit();

    expect(billingService.v1BillingSettingsTenantTenantIdGet).toHaveBeenCalledWith({tenantId: 1006});
    expect(component.billingSettings.timeRoundingInterval).toBe(6);
    expect(component.billingSettings.timeEntryGracePeriod).toBe(0);
    expect(component.loading).toBe(false);
  });


  it('ngOnInIt getTenantdetails null should stop loading', () => {
    spyOn(tenantService, 'v1TenantGet').and.returnValue(of(JSON.stringify({results: null, token: 'fake-token'}) as any));

    component.ngOnInit();

    expect(component.loading).toBe(false);
  });

  it('ngOnInIt getTenantdetails throwError should stop loading', () => {
    spyOn(tenantService, 'v1TenantGet').and.returnValue(throwError({error: 'error'}));

    component.ngOnInit();

    expect(component.loading).toBe(false);
  });


  it('ngOnInIt getTenantdetails, getbillingSetting throwError should stop loading', () => {
    spyOn(tenantService, 'v1TenantGet').and.returnValue(of(JSON.stringify(firmDetailsMock) as any));
    spyOn(billingService, 'v1BillingSettingsTenantTenantIdGet').and.returnValue(throwError({error: 'error'}));

    component.ngOnInit();

    expect(component.loading).toBe(false);
  });

  it('ngOnInIt should called getTenantdetails, getbillingSetting, getTenantProfile response null should stop loading', () => {
    spyOn(tenantService, 'v1TenantGet').and.returnValue(of(JSON.stringify(firmDetailsMock) as any));
    spyOn(billingService, 'v1BillingSettingsTenantTenantIdGet').and.returnValue(of(JSON.stringify(billingSettingsMock) as any));
    spyOn(tenantService, 'v1TenantProfileGet').and.returnValue(of(JSON.stringify({results: null, token: 'fake-token'}) as any));

    component.ngOnInit();

    expect(component.loading).toBe(false);
  });

  it('ngOnInIt should called getTenantdetails, getbillingSetting, getTenantProfile throwError should stop loading', () => {
    spyOn(tenantService, 'v1TenantGet').and.returnValue(of(JSON.stringify(firmDetailsMock) as any));
    spyOn(billingService, 'v1BillingSettingsTenantTenantIdGet').and.returnValue(of(JSON.stringify(billingSettingsMock) as any));
    spyOn(tenantService, 'v1TenantProfileGet').and.returnValue(throwError({error: 'error'}));

    component.ngOnInit();

    expect(component.loading).toBe(false);
  });

  it('tab changed should select invoice tab', () => {
    spyOn(component, 'changeTab').and.callThrough();
    fixture.detectChanges();

    let tabClick = fixture.debugElement.query(By.css('#tab-index-1'));
    tabClick.nativeElement.dispatchEvent(new Event('click'));

    expect(component.changeTab).toHaveBeenCalled();
    expect(component.selecttabs1).toContain('Invoices');
  });

  it('should save billing settings', () => {
    component.selecttabs1 = 'Time Entry Grace Period';
    let copySetting = _.cloneDeep(billingSettingsMock);
    copySetting.results[0].id = 0
    component.billingSettings = copySetting.results[0];
    component.firmDetails = JSON.parse(JSON.stringify(firmDetailsMock.results));
    spyOn(billingService, 'v1BillingSettingsPost$Json').and.returnValue(of(JSON.stringify(billingSettingResMock) as any));
    spyOn(toastr, 'showSuccess').and.callThrough();
    fixture.detectChanges();

    let saveBtn = fixture.debugElement.query(By.css('#save-changes'));
    saveBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(toastr.showSuccess).toHaveBeenCalledWith('Billing settings saved.');
  });

  it('save billing settings error', () => {
    component.selecttabs1 = 'Time Entry Grace Period';
    let copySetting = _.cloneDeep(billingSettingsMock);
    copySetting.results[0].id = 0
    component.billingSettings = copySetting.results[0];
    component.firmDetails = JSON.parse(JSON.stringify(firmDetailsMock.results));
    spyOn(billingService, 'v1BillingSettingsPost$Json').and.returnValue(of(JSON.stringify({results: 0, token: 'fake-token'}) as any));
    fixture.detectChanges();

    let saveBtn = fixture.debugElement.query(By.css('#save-changes'));
    saveBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(billingService.v1BillingSettingsPost$Json).toHaveBeenCalled();
  });

  it('save billing settings throwerror', () => {
    component.selecttabs1 = 'Time Entry Grace Period';
    let copySetting = _.cloneDeep(billingSettingsMock);
    copySetting.results[0].id = 0
    component.billingSettings = copySetting.results[0];
    component.firmDetails = JSON.parse(JSON.stringify(firmDetailsMock.results));
    spyOn(billingService, 'v1BillingSettingsPost$Json').and.returnValue(throwError({error: 'error'}));
    fixture.detectChanges();

    let saveBtn = fixture.debugElement.query(By.css('#save-changes'));
    saveBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(billingService.v1BillingSettingsPost$Json).toHaveBeenCalled();
  });

  it('should update billing settings', () => {
    component.selecttabs1 = 'Time Entry Grace Period';
    let copySetting = _.cloneDeep(billingSettingsMock);
    copySetting.results[0].id = 1
    component.billingSettings = copySetting.results[0];
    component.firmDetails = JSON.parse(JSON.stringify(firmDetailsMock.results));
    spyOn(billingService, 'v1BillingSettingsPut$Json').and.returnValue(of(JSON.stringify(billingSettingResMock) as any));
    spyOn(toastr, 'showSuccess').and.callThrough();
    fixture.detectChanges();

    let saveBtn = fixture.debugElement.query(By.css('#save-changes'));
    saveBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(toastr.showSuccess).toHaveBeenCalledWith('Billing settings saved.');
    expect(component.editBill).toBe(false);
    expect(component.editBillUpcoming).toBe(false);
    expect(component.dateReset).toBe(true);
    expect(component.notIsEdit).toBe(true);
  });

  it('update billing settings error', () => {
    component.selecttabs1 = 'Time Entry Grace Period';
    let copySetting = _.cloneDeep(billingSettingsMock);
    copySetting.results[0].id = 1
    component.billingSettings = copySetting.results[0];
    component.firmDetails = JSON.parse(JSON.stringify(firmDetailsMock.results));
    spyOn(billingService, 'v1BillingSettingsPut$Json').and.returnValue(of(JSON.stringify({results: 0, token: 'fake-token'}) as any));
    spyOn(toastr, 'showSuccess').and.callThrough();
    fixture.detectChanges();

    let saveBtn = fixture.debugElement.query(By.css('#save-changes'));
    saveBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.loading).toBe(false);
  });

  it('update billing settings throwerror', () => {
    component.selecttabs1 = 'Time Entry Grace Period';
    let copySetting = _.cloneDeep(billingSettingsMock);
    copySetting.results[0].id = 1
    component.billingSettings = copySetting.results[0];
    component.firmDetails = JSON.parse(JSON.stringify(firmDetailsMock.results));
    spyOn(billingService, 'v1BillingSettingsPut$Json').and.returnValue(throwError({error: 'error'}));
    spyOn(toastr, 'showSuccess').and.callThrough();
    fixture.detectChanges();

    let saveBtn = fixture.debugElement.query(By.css('#save-changes'));
    saveBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.loading).toBe(false);
  });

  it('get bill generate frequency and set to updatedSettings object', async(() => {
    component.getValue(billPeriodMock);

    fixture.detectChanges();

    fixture.whenStable().then(() => {
        expect(component.updatedSettings.billFrequencyStartingDate).toBe('2020-11-20');
        expect(component.updatedSettings.billFrequencyNextDate).toBe('2020-11-13');
        expect(component.updatedSettings.effectiveDate).toBe('2020-11-13');
        expect(component.updatedSettings.effectiveBillFrequencyNextDate).toBe('2020-11-13');
    })
  }));

  it('confirm save, edit bill upcoming true should set billing settings property ', fakeAsync(() => {
    component.selecttabs1 = 'Bill Generation Frequency';
    component.editBillUpcoming = true;
    component.editBill = true;
    let clone = _.cloneDeep(billPeriodMock);
    clone.effectiveDate = '2020-11-20';
    clone.billFrequencyDuration = 15;
    clone.billFrequencyQuantity = 15;
    clone.billFrequencyRecursOn = 15;
    component.updatedSettings = clone;
    component.firmDetails = JSON.parse(JSON.stringify(firmDetailsMock.results));
    spyOn(dialogService, 'confirm').and.returnValue(Promise.resolve(true));
    spyOn(component, 'updateBilling').and.callThrough();
    tick(1);

    component.confirmSave();

    tick(2);
    expect(dialogService.confirm).toHaveBeenCalledWith(
        'Saving these changes will override the upcoming billing frequency settings at the firm level. Are you sure you want to continue?',
        'Yes, override current settings',
        'Cancel',
        'Override Changes',
        true
    );
    expect(component.updateBilling).toHaveBeenCalledWith(null);
    flush();
  }));

  it('confirm save, edit bill upcoming false should set billing settings property ', fakeAsync(() => {
    component.selecttabs1 = 'Bill Generation Frequency';
    component.editBillUpcoming = false;
    component.editBill = true;
    let clone = _.cloneDeep(billPeriodMock);
    clone.effectiveDate = '2020-11-20';
    clone.billFrequencyDuration = 15;
    clone.billFrequencyQuantity = 15;
    clone.billFrequencyRecursOn = 15;
    clone.effectiveDate = '2021-01-01';
    component.updatedSettings = clone;
    component.firmDetails = JSON.parse(JSON.stringify(firmDetailsMock.results));
    spyOn(component, 'updateBilling').and.callThrough();
    tick(1);

    component.confirmSave();

    tick(2);
    expect(component.updateBilling).toHaveBeenCalledWith(null);
    flush();
  }));

  it('removeUpcomingFreq should set null billing setting property', () => {
    component.updatedSettings = billPeriodMock;
    component.firmDetails = JSON.parse(JSON.stringify(firmDetailsMock.results));
    spyOn(component, 'updateBilling').and.callThrough();

    component.removeUpcomingFreq(billPeriodMock);

    expect(component.updateBilling).toHaveBeenCalled();
    expect(component.billingSettings.effectiveBillFrequencyDay).toBeNull();
    expect(component.billingSettings.effectiveBillFrequencyRecursOn).toBeNull();
    expect(component.billingSettings.effectiveBillFrequencyQuantity).toBeNull();
    expect(component.billingSettings.effectiveBillFrequencyDuration).toBeNull();
    expect(component.billingSettings.effectiveBillFrequencyNextDate).toBeNull();
    expect(component.billingSettings.effectiveBillFrequencyStartingDate).toBeNull();
    expect(component.billingSettings.effectiveIsInherited).toBeNull();
    expect(component.billingSettings.effectiveRepeatType).toBeNull();
    expect(component.billingSettings.effectiveBillWhenHoliday).toBeNull();
  });

  it('cancel button should set editbill, editbillupcoming false', () => {
    component.selecttabs1 = 'Bill Generation Frequency';
    component.editBillUpcoming = true;
    spyOn(component, 'cancel').and.callThrough();
    fixture.detectChanges();

    let cancelBtn = fixture.debugElement.query(By.css('#cancel-btn'));
    cancelBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.editBill).toBe(false);
    expect(component.editBillUpcoming).toBe(false);
    expect(component.cancel).toHaveBeenCalled();
  });

  it('editBillFreq event should change editBill true', () => {

    component.editBillFreq('basic');
    expect(component.editBill).toBe(true);
  });

  it('editBillFreq event should change editBillUpcoming true if not basic', () => {

    component.editBillFreq('Notbasic');
    expect(component.editBillUpcoming).toBe(true);
  });

  it('enable disable time entry edit', () => {
    component.enableDisabledTimeEntryButton(false);
    expect(component.notIsEdit).toBe(false);
  });

});
