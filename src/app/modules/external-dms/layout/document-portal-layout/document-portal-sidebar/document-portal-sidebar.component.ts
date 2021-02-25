import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { vwTenantProfile } from '../../../../models/firm-settinngs.model';

@Component({
  selector: 'app-document-portal-sidebar',
  templateUrl: './document-portal-sidebar.component.html',
  styleUrls: ['./document-portal-sidebar.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DocumentPortalSidebarComponent implements OnInit, OnChanges {

  @Input() tenantProfile: vwTenantProfile;

  logoImage: any;

  constructor(
  ) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.tenantProfile && changes.tenantProfile.currentValue) {
      this.getLogo();
    }
  }

  getLogo() {
    this.logoImage = (this.tenantProfile && this.tenantProfile.internalLogo) ? this.tenantProfile.internalLogo : null;
  }


}
