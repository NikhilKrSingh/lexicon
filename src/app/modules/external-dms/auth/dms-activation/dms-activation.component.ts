import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwDMSPortalActivations } from 'src/app/modules/models/vw-dmsportal-activation';
import { vwBillingSettings } from 'src/common/swagger-providers/models';
import { AuthService, BillingService } from 'src/common/swagger-providers/services';


@Component({
  selector: 'app-dms-activation',
  templateUrl: './dms-activation.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class DmsActivationComponent implements OnInit {
  password = '';
  viewPassword = false;
  passwordFlag = false;
  userID = '';
  connString: string;
  constructor(
    private toaster: ToastDisplay,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private billingService: BillingService,
    private appConfigService: AppConfigService
  ) { }

  ngOnInit() {
    this.userID = this.route.snapshot.queryParamMap.get('uid') || null;
    this.connString = this.route.snapshot.queryParamMap.get('xyz') || null;
    if (!this.userID) {
      this.toaster.showError('Invalid link');
      window.location.href = this.appConfigService.appConfig.Common_Login;
    }

    this.checkLink();
  }

  checkLink() {
    let data: any = new vwDMSPortalActivations();
    data.userId = this.userID;
    data.connectionString = this.connString;
    this.authService.v1AuthActivateDmsPortalPost$Json({ body: data }).subscribe((res: any) => {
      window.location.href = this.appConfigService.appConfig.Common_Login;
    }
      , err => {
        window.location.href = this.appConfigService.appConfig.Common_Login;
      });
  }

  setPasswordFlag(value) {
    this.passwordFlag = value;
  }

  activate() {
    const ob = {
      newPassword: this.password,
      userID: this.userID
    };
    this.authService.v1AuthActivateDocumentportalPut$Json({ body: ob }).subscribe((res: any) => {
      if (res) {
        const data = JSON.parse(res);
        if (data.token && data.results && Object.keys(data.results).length) {
          localStorage.setItem('isDMSUser', 'TrUe');
          localStorage.setItem('token', data.token);
          localStorage.setItem('profile', JSON.stringify(data.results));
          localStorage.removeItem('contact_Id');
          this.getTimeFormat();
          this.toaster.showSuccess('Account activated.');
          this.router.navigate(['/dmsportal/dashboard']);
        }
      } else {
        this.toaster.showError('Error occured');
        this.router.navigate(['/dmsportal/login']);
      }
    }, err => {
      this.router.navigate(['/dmsportal/login']);
    });
  }

  private getTimeFormat() {
    const profile = localStorage.getItem('profile');
    if (profile) {
      const person = JSON.parse(profile);
      this.billingService
        .v1BillingSettingsTenantTenantIdGet({
          tenantId: +person.tenantId
        })
        .pipe(
          map(res => {
            return JSON.parse(res as any).results[0] as vwBillingSettings;
          })
        )
        .subscribe(
          billingSettings => {
            if (billingSettings) {
              if (billingSettings.timeDisplayFormat) {
                const format = billingSettings.timeDisplayFormat;
                const type = format === 1 ? 'jira' : format === 2 ? 'standard' : format === 3 ? 'decimal' : 'jira';
                localStorage.setItem('timeformat', type);
              }
            }
          }
        );
    }
  }
}
