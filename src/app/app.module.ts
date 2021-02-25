import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { StoreModule } from '@ngrx/store';
import { GridsterModule } from 'angular-gridster2';
import { ChartsModule } from 'ng2-charts';
import { Ng5SliderModule } from 'ng5-slider';
import { EllipsisModule } from "ngx-ellipsis";
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { MalihuScrollbarModule } from 'ngx-malihu-scrollbar';
import { NgSlimScrollModule } from 'ngx-slimscroll';
import { ToastrModule } from 'ngx-toastr';
import { ApiModule } from 'src/common/swagger-providers/api.module';
import { AppConfigService } from './app-config.service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AccessDeniedComponent } from './common-component/access-denied/access-denied.component';
import { LayoutComponent } from './common-component/layout/layout.component';
import { PageNotFoundComponent } from './common-component/page-not-found/page-not-found.component';
import { SidebarComponent } from './common-component/sidebar/sidebar.component';
import { TimezoneMessageComponent } from './common-component/timezone-message/timezone-message.component';
import { TopbarModule } from './common-component/topbar/topbar.module';
import { UploadProgressPenalComponent } from './common-component/upload-progress-panel/upload-progress-panel.component';
import { ClientRetentionUploadDocSectionComponent } from './common-component/client-retention-upload-doc-section/client-retention-upload-doc-section.component';
import { AuthInterceptor } from './guards/interceptors/auth-interceptor';
import { BulkDownloadComponent } from './modules/billing/bulk-download/bulk-download.component';
import { DashComponent } from './modules/dashboard/dash/dash.component';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DashmainComponent } from './modules/dashboard/dashmain/dashmain.component';
import { NewDashboardComponent } from './modules/dashboard/new-dashboard/new-dashboard.component';
import { SharedModule } from './modules/shared/shared.module';
import { SharedService } from './modules/shared/sharedService';
import { TimersModule } from './modules/timers/timers.module';
import { reducers } from './store';
import { ESignPopupComponent } from './common-component/e-sign-popup/e-sign-popup.component';

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

// Add this function
export function initConfig(config: AppConfigService) {
  return () => config.loadCofig();
}

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    LayoutComponent,
    DashmainComponent,
    NewDashboardComponent,
    DashComponent,
    AccessDeniedComponent,
    PageNotFoundComponent,
    UploadProgressPenalComponent,
    BulkDownloadComponent,
    TimezoneMessageComponent,
    ClientRetentionUploadDocSectionComponent,
    ESignPopupComponent
  ],
  imports: [
    BrowserModule,
    DashboardModule,
    AppRoutingModule,
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
    NgxIndexedDBModule.forRoot(dbConfig),
    MatProgressSpinnerModule,
    TopbarModule,
    TimersModule,
    GridsterModule
  ],
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
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
