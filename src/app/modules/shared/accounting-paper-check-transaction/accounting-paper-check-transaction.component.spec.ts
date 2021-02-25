import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, ComponentFixtureAutoDetect, fakeAsync, TestBed, tick, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { ToastrModule } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { TrustAccountService, BillingService } from 'src/common/swagger-providers/services';
import { AccountingPaperCheckTransactionComponent } from "./accounting-paper-check-transaction.component";
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

const firmAccountListDropDown = JSON.stringify({
    token: "nakli token", 
    results: [
        {
          id: 1,
          name: 'start',
          isCreditCardBankAccount: true,
          accountNumber: '3345',
          accountTypeId: 3
        },
        {
          id: 2,
          name: 'end',
          isCreditCardBankAccount: true,
          accountNumber: '3345',
          accountTypeId: 3
        },
        {
          id: 3,
          name: 'end1212',
          isCreditCardBankAccount: true,
          accountNumber: '3345',
          accountTypeId: 3
        },
        {
          id: 6,
          name: 'Trust 1',
          isCreditCardBankAccount: false,
          accountNumber: '0122',
          accountTypeId: 2
        },
        {
          id: 7,
          name: 'Trust 2',
          isCreditCardBankAccount: false,
          accountNumber: '2222',
          accountTypeId: 2
        },
        {
          id: 8,
          name: 'Trust CC 1',
          isCreditCardBankAccount: true,
          accountNumber: '2121',
          accountTypeId: 3
        },
        {
          id: 9,
          name: 'demononmerchantaccount',
          isCreditCardBankAccount: false,
          accountNumber: '2112',
          accountTypeId: 1
        },
        {
          id: 10,
          name: 'demomerchantaccount',
          isCreditCardBankAccount: false,
          accountNumber: '3345',
          accountTypeId: 1
        },
    ]
});

const papercheckTransactionAccounts = JSON.stringify({
    token: 'nakli-token',
    results: [
      {
        transactionType: 'Check',
        id: 1722,
        sourceAccountInfo: {
          title: 'Check #2342424',
          accountType: 5,
          subTitle: '',
          matterId: null,
          matterName: null,
          accountId: null
        },
        targetAccountInfo: {
          title: '11 Nov Account',
          accountType: 1,
          subTitle: 'Trust bank account ending 4242',
          matterId: null,
          matterName: null,
          accountId: 215
        },
        requestedBy: 'Lexicon dev, Admin',
        requestedDate: '2020-11-12T05:32:48.687',
        amount: 10,
        trustAccountStatus: {
          id: 118,
          name: 'Approved'
        },
        description: 'Payment to trust, effective 11/12/2020',
        reasonForRejection: null
      },
      {
        transactionType: 'Check',
        id: 1712,
        sourceAccountInfo: {
          title: 'Firm Operating Account',
          accountType: 12,
          subTitle: 'Account ending 5676',
          matterId: null,
          matterName: null,
          accountId: 0
        },
        targetAccountInfo: {
          title: 'Check #124273872837',
          accountType: 6,
          subTitle: '',
          matterId: null,
          matterName: null,
          accountId: null
        },
        requestedBy: 'Lexicon dev, Admin',
        requestedDate: '2020-11-12T03:12:36.567',
        amount: 12,
        trustAccountStatus: {
          id: 118,
          name: 'Approved'
        },
        description: 'This refund amount will result in a balance due on the matter.',
        reasonForRejection: null
      },
      {
        transactionType: 'Check',
        id: 1711,
        sourceAccountInfo: {
          title: 'Firm Operating Account',
          accountType: 12,
          subTitle: 'Account ending 5676',
          matterId: null,
          matterName: null,
          accountId: 0
        },
        targetAccountInfo: {
          title: 'Check #124273872837',
          accountType: 6,
          subTitle: '',
          matterId: null,
          matterName: null,
          accountId: null
        },
        requestedBy: 'Lexicon dev, Admin',
        requestedDate: '2020-11-12T03:12:22.12',
        amount: 12,
        trustAccountStatus: {
          id: 118,
          name: 'Approved'
        },
        description: 'This refund amount will result in a balance due on the matter.',
        reasonForRejection: null
      },
      {
        transactionType: 'Check',
        id: 1579,
        sourceAccountInfo: {
          title: 'Firm Operating Account',
          accountType: 12,
          subTitle: 'Account ending 5676',
          matterId: null,
          matterName: null,
          accountId: 0
        },
        targetAccountInfo: {
          title: 'Check #543543543543534',
          accountType: 6,
          subTitle: '',
          matterId: null,
          matterName: null,
          accountId: null
        },
        requestedBy: 'Mhetre, Sachin',
        requestedDate: '2020-11-04T22:46:06.153',
        amount: 10,
        trustAccountStatus: {
          id: 119,
          name: 'Pending'
        },
        description: 'fdsg',
        reasonForRejection: null
      },
      {
        transactionType: 'Check',
        id: 1578,
        sourceAccountInfo: {
          title: 'Firm Operating Account',
          accountType: 12,
          subTitle: 'Account ending 5676',
          matterId: null,
          matterName: null,
          accountId: 0
        },
        targetAccountInfo: {
          title: 'Check #343443434343',
          accountType: 6,
          subTitle: '',
          matterId: null,
          matterName: null,
          accountId: null
        },
        requestedBy: 'Mhetre, Sachin',
        requestedDate: '2020-11-04T22:21:53.65',
        amount: 10,
        trustAccountStatus: {
          id: 119,
          name: 'Pending'
        },
        description: 'fdf',
        reasonForRejection: null
      }
    ]
});

