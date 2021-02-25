import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { SelectService } from 'src/app/service/select.service';
import { vwDocumentSettings } from 'src/common/swagger-providers/models';
import { DocumentSettingService, TenantService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../../shared/error.json';

@Component({
  selector: 'app-e-signature',
  templateUrl: './e-signature.component.html',
  styleUrls: ['./e-signature.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ESignatureComponent implements OnInit {
  errorData: any = (errorData as any).default;
  firmDetails: any = {};
  eSignature = null;
  documentSettings: any = {};
  loading = false;

  constructor(
    private dialogService: DialogService,
    private tenantService: TenantService,
    private documentSettingService: DocumentSettingService,
    private toaster: ToastDisplay,
    private router: Router,
    private selectService: SelectService
  ) { }

  ngOnInit() {
    this.getTenantDetails();
  }

  getTenantDetails() {
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
            this.getDocumentSetting();
          } else {
            this.loading = false;
          }
        },
        err => {
          this.loading = false;
        }
      );
  }

  async getDocumentSetting() {
    try {
      let resp: any = await this.documentSettingService
        .v1DocumentSettingTenantTenantIdGet({ tenantId: this.firmDetails.id })
        .toPromise();
      resp = JSON.parse(resp).results;
      if (resp) {
        this.eSignature = resp.isSignatureEnable ? true : false;
        this.documentSettings = resp || {};
        this.loading = false;
      } else {
        this.loading = false;
      }
    } catch (e) {
      this.loading = false;
    }
  }

  async updateESignature() {
    this.selectService.newSelection('remove data');
    if (this.eSignature) {
      this.saveSignatureSettings();
    } else {
      const resp = await this.dialogService.confirm(
        this.errorData.e_signature_warning,
        'Yes, disable',
        'No',
        'Disable E-Signature',
        true
      );

      if (resp) {
        this.saveSignatureSettings();
      } else {
        this.eSignature =
          this.documentSettings && this.documentSettings.isSignatureEnable
            ? true
            : false;
      }
    }
  }

  async saveSignatureSettings() {
    const data: vwDocumentSettings = {
      id: this.documentSettings.id,
      tenantId: this.firmDetails.id,
      documentPortalAccess: this.documentSettings.documentPortalAccess,
      isBulkApproval: this.documentSettings.isBulkApproval,
      isDocuSyncEnable: this.documentSettings.isDocuSyncEnable,
      isSignatureEnable: this.eSignature
    };

    let url = this.documentSettingService.v1DocumentSettingPost$Json({
      body: data
    });

    if (this.documentSettings && this.documentSettings.id) {
      data.id = this.documentSettings.id;
      url = this.documentSettingService.v1DocumentSettingPut$Json({
        body: data
      });
    }

    try {
      this.loading = true;
      await url.toPromise();
      this.loading = false;
      this.getDocumentSetting();
      this.toaster.showSuccess('Document settings saved.');
    } catch (e) {
      this.loading = false;
    }
  }

  public goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  public radioChange(e) {
    this.selectService.newSelection('clicked!');
  }
}
