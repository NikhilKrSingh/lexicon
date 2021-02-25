import { AfterViewInit, Component, EventEmitter, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { HtmlEditorService, ImageService, ResizeService, ToolbarService } from '@syncfusion/ej2-angular-richtexteditor';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, map } from 'rxjs/operators';
import Sortable from 'sortablejs';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { MatterListSearchOption, vwMatterResponse } from 'src/app/modules/models/matter.model';
import * as Constant from 'src/app/modules/shared/const';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { vwAddressDetails, vwIdName } from 'src/common/swagger-providers/models';
import { BillingService, EmployeeService, HierarchyService, MatterService, MiscService, OfficeService, PlacesService, TrustAccountService, UsioService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { IBillPeriod, IOffice, Page } from '../../models';
import { WORKING_HOURS } from '../../models/office-data';
import { vwDesignatedContact } from '../../models/vw-office-details';
import { DialogService } from '../../shared/dialog.service';
import * as errorData from '../../shared/error.json';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  providers: [ToolbarService, ImageService, ResizeService, HtmlEditorService]
})

export class DetailComponent implements OnInit, AfterViewInit, OnDestroy, IBackButtonGuard {
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  tabChanges = false;
  alltabs: string[] = [
    'Employees',
    'Matters',
    'Clients',
    'Billing',
    'Accounting',
    'Trust Accounting',
    'Notes'
  ];
  public officeAssociationList = [];
  public employeeStatusList = [];
  title1: any;
  public selectedType: any;
  public selectedStatus: any;

  selecttabs1 = this.alltabs[0];
  public officeDetails: any;
  public designatedContact: vwDesignatedContact;
  public isDesignatedContactother = false;
  public employeesList: Array<any> = [];
  public oriArr: Array<any> = [];
  public attorneysList: Array<any> = [];
  public consultAttorneyList: Array<any> = [];
  public rateList: Array<any> = [];
  public disbursementList: Array<any> = [];
  public tools: object = {
    items: [
      'Bold',
      'Italic',
      'Underline',
      '|',
      'Alignments',
      '|',
      'OrderedList',
      'UnorderedList',
      'Indent',
      'Outdent',
      'Image'
    ]
  };
  public openingDatemodel: any;
  public holidayDatemodel: any;
  modalOptions: NgbModalOptions;
  closeResult: string;
  public isLoading = false;
  public officeId;
  public ColumnMode = ColumnMode;
  public messages = {emptyMessage: Constant.SharedConstant.NoDataFound};
  public officeStatus: Array<any> = [];
  public titlePracticeArea: string = Constant.OfficeConstant.PracticeArea;
  public retainerPracticeArea: Array<number> = [];
  public practiceList: Array<IOffice> = [];
  public practiceListIC: Array<IOffice> = [];
  public stateList: Array<any> = [];
  public officeHolidayList: Array<any> = [];
  public errorData: any = (errorData as any).default;
  private modalRef: NgbModalRef;
  public currentYear: number;
  public displayYear: number;
  public currentYearPopUp: number;
  public displayYearPopUp: number;
  private sortable1: any;
  private sortable: any;
  searchMatterText = new FormControl();
  EmpSearchText = new FormControl();
  searchOption: MatterListSearchOption;
  public timeZoneDetails: {
    timeZone?: string;
    dayLightSavings?: boolean;
    timeZoneName?: string;
    timeZoneDisplayName?: string
  } = {timeZone: null, dayLightSavings: false, timeZoneName: '', timeZoneDisplayName: ''};
  @ViewChild(DatatableComponent, {static: false}) matterTable: DatatableComponent;
  matterStatusList: Array<vwIdName> = [];
  public pageMatter = new Page();
  public pageSelectorMatter = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public matterList: Array<vwMatterResponse> = [];
  originalMatterList: Array<vwMatterResponse> = [];
  selectedMatterList: Array<vwMatterResponse> = [];
  public matterPageSelected = 1;
  public counter = Array;
  public columnList: any = [];
  public stateMode = '';
  public isViewOnly = false;
  public phone1Blur = false;
  public phone2Blur = false;
  public faxBlur = false;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public editBill: boolean = false;
  public editBillUpcoming: boolean = false;
  public editOfficeFormSubmitted = false;
  public billFrequencySetting: IBillPeriod;

  public loading = true;
  public formUpdated = false;
  public selectedTab: string;
  public trustAccountForm: any;
  public isTrustAccountEnabled = true;
  public editOfficeLoading: boolean;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  errorFlagOfficeAccount = false;
  errorFlagCreditCardOfficeAccount = false;
  public matterLoading: boolean = true;
  editContactFormSubmitted: boolean;
  billingSettingsSubmitted: boolean;
  trustAccountingFormSubmitted: boolean;
  updatedOpratingAccounts:any;
  editAccounting=false;
  recall = false;
  opratingaccount = 'View';
  public isSearchLoading = false;
  public timeZones: any;
  public showEmployeeList: boolean = false;
  noEmpRec: boolean = false;
  changeNotes = false;
  loadderVisible = false;
  saveTrustAccountingData = false;
  cancelTrustAccountingData = false;
  visibleSaveCancelBtn = false;
  stateCitySubscription: any;
  cityList: any[];
  singleState: any;
  public limitArrayEmployee: Array<number> = [10, 30, 50, 100];
  public pageSelectedEmp = 1;
  @ViewChild(DatatableComponent, {static: false}) employeeTable: DatatableComponent;

  public limitArrayAttorney: Array<number> = [10, 30, 50, 100];
  public pageSelectedAtt = 1;
  @ViewChild(DatatableComponent, {static: false}) responsibleAttorneyTable: DatatableComponent;

  public limitArrayCAttorney: Array<number> = [10, 30, 50, 100];
  public pageSelectedCAtt = 1;
  @ViewChild(DatatableComponent, {static: false}) consultAttorneyTable: DatatableComponent;

  constructor(
    private modalService: NgbModal,
    private officeService: OfficeService,
    private miscService: MiscService,
    private route: ActivatedRoute,
    private builder: FormBuilder,
    private toastDisplay: ToastDisplay,
    private hierarchyService: HierarchyService,
    private dialogService: DialogService,
    private matterService: MatterService,
    private exporttocsvService: ExporttocsvService,
    private placesService: PlacesService,
    private employeeService: EmployeeService,
    private store: Store<fromRoot.AppState>,
    private billingService: BillingService,
    private trustAccountService: TrustAccountService,
    private ngxService: NgxUiLoaderService,
    private loader: NgxUiLoaderService,
    private router: Router,
    public usioService: UsioService,
    private pagetitle: Title,
  ) {
    this.route.queryParams.subscribe(params => {
      this.officeId = params.officeId;
      this.stateMode = params.state;
    });
    this.modalOptions = {
      size: 'sm',
      centered: true
    };
    this.pageMatter.pageNumber = 0;
    this.pageMatter.size = 10;
    this.empPage.size = 10;
    this.empPage.pageNumber = 0;
    this.attPage.size = 10;
    this.attPage.pageNumber = 0;
    this.cAttPage.size = 10;
    this.cAttPage.pageNumber = 0;
    this.searchOption = new MatterListSearchOption();
    this.permissionList$ = this.store.select('permissions');
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart)) {
        this.navigateAwayPressed = true;
      }
    });
  }

  public name = new FormControl('', [Validators.required, Validators.maxLength(100)]);
  public openingDate = new FormControl('', [Validators.required]);
  public statusId = new FormControl('', [Validators.required]);
  public acceptsInitialConsultation = new FormControl('', [Validators.required]);
  public street = new FormControl('', [Validators.required]);
  public address2 = new FormControl('', []);
  public city = new FormControl('', [Validators.required, Validators.maxLength(100)]);
  public state = new FormControl('', [Validators.required]);
  public zipCode = new FormControl('', [Validators.required, Validators.maxLength(6)]);
  public phone1 = new FormControl('', [Validators.required, Validators.maxLength(10)]);
  public phone2 = new FormControl('', Validators.maxLength(10));
  public fax = new FormControl('', Validators.maxLength(10));
  public timezone = new FormControl('', Validators.required);
  public echelon = new FormControl('');
  public mondayOpen = new FormControl('00:00:00');
  public mondayClose = new FormControl(Constant.OfficeConstant.DefaultDay);
  public tuesdayOpen = new FormControl(Constant.OfficeConstant.DefaultDay, []);
  public tuesdayClose = new FormControl(Constant.OfficeConstant.DefaultDay, []);
  public wednesdayOpen = new FormControl(Constant.OfficeConstant.DefaultDay, []);
  public wednesdayClose = new FormControl(Constant.OfficeConstant.DefaultDay, []);
  public thursdayOpen = new FormControl(Constant.OfficeConstant.DefaultDay, []);
  public thursdayClose = new FormControl(Constant.OfficeConstant.DefaultDay, []);
  public fridayOpen = new FormControl(Constant.OfficeConstant.DefaultDay, []);
  public fridayClose = new FormControl(Constant.OfficeConstant.DefaultDay, []);
  public saturdayOpen = new FormControl(Constant.OfficeConstant.DefaultDay, []);
  public saturdayClose = new FormControl(Constant.OfficeConstant.DefaultDay, []);
  public sundayOpen = new FormControl(Constant.OfficeConstant.DefaultDay, []);
  public sundayClose = new FormControl(Constant.OfficeConstant.DefaultDay, []);
  public officeHoursForm: FormGroup = this.builder.group({
    mondayOpen: this.mondayOpen,
    mondayClose: this.mondayClose,
    tuesdayOpen: this.tuesdayOpen,
    tuesdayClose: this.tuesdayClose,
    wednesdayOpen: this.wednesdayOpen,
    wednesdayClose: this.wednesdayClose,
    thursdayOpen: this.thursdayOpen,
    thursdayClose: this.thursdayClose,
    fridayOpen: this.fridayOpen,
    fridayClose: this.fridayClose,
    saturdayOpen: this.saturdayOpen,
    saturdayClose: this.saturdayClose,
    sundayOpen: this.sundayOpen,
    sundayClose: this.sundayClose
  });
  public editOfficeInfoForm: FormGroup = this.builder.group({
    name: this.name,
    openingDate: this.openingDate,
    statusId: this.statusId,
    acceptsInitialConsultation: this.acceptsInitialConsultation,
    echelon: this.echelon
  });
  public editContactForm: FormGroup = this.builder.group({
    address2: this.address2,
    street: this.street,
    city: this.city,
    state: this.state,
    zipCode: this.zipCode,
    phone1: this.phone1,
    phone2: this.phone2,
    fax: this.fax,
    timezone:this.timezone
  });
  public id = new FormControl(0);
  public chargeCode = new FormControl('', [Validators.required]);
  public chargeType = new FormControl('', [Validators.required]);
  public billingType = new FormControl('', [Validators.required]);
  public billingTo = new FormControl('', [Validators.required]);
  public amount = new FormControl('', [Validators.required]);
  public did = new FormControl(0);
  public dchargeCode = new FormControl('', [Validators.required]);
  public dchargeType = new FormControl('', [Validators.required]);
  public dbillingType = new FormControl('', [Validators.required]);
  public dbillingTo = new FormControl('', [Validators.required]);
  public damount = new FormControl('', [Validators.required]);
  public rateForm: FormGroup = this.builder.group({
    id: this.id,
    chargeCode: this.chargeCode,
    chargeType: this.chargeType,
    billingType: this.billingType,
    billingTo: this.billingTo,
    amount: this.amount
  });
  public disbursementTypeForm: FormGroup = this.builder.group({
    id: this.did,
    chargeCode: this.dchargeCode,
    name: this.dchargeType,
    billingTo: this.dbillingTo,
    rate: this.damount
  });
  public hid = new FormControl(0);
  public date = new FormControl('', [Validators.required]);
  public hname = new FormControl('', [Validators.required]);
  public officeHolidayForm: FormGroup = this.builder.group({
    id: this.hid,
    date: this.date,
    name: this.hname
  });
  public workingHours = WORKING_HOURS;
  public hierarchyList: Array<any> = [];
  private employeeSubscribe: Subscription;
  public filterEmployeeList: Array<any> = [];
  public searchString: string = '';
  public responsibleAttorneyType = true;
  public consultAttorneyType = true;
  public attorneyVisibilityList = [{id: 1, name: 'All Employees'}, {id: 2, name: 'Administrators and Schedulers only'}];
  public responsibleAttorneyVisibility = 2;
  public consultAttorneyVisibility = 2;
  public visibilityPermissions = false;
  public showConsultattorneyRanking = false;
  public showResponsibleattorneyRanking = false;
  public consultAttoreyArr = [];
  public sortAscLastName = true;
  public refresh: Date;
  public employeesLoader: boolean = true;
  public responsiLoader: boolean = true;
  public consLoader: boolean = true;
  public officeLocation: any = {lat: null, lon: null};
  public previousEnteredAddress: any = '';
  public officeState: string;
  public selectPageSizeEmployee = new FormControl('10');
  public empPage = new Page();
  public selectPageSizeAttorney = new FormControl('10');
  public selectPageSizeCattorney = new FormControl('10');
  public attPage = new Page();
  public cAttPage = new Page();
  public oriNotes : string;
  public validZipErr = false;

  ngOnInit() {
    if (this.stateMode === 'view') {
      this.isViewOnly = true;
    }
    this.currentYear = (new Date()).getFullYear();
    this.displayYear = (new Date()).getFullYear();
    this.currentYearPopUp = (new Date()).getFullYear();
    this.displayYearPopUp = (new Date()).getFullYear();
    this.getOfficeDetail();
    this.getEmployeesForcurrentOffice();
    this.getMatters();
    this.getBilling();
    this.getdisbursementList();
    this.initMatterSearchText();
    this.initofcEmpSearchText();
    this.getStatusList();
    this.loadTimeZones();
    this.getTenantTrustAccountStatus();
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        this.permissionList = obj.datas;
        if (obj && obj.datas) {
          if (!this.isViewOnly && !obj.datas.OFFICE_MANAGEMENTisAdmin) {
            this.toastDisplay.showPermissionError();
          }
          if (obj.datas.OFFICE_MANAGEMENTisAdmin || obj.datas.CLIENT_CONTACT_MANAGEMENTisEdit) {
            this.visibilityPermissions = true;
            this.showConsultattorneyRanking = true;
            this.showResponsibleattorneyRanking = true;
          }
        }
      }
    });
  }
  public loadTimeZones() {
    this.miscService
      .v1MiscTimezonesGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.timeZones = res;
        }
      });
  }
  updateAccounts(event){
    this.updatedOpratingAccounts = event;
  }
  updateOpratingAccounting(){
    this.loading  = true;
    let body = [];
     this.updatedOpratingAccounts.filter(acc => {
           body.push({'usioOperatingBankAccountId':acc.usioBankAccountId,id:acc.id});
    })
  this.usioService.v1UsioAddEditUsioOperatingeBankAccountsOfficePost$Json$Response({officeId:this.officeId,body:body}).subscribe((res: any) => {
    let data = JSON.parse(res.body);
    if(data.results){
      this.toastDisplay.showSuccess('Operating account updated.');
      this.opratingaccount = 'View';
      this.editAccounting = false;
      this.recall = true;
      setTimeout(() => {
        this.recall = false;
      }, 50);
      this.loading = false;
    }
  }, err => {
    this.loading = false;
  });
  }

  private getTenantTrustAccountStatus() {
    this.loader.start();
    this.trustAccountService
      .v1TrustAccountGetTrustAccountStatusGet$Response()
      .pipe(
        map(res => {
          return JSON.parse(res.body as any).results as boolean;
        }),
        finalize(() => {
          this.loader.stop();
        })
      )
      .subscribe(res => {
        if (res) {
          this.isTrustAccountEnabled = true;
        } else {
          this.isTrustAccountEnabled = false;
          let tabList = JSON.parse(JSON.stringify(this.alltabs));
          let cindex = UtilsHelper.getIndex('Trust Accounting', tabList);
          tabList.splice(cindex, 1);
          this.alltabs = tabList;
        }
      });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  /**
   * function for search matters
   */
  private initMatterSearchText() {
    this.searchMatterText.valueChanges
      .pipe(distinctUntilChanged(), debounceTime(500))
      .subscribe((text: string) => {
        text = text.trim().replace(/ +/g, ' ');
        this.searchMatterByText(text);
      });
  }

  /**
   * function for search ofcEmployees
   */
  private initofcEmpSearchText() {
    this.EmpSearchText.valueChanges
      .pipe(distinctUntilChanged(), debounceTime(500))
      .subscribe((text: string) => {
        text = text.trim().replace(/ +/g, ' ');
        this.searchFilter(text);
      });
  }

  ngAfterViewInit() {
    /*** initialize drag and drop */
    const el: any = document.getElementsByClassName('datatable-body');
    this.sortable = new Sortable(el[1], {
      swap: true,
      swapThreshold: 1,
      animation: 300,
      sort: true,
      dragoverBubble: false,
      removeCloneOnHide: true,
      disabled: true,
      onEnd: (evt) => {
        this.sortable.option('disabled', true);
        if (evt && evt.newIndex !== evt.oldIndex) {
          this.updateResponsibleAttorny(evt);
        }
      },
    });
    this.sortable1 = new Sortable(el[2], {
      swap: true,
      swapThreshold: 1,
      animation: 300,
      sort: true,
      dragoverBubble: false,
      removeCloneOnHide: true,
      disabled: true,
      onEnd: (evt) => {
        this.sortable1.option('disabled', true);
        if (evt && evt.newIndex !== evt.oldIndex) {
          this.updateConsultAttorny(evt);
        }
      },
    });
  }

  public listRank(event, type) {
    if (type === 'Responsible') {
      const el: any = document.getElementById('responsible-attorneys-sortable');
      this.sortable = new Sortable(el, {
        swap: true,
        swapThreshold: 1,
        animation: 300,
        sort: this.responsibleAttorneyType,
        dragoverBubble: false,
        removeCloneOnHide: true,
        disabled: true,
        onEnd: (evt) => {
          if (this.responsibleAttorneyType) {
            this.sortable.option('disabled', true);
            if (evt && evt.newIndex !== evt.oldIndex) {
              this.updateResponsibleAttorny(evt);
            }
          }
        },
      });
    } else {
      const el2: any = document.getElementById('consult-attorneys-sortable');
      this.sortable1 = new Sortable(el2, {
        swap: true,
        swapThreshold: 1,
        animation: 300,
        sort: this.consultAttorneyType,
        dragoverBubble: false,
        removeCloneOnHide: true,
        disabled: true,
        onEnd: (evt) => {
          if (this.consultAttorneyType) {
            this.sortable1.option('disabled', true);
            if (evt && evt.newIndex !== evt.oldIndex) {
              this.updateConsultAttorny(evt);
            }
          }
        },
      });
    }
  }

  public getOfficeDetail() {
    this.loading = true;
    this.officeService.v1OfficeIdGet({id: this.officeId}).subscribe(
      suc => {
        const res: any = suc;
        this.officeDetails = JSON.parse(res).results;
        if (this.officeDetails && this.officeDetails.practiceAreas) {
          this.officeDetails.practiceAreas = _.orderBy(this.officeDetails.practiceAreas,'name','asc');
        }
        this.pagetitle.setTitle(this.officeDetails.name);
        if(this.officeDetails && this.officeDetails.stateName) {
          this.officeState = this.officeDetails.stateName
        }
        if (this.officeDetails && this.officeDetails.address && this.officeDetails.address.lat !== null && this.officeDetails.address.lon !== null) {
          this.previousEnteredAddress = this.officeDetails.address.street;
          if (this.officeDetails.address.address2) {
            this.previousEnteredAddress += ',' + this.officeDetails.address.address2;
          }
          this.previousEnteredAddress += ',' + this.officeDetails.address.city;
          this.previousEnteredAddress += ',' + this.officeDetails.address.state;
          this.previousEnteredAddress += ',' + this.officeDetails.address.zipCode;
          this.getTimeZone();
        } else {
          this.loading = false;
        }
        this.responsibleAttorneyType = this.officeDetails.rankingView;
        this.consultAttorneyType = this.officeDetails.consultRankingView;
        this.oriNotes = this.officeDetails.notes;
      },
      err => {
        console.log(err);
        this.loading = false;
      }
    );
  }

  changeNote(){
    this.changeNotes = true;
  }

  /**
   * Get timezone
   *
   * @memberof DetailComponent
   */
  public getTimeZone() {
    this.placesService.v1PlacesTimezoneGet$Response({
      lat: this.officeDetails.address.lat,
      lon: this.officeDetails.address.lon
    }).subscribe(suc => {
      const res: any = suc;
      this.timeZoneDetails = JSON.parse(suc.body as any).results;
      this.loading = false;
    }, err => {
      this.loading = false;
      console.log(err);
    });
  }

  public getTimezoneFromAddress() {
    const addressDetails: vwAddressDetails = {};
    let addressString = '';
    addressDetails.address1 = this.editContactForm.get('street').value;
    addressDetails.address2 = this.editContactForm.get('address2').value;
    addressDetails.state = this.editContactForm.get('state').value;
    addressDetails.city = this.editContactForm.get('city').value;
    addressDetails.zipCode = this.editContactForm.get('zipCode').value;

    addressString = addressDetails.address1;
    if (addressDetails.address2) {
      addressString += ',' + addressDetails.address2;
    }
    addressString += ',' + addressDetails.city;
    addressString += ',' + addressDetails.state;
    addressString += ',' + addressDetails.zipCode;

    if (addressString !== this.previousEnteredAddress && !this.editOfficeLoading) {
      this.previousEnteredAddress = addressString;
      this.placesService.v1PlacesAddressAddressGet({address: addressString}).subscribe((res: any) => {
        if (res) {
          const places = JSON.parse(res).results;
          if (places.length && !this.editOfficeLoading) {
            this.officeLocation.placeId = places[0].place_Id;
            this.placesService.v1PlacesDetailsPlaceIdGet({placeId: this.officeLocation.placeId}).subscribe((data: any) => {
              if (data) {
                const location = JSON.parse(data).results;
                if (location && !this.editOfficeLoading) {
                  this.officeLocation.lat = location.lat;
                  this.officeLocation.lon = location.lng;
                  this.placesService.v1PlacesTimezoneGet(this.officeLocation).subscribe((timezoneData: any) => {
                    this.timeZoneDetails = JSON.parse(timezoneData).results;
                  });
                }
              }
            });
          }
        }
      });
    }
  }

  private getList(list: any[]) {
    const returnList = [];
    for (let i = 0; i < list.length; i++) {
      returnList.push({id: i + 1, name: list[i]});
    }
    return returnList;
  }

  public getSelectedStatus(event) {
    this.title1 = '';
    if (event.length > 0) {
      this.title1 = event.length;
    } else {
      this.title1 = 'All';
    }
  }

  emolyeeFilter() {
    let filterList = [...this.oriArr];
    if (this.selectedType) {
      filterList = filterList.filter((item) => {
        if (item.officeAssociation && this.selectedType == item.officeAssociation) {
          return item;
        }
      });
    }
    if (this.selectedStatus) {
      filterList = filterList.filter((item) => {
        if (item.status && this.selectedStatus == item.status) {
          return item;
        }
      });
    }
    if (this.searchString) {
      filterList = filterList.filter(f => {
        return (
          (f.name || '').toLowerCase().includes(this.searchString.trim().toLowerCase()) ||
          (f.email || '').toLowerCase().includes(this.searchString.trim().toLowerCase()) ||
          (f.name || '').replace(/[, ]+/g, ' ').toLowerCase().includes((this.searchString || '').replace(/[, ]+/g, ' ').toLocaleLowerCase()) || (f.name || '').split(',').reverse().join(' ').toLowerCase().includes((this.searchString || '').toLocaleLowerCase())
        );
      });
    }
    this.employeesList = [...filterList];
    this.calcTotalPagesEmp();
  }


  public getEmployeesForcurrentOffice() {
    this.employeesLoader = true;
    this.officeService.v1OfficeEmployeesOfficeIdGet({officeId: this.officeId}).subscribe(
      suc => {
        const res: any = suc;
        const result = JSON.parse(res).results;
        this.employeesList = result.filter((obj: { rank: any, roleName: any }) => obj.roleName && obj.roleName.indexOf('Employee') > -1 || obj.rank === -1);
        this.oriArr = [...this.employeesList];
        this.calcTotalPagesEmp();
        let officeAssociation = this.employeesList.filter((obj: { officeAssociation: any }) => obj.officeAssociation !== null).map(({officeAssociation}) => officeAssociation);
        officeAssociation = officeAssociation.filter(UtilsHelper.onlyUnique);
        this.officeAssociationList = this.getList(officeAssociation);

        let statusLst = this.employeesList.filter((obj: { status: any }) => obj.status !== null).map(({status}) => status);
        statusLst = statusLst.filter(UtilsHelper.onlyUnique);
        this.employeeStatusList = this.getList(statusLst);

        let unrankedAttorRes = [];
        this.attorneysList = result.filter((obj) => obj.roleName && obj.roleName.indexOf('Responsible Attorney') > -1 && obj.rank !== -1);
        unrankedAttorRes = result.filter((obj) => obj.roleName && obj.roleName.indexOf('Responsible Attorney') > -1 && obj.rank == -1);
        let unrankedAttorneys = [];
        unrankedAttorneys = result.filter((obj) => obj.roleName && obj.roleName.indexOf('Consult Attorney') > -1 && obj.consultRank == -1);
        this.consultAttorneyList = result.filter((obj) => obj.roleName && obj.roleName.indexOf('Consult Attorney') > -1 && obj.consultRank != -1);
        // this.consultAttorneyList.sort((a, b) => {
        //   return a.consultRank - b.consultRank;
        // });
        if (unrankedAttorneys && unrankedAttorneys.length) {
          unrankedAttorneys.forEach(obj => {
            this.consultAttorneyList.push(obj);
          })
        }
        if (unrankedAttorRes && unrankedAttorRes.length) {
          unrankedAttorRes.forEach(obj => {
            this.attorneysList.push(obj);
          })
        }
        this.consultAttorneyList.map((ele) => {
          if (ele.consultRank == -1) {
            ele.isDisabled = true;
          } else {
            ele.isDisabled = false;
          }
        });
        this.consultAttorneyList = [...this.consultAttorneyList];
        this.attorneysList = [...this.attorneysList];
        this.calcTotalPagesCAtt();
        this.calcTotalPagesAtt();
        this.employeesLoader = false;
        this.responsiLoader = false;
        this.consLoader = false;
      },
      err => {
        console.log(err);
        this.employeesLoader = false;
        this.responsiLoader = false;
        this.consLoader = false;
      }
    );
  }

  public getBilling() {
    this.officeService.v1OfficeRateOfficeIdGet({officeId: this.officeId}).subscribe(
      suc => {
        const res: any = suc;
        this.rateList = JSON.parse(res).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  public getdisbursementList() {

    this.officeService.v1OfficeDisbursementTypeOfficeIdGet({officeId: this.officeId}).subscribe(
      suc => {
        const res: any = suc;
        this.disbursementList = JSON.parse(res).results;
      },
      err => {

        console.log(err);
      }
    );
  }

  public getOfficeStatus() {
    this.officeService.v1OfficeOfficeStatusGet({}).subscribe(suc => {
      const res: any = suc;
      this.officeStatus = JSON.parse(res).results;
    }, err => {
      console.log(err);
    });
  }

  open(content: any, className, winClass = '') {
    this.modalRef = this.modalService.open(content, {
      size: className,
      centered: true,
      windowClass: winClass,
      backdrop: 'static'
    });
    this.modalRef.result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
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

  public getWorkingHours(open: string, close: string) {
    if (open && close) {
      if (open === close && open.includes('00:00:00') && close.includes('00:00:00')) {
        return 'Closed';
      } else if (open == close && open == '00' && close == '00') {
        return 'Closed';
      } else {
        const opening = this.tConvert(open);
        const closing = this.tConvert(close);

        return `${opening} - ${closing}`;
      }
    } else {
      return '-';
    }
  }

  public tConvert(time) {
    time = time.substr(0, 5);
    time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

    if (time.length > 1) {
      time = time.slice(0);
      time = time.slice(1);
      time[5] = +time[0] < 12 ? 'am' : 'pm'; // Set AM/PM
      time[0] = +time[0] % 12 || 12; // Adjust hours
    }
    return time.join('');
  }

  public getPractices() {
    this.miscService.v1MiscPracticesGet$Response({}).subscribe(suc => {
      const res: any = suc;
      const areas = JSON.parse(res.body).results;
      if (this.officeDetails.practiceAreas !== null) {
        this.retainerPracticeArea = this.officeDetails.practiceAreas.map(({id}) => id);
        areas.forEach(item => this.retainerPracticeArea.includes(item.id) ? item.checked = true : item.checked = false);
        this.practiceList = [...areas];
        this.retainerSelected(this.retainerPracticeArea);
      }
    }, err => {
      console.log(err);
    });
  }

  public editOfficeInfo(contant: any) {
    this.getOfficeStatus();
    this.getPractices();
    this.getHierarchy();
    this.openingDatemodel = this.officeDetails.openingDate;
    this.editOfficeInfoForm.setValue({
      name: this.officeDetails.name,
      openingDate: this.officeDetails.openingDate,
      statusId: (this.officeDetails.status) ? this.officeDetails.status.id : 0,
      acceptsInitialConsultation: this.officeDetails.acceptsInitialConsultation.toString(),
      echelon: (this.officeDetails.echelon && this.officeDetails.echelon.length > 0) ? this.officeDetails.echelon[0].id : 0
    });

    this.open(contant, '');
  }

  public retainerSelected(event) {
    this.titlePracticeArea = '';
    if (event.length > 0) {
      this.titlePracticeArea = event.length;
    } else {
      this.titlePracticeArea = Constant.OfficeConstant.PracticeArea;
    }
  }

  public onMultiSelectSelectedOptions(event) {
  }

  public clearFilterRetainer() {
    this.retainerPracticeArea = [];
    this.practiceList.forEach(item => (item.checked = false));
    this.titlePracticeArea = Constant.OfficeConstant.PracticeArea;
  }

  public editContactInfo(contant: any) {
    // this.getState();
    const phone1 = this.officeDetails.phones.filter((obj: { type: any }) => obj.type === 'Phone1').length > 0 ?
      this.officeDetails.phones.filter((obj: { type: any }) => obj.type === 'Phone1')[0].number : '';

    const phone2 = this.officeDetails.phones.filter((obj: { type: any }) => obj.type === 'Phone2').length > 0 ?
      this.officeDetails.phones.filter((obj: { type: any }) => obj.type === 'Phone2')[0].number : '';

    const fax = this.officeDetails.phones.filter((obj: { type: any }) => obj.type === 'Fax').length > 0 ?
      this.officeDetails.phones.filter((obj: { type: any }) => obj.type === 'Fax')[0].number : '';

    this.editContactForm.setValue({
      address2: this.officeDetails.address.address2,
      street: this.officeDetails.address.street,
      city: this.officeDetails.address.city,
      state: this.officeDetails.address.state,
      zipCode: this.officeDetails.address.zipCode,
      timezone:this.officeDetails.timeZone,
      phone1,
      phone2,
      fax
    });
    this.getCityState(this.officeDetails.address.zipCode, true);
    this.designatedContact = this.officeDetails.designatedContact && this.officeDetails.designatedContact.id > 0 ? {...this.officeDetails.designatedContact} : null;
    this.isDesignatedContactother = this.officeDetails.isDesignatedContactOther;

    this.open(contant, '', 'edit-office-contact-info-dialog modal-lmd');
  }

  // public getState() {
  //   this.miscService.v1MiscStatesGet$Response({}).subscribe(suc => {
  //     const res: any = suc;
  //     this.stateList = JSON.parse(res.body).results;
  //   }, err => {
  //     console.log(err);
  //   });
  // }

  public getOfficeHoliday() {
    this.officeService.v1OfficeHolidayOfficeIdGet({officeId: this.officeId}).subscribe(suc => {
      const res: any = suc;
      this.officeHolidayList = JSON.parse(res).results;
    }, err => {
      console.log(err);
    });
  }

  public editHours(contant) {
    this.officeHoursForm.setValue({
      mondayOpen: this.officeDetails.mondayOpen,
      mondayClose: this.officeDetails.mondayClose,
      tuesdayOpen: this.officeDetails.tuesdayOpen,
      tuesdayClose: this.officeDetails.tuesdayClose,
      wednesdayOpen: this.officeDetails.wednesdayOpen,
      wednesdayClose: this.officeDetails.wednesdayClose,
      thursdayOpen: this.officeDetails.thursdayOpen,
      thursdayClose: this.officeDetails.thursdayClose,
      fridayOpen: this.officeDetails.fridayOpen,
      fridayClose: this.officeDetails.fridayClose,
      saturdayOpen: this.officeDetails.saturdayOpen,
      saturdayClose: this.officeDetails.saturdayClose,
      sundayOpen: this.officeDetails.sundayOpen,
      sundayClose: this.officeDetails.sundayClose
    });
    this.getOfficeHoliday();
    this.open(contant, 'xl');
  }

  public EditOfficeHoliday(content: any, row) {
    if (row === '') {
      this.officeHolidayForm.reset();
    } else {
      this.holidayDatemodel = row.date;
      this.officeHolidayForm.setValue({
        id: row.id,
        date: row.date,
        name: row.name
      });
    }

    this.open(content, '');
  }

  public updateOfficeHoliday() {
    const data = {...this.officeHolidayForm.value};
    data.officeId = +this.officeId;
    data.date = (data.date) ? moment(data.date).format('YYYY-MM-DD') + 'T00:00:00.000Z' : null;

    if (data.date) {
      let date = new Date(data.date);

      if (date.getFullYear() != this.displayYearPopUp) {
        this.toastDisplay.showError('Please select valid date.');
        return;
      }
    }

    this.officeService.v1OfficeHolidayPut$Json({body: data}).subscribe(suc => {
      const res: any = suc;
      this.officeHolidayList = JSON.parse(res).results;
      this.reset(this.officeHolidayForm);
    }, err => {
    });
  }

  public deleteOfficeHoliday(id) {
    this.dialogService
      .confirm(
        this.errorData.delete_holiday_confirm,
        'Delete',
        'Cancel',
        'Delete Holiday'
      ).then(r => {
      if (r) {
        this.officeService.v1OfficeHolidayIdDelete({id}).subscribe(suc => {
          const res: any = suc;
          this.officeHolidayList = JSON.parse(res).results;
        }, err => {
        });
      }
    });
  }

  public insertOfficeHoliday() {
    const data = {...this.officeHolidayForm.value};
    data.id = 0;
    data.officeId = +this.officeId;

    if (data.date) {
      let date = new Date(data.date);

      if (date.getFullYear() != this.displayYearPopUp) {
        this.toastDisplay.showError('Please select valid date.');
        return;
      }
    }

    this.officeService.v1OfficeHolidayPost$Json({body: data}).subscribe(suc => {
      const res: any = suc;
      this.officeHolidayList = JSON.parse(res).results;
      this.reset(this.officeHolidayForm);
    }, err => {
    });
  }

  public reset(forms: FormGroup) {
    forms.reset();
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  public delete(id, event) {
    event.stopPropagation();
    this.dialogService
      .confirm(this.errorData.remove_item_confirm, 'Confirm', 'Cancel', 'Delete Employee', true)
      .then(res => {
        if (res) {
          this.officeService.v1OfficePersonOfficePersonIdDelete$Response({
            personId: id,
            officeId: this.officeId
          }).subscribe(suc => {
            this.getEmployeesForcurrentOffice();
            this.toastDisplay.showSuccess(errorData.employee_delete);
          }, err => {
            console.log(err);
          });
        }
      });
  }

  public getOfficeHolidayarray(item, year) {
    if (item != null) {
      item = item.filter(a => new Date(a.date).getFullYear() === year);
      if(item && item.length){
        item = _.orderBy(item, ['date'], ['asc']);
      }
    }
    return item;
  }

  public updateOfficeHours() {
    const data = {...this.officeHoursForm.value};
    const item = {hoursInformation: data};

    let isValid = this.validateWorkingHours();
    if (isValid) {
      this.updateOfficeDetail(item, this.officeHoursForm);
    }
  }

  public updateNotes() {
    this.changeNotes = false;
    const data = this.officeDetails.notes;
    const item = {officeNotes: data};
    this.officeService.v1OfficeUpdateOfficeProfileIdPut$Json({id: this.officeId, body: item}).subscribe(suc => {
      this.toastDisplay.showSuccess(errorData.office_note_update_success);
      this.getOfficeDetail();
    }, err => {
    });
  }
  public updateEmployee() {
    let practiceAreas = [];
    if (this.officeDetails && this.officeDetails.practiceAreas && this.officeDetails.practiceAreas.length > 0) {
      practiceAreas = this.officeDetails.practiceAreas.map(obj => obj.id);
    }
    const officeInformation = {
      name: this.officeDetails.name,
      statusId: (this.officeDetails.status) ? +this.officeDetails.status.id : 0,
      openingDate: this.officeDetails.openingDate,
      closingDate: this.officeDetails.closingDate,
      effectiveDate: this.officeDetails.effectiveDate,
      acceptsInitialConsultation: this.officeDetails.acceptsInitialConsultation,
      practiceAreas: practiceAreas,
      echelon: (this.officeDetails.echelon && this.officeDetails.echelon.length > 0) ? this.officeDetails.echelon[0].id : 0,
      rankAttorneys: this.responsibleAttorneyType,
      rankingView: this.responsibleAttorneyType,
      consultRankAttorneys: this.consultAttorneyType,
      consultRankingView: this.consultAttorneyType,
    }
    const item = {officeInformation: officeInformation};
    this.officeService.v1OfficeUpdateOfficeProfileIdPut$Json({id: this.officeId, body: item}).subscribe(suc => {
      this.toastDisplay.showSuccess(errorData.office_update_success);
      this.getOfficeDetail();
    }, err => {
    });
  }

  public getValue(data: IBillPeriod) {
    this.billFrequencySetting = {...data};
    this.billFrequencySetting.billFrequencyStartingDate = moment(this.billFrequencySetting.billFrequencyStartingDate).format('YYYY-MM-DD');
    this.billFrequencySetting.billFrequencyNextDate = moment(this.billFrequencySetting.billFrequencyNextDate).format('YYYY-MM-DD');
    this.billFrequencySetting.effectiveDate = moment(this.billFrequencySetting.effectiveDate).format('YYYY-MM-DD');
    if (this.billFrequencySetting.effectiveBillFrequencyNextDate) {
      this.billFrequencySetting.effectiveBillFrequencyNextDate = moment(this.billFrequencySetting.effectiveBillFrequencyNextDate).format('YYYY-MM-DD');
    }
  }

  public confirmSave() {
    this.billingSettingsSubmitted = true;
    if (
      !this.billFrequencySetting.billFrequencyQuantity ||
      !this.billFrequencySetting.billFrequencyDuration ||
      !this.billFrequencySetting.effectiveDate
    ) {
      return;
    }
    if (this.billFrequencySetting && this.billFrequencySetting.billFrequencyDurationType === 'MONTHS') {
      if (!this.billFrequencySetting.billFrequencyRecursOn) {
        return;
      }
    }
    if (this.editBillUpcoming) {
      this.dialogService
        .confirm(
          'Saving these changes will override the upcoming billing frequency settings. Are you sure you want to continue?',
          'Yes, override current settings',
          'Cancel',
          'Override Changes',
          true
        )
        .then(response => {
          if (response) {
            this.updateBilling(null);
          }
        });
    } else {
      this.updateBilling(null);
    }
  }

  public removeUpcomingFreq(eve) {
    if (eve) {
      this.updateBilling(eve);
    }
  }

  public updateBilling(evt) {
    let body = {...this.billFrequencySetting.billingSettings};
    if (evt) {
      body.effectiveBillFrequencyDay = null;
      body.effectiveBillFrequencyRecursOn = null;
      body.effectiveBillFrequencyQuantity = null;
      body.effectiveBillFrequencyDuration = null;
      body.effectiveBillFrequencyNextDate = null;
      body.effectiveBillFrequencyStartingDate = null;
      body.effectiveIsInherited = null;
      body.effectiveRepeatType = null;
      body.effectiveBillWhenHoliday = null;
      let settings = {
        billFrequencyQuantity: this.billFrequencySetting.billingSettings.billFrequencyQuantity,
        billFrequencyDurationType: this.billFrequencySetting.billingSettings.billFrequencyDuration.code,
        billFrequencyDay: this.billFrequencySetting.billingSettings.billFrequencyDay,
        billFrequencyRecursOn: this.billFrequencySetting.billingSettings.billFrequencyRecursOn,
        repeatType: this.billFrequencySetting.billingSettings.repeatType
      }
      let endDate =  moment(UtilsHelper.getEffectiveDateUpcoming(moment(this.billFrequencySetting.billingSettings.billFrequencyStartingDate).format('YYYY-MM-DD'), settings)).format('YYYY-MM-DD');
      body.billFrequencyNextDate =  endDate;
    } else {
      if (this.billFrequencySetting.effectiveDate > moment().format('YYYY-MM-DD')) {
        body.effectiveBillFrequencyDay = this.billFrequencySetting.billFrequencyDay;
        body.effectiveBillFrequencyRecursOn = this.billFrequencySetting.billFrequencyRecursOn;
        body.effectiveBillFrequencyQuantity = this.billFrequencySetting.billFrequencyQuantity;
        body.effectiveBillFrequencyDuration = {id: this.billFrequencySetting.billFrequencyDuration};
        body.effectiveBillFrequencyStartingDate = this.billFrequencySetting.effectiveDate;
        body.effectiveIsInherited = this.billFrequencySetting.isInherited;
        body.effectiveRepeatType = this.billFrequencySetting.repeatType;
        body.effectiveBillWhenHoliday = this.billFrequencySetting.billWhenHoliday;
        body.effectiveBillFrequencyNextDate = moment(UtilsHelper.getEffectiveDateUpcoming(this.billFrequencySetting.effectiveDate, this.billFrequencySetting)).format('YYYY-MM-DD');
        if (this.billFrequencySetting.effectiveDate <= moment(body.billFrequencyNextDate).format('YYYY-MM-DD')) {
          body.billFrequencyNextDate = moment(this.billFrequencySetting.effectiveDate).add(-1, 'days').format('YYYY-MM-DD');
        }
      } else {
        let effectivePeriod = UtilsHelper.getFinalEffectiveDate(this.billFrequencySetting.effectiveDate, this.billFrequencySetting);
        body.billFrequencyNextDate = this.billFrequencySetting.effectiveDate;
        body.isInherited = this.billFrequencySetting.isInherited;
        body.billFrequencyDay = this.billFrequencySetting.billFrequencyDay;
        body.billFrequencyRecursOn = this.billFrequencySetting.billFrequencyRecursOn;
        body.billFrequencyQuantity = this.billFrequencySetting.billFrequencyQuantity;
        body.billFrequencyDuration = {id: this.billFrequencySetting.billFrequencyDuration};
        body.billFrequencyStartingDate = moment(effectivePeriod.previosEffectiveDate).format('YYYY-MM-DD');
        body.billFrequencyNextDate = moment(effectivePeriod.newEffectiveDate).format('YYYY-MM-DD');
        body.repeatType = this.billFrequencySetting.repeatType;
        body.billWhenHoliday = this.billFrequencySetting.billWhenHoliday;

        body.effectiveBillFrequencyDay = null;
        body.effectiveBillFrequencyRecursOn = null;
        body.effectiveBillFrequencyQuantity = null;
        body.effectiveBillFrequencyDuration = null;
        body.effectiveBillFrequencyNextDate = null;
        body.effectiveBillFrequencyStartingDate = null;
        body.effectiveIsInherited = null;
        body.effectiveRepeatType = null;
        body.effectiveBillWhenHoliday = null;
      }
    }
    this.loadderVisible = true;
    this.loading = true;
    this.billingService
      .v1BillingSettingsPut$Json({
        body: body
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        response => {
          if (response) {
            this.toastDisplay.showSuccess(this.errorData.billing_settings_updated_success);
            this.refresh = new Date();
            this.editBill = false;
            this.editBillUpcoming = false;
            this.loadderVisible = false;
          }
        }, err => {
          this.loading = false;
          this.loadderVisible = false;
        }, () => {
          this.loading = false;
          this.loadderVisible = false;
        }
      );
  }

  public getHierarchy() {
    this.hierarchyService.v1HierarchyLowestGet({}).subscribe(suc => {
      const res: any = suc;
      this.hierarchyList = JSON.parse(res).results;

    }, err => {
      console.log(err);
    });
  }

  public updateOfficeInfo() {
    this.editOfficeFormSubmitted = true;
    if (this.editOfficeInfoForm.invalid || !this.retainerPracticeArea.length) {
      return;
    }
    this.editOfficeLoading = true;
    const data = {...this.editOfficeInfoForm.value};
    data.name = (data.name) ? data.name.trim() : '';
    if (this.retainerPracticeArea.length > 0) {
      data['PracticeAreas'] = this.retainerPracticeArea;
    }
    data.statusId = +data.statusId;
    data.acceptsInitialConsultation = data.acceptsInitialConsultation === 'true';
    data.echelon = +data.echelon;
    data['openingDate'] = (this.editOfficeInfoForm.value.openingDate) ? moment(this.editOfficeInfoForm.value.openingDate).format(Constant.SharedConstant.DateFormat)
      + Constant.SharedConstant.TimeFormat : null;
    const item = {officeInformation: data};
    this.updateOfficeDetail(item, this.editOfficeInfoForm);
  }

  public updateContactInfo() {
    this.editContactFormSubmitted = true;
    if (this.editContactForm.invalid || !this.designatedContact) {
      return;
    }
    this.editOfficeLoading = true;
    const data = {...this.editContactForm.value};
    data.id = this.officeDetails.address.id;
    if (this.designatedContact) {
      data.designatedContact = this.designatedContact;
      data.designatedContact.isOther = this.isDesignatedContactother;
    }
    this.updateOfficeDetail({contactInformation: data}, this.editContactForm);
    // const addressDetails: vwAddressDetails = {};
    // let addressString = '';
    // addressDetails.address1 = this.editContactForm.get('street').value;
    // addressDetails.address2 = this.editContactForm.get('address2').value;
    // addressDetails.state = this.editContactForm.get('state').value;
    // addressDetails.city = this.editContactForm.get('city').value;
    // addressDetails.zipCode = this.editContactForm.get('zipCode').value;

    // addressString = addressDetails.address1;
    // if (addressDetails.address2) {
    //   addressString += ',' + addressDetails.address2;
    // }
    // addressString += ',' + addressDetails.city;
    // addressString += ',' + addressDetails.state;
    // addressString += ',' + addressDetails.zipCode;

    // this.placesService.v1PlacesAddressAddressGet({address: addressString}).subscribe((res: any) => {
    //   if (res) {
    //     const places = JSON.parse(res).results;
    //     if (places.length) {
    //       this.officeLocation.placeId = places[0].place_Id;
    //       this.placesService.v1PlacesDetailsPlaceIdGet({placeId: this.officeLocation.placeId}).subscribe((placeData: any) => {
    //         if (placeData) {
    //           const location = JSON.parse(placeData).results;
    //           if (location) {
    //             this.officeLocation.lat = location.lat;
    //             this.officeLocation.lon = location.lng;
    //             this.placesService.v1PlacesTimezoneGet(this.officeLocation).subscribe((timezoneData: any) => {
    //               this.timeZoneDetails = JSON.parse(timezoneData).results;

    //               data.lat = Number(this.officeLocation.lat);
    //               data.lon = Number(this.officeLocation.lon);
    //               data.googlePlaceId = this.officeLocation.placeId;
    //               data.timezone = this.timeZoneDetails.timeZone;
    //               this.editContactFormSubmitted = false;
    //               this.updateOfficeDetail({contactInformation: data}, this.editContactForm);
    //             }, () => {
    //               this.editOfficeLoading = false;
    //               this.editContactFormSubmitted = false;
    //             });
    //           }
    //         } else {
    //           this.updateOfficeDetail({contactInformation: data}, this.editContactForm);
    //         }
    //       }, () => {
    //         this.editOfficeLoading = false;
    //         this.editContactFormSubmitted = false;
    //       });
    //     } else {
    //       this.updateOfficeDetail({contactInformation: data}, this.editContactForm);
    //     }
    //   } else {
    //     this.updateOfficeDetail({contactInformation: data}, this.editContactForm);
    //   }
    // }, () => {
    //   this.editOfficeLoading = false;
    // });
  }

  public updateOfficeDetail(item, form) {
    this.officeService.v1OfficeUpdateOfficeProfileIdPut$Json({id: this.officeId, body: item}).subscribe(suc => {
      this.editOfficeLoading = false;
      this.reset(form);
      this.modalService.dismissAll();
      this.toastDisplay.showSuccess(this.errorData.office_info_edit_save);
      this.getOfficeDetail();
    }, err => {
      this.editOfficeLoading = false;
    });
  }

  startStorting(event: any): void {
    console.log('DragOver -->', event);
    // event.preventDefault()
    // this.changeSortingOption((this.responsibleAttorneyType) ? false : true);
  }

  startStortingCon(event: any): void {
    event.preventDefault()
    this.changeSortingConOption((this.consultAttorneyType) ? false : true);
  }

  endSorting(event: any): void {
    console.log('DragLeave -->', event);
    event.preventDefault()
    this.changeSortingOption(true);
  }

  endSortingCon(event: any): void {
    event.preventDefault()
    this.changeSortingConOption(true);
  }

  /**** function to change disabled option for sortable js */
  changeSortingOption(disabled: boolean): void {
    if (this.sortable) {
      this.sortable.option('disabled', disabled)
    }
  }

  /**** function to change disabled option for sortable js */
  changeSortingConOption(disabled: boolean): void {
    if (this.sortable) {
      this.sortable1.option('disabled', disabled)
    }
  }

  private updateResponsibleAttorny(event) {
    if (event) {
      this.attorneysList.splice(event.newIndex, 0, this.attorneysList.splice(event.oldIndex, 1)[0]);
    }
    if (this.attorneysList) {
      const personRank = [];
      this.attorneysList.map((obj, index) => {
        let data = {personId: obj.id, rank: index + 1};
        personRank.push(data)
      });
      let data = {officeId: +this.officeId, personRank};
      this.responsiLoader = true;
      this.updareAttorneyRank(data);
    }
  }

  private updateConsultAttorny(event) {
    if (event) {
      this.consultAttorneyList.splice(event.newIndex, 0, this.consultAttorneyList.splice(event.oldIndex, 1)[0]);
    }
    if (this.consultAttorneyList) {
      const personConsultRank = [];
      this.consultAttorneyList.map((obj, index) => {
        let data = {personId: obj.id, consultRank: (obj.consultRank == -1) ? -1 : index + 1};
        personConsultRank.push(data)
      });
      let data = {officeId: +this.officeId, personConsultRank};
      this.consLoader = true;
      this.updareAttorneyRank(data);
    }
  }

  private updareAttorneyRank(data) {
    this.officeService.v1OfficeUpdateAttorneyRankPut$Json$Response({body: data}).subscribe(suc => {
      this.getEmployeesForcurrentOffice();
    }, err => {
    });
  }


  public removeAttorneyRank(item, index) {
    this.dialogService
      .confirm((item.rank == -1) ? this.errorData.rank_respon_attorney : this.errorData.unrank_respon_attorney, 'Confirm', 'Cancel', 'Confirm', true)
      .then(res => {
        if (res) {
          this.attorneysList.splice(index, 1);
          if (this.attorneysList) {
            let personRank = [];
            if (item.rank == -1) {
              personRank.push({
                personId: item.id,
                rank: index + 1
              });
            } else {
              personRank.push({
                personId: item.id,
                rank: -1
              });
            }
            this.attorneysList.map((obj, index) => {
              personRank.push({personId: obj.id, rank: (obj.rank == -1) ? -1 : index + 1})
            });
            this.employeesLoader = true;
            const data = {officeId: +this.officeId, personRank: personRank};
            this.officeService.v1OfficeUpdateAttorneyRankPut$Json$Response({body: data}).subscribe(suc => {
              this.getEmployeesForcurrentOffice();
            }, err => {
              this.employeesLoader = false;
            });
          }
        }
      });
  }

  public removeAttorneyConRank(item, index) {
    this.dialogService
      .confirm((item.isDisabled) ? this.errorData.rank_consult_attorney : this.errorData.unrank_consult_attorney, 'Confirm', 'Cancel', 'Confirm', true)
      .then(res => {
        if (res) {
          this.consultAttorneyList.splice(index, 1);
          let personRank = [];
          if (this.consultAttorneyList) {
            if (item.consultRank == -1) {
              personRank.push({
                personId: item.id,
                consultRank: index + 1
              });
            } else {
              personRank.push({
                personId: item.id,
                consultRank: -1
              });
            }
            this.consultAttorneyList.map((obj, index) => {
              personRank.push({personId: obj.id, consultRank: (obj.consultRank == -1) ? -1 : index + 1});
            });
            this.employeesLoader = true;
            const data = {officeId: +this.officeId, personConsultRank: personRank};
            this.officeService.v1OfficeUpdateAttorneyRankPut$Json$Response({body: data}).subscribe(suc => {
              this.getEmployeesForcurrentOffice();
            }, err => {
              this.employeesLoader = false;
            });
          }
        }
      });
  }

  /** function to get matters */
  getMatters(): void {
    this.matterLoading = true;
    this.matterService.v1MatterByofficeOfficeIdGet$Response({officeId: this.officeId}).subscribe((res: any) => {
      this.matterLoading = false;
      this.matterList = JSON.parse(res.body).results;
      if (this.matterList && this.matterList.length > 0) {
        this.matterList.map(obj => {
          if (obj.clientName && (obj.clientName.company === '' || obj.clientName.company === null)) {
            obj.cname = (obj.clientName.firstName) ? obj.clientName.lastName + ', ' + obj.clientName.firstName : obj.clientName.lastName;
          } else {
            obj.cname = obj.clientName.company;
          }
          if (obj.responsibleAttorney && obj.responsibleAttorney.length > 0) {
            obj.rname = (obj.responsibleAttorney[0].firstName) ? obj.responsibleAttorney[0].lastName + ', ' + obj.responsibleAttorney[0].firstName : obj.responsibleAttorney[0].lastName;
          }
        });
        const keys = Object.keys(this.matterList[0]);
        this.columnList = UtilsHelper.addkeysIncolumnlist(keys);
      }
      this.originalMatterList = [...this.matterList];
      this.calcTotalPages();
    }, err => {
      this.matterLoading = false;
    });
  }

  /*** function to apply filter on matter */
  applyFilterMatter(): void {
    if (this.searchOption && this.originalMatterList) {
      this.matterList = this.originalMatterList.filter(a => {
        let matching = true;
        if (+this.searchOption.officeId > 0) {
          matching =
            matching &&
            a.matterPrimaryOffice &&
            a.matterPrimaryOffice.id == this.searchOption.officeId;
        }
        if (this.searchOption.openDate) {
          matching =
            matching &&
            a.matterOpenDate &&
            +new Date(a.matterOpenDate).setHours(0, 0, 0, 0) ==
            +new Date(this.searchOption.openDate).setHours(0, 0, 0, 0);
        }

        if (this.searchOption.statusId) {
          matching =
            matching &&
            a.matterStatus &&
            a.matterStatus.id == this.searchOption.statusId;
        }

        return matching;
      });
      this.calcTotalPages();
      UtilsHelper.aftertableInit();
    }
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.pageMatter.totalElements = this.matterList.length;
    this.pageMatter.totalPages = calculateTotalPages(
      this.pageMatter.totalElements,
      this.pageMatter.size
    );
    this.pageMatter.pageNumber = 0;
    this.matterPageSelected = 1;
    if (this.matterTable) {
      this.matterTable.offset = 0;
    }
    UtilsHelper.aftertableInit();
  }

  private getStatusList() {
    this.matterService
      .v1MatterStatusesGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        }),
        finalize(() => {
        })
      )
      .subscribe(
        res => {
          this.matterStatusList = res;
        },
        () => {
        }
      );
  }

  /**
   * select rows
   *
   * @param {*} { selected }
   */
  public onSelect({selected}) {
    this.selectedMatterList.splice(0, this.selectedMatterList.length);
    this.selectedMatterList.push(...selected);
  }

  /**
   * Handle change page number
   */
  public pageChangeMatter(e) {
    this.matterPageSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  /**
   * Change Page size from Paginator
   */
  changePageSize() {
    this.pageMatter.size = this.pageSelectorMatter.value;
    this.calcTotalPages();
  }

  /**
   * Change page number
   */
  public changePage() {
    this.pageMatter.pageNumber = this.matterPageSelected - 1;
    if (this.matterPageSelected == 1) {
      this.calcTotalPages();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  /**
   * search matter filter
   *
   * @param {*} event
   * @memberof ListComponent
   */
  public searchMatterByText(text: any = '') {
    const temp = this.originalMatterList.filter(
      item =>
        this.matchName(item, text, 'matterNumber') || this.matchName(item, text, 'matterName') ||
        this.matchName(item, text, 'clientName') || this.matchName(item, text, 'matterOpenDate') ||
        this.matchName(item, text, 'matterStatus') || this.matchName(item, text, 'matterType') || this.matchName(item, text, 'matterPrimaryOffice')
    );
    // update the rows
    this.matterList = temp;
    this.calcTotalPages();
  }

  private matchName(item: any, searchValue: string, fieldName): boolean {
    let searchName
    if (fieldName === 'matterStatus' || fieldName === 'matterType' || fieldName === 'matterPrimaryOffice') {
      searchName = item[fieldName] && item[fieldName]['name'] ? item[fieldName]['name'].toString().toUpperCase() : '';
    } else {
      searchName = item[fieldName] ? item[fieldName].toString().toUpperCase() : '';
    }
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  /** export to csv function for matter */
  public ExportToCSV() {
    const rows = Object.assign([], this.matterList);
    this.exporttocsvService.downloadFile(rows, this.columnList, 'MatterList');
  }

  /**
   * search employee filter
   *
   * @param {*} event
   * @memberof ListComponent
   */
  public searchFilter(text: any = '') {
    const temp1 = this.oriArr.filter(
      item =>
        this.matchEmpName(item, text, 'firstName') || this.matchEmpName(item, text, 'email') ||
        this.matchEmpName(item, text, 'jobTitle') || this.matchEmpName(item, text, 'lastName') ||
        this.matchEmpName(item, text, 'officeAssociation') || this.matchEmpName(item, text, 'Status')
    );
    // update the rows
    this.employeesList = temp1;


  }

  /**
   * search employee record from tables
   *
   * @private
   * @param {*} item
   * @param {string} searchValue
   * @param {*} fieldName
   * @returns {boolean}
   * @memberof ListComponent
   */
  private matchEmpName(item: any, searchValue: string, fieldName): boolean {
    let searchName
    searchName = item[fieldName] ? item[fieldName].toString().toUpperCase() : '';
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57 || k == 8 || k == 9);
  }

  public updateFilter(event) {
    this.noEmpRec = false;
    this.filterEmployeeList = [];
    if (
      event.keyCode === 38 ||
      event.keyCode === 40 ||
      event.keyCode === 39 ||
      event.keyCode === 37
    ) {
      return;
    }
    const val = event.target.value;
    if (this.employeeSubscribe) {
      this.employeeSubscribe.unsubscribe();
    }
    if ((val !== '') && val.length) {
      this.isSearchLoading = true;
      this.employeeSubscribe = this.employeeService
        .v1EmployeeSearchGet({search: val})
        .subscribe(
          suc => {
            const res: any = suc;
            let list = JSON.parse(res).results;
            // let newList = [];
            // list.forEach(employee => {
            //   employee.states.forEach(state => {
            //     if (state.name === this.officeState) {
            //       newList.push(employee)
            //     }
            //   })
            // })
            if(list && list.length) {
              this.filterEmployeeList = [...list];
            }
            this.filterEmployeeList.length && this.searchString.length
              ? this.noEmpRec = false : this.noEmpRec = true;
            this.isSearchLoading = false;
          },
          err => {
            this.filterEmployeeList.length && this.searchString.length
              ? this.noEmpRec = false : this.noEmpRec = true;
            this.isSearchLoading = false;
            console.log(err);
          }
        );
    } else {
      this.filterEmployeeList = [];
    }
  }

  public selectEmployee(item: any) {
    const checkExist = this.employeesList.find(x => +x.id === +item.id);
    if (!checkExist) {
      this.addPersonOffice(item);
    }
    this.searchString = '';
    this.filterEmployeeList = [];
  }

  public addPersonOffice(item, isAttorney?) {
    const obj = {
      officeId: +this.officeId,
      officeTypeId: 2,
      officeTypeName: 'Secondary',
      personId: item.id,
      rank: (item.groups.filter(({name}) => name === 'Responsible Attorney').length > 0) ? this.attorneysList.length + 1 : null,
      consultRank: (item.groups.filter(({name}) => name === 'Consult Attorney').length > 0) ? this.consultAttorneyList.length + 1 : null,
    };
    this.employeesLoader = true;
    this.officeService
      .v1OfficeAddPersonOfficePost$Json({body: obj})
      .pipe(
        finalize(() => {
        })
      )
      .subscribe(
        suc => {
          const res: any = suc;
          this.employeesLoader = false;
          this.getEmployeesForcurrentOffice();
          this.toastDisplay.showSuccess(errorData.employee_add);
        },
        err => {
          this.employeesLoader = false;
          console.log(err);
        }
      );
  }

  public onHourChange(day: string) {
    try {
      let open = this.officeHoursForm.controls[`${day}Open`].value;
      let close = this.officeHoursForm.controls[`${day}Close`];

      if (open == '00') {
        close.setValue('00');
      }
    } catch (ex) {
      console.log(ex);
    }
  }

  /**
   * Validates Working hours on click on Save Button
   */
  validateWorkingHours() {
    let days = UtilsHelper.getDayslist();

    let isValid = days.every(day => {
      let open = this.officeHoursForm.value[`${day.name.toLowerCase()}Open`];
      let close = this.officeHoursForm.value[`${day.name.toLowerCase()}Close`];

      let openIndex = this.workingHours.findIndex(a => a.value == open);
      let closeIndex = this.workingHours.findIndex(a => a.value == close);

      if (open == '00' && close == '00') {
        return true;
      } else if (open == '00' && close != '00') {
        return false;
      } else if (open != '00' && close == '00') {
        return false;
      } else {
        return openIndex < closeIndex;
      }
    });

    if (!isValid) {
      this.toastDisplay.showError(this.errorData.validation_working_hours);
      return false;
    } else {
      return true;
    }
  }


  public updateOfficeDetails() {
    if (this.officeDetails) {
      let practiceAreas = [];
      if (this.officeDetails && this.officeDetails.practiceAreas && this.officeDetails.practiceAreas.length > 0) {
        practiceAreas = this.officeDetails.practiceAreas.map(obj => obj.id);
      }
      this.officeService.v1OfficeUpdateOfficeProfileIdPut$Json({
        id: this.officeId,
        body: {
          officeInformation: {
            rankingView: this.responsibleAttorneyType,
            consultRankingView: this.consultAttorneyType,
            openingDate: this.officeDetails.openingDate,
            name: this.officeDetails.name,
            statusId: (this.officeDetails.status) ? +this.officeDetails.status.id : 0,
            practiceAreas,
            acceptsInitialConsultation: this.officeDetails.acceptsInitialConsultation
          }
        }
      }).subscribe(suc => {
      }, err => {
      });
    }
  }

  onBlurMethod(val: any, type: string) {
    type === 'phone1' ? this.phone1Blur = this.isBlur(val) :
      type === 'phone2' ? this.phone2Blur = this.isBlur(val) :
        type === 'fax' ? this.faxBlur = this.isBlur(val) : '';
  }

  private isBlur(val: string | any[]) {
    return (val.length === 10) ? false : (val.length === 0) ? false : true;
  }

  changeVisibility(event: any, type: string) {
    if (!event) {
      setTimeout(() => {
        if (type == 'responsibleAttorney') {
          this.responsibleAttorneyVisibility = 2;
        } else {
          this.consultAttorneyVisibility = 2;
        }
      }, 50);
    } else {
      if (type == 'responsibleAttorney') {
        this.showResponsibleattorneyRanking = (this.responsibleAttorneyVisibility == 2 && this.visibilityPermissions) || this.responsibleAttorneyVisibility == 1;
      } else {
        this.showConsultattorneyRanking = (this.consultAttorneyVisibility == 2 && this.visibilityPermissions) || this.consultAttorneyVisibility == 1;
      }
    }
  }

  hideConsultAttorneyRow(id: number) {
    this.consultAttorneyList.map((obj) => {
      if (obj.id == id) {
        obj.isDisabled = !obj.isDisabled;
      }
    });
  }

  sortLastname() {
    if (this.responsibleAttorneyType) {
      return;
    }
    if (this.sortAscLastName) {
      this.attorneysList.sort((a, b) => {
        var nameA = a.lastName.toLowerCase();
        var nameb = b.lastName.toLowerCase();
        if (nameA < nameb) {
          return -1;
        }
        if (nameA > nameb) {
          return 1;
        }
        return 0;
      });
      this.sortAscLastName = false;
    } else {
      this.attorneysList.sort((a, b) => {
        var nameA = a.lastName.toLowerCase();
        var nameb = b.lastName.toLowerCase();
        if (nameA < nameb) {
          return 1;
        }
        if (nameA > nameb) {
          return -1;
        }
        return 0;
      });
      this.sortAscLastName = true;
    }
  }


  changeTab(tabIndex) {
    this.selectedTab = tabIndex;
    this.billingSettingsSubmitted = false;
    this.errorFlagOfficeAccount = false;
    this.changeNotes = false;
    this.officeDetails.notes = this.oriNotes ? this.oriNotes : null;
    this.errorFlagCreditCardOfficeAccount = false;
    if (this.formUpdated) {
      this.tabChanges = true;
    } else {
      this.selecttabs1 = this.selectedTab;
      this.tabChanges = false;
    }
    setTimeout(() => {
      this.tabChanges = false;
    }, 2000);
    if (tabIndex === 'Matters') {
      UtilsHelper.aftertableInit();
    }
  }

  formUpdate(val) {
    this.formUpdated = val;
    if (val == false) {
      this.changeTab(this.selectedTab);
    }
  }

  formValue(e) {
    this.trustAccountForm = e;
    if (this.trustAccountForm.selectedTrustBankAccount) {
      this.errorFlagOfficeAccount = false;
    }
    if (this.trustAccountForm.enableCreditCardTrustAccount) {
      if (this.trustAccountForm.selectedCreditCard) {
        this.errorFlagCreditCardOfficeAccount = false;
      }
    } else {
      this.errorFlagCreditCardOfficeAccount = false;
    }
  }

  updateTrustAccountSetting() {
    this.trustAccountingFormSubmitted = true;
    this.errorFlagOfficeAccount = this.errorFlagCreditCardOfficeAccount = false;
    if (!this.trustAccountForm.selectedTrustBankAccount) {
      this.errorFlagOfficeAccount = true;
    }
    if (this.trustAccountForm.enableCreditCardTrustAccount && !this.trustAccountForm.selectedCreditCard) {
      this.errorFlagCreditCardOfficeAccount = true;
    }

    if (!this.formUpdated) {
      return;
    }

    const listObject = [
      this.trustAccountService.v1TrustAccountSetUpdateOfficeTrustAccountSettingsPost$Json$Response({
        body: {
          officeId: parseInt(this.officeId, 10),
          isPaperCheckRequired: this.trustAccountForm.isPaperCheckRequired,
          officeTrustPaymentGracePeriod: this.trustAccountForm.officeTrustPaymentGracePeriod
        }
      }),
      this.trustAccountService.v1TrustAccountSetUpdateOfficeTrustBankAccountPost$Json$Response({
        body: {
          officeId: parseInt(this.officeId, 10),
          firmTrustBankAccountId: this.trustAccountForm.selectedTrustBankAccount ? this.trustAccountForm.selectedTrustBankAccount : 0,
          isCreditCardTrustAccountEnabled: this.trustAccountForm.enableCreditCardTrustAccount ? this.trustAccountForm.enableCreditCardTrustAccount : false,
          firmTrustCreditCardAccountId: this.trustAccountForm.selectedCreditCard ? this.trustAccountForm.selectedCreditCard : 0
        }
      })
    ];
    this.loading = true;
    forkJoin(listObject)
      .pipe(
        map(res => {
          return true;
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        suc => {
          this.trustAccountForm = null;
          this.tabChanges = false;
          this.formUpdated = false;
          this.toastDisplay.showSuccess('Data saved.');
        },
        err => {
          console.log(err);
          this.loading = false;
        }
      );

  }

  // build fix - S21.HoneyDew
  tabChanged($event) {

  }

  public editBillFreq(event) {
    if (event === 'basic') {
      this.editBill = true
    } else {
      this.editBillUpcoming = true;
    }
  }

  public cancel() {
    this.editBill = false
    this.editBillUpcoming = false
  }

  copyEmail(email: string) {
    UtilsHelper.copyText(email);
  }

  editAccount(event){
    this.editAccounting = event;
    this.opratingaccount = 'Edit';
  }

  get isMatterExportValid() {
    return (this.matterList.length && this.columnList.some(item => item.isChecked));
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  closeSearchEmployeeList() {
    setTimeout(() => {
      this.showEmployeeList = false;
    }, 150);
  }

  cancelTrustAccounting(){
    this.cancelTrustAccountingData = true;
    setTimeout(()=>{
      this.cancelTrustAccountingData = false;
    },3000)
  }

  saveTrustAccounting(){
    this.saveTrustAccountingData = true;
    setTimeout(()=>{
      this.saveTrustAccountingData = false;
    },3000)
  }

  visibleSaveCancelBtns(event){
    this.visibleSaveCancelBtn = event;
  }

  /***** Get state and city by zip-code ****/
  public getCityState(searchString, isStateCityExist?:boolean)  {
    const input = (searchString || '').trim();
    if(this.stateCitySubscription)
      this.stateCitySubscription.unsubscribe();
      if(input.length >= 3) {
        this.validZipErr = false;
        this.stateCitySubscription =  this.placesService.v1PlacesZipcodeInputGet({input})
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
                this.editContactForm.controls.state.setValue(this.stateList.length ? this.stateList[0].code : null);
                this.editContactForm.controls.city.setValue(this.cityList.length ? this.cityList[0] : null);
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
    this.editContactForm.controls.state.setValue(null);
    this.editContactForm.controls.city.setValue(null);
    if (input.length > 0 && input.length < 3) {
      this.validZipErr = true;
    }
  }

  /******* set State and City  ******/
  public setStateCity() {
    const state = this.editContactForm.get('state').value;
    const city = this.editContactForm.get('city').value;
    const stateIndex = this.stateList.findIndex(st => st && st.code && (st.code == state));
    const cityIndex = this.cityList.indexOf(city);
    this.editContactForm.controls.state.setValue(stateIndex > -1 && this.stateList.length ? this.stateList[stateIndex].code : this.stateList[0] && this.stateList[0].code  ? this.stateList[0].code || '' : '');
    this.editContactForm.controls.city.setValue(cityIndex > -1 && this.cityList.length ? this.cityList[cityIndex] : this.cityList [0] || '');
  }

  /** Data Table Items per page */
  public pageSizeChangeEmployee(): void {
    this.empPage.size = +this.selectPageSizeEmployee.value;
    this.calcTotalPagesEmp();
  }

  /** Change Data Table Page **/
  public changePageEmp() {
    this.empPage.pageNumber = +this.pageSelectedEmp - 1;
    UtilsHelper.aftertableInit();
  }

  /** Calculates Page Count besed on Page Size **/
  public calcTotalPagesEmp() {
    this.empPage.totalElements = this.employeesList.length;
    this.empPage.totalPages = calculateTotalPages(
      this.empPage.totalElements,
      this.empPage.size
    );
    this.empPage.pageNumber = 0;
    this.pageSelectedEmp = 1;
    if (this.employeeTable) {
      this.employeeTable.offset = 0;
    }
    UtilsHelper.aftertableInit();
  }

  trackByFn_(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  public pageChange(e) {
    this.pageSelectedEmp = e.page;
    UtilsHelper.aftertableInit();
  }

  public calcTotalPagesAtt() {
    this.attPage.totalElements = this.attorneysList.length;
    this.attPage.totalPages = calculateTotalPages(
      this.attPage.totalElements,
      this.attPage.size
    );
    this.attPage.pageNumber = 0;
    this.pageSelectedAtt = 1;
    if (this.responsibleAttorneyTable) {
      this.responsibleAttorneyTable.offset = 0;
    }
    UtilsHelper.aftertableInit();
  }

  /** Data Table Items per page Attorney **/
  public pageSizeChangeAttorney(): void {
    this.attPage.size = +this.selectPageSizeAttorney.value;
    this.calcTotalPagesAtt();
  }

  /** Change Data Table Page **/
  public changePageAtt() {
    this.attPage.pageNumber = +this.pageSelectedAtt - 1;
    UtilsHelper.aftertableInit();
  }

  public pageChangeAtt(e) {
    this.pageSelectedAtt = e.page;
    this.changePageAtt();
  }

  public showAttorneyRanking() {
    setTimeout(()=> {
      if(this.responsibleAttorneyType && this.attorneysList.length) {
        _.orderBy(this.attorneysList, ['rank'],['asc']);
        this.attorneysList = [...this.attorneysList];
      }
    }, 50);
  }

  public showConsultAttorneyRanking() {
    setTimeout(()=> {
      if(this.consultAttorneyType && this.consultAttorneyList.length) {
        _.orderBy(this.consultAttorneyList, ['rank'],['asc']);
        this.consultAttorneyList = [...this.consultAttorneyList];
      }
    }, 50);
  }


  public calcTotalPagesCAtt() {
    this.cAttPage.totalElements = this.consultAttorneyList.length;
    this.cAttPage.totalPages = calculateTotalPages(
      this.cAttPage.totalElements,
      this.cAttPage.size
    );
    this.cAttPage.pageNumber = 0;
    this.pageSelectedCAtt = 1;
    if (this.consultAttorneyTable) {
      this.consultAttorneyTable.offset = 0;
    }
    UtilsHelper.aftertableInit();
  }

  /** Data Table Items per page Attorney **/
  public pageSizeChangeCAttorney(): void {
    this.cAttPage.size = +this.selectPageSizeCattorney.value;
    this.calcTotalPagesCAtt();
  }

  /** Change Data Table Page **/
  public changePageCatt() {
    this.cAttPage.pageNumber = +this.pageSelectedCAtt - 1;
    UtilsHelper.aftertableInit();
  }

  public pageChangeCAtt(e) {
    this.pageSelectedCAtt = e.page;
    this.changePageCatt();
  }
  get matterFooterHeight() {
    if (this.matterList) {
      return this.matterList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
  get employeeFooterHeight() {
    if (this.employeesList) {
      return this.employeesList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
  get attorneyFooterHeight() {
    if (this.attorneysList) {
      return this.attorneysList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
  get consultFooterHeight() {
    if (this.consultAttorneyList) {
      return this.consultAttorneyList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
