import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppConfigService } from 'src/app/app-config.service';
import { IndexDbService } from 'src/app/index-db.service';
import { PersonService, WorkFlowService } from 'src/common/swagger-providers/services';

@Injectable()
export class SharedService {
  private emailregex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  private logout = new BehaviorSubject(false);
  private logo = new BehaviorSubject(false);

  logout$ = this.logout.asObservable();
  logo$ = this.logo.asObservable();

  refreshVendor$ = new EventEmitter();
  refreshSubsidiary$ = new EventEmitter();
  clientConfictCheck$ = new EventEmitter();

  refreshTimekeeping$ = new EventEmitter<Array<number>>();
  showLoader$ = new EventEmitter<boolean>();
  isTuckerAllenAccount = new BehaviorSubject(false);
  isTuckerAllenAccount$ = this.isTuckerAllenAccount.asObservable();
  profilePictureLink = new BehaviorSubject(null);
  profilePictureLink$ = this.profilePictureLink.asObservable();
  printReceipt$ = new EventEmitter<any>();

  taskBuilderStatuses = new BehaviorSubject<any>(null);
  taskBuilderStatuses$ = this.taskBuilderStatuses.asObservable();

  timeDisplayFormatUpdate$ = new EventEmitter<any>();

  reloadPrimaryTrustBalance$ = new EventEmitter<any>();
  reloadTrustOnlyAccountBalance$ = new EventEmitter<any>();

  // create client wizard
  ContactUniqueNumber$ = new EventEmitter<number>();
  MatterLawOfficeChange$ = new EventEmitter<number>();
  UploadedDocuments$ = new EventEmitter<any[]>();
  RemoveUploadedDocuments$ = new EventEmitter<any>();
  ClientEmailChange$ = new EventEmitter<any>();
  datesChange$ = new EventEmitter<any>();

  listTrustBankSource = new BehaviorSubject<Date>(null);
  listTrustBankSource$ = this.listTrustBankSource.asObservable();
  refreshUserName$ = new EventEmitter();
  updateDecisionStatus$ = new EventEmitter();



  constructor(
    private workflowService: WorkFlowService,
    private personService: PersonService,
    public appConfigService: AppConfigService,
    public indexDbService: IndexDbService
  ) { }

  setLogout(data) {
    this.logout.next(data);
  }

  setLogo(data) {
    this.logo.next(data);
  }

  getFileExtension(file: string): string {
    return file.substr(file.lastIndexOf('.') + 1).toLowerCase();
  }

  copyToClipboard(link: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = link;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  getStringWithUpperCase(val: any): string {
    if (val) {
      return val.charAt(0).toUpperCase() + val.slice(1);
    }
  }

  isEmailValid(email: string): boolean {
    return this.emailregex.test(email);
  }

  setTuckerAllenAccount(data) {
    this.isTuckerAllenAccount.next(data);
  }

  async getTuckerAllenAccount() {
    try {
      let res: any = await this.workflowService.v1WorkFlowVisibilityAndAllStatusesGet().toPromise();
      let resp = JSON.parse(res).results;
      const tuckerAllenStatus = !!resp.visibilityDetails.isVisible;
      let taskBuilderStatuses = resp;
      delete taskBuilderStatuses.visibilityDetails;
      this.setTuckerAllenAccount(tuckerAllenStatus);
      this.taskBuilderStatuses.next(taskBuilderStatuses);
    } catch (error) {

    }
  }

  getProfilePicture() {
    const userDetails = JSON.parse(localStorage.getItem('profile'));
    if (userDetails) {
      this.personService.v1PersonPhotoPersonIdGet$Response({
        personId: userDetails.id
      }).subscribe(res => {
        if (res) {
          const profileImage = JSON.parse(res.body as any).results as string;
          this.profilePictureLink.next(profileImage);
        }
      });
    }
  }

  logoutUser() {
    localStorage.clear();
    sessionStorage.clear();
    this.indexDbService.clearDatabase();
    this.setLogout(true);
    window.location.href = this.appConfigService.appConfig.Common_Logout;
  }

  changeSourceBankTrust(time: Date) {
    this.listTrustBankSource.next(time);
  }

}
