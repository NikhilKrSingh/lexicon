import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { IPRofile } from 'src/app/modules/models';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { WarningDialogComponent } from 'src/app/modules/shared/warning-dialog/warning-dialog.component';
import { CommonService } from 'src/app/service/common.service';
import { SharedDataService } from 'src/app/service/shared-data.service';
import { ReportService, TenantService, TrustAccountService, WorkFlowService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../store';
import * as fromPermissions from '../../store/reducers/permission.reducer';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  public displayContactsMenu = false;
  public displayBillingMenu = false;
  public userDetails: IPRofile;
  public logoImage: string;
  private subscriptionEdit: Subscription;
  public isAdmin: boolean;
  public profile = null;
  public isValidTenantTier = false;
  public isTrustAccountEnabled = true;
  public isBillingOrResponsibleAttorney: boolean;
  public isConsultAttorney: boolean;
  public isTuckerAllenUser = true;
  public noImage: boolean;
  public currentURL: any;
  public openAdminSettings = false;
  public accounting = false;
  public currentNavigateURL = '';
  public tuckerAllenAccountSubscription: Subscription;

  adminSettingsPermissions = [
    'TENANT_CONFIGURATIONisAdmin',
    'EMPLOYEE_MANAGEMENTisAdmin',
    'ACCESS_MANAGEMENTisAdmin',
    'BILLING_MANAGEMENTisAdmin',
    'ACCOUNTINGisAdmin',
    'CLIENT_CONTACT_MANAGEMENTisAdmin',
    'DOCUMENT_MANAGEMENT_SYSTEMisAdmin'
  ]

  constructor(
    private store: Store<fromRoot.AppState>,
    private tenantService: TenantService,
    private sharedService: SharedService,
    private router: Router,
    private modalService: NgbModal,
    private trustAccountService: TrustAccountService,
    private sharedDataService: SharedDataService,
    private reportService: ReportService,
    private workflowService: WorkFlowService,
    public appConfigService: AppConfigService,
    private commonService: CommonService
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentURL = event.url;
        this.getCurrentURL();
        if (
          this.currentURL.includes('/firm') ||
          this.currentURL.includes('/access-management/list') ||
          this.currentURL.includes('/access-management/create') ||
          this.currentURL.includes('/import') ||
          this.currentURL.includes('/contact/do-not-contact') ||
          this.currentURL.includes('/trust-account')
        ) {
          this.openAdminSettings = true;
        } else {
          this.openAdminSettings = false;
        }

        this.accounting = !!this.currentURL.includes('/accounting') || this.currentURL.includes('from=accounting');

        this.displayContactsMenu = !!(this.currentURL.includes('/contact') || this.currentURL.includes('/contact/potential-client') && !this.currentURL.includes('/contact/do-not-contact'));
      }
    });
  }

  ngOnInit() {
    if (
      localStorage.getItem('logo') &&
      localStorage.getItem('logo') !== 'null'
    ) {
      this.noImage = false;
      this.logoImage = localStorage.getItem('logo');
    } else if (!localStorage.getItem('logo')) {
      this.noImage = true;
    }
    this.checkTuckerAllenAccount();
    this.getBARAOrConsultAttorney();
    this.getTenantTrustAccountStatus();
    this.isValidTenantTier = UtilsHelper.getObject('isValidTenantTier');
    this.getTenentProfile();
    this.userDetails = JSON.parse(localStorage.getItem('profile'));
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.opts = {
      position: 'right',
      barBackground: '#413a93',
      barOpacity: '1',
      barWidth: '4',
      barBorderRadius: '4',
      barMargin: '2px',
      gridOpacity: '1',
      gridBackground: '#e7edf3',
      gridWidth: '8',
      gridMargin: '0',
      gridBorderRadius: '4',
      alwaysVisible: true
    };
    if (localStorage.getItem('check permissions')) {
      this.permissionsSubscribe();
    }
    this.permissionsSubscribe();

    this.subscriptionEdit = this.sharedService.logo$.subscribe(res => {
      if (res) {
        this.getLogo();
      }
    });
    this.sharedDataService.currentTrustAccountingStatus.subscribe(status => {
      if (status != null) {
        this.isTrustAccountEnabled = status;
        UtilsHelper.setObject('isTrustAccountEnabled', this.isTrustAccountEnabled);
      }
    });
  }

  permissionsSubscribe () {
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          const permissionsArray = Object.entries(this.permissionList);
          const newArray = [];
          permissionsArray.forEach(array => {
            if (this.adminSettingsPermissions.includes(array[0])) {
              newArray.push(array);
            }
          });
          newArray.forEach(array => {
            if (array[1] === true) {
              this.isAdmin = true;
            }
          });
          if (newArray.length === 0) {
            this.isAdmin = false;
          }
          if (localStorage.getItem('check permissions')) {
            localStorage.removeItem('check permissions');
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
    if (this.subscriptionEdit) {
      this.subscriptionEdit.unsubscribe();
    }
  }

  getCurrentURL(){
    if (this.currentURL.includes('/firm/general')) {
      this.currentNavigateURL = 'firmGeneral';
    }else if (this.currentURL.includes('/firm/job-families')) {
      this.currentNavigateURL = 'firmJobFamilies';
    }else if (this.currentURL.includes('/access-management')) {
      this.currentNavigateURL = 'accessManagement';
    }else if (this.currentURL.includes('/import')) {
      this.currentNavigateURL = 'import';
    }else if (this.currentURL.includes('/firm/billing-settings')) {
      this.currentNavigateURL = 'firmBillingSettings';
    }else if (this.currentURL.includes('/firm/account-settings')) {
      this.currentNavigateURL = 'firmAccountSettings';
    }else if (this.currentURL.includes('/contact/do-not-contact')) {
      this.currentNavigateURL = 'contactDoNotContact';
    }else if (this.currentURL.includes('/firm/code-ranges') || this.currentURL.includes('/firm/edit-code-ranges')) {
      this.currentNavigateURL = 'firmCodeRanges';
    }else if (this.currentURL.includes('/firm/billing-codes')) {
      this.currentNavigateURL = 'firmBillingCodes';
    }else if (this.currentURL.includes('/firm/rate-table')) {
      this.currentNavigateURL = 'firmRateTable';

    }else if (this.currentURL.includes('/firm/demo-table')) {
      this.currentNavigateURL = 'firmDemoTable';


    }else if (this.currentURL.includes('/firm/document-setting')) {
      this.currentNavigateURL = 'firmDocumentSetting';
    }else if (this.currentURL.includes('/firm/timekeeping-setting')) {
      this.currentNavigateURL = 'firmTimekeepingSetting';
    }else if (this.currentURL.includes('/firm/calendar-settings')) {
      this.currentNavigateURL = 'firmCalendarSettings';
    }else if (this.currentURL.includes('/firm/content-template')) {
      this.currentNavigateURL = 'firmContentTemplate';
    }else if (this.currentURL.includes('/dashboard') && !this.currentURL.includes('/matter') && !this.currentURL.includes('/firm')) {
      this.currentNavigateURL = 'dashboard';
    }else if (this.currentURL.includes('/calendar') && !this.currentURL.includes('-settings')) {
      this.currentNavigateURL = 'calendar';
    }else if (this.currentURL.includes('/office/')) {
      this.currentNavigateURL = 'office';
    }else if (this.currentURL.includes('/contact/all-contact')) {
      this.currentNavigateURL = 'contactAllContact';
    }else if (this.currentURL.includes('/contact/potential-client') || this.currentURL.includes('/client-conversion') ||
      this.currentURL.includes('/view-potential-client') || this.currentURL.includes('bill-potential-client')) {
      this.currentNavigateURL = 'contactPotentialClient';
    }else if (this.currentURL.includes('/contact/corporate-contact') || this.currentURL.includes('/contact/create-corporate-contact')) {
      this.currentNavigateURL = 'contactCorporateContact';
    }else if (this.currentURL.includes('/contact/client-associations') || this.currentURL.includes('/contact/create-client-association')
      || this.currentURL.includes('/contact/edit-client-association')) {
      this.currentNavigateURL = 'contactClientAssociations';
    }else if (this.currentURL.includes('/client-list') || this.currentURL.includes('/client-view')
      || this.currentURL.includes('/matter/create') || this.currentURL.includes('/client-create/create')) {
      this.currentNavigateURL = 'clientList';
    }else if (this.currentURL.includes('/employee/')) {
      this.currentNavigateURL = 'employee';
    }else if (this.currentURL.includes('/matter/') && !this.currentURL.includes('/matter/create')) {
      this.currentNavigateURL = 'matter';
    }else if (this.currentURL.includes('/timekeeping/all-timesheets') || this.currentURL.includes('/timekeeping/my-timesheet')) {
      this.currentNavigateURL = 'timekeepingAllTimesheets';
    }else if (this.currentURL.includes('/manage-folders')) {
      this.currentNavigateURL = 'manageFolders';
    }else if (this.currentURL.includes('/accounting')) {
      this.currentNavigateURL = 'accounting';
    }else if (this.currentURL.includes('/billing')) {
      this.currentNavigateURL = 'billing';
    }else if (this.currentURL.includes('/reporting')) {
      this.currentNavigateURL = 'reporting';
    }
  }

  timeout(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
  }

  public getLogo() {
    this.tenantService.v1TenantProfileGet({}).subscribe(res => {
      let r:any = res;
      let res1 =  JSON.parse(r).results;
      this.setLogo(res1);
    });
  }

  public navigate(url) {
    localStorage.removeItem('firmInfo');
    if (localStorage.getItem('BulkApprovalChange') === 'true') {
      this.modalService
        .open(WarningDialogComponent, {
          centered: true,
          backdrop: 'static',
          keyboard: false
        })
        .result.then(res => {
          if (res) {
            this.redirectToUrl(url);
            localStorage.setItem('BulkApprovalChange', 'false');
          }
        });
    } else {
      this.redirectToUrl(url);
    }
  }

  private redirectToUrl(url) {
    this.commonService.isClearFilter.next(true);
    if (url === '/timekeeping') {
      if (this.permissionList.TIMEKEEPING_OTHERSisAdmin || this.permissionList.TIMEKEEPING_OTHERSisViewOnly) {
        this.router.navigate([`${url}/all-timesheets`]);
      } else if (this.permissionList.TIMEKEEPING_SELFisEdit) {
        this.router.navigate([`${url}/my-timesheet`]);
      } else {
        this.router.navigate([url]);
      }
    } else {
      this.router.navigate([url]);
    }
  }

  get checkPermissionClass() {
    return (this.currentURL.indexOf('/reporting') > -1) && !(this.currentURL.indexOf('from=accounting') > -1);
  }

  get checkReportingDailyDeposit() {
    return (this.currentURL.indexOf('reporting/daily-deposit') > -1)  && !(this.currentURL.indexOf('reporting/daily-deposit?from=accounting') > -1);
  }

  public navigateByUrl(url,reload = false) {
    localStorage.removeItem('firmInfo');
    if (localStorage.getItem('BulkApprovalChange') === 'true') {
      this.modalService
        .open(WarningDialogComponent, {
          centered: true,
          backdrop: 'static',
          keyboard: false
        })
        .result.then(res => {
          if (res) {
            this.commonService.isClearFilter.next(true);
            if (reload) {
              this.router.onSameUrlNavigation = 'reload';
              this.router.routeReuseStrategy.shouldReuseRoute = () => false;
            }
            this.router.navigateByUrl(url);
            localStorage.setItem('BulkApprovalChange', 'false');
          }
        });
    } else {
      this.commonService.isClearFilter.next(true);
      if (reload) {
        this.router.onSameUrlNavigation = 'reload';
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;
      }
      this.router.navigateByUrl(url);
    }
  }

  setLogo(res) {
    if (res) {
      this.logoImage = res && res.internalLogo ? res.internalLogo : null;
      localStorage.setItem('logo', this.logoImage);
      this.noImage = false;
    }
  }

  private getTenentProfile() {
    this.tenantService
      .v1TenantProfileGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res: any) => {
          this.isValidTenantTier =
            res && res.tier && res.tier.tierName && (res.tier.tierName.toLowerCase() == 'ascending' ||
              res.tier.tierName.toLowerCase() == 'iconic') ? true : false;
          UtilsHelper.setObject('isValidTenantTier', this.isValidTenantTier);
          if (res && res.faviconicon) {
            document.getElementById('appFavicon').setAttribute('href', res.faviconicon);
          }
          if (!localStorage.getItem('logo')) {
            this.setLogo(res);
          }
        },
        () => { }
      );
  }

  checkTuckerAllenAccount() {
    this.tuckerAllenAccountSubscription = this.sharedService.isTuckerAllenAccount$.subscribe(
      res => {
        this.isTuckerAllenUser = res ? true : false;
      }
    );
  }

  private getTenantTrustAccountStatus() {
    this.trustAccountService
      .v1TrustAccountGetTrustAccountStatusGet$Response()
      .pipe(
        map(res => {
          return JSON.parse(res.body as any).results as boolean;
        }),
        finalize(() => { })
      )
      .subscribe(res => {
        if (res) {
          this.isTrustAccountEnabled = true;
          UtilsHelper.setObject('isTrustAccountEnabled', this.isTrustAccountEnabled);
        } else {
          this.isTrustAccountEnabled = false;
          UtilsHelper.setObject('isTrustAccountEnabled', this.isTrustAccountEnabled);
        }
      });
  }
  async getBARAOrConsultAttorney() {
    const res: any = await this.reportService
      .v1ReportGetBillingOrReposponsibleAttorneyGet$Response()
      .toPromise();
    if (res != null) {
      this.isBillingOrResponsibleAttorney = JSON.parse(res.body as any).results;
    }
    const res1: any = await this.reportService
      .v1ReportGetConsultAttorneyGet$Response()
      .toPromise();
    if (res1 != null) {
      this.isConsultAttorney = JSON.parse(res1.body as any).results;
    }
  }
}
