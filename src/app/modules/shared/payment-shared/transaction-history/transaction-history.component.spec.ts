import { CurrencyPipe } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
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
import {
  BillingService,
  DmsService,
  MatterService,
  TenantService,
  ReverseTransactionService,
  PotentialClientBillingService,
} from 'src/common/swagger-providers/services';
import { SharedModule } from '../../shared.module';
import { SharedService } from '../../sharedService';
import { PaymentAccountDetailComponent } from './account-detail/account-detail.component';
import { ChargebackComponent } from './chargeback/chargeback.component';
import { TransactionHistoryComponent } from './transaction-history.component';

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
describe('TransactionHistoryComponent', () => {
  let billingService: BillingService;
  let dmsService: DmsService;
  let matterService: MatterService;
  let tenantService: TenantService;
  let reverseTransactionService: ReverseTransactionService;
  let potentialClientBillingService: PotentialClientBillingService;
  let component: TransactionHistoryComponent;
  let fixture: ComponentFixture<TransactionHistoryComponent>;
  const dbConfig: DBConfig = {
    name: 'Lexicon',
    version: 1,
    objectStoresMeta: [
      {
        store: 'config',
        storeConfig: { keyPath: 'id', autoIncrement: true },
        storeSchema: [
          { name: 'key', keypath: 'key', options: { unique: false } },
          { name: 'value', keypath: 'value', options: { unique: false } },
        ],
      },
    ],
  };
  let data: any[] = [1, 2, 3];
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        HttpClientTestingModule,
        StoreModule.forRoot(reducers),
        ToastrModule.forRoot({}),
        ApiModule.forRoot({
          rootUrl: 'https://sc1-api.lexiconservices.com',
        }),
        NgxIndexedDBModule.forRoot(dbConfig),
      ],
      providers: [
        CustomAppConfigService,
        {
          provide: AppConfigService,
          useClass: CustomAppConfigService,
        },
        SharedService,
        CurrencyPipe,
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({
              clientId: '9609',
              state: 'edit',
            }),
          },
        },
      ],
      declarations: [
        TransactionHistoryComponent,
        ChargebackComponent,
        PaymentAccountDetailComponent,
      ],
    });
    fixture = TestBed.createComponent(TransactionHistoryComponent);
    component = fixture.debugElement.componentInstance;
    fixture.detectChanges();
    billingService = TestBed.get(BillingService);
    dmsService = TestBed.get(DmsService);
    matterService = TestBed.get(MatterService);
    tenantService = TestBed.get(TenantService);
    reverseTransactionService = TestBed.get(ReverseTransactionService);
    potentialClientBillingService = TestBed.get(PotentialClientBillingService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('title should be Matter Ledger History for matter', () => {
    component.matterId = 1;

    fixture.detectChanges();

    let title = fixture.debugElement.query(By.css('h2'));
    expect(title).toBeTruthy();

    expect(title.nativeElement.textContent).toBe('Matter Ledger History');
  });

  it('title should be Potential Client Ledger History for PC', () => {
    component.matterId = 1;
    component.clientId = 1;

    fixture.detectChanges();

    let title = fixture.debugElement.query(By.css('h2'));
    expect(title).toBeTruthy();

    expect(title.nativeElement.textContent).toBe(
      'Potential Client Ledger History'
    );
  });

  it('No Action for Reversal row', () => {
    component.matterId = 1;
    component.clientId = 1;

    const mockReversalRow: any = {
      id: 2240,
      type: 'Reversal',
      postedBy: '28.10.1, Employee',
      credit: 0,
      debit: 0.18,
      postingDate: '2021-01-26T11:44:20.247',
      applicableDate: '2021-01-21T00:00:00',
      paymentMethodType: 'Credit Card',
      confirmationId: '21012605441925248TEST',
      chargeBackPaymentId: null,
      initialPostingDate: '2021-01-26T11:44:20.247',
      chargeBackReason: null,
      reversePaymentReason: null,
      reversePaymentId: null,
      status: 'Success',
      eCheck: null,
      creditCard: {
        id: 1062,
        code: null,
        name: '1111',
        email: null,
        primaryPhone: null,
        uniqueNumber: 0,
        cellPhone: null,
      },
      reverseCheckReason: {
        id: 54,
        code: '50062',
        name: 'TRCAuto1221201912',
        email: null,
        primaryPhone: null,
        uniqueNumber: 0,
        cellPhone: null,
      },
      noteToFile: 'PC - 040239023 ',
      checkNumber: null,
      scannedCheckImgUrl: null,
      receiptFileUrl: null,
      refundDate: null,
      gatewayStatusMessage: 'success',
      accountInfo: {
        bankId: 210,
        accountName: '10 November Account 1',
        accountNumber: '123456789012',
        accountRoutingNumber: null,
        accountType: 'Operating Account',
      },
      primaryRetainerTrustBankAccount: null,
      invoiceFileId: null,
    };

    component.invoiceList = [mockReversalRow];

    fixture.detectChanges();

    let title = fixture.debugElement.query(By.css('h2'));
    expect(title).toBeTruthy();

    expect(title.nativeElement.textContent).toBe(
      'Potential Client Ledger History'
    );

    let rows = fixture.debugElement.queryAll(By.css('datatable-row-wrapper'));
    expect(rows).toBeTruthy();

    expect(rows.length).toBe(1);

    component.toggleExpandRow(mockReversalRow);

    fixture.detectChanges();

    let tableHeaders = fixture.debugElement.queryAll(By.css('th'));
    let actionHeader = tableHeaders.find(
      (a) => a.nativeElement.innerText == 'Action'
    );

    expect(actionHeader).toBeFalsy();
  });

  it('No Reverse Transaction Action for Reversed Payment row', () => {
    component.matterId = 1;
    component.clientId = 1;

    const mockPaymentRow: any = {
      id: 2239,
      type: 'Payment',
      postedBy: '28.10.1, Employee',
      credit: 0.18,
      debit: 0,
      postingDate: '2021-01-26T11:41:36.567',
      applicableDate: null,
      paymentMethodType: 'Credit Card',
      confirmationId: '2101260541362265TEST',
      chargeBackPaymentId: null,
      initialPostingDate: '2021-01-26T00:00:00',
      chargeBackReason: null,
      reversePaymentReason: null,
      reversePaymentId: 2240,
      status: 'Reversed',
      eCheck: null,
      creditCard: {
        id: 1062,
        code: null,
        name: '1111',
        email: null,
        primaryPhone: null,
        uniqueNumber: 0,
        cellPhone: null,
      },
      reverseCheckReason: null,
      noteToFile: null,
      checkNumber: null,
      scannedCheckImgUrl: null,
      receiptFileUrl:
        'https://quartodmsqa.blob.core.windows.net/quarto-dms-data/tenant-1006/ReceiptFiles/8e1c623f-a674-4fb3-8c66-6d0f3830850e_Receipt -20210126110138-7888.pdf',
      refundDate: null,
      gatewayStatusMessage: 'success',
      accountInfo: {
        bankId: 210,
        accountName: '10 November Account 1',
        accountNumber: '123456789012',
        accountRoutingNumber: null,
        accountType: 'Operating Account',
      },
      primaryRetainerTrustBankAccount: null,
      invoiceFileId: null,
    };

    component.invoiceList = [mockPaymentRow];

    fixture.detectChanges();

    let title = fixture.debugElement.query(By.css('h2'));
    expect(title).toBeTruthy();

    expect(title.nativeElement.textContent).toBe(
      'Potential Client Ledger History'
    );

    let rows = fixture.debugElement.queryAll(By.css('datatable-row-wrapper'));
    expect(rows).toBeTruthy();

    expect(rows.length).toBe(1);

    component.toggleExpandRow(mockPaymentRow);

    fixture.detectChanges();

    let tableHeaders = fixture.debugElement.queryAll(By.css('th'));
    let actionHeader = tableHeaders.find(
      (a) => a.nativeElement.innerText == 'Action'
    );

    expect(actionHeader).toBeTruthy();

    component.currentActive = 0;

    let actionDiv = fixture.debugElement.query(By.css('.dropdown.dropdown-hover-table'));
    expect(actionDiv).toBeFalsy();

    let dropdownItems = fixture.debugElement.query(By.css('.dropdown-item'));
    expect(dropdownItems).toBeFalsy();
  });

  it('Action for Payment row', () => {
    component.matterId = 1;
    component.clientId = 1;

    const mockPaymentRow: any = {
      id: 2239,
      type: 'Payment',
      postedBy: '28.10.1, Employee',
      credit: 0.18,
      debit: 0,
      postingDate: '2021-01-26T11:41:36.567',
      applicableDate: null,
      paymentMethodType: 'Credit Card',
      confirmationId: '2101260541362265TEST',
      chargeBackPaymentId: null,
      initialPostingDate: '2021-01-26T00:00:00',
      chargeBackReason: null,
      reversePaymentReason: null,
      reversePaymentId: 2240,
      status: 'Success',
      eCheck: null,
      creditCard: {
        id: 1062,
        code: null,
        name: '1111',
        email: null,
        primaryPhone: null,
        uniqueNumber: 0,
        cellPhone: null,
      },
      reverseCheckReason: null,
      noteToFile: null,
      checkNumber: null,
      scannedCheckImgUrl: null,
      receiptFileUrl:
        'https://quartodmsqa.blob.core.windows.net/quarto-dms-data/tenant-1006/ReceiptFiles/8e1c623f-a674-4fb3-8c66-6d0f3830850e_Receipt -20210126110138-7888.pdf',
      refundDate: null,
      gatewayStatusMessage: 'success',
      accountInfo: {
        bankId: 210,
        accountName: '10 November Account 1',
        accountNumber: '123456789012',
        accountRoutingNumber: null,
        accountType: 'Operating Account',
      },
      primaryRetainerTrustBankAccount: null,
      invoiceFileId: null,
    };

    component.invoiceList = [mockPaymentRow];

    fixture.detectChanges();

    let title = fixture.debugElement.query(By.css('h2'));
    expect(title).toBeTruthy();

    expect(title.nativeElement.textContent).toBe(
      'Potential Client Ledger History'
    );

    let rows = fixture.debugElement.queryAll(By.css('datatable-row-wrapper'));
    expect(rows).toBeTruthy();

    expect(rows.length).toBe(1);

    component.toggleExpandRow(mockPaymentRow);

    fixture.detectChanges();

    let tableHeaders = fixture.debugElement.queryAll(By.css('th'));
    let actionHeader = tableHeaders.find(
      (a) => a.nativeElement.innerText == 'Action'
    );


    expect(actionHeader).toBeTruthy();

    component.isBillingOrResponsibleAttorney = true;
    component.permissionList = {
      BILLING_MANAGEMENTisEdit: true,
      BILLING_MANAGEMENTisAdmin: true,
      ACCOUNTINGisAdmin: true,
      ACCOUNTINGisEdit: true
    };

    fixture.detectChanges();

    let actionDiv = fixture.debugElement.query(By.css('.dropdown.dropdown-hover-table'));
    expect(actionDiv).toBeTruthy();

    spyOn(component, 'openMenu');

    actionDiv.nativeElement.click();

    fixture.detectChanges();

    expect(component.openMenu).toHaveBeenCalled();
    expect(component.currentActive).toBe(0);

    let dropdownItems = fixture.debugElement.queryAll(By.css('.dropdown-item'));
    expect(dropdownItems).toBeTruthy();

    let reverseTransactionAction = dropdownItems.find(
      (a) => a.nativeElement.innerText == 'Reverse Transaction'
    );

    expect(reverseTransactionAction).toBeTruthy();
  });

  it('No Action for Refund row', () => {
    component.matterId = 1;
    component.clientId = 1;

    const mockRefundRow: any = {
      id: 2241,
      type: 'Refund',
      postedBy: '28.10.1, Employee',
      credit: 0,
      debit: 0.18,
      postingDate: '2021-01-26T11:44:20.247',
      applicableDate: '2021-01-21T00:00:00',
      paymentMethodType: 'Credit Card',
      confirmationId: '21012605441925248TEST',
      chargeBackPaymentId: null,
      initialPostingDate: '2021-01-26T11:44:20.247',
      chargeBackReason: null,
      reversePaymentReason: null,
      reversePaymentId: null,
      status: 'Success',
      eCheck: null,
      creditCard: {
        id: 1062,
        code: null,
        name: '1111',
        email: null,
        primaryPhone: null,
        uniqueNumber: 0,
        cellPhone: null
      },
      reverseCheckReason: null,
      noteToFile: 'PC - 040239023 ',
      checkNumber: null,
      scannedCheckImgUrl: null,
      receiptFileUrl: null,
      refundDate: '2020-09-22T00:00:00',
      gatewayStatusMessage: 'success',
      accountInfo: {
        bankId: 210,
        accountName: '10 November Account 1',
        accountNumber: '123456789012',
        accountRoutingNumber: null,
        accountType: 'Operating Account'
      },
      primaryRetainerTrustBankAccount: null,
      invoiceFileId: null
    };

    component.invoiceList = [mockRefundRow];

    fixture.detectChanges();

    let title = fixture.debugElement.query(By.css('h2'));
    expect(title).toBeTruthy();

    expect(title.nativeElement.textContent).toBe(
      'Potential Client Ledger History'
    );

    let rows = fixture.debugElement.queryAll(By.css('datatable-row-wrapper'));
    expect(rows).toBeTruthy();

    expect(rows.length).toBe(1);

    component.toggleExpandRow(mockRefundRow);

    fixture.detectChanges();

    let tableHeaders = fixture.debugElement.queryAll(By.css('th'));
    let actionHeader = tableHeaders.find(
      (a) => a.nativeElement.innerText == 'Action'
    );

    expect(actionHeader).toBeFalsy();
  });

  it('No Action for Chargeback row', () => {
    component.matterId = 1;
    component.clientId = 1;

    const mockChargebackRow: any = {
      id: 2242,
      type: 'Chargeback',
      postedBy: '28.10.1, Employee',
      credit: 0,
      debit: 0.18,
      postingDate: '2021-01-26T11:44:20.247',
      applicableDate: '2021-01-21T00:00:00',
      paymentMethodType: 'Chargeback',
      confirmationId: '21012605441925248TEST',
      chargeBackPaymentId: null,
      initialPostingDate: '2021-01-26T11:44:20.247',
      chargeBackReason: null,
      reversePaymentReason: null,
      reversePaymentId: null,
      status: 'Success',
      eCheck: null,
      creditCard: {
        id: 1062,
        code: null,
        name: '1111',
        email: null,
        primaryPhone: null,
        uniqueNumber: 0,
        cellPhone: null
      },
      reverseCheckReason: null,
      noteToFile: null,
      checkNumber: null,
      scannedCheckImgUrl: null,
      receiptFileUrl: null,
      refundDate: null,
      gatewayStatusMessage: 'success',
      accountInfo: {
        bankId: 210,
        accountName: '10 November Account 1',
        accountNumber: '123456789012',
        accountRoutingNumber: null,
        accountType: 'Operating Account'
      },
      primaryRetainerTrustBankAccount: null,
      invoiceFileId: null
    };

    component.invoiceList = [mockChargebackRow];

    fixture.detectChanges();

    let title = fixture.debugElement.query(By.css('h2'));
    expect(title).toBeTruthy();

    expect(title.nativeElement.textContent).toBe(
      'Potential Client Ledger History'
    );

    let rows = fixture.debugElement.queryAll(By.css('datatable-row-wrapper'));
    expect(rows).toBeTruthy();

    expect(rows.length).toBe(1);

    component.toggleExpandRow(mockChargebackRow);

    fixture.detectChanges();

    let tableHeaders = fixture.debugElement.queryAll(By.css('th'));
    let actionHeader = tableHeaders.find(
      (a) => a.nativeElement.innerText == 'Action'
    );

    expect(actionHeader).toBeFalsy();
  });
});
