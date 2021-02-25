import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { ToastrModule } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { TrustAccountService } from 'src/common/swagger-providers/services';
import { AccountingTransferQueueComponent } from "./accounting-transfer-queue.component";

describe('Accounting Paper Check Transaction', () => {
    let component: AccountingTransferQueueComponent;
    let fixture: ComponentFixture<AccountingTransferQueueComponent>;
    let trustAccountService: TrustAccountService;
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
            declarations: [
                AccountingTransferQueueComponent
            ],
            providers: [
                TrustAccountService
            ]
        });
        fixture = TestBed.createComponent(AccountingTransferQueueComponent);
        component = fixture.componentInstance;
        trustAccountService = TestBed.get(TrustAccountService);
        fixture.detectChanges();
    });

    it('Should create Accounting Paper Check Transaction component', () => {
        expect(component).toBeTruthy();
    });

    it('Should have trust Account permission and get Trust Acount Time', fakeAsync(() => {
        let respTime = { body : JSON.stringify({ results: "10:12 pm"})};
        let respPermission = { body: JSON.stringify( {results: true }) };
        
        const spyOnTrustAccountEnable = spyOn(trustAccountService, 'v1TrustAccountGetTrustAccountStatusGet$Response')
            .and.returnValue(of(respPermission as any));
        
        spyOn(trustAccountService, 'v1TrustAccountGetTrustAccountTimeGet$Response')
            .and.returnValue(of(respTime as any));

        component.ngOnInit();
        tick();
        expect(spyOnTrustAccountEnable.calls.any()).toBeTruthy();
        expect(component.isTrustAccountEnabled).toBeTruthy(); 
        expect(component.trustAccountTime).toBe("10:12 pm");
    }));

    it('Should don\'t have trust Account Permission', fakeAsync(() => {
        let resp = { body: JSON.stringify( {results: false }) };
        spyOn(trustAccountService, 'v1TrustAccountGetTrustAccountStatusGet$Response')
            .and.returnValue(of(resp as any));
        spyOn(trustAccountService, 'v1TrustAccountGetTrustAccountTimeGet$Response')
            .and.returnValue(of({ body: JSON.stringify({ results: null }) } as any));
        component.ngOnInit();
        tick();
        expect(component.isTrustAccountEnabled).toBeFalsy(); 
        expect(component.trustAccountTime).toBe("6:00 pm");
    }));

    it('Should handle error', fakeAsync(() => {
        spyOn(trustAccountService, 'v1TrustAccountGetTrustAccountStatusGet$Response')
            .and.returnValue(throwError({}));
        component.ngOnInit();
        tick();
        expect(component.loading).toBeFalsy();
    }));

    it('Should select Cash/Paper Check Transactions', () => {
        component.selectTabs = component.allTabs[1];
        expect(component.selectTabs).toBe('Cash/Paper Check Transactions');
    });
});