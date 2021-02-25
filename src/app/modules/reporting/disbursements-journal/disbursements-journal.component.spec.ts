import { CurrencyPipe } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { AppConfigService, IAppSettings } from 'src/app/app-config.service';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { reducers } from 'src/app/store';
import { ApiModule } from 'src/common/swagger-providers/api.module';
import { ReportService } from 'src/common/swagger-providers/services';
import { SharedModule } from '../../shared/shared.module';
import { DateRangeReportComponent } from '../date-range-report/date-range-report.component';
import { DisbursementsJournalComponent } from './disbursements-journal.component';

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
describe('DisbursementsJournalComponent', () => {
  let component: DisbursementsJournalComponent;
  let fixture: ComponentFixture<DisbursementsJournalComponent>;
  let reportService: ReportService;
  let exporttocsvService: ExporttocsvService;

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
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule, HttpClientTestingModule, StoreModule.forRoot(reducers), ToastrModule.forRoot({}), ApiModule.forRoot({
        rootUrl: 'https://sc1-api.lexiconservices.com',
      }), NgxIndexedDBModule.forRoot(dbConfig)],
      providers: [
        CustomAppConfigService,
        {
          provide: AppConfigService,
          useClass: CustomAppConfigService,
        }, CurrencyPipe
      ],
      declarations: [
        DisbursementsJournalComponent,
        DateRangeReportComponent
      ]
    });
    fixture = TestBed.createComponent(DisbursementsJournalComponent);
    component = fixture.debugElement.componentInstance;
    fixture.detectChanges();
    reportService = TestBed.get(ReportService);
    exporttocsvService = TestBed.get(ExporttocsvService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call generateWipAgeReport with success', fakeAsync(() => {
    const data = JSON.stringify({
      results: [
        {
          attorneyName: "\"07th July, Employee\"",
          clientNumber: 6436,
          clientName: "\"Test, New\"",
          matterNumber: 5429,
          matterName: "\"New Matter 4276\"",
          wipCurrent: 0.00,
          wiP30_59: 208.90,
          wiP60_89: 0.00,
          wiP90_120: 112.00,
          wiP120_180: 0.00,
          wiP180Plus: 0.00
        }]
    });
    spyOn(component, 'generateDisbursementJournalReport').and.callThrough();
    let reportServiceSpy = spyOn(reportService, 'v1ReportDisbursementJournalReportPost$Json').and.returnValue(of(data as any));
    component.exportCsvFlag = true
    component.startDates = "2020-11-18T00:00:00";
    fixture.detectChanges();
    const downloadButton = fixture.debugElement.nativeElement.querySelector('button#buttonExportToCSV');
    downloadButton.click();
    tick();
    expect(reportServiceSpy.calls.any()).toBeTruthy();
    expect(component.generateDisbursementJournalReport).toHaveBeenCalled();
  }));
});