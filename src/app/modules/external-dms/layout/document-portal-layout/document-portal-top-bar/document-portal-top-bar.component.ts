import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonService } from 'src/app/service/common.service';
import { PersonService } from 'src/common/swagger-providers/services';
import { vwTenantProfile } from '../../../../models/firm-settinngs.model';

@Component({
  selector: 'app-document-portal-top-bar',
  templateUrl: './document-portal-top-bar.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class DocumentPortalTopBarComponent implements OnInit, OnChanges {

  @Input() tenantProfile: vwTenantProfile;

  userDetails: any = {};
  profileImage = '';

  constructor(
    private personService: PersonService,
    private commonService: CommonService
  ) { }

  ngOnInit() {
    this.userDetails = JSON.parse(localStorage.getItem('profile'));
    this.userDetails.name = this.userDetails.lastName ? this.userDetails.firstName + ' ' + this.userDetails.lastName : this.userDetails.firstName;
    if (this.userDetails && this.userDetails.groups && this.userDetails.groups.length) {
      const groups = this.userDetails.groups.filter(x => x.name !== 'Everyone');
      this.userDetails.type = groups && groups.length ? groups[0].name : '';
    }
    this.getProfilePicture();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.tenantProfile && changes.tenantProfile.currentValue) {
      this.setFavicon();
    }
  }

  public doLogout() {
    this.commonService.isLogOutRequest.next(true);
  }

  setFavicon() {
    if (this.tenantProfile && this.tenantProfile.faviconicon) {
      document.getElementById('appFavicon').setAttribute('href', this.tenantProfile.faviconicon);
    }
  }


  /**
   * Get Profile Picture for Employee
   */
  private getProfilePicture() {
    if (this.userDetails) {
      this.personService.v1PersonPhotoPersonIdGet$Response({
        personId: this.userDetails.id
      }).subscribe(res => {
        if (res) {
          this.profileImage = JSON.parse(res.body as any).results as string;
        }
      });
    }
  }

}
