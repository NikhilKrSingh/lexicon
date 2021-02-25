import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IndexDbService } from 'src/app/index-db.service';
import { vwMatterResponse } from 'src/app/modules/models';
import { ContactsService, DmsService, MatterService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../shared/error.json';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'upload-document',
  templateUrl: './upload-document.component.html',
  styleUrls: ['./upload-document.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DocumentComponent implements OnInit {

  @Output() readonly nextStep = new EventEmitter<any>();
  @Output() readonly prevStep = new EventEmitter<any>();
  @Input() matterDetails: vwMatterResponse;
  @Input() pageType: string;
  @Input() conversionMatter: any;
  errorData: any = (errorData as any).default;
  clientId: any;
  matterId: any;
  loading = false;
  matterFolderDetails: any = {};

  constructor(
    private toastDisplay: ToastDisplay,
    private router: Router,
    private indexDbService: IndexDbService,
    private appConfig: AppConfigService,
    private matterService: MatterService,
    private route: ActivatedRoute,
    private contactsService: ContactsService,
    private dmsService: DmsService
  ) {
    this.route.queryParams.subscribe(params => {
      this.clientId = params.clientId;
      if (params.matterId && !isNaN(+params.matterId)) {
        this.matterId = params.matterId;
      }
      if (!this.clientId) {
        this.router.navigate(['/contact/potential-client']);
      }
    });
  }

  ngOnInit() {
    if (this.matterId) {
      this.getMatterFolderPath();
    } else {
      this.matterId =
      this.matterDetails ? this.matterDetails.id :
      this.conversionMatter ? this.conversionMatter.id: null;
      if (this.matterId) {
        this.getMatterFolderPath();
      } else {
        this.loading = true;
        this.indexDbService.getObject('localMatterDetails', (res) => {
          const localMatterDetails: any = (res && res.value) ? res.value : {};
          if (
            localMatterDetails && localMatterDetails.matter &&
            localMatterDetails.matter.id
          ) {
            this.matterId = localMatterDetails.matter.id;
            this.getMatterFolderPath();
          } else {
            this.loading = false;
          }
        });
      }
    }
  }

  async getMatterFolderPath() {
    try {
      this.loading = true;
      const resp = await this.dmsService.v1DmsFolderMatterMatterIdGet$Response({matterId: this.matterId}).toPromise();
      this.matterFolderDetails = JSON.parse(resp.body as any).results;
      this.loading = false;
    } catch (err) {
      this.loading = false;
    }
  }

  public next() {
    this.nextStep.emit({ next: 'add_notes', current: 'documents' });
  }

  public goBack() {
    localStorage.removeItem('done');
    this.prevStep.emit({
      current: 'documents',
      next: 'calendar'
    });
  }

  public done() {
    // localStorage.setItem('done', 'true');
    // if (this.pageType === 'client') {
    //   this.toastDisplay.showSuccess(this.errorData.client_saved_successfully);
    //   this.router.navigate(['/client-list/list']);
    // } else {
    //   this.toastDisplay.showSuccess(this.errorData.client_saved_successfully);
    //   this.router.navigate(['matter/dashboard'], {queryParams: { matterId: this.matterId}});
    // }
    this.sendEmailToAttornies();
  }

  private sendEmailToAttornies() {
    this.indexDbService.getObject('localMatterDetails', (res) => {
      const localMatterDetails: any = (res && res.value) ? res.value : {};

      if (localMatterDetails && localMatterDetails.matter) {
        const respId = +localMatterDetails.matter.responsobleAttornyId;
        const isSame = localMatterDetails.matter.sameAsResponsible;
        const billing = +localMatterDetails.matter.billingAttornyId;

        this.matterService.v1MatterSendAssignReassignEmailToAttorneyPost$Json({
          body: {
            appURL: this.appConfig.APP_URL,
            attorneyId: isSame ? respId : billing,
            isResponsibleAttorney: false,
            matterId: +this.conversionMatter.id,
            oldAttorneyId: 0
          }
        }).subscribe(() => {});

        this.matterService.v1MatterSendAssignReassignEmailToAttorneyPost$Json({
          body: {
            appURL: this.appConfig.APP_URL,
            attorneyId: respId,
            isResponsibleAttorney: true,
            matterId: +this.conversionMatter.id,
            oldAttorneyId: 0
          }
        }).subscribe(() => {});
      }

      if (localMatterDetails && localMatterDetails.client && localMatterDetails.client.consultAttorney) {
        this.contactsService.v1ContactsSendPotentialClientRetainedEmailPost$Json({
          body: {
            appURL: this.appConfig.APP_URL,
            consultAttorneyId: +localMatterDetails.client.consultAttorney.id,
            potentialClientId: +this.clientId
          }
        }).subscribe(() => {});
      }
    });
    this.next();
  }

  public afterLoad() {
    this.loading = false;
  }
}
