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
import { SharedModule } from '../../../modules/shared/shared.module';
import { WipAgingReportComponent } from './wip-aging-report.component';

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
describe('WipAgingReportComponent', () => {
  let component: WipAgingReportComponent;
  let fixture: ComponentFixture<WipAgingReportComponent>;
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
        WipAgingReportComponent
      ]
    });
    fixture = TestBed.createComponent(WipAgingReportComponent);
    component = fixture.debugElement.componentInstance;
    fixture.detectChanges();
    reportService = TestBed.get(ReportService);
    exporttocsvService = TestBed.get(ExporttocsvService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should call generateWipAgeReport with success', fakeAsync(() => {
    const data = {
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
    };
    spyOn(component, 'generateWipAgeReport').and.callThrough();
    spyOn(component, 'generateReport').and.callThrough();
    let reportServiceSpy = spyOn(reportService, 'v1ReportWipAgingReportPost$Json').and.returnValue(of(data as any));
    component.rollUpForm.get('selectedRefundBy').setValue(2);
    fixture.detectChanges();
    const downloadButton = fixture.debugElement.nativeElement.querySelector('button#export-wip-age-report');
    downloadButton.click();
    expect(reportServiceSpy.calls.any()).toBeTruthy();
    expect(component.rollUpForm.get('selectedRefundBy').value == 2).toBeTruthy();
    expect(component.generateWipAgeReport).toHaveBeenCalled();
  }));

  it('should call generateWipAgeReport with error', () => {
    spyOn(component, 'generateWipAgeReport').and.callThrough();
    component.rollUpForm.controls['selectedRefundFor'].setValue('');
    component.rollUpForm.controls['selectedRefundBy'].setValue('');
    fixture.detectChanges();
    const downloadButton = fixture.debugElement.nativeElement.querySelector('button#export-wip-age-report');
    downloadButton.click();
    expect(component.generateWipAgeReport).toHaveBeenCalled();
  });

  it('should call createRequestBody', fakeAsync(() => {
    spyOn(component, 'createRequestBody').and.callThrough();
    component.selectedAge = 1;
    fixture.detectChanges();
    const downloadButton = fixture.debugElement.nativeElement.querySelector('button#export-wip-age-report');
    downloadButton.click();
    tick();

    expect(component.defaultBody.agingBracket30).toBeTruthy();
    expect(component.createRequestBody).toHaveBeenCalled();
  }));

  it('should call createRequestBody', fakeAsync(() => {
    spyOn(component, 'createRequestBody').and.callThrough();
    component.selectedAge = 2;
    fixture.detectChanges();
    const downloadButton = fixture.debugElement.nativeElement.querySelector('button#export-wip-age-report');
    downloadButton.click();
    tick();
    expect(component.defaultBody.agingBracket60).toBeTruthy();
    expect(component.createRequestBody).toHaveBeenCalled();
  }));
  it('should call createRequestBody', fakeAsync(() => {
    spyOn(component, 'createRequestBody').and.callThrough();
    component.selectedAge = 3;
    fixture.detectChanges();
    const downloadButton = fixture.debugElement.nativeElement.querySelector('button#export-wip-age-report');
    downloadButton.click();
    tick();
    expect(component.defaultBody.agingBracket90).toBeTruthy();
    expect(component.createRequestBody).toHaveBeenCalled();
  }));
  it('should call createRequestBody', fakeAsync(() => {
    spyOn(component, 'createRequestBody').and.callThrough();
    component.selectedAge = 4;
    fixture.detectChanges();
    const downloadButton = fixture.debugElement.nativeElement.querySelector('button#export-wip-age-report');
    downloadButton.click();
    tick();
    expect(component.defaultBody.agingBracket120Plus).toBeTruthy();
    expect(component.createRequestBody).toHaveBeenCalled();
  }));
  it('should call createRequestBody', fakeAsync(() => {
    spyOn(component, 'createRequestBody').and.callThrough();
    component.selectedAge = 5;
    fixture.detectChanges();
    const downloadButton = fixture.debugElement.nativeElement.querySelector('button#export-wip-age-report');
    downloadButton.click();
    tick();
    expect(component.defaultBody.agingBracket180Plus).toBeTruthy();
    expect(component.createRequestBody).toHaveBeenCalled();
  }));
  it('should call createRequestBody', fakeAsync(() => {
    spyOn(component, 'createRequestBody').and.callThrough();
    component.rollUpForm.get('selectedRefundFor').setValue(1);
    component.rollUpForm.get('selectedRefundBy').setValue(1);
    fixture.detectChanges();
    const downloadButton = fixture.debugElement.nativeElement.querySelector('button#export-wip-age-report');
    downloadButton.click();
    tick();
    expect(component.defaultBody.isRollupByResponsibleAttorney).toBeTruthy();
    expect(component.defaultBody.isRollupByOffice).toBeTruthy();
    expect(component.createRequestBody).toHaveBeenCalled();
  }));

  it('should call ExportToCSV with success', fakeAsync(() => {
    const data = {
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
    };
    spyOn(component, 'ExportToCSV').and.callThrough();
    let exporttocsvServiceSpy = spyOn(exporttocsvService, 'downloadReportFile').and.returnValue();
    component.ExportToCSV('wip-aging-report', data, [{
      Name: 'wiP30Plus',
      displayName: 'WIP 30-59'
    }]);
    expect(exporttocsvServiceSpy.calls.any()).toBeTruthy();
    expect(component.ExportToCSV).toHaveBeenCalled();
  }));

});