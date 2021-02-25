import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NavigationExtras, NavigationStart, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import * as clone from 'clone';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ClientService, ContactsService, MiscService, OfficeService } from 'src/common/swagger-providers/services';
import { vwConflictPerson } from '../../models';
import { ConflictCheckDialogComponent } from '../../shared/conflict-check-dialog/conflict-check-dialog.component';
import { DialogService } from '../../shared/dialog.service';
import { SharedService } from '../../shared/sharedService';
import { UtilsHelper } from '../../shared/utils.helper';
import { BasicMatterInfoComponent } from './basic-matter-info/basic-matter-info.component';

@Component({
  selector: 'app-new-potential-client-intake',
  templateUrl: './new-potential-client-intake.component.html',
  styleUrls: ['./new-potential-client-intake.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class NewPotentialClientIntakeComponent
  implements OnInit, AfterViewInit, IBackButtonGuard, OnDestroy {
  uniqueNumber: any;
  blockedEmployeesPresent: boolean;
  blockedPersons: any;
  // for window scroll events
  @HostListener('window:scroll') onScroll(): void {
    if (this.offsetValue && this.offsetValue.top <= (window.pageYOffset + this.topbarHeight)) {
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
      this.activeTab = 'notes';
    } else if (windowOffset >= this.schedulingHeight) {
      this.activeTab = 'scheduling';
    } else if (windowOffset >= this.clientAssocHeight) {
      this.activeTab = 'clientAssociations';
    } else if (windowOffset >= this.contactInfoHeight) {
      this.activeTab = 'contactInfo';
    } else {
      this.activeTab = 'basicMatterInfo';
    }
  }

  @ViewChild('basicMatterInfo', { read: ElementRef, static: false }) basicMatterInfo: ElementRef;
  @ViewChild('contactInfo', { read: ElementRef, static: false }) contactInfo: ElementRef;
  @ViewChild('clientAssociations', { read: ElementRef, static: false }) clientAssociations: ElementRef;
  @ViewChild('scheduling', { read: ElementRef, static: false }) scheduling: ElementRef;
  @ViewChild('notes', { read: ElementRef, static: false }) notes: ElementRef;
  @ViewChild('NewPotentialClientCreated', { static: false }) NewPotentialClientCreated: any;
  @ViewChild('UnsavedChanges', { static: false }) UnsavedChanges: any;
  @ViewChild(BasicMatterInfoComponent, { static: false }) basicMatterForm: BasicMatterInfoComponent;

  modalOptions: NgbModalOptions;
  closeResult: string;

  public subscribeRunConflict: Subscription;
  public offsetValue;
  public topbarHeight: number;
  public topbarHeightst: number = 0;
  public fixedHeight: number = 0;
  public fixedLeft: number = 0;
  public fixedRight: number = 0;
  public activeTab: string = 'basicMatterInfo';

  public matterDetails: FormGroup;
  public contactDetails: any;
  public schedulingDetails: FormGroup;
  private timeZoneList = [];
  private tenantTimeZone: any;

  public fixedTop: boolean = false;
  public isMatterFormInvalid: boolean;
  public iscontactInfoFormInvalid: boolean;
  public contactTypeSelected: boolean = false;
  public isLoading: boolean = false;
  private contactInfoHeight: any;
  private clientAssocHeight: any;
  private schedulingHeight: any;
  private notesHeight: any;
  private notesData: any;
  private userInfo: any;
  private savedClientInfo: any;
  private clientAssociationData: any;
  private oriClientAssociationData: any;
  public conflictArr: Array<vwConflictPerson> = [];
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
  public blockedList: Array<any> = [];

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private contactsService: ContactsService,
    private appConfig: AppConfigService,
    private dialogService: DialogService,
    private officeService: OfficeService,
    private clientService: ClientService,
    private sharedService: SharedService,
    private pagetitle: Title,
    private miscService: MiscService
  ) {
    router.events.subscribe(val => {
      if (val instanceof NavigationStart) {
        this.navigateAwayPressed = true;
      }
    });
  }

  ngOnInit() {
    this.pagetitle.setTitle('Add New Potential Client');
    this.userInfo = UtilsHelper.getLoginUser();
    this.getUniqueNumber();
    this.loadTimeZones();
    this.getSystemTimeZone();
    if (this.userInfo && this.userInfo.tenantTier) {
      if (
        !UtilsHelper.validTenantTier().includes(
          this.userInfo.tenantTier.tierName
        )
      ) {
        this.router.navigate(['/potential-client/new-potential-client-intake']);
        return;
      }
    }
    this.tuckerAllenAccountSubscription = this.sharedService.isTuckerAllenAccount$.subscribe(
      res => {
        this.isTuckerallenAccount = res;
      }
    );
  }

  getUniqueNumber() {
    this.clientService
      .v1ClientGetClientUniqueNumberGet({ tenantId: this.userInfo.tenantId })
      .subscribe((data: any) => {
        this.uniqueNumber = JSON.parse(data).results.uniqueNumber + 1;
      });
  }

  ngAfterViewInit() {
    const elements = document.querySelectorAll('.scrolling-steps');
    this.offsetValue =
      elements && elements.length > 0 ? elements[0].getBoundingClientRect() : 0;
    const ele = document.querySelectorAll('.top-bar');
    this.topbarHeight =
      ele && ele.length > 0 ? ele[0].getBoundingClientRect().height : 0;
    this.basicMatterForm.emitFormDataMatter();
  }

  ngOnDestroy() {
    if (this.tuckerAllenAccountSubscription) {
      this.tuckerAllenAccountSubscription.unsubscribe();
    }
  }

  scrollToElement(id, addToSteps = true) {
    if (addToSteps && this.activeTab != id) {
      this.steps.push(this.activeTab);
      this.steps = [...this.steps];
    }

    this.activeTab = id;
    let extra = id === 'basicMatterInfo' ? 10 : 0;
    const yOffset = -(this.offsetValue.height + this.topbarHeight + extra);
    const element = this[id].nativeElement;
    const y =
      element.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  getMatterDetails(event: any) {
    this.matterDetails = event.formData;
    this.checkFormsFilledStatus();
    if (this.matterDetails.value && this.matterDetails.value.contactType) {
      this.contactTypeSelected = true;
      setTimeout(() => {
        const extra = 0;
        const yOffset = -(this.offsetValue.height + this.topbarHeight + extra);
        if (this.contactInfo) {
          this.contactInfoHeight =
            this.contactInfo.nativeElement.getBoundingClientRect().top +
            window.pageYOffset +
            yOffset;
        }
        if (this.clientAssociations) {
          this.clientAssocHeight =
            this.clientAssociations.nativeElement.getBoundingClientRect().top +
            window.pageYOffset +
            yOffset;
        }
        if (this.scheduling) {
          this.schedulingHeight =
            this.scheduling.nativeElement.getBoundingClientRect().top +
            window.pageYOffset +
            yOffset;
        }
        if (this.notes) {
          this.notesHeight =
            this.notes.nativeElement.getBoundingClientRect().top +
            window.pageYOffset +
            yOffset;
        }
      }, 300);
      this.dataEntered = true;
    }
  }

  getContactDetails(event: any) {
    this.contactDetails = event.data;
  }

  public getNotes(data) {
    this.notesData = data;
  }
  public getAssociates(data) {
    this.clientAssociationData = clone(data);
    this.oriClientAssociationData = clone(data);
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
    const associations = [
      ...this.clientAssociationData.opposingPartyList,
      ...this.clientAssociationData.opposingCounselList,
      ...this.clientAssociationData.expertWitnessList,
      ...this.clientAssociationData.vendorList,
      ...this.clientAssociationData.subsidiaryList
    ];

    associations.forEach(a => {
      if (a.primaryPhone) {
        a.primaryPhone = a.primaryPhone.name;
      }
      delete a.email;
    });

    const request: any = {
      associations,
      clientCompanyName:
        this.contactDetails &&
        this.contactDetails.formData &&
        this.contactDetails.formData.value &&
        this.contactDetails.formData.value.companyName
          ? this.contactDetails.formData.value.companyName
          : '',
      clientFirstName:
        this.contactDetails &&
        this.contactDetails.formData &&
        this.contactDetails.formData.value &&
        this.contactDetails.formData.value.firstName
          ? this.contactDetails.formData.value.firstName
          : '',
      clientLastName:
        this.contactDetails &&
        this.contactDetails.formData &&
        this.contactDetails.formData.value &&
        this.contactDetails.formData.value.lastName
          ? this.contactDetails.formData.value.lastName
          : '',
      isCompany: this.matterDetails
        ? this.matterDetails.value.contactType === 'corporate'
        : false
    };
    this.isLoading = true;
    if (this.subscribeRunConflict) {
      this.subscribeRunConflict.unsubscribe();
    }
    this.subscribeRunConflict = this.contactsService
      .v1ContactsConflictPost$Json({
        body: request
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        response => {
          if (response && response.conflictPersons) {
            this.conflictArr = response.conflictPersons;
            this.blockedPersons = response.blockedPersons;
          } else {
            this.conflictArr = [];
            this.blockedPersons = [];
          }
          this.isConflictChecked = true;
          this.openConflictCheckDialog();
          this.isLoading = false;
        },
        err => {
          this.isLoading = false;
        }
      );
  }

  private openConflictCheckDialog() {
    let modal = this.modalService.open(ConflictCheckDialogComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-xlg'
    });

    let component = modal.componentInstance;

    component.conflicts = this.conflictArr;
    component.hasConflicts = this.conflictArr.length > 0;
    component.pageType = 'createnewpotentialcontact';
    component.blockedUsers = this.blockedPersons;
    component.saveBtn =
      this.matterDetails &&
      this.contactDetails &&
      this.matterDetails.valid &&
      this.contactDetails.formData &&
      this.contactDetails.formData.valid
        ? false
        : true;

    modal.result.then(res => {
      if (res == 'save') {
        this.createNewPotentialClient();
      }

      if (res == 'discard') {
      }
    });
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
        backdrop: backdrop
      })
      .result.then(
        result => {
          this.closeResult = `Closed with: ${result}`;
        },
        reason => {
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

  /***** function to call when click on new potential client */
  async savePotentialClient(): Promise<any> {
    if (
      this.contactDetails &&
      this.contactDetails.formData &&
      this.contactDetails.formData.value &&
      this.contactDetails.formData.value.doNotContact &&
      this.contactDetails.formData.value.doNotContact === false
    ) {
      this.contactDetails.formData
        .get('DoNotContactReasonOther')
        .clearValidators();
      this.contactDetails.formData
        .get('DoNotContactReasonOther')
        .updateValueAndValidity();
    }

    this.formSubmitted = true;
    if (this.isFormValid) {
      this.runConflictsCheck();
      return;
    } else {
      this.scrollToElement('basicMatterInfo');
    }
  }

  /***** function to create new potential client */
  async createNewPotentialClient(): Promise<any> {
    localStorage.setItem('save', 'true');

    const basicDetails: any =
      this.contactDetails && this.contactDetails.formData
        ? this.contactDetails.formData.value
        : {};
    if (this.matterDetails.value.contactType === 'corporate') {
      const isPrimary: boolean = this.contactDetails.vendor.some(
        list => list.isPrimary
      );
      const isBilling: boolean = this.contactDetails.vendor.some(
        list => list.isBilling
      );
      if (
        !this.contactDetails.vendor ||
        !this.contactDetails.vendor.length ||
        !isPrimary ||
        !isBilling
      ) {
        return;
      }
      basicDetails.corporateContacts = this.contactDetails.vendor;
    }
    const data: any = {
      basicDetails,
      matterDetails: this.matterDetails.getRawValue(),
      notes: this.notesData,
      attorneyDetails: {
        initialConsultAttoney: this.matterDetails.value.initialConsultAttoney,
        originatingAttorney: this.matterDetails.value.originatingAttoney
      },
      scheduling: [],
      uniqueNumber: +basicDetails.uniqueNumber,
      personFormBuilder: {
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
        changeNotes: ''
      },
      blockEmployees: this.blockedList
    };

    if (
      (this.matterDetails &&
        this.matterDetails.value &&
        this.matterDetails.value.contactType &&
        this.matterDetails.value.contactType != 'individual') ||
      !this.isTuckerallenAccount
    ) {
      delete data.personFormBuilder;
    }

    if (data.basicDetails.initialConsultations === 'no') {
      data.basicDetails.nextActionDate = null;
      data.basicDetails.nextActionNote = '';
    }

    delete data.basicDetails.initialConsultations;
    if (this.oriClientAssociationData) {
      data['matterDetails']['matterAssociations'] = [
        ...this.oriClientAssociationData.addedAssociations,
        ...this.oriClientAssociationData.expertWitnessList,
        ...this.oriClientAssociationData.opposingCounselList,
        ...this.oriClientAssociationData.opposingPartyList
      ];
      data['matterDetails']['clientAssociations'] = [
        ...this.oriClientAssociationData.subsidiaryList,
        ...this.oriClientAssociationData.vendorList
      ];
    }
    data['basicDetails']['contactType'] = this.matterDetails.value.contactType;
    if (data.notes && data.notes.length) {
      data['notes'].forEach(element => {
        element.createdBy = {
          id: this.userInfo.id
        };
      });
    }

    if (this.blockedList && this.blockedList.length > 0) {
      data.blockEmployees = this.blockedList.map(a => {
        return {
          description: a.description,
          personId: a.personId
        };
      });
    }

    let loading = false;
    if (this.schedulingDetails) {
      let firstName: string =
        this.contactDetails &&
        this.contactDetails.formData &&
        this.contactDetails.formData.value &&
        this.contactDetails.formData.value.firstName
          ? this.contactDetails.formData.value.firstName
          : '';
      let lastName: string =
        this.contactDetails &&
        this.contactDetails.formData &&
        this.contactDetails.formData.value &&
        this.contactDetails.formData.value.lastName
          ? this.contactDetails.formData.value.lastName
          : '';
      if (this.matterDetails.value.contactType === 'corporate') {
        firstName =
          this.contactDetails &&
          this.contactDetails.formData &&
          this.contactDetails.formData.value &&
          this.contactDetails.formData.value.companyName
            ? this.contactDetails.formData.value.companyName
            : '';
        lastName = '';
      }
      this.schedulingDetails[
        'title'
      ] = `Initial Consultation for ${firstName} ${lastName}`;
      this.calendarRedirectionData = {
        id: null,
        name:
          this.matterDetails.value.contactType === 'corporate'
            ? firstName
            : `${lastName}, ${firstName}`,
        role: 'Potential Client'
      };
      loading = true;
      this.isLoading = true;
      try {
        let res: any = await this.officeService
          .v1OfficeIdGet$Response({
            id: +this.schedulingDetails['office']['id']
          })
          .toPromise();
        res = JSON.parse(res.body as any).results;
        let eventTitle: string = '';
        if (res) {
          eventTitle = `${res.name}, `;
          if (res.address) {
            if (res.address.street) {
              eventTitle += `${res.address.street}, `;
            }
            if (res.address.address2) {
              eventTitle += `${res.address.address2}, `;
            }
            if (res.address.city) {
              eventTitle += `${res.address.city}, `;
            }
            if (res.address.state) {
              let selectedState: any = this.stateList.filter(
                list => list.code === res.address.state
              );
              if (selectedState && selectedState[0]) {
                eventTitle += `${selectedState[0].name}, `;
              }
            }
            if (res.address.zipCode) {
              eventTitle += `${res.address.zipCode}`;
            }
          }
        }
        let selectedofficeTimeZone =
          res && res.timeZone
            ? res.timeZone
            : this.tenantTimeZone
            ? this.tenantTimeZone.id
            : null;
        let officeTimeZone, endDateTime, startDateTime;
        if (selectedofficeTimeZone) {
          let timeZone = this.timeZoneList.filter(
            obj => obj.id == selectedofficeTimeZone
          );
          if (timeZone && timeZone.length) {
            let tZ = timeZone[0];
            let officeTimeZoneDetails = tZ.name.substr(4, 6);
            let reg = new RegExp(/^[+:\d-]+$/);
            officeTimeZone = officeTimeZoneDetails.split(':');
            officeTimeZone =
              reg.test(officeTimeZoneDetails) && officeTimeZone.length > 1
                ? officeTimeZone.join('')
                : '+00:00';
          }
        }
        if (officeTimeZone) {
          startDateTime =
            this.schedulingDetails['startDateTime'] + officeTimeZone;
          endDateTime = this.schedulingDetails['endDateTime'] + officeTimeZone;
          this.schedulingDetails['startDateTime'] = moment(startDateTime)
            .utc()
            .format('YYYY-MM-DD[T]HH:mm:ss');
          this.schedulingDetails['endDateTime'] = moment(endDateTime)
            .utc()
            .format('YYYY-MM-DD[T]HH:mm:ss');
        }
        this.schedulingDetails['eventLocation'] = eventTitle;
        data['scheduling'].push(this.schedulingDetails);
        this.saveNewPotentialClient(data, loading);
      } catch (err) {
        this.isLoading = false;
        return;
      }
    }
    if (!loading) {
      this.saveNewPotentialClient(data);
    }
  }

  /***** function to save new potentail client */
  async saveNewPotentialClient(data, loading: boolean = false): Promise<any> {
    if (!loading) {
      this.isLoading = true;
    }
    try {
      let resp: any = await this.contactsService
        .v1ContactsFullPost$Json$Response({ body: data })
        .toPromise();
      this.isLoading = false;
      resp = JSON.parse(resp.body as any).results;
      this.savedClientInfo = resp;
      if (this.schedulingDetails) {
        this.calendarRedirectionData.id = resp.clientId;
      }
      this.sendEmailToAttorney(
        this.matterDetails.value.initialConsultAttoney,
        resp.clientId
      );
      this.dataEntered = false;
      this.open(this.NewPotentialClientCreated, 'lg', '', 'static');
    } catch (err) {
      this.isLoading = false;
    }
  }

  private sendEmailToAttorney(selectedAttorney: number, clientId: number) {
    this.contactsService
      .v1ContactsSendAssignReassignEmailToAttorneyPost$Json({
        body: {
          appURL: this.appConfig.APP_URL,
          attorneyId: selectedAttorney,
          oldAttorneyId: 0,
          potentialClientId: clientId
        }
      })
      .subscribe(res => {});
  }

  /*** function to navigate after new potential client created */
  navigate(page: string) {
    switch (page) {
      case 'event':
        this.modalService.dismissAll();
        const navigationExtras: NavigationExtras = {
          state: {
            potentialClient: this.calendarRedirectionData
          }
        };
        this.router.navigate(['/calendar/list'], navigationExtras);
        break;
      case 'create':
        this.modalService.dismissAll();
        this.router.navigate(['/calendar/create-event']);
        break;
      case 'profile':
        this.modalService.dismissAll();
        this.router.navigate(['/contact/view-potential-client'], {
          queryParams: {
            clientId: this.savedClientInfo.clientId,
            state: 'edit'
          }
        });
        break;
    }
  }

  /***** function to show unsaved changes popup */
  cancelConfirm() {
    if (this.formsFilledStatus || this.blockedEmployeesPresent) {
      this.open(this.UnsavedChanges, '', '', 'static');
      return;
    }
    this.dataEntered = false;
    this.gotoList();
  }

  /*** function to goto list page */
  gotoList(): void {
    this.dataEntered = false;
    this.modalService.dismissAll();
    this.router.navigate(['/contact/potential-client']);
  }

  /*** function to check form contains any form field having value */
  private checkFormsFilledStatus(): any {
    this.formsFilledStatus = false;
    if (this.matterDetails) {
      Object.keys(this.matterRawValue).forEach(field => {
        if (this.matterRawValue[field]) {
          this.formsFilledStatus = true;
          return;
        }
      });
    }
  }

  /*** function to check form is valid or not */
  get isFormValid(): boolean {
    let isValid = (
      this.matterDetails &&
      this.contactDetails &&
      this.contactDetails.formData &&
      this.matterDetails.valid &&
      this.contactDetails.formData.valid
    );

    return isValid && this.hasCorporateContacts;
  }

  get isContactInfoValid () {
    if (this.contactDetails && this.contactDetails.formData) {
      return this.contactDetails.formData.status === 'VALID' && this.hasCorporateContacts;
    } else {
      return false;
    }
  }

  get hasCorporateContacts() {
    if (
      this.contactDetails &&
      this.matterDetails &&
      this.matterDetails.value &&
      this.matterDetails.value.contactType === 'corporate' &&
      this.contactDetails.vendor
    ) {
      const isPrimary: boolean = this.contactDetails.vendor.some(
        list => list.isPrimary
      );
      const isBilling: boolean = this.contactDetails.vendor.some(
        list => list.isBilling
      );
      if (
        !this.contactDetails.vendor ||
        !this.contactDetails.vendor.length ||
        !isPrimary ||
        !isBilling
      ) {
        return false;
      }
      return true;
    } else {
      return true;
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
      .then(res => {
        if (res) {
        }
      });
  }

  /***** function to get all state list form basic info component */
  stateListArr(event: any): void {
    this.stateList = event;
  }

  private loadTimeZones() {
    this.miscService
      .v1MiscTimezonesGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.timeZoneList = res;
        }
      });
  }

  private getSystemTimeZone() {
    this.miscService
      .v1MiscSystemtimezonesGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          res.forEach(element => {
            if (element.isSysytemTimeZone) {
              this.tenantTimeZone = element;
            }
          });
        }
      });
  }

  getBlockedList(event: any): void {
    this.blockedList = event;
    this.blockedList.forEach(employee => {
      employee.personId = employee.id
    })
    this.blockedEmployeesPresent = !!this.blockedList.length;
    this.dataEntered = true;
  }

  get matterRawValue() {
    return this.matterDetails ? this.matterDetails.getRawValue() : null;
  }
}
