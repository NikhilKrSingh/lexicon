import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { reducers } from 'src/app/store';
import { UsioService } from 'src/common/swagger-providers/services';
import { SharedModule } from '../../shared/shared.module';
import { UtilsHelper } from '../../shared/utils.helper';
import { OfficeTrustBankAccountComponent } from './office-trust-bank-account.component';

let operatingAccountsMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDM5NDg0MDAsImV4cCI6MTYwMzk5MTYwMCwiaWF0IjoxNjAzOTQ4NDAwfQ.C_PkKOriffux_MaRL5rxWWZNSclc2mVjZtP5L_JSEIo",
  "results": [
  {
    "id": 0,
    "isAchAccount": null,
    "isCreditCardAccount": null,
    "isMerchantAccount": false,
    "isSelected": false,
    "lastTransactionDate": "2020-10-15T10:11:02.733",
    "matterAssigned": 0,
    "merchantAccountNumber": null,
    "name": "10 Oct Account (2)",
    "nonMerchantAccountNumber": "12345678901234567890",
    "status": null,
    "usioBankAccountId": 143
  },
  {
    "id": 0,
    "isAchAccount": null,
    "isCreditCardAccount": null,
    "isMerchantAccount": false,
    "isSelected": false,
    "lastTransactionDate": "2020-10-15T10:11:02.737",
    "matterAssigned": 0,
    "merchantAccountNumber": null,
    "name": "12 Account Trust",
    "nonMerchantAccountNumber": "123456789012",
    "status": null,
    "usioBankAccountId": 133
  },
  {
    "id": 0,
    "isAchAccount": null,
    "isCreditCardAccount": null,
    "isMerchantAccount": false,
    "isSelected": false,
    "lastTransactionDate": "2020-12-10T06:26:49.553",
    "matterAssigned": 0,
    "merchantAccountNumber": null,
    "name": "12-10 Non merchant",
    "nonMerchantAccountNumber": "12210515523312312",
    "status": null,
    "usioBankAccountId": 303
  },
  {
    "id": 0,
    "isAchAccount": null,
    "isCreditCardAccount": null,
    "isMerchantAccount": false,
    "isSelected": false,
    "lastTransactionDate": "2020-12-03T11:38:54.237",
    "matterAssigned": 0,
    "merchantAccountNumber": null,
    "name": "1231",
    "nonMerchantAccountNumber": "4242424242424241",
    "status": null,
    "usioBankAccountId": 301
  },
  {
    "id": 0,
    "isAchAccount": true,
    "isCreditCardAccount": true,
    "isMerchantAccount": true,
    "isSelected": false,
    "lastTransactionDate": "2021-01-22T10:32:26.107",
    "matterAssigned": 0,
    "merchantAccountNumber": "123456789012",
    "name": "October Account 1",
    "nonMerchantAccountNumber": "123456789012",
    "status": null,
    "usioBankAccountId": 175
  }
  ]
};

const columunMock = [
  {Name: "id", DisplayName: "Id", isChecked: true},
  {Name: "name", DisplayName: "Name", isChecked: true},
  {Name: "isMerchantAccount", DisplayName: "Merchant Account"},
  {Name: "isCreditCardAccount", DisplayName: "Credit Card"},
  {Name: "isACHAccount", DisplayName: "ACH"},
  {Name: "merchantAccountNumber", DisplayName: "Account Number"},
  {Name: "nonMerchantAccountNumber",DisplayName:"Account Number"},
  {Name: "lastTransactionDate", DisplayName: "Last Transaction Date"}
];
let uid:number;
@Component({
  template: ''
})
class DummyComponent {
}

describe('OfficeTrustBankAccountComponent', () => {
  let component: OfficeTrustBankAccountComponent;
  let usioService : UsioService;
  let fixture: ComponentFixture<OfficeTrustBankAccountComponent>;
 
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        RouterTestingModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
        StoreModule.forRoot(reducers),
      ],
      declarations: [
        OfficeTrustBankAccountComponent,
        DummyComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OfficeTrustBankAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getUsioTenantTrustBankAccounts called in ngOnInIt', () => {
    const res = JSON.stringify(operatingAccountsMock);
    spyOn(usioService, 'v1UsioGetUsioTenantBankAccountsGet').and.returnValue(of(res as any));
    spyOn(UtilsHelper, 'aftertableInit').and.callThrough();
    spyOn(UtilsHelper, 'addkeysIncolumnlist').and.callThrough();
    spyOn(component, 'updateDatatableFooterPage').and.callThrough();

    component.ngOnInit();

    fixture.detectChanges();
    expect(component.originalOfficeBankList.length).toBe(7);
    expect(component.loading).toBe(false);
    expect(UtilsHelper.aftertableInit).toHaveBeenCalled();
    expect(UtilsHelper.addkeysIncolumnlist).toHaveBeenCalled();
    expect(component.updateDatatableFooterPage).toHaveBeenCalled();
  });

  it('originalOfficeBankList list length equals to 1', () => {
    component.isCheckBoxHidden = true;
  });
  
  
  it('GetUsioOfficeBankAccounts called on editOfficeBankAccount and orignalOfficeBankList length equals to 1', () => {
    const res = JSON.stringify(operatingAccountsMock);
    spyOn(usioService, 'v1UsioGetUsioOfficeBankAccountsGet').and.returnValue(of(res as any));
    spyOn(UtilsHelper, 'aftertableInit').and.callThrough();
    spyOn(UtilsHelper, 'addkeysIncolumnlist').and.callThrough();
    spyOn(component, 'updateDatatableFooterPage').and.callThrough();

    component.editOfficeBankAccount(uid);

    fixture.detectChanges();
    expect(component.originalOfficeBankList.length).toBe(7);
    expect(component.loading).toBe(false);
    expect(UtilsHelper.aftertableInit).toHaveBeenCalled();
    expect(UtilsHelper.addkeysIncolumnlist).toHaveBeenCalled();
    expect(component.updateDatatableFooterPage).toHaveBeenCalled();
  });

});
