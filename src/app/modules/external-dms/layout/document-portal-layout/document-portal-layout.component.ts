import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TenantService } from '../../../../../common/swagger-providers/services/tenant.service';
import { vwTenantProfile } from '../../../models/firm-settinngs.model';

@Component({
  selector: 'app-document-portal-layout',
  templateUrl: './document-portal-layout.component.html',
  styleUrls: ['./document-portal-layout.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DocumentPortalLayoutComponent implements OnInit {

  public tenantDetails: vwTenantProfile;

  constructor(private tenantService: TenantService) { }

  ngOnInit() {
    this.tenantService.v1TenantProfileGet$Response({}).subscribe(res => {
      if (res) {
        this.tenantDetails = JSON.parse(res.body as any).results;
      }
    });
  }

}
