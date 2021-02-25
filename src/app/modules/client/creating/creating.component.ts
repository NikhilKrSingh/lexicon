import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import {
  ModalDismissReasons,
  NgbModal,
  NgbModalOptions
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as clone from 'clone';
import * as moment from 'moment';
import { forkJoin, fromEvent, Observable, Subscription } from 'rxjs';
import { debounceTime, finalize, map, take } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { InvoiceService } from 'src/app/service/invoice.service';
import {
  CorporateContactConflictCheckRequest,
  PCConflictCheckRequest,
  vwAddOnService,
  vwAddress,
  vwBillToClientPrintAndEmail,
  vwCalendarSettings,
  vwCreditCard,
  vwECheck,
  vwFullClientRequest,
  vwRate
} from 'src/common/swagger-providers/models';
import {
  BillingService,
  CalendarService,
  ClientService,
  ContactsService,
  MatterService,
  MiscService,
  TenantService,
  TrustAccountService,
  UsioService
} from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { TrustAccountComponent } from '../../matter/new-matter-wizard/trust-account/trust-account.component';
import { TrustBankAccountsComponent } from '../../matter/new-matter-wizard/trust-bank-accounts/trust-bank-accounts.component';
import { vwConflictPerson } from '../../models';
import { vwDefaultInvoice } from '../../models/bill-to-client.model';
import { IAdrs, Idata } from '../../models/data.model';
import { ConflictCheckDialogComponent } from '../../shared/conflict-check-dialog/conflict-check-dialog.component';
import { DialogService } from '../../shared/dialog.service';
import * as errors from '../../shared/error.json';
import { SharedService } from '../../shared/sharedService';
import { UtilsHelper } from '../../shared/utils.helper';
import { ClientAddNoteComponent } from './add-note/add-note.component';
import { ClientBasicInfoComponent } from './basic-info/basic-info.component';
import { ClientBillingInfoComponent } from './billing-info/billing-info.component';
import { ClientCalendarEventComponent } from './calendar-event/calendar-event.component';
import { ClientMatterDetailsComponent } from './matter-details/matter-details.component';
import { ClientTrustAccountingComponent } from './trust-accounting/trust-accounting.component';
import { ClientUploadDocumentComponent } from './upload-document/upload-document.component';

@Component({
  selector: 'app-creating',
  templateUrl: './creating.component.html',
  styleUrls: ['./creating.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ClientCreatingComponent
  implements OnInit, AfterViewInit, IBackButtonGuard, OnDestroy {
  uniqueNumber: any;
  // for window scroll events
  @HostListener('window:scroll') onScroll(): void {
    if (document.querySelectorAll('owl-date-time-container').length == 0) {
      if (this.offsetValue.top <= window.pageYOffset + this.topbarHeight) {
        this.fixedTop = true;
        const scrollwidth = UtilsHelper.getScrollbarWidth();
        this.topbarHeightst = this.topbarHeight;
        this.fixedHeight = this.offsetValue.height;
        this.fixedLeft = this.offsetValue.left;
        this.fixedRight = window.innerWidth - (this.offsetValue.left + this.offsetValue.width) - scrollwidth;
      } else {
        this.topbarHeightst = 0;
        this.fixedHeight = 0;
        this.fixedLeft = 0;
        this.fixedRight = 0;
        this.fixedTop = false;
      }

      const windowOffset = window.pageYOffset + 10;
      if (windowOffset >= this.notesHeight) {
        this.activeTab = 'addNotes';
      } else if (windowOffset >= this.uploadDocumentHeight) {
        this.activeTab = 'uploadDocuments';
      } else if (windowOffset >= this.calendarEventsHeight) {
        this.activeTab = 'calendarEvents';
      } else if (windowOffset >= this.trustAccountingHeight) {
        this.activeTab = 'trustAccounting';
      } else if (windowOffset >= this.billingInformationHeight) {
        this.activeTab = 'billingInformation';
      } else if (windowOffset >= this.matterDetailsInfoHeight) {
        this.activeTab = 'matterDetailsInfo';
      } else {
        this.activeTab = 'basicInfo';
      }
    }
  }

  @ViewChild('basicInfo', { read: ElementRef, static: false }) basicInfo: ElementRef;

  @ViewChild('matterDetailsInfo', { read: ElementRef, static: false }) matterDetailsInfo: ElementRef;

  @ViewChild('billingInformation', { read: ElementRef, static: false }) billingInformation: ElementRef;

  @ViewChild('trustAccounting', { read: ElementRef, static: false }) trustAccounting: ElementRef;

  @ViewChild('calendarEvents', { read: ElementRef, static: false }) calendarEvents: ElementRef;

  @ViewChild('uploadDocuments', { read: ElementRef, static: false }) uploadDocuments: ElementRef;

  @ViewChild('addNotes', { read: ElementRef, static: false }) addNotes: ElementRef;

  @ViewChild('NewClientCreated', { static: false }) NewClientCreated: any;
  @ViewChild('UnsavedChanges', { static: false }) UnsavedChanges: any;

  @ViewChild(ClientBasicInfoComponent, { static: false }) basicInfoComponent: ClientBasicInfoComponent;

  @ViewChild(ClientMatterDetailsComponent, { static: false }) matterDetailsComponent: ClientMatterDetailsComponent;

  @ViewChild(ClientBillingInfoComponent, { static: false }) billingInformationComponent: ClientBillingInfoComponent;

  @ViewChild(ClientCalendarEventComponent, { static: false }) calendarEventComponent: ClientCalendarEventComponent;

  @ViewChild(ClientTrustAccountingComponent, { static: false }) trustAccountsComponent: ClientTrustAccountingComponent;

  @ViewChild(ClientAddNoteComponent, { static: false }) notesComponent: ClientAddNoteComponent;

  @ViewChild(ClientUploadDocumentComponent, { static: false }) uploadDocumentComponent: ClientUploadDocumentComponent;

  @ViewChild(TrustAccountComponent, {static: false}) trustAccountComponent: TrustAccountComponent;
  @ViewChild(TrustBankAccountsComponent, {static: false}) trustBankAccountsComponent: TrustBankAccountsComponent;

  modalOptions: NgbModalOptions;
  closeResult: string;

  public subscribeRunConflict: Subscription;
  public offsetValue;
  public topbarHeight: number;
  public topbarHeightst: number = 0;
  public fixedHeight: number = 0;
  public fixedLeft: number = 0;
  public fixedRight: number = 0;
  public activeTab: string = 'basicInfo';

  public matterDetails: FormGroup;
  public clientDetails: any;
  public schedulingDetails: FormGroup;

  public fixedTop: boolean = false;
  public isMatterFormInvalid: boolean;
  public iscontactInfoFormInvalid: boolean;
  public isLoading: boolean = false;
  private trustAccountingHeight: any;
  private matterDetailsInfoHeight: any;
  private calendarEventsHeight: any;
  private uploadDocumentHeight: any;
  private billingInformationHeight: any;
  private notesHeight: any;
  public userInfo: any;
  public savedClientInfo: any;
  public conflictArr: Array<vwConflictPerson> = [];
  public blockedPersonsArr = [];
  public isConflictChecked = false;
  public calendarRedirectionData: any;
  public isTuckerallenAccount: boolean;
  public tuckerAllenAccountSubscription: Subscription;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  formsFilledStatus = false;
  formSubmitted = false;
  public stateList: Array<any> = [];
  public refresh: Date = null;
  public updateDetails: { office: any; attorney: any };
  public isTrustAccountEnabled: boolean = false;

  public changeAssociation = true;
  public changeBasicInfo = true;

  public clientType: string;
  public errorData: any = (errors as any).default;

  officeId: number;
  tierName: string;
  primaryAddress: vwAddress = {};

  defaultLogoUrl: string;
  public invoiceTemplateDetails: vwDefaultInvoice;
  public tenantDetails: any;

  basicInfoInvalid = false;
  matterInfoInvalid = false;
  billingInfoInvalid = false;
  trustAccountInvalid = false;

  disableSave = false;

  emailToAttorney: {
    ra?: number;
    ba?: number;
    matterId?: number;
  } = {};

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  BILLING_MANAGEMENTisAdmin:boolean = false;
  BILLING_MANAGEMENTisEdit:boolean = false;
  public clientId : number;
  public matterId : number;
  selectedTimezone: string;
  public calendarSettings: vwCalendarSettings;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private contactsService: ContactsService,
    private appConfig: AppConfigService,
    private dialogService: DialogService,
    private clientService: ClientService,
    private sharedService: SharedService,
    private pagetitle: Title,
    private invoiceService: InvoiceService,
    private el: ElementRef,
    private trustAccountService: TrustAccountService,
    private billingService: BillingService,
    private tenantService: TenantService,
    private matterService: MatterService,
    private store: Store<fromRoot.AppState>,
    public usioService: UsioService,
    private miscService: MiscService,
    private calendarService: CalendarService,
  ) {
    this.getDefaultInvoiceTemplate();
    this.getTenantProfile();
    this.permissionList$ = this.store.select('permissions');
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          this.BILLING_MANAGEMENTisEdit = this.permissionList.BILLING_MANAGEMENTisEdit;
          this.BILLING_MANAGEMENTisAdmin = this.permissionList.BILLING_MANAGEMENTisAdmin;
        }
      }
    });
    this.invoiceService
      .loadImage(this.appConfig.appConfig.default_logo)
      .subscribe((blob) => {
        const a = new FileReader();
        a.onload = (e) => {
          this.defaultLogoUrl = (e.target as any).result;
        };
        a.readAsDataURL(blob);
      });

    router.events.subscribe((val) => {
      if (val instanceof NavigationStart) {
        this.navigateAwayPressed = true;
      }
    });
  }

  ngOnInit() {
    this.pagetitle.setTitle('Create New Client');
    this.userInfo = UtilsHelper.getLoginUser();
    this.getInitialData();

    if (this.userInfo && this.userInfo.tenantTier) {
      this.tierName = this.userInfo.tenantTier.tierName;
    }

    this.tuckerAllenAccountSubscription = this.sharedService.isTuckerAllenAccount$.subscribe(
      (res) => {
        this.isTuckerallenAccount = res;
      }
    );
    this.getCalSetting();
  }

  private getCalSetting() {
    this.calendarService.v1CalendarSettingsPersonIdGet({personId: this.userInfo.id})
    .pipe(map(UtilsHelper.mapData),
      finalize(() => {})
    ).subscribe(res => {
      if (res) {
        this.calendarSettings = res;
        this.getTimeZone();
      }
    }, () => {
    } );
  }

  getTimeZone() {
    this.miscService.v1MiscTimezonesGet({}).subscribe((result: any) => {
      let timezoneList = JSON.parse(result).results;
      const timeZoneDetail = timezoneList.filter(obj => obj.id == this.calendarSettings.timeZoneId);
      const tZ = timeZoneDetail[0];
      const officeTimeZoneDetails = tZ.name.substr(4,6);
      const reg = new RegExp(/^[+:\d-]+$/);
      const timeZone = officeTimeZoneDetails.split(':');
      this.selectedTimezone = (reg.test(officeTimeZoneDetails) && timeZone.length > 1 ) ? timeZone.join('') : '+00:00';
    });
  }

  private getDefaultInvoiceTemplate() {
    this.billingService
      .v1BillingGetDefaultInvoiceTemplateGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.invoiceTemplateDetails = res;
      });
  }

  private getTenantProfile() {
    this.tenantService
      .v1TenantProfileGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res) => {
          this.tenantDetails = res;
        },
        () => {}
      );
  }

  private getInitialData() {
    this.isLoading = true;

    forkJoin([
      this.trustAccountService.v1TrustAccountGetTrustAccountStatusGet(),
      this.clientService.v1ClientGetClientUniqueNumberGet({
        tenantId: this.userInfo.tenantId,
      }),
    ])
      .pipe(
        map((res) => {
          return {
            accounting: JSON.parse(res[0] as any).results as boolean,
            uniqueNumber: JSON.parse(res[1] as any).results.uniqueNumber,
          };
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        (suc) => {
          const accounting = suc.accounting;
          if (accounting) {
            this.isTrustAccountEnabled = true;
          } else {
            this.isTrustAccountEnabled = false;
          }

          this.uniqueNumber = +suc.uniqueNumber + 1;
          this.sharedService.ContactUniqueNumber$.next(this.uniqueNumber);

          this.getElementsHeight();
          this.isLoading = false;
        },
        (err) => {
          this.isLoading = false;
        }
      );
  }

  ngAfterViewInit() {
    this.getElementsHeight();

    const elements = document.querySelectorAll('.scrolling-steps');
    this.offsetValue =
      elements && elements.length > 0 ? elements[0].getBoundingClientRect() : 0;
    const ele = document.querySelectorAll('.top-bar');
    this.topbarHeight =
      ele && ele.length > 0 ? ele[0].getBoundingClientRect().height : 0;
  }

  ngOnDestroy() {
    if (this.tuckerAllenAccountSubscription) {
      this.tuckerAllenAccountSubscription.unsubscribe();
    }
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  scrollToElement(id, addToSteps = true) {
    if (addToSteps && this.activeTab != id) {
      this.steps.push(this.activeTab);
      this.steps = [...this.steps];
    }

    this.activeTab = id;
    let extra = id === 'basicInfo' ? 10 : 0;
    const yOffset = -(this.offsetValue.height + this.topbarHeight + extra);

    if (this[id]) {
      const element = this[id].nativeElement;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  getMatterDetails(event: any) {
    this.matterDetails = event.basicForm;
    this.validateMatterDetails();
    this.checkFormsFilledStatus();
    this.officeId = this.matterDetails.value.primaryLawOffice;
  }

  validateMatterDetails() {
    if (
      this.matterDetailsComponent &&
      this.matterDetailsComponent.isNotMatterDetailsValidate()
    ) {
      this.matterInfoInvalid = true;
    } else {
      this.matterInfoInvalid = false;
    }
  }

  validateBasicDetails() {
    if (
      this.basicInfoComponent &&
      this.basicInfoComponent.isBasicInfoInvalid()
    ) {
      this.basicInfoInvalid = true;
    } else {
      this.basicInfoInvalid = false;
    }
  }

  getElementsHeight() {
    setTimeout(() => {
      const extra = 0;
      const yOffset = -(this.offsetValue.height + this.topbarHeight + extra);
      if (this.matterDetailsInfo) {
        this.matterDetailsInfoHeight =
          this.matterDetailsInfo.nativeElement.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
      }
      if (this.billingInformation) {
        this.billingInformationHeight =
          this.billingInformation.nativeElement.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
      }
      if (this.trustAccounting) {
        this.trustAccountingHeight =
          this.trustAccounting.nativeElement.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
      }
      if (this.calendarEvents) {
        this.calendarEventsHeight =
          this.calendarEvents.nativeElement.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
      }
      if (this.uploadDocuments) {
        this.uploadDocumentHeight =
          this.uploadDocuments.nativeElement.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
      }
      if (this.addNotes) {
        this.notesHeight =
          this.addNotes.nativeElement.getBoundingClientRect().top +
          window.pageYOffset +
          yOffset;
      }
    }, 300);
  }

  @HostListener('window:popstate', ['$event']) onPopState(event) {
    if (this.steps.length > 0) {
      let step = this.steps.pop();
      this.scrollToElement(step, false);
      this.isOnFirstTab = false;
      this.backbuttonPressed = true;
    } else {
      this.isOnFirstTab = true;
      this.backbuttonPressed = true;
    }
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = this.formsFilledStatus ? true : false;
  }

  async getSchedulingDetails(event: any) {
    this.schedulingDetails = event;
    if (event && event.updateOfficeAttorny) {
      this.updateDetails = { office: event.office, attorney: event.attorney };
      this.refresh = new Date();
    }
  }

  /**** function to show/hide loader at parent level */
  showHideLoader(value?: boolean): void {
    this.isLoading = value;
  }

  runConflictsCheck(): void {
    this.isLoading = true;

    let associations = [];

    if (
      this.matterDetailsComponent &&
      this.matterDetailsComponent.matterAssociationList.length > 0
    ) {
      associations = clone(this.matterDetailsComponent.matterAssociationList);
    }

    if (
      this.basicInfoComponent &&
      this.basicInfoComponent.clientAssociations.length > 0
    ) {
      associations = associations.concat(
        clone(this.basicInfoComponent.clientAssociations)
      );
    }

    this.matterDetailsComponent.removeBlankAttorney();
    let corporatecontacts = [];

    let basicInfo: any = this.clientDetails;

    if (
      this.matterDetailsComponent &&
      this.clientType == 'corporate' &&
      this.matterDetailsComponent.corporateContactList.length > 0
    ) {
      corporatecontacts = clone(
        this.matterDetailsComponent.corporateContactList
      );
      corporatecontacts.forEach((obj: any) => {
        obj.companyName = obj.hasOwnProperty('companyName')
          ? obj.companyName
          : null;
        obj.isCompany = obj.hasOwnProperty('isCompany') ? obj.isCompany : false;
        obj.isNew = obj.hasOwnProperty('isNew') ? obj.isNew : false;
        delete obj.associationType;
        delete obj.associationTypeId;
        delete obj.cellPhone;
        delete obj.cellPhoneNumber;
        delete obj.client;
        delete obj.clientId;
        delete obj.generalCounsel;
        delete obj.id;
        delete obj.isBilling;
        delete obj.isGeneralCounsel;
        delete obj.isPrimary;
        delete obj.jobTitle;
        delete obj.person;
        delete obj.personId;
        delete obj.primaryPhoneNumber;
        delete obj.status;
        delete obj.uniqueNumber;
      });
    }

    associations.forEach((a) => {
      if (a.primaryPhone) {
        a.primaryPhone = a.primaryPhone.name;
      }
      delete a.email;
    });

    const request: PCConflictCheckRequest = {
      clientId: 0,
      matterId: 0,
      associations,
      clientCompanyName: basicInfo.companyName,
      clientFirstName: basicInfo.firstName,
      clientLastName: basicInfo.lastName,
      isCompany: this.clientType == 'corporate',
    };

    const requestCorporate: CorporateContactConflictCheckRequest = {
      clientId: 0,
      matterId: 0,
      corporatecontacts,
      clientCompanyName: basicInfo.companyName,
      clientFirstName: basicInfo.firstName,
      clientLastName: basicInfo.lastName,
      isCompany: this.clientType == 'corporate',
    };

    const listObject = [
      this.contactsService.v1ContactsConflictPost$Json({ body: request }),
    ];

    if (this.clientType == 'corporate') {
      listObject.push(
        this.contactsService.v1ContactsCorporateContactConflictCheckPost$Json({
          body: requestCorporate,
        })
      );
    }

    forkJoin(listObject)
      .pipe(
        map((res) => {
          if (this.clientType == 'corporate') {
            return {
              acConflict: JSON.parse(res[0] as any).results,
              coConflict: JSON.parse(res[1] as any).results,
            };
          } else {
            return {
              acConflict: JSON.parse(res[0] as any).results,
            };
          }
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((suc) => {
        if (this.clientType == 'corporate') {
          this.conflictArr = [
            ...suc.acConflict.conflictPersons,
            ...suc.coConflict.conflictPersons,
          ];
          this.blockedPersonsArr = [
            ...suc.acConflict.blockedPersons,
            ...suc.coConflict.blockedPersons,
          ];
        } else {
          this.conflictArr = suc.acConflict.conflictPersons;
          this.blockedPersonsArr = suc.acConflict.blockedPersons;
        }
        this.openConflictCheckDialog();
        this.isLoading = false;
      }, () => {
        this.isLoading = false;
      });
  }

  private openConflictCheckDialog() {
    let modal = this.modalService.open(ConflictCheckDialogComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-xlg',
    });

    let component = modal.componentInstance;

    component.conflicts = this.conflictArr;
    component.hasConflicts = this.conflictArr.length > 0;
    component.blockedUsers = this.blockedPersonsArr;
    component.type = 'Client';
    component.pageType = 'createclient';

    component.saveBtn = true;

    component.header = this.errorData.potential_conflict_header;
    component.message = this.errorData.changes_potential_conflict;
    component.returnButtonText = 'Return to Workflow';

    modal.result.then((res) => {
      if (res == 'save') {
        this.changeAssociation = false;
        this.changeBasicInfo = false;
        this.saveClient();
      } else {
        this.changeAssociation = false;
        this.changeBasicInfo = false;
      }
    });
  }

  disableSaveButton($event) {
    this.disableSave = $event;
  }

  /**
   * Function to open the modals
   * @param content
   * @param className
   * @param winClass
   */
  open(content: any, className: any, winClass, backdrop: any = true) {
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: backdrop,
      })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }

  /**
   * Function to get the dismiss reasons for the modals
   * @param reason
   */
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  /***** function to call when click on new client */
  async saveClient(): Promise<any> {
    this.formSubmitted = true;
    this.basicInfoInvalid = false;
    this.matterInfoInvalid = false;
    this.billingInfoInvalid = false;
    this.trustAccountInvalid = false;

    let isDocInvalid = false;

    if (
      this.basicInfoComponent &&
      this.basicInfoComponent.isBasicInfoInvalid()
    ) {
      this.basicInfoInvalid = true;
    }

    if (
      this.matterDetailsComponent &&
      this.matterDetailsComponent.isNotMatterDetailsValidate()
    ) {
      this.matterInfoInvalid = true;
    }

    if (
      this.billingInformationComponent &&
      this.billingInformationComponent.isNotValidBillingInformation()
    ) {
      this.billingInfoInvalid = true;
    }

    if (
      this.uploadDocumentComponent &&
      this.uploadDocumentComponent.getSecurityScanFailedStatus
    ) {
      isDocInvalid = true;
    }

    if (this.trustBankAccountsComponent) {
      if (!this.trustBankAccountsComponent.returnTrustBankAccountData()){
        this.trustAccountInvalid = true;
      }
    }

    if (
      this.basicInfoInvalid ||
      this.matterInfoInvalid ||
      this.billingInfoInvalid ||
      this.trustAccountInvalid ||
      isDocInvalid
    ) {
      this.scrollToFirstInvalidControl();
      return;
    }

    if (this.changeAssociation || this.changeBasicInfo) {
      this.runConflictsCheck();
    } else {
      this.createNewClient();
    }
  }

  /***** function to create new client */
  async createNewClient(): Promise<any> {
    localStorage.setItem('save', 'true');
    this.formSubmitted = true;

    const basicDetails: any = this.clientDetails;

    let matterAssociations: Array<any> = [];
    const blockEmployees: Array<any> = [];
    let materBasics: any = {};

    const settings: Idata = {};

    const billingDetails: {
      settings?: Idata;
      addOns?: Array<vwAddOnService>;
      echecks?: Array<vwECheck>;
      creditCards?: Array<vwCreditCard>;
      rates?: Array<vwRate>;
      invoiceAddress?: IAdrs;
      clientSettings?: Idata;
    } = {};

    // this is required format
    const data = {
      id: 0,
      uniqueNumber: +basicDetails.uniqueNumber,
      attorneyDetails: {
        initialConsultAttoney: this.clientDetails.consultAttorney || 0,
        originatingAttorney: 0,
      },
      basicDetails: basicDetails,
      billingDetails: {},
      matterDetails: {},
      personFormBuilder: this.getFormBuilderData(basicDetails),
      uploadDocuments: [],
      matterNotes: [],
      matterTrustAccount: {},
      matterTrustOnlyAccounts: [],
      matterPropertyHeldInTrusts: [],
      blockEmployees: [],
      matterEvents: [],
      clientAssociations: [],
      matterAssociations: [],
      vwDisbursementRate: [],
    } as vwFullClientRequest;

    data.basicDetails.contactType = this.clientType;

    if (
      this.basicInfoComponent &&
      this.basicInfoComponent.clientAssociations.length > 0
    ) {
      data.clientAssociations = clone(
        this.basicInfoComponent.clientAssociations
      );
    }

    /**
     * matter basic details
     */
    if (this.matterDetailsComponent) {
      materBasics = { ...this.matterDetailsComponent.matterForm.value };
      materBasics.matterOpenDate = moment(materBasics.matterOpenDate).format(
        'YYYY-MM-DD'
      );
      if (materBasics.trustExecutionDate) {
        materBasics.trustExecutionDate = moment(
          materBasics.trustExecutionDate
        ).format('YYYY-MM-DD');
      }
      materBasics.clientId = 0;
      if (
        this.matterDetailsComponent.employeesRows &&
        this.matterDetailsComponent.employeesRows.length > 0
      ) {
        this.matterDetailsComponent.employeesRows.map((item) => {
          blockEmployees.push({
            personId: item.id,
            description: item.description,
          });
        });
      }

      data.blockEmployees = blockEmployees;

      const attorneyList = this.matterDetailsComponent.attorneyForm.value;

      matterAssociations = clone(
        this.matterDetailsComponent.matterAssociationList
      );

      if (attorneyList.attorneys && attorneyList.attorneys.length > 0) {
        attorneyList.attorneys.map((obj) => {
          if (
            !obj.IsOriginatingAttorney &&
            !obj.IsResponsibleAttorney &&
            !obj.IsBillingAttorney
          ) {
            matterAssociations.push({
              associationId: this.matterDetailsComponent.associateAttorny.id,
              id: obj.id,
            });
          } else {
            if (obj.IsOriginatingAttorney) {
              matterAssociations.push({
                associationId: this.matterDetailsComponent
                  .associateOriginatingAttorney.id,
                id: obj.id,
              });

              data.attorneyDetails.originatingAttorney = obj.id || 0;
            }

            if (obj.IsResponsibleAttorney) {
              matterAssociations.push({
                associationId: this.matterDetailsComponent
                  .associateResponsibleAttorney.id,
                id: obj.id,
              });

              data.attorneyDetails.responsibleAttoney = obj.id || 0;
              this.emailToAttorney.ra = obj.id || 0;
            }

            if (obj.IsBillingAttorney) {
              matterAssociations.push({
                associationId: this.matterDetailsComponent
                  .associateBillingAttorney.id,
                id: obj.id,
              });

              data.attorneyDetails.billingAttorney = obj.id || 0;
              this.emailToAttorney.ba = obj.id || 0;
            }
          }
        });
      }

      data.matterAssociations = matterAssociations;

      if (this.clientType === 'corporate') {
        if (this.matterDetailsComponent.corporateContactList) {
          const corporateList = clone(
            this.matterDetailsComponent.corporateContactList
          );

          corporateList.map((obj) => {
            obj.status = obj.status === 'Active' ? true : false;
            obj.primaryPhoneNumber = obj.primaryPhone;
            obj.cellPhoneNumber = obj.cellPhone;
          });

          data.basicDetails.corporateContacts = corporateList;
        }
      } else {
        data.basicDetails.corporateContacts = [];
      }
    }

    if (
      (this.matterDetails &&
        this.matterDetails.value &&
        this.matterDetails.value.contactType &&
        this.matterDetails.value.contactType != 'individual') ||
      !this.isTuckerallenAccount
    ) {
      delete data.personFormBuilder;
    }

    if (this.billingInformationComponent) {
      materBasics.isFixedFee = this.billingInformationComponent.isFixedFee;
      materBasics.contingentCase = this.billingInformationComponent.contingentCase;
      billingDetails.creditCards = this.billingInformationComponent.paymentList.creditCardList;
      billingDetails.echecks = this.billingInformationComponent.paymentList.echeckList;
      if (this.billingInformationComponent.isFixedFee) {
        settings.fixedFeeIsFullAmount =
          this.billingInformationComponent.paymentMode == 1;
        settings.fixedFeeAmountToPay =
          this.billingInformationComponent.paymentMode == 1
            ? this.billingInformationComponent.rateAmount
            : 0;
        settings.fixedFeeRemainingAmount =
          this.billingInformationComponent.paymentMode == 1
            ? 0
            : this.billingInformationComponent.rateAmount;
        settings.fixedFeeDueDate =
          this.billingInformationComponent.paymentMode == 2
            ? this.billingInformationComponent.deferDate
            : null;
        settings.fixedFeeBillOnWorkComplete =
          this.billingInformationComponent.paymentMode == 3 ? true : false;
        (billingDetails as any).vwFixedFeeAddOns = this.billingInformationComponent.addOnList;
        (billingDetails as any).fixedFeeServices = this.billingInformationComponent.fixedFeeList;
      } else {
        const rateArr = [...this.billingInformationComponent.rateList];
        rateArr.map((obj) => {
          obj.rateAmount = +obj.rateAmount;
          obj.customRateAmount = +obj.customRateAmount;
        });
        billingDetails.rates = rateArr;
        billingDetails['rateTables'] = this.billingInformationComponent.rateTables;
        if (this.billingInformationComponent.isInherited) {
          settings.billFrequencyQuantity = +this.billingInformationComponent
            .billingSettings.billFrequencyQuantity;
          settings.billFrequencyDuration = this.billingInformationComponent.billingSettings.billFrequencyDuration;
          (settings as any).billFrequencyRecursOn = this.billingInformationComponent.billingSettings.billFrequencyRecursOn;
          (settings as any).billFrequencyDay = this.billingInformationComponent.billingSettings.billFrequencyDay;
          (settings as any).effectiveDate = moment(
            this.billingInformationComponent.displayStartDate
          ).format('YYYY-MM-DD');
          settings.billFrequencyStartingDate = moment(
            this.billingInformationComponent.displayStartDate
          ).format('YYYY-MM-DD');
          (settings as any).billFrequencyNextDate = moment(
            this.billingInformationComponent.displayEndDate
          ).format('YYYY-MM-DD');
          (settings as any).repeatType = +this.billingInformationComponent.billingSettings.repeatType;
        } else {
          if (
            this.billingInformationComponent.getSettingsDetails
              .billFrequencyQuantity
          ) {
            settings.billFrequencyQuantity = this.billingInformationComponent.getSettingsDetails.billFrequencyQuantity;
          }
          if (
            this.billingInformationComponent.getSettingsDetails
              .billFrequencyDuration
          ) {
            settings.billFrequencyDuration = this.billingInformationComponent.getSettingsDetails.billFrequencyDuration;
          }
          if (
            this.billingInformationComponent.getSettingsDetails
              .billFrequencyRecursOn
          ) {
            (settings as any).billFrequencyRecursOn = this.billingInformationComponent.getSettingsDetails.billFrequencyRecursOn;
          }
          (settings as any).billFrequencyDay = this.billingInformationComponent.getSettingsDetails.billFrequencyDay;
          if (
            this.billingInformationComponent.getSettingsDetails.effectiveDate
          ) {
            (settings as any).effectiveDate = this.billingInformationComponent.getSettingsDetails.effectiveDate;
          }
          if (
            this.billingInformationComponent.getSettingsDetails
              .billFrequencyStartingDate
          ) {
            settings.billFrequencyStartingDate = this.billingInformationComponent.getSettingsDetails.billFrequencyStartingDate;
          }
          if (
            this.billingInformationComponent.getSettingsDetails
              .billFrequencyNextDate
          ) {
            (settings as any).billFrequencyNextDate = this.billingInformationComponent.getSettingsDetails.billFrequencyNextDate;
          }
          (settings as any).repeatType = +this.billingInformationComponent.getSettingsDetails.repeatType;
        }

        settings.isInherited = this.billingInformationComponent.isInherited;
        settings['isWorkComplete'] = this.billingInformationComponent.isWorkComplete;
      }
      settings.fixedAmount = this.billingInformationComponent.fixedAmount;
      if (this.billingInformationComponent.invoiceDelivery) {
        const inc = this.billingInformationComponent.invoicedeliveryList.find(
          (obj) => obj.id === this.billingInformationComponent.invoiceDelivery
        );
        settings.invoiceDelivery = inc;
      }

      const primaryAdrs = this.primaryAddress;
      if (this.billingInformationComponent.invoiceAddress) {
        if (primaryAdrs) {
          billingDetails.invoiceAddress = {
            id: 0,
            personId: 0,
            addressTypeId: 4,
            addressTypeName: 'invoice',
            address1: primaryAdrs.address,
            address2: primaryAdrs.address2,
            city: primaryAdrs.city,
            state: primaryAdrs.state,
            zipCode: primaryAdrs.zip,
          };
        }
      } else {
        billingDetails.invoiceAddress = {
          id: 0,
          personId: +this.clientId,
          addressTypeId: 4,
          addressTypeName: 'invoice',
          address1: this.billingInformationComponent.address,
          address2: this.billingInformationComponent.address2,
          city: this.billingInformationComponent.city,
          state: this.billingInformationComponent.state,
          zipCode: this.billingInformationComponent.zip
        };
      }
      billingDetails.settings = settings;
      billingDetails.clientSettings = { ...settings };
      data.vwDisbursementRate = this.billingInformationComponent.selDisbursementTypes;
    }

    data.matterDetails = materBasics;
    data.billingDetails = billingDetails;

    /* Calendar event */
    if (this.calendarEventComponent) {
      if (this.calendarEventComponent.eventList && this.calendarEventComponent.eventList.length > 0) {
        let eventArr = clone(this.calendarEventComponent.eventList);
        eventArr.map((obj) => {
          obj.startDateTime = moment(obj.startDateTime + this.selectedTimezone).utc().format('YYYY-MM-DD[T]HH:mm:ss');
          obj.endDateTime = moment(obj.endDateTime + this.selectedTimezone).utc().format('YYYY-MM-DD[T]HH:mm:ss');
        });
        data.matterEvents = this.calendarEventComponent.eventList;
      }
    }

    // Trust Accounting
    if (this.trustAccountComponent) {
      let trustData = this.trustAccountComponent.trustAccountData();

      data.matterTrustAccount = trustData.matterTrustAccount;
      data.matterTrustOnlyAccounts = trustData.matterTrustOnlyAccounts;
      data.matterPropertyHeldInTrusts = trustData.matterPropertyHeldInTrusts;

      if (data.matterPropertyHeldInTrusts) {
        for(let row of data.matterPropertyHeldInTrusts) {
          row.clientId = 0;
        }
      }
    }

    if (this.notesComponent) {
      data.matterNotes = this.notesComponent.matterNotesData();
    }

    if (this.uploadDocumentComponent) {
      data.uploadDocuments = this.uploadDocumentComponent.getFilesForUpload();
    }

    this.saveNewClient(data, false);
  }

  private getFormBuilderData(basicDetails: any) {
    return {
      id: 0,
      personId: 0,
      isDeceased: basicDetails.isDeceased ? basicDetails.isDeceased : false,
      spouseFirstName: basicDetails.spouseFirstName
        ? basicDetails.spouseFirstName
        : null,
      spouseMiddleName: basicDetails.spouseMiddleName
        ? basicDetails.spouseMiddleName
        : null,
      spouseLastName: basicDetails.spouseLastName
        ? basicDetails.spouseLastName
        : null,
      spouseGender: basicDetails.spouseGender
        ? basicDetails.spouseGender
        : null,
      spouseIsDeceased: basicDetails.spouseIsDeceased
        ? basicDetails.spouseIsDeceased
        : false,
      prospectFirstName: basicDetails.prospectFirstName
        ? basicDetails.prospectFirstName
        : null,
      prospectMiddleName: basicDetails.prospectMiddleName
        ? basicDetails.prospectMiddleName
        : null,
      prospectLastName: basicDetails.prospectLastName
        ? basicDetails.prospectLastName
        : null,
      prospectRelationship: basicDetails.prospectRelationship
        ? basicDetails.prospectRelationship
        : null,
      prospectGender: basicDetails.prospectGender
        ? basicDetails.prospectGender
        : null,
      prospectIsDeceased: basicDetails.prospectIsDeceased
        ? basicDetails.prospectIsDeceased
        : false,
      changeNotes: '',
    };
  }

  /***** function to save new client */
  async saveNewClient(data, loading: boolean = false): Promise<any> {
    if (!loading) {
      this.isLoading = true;
    }
    if(data.billingDetails &&  data.billingDetails.settings && data.billingDetails.settings.invoiceDelivery && data.billingDetails.settings.invoiceDelivery.code == "ELECTRONIC"){
       data.billingDetails.invoiceAddress = {}
    }

    try {
      let resp: any = await this.clientService
        .v1ClientFullPost$Json$Response({ body: data })
        .toPromise();
      this.isLoading = false;
      resp = JSON.parse(resp.body as any).results;
      this.savedClientInfo = resp;
      this.emailToAttorney.matterId = this.savedClientInfo.matterId;
      this.matterId = this.savedClientInfo.matterId;
      this.sendEmailToAttorneys();
      if (this.isTrustAccountEnabled) {
        this.addTrustbankAccount();
      }
      this.dataEntered = false;
      this.open(this.NewClientCreated, 'lg', '', 'static');
    } catch (err) {
      this.isLoading = false;
    }
  }

  private sendEmailToAttorneys() {
    let ra = this.emailToAttorney.ra;
    let ba = this.emailToAttorney.ba;
    let matterId = this.emailToAttorney.matterId;

    if (ra > 0) {
      this.matterService.v1MatterSendAssignReassignEmailToAttorneyPost$Json({
        body: {
          appURL: this.appConfig.APP_URL,
          attorneyId: ra,
          isResponsibleAttorney: true,
          matterId: matterId,
          oldAttorneyId: 0
        }
      }).subscribe(() => {});
    }

    if (ba > 0) {
      this.matterService.v1MatterSendAssignReassignEmailToAttorneyPost$Json({
        body: {
          appURL: this.appConfig.APP_URL,
          attorneyId: ba,
          isResponsibleAttorney: false,
          matterId: matterId,
          oldAttorneyId: 0
        }
      }).subscribe(() => {});
    }
  }

  /*** function to navigate after new client created */
  navigate(page: string) {
    switch (page) {
      case 'matter-dashboard':
        this.modalService.dismissAll();
        this.router.navigate(['/matter/dashboard'], {
          queryParams: {
            matterId: this.savedClientInfo.matterId,
          },
        });
        break;
      case 'profile':
        this.modalService.dismissAll();
        if (this.clientType == 'individual') {
          this.router.navigate(['/client-view/individual'], {
            queryParams: { clientId: this.savedClientInfo.clientId },
          });
        } else {
          this.router.navigate(['/client-view/corporate'], {
            queryParams: { clientId: this.savedClientInfo.clientId },
          });
        }
        break;
    }
  }

  /***** function to show unsaved changes popup */
  cancelConfirm() {
    if (this.formsFilledStatus) {
      this.open(this.UnsavedChanges, 'sm', '', 'static');
      return;
    }
    this.dataEntered = false;
    this.gotoList();
  }

  /*** function to goto list page */
  gotoList(): void {
    this.dataEntered = false;
    this.modalService.dismissAll();
    this.router.navigate(['/client-list/list']);
  }

  /*** function to check form contains any form field having value */
  private checkFormsFilledStatus(): any {
    this.formsFilledStatus = false;
    if (this.matterDetails) {
      Object.keys(this.matterDetails.value).forEach((field) => {
        if (this.matterDetails.value[field]) {
          this.formsFilledStatus = true;
          return;
        }
      });
    }
  }

  /***** open corporate contact roles popup */
  async openCorporateContactRoles() {
    this.dialogService
      .confirm(
        'There must be exactly one (1) Primary Contact and Billing Contact assigned to the client. Please ensure both of these roles are assigned to a Corporate Contact (they can be the same person). Multiple General Counsels are permitted.',
        'Okay',
        '',
        'Corporate Contact Role',
        false,
        'contact-corporate'
      )
      .then((res) => {
        if (res) {
        }
      });
  }

  /***** function to get all state list form basic info component */
  stateListArr(event: any): void {
    this.stateList = event;
  }

  getClientInfo(event) {
    this.clientDetails = event.data.formData.value;
    this.changeBasicInfo = true;

    this.primaryAddress = {
      address: this.clientDetails.primaryAddress,
      address2: this.clientDetails.primaryAddress2,
      addressTypeId: 1,
      addressTypeName: 'primary',
      city: this.clientDetails.primaryCity,
      state: this.clientDetails.primaryState,
      zip: this.clientDetails.primaryZipCode,
    };

    if (this.matterDetailsComponent && this.clientDetails.primaryLawOffice) {
      if (
        this.matterDetailsComponent.matterForm &&
        !this.matterDetailsComponent.matterForm.value.primaryLawOffice
      ) {
        this.matterDetailsComponent.matterForm.patchValue({
          primaryLawOffice: this.clientDetails.primaryLawOffice,
        });

        this.matterDetailsComponent.getPractices();
        this.sharedService.MatterLawOfficeChange$.next(
          this.clientDetails.primaryLawOffice
        );
      }
    }

    if (
      this.basicInfoComponent &&
      this.basicInfoComponent.isBasicInfoInvalid()
    ) {
      this.basicInfoInvalid = true;
    } else {
      this.basicInfoInvalid = false;
    }
  }

  onChangeBillingInfo() {
    if (
      this.billingInformationComponent &&
      this.billingInformationComponent.isNotValidBillingInformation()
    ) {
      this.billingInfoInvalid = true;
    } else {
      this.billingInfoInvalid = false;
    }
  }

  getClientType(event: any) {
    if (event && event.clientType) {
      this.clientType = event.clientType;
    }
  }

  public onChangeAssociation(event) {
    if (event) {
      this.changeAssociation = true;
    }
  }

  changesMade($event) {
    this.dataEntered = true;
  }

  private scrollToFirstInvalidControl() {
    setTimeout(() => {
      const firstInvalidControl: HTMLElement = this.el.nativeElement.querySelector(
        '.ng-invalid'
      );

      window.scrollTo({
        top: this.getTopOffset(firstInvalidControl),
        left: 0,
        behavior: 'smooth',
      });

      fromEvent(window, 'scroll')
        .pipe(debounceTime(100), take(1))
        .subscribe(() => firstInvalidControl.focus());
    }, 100);
  }

  private getTopOffset(controlEl: HTMLElement): number {
    const labelOffset = 50;
    if (controlEl) {
      return (
        controlEl.getBoundingClientRect().top +
        window.scrollY -
        (this.offsetValue.height + this.topbarHeight + labelOffset)
      );
    }
  }

  saveInvoice(invoiceHTML) {
    let body: vwBillToClientPrintAndEmail = {
      invoices: [
        {
          invoiceInfo: invoiceHTML,
          emailInfo: {
            billingContact: null,
            primaryContact: null,
            updatePrimaryContactEmail: false,
            updateBillingContactEmail: false,
            updateClientEmail: false,
            email: null,
          },
          print: false,
          sendEmail: false,
        },
      ],
      print: false,
      sendEmail: false,
    };

    this.billingService
      .v1BillingBillToClientEmailAndPrintPost$Json({
        body: body,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {});
  }
  public getSelectedOfficeDetails(event) {
    if (event && event.id) {
      this.officeId = event.id;
      this.trustBankAccountsComponent.getUsioTenantTrustBankAccounts();
    }
  }

  validateTrustBankAccount() {
    if (this.trustBankAccountsComponent) {
      if (!this.trustBankAccountsComponent.returnTrustBankAccountData()){
        this.trustAccountInvalid = true;
      } else {
        this.trustAccountInvalid = false;
      }
    }
  }

  addTrustbankAccount() {
    const usioBankId = this.trustBankAccountsComponent.returnTrustBankAccountData();
    this.usioService.v1UsioAddEditUsioMatterBankAccountsOfficePost$Response({
      matterId: this.matterId,
      usioBankAccountId: usioBankId
    }).subscribe(() => {}, () => {});
  }
}
