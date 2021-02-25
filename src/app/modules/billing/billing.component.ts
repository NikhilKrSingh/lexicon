import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { InvoiceService } from 'src/app/service/invoice.service';
import { BillingService, TenantService, TrustAccountService } from 'src/common/swagger-providers/services';
import { UtilsHelper } from '../../modules/shared/utils.helper';
import { vwMessage } from '../models/vw-invoice';

@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class BillingComponent implements OnInit, OnDestroy {
  mytab: string[] = ['Pre-Bills', 'Invoices'];

  selectedTab: string;

  description: string;
  tenantTierName: string;

  default_logo_url: string;
  invoiceTemplateDetails: any;
  tenantDetails: any;
  loginUser: any;
  trustAccountEnabled = false;

  message: vwMessage;

  messageSub: Subscription;
  logoSub: Subscription;

  constructor(
    private activatedRoute: ActivatedRoute,
    private invoiceService: InvoiceService,
    private appConfigService: AppConfigService,
    private billingService: BillingService,
    private tenantService: TenantService,
    private trustAccountService: TrustAccountService,
    private pagetitle: Title
  ) {
    this.loginUser = UtilsHelper.getLoginUser();

    this.activatedRoute.queryParams.subscribe((params) => {
      if (params['selectedTab']) {
        this.selectedTab = params['selectedTab'];
      }
    });

    this.logoSub = this.invoiceService
      .loadImage(this.appConfigService.appConfig.default_logo)
      .subscribe((blob) => {
        const a = new FileReader();
        a.onload = (e) => {
          this.default_logo_url = (e.target as any).result;
        };
        a.readAsDataURL(blob);
      });

    this.messageSub = this.invoiceService.message$.subscribe((message) => {
      this.message = message;

      setTimeout(() => {
        this.message = null;
      }, 5000);
    });

    let selectedTab = localStorage.getItem('Billing_SelectedTab');
    if (selectedTab) {
      this.selectedTab = selectedTab;
      localStorage.setItem('Billing_SelectedTab', '');
    }

    this.getDefaultInvoiceTemplate();
    this.getTenantProfile();
    this.checkTrustAccountStatus().then((res) => {});
  }

  clearMessage() {
    this.invoiceService.message$.next(null);
  }

  ngOnInit() {
    this.pagetitle.setTitle('Billing');
    const userInfo: any = UtilsHelper.getLoginUser();
    if (userInfo && userInfo.tenantTier) {
      this.tenantTierName = userInfo.tenantTier.tierName;
      if (
        this.tenantTierName === 'Ascending' ||
        this.tenantTierName === 'Emerging'
      ) {
        this.mytab.splice(1, 0, 'Ready to Bill');
        if (!this.selectedTab) {
          this.selectTab('Ready to Bill');
        }
      } else {
        if (!this.selectedTab) {
          this.selectTab('Pre-Bills');
        }
      }
    }
  }

  ngOnDestroy() {
    if (this.logoSub) {
      this.logoSub.unsubscribe();
    }

    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
    this.description = '';
  }

  applyFilter() {
    this.invoiceService.filter.next(
      this.description ? this.description.trim().toLowerCase() : ''
    );
  }

  private getDefaultInvoiceTemplate() {
    this.billingService
      .v1BillingGetDefaultInvoiceTemplateGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.invoiceTemplateDetails = res;
      });
  }

  private getTenantProfile() {
    this.tenantService
      .v1TenantProfileGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res) => {
          this.tenantDetails = res;
        },
        () => {}
      );
  }

  async checkTrustAccountStatus(): Promise<any> {
    let resp: any = await this.trustAccountService
      .v1TrustAccountGetTrustAccountStatusGet$Response()
      .toPromise();
    resp = JSON.parse(resp.body as any).results;
    if (resp) {
      this.trustAccountEnabled = resp;
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
