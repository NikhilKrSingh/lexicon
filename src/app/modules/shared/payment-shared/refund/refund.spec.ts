import { CurrencyPipe } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { AppConfigService, IAppSettings } from 'src/app/app-config.service';
import { reducers } from 'src/app/store';
import { ApiModule } from 'src/common/swagger-providers/api.module';
import { UsioService } from 'src/common/swagger-providers/services';
import { SharedModule } from '../../shared.module';
import { SharedService } from '../../sharedService';
import { RefundComponent } from './refund.component';

@Injectable()
export class CustomAppConfigService {
  appConfig: IAppSettings = {
    API_URL: 'https://sc1-api.lexiconservices.com',
    SWAGGER_PATH: 'src/common/swagger-providers/',
    SWAGGER_SUB_PATH: '/swagger/v1/swagger.json',
    calendar_key: '0540678778-fcs-1578950738',
    brand: 'CPMG',
    cpmg_domain: 'https://sc1.lexiconservices.com',
    default_logo: 'assets/images/default-logo-lexicon.png',
    Common_Logout:
      'https://quarto-mta-common-dev-ui.azurewebsites.net/logout-b2c',
    Common_Login: 'https://quarto-mta-common-dev-ui.azurewebsites.net',
    Common_API: 'https://quarto-mta-common-dev-api.azurewebsites.net',
    intervalTime: 60000,
    timerSyncInterval: 15000,
  };

