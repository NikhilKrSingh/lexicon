import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { NewConsulationFeeComponent } from './new-consulation-fee/new-consulation-fee.component'
import { NewWriteOffsComponent } from 'src/app/modules/shared/billing-settings/new-write-offs/new-write-offs.component';
import { NewBillingPaymentMethodComponent } from 'src/app/modules/shared/billing-settings/new-payment-method/new-payment-method.component';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { PotentialClientBillingDetailsModule } from './potential-client-billing-details.module';
import { PotentialClientBillingService } from 'src/common/swagger-providers/services';
import { reducers } from 'src/app/store';
import { ApiModule } from 'src/common/swagger-providers/api.module';
import { PotentialClientBillingDetailsComponent } from './potential-client-billing-details.component';
import { BillingSettingsSharedModule } from 'src/app/modules/shared/billing-settings/billing-settings.module';

let clientDetailsMock = {
  "token":
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiI3MTUyIiwiYWN0b3J0IjoiU2FjaGluIiwiYW1yIjoiTWhldHJlIiwiYXVkIjoiRW1wbG95ZWVARXZlcnlvbmVAYWRtaW5AQ29weSAtIDA3IG9jdC12a2phZ2F0IiwiYXpwIjoiMTAwNiIsImVtYWlsIjoic2FjaGlubUB5b3BtYWlsLmNvbSIsImZhbWlseV9uYW1lIjoiQWRtaW4iLCJnZW5kZXIiOiIiLCJUaWVyIjoiQXNjZW5kaW5nIiwiQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndHd05MRGtXcTBPYW52STB4U3RWd2NtUDh3eUY2MnZNZEptTjlkVHk5eTgrUTJTUFZpOVBNNjd4cG9zdmJHZUtyYVg4dE1Fc1JyOTBaLzBLemxmUjBiTT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiR1ZKdVBCTWRzRGFHNTV1dHA3TTlKbDE3MFZjZ3cweW90U2FjQURZbi9sbktXRzZQc0Roejh2ejk3RlBacGxxQkRZNkZQdjcyeWtjWjI1bWZtczF2d0d3TkxEa1dxME9hbnZJMHhTdFZ3Y21QOHd5RjYydk1kSm1OOWRUeTl5OCtRMlNQVmk5UE02N3hwb3N2YkdlS3JhWDh0TUVzUnI5MFovMEt6bGZSMGJNPSIsIm5iZiI6MTYxMTA3ODQyMSwiZXhwIjoxNjExMTIxNjIxLCJpYXQiOjE2MTEwNzg0MjF9.c1q0zt34DLXKqURb6-7iGV4Y23wnmMQw1Nj7B0GcVv8',
  "results": {
    "id": 9609,
    "userName": 'PC 13.19872002',
    "password": null,
    "role": null,
    "salutation": null,
    "companyName": 'PC 13.1',
    "firstName": '',
    "middleName": null,
    "lastName": '',
    "suffix": null,
    "email": null,
    "maidenName": null,
    "nickName": null,
    "commonName": null,
    "jobTitle": null,
    "gender": null,
    "nextActionDate": null,
    "nextActionNote": '',
    "isCompany": true,
    "isVisible": true,
    "isArchived": false,
    "doNotContact": false,
    "doNotContactReason": null,
    "doNotContactReasonOther": null,
    "archiveReason": null,
    "notifyEmail": true,
    "notifySmS": false,
    "marketingEmail": null,
    "marketingSMS": null,
    "referralSource": null,
    "referralMedium": null,
    "formerName": null,
    "createdBy": 'Mhetre, Sachin',
    "preferredContactMethod": 'Email',
    "initialJurisdictionId": null,
    "matterId": 7637,
    "practice": null,
    "changeStatusNotes": null,
    "primaryOffice": null,
    "primaryContactPerson": {
      "id": 9522,
      "code": 'Primary Contact',
      "name": 'Asrani, Khushbu',
      "email": 'kasrani@yopmail.com',
      "primaryPhone": '3434343434',
      "uniqueNumber": 5816,
      "cellPhone": '2222222222'
    },
    "consultationLawOffice": { "id": 1549, "name": '1 June Office' },
    "consultAttorney": { "id": 1304, "name": 'Lexicon dev, Admin' },
    "initialContactDate": '2021-01-18T14:14:43.327',
    "initialConsultDate": null,
    "retainDate": '2021-01-19T00:00:00',
    "addresses": [
      {
        "id": 16969,
        "name": null,
        "address": '1234',
        "address2": null,
        "city": 'Adger',
        "state": 'AL',
        "zip": '35006',
        "addressTypeId": 1,
        "addressTypeName": 'primary'
      }
    ],
    "matterType": [{ "id": 97, "name": 'Corporate Law Matter type 1' }],
    "matterPractices": { "id": 73, "name": 'Corporate Law' },
    "jurisdiction": [
      {
        "id": 1,
        "code": null,
        "name": 'Alabama',
        "email": null,
        "primaryPhone": null,
        "uniqueNumber": 0,
        "cellPhone": null
      }
    ],
    "jurisdictionCounty": 'AL',
    "matterStatus": [],
    "phones": [],
    "secondaryOffices": [],
    "responsibleAttorneys": [],
    "originatingAttorney": { "id": 6640, "name": '5462, LEX' },
    "invoicePreference": null,
    "uniqueNumber": 5909,
    "billingAttorney": null,
    "consultationFeeRecordStatus": { "id": 195, "name": 'Decided not to retain' }
  }
};

