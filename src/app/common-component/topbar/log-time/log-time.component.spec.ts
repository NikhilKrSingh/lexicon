import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { IAppSettings } from 'src/app/app-config.service';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { reducers } from 'src/app/store';
import { ApiModule } from 'src/common/swagger-providers/api.module';
import { ClockService } from 'src/common/swagger-providers/services';
import * as config from '../../../../assets/web.config.json';
import { LogTimeComponent } from './log-time.component';

@Injectable()
export class CustomAppConfigService {
  appConfig: IAppSettings = config;

  APP_URL = `${window.location.protocol}//${window.location.host}`;
  valid_payment_methods = ['CASH', 'CHECK', 'E-CHECK', 'CREDIT_CARD'];
}
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
describe('LogTimeComponent', () => {
  let clockService: ClockService;
  let component: LogTimeComponent;
  let fixture: ComponentFixture<LogTimeComponent>;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LogTimeComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        SharedModule,
        CommonModule,
        ApiModule.forRoot({
          rootUrl: config.API_URL,
        }),
        StoreModule.forRoot(reducers),
        ToastrModule.forRoot({}),
        NgxIndexedDBModule.forRoot(dbConfig)
      ],
      providers: [CustomAppConfigService, SharedService],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(LogTimeComponent);
        component = fixture.debugElement.componentInstance;
        fixture.detectChanges();
      });
    clockService = TestBed.get(ClockService);
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getUserBaseRate', () => {
    component.matterDetail = {id: 7134};
    component.loginUser = {id: 1304};
    const data = {
      results: 10,
      token: '3j4h5jtgfejgf3874ih#'
    };
    fixture.detectChanges();
    const clockServiceSpy = spyOn(clockService, 'v1ClockMatterBaserateGet').and.returnValue(of(data)as any);
    component.getUserBaseRate();
    expect(clockServiceSpy.calls.any()).toBeTruthy();
  });

  it('should call getUserBaseRate', () => {
    component.matterDetail = {id: 7134};
    component.loginUser = {id: 1304};
    fixture.detectChanges();
    const clockServiceSpy = spyOn(clockService, 'v1ClockMatterBaserateGet').and.returnValue(of());
    component.getUserBaseRate();
    expect(clockServiceSpy.calls.any()).toBeTruthy();
  });

  it('should call checkDate', () => {
    component.baseRate = 10;
    component.total_hours = 13;
    fixture.detectChanges();
    component.checkDate();
    expect(component.rate).toEqual(0);
  });

  it('should call checkDate', () => {
    component.baseRate = -10;
    component.total_hours = 13;
    component.timeEntryForm.get('dateOfService').setValue('05/11/2020');
    component.timeEntryForm.get('timeWorked').setValue('13');
    component.clientDetail =  {id: 5434};
    fixture.detectChanges();
    component.checkDate();
    expect(component.rate).toBeGreaterThan(0);
  });

  it('should call checkDate', () => {
    component.baseRate = 10;
    component.total_hours = 13;
    component.timeEntryForm.get('dateOfService').setValue('05/11/2020');
    component.timeEntryForm.get('timeWorked').setValue('13');
    component.clientDetail =  {id: 5434};
    fixture.detectChanges();
    component.checkDate();
    expect(component.rate).toBeGreaterThan(0);
  });
});
