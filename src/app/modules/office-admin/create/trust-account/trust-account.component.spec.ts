import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { ToastrModule } from 'ngx-toastr';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { reducers } from 'src/app/store';
import { TrustAccountComponent } from './trust-account.component';

const mockData = {
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

describe('TrustAccountComponent', () => {
  let component: TrustAccountComponent;
  let fixture: ComponentFixture<TrustAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        SharedModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
        StoreModule.forRoot(reducers),
      ],
      declarations: [ 
        TrustAccountComponent,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrustAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('set default trustPaymentGrace should be 0', () => {
    component.ngOnInit();
    expect(component.trustPaymentGracePeriodForm.value.trustPaymentGracePeriod).toBe(0);
  });

  it('trustAccountingFlag true and selectedTrustAccountList length 0 should show error', () => {
    component.errorCreditListBank = true;
    component.trustAccountingFlag = true;

    component.next();

    fixture.detectChanges();
    const  error = fixture.debugElement.nativeElement.querySelector('#error-display');
    expect(error.innerText).toContain('Please select credit card trust accounts before proceeding.', 'Please select credit card trust accounts before proceeding.');
    
  });

  it('click on next should save object in localStorage', () => {
    component.selectedTrustAccountList = mockData.selectedTrustAccountList;

    component.next();

    const localData = UtilsHelper.getObject('officeSetTrustAccount');
    expect(localData.selectedTrustAccountList.length).toBe(1);
    expect(localData.trustAccountingFlag).toBe(false);
    expect(localData.basicSettings.isPaperCheckRequired).toBe(false);
    expect(localData.basicSettings.officeId).toBe(0);
    expect(localData.basicSettings.officeTrustPaymentGracePeriod).toBe(0);
    expect(localData.bankAccountData.firmTrustCreditCardAccountId).toBe(0);
    expect(localData.bankAccountData.isCreditCardTrustAccountEnabled).toBe(false);
    expect(localData.bankAccountData.officeId).toBe(0);

  });

});
