import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { APP_INITIALIZER } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NavigationStart, Router, RouterModule } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { StoreModule } from '@ngrx/store';
import { ChartsModule } from 'ng2-charts';
import { Ng5SliderModule } from 'ng5-slider';
import { EllipsisModule } from 'ngx-ellipsis';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { MalihuScrollbarModule } from 'ngx-malihu-scrollbar';
import { NgSlimScrollModule } from 'ngx-slimscroll';
import { ToastrModule } from 'ngx-toastr';
import { ApiModule } from 'src/common/swagger-providers/api.module';
import { AppConfigService } from './app-config.service';
import { AppComponent } from './app.component';
import { TopbarModule } from './common-component/topbar/topbar.module';
import { UploadProgressPenalComponent } from './common-component/upload-progress-panel/upload-progress-panel.component';
import { AuthInterceptor } from './guards/interceptors/auth-interceptor';
import { SharedModule } from './modules/shared/shared.module';
import { SharedService } from './modules/shared/sharedService';
import { UtilsHelper } from './modules/shared/utils.helper';
import { TimersModule } from './modules/timers/timers.module';
import { reducers } from './store';

// Add this function
export function initConfig(config: AppConfigService) {
  return () => config.loadCofig();
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

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let sharedService: SharedService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ RouterTestingModule ,
        RouterModule,
        HttpClientTestingModule,
        NgSlimScrollModule,
        NgbModule,
        EllipsisModule,
        HttpClientModule,
        ApiModule.forRoot({}),
        BrowserAnimationsModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
        StoreModule.forRoot(reducers),
        SharedModule,
        ChartsModule,
        Ng5SliderModule,
        MalihuScrollbarModule.forRoot(),
        MatProgressSpinnerModule,
        NgxIndexedDBModule.forRoot(dbConfig),
        TopbarModule,
        TimersModule
      ],
      declarations: [ AppComponent, UploadProgressPenalComponent ],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        },
        {
          provide: APP_INITIALIZER,
          useFactory: initConfig,
          deps: [AppConfigService],
          multi: true
        },
        SharedService
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    sharedService = TestBed.get(SharedService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    UtilsHelper.removeObject('token');
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('firstTimeLoadTopBar should be null', () => {
    component.ngOnInit();
    
    expect(localStorage.getItem('firstTimeLoadTopBar')).toBeNull();
  });

  it('notificationCount should be 0', () => {
    component.ngOnInit();
    
    expect(JSON.parse(localStorage.getItem('notificationCount'))).toBe(0);
  });

  it('isTrustAccountEnabled should be null', () => {
    component.ngOnInit();
    
    expect(JSON.parse(localStorage.getItem('isTrustAccountEnabled'))).toBeNull();
  });

  it('isValidTenantTier should be null', () => {
    component.ngOnInit();

    expect(JSON.parse(localStorage.getItem('isValidTenantTier'))).toBeNull();
  });
  
  it('setPermissions haveBeenCalled if token is found', () => {
    UtilsHelper.setObject('token', 'fake-Token');
    spyOn(component, 'setPermissions');

    component.ngOnInit();

    expect(component.setPermissions).toHaveBeenCalled();
  });

  it('getTuckerAllenAccount haveBeenCalled if token is found', () => {
    UtilsHelper.setObject('token', 'fake-Token');
    spyOn(sharedService, 'getTuckerAllenAccount');

    component.ngOnInit();

    expect(sharedService.getTuckerAllenAccount).toHaveBeenCalled();
  });

  it('getProfilePicture haveBeenCalled if token is found', () => {
    UtilsHelper.setObject('token', 'fake-Token');
    spyOn(sharedService, 'getProfilePicture');

    component.ngOnInit();

    expect(sharedService.getProfilePicture).toHaveBeenCalled();
  });

  it('showTimer should be true if not isDMSUser && showTimer is false', () => {
    component.showTimer = false;
    UtilsHelper.setObject('token', 'fake-Token');
    localStorage.removeItem('isDMSUser');

    component.ngOnInit();

    expect(component.showTimer).toBeTruthy();
  });

  it('fileId should set in localStorage', () => {
    const event = new NavigationStart(42, 'd/test.jpg');
    TestBed.get(Router).events.next(event);

    expect(localStorage.getItem('fileId')).toContain('test.jpg');
  });
  
});
