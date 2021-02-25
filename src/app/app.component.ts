import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs/Rx';
import * as LogRocket from 'logrocket';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { ObjectVisibilityService } from 'src/common/swagger-providers/services';
import { UploadProgressPenalComponent } from './common-component/upload-progress-panel/upload-progress-panel.component';
import { UtilsHelper } from './modules/shared/utils.helper';
import { CommonService } from './service/common.service';
import * as fromRoot from './store';
import { AppConfigService } from './app-config.service';
import * as fromPermissions from './store/reducers/permission.reducer';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Quarto-Frontend';
  hasUpload = false;
  isClientRetentionDocUpload = false;
  showTimer = false;
  @ViewChild(UploadProgressPenalComponent, { static: false }) penal: UploadProgressPenalComponent;

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;

  constructor(
    private objectVisibilityService: ObjectVisibilityService,
    private store: Store<fromRoot.AppState>,
    public router: Router,
    private sharedService: SharedService,
    private commonService: CommonService,
    private appConfigService: AppConfigService
  ) {
    if (this.appConfigService.appConfig.logRocketEnabled == "true") {
      LogRocket.init(this.appConfigService.appConfig.logRocketAppId);
    }

    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    localStorage.removeItem('firstTimeLoadTopBar');
    UtilsHelper.setObject('notificationCount', 0);
    UtilsHelper.setObject('isTrustAccountEnabled', null);
    UtilsHelper.setObject('isValidTenantTier', null);
    if (UtilsHelper.getToken()) {
      this.setPermissions();
      this.sharedService.getTuckerAllenAccount();
      this.sharedService.getProfilePicture();
    }
    this.router.events.pipe(
      filter(
        event => event instanceof NavigationStart)
    ).subscribe((e: NavigationStart) => {
      const pathArray = e.url.split('/');
      if (pathArray.includes('d')) {
        const index = pathArray.indexOf('d');
        const fileId = pathArray[index + 1];
        localStorage.setItem('fileId', fileId);
      }
    });

    this.commonService.docs.subscribe((value: any) => {
      const res = Array.isArray(value) && value.length ? true : false;
      if (res !== this.hasUpload) {
        this.hasUpload = res;
      }
    });
    this.commonService.clientRetentDocs.subscribe((value: any) => {
      const res = Array.isArray(value) && value.length ? true : false;
      if(!res && value==null){
        setTimeout(() => {
          this.isClientRetentionDocUpload = false;
        }, 2500);
      }else {
        this.isClientRetentionDocUpload = res;
      }

    });
    this.commonService.isLogOutRequest.subscribe((val: any) => {
      if (val) {
        if (val === '401') {
          this.closeWidgetAndLogoutUser();
        } else {
          if (this.hasUpload) {
            localStorage.setItem('isLogoutOutRequest', 'true');
            this.penal.crossClickPenal();
          } else {
            this.closeWidgetAndLogoutUser();
          }
        }
      }
    });

    this.commonService.isLoginRequest.subscribe(val => {
      if (val && this.showTimer !== val) {
        this.showTimer = val;
      }

      this.setLogRocketUser();
    });

    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj && obj.loaded  && obj.datas) {
        let pList = obj.datas;

        if (pList.TIMEKEEPING_SELFisEdit && !localStorage.getItem('isDMSUser')) {
          this.showTimer = true;
        } else {
          this.showTimer = false;
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  private setLogRocketUser() {
    if (this.appConfigService.appConfig.logRocketEnabled == "true") {
      let user = UtilsHelper.getLoginUser();
      if (user) {
        LogRocket.identify(`${this.appConfigService.appConfig.environment || 'DEV'}-${user.userName}`, {
          name: `${this.appConfigService.appConfig.environment || 'DEV'}-${user.lastName}, ${user.firstName}`,
          email: user.email,

          // Add your own custom user variables here, ie:
          subscriptionType: 'pro'
        });
      }
    }
  }

  closeWidgetAndLogoutUser() {
    this.closeWidgets(true);
    this.sharedService.logoutUser();
  }

  setPermissions() {
    this.objectVisibilityService
      .v1ObjectVisibilityUserGet({})
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any[];
        })
      )
      .subscribe(permission => {
        const permisionList = permission || [];
        const pList: any = {};
        if (permisionList && permisionList.length > 0) {
          permisionList.map(obj => {
            UtilsHelper.permission.map(item => {
              pList[obj.code + item] = pList.hasOwnProperty(obj.code + item)
                ? pList[obj.code + item]
                  ? true
                  : obj[item]
                : obj[item];
            });
          });
        }
        this.store.dispatch(new fromRoot.GetPermissionSuccessAction(pList));

        if (pList.TIMEKEEPING_SELFisEdit && !localStorage.getItem('isDMSUser')) {
          this.showTimer = true;
        } else {
          this.showTimer = false;
        }
      });
  }

  closeWidgets(timer?) {
    this.hasUpload = false;
    if (timer) {
      this.showTimer = false;
    }
  }

  hideClientRetentionDocSection(event?){
    this.isClientRetentionDocUpload = false;
  }
  get hidePanel() {
    return document.location.href.includes('bulk-download-invoices')
      || document.location.href.includes('usioowner/owner-details')
      || document.location.href.includes('usioowner/verify')
      || document.location.href.includes('get-e-signature') ;
  }
}