let balanceDetailsMock = {
  "token":
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiI3MTUyIiwiYWN0b3J0IjoiU2FjaGluIiwiYW1yIjoiTWhldHJlIiwiYXVkIjoiRW1wbG95ZWVARXZlcnlvbmVAYWRtaW5AQ29weSAtIDA3IG9jdC12a2phZ2F0IiwiYXpwIjoiMTAwNiIsImVtYWlsIjoic2FjaGlubUB5b3BtYWlsLmNvbSIsImZhbWlseV9uYW1lIjoiQWRtaW4iLCJnZW5kZXIiOiIiLCJUaWVyIjoiQXNjZW5kaW5nIiwiQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndHd05MRGtXcTBPYW52STB4U3RWd2NtUDh3eUY2MnZNZEptTjlkVHk5eTgrUTJTUFZpOVBNNjd4cG9zdmJHZUtyYVg4dE1Fc1JyOTBaLzBLemxmUjBiTT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiR1ZKdVBCTWRzRGFHNTV1dHA3TTlKbDE3MFZjZ3cweW90U2FjQURZbi9sbktXRzZQc0Roejh2ejk3RlBacGxxQkRZNkZQdjcyeWtjWjI1bWZtczF2d0d3TkxEa1dxME9hbnZJMHhTdFZ3Y21QOHd5RjYydk1kSm1OOWRUeTl5OCtRMlNQVmk5UE02N3hwb3N2YkdlS3JhWDh0TUVzUnI5MFovMEt6bGZSMGJNPSIsIm5iZiI6MTYxMTA3ODQyMSwiZXhwIjoxNjExMTIxNjIxLCJpYXQiOjE2MTEwNzg0MjF9.c1q0zt34DLXKqURb6-7iGV4Y23wnmMQw1Nj7B0GcVv8',
  "results": {
    "billedBalance": {
      "lastInvoiceId": 0,
      "lastInvoiceDate": null,
      "lastInvoiceAmount": 0.0,
      "latestPayments": 0.0,
      "latestWriteOffs": 0.0,
      "latestRefunds": 0.0,
      "outstandingBalance": 0.0
    },
    "unbilledBalance": { "unbilledConsultationFee": 242.0 }
  }
};


describe('PotentialClientBillingDetailsComponent', () => {
  let component: PotentialClientBillingDetailsComponent;
  let fixture: ComponentFixture<PotentialClientBillingDetailsComponent>;
  let potentialClientBillingService: PotentialClientBillingService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        PotentialClientBillingDetailsComponent,
        NewConsulationFeeComponent,
        NewWriteOffsComponent,
        NewBillingPaymentMethodComponent
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        SharedModule,
        CommonModule,
        PotentialClientBillingDetailsModule,
        BillingSettingsSharedModule,
        StoreModule.forRoot(reducers),
        ToastrModule.forRoot({})
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({
              clientId: '9609',
              state: 'edit'
            })
          }
        },
        PotentialClientBillingService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PotentialClientBillingDetailsComponent);
    potentialClientBillingService = TestBed.get(PotentialClientBillingService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', async () => {
    expect(component).toBeTruthy();
  });

  it('getBalances should called in ngOnInIt if clientDetails', () => {
    component.clientDetails = JSON.stringify(clientDetailsMock);

    spyOn(component, 'getBalances').and.callThrough();

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.getBalances).toHaveBeenCalled();
  });

  it('should get billed balance and unbilled balance details', () => {
    spyOn(
      potentialClientBillingService,
      'v1PotentialClientBillingBillingWidgetDetailsContactIdGet'
    ).and.returnValue(of(JSON.stringify(balanceDetailsMock) as any));
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.billedBalance).toEqual(balanceDetailsMock.results.billedBalance);
    expect(component.unbilledBalance).toEqual(
      balanceDetailsMock.results.unbilledBalance
    );

  });

  it ('should scroll to fees on click of fees', () => {
    spyOn(component, 'getBalances').and.callThrough();
    const feesText = fixture.debugElement.nativeElement.querySelector('#cfSection')
    feesText.click();
    expect(component.scrollToFees).toHaveBeenCalled();
  });

  it ('should scroll to write offs on click of write offs', () => {
    spyOn(component, 'getBalances').and.callThrough();
    const writeOffsText = fixture.debugElement.nativeElement.querySelector('#writeOffSection')
    writeOffsText.click();
    expect(component.scrollToWriteOff).toHaveBeenCalled();
  });
});
