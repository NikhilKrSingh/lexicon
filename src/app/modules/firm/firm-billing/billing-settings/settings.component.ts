import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import * as moment from 'moment';
import { finalize, map } from 'rxjs/operators';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IBillPeriod } from 'src/app/modules/models';
import { IBillingSettings } from 'src/app/modules/models/billing-setting.model';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { SelectService } from 'src/app/service/select.service';
import { vwBillingSettings, vwIdCodeName } from 'src/common/swagger-providers/models';
import { BillingService, TenantService } from 'src/common/swagger-providers/services';
import * as errors from '../../../shared/error.json';

@Component({
  selector: 'app-billing-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BillingSettingsComponent implements OnInit, IBackButtonGuard {
  alltabs = [
    'Bill Generation Frequency',
    'Invoices',
    'Time Rounding Interval',
    'Payment Plans',
  ];
  selecttabs1 = this.alltabs[0];
  firmDetails: Tenant;
  billingSettings: IBillingSettings;
  billingSettingsOri: IBillingSettings;
  error_data = (errors as any).default;
  billFrequencyList: Array<vwIdCodeName>;
  invoiceDeliveryList: Array<vwIdCodeName>;
  public dateReset: boolean = false;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  public loading: boolean;
  public editBill: boolean = false;
  public editBillUpcoming: boolean = false;
  public updatedSettings: IBillPeriod;
  public notIsEdit: boolean = false;
  billingSettingsSubmitted: boolean = false;
  tenantTierName: any;

  constructor(
    private billingService: BillingService,
    private tenantService: TenantService,
    private toastr: ToastDisplay,
    private router: Router,
    private selectService: SelectService,
    private dialogService: DialogService,
    private pagetitle: Title
  ) {
    this.billFrequencyList = [];
    this.invoiceDeliveryList = [];
    this.billingSettings = {};
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart) === true) {
        this.navigateAwayPressed = true;
      }
    });
  }

  ngOnInit() {
    this.setTabsBasedOnTenant();
    this.pagetitle.setTitle("Billing Settings");
    this.getTenantDetail();
    this.selectService.newSelection$.forEach(event => {
      if (event) {
        this.dataEntered = true;
      }
    })
  }
  /**
   * Show tabs based on tenant tier
   */
  setTabsBasedOnTenant() {
    const userInfo: any = UtilsHelper.getLoginUser();
    if (userInfo && userInfo.tenantTier) {
      this.tenantTierName = userInfo.tenantTier.tierName;
      if (this.tenantTierName === 'Emerging' || this.tenantTierName === 'Ascending') {
        this.alltabs = [
          'Bill Generation Frequency',
          'Invoices',
          'Time Rounding Interval',
          'Payment Plans',
        ];
      } else {
        this.alltabs = [
          'Bill Generation Frequency',
          'Invoices',
          'Time Entry Grace Period',
          'Time Rounding Interval',
          'Payment Plans',
        ];
      }
    }
  }
  getTenantDetail() {
    this.loading = true;
    this.tenantService
      .v1TenantGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Tenant;
        })
      )
      .subscribe(
        tenant => {
          this.firmDetails = tenant;
          if (this.firmDetails) {
            this.getBillingSettings(true);
          } else {
            this.showError();
            this.loading = false;
          }
        },
        () => {
          this.showError();
          this.loading = false;
        }
      );
  }

  private getTenentProfile(updateDefault) {
    this.tenantService
      .v1TenantProfileGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res && res.tier && (res.tier.tierName === 'Emerging' || res.tier.tierName === 'Ascending')) {
          this.loading = false;
          this.billingSettings.timeEntryGracePeriod = 0;
          if (updateDefault) {
            this.save(false);
          }
        } else {
          this.loading = false;
        }
      }, () => {
        this.loading = false;
      });
  }


  private showError() {
  }

  private getBillingSettings(updateDefault = false) {
    this.billingService
      .v1BillingSettingsTenantTenantIdGet({
        tenantId: this.firmDetails.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results[0] as IBillingSettings;
        }),
        finalize(() => {
        })
      )
      .subscribe(
        billingSettings => {
          if (billingSettings) {
            this.billingSettings = billingSettings;
            this.billingSettingsOri = { ...billingSettings };
            if (!this.billingSettings.timeRoundingInterval) {
              this.billingSettings.timeRoundingInterval = 6;
            }
          }
          this.getTenentProfile(updateDefault);
        },
        () => {
          this.showError();
          this.loading = false;
        }
      );
  }

  save(showToastr = true) {
    this.dataEntered = false;
    if (this.selecttabs1 == 'Bill Generation Frequency') {
      if (!this.billingSettings.id) {
        this.createSettings(showToastr);
      } else {
        this.billingSettings.needToUpdateChildRecords = true;
        this.updateSettings(showToastr);
      }
    } else {
      this.billingSettings.needToUpdateChildRecords = false;
      if (this.selecttabs1 == 'Operating Account' && showToastr) {
        this.billingSettingsSubmitted = true;
        if (!this.billingSettings.operatingRoutingNumber || this.billingSettings.operatingAccountNumber.length < 12 || !this.billingSettings.operatingAccountNumber || this.billingSettings.operatingRoutingNumber.length < 9) {
          return;
        }
      }
      if (!this.billingSettings.id) {
        this.createSettings(showToastr);
      } else {
        this.updateSettings(showToastr);
      }
    }
  }

  createSettings(showToastr = true) {
    const settings = {
      tenant: {
        id: this.firmDetails.id
      },
      billFrequencyQuantity: this.billingSettings.billFrequencyQuantity,
      billFrequencyDuration: this.billingSettings.billFrequencyDuration,
      daysToPayInvoices: +this.billingSettings.daysToPayInvoices,
      timeEntryGracePeriod: +this.billingSettings.timeEntryGracePeriod,
      timeRoundingInterval: +this.billingSettings.timeRoundingInterval,
      paymentPlans: this.billingSettings.paymentPlans,
      operatingAccountNumber: this.billingSettings.operatingAccountNumber,
      operatingRoutingNumber: this.billingSettings.operatingRoutingNumber
    } as vwBillingSettings;

    this.billingService
      .v1BillingSettingsPost$Json({
        body: settings
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        })
      )
      .subscribe(
        id => {
          if (id > 0) {
            if (showToastr) {
              this.getBillingSettings();
              this.dateReset = true;
              setTimeout(() => {
                this.dateReset = false;
              }, 5000);
              this.toastr.showSuccess(
                this.error_data.billing_settings_save_success
              );
              this.notIsEdit = true;
            }
          } else {
            this.showError();
          }
        },
        () => {
          this.showError();
        }
      );
  }

  updateSettings(showToastr = true) {
    const settings = {
      ...this.billingSettings,
      id: this.billingSettings.id,
      tenant: {
        id: this.firmDetails.id
      },
      daysToPayInvoices: +this.billingSettings.daysToPayInvoices,
      timeEntryGracePeriod: +this.billingSettings.timeEntryGracePeriod,
      timeRoundingInterval: +this.billingSettings.timeRoundingInterval,
      timeDisplayFormat: +this.billingSettings.timeDisplayFormat,
      paymentPlans: this.billingSettings.paymentPlans,
      operatingAccountNumber: this.billingSettings.operatingAccountNumber,
      operatingRoutingNumber: this.billingSettings.operatingRoutingNumber
    } as vwBillingSettings;
    this.loading = true;
    this.billingService
      .v1BillingSettingsPut$Json({
        body: settings
      })
      .pipe(
        map(
          res => {
            return JSON.parse(res as any).results as number;
          },
          error => {
            this.loading = false;
          }
        ),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        id => {
          if (id > 0) {
            if (showToastr) {
              this.editBill = false;
              this.editBillUpcoming = false;
              this.getBillingSettings();
              this.dateReset = true;
              setTimeout(() => {
                this.dateReset = false;
              }, 5000);
              this.toastr.showSuccess(
                this.error_data.billing_settings_save_success
              );
              this.notIsEdit = true;
            }
          } else {
            this.loading = false;
            this.showError();
          }
        },
        () => {
          this.loading = false;
          this.showError();
        }
      );
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = true;
  }

  public getValue(data: IBillPeriod) {
    this.updatedSettings = { ...data };
    this.updatedSettings.billFrequencyStartingDate = moment(this.updatedSettings.billFrequencyStartingDate).format('YYYY-MM-DD');
    this.updatedSettings.billFrequencyNextDate = moment(this.updatedSettings.billFrequencyNextDate).format('YYYY-MM-DD');
    this.updatedSettings.effectiveDate = moment(this.updatedSettings.effectiveDate).format('YYYY-MM-DD');
    if (this.updatedSettings.effectiveBillFrequencyNextDate) {
      this.updatedSettings.effectiveBillFrequencyNextDate = moment(this.updatedSettings.effectiveBillFrequencyNextDate).format('YYYY-MM-DD');
    }
  }

  changeTab(mytabs) {
    this.selecttabs1 = mytabs;
    this.billingSettingsSubmitted = false;
  }

  public confirmSave() {
    this.billingSettingsSubmitted = true;
    if (
      !this.updatedSettings.billFrequencyQuantity ||
      !this.updatedSettings.billFrequencyDuration ||
      !this.updatedSettings.effectiveDate
    ) {
      return;
    }
    if (this.updatedSettings && this.updatedSettings.billFrequencyDurationType === 'MONTHS') {
      if (!this.updatedSettings.billFrequencyRecursOn) {
        return;
      }
    }
    if (this.editBillUpcoming) {
      this.dialogService
      .confirm(
        'Saving these changes will override the upcoming billing frequency settings at the firm level. Are you sure you want to continue?',
        'Yes, override current settings',
        'Cancel',
        'Override Changes',
        true
      )
      .then(response => {
        if (response) {
          this.updateBilling(null);
        }
      });
    } else {
      this.updateBilling(null);
    }

  }

  public removeUpcomingFreq(eve) {
    if (eve) {
      this.updateBilling(eve);
    }
  }

  public updateBilling(item) {
    if (item) {
      this.billingSettings.effectiveBillFrequencyDay = null;
      this.billingSettings.effectiveBillFrequencyRecursOn = null;
      this.billingSettings.effectiveBillFrequencyQuantity = null;
      this.billingSettings.effectiveBillFrequencyDuration = null;
      this.billingSettings.effectiveBillFrequencyNextDate = null;
      this.billingSettings.effectiveBillFrequencyStartingDate = null;
      this.billingSettings.effectiveIsInherited = null;
      this.billingSettings.effectiveRepeatType = null;
      this.billingSettings.effectiveBillWhenHoliday = null;

      let settings = {
        billFrequencyQuantity: this.billingSettings.billFrequencyQuantity,
        billFrequencyDurationType: this.billingSettings.billFrequencyDuration.code,
        billFrequencyDay: this.billingSettings.billFrequencyDay,
        billFrequencyRecursOn: this.billingSettings.billFrequencyRecursOn,
        repeatType: this.billingSettings.repeatType
      }
      let endDate =  moment(UtilsHelper.getEffectiveDateUpcoming(moment(this.billingSettings.billFrequencyStartingDate).format('YYYY-MM-DD'), settings)).format('YYYY-MM-DD');
      this.billingSettings.billFrequencyNextDate =  endDate;
    } else {
      if (this.updatedSettings.effectiveDate > moment().format('YYYY-MM-DD')) {
        this.billingSettings.effectiveBillFrequencyDay = this.updatedSettings.billFrequencyDay;
        this.billingSettings.effectiveBillFrequencyRecursOn = this.updatedSettings.billFrequencyRecursOn;
        this.billingSettings.effectiveBillFrequencyQuantity = this.updatedSettings.billFrequencyQuantity;
        this.billingSettings.effectiveBillFrequencyDuration = { id: this.updatedSettings.billFrequencyDuration };
        this.billingSettings.effectiveBillFrequencyStartingDate = this.updatedSettings.effectiveDate;
        this.billingSettings.effectiveIsInherited = this.updatedSettings.isInherited;
        this.billingSettings.effectiveRepeatType = this.updatedSettings.repeatType;
        this.billingSettings.effectiveBillWhenHoliday = this.updatedSettings.billWhenHoliday;
        this.billingSettings.effectiveBillFrequencyNextDate = moment(UtilsHelper.getEffectiveDateUpcoming(this.updatedSettings.effectiveDate, this.updatedSettings)).format('YYYY-MM-DD');
        if (this.updatedSettings.effectiveDate <= moment(this.billingSettings.billFrequencyNextDate).format('YYYY-MM-DD')) {
          this.billingSettings.billFrequencyNextDate = moment(this.updatedSettings.effectiveDate).add(-1, 'days').format('YYYY-MM-DD');
        }
      } else {
        let effectivePeriod = UtilsHelper.getFinalEffectiveDate(this.updatedSettings.effectiveDate, this.updatedSettings);
        this.billingSettings.billFrequencyDay = this.updatedSettings.billFrequencyDay;
        this.billingSettings.billFrequencyRecursOn = this.updatedSettings.billFrequencyRecursOn;
        this.billingSettings.billFrequencyQuantity = this.updatedSettings.billFrequencyQuantity;
        this.billingSettings.billFrequencyDuration = { id: this.updatedSettings.billFrequencyDuration };
        this.billingSettings.billFrequencyStartingDate = moment(effectivePeriod.previosEffectiveDate).format('YYYY-MM-DD');
        this.billingSettings.billFrequencyNextDate = moment(effectivePeriod.newEffectiveDate).format('YYYY-MM-DD');
        this.billingSettings.repeatType = this.updatedSettings.repeatType;
        this.billingSettings.billWhenHoliday = this.updatedSettings.billWhenHoliday;

        this.billingSettings.effectiveBillFrequencyDay = null;
        this.billingSettings.effectiveBillFrequencyRecursOn = null;
        this.billingSettings.effectiveBillFrequencyQuantity = null;
        this.billingSettings.effectiveBillFrequencyDuration = null;
        this.billingSettings.effectiveBillFrequencyNextDate = null;
        this.billingSettings.effectiveBillFrequencyStartingDate = null;
        this.billingSettings.effectiveIsInherited = null;
        this.billingSettings.effectiveRepeatType = null;
        this.billingSettings.effectiveBillWhenHoliday = null;
      }
    }
    if (!this.billingSettings.billFrequencyStartingDate) {
      this.billingSettings.billFrequencyStartingDate = moment().format('YYYY-MM-DD');
    }
    this.billingSettings.needToUpdateChildRecords = true;
    this.updateSettings();
  }

  public cancel() {
    this.editBill = false;
    this.editBillUpcoming = false;
  }

  public editBillFreq(event) {
    if (event === 'basic') {
      this.editBill = true
    } else {
      this.editBillUpcoming = true;
    }
  }

  enableDisabledTimeEntryButton(val?: boolean) {
    this.notIsEdit = val
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

}
