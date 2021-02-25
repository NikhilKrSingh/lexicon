import { Location } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { RichTextEditorAllModule } from '@syncfusion/ej2-angular-richtexteditor';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { ToastrModule } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { reducers } from 'src/app/store';
import { UsioService } from 'src/common/swagger-providers/services';
import { SharedModule } from '../../shared/shared.module';
import { ResendOwnerInfoEmailComponent } from '../../usio-setup/resend-owner-info-email/resend-owner-info-email.component';
import { AccountSettingsComponent } from './account-settings.component';

describe('CreateComponent', () => {
    let location: Location;
    let router: Router;
    let component: AccountSettingsComponent;
    let fixture: ComponentFixture<AccountSettingsComponent>;
    let usioService: UsioService;
    const routes: Routes = [{path: 'usio/resend-owner-info-email', component: ResendOwnerInfoEmailComponent}];
    const resp = { body: JSON.stringify({
        token: 'fake-token',
        results: [{
            id: 184,
            tenantId: 1006,
            usioMerchantId: '5E4CB41F-C63A-4215-90D3-E6E7E95D14F7',
            accountUsioStatus: 'Awaiting Merchant',
            internalAccountStatus: 'Error',
            accountUsioStatusReason: 'Could not connect to payment gateway',
            name: '03 Nov Account ',
            isMerchantAccount: true,
            nonMerchantAccountNumber: '4242424242424242',
            nonMerchantAccountRountingNumber: null,
            usioAccountTypeId: 1,
            isCreditCardAccount: true,
            isAchAccount: false,
            businessName: 'DBA 03',
            email: 'khushbu@yopmail.com',
            legalBusinessName: 'Legal 03',
            ownershipTypeId: null,
            businessDescription: '',
            businessStartDate: null,
            merchantCategoryCode: null,
            naicsCode: null,
            federalTaxIdOrSsn: '',
            phoneNo: '',
            website: '',
            ownerEmail1: 'khushbu01@yopmail.com',
            webhookUrl: 'https://mta-dev-api.lexiconservices.com/UpdateUsioBankAccountStatus/1006',
            isWelcomeEmailDisabled: false,
            timeZoneID: 1,
            createdBy: 1304,
            createdAt: '2020-11-04T07:14:37.367',
            updatedBy: 1304,
            lastUpdated: '2020-11-09T06:30:54.9412574Z',
            isActive: true,
            isVisible: true,
            bankAccountStatus: 'success',
            merchantCredentials: null
        },
        {
            id: 143,
            tenantId: 1006,
            usioMerchantId: '0',
            accountUsioStatus: null,
            internalAccountStatus: 'Active',
            accountUsioStatusReason: 'Could not connect to payment gateway',
            name: '10 Oct Account (2)',
            isMerchantAccount: false,
            nonMerchantAccountNumber: '12345678901234567890',
            nonMerchantAccountRountingNumber: '021000021',
            usioAccountTypeId: 1,
            isCreditCardAccount: null,
            isAchAccount: null,
            businessName: null,
            email: null,
            legalBusinessName: null,
            ownershipTypeId: null,
            businessDescription: null,
            businessStartDate: null,
            merchantCategoryCode: null,
            naicsCode: null,
            federalTaxIdOrSsn: null,
            phoneNo: null,
            website: null,
            ownerEmail1: null,
            webhookUrl: 'https://mta-dev-api.lexiconservices.com/UpdateUsioBankAccountStatus/1006',
            isWelcomeEmailDisabled: false,
            timeZoneID: 1,
            createdBy: 8226,
            createdAt: '2020-10-12T13:12:34.087',
            updatedBy: 1304,
            lastUpdated: '2020-10-15T10:11:02.733',
            isActive: true,
            isVisible: true,
            bankAccountStatus: null,
            merchantCredentials: null
        },
        {
            id: 133,
            tenantId: 1006,
            usioMerchantId: '0',
            accountUsioStatus: null,
            internalAccountStatus: 'Active',
            accountUsioStatusReason: 'Could not connect to payment gateway',
            name: '12 Account Trust',
            isMerchantAccount: false,
            nonMerchantAccountNumber: '123456789012',
            nonMerchantAccountRountingNumber: '021000021',
            usioAccountTypeId: 1,
            isCreditCardAccount: null,
            isAchAccount: null,
            businessName: null,
            email: null,
            legalBusinessName: null,
            ownershipTypeId: null,
            businessDescription: null,
            businessStartDate: null,
            merchantCategoryCode: null,
            naicsCode: null,
            federalTaxIdOrSsn: null,
            phoneNo: null,
            website: null,
            ownerEmail1: null,
            webhookUrl: 'https://mta-dev-api.lexiconservices.com/UpdateUsioBankAccountStatus/1006',
            isWelcomeEmailDisabled: false,
            timeZoneID: 1,
            createdBy: 7583,
            createdAt: '2020-10-09T15:00:58.28',
            updatedBy: 1304,
            lastUpdated: '2020-10-15T10:11:02.737',
            isActive: true,
            isVisible: true,
            bankAccountStatus: null,
            merchantCredentials: null
        },
        {
            id: 135,
            tenantId: 1006,
            usioMerchantId: 'D5CDB410-2586-4817-AD0F-E07084FF00B6',
            accountUsioStatus: 'Awaiting Merchant',
            internalAccountStatus: 'Error',
            accountUsioStatusReason: 'Could not connect to payment gateway',
            name: '12324242',
            isMerchantAccount: true,
            nonMerchantAccountNumber: '12223582534242423',
            nonMerchantAccountRountingNumber: null,
            usioAccountTypeId: 1,
            isCreditCardAccount: false,
            isAchAccount: true,
            businessName: 'DBA - 005',
            email: 'operatingaccounts1010@yopmail.com',
            legalBusinessName: 'Legal - 005',
            ownershipTypeId: null,
            businessDescription: 'Test ',
            businessStartDate: '2020-10-10T00:00:00',
            merchantCategoryCode: null,
            naicsCode: null,
            federalTaxIdOrSsn: '',
            phoresultsneNo: '',
            website: '',
            ownerEmail1: 'owner332@yopmail.com',
            webhookUrl: 'https://mta-dev-api.lexiconservices.com/UpdateUsioBankAccountStatus/1006',
            isWelcomeEmailDisabled: false,
            timeZoneID: 1,
            createdBy: 1304,
            createdAt: '2020-10-10T06:26:32.443',
            updatedBy: 1304,
            lastUpdated: '2020-11-09T06:30:54.9455505Z',
            isActive: true,
            isVisible: true,
            bankAccountStatus: 'success',
            merchantCredentials: null
        }]
    })}
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
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes(routes),
        HttpClientTestingModule,
        RouterTestingModule,
        SharedModule,
        RichTextEditorAllModule,
        StoreModule.forRoot(reducers),
        ToastrModule.forRoot({
          closeButton: true
        }),
        NgxIndexedDBModule.forRoot(dbConfig)
      ],
      declarations: [
        AccountSettingsComponent,
        ResendOwnerInfoEmailComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountSettingsComponent);
    usioService = TestBed.get(UsioService);
    component = fixture.componentInstance;
    router = TestBed.get(Router);
    location = TestBed.get(Location);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getUsioAccounts should call in ngOnInit', () => {
    let serviceSpy = spyOn(usioService, 'v1UsioGetAllUsioBankAccountsGet$Response').and.returnValue(of(resp as any));
    component.ngOnInit();
    expect(serviceSpy.calls.any()).toEqual(true);
  });

  it('getUsioAccounts should catch error', () => {
    let serviceSpy = spyOn(usioService, 'v1UsioGetAllUsioBankAccountsGet$Response').and.returnValue(throwError({}));
    component.ngOnInit();
    expect(serviceSpy.calls.any()).toEqual(true);
  });

  it('should call changeStatus', () => {
      const row = {
        id: 184,
        tenantId: 1006,
        usioMerchantId: '5E4CB41F-C63A-4215-90D3-E6E7E95D14F7',
        accountUsioStatus: 'Awaiting Merchant',
        internalAccountStatus: 'Error',
        accountUsioStatusReason: 'Could not connect to payment gateway',
        name: '03 Nov Account ',
        isMerchantAccount: true,
        nonMerchantAccountNumber: '4242424242424242',
        nonMerchantAccountRountingNumber: null,
        usioAccountTypeId: 1,
        isCreditCardAccount: true,
        isAchAccount: false,
        businessName: 'DBA 03',
        email: 'khushbu@yopmail.com',
        legalBusinessName: 'Legal 03',
        ownershipTypeId: null,
        businessDescription: '',
        businessStartDate: null,
        merchantCategoryCode: null,
        naicsCode: null,
        federalTaxIdOrSsn: '',
        phoneNo: '',
        website: '',
        ownerEmail1: 'khushbu01@yopmail.com',
        webhookUrl: 'https://mta-dev-api.lexiconservices.com/UpdateUsioBankAccountStatus/1006',
        isWelcomeEmailDisabled: false,
        timeZoneID: 1,
        createdBy: 1304,
        createdAt: '2020-11-04T07:14:37.367',
        updatedBy: 1304,
        lastUpdated: '2020-11-09T06:30:54.9412574Z',
        isActive: true,
        isVisible: true,
        bankAccountStatus: 'success',
        merchantCredentials: null
    }
    let serviceSpy = spyOn(usioService, 'v1UsioRetryAddUsioBankAccountGet').and.returnValue(of());
    component.changeStatus(row, null,'retry');
    expect(serviceSpy.calls.any()).toBeTruthy();
  });

  it('should catch error v1UsioRetryAddUsioBankAccountGet', () => {
    const row = {
      id: 184,
      tenantId: 1006,
      usioMerchantId: '5E4CB41F-C63A-4215-90D3-E6E7E95D14F7',
      accountUsioStatus: 'Awaiting Merchant',
      internalAccountStatus: 'Error',
      accountUsioStatusReason: 'Could not connect to payment gateway',
      name: '03 Nov Account ',
      isMerchantAccount: true,
      nonMerchantAccountNumber: '4242424242424242',
      nonMerchantAccountRountingNumber: null,
      usioAccountTypeId: 1,
      isCreditCardAccount: true,
      isAchAccount: false,
      businessName: 'DBA 03',
      email: 'khushbu@yopmail.com',
      legalBusinessName: 'Legal 03',
      ownershipTypeId: null,
      businessDescription: '',
      businessStartDate: null,
      merchantCategoryCode: null,
      naicsCode: null,
      federalTaxIdOrSsn: '',
      phoneNo: '',
      website: '',
      ownerEmail1: 'khushbu01@yopmail.com',
      webhookUrl: 'https://mta-dev-api.lexiconservices.com/UpdateUsioBankAccountStatus/1006',
      isWelcomeEmailDisabled: false,
      timeZoneID: 1,
      createdBy: 1304,
      createdAt: '2020-11-04T07:14:37.367',
      updatedBy: 1304,
      lastUpdated: '2020-11-09T06:30:54.9412574Z',
      isActive: true,
      isVisible: true,
      bankAccountStatus: 'success',
      merchantCredentials: null
    }
    let serviceSpy = spyOn(usioService, 'v1UsioRetryAddUsioBankAccountGet').and.returnValue(throwError({}));
    component.changeStatus(row, null,'retry');
    expect(serviceSpy.calls.any()).toBeTruthy();
  });

  it('should execute else part retryAccountRegisteraton', () => {
    component.changeStatus(null, null,'retry');
  });

  it('should call resendInfoEmail for status Pending Signatory', () => {
    const row = {
        id: 184,
        tenantId: 1006,
        usioMerchantId: '5E4CB41F-C63A-4215-90D3-E6E7E95D14F7',
        accountUsioStatus: 'PendingSignatory',
        internalAccountStatus: 'Error',
        accountUsioStatusReason: 'Could not connect to payment gateway',
        name: '03 Nov Account ',
        isMerchantAccount: true,
        nonMerchantAccountNumber: '4242424242424242',
        nonMerchantAccountRountingNumber: null,
        usioAccountTypeId: 1,
        isCreditCardAccount: true,
        isAchAccount: false,
        businessName: 'DBA 03',
        email: 'khushbu@yopmail.com',
        legalBusinessName: 'Legal 03',
        ownershipTypeId: null,
        businessDescription: '',
        businessStartDate: null,
        merchantCategoryCode: null,
        naicsCode: null,
        federalTaxIdOrSsn: '',
        phoneNo: '',
        website: '',
        ownerEmail1: 'khushbu01@yopmail.com',
        webhookUrl: 'https://mta-dev-api.lexiconservices.com/UpdateUsioBankAccountStatus/1006',
        isWelcomeEmailDisabled: false,
        timeZoneID: 1,
        createdBy: 1304,
        createdAt: '2020-11-04T07:14:37.367',
        updatedBy: 1304,
        lastUpdated: '2020-11-09T06:30:54.9412574Z',
        isActive: true,
        isVisible: true,
        bankAccountStatus: 'success',
        merchantCredentials: null
      }
      spyOn(component, 'resendInfoEmail');
      component.resendInfoEmail(row, null, null);
      expect(component.resendInfoEmail).toHaveBeenCalled();
  });

  it('should navigate to usio/resend-owner-info-email', fakeAsync(() => {
    router.navigate(["usio/resend-owner-info-email"]).then(() => {
      expect(location.path()).toBe("/usio/resend-owner-info-email");
    });
  }));
});
