import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { finalize, map } from 'rxjs/operators';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwBillingSettings } from 'src/common/swagger-providers/models';
import { BillingService } from 'src/common/swagger-providers/services';
import * as errors from '../../shared/error.json';
import { SharedService } from '../../shared/sharedService';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class SettingComponent implements OnInit, IBackButtonGuard {
  billingSettings: vwBillingSettings;
  error_data = (errors as any).default;
  public TimeDisplayFormat: any;
  public isCreate = false;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  public originalTime: string;

  loading = true;

  tenantId: number;

  constructor(
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private router: Router,
    private pagetitle: Title,
    private sharedService: SharedService
  ) {
    this.router.events.subscribe((val) => {
      if (val instanceof NavigationStart === true) {
        this.navigateAwayPressed = true;
      }
    });
  }

  ngOnInit() {
    this.pagetitle.setTitle('Timekeeping Settings');
    let userProfile = UtilsHelper.getLoginUser();
    if (userProfile) {
      this.tenantId = userProfile.tenantId;
      this.getBillingSettings();
    }
  }

  private getBillingSettings(isUpdate = false) {
    this.billingService
      .v1BillingSettingsTenantTenantIdGet({
        tenantId: this.tenantId,
      })
      .pipe(
        map((res) => {
          return JSON.parse(res as any).results[0] as vwBillingSettings;
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        (billingSettings) => {
          if (billingSettings) {
            this.billingSettings = billingSettings || {};
            if (this.billingSettings.timeDisplayFormat) {
              this.TimeDisplayFormat = String(
                this.billingSettings.timeDisplayFormat
              );
              const type =
                this.billingSettings.timeDisplayFormat === 1
                  ? 'jira'
                  : this.billingSettings.timeDisplayFormat === 2
                  ? 'standard'
                  : this.billingSettings.timeDisplayFormat === 3
                  ? 'decimal'
                  : 'jira';
              localStorage.setItem('timeformat', type);
              if (isUpdate) {
                this.sharedService.timeDisplayFormatUpdate$.next(true);
              }
              this.isCreate = false;
              this.originalTime = this.TimeDisplayFormat;
            }
          } else {
            this.isCreate = true;
          }
          this.loading = false;
        },
        () => {
          this.loading = false;
        }
      );
  }

  private showError() {
    this.toastr.showError(this.error_data.error_occured);
    this.loading = false;
  }

  public updateSetting() {
    this.dataEntered = false;
    const settings = this.billingSettings;
    settings.timeDisplayFormat = +this.TimeDisplayFormat;

    this.loading = true;

    this.billingService
      .v1BillingSettingsPut$Json({
        body: settings,
      })
      .pipe(
        map((res) => {
          return JSON.parse(res as any).results as number;
        })
      )
      .subscribe(
        (id) => {
          if (id > 0) {
            this.toastr.showSuccess(
              this.error_data.timekeeping_settings_update_success
            );
            this.sharedService.timeDisplayFormatUpdate$.next(true);
            const type =
                this.billingSettings.timeDisplayFormat === 1
                  ? 'jira'
                  : this.billingSettings.timeDisplayFormat === 2
                  ? 'standard'
                  : this.billingSettings.timeDisplayFormat === 3
                  ? 'decimal'
                  : 'jira';
              localStorage.setItem('timeformat', type);
            this.loading = false;
          } else {
            this.showError();
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  createSettings() {
    this.dataEntered = false;
    const settings = {
      tenant: {
        id: this.tenantId,
      },
      timeDisplayFormat: +this.TimeDisplayFormat,
    } as vwBillingSettings;

    this.loading = false;

    this.billingService
      .v1BillingSettingsPost$Json({
        body: settings,
      })
      .pipe(
        map((res) => {
          return JSON.parse(res as any).results as number;
        })
      )
      .subscribe(
        (id) => {
          if (id > 0) {
            this.getBillingSettings(true);
            this.toastr.showSuccess(
              this.error_data.timekeeping_settings_update_success
            );
          } else {
            this.showError();
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  onTimeChange(newValue) {
    this.dataEntered = newValue !== this.originalTime;
    this.TimeDisplayFormat = newValue;
  }
}
