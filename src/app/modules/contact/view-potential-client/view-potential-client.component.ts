import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalDismissReasons, NgbActiveModal, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as clone from 'clone';
import * as _ from 'lodash';
import * as moment from "moment";
import { forkJoin, Observable, Subscription } from 'rxjs';
import { debounceTime, finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IndexDbService } from 'src/app/index-db.service';
import * as Constant from 'src/app/modules/shared/const';
import { REGEX_DATA } from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { PCConflictCheckRequest, vwBlock, vwClient, vwNote } from 'src/common/swagger-providers/models';
import {
  BlockService, ClientAssociationService,
  ClientService,
  ContactsService,
  MatterService,
  MiscService,
  NoteService,
  OfficeService,
  PersonService,
  PlacesService,
  WorkFlowService,
  PotentialClientBillingService
} from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { IOffice, Page, vwAttorneyViewModel } from '../../models';
import { TenantTier } from '../../models/tenant-tier.enum';
import { vwClientAssociation } from '../../models/vw-client-association.model';
import { AddBlockedEmployeeNewMatterWizardComponent } from '../../shared/add-blocked-employee-new-matter-wizard/add-blocked-employee-new-matter-wizard.component';
import { AddClientNoteComponent } from '../../shared/add-client-note/add-client-note.component';
import { ConflictCheckDialogComponent } from '../../shared/conflict-check-dialog/conflict-check-dialog.component';
import * as errorData from '../../shared/error.json';
import { SharedService } from '../../shared/sharedService';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-view-potential-client',
  templateUrl: './view-potential-client.component.html',
  styleUrls: ['./view-potential-client.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ViewPotentialClientComponent implements OnInit, OnDestroy {
  @ViewChild(DatatableComponent, { static: false }) attornyTable: DatatableComponent;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild(DatatableComponent, { static: false }) notesTable: DatatableComponent;
  alltabs1: string[] = [
    'Billing',
    'Invoices',
    'Ledger History',
    'Corporate Contacts',
    'Associations',
    'Notes',
    'Blocked Employees',
  ];
  public selecttabs1: string;
  public showLess: boolean = false;
  public showMore: boolean = false;
  modalOptions: NgbModalOptions;
  closeResult: string;
  public clientDetail: any;
  public primaryContact;
  public billingContact;
  public generalCounsel;
  public address;
  public address2;
  public city;
  public clientState;
  public zip;
  public clientPrimaryPhoneNumber;
  public clientSecondaryPhoneNumber;


  private _opposingPartyList: Array<any> = [];
  public opposingPartyList: Array<any> = [];

  private _opposingCounselList: Array<any> = [];
  public opposingCounselList: Array<any> = [];

  private _expertWitnessList: Array<any> = [];
  public expertWitnessList: Array<any> = [];

  private _vendorList: Array<any> = [];
  public vendorList: Array<any> = [];

  private _subsidiaryList: Array<any> = [];
  public subsidiaryList: Array<any> = [];

  public matterDetails: any;
  public matterId: string;
  public clientId;
  public errorData: any = (errorData as any).default;
  public editAssociations: boolean = null;
  public addOpposingParty: boolean = false;
  public addOpposingPartyMode: string = 'create';
  public selectedOpposingParty: any;
  public addExpertWitness: boolean = false;
  public addExpertWitnessMode: string = 'create';
  public selectedExpertWitness: any;
  public addOpposingCouncel: boolean = false;
  public addOpposingCouncelMode: string = 'create';
  public selectedOpposingCounsel: any;
  public addVendor: boolean = false;
  public addVendorMode: string = 'create';
  public associateVentor: any;
  public initialconsultations: string = 'no';
  public addSubsidiary: boolean = false;
  public addSubsidiaryMode: string = 'create';
  public associateVendor: IOffice;
  public selectedVendor: any;
  public associateSubsidiary: IOffice;
  public selectedSubsidiary: any;
  public associateOpposingParty: IOffice;
  public clientAssociates: Array<IOffice> = [];
  public associateOpposingCouncil: IOffice;
  public associateExpertWitness: IOffice;
  private modalRef: NgbModalRef;
  private modalRefNote: NgbModalRef;
  public stateList: Array<any> = [];
  public consultationLawOfficeList: Array<any> = [];
  public practiceAreaList: Array<any> = [];
  public matterTypeList: Array<any> = [];
  public countryList: Array<any> = [];
  public statusList: Array<any> = [];
  public selectedPractice: any;
  public searchString: any = '';
  public rows: Array<any> = [];
  public oriArr: Array<any> = [];
  public attorneyList: Array<any> = [];
  public attorneyListb: Array<any> = [];
  public oriArrAttorny: Array<any> = [];
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selectedAttorny: Array<number> = [];
  public pangeSelected: number = 1;
  public counter = Array;
  public sameAsResponsible: boolean = true;
  public pageb = new Page();
  public pageSelectorb = new FormControl('10');
  public pangeSelectedb: number = 1;
  public selected: number = 0;
  public columnList = [];
  public state;
  public practiceAreaSelected: boolean = false;
  public corporateContactList: Array<any> = [];
  public tempContactList: Array<any> = [];
  public contactAssociationList: Array<any> = [];
  public noteList: Array<any> = [];
  public originalNoteList: Array<any> = [];
  public taskBuilderWorkFlowTasks: Array<any> = [];
  public doNotContactReasonArr: Array<{ name: string }>;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public salutationArr: Array<{ name: string }>;
  public genderList: Array<{
    val: string;
    text: string;
  }> = UtilsHelper.returndoGenderList();
  private attorneySubscribe: Subscription;
  public searchNotesControl = new FormControl();
  public primaryPhoneNumberBlur: boolean = false;
  public cellPhoneNumberBlur: boolean = false;
  public primaryPhoneBlur: boolean = false;
  public cellPhoneBlur: boolean = false;
  public displayCpnflict: boolean = false;
  public showTaskBuilder: boolean = false;
  public isTuckerAllenUser: boolean = false;
  public taskBuilder_loader: boolean = false;
  public isWorkFlowCreated: boolean = false;
  searchForm: FormGroup;
  authorList: any;

  public loading = true;

  userInfo: any;
  tenantTier = TenantTier;
  emailExistenceForPotentialClient: boolean;
  emailExistenceForCorporateContact: boolean;
  isOppoRepreThemselves: boolean = false;
  public editCorporateContacts: boolean = false;
  public employeesRows: Array<vwAttorneyViewModel> = [];
  public originalBlockedEmployeesList: Array<vwAttorneyViewModel> = [];
  public blockedLoading: boolean;
  public contactinfoloader: boolean = false;
  public taskBuilderType: any[] = ['estate planning',
    'medicaid chronic',
    'guardianship',
    'seminar',
    'legacy protection plan',
    'probate - small estate',
    'trust administration',
    'probate',
    'trust funding',
    'medicaid community'];
  public pageNotes = new Page();
  public pangeNoteSelected: number = 1;
  public pageNoteSelector = new FormControl('10');
  public validZipErr = false;
  decisionStatusList: any;
  decisionActionAllowed: boolean = false;
  constructor(
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private clientService: ClientService,
    private matterService: MatterService,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private misc: MiscService,
    private toastDisplay: ToastDisplay,
    private builder: FormBuilder,
    private officeService: OfficeService,
    private personService: PersonService,
    private noteService: NoteService,
    private router: Router,
    private clientAssociationService: ClientAssociationService,
    private store: Store<fromRoot.AppState>,
    private indexDbService: IndexDbService,
    private contactsService: ContactsService,
    private exporttocsvService: ExporttocsvService,
    private workflowService: WorkFlowService,
    private sharedService: SharedService,
    private pagetitle: Title,
    private blockService: BlockService,
    private placeService: PlacesService,
    private miscService: MiscService,
    private potentialClientBillingService : PotentialClientBillingService,

  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.pageNotes.pageNumber = 0;
    this.pageNotes.size = 10;
    this.permissionList$ = this.store.select('permissions');
    this.salutationArr = [{ name: 'Mr.' }, { name: 'Mrs.' }];

    this.searchNotesControl.valueChanges.subscribe(text => {
      this.searchNotes(text);
    });

    this.userInfo = UtilsHelper.getLoginUser();
  }

  public uniqueNumber = new FormControl(null);
  public salutation = new FormControl(null);
  public firstName = new FormControl('', [Validators.required]);
  public middleName = new FormControl('');
  public lastName = new FormControl('', [Validators.required]);
  public suffix = new FormControl(null);
  public formerName = new FormControl('');
  public gender = new FormControl('');
  public isDeceased = new FormControl(false);
  public spouseFirstName = new FormControl('');
  public spouseMiddleName = new FormControl('');
  public spouseLastName = new FormControl('');
  public spouseGender = new FormControl(null);
  public spouseIsDeceased = new FormControl(false);
  public prospectFirstName = new FormControl('');
  public prospectMiddleName = new FormControl('');
  public prospectLastName = new FormControl('');
  public prospectRelationship = new FormControl('');
  public prospectGender = new FormControl(null);
  public prospectIsDeceased = new FormControl(false);
  public initialContactDate = new FormControl(new Date(), [
    Validators.required
  ]);
  public companyName = new FormControl('', [Validators.required]);
  public primaryPhoneNumber = new FormControl('', [
    Validators.required,
    Validators.minLength(10)
  ]);
  public cellPhoneNumber = new FormControl('', [Validators.minLength(10)]);
  public email = new FormControl('', [
    Validators.email,
    Validators.pattern(REGEX_DATA.Email)
  ]);
  public primaryAddress = new FormControl('', [Validators.required]);
  public primaryAddress2 = new FormControl('');
  public primaryCity = new FormControl('', [Validators.required]);
  public primaryState = new FormControl('', [Validators.required]);
  public primaryZipCode = new FormControl('', [Validators.required]);
  public jurisdictionCounty = new FormControl('', [Validators.required]);
  public preferredContactMethod = new FormControl('');
  public doNotContactReason = new FormControl('');
  public DoNotContactReasonOther = new FormControl('');
  public doNotContact = new FormControl(false);
  public notifyEmail = new FormControl(false);
  public notifySMS = new FormControl(false);
  public initialConsultDate;
  public changeNotes = new FormControl('');
  public createdBy = new FormControl('');
  public conflictArr: Array<any> = [];
  public blockedPersonsArr: Array<any> = [];

  public IndividualContactForm: FormGroup = this.builder.group({
    uniqueNumber: this.uniqueNumber,
    salutation: this.salutation,
    firstName: this.firstName,
    middleName: this.middleName,
    lastName: this.lastName,
    suffix: this.suffix,
    formerName: this.formerName,
    gender: this.gender,
    initialContactDate: this.initialContactDate,
    createdBy: this.createdBy,
    changeNotes: this.changeNotes,
    nextActionDate: [null],
    nextActionNote: [''],
    isDeceased: this.isDeceased,
    spouseFirstName: this.spouseFirstName,
    spouseMiddleName: this.spouseMiddleName,
    spouseLastName: this.spouseLastName,
    spouseGender: this.spouseGender,
    spouseIsDeceased: this.spouseIsDeceased,
    prospectFirstName: this.prospectFirstName,
    prospectMiddleName: this.prospectMiddleName,
    prospectLastName: this.prospectLastName,
    prospectRelationship: this.prospectRelationship,
    prospectGender: this.prospectGender,
    prospectIsDeceased: this.prospectIsDeceased
  });
  public CorporateContactForm: FormGroup = this.builder.group({
    initialContactDate: this.initialContactDate,
    createdBy: this.createdBy,
    changeNotes: new FormControl(''),
    companyName: this.companyName,
    isCompany: new FormControl(),
    nextActionNote: [''],
    nextActionDate: [null],
    uniqueNumber: []
  });

  public ContactForm: FormGroup = this.builder.group({
    primaryPhoneNumber: this.primaryPhoneNumber,
    cellPhoneNumber: this.cellPhoneNumber,
    email: this.email,
    primaryAddress: this.primaryAddress,
    primaryAddress2: this.primaryAddress2,
    primaryCity: this.primaryCity,
    primaryState: this.primaryState,
    primaryZipCode: this.primaryZipCode,
    preferredContactMethod: this.preferredContactMethod,
    doNotContactReason: this.doNotContactReason,
    DoNotContactReasonOther: this.DoNotContactReasonOther,
    doNotContact: this.doNotContact,
    notifyEmail: this.notifyEmail,
    notifySMS: this.notifySMS,
    changeNotes: new FormControl('')
  });

  public vendorForm: FormGroup = this.builder.group({
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    email: new FormControl('', [
      Validators.email,
      Validators.pattern(REGEX_DATA.Email)
    ]),
    jobTitle: new FormControl(''),
    primaryPhone: new FormControl(''),
    cellPhone: new FormControl(''),
    isPrimary: new FormControl(false),
    isBilling: new FormControl(false),
    isGeneral: new FormControl(true),
    isVisible: new FormControl('true', [Validators.required]),
    uniqueNumber: new FormControl()
  });
  public isPrimary = false;
  public isBilling = false;
  public isGeneral = false;
  public officeId = new FormControl('');
  public matterTypeId = new FormControl('', [Validators.required]);
  public jurisdictionId = new FormControl('', [Validators.required]);
  public runConflicts: boolean = false;

  public MatterForm: FormGroup = this.builder.group({
    officeId: this.officeId,
    matterTypeId: this.matterTypeId,
    jurisdictionId: this.jurisdictionId,
    changeNotes: new FormControl(''),
    jurisdictionCounty: this.jurisdictionCounty
  });

  public isViewOnly: boolean = true;
  public opposingPartyRepresentingThemselves: boolean = true;
  public ocLoading = true;
  public opLoading = true;
  public ewLoading = true;
  public subsidiaryLoading = true;
  public notesLoading = true;
  public isBillingInProgress = false;
  private tuckerAllenAccountSubscription: Subscription;
  uniqueContactNumber: any;
  stateCitySubscription: Subscription;
  cityList: any[] = [];
  public singleState: string = null;

  isConsultAttorney = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.clientId = params['clientId'];
      this.state = params['state'];
      if (!this.clientId) {
        this.router.navigate(['/contact/potential-client']);
      } else {
        this.getClientDetail();
        this.getnotes();
        this.isViewOnly = this.state === 'view';
        this.getAssociateType();
        this.getContactAssociationType();
        this.getDoNotContactReasons();
        this.checkTuckerAllenAccount();
        this.getUniqueNumber();
        this.getCategoryRecord();
      }
    });
     this.sharedService.updateDecisionStatus$.subscribe((obj)=>{
      if(obj){
       this.updateDecisionStatus(obj);
      }
    })
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });

    this.searchForm = this.builder.group({
      author: new FormControl(null),
      createdStartDate: new FormControl(null),
      createdEndDate: new FormControl(null),
      isVisibleToClient: new FormControl(null)
    });

    this.searchForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }


  getPermission(){
    let consultAttorney = UtilsHelper.checkPermissionOfConsultAtn(this.clientDetail);
    if(consultAttorney || this.permissionList.CLIENT_CONTACT_MANAGEMENTisEdit || this.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin){
      this.decisionActionAllowed = true;
    }
  }

  getUniqueNumber() {
    this.clientService
      .v1ClientGetClientUniqueNumberGet({ tenantId: this.userInfo.tenantId })
      .subscribe((data: any) => {
        this.uniqueContactNumber = JSON.parse(data).results.uniqueNumber;
      });
  }

  public getDoNotContactReasons() {
    this.misc.v1MiscDoNotContactReasonCodesGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        this.doNotContactReasonArr = JSON.parse(res.body).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  openPersonalinfo(content: any, className, winClass) {
    this.modalRef = this.modalService.open(content, {
      size: className,
      windowClass: winClass,
      centered: true,
      backdrop: 'static',
    });
    this.modalRef.result.then(
      result => {
        this.closeResult = `Closed with: ${result}`;
      },
      reason => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  public addCorporateContacts(clientId) {
    const arr = [];
    for (var i = 0; i < this.tempContactList.length; i++) {
      let associateIds = [];
      if (this.tempContactList[i].isPrimary) {
        let matchAssociateContactId = this.contactAssociationList.filter(
          match => {
            if (match.name === 'Primary Contact') {
              return match;
            }
          }
        );
        associateIds.push(matchAssociateContactId[0].id);
      }
      if (this.tempContactList[i].isBilling) {
        const matchAssociateContactId = this.contactAssociationList.filter(
          match => {
            if (match.name === 'Billing Contact') {
              return match;
            }
          }
        );
        associateIds.push(matchAssociateContactId[0].id);
      }
      if (this.tempContactList[i].isGeneral) {
        const matchAssociateContactId = this.contactAssociationList.filter(
          match => {
            if (match.name === 'General Counsel') {
              return match;
            }
          }
        );
        associateIds.push(matchAssociateContactId[0].id);
      }
      arr.push({
        clientId,
        personId: this.tempContactList[i].personId,
        associationTypeId: associateIds
      });
    }

    this.clientAssociationService
      .v1ClientAssociationBulkPost$Json({ body: arr })
      .subscribe(
        suc => {
          const res: any = suc;
          this.tempContactList = [];
          this.modalRef.dismiss();
          this.modalRef.close();
          this.getClientDetail();
        },
        err => {
          console.log(err);
        }
      );
  }

  public getContactAssociationType() {
    this.misc.v1MiscCorporatecontactassociationsGet({}).subscribe(
      suc => {
        const res: any = suc;
        const list = JSON.parse(res).results;
        this.contactAssociationList = list;
      },
      err => {
        console.log(err);
      }
    );
  }
  public saveCorporateContact() {
    const data = { ...this.vendorForm.value };
    if (data.isPrimary) {
      if (this.isContactExist('Primary')) {
        return;
      }
    }
    if (data.isBilling) {
      if (this.isContactExist('Billing')) {
        return;
      }
    }
    const item = data;
    item.person = data.firstName + ',' + data.lastName;

    const corporate = 'Corporate Contact,';
    const primaryRole = data.isPrimary ? 'Primary Contact,' : ',';
    const BillingRole = data.isBilling ? 'Billing Contact,' : ',';
    const GeneralRole = data.isGeneral ? 'General Counsel,' : ',';
    let role = corporate + primaryRole + BillingRole + GeneralRole;
    role = role
      .split(',')
      .filter(el => {
        return el !== '';
      })
      .join();

    const body = {
      FirstName: data.firstName,
      LastName: data.lastName,
      Email: data.email,
      userName: data.email === '' ? data.firstName + data.lastName : data.email,
      password: 'password',
      PrimaryPhone: data.primaryPhone,
      CellPhone: data.cellPhone,
      JobTitle: data.jobTitle,
      isVisible: data.isVisible === 'true',
      Role: role
    };

    this.personService.v1PersonPost$Json$Response({ body }).subscribe(
      response => {
        const res = JSON.parse(response.body as any);
        if (res.results === 0) {
          this.toastDisplay.showError(this.errorData.server_error);
        }
        item.personId = res.results;
        item.role = role;
        this.corporateContactList.push(item);
        this.tempContactList.push(item);
        this.vendorForm.reset();
        this.vendorForm.patchValue({
          email: '',
          isVisible: 'true'
        });
        this.modalRef.close();
      },
      err => {}
    );
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
    if (this.tuckerAllenAccountSubscription) {
      this.tuckerAllenAccountSubscription.unsubscribe();
    }
  }

  public getClientDetail() {
    this.loading = true;
    this.clientService
      .v1ClientClientIdGet({ clientId: this.clientId, isPotentialClient: true })
      .subscribe(
        suc => {
          const res: any = suc;
          let showTaskBuilder = false;
          this.clientDetail = JSON.parse(res).results;
          this.isConsultAttorney = UtilsHelper.checkPermissionOfConsultAtn(this.clientDetail);
          this.generalCounsel = this.getPrimaryContact('General Counsel');
          this.primaryContact = this.getPrimaryContact('Primary Contact');
          this.billingContact = this.getPrimaryContact('Billing Contact');
          if (this.getPrimaryAddress(this.clientDetail.addresses)) {
            this.address = this.getPrimaryAddress(this.clientDetail.addresses).address;
            this.address2 = this.getPrimaryAddress(this.clientDetail.addresses).address2;
            this.city = this.getPrimaryAddress(this.clientDetail.addresses).city;
            this.clientState = this.getPrimaryAddress(this.clientDetail.addresses).state;
            this.zip = this.getPrimaryAddress(this.clientDetail.addresses).zip;
          }
          this.clientPrimaryPhoneNumber = this.getPrimaryPhoneNumber(this.clientDetail.phones) ? this.getPrimaryPhoneNumber(this.clientDetail.phones).number : null;
          this.clientSecondaryPhoneNumber = this.getSecondaryPhoneNumber(this.clientDetail.phones) ? this.getSecondaryPhoneNumber(this.clientDetail.phones).number : null;

          this.selecttabs1 = this.alltabs1[0];
          if (this.clientDetail.isCompany) {
            this.pagetitle.setTitle(this.clientDetail.companyName);
          } else {
            this.pagetitle.setTitle(
              this.clientDetail.firstName + ' ' + this.clientDetail.lastName
            );
          }
          this.initialconsultations =
            this.clientDetail.nextActionDate || this.clientDetail.nextActionNote
              ? 'yes'
              : 'no';
          this.matterDetails = { id: this.clientDetail.matterId };
          this.matterId = this.clientDetail.matterId;
          this.getBlockedEmployees();
          if (this.matterId) {
            let matterPracticeName = this.clientDetail.matterPractices ? this.clientDetail.matterPractices.name.toLowerCase() : null
            let matterTypess = this.clientDetail.matterType && this.clientDetail.matterType.length ? this.clientDetail.matterType : [];
            if(this.taskBuilderType.includes(matterPracticeName)
              && matterTypess.some(type => type.name && (type.name.toLowerCase() == matterPracticeName))) {
                this.getMatterWorkFlowTasks();
                this.showTaskBuilder = showTaskBuilder = true;
            }
            this.getOpposignParty(true, true);
            this.getOpposingCounsel(true, true);
            this.getExpertWitnesses(true);
            this.getClientAssociation(true);
            this.getPermission();

          } else {
            this.toastDisplay.showError('No Associated Matter Found.');
          }
          this.getCorporateContact();
          if (!showTaskBuilder) {
            this.loading = false;
          }
        },
        err => {
          console.log(err);
          if(err.error.includes('Sorry') > 0){
            this.router.navigate(['/timekeeping']);
          }
          this.loading = false;
        }
      );
  }

  public getCorporateContact() {
    this.corporateContactList = [];
    this.clientAssociationService
      .v1ClientAssociationClientIdGet({ clientId: this.clientId })
      .subscribe(
        suc => {
          const res: any = suc;
          const list = JSON.parse(res).results;
          for (let i = 0; i < list.length; i++) {
            if (i === 0) {
              this.corporateContactList.push(list[i]);
            } else {
              const contact = this.corporateContactList.filter(
                (obj: { personId: any }) => obj.personId === list[i].personId
              );
              if (contact.length !== 0) {
                if (list[i].isPrimary) {
                  contact[0].isPrimary = true;
                }
                if (list[i].isBilling) {
                  contact[0].isBilling = true;
                }
                if (list[i].generalCounsel) {
                  contact[0].generalCounsel = true;
                }
              } else {
                this.corporateContactList.push(list[i]);
              }
            }
          }
          this.corporateContactList = [...this.corporateContactList];
        },
        err => {
          console.log(err);
        }
      );
  }

  private getOpposignParty(saveOriginal = false, isFirstReq?: boolean) {
    this.matterService
      .v1MatterOpposingpartyListMatterIdGet$Response({
        matterId: this.matterDetails.id
      })
      .subscribe(
        suc => {
          this.opposingPartyList = JSON.parse(suc.body as any).results;
          for(const data of this.opposingPartyList){
            if (data.primaryPhone && data.primaryPhone.name) {
              data.maskingName = this.getNumberMasking(data.primaryPhone.name);
            }
          }
          if (saveOriginal) {
            this._opposingPartyList = [...this.opposingPartyList];
          }
          this.opLoading = false;
          if (isFirstReq) {
            this.checkIfOppoPartyRepresenting();
          }
        },
        err => {
          console.log(err);
          this.opLoading = false;
        }
      );
  }

  public getOpposingCounsel(saveOriginal = false, isFirstReq?: boolean) {
    this.matterService
      .v1MatterOpposingcounselListMatterIdGet$Response({
        matterId: this.matterDetails.id
      })
      .subscribe(
        suc => {
          this.opposingCounselList = JSON.parse(suc.body as any).results;
          for(const data of this.opposingCounselList){
            if (data.primaryPhone && data.primaryPhone.name) {
              data.maskingName = this.getNumberMasking(data.primaryPhone.name);
            }
          }
          if (saveOriginal) {
            this._opposingCounselList = [...this.opposingCounselList];
          }
          this.ocLoading = false;
          if (isFirstReq) {
            this.checkIfOppoPartyRepresenting();
          }
        },
        err => {
          console.log(err);
          this.ocLoading = false;
        }
      );
  }

  public getExpertWitnesses(saveOriginal = false) {
    this.matterService
      .v1MatterExpertwitnessListMatterIdGet$Response({
        matterId: this.matterDetails.id
      })
      .subscribe(
        suc => {
          this.expertWitnessList = JSON.parse(suc.body as any).results;
          for(const data of this.expertWitnessList){
            if (data.primaryPhone && data.primaryPhone.name) {
              data.maskingName = this.getNumberMasking(data.primaryPhone.name);
            }
          }
          if (saveOriginal) {
            this._expertWitnessList = [...this.expertWitnessList];
          }
          this.ewLoading = false;
        },
        err => {
          console.log(err);
          this.ewLoading = false;
        }
      );
  }

  private getAssociateType() {
    this.misc.v1MiscClientassociationtypeGet$Response({}).subscribe(
      res => {
        this.clientAssociates = JSON.parse(res.body as any).results;
        if (this.clientAssociates && this.clientAssociates.length > 0) {
          this.associateOpposingParty = this.clientAssociates.filter(obj => {
            return obj.name === 'Opposing Party';
          })[0];
          this.associateOpposingCouncil = this.clientAssociates.filter(obj => {
            return obj.name === 'Opposing Counsel';
          })[0];
          this.associateExpertWitness = this.clientAssociates.filter(obj => {
            return obj.name === 'Expert Witness';
          })[0];
          this.associateVendor = this.clientAssociates.filter(obj => {
            return obj.name === 'Vendor';
          })[0];
          this.associateSubsidiary = this.clientAssociates.filter(obj => {
            return obj.name === 'Subsidiary';
          })[0];
        }
      },
      err => {
        console.log(err);
      }
    );
  }

  open(content: any, className) {
    this.modalRef = this.modalService.open(content, {
      size: className,
      centered: true,
      keyboard: false,
      backdrop: 'static'
    });
    this.modalRef.result.then(
      result => {
        this.closeResult = `Closed with: ${result}`;
      },
      reason => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  addOpposingPartyClick() {
    this.uniqueContactNumber = this.uniqueContactNumber + 1;
    this.addOpposingPartyMode = 'create';
    this.selectedOpposingParty = null;
    this.addOpposingParty = true;
  }

  editOpposingPartyClick(item: any) {
    this.addOpposingPartyMode = 'edit';
    this.selectedOpposingParty = item;
    this.addOpposingParty = true;
  }

  public closeOpposingParty(event) {
    if (event.type === 'close') {
      this.uniqueContactNumber = this.uniqueContactNumber - 1;
    }
    this.addOpposingParty = false;
    if (event === 'add' || (event && event.type && event.type === 'add')) {
      this.getOpposignParty();
    }
  }

  addOpposingCounselClick() {
    this.uniqueContactNumber = this.uniqueContactNumber + 1;
    this.addOpposingCouncelMode = 'create';
    this.selectedOpposingCounsel = null;
    this.addOpposingCouncel = true;
  }

  editOpposingCounselClick(item: any) {
    this.addOpposingCouncelMode = 'edit';
    this.selectedOpposingCounsel = item;
    this.addOpposingCouncel = true;
  }

  addExpertWitnessClick() {
    this.uniqueContactNumber = this.uniqueContactNumber + 1;
    this.addExpertWitnessMode = 'create';
    this.selectedExpertWitness = null;
    this.addExpertWitness = true;
  }

  editExpertWitnessClick(item: any) {
    this.addExpertWitness = true;
    this.addExpertWitnessMode = 'edit';
    this.selectedExpertWitness = item;
  }

  /***
   * capture popup close event for Opposing councel
   */
  public closeOpposingCouncel(event) {
    if (event.type === 'close') {
      this.uniqueContactNumber = this.uniqueContactNumber - 1;
    }
    this.addOpposingCouncel = false;
    if (event === 'add' || (event && event.type && event.type === 'add')) {
      this.getOpposingCounsel();
    }
  }

  /***
   * common function to delete matter associations
   */
  async deleteMatterAssociations(
    messages: string,
    personId: any,
    type: string
  ) {
    try {
      const resp: any = await this.dialogService.confirm(messages, 'Delete');
      if (resp) {
        const data: any = {
          body: {
            associationTypeId:
              type == 'Opposing Party'
                ? this.associateOpposingParty.id
                : type == 'Opposing Counsel'
                ? this.associateOpposingCouncil.id
                : this.associateExpertWitness.id,
            matterId: this.matterId,
            personId: personId
          }
        };
        this.matterService
          .v1MatterPersonDisassociateDelete$Json$Response(data)
          .subscribe(
            suc => {
              let index: any;
              switch (type) {
                case 'Opposing Party':
                  index = this.opposingPartyList.findIndex(
                    x => x.id === personId
                  );
                  this.opposingPartyList.splice(index, 1);
                  this.opposingPartyList = [...this.opposingPartyList];
                  this.toastDisplay.showSuccess(
                    this.errorData.opposingparty_delete
                  );
                  break;
                case 'Opposing Counsel':
                  index = this.opposingCounselList.findIndex(
                    x => x.id === personId
                  );
                  this.opposingCounselList.splice(index, 1);
                  this.opposingCounselList = [...this.opposingCounselList];
                  this.toastDisplay.showSuccess(
                    this.errorData.opposingcounsel_delete
                  );
                  break;
                case 'Expert Witnesses':
                  index = this.expertWitnessList.findIndex(
                    x => x.id === personId
                  );
                  this.expertWitnessList.splice(index, 1);
                  this.expertWitnessList = [...this.expertWitnessList];
                  this.toastDisplay.showSuccess(
                    this.errorData.expert_witnesses_delete
                  );
                  break;
              }
            },
            err => {}
          );
      }
    } catch (err) {}
  }

  /***
   * capture popup close event for Expert Witness
   */
  public closeExpertWitness(event) {
    if (event.type === 'close') {
      this.uniqueContactNumber = this.uniqueContactNumber - 1;
    }
    this.addExpertWitness = false;
    if (event === 'add' || (event && event.type && event.type === 'add')) {
      this.getExpertWitnesses();
    }
  }

  public editGeneralInfo(contant: any) {
    this.initialConsultDate = this.clientDetail.initialConsultDate;
    if (!this.clientDetail.isCompany) {
      this.IndividualContactForm.setValue({
        uniqueNumber: +this.clientDetail.uniqueNumber,
        salutation: this.clientDetail.salutation,
        firstName: this.clientDetail.firstName,
        middleName: this.clientDetail.middleName,
        lastName: this.clientDetail.lastName,
        suffix: this.clientDetail.suffix,
        formerName: this.clientDetail.formerName,
        gender: this.clientDetail.gender,
        initialContactDate: this.clientDetail.initialContactDate
          ? new Date(this.clientDetail.initialContactDate)
          : new Date(),
        createdBy: this.clientDetail.createdBy,
        changeNotes: '',
        nextActionNote: this.clientDetail.nextActionNote,
        nextActionDate: this.clientDetail.nextActionDate,
        isDeceased:
          this.clientDetail.personFormBuilder &&
          this.clientDetail.personFormBuilder.isDeceased
            ? this.clientDetail.personFormBuilder.isDeceased
            : null,
        spouseFirstName:
          this.clientDetail.personFormBuilder &&
          this.clientDetail.personFormBuilder.spouseFirstName
            ? this.clientDetail.personFormBuilder.spouseFirstName
            : '',
        spouseMiddleName:
          this.clientDetail.personFormBuilder &&
          this.clientDetail.personFormBuilder.spouseMiddleName
            ? this.clientDetail.personFormBuilder.spouseMiddleName
            : '',
        spouseLastName:
          this.clientDetail.personFormBuilder &&
          this.clientDetail.personFormBuilder.spouseLastName
            ? this.clientDetail.personFormBuilder.spouseLastName
            : '',
        spouseGender:
          this.clientDetail.personFormBuilder &&
          this.clientDetail.personFormBuilder.spouseGender
            ? this.clientDetail.personFormBuilder.spouseGender
            : null,
        spouseIsDeceased:
          this.clientDetail.personFormBuilder &&
          this.clientDetail.personFormBuilder.spouseIsDeceased
            ? this.clientDetail.personFormBuilder.spouseIsDeceased
            : null,
        prospectFirstName:
          this.clientDetail.personFormBuilder &&
          this.clientDetail.personFormBuilder.prospectFirstName
            ? this.clientDetail.personFormBuilder.prospectFirstName
            : '',
        prospectMiddleName:
          this.clientDetail.personFormBuilder &&
          this.clientDetail.personFormBuilder.prospectMiddleName
            ? this.clientDetail.personFormBuilder.prospectMiddleName
            : '',
        prospectLastName:
          this.clientDetail.personFormBuilder &&
          this.clientDetail.personFormBuilder.prospectLastName
            ? this.clientDetail.personFormBuilder.prospectLastName
            : '',
        prospectRelationship:
          this.clientDetail.personFormBuilder &&
          this.clientDetail.personFormBuilder.prospectRelationship
            ? this.clientDetail.personFormBuilder.prospectRelationship
            : '',
        prospectGender:
          this.clientDetail.personFormBuilder &&
          this.clientDetail.personFormBuilder.prospectGender
            ? this.clientDetail.personFormBuilder.prospectGender
            : null,
        prospectIsDeceased:
          this.clientDetail.personFormBuilder &&
          this.clientDetail.personFormBuilder.prospectIsDeceased
            ? this.clientDetail.personFormBuilder.prospectIsDeceased
            : null
      });
    } else {
      this.CorporateContactForm.setValue({
        initialContactDate: this.clientDetail.initialContactDate
          ? new Date(this.clientDetail.initialContactDate)
          : new Date(),
        companyName: this.clientDetail.companyName,
        isCompany: this.clientDetail.isCompany,
        createdBy: this.clientDetail.createdBy,
        changeNotes: '',
        nextActionNote: this.clientDetail.nextActionNote,
        nextActionDate: this.clientDetail.nextActionDate,
        uniqueNumber: +this.clientDetail.uniqueNumber
      });
    }
    this.open(contant, 'lg');
  }

  public editContactInfo(contant: any) {
    // this.getState();
    const primaryAddressobj = this.clientDetail.addresses.filter(
      (obj: { addressTypeId: any }) => obj.addressTypeId === 1
    );
    const billingAddressobj = this.clientDetail.addresses.filter(
      (obj: { addressTypeId: any }) => obj.addressTypeId !== 1
    );
    const phone1 =
      this.clientDetail.phones.filter(
        (obj: { isPrimary: boolean }) => obj.isPrimary
      ).length > 0
        ? this.clientDetail.phones.filter(
            (obj: { isPrimary: boolean }) => obj.isPrimary
          )[0].number
        : '';
    const phone2 =
      this.clientDetail.phones.filter(
        (obj: { isPrimary: boolean }) => !obj.isPrimary
      ).length > 0
        ? this.clientDetail.phones.filter(
            (obj: { isPrimary: boolean }) => !obj.isPrimary
          )[0].number
        : '';
    if (this.clientDetail.isCompany) {
      this.ContactForm.controls.primaryPhoneNumber.disable();
    } else {
      this.ContactForm.controls.primaryPhoneNumber.enable();
    }
    this.ContactForm.patchValue({
      primaryPhoneNumber: phone1 ? phone1 : ' ',
      cellPhoneNumber: phone2,
      email: this.clientDetail.email || (this.primaryContact && this.primaryContact.length ? this.primaryContact[0].email : ''),
      primaryAddress:
        primaryAddressobj.length !== 0 ? primaryAddressobj[0].address : '',
      primaryAddress2:
        primaryAddressobj.length !== 0 ? primaryAddressobj[0].address2 : '',
      primaryCity:
        primaryAddressobj.length !== 0 ? primaryAddressobj[0].city : '',
      primaryState:
        primaryAddressobj.length !== 0 ? primaryAddressobj[0].state : '',
      primaryZipCode:
        primaryAddressobj.length !== 0 ? primaryAddressobj[0].zip : '',
      preferredContactMethod: this.clientDetail.preferredContactMethod,
      doNotContactReason: this.clientDetail.doNotContactReason,
      DoNotContactReasonOther: this.clientDetail.doNotContactReasonOther,
      doNotContact: this.clientDetail.doNotContact,
      notifyEmail: this.clientDetail.notifyEmail,
      notifySMS: this.clientDetail.notifySmS,
      changeNotes: ''
    });
    this.getCityState(primaryAddressobj.length !== 0 ? primaryAddressobj[0].zip : '', true);
    this.markDoNotContact();
    this.open(contant, 'lg');
    setTimeout(() => {
      this.enablePrefferedContact();
    }, 500);
  }

  public editMatterDetail(contant: any) {
    this.getState();
    this.getlawoffices();
    this.getPracticeAreas();
    this.getAttorney();

    if (
      this.clientDetail.consultAttorney &&
      this.clientDetail.consultAttorney.name
    ) {
      let str = this.clientDetail.consultAttorney.name.split(',');
      this.selected = this.clientDetail.consultAttorney.id;
      if (this.clientDetail.consultationLawOffice !== null) {
        this.getAttorneys(this.clientDetail.consultationLawOffice.id, str[0]);
      }
    }

    this.MatterForm.setValue({
      officeId:
        this.clientDetail.consultationLawOffice !== null
          ? this.clientDetail.consultationLawOffice.id
          : 0,
      matterTypeId:
        this.clientDetail.matterType.length !== 0
          ? this.clientDetail.matterType[0].id
          : 0,
      jurisdictionId:
        this.clientDetail.jurisdiction.length != 0
          ? this.clientDetail.jurisdiction[0].id
          : 0,
      changeNotes: '',
      jurisdictionCounty: this.clientDetail.jurisdictionCounty
    });

    this.open(contant, 'lg');
  }

  public getCountries() {
    this.misc.v1MiscCountryGet({}).subscribe(
      suc => {
        const res: any = suc;
        this.countryList = JSON.parse(res).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  public getPracticeAreas() {
    if (this.MatterForm.value.officeId) {
      this.officeService
        .v1OfficePracticeAreasAllGet$Response({
          officeId: this.MatterForm.value.officeId
        })
        .subscribe(
          suc => {
            const res: any = suc;
            this.practiceAreaList = JSON.parse(
              res.body
            ).results.officePractices;

            if (this.clientDetail.matterPractices) {
              const practiceArea = this.practiceAreaList.find(
                obj => obj.name === this.clientDetail.matterPractices.name
              );

              if (practiceArea) {
                this.selectedPractice = practiceArea.id;
                this.getMatterType(practiceArea);
              }
            }
          },
          err => {
            console.log(err);
          }
        );
    } else {
      this.MatterForm.patchValue({
        practiceId: null,
        matterTypeId: null
      });
      this.selectedPractice = null;
    }
  }

  public getlawoffices() {
    this.officeService
      .v1OfficeTenantGet({ checkInitialConsultation: true })
      .subscribe(
        suc => {
          const res: any = suc;
          const listData = JSON.parse(res).results;
          if (listData && listData.length > 0) {
            this.consultationLawOfficeList = listData.filter(item => item.status === 'Active' || item.status === 'Open');
          }
          if (this.MatterForm.value.officeId) {
            this.getPracticeAreas();
          }
        },
        err => {
          console.log(err);
        }
      );
  }

  public getState() {
    this.misc.v1MiscStatesGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        this.stateList = JSON.parse(res.body).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  public getMatterType(e) {
    if (e) {
      this.matterService
        .v1MatterTypesPracticeIdGet({
          practiceId: e.id
        })
        .subscribe(
          suc => {
            const res: any = suc;
            this.matterTypeList = JSON.parse(res).results;
            this.practiceAreaSelected = true;
          },
          err => {
            console.log(err);
          }
        );
    } else {
      this.practiceAreaSelected = false;
      this.matterTypeList = [];
    }
  }

  public getAttorney() {
    this.attorneyList = [];
    this.attorneyListb = [...this.attorneyList];
    this.oriArrAttorny = [...this.attorneyList];
    this.page.totalElements = this.oriArrAttorny.length;
    this.page.totalPages = Math.ceil(
      this.oriArrAttorny.length / this.page.size
    );
    this.pageb.totalElements = this.page.totalElements;
    this.pageb.totalPages = this.page.totalPages;
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.page.totalPages = Math.ceil(this.oriArr.length / this.page.size);
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.changePageSize();
    }
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
  }

  public onSelect(row) {
    this.selected = row;
  }

  public onRadioSelected(id, event) {
    this.selected = id;
  }

  public updateFilter(event) {
    this.searchString = event.target.value;
    if (this.searchString !== '') {
      this.getAttorneys(
        this.MatterForm.controls.officeId.value,
        this.searchString
      );
    } else {
      this.rows = [];
    }
  }

  public getAttorneys(officeId, searchString = '') {
    const param = { search: searchString, officeId: officeId };
    const val = searchString;
    if (val !== '') {
      this.attorneyList = [];
      if (this.attorneySubscribe) {
        this.attorneySubscribe.unsubscribe();
      }
      this.attorneySubscribe = this.officeService
        .v1OfficeConsultattroneyGet(param)
        .subscribe(
          suc => {
            const res: any = suc;
            let arr = JSON.parse(res).results;
            arr = arr.filter(obj => obj.rank !== -1);
            this.attorneyList = arr.sort(this.compare);
          },
          err => {
            console.log(err);
          }
        );
    } else {
      this.attorneyList = [];
    }
  }

  public compare(a, b) {
    const bandA = a.rank;
    const bandB = b.rank;

    let comparison = 0;
    if (bandA > bandB) {
      comparison = 1;
    } else if (bandA < bandB) {
      comparison = -1;
    }
    return comparison;
  }

  getnotes() {
    this.noteService
      .v1NotePersonListPersonIdGet({ personId: this.clientId })
      .subscribe(
        suc => {
          const res: any = suc;
          this.originalNoteList = JSON.parse(res).results || [];

          this.originalNoteList.forEach(obj => {
            let timeEntered = obj.lastUpdated;
            obj.lastUpdated = moment
              .utc(timeEntered)
              .local()
              .format('YYYY-MM-DD[T]HH:mm:ss');
          });
          this.noteList = [...this.originalNoteList];
          this.getAuthorList();
          this.notesLoading = false;
          this.updateDatatableFooter()
        },
        err => {
          console.log(err);
          this.notesLoading = false;
        }
      );
  }

  private searchNotes(val: string) {
    if (val) {
      let rows = [...this.originalNoteList];

      rows = rows.filter(
        item =>
          this.matchName(item, val, 'content') ||
          this.matchName(item, val, 'applicableDate') ||
          this.matchName(item.createdBy, val, 'name') ||
          this.matchName(item.createdBy, val, 'email')
      );

      this.noteList = [...rows];
      this.updateDatatableFooter();
    } else {
      this.noteList = [...this.originalNoteList];
      this.updateDatatableFooter();
    }
  }

  private matchName(
    item: any,
    searchValue: string,
    fieldName: string
  ): boolean {
    const searchName =
      item && item[fieldName] ? item[fieldName].toString().toUpperCase() : '';
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  /**
   * add edit note
   * @param content
   */
  public addEditNote(row: vwNote, $event) {
    if (row && $event && $event.target.closest('datatable-body-cell')) {
      $event.target.closest('datatable-body-cell').blur();
    }
    this.modalRefNote = this.modalService.open(AddClientNoteComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'lg'
    });

    this.modalRefNote.componentInstance.clientId = this.clientId;
    this.modalRefNote.componentInstance.name = 'Potential Client Note';
    this.modalRefNote.componentInstance.type = 'Potential Client';

    if (row) {
      this.modalRefNote.componentInstance.noteDetails = row;
    }
    this.modalRefNote.result.then(
      result => {
        if (result === 'add') {
          this.toastDisplay.showSuccess(this.errorData.add_note_success);
        }
        if (result === 'edit') {
          this.toastDisplay.showSuccess(this.errorData.update_note_success);
        }
        if (result) {
          this.notesLoading = true;
            this.getnotes();
        }
      },
      reason => {}
    );
  }

  public async deleteNote(id, $event) {
    if ($event && $event.target.closest('datatable-body-cell')) {
      $event.target.closest('datatable-body-cell').blur();
    }

    const resp: any = await this.dialogService.confirm(
      this.errorData.delete_note_confirm,
      'Delete',
      'Cancel',
      'Delete Note'
    );

    if (resp) {
      this.notesLoading = true;
      this.noteService
        .v1NotePersonRemovePersonIdNoteIdDelete({
          personId: this.clientId,
          noteId: id
        })
        .pipe(finalize(() => {}))
        .subscribe(
          suc => {
            this.toastDisplay.showSuccess(this.errorData.delete_note_success);
            this.getnotes();
          },
          err => {
            console.log(err);
          }
        );
    }
  }

  public updateGenInfo() {
    let form: any =
      this.clientDetail.isCompany == false
        ? { ...this.IndividualContactForm }
        : { ...this.CorporateContactForm };
    if (form.status != 'VALID') {
      return;
    }
    let data: any = form.value;
    const item = JSON.parse(JSON.stringify(this.clientDetail));
    item.salutation = data.salutation;
    item.firstName = data.firstName;
    item.middleName = data.middleName;
    item.lastName = data.lastName;
    item.suffix = data.suffix;
    item.formerName = data.formerName;
    item.gender = data.gender;
    item.initialContactDate = data.initialContactDate;
    item.companyName = data.companyName;
    item.changeStatusNotes = data.changeNotes;
    item.nextActionDate =
      this.initialconsultations === 'yes' ? data.nextActionDate : null;
    item.nextActionNote =
      this.initialconsultations === 'yes' ? data.nextActionNote : null;
    if (!this.clientDetail.isCompany && this.isTuckerAllenUser) {
      item.personFormBuilder = {
        isDeceased: data.isDeceased,
        spouseFirstName: data.spouseFirstName,
        spouseMiddleName: data.spouseMiddleName,
        spouseLastName: data.spouseLastName,
        spouseGender: data.spouseGender,
        spouseIsDeceased: data.spouseIsDeceased,
        prospectFirstName: data.prospectFirstName,
        prospectMiddleName: data.prospectMiddleName,
        prospectLastName: data.prospectLastName,
        prospectRelationship: data.prospectRelationship,
        prospectGender: data.prospectGender,
        prospectIsDeceased: data.prospectIsDeceased
      };
      item.personFormBuilder.isDeceased = data.isDeceased;
      item.personFormBuilder.spouseFirstName = data.spouseFirstName;
      item.personFormBuilder.spouseMiddleName = data.spouseMiddleName;
      item.personFormBuilder.spouseLastName = data.spouseLastName;
      item.personFormBuilder.spouseGender = data.spouseGender;
      item.personFormBuilder.spouseIsDeceased = data.spouseIsDeceased;
      item.personFormBuilder.prospectFirstName = data.prospectFirstName;
      item.personFormBuilder.prospectMiddleName = data.prospectMiddleName;
      item.personFormBuilder.prospectLastName = data.prospectLastName;
      item.personFormBuilder.prospectRelationship = data.prospectRelationship;
      item.personFormBuilder.prospectGender = data.prospectGender;
      item.personFormBuilder.prospectIsDeceased = data.prospectIsDeceased;
    }
    this.contactinfoloader = true;
    this.clientService.v1ClientPost$Json({ body: item }).subscribe(
      response => {
        this.contactinfoloader = false;
        const res = JSON.parse(response as any);
        if (res.results === 0) {
          this.toastDisplay.showError(this.errorData.server_error);
        } else {
          this.IndividualContactForm.reset();
          this.toastDisplay.showSuccess(
            'General Information updates are reflected on the page.'
          );
          this.modalRef.close();
          if (this.tempContactList.length > 0) {
            this.addCorporateContacts(item.id);
          }

          this.getClientDetail();
        }
      },
      err => {
        this.contactinfoloader = false;
        // this.callFlag = true;
      }
    );
  }

  public getPrimaryAddress(primaryAddress: any) {
    if (primaryAddress) {
      const address = primaryAddress.find(a => a.addressTypeId === 1);
      return address;
    }
  }

  /**
   * Get Invoice Address
   */
  public getInvoiceAddress(invoiceAddress: any) {
    if (invoiceAddress) {
      const address = invoiceAddress.find(a => a.addressTypeId !== 1);
      return address;
    }
  }

  public getPrimaryPhoneNumber(phoneNumbers: any) {
    if (phoneNumbers) {
      return phoneNumbers.find(a => a.isPrimary);
    }
  }

  async checkEmailExistenceForPotentialClient() {
    this.emailExistenceForPotentialClient = false;
    const email = this.ContactForm.value.email;
    if (email && email.trim() != '') {
      if (this.ContactForm.controls.email.valid) {
        this.misc
          .v1MiscEmailCheckGet({ email, id: +this.clientDetail.id })
          .subscribe((result: any) => {
            this.emailExistenceForPotentialClient = JSON.parse(result).results;
          });
      }
    }
  }

  /**
   * Gets Secondary Phone Number
   * @param phoneNumbers Phone Numbers Associated with Employee
   */
  public getSecondaryPhoneNumber(phoneNumbers: any) {
    if (phoneNumbers) {
      return phoneNumbers.find(a => !a.isPrimary);
    }
  }

  public updateContactInfo() {
    if (!this.ContactForm.valid || this.emailExistenceForPotentialClient) {
      return;
    }
    const data = { ...this.ContactForm.value };
    const item = JSON.parse(JSON.stringify(this.clientDetail));

    const address: any = [];
    const phones: any = [];
    const primaryAddressobj = this.clientDetail.addresses.filter(
      (obj: { addressTypeId: any }) => obj.addressTypeId === 1
    );
    const billingAddressobj = this.clientDetail.addresses.filter(
      (obj: { addressTypeId: any }) => obj.addressTypeId !== 1
    );
    address.push({
      address: data.primaryAddress,
      address2: data.primaryAddress2,
      addressTypeId: 1,
      addressTypeName: 'Primary',
      city: data.primaryCity,
      id: primaryAddressobj.length !== 0 ? +primaryAddressobj[0].id : 0,
      name: primaryAddressobj.length !== 0 ? primaryAddressobj[0].name : '',
      state: data.primaryState,
      zip: data.primaryZipCode
    });

    const primarycontact = this.clientDetail.phones.filter(
      (obj: { isPrimary: any }) => obj.isPrimary
    );
    const cellcontact = this.clientDetail.phones.filter(
      (obj: { isPrimary: any }) => !obj.isPrimary
    );
    phones.push({
      id: primarycontact.length !== 0 ? primarycontact[0].id : 0,
      isPrimary: true,
      number: data.primaryPhoneNumber,
      personId: +this.clientId,
      type: 'primary'
    });

    phones.push({
      id: cellcontact.length !== 0 ? cellcontact[0].id : 0,
      isPrimary: false,
      number: data.cellPhoneNumber,
      personId: +this.clientId,
      type: 'cell'
    });

    item.addresses = address;
    item.phones = phones;
    item.email = data.email;
    item.preferredContactMethod = data.preferredContactMethod;
    item.notifyEmail = data.notifyEmail;
    item.notifySMS = data.notifySMS;
    item.doNotContact = data.doNotContact;
    item.doNotContactReason = data.doNotContact
      ? data.doNotContactReason
      : null;
    item.DoNotContactReasonOther = data.DoNotContactReasonOther;
    this.updateContact(item);
  }

  public updateMatterInfo() {
    if (!this.MatterForm.valid || !this.selectedPractice) {
      return;
    }
    const data = { ...this.MatterForm.value };
    const item = JSON.parse(JSON.stringify(this.clientDetail));

    item.practiceAreaList = data.id;
    item.consultationLawOffice = { id: data.officeId };
    item.matterTypeId = data.matterTypeId;
    item.changeStatusNotes = data.changeNotes;

    const param = {
      id: this.matterDetails.id,
      clientId: this.clientDetail.id,
      jurisdictionStateId: +data.jurisdictionId || null,
      jurisdictionCounty: data.jurisdictionCounty,
      matterTypeId: +data.matterTypeId,
      officeId: +data.officeId,
      name: this.matterDetails.matterName,
      openDate: this.matterDetails.matterOpenDate
    };

    let Observables = [
      this.matterService.v1MatterBasicsPut$Json({
        body: param
      })
    ];

    if (
      this.clientDetail &&
      this.clientDetail.matterPractices &&
      this.clientDetail.matterPractices.id
    ) {
      if (this.clientDetail.matterPractices.id != this.selectedPractice) {
        Observables.push(
          this.matterService.v1MatterPracticesDisassociateMatterIdPracticeIdDelete(
            {
              matterId: this.matterDetails.id,
              practiceId: this.selectedPractice
            }
          )
        );
        Observables.push(
          this.matterService.v1MatterPracticesAssociateMatterIdPracticeIdPost({
            matterId: this.matterDetails.id,
            practiceId: this.selectedPractice
          })
        );
      }
    } else {
      Observables.push(
        this.matterService.v1MatterPracticesAssociateMatterIdPracticeIdPost({
          matterId: this.matterDetails.id,
          practiceId: this.selectedPractice
        })
      );
    }

    forkJoin(Observables).subscribe(
      () => {
        if (this.selected !== 0) {
          item.consultAttorney = {
            id: +this.selected
          };
        }

        this.updateContact(item, true);
      },
      err => {
        console.log(err);
      }
    );
  }

  public updateContact(item, isMatterUpdate = false) {
    this.contactinfoloader = true;
    this.clientService.v1ClientPost$Json({ body: item }).subscribe(
      response => {
        const res = JSON.parse(response as any);
        if (res.results === 0) {
          this.toastDisplay.showError(this.errorData.server_error);
        } else {
          this.IndividualContactForm.reset();
          this.ContactForm.reset();
          this.MatterForm.reset();

          if (isMatterUpdate) {
            this.toastDisplay.showSuccess(
              this.errorData.contact_matter_update_success
            );
          } else {
            this.toastDisplay.showSuccess(
              this.errorData.contact_update_success
            );
          }

          this.modalRef.close();
          this.contactinfoloader = false;
          this.getClientDetail();
        }
      },
      err => {
        this.contactinfoloader = false;
      }
    );
  }

  addVendorClick() {
    this.uniqueContactNumber = this.uniqueContactNumber + 1;
    this.addVendorMode = 'create';
    this.selectedVendor = null;
    this.addVendor = true;
  }

  editVendorClick(item: any) {
    this.addVendor = true;
    this.addVendorMode = 'edit';
    this.selectedVendor = item;
    if (this.selectedVendor.primaryPhone) {
      this.selectedVendor.primaryPhone = {
        name: item.primaryPhone
      };
    }
  }

  deleteVendorClick(item: any) {
    this.dialogService
      .confirm(
        this.errorData.vendor_delete_confirm,
        'Delete',
        'Cancel',
        'Delete Vendor'
      )
      .then(res => {
        if (res) {
          this.clientAssociationService
            .v1ClientAssociationIdDelete$Response({
              id: item.id
            })
            .subscribe(
              () => {
                this.toastDisplay.showSuccess(this.errorData.vendor_delete);
                this.getClientAssociation();
              },
              () => {}
            );
        }
      });
  }

  addSubsidiaryClick() {
    this.uniqueContactNumber = this.uniqueContactNumber + 1;
    this.addSubsidiaryMode = 'create';
    this.selectedSubsidiary = null;
    this.addSubsidiary = true;
  }

  editSubsidiaryClick(item: any) {
    this.addSubsidiary = true;
    this.addSubsidiaryMode = 'edit';
    this.selectedSubsidiary = item;
    if (this.selectedSubsidiary.primaryPhone) {
      this.selectedSubsidiary.primaryPhone = {
        name: item.primaryPhone
      };
    }
  }

  deleteSubsidiaryClick(item: any) {
    this.dialogService
      .confirm(
        this.errorData.subsidiary_delete_confirm,
        'Delete',
        'Cancel',
        'Delete Subsidiary'
      )
      .then(res => {
        if (res) {
          this.clientAssociationService
            .v1ClientAssociationIdDelete$Response({
              id: item.id
            })
            .subscribe(
              () => {
                this.toastDisplay.showSuccess(this.errorData.subsidiary_delete);
                this.getClientAssociation();
              },
              () => {}
            );
        }
      });
  }

  public closeVendor(event) {
    if (event.type === 'close') {
      this.uniqueContactNumber = this.uniqueContactNumber - 1;
    }
    this.addVendor = false;
    if (event != 'close') {
      this.getClientAssociation();
    }
  }

  public closeSubsidiary(event) {
    if (event.type === 'close') {
      this.uniqueContactNumber = this.uniqueContactNumber - 1;
    }
    this.addSubsidiary = false;
    if (event != 'close') {
      this.getClientAssociation();
    }
  }

  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k === 8 || k === 9;
  }

  public getPrimaryContact(type) {
    const primary = this.clientDetail.corporateContacts
      .filter((obj: { code: any }) => obj.code === type)
    return primary;
  }

  goToPrimaryContact() {
    this.modalService.dismissAll();
    this.router.navigate(['/contact/create-corporate-contact'], { queryParams: { contactId: this.primaryContact[0].id, state: 'edit' } })
  }

  /** show number with masking */
  getNumberMasking(number) {
    try {
      let x = number.replace(/\D/g, '').match(/(\d{3})(\d{3})(\d{4})/);
      x = '(' + x[1] + ') ' + x[2] + '-' + x[3];
      return x;
    } catch {
      return number;
    }
  }

  public preferredContact(client: vwClient) {
    if (client && client.preferredContactMethod) {
      if (client.isCompany && client.primaryContactPerson) {
        if (client.preferredContactMethod === 'Email') {
          return client.primaryContactPerson.email;
        } else {
          return client.primaryContactPerson.primaryPhone;
        }
      } else {
        if (client.preferredContactMethod === 'Email') {
          return client.email;
        } else {
          let primaryPhone = client.phones
            ? client.phones.find(a => a.isPrimary)
            : null;
          if (primaryPhone) {
            return primaryPhone.number;
          }
        }
      }
    }
  }
  onBlurMethod(val: any, type: string) {
    type === 'primaryPhoneNumber'
      ? (this.primaryPhoneNumberBlur = this.isBlur(val))
      : type === 'cellPhoneNumber'
      ? (this.cellPhoneNumberBlur = this.isBlur(val))
      : type === 'primaryPhone'
      ? (this.primaryPhoneBlur = this.isBlur(val))
      : type === 'cellPhone'
      ? (this.cellPhoneBlur = this.isBlur(val))
      : '';
  }

  private isBlur(val: string | any[]) {
    return val.length === 10 ? false : val.length === 0 ? false : true;
  }
  private isContactExist(type) {
    let exist = this.isExist(type);
    if (exist) {
      this.toastDisplay.showError(
        type + ' Contact is already exists for this client.'
      );
    }
    if (type === 'Primary') {
      const data = { ...this.vendorForm.value };
      if (!data.email) {
        exist = true;
        this.toastDisplay.showError('Please enter Email address.');
      }
      if (!data.primaryPhone) {
        exist = true;
        this.toastDisplay.showError('Please enter Phone number.');
      }
    }
    return exist;
  }

  public isExist(type: string) {
    let exist = false;
    if (type === 'Primary') {
      exist = this.corporateContactList.some(e => e.isPrimary);
    }
    if (type === 'Billing') {
      exist = this.corporateContactList.some(e => e.isBilling);
    }
    return exist;
  }

  isExistPrimary() {
    let exist = false;
    exist = this.corporateContactList.some(e => e.isPrimary);
    return exist;
  }

  isExistBilling() {
    let exist = false;
    exist = this.corporateContactList.some(e => e.isBilling);
    return exist;
  }

  runConflictsCheck(): void {
    let associationsArr = [
      ...this.opposingPartyList,
      ...this.opposingCounselList,
      ...this.expertWitnessList,
      ...this.vendorList,
      ...this.subsidiaryList
    ];
    let associations = JSON.parse(JSON.stringify(associationsArr));
    associations.forEach(a => {
      if (a.primaryPhone) {
        a.primaryPhone = a.primaryPhone.name;
      }

      delete a.email;
    });

    const request: PCConflictCheckRequest = {
      associations: associations,
      clientCompanyName: this.clientDetail.companyName,
      clientFirstName: this.clientDetail.firstName,
      clientLastName: this.clientDetail.lastName,
      isCompany: this.clientDetail.isCompany,
      clientId: +this.clientId,
      matterId: this.clientDetail.matterId
    };

    this.contactsService
      .v1ContactsConflictPost$Json({
        body: request
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {})
      )
      .subscribe(response => {
        if (response && response.conflictPersons) {
          this.conflictArr = response.conflictPersons;
          this.blockedPersonsArr = response.blockedPersons;
        } else {
          this.conflictArr = [];
          this.blockedPersonsArr = [];
        }

        this.openConflictCheckDialog();
      });
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
    component.blockedUsers = this.blockedPersonsArr;

    component.header = this.errorData.potential_conflict_header;
    component.message = this.errorData.changes_potential_conflict;
    component.returnButtonText = 'Return to Contact Profile';

    modal.result.then(res => {
      if (res === 'save') {
        this.save();
      }

      if (res === 'discard') {
        this.discard();
      }
    });
  }

  private save() {
    this._opposingPartyList = [...this.opposingPartyList];
    this._opposingCounselList = [...this.opposingCounselList];
    this._expertWitnessList = [...this.expertWitnessList];
    this._subsidiaryList = [...this.subsidiaryList];
    this._vendorList = [...this.vendorList];
  }

  private discard() {
    let newlyAddedAssociations = [
      ...this.addedItems(this._opposingPartyList, this.opposingPartyList),
      ...this.addedItems(this._opposingCounselList, this.opposingCounselList),
      ...this.addedItems(this._expertWitnessList, this.expertWitnessList),
      ...(this.addedItems(this._vendorList, this.vendorList) || []).filter(
        a => a.status == 'Active'
      ),
      ...(
        this.addedItems(this._subsidiaryList, this.subsidiaryList) || []
      ).filter(a => a.status == 'Active')
    ];

    if (newlyAddedAssociations.length > 0) {
      const Observables = newlyAddedAssociations.map(a => {
        const data: any = {
          body: {
            associationTypeId: a.associationTypeId,
            matterId: a.matterId,
            personId:
              a['associationType'] === 'Subsidiary' ||
              a['associationType'] === 'Vendor'
                ? a.personId
                : a.id
          }
        };
        return this.matterService.v1MatterPersonDisassociateDelete$Json$Response(
          data
        );
      });

      forkJoin(Observables)
        .pipe(finalize(() => {}))
        .subscribe(() => {
          this.getOpposignParty(true);
          this.getOpposingCounsel(true);
          this.getExpertWitnesses(true);
          this.getClientAssociation(true);
        });
    }
  }

  private addedItems(
    originalArray: vwClientAssociation[],
    items: vwClientAssociation[]
  ) {
    let arr: vwClientAssociation[] = [];

    items.forEach(a => {
      let index = originalArray.findIndex(i => i.id === a.id);
      if (index === -1) {
        arr.push(a);
      }
    });

    return arr;
  }

  /*****
   * function to get client association
   */
  async getClientAssociation(saveOriginal = false): Promise<any> {
    let resp: any = await this.clientAssociationService
      .v1ClientAssociationAllClientIdGet$Response({ clientId: +this.clientId })
      .toPromise();
    resp = JSON.parse(resp.body).results;
    this.subsidiaryList = resp.filter(
      item =>
        item.associationType === Constant.ClientAssociation.Subsidiary &&
        item.status === 'Active'
    );
    for(const data of this.subsidiaryList){
      if (data.primaryPhone) {
        data.maskingName = this.getNumberMasking(data.primaryPhone);
      }
    }

    this.vendorList = resp.filter(
      item =>
        item.associationType === Constant.ClientAssociation.Vendor &&
        item.status === 'Active'
    );
    for(const data of this.vendorList){
      if (data.primaryPhone) {
        data.maskingName = this.getNumberMasking(data.primaryPhone);
      }
    }

    if (saveOriginal) {
      this._subsidiaryList = [...this.subsidiaryList];
      this._vendorList = [...this.vendorList];
    }
    this.subsidiaryLoading = false;
  }

  /*....Export to CSV in conflict check
   */
  ExportToCSV() {
    let columnList = [];
    let rows = clone(this.conflictArr);

    rows = rows.filter(item => {
      item.conflictType = item.conflictType.name;
      item.matterName = item.matterName.name;
      item.clientName = item.clientName.name.replace(/,/g, ' ');
      item.phones = item.phones.length > 0 ? item.phones[0].number : null;
      return item;
    });

    if (rows && rows.length > 0) {
      const keys = Object.keys(rows[0]);

      for (let i = 0; i < keys.length; i++) {
        columnList.push({ Name: keys[i], isChecked: true });
      }
    }
    this.exporttocsvService.downloadFile(rows, columnList, 'Conflict Check');
  }

  getMatterWorkFlowTasks() {
    this.workflowService
    .v1WorkFlowMattertasksMatterIdGet({
      matterId: this.clientDetail.matterId
    })
      .subscribe(
        (res: any) => {
          this.taskBuilderWorkFlowTasks = JSON.parse(res as any).results.allTasks;
          this.isWorkFlowCreated = (this.taskBuilderWorkFlowTasks && this.taskBuilderWorkFlowTasks.length) ? true : false;
          this.loading = false;
        },
        err => {
          this.loading = false;
        }
      );
  }

  checkTuckerAllenAccount() {
    this.tuckerAllenAccountSubscription = this.sharedService.isTuckerAllenAccount$.subscribe(
      res => {
        this.isTuckerAllenUser = res ? true : false;
      }
    );
  }

  public navigateUrl(row) {
    this.router.navigate(['/contact/client-conversion'], {
      queryParams: {
        clientId: row.id,
        type: row.isCompany ? 'company' : 'individual'
      }
    });
  }

  copyEmail(email: string) {
    UtilsHelper.copyText(email);
  }

  markDoNotContact(flag = false) {
    if (this.ContactForm.value.doNotContact) {
      this.ContactForm.controls['preferredContactMethod'].setValue(null);
      this.ContactForm.get('preferredContactMethod').disable();
      this.ContactForm.controls['doNotContactReason'].enable();
      this.ContactForm.controls['doNotContactReason'].setValidators([
        Validators.required
      ]);
    } else {
      this.ContactForm.get('preferredContactMethod').enable();
      this.ContactForm.get('doNotContactReason').setValue(null);
      this.ContactForm.get('doNotContactReason').disable();
      this.ContactForm.controls['preferredContactMethod'].setValidators([
        Validators.required
      ]);
      if(flag) {
        this.enablePrefferedContact();
      }
    }
  }

  checkIfOppoPartyRepresenting() {
    let arr1 = this.opposingPartyList.map(x => x.id);
    let arr2 = this.opposingCounselList.map(x => x.id);
    arr1.sort(function(a, b) {
      return a - b;
    });
    arr2.sort(function(a, b) {
      return a - b;
    });
    this.isOppoRepreThemselves = _.isEqual(arr1, arr2) ? true : false;
  }

  getAuthorList() {
    this.authorList = this.noteList
      .filter(a => a.createdBy)
      .map(a => {
        return a.createdBy;
      });

    this.authorList = _.uniqBy(this.authorList, (a: any) => a.id);
  }

  applyFilter() {
    const data = {
      ...this.searchForm.value
    };

    let rows = [...this.originalNoteList];

    if (data.isVisibleToClient) {
      rows = rows.filter(a => {
        if (data.isVisibleToClient == 1) {
          return a.isVisibleToClient;
        } else {
          return !a.isVisibleToClient;
        }
      });
    }

    if (data.author) {
      rows = rows.filter(a => {
        if (a.createdBy) {
          return a.createdBy.id == data.author;
        } else {
          return false;
        }
      });
    }

    if (data.createdStartDate) {
      rows = rows.filter(a => {
        const date = moment(data.createdStartDate).format('YYYY-MM-DD');
        const lastUpdate = moment(a.lastUpdated).format('YYYY-MM-DD');
        return date <= lastUpdate;
      });
    }

    if (data.createdEndDate) {
      rows = rows.filter(a => {
        const date = moment(data.createdEndDate).format('YYYY-MM-DD');
        const applicableDate = moment(a.lastUpdated).format('YYYY-MM-DD');
        return date >= applicableDate;
      });
    }

    // update the rows
    this.noteList = rows;
    // Whenever the filter changes, always go back to the first page
    this.notesTable.offset = 0;
  }

  /****function to remove blocked employee */
  async removeBlockedEmployee(row: any, removeModal): Promise<any> {
    this.modalService
      .open(removeModal, {
        centered: true,
        backdrop: 'static'
      })
      .result.then(result => {
        if (result) {
          const data = {
            id: row.blockId,
            personId: row.id,
            targetPersonId: parseInt(this.clientId)
          };

          this.blockedLoading = true;
          this.blockService.v1BlockDelete$Json({ body: data }).subscribe(
            () => {
              this.toastDisplay.showSuccess(
                this.errorData.delete_blocked_employee_success
              );
              this.getBlockedEmployees();
            },
            err => {
              this.blockedLoading = false;
            }
          );
        }
      });
  }

  /**** function to open add blocked employee modal */
  addBlockedEmployee() {
    let modalRef = this.modalService.open(
      AddBlockedEmployeeNewMatterWizardComponent,
      {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        size: 'xl',
      }
    );

    modalRef.componentInstance.alreadyBlockedEmployees = this.employeesRows.map(
      (a: any) => a.id
    );

    modalRef.result.then(res => {
      if (res) {
        let selectedID: Array<vwBlock> = res.map(value => {
          return ({
            personId: value['id'],
            targetPersonId: parseInt(this.clientId),
            description: value['description']
          } as unknown) as vwBlock;
        });

        this.blockedLoading = true;

        this.blockService
          .v1BlockPost$Json({
            body: selectedID
          })
          .pipe(
            map(res => {
              return JSON.parse(res as any).results as any;
            })
          )
          .subscribe(
            res => {
              this.getBlockedEmployees();
            },
            () => {
              this.blockedLoading = false;
              this.toastDisplay.showError(this.errorData.error_occured);
            }
          );
      }
    });
  }

  /**** function to get blocked employee list */
  getBlockedEmployees() {
    this.blockedLoading = true;
    const profile = localStorage.getItem('profile');
    if (profile) {
      this.clientService
        .v1ClientBlockedUserClientIdGet({ clientId: this.clientId })
        .subscribe(
          suc => {
            const res: any = suc;
            this.originalBlockedEmployeesList = JSON.parse(res).results || [];
            this.employeesRows = [...this.originalBlockedEmployeesList];
            this.employeesRows.forEach(row => {
              row.fullName = (row.firstName) ? row.lastName + ', ' + row.firstName : row.firstName;
            });
            this.blockedLoading = false;
          },
          err => {
            this.blockedLoading = false;
            console.log(err);
          }
        );
    } else {
      this.blockedLoading = false;
    }
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj['uniqueNumber'] || obj : index ;
  }

  /********** Enables/Disables Preferred Contact Method ******/
  public enablePrefferedContact() {
    const ele = document.getElementById('customradi31') as HTMLInputElement;
    if(!this.ContactForm.value.email || this.ContactForm.controls.email.errors) {
      if (this.ContactForm.value.preferredContactMethod == 'Email') {
        this.ContactForm.controls.preferredContactMethod.setValue('');
      }
      ele.disabled = true;
      return;
    }
    ele.disabled = false;
  }

  /***** Get state and city by zip-code ****/
  public getCityState(searchString, isStateCityExist?: boolean)  {
    const input = (searchString || '').trim();
    if (this.stateCitySubscription){
      this.stateCitySubscription.unsubscribe();
    }
      if(input.length >= 3) {
        this.validZipErr = false;
        this.stateCitySubscription =  this.placeService.v1PlacesZipcodeInputGet({input})
        .pipe(debounceTime(500), map(UtilsHelper.mapData))
        .subscribe((res) => {
          if(res) {
            this.stateList = [];
            this.cityList = [];
            this.singleState = null;
            if(res.stateFullName && res.stateFullName.length)
              res.stateFullName.forEach((state, index) => this.stateList.push({name: state, code: res.state[index]}))
            if(res.city && res.city.length)
              this.cityList = [...res.city]
            _.sortBy(this.stateList);
            _.sortBy(this.cityList);
            if(this.stateList.length == 1)
              this.singleState = this.stateList[0].name;

            if(isStateCityExist) {
              this.setStateCity();
            } else {
              this.ContactForm.controls.primaryState.setValue(this.stateList.length ? this.stateList[0].code : null);
              this.ContactForm.controls.primaryCity.setValue(this.cityList.length ? this.cityList[0] : null);
            }
            if (!this.stateList.length || !this.cityList.length) {
              setTimeout(() => {
                this.validZipErr = true;
              }, 100)
            }
          }
        });
        return;
      }
    this.stateList = [];
    this.cityList = [];
    this.singleState = null;
    this.validZipErr = false;
    this.ContactForm.controls.primaryState.setValue(null);
    this.ContactForm.controls.primaryCity.setValue(null);
    if (input.length > 0 && input.length < 3) {
      this.validZipErr = true;
    }
  }

  /******* set State and City  ******/
  public setStateCity() {
    const state = this.ContactForm.get('primaryState').value;
    const city = this.ContactForm.get('primaryCity').value;
    const stateIndex = this.stateList.findIndex(st => st && st.code && (st.code == state));
    const cityIndex = this.cityList.indexOf(city);
    this.ContactForm.controls.primaryState.setValue(stateIndex > -1 ? this.stateList[stateIndex].code : this.stateList [0].code || '');
    this.ContactForm.controls.primaryCity.setValue(cityIndex > -1 ? this.cityList[cityIndex] : this.cityList [0] || '');
  }

  get footerHeight() {
    if (this.noteList) {
      return this.noteList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  public changeNotePageSize() {
    this.pageNotes.size = +this.pageNoteSelector.value;
    this.updateDatatableFooter()
  }

  public changeNotePage() {
    this.pageNotes.pageNumber = this.pangeNoteSelected - 1;
    if (this.pangeNoteSelected == 1) {
      this.updateDatatableFooter();
    }
  }

  public pageNoteChange(e) {
    this.pangeNoteSelected = e.page;
  }

  updateDatatableFooter() {
    this.pageNotes.totalElements = this.noteList.length;
    this.pageNotes.totalPages = Math.ceil(
      this.noteList.length / this.pageNotes.size
    );
    this.pageNotes.pageNumber = 0;
    this.pangeNoteSelected = 1;
    // Whenever the filter changes, always go back to the first page
    if (this.notesTable) {
      this.notesTable.offset = 0;
    }
  }

  setValidatorNextActionFields() {
    if (this.initialconsultations === 'yes') {
      if (this.clientDetail.isCompany) {
        /* TODO IF REQUIRE */
      } else {
        this.IndividualContactForm.get('nextActionDate').setValidators([Validators.required]);
        this.IndividualContactForm.get('nextActionNote').setValidators([Validators.required]);
      }
    } else {
      if (this.clientDetail.isCompany) {
        /* TODO IF REQUIRE */
      } else {
        this.IndividualContactForm.get('nextActionDate').patchValue(null);
        this.IndividualContactForm.get('nextActionDate').clearValidators();
        this.IndividualContactForm.get('nextActionNote').patchValue('');
        this.IndividualContactForm.get('nextActionNote').clearValidators();
      }
    }
    if (this.clientDetail.isCompany) {
      /* TODO IF REQUIRE */
    } else {
      this.IndividualContactForm.get('nextActionDate').updateValueAndValidity();
      this.IndividualContactForm.get('nextActionNote').updateValueAndValidity();
    }
  }

  getCategoryRecord() {
    this.miscService
      .v1MiscLookUpGet$Response({ categoryCode: 'RETENTION_STATUS' })
      .subscribe((res: any) => {
        res = JSON.parse(res.body as any).results;
        this.decisionStatusList = res;
      });
  }

  updateDecisionStatus(id){
    this.loading = true;
    this.potentialClientBillingService
      .v1PotentialClientBillingUpdateConsultationFeeDecisionStatusContactIdRecordStatusPut$Response({
          contactId: this.clientDetail.id,
        recordStatus: id})
      .subscribe((res: any) => {
        res = JSON.parse(res.body as any).results;
        this.getClientDetail();
      });
  }


}