const reasonCodeList = JSON.stringify({
  token: 'nakli-token',
  results: [
    {
      code: '#',
      description: 'Retest8246'
    },
    {
      code: '30053',
      description: '30053'
    },
    {
      code: '50000',
      description: 'okok1'
    },
    {
      code: '50034',
      description: '50034'
    }]
});
describe('Unit Testing Cash/Paper Check Transactions Queue', () => {
    let component: AccountingPaperCheckTransactionComponent;
    let fixture: ComponentFixture<AccountingPaperCheckTransactionComponent>;
    let trustAccountService: TrustAccountService;
    let billingService: BillingService;
    let modalService: NgbModal;
    let ngbActiveModal: NgbActiveModal;
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
   
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                RouterTestingModule,        
                SharedModule,
                ToastrModule.forRoot({
                    closeButton: true
                }),
                NgxIndexedDBModule.forRoot(dbConfig)
            ],
            providers: [
                TrustAccountService,
                { provide: ComponentFixtureAutoDetect, useValue: true }
            ]
        });
        fixture = TestBed.createComponent(AccountingPaperCheckTransactionComponent);
        component = fixture.debugElement.componentInstance;
        trustAccountService = TestBed.get(TrustAccountService);
        billingService = TestBed.get(BillingService);
        modalService = TestBed.get(NgbModal);
        ngbActiveModal = TestBed.get(NgbActiveModal);
    });
    it('Should View Rollup Totals N/A, Account Not Selected', async(() => {
      spyOn(trustAccountService, 'v1TrustAccountGetFirmAccountListGet')
          .and.returnValue(of(firmAccountListDropDown as any));
      spyOn(trustAccountService, 'v1TrustAccountGetPaperCheckQueueGet')
          .and.returnValue(of(papercheckTransactionAccounts as any));
      fixture.whenStable().then(() => {
        component.selectedFirmAccount = 'All';
        component.applyFilter();
        fixture.detectChanges();
        expect(component.amount.inBound).toBe(0);
        expect(component.amount.outBound).toBe(0);
        expect(component.amount.totalAmount).toBe(0);
        expect(component.subAmount.inBound).toBe(0);
        expect(component.subAmount.outBound).toBe(0);
        expect(component.subAmount.totalAmount).toBe(0);
      });
      component.ngOnInit();
    }));

    it('Should View Rollup Totals N/A, Account Not Selected', async(() => {
        spyOn(trustAccountService, 'v1TrustAccountGetFirmAccountListGet')
            .and.returnValue(of(firmAccountListDropDown as any));
        spyOn(trustAccountService, 'v1TrustAccountGetPaperCheckQueueGet')
            .and.returnValue(of(papercheckTransactionAccounts as any));
        fixture.whenStable().then(() => {
          component.selectedFirmAccount = 'All';
          component.applyFilter();
          fixture.detectChanges();
          expect(component.amount.inBound).toBe(0);
          expect(component.amount.outBound).toBe(0);
          expect(component.amount.totalAmount).toBe(0);
          expect(component.subAmount.inBound).toBe(0);
          expect(component.subAmount.outBound).toBe(0);
          expect(component.subAmount.totalAmount).toBe(0);
        });
        component.ngOnInit();
    }));

    it('Should View Rollup Totals , Account Selected', async(() => {
      spyOn(trustAccountService, 'v1TrustAccountGetFirmAccountListGet')
          .and.returnValue(of(firmAccountListDropDown as any));
      spyOn(trustAccountService, 'v1TrustAccountGetPaperCheckQueueGet')
          .and.returnValue(of(papercheckTransactionAccounts as any));
      fixture.whenStable().then(() => {
        component.selectedFirmAccount = 'Firm Operating Account';
        component.applyFilter();
        fixture.detectChanges();
        expect(component.amount.inBound).toBe(0);
        expect(component.amount.outBound).toBe(-44);
        expect(component.amount.totalAmount).toBe(-44);
        expect(component.subAmount.inBound).toBe(0);
        expect(component.subAmount.outBound).toBe(-44);
        expect(component.subAmount.totalAmount).toBe(-44);
      });
      component.ngOnInit();
    }));

    describe('Accounting Paper Check Transaction Existence', (() => {
      it('Should create Accounting Paper Check Transaction component', () => {
        expect(component).toBeDefined();
      });
    }));

    describe('Accounting Paper Check Transaction API Testing', (() => {
      it('Should Populate Account Dropdown',async(() => {
        let serviceSpy = spyOn(trustAccountService, 'v1TrustAccountGetFirmAccountListGet')
            .and.returnValue(of(firmAccountListDropDown as any));
        fixture.whenStable().then(() => {
          fixture.detectChanges();
          expect(serviceSpy.calls.any()).toEqual(true);
          expect(component.firmAccountList.length).toBeGreaterThan(2);
        });
        component.ngOnInit();
      }));

      it('Should get list of Paper check transactions Account', async(() => {
          let serviceSpy = spyOn(trustAccountService, 'v1TrustAccountGetPaperCheckQueueGet')
              .and.returnValue(of(papercheckTransactionAccounts as any));
          fixture.whenStable().then(() => {
            fixture.detectChanges();
            expect(serviceSpy.calls.any()).toEqual(true);
            expect(component.manualTransferQueueList.length).toBeGreaterThan(0);
          });
          component.ngOnInit();
      }));

      it('Should get list of Rejection Code', async(() => {
        let serviceSpy = spyOn(billingService, 'v1BillingGetcheckreasoncodesforaccountingqueueGet')
              .and.returnValue(of(reasonCodeList as any));
        fixture.whenStable().then(() => {
          fixture.detectChanges();
            expect(serviceSpy.calls.any()).toEqual(true);
            expect(component.reasonCodeList.length).toBeGreaterThan(0);
        });
        component.ngOnInit();
      }));

      it('Should handle Rejection Code API Error', async(() => {
        const err = {status: 404, statusText: 'Not Found'};
        spyOn(billingService, 'v1BillingGetcheckreasoncodesforaccountingqueueGet')
              .and.returnValue(throwError(JSON.stringify(err)));
        fixture.whenStable().then(() => {
          fixture.detectChanges();
          expect(component.reasonCodeList.length).toBe(0);
        });
        component.ngOnInit();
      }));
    }));

    describe('Reject Transaction', (() => {
      beforeEach(()=> {
        spyOn(trustAccountService, 'v1TrustAccountGetFirmAccountListGet')
            .and.returnValue(of(firmAccountListDropDown as any));
        spyOn(trustAccountService, 'v1TrustAccountGetPaperCheckQueueGet')
          .and.returnValue(of(papercheckTransactionAccounts as any));
        spyOn(billingService, 'v1BillingGetcheckreasoncodesforaccountingqueueGet')
          .and.returnValue(of(reasonCodeList as any));
        spyOn(component, 'openMenu');
        spyOn(modalService, 'open');
        component.ngOnInit();
      });

      afterAll(() => {
        ngbActiveModal.close('--Testing--');
      })

      it('Should open action menu',async(() => {
        fixture.whenStable().then(() => {
          fixture.detectChanges();
          const openActionMenu = fixture.debugElement.nativeElement.querySelector('#action_index-0');
          openActionMenu.click();
          expect(component.openMenu).toHaveBeenCalled();
        });
      }));

      it('Should not option in action Pop of Reject Transaction for Outbound Amount', async(() => {
        fixture.whenStable().then(() => {
          fixture.detectChanges();
          const openActionMenu = fixture.debugElement.nativeElement.querySelector('#action_index-0');
          openActionMenu.click();
          const option = fixture.debugElement.nativeElement.querySelector('#reject-transaction-1');
          expect(option).toBeNull();
        });
      }));

      it('Should option in action Pop of Reject Transaction for Inbound Amount', async(() => {
        fixture.whenStable().then(() => {
          fixture.detectChanges();
          const openActionMenu = fixture.debugElement.nativeElement.querySelector('#action_index-0');
          openActionMenu.click();
          const option = fixture.debugElement.nativeElement.querySelector('#reject-transaction-0');
          expect(option).toBeDefined();
          expect(option.innerHTML).toBe('Reject Transaction');
        });
      }));

      it('Should open Reject Transaction Pop up', async(() => {
        fixture.whenStable().then(() => {
          fixture.detectChanges();
          const openActionMenu = fixture.debugElement.nativeElement.querySelector('div#action_index-0');
          const option = fixture.debugElement.nativeElement.querySelector('a#reject-transaction-0');
          option.click();
          expect(modalService.open).toHaveBeenCalled();
        });
      }));

      it('Should Rject Transaction', async(() => {
        fixture.whenStable().then(() => {
          fixture.detectChanges();
          const option = fixture.debugElement.nativeElement.querySelector('a#reject-transaction-0');
          option.click();
          component.selectedManualAutomaticRow = true;
          // const rejectButton = fixture.debugElement.nativeElement.querySelector('#yes-reject-btn-single');
          // rejectButton.click();
          expect(modalService.open).toHaveBeenCalled();
        });
      }));
    }));
});