import { CurrencyPipe } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import {
  BillingService,
  DmsService,
  TenantService,
  TrustAccountService,
  ReverseTransactionService
} from 'src/common/swagger-providers/services';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { ChargeBackTrustTransactionComponent } from './charge-back-trust-transaction/charge-back-trust-transaction.component';
import { TrustTransactionHistoryComponent } from './trust-transaction-history.component';
import { AccountDetailComponent } from './account-detail/account-detail.component';

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
    timerSyncInterval: 15000
  };

  APP_URL = `${window.location.protocol}//${window.location.host}`;
  valid_payment_methods = ['CASH', 'CHECK', 'E-CHECK', 'CREDIT_CARD'];
}
// PlatformLocation
describe('TrustTransactionHistoryComponent', () => {
  let billingService: BillingService;
  let dmsService: DmsService;
  let tenantService: TenantService;
  let reverseTransactionService: ReverseTransactionService;
  let trustAccountService: TrustAccountService;
  let sharedService: SharedService;
  let component: TrustTransactionHistoryComponent;
  let fixture: ComponentFixture<TrustTransactionHistoryComponent>;
  const dbConfig: DBConfig = {
    name: 'Lexicon',
    version: 1,
    objectStoresMeta: [
      {
        store: 'config',
        storeConfig: { keyPath: 'id', autoIncrement: true },
        storeSchema: [
          { name: 'key', keypath: 'key', options: { unique: false } },
          { name: 'value', keypath: 'value', options: { unique: false } }
        ]
      }
    ]
  };
  let data: any[] = [1, 2, 3];
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        StoreModule.forRoot(reducers),
        ToastrModule.forRoot({}),
        SharedModule,
        CommonModule,
        ApiModule.forRoot({
          rootUrl: 'https://sc1-api.lexiconservices.com'
        }),
        NgxIndexedDBModule.forRoot(dbConfig)
      ],
      providers: [
        SharedService,
        CustomAppConfigService,
        {
          provide: AppConfigService,
          useClass: CustomAppConfigService
        },
        CurrencyPipe,
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({
              clientId: '9609',
              state: 'edit'
            })
          }
        }
      ],
      declarations: [
        TrustTransactionHistoryComponent,
        ChargeBackTrustTransactionComponent,
        AccountDetailComponent
      ]
    });
    fixture = TestBed.createComponent(TrustTransactionHistoryComponent);
    component = fixture.debugElement.componentInstance;
    fixture.detectChanges();
    billingService = TestBed.get(BillingService);
    dmsService = TestBed.get(DmsService);
    sharedService = TestBed.get(SharedService);
    tenantService = TestBed.get(TenantService);
    reverseTransactionService = TestBed.get(ReverseTransactionService);
    trustAccountService = TestBed.get(TrustAccountService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('No Action for Reversal row', () => {
    component.matterId = 1;

    const mockReversalRow: any = {
      amount: 12,
      chargeBackReason: null,
      chargeBackTrustTransactionHistoryId: null,
      clientId: 1405,
      confirmationNumber: null,
      createdAt: "2020-09-01T10:15:05.06",
      description: "",
      endingBalance: 55,
      gatewayStatusMessage: null,
      id: 1922,
      isRefundReversal: null,
      matterId: 1245,
      noteToFile: null,
      postedBy: {id: 1304, name: "Lexicon dev, Admin"},
      postingDate: "2020-09-01T10:15:04.947",
      processingDate: "2020-09-01T10:15:04.947",
      receiptFileUrl: null,
      reverseTrustTransactionHistoryId: null,
      reversedCheckReason: null,
      sourceAccountDetails: {
        accountType: "1 - Primary Retainer Trust",
        ccDetails: null,
        checkImageUrl: null,
        checkNumber: null,
        eCheckDetails: null,
        firmTrustAccDetails: null,
        primaryRetainerTrustBankAccount: null,
        trustOnlyAccount: null,
        usioBankAccount: null},
      sourceIsPrimaryTrust: true,
      sourceTrustOnlyAccountId: 0,
      status: "Success",
      targetAccountDetails: {
        accountType: "N/A",
        ccDetails: null,
        checkImageUrl: null,
        checkNumber: null,
        eCheckDetails: null,
        firmTrustAccDetails: null,
        primaryRetainerTrustBankAccount: null,
        trustOnlyAccount: null,
        usioBankAccount: null
      },
      targetEndingBalance: 0,
      targetIsPrimaryTrust: false,
      targetMatterId: 0,
      targetTrustOnlyAccountId: 0,
      transactionType: {
        cellPhone: null,
        code: "REVERSAL",
        email: null,
        id: 156,
        name: "Reversal",
        primaryPhone: null,
        uniqueNumber: 0,
      }
    };

    component.transactions = [mockReversalRow];

    fixture.detectChanges();

    let rows = fixture.debugElement.queryAll(By.css('datatable-row-wrapper'));
    expect(rows).toBeTruthy();

    expect(rows.length).toBe(1);

    component.toggleExpandRow(mockReversalRow);

    fixture.detectChanges();

    let tableHeaders = fixture.debugElement.queryAll(By.css('th'));
    let actionHeader = tableHeaders.find(
      a => a.nativeElement.textContent == 'Action'
    );

    expect(actionHeader).toBeFalsy();
  });

  it('Action for Payment row', () => {
    component.matterId = 1;

    const mockPaymentRow: any = {
      amount: 12,
      chargeBackReason: null,
      chargeBackTrustTransactionHistoryId: null,
      clientId: 1405,
      confirmationNumber: null,
      createdAt: '2020-09-01T10:15:05.06',
      description: '',
      endingBalance: 55,
      gatewayStatusMessage: null,
      id: 1922,
      isRefundReversal: null,
      matterId: 1245,
      noteToFile: null,
      postedBy: { id: 1304, name: 'Lexicon dev, Admin' },
      postingDate: '2020-09-01T10:15:04.947',
      processingDate: '2020-09-01T10:15:04.947',
      receiptFileUrl: null,
      reverseTrustTransactionHistoryId: null,
      reversedCheckReason: null,
      sourceAccountDetails: {
        accountType: '1 - Primary Retainer Trust',
        ccDetails: null,
        checkImageUrl: null,
        checkNumber: null,
        eCheckDetails: null,
        firmTrustAccDetails: null,
        primaryRetainerTrustBankAccount: null,
        trustOnlyAccount: null,
        usioBankAccount: null
      },
      sourceIsPrimaryTrust: true,
      sourceTrustOnlyAccountId: 0,
      status: 'Success',
      targetAccountDetails: {
        accountType: 'Trust-Only Account',
        ccDetails: null,
        checkImageUrl: null,
        checkNumber: null,
        eCheckDetails: null,
        firmTrustAccDetails: null,
        primaryRetainerTrustBankAccount: null,
        trustOnlyAccount: {id: 85,
          name: "Test_TrustAccount",
          trustNumber: 2},
        usioBankAccount: null
      },
      targetEndingBalance: 0,
      targetIsPrimaryTrust: false,
      targetMatterId: 0,
      targetTrustOnlyAccountId: 0,
      transactionType: {
        cellPhone: null,
        code: 'PAYMENT',
        email: null,
        id: 128,
        name: 'payment',
        primaryPhone: null,
        uniqueNumber: 0
      }
    };

    component.transactions = [mockPaymentRow];

    fixture.detectChanges();

    let rows = fixture.debugElement.queryAll(By.css('datatable-row-wrapper'));
    expect(rows).toBeTruthy();

    expect(rows.length).toBe(1);

    component.toggleExpandRow(mockPaymentRow);

    fixture.detectChanges();

    let tableHeaders = fixture.debugElement.queryAll(By.css('th'));
    let actionHeader = tableHeaders.find(
      a => a.nativeElement.textContent == 'Action'
    );

    expect(actionHeader).toBeTruthy();

    component.currentActive = 0;

    let actionDiv = fixture.debugElement.query(
      By.css('.dropdown.dropdown-hover-table')
    );
    expect(actionDiv).toBeTruthy();

    actionDiv.nativeElement.click();

    fixture.detectChanges();

    let dropdownItems = fixture.debugElement.query(By.css('.dropdown-item'));
    expect(dropdownItems).toBeTruthy();

    let reverseTransactionAction = tableHeaders.find(
      a => a.nativeElement.textContent == 'Reverse Transaction'
    );

    expect(reverseTransactionAction).toBeTruthy();
  });

    it('Action for Transfer row', () => {
      component.matterId = 1;

      const mockTransferRow: any = {
        amount: 12,
        chargeBackReason: null,
        chargeBackTrustTransactionHistoryId: null,
        clientId: 1405,
        confirmationNumber: null,
        createdAt: '2020-09-01T10:15:05.06',
        description: '',
        endingBalance: 55,
        gatewayStatusMessage: null,
        id: 1922,
        isRefundReversal: null,
        matterId: 1245,
        noteToFile: null,
        postedBy: { id: 1304, name: 'Lexicon dev, Admin' },
        postingDate: '2020-09-01T10:15:04.947',
        processingDate: '2020-09-01T10:15:04.947',
        receiptFileUrl: null,
        reverseTrustTransactionHistoryId: null,
        reversedCheckReason: null,
        sourceAccountDetails: {
          accountType: '1 - Primary Retainer Trust',
          ccDetails: null,
          checkImageUrl: null,
          checkNumber: null,
          eCheckDetails: null,
          firmTrustAccDetails: null,
          primaryRetainerTrustBankAccount: null,
          trustOnlyAccount: null,
          usioBankAccount: null
        },
        sourceIsPrimaryTrust: true,
        sourceTrustOnlyAccountId: 0,
        status: 'Success',
        targetAccountDetails: {
          accountType: 'Trust-Only Account',
          ccDetails: null,
          checkImageUrl: null,
          checkNumber: null,
          eCheckDetails: null,
          firmTrustAccDetails: null,
          primaryRetainerTrustBankAccount: null,
          trustOnlyAccount: {
            id: 85,
            name: 'Test_TrustAccount',
            trustNumber: 2
          },
          usioBankAccount: null
        },
        targetEndingBalance: 0,
        targetIsPrimaryTrust: false,
        targetMatterId: 0,
        targetTrustOnlyAccountId: 0,
        transactionType: {
          cellPhone: null,
          code: 'TRANSFER',
          email: null,
          id: 129,
          name: 'transfer',
          primaryPhone: null,
          uniqueNumber: 0
        }
      };

      component.transactions = [mockTransferRow];

      fixture.detectChanges();

      let rows = fixture.debugElement.queryAll(By.css('datatable-row-wrapper'));
      expect(rows).toBeTruthy();

      expect(rows.length).toBe(1);

      component.toggleExpandRow(mockTransferRow);

      fixture.detectChanges();

      let tableHeaders = fixture.debugElement.queryAll(By.css('th'));
      let actionHeader = tableHeaders.find(
        a => a.nativeElement.textContent == 'Action'
      );

      expect(actionHeader).toBeTruthy();

      component.currentActive = 0;

      let actionDiv = fixture.debugElement.query(
        By.css('.dropdown.dropdown-hover-table')
      );
      expect(actionDiv).toBeTruthy();

      actionDiv.nativeElement.click();

      fixture.detectChanges();

      let dropdownItems = fixture.debugElement.query(By.css('.dropdown-item'));
      expect(dropdownItems).toBeTruthy();

      let reverseTransactionAction = tableHeaders.find(
        a => a.nativeElement.textContent == 'Reverse Transaction'
      );

      expect(reverseTransactionAction).toBeTruthy();
    });

  it('No Action for Refund row', () => {
    component.matterId = 1;

    const mockRefundRow: any = {
      amount: 12,
      chargeBackReason: null,
      chargeBackTrustTransactionHistoryId: null,
      clientId: 1405,
      confirmationNumber: null,
      createdAt: '2020-09-01T10:15:05.06',
      description: '',
      endingBalance: 55,
      gatewayStatusMessage: null,
      id: 1922,
      isRefundReversal: null,
      matterId: 1245,
      noteToFile: null,
      postedBy: { id: 1304, name: 'Lexicon dev, Admin' },
      postingDate: '2020-09-01T10:15:04.947',
      processingDate: '2020-09-01T10:15:04.947',
      receiptFileUrl: null,
      reverseTrustTransactionHistoryId: null,
      reversedCheckReason: null,
      sourceAccountDetails: {
        accountType: '1 - Primary Retainer Trust',
        ccDetails: null,
        checkImageUrl: null,
        checkNumber: null,
        eCheckDetails: null,
        firmTrustAccDetails: null,
        primaryRetainerTrustBankAccount: null,
        trustOnlyAccount: null,
        usioBankAccount: null
      },
      sourceIsPrimaryTrust: true,
      sourceTrustOnlyAccountId: 0,
      status: 'Success',
      targetAccountDetails: {
        accountType: 'Trust-Only Account',
        ccDetails: null,
        checkImageUrl: null,
        checkNumber: null,
        eCheckDetails: null,
        firmTrustAccDetails: null,
        primaryRetainerTrustBankAccount: null,
        trustOnlyAccount: { id: 85, name: 'Test_TrustAccount', trustNumber: 2 },
        usioBankAccount: null
      },
      targetEndingBalance: 0,
      targetIsPrimaryTrust: false,
      targetMatterId: 0,
      targetTrustOnlyAccountId: 0,
      transactionType: {
        cellPhone: null,
        code: 'REFUND',
        email: null,
        id: 127,
        name: 'refund',
        primaryPhone: null,
        uniqueNumber: 0
      }
    };

    component.transactions = [mockRefundRow];

    fixture.detectChanges();

    let rows = fixture.debugElement.queryAll(By.css('datatable-row-wrapper'));
    expect(rows).toBeTruthy();

    expect(rows.length).toBe(1);

    component.toggleExpandRow(mockRefundRow);

    fixture.detectChanges();

    let tableHeaders = fixture.debugElement.queryAll(By.css('th'));
    let actionHeader = tableHeaders.find(
      a => a.nativeElement.textContent == 'Action'
    );

    expect(actionHeader).toBeFalsy();
  });

});
