import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RichTextEditorAllModule } from '@syncfusion/ej2-angular-richtexteditor';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { OfficeService, TrustAccountService, UsioService } from 'src/common/swagger-providers/services';

import { LawOfficeNotesComponent } from './law-office-notes.component';

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

const mockData = {
  "basicDetails": {
    "name": "dsa",
    "openingDate": "2020-10-27T00:00:00.000Z",
    "statusId": 1,
    "acceptsInitialConsultation": true,
    "street": "sa",
    "address2": "sa",
    "city": "sa",
    "state": "AZ",
    "zipCode": "111111",
    "phone1": "1222222222",
    "phone2": "2111111111",
    "fax": "2111111111",
    "practiceAreaIds": [
      145
    ],
    "lat": 0,
    "lon": 0,
    "timezone": null
  },
  "designatedContactDetails": {
    "contact": {
      "id": 5847,
      "lastName": "07th July",
      "email": "pawan03@yopmail.com",
      "firstName": "Employee",
      "phone": {
        "id": 61313,
        "number": "1564866456",
        "type": "primary",
        "isPrimary": true,
        "personId": 5847
      }
    },
    "isOther": false
  },
  "selectedStateName": "Arizona",
  "employeesDetails": {
    "rankingView": true,
    "consultRankingView": true,
    "employees": [],
    "grid": [],
    "attorneys": [],
    "consultant": [],
    "responsibleVisibilityId": 1,
    "consultVisibilityId": 1
  },
  "settings": {
    "timeEntryRounding": 7,
    "mondayOpen": "07:00:00",
    "mondayClose": "15:00:00",
    "tuesdayOpen": "09:30:00",
    "tuesdayClose": "17:00:00",
    "wednesdayOpen": "01:00:00",
    "wednesdayClose": "17:00:00",
    "thursdayOpen": "02:00:00",
    "thursdayClose": "16:30:00",
    "fridayOpen": "09:30:00",
    "fridayClose": "19:30:00",
    "saturdayOpen": "00",
    "saturdayClose": "00",
    "sundayOpen": "00",
    "sundayClose": "00",
    "billFrequencyDay": 5,
    "billFrequencyRecursOn": 15,
    "billFrequencyStartingDate": "2020-11-15",
    "billFrequencyNextDate": "2020-12-15",
    "billFrequencyQuantity": 1,
    "billFrequencyDuration": 21,
    "isInherited": true,
    "effectiveBillFrequencyNextDate": "03/12/2021",
    "repeatType": 2,
    "billWhenHoliday": 3,
    "opratingAccounts": opratingAccountsMock,
    "officeHolidayList": [
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
      }
    ],
    "officeRateList": [
      {
        "id": 256,
        "office": null,
        "person": null,
        "matter": null,
        "tenant": {
          "id": 1006,
          "name": "Flash 1.0"
        },
        "code": "256",
        "description": "Documentation",
        "billingType": {
          "id": 1,
          "code": "HOURLY",
          "name": "Hourly",
          "email": null,
          "primaryPhone": null,
          "uniqueNumber": 0
        },
        "billingTo": {
          "id": 54,
          "code": "OVERHEAD",
          "name": "Overhead",
          "email": null,
          "primaryPhone": null,
          "uniqueNumber": 0
        },
        "rateAmount": 0,
        "customRateAmount": null,
        "isCustom": false,
        "changeNotes": null,
        "createdBy": "Lexicon dev, Admin",
        "createdAt": "2020-10-22T04:16:31.933",
        "status": "Disabled"
      },
      {
        "id": 257,
        "office": null,
        "person": null,
        "matter": null,
        "tenant": {
          "id": 1006,
          "name": "Flash 1.0"
        },
        "code": "257",
        "description": "Initial Consultation",
        "billingType": {
          "id": 1,
          "code": "HOURLY",
          "name": "Hourly",
          "email": null,
          "primaryPhone": null,
          "uniqueNumber": 0
        },
        "billingTo": {
          "id": 4,
          "code": "POTENTIAL_CLIENT",
          "name": "Potential Client",
          "email": null,
          "primaryPhone": null,
          "uniqueNumber": 0
        },
        "rateAmount": 12,
        "customRateAmount": null,
        "isCustom": false,
        "changeNotes": null,
        "createdBy": "Lexicon dev, Admin",
        "createdAt": "2020-10-22T04:16:31.933",
        "status": "Disabled"
      }
    ]
  },
  "lawofficenotes": "<p>This is office note</p>"
};


