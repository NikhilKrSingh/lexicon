import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { WarningDialogComponent } from 'src/app/modules/shared/warning-dialog/warning-dialog.component';
import { CommonService } from 'src/app/service/common.service';
import { SelectService } from 'src/app/service/select.service';
import { vwBillingSettings } from 'src/common/swagger-providers/models';
import { DocumentSettingService } from 'src/common/swagger-providers/services';
import { MatterFolderStructureComponent } from './matter-folder-structure/matter-folder-structure.component';

@Component({
  selector: 'app-document-setting',
  templateUrl: './document-setting.component.html',
  styleUrls: ['./document-setting.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DocumentSettingComponent implements OnInit, IBackButtonGuard, OnDestroy {
  @ViewChild(MatterFolderStructureComponent, { static: false }) matterFolderStructureComponent: MatterFolderStructureComponent;

  visibleTostMessageValue: string;
  tenantSetting: any;
  isVisibleTostMessage = false;
  visibleTostMessageAction: string;
  visibleTostMessageTitle: string;
  enabledTab = false;
  alltabs = [
    {
      key: 'bulk-approval',
      value: 'Bulk Approval'
    },
    {
      key: 'matter-folder',
      value: 'Matter Folder Structure'
    },
    {
      key: 'document-categories',
      value: 'Document Categories'
    },
    {
      key: 'portal-history',
      value: 'Portal Access History'
    },
    {
      key: 'portal-accounts',
      value: 'Portal Accounts'
    },
    {
      key: 'document-portal',
      value: 'Document Portal Access'
    }
  ];
  selecttabs1: any;
  billingSettings: vwBillingSettings;
  validESignTier = false;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  getListingTimeout: any;
  refreshListingSubscription: Subscription;
  constructor(
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private location: Location,
    private documentSettingService: DocumentSettingService,
    private router: Router,
    private selectService: SelectService,
    private pagetitle: Title,
    private commonService: CommonService
  ) {
    router.events.subscribe(val => {
      if (val instanceof NavigationStart === true) {
        console.log(val);
        this.navigateAwayPressed = true;
      }
    });
  }

  ngOnInit() {
    this.pagetitle.setTitle('Document Management Settings');
    const profile = JSON.parse(localStorage.getItem('profile'));
    this.validESignTier = profile &&  profile.tenantTier &&
      profile.tenantTier.tierName &&
      (
        profile.tenantTier.tierName === 'Ascending' ||
        profile.tenantTier.tierName === 'Iconic'
      ) ? true : false;

    if (this.validESignTier) {
      this.alltabs.push({
        key: 'lexicon-docu-sync',
        value: 'Lexicon DocuSync'
      });
      this.alltabs.push({
        key: 'document-signature',
        value: 'E-Signature'
      });
    }

    this.manageTabs();
    this.getTenantSettings();

    this.selectService.newSelection$.forEach(event => {
      if (event === 'remove data') {
        this.dataEntered = false;
      } else if (event === 'clicked!') {
        this.dataEntered = true;
      }
    });

    this.refreshListingSubscription = this.commonService.isDmsRefresh.subscribe(val => {
      let mfComp = this.matterFolderStructureComponent;
      if(val && mfComp && val.folderId == mfComp.selected.id && val.type == 'matterfolder'){
            if(this.getListingTimeout){
              clearInterval(this.getListingTimeout);
            }
            this.getListingTimeout = setTimeout(() => {
              const index = mfComp.firmInfo.indexOf(mfComp.selected);
              mfComp.getFolders(
                mfComp.selected,
                index === 1 ? true : false,
                true,
                'file'
              );
            }, 5000);
          }
    })
  }

  ngOnDestroy() {
    if(this.refreshListingSubscription){
      this.refreshListingSubscription.unsubscribe();
    }
  }
  public changeTab(mytabs: any) {
    this.location.replaceState('/firm/document-setting/' + mytabs.key);
    if (
      localStorage.getItem('BulkApprovalChange') === 'true' &&
      mytabs.value !== 'Bulk Approval'
    ) {
      this.modalService
        .open(WarningDialogComponent, {
          centered: true,
          backdrop: 'static',
          keyboard: false
        })
        .result.then(res => {
          if (res) {
            this.selecttabs1 = mytabs.value;
            localStorage.setItem('BulkApprovalChange', 'false');
          }
        });
    } else {
      this.selecttabs1 = mytabs.value;
    }
  }

  public getEvent(event) {
    this.isVisibleTostMessage = event.value;
    this.visibleTostMessageValue = event.name;
    this.visibleTostMessageAction = event.action;
    this.visibleTostMessageTitle = event.title;

    setTimeout(() => {
      this.isVisibleTostMessage = false;
    }, 5000);
  }

  public closeTostAlert() {
    this.isVisibleTostMessage = false;
  }

  setPrimaryTab() {
    this.location.replaceState('/firm/document-setting/' + this.alltabs[0].key);
    this.selecttabs1 = this.alltabs[0].value;
  }

  manageTabs(): void {
    let queryParams: any;
    this.route.params.subscribe(params => {
      queryParams = params;
    });

    if (queryParams && queryParams.tab) {
      this.alltabs.filter(f => {
        if (f.key === queryParams.tab) {
          if (queryParams.tab === 'document-signature') {
            if (!this.validESignTier) {
              this.selecttabs1 = this.alltabs[0].value;
              this.location.replaceState(
                '/firm/document-setting/' + this.alltabs[0].key
              );
            } else {
              this.selecttabs1 = f.value;
            }
          } else {
            this.selecttabs1 = f.value;
          }
        }
      });
      if (!this.selecttabs1) {
        this.selecttabs1 = this.alltabs[0].value;
      }
    } else {
      this.selecttabs1 = this.alltabs[0].value;
    }
  }

  public getTenantSettings() {
    const userDetails = JSON.parse(localStorage.getItem('profile'));
    this.documentSettingService
      .v1DocumentSettingTenantTenantIdGet$Response({
        tenantId: userDetails.tenantId
      })
      .subscribe((res: any) => {
        const result: any = JSON.parse(res.body).results;
        this.tenantSetting = (result) ? result : null;
        this.enabledTab = (result.documentPortalAccess) ? true : false;
      });
  }
  accessEvent(event) {
    this.enabledTab = event;
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }  
}
