import { Component, HostListener, OnInit, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, NgForm } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwClient } from 'src/common/swagger-providers/models';
import {
  ClientService,
  ContactsService,
  MatterService,
  MiscService,
  OfficeService, PersonService
} from 'src/common/swagger-providers/services';
import * as errorData from '../../../modules/shared/error.json';
import { IOffice, Page, vwMatterResponse } from '../../models';

@Component({
  selector: 'app-edit-matter-details',
  templateUrl: './edit-matter-details.component.html',
  styleUrls: ['./edit-matter-details.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class EditMatterDetailsComponent implements OnInit {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  @ViewChild('ReassignConsultAttorney', { static: false })  reassignConsultAttorney: TemplateRef<any>;

  @ViewChild('matterDetailForm', { static: false }) matterDetailForm: NgForm;

  modalRef: NgbModalRef;
  public clientId: number;
  public attorneyList: Array<any> = [];
  public errorData: any = (errorData as any).default;
  public originalAttorneyList: Array<any> = [];
  public consultOfficeList: Array<any> = [];
  public clientDetail: vwClient;
  public consultOffice: number;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public counter = Array;
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 20];
  public selectedAttorney: any;
  public selectedAttorneyId: number;
  public selectedOffice: any;
  jurisdictionId: any;
  jurisdictionCounty: any;
  originatingAttorneyId: any;
  private previousSelectedOffice: any;
  private request: any;
  public searchStr: string;
  public pageSelected = 1;
  public changeNotes: string;

  public matterDetails: vwMatterResponse;
  public practiceList: Array<IOffice> = [];
  public stateList: Array<any> = [];
  public selectedPracticeArea: any;
  public practiceAreaSelected = false;
  public matterTypes: Array<IOffice> = [];

  public matterType: any;
  public practiceArea: any;
  public lastSelectedPracticeArea: any;

  public loading = true;
  public topLoading = true;

  private oldAttorneyId: number;
  public attorneyLoading = true;
  public nextLoading: boolean;

  isOnFirstTab = true;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  formSubmitted = false;
  originatingAttorneyList: any;

  constructor(
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private officeService: OfficeService,
    private clientService: ClientService,
    private toastr: ToastDisplay,
    private router: Router,
    private matterService: MatterService,
    private miscService: MiscService,
    private contactService: ContactsService,
    private appConfig: AppConfigService,
    private pageTitle: Title,
    private personService: PersonService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    router.events.subscribe(val => {
      if (val instanceof NavigationStart) {
        this.navigateAwayPressed = true;
      }
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.clientId = +params.clientId;
      if (this.clientId) {
        this.getClientDetails();
      }
    });
    this.getStateList();
    this.getPractices();
    this.getOriginatingAttorney();
  }

  getOriginatingAttorney() {
    this.personService
      .v1PersonOriginatingattorneyGet()
      .subscribe((result: any) => {
        this.originatingAttorneyList = JSON.parse(result).results;
      });
  }

  openModal(content: any, className, winClass) {
    this.nextLoading = false;
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static'
      })
      .result.then(() => {
        this.selectedAttorney = null;
        this.selectedAttorneyId = null;
        this.searchStr = '';
        this.changeNotes = '';
      });
  }

  public getStateList() {
    this.miscService.v1MiscStatesGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        this.stateList = JSON.parse(res.body).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  /**
   *
   * Function to get the client details
   */
  getClientDetails() {
    this.topLoading = true;
    this.clientService
      .v1ClientClientIdGet({ clientId: this.clientId })
      .subscribe(
        res => {
          this.clientDetail = JSON.parse(res as any).results;
          this.clientDetail.firstName = this.clientDetail.firstName || '';
          this.clientDetail.lastName = this.clientDetail.lastName || '';
          if (this.clientDetail.isCompany) {
            this.pageTitle.setTitle(
              'Edit Matter Details-' + this.clientDetail.companyName
            );
          } else {
            this.pageTitle.setTitle(
              'Edit Matter Details-' +
                this.clientDetail.firstName +
                ' ' +
                this.clientDetail.lastName
            );
          }
          this.selectedAttorney = this.clientDetail.consultAttorney;
          if (this.selectedAttorney) {
            this.selectedAttorneyId = this.selectedAttorney.id;
            this.oldAttorneyId = this.selectedAttorneyId;
          }
          if (this.clientDetail.originatingAttorney) {
            this.originatingAttorneyId = this.clientDetail.originatingAttorney.id;
          }
          this.getConsultationOffices();
          this.topLoading = false;
        },
        () => {
          this.topLoading = false;
        }
      );
  }

  /**
   * function to consultation offices
   */
  getConsultationOffices(): void {
    this.loading = true;
    this.officeService
      .v1OfficeTenantGet$Response({ checkInitialConsultation: true })
      .subscribe(
        suc => {
          const res: any = suc;
          const listData = JSON.parse(res.body).results;
          if (listData && listData.length > 0) {
            this.consultOfficeList = listData.filter(
              item => item.status === 'Active' || item.status === 'Open'
            );
          }
          if (this.clientDetail && this.clientDetail.consultationLawOffice) {
            this.consultOffice = this.clientDetail.consultationLawOffice.id;
            this.previousSelectedOffice = this.clientDetail.consultationLawOffice;
            const row = this.consultOfficeList.filter(
              office => office.id === this.consultOffice
            );
            this.lastSelectedPracticeArea = this.clientDetail.matterPractices;
            this.practiceArea = this.lastSelectedPracticeArea.id;
            this.getMatterType(this.lastSelectedPracticeArea);
            this.selectedOffice = row[0];
          }
          this.getMatterDetails();
        },
        () => {
          this.loading = false;
        }
      );
  }

  searchAttorney() {
    this.attorneyLoading = true;
    if (!this.selectedOffice) {
      this.attorneyLoading = false;
      return;
    }
    if (this.request) {
      this.request.unsubscribe();
    }

    let val = this.searchStr || '';
    val = val.trim();

    const body: any = {
      search: val,
      officeId: this.selectedOffice.id
    };

    if (this.practiceArea) {
      body.practiceId = this.practiceArea;
    }

    if (this.jurisdictionId) {
      body.stateId = this.jurisdictionId;
    }

    this.request = this.officeService
      .v1OfficeConsultattroneyGet$Response(body)
      .subscribe(
        res => {
          this.attorneyLoading = false;
          let list = JSON.parse(res.body as any).results || [];
          list = _.sortBy(list, a => (a.name || '').toLowerCase());
          this.originalAttorneyList = [...list];
          this.attorneyList = [...list];
          if (this.selectedAttorneyId) {
            const attorney = this.originalAttorneyList.find(
              a => a.id === this.selectedAttorneyId
            );
            if (attorney) {
              this.selectedAttorney = attorney;
            } else {
              this.selectedAttorney = null;
            }
          }
          this.updateFooterPage();
        },
        () => {
          this.attorneyLoading = false;
        }
      );
  }

  consultOfficeChanged(
    event: any,
    OfficeChangeReassignConsultAttorney: TemplateRef<any>
  ) {
    this.selectedOffice = event;

    if (this.selectedAttorney) {
      this.modalService
        .open(OfficeChangeReassignConsultAttorney, {
          size: 'lg' as any,
          windowClass: 'modal-lmd',
          centered: true,
          backdrop: 'static'
        })
        .result.then(res => {
          if (res === 'cancel') {
            if (this.previousSelectedOffice) {
              this.consultOffice = this.previousSelectedOffice.id;
            }
          }

          if (res === 'ok') {
            this.dataEntered = true;
            this.selectedAttorney = null;
            this.selectedAttorneyId = null;
            this.attorneyLoading = true;
            this.getPractices();
            this.searchAttorney();
          }
        });
    } else {
      this.attorneyLoading = true;
      this.searchAttorney();
    }
  }

  /**
   *
   * @param row
   * Function to select the attorney
   */
  onSelect(row: any) {
    this.dataEntered = true;
    this.selectedAttorney = row;
    this.selectedAttorneyId = row.id;
  }

  public updateMatterInfo() {
    if (!this.matterDetailForm.valid) {
      return;
    }
    const data = { ...this.matterDetailForm.value };
    const item = JSON.parse(JSON.stringify(this.clientDetail));

    item.matterPractices = this.selectedPracticeArea;
    item.consultationLawOffice = { id: data.consultLawOffice };
    item.matterTypeId = data.matterType;
    item.changeStatusNotes = data.changeNotes;

    const param = {
      id: this.matterDetails.id,
      clientId: this.clientDetail.id,
      jurisdictionStateId: +data.state || null,
      jurisdictionCounty: data.county,
      matterTypeId: +data.matterType,
      officeId: +data.consultLawOffice,
      name: this.matterDetails.matterName,
      openDate: this.matterDetails.matterOpenDate
    };

    const observables = [
      this.matterService.v1MatterBasicsPut$Json({
        body: param
      })
    ];

    if (
      this.clientDetail &&
      this.clientDetail.matterPractices &&
      this.clientDetail.matterPractices.id
    ) {
      if (this.clientDetail.matterPractices.id != data.practiceArea) {
        observables.push(
          this.matterService.v1MatterPracticesDisassociateMatterIdPracticeIdDelete(
            {
              matterId: this.matterDetails.id,
              practiceId: data.practiceArea
            }
          )
        );
        observables.push(
          this.matterService.v1MatterPracticesAssociateMatterIdPracticeIdPost({
            matterId: this.matterDetails.id,
            practiceId: data.practiceArea
          })
        );
      }
    } else {
      observables.push(
        this.matterService.v1MatterPracticesAssociateMatterIdPracticeIdPost({
          matterId: this.matterDetails.id,
          practiceId: data.practiceArea
        })
      );
    }

    forkJoin(observables).subscribe(
      () => {
        if (this.selectedAttorney) {
          item.consultAttorney = {
            id: +this.selectedAttorneyId
          };
        } else {
          item.consultAttorney = null;
        }
        item.originatingAttorney = {
          id: +this.originatingAttorneyId
        };

        this.updateContact(item, true);
        this.nextLoading = false;
      },
      err => {
        this.nextLoading = false;
        console.log(err);
      }
    );
  }

  public updateContact(item, isMatterUpdate = false) {
    this.clientService.v1ClientPost$Json({ body: item }).subscribe(
      response => {
        const res = JSON.parse(response as any);
        if (res.results === 0) {
          this.toastr.showError(this.errorData.server_error);
        } else {
          this.matterDetailForm.reset();

          if (isMatterUpdate) {
            this.toastr.showSuccess(
              this.errorData.contact_matter_update_success,
            );
          } else {
            this.toastr.showSuccess(
              this.errorData.contact_update_success,
            );
          }
          this.router.navigate(['/contact/view-potential-client'], {
            queryParams: { clientId: this.clientId, state: 'edit' }
          });
        }
      },
      () => {}
    );
  }

  /**
   *
   * @param event
   * Check if the selected attorney is associated with office and licensed
   */
  checkAssociated(event: any) {
    this.formSubmitted = true;
    if (this.matterDetailForm.invalid) {
      return;
    }
    this.dataEntered = false;
    this.nextLoading = true;
    this.updateMatterInfo();
  }

  /***
   * Datatable Pagination Functions
   */

  /** update Associations table footer page count */
  updateFooterPage() {
    this.page.totalElements = this.originalAttorneyList.length;
    this.page.totalPages = Math.ceil(
      this.originalAttorneyList.length / this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

  public pageChange(e) {
    this.pageSelected = e.page;
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateFooterPage();
  }

  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateFooterPage();
    }
  }

  private getMatterDetails() {
    this.matterService
      .v1MatterMatterIdGet({
        matterId: this.clientDetail.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwMatterResponse;
        })
      )
      .subscribe(
        res => {
          if (res) {
            this.matterDetails = res;
            if (this.matterDetails.jurisdictionStateId) {
              this.jurisdictionId = this.matterDetails.jurisdictionStateId;
            }
            this.jurisdictionCounty = this.matterDetails.jurisdictionCounty;
            if (this.matterDetails.matterType) {
              this.matterType = this.matterDetails.matterType.id;
            }
            this.loading = false;
            this.attorneyLoading = true;
            this.searchAttorney();
          } else {
            this.loading = false;
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  public getPractices() {
    this.miscService.v1MiscPracticesGet$Response({}).subscribe(
      suc => {
        this.practiceList = JSON.parse(suc.body as any).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  public getMatterType(e) {
    if (e) {
      this.loading = true;
      this.matterService
        .v1MatterTypesPracticeIdGet({ practiceId: e.id })
        .subscribe(
          suc => {
            this.loading = false;
            const res: any = suc;
            this.matterTypes = JSON.parse(res).results;
            this.practiceAreaSelected = true;
            if (this.matterTypes.length) {
              const selectedMatterType = this.matterTypes.filter(
                matterType => matterType.id === this.matterType
              )[0];
              if (selectedMatterType) {
                this.matterType = selectedMatterType.id;
              } else {
                this.matterType = null;
              }
            }
          },
          err => {
            this.loading = false;
            console.log(err);
          }
        );
    } else {
      this.practiceAreaSelected = false;
      this.loading = false;
      this.matterTypes = [];
    }
  }

  showWarningMessageOnChangePracticeArea(content, value) {
    this.selectedPracticeArea = value ? value : '';
    if (value || this.matterDetails.practiceArea.length > 0) {
      this.open(content, 'lg');
    }
  }

  open(content: any, className: any) {
    this.modalService
      .open(content, {
        size: className,
        centered: true,
        backdrop: 'static'
      })
      .result.then();
  }

  public cancelChangePracticeArea() {
    this.selectedPracticeArea = null;
    this.practiceArea = this.lastSelectedPracticeArea
      ? this.lastSelectedPracticeArea.id
      : null;
  }

  public confirmChangePracticeArea() {
    this.dataEntered = true;
    this.matterType = null;
    this.getMatterType(this.selectedPracticeArea);
    this.selectedAttorneyId = 0;
    this.selectedAttorney = null;
    this.attorneyLoading = true;
    this.searchAttorney();
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(
    event: KeyboardEvent
  ) {
    this.dataEntered = true;
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.attorneyList) {
      return this.attorneyList.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
