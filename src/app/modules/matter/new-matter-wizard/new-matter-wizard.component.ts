import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, ViewChild, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as clone from 'clone';
import * as moment from 'moment';
import { forkJoin, fromEvent, Observable, Subscription } from 'rxjs';
import { debounceTime, finalize, map, take } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { CommonService } from 'src/app/service/common.service';
import { InvoiceService } from 'src/app/service/invoice.service';
import { CorporateContactConflictCheckRequest, PCConflictCheckRequest, vwAddOnService, vwBillToClientPrintAndEmail, vwCalendarSettings, vwClient, vwCreditCard, vwECheck, vwRate } from 'src/common/swagger-providers/models';
import { BillingService, CalendarService, ClientService, ContactsService, MatterService, MiscService, TenantService, TrustAccountService, UsioService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { vwBillNowClientEmailInfo, vwDefaultInvoice } from '../../models/bill-to-client.model';
import { IAdrs, Idata } from '../../models/data.model';
import { ConflictCheckDialogComponent } from '../../shared/conflict-check-dialog/conflict-check-dialog.component';
import * as errorData from '../../shared/error.json';
import { SharedService } from '../../shared/sharedService';
import { UtilsHelper } from '../../shared/utils.helper';
import { AddNotesComponent } from './add-notes/add-notes.component';
import { BillingInformationComponent } from './billing-information/billing-information.component';
import { CreateCalendarEventNewComponent } from './create-calendar-event-new/create-calendar-event-new.component';
import { MatterDetailsComponent } from './matter-details/matter-details.component';
import { TrustAccountComponent } from './trust-account/trust-account.component';
import { TrustBankAccountsComponent } from './trust-bank-accounts/trust-bank-accounts.component';
import { UploadDocumentNewComponent } from './upload-document-new/upload-document-new.component';

interface MatterDetails {
  id: number;
  clientName: {
    id: number;
  };
}

@Component({
  selector: 'app-new-matter-wizard',
  templateUrl: './new-matter-wizard.component.html',
  styleUrls: ['./new-matter-wizard.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class NewMatterWizardComponent implements OnInit, AfterViewInit,OnDestroy {
  @ViewChild('matterDetailsInfo', { read: ElementRef, static: false }) matterDetailsInfo: ElementRef;
  @ViewChild('billingInformation', { read: ElementRef, static: false }) billingInformation: ElementRef;
  @ViewChild('trustAccounting', { read: ElementRef, static: false }) trustAccounting: ElementRef;
  @ViewChild('createCalendarEvents', { read: ElementRef, static: false }) createCalendarEvents: ElementRef;
  @ViewChild('uploadDocuments', { read: ElementRef, static: false }) uploadDocuments: ElementRef;
  @ViewChild('addNotes', { read: ElementRef, static: false }) addNotes: ElementRef;

  /* Component view child*/
  @ViewChild(MatterDetailsComponent, { static: false }) matterDetailsComponent: MatterDetailsComponent;
  @ViewChild(BillingInformationComponent, { static: false }) billingInformationComponent: BillingInformationComponent;
  @ViewChild(CreateCalendarEventNewComponent, { static: false }) createCalendarEventNewComponent: CreateCalendarEventNewComponent;
  @ViewChild(TrustAccountComponent, { static: false }) trustAccountComponent: TrustAccountComponent;
  @ViewChild(AddNotesComponent, { static: false }) addNotesComponent: AddNotesComponent;
  @ViewChild(UploadDocumentNewComponent, { static: false }) UploadDocumentNewComponent: UploadDocumentNewComponent;
  @ViewChild(TrustBankAccountsComponent, { static: false }) trustBankAccountsComponent: TrustBankAccountsComponent;


  private modalRef: NgbModalRef;
  public formSubmitted = false;
  public clientName = '-';
  public clientId: number;
  public loginUser: any;
  public activeTab = 'matterDetailsInfo';
  public steps = [];
  public subscribeRunConflict: Subscription;
  public offsetValue;
  public topbarHeight: number;
  public topbarHeightst = 0;
  public fixedHeight = 0;
  public fixedLeft = 0;
  public fixedRight = 0;
  public isOnFirstTab = true;
  public backbuttonPressed = false;
  public isTrustAccountEnabled = false;
  public isLoading = false;
  public fixedTop = false;
  public billingtInfoHeight: number;
  public trustAccountingHeight: number;
  public createCalendarEventsHeight: number;
  public uploadDocumentsHeight: number;
  public addNotesHeight: number;
  public officeId: number;
  public matterId: number;
  public matterBasic = false;
  public defaultLogoUrl: string;
  clientDetails: vwClient;
  public clientEmailInfo: vwBillNowClientEmailInfo;
  public conflictArr: Array<any> = [];
  public blockedPersonsArr: Array<any> = [];
  public runConflicts = false;
  public changeMatterAssociation = true;
  public errorData: any = (errorData as any).default;
  public selectedMatterTypeId: any;
  documentsMatterDetails: any;
  practiceAreaId: number;
  isPracticePopupOpen = false;
  matterDetails: any;
  matterOpenDate = '';
  navigateAwayPressed = false;
  dataEntered = false;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  BILLING_MANAGEMENTisAdmin:boolean = false;
  BILLING_MANAGEMENTisEdit:boolean = false;
  selectedTimezone: string;
  public calendarSettings: vwCalendarSettings;

  public invoiceTemplateDetails: vwDefaultInvoice;
  public tenantDetails: any;
  public saveMatterInfo: any;

  constructor(
    private pagetitle: Title,
    private route: ActivatedRoute,
    private router: Router,
    private trustAccountService: TrustAccountService,
    private contactsService: ContactsService,
    private invoiceService: InvoiceService,
    private appConfigService: AppConfigService,
    private clientService: ClientService,
    private modalService: NgbModal,
    private renderer: Renderer2,
    private el: ElementRef,
    public usioService: UsioService,
    private  matterService: MatterService,
    private store: Store<fromRoot.AppState>,
    private miscService: MiscService,
    private calendarService: CalendarService,
    private billingService: BillingService,
    private tenantService: TenantService,
    private sharedService: SharedService,
    private commonService: CommonService
  ) {
    this.loginUser = UtilsHelper.getLoginUser();
    this.getDefaultInvoiceTemplate();
    this.getTenantProfile();

    this.invoiceService
      .loadImage(this.appConfigService.appConfig.default_logo)
      .subscribe((blob) => {
        const a = new FileReader();
        a.onload = (e) => {
          this.defaultLogoUrl = (e.target as any).result;
        };
        a.readAsDataURL(blob);
      });
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
    this.route.queryParams.subscribe((params) => {
      this.clientId = +params.clientId;
      if (!this.clientId) {
        this.router.navigate(['/client-list/list']);
      }
      this.getClientInfo(this.clientId);
    });
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart) === true) {
        this.navigateAwayPressed = true;
      }
    });
   }


  ngOnInit() {
    this.pagetitle.setTitle('Create New Matter');
    this.getList();
    this.getCalSetting();
  }

  ngAfterViewInit() {
    const elements = document.querySelectorAll('.scrolling-steps');
    this.offsetValue = (elements && elements.length > 0) ? elements[0].getBoundingClientRect() : 0;
    const ele = document.querySelectorAll('.top-bar');
    this.topbarHeight = (ele && ele.length > 0) ? ele[0].getBoundingClientRect().height : 0;
  }

  ngOnDestroy(){
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
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

  private getCalSetting() {
    this.calendarService.v1CalendarSettingsPersonIdGet({personId: this.loginUser.id})
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

  scrollToElement(id, addToSteps = true) {
    if (addToSteps && this.activeTab != id) {
      this.steps.push(this.activeTab);
      this.steps = [...this.steps];
    }
    this.activeTab = id;
    const extra = (id === 'matterDetailsInfo') ? 10 : 0;
    const yOffset = -(this.offsetValue.height + this.topbarHeight + extra);
    const element = this[id].nativeElement;
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
    fromEvent(window, 'scroll')
      .pipe(
        debounceTime(50),
      )
      .subscribe(() => {this.activeTab = id;});
  }

  private getClientInfo(id) {
    this.clientService
      .v1ClientClientIdGet({
        clientId: +id,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.clientDetails = res;
        if (!this.clientDetails.isCompany) {
          this.sharedService.ClientEmailChange$.next(this.clientDetails.email);
        } else {
          this.sharedService.ClientEmailChange$.next(this.clientDetails.id);
        }
        this.getClientEmailInfo();
      });
  }

  private getClientEmailInfo() {
    this.clientService
      .v1ClientClientEmailInfoClientIdGet({
        clientId: this.clientId,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        this.clientEmailInfo = res;
      });
  }

  public getMatterDetails(event, template) {
    if (!this.isPracticePopupOpen) {
      this.matterDetails = event.basicForm;
      this.officeId = this.matterDetails.value.initialConsultLawOffice;
      this.matterBasic = (this.matterDetails.valid) ? true : false;
      if (this.practiceAreaId && this.practiceAreaId != this.matterDetails.value.practiceId && this.UploadDocumentNewComponent.fileArray.length) {
        this.isPracticePopupOpen = true;
        this.openPersonalinfo(template, '', 'modal-smd');
      } else {
        this.practiceAreaId = this.matterDetails.value.practiceId;
        const data = {
          matterName: this.matterDetails.value.matterName ? this.matterDetails.value.matterName : 'Matter folder',
          matterNumber: this.matterDetails.value.matterNumber,
          practiceId: this.matterDetails.value.practiceId
        };
        this.documentsMatterDetails = data;
      }
      this.matterOpenDate = event.basicForm.value.matterOpenDate;
      this.getDetails();
    }
  }

  openPersonalinfo(content: any, className, winClass, reset?: boolean) {
    this.modalService.open(content, {
      size: className,
      windowClass: winClass,
      centered: true,
      backdrop: 'static',
    });
  }

  public getDataAssociation(event) {
    if (event) {
      this.changeMatterAssociation = true;
    }
  }

  private scrollToFirstInvalidControl() {
    const firstInvalidControl: HTMLElement = this.el.nativeElement.querySelector(
      '.ng-invalid'
    );

    window.scroll({
      top: this.getTopOffset(firstInvalidControl),
      left: 0,
      behavior: 'smooth'
    });

    fromEvent(window, 'scroll')
      .pipe(
        debounceTime(100),
        take(1)
      )
      .subscribe(() => firstInvalidControl.focus());
  }

  private getTopOffset(controlEl: HTMLElement): number {
    const labelOffset = 50;
    if (controlEl) {
      return controlEl.getBoundingClientRect().top + window.scrollY - (this.offsetValue.height + this.topbarHeight + labelOffset);
    } else {
      return window.scrollY - (this.offsetValue.height + this.topbarHeight + labelOffset);
    }
  }

  save(template) {
    this.formSubmitted = true;
    if (this.matterDetailsComponent && this.matterDetailsComponent.isNotMatterDetailsValidate()) {
      this.scrollToFirstInvalidControl();
      return;
    }
    if (this.billingInformationComponent && this.billingInformationComponent.isNotValidBillingInformation()) {
      this.scrollToFirstInvalidControl();
      return;
    }

    // if (
    //   this.UploadDocumentNewComponent &&
    //   this.UploadDocumentNewComponent.getSecurityScanFailedStatus()
    // ) {
    //   this.scrollToFirstInvalidControl();
    //   return;
    // }

    if(this.trustBankAccountsComponent){
      if(!this.trustBankAccountsComponent.returnTrustBankAccountData()){
        this.scrollToFirstInvalidControl();
        return;
      }
     }

    if (this.changeMatterAssociation) {
      this.changeMatterAssociation = false;
      this.runConflictsCheck(template);
    } else {
      this.saveMatter(template);
    }
  }

  saveMatter(template) {
    let matterAssociations: Array<any> = [];
    const blockEmployees: Array<any> = [];
    let materBasics: any = {};
    const settings: Idata = {};
    const billingDetails: {
      settings?: Idata,
      addOns?: Array<vwAddOnService>,
      echecks?: Array<vwECheck>,
      creditCards?: Array<vwCreditCard>,
      rates?: Array<vwRate>,
      invoiceAddress?: IAdrs,
    } = {};

    let RA = 0;
    let BA = 0;

    /**
     * matter basic details
     */
    if (this.matterDetailsComponent) {
      materBasics = { ...this.matterDetailsComponent.matterForm.getRawValue() };
      materBasics.matterOpenDate = moment(materBasics.matterOpenDate).format('YYYY-MM-DD');
      if (materBasics.trustExecutionDate) {
        materBasics.trustExecutionDate = moment(materBasics.trustExecutionDate).format('YYYY-MM-DD');
      }
      materBasics.clientId = +this.clientId;
      if (this.matterDetailsComponent.employeesRows && this.matterDetailsComponent.employeesRows.length > 0) {
        this.matterDetailsComponent.employeesRows.map((item) => {
          blockEmployees.push({ personId: item.id });
        });
      }
      materBasics.blockEmployees = blockEmployees;
      const attorneyList = this.matterDetailsComponent.attorneyForm.value;
      matterAssociations = clone(this.matterDetailsComponent.matterAssociationList);
      if (attorneyList.attorneys && attorneyList.attorneys.length > 0) {
        attorneyList.attorneys.map((obj) => {
          if (!obj.IsOriginatingAttorney && !obj.IsResponsibleAttorney && !obj.IsBillingAttorney) {
            matterAssociations.push({
              associationId: this.matterDetailsComponent.associateAttorny.id,
              id: obj.id
            });
          } else {
            if (obj.IsOriginatingAttorney) {
              matterAssociations.push({
                associationId: this.matterDetailsComponent.associateOriginatingAttorney.id,
                id: obj.id
              });
            }
            if (obj.IsResponsibleAttorney) {
              matterAssociations.push({
                associationId: this.matterDetailsComponent.associateResponsibleAttorney.id,
                id: obj.id
              });

              RA = obj.id;
            }
            if (obj.IsBillingAttorney) {
              matterAssociations.push({
                associationId: this.matterDetailsComponent.associateBillingAttorney.id,
                id: obj.id
              });

              BA = obj.id;
            }
          }
        });
      }
      materBasics.matterAssociations = matterAssociations;
      if (this.matterDetailsComponent.corporateContactList) {
        const corporateList = clone(this.matterDetailsComponent.corporateContactList);
        corporateList.map((obj) => {
          obj.status = (obj.status === 'Active') ? true : false;
          obj.primaryPhoneNumber = obj.primaryPhone;
          obj.cellPhoneNumber = obj.cellPhone;
        });
        const deletedCorporate = clone(this.matterDetailsComponent.deletedCorporateContactList);
        materBasics.corporateContacts = deletedCorporate.concat(corporateList);
      }
    }

    if (this.billingInformationComponent) {
      materBasics.isFixedFee = this.billingInformationComponent.isFixedFee;
      materBasics.contingentCase = this.billingInformationComponent.contingentCase;
      billingDetails.creditCards = this.billingInformationComponent.paymentList.ccDeleted.concat(this.billingInformationComponent.paymentList.creditCardList);
      billingDetails.echecks = this.billingInformationComponent.paymentList.echeckDeleted.concat(this.billingInformationComponent.paymentList.echeckList);
      if (this.billingInformationComponent.isFixedFee) {
        settings.fixedFeeIsFullAmount = this.billingInformationComponent.paymentMode == 1;
        settings.fixedFeeAmountToPay = this.billingInformationComponent.paymentMode == 1 ? this.billingInformationComponent.rateAmount : 0;
        settings.fixedFeeRemainingAmount = this.billingInformationComponent.paymentMode == 1 ? 0 : this.billingInformationComponent.rateAmount;
        settings.fixedFeeDueDate = this.billingInformationComponent.paymentMode == 2 ? this.billingInformationComponent.deferDate : null;
        settings.fixedFeeBillOnWorkComplete = this.billingInformationComponent.paymentMode == 3 ? true : false;
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
          settings.billFrequencyQuantity = +this.billingInformationComponent.billingSettings.billFrequencyQuantity;
          settings.billFrequencyDuration = this.billingInformationComponent.billingSettings.billFrequencyDuration;
          (settings as any).billFrequencyRecursOn = this.billingInformationComponent.billingSettings.billFrequencyRecursOn;
          (settings as any).billFrequencyDay = this.billingInformationComponent.billingSettings.billFrequencyDay;
          (settings as any).effectiveDate = moment(this.billingInformationComponent.displayStartDate).format('YYYY-MM-DD');
          settings.billFrequencyStartingDate = moment(this.billingInformationComponent.displayStartDate).format('YYYY-MM-DD');
          (settings as any).billFrequencyNextDate = moment(this.billingInformationComponent.displayEndDate).format('YYYY-MM-DD');
          (settings as any).repeatType = +this.billingInformationComponent.billingSettings.repeatType;
        } else {
          if (this.billingInformationComponent.getSettingsDetails.billFrequencyQuantity) {
            settings.billFrequencyQuantity = this.billingInformationComponent.getSettingsDetails.billFrequencyQuantity;
          }
          if (this.billingInformationComponent.getSettingsDetails.billFrequencyDuration) {
            settings.billFrequencyDuration = this.billingInformationComponent.getSettingsDetails.billFrequencyDuration;
          }
          if (this.billingInformationComponent.getSettingsDetails.billFrequencyRecursOn) {
            (settings as any).billFrequencyRecursOn = this.billingInformationComponent.getSettingsDetails.billFrequencyRecursOn;
          }
          (settings as any).billFrequencyDay = this.billingInformationComponent.getSettingsDetails.billFrequencyDay;
          if (this.billingInformationComponent.getSettingsDetails.effectiveDate) {
            (settings as any).effectiveDate = this.billingInformationComponent.getSettingsDetails.effectiveDate;
          }
          if (this.billingInformationComponent.getSettingsDetails.billFrequencyStartingDate) {
            settings.billFrequencyStartingDate = this.billingInformationComponent.getSettingsDetails.billFrequencyStartingDate;
          }
          if (this.billingInformationComponent.getSettingsDetails.billFrequencyNextDate) {
            (settings as any).billFrequencyNextDate = this.billingInformationComponent.getSettingsDetails.billFrequencyNextDate;
          }
          (settings as any).repeatType = +this.billingInformationComponent.getSettingsDetails.repeatType;
        }
        settings.isInherited = this.billingInformationComponent.isInherited;
        settings['isWorkComplete'] = this.billingInformationComponent.isWorkComplete;
      }
      settings.fixedAmount = this.billingInformationComponent.fixedAmount;
      if (this.billingInformationComponent.invoiceDelivery) {
        const inc = this.billingInformationComponent.invoicedeliveryList.find((obj) => obj.id === this.billingInformationComponent.invoiceDelivery);
        settings.invoiceDelivery = inc;
      }

      const primaryAdrs = this.billingInformationComponent.persionAddress.find(obj => obj.addressTypeName && obj.addressTypeName.toLowerCase() === 'primary');
      if (this.billingInformationComponent.invoiceAddress) {
        if (primaryAdrs) {
          billingDetails.invoiceAddress = {
            id: 0,
            personId: +this.clientId,
            addressTypeId: 4,
            addressTypeName: 'invoice',
            address1: primaryAdrs.address1,
            address2: primaryAdrs.address2,
            city: primaryAdrs.city,
            state: primaryAdrs.state,
            zipCode: primaryAdrs.zipCode
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
    }

    const body = {
      matterNotes: [],
      matterTrustAccount: null,
      matterTrustOnlyAccounts: [],
      matterPropertyHeldInTrusts: [],
      materBasics,
      billingDetails,
      matterEvents: [],
      trustBankAccount:{},
      vwDisbursementRate:[]
    };

    /* Calendar event */
    if (this.createCalendarEventNewComponent) {
      if (this.createCalendarEventNewComponent.eventList && this.createCalendarEventNewComponent.eventList.length > 0) {
        let eventArr = clone(this.createCalendarEventNewComponent.eventList);
        eventArr.map((obj) => {
          obj.startDateTime = moment(obj.startDateTime + this.selectedTimezone).utc().format('YYYY-MM-DD[T]HH:mm:ss');
          obj.endDateTime = moment(obj.endDateTime + this.selectedTimezone).utc().format('YYYY-MM-DD[T]HH:mm:ss');
        });
        body.matterEvents = eventArr;
      }
    }

    /* Trust accouting */
    if (this.trustAccountComponent) {
      body.matterTrustAccount = this.trustAccountComponent.trustAccountData().matterTrustAccount;
      body.matterTrustOnlyAccounts = this.trustAccountComponent.trustAccountData().matterTrustOnlyAccounts;
      body.matterPropertyHeldInTrusts = this.trustAccountComponent.trustAccountData().matterPropertyHeldInTrusts;
    }

    /* Notes */
    if (this.addNotesComponent) {
      body.matterNotes = this.addNotesComponent.matterNotesData();
    }

    // if (this.UploadDocumentNewComponent) {
    //   body.uploadDocuments = this.UploadDocumentNewComponent.getSecurityScanFailedStatus() ? [] : this.UploadDocumentNewComponent.sendFileForUpload();
    // }
    if (this.billingInformationComponent) {
      body.vwDisbursementRate = this.billingInformationComponent.selDisbursementTypes;
    }
    if(body.billingDetails && body.billingDetails.settings.invoiceDelivery && body.billingDetails.settings.invoiceDelivery.code == 'ELECTRONIC' ){
      body.billingDetails.invoiceAddress = null;
    }

    this.isLoading = true;
    this.hideScroll();
    this.contactsService.v1ContactsFullMatterRedesignPost$Json({ body })
      .pipe(map(UtilsHelper.mapData), finalize(() => {
        this.isLoading = false;
        this.hideScroll();
      })).subscribe(res => {
        this.dataEntered = false;
        let personId = res.materBasics && res.materBasics.clientId ? res.materBasics.clientId : null;
        let data: any = {
          matterDetailsId: res.materBasics.matterId,
          clientId: personId,
          matterPracticeId: res.materBasics.practiceId
        };
        let uploadDocuments = this.UploadDocumentNewComponent.fileArray;
        let shouldOpenMatterDocWidget = (uploadDocuments.length) ? true : false;
        this.contactsService.v1ContactsCreateDefaultDmsFolderForNewClientPost$Json({body: data}).subscribe(res=>{
          if(shouldOpenMatterDocWidget){
            let files = this.UploadDocumentNewComponent.fileArray;
            files = files.filter(x => !x.isHidden);
              files.forEach(x => {
                  x.isClientDoc = true;
                  x.nameOfFile = `${x.DocumentName}.${this.sharedService.getFileExtension(x.originalFileName)}`,
                  x.matterDetailsId = data.matterDetailsId;
                  x.personId = personId;
                  x.matterDetails = this.UploadDocumentNewComponent.matterDetails;
                }
              );
            this.commonService.docs.next(files);
          }
        });
        this.saveMatterInfo = res;
        this.matterId = res.materBasics.matterId;
        if (this.isTrustAccountEnabled) {
          this.addTrustbankAccount();
        }
        this.sendEmailToAttorneys(RA, BA, this.matterId);
        this.modalService.open(template, {
          centered: true,
          backdrop: 'static',
          keyboard: false,
          windowClass: 'modal-lmd'
        });
      }, err => {
        this.isLoading = false;
        this.hideScroll();
      });
  }

  private sendEmailToAttorneys(ra: number, ba: number, matterId: number) {
    if (ra > 0) {
      this.matterService.v1MatterSendAssignReassignEmailToAttorneyPost$Json({
        body: {
          appURL: this.appConfigService.APP_URL,
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
          appURL: this.appConfigService.APP_URL,
          attorneyId: ba,
          isResponsibleAttorney: false,
          matterId: matterId,
          oldAttorneyId: 0
        }
      }).subscribe(() => {});
    }
  }

  addTrustbankAccount(){
    let usioBankId = this.trustBankAccountsComponent.returnTrustBankAccountData();
    this.usioService. v1UsioAddEditUsioMatterBankAccountsOfficePost$Response({matterId:this.matterId,usioBankAccountId:usioBankId}).subscribe((res: any) => {
    }, err => {
    });
  }

  private getList() {
    this.isLoading = true;
    this.hideScroll();
    forkJoin(
      this.trustAccountService.v1TrustAccountGetTrustAccountStatusGet()
    ).pipe(
      map(res => {
        return {
          accounting: JSON.parse(res[0] as any).results as boolean,
        };
      }),
      finalize(() => {
        this.isLoading = false;
        this.hideScroll();
      })
    ).subscribe(suc => {
      const accounting = suc.accounting;
      if (accounting) {
        this.isTrustAccountEnabled = true;
      } else {
        this.isTrustAccountEnabled = false;
      }
    }, err => {
      this.isLoading = false;
      this.hideScroll();
    });
  }

  getDetails() {
    setTimeout(() => {
      const extra = 0;
      const yOffset = -(this.offsetValue.height + this.topbarHeight + extra);
      if (this.billingInformation) {
        this.billingtInfoHeight = this.billingInformation.nativeElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      }
      if (this.trustAccounting) {
        this.trustAccountingHeight = this.trustAccounting.nativeElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      }
      if (this.createCalendarEvents) {
        this.createCalendarEventsHeight = this.createCalendarEvents.nativeElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      }
      if (this.uploadDocuments) {
        this.uploadDocumentsHeight = this.uploadDocuments.nativeElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      }
      if (this.addNotes) {
        this.addNotesHeight = this.addNotes.nativeElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      }
    }, 300);
  }

  get isFormNotValid(): boolean {
    if (this.matterDetailsComponent && this.matterDetailsComponent.isNotMatterDetailsValidate()) {
      return true;
    }
    if (this.billingInformationComponent && this.billingInformationComponent.isNotValidBillingInformation()) {
      return true;
    }
    if (this.trustBankAccountsComponent && !this.trustBankAccountsComponent.returnTrustBankAccountData()) {
      return true;
    }
    return false;
  }

  get isNotMatterDetailsValidate() {
    return this.matterDetailsComponent.isNotMatterDetailsValidate();
  }

  get isNotValidBillingInformation(){
    return this.billingInformationComponent.isNotValidBillingInformation()
  }

  get returnTrustBankAccountData(){
    return this.trustBankAccountsComponent.returnTrustBankAccountData();
  }

  runConflictsCheck(template): void {
    this.formSubmitted = true;
    if (this.matterDetailsComponent && this.matterDetailsComponent.isNotMatterDetailsValidate()) {
      return;
    }
    if (this.billingInformationComponent && this.billingInformationComponent.isNotValidBillingInformation()) {
      return;
    }

    if (
      this.UploadDocumentNewComponent &&
      this.UploadDocumentNewComponent.getSecurityScanFailedStatus()
    ) {
      return;
    }
    this.isLoading = true;
    this.hideScroll();

    let associations = [];
    if (this.matterDetailsComponent && this.matterDetailsComponent.matterAssociationList.length > 0) {
      associations = clone(this.matterDetailsComponent.matterAssociationList);
    }
    this.matterDetailsComponent.removeBlankAttorney();
    let corporatecontacts = [];
    if (this.matterDetailsComponent && this.clientDetails.isCompany && this.matterDetailsComponent.corporateContactList.length > 0) {
      corporatecontacts = clone(this.matterDetailsComponent.corporateContactList);
      corporatecontacts.forEach((obj: any) => {
        obj.companyName = obj.hasOwnProperty('companyName') ? obj.companyName : null;
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

    associations.forEach(a => {
      if (a.primaryPhone) {
        a.primaryPhone = a.primaryPhone.name;
      }
      delete a.email;
    });

    const request: PCConflictCheckRequest = {
      clientId: +this.clientId,
      matterId: (this.matterId) ? +this.matterId : 0,
      associations,
      clientCompanyName: this.clientDetails.companyName,
      clientFirstName: this.clientDetails.firstName,
      clientLastName: this.clientDetails.lastName,
      isCompany: this.clientDetails.isCompany
    };

    const requestCorporate: CorporateContactConflictCheckRequest = {
      clientId: +this.clientId,
      matterId: (this.matterId) ? +this.matterId : 0,
      corporatecontacts,
      clientCompanyName: this.clientDetails.companyName,
      clientFirstName: this.clientDetails.firstName,
      clientLastName: this.clientDetails.lastName,
      isCompany: this.clientDetails.isCompany
    };

    const listObject = [this.contactsService.v1ContactsConflictPost$Json({ body: request })];

    if (this.clientDetails.isCompany) {
      listObject.push(this.contactsService.v1ContactsCorporateContactConflictCheckPost$Json({ body: requestCorporate }));
    }

    forkJoin(listObject).pipe(
      map(res => {
        if (this.clientDetails.isCompany) {
          return {
            acConflict: JSON.parse(res[0] as any).results,
            coConflict: JSON.parse(res[1] as any).results
          };
        } else {
          return {
            acConflict: JSON.parse(res[0] as any).results,
          };
        }
      }),
      finalize(() => {
        this.isLoading = false;
        this.hideScroll();
      })
    ).subscribe(suc => {
      if (this.clientDetails.isCompany) {
        this.conflictArr = [...suc.acConflict.conflictPersons, ...suc.coConflict.conflictPersons];
        this.blockedPersonsArr = [...suc.acConflict.blockedPersons, ...suc.coConflict.blockedPersons];
      } else {
        this.conflictArr = suc.acConflict.conflictPersons;
        this.blockedPersonsArr = suc.acConflict.blockedPersons;
      }
      this.openConflictCheckDialog(template);
    });
  }

  private openConflictCheckDialog(template) {
    const modal = this.modalService.open(ConflictCheckDialogComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-xlg'
    });

    const component = modal.componentInstance;
    component.conflicts = this.conflictArr;
    component.hasConflicts = this.conflictArr.length > 0;
    component.blockedUsers = this.blockedPersonsArr;
    component.pageType = 'createnewmatter';

    component.header = this.errorData.normal_conflict;
    component.message = this.errorData.changes_potential_conflict;
    component.returnButtonText = 'Return to Workflow';

    modal.result.then(res => {
      if (res === 'save') {
        this.saveMatter(template);
      }
      if (res === 'discard') {
      }
    });
  }

  public hideScroll() {
    if (this.isLoading) {
      this.renderer.addClass(document.body, 'cmodal-open');
    } else {
      this.renderer.removeClass(document.body, 'cmodal-open');
    }
  }

  updatePracticeArea(type) {
    if (type === 'keep') {
      let data = {
        id: this.practiceAreaId
      }
      this.matterDetailsComponent.getMatterType(data);
      this.matterDetailsComponent.matterForm.patchValue({
        practiceId: this.practiceAreaId,
        matterTypeId: this.selectedMatterTypeId
      });
      this.selectedMatterTypeId = null;
    } else {
      this.practiceAreaId = this.matterDetails.value.practiceId;
      this.matterDetailsComponent.matterForm.patchValue({
        practiceId: this.practiceAreaId
      });
      const data = {
        matterName: this.matterDetails.value.matterName ? this.matterDetails.value.matterName : 'Matter folder',
        matterNumber: this.matterDetails.value.matterNumber,
        practiceId: this.matterDetails.value.practiceId
      };
      this.documentsMatterDetails = data;
      this.UploadDocumentNewComponent.fileArray = [];
    }
    this.isPracticePopupOpen = false;
  }

  // for window scroll events
  @HostListener('window:scroll') onScroll(): void {
    if (this.offsetValue.top <= (window.pageYOffset + this.topbarHeight)) {
      this.fixedTop = true;
      this.topbarHeightst = this.topbarHeight;
      this.fixedHeight = this.offsetValue.height;
      this.fixedLeft = this.offsetValue.left;
      let scrollwidth = UtilsHelper.getScrollbarWidth();
      this.fixedRight = window.innerWidth - (this.offsetValue.left + this.offsetValue.width) - scrollwidth;
    } else {
      this.topbarHeightst = 0;
      this.fixedHeight = 0;
      this.fixedLeft = 0;
      this.fixedRight = 0;
      this.fixedTop = false;
    }
    const windowOffset = window.pageYOffset + 10;

    if (windowOffset >= this.addNotesHeight) {
      this.activeTab = 'addNotes';
    } else if (windowOffset >= this.createCalendarEventsHeight) {
      this.activeTab = 'createCalendarEvents';
    } else if (windowOffset >= this.uploadDocumentsHeight) {
      this.activeTab = 'uploadDocuments';
    } else if (windowOffset >= this.trustAccountingHeight) {
      this.activeTab = 'trustAccounting';
    } else if (windowOffset >= this.billingtInfoHeight) {
      this.activeTab = 'billingInformation';
    } else {
      this.activeTab = 'matterDetailsInfo';
    }
  }

  @HostListener('window:popstate', ['$event']) onPopState(event) {
    if (this.steps.length > 0) {
      const step = this.steps.pop();
      this.scrollToElement(step, false);
      this.isOnFirstTab = false;
      this.backbuttonPressed = true;
    } else {
      this.isOnFirstTab = true;
      this.backbuttonPressed = true;
    }
  }

  public changesMade(event) {
    this.dataEntered = true;
  }

  rerouteAfterSaving() {
    this.dataEntered = false;
  }

  getMatterTypeId(event){
    this.selectedMatterTypeId = event;
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
}
