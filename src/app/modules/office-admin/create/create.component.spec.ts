import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { RichTextEditorAllModule } from '@syncfusion/ej2-angular-richtexteditor';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { reducers } from 'src/app/store';
import { TrustAccountService, UsioService } from 'src/common/swagger-providers/services';
import { OfficeTrustBankAccountComponent } from '../../shared/office-trust-bank-account/office-trust-bank-account.component';
import { SharedModule } from '../../shared/shared.module';
import { UtilsHelper } from '../../shared/utils.helper';
import { OfficeAdminBillingComponent } from '../billing/billing.component';
import { DesignatedContactComponent } from '../designated-contact/designated-contact.component';
import { BasicComponent } from './basic/basic.component';
import { CreateComponent } from './create.component';
import { OfficeEmployeeComponent } from './employee/employee.component';
import { LawOfficeNotesComponent } from './law-office-notes/law-office-notes.component';
import { SettingsComponent } from './settings/settings.component';
import { TrustAccountComponent } from './trust-account/trust-account.component';

describe('CreateComponent', () => {
  let component: CreateComponent;
  let fixture: ComponentFixture<CreateComponent>;
  let trustAccountService: TrustAccountService;
  let trustComponent: OfficeTrustBankAccountComponent;
  let fixtureTrustComponent: ComponentFixture<OfficeTrustBankAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        SharedModule,
        RichTextEditorAllModule,
        StoreModule.forRoot(reducers),
        ToastrModule.forRoot({
          closeButton: true
        }),
      ],
      declarations: [
        CreateComponent,
        BasicComponent,
        OfficeEmployeeComponent,
        SettingsComponent,
        LawOfficeNotesComponent,
        TrustAccountComponent,
        DesignatedContactComponent,
        OfficeAdminBillingComponent,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateComponent);
    trustAccountService = TestBed.get(TrustAccountService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getTenantTrustAccountStatus should called in ngOnInIt', () => {
    const res = {body : JSON.stringify({token: 'fake-token', results: false})};
    spyOn(trustAccountService, 'v1TrustAccountGetTrustAccountStatusGet$Response').and.returnValue(of(res as any));

    component.ngOnInit();

    expect(component.isTrustAccountEnabled).toBe(false);
  });

  it('ngOnDestroy should remove localStorage', () => {
    UtilsHelper.setObject('office', {test: 'test'});
    UtilsHelper.setObject('officeSetTrustAccount', {test: 'test'});

    component.ngOnDestroy();

    expect(UtilsHelper.getObject('office')).toBeNull();
    expect(UtilsHelper.getObject('officeSetTrustAccount')).toBeNull();
  });

  it('Trust account should create and have permission', () => {
    component.step = 'trustaccount';
    component.isTrustAccountEnabled = true;
    fixtureTrustComponent = TestBed.createComponent(OfficeTrustBankAccountComponent);
    trustComponent = fixtureTrustComponent.componentInstance;
    expect(trustComponent).toBeTruthy();
  });

  it('Should warning label and list', () => {
    let data = JSON.stringify({
      results: [
       {
          id: 0,
          usioBankAccountId: 33,
          name: "Account 12",
          isMerchantAccount: false,
          isCreditCardAccount: null,
          isAchAccount: null,
          nonMerchantAccountNumber: "2312312312312",
          merchantAccountNumber: null,
          lastTransactionDate: "2020-10-15T10:11:02.77",
          isSelected: false,
          status: null
       },
       {
          id: 0,
          usioBankAccountId: 35,
          name: "6 oct -suchita",
          isMerchantAccount: false,
          isCreditCardAccount: null,
          isAchAccount: null,
          nonMerchantAccountNumber: "121212212121212",
          merchantAccountNumber: null,
          lastTransactionDate: "2020-10-15T10:11:02.75",
          isSelected: false,
          status: null
       },
       {
          id: 0,
          usioBankAccountId: 55,
          name: "Account 1",
          isMerchantAccount: true,
          isCreditCardAccount: true,
          isAchAccount: true,
          nonMerchantAccountNumber: null,
          merchantAccountNumber: "122105155",
          lastTransactionDate: "2020-10-07T09:10:35.273",
          isSelected: false,
          status: null
       }]
    });
    let trustAccountService: UsioService = TestBed.get(UsioService);
    fixtureTrustComponent = TestBed.createComponent(OfficeTrustBankAccountComponent);
    trustComponent = fixtureTrustComponent.componentInstance;
    spyOn(trustComponent, 'getUsioTenantTrustBankAccounts').and.callThrough();
    spyOn(trustComponent, 'onSelect').and.callThrough();
    trustComponent.bankType = 'trustBankAccount';
    const dialogServiceSpy = spyOn(trustAccountService, 'v1UsioGetUsioTenantBankAccountsGet').and.returnValue(of(data as any));
    trustComponent.permissionList.ACCOUNTINGisAdmin = true;
    trustComponent.bankType = 'trustBankAccount';
    const element = fixtureTrustComponent.nativeElement;
    fixtureTrustComponent.detectChanges();
    expect(element.querySelector('#warning_message')).toBeDefined();
    expect(dialogServiceSpy.calls.any()).toEqual(true);
  });

  it('Should have on trust account', () => {
    let data = JSON.stringify({
      results: [
       {
          id: 0,
          usioBankAccountId: 33,
          name: "Account 12",
          isMerchantAccount: false,
          isCreditCardAccount: null,
          isAchAccount: null,
          nonMerchantAccountNumber: "2312312312312",
          merchantAccountNumber: null,
          lastTransactionDate: "2020-10-15T10:11:02.77",
          isSelected: false,
          status: null
       }]
    });
    let trustAccountService: UsioService = TestBed.get(UsioService);
    fixtureTrustComponent = TestBed.createComponent(OfficeTrustBankAccountComponent);
    trustComponent = fixtureTrustComponent.componentInstance;
    spyOn(trustComponent, 'getUsioTenantTrustBankAccounts').and.callThrough();
    spyOn(trustComponent, 'onSelect').and.callThrough();
    trustComponent.bankType = 'trustBankAccount';
    const dialogServiceSpy = spyOn(trustAccountService, 'v1UsioGetUsioTenantBankAccountsGet').and.returnValue(of(data as any));
    trustComponent.permissionList.ACCOUNTINGisAdmin = true;
    trustComponent.bankType = 'trustBankAccount';
    expect(dialogServiceSpy.calls.any()).toEqual(true);
  });
});
