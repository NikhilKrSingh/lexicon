import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SharedModule } from '../../shared/shared.module';
import { RichTextEditorAllModule } from '@syncfusion/ej2-angular-richtexteditor';
import { ToastrModule } from 'ngx-toastr';
import { StoreModule } from '@ngrx/store';
import { reducers } from 'src/app/store';
import { UsioService } from 'src/common/swagger-providers/services';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { ResendOwnerInfoEmailComponent } from './resend-owner-info-email.component';
import { of, throwError } from 'rxjs';

describe('ResendOwnerInfoEmailComponent', () => {
    let component: ResendOwnerInfoEmailComponent;
    let fixture: ComponentFixture<ResendOwnerInfoEmailComponent>;
    let usioService: UsioService;
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
                ResendOwnerInfoEmailComponent
            ]
        }).compileComponents().then(() => {
            fixture = TestBed.createComponent(ResendOwnerInfoEmailComponent);
            usioService = TestBed.get(UsioService);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have accountId and email', () => {
        component.accountId = 12;
        component.email.setValue('xyz@gmail.com');
        expect(component.accountId).toBe(12);
        expect(component.email.value).toBe('xyz@gmail.com');
    });

    it('should send email to owner', () => {
        const dump = { token: '', status: 200 };
        component.accountId = 12;
        component.email.setValue('xyz@gmail.com');
        let spyResend = spyOn(usioService, 'v1UsioSendEmailForESignPost$Response').and.returnValue(of(dump as any));
        component.resendEmailToOwners();
        expect(usioService.v1UsioSendEmailForESignPost$Response).toHaveBeenCalled();
    });

    it('should handle Error', () => {
        component.accountId = 12;
        component.email.setValue('xyz@gmail.com');
        spyOn(usioService, 'v1UsioSendEmailForESignPost$Response').and.returnValue(throwError({}));
        component.resendEmailToOwners();
    });
});