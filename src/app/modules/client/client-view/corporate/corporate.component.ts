import { Component, EventEmitter, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalDismissReasons, NgbDateAdapter, NgbDateNativeAdapter, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { Observable, Subscription, throwError } from 'rxjs';
import { debounceTime, finalize, map, switchMap } from 'rxjs/operators';
import { IndexDbService } from 'src/app/index-db.service';
import { MatterListSearchOption, vwAttorneyViewModel, vwMatterResponse } from 'src/app/modules/models/matter.model';
import { IOffice } from 'src/app/modules/models/office.model';
import { Page } from 'src/app/modules/models/page';
import { TenantTier } from 'src/app/modules/models/tenant-tier.enum';
import * as Constant from 'src/app/modules/shared/const';
import { REGEX_DATA } from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { MatterAssociationService } from 'src/app/service/matter-association.service';
import { vwClient, vwIdName } from 'src/common/swagger-providers/models';
import { BillingService, BlockService, ClientAssociationService, ClientService, DmsService, EmployeeService, MatterService, MiscService, NoteService, OfficeService, PersonService, PlacesService } from 'src/common/swagger-providers/services';
import { ClientBackButtonGuard } from "../../../../guards/client-back-button-deactivate.guard";
import { ToastDisplay } from '../../../../guards/toast-service';
import * as fromRoot from '../../../../store';
import * as fromPermissions from '../../../../store/reducers/permission.reducer';
import * as errorData from '../../../shared/error.json';
import { RateTableModalComponent } from "../../../shared/rate-table-modal/rate-table-modal.component";
import { AddBlockedUsersComponent } from './add-blocked-users/add-blocked-users.component';

@Component({
  selector: 'app-corporate',
  templateUrl: './corporate.component.html',
  styleUrls: ['./corporate.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  providers: [
    {
      provide: NgbDateAdapter,
      useClass: NgbDateNativeAdapter
    }
  ]
})
export class CorporateComponent implements OnInit, OnDestroy, ClientBackButtonGuard {

  @ViewChild(DatatableComponent, { static: false }) employeesTable: DatatableComponent;
  @ViewChild('unsavedRateTable', { static: false }) unsavedRateTable: any;
  @ViewChild('unsavedRateTableCustom', { static: false }) unsavedRateTableCustom: any;
  matterDetails: vwMatterResponse;
  matterStatusList: Array<vwIdName>;
  closeMatterStatus: vwIdName;
  client: vwClient;
  clientId: number;
  matterId: number;
  alltabs1: string[] = [
    'Corporate Contacts',
    'Matters',
    'Associations',
    'Blocked Users',
    'Billing'
  ];
  selecttabs1: string;

  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;

  status = false;
  public primaryPhoneBlur = false;
  public cellPhoneBlur = false;
  status1 = false;

  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public pageM = new Page();
  public pageMSelector = new FormControl('10');
  public pageMSelected = 1;
  allSelected: boolean;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild(DatatableComponent, { static: false }) blockedUser: DatatableComponent;
  statusList: Array<vwIdName> = [];
  officeList: Array<vwIdName> = [];
  searchOption: MatterListSearchOption;
  matterList: Array<vwMatterResponse> = [];
  originalMatterList: Array<vwMatterResponse> = [];

  selectedMatterList: Array<vwMatterResponse> = [];
  blockedFromSomeMatters: boolean;

  blockUserList: Array<any> = [];
  originalblockUserList: Array<any> = [];

  vendorList: Array<any>;
  subsidiariesList: Array<any>;

  public showThis = false;

  public applicableDate = new FormControl('');
  public content = new FormControl('', [Validators.required]);
  public isVisibleToClient = new FormControl(false);

  public noteForm: FormGroup = this.builder.group({
    id: new FormControl(0),
    applicableDate: this.applicableDate,
    content: this.content,
    isVisibleToClient: this.isVisibleToClient
  });

  public noteList: Array<any> = [];
  public originalNoteList: Array<any> = [];
  public errorData: any = (errorData as any).default;
  public conflict_header_msg: string;
  public conflict_body_msg: string;
  public exter_doc_email: string;
  private modalRef: NgbModalRef;
  modalOptions: NgbModalOptions;
  closeResult: string;
  public invoicePrefList: any = [];
  public employeesRows: Array<any> = [];
  public originalEmployeesRows: Array<any> = [];
  public pageEmployee = new Page();
  public pageSelectorEmployee = new FormControl('10');
  public pageSelectedEmployee = 1;
  public selectedEmployee: Array<any> = [];
  public SelectionType = SelectionType;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public selectedAttorny: Array<number> = [];
  public pangeSelected = 1;
  public sameAsResponsible = true;
  public pageb = new Page();
  public pageSelectorb = new FormControl('10');
  public pangeSelectedb = 1;

  public filterName = 'Apply Filter';
  public selectedOffice: Array<number> = [];
  public selectedStatus: Array<number> = [];
  public empOfficeTitle = 'All';
  public empStatustitle = 'All';
  public conflictArr: Array<any> = [];
  public runConflicts = false;
  public isTuckerAllenUser: boolean = false;
  private tuckerAllenAccountSubscription: Subscription;
  public dstatusList: Array<IOffice> = [
    {
      id: 1,
      name: 'Active',
      checked: false
    },
    {
      id: 2,
      name: 'Inactive',
      checked: false
    }
  ];
  public dofficeList: Array<IOffice>;
  public blockDesc: string;
  public uniqueContactNumber: any;

  public uniqueNumber = new FormControl('');
  public salutation = new FormControl('');
  public firstName = new FormControl('', [Validators.required]);
  public middleName = new FormControl('');
  public lastName = new FormControl('', [Validators.required]);
  public suffix = new FormControl('');
  public formerName = new FormControl('');
  public gender = new FormControl('');
  public initialContactDate = new FormControl('', [Validators.required]);
  public companyName = new FormControl('', [Validators.required]);

  public primaryPhoneNumber = new FormControl('', [
    Validators.required,
    Validators.maxLength(10)
  ]);
  public cellPhoneNumber = new FormControl('');
  public primaryAddress = new FormControl('', [Validators.required]);
  public primaryAddress2 = new FormControl('');
  public primaryCity = new FormControl(null, [Validators.required]);
  public primaryState = new FormControl(null, [Validators.required]);
  public primaryZipCode = new FormControl('', [Validators.required]);

  public preferredContactMethod = new FormControl('');
  public doNotContactReason = new FormControl('');
  public doNotContact = new FormControl(false);
  public notifyEmail = new FormControl(false);
  public notifySMS = new FormControl(false);
  public marketingEmail = new FormControl(false);
  public marketingSMS = new FormControl(false);

  public initialConsultDate = new FormControl(null);
  public changeNotes = new FormControl('');
  public createdBy = new FormControl('');

  public IndividualContactForm: FormGroup = this.builder.group({
    uniqueNumber: this.uniqueNumber,
    salutation: this.salutation,
    firstName: this.firstName,
    middleName: this.middleName,
    lastName: this.lastName,
    suffix: this.suffix,
    formerName: this.formerName,
    gender: this.gender,
    changeNotes: this.changeNotes,
    notifyEmail: this.notifyEmail,
    notifySMS: this.notifySMS,
    initialContactDate: this.initialContactDate,
    createdBy: this.createdBy,
    marketingEmail: this.marketingEmail,
    marketingSMS: this.marketingSMS,
    personFormBuilder: this.builder.group({
      isDeceased: [null],
      spouseFirstName: [''],
      spouseMiddleName: [''],
      spouseLastName: [''],
      spouseGender: [null],
      spouseIsDeceased: [null],
      prospectFirstName: [''],
      prospectMiddleName: [''],
      prospectLastName: [''],
      prospectRelationship: [''],
      prospectGender: [null],
      prospectIsDeceased: [null]
    })
  });

  public ContactForm: FormGroup = this.builder.group({
    primaryPhoneNumber: this.primaryPhoneNumber,
    cellPhoneNumber: this.cellPhoneNumber,
    email: new FormControl('', [
      Validators.email,
      Validators.pattern(REGEX_DATA.Email)
    ]),
    primaryAddress: [this.primaryAddress, Validators.required],
    primaryAddress2: this.primaryAddress2,
    primaryCity: [this.primaryCity, Validators.required],
    primaryState: [this.primaryState, Validators.required],
    primaryZipCode: [this.primaryZipCode, Validators.required],
    preferredContactMethod: this.preferredContactMethod,
    doNotContactReason: this.doNotContactReason,
    doNotContact: this.doNotContact,
    changeNotes: this.changeNotes
  });

  public officeId = new FormControl(null, [Validators.required]);
  public matterTypeId = new FormControl('', [Validators.required]);
  public jurisdictionId = new FormControl('');
  public primaryOffice = new FormControl(null, [Validators.required]);

  public MatterForm: FormGroup = this.builder.group({
    officeId: this.officeId,
    primaryOffice: this.primaryOffice,
    changeNotes: this.changeNotes
  });

  public stateList: Array<any> = [];

  public searchString: any = '';
  public rows: Array<any> = [];
  public oriArr: Array<any> = [];
  public attorneyList: Array<any> = [];
  public attorneyListb: Array<any> = [];
  public oriArrAttorny: Array<any> = [];

  public selected = 0;
  public salutationArr: Array<{ name: string }>;
  public consultationLawOfficeList: Array<any> = [];
  public primaryLawOfficeList: Array<any> = [];
  public primaryLawOfficeResponsibleList: Array<any> = [];
  public practiceAreaList: Array<any> = [];
  public matterTypeList: Array<any> = [];
  public countryList: Array<any> = [];
  public selectedPractice: any;
  public doNotContactReasonArr: Array<{ name: string }>;

  private permissionSubscribe: Subscription;
  private refreshVendorSub: Subscription;
  private refreshSubsidiarySub: Subscription;
  public addcorpLoading: boolean = false;

  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public genderList: Array<{
    val: string;
    text: string;
  }> = UtilsHelper.returndoGenderList();

  public vendorForm: FormGroup = this.builder.group({
    uniqueNumber: new FormControl(),
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.email]),
    jobTitle: new FormControl(''),
    primaryPhone: new FormControl(''),
    cellPhone: new FormControl(''),
    isPrimary: new FormControl(false),
    isBilling: new FormControl(false),
    isGeneral: new FormControl(false),
    isVisible: new FormControl(true),
    personId: new FormControl(''),
    Id: new FormControl('')
  });

  public corporateContactList: Array<any> = [];
  public contactType: Array<any> = [];
  public corporateContactOriginalList: Array<any> = [];
  public isEdit = false;
  public individualContactFormSubmitted = false;

  public CorporateContactForm: FormGroup = this.builder.group({
    uniqueNumber: this.uniqueNumber,
    initialContactDate: this.initialContactDate,
    createdBy: this.createdBy,
    changeNotes: this.changeNotes,
    companyName: this.companyName,
    isCompany: new FormControl(),
    notifyEmail: new FormControl(false),
    notifySMS: new FormControl(false),
    marketingEmail: new FormControl(false),
    marketingSMS: new FormControl(false)
  });
  public primaryOfficeModel: any;

  addEditAssociation = false;
  corporateContactFormSubmitted: boolean;
  contactFormSubmitted: boolean;
  matterFormSubmitted: boolean;
  emailExistence: boolean;
  emailExistenceForCorporateContact: boolean;
  isEditRateTableModeOn = false;
  rateTables = [];
  isCustomBillingRate = false;
  corporateContactLoading: boolean;
  primaryContact: any;
  public stateCitySubscription: Subscription;
  cityList: any[] = [];
  shortNameStateList: any[] = [];
  singleState: string = null;
  namelength: number;

  clickEvent() {
    this.status = !this.status;
  }
  cancelClickEvent() {
    this.status = !this.status;
  }

  public loading: boolean;
  public clientLoading: boolean;
  public genInfoLoading: boolean;
  public contactLoading: boolean;
  public contactInfoLoading: boolean;
  public genInfoUpdated = true;
  public contactInfoUpdated = true;
  public matterInfoUpdate = true;
  public editLawInfoLoading: boolean;
  public matterInfoLoading: boolean;
  public addBlockUserLoading: boolean;

  userInfo: any;
  tenantTier = TenantTier;

  public officeState: string;
  public attorneyLoading: boolean = false;
  public pageLoading: boolean = true;
  public primaryOfficeId: number;
  public formSubmitted: boolean = false;
  public isInvalidEmail: boolean = false;
  public validZipErr: boolean = false;

  public pageSelectorUser = new FormControl('10');
  public pageSelectedUser = 1;
  public pageU = new Page();

  constructor(
    private billingService: BillingService,
    private clientService: ClientService,
    private activateRoute: ActivatedRoute,
    private matterService: MatterService,
    private matterAssociationService: MatterAssociationService,
    private toastr: ToastDisplay,
    private miscService: MiscService,
    private blockService: BlockService,
    private builder: FormBuilder,
    private noteService: NoteService,
    private dialogService: DialogService,
    private modalService: NgbModal,
    private employeeService: EmployeeService,
    private clientAssociationService: ClientAssociationService,
    private misc: MiscService,
    private officeService: OfficeService,
    private personService: PersonService,
    private store: Store<fromRoot.AppState>,
    private sharedService: SharedService,
    private dmsService: DmsService,
    private indexDbService: IndexDbService,
    private router: Router,
    private pagetitle: Title,
    private placeService: PlacesService,
  ) {
    this.activateRoute.queryParams.subscribe(params => {
      this.clientId = params.clientId;
    });
    this.searchOption = new MatterListSearchOption();
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.pageEmployee.pageNumber = 0;
    this.pageEmployee.size = 10;
    this.pageM.pageNumber = 0;
    this.pageM.size = 10;

    this.pageU.pageNumber = 0;
    this.pageU.size = 10;
    this.getDoNotContactReasons();
    this.permissionList$ = this.store.select('permissions');
    this.salutationArr = [{ name: 'Mr.' }, { name: 'Mrs.' }];

    this.userInfo = UtilsHelper.getLoginUser();
  }

  get individualContactFormControls() {
    return this.IndividualContactForm.controls;
  }

  ngOnInit() {
    this.exter_doc_email = this.errorData.external_doc_portal_email;
    this.conflict_header_msg = this.errorData.normal_conflict;
    this.conflict_body_msg = this.errorData.changes_potential_conflict;
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.getClientDetail();
    this.getInvoiceList();
    this.clientService
      .v1ClientGetClientUniqueNumberGet({ tenantId: this.userInfo.tenantId })
      .subscribe((data: any) => {
        this.uniqueContactNumber = JSON.parse(data).results.uniqueNumber;
      });
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });

    this.tuckerAllenAccountSubscription = this.sharedService.isTuckerAllenAccount$.subscribe(
      res => {
        this.isTuckerAllenUser = res;
      }
    );
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

  private getClientDetail() {
    if (this.genInfoUpdated) {
      this.genInfoLoading = true;
      this.clientLoading = true;
    }
    if (this.contactInfoUpdated) {
      this.contactInfoLoading = true;
      this.clientLoading = true;
    }
    if (this.matterInfoUpdate) {
      this.matterInfoLoading = true;
    }
    this.activateRoute.queryParamMap
      .pipe(
        switchMap(params => {
          this.clientId = +params.get('clientId');
          if (this.clientId) {
            this.getStatusList();
            this.checkBlockedMatters();
            return this.clientService.v1ClientClientIdGet({
              clientId: +this.clientId
            });
          } else {
            this.pageLoading = false;
            return throwError('Please select a valid Client');
          }
        }),
        map(res => {
          return JSON.parse(res as any).results as any;
        })
      )
      .subscribe(
        client => {
          this.pageLoading = false;
          this.client = client;
          if (this.client && this.client.primaryOffice) {
            this.primaryOfficeId = this.client.primaryOffice.id;
          }
          this.primaryContact = this.getPrimaryContact('Primary Contact');
          this.getMatterDetails();
          this.getMatterList();
          if (this.client.isCompany) {
            this.namelength = (client.companyName).toString().length;
            this.pagetitle.setTitle(this.client.companyName);
            this.alltabs1 = [
              'Corporate Contacts',
              'Matters',
              'Associations',
              'Blocked Users',
              'Billing'
            ];
            this.getCorporateContact();
            this.getContactType();
          } else {
            this.namelength = (client.firstName || '').length + (client.lastName || '').length + 1;
            this.pagetitle.setTitle(
              this.client.lastName
                ? this.client.firstName + ' ' + this.client.lastName
                : this.client.firstName
            );
            this.alltabs1 = [
              'Matters',
              'Associations',
              'Blocked Users',
              'Billing'
            ];
          }
          this.clientLoading = false;
          this.genInfoLoading = false;
          this.genInfoUpdated = false;
          this.contactInfoLoading = false;
          this.contactInfoUpdated = false;
          this.matterInfoLoading = false;
          this.matterInfoUpdate = false;
          if (this.permissionList.CLIENT_CONTACT_MANAGEMENTisNoVisibility) {
            let cindex = UtilsHelper.getIndex(
              'Corporate Contacts',
              this.alltabs1
            );
            this.alltabs1.splice(cindex, 1);
            cindex = UtilsHelper.getIndex('Associations', this.alltabs1);
            this.alltabs1.splice(cindex, 1);
          }

          if (this.permissionList.MATTER_MANAGEMENTisNoVisibility) {
            const cindex = UtilsHelper.getIndex('Matters', this.alltabs1);
            this.alltabs1.splice(cindex, 1);
          }

          this.selecttabs1 = this.alltabs1[0];
          const primaryAddressobj = this.client.addresses.filter(
            (obj: { addressTypeId: any }) => obj.addressTypeId === 1
          );
          this.officeState =
            primaryAddressobj && primaryAddressobj[0]
              ? primaryAddressobj[0].state
              : null;
        },
        error => {
          this.pageLoading = false;
          if (typeof error === 'string') {
            this.clientLoading = false;
            this.genInfoLoading = false;
            this.genInfoUpdated = false;
            this.contactInfoLoading = false;
            this.contactInfoUpdated = false;
            this.matterInfoLoading = false;
            this.matterInfoUpdate = false;
            this.toastr.showError(error);
          } else {
            console.log(error);
            this.clientLoading = false;
            this.genInfoLoading = false;
            this.genInfoUpdated = false;
            this.contactInfoLoading = false;
            this.contactInfoUpdated = false;
            this.matterInfoLoading = false;
            this.matterInfoUpdate = false;
          }
        }
      );
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }

    if (this.refreshVendorSub) {
      this.refreshVendorSub.unsubscribe();
    }

    if (this.refreshSubsidiarySub) {
      this.refreshSubsidiarySub.unsubscribe();
    }

    if (this.tuckerAllenAccountSubscription) {
      this.tuckerAllenAccountSubscription.unsubscribe();
    }
  }

  private getMatterList() {
    this.matterService
      .v1MatterClientClientIdGet({
        clientId: this.clientId,
        allStatus: true
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwMatterResponse[];
        }),
        finalize(() => { })
      )
      .subscribe(
        res => {
          this.removeSelection();
          this.originalMatterList = res;
          this.matterList = [...this.originalMatterList];
          if (this.matterList && this.matterList.length > 0) {
            this.matterList.map(obj => {
              if (obj.responsibleAttorny && obj.responsibleAttorny.length > 0) {
                obj.rname = obj.responsibleAttorny[0].name;
              }
            });
            this.getOfficeList();

            this.calcTotalPagesM();
          }
        },
        () => {
          this.toastr.showError(
            'Some Error Occured while fetching matters List',
          );
        }
      );
  }

  private checkBlockedMatters() {
    const profile = localStorage.getItem('profile');
    if (profile) {
      this.clientService
        .v1ClientBlockedUserClientIdGet({ clientId: this.clientId })
        .subscribe(
          suc => {
            const res: any = suc;
            this.originalblockUserList = JSON.parse(res).results || [];

            this.originalblockUserList = this.originalblockUserList.sort(
              (a, b) => a.lastName.localeCompare(b.lastName)
            );

            this.originalblockUserList.forEach(employee => {
              employee.fullName = employee.lastName
                ? employee.lastName + ', ' + employee.firstName
                : employee.firstName;
            });

            this.blockUserList = [...this.originalblockUserList];
            this.updateDatatableUserFooterPage();
          },
          err => {
            console.log(err);
          }
        );
    }
  }

  private getStatusList() {
    this.matterService
      .v1MatterStatusesGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        }),
        finalize(() => { })
      )
      .subscribe(
        res => {
          this.statusList = res;
        },
        () => {
          this.toastr.showError(
            'Some Error Occured while fetching Status List',
          );
        }
      );
  }

  private getOfficeList() {
    this.miscService
      .v1MiscOfficesGet({})
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        }),
        finalize(() => { })
      )
      .subscribe(
        res => {
          this.officeList = res;
        },
        () => {
          this.toastr.showError(
            'Some Error Occured while fetching Office List',
          );
        }
      );
  }

  /**
   * Change Page size from Paginator
   */

  changePageSize() {
    this.page.size = this.pageSelector.value;
    this.calcTotalPages();
  }
  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.calcTotalPages();
    }
  }

  /**
   * Handle change page number
   */

  public pageChange(e) {
    this.pageSelected = e.page;
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  private calcTotalPages() {
    this.page.totalElements = this.corporateContactList.length;
    this.page.totalPages = Math.ceil(this.corporateContactList.length / this.page.size);
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    UtilsHelper.aftertableInit();
  }

  public clearDate() {
    this.searchOption.openDate = null;
    this.applyFilter();
  }

  public applyFilter() {
    if (this.searchOption && this.originalMatterList) {
      this.matterList = this.originalMatterList.filter(a => {
        let matching = true;

        if (+this.searchOption.officeId > 0 && a.primaryOffice) {
          matching =
            matching && a.primaryOffice.id === this.searchOption.officeId;
        }

        if (this.searchOption.statusId && a.status) {
          matching = matching && a.status.id === this.searchOption.statusId;
        }

        return matching;
      });

      this.calcTotalPagesM();
    }
  }

  clearValue() {
    this.searchOption.openDate = null;
    this.applyFilter();
  }

  /**
   * select rows
   *
   */
  public onSelect({ selected }) {
    this.selectedMatterList.splice(0, this.selectedMatterList.length);
    this.selectedMatterList.push(...selected);
  }

  getName(user: vwAttorneyViewModel) {
    if (user) {
      return user.lastName + ', ' + user.firstName;
    } else {
      return '';
    }
  }

  clickEvent1() {
    this.status1 = !this.status1;
  }

  cancelClickEvent1() {
    this.status1 = !this.status1;
  }

  keyPressOnDateField($event: KeyboardEvent) {
    $event.preventDefault();
  }

  public updateFilterMatter() {
    if (this.primaryOfficeModel >= 0) {
      const searchString = this.searchString;
      const temp = this.oriArr.filter(
        item =>
          this.matchName(item, searchString, 'rank') ||
          this.matchName(item, searchString, 'firstName') ||
          this.matchName(item, searchString, 'lastName') ||
          this.matchName(item, searchString, 'email') ||
          this.matchName(item, searchString, 'primaryOffice')
      );
      this.getAttorneys(this.primaryOfficeModel);

      this.rows = temp;
      this.updateDatatableFooterPage();
    } else {
      this.toastr.showError('Please select primary law office first.');
    }
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.rows.length;
    this.page.totalPages = Math.ceil(this.rows.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
  }

  private matchName(
    item: any,
    searchValue: string,
    fieldName: string
  ): boolean {
    let searchName;
    if (fieldName === 'createdBy' || fieldName === 'primaryOffice') {
      searchName =
        item[fieldName] && item[fieldName]['name']
          ? item[fieldName]['name'].toString().toUpperCase()
          : '';
    } else {
      searchName = item[fieldName]
        ? item[fieldName].toString().toUpperCase()
        : '';
    }
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  open(content: any, className, winClass = '') {
    this.modalRef = this.modalService.open(content, {
      size: className,
      windowClass: winClass,
      centered: true,
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
    this.uniqueContactNumber = this.uniqueContactNumber - 1;
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  public getInvoiceList() {
    this.billingService
      .v1BillingInvoicedeliveryListGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.invoicePrefList = res;
        } else {
          this.invoicePrefList = [];
        }
      });
  }

  public editGeneralInfo(content) {
    if (!this.client.isCompany) {
      this.IndividualContactForm.patchValue({
        uniqueNumber: +this.client.uniqueNumber,
        salutation: this.client.salutation,
        firstName: this.client.firstName,
        middleName: this.client.middleName,
        lastName: this.client.lastName,
        suffix: this.client.suffix,
        formerName: this.client.formerName,
        gender: this.client.gender,
        notifyEmail: this.client.notifyEmail,
        notifySMS: this.client.notifySmS,
        marketingEmail: this.client.marketingEmail,
        marketingSMS: this.client.marketingSMS,
        changeNotes: '',
        initialContactDate: this.client.initialContactDate
          ? new Date(this.client.initialContactDate)
          : new Date(),
        createdBy: this.client.createdBy,
        personFormBuilder: {
          isDeceased:
            this.client.personFormBuilder &&
              this.client.personFormBuilder.isDeceased
              ? this.client.personFormBuilder.isDeceased
              : null,
          spouseFirstName:
            this.client.personFormBuilder &&
              this.client.personFormBuilder.spouseFirstName
              ? this.client.personFormBuilder.spouseFirstName
              : '',
          spouseMiddleName:
            this.client.personFormBuilder &&
              this.client.personFormBuilder.spouseMiddleName
              ? this.client.personFormBuilder.spouseMiddleName
              : '',
          spouseLastName:
            this.client.personFormBuilder &&
              this.client.personFormBuilder.spouseLastName
              ? this.client.personFormBuilder.spouseLastName
              : '',
          spouseGender:
            this.client.personFormBuilder &&
              this.client.personFormBuilder.spouseGender
              ? this.client.personFormBuilder.spouseGender
              : null,
          spouseIsDeceased:
            this.client.personFormBuilder &&
              this.client.personFormBuilder.spouseIsDeceased
              ? this.client.personFormBuilder.spouseIsDeceased
              : null,
          prospectFirstName:
            this.client.personFormBuilder &&
              this.client.personFormBuilder.prospectFirstName
              ? this.client.personFormBuilder.prospectFirstName
              : '',
          prospectMiddleName:
            this.client.personFormBuilder &&
              this.client.personFormBuilder.prospectMiddleName
              ? this.client.personFormBuilder.prospectMiddleName
              : '',
          prospectLastName:
            this.client.personFormBuilder &&
              this.client.personFormBuilder.prospectLastName
              ? this.client.personFormBuilder.prospectLastName
              : '',
          prospectRelationship:
            this.client.personFormBuilder &&
              this.client.personFormBuilder.prospectRelationship
              ? this.client.personFormBuilder.prospectRelationship
              : '',
          prospectGender:
            this.client.personFormBuilder &&
              this.client.personFormBuilder.prospectGender
              ? this.client.personFormBuilder.prospectGender
              : null,
          prospectIsDeceased:
            this.client.personFormBuilder &&
              this.client.personFormBuilder.prospectIsDeceased
              ? this.client.personFormBuilder.prospectIsDeceased
              : null
        }
      });
    } else {
      this.CorporateContactForm.patchValue({
        uniqueNumber: +this.client.uniqueNumber,
        initialContactDate: this.client.initialContactDate
          ? new Date(this.client.initialContactDate)
          : new Date(),
        companyName: this.client.companyName,
        isCompany: this.client.isCompany,
        createdBy: this.client.createdBy,
        notifyEmail: this.client.notifyEmail,
        notifySMS: this.client.notifySmS,
        marketingEmail: this.client.marketingEmail,
        marketingSMS: this.client.marketingSMS,
        changeNotes: ''
      });
    }

    this.open(content, 'lg');
  }

  public editContactInfo(content) {
    // this.getState();

    const primaryAddressobj = this.client.addresses.filter(
      (obj: { addressTypeId: any }) => obj.addressTypeId === 1
    );

    const primaryAddress: any =
      primaryAddressobj.length !== 0 ? primaryAddressobj[0] : {};
    const phone1 =
      this.client.phones.filter((obj: { isPrimary: boolean }) => obj.isPrimary)
        .length > 0
        ? this.client.phones.filter(
          (obj: { isPrimary: boolean }) => obj.isPrimary
        )[0].number
        : '';

    const phone2 =
      this.client.phones.filter((obj: { isPrimary: boolean }) => !obj.isPrimary)
        .length > 0
        ? this.client.phones.filter(
          (obj: { isPrimary: boolean }) => !obj.isPrimary
        )[0].number
        : '';
    this.ContactForm.patchValue({
      primaryPhoneNumber: phone1,
      cellPhoneNumber: phone2,
      email: this.client.email,
      primaryAddress: primaryAddress.address,
      primaryAddress2: primaryAddress.address2,
      primaryCity: primaryAddress.city,
      primaryState: primaryAddress.state,
      primaryZipCode: primaryAddress.zip,
      preferredContactMethod: this.client.preferredContactMethod,
      doNotContactReason: this.client.doNotContactReason,
      doNotContact: this.client.doNotContact,
      changeNotes: ''
    });
    this.singleState = primaryAddress.state;
    this.getCityState(primaryAddress.zip, true);
    this.markDoNotContact(this.client.doNotContact);
    this.ContactForm.controls.doNotContact.valueChanges.subscribe(value => {
      this.markDoNotContact(value);
    });
    if (this.client.isCompany) {
      this.ContactForm.controls.primaryPhoneNumber.clearValidators();
      this.ContactForm.controls.email.clearValidators();
      this.ContactForm.updateValueAndValidity();
    }
    this.open(content, 'lg');
    setTimeout(() => {
      this.enablePrefferedContact();
    }, 500);
  }

  // public getState() {
  //   this.misc.v1MiscStatesGet$Response({}).subscribe(
  //     suc => {
  //       const res: any = suc;
  //       this.stateList = JSON.parse(res.body).results;
  //     },
  //     err => {
  //       console.log(err);
  //       this.editLawInfoLoading = false;
  //     }
  //   );
  // }

  public getPrimaryContact(type) {
    return this.client.corporateContacts.filter((obj: { code: any }) => obj.code === type)[0]
  }

  goToPrimaryContact() {
    this.modalService.dismissAll();
    this.router.navigate(['/contact/create-corporate-contact'], { queryParams: { contactId: this.primaryContact.id, state: 'edit' } })
  }

  public editOfficeInfo(content) {
    this.editLawInfoLoading = true;
    // this.getState();
    this.getlawoffices();
    this.getPracticeAreas();
    this.getprimarylawoffices();
    this.getAttorney();
    this.MatterForm.patchValue({
      officeId:
        this.client.consultationLawOffice !== null
          ? this.client.consultationLawOffice.id
          : 0,
      primaryOffice:
        this.client.primaryOffice && this.client.primaryOffice.id
          ? this.client.primaryOffice.id
          : null,
      changeNotes: ''
    });

    if (this.client.primaryOffice !== null) {
      this.getAttorneys(this.client.primaryOffice.id);
    }
    if (this.client.responsibleAttorneys.length > 0) {
      this.selected = this.client.responsibleAttorneys[0].id;
    }
    (this.primaryOfficeModel =
      this.client.primaryOffice && this.client.primaryOffice.id
        ? this.client.primaryOffice.id
        : null),
      this.open(content, 'lg');
  }

  public getAttorneys(officeId) {
    if (!this.editLawInfoLoading) {
      this.attorneyLoading = true;
    }
    const param = { group: 'attorney', search: this.searchString, officeId };
    this.officeService.v1OfficeResponsibleattroneyGet(param).subscribe(
      suc => {
        const res: any = suc;
        let arr = JSON.parse(res).results;
        arr = arr.filter(obj => obj.rank !== -1);
        let list = arr.sort(this.compare);
        let newList = [];
        list.forEach(attorney => {
          attorney.personState.forEach(state => {
            if (state.code === this.officeState) {
              newList.push(attorney);
            }
          });
        });

        this.attorneyList = newList;
        this.editLawInfoLoading = false;
        this.attorneyLoading = false;
      },
      err => {
        console.log(err);
        this.editLawInfoLoading = false;
        this.attorneyLoading = false;
      }
    );
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

  public getPracticeAreas() {
    this.misc.v1MiscPracticesGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        this.practiceAreaList = JSON.parse(res.body).results;
        const id = this.practiceAreaList
          .filter((obj: { name: any }) => obj.name === this.client.practice)
          .map(({ id }) => id);
        if (id.length !== 0) {
          this.selectedPractice = id[0];
          this.getMatterType(id[0]);
        }
      },
      err => {
        console.log(err);
        this.editLawInfoLoading = false;
      }
    );
  }

  public getMatterType(id) {
    this.matterService.v1MatterTypesPracticeIdGet({ practiceId: id }).subscribe(
      suc => {
        const res: any = suc;
        this.matterTypeList = JSON.parse(res).results;
        if (this.matterTypeList.length !== 0) {
          this.MatterForm.get('matterTypeId').enable();
        } else {
          this.MatterForm.get('matterTypeId').disable();
        }
      },
      err => {
        console.log(err);
      }
    );
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
          this.editLawInfoLoading = false;
        },
        err => {
          console.log(err);
          this.editLawInfoLoading = false;
        }
      );
  }

  public getprimarylawoffices() {
    this.officeService.v1OfficeTenantGet().subscribe(
      suc => {
        const res: any = suc;
        const listData = JSON.parse(res).results;
        if (listData && listData.length > 0) {
          this.primaryLawOfficeList = listData.filter(item => item.status === 'Active' || item.status === 'Open');
        }
        this.primaryLawOfficeResponsibleList = this.primaryLawOfficeList;
        const defaultAll: any = { id: 0, officeName: 'All' };
        this.primaryLawOfficeResponsibleList.push(defaultAll);

        this.primaryLawOfficeResponsibleList = this.primaryLawOfficeResponsibleList.sort(
          (a, b) => {
            return a.id - b.id;
          }
        );
      },
      err => {
        console.log(err);
        this.editLawInfoLoading = false;
      }
    );
  }

  public getMatterTypes() {
    this.matterService.v1MatterTypesGet$Response({}).subscribe(
      suc => {
        this.dstatusList = JSON.parse(suc.body as any).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  public updateGenInfo() {
    if (this.client.isCompany) {
      this.corporateContactFormSubmitted = true;
      if (!this.CorporateContactForm.valid) {
        return;
      }
    } else {
      this.individualContactFormSubmitted = true;
      if (!this.IndividualContactForm.valid) {
        return;
      }
    }
    this.loading = true;
    const data =
      this.client.isCompany === false
        ? { ...this.IndividualContactForm.value }
        : { ...this.CorporateContactForm.value };
    if (this.IndividualContactForm.dirty || this.CorporateContactForm.valid) {
      const item = JSON.parse(JSON.stringify(this.client));
      item.salutation = data.salutation;
      item.firstName = data.firstName;
      item.middleName = data.middleName;
      item.lastName = data.lastName;
      item.suffix = data.suffix;
      item.formerName = data.formerName;
      item.gender = data.gender;
      item.companyName = data.companyName;
      item.changeStatusNotes = data.changeNotes;
      item.notifyEmail = data.notifyEmail;
      item.notifySMS = data.notifySMS;
      item.marketingEmail = data.marketingEmail;
      item.marketingSMS = data.marketingSMS;
      if (data.personFormBuilder && this.isTuckerAllenUser) {
        item.personFormBuilder = data.personFormBuilder;
        item.personFormBuilder.personId = +this.clientId;
      }
      this.clientService.v1ClientPost$Json({ body: item }).subscribe(
        response => {
          const res = JSON.parse(response as any);
          if (res.results === 0) {
            this.toastr.showError(this.errorData.email_exist);
            this.loading = false;
          } else {
            this.IndividualContactForm.reset();
            this.CorporateContactForm.reset();
            this.toastr.showSuccess(
              'General Information updates are reflected on the page.'
            );
            this.modalRef.close();
            this.modalService.dismissAll();
            this.genInfoUpdated = true;
            this.getClientDetail();
            this.individualContactFormSubmitted = false;
            this.corporateContactFormSubmitted = false;
            this.loading = false;
          }
        },
        err => {
          this.individualContactFormSubmitted = false;
          this.corporateContactFormSubmitted = false;
          this.loading = false;
        }
      );
    } else {
      this.modalRef.close();
      this.individualContactFormSubmitted = false;
      this.corporateContactFormSubmitted = false;
      this.loading = false;
    }
  }

  public closeContactInfo() {
    this.emailExistence = false;
    this.ContactForm.reset();
    this.contactFormSubmitted = false;
    this.modalService.dismissAll('Cross click');
  }

  public updateContactInfo() {
    this.contactFormSubmitted = true;
    if (this.ContactForm.invalid) {
      return;
    }
    const data = { ...this.ContactForm.value };

    this.miscService
      .v1MiscEmailCheckGet({ email: data.email, id: +this.client.id })
      .subscribe((result: any) => {
        this.emailExistence = JSON.parse(result).results;
        if (!this.emailExistence) {
          const item = JSON.parse(JSON.stringify(this.client));
          const address: any = [];
          const phones: any = [];
          const primaryAddressobj = this.client.addresses.filter(
            (obj: { addressTypeId: any }) => obj.addressTypeId === 1
          );
          const indexOfState = this.stateList.indexOf(data.primaryState);
          address.push({
            address: data.primaryAddress,
            address2: data.primaryAddress2,
            addressTypeId: 1,
            addressTypeName: 'Primary',
            city: data.primaryCity,
            id: primaryAddressobj.length !== 0 ? +primaryAddressobj[0].id : 0,
            name: primaryAddressobj.length !== 0 ? primaryAddressobj[0].name : '',
            state: this.ContactForm.get('primaryState').value,
            zip: data.primaryZipCode
          });

          const primarycontact = this.client.phones.filter(
            (obj: { isPrimary: any }) => obj.isPrimary
          );
          const cellcontact = this.client.phones.filter(
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
          item.doNotContactReason = data.doNotContactReason;
          this.contactInfoUpdated = true;
          this.updateContact(item);
        } else {
          return;
        }
      });
  }

  async checkEmailExistence() {
    this.emailExistence = false;
    const email = this.ContactForm.value.email;
    if (email && email.trim() != '' && !this.client.isCompany) {
      if (this.ContactForm.controls.email.valid) {
        this.miscService
          .v1MiscEmailCheckGet({ email, id: +this.client.id })
          .subscribe((result: any) => {
            this.emailExistence = JSON.parse(result).results;
          });
      }
    }
  }

  async checkEmailExistenceForCorporateContact() {
    this.emailExistenceForCorporateContact = false;
    const email = this.vendorForm.value.email;
    if (email && email.trim() !== '') {
      if (!this.vendorForm.value.Id) {
        this.emailExistenceForCorporateContact = this.corporateContactList.some(
          corporateContact => {
            return corporateContact.email === email;
          }
        );
        if (this.emailExistenceForCorporateContact) {
          return;
        } else {
          if (this.vendorForm.controls.email.valid) {
            this.miscService
              .v1MiscEmailCheckGet({ email, id: 0 })
              .subscribe((result: any) => {
                this.emailExistenceForCorporateContact = JSON.parse(
                  result
                ).results;
              });
          }
        }
      } else {
        this.emailExistenceForCorporateContact = this.corporateContactList.some(
          corporateContact => {
            return (
              corporateContact.email === email &&
              corporateContact.id !== this.vendorForm.value.Id
            );
          }
        );
        if (this.emailExistenceForCorporateContact) {
          return;
        } else {
          if (this.vendorForm.controls.email.valid) {
            const id = this.vendorForm.value.Id ? this.vendorForm.value.Id : 0;
            this.miscService
              .v1MiscEmailCheckGet({ email, id })
              .subscribe((result: any) => {
                this.emailExistenceForCorporateContact = JSON.parse(
                  result
                ).results;
              });
          }
        }
      }
    }
  }

  public updateMatterInfo() {
    this.matterFormSubmitted = true;
    if (this.MatterForm.invalid) {
      return;
    }
    this.editLawInfoLoading = true;
    const data = { ...this.MatterForm.value };
    const item = JSON.parse(JSON.stringify(this.client));
    item.primaryOffice = { id: data.primaryOffice, name: '' };
    item.changeStatusNotes = data.changeNotes;
    item.consultationLawOffice = { id: data.officeId };
    if (this.selected !== 0) {
      item.initialConsultAttoney = this.selected;
      item.responsibleAttorneys = [];
      item.responsibleAttorneys.push({ id: this.selected, name: '' });
    }
    this.matterInfoUpdate = true;
    this.updateContact(item);
  }

  public updateContact(item) {
    this.clientService.v1ClientPost$Json({ body: item }).subscribe(
      async response => {
        const res = JSON.parse(response as any);
        try {
          const obj = {
            personId: +this.clientId,
            securityGroupId: 0,
            role: 'client'
          };
          await this.dmsService
            .v1DmsUpdateDocumentportalPost$Json({ body: obj })
            .toPromise();
        } catch (e) {
          this.contactLoading = false;
          this.editLawInfoLoading = true;
          this.contactFormSubmitted = false;
        }

        if (res.results === 0) {
          this.toastr.showError(this.errorData.server_error);
          this.contactLoading = false;
          this.contactFormSubmitted = false;
          this.editLawInfoLoading = true;
        } else {
          this.contactLoading = false;
          this.contactFormSubmitted = false;
          this.editLawInfoLoading = true;
          this.IndividualContactForm.reset();
          this.ContactForm.reset();
          this.MatterForm.reset();
          this.toastr.showSuccess('Client Updated.');
          this.getClientDetail();
          this.modalRef.close();
          this.searchString = '';
        }
      },
      err => {
        this.contactLoading = false;
        this.contactFormSubmitted = false;
      }
    );
  }

  public onRadioSelected(resp, event) {
    this.selected = resp.id;
    this.MatterForm.patchValue({ primaryOffice: resp.officeId });
  }

  private getMatterDetails() {
    this.matterService
      .v1MatterMatterIdGet({
        matterId: this.client.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwMatterResponse;
        }),
        finalize(() => { })
      )
      .subscribe(res => {
        this.matterDetails = res;
        if (!this.matterDetails) {
          this.toastr.showError(
            this.errorData.dont_have_matter_permission,
          );
        }
      });
  }

  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || +k == 8 || +k == 9;
  }

  public getCorporateContact() {
    this.corporateContactLoading = true;
    this.clientAssociationService
      .v1ClientAssociationClientIdGet({ clientId: this.clientId })
      .subscribe(
        suc => {
          const res: any = suc;
          let list = JSON.parse(res).results;
          list = list.filter(item => {
            return item.isPrimary || item.isBilling || item.generalCounsel;
          });
          this.corporateContactOriginalList = list;
          let corporateContactListLocal = [];
          for (let i = 0; i < list.length; i++) {
            if (i === 0) {
              corporateContactListLocal.push(list[i]);
            } else {
              const contact = corporateContactListLocal.filter(
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
                corporateContactListLocal.push(list[i]);
              }
            }
          }
          this.corporateContactLoading = false;
          this.corporateContactList = [...corporateContactListLocal];
          this.calcTotalPages();
        },
        err => {
          this.corporateContactLoading = false;
          console.log(err);
        }
      );
  }

  checkEmailValid(event) {
    if (this.vendorForm.value.isPrimary || this.vendorForm.value.isPrimary) {
      this.vendorForm.controls['email'].setValidators([Validators.required]);
      this.vendorForm.controls['primaryPhone'].setValidators([
        Validators.required
      ]);
      this.vendorForm.get('email').updateValueAndValidity();
      this.vendorForm.get('primaryPhone').updateValueAndValidity();
    } else {
      if (!this.vendorForm.value.email) {
        this.vendorForm.get('email').setValue(null);
      }
      if (!this.vendorForm.value.primaryPhone) {
        this.vendorForm.get('primaryPhone').setValue(null);
      }
      this.vendorForm.get('email').clearValidators();
      this.vendorForm.get('email').updateValueAndValidity();
      this.vendorForm.get('primaryPhone').clearValidators();
      this.vendorForm.get('primaryPhone').updateValueAndValidity();
    }
  }

  public saveCorporateContact() {
    this.formSubmitted = true;
    if (this.vendorForm.invalid || this.emailExistenceForCorporateContact) {
      return;
    }
    if (!this.vendorForm.value.isBilling && !this.vendorForm.value.isPrimary && !this.vendorForm.value.isGeneral) {
      return;
    }
    if (this.vendorForm.value.isPrimary || this.vendorForm.value.isBilling) {
      if (UtilsHelper.validateEmail(this.vendorForm.value.email)) {
        this.isInvalidEmail = false;
      } else {
        this.isInvalidEmail = true;
        return;
      }
    }
    const data = { ...this.vendorForm.value };
    const item = data;
    item.person = data.firstName + ',' + data.lastName;
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
      uniqueNumber: +data.uniqueNumber,
      FirstName: data.firstName,
      LastName: data.lastName,
      Email: data.email,
      userName:
        data.email === '' || data.email == null
          ? this.getAssociationUsername(data)
          : data.email,
      password: 'password',
      PrimaryPhone: data.primaryPhone,
      CellPhone: data.cellPhone,
      JobTitle: data.jobTitle,
      isVisible: data.isVisible === true,
      Role: role
    };
    this.corporateContactLoading = true;
    this.personService.v1PersonPost$Json$Response({ body }).subscribe(
      response => {
        this.addcorpLoading = false;
        const res = JSON.parse(response.body as any);
        if (res.results === 0) {
          this.toastr.showError(this.errorData.server_error);
        }
        item.personId = res.results;
        item.role = role;
        this.setClientAssociations(res.results);
        this.corporateContactLoading = false;
        this.modalRef.close();
      },
      err => {
        this.corporateContactLoading = false;
      }
    );
  }

  public getAssociationUsername(data) {
    let time = new Date();
    let uname = data.firstName.substr(0, 3) + data.lastName.substr(0, 3);
    return time.getTime().toString() + '_' + uname;
  }

  private setClientAssociations(personId) {
    const types = [];
    const data = { ...this.vendorForm.value };
    data.isPrimary ? this.getAssociationTypeId('Primary Contact', types) : null;
    data.isBilling ? this.getAssociationTypeId('Billing Contact', types) : null;
    data.isGeneral ? this.getAssociationTypeId('General Counsel', types) : null;
    types.forEach(element => {
      const param = {
        associationTypeId: +element.id,
        clientId: +this.clientId,
        personId: +personId
      };
      this.corporateContactLoading = true;
      this.clientAssociationService
        .v1ClientAssociationPost$Json({ body: param })
        .subscribe(
          suc => {
            const res: any = suc;
            const list = JSON.parse(res).results;
            if (types[types.length - 1].id === element.id) {
              this.isEdit = false;
              this.vendorForm.reset();
              this.corporateContactLoading = false;
              this.modalRef.close();
              this.corporateContactLoading = true;
              setTimeout(() => {
                this.getCorporateContact();
              }, 500);
            }
          },
          err => {
            this.corporateContactLoading = false;
            console.log(err);
          }
        );
    });
  }

  getAssociationTypeId(name, types) {
    const id = this.contactType.filter(obj => obj.name === name);
    types.push(id[0]);
    return types;
  }

  public getContactType() {
    this.miscService.v1MiscCorporatecontactassociationsGet({}).subscribe(
      suc => {
        const res: any = suc;
        const list = JSON.parse(res).results;
        for (let i = 0; i < list.length; i++) {
          const element = list[i];
          const item = {
            id: element.id,
            name: element.name,
            checked: false
          };
          this.contactType.push(item);
        }
      },
      err => {
        console.log(err);
      }
    );
  }

  public async deleteClientAssociation(item, $event = null) {
    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }
    const resp: any = await this.dialogService.confirm(
      'Are you sure to delete this client association?',
      'Delete'
    );
    if (resp) {
      const types = this.corporateContactOriginalList.filter(
        obj => obj.personId === +item.personId
      );
      types.forEach(element => {
        this.clientAssociationService
          .v1ClientAssociationIdDelete({ id: +element.id })
          .subscribe(
            suc => {
              const res: any = suc;
              const list = JSON.parse(res).results;
              if (types[types.length - 1].id === element.id) {
                this.getCorporateContact();
              }
            },
            err => {
              console.log(err);
            }
          );
      });
    }
  }

  addCorporateContact(content: any) {
    this.formSubmitted = false;
    this.uniqueContactNumber = this.uniqueContactNumber + 1;
    this.vendorForm.reset();
    this.isEdit = false;
    this.open(content, '', 'modal-lmd');
    this.vendorForm.patchValue({
      uniqueNumber: +this.uniqueContactNumber,
      isVisible: true
    });
  }

  private prevEmail = '';
  private primaryPhone = '';

  public editCorporateContact(content, item, $event = null) {
    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }
    this.prevEmail = item.email;
    this.primaryPhone = item.primaryPhone;

    this.vendorForm.patchValue({
      uniqueNumber: +item.uniqueNumber,
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      companyName: item.companyName,
      jobTitle: item.jobTitle,
      primaryPhone: item.primaryPhone,
      cellPhone: item.cellPhone,
      isPrimary: item.isPrimary,
      isBilling: item.isBilling,
      isGeneral: item.generalCounsel,
      personId: item.personId,
      Id: item.id,
      isVisible: item.status === 'Active' ? true : false
    });

    this.isEdit = true;
    this.open(content, '', 'modal-lmd');
  }

  public updateClientAssociation() {
    this.formSubmitted = true;
    if (this.vendorForm.invalid || this.emailExistenceForCorporateContact) {
      return;
    }
    if (!this.vendorForm.value.isBilling && !this.vendorForm.value.isPrimary && !this.vendorForm.value.isGeneral) {
      return;
    }
    if (this.vendorForm.value.isPrimary || this.vendorForm.value.isBilling) {
      if (UtilsHelper.validateEmail(this.vendorForm.value.email)) {
        this.isInvalidEmail = false;
      } else {
        this.isInvalidEmail = true;
        return;
      }
    }
    const data = { ...this.vendorForm.value };
    const body = {
      FirstName: data.firstName,
      LastName: data.lastName,
      Email: data.email,
      PrimaryPhone: data.primaryPhone,
      CellPhone: data.cellPhone,
      JobTitle: data.jobTitle,
      isVisible: data.isVisible === true,
      Id: data.personId
    };
    this.corporateContactLoading = true;
    this.personService.v1PersonPut$Json({ body }).subscribe(
      suc => {
        const res: any = suc;
        const list = JSON.parse(res).results;

        if (this.primaryPhone != body.PrimaryPhone) {
          this.clientService
            .v1ClientSendEmailUpdatePhonenumberPut$Json({
              body: {
                clientId: +this.clientId,
                personId: body.Id,
                phoneNumber: body.PrimaryPhone
              }
            })
            .subscribe(res => { });
        }
        this.corporateContactLoading = false;
        this.insertanddeleteAssociation(body.Id);
      },
      err => {
        this.addcorpLoading = false;
        console.log(err);
      }
    );

    if (this.prevEmail != body.Email) {
      this.clientService
        .v1ClientSendEmailUpdateEmailPut$Json({
          body: {
            clientId: +this.clientId,
            personId: body.Id,
            newEmail: body.Email
          }
        })
        .subscribe(res => { });
    }
  }

  public insertanddeleteAssociation(personId) {
    const data = { ...this.vendorForm.value };
    const filterList = this.corporateContactOriginalList.filter(
      obj => obj.personId === personId
    );
    filterList.forEach(element => {
      this.corporateContactLoading = true;
      this.clientAssociationService
        .v1ClientAssociationIdDelete({ id: +element.id })
        .subscribe(
          () => {
            if (filterList[filterList.length - 1].id === element.id) {
              setTimeout(() => {
                this.setClientAssociations(personId);
              }, 1000);
            }
            this.getClientDetail();
          },
          err => {
            this.corporateContactLoading = false;
            console.log(err);
          }
        );
    });
  }

  private isContactExist(type) {
    let exist = false;
    if (type === 'Primary') {
      exist = this.corporateContactList.some(e => e.isPrimary);
    }
    if (type === 'Billing') {
      exist = this.corporateContactList.some(e => e.isBilling);
    }
    if (exist) {
      this.toastr.showError(
        type + ' Contact is already exists for this client.'
      );
    }
    return exist;
  }

  onBlurMethod(val: any, type: string) {
    switch (type) {
      case 'primaryPhoneNumber':
        this.primaryPhoneBlur = this.isBlur(val);
        break;

      case 'cellPhoneNumber':
        this.cellPhoneBlur = this.isBlur(val);
        break;

      default:
        break;
    }
  }

  private isBlur(val: string | any[]) {
    return val.length === 10 ? false : val.length === 0 ? false : true;
  }

  removeBlockUser(row) {
    this.dialogService
      .confirm(errorData.delete_blocked_employee_confirm, 'Delete')
      .then(res => {
        if (res) {
          const data = {
            id: row.blockId,
            personId: row.id,
            targetPersonId: this.clientId
          };

          this.blockService.v1BlockDelete$Json({ body: data }).subscribe(
            () => {
              this.toastr.showSuccess(
                this.errorData.delete_blocked_employee_success
              );
              this.checkBlockedMatters();
            },
            err => { }
          );
        }
      });
  }

  editAssociations() {
    this.addEditAssociation = true;
    window.scrollTo(0, 0);
  }

  runConflictCheck() {
    this.sharedService.clientConfictCheck$.next();
  }

  copyEmail(email: string) {
    UtilsHelper.copyText(email);
  }

  markDoNotContact(value) {
    if (value) {
      this.ContactForm.controls.preferredContactMethod.setValue('');
      this.ContactForm.controls['doNotContactReason'].setValidators([
        Validators.required
      ]);
    } else {
      this.ContactForm.controls['doNotContactReason'].clearValidators();
    }
  }

  changeTab(tab) {
    if (this.isEditRateTableModeOn) {
      if (this.isCustomBillingRate && !this.rateTables.length) {
        this.modalService.open(this.unsavedRateTableCustom, {
          windowClass: 'modal-md',
          centered: true,
          backdrop: true
        });
      } else {
        this.modalService
          .open(this.unsavedRateTable, {
            windowClass: 'modal-md',
            centered: true,
            backdrop: true
          })
          .result.then(
            () => {
              this.selecttabs1 = tab;
              this.isEditRateTableModeOn = false;
            },
            () => { }
          );
      }
    } else {
      this.selecttabs1 = tab;
    }
  }

  useEmployeeBaseRate(modalComponent) {
    this.isCustomBillingRate = false;
    modalComponent.close();
  }

  setRateTable(modalComponent) {
    modalComponent.close();
    const modalRef = this.modalService.open(RateTableModalComponent, {
      centered: true,
      backdrop: 'static',
      size: 'xl',
      windowClass: 'modal-xlg'
    });
    modalRef.componentInstance.rateTables = this.rateTables;
    modalRef.result.then(
      result => {
        this.rateTables = result;
      },
      () => { }
    );
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  /********** Enables/Disables Preferred Contact Method ******/
  public enablePrefferedContact() {
    const ele = document.getElementById('customradi31') as HTMLInputElement;
    if (!this.client.isCompany && (!this.ContactForm.value.email || this.ContactForm.controls.email.errors)) {
      if (this.ContactForm.value.preferredContactMethod == 'Email') {
        this.ContactForm.controls.preferredContactMethod.setValue('');
      }
      ele.disabled = !this.client.isCompany;
      return;
    }
    ele.disabled = false;
  }

  /**** function to open add usersmodal */
  openAddBlockedUsers() {
    let modalRef = this.modalService.open(AddBlockedUsersComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });

    modalRef.componentInstance.clientId = {
      id: this.clientId
    };

    modalRef.componentInstance.blockUserList = {
      list: this.blockUserList
    };

    modalRef.componentInstance.alreadyCompanyList = {
      list: []
    };

    modalRef.result.then(
      result => {
        if (result == true) {
          this.checkBlockedMatters();
        }
      },
      reason => { }
    );
  }
  /***** Get state and city by zip-code ****/
  public getCityState(searchString, flag = false) {
    const input = (searchString || '').trim();
    if (this.stateCitySubscription)
      this.stateCitySubscription.unsubscribe();
    if (input.length >= 3) {
      this.validZipErr = false;
      this.stateCitySubscription = this.placeService.v1PlacesZipcodeInputGet({ input })
        .pipe(debounceTime(500), map(UtilsHelper.mapData))
        .subscribe((res) => {
          if (res) {
            this.stateList = [];
            this.cityList = [];
            this.singleState = null;
            if (res.stateFullName && res.stateFullName.length)
              res.stateFullName.forEach((state, index) => this.stateList.push({ name: state, code: res.state[index] }))
            if (res.city && res.city.length)
              this.cityList = [...res.city]
            _.sortBy(this.stateList);
            _.sortBy(this.cityList);
            if (this.stateList.length == 1)
              this.singleState = this.stateList[0].name;
            if (flag) {
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
    this.ContactForm.controls.primaryState.setValue(stateIndex > -1 && this.stateList.length ? this.stateList[stateIndex].code : this.stateList[0] && this.stateList[0].code ? this.stateList[0].code || '' : '');
    this.ContactForm.controls.primaryCity.setValue(cityIndex > -1 && this.cityList.length ? this.cityList[cityIndex] : this.cityList[0] || '');
  }

  get footerHeight() {
    if (this.corporateContactList) {
      return this.corporateContactList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  get footerMHeight() {
    if (this.matterList) {
      return this.matterList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  /**
  * Change Page size from Paginator
  */

  changePageMSize() {
    this.pageM.size = this.pageMSelector.value;
    this.calcTotalPagesM();
  }
  /**
   * Change page number
   */
  public changePageM() {
    this.pageM.pageNumber = this.pageMSelected - 1;
    if (this.pageMSelected == 1) {
      this.calcTotalPagesM();
    }
    this.checkParentCheckbox();
    UtilsHelper.aftertableInit();
  }

  /**
   * Handle change page number
   */

  public pageMChange(e) {
    this.pageMSelected = e.page;
    this.changePageM();
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  calcTotalPagesM() {
    this.pageM.totalElements = this.matterList.length;
    this.pageM.totalPages = Math.ceil(this.matterList.length / this.pageM.size);
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    this.pageM.pageNumber = 0;
    this.pageMSelected = 1;
    UtilsHelper.aftertableInit();
    this.checkParentCheckbox();
  }

  /**** function to select/deselect only displayed page record */
  selectDeselectRecords() {
    this.allSelected = !this.allSelected
    this.employeesTable.bodyComponent.temp.forEach(row => {
      const index = this.matterList.findIndex(list => list.id === row.id);
      if (index > -1) {
        this.matterList[index]['selected'] = this.allSelected;
      }
      const existingIndex = this.selectedMatterList.findIndex(list => list.id === row.id);
      if (existingIndex > -1 && !row.selected) {
        this.selectedMatterList.splice(existingIndex, 1)
      } else if (row.selected && existingIndex === -1) {
        this.selectedMatterList.push(row);
      }
    })
    this.setSelected();
  }

  /******* function to select/deselect child checkbox  */
  changeChildSelection(row) {
    row.selected = !row.selected
    const existingIndex = this.selectedMatterList.findIndex(list => list.id === row.id);
    if (existingIndex > -1 && !row.selected) {
      this.selectedMatterList.splice(existingIndex, 1)
    } else if (row.selected && existingIndex === -1) {
      this.selectedMatterList.push(row);
    }
    this.setSelected();
  }

  setSelected() {
    this.matterList.forEach(list => {
      const selectedIds = this.selectedMatterList.filter(selected => selected.id === list.id);
      if (selectedIds.length > 0) {
        list['selected'] = true;
      }
    });

    this.checkParentCheckbox();
  }

  checkParentCheckbox() {
    setTimeout(() => {
      const currentArr = []
      this.employeesTable.bodyComponent.temp.forEach(row => {
        const existing = this.matterList.filter(list => list.id === row.id)[0];
        if (existing) {
          currentArr.push(existing)
        }
      });
      this.allSelected = currentArr.length && currentArr.every(row => row.selected);
    }, 100)
  }

  /*** function to remove selection */
  removeSelection() {
    if (this.matterList && this.matterList.length) {
      this.matterList.forEach(list => {
        list['selected'] = false;
      });
    }
    this.selectedMatterList = [];
    this.checkParentCheckbox();
  }

  changePageSizeUser() {
    this.pageU.size = this.pageSelectorUser.value;
    this.updateDatatableUserFooterPage();
  }
  /**
   * Change page number
   */
  public changePageUser() {
    this.pageU.pageNumber = +this.pageSelectedUser - 1;
    if (this.pageSelectedUser == 1) {
      this.updateDatatableUserFooterPage();
    }
  }

  /**
   * Handle change page number
   */

  public pageChangeUser(e) {
    this.pageSelectedUser = e.page;
    this.changePageUser();
  }

  updateDatatableUserFooterPage() {
    this.pageU.totalElements = this.blockUserList.length;
    this.pageU.totalPages = Math.ceil(this.blockUserList.length / this.pageU.size);
    this.pageU.pageNumber = 0;
    this.pageSelectedUser = 1;
    if (this.blockedUser) {
      this.blockedUser.offset = 0;
    }
  }

  get footerHeightUser() {
    if (this.blockUserList) {
      return this.blockUserList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
