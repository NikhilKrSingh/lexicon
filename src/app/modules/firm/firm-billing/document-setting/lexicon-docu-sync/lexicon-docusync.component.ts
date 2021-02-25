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
  selector: 'app-lexicon-docusync',
  templateUrl: './lexicon-docusync.component.html',
  styleUrls: ['./lexicon-docusync.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class LexiconDocuSyncComponent implements OnInit {
  public lexiconDocuSync: any;
  public firmDetails: Tenant;
  public documentSettings: any;
  visible: any = false;
  loading: any = true;

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
          console.log(this.firmDetails);

          if (this.firmDetails) {
            this.getDocumentSetting();
          } else {
            this.showError();
          }
        },
        () => {
          this.showError();
        }
      );
  }

  public getDocumentSetting() {
    this.loading = true;
    this.documentSettingService
      .v1DocumentSettingTenantTenantIdGet({ tenantId: this.firmDetails.id })
      .subscribe(
        suc => {
          const res: any = JSON.parse(suc as any);
          if (res.results) {
            this.lexiconDocuSync = res.results.isDocuSyncEnable;
            this.documentSettings = res.results || {};
            this.visible = true;
            this.loading = false;
          } else {
            this.loading = false;
          }
        },
        err => {
          this.loading = false;
        }
      );
  }

  public save() {
    this.selectService.newSelection('remove data');
    const data: vwDocumentSettings = {
      id: this.documentSettings.id,
      tenantId: this.firmDetails.id,
      documentPortalAccess: this.documentSettings.documentPortalAccess,
      isBulkApproval: this.documentSettings.isBulkApproval,
      isDocuSyncEnable: this.lexiconDocuSync,
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

  public change() {

    this.router.navigate(['/dashboard']);
  }

  public radioChange(e) {
    this.selectService.newSelection('clicked!');
  }

  private showError() { }
}