  APP_URL = `${window.location.protocol}//${window.location.host}`;
  valid_payment_methods = ['CASH', 'CHECK', 'E-CHECK', 'CREDIT_CARD'];
}
// PlatformLocation
describe('RefundComponent', () => {
  let usioService: UsioService;
  let component: RefundComponent;
  let fixture: ComponentFixture<RefundComponent>;
  const dbConfig: DBConfig = {
    name: 'Lexicon',
    version: 1,
    objectStoresMeta: [{
      store: 'config',
      storeConfig: { keyPath: 'id', autoIncrement: true },
      storeSchema: [
        { name: 'key', keypath: 'key', options: { unique: false } },
        { name: 'value', keypath: 'value', options: { unique: false } }
      ]
    }]
  };
  let data: any[] = [1, 2, 3];
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule, HttpClientTestingModule, StoreModule.forRoot(reducers), ToastrModule.forRoot({}), ApiModule.forRoot({
        rootUrl: 'https://sc1-api.lexiconservices.com',
      }), NgxIndexedDBModule.forRoot(dbConfig)],
      providers: [
        CustomAppConfigService,
        {
          provide: AppConfigService,
          useClass: CustomAppConfigService,
        }, SharedService,
        CurrencyPipe,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ matterId: 6248 }) } }
        }
      ],
      declarations: [
        RefundComponent
      ]
    });
    fixture = TestBed.createComponent(RefundComponent);
    component = fixture.debugElement.componentInstance;
    fixture.detectChanges();
    usioService = TestBed.get(UsioService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getOfficeId', fakeAsync(() => {
    let data = JSON.stringify({
      results: [
        {
          id: 650,
          usioBankAccountId: 31,
          name: 'yusuf pathan',
          isMerchantAccount: true,
          isCreditCardAccount: true,
          isAchAccount: true,
          nonMerchantAccountNumber: null,
          merchantAccountNumber: 'testSettlementAN',
          lastTransactionDate: '2020-10-07T13:23:16.577',
          isSelected: true,
          status: 'Active'
        },
      ]
    });
    let officeID = JSON.stringify({ results: 1654 });
    spyOn(component, 'getOfficeId').and.callThrough();
    let usioServiceSpy = spyOn(usioService, 'v1UsioGetOfficeIdGet').and.returnValue(of(officeID as any));
    let v1UsioGetOfficeIdGetSpy = spyOn(usioService, 'v1UsioGetUsioOfficeBankAccountsGet').and.returnValue(of(data as any));
    component.ngOnInit();
    expect(usioServiceSpy.calls.any()).toBeTruthy();
    expect(component.getOfficeId).toHaveBeenCalled();
  }));
  it('should call checkAvailableRefunds', fakeAsync(() => {
    let refundAmount: number = 23;
    spyOn(component, 'checkAvailableRefunds').and.callThrough();
    spyOn(component, 'review').and.callThrough();
    component.refundForm.get('refundSource').setValue('matter');
    component.refundForm.get('refundTarget').setValue('CREDIT_CARD');
    component.refundForm.get('refundAmount').setValue(refundAmount);
    const button = fixture.debugElement.nativeElement.querySelector('button#review-refund-btn');
    button.click();
    expect(component.refundForm.get('refundAmount').value).toBeGreaterThanOrEqual(23);
    expect((component.matterBalance + component.refundForm.get('refundAmount').value)).toBeGreaterThan(0);
    expect(component.checkAvailableRefunds).toHaveBeenCalled();
    expect(component.review).toHaveBeenCalled();
  }));
  it('should call checkAvailableRefunds', fakeAsync(() => {
    let refundAmount: number = 0;
    spyOn(component, 'checkAvailableRefunds').and.callThrough();
    spyOn(component, 'review').and.callThrough();
    component.refundForm.get('refundSource').setValue('matter');
    component.refundForm.get('refundTarget').setValue('CREDIT_CARD');
    component.refundForm.get('refundAmount').setValue(refundAmount);
    component.refundForm.get('refundDate').setValue('Fri Oct 31 2020 11:19:22 GMT+0530 (India Standard Time)');

    // fixture.detectChanges();
    const button = fixture.debugElement.nativeElement.querySelector('button#review-refund-btn');
    button.click();
    expect(component.refundForm.get('refundAmount').value).toEqual(0);
    expect((component.matterBalance + component.refundForm.get('refundAmount').value)).toEqual(0);
    expect(component.checkAvailableRefunds).toHaveBeenCalled();
    expect(component.review).toHaveBeenCalled();
  }));
  it('should call checkAvailableRefunds', fakeAsync(() => {
    spyOn(component, 'checkAvailableRefunds').and.callThrough();
    spyOn(component, 'review').and.callThrough();
    component.refundForm.get('refundSource').setValue('trust');
    component.refundForm.get('refundTarget').setValue('CREDIT_CARD');
    component.refundForm.get('refundDate').setValue(null);

    component.refundForm.get('notes').setValue('');
    const button = fixture.debugElement.nativeElement.querySelector('button#review-refund-btn');
    button.click();
    expect(component.checkAvailableRefunds).toHaveBeenCalled();
    expect(component.review).toHaveBeenCalled();
  }));
  it('should call checkAvailableRefunds', fakeAsync(() => {
    let refundAmount: number = 20;
    spyOn(component, 'checkAvailableRefunds').and.callThrough();
    spyOn(component, 'review').and.callThrough();
    component.allTrustAccountList = [
      {
        id: 31,
        amount: 22
      }];
    component.creditCardList = [
      {
        id: 123,
      }];
    component.selectedTrust = 31;
    component.selectedCreditCard = 123;
    fixture.detectChanges();
    component.refundForm.get('refundSource').setValue('trust');
    component.refundForm.get('refundTarget').setValue('CREDIT_CARD');
    component.refundForm.get('refundAmount').setValue(refundAmount);
    component.refundForm.get('refundDate').setValue('Fri Oct 30 2020 11:19:22 GMT+0530 (India Standard Time)');
    component.refundForm.get('notes').setValue('trust');
    const button = fixture.debugElement.nativeElement.querySelector('button#review-refund-btn');
    button.click();
    expect(component.checkAvailableRefunds).toHaveBeenCalled();
    expect(component.review).toHaveBeenCalled();
    flush()
  }));
  it('should call checkAvailableRefunds', fakeAsync(() => {
    let refundAmount: number = 20;
    spyOn(component, 'checkAvailableRefunds').and.callThrough();
    spyOn(component, 'review').and.callThrough();
    component.allTrustAccountList = [
      {
        id: 31,
        amount: 22
      }];

    component.selectedTrust = 31;
    fixture.detectChanges();
    component.refundForm.get('refundSource').setValue('trust');
    component.refundForm.get('refundTarget').setValue('CREDIT_CARD');
    component.refundForm.get('refundAmount').setValue(refundAmount);
    component.refundForm.get('refundDate').setValue('Fri Oct 30 2020 11:19:22 GMT+0530 (India Standard Time)');
    component.refundForm.get('notes').setValue('trust');
    const button = fixture.debugElement.nativeElement.querySelector('button#review-refund-btn');
    button.click();
    expect(component.checkAvailableRefunds).toHaveBeenCalled();
    expect(component.review).toHaveBeenCalled();
    flush()
  }));

  it('should call checkAvailableRefunds', fakeAsync(() => {
    const file = {
      name: 'foo',
      size: 500001,
      type: '.jpeg',
      lastModified: 23,
      arrayBuffer: null,
      slice: null,
      stream: null,
      text: null
    };
    spyOn(component, 'checkAvailableRefunds').and.callThrough();
    spyOn(component, 'review').and.callThrough();
    component.selectedFile = file;
    component.allTrustAccountList = [
      {
        id: 31,
        amount: 22
      }];
    component.creditCardList = [
      {
        id: 123,
      }];
    component.selectedTrust = 31;
    component.selectedCreditCard = 123;
    fixture.detectChanges();
    component.refundForm.get('refundSource').setValue('trust');
    component.refundForm.get('refundAmount').setValue(20);
    component.refundForm.get('refundDate').setValue('Fri Oct 30 2020 11:19:22 GMT+0530 (India Standard Time)');
    component.refundForm.get('notes').setValue('trust');
    component.refundForm.get('refundTarget').setValue('CHECK');
    const button = fixture.debugElement.nativeElement.querySelector('button#review-refund-btn');
    button.click();
    expect(component.checkAvailableRefunds).toHaveBeenCalled();
    expect(component.review).toHaveBeenCalled();
    flush()
  }));

  it('should call checkAvailableRefunds', fakeAsync(() => {
    const file = {
      name: 'foo',
      size: 5000001,
      type: '.jpeg',
      lastModified: 23,
      arrayBuffer: null,
      slice: null,
      stream: null,
      text: null
    };
    spyOn(component, 'checkAvailableRefunds').and.callThrough();
    spyOn(component, 'review').and.callThrough();
    component.selectedFile = file;
    component.allTrustAccountList = [
      {
        id: 31,
        amount: 22
      }];
    component.creditCardList = [
      {
        id: 123,
      }];
    component.selectedTrust = 31;
    component.selectedCreditCard = 123;
    fixture.detectChanges();
    component.refundForm.get('refundSource').setValue('trust');
    component.refundForm.get('refundAmount').setValue(20);
    component.refundForm.get('refundDate').setValue('Fri Oct 30 2020 11:19:22 GMT+0530 (India Standard Time)');
    component.refundForm.get('notes').setValue('trust');
    component.refundForm.get('refundTarget').setValue('E-CHECK');
    const button = fixture.debugElement.nativeElement.querySelector('button#review-refund-btn');
    button.click();
    expect(component.checkAvailableRefunds).toHaveBeenCalled();
    expect(component.review).toHaveBeenCalled();
    flush()
  }));

  it('should call checkAvailableRefunds', fakeAsync(() => {
    let refundAmount: number = 20;
    spyOn(component, 'checkAvailableRefunds').and.callThrough();
    spyOn(component, 'review').and.callThrough();
    component.allTrustAccountList = [
      {
        id: 31,
        amount: 22
      }];
    component.creditCardList = [
      {
        id: 123,
      }];
    component.selectedTrust = 31;
    component.selectedCreditCard = 123;
    fixture.detectChanges();
    component.refundForm.get('refundSource').setValue('trust');
    component.refundForm.get('refundTarget').setValue('E-CHECK');
    component.refundForm.get('refundAmount').setValue(refundAmount);
    component.refundForm.get('refundDate').setValue('Fri Oct 30 2020 11:19:22 GMT+0530 (India Standard Time)');
    component.refundForm.get('notes').setValue('trust');
    const button = fixture.debugElement.nativeElement.querySelector('button#review-refund-btn');
    button.click();
    expect(component.checkAvailableRefunds).toHaveBeenCalled();
    expect(component.review).toHaveBeenCalled();
    flush()
  }));
  it('should call checkAvailableRefunds', fakeAsync(() => {
    let refundAmount: number = 20;
    spyOn(component, 'checkAvailableRefunds').and.callThrough();
    spyOn(component, 'review').and.callThrough();
    component.allTrustAccountList = [
      {
        id: 31,
        amount: 22
      }];
    component.creditCardList = [
      {
        id: 123,
      }];
    component.selectedTrust = 31;
    component.selectedCreditCard = 123;
    fixture.detectChanges();
    component.refundForm.get('refundSource').setValue('trust');
    component.refundForm.get('refundTarget').setValue('CREDIT_CARD');
    component.refundForm.get('refundAmount').setValue(refundAmount);
    component.refundForm.get('refundDate').setValue('Fri Oct 30 2020 11:19:22 GMT+0530 (India Standard Time)');
    component.refundForm.get('notes').setValue('trust');
    const button = fixture.debugElement.nativeElement.querySelector('button#review-refund-btn');
    button.click();
    expect(component.checkAvailableRefunds).toHaveBeenCalled();
    expect(component.review).toHaveBeenCalled();
    flush()
  }));
  it('should call checkAvailableRefunds', fakeAsync(() => {
    let refundAmount: number = 20;
    spyOn(component, 'checkAvailableRefunds').and.callThrough();
    spyOn(component, 'review').and.callThrough();
    component.allTrustAccountList = [
      {
        id: 31,
        amount: 22
      }];
    component.creditCardList = [
      {
        id: 123,
      }];
    component.selectedTrust = 31;
    component.selectedCreditCard = 123;
    fixture.detectChanges();
    component.refundForm.get('refundSource').setValue('trust');
    component.refundForm.get('refundTarget').setValue('CREDIT_CARD');
    component.refundForm.get('refundAmount').setValue(refundAmount);
    component.refundForm.get('refundDate').setValue('Fri Oct 30 2020 11:19:22 GMT+0530 (India Standard Time)');
    component.refundForm.get('notes').setValue('trust');
    const button = fixture.debugElement.nativeElement.querySelector('button#review-refund-btn');
    button.click();
    expect(component.checkAvailableRefunds).toHaveBeenCalled();
    expect(component.review).toHaveBeenCalled();
    flush()
  }));
});