import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StoreModule } from '@ngrx/store';
import { ToastrModule } from 'ngx-toastr';
import { IAppSettings } from 'src/app/app-config.service';
import * as config from '../../../../assets/web.config.json';
import { SharedModule } from '../shared.module';
import { TimeEntryBillNowComponent } from './time-entry-bill-now.component';

@Injectable()
export class CustomAppConfigService {
  appConfig: IAppSettings = config;

  APP_URL = `${window.location.protocol}//${window.location.host}`;
  valid_payment_methods = ['CASH', 'CHECK', 'E-CHECK', 'CREDIT_CARD'];
}
xdescribe('TimeEntryBillNowComponent', () => {
  let component: TimeEntryBillNowComponent;
  let fixture: ComponentFixture<TimeEntryBillNowComponent>;
  let ngbActiveModal: NgbActiveModal;
  let originalTimeout = 0;
  beforeEach(async(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, SharedModule, StoreModule.forRoot({}), ToastrModule.forRoot({})],
      providers: [NgbActiveModal]
    })
      .compileComponents().then(() => {
        fixture = TestBed.createComponent(TimeEntryBillNowComponent);
        component = fixture.debugElement.componentInstance;
        fixture.detectChanges();
      });
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

});
