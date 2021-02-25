import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { ComponentFixture, fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { AppConfigService, IAppSettings } from 'src/app/app-config.service';
import { reducers } from 'src/app/store';
import { ApiModule } from 'src/common/swagger-providers/api.module';
import { DmsService } from 'src/common/swagger-providers/services';
import { SharedModule } from '../../../modules/shared/shared.module';
import { SharedService } from '../../shared/sharedService';
import { DocumentManagementComponent } from './document-management.component';



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
describe('DocumentManagementComponent', () => {
  let sharedService: SharedService;
  let component: DocumentManagementComponent;
  let fixture: ComponentFixture<DocumentManagementComponent>;
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
      imports: [SharedModule, RouterTestingModule, HttpClientTestingModule, StoreModule.forRoot(reducers), ToastrModule.forRoot({}), ApiModule.forRoot({
        rootUrl: 'https://sc1-api.lexiconservices.com',
      }), NgxIndexedDBModule.forRoot(dbConfig)],
      providers: [
        CustomAppConfigService,
        {
          provide: AppConfigService,
          useClass: CustomAppConfigService,
        },SharedService
      ],
      declarations: [
      ]
    });

    fixture = TestBed.createComponent(DocumentManagementComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
  });

  it('Document search', fakeAsync(() => {
    tick();
    let data : any = {};
    let dmsService =  TestBed.get(DmsService);
    let mySpy = spyOn(dmsService, 'v1DmsSearchGet$Response').and.returnValue(of(data));
    component.searchFolderOrDoc('Bowdon');
    tick();
    expect(mySpy.calls.any()).toBeTruthy();
    expect(mySpy.length).toBeGreaterThan(0);
  }));

  it('Document search 2', fakeAsync(() => {
    tick();
    component.searchForm.controls.searchInput.setValue('Bowden');
    fixture.detectChanges();
    let data : any = JSON.stringify({ results: {
      files: [{x: 'dummy'}, {y: 'dummy'}],
      folders: []
    }});
    let dmsService =  TestBed.get(DmsService);
    let mySpy = spyOn(dmsService, 'v1DmsSearchGet$Response').and.returnValue(of(data as any));
    component.searchFolderOrDoc('Bowdon');
    tick();
    expect(mySpy.calls.any()).toBeTruthy();
  }));

  it('expects service to fetch data with proper sorting',
  inject([HttpTestingController, DmsService],
    (httpMock: HttpTestingController, service: DmsService) => {
      // We call the service
      service.v1DmsSearchGet$Response({search: 'Bowdon'}).subscribe(data => {
        let response: any = JSON.parse(data.body as any).results;
        expect(response).toBeTruthy();
        expect(response.files).toBeDefined();
        expect(response.files.length).toBeGreaterThanOrEqual(0);
        expect(component.searchList.length).toBeGreaterThan(0);
      });
    })
);
});
