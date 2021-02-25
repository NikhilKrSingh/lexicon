import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { AppConfigService, IAppSettings } from 'src/app/app-config.service';
import { AddOnServicesComponent } from 'src/app/modules/shared/fixed-fee-pre-bill/add-on-services/add-on-services.component';
import { FixedFeeServicesComponent } from 'src/app/modules/shared/fixed-fee-pre-bill/fixed-fee-services/fixed-fee-services.component';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { reducers } from 'src/app/store';
import { ApiModule } from 'src/common/swagger-providers/api.module';
import * as config from '../../../../../assets/web.config.json';
import { ViewPreBillingDisbursementsComponent } from './disbursements/disbursements.component';
import { ViewPreBillingTimeComponent } from './time/time.component';
import { PreBillViewComponent } from './view.component';

@Injectable()
export class CustomAppConfigService {
  appConfig: IAppSettings = config;

  APP_URL = `${window.location.protocol}//${window.location.host}`;
  valid_payment_methods = ['CASH', 'CHECK', 'E-CHECK', 'CREDIT_CARD'];
}

describe('PreBillViewComponent', () => {
  let component: PreBillViewComponent;
  let fixture: ComponentFixture<PreBillViewComponent>;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        PreBillViewComponent, FixedFeeServicesComponent, AddOnServicesComponent, ViewPreBillingTimeComponent, ViewPreBillingDisbursementsComponent
      ],
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
      ],
      providers: [
        CustomAppConfigService,
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({
              matterId: '5711',
              prebillingId: '1257',
            }),
          },
        },
        {
          provide: AppConfigService,
          useClass: CustomAppConfigService,
        },
      ],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(PreBillViewComponent);
        component = fixture.debugElement.componentInstance;
        fixture.detectChanges();
      });
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