const trustAccountMock = {
  "basicSettings": {
    "isPaperCheckRequired": false,
    "officeId": 0,
    "officeTrustPaymentGracePeriod": 0
  },
  "bankAccountData": {
    "officeId": 0,
    "isCreditCardTrustAccountEnabled": false,
    "firmTrustCreditCardAccountId": 0
  },
  "selectedTrustAccountList": [
    {
      "id": 0,
      "usioBankAccountId": 6,
      "name": "Trust 1",
      "isMerchantAccount": false,
      "isCreditCardAccount": null,
      "isAchAccount": null,
      "nonMerchantAccountNumber": "1234567890122",
      "merchantAccountNumber": null,
      "lastTransactionDate": "2020-10-15T10:11:03.017",
      "isSelected": false,
      "status": null
    }
  ],
  "trustAccountingFlag": false
};

describe('LawOfficeNotesComponent', () => {
  let component: LawOfficeNotesComponent;
  let fixture: ComponentFixture<LawOfficeNotesComponent>;
  let officeService: OfficeService;
  let trustAccountService: TrustAccountService;
  let usioService: UsioService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports:[
        SharedModule,
        RichTextEditorAllModule,
        HttpClientTestingModule,
        RouterTestingModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
      ],
      declarations: [ 
        LawOfficeNotesComponent 
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LawOfficeNotesComponent);
    officeService = TestBed.get(OfficeService);
    trustAccountService = TestBed.get(TrustAccountService);
    usioService = TestBed.get(UsioService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('click Finish should save new office', () => {
    UtilsHelper.setObject('office', mockData);

    const res = JSON.stringify({results: 1});
    spyOn(officeService, 'v1OfficeFullPost$Json').and.returnValue(of(res as any));
    spyOn(component, 'addTrustAccount').and.callThrough();
    spyOn(component, 'addOpratingAccounts').and.callThrough();

    component.next();

    expect(component.officeId).toBe(1);
    expect(component.addTrustAccount).toHaveBeenCalled();
    expect(component.addOpratingAccounts).toHaveBeenCalledWith(opratingAccountsMock);
  });

  it('addTrustAccount settings should called after office created', () => {
    UtilsHelper.setObject('officeSetTrustAccount', trustAccountMock);
    component.officeId = 1;
    const res = {token: 'fake-token', results: 1};
    spyOn(trustAccountService, 'v1TrustAccountSetUpdateOfficeTrustAccountSettingsPost$Json$Response').and.returnValue(of(res as any));
    spyOn(component, 'addTrustAccountBank').and.callThrough();

    component.addTrustAccount();

    expect(component.addTrustAccountBank).toHaveBeenCalled();
  });

  it('addTrustAccountBank should called  after addTrustAccount settings created', () => {
    UtilsHelper.setObject('officeSetTrustAccount', trustAccountMock);
    component.officeId = 1;
    spyOn(component, 'creditCardBankToTrustBank').and.callThrough();

    component.addTrustAccountBank();

    expect(component.selectedTrustAccountList.length).toBe(1);
    expect(component.trustAccountingFlag).toBe(false);
    expect(component.creditCardBankToTrustBank).toHaveBeenCalled();
  });

  it('creditCardBankToTrustBank should called after addTrustAccountBank', () => {
    component.selectedTrustAccountList = trustAccountMock.selectedTrustAccountList;
    component.trustAccountingFlag = true;
    spyOn(usioService, 'v1UsioAddEditUsioOfficeBankAccountsPost$Json').and.returnValue(Promise.resolve() as any);
    let spy = spyOn(component, 'creditCardBankToTrustBank').and.callThrough();

    component.creditCardBankToTrustBank();

    expect(spy).toHaveBeenCalled();
  });
});
