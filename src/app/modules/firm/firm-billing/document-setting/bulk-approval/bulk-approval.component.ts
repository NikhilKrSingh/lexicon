import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { SelectService } from 'src/app/service/select.service';
import { vwDocumentSettings } from 'src/common/swagger-providers/models';
import { TenantService } from 'src/common/swagger-providers/services';
import { DocumentSettingService } from './../../../../../../common/swagger-providers/services/document-setting.service';

@Component({
  selector: 'app-bulk-approval',
  templateUrl: './bulk-approval.component.html',
  styleUrls: ['./bulk-approval.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BulkApprovalComponent implements OnInit {
  public bulkApproval = null;
  public firmDetails: Tenant;
  public documentSettings: any;
  loading = false;

  constructor(
    private documentSettingService: DocumentSettingService,
    private dialogService: DialogService,
    private tenantService: TenantService,
    private toastr: ToastDisplay,
    private router: Router,
    private selectService: SelectService
  ) {
    this.documentSettings = {};
  }

  ngOnInit() {
    localStorage.setItem('BulkApprovalChange', 'false');
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
          this.loading = false;
          this.firmDetails = tenant;

          if (this.firmDetails) {
            this.getDocumentSetting();
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  public getDocumentSetting() {
    this.loading = true;
    this.documentSettingService
      .v1DocumentSettingTenantTenantIdGet({ tenantId: this.firmDetails.id })
      .subscribe(
        (res: any) => {
          res = JSON.parse(res);
          if (res.results) {
            this.bulkApproval = res.results.isBulkApproval ? true : false;
            this.documentSettings = res.results || {};
          }
          this.loading = false;
        },
        err => {
          this.loading = false;
        }
      );
  }

  public save() {
    this.selectService.newSelection('remove data');
    this.dialogService
      .confirm('Are you sure want to save this bulk approval?', 'Yes')
      .then(res => {
        if (res) {
          const data: vwDocumentSettings = {
            id: this.documentSettings.id,
            tenantId: this.firmDetails.id,
            documentPortalAccess: this.documentSettings.documentPortalAccess,
            isBulkApproval: this.bulkApproval,
            isDocuSyncEnable: this.documentSettings.isDocuSyncEnable,
            isSignatureEnable: this.documentSettings.isSignatureEnable
          };
          this.documentSettingService
            .v1DocumentSettingPut$Json({ body: data })
            .subscribe(
              suc => {
                const res: any = suc;
                this.getDocumentSetting();
                this.toastr.showSuccess(
                  'Document settings saved.'
                );
              },
              err => { }
            );
        }
      });
  }

  public change() {
    this.router.navigate(['/dashboard']);
  }

  public radioChange(e) {
    this.selectService.newSelection('clicked!');
  }
}
