import { Component, OnInit, ViewEncapsulation, Output, EventEmitter, Input } from '@angular/core';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { DocumentSettingService } from 'src/common/swagger-providers/services';
import { SelectService } from 'src/app/service/select.service';

@Component({
  selector: 'app-document-portal-access',
  templateUrl: './document-portal-access.component.html',
  styleUrls: ['./document-portal-access.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DocumentPortalAccessComponent implements OnInit {
  @Output() readonly changeTab: EventEmitter<any> = new EventEmitter<any>();
  @Output() public readonly accessEvent = new EventEmitter<any>();

  public documentPortal: any;
  @Input() set tenantSetting(tenantSetting: any) {
    if (tenantSetting) {
      this.documentPortal = tenantSetting ? tenantSetting : null;
    }
  }
  public selected = false;

  constructor(
    private dialogService: DialogService,
    private toastDisplay: ToastDisplay,
    private documentSettingService: DocumentSettingService,
    private selectService: SelectService
  ) {
  }

  ngOnInit() { }

  public confirmSave() {
    this.selectService.newSelection('remove data');
    let message = 'Are you sure enable access to the Document Portal?';
    let confirmBtnText = 'Yes, enable document portal';

    if (!this.documentPortal.documentPortalAccess) {
      message = 'You are about to disable access to the Document Portal. All active users will lose access to their portal and document will need to ne shared manually. Do you want to continue?';
      confirmBtnText = 'Yes, disable document portal';
    }

    this.dialogService.confirm(message, confirmBtnText, 'Cancel', 'Warning', true)
      .then(res => {
        if (res) {
          this.savePortalAccess();
        } else {
          this.documentPortal.documentPortalAccess = this.documentPortal.documentPortalAccess ? false : true;
        }
      });
  }
  public savePortalAccess() {
    const userDetails = JSON.parse(localStorage.getItem('profile'));
    this.documentSettingService.v1DocumentSettingTenantTenantIdGet$Response({ tenantId: userDetails.tenantId }).subscribe((res: any) => {
      const result: any = JSON.parse(res.body).results;
      if (result) {
        result.documentPortalAccess = this.documentPortal.documentPortalAccess;
        this.documentSettingService.v1DocumentSettingPut$Json$Response({ body: result }).subscribe((res: any) => {
          const result: any = JSON.parse(res.body).results;
          if (result) {
            this.accessEvent.emit(this.documentPortal.documentPortalAccess);
            if (this.documentPortal.documentPortalAccess) {
              this.toastDisplay.showSuccess('Document portal enabled.');
            } else {
              this.toastDisplay.showSuccess('Document portal disabled.');
            }

          }
        });
      }
    });

  }

  public cancel() {
    if (this.selected) {
      this.dialogService
        .confirm(
          'Are you sure you want to continue without saving these changes? This will remove any edits you’ve made.',
          'Yes, continue without saving',
          'Cancel',
          'Unsaved Changes'
        )
        .then(res => {
          if (res) {
            this.changeTab.emit(true);
          }
        });
    } else {
      this.changeTab.emit(true);
    }

  }

  public radioChange(e) {
    this.selected = true;
    this.selectService.newSelection('clicked!');
  }

  public getTenantSettings() {
    const userDetails = JSON.parse(localStorage.getItem('profile'));
    this.documentSettingService.v1DocumentSettingTenantTenantIdGet$Response({ tenantId: userDetails.tenantId }).subscribe((res: any) => {
      const result: any = JSON.parse(res.body).results;
      if (result) {
        this.tenantSetting = result;
        this.documentPortal = this.tenantSetting.documentPortalAccess;
      }
    });
  }
}
