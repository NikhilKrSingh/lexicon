import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { TenantProfileService } from 'src/app/service/tenant-profile.service';
import { vwReceiptTemplate } from 'src/common/swagger-providers/models';


@Component({
  selector: 'app-content-template',
  templateUrl: './content-template.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class ContentTemplateComponent implements OnInit, IBackButtonGuard {
  alltabs = ['Invoice Custom Content', 'Receipt Template'];
  selectedTab = this.alltabs[0];
  isSaveEnabled: boolean;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;

  constructor(
    private tenantProfile: TenantProfileService,
    private router: Router,
    private pagetitle: Title
  ) {
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart) === true) {
        this.navigateAwayPressed = true;
      }
    });
    let selectedTab = localStorage.getItem('Template_SelectedTab');
    if (selectedTab) {
      this.selectedTab = selectedTab;
      localStorage.setItem('Template_SelectedTab', '');
    }
  }


  ngOnInit() {
    this.pagetitle.setTitle("Billing Templates");
    this.tenantProfile.enableSave$.subscribe(res => {
      this.isSaveEnabled = res;
    });
  }

  saveChanges() {
    this.dataEntered = false;
    this.isSaveEnabled = false;

    if (this.selectedTab == this.alltabs[0]) {
      this.tenantProfile.saveChanges$.next('InvoiceTemplate');
    } else {
      this.tenantProfile.saveChanges$.next('ReceiptTemplate');
    }
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = true;
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  previewReceiptTemplate(row: vwReceiptTemplate) {
    this.dataEntered = false;
    this.router.navigate(['firm/content-template/preview-template/' + row.id])
  }

  doneChange() {
    this.dataEntered = false;
  }
}
