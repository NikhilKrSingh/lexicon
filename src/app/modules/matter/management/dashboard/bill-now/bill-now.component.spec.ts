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
import { InvoiceService } from 'src/app/service/invoice.service';
import { reducers } from 'src/app/store';
import { ApiModule } from 'src/common/swagger-providers/api.module';
import { BillNowComponent } from './bill-now.component';

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

describe('BillNowComponent', () => {
  let component: BillNowComponent;
  let fixture: ComponentFixture<BillNowComponent>;
  let invoiceService: InvoiceService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        BillNowComponent,
        FixedFeeServicesComponent,
        AddOnServicesComponent,
      ],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        SharedModule,
        CommonModule,
        ApiModule.forRoot({
          rootUrl: 'https://sc1-api.lexiconservices.com',
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
              matterId: '6830',
              billType: 'WorkComplete',
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
        fixture = TestBed.createComponent(BillNowComponent);
        invoiceService = TestBed.get(InvoiceService);
        component = fixture.debugElement.componentInstance;
        component.loading = false;
        fixture.detectChanges();
      });
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
