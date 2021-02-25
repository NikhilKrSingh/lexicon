import { PlatformLocation } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { Observable, Subscription } from 'rxjs';
import 'rxjs/add/operator/debounceTime';
import { finalize } from 'rxjs/operators';
import 'rxjs/Rx';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import { removeAllBorders, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { CommonService } from 'src/app/service/common.service';
import { DownloadFileService } from 'src/app/service/download-file.service';
import { ClientAssociationService, DmsService, DocumentPortalService, DocumentSettingService, EmployeeService, MiscService } from 'src/common/swagger-providers/services';
import { SharedService } from '../../../../app/modules/shared/sharedService';
import { environment } from '../../../../environments/environment';
import { IndexDbService } from '../../../index-db.service';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { Page } from '../../models/page';
import { DialogService } from '../../shared/dialog.service';
import * as errorData from '../../shared/error.json';
import { SendForESignComponent } from '../../shared/send-for-esign/send-for-esign.component';

enum DMSFileStatus {
  Unknown = 0,
  SecurityScanInProgress = 1,
  SecurityScanPassed = 2,
  SecurityScanFailedVirus = 3,
  SecurityScanFailedError = 4,
  UploadInProgress = 5,
  UploadDone = 6,
  UploadFailed = 7,
  UploadCancelled = 8,
  UploadRejected = 9,
  GeneratedFile = 10
}

enum DocumentSigningStatus {
  Unknown = 0,
  PendingSignature = 1,
  DocumentSigned = 2
}

@Component({
  selector: 'app-document-management',
  templateUrl: './document-management.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class DocumentManagementComponent implements OnInit, OnDestroy {
  @Output() readonly afterLoad = new EventEmitter<void>();
  @Input() commonComponent: boolean;
  @Input() commonFromMatterDetails: boolean;
  @Input() pageType: string;
  @Input() matterId: any;
  @Input() clientId: any;
  @Input() matterFolderDetails: any;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild(SendForESignComponent, { static: false }) eSignComponent: SendForESignComponent;
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  modalOptions: NgbModalOptions;
  closeResult: string;
  public errorData: any = (errorData as any).default;
  public folderList: Array<any> = [];
  public isExist = false;
  public isExistErr = '';
  public firmInfo: Array<any> = [];
  public oriArr: Array<any> = [];
  public isDocumentListing = false;
  public isCheckInListing = false;
  public searchDocPath: any;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public ColumnMode = ColumnMode;
  SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selected: any = [];
  public footerHeight = 50;
  public pangeSelected = 1;
  public counter = Array;
  public columnList = [];
  public currentActive: number;
  public sourceName = '';
  public targetName = '';
  public archiveFolderId = 0;
  public selectFolder: any;
  public folders: any[] = [];
  private selectedSourceFullPath = null;
  public currentUserInfo: any;
  public selectedRowForDownload: any;
  public id = 0;
  public searchList: any[] = [];
  public searchForm: FormGroup;
  private checkSerachObs: any;
  public firmData: any;
  public firmChilds: any[] = [];
  public firmInfoPath: any;
  public filterStatusArray: any[] = [];
  public filterOwnerArray: any[] = [];
  public filterCategoryArray: any[] = [];
  public titleOwner = 'All';
  public selectedOwner: Array<any> = [];
  public filterName = 'Apply Filter';
  public titleStatus = 'All';
  public titleCategory = 'All';
  public selectedStatus: Array<any> = [];
  public selectedCategory: Array<any> = [];
  public isVersionSelected = false;
  public archiveFileName: string;
  public unarchiveFileName: string;
  public selectedRow: any;
  public archivedselectedFolders: Array<number> = [];
  public archivedselectedFiles: Array<number> = [];
  public unarchivedselectedFolders: Array<number> = [];
  public unarchivedselectedFiles: Array<number> = [];
  public selectedBulkAction: any;
  public bulkActions: Array<{ id: number, name: string, disabled: boolean }>;
  public selectedRowLength = 0;
  public downloadSelectedFiles: Array<any> = [];
  public selectedCheckoutfiles: Array<any> = [];
  public selectedNonCheckoutfiles: Array<any> = [];
  public isdmsAdmin = false;
  public downloadChoiceOption = 'Available';
  public selectedTablerow: Array<any> = [];
  public scrollbarOptions = { axis: 'yx', theme: 'minimal-dark' };
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  isViewerHistory = false;
  momentObj = moment;
  shareLink = '';
  employeeFilterName = 'Select Employees';
  employeeArray = [];
  selectedEmployeeArray = [];
  titleEmployee = 'Select employee';
  employeeShareRights = [];
  oriEmployeeShareRights = [];
  folderId = 0;
  docAccessArr: any = [];
  selectedClients = [];
  selectedClientsArr = [];
  clientsFilterName = 'Select Clients';
  clientsArray = [];
  tempClientArr = [];
  titleClient = 'Select a client';
  selectedClientsAssoc = [];
  selectedClientsAssocArr = [];
  clientsAssocFilterName = 'Select Client Associations';
  clientsAssocArray = [];
  titleClientAssoc = 'Select a client association';
  otherUserName = '';
  otherUsersArr = [];
  linkExpirationDate = '';
  fileId = 0;
  revokeFiles = [];
  documentPortalAccess = false;
  tenantId = 0;
  sharedFileClients = [];
  singleFileRevokeId = 0;
  selectedDocumentsId = [];
  sortingArray = [];
  pathIndex = [];
  uploadAndCreateActionVisible = true;
  public shareDocumentSelected: any[] = [];
  public shareDocId = 5;
  public shareDocumentLength = 0;
  public shareFolderId = 0;
  extraUsers = [];
  extraUsersClone = [];
  revokedAccess = true;
  public previousSelectedClients: any[] = [];
  public billingOrResponsibleAttr = false;
  public shareDocumentPopup = false;
  private shareDocumentRow: any;
  public expirationDateErrMsg = '';
  public signersList: any[] = [];
  isCorporate = false;
  revokeUsers = [];
  public bulkShareAccess: boolean;
  public shareRightsAccess: boolean;
  public noRevokeAccess: boolean;
  public clientFolderNotSystem: boolean;
  public notSystemFolder: boolean;
  public notInSystemFolder: boolean;
  public reviewPendingDocIds = [];
  public profile = null;
  notEditableFolders = ['Miscellaneous', 'Disbursement Receipts', 'Clients', 'Employees'];
  fileCurrentVersion = null;
  isIconicTenant = false;
  eSignEnabled = false;
  clientFolder = null;
  bulkDownloadActionsId = 8;
  expanded: any = {};
  checkoutList = [];
  pageIndex = 1;
  pageSize = 20;
  totalResultCount = 0;
  isScrollSearch = false;
  loadAllRecord = false;
  isFirstLoad = true;
  currentHighlightRow: any;
  public visibleHtmlComponent = {
    header: true,
    search: true,
    breadcrumb: true,
    createNewFolder: true,
    uploadDocument: true,
    filter: true
  };
  singleReviewPendingDocId = 0;
  rejectReason = '';
  rejectFormSubmitted = false;
  public loading = true;
  public editLoading: boolean;
  public moveLoading: boolean;
  public newFolderLoading: boolean;
  public shareDocLoading = false;
  isValidTenantTier = false;
  public highLightFile = null;
  queryFolder = null;
  folderError = false;
  searchHighlight = '';
  approveAndMoveDoc = false;
  approveLoading = false;
  sendEsignLoading = false;
  folderChangedSubs: any;
  public showSearchList = false;
  private refreshListingSubscription: any;
  private getListingTimeout: any;
  private isDmsModule: boolean = false;
  public createFolderFormSubmitted = false;
  public searchLoading: boolean = false;
  public searchText = "";
  public request = null;
  public isBulkApproval: boolean;
  private dmsInetConnectSubscription: any;
  public viewEsignHistoryFlag: boolean = false;

  public selectedList: Array<any> = [];
  allSelected: boolean;

  constructor(
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private builder: FormBuilder,
    private dmsService: DmsService,
    private toastDisplay: ToastDisplay,
    private router: Router,
    private dms: DownloadFileService,
    private store: Store<fromRoot.AppState>,
    private sharedService: SharedService,
    private miscService: MiscService,
    public commonService: CommonService,
    private employeeService: EmployeeService,
    private clientAssocService: ClientAssociationService,
    private documentSettingService: DocumentSettingService,
    public indexDbService: IndexDbService,
    public documentPortalService: DocumentPortalService,
    public location: PlatformLocation,
    private dialogService: DialogService,
    private pagetitle: Title
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.searchForm = builder.group({
      searchInput: ['']
    });

    if (
      this.router.getCurrentNavigation() &&
      this.router.getCurrentNavigation().extras &&
      this.router.getCurrentNavigation().extras.state
    ) {
      this.searchDocPath = this.router.getCurrentNavigation().extras.state.docPath;
      this.highLightFile = this.router.getCurrentNavigation().extras.state.fileName;
      const searchString = this.router.getCurrentNavigation().extras.state.searchString;
      this.searchForm.get('searchInput').setValue(searchString);
    }
    this.permissionList$ = this.store.select('permissions');

    // Back button pressed
    location.onPopState(() => {
      if (this.folderId && this.isDocumentListing) {
        this.isDocumentListing = false;
        this.getTenantFolderDetails(this.folderId);
      } else {
        const params = new URLSearchParams(window.location.search);
        if (params.get('folderId') && !isNaN(+params.get('folderId'))) {
          this.queryFolder = +params.get('folderId');
          this.getTenantFolderDetails(params.get('folderId'));
        }
      }
    });
  }

  public createFolderForm: FormGroup = this.builder.group({
    folderName: new FormControl('', [
      Validators.required,
      Validators.maxLength(100)
    ])
  });

  public editFolderForm: FormGroup = this.builder.group({
    targetName: new FormControl('', [
      Validators.required,
      Validators.maxLength(100),
      Validators.pattern(/^[a-z0-9 ]+$/i)
    ])
  });

  sanitize(url: string) {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }
  editDocument(index) {
    this.dmsService
      .v1DmsFileCheckoutDmsFileIdGet({ dmsFileId: +this.folderList[index].id })
      .subscribe(
        response => {
          const res = JSON.parse(response as any);
          this.getFilelist(this.isVersionSelected ? 'file' : 'folder');
        },
        err => { }
      );
  }
  ngOnInit() {
    this.pagetitle.setTitle('Document Management');
    this.queryFolder = +this.route.snapshot.queryParamMap.get('folderId') || null;
    this.initializeBulkAction(null, null, true);
    this.opts = {
      position: 'right',
      barBackground: '#413a93',
      barOpacity: '1',
      barWidth: '4',
      barBorderRadius: '4',
      barMargin: '2px',
      gridOpacity: '1',
      gridBackground: '#e7edf3',
      gridWidth: '8',
      gridMargin: '0',
      gridBorderRadius: '4',
      alwaysVisible: true
    };
    this.getClients();
    this.profile = UtilsHelper.getObject('profile');

    if (
      this.profile && this.profile.tenantTier &&
      this.profile.tenantTier.tierName &&
      this.profile.tenantTier.tierName !== 'Emerging'
    ) {
      this.isValidTenantTier = true;
    }

    if (
      this.profile && this.profile.tenantTier &&
      this.profile.tenantTier.tierName &&
      this.profile.tenantTier.tierName === 'Iconic'
    ) {
      this.isIconicTenant = true;
    }

    if (this.profile && this.profile.tenantId) {
      this.tenantId = this.profile.tenantId;
      this.getDocumentPortalAccess();
    }

    this.indexDbService.getObject('firmInfo', (res) => {
      if (res && res.value) {
        this.firmInfo = res.value;
        this.selected = this.firmInfo[this.firmInfo.length - 1];
        this.getFilelist();
        this.indexDbService.removeObject('firmInfo');
        this.visibleHtmlComponent = {
          header: true,
          search: true,
          breadcrumb: true,
          createNewFolder: true,
          uploadDocument: true,
          filter: true
        };
        this.isDmsModule = true;
      } else if (this.commonComponent || this.commonFromMatterDetails) {
        this.visibleHtmlComponent = {
          header: false,
          search: this.commonFromMatterDetails ? true : false,
          breadcrumb: true,
          createNewFolder: this.commonFromMatterDetails ? true : false,
          uploadDocument: true,
          filter: this.commonComponent ? false : true
        };

        if (this.commonComponent) {
          this.matterId = UtilsHelper.getObject('createdMatterId');
        }
        this.getTenantFolderDetails(this.matterFolderDetails, true);
      } else {
        this.visibleHtmlComponent = {
          header: true,
          search: true,
          breadcrumb: true,
          createNewFolder: true,
          uploadDocument: true,
          filter: true
        };
        const folder = this.searchDocPath ? this.searchDocPath : null;
        this.getTenantFolderDetails(folder);
        this.isDmsModule = true;
      }

      if (!this.commonComponent) {
        this.checkSearch();
      }

      this.addConfigs();
    });
    this.currentUserInfo = UtilsHelper.getObject('profile');
    if (this.currentUserInfo) {
      this.billingOrResponsibleAttr = this.validateRole(
        this.currentUserInfo.groups
      );
    }
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          if (obj.datas.DOCUMENT_MANAGEMENT_SYSTEMisAdmin) {
            this.isdmsAdmin = true;
            this.initializeBulkAction(5, this.isdmsAdmin, true);
            this.manageBulkOption();
          } else {
            this.manageBulkOption();
          }
        }
      }
    });
    this.getEmployessList();
    this.refreshListingSubscription = this.commonService.isDmsRefresh.subscribe(val => {
      if (val && val.folderId == this.selected.id && this.isDmsModule && val.type == 'dms') {
        if (this.getListingTimeout) {
          clearInterval(this.getListingTimeout);
        }
        this.getListingTimeout = setTimeout(() => {
          this.getFilelist();
        }, 5000);
      }
    })

    this.dmsInetConnectSubscription = this.commonService.isDMSInetConnection.subscribe(val => {
      if (val && this.loading) {
        this.loading = false;
        this.getFilelist();
      }
    });
  }

  async getTenantFolderDetails(folderData?, obj = false) {
    if ((!this.queryFolder || (this.queryFolder && isNaN(+this.queryFolder))) && !folderData && !obj) {
      let resp: any = await this.dmsService.v1DmsTenantFolderGet().toPromise();
      resp = JSON.parse(resp).results;
      this.firmData = resp;
      this.selected = this.firmData;
      this.getFilelist();
    } else {
      if (obj) {
        this.selected = folderData;
        this.getFilelist();
      } else {
        const folder = +folderData ? +folderData : this.queryFolder;
        this.getFolderContent(folder);
      }
    }
  }

  async getFolderContent(folder) {
    try {
      this.loading = true;
      const res: any = await this.dmsService.v1DmsGetFolderDetailFolderIdGet({ folderId: folder }).toPromise();
      this.selected = JSON.parse(res).results;
      this.getFilelist();
    } catch (e) {
      if (!this.folderError) {
        this.folderError = true;
        this.queryFolder = null;
        this.getTenantFolderDetails(null);
      }
      this.loading = false;
    }
  }

  eSignInit(ev) {
    this.eSignComponent = ev;
  }


  /**
   * function to initialize bulk option dropdown
   */
  initializeBulkAction(id?: number, disable?: boolean, disableAll?: any) {
    let bulkActions = [];
    if (!this.documentPortalAccess) {
      bulkActions = [
        { id: 1, name: 'Archive', disabled: false },
        { id: 2, name: 'Unarchive', disabled: false },
        { id: 3, name: 'Download', disabled: false }
      ];
    } else {
      bulkActions = [
        { id: 1, name: 'Archive', disabled: false },
        { id: 2, name: 'Unarchive', disabled: false },
        { id: 3, name: 'Download', disabled: false },
        { id: 4, name: 'Revoke Access', disabled: this.revokedAccess }
      ];
    }
    if (
      (this.isdmsAdmin || this.shareRightsAccess) &&
      !this.noRevokeAccess && (this.firmInfo.length > 1) &&
      (!this.notInSystemFolder || !this.notSystemFolder) &&
      this.documentPortalAccess && this.isValidTenantTier
    ) {
      bulkActions.push({ id: this.shareDocId, name: 'Share Documents', disabled: false });
    }
    if (id) {
      const indx = bulkActions.findIndex(x => +x.id === +id);
      if (indx > -1) {
        bulkActions[indx].disabled = disable;
      }
    }
    const reviewPendingOptionsDisable = this.reviewPendingDocIds.length && this.isBulkApproval ? false : true;
    if (this.isBulkApproval) {
      bulkActions.push(
        { id: bulkActions.length + 1, name: 'Approve Documents', disabled: reviewPendingOptionsDisable },
        { id: bulkActions.length + 2, name: 'Reject Documents', disabled: reviewPendingOptionsDisable }
      );
    }


    if (this.isValidTenantTier) {
      bulkActions.splice(0, 0, { id: this.bulkDownloadActionsId, name: 'Download Files', disabled: false });
    }
    if (disableAll) {
      bulkActions.map(obj => {
        obj.disabled = true;
      });
    }
    this.bulkActions = [...bulkActions];
  }
  // for bulk opration filtered base on access of user.
  public manageBulkOption() {
    this.bulkActions = this.bulkActions.filter(item => {
      if (item.name === 'Archive' || item.name === 'Unarchive') {
        if (this.isdmsAdmin === true) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    });
  }

  getDocumentPortalAccess(): void {
    this.documentSettingService
      .v1DocumentSettingTenantTenantIdGet({
        tenantId: this.tenantId
      })
      .subscribe(
        (res: any) => {
          res = JSON.parse(res);
          this.isBulkApproval = res && res.results && res.results.isBulkApproval ? true : false;
          if (res && res.results && res.results.documentPortalAccess) {
            this.documentPortalAccess = res.results.documentPortalAccess;
            this.initializeBulkAction(null, null, true);
          }
          this.eSignEnabled = res && res.results && res.results.isSignatureEnable ? true : false;
        },
        err => console.log(err)
      );
  }

  ngOnDestroy() {
    if (this.checkSerachObs) {
      this.checkSerachObs.unsubscribe();
    }

    if (this.folderChangedSubs) {
      this.folderChangedSubs.unsubscribe();
    }
    if (this.refreshListingSubscription) {
      this.refreshListingSubscription.unsubscribe();
    }

    if (this.dmsInetConnectSubscription) {
      this.dmsInetConnectSubscription.unsubscribe();
    }
    this.commonService.isDMSInetConnection.next(null);
  }

  get f() { return this.createFolderForm.controls; }

  /**
   * To remove error for inline validation
   */
  onFolderNameChange() {
    this.isExist = false;
  }

  /**
   *
   * To create new Folder
   */
  public createFolder() {
    this.createFolderFormSubmitted = true;
    if (this.createFolderForm.invalid) {
      return;
    }
    this.newFolderLoading = true;
    const data = { ...this.createFolderForm.value };
    if (this.firmInfo && this.firmInfo.length > 0) {
      const folderPath = this.firmInfo[this.firmInfo.length - 1].folderPath;
      this.dmsService
        .v1DmsFolderCreateFolderNameGet({
          folderName: data.folderName.trim(),
          isSystem: false,
          currentFolderFullPath: folderPath
        })
        .subscribe(
          response => {
            const res = JSON.parse(response as any);
            if (!res.results.id) {
              this.isExist = true;
              if (res.results) {
                this.isExistErr = res.results;
              } else {
                this.isExistErr = this.errorData.folder_name_exist;
              }
            } else {
              this.isExist = false;
              this.createFolderForm.reset();
              this.modalService.dismissAll();
              this.toastDisplay.showSuccess(this.errorData.folder_added);
              this.getFilelist();
            }
            this.newFolderLoading = false;
          },
          err => {
            this.newFolderLoading = false;
          }
        );
    }
  }

  /**
   *
   * To open create folder popup
   * @param content Popup
   * @param className size
   * @param winClass class
   */
  openPersonalinfo(content: any, className, winClass) {
    this.createFolderFormSubmitted = false;
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static'
      })
      .result.then(
        result => {
          this.closeResult = `Closed with: ${result}`;
        },
        reason => {
          this.clearSelectionsAndResetBulk();
          this.isExist = false;
          this.isExistErr = '';
          this.createFolderForm.reset();
          this.modalService.dismissAll();
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
          this.onCloseSharePopups();
        }
      );
  }
  /**
   * @param reason Dismissal reason
   */
  private getDismissReason(reason: any): string {
    this.approveAndMoveDoc = false;
    this.otherUsersArr = [];
    this.reviewPendingDocIds = [];
    this.singleReviewPendingDocId = 0;
    this.resetRejectReasonParams();
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  /**
   *
   * Datatable footer handler functions
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    }
    this.checkParentCheckbox();
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
    this.changePage();
  }

  /**
   *
   * To change datatable pagination settings
   */
  updateDatatableFooterPage() {
    this.page.totalElements = this.folderList.length;
    this.page.totalPages = Math.ceil(this.folderList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.table.offset = 0;
    this.checkParentCheckbox();
  }

  /**
   * Open action menu
   * @param index index
   * @param event event
   *  To open Actions menu
   */
  openMenu(index: number, event: any): void {
    setTimeout(() => {
      if (this.currentActive !== index) {
        this.currentActive = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        event.target
          .closest('.datatable-row-wrapper')
          .classList.add('datatable-row-hover');
      } else {
        this.currentActive = null;
        event.target
          .closest('.datatable-row-wrapper')
          .classList.remove('datatable-row-hover');
      }
      this.onActivate({type: 'click', row: this.folderList[index]}, index);
    }, 50);
  }

  onClickedOutside(event: any, index: number) {
    if (index === this.currentActive) {
      this.currentActive = null;
    }
  }

  /* new function document search */
  public redirecttoDMS(row) {
    const folderId = !row.isFolder ? row.folderId : row.folderIndexId;
    this.searchList = [];
    this.isScrollSearch = false;

    if (row.fileName) {
      this.highLightFile = row.fileName;
    }

    if (folderId) {
      this.getFolderContent(folderId);
    }
  }


  /**
   *
   * @param row (selected Row(File/folder))
   * @param type (file/folder/file version history)
   * @param event (search/click)
   * @param index
   *   To get currently selected folder/file and get its data
   */
  onSelect(row: any, type?: string, index?: number) {
    this.highLightFile = null;
    this.searchDocPath = null;
    this.selected = row;
    // this.filterStatusArray = [];
    this.filterCategoryArray = [];
    this.filterOwnerArray = [];
    this.archivedselectedFiles = [];
    this.archivedselectedFolders = [];
    this.unarchivedselectedFiles = [];
    this.unarchivedselectedFolders = [];
    this.selectedRowLength = 0;
    this.oriArr = [];
    this.clearOwnerFilter();
    // this.clearStatusFilter();
    this.clearCategoryFilter();
    this.currentActive = null;
    this.selectedTablerow = [];
    const bulkActions = this.bulkActions;
    bulkActions.map(obj => {
      obj.disabled = true;
    });
    this.bulkActions = [...bulkActions];
    if (this.isDocumentListing) {
      this.isDocumentListing = false;
    }
    if (this.isCheckInListing) {
      this.isCheckInListing = false;
    }
    if (this.isViewerHistory) {
      this.isViewerHistory = false;
    }
    if (this.viewEsignHistoryFlag) {
      this.viewEsignHistoryFlag = false;
    }
    this.getFilelist(type, index);
  }

  /**
   * Function to get details of file/folder and update breadcrumbs
   * @param type Type
   * @param event Event
   * @param index Index
   */
  private getFilelist(
    type: string = 'folder',
    index?: number,
  ) {
    this.fileCurrentVersion = null;
    this.loading = true;
    let url: any;
    switch (type) {
      case 'folder':
        this.folderId = this.selected.id;
        url = this.dmsService.v1DmsFoldersFolderIdContentGet$Response({
          folderId: this.selected.id
        });
        break;
      case 'file':
        this.isDocumentListing = true;
        url = this.dmsService.v1DmsFileVersionHistoryDmsFileIdGet$Response({
          dmsFileId: this.selected.id
        });
        break;
      case 'checkout':
        this.isCheckInListing = true;
        url = this.dmsService.v1DmsFileCheckoutHistoryDmsFileIdGet$Response({
          dmsFileId: this.selected.id
        });
        break;
      case 'esign':
        this.viewEsignHistoryFlag = true;
        url = this.dmsService.v1DmsSignaturehistoryIdGet$Response({
          id: this.selected.id
        })
    }
    url.subscribe((response: any) => {
      this.loading = false;
      if (index >= 0) {
        // Update Firm BreadCrumb if Moving Left
        if (index === 0) {
          this.firmInfo.length = 1;
        } else {
          let len = this.firmInfo.length;
          len = len - 1;
          this.firmInfo.splice(index + 1, len);
        }
      } else {
        // Update Firm BreadCrumb If Not Search
        if (index >= 0) {
          // Update Firm BreadCrumb if Moving Left
          if (index === 0) {
            this.firmInfo.length = 1;
          } else {
            let len = this.firmInfo.length;
            len = len - 1;
            this.firmInfo.splice(index + 1, len);
          }
        } else {
          // Update Firm BreadCrumb if Moving Right
          const resp = JSON.parse(response.body);
          if (resp.results && resp.results.breadCrumbsFolders) {
            this.firmInfo = resp.results.breadCrumbsFolders;
          }

          if (['file', 'checkout', 'esign'].indexOf(type) > -1) {
            this.firmInfo.push(this.selected);
          }
        }
      }
      const res = JSON.parse(response.body);
      const path =
        res.results && res.results.folders && res.results.folders.length
          ? res.results.folders[0].folderPath
          : res.results && res.results.files && res.results.files.length > 0
            ? res.results.files[0].fullFolderPath
            : null;

      if (path) {
        this.pathIndex = path.split('/');
      }

      this.uploadAndCreateActionVisible =
        this.pathIndex && this.pathIndex.length === 9 && this.commonComponent
          ? false
          : true;
      this.table.selected = [];
      let arrResult = [];
      if (this.isCheckInListing && typeof res.results !== 'string') {
        res.results.forEach(el => {
          if (el.checkinDate) {
            let checkAction = 'Check-In';

            if (el.isForcedCheckin) {
              checkAction = 'Force ' + checkAction;
            }

            arrResult.push({
              action: checkAction,
              date: el.checkinDate,
              performedBy:
                el.checkinBy.firstName + ' ' + el.checkinBy.lastName
            });
          }
          if (el.checkoutDate) {
            arrResult.push({
              action: 'Check-Out',
              date: el.checkoutDate,
              performedBy:
                el.checkoutBy.firstName + ' ' + el.checkoutBy.lastName
            });
          }
        });
      } else {
        arrResult = res.results;
      }

      if (type === 'folder' && this.router.url.includes('/manage-folders')) {
        if (this.folderId !== this.queryFolder) {
          this.router.navigate([], { queryParams: { folderId: this.folderId } });
        }
      }

      if (type === 'file' && typeof arrResult !== 'string') {
        this.fileCurrentVersion = Math.max.apply(Math, arrResult.map(o => o.version));
      }
      if (this.viewEsignHistoryFlag) {

        arrResult.forEach(x => {
          if (x.sentDateTime) {
            let date = moment(x.sentDateTime).format('YYYY-MM-DD') + 'T' + moment(x.sentDateTime).format('HH:mm:ss');
            x.sentDateTime = moment.utc(date).local().format('YYYY-MM-DD[T]HH:mm:ss');
          }
          if (x.signedDateTime) {
            let date = moment(x.signedDateTime).format('YYYY-MM-DD') + 'T' + moment(x.signedDateTime).format('HH:mm:ss');
            x.signedDateTime = moment.utc(date).local().format('YYYY-MM-DD[T]HH:mm:ss');
          }
        });
      }
      this.filterGrid(arrResult);
      if (this.commonComponent) {
        this.afterLoad.emit();
      }
    }, err => {
      this.loading = false;
    });
  }

  public mySortingFunction() {
    if (this.isCheckInListing) {
      let resp = [...this.sortingArray];
      if (this.table.sorts[0].prop === 'action') {
        if (this.table.sorts[0].dir === 'asc') {
          resp = resp.sort((a, b) => a.action.localeCompare(b.action));
        } else {
          resp = resp.sort((a, b) => b.action.localeCompare(a.action));
        }
      }
      if (this.table.sorts[0].prop === 'date') {
        resp = resp.sort((a, b) => {
          const firstDate = new Date(a.date).getTime();
          const secondDate = new Date(b.date).getTime();
          return this.table.sorts[0].dir === 'asc'
            ? firstDate - secondDate
            : secondDate - firstDate;
        });
      }
      if (this.table.sorts[0].prop === 'performedBy') {
        if (this.table.sorts[0].dir === 'asc') {
          resp = resp.sort((a, b) => a.performedBy.localeCompare(b.performedBy));
        } else {
          resp = resp.sort((a, b) => b.performedBy.localeCompare(a.performedBy));
        }
      }
      this.folderList = [...resp];
    } else {
      let folders = this.sortingArray.filter(item => {
        if (item.name && !item.fileName) {
          return item;
        }
      });
      let files = this.sortingArray.filter(item => {
        if (item.fileName || item.documentTitle || item.originalFileName) {
          return item;
        }
      });
      if (this.table.sorts[0].prop === 'name' || this.table.sorts[0].prop === 'fileName') {
        if (this.table.sorts[0].dir === 'asc') {
          folders = folders.sort((a, b) =>
            a.name
              ? a.name.localeCompare(b.name)
              : a.fileName.localeCompare(b.fileName)
          );
          files = files.sort((a, b) =>
            a.name
              ? a.name.localeCompare(b.name)
              : a.fileName.localeCompare(b.fileName)
          );
        } else {
          folders = folders.sort((a, b) =>
            b.name
              ? b.name.localeCompare(a.name)
              : b.fileName.localeCompare(a.fileName)
          );
          files = files.sort((a, b) =>
            b.name
              ? b.name.localeCompare(a.name)
              : b.fileName.localeCompare(a.fileName)
          );
        }
      }

      if (this.table.sorts[0].prop === 'category_name') {
        if (this.table.sorts[0].dir === 'asc') {
          files = files.sort((a, b) =>
            a.name
              ? a.name.localeCompare(b.name)
              : a.fileName.localeCompare(b.fileName)
          );
        } else {
          files = files.sort((a, b) =>
            b.name
              ? b.name.localeCompare(a.name)
              : b.fileName.localeCompare(a.fileName)
          );
        }
      }
      if (this.table.sorts[0].prop === 'fileSizeInKB') {
        if (this.table.sorts[0].dir === 'asc') {
          files = files.sort((a, b) => a.fileSizeInKB - b.fileSizeInKB);
        } else {
          files = files.sort((a, b) => b.fileSizeInKB - a.fileSizeInKB);
        }
      }

      if (this.table.sorts[0].prop === 'attributes') {
        if (this.table.sorts[0].dir === 'asc') {
          files = files.sort(x => x.isFillableTemplate ? -1 : 1);
        } else {
          files = files.sort(x => x.isDraftingTemplate ? -1 : 1);
        }
      }

      if (this.table.sorts[0].prop === 'lastUpdated') {
        files = files.sort((a, b) => {
          const firstDate = new Date(a.lastUpdated).getTime();
          const secondDate = new Date(b.lastUpdated).getTime();
          return this.table.sorts[0].dir === 'asc'
            ? firstDate - secondDate
            : secondDate - firstDate;
        });
      }
      if (this.table.sorts[0].prop === 'version') {
        if (this.table.sorts[0].dir === 'asc') {
          files = files.sort((a, b) => a.version - b.version);
        } else {
          files = files.sort((a, b) => b.version - a.version);
        }
      }
      if (this.table.sorts[0].prop === 'documentTitle') {
        if (this.table.sorts[0].dir === 'asc') {
          files = files.sort((a, b) => a.documentTitle.localeCompare(b.documentTitle));
        } else {
          files = files.sort((a, b) => b.documentTitle.localeCompare(a.documentTitle));
        }
      }
      if (this.isDocumentListing) {
        if (this.table.sorts[0].prop === 'uploadTime') {
          files = files.sort((a, b) => {
            const firstDate = new Date(a.uploadTime).getTime();
            const secondDate = new Date(b.uploadTime).getTime();
            return this.table.sorts[0].dir === 'asc'
              ? firstDate - secondDate
              : secondDate - firstDate;
          });
        }

        if (this.table.sorts[0].prop === 'documentName') {
          files = files.sort((a, b) => {
            return this.table.sorts[0].dir === 'asc'
              ? a.fileName.localeCompare(b.fileName)
              : b.fileName.localeCompare(a.fileName);
          });
        }

        if (this.table.sorts[0].prop === 'fileSizeInKB') {
          files = files.sort((a, b) => {
            const x = +a.fileSizeInKB;
            const y = +b.fileSizeInKB;
            return this.table.sorts[0].dir === 'asc' ? y - x : x - y;
          });
        }

        if (this.table.sorts[0].prop === 'modifiedBy') {
          files = files.sort((a, b) => {
            return this.table.sorts[0].dir === 'asc'
              ? a.modifiedBy.localeCompare(b.modifiedBy)
              : b.modifiedBy.localeCompare(a.modifiedBy);
          });
        }
      }
      this.folderList = folders.concat(files);
    }
  }

  /**
   * @param foldersAndFiles Response
   * To filter the data
   */
  public filterGrid(foldersAndFiles) {
    this.removeSelection();
    this.folderList = [];
    this.sortingArray = [];
    let filterStatusArrCopy = _.cloneDeep(this.filterStatusArray);
    this.filterStatusArray = [];
    if (typeof foldersAndFiles === 'string') {
      return;
    }

    if (!this.isDocumentListing && !this.isCheckInListing && !this.viewEsignHistoryFlag) {
      if (
        foldersAndFiles &&
        foldersAndFiles.folders &&
        foldersAndFiles.folders.length
      ) {
        this.folderList = foldersAndFiles.folders;
        this.folderList.sort(function(a, b){
          var nameA=a.name.toLowerCase().trim();
          var nameB=b.name.toLowerCase().trim();
          if(nameA>nameB)
            return 1
          if(nameA<nameB)
            return -1
          return 0
        });
      }
      if (
        foldersAndFiles &&
        foldersAndFiles.files &&
        foldersAndFiles.files.length
      ) {
        let sortedfilesarray: Array<any> = [];
        let nullnamefiles: Array<any> = [];
        nullnamefiles = foldersAndFiles.files.filter(element =>  !element.fileName);
        sortedfilesarray = foldersAndFiles.files.filter(element =>  element.fileName);
        sortedfilesarray.sort(function(a, b){
          var nameC=a.fileName.toLowerCase().trim();
          var nameD=b.fileName.toLowerCase().trim();
          if(nameC>nameD)
            return 1
          if(nameC<nameD)
            return -1
          return 0
        });
        this.folderList = this.folderList.concat(sortedfilesarray);
        this.folderList = this.folderList.concat(nullnamefiles);
        foldersAndFiles.files.forEach(element => {
          if (element.owner) {
            if (
              !this.filterOwnerArray.some(
                owner => owner.id === element.owner.id
              )
            ) {
              const obj: any = {
                id: element.owner.id,
                name: `${element.owner.firstName} ${element.owner.lastName}`,
                checked: false
              };
              this.filterOwnerArray.push(obj);
            }
          }

          if (element.categories && element.categories.length > 0) {
            element.category_name = element.categories[0].name;
            element.categories.forEach(el => {
              if (
                !this.filterCategoryArray.some(
                  category => category.id === el.id
                )
              ) {
                const obj: any = {
                  id: el.id,
                  name:
                    el.name.charAt(0).toUpperCase() +
                    el.name.slice(1),
                  checked: false
                };
                this.filterCategoryArray.push(obj);
              }
            });
          }

          if (element.fileName) {
            element.name = element.fileName;
          }

          if (element.checkedOutTo && this.filterStatusArray.findIndex(e => e.name === 'Checked Out') === -1) {
            const obj: any = {
              id: 'checkedOut',
              name: 'Checked Out',
              checked: false
            };
            this.filterStatusArray.push(obj);
          }
        });
      }
    } else {
      this.folderList = foldersAndFiles;
      this.folderList.forEach(row => {
        row.modifiedBy = row.uploadedBy && (row.uploadedBy.id == this.currentUserInfo.id)
          ? 'Me' : row.uploadedBy && (row.uploadedBy.firstName && row.uploadedBy.lastName)
            ? row.uploadedBy.firstName + ' ' + row.uploadedBy.lastName : row.uploadedBy ? row.uploadedBy.firstName : '';
      });
      this.folderList = [...this.folderList];
    }

    this.folderList.forEach(element => {
      if (element.status) {
        if (
          !this.filterStatusArray.some(
            status => status.id === element.status.toLowerCase()
          )
        ) {
          const obj: any = {
            id: element.status.toLowerCase(),
            name:
              element.status.charAt(0).toUpperCase() +
              element.status.slice(1),
            checked: false
          };
          this.filterStatusArray.push(obj);
        }
      }
      element.isGenerated = this.isActionAvailable(element);
    });
    this.oriArr = this.folderList;
    this.sortingArray = this.folderList;
    this.mySortingFunction();
    if(filterStatusArrCopy && !filterStatusArrCopy.length && localStorage.getItem('filterStatusArrCopy')){
      filterStatusArrCopy = JSON.parse(localStorage.getItem('filterStatusArrCopy'));
      localStorage.removeItem('filterStatusArrCopy');
    }
    if (this.isFirstLoad) {
      this.filterStatusArray.map(x => {
        if (x.name.toLowerCase() == 'active') {
          x.checked = true;
          this.selectedStatus.push(x.id);
          this.titleStatus = this.selectedStatus.length ? this.selectedStatus.length as any : this.titleStatus;
        }
      })
      this.applyFilterOwnerStatus();
      this.isFirstLoad = false;
    } else if ((filterStatusArrCopy.filter(x => x.checked)).length) {
      if(this.filterStatusArray.length){
        this.selectedStatus = [];
        this.filterStatusArray.forEach(filter => {
          const checkedfilter = filterStatusArrCopy.find(x => x.id == filter.id)
          if (checkedfilter && checkedfilter.checked) {
            filter.checked = true;
            if(!this.selectedStatus.some(x => filter.id)){
              this.selectedStatus.push(filter.id);
            }
            this.titleStatus = this.selectedStatus.length ? this.selectedStatus.length.toString() : 'All'
          }
        });
        if (this.selectedStatus.length) {
          this.applyFilterOwnerStatus();
        } 
        localStorage.setItem('filterStatusArrCopy', JSON.stringify(filterStatusArrCopy));
      }else {
        this.selectedStatus = [];
        this.titleStatus = 'All';
      }
    }
    this.updateDatatableFooterPage();
  }

  get ef() {
    return this.editFolderForm.controls;
  }

  /** To open edit folder modal */
  public editFolder(contant, row) {
    this.sourceName = row.name;
    this.editFolderForm.setValue({
      targetName: row.name
    });
    this.openPersonalinfo(contant, '', '');
  }

  /**
   * Function to update folder
   */
  public updateFolder() {
    if (this.editFolderForm.invalid) {
      return;
    }

    const data = { ...this.editFolderForm.value };
    if (this.firmInfo && this.firmInfo.length > 0) {
      const folderPath = this.firmInfo[this.firmInfo.length - 1].folderPath;
      this.editLoading = true;
      this.dmsService
        .v1DmsFolderRenameSourceNameTargetNameGet({
          sourceName: this.sourceName,
          targetName: data.targetName.trim(),
          currentFolderFullPath: folderPath
        })
        .subscribe(
          response => {
            const res = JSON.parse(response as any);
            if (!res.results.id) {
              this.isExist = true;
              this.isExistErr = res.results ? res.results : this.errorData.folder_name_exist;
            } else {
              this.isExist = false;
              this.isExistErr = '';
              this.editFolderForm.reset();
              this.modalService.dismissAll();
              this.toastDisplay.showSuccess(this.errorData.folder_updated);
              this.getFilelist();
            }
            this.editLoading = false;
          },
          err => {
            this.editLoading = false;
          }
        );
    }
  }

  /**
   * Function to open archive folder popup
   * @param contant Modal
   * @param row Folder
   * @param isArchived [boolean]
   */
  public getarchiveId(contant, row, isArchived = false) {
    this.archiveFolderId = row.id;
    if (row.fileName) {
      this.archiveFileName = row.fileName;
    } else {
      this.archiveFileName = null;
    }
    this.openPersonalinfo(contant, '', '');
  }

  /**
   * Function  to archive folder
   */
  public archiveFolder(type?: string) {
    if (this.archiveFolderId !== 0) {
      let resp: any;
      let mess = '';
      if (type && type === 'file') {
        mess = 'Document is archived.';
        resp = this.dmsService.v1DmsFileArchiveFileIdGet$Response({
          fileId: this.archiveFolderId
        });
      } else {
        mess = 'Folder is archived.';
        resp = this.dmsService.v1DmsFolderArchiveFolderIdGet({
          folderId: this.archiveFolderId
        });
      }
      resp.subscribe(
        response => {
          this.archiveFolderId = 0;
          this.modalService.dismissAll();
          this.toastDisplay.showSuccess(mess);
          this.getFilelist();
        }
      );
    }
  }

  /**** event fire on move folder select */
  public async onSelectionChanged(event, docType, approveDoc?: boolean) {
    this.selectFolder = '';
    this.isExist = false;
    this.isExistErr = '';
    if (docType) {
      const loading = approveDoc ? 'approveLoading' : 'moveLoading';
      if (
        approveDoc && event.id &&
        +this.selectedSourceFullPath.folderId === +event.id
      ) {
        this.selectFolder = event;
      } else {
        try {
          this[loading] = true;
          const fileName = this.selectedSourceFullPath.fileName;
          let res: any = await this.dmsService.v1DmsFileIsFileExistGet({
            folderId: event.id,
            fileName
          }).toPromise();

          res = JSON.parse(res).results;
          if (res) {
            this.isExist = true;
            this.isExistErr = approveDoc ? this.errorData.document_exists_err : this.errorData.document_name_exist;
          } else {
            this.selectFolder = event;
          }
          this[loading] = false;
        } catch (e) {
          this[loading] = false;
        }
      }
    } else {
      if (this.selected && this.selected.id && +this.selected.id === +event.id) {
        this.isExist = true;
        this.isExistErr = this.errorData.folder_name_exist;
      } else if (
        this.selectedSourceFullPath &&
        +this.selectedSourceFullPath.id === +event.id
      ) {
        this.isExist = true;
        this.isExistErr = this.errorData.select_other_folder;
      } else {
        this.selectFolder = event;
      }
    }
  }

  /**** function to move folder */
  moveFolderOrDoc(contant, row) {
    this.selectFolder = '';
    this.isExist = false;
    this.isExistErr = '';
    this.selectedSourceFullPath = row;
    this.openPersonalinfo(contant, '', '');
  }

  /*** function to save move folder */
  async saveMoveFolderOrDoc(type: string) {
    if (!this.selectFolder || !this.selectedSourceFullPath) {
      return;
    }

    this.moveLoading = true;

    // Get Folder Details for folder path
    const res: any = await this.dmsService.v1DmsGetFolderDetailFolderIdGet({ folderId: this.selectFolder.id }).toPromise();
    const folder = JSON.parse(res).results;
    this.selectFolder.sourceFullPath = folder.folderPath;

    let url: any;
    if (type === 'folder') {
      const folderName = this.selectedSourceFullPath.name;
      this.dmsService
        .v1DmsFolderCreateFolderNameGet({
          folderName,
          isSystem: false,
          currentFolderFullPath: this.selectFolder.sourceFullPath
        })
        .subscribe(
          response => {
            const resOb = JSON.parse(response as any);
            if (!resOb.results.id) {
              this.isExist = true;
              this.isExistErr = resOb.results ? resOb.results : this.errorData.folder_name_exist;
            } else {
              url = this.dmsService.v1DmsFolderMoveGet$Response({
                sourceFullPath: this.selectedSourceFullPath.folderPath,
                targetFullPath: this.selectFolder.sourceFullPath + '/' + folderName
              });
              url.subscribe(
                (resp: any) => {
                  const resObj = JSON.parse(resp.body as any);
                  if (!resObj.results.id) {
                    this.isExist = true;
                    this.isExistErr = resObj.results ? resObj.results : this.errorData.folder_name_exist;
                  } else {
                    this.modalService.dismissAll();
                    this.isExist = false;
                    this.isExistErr = '';
                    this.selectFolder = '';
                    this.selectedSourceFullPath = null;
                    this.toastDisplay.showSuccess(
                      this.errorData.folder_moved
                    );
                    this.getFilelist();
                  }
                  this.moveLoading = false;
                },
                err => {
                  this.moveLoading = false;
                }
              );
            }
          },
          err => {
            this.moveLoading = false;
          }
        );
    } else {
      const filename = this.selectedSourceFullPath.fileName;
      url = this.dmsService.v1DmsFileMoveGet$Response({
        sourceFullPath: this.selectedSourceFullPath.fullFilePath,
        targetFullPath: this.selectFolder.sourceFullPath + '/' + filename
      });
      url.subscribe(
        (response: any) => {
          this.moveLoading = false;
          const ob = JSON.parse(response.body as any);
          if (ob && ob.results && !ob.results.id) {
            this.isExist = true;
            this.isExistErr = ob.results
              ? ob.results
              : this.errorData.document_name_exist;
          } else {
            this.modalService.dismissAll();
            this.isExist = false;
            this.isExistErr = '';
            this.selectFolder = '';
            this.selectedSourceFullPath = null;
            this.toastDisplay.showSuccess(this.errorData.document_moved);
            this.getFilelist();
          }
        },
        err => {
          this.moveLoading = false;
        }
      );
    }
  }

  /**** function to goto edit document */
  gotoEditDocument(val: any): void {
    this.indexDbService.addObject('firmInfo', this.firmInfo);
    const navigationExtras: NavigationExtras = {
      queryParams: {
        folderId: val.folderId,
        documentId: val.id,
        clientId: this.clientId,
        pageType: this.pageType,
        matterId: this.matterId
      }
    };
    this.router.navigate(['/manage-folders/upload-document'], navigationExtras);
  }

  /**
   * @param contant Function to open download popup
   *
   */
  public openDownload(
    contant,
    row,
    isVersionSelected,
    isDownloadOnly?: boolean
  ) {
    this.isVersionSelected = isVersionSelected;
    this.selectedRowForDownload = row;
    if (isDownloadOnly || row.documentSigningStatus == DocumentSigningStatus.PendingSignature) {
      this.downloadDocument(true);
      return;
    }
    this.openPersonalinfo(contant, '', '');
  }

  /**
   *
   * Function to download file
   */
  public async downloadDocument(isDownloadOnly, id?: number) {
    this.modalService.dismissAll();
    this.loading = true;
    const fileId = id
      ? id
      : this.selectedRowForDownload.id
        ? this.selectedRowForDownload.id
        : this.selectedRowForDownload.dmsFileId;
    try {
      const obj = {
        action: 'download',
        dmsFileId: fileId,
        id: 0,
        isActive: true,
        viewedBy: this.currentUserInfo.id,
        viewedByName: this.currentUserInfo.lastName
          ? this.currentUserInfo.firstName + ' ' + this.currentUserInfo.lastName
          : this.currentUserInfo.firstName
      };
      await this.dmsService
        .v1DmsFileViewerHistoryPost$Json({ body: obj })
        .toPromise();
      const suc: any = await this.dms.v1DownloadLatestFile(+fileId).toPromise();
      const objRes: any = suc.body;
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(
          objRes,
          this.selectedRowForDownload.fileName
        );
      } else {
        const blobURL = window.URL.createObjectURL(objRes);
        const anchor = document.createElement('a');
        anchor.download = this.selectedRowForDownload.fileName;
        anchor.href = blobURL;
        anchor.click();
      }
      if (!isDownloadOnly) {
        this.checkOutFile();
      } else {
        this.modalService.dismissAll();
        this.selectedRowForDownload = {};
        this.getFilelist(this.isVersionSelected ? 'file' : 'folder');
      }
      this.loading = false;
    } catch (err) {
      this.loading = false;
    }
  }

  /**
   *
   * Function to checkout file
   */
  private checkOutFile() {
    const fileId = this.selectedRowForDownload.id
      ? this.selectedRowForDownload.id
      : this.selectedRowForDownload.dmsFileId;
    this.dmsService
      .v1DmsFileCheckoutDmsFileIdGet({ dmsFileId: +fileId })
      .subscribe(
        response => {
          const res = JSON.parse(response as any);
          this.modalService.dismissAll();
          this.selectedRowForDownload = {};
          this.getFilelist(this.isVersionSelected ? 'file' : 'folder');
        },
        err => { }
      );
  }

  /**
   * Function to open check-in document popup
   */
  public checkInDocument(contant, row) {
    this.id = +row.id;
    this.openPersonalinfo(contant, '', '');
  }

  /**
   *
   * function to open force check-in document popup
   */
  public forceCheckInDocument(contant, row) {
    this.id = +row.id;
    this.openPersonalinfo(contant, '', '');
  }

  /**
   *
   * Function to check-in document
   */
  public documentCheckIn() {
    this.loading = true;
    this.modalService.dismissAll();
    this.dmsService
      .v1DmsFileCheckinDmsFileIdGet({ dmsFileId: +this.id })
      .subscribe(
        () => {
          this.loading = false;
          this.id = 0;
          this.toastDisplay.showSuccess('File checked-in.');
          this.getFilelist();
        },
        () => {
          this.loading = false;
        }
      );
  }

  /**
   *
   * Function to force check-in document
   */
  public documentForceCheckIn() {
    this.loading = true;
    this.modalService.dismissAll();
    this.dmsService
      .v1DmsFileForcecheckinDmsFileIdGet({ dmsFileId: +this.id })
      .subscribe(
        response => {
          this.loading = false;
          const res = JSON.parse(response as any);
          this.id = 0;
          if (!isNaN(res.results)) {
            this.toastDisplay.showSuccess('File checked-in.');
            this.getFilelist();
          } else {
            this.toastDisplay.showError(res.results);
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  /**
   *
   * function to search folder or doc
   */
  checkSearch() {
    this.checkSerachObs = this.searchForm.get('searchInput').valueChanges
      .debounceTime(1000)
      .subscribe(val => {
        const search = val ? val.trim().replace(/ +/g, ' ') : '';
        if (search) {
          this.searchHighlight = search;
          this.searchFolderOrDoc(search);
        } else {
          this.searchList = [];
          this.showSearchList = false;
        }
      });
  }

  @HostListener('scroll', ['$event']) onScroll(event: any) {
    if (!this.searchLoading && (event.target.offsetHeight + event.target.scrollTop >= event.target.scrollHeight - 5) && !this.loadAllRecord) {
      // const index = this.searchList.length / this.pageSize;
      this.pageIndex = this.pageIndex + 1;
      this.searchFolderOrDoc(this.searchText, true);
    }
  }


  /**
   * Function to search for folder or file
   * @param search Searching keyword
   */
  async searchFolderOrDoc(search: any, isScroll = false): Promise<any> {
    try {
      if (this.request) {
        this.request.unsubscribe();
      }
      if (search && search !== '' && search.length >= 3) {
        this.searchLoading = true;
        this.showSearchList = false;
        this.searchText = search;
        this.isScrollSearch = isScroll;

        if (!isScroll) {
          this.pageIndex = 1;
          this.loadAllRecord = false;
        }

        this.request = this.dmsService
          .v1DmsSearchGet$Response({
            search: search,
            pageIndex: this.pageIndex,
            pageSize: this.pageSize
          }).subscribe(res => {
            const result: any = JSON.parse(res.body as any).results;
            const list = result.files;
            this.totalResultCount = result.searchResultCount;
            if (!isScroll) {
              this.searchList = [...list];
            } else {
              let searchList = this.searchList.concat(list);
              this.searchList = searchList;
            }
            if (!list.length || this.searchList.length == this.totalResultCount) {
              this.loadAllRecord = true;
            }
            for (const data of this.searchList) {
              data['fileImage'] = this.commonService.getFileImage(data.fileName);
              data['fullFilePathArr'] = data.fullFilePath.split('quarto-dms-data/').pop().split('/');
              data['getTruncatedCategoryName'] = this.commonService.getTruncatedName(data.fileCategories, 12);
            }
            this.searchLoading = false;
            this.showSearchList = true;
          }, err => {
            this.searchList = [];
            this.searchLoading = false;
            this.showSearchList = false;
          });

      }

    } catch (err) {
      this.searchList = [];
      this.searchLoading = false;
      this.showSearchList = false;
    }
  }

  /**
   *
   * Function to add configs
   */
  public addConfigs() {
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.opts = {
      position: 'right',
      barBackground: '#413a93',
      barOpacity: '1',
      barWidth: '4',
      barBorderRadius: '4',
      barMargin: '2px',
      gridOpacity: '1',
      gridBackground: '#e7edf3',
      gridWidth: '8',
      gridMargin: '0',
      gridBorderRadius: '4',
      alwaysVisible: true
    };
  }

  /**
   *
   * Function to open unarchive folder popup
   */
  public getunarchiveId(contant, row) {
    this.archiveFolderId = row.id;
    if (row.fileName) {
      this.unarchiveFileName = row.fileName;
    } else {
      this.unarchiveFileName = null;
    }
    this.openPersonalinfo(contant, '', '');
  }

  /**
   *
   * Function to unarchive folder
   */
  public unArchiveFolder(type?: string) {
    if (this.archiveFolderId !== 0) {
      let resp: any;
      let mess = '';
      if (type && type === 'file') {
        mess = 'Document is Unarchived.';
        resp = this.dmsService.v1DmsFileUnarchiveFileIdGet$Response({
          fileId: this.archiveFolderId
        });
      } else {
        mess = 'Folder is unarchived.';
        resp = this.dmsService.v1DmsFolderUnarchiveFolderIdGet({
          folderId: this.archiveFolderId
        });
      }
      resp.subscribe(
        () => {
          this.archiveFolderId = 0;
          this.modalService.dismissAll();
          this.toastDisplay.showSuccess(mess);
          this.getFilelist();
        }
      );
    }
  }

  /**
   * select status type drop down
   */
  public selectOwnerDropDown(event) {
    this.titleOwner = '';
    if (event.length > 0) {
      this.titleOwner = event.length;
    } else {
      this.titleOwner = 'All';
    }
  }

  /**
   *
   * Clear status filter
   */
  public clearOwnerFilter() {
    this.selectedOwner = [];
    this.filterOwnerArray.forEach(item => (item.checked = false));
    this.titleOwner = 'All';
    this.folderList = [...this.oriArr];
    this.applyFilterOwnerStatus();
  }

  /**
   *
   * Function to apply filters in table
   */
  public applyFilterOwnerStatus() {
    if (this.viewEsignHistoryFlag) {
      return;
    }
    if (this.selectedOwner && this.selectedOwner.length > 0 && this.selectedCategory && this.selectedCategory.length > 0 && this.selectedStatus && this.selectedStatus.length > 0) {
      const temp = this.oriArr.filter((item) => {
        if (item.owner && item.owner.id && this.selectedOwner.indexOf(item.owner.id) !== -1 && (this.selectedStatus.indexOf((item.status.toLowerCase()) !== -1) || item.checkedOutTo)) {
          let categoryMatched = false;
          item.categories.forEach(category => {
            if (this.selectedCategory.indexOf(category.id) !== -1) {
              categoryMatched = true;
            }
          });
          if (categoryMatched) {
            return this.validatReturnStatus(item);
          }
        }
      });
      // update the rows
      this.folderList = temp;
    } else if (this.selectedOwner.length > 0 && this.selectedStatus.length > 0 && !this.selectedCategory.length) {
      const temp = this.oriArr.filter((item) => {
        if (item.owner && item.owner.id && this.selectedOwner.indexOf(item.owner.id) !== -1) {
          return this.validatReturnStatus(item);
        }
      });
      // update the rows
      this.folderList = temp;
    } else if (this.selectedOwner && this.selectedOwner.length > 0) {
      const temp = this.oriArr.filter(item => {
        if (
          item.owner &&
          item.owner.id &&
          this.selectedOwner.indexOf(item.owner.id) !== -1
        ) {
          if (this.selectedCategory && this.selectedCategory.length > 0) {
            if (item.categories) {
              let categoryMatched = false;
              item.categories.forEach(category => {
                if (this.selectedCategory.indexOf(category.id) !== -1) {
                  categoryMatched = true;
                }
              });
              if (categoryMatched) {
                return item;
              }
            }
          } else {
            return item;
          }
        }
      });
      // update the rows
      this.folderList = temp;
    } else if (this.selectedCategory && this.selectedCategory.length > 0) {
      const temp = this.oriArr.filter(item => {
        if (item.categories) {
          let categoryMatched = false;
          item.categories.forEach(category => {
            if (this.selectedCategory.indexOf(category.id) !== -1) {
              categoryMatched = true;
            }
          });
          if (categoryMatched) {
            return item;
          }
        }
      });
      // update the rows
      this.folderList = temp;
    } else if (this.selectedStatus && this.selectedStatus.length > 0) {
      localStorage.setItem('filterStatusArrCopy', JSON.stringify(this.filterStatusArray));
      const temp = this.oriArr.filter((item) => {
        return this.validatReturnStatus(item);
      });
      // update the rows
      this.folderList = temp;
    } else {
      if (this.filterOwnerArray.length && this.filterStatusArray.length) {
        this.folderList = [...this.oriArr];
      }
    }
    this.updateDatatableFooterPage();
  }

  validatReturnStatus(item: any) {
    if ((item.status && this.selectedStatus.indexOf(item.status.toLowerCase()) !== -1) && this.selectedStatus.includes(item.status.toLowerCase())) {
      return item;
    } else if (item.checkedOutTo && this.selectedStatus.includes('checkedOut')) {
      return item;
    }
  }

  /**
   * select status type drop down
   *
   * @param event Status
   */
  public selectStatusDropDown(event) {
    this.titleStatus = '';
    if (event.length > 0) {
      this.titleStatus = event.length;
    } else {
      this.titleStatus = 'All';
    }
  }

  /**
   * Clear status filter
   */
  public clearStatusFilter() {
    this.selectedStatus = [];
    localStorage.removeItem('filterStatusArrCopy');
    this.filterStatusArray.forEach(item => (item.checked = false));
    this.titleStatus = 'All';
    this.folderList = [...this.oriArr];
    this.applyFilterOwnerStatus();
  }

  /**
   * select category type drop down
   *
   * @param event Category
   */
  public selectCategoryDropDown(event) {
    this.titleCategory = '';
    if (event.length > 0) {
      this.titleCategory = event.length;
    } else {
      this.titleCategory = 'All';
    }
  }

  /**
   *
   * Clear category filter
   */
  public clearCategoryFilter() {
    this.selectedCategory = [];
    this.filterCategoryArray.forEach(item => (item.checked = false));
    this.titleCategory = 'All';
    this.folderList = [...this.oriArr];
    this.applyFilterOwnerStatus();
  }

  /**
   * Function to redirect to upload document page
   */
  public uploadDocument() {
    this.indexDbService.addObject('firmInfo', this.firmInfo);
    if (this.commonComponent) {
      const navigationExtras: NavigationExtras = {
        queryParams: {
          clientId: this.clientId,
          pageType: this.pageType
        }
      };

      if (this.matterId) {
        navigationExtras.queryParams.matterId = this.matterId;
      }

      localStorage.setItem('done', 'true');
      this.setFoldersAndNavigateToUpload(navigationExtras);
    } else if (this.commonFromMatterDetails) {
      const navigationExtras: NavigationExtras = {
        queryParams: {
          matterId: this.matterId,
          pageType: this.pageType
        }
      };
      this.setFoldersAndNavigateToUpload(navigationExtras);
    } else {
      this.setFoldersAndNavigateToUpload();
    }
  }

  setFoldersAndNavigateToUpload(extras?) {
    const parentId = this.firmInfo && this.firmInfo.length >= 2 ? 2 : 1;
    const multiFolderSelection = {
      current: this.firmInfo[this.firmInfo.length - 1],
      parent: this.firmInfo[this.firmInfo.length - parentId].id
    };

    UtilsHelper.setObject('multiFolderSelection', multiFolderSelection);
    this.router.navigate(['/manage-folders/upload-document'], extras);
  }

  /**
   * @param id Doc ID
   * Function to replace document
   */
  public replaceDocument(row) {
    let paths = [];
    if (row.fullFilePath) {
      paths = row.fullFilePath.split('/');
    } else {
      if (this.selected.folderPath) {
        const path = `${this.selected.folderPath}/${row.fileName}`;
        paths = path.split('/');
      }
    }

    const clientId = paths[5] === 'Clients' && paths[6] && !isNaN(+paths[6]) ? paths[6] : null;
    const matterId = paths[7] === 'Matters' && paths[8] && !isNaN(+paths[8]) ? paths[8] : null;

    this.indexDbService.addObject('firmInfo', this.firmInfo);

    const navigationExtras: NavigationExtras = {
      queryParams: {
        documentId: row.id,
        folderId: this.selected.id
      }
    };

    if (clientId) {
      navigationExtras.queryParams.clientId = +clientId;
    }

    if (matterId) {
      navigationExtras.queryParams.matterId = +matterId;
    }

    if (this.pageType) {
      navigationExtras.queryParams.matterId = this.pageType;
    }

    this.router.navigate(
      ['/manage-folders/replace-document'],
      navigationExtras
    );
  }

  public onSelectRow(event?: any) {
    const bulkActions = this.bulkActions;
    bulkActions.map(obj => {
      obj.disabled = true;
    });
    this.bulkActions = [...bulkActions];
    this.RevokeAccessFilesManage(event);
    if (event && event.selected && event.selected.length) {
      this.selectedRowLength = event.selected.length;
      this.selectedTablerow = event.selected;
      this.archivedselectedFiles = [];
      this.archivedselectedFolders = [];
      this.unarchivedselectedFiles = [];
      this.unarchivedselectedFolders = [];
      this.selectedCheckoutfiles = [];
      this.selectedNonCheckoutfiles = [];
      this.shareDocumentSelected = [];
      event.selected.forEach(element => {
        // for archiving/unarchiving folders and files
        if (element.status !== 'Archived') {
          if (element.name && !element.fileName) {
            this.archivedselectedFolders.push(element.id);
          } else {
            this.archivedselectedFiles.push(element.id);
          }
        } else {
          if (element.name && !element.fileName) {
            this.unarchivedselectedFolders.push(element.id);
          } else {
            this.unarchivedselectedFiles.push(element.id);
          }
        }
        // For downloading checked-out/ non checked-out files
        if (element.fileName) {
          this.shareDocumentSelected.push(element);
          if (element.checkedOutTo) {
            this.selectedCheckoutfiles.push(element);
          } else {
            this.selectedNonCheckoutfiles.push(element);
          }
        }
      });
    } else {
      this.archivedselectedFiles = [];
      this.archivedselectedFolders = [];
      this.unarchivedselectedFiles = [];
      this.unarchivedselectedFolders = [];
      this.selectedCheckoutfiles = [];
      this.selectedNonCheckoutfiles = [];
      this.selectedRowLength = 0;
      this.selectedTablerow = [];
    }
    this.reviewPendingDocIds = [];
    event.selected.forEach(el => {
      if (el.fullFilePath && this.validatePath(el.fullFilePath) && el.status === 'Client Pending Review') {
        this.reviewPendingDocIds.push(el.id);
      }
    });
    if (this.selectedTablerow.length > 1 && (this.selectedTablerow[0].isSystemFolder || this.selectedTablerow[0].isInsideSystemFolder) && this.firmInfo.length > 1) {
      if (
        this.selectedTablerow[0].canGrantSharingRight ||
        this.selectedTablerow[0].hasSharingRight
      ) {
        this.shareRightsAccess = true;
      } else {
        this.shareRightsAccess = false;
      }
      this.initializeBulkAction(this.shareDocId, !this.shareRightsAccess);
      this.shareRightsAccess = false;
    }
    if (this.selectedTablerow.length >= 2) {
      const archivDisable = !this.archivedselectedFiles.length && !this.archivedselectedFolders.length ? true : false;
      this.toggleBulkDisable(1, archivDisable);

      const unarchivDisable = !this.unarchivedselectedFolders.length && !this.unarchivedselectedFiles.length ? true : false;
      this.toggleBulkDisable(2, unarchivDisable);
    }
  }

  toggleBulkDisable(id, disabled) {
    const indx = this.bulkActions.findIndex(x => +x.id === id);
    if (indx > -1) {
      this.bulkActions[indx].disabled = disabled;
    }
  }

  selectBulkAction(archiveTemplate, unarchiveTemplate, multiplenoncheckedout, multiplecheckedout, shareDocumentTemplate, sharedClientDom, noSharedClientDom, rejectReasonDom, approveDocDom) {
    if (this.selectedBulkAction === 'Archive') {
      if (this.archivedselectedFiles.length || this.archivedselectedFolders.length) {
        this.openPersonalinfo(archiveTemplate, '', '');
      } else {
        this.toastDisplay.showError('No File/Folder to Archive.');
        this.clearSelectionsAndResetBulk();
      }
    }

    if (this.selectedBulkAction === 'Unarchive') {
      if (this.unarchivedselectedFolders.length || this.unarchivedselectedFiles.length) {
        this.openPersonalinfo(unarchiveTemplate, '', '');
      } else {
        this.toastDisplay.showError('No File/Folder to Unarchive.');
        this.clearSelectionsAndResetBulk();
      }
    }

    // Download Case
    if (this.selectedBulkAction === 'Download') {
      let folders = false;
      // Check if folders are selected
      if (
        this.unarchivedselectedFolders.length ||
        this.archivedselectedFolders.length
      ) {
        folders = true;
      }
      // If All files are both/ ! checked out
      if (
        this.selectedCheckoutfiles.length &&
        this.selectedNonCheckoutfiles.length &&
        !folders
      ) {
        if (this.isdmsAdmin) {
          // DMS | CASE 5
          this.openPersonalinfo(multiplecheckedout, '', '');
        } else {
          // Non-DMS | CASE 6
          this.openPersonalinfo(multiplecheckedout, '', '');
        }
      } else if (
        !this.selectedCheckoutfiles.length &&
        this.selectedNonCheckoutfiles.length &&
        !folders
      ) {
        // If files are non-checkout only | CASE 2
        this.openPersonalinfo(multiplenoncheckedout, '', '');
      } else if (this.selectedCheckoutfiles.length && !folders) {
        // if only checkout files are there
        if (this.isdmsAdmin) {
          // for DMS aDmin
          this.openPersonalinfo(multiplecheckedout, '', '');
        } else {
          // For non-DMS admin | CASE 7 done
          this.multipleDocumentCheckout(false, false, true);
        }
      } else if (folders) {
        this.toastDisplay.showError(this.errorData.only_docuent_download_error);
        this.downloadSelectedFiles = [];
        this.clearSelectionsAndResetBulk();
      } else {
        this.multipleDocumentCheckout();
      }
    }

    if (this.selectedBulkAction === 'Share Documents') {
      this.shareDocLoading = false;
      const length = this.archivedselectedFolders.length + this.shareDocumentSelected.length;
      this.openShareDocumentModal(shareDocumentTemplate, '', length);
    }

    if (this.selectedBulkAction === 'Revoke Access') {
      this.setDocumentsId(this.revokeFiles, sharedClientDom, noSharedClientDom);
    }

    if (this.selectedBulkAction === 'Reject Documents' || this.selectedBulkAction === 'Approve Documents') {
      this.singleReviewPendingDocId = 0;
      this.rejectDocument(this.selectedBulkAction === 'Reject Documents' ? rejectReasonDom : approveDocDom, this.selectedBulkAction === 'Reject Documents' ? 'reject' : 'approve');
    }

    // BULK DOWNLOAD
    if (this.selectedBulkAction === 'Download Files') {
      this.bulkDownload();
    }
  }

  getFolderId(i?) {
    i = !i ? this.firmInfo.length - 1 : i;
    const firm = this.firmInfo[i];
    if (firm.isSystemFolder) {
      return firm.id;
    } else {
      this.getFolderId(i - 1);
    }
  }

  archiveBulkData() {
    let error = false;
    Promise.all([
      this.bulkArchiveFolder().catch(err => {
        error = true;
      }),
      this.bulkArchiveFiles().catch(err => {
        error = true;
      })
    ]).then(() => {
      if (!error) {
        this.toastDisplay.showSuccess(this.errorData.folder_archive_success);
      }
      this.modalService.dismissAll();
      this.selectedRowLength = 0;
      if (this.isDocumentListing) {
        this.getFilelist('file');
        this.table.selected = [];
      } else if (this.isCheckInListing) {
        this.getFilelist('checkout');
        this.table.selected = [];
      } else {
        this.getFilelist('folder');
        this.table.selected = [];
      }
    });
  }

  unarchiveBulkData() {
    let error = false;
    Promise.all([
      this.bulkUnarchiveFolder().catch(err => {
        error = true;
      }),
      this.bulkUnarchiveFiles().catch(err => {
        error = true;
      })
    ]).then(() => {
      if (!error) {
        this.toastDisplay.showSuccess(this.errorData.folder_unarchive_success);
      }
      this.selectedRowLength = 0;
      this.modalService.dismissAll();
      if (this.isDocumentListing) {
        this.getFilelist('file');
        this.table.selected = [];
      } else if (this.isCheckInListing) {
        this.getFilelist('checkout');
        this.table.selected = [];
      } else {
        this.getFilelist();
        this.table.selected = [];
      }
    });
  }

  /*** function to bulk archive folders */
  async bulkArchiveFolder(): Promise<any> {
    if (this.archivedselectedFolders.length) {
      await this.dmsService
        .v1DmsFolderArchivePost$Json$Response({
          body: this.archivedselectedFolders
        })
        .toPromise();
    }
  }

  /*** function to bulk archive files */
  async bulkArchiveFiles(): Promise<any> {
    if (this.archivedselectedFiles.length) {
      await this.dmsService
        .v1DmsFileArchivePost$Json$Response({
          body: this.archivedselectedFiles
        })
        .toPromise();
    }
  }

  /*** function to bulk unarchive folders */
  async bulkUnarchiveFolder(): Promise<any> {
    if (this.unarchivedselectedFolders.length) {
      await this.dmsService
        .v1DmsFolderUnarchivePost$Json$Response({
          body: this.unarchivedselectedFolders
        })
        .toPromise();
    }
  }

  /*** function to bulk unarchive files */
  async bulkUnarchiveFiles(): Promise<any> {
    if (this.unarchivedselectedFiles.length) {
      await this.dmsService
        .v1DmsFileUnarchivePost$Json$Response({
          body: this.unarchivedselectedFiles
        })
        .toPromise();
    }
  }

  async singleOverrideCheckout() {
    this.modalService.dismissAll();
    this.loading = true;
    this.dmsService
      .v1DmsFileCheckoutOverridePost$Json$Response({ body: [this.selectedRowForDownload.id] })
      .subscribe(
        res => {
          this.downloadDocument(true);
        },
        err => {
          this.loading = false;
        }
      );
  }

  multipleDocumentCheckout(
    checkOut?: boolean,
    includeAllfiles?: boolean,
    downloadCheckoutOnly?: boolean
  ) {
    let fileArr = [];
    const fileIdArr = [];
    if (includeAllfiles) {
      fileArr = this.selectedCheckoutfiles.concat(
        this.selectedNonCheckoutfiles
      );
      fileArr.forEach(file => {
        fileIdArr.push(file.id);
      });
    } else {
      const selectedArr = downloadCheckoutOnly
        ? this.selectedCheckoutfiles
        : this.selectedNonCheckoutfiles;
      selectedArr.forEach(file => {
        fileArr.push(file);
        fileIdArr.push(file.id);
      });
    }

    if (checkOut) {
      this.dmsService
        .v1DmsFileCheckoutMultiplePost$Json$Response({ body: fileIdArr })
        .subscribe(
          res => {
            this.modalService.dismissAll();
            if (includeAllfiles) {
              this.toastDisplay.showSuccess(
                this.errorData.all_documents_checkout_success
              );
            }
            this.downloadMultiDocuments(fileArr);
          },
          err => { }
        );
    } else {
      this.downloadMultiDocuments(fileArr);
    }
  }

  async downloadMultiDocuments(fileArr: Array<any>) {
    const len = fileArr.length;
    for (let i = 0; i < len; i++) {
      const file = fileArr[i];
      this.selectedRowForDownload = file;
      await this.downloadDocument(true);
    }
    this.table.selected = [];
    this.downloadChoiceOption = 'Available';
    this.clearSelectionsAndResetBulk();
  }

  public submitDownloadOption() {
    if (this.downloadChoiceOption === 'Available') {
      const fileArr = this.selectedCheckoutfiles.concat(
        this.selectedNonCheckoutfiles
      );
      const checkoutfiles = [];
      this.selectedCheckoutfiles.forEach(file => {
        checkoutfiles.push(file.id);
      });
      this.dmsService
        .v1DmsFileCheckoutAvailablePost$Json$Response({ body: checkoutfiles })
        .subscribe(
          res => {
            const mess = JSON.parse(res.body as any).results;
            this.toastDisplay.showSuccess(mess);
            this.downloadMultiDocuments(fileArr);
          },
          err => { }
        );
    }
    if (this.downloadChoiceOption === 'All') {
      // checked out documents are checked in
      const fileIDArr = [];
      this.selectedCheckoutfiles.forEach(file => {
        fileIDArr.push(file.id);
      });
      this.dmsService
        .v1DmsFileCheckoutAllAftercheckinPost$Json$Response({ body: fileIDArr })
        .subscribe(
          res => {
            const response = res;
            this.multipleDocumentCheckout(true, true);
          },
          err => { }
        );
    }
    if (this.downloadChoiceOption === 'No') {
      const fileArr = this.selectedCheckoutfiles.concat(
        this.selectedNonCheckoutfiles
      );
      this.downloadMultiDocuments(fileArr);
    }
  }

  onActivate(event: any, index?) {
    if (
      event.type === 'dblclick' &&
      !event.row.fileName &&
      event.row.status !== 'Archived'
    ) {
      if (this.viewEsignHistoryFlag) {
        return;
      }
      const type = 'folder';
      const row = event.row;
      this.onSelect(row, type);
    }
    let idx = (index) ? index : this.folderList.findIndex(x => x.id == event.row.id);
    if(idx > -1 && event.type === 'click'){
      if(this.currentHighlightRow != this.folderList[idx].id){
        this.folderList[idx].ishighlight = true;
        this.folderList.map(x => {
          if(x.id == this.currentHighlightRow){
            x.ishighlight = false;
          }
        });
        this.currentHighlightRow = this.folderList[idx].id;
      }
    }
  }

  showViewerHistory(row) {
    this.isViewerHistory = true;
    this.dmsService
      .v1DmsFileViewerHistoryFileIdGet({ fileId: row.dmsFileId })
      .subscribe(
        res => {
          const resp = JSON.parse(res as any).results;
          this.folderList = resp && resp.length ? resp : [];
        },
        () => {
          this.folderList = [];
        }
      );
  }

  copyToClipboard(): void {
    this.sharedService.copyToClipboard(this.shareLink);
    this.toastDisplay.showSuccess(this.errorData.document_link_copied);
  }

  isActionAvailable(file: any): boolean {
    if (file && file.fullFilePath) {
      const splitString = file.fullFilePath.split('/');
      if (splitString[splitString.length - 1] === 'Clients') {
        return false;
      } else {
        if (file.isFillableTemplate) {
          if (
            file.fullFilePath.includes('Employees') &&
            !file.fullFilePath.includes('Clients')
          ) {
            return false;
          } else {
            if (file.fullFilePath.indexOf('Employees') !== -1) {
              return file.fullFilePath.indexOf('Clients') <
                file.fullFilePath.indexOf('Employees')
                ? true
                : false;
            } else {
              return true;
            }
          }
        } else {
          return false;
        }
      }
    } else {
      return this.validatePath(file.folderPath);
    }
  }

  validatePath(path: string): boolean {
    const splitString = path ? path.split('/') : [];
    if (
      splitString && splitString.length &&
      splitString[splitString.length - 1] !== 'Clients'
    ) {
      if (path.includes('Employees') && !path.includes('Clients')) {
        return false;
      } else {
        if (path.indexOf('Employees') !== -1) {
          return path.indexOf('Clients') < path.indexOf('Employees')
            ? true
            : false;
        } else {
          return true;
        }
      }
    } else {
      return false;
    }
  }

  generateDocument(val: any): void {
    this.indexDbService.addObject('firmInfo', this.firmInfo);
    const navigationExtras: NavigationExtras = {
      queryParams: {
        folderId: val.folderId,
        documentId: val.id,
        clientId: this.clientId,
        pageType: this.pageType
      }
    };
    this.router.navigate(
      ['/manage-folders/generate-document'],
      navigationExtras
    );
  }

  async openGrantShareRightsModal(content: any, row): Promise<any> {
    this.shareFolderId = +row.id;
    this.selectedEmployeeArray = [];
    this.oriEmployeeShareRights = [];
    this.employeeShareRights = [];
    this.titleEmployee = 'Select employee';
    this.employeeArray.forEach(x => {
      x.checked = false;
      x.disabled = false;
    });
    try {
      let resp: any = await this.dmsService
        .v1DmsEmployeesFoldersFolderIdShareRightsGet$Json({
          folderId: this.shareFolderId
        })
        .toPromise();
      resp = resp.results;
      if (resp && resp.employeeShareRights && resp.employeeShareRights.length) {
        this.oriEmployeeShareRights = resp.employeeShareRights.reduce(
          (acc, cur) =>
            acc.some(x => x.employeeId === cur.employeeId)
              ? acc
              : acc.concat(cur),
          []
        );
        this.employeeShareRights = [...this.oriEmployeeShareRights];
        this.employeeShareRights = _.orderBy(this.employeeShareRights, a =>
          a.employeeLastName.toLowerCase()
        );
        this.employeeShareRights.forEach(x => {
          if (!this.selectedEmployeeArray.includes(x.employeeId)) {
            this.selectedEmployeeArray.push(x.employeeId);
          }
          const idx = this.employeeArray.findIndex(y => y.id === x.employeeId);
          if (idx > -1) {
            this.employeeArray[idx].checked = true;
            if (!x.canRevoke) {
              this.employeeArray[idx].disabled = true;
            }
          }
        });
        // this.employeesSelectionChanged(this.selectedEmployeeArray);
      }
      this.modalService
        .open(content, {
          size: 'lg',
          centered: true,
          backdrop: 'static'
        })
        .result.then(
          result => {
            this.closeResult = `Closed with: ${result}`;
          },
          reason => { }
        );
    } catch (err) { }
  }

  async getEmployessList() {
    const data = {
      includeDetails: false
    };
    let res: any = await this.employeeService
      .v1EmployeesGet$Response(data)
      .toPromise();
    res = JSON.parse(res.body).results;

    const employeeArr = res && res.length ? res : [];
    if (employeeArr && employeeArr.length) {
      this.employeeArray = employeeArr.map(arr => {
        let newArr: any;
        newArr = {
          id: arr.id,
          firstName: arr.firstName,
          lastName: arr.lastName,
          name: `${arr.lastName}, ${arr.firstName}`,
          email: arr.email,
          image: arr.profilePicture,
          roles: arr.role
        };
        return newArr;
      });
    }
  }

  applyEmployess() {
    // console.log('emp');
  }

  employeesSelectionChanged(event) {
    this.titleEmployee = event.length ? event.length : 'Select employee';
    this.updateShareEmployeeArr();
  }

  clearEmployess() {
    this.selectedEmployeeArray = [];
    // tslint:disable-next-line:prefer-for-of
    for (let counter = 0; counter < this.employeeArray.length; counter++) {
      if (this.employeeArray[counter].disabled) {
        this.selectedEmployeeArray.push(this.employeeArray[counter].id);
        continue;
      }
      this.employeeArray[counter].checked = false;
    }
    this.employeesSelectionChanged(this.selectedEmployeeArray);
    this.updateShareEmployeeArr();
  }

  /**** function to update shareEmployee Right Arr */
  updateShareEmployeeArr() {
    const shareEmployeeRightIds = this.employeeShareRights.map(
      right => right.employeeId
    );
    const diff = this.selectedEmployeeArray.filter(
      selected => !shareEmployeeRightIds.includes(selected)
    );
    if (diff && diff.length) {
      diff.forEach(val => {
        const idx = this.employeeArray.findIndex(x => +x.id === +val);
        if (idx > -1) {
          const obj = {
            employeeId: +val,
            canRevoke: true,
            employeeDisplayName: this.employeeArray[idx].name,
            employeeEmail: this.employeeArray[idx].email,
            employeeLastName: this.employeeArray[idx].lastName
          };
          this.employeeShareRights.push(obj);
        }
      });
      this.employeeShareRights = _.orderBy(this.employeeShareRights, a =>
        a.employeeLastName.toLowerCase()
      );
      this.selectedEmployeeArray = [
        ...this.employeeShareRights.map(x => x.employeeId)
      ];
      for (const data of this.selectedEmployeeArray) {
        data['checkRevoke'] = this.checkRevoke(data);
        data['email'] = this.getEmployeeName(data, 'email');
        data['image'] = this.getEmployeeName(data, 'image');
        data['name'] = this.getEmployeeName(data, 'name');
      }
    }
  }

  getEmployeeName(id, key) {
    const idx = this.employeeArray.findIndex(x => +x.id === +id);
    if (idx > -1) {
      if (key !== 'image') {
        if (!this.employeeArray[idx][key]) {
          const indx = this.employeeShareRights.findIndex(
            x => x.employeeId === id
          );
          if (indx > -1) {
            switch (key) {
              case 'name':
                return this.employeeShareRights[indx].employeeDisplayName;
              case 'email':
                return this.employeeShareRights[indx].employeeEmail;
            }
          }
        } else {
          return this.employeeArray[idx][key];
        }
      }
      return `${environment.shareRightImagePath}${id}_photo_1.jpg`;
    } else {
      this.employeeShareRights.forEach(employee => {
        if (employee.employeeId === id) {
          const index = this.employeeShareRights.indexOf(employee);
          const index2 = this.selectedEmployeeArray.indexOf(employee);
          if (index > -1) {
            this.employeeShareRights.splice(index, 1);
            this.selectedEmployeeArray.splice(index2, 1);
          }
          this.employeesSelectionChanged(this.selectedEmployeeArray);
        }
      });
    }
    return '--';
  }

  /**** function to check revoke access */
  checkRevoke(id) {
    const idx = this.employeeShareRights.findIndex(x => +x.employeeId === +id);
    if (idx > -1) {
      return this.employeeShareRights[idx].canRevoke;
    }
    let revokeAccess = true;
    const index = this.employeeArray.findIndex(x => +x.id === +id);
    if (index !== -1) {
      revokeAccess = this.validateRole(this.employeeArray[index].roles);
    }
    return revokeAccess;
  }

  removeLocalEmployee(id, idx) {
    this.selectedEmployeeArray.splice(idx, 1);
    const tmp = [...this.employeeArray];
    const indx = tmp.findIndex(x => +x.id === +id);
    if (indx > -1) {
      tmp[indx].checked = false;
    }
    this.employeeArray = [...tmp];
    const empTmp = this.employeeShareRights.findIndex(
      x => +x.employeeId === +id
    );
    if (empTmp > -1) {
      this.employeeShareRights.splice(empTmp, 1);
      tmp[indx].checked = false;
    }
    this.employeesSelectionChanged(this.selectedEmployeeArray);
  }

  async updateShareRights(): Promise<any> {
    const previousSharedId = this.oriEmployeeShareRights.map(
      right => right.employeeId
    );
    const employeeDiff = this.selectedEmployeeArray.filter(
      selected => !previousSharedId.includes(selected)
    );
    const revokedEmp = previousSharedId.filter(
      revoked => !this.selectedEmployeeArray.includes(revoked)
    );
    if (!employeeDiff.length && !revokedEmp.length) {
      this.modalService.dismissAll();
      return;
    }
    try {
      await Promise.all([
        this.addShareRight(employeeDiff),
        this.revokeSharedRight(revokedEmp)
      ]);
      this.toastDisplay.showSuccess(this.errorData.grant_share_rights_updated);
      this.modalService.dismissAll();
    } catch (err) {
      this.modalService.dismissAll();
    }
  }

  /***
   * function to grant share right
   */
  async addShareRight(employeeIds): Promise<any> {
    if (employeeIds.length) {
      const body: any = {
        folderId: this.shareFolderId,
        employeeIds
      };
      await this.dmsService
        .v1DmsEmployeesFoldersShareRightsPost$Json$Response({ body })
        .toPromise();
    }
  }

  /***
   * function to revoked share right
   */
  async revokeSharedRight(employeeIds): Promise<any> {
    if (employeeIds.length) {
      await this.dmsService
        .v1DmsEmployeesFoldersFolderIdRevokeShareRightsPatch$Json$Response({
          folderId: this.shareFolderId,
          body: { employeeIds }
        })
        .toPromise();
    }
  }

  async openDocumentAccessModal(content, row: any) {
    this.shareDocLoading = false;
    this.shareDocumentLength = 1;
    this.docAccessArr = [row.id];
    const params = {
      documentId: row.id,
      folderId: this.folderId,
      userId: 0
    };

    this.loadShareDetails(params);
    try {
      this.loading = true;
      if (row) {
        this.shareDocumentRow = row;
      }
      let resp: any = await this.dmsService
        .v1DmsFilesDmsfileIdShareLinkGet({ dmsfileId: row.id })
        .toPromise();
      resp = JSON.parse(resp);
      if (resp && resp.results) {
        this.shareLink = `${window.location.origin}` + resp.results.shareLink + '/' + this.tenantId;
        await this.updateClientArray();

        this.loading = false;
        this.modalService
          .open(content, {
            size: 'lg',
            centered: true,
            backdrop: 'static',
            keyboard: false
          })
          .result.then(
            result => {
              // Final API
            },
            reason => {
              this.onCloseSharePopups();
            }
          );
      }
    } catch (e) {
      this.loading = false;
    }
  }

  onCloseSharePopups() {
    this.clearClientsSelections();
    this.clearClientsSelections(true);
    this.otherUsersArr = [];
    this.otherUserName = '';
    this.linkExpirationDate = '';
    this.shareDocumentPopup = false;
    this.shareDocumentRow = '';
    this.clientsArray = [...this.tempClientArr];
    this.expirationDateErrMsg = '';
    this.extraUsers = [];
    this.revokeUsers = [];
  }

  async loadShareDetails(params) {
    try {
      this.extraUsersClone = [];
      let response: any = await this.dmsService
        .v1DmsDocumentSharedetailsPost$Json({ body: params })
        .toPromise();
      response = JSON.parse(response);
      if (
        response &&
        response.results &&
        response.results.currentAccessList &&
        response.results.currentAccessList.length
      ) {
        this.extraUsers = response.results.currentAccessList;
        this.extraUsersClone = [...response.results.currentAccessList];
        this.linkExpirationDate = response.results.shareExpirationDate;
      }
    } catch (e) {
      console.log(e);
    }
  }

  getClients() {
    this.miscService.v1MiscClientsGet().subscribe((res: any) => {
      const resp = JSON.parse(res).results;
      this.tempClientArr = resp && resp.length ? resp : [];
      this.clientsArray = [...this.tempClientArr];
      this.clientsArray.forEach(item => {
        item.name = item.firstName + ' ' + item.lastName;
        if (!item.email) {
          item.disabled = true;
        }
      });
    });
  }

  clearClientsSelections(assoc?: boolean) {
    const selections = !assoc ? 'selectedClients' : 'selectedClientsAssoc';
    const arr = !assoc ? 'clientsArray' : 'clientsAssocArray';
    this[selections] = [];
    this[arr].forEach(item => (item.checked = false));
    this.selectClientsDropDown(this[selections], assoc);
    this.previousSelectedClients = [];
  }

  addClient(arr, selectedClientsArr) {
    this[selectedClientsArr] = [];
    for (const data of arr) {
      const tempObj = {};
      tempObj['clientId'] = data;
      if (selectedClientsArr === 'selectedClientsArr') {
        tempObj['name'] = this.getClientName(data, 'name');
        tempObj['email'] = this.getClientName(data, 'email');
      } else {
        tempObj['name'] = this.getClientName(data, 'name', true);
      }
      this[selectedClientsArr].push(tempObj);
    }
  }

  removeClient(clientId, selectedClientsArr) {
    for (var i = 0; i < this[selectedClientsArr].length; i++) {
      if (this[selectedClientsArr][i].clientId == clientId) {
        this[selectedClientsArr].splice(i, 1);
        break;
      }
    }
  }

  async applyClients() {
    if (this.isCorporate) {
      return;
    }
    this.selectClientsDropDown(this.selectedClientsAssoc, true);
    if (
      this.selectedClients &&
      this.selectedClients.length &&
      !this.arraysEqual(this.selectedClients, this.previousSelectedClients)
    ) {
      this.selectedClientsAssoc = [];
      this.clientsAssocArray = [];
      try {
        for (const x of this.selectedClients) {
          let resp: any = await this.clientAssocService
            .v1ClientAssociationAllClientIdGet({ clientId: x })
            .toPromise();
          resp = JSON.parse(resp).results;
          resp = resp.filter(t => t.status && t.status !== 'Inactive');
          if (this.firmInfo && this.firmInfo.length) {
            resp = this.returnClientAssocArr(resp);
          }
          this.clientsAssocArray = this.clientsAssocArray.concat(resp);
        }
        this.clientsAssocArray.forEach(item => {
          item.name = item.person;
          if (!item.email) {
            item.disabled = true;
          }
          item.checked = false;
        });
      } catch (err) { }
    }
    setTimeout(() => {
      this.previousSelectedClients = [...this.selectedClients];
    }, 200);
  }

  /***** function to check if two array are identical or not */
  arraysEqual(a, b) {
    if (a === b) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    // tslint:disable-next-line:triple-equals
    if (a.length != b.length) {
      return false;
    }

    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  selectClientsDropDown(event, assoc?: boolean) {
    const key = !assoc ? 'titleClient' : 'titleClientAssoc';
    if (event.length > 0) {
      this[key] = event.length;
    } else {
      this[key] = !assoc ? 'Select a client' : 'Select a client association';
    }
    this.addClient(this.selectedClients, 'selectedClientsArr');
    if (assoc) {
      this.addClient(this.selectedClientsAssoc, 'selectedClientsAssocArr');
    }
  }

  removeSelectedClient(id, assoc?: boolean) {
    const selections = !assoc ? 'selectedClients' : 'selectedClientsAssoc';
    const arr = !assoc ? 'clientsArray' : 'clientsAssocArray';
    const idx = this[selections].findIndex(x => +x === +id);
    const indx = this[arr].findIndex(x => +x.id === +id);

    if (idx > -1) {
      this[selections].splice(idx, 1);
    }

    if (indx > -1) {
      this[arr][indx].checked = false;
    }
    this.selectClientsDropDown(this[selections], assoc);

    if (!assoc) {
      this.applyClients();
    }

    this.removeClient(id, 'selectedClientsArr');
    if (assoc) {
      this.removeClient(id, 'selectedClientsAssocArr');
    }
  }

  getClientName(id, key: string, assoc?: boolean) {
    const arr = !assoc ? 'clientsArray' : 'clientsAssocArray';
    const indx = this[arr].findIndex(x => +x.id === +id);

    if (indx > -1) {
      const fName = this[arr][indx].firstName ? this[arr][indx].firstName : '';
      const lName = this[arr][indx].lastName ? this[arr][indx].lastName : '';

      return key === 'name' ? fName + ' ' + lName : this[arr][indx][key];
    }

    return '';
  }

  addOtherUser() {
    if (this.otherUserName && this.otherUserName.trim() !== '') {
      this.otherUsersArr.push({
        name: this.otherUserName,
        email: '',
        emailError: ''
      });
    }
    this.otherUserName = '';
  }

  removeOtherUser(index: number) {
    this.otherUsersArr.splice(index, 1);
  }

  get disableDocAccess() {
    if (
      this.docAccessArr &&
      this.docAccessArr.length &&
      this.checkOtherUserArr() &&
      this.shareLink &&
      !this.expirationDateErrMsg
    ) {
      return false;
    }
    return true;
  }

  checkOtherUserArr() {
    if (!this.otherUsersArr.length) {
      return true;
    }
    const exist = this.otherUsersArr.some(x => x.emailError);
    const email = this.otherUsersArr.some(x => !x.email);
    return exist || email ? false : true;
  }

  checkEmailUnique(event, idx) {
    if (event.target && event.target.value) {
      const params = {
        emailAddress: event.target.value
      };
      if (this.sharedService.isEmailValid(event.target.value)) {
        if (this.checkOtherUsersEmail(event.target.value, idx)) {
          this.dmsService.v1DmsUsersExternalValidateemailPost$Json({ body: params }).subscribe((res: any) => {
            res = JSON.parse(res);
            if (res && res.results && !res.results.result && res.results.message) {
              this.otherUsersArr[idx].emailError = res.results.message ? res.results.message : 'A user with that email already has access.';
            }
          });
        }
      } else {
        this.otherUsersArr[idx].emailError =
          'Please enter valid email address.';
      }
    } else {
      this.otherUsersArr[idx].emailError = 'Please enter valid email address.';
    }
  }

  checkOtherUsersEmail(val, idx): boolean {
    const index = this.extraUsersClone.findIndex(e => e.email === val);
    if (index !== -1) {
      this.otherUsersArr[idx].emailError = 'A user with that email already has access.';
    } else {
      const ix = this.otherUsersArr.findIndex(e => e.email === val);
      if (ix === -1 || ix === idx) {
        this.otherUsersArr[idx].emailError = '';
      } else {
        this.otherUsersArr[idx].emailError = 'A user with that email already has access.';
      }
    }
    return this.otherUsersArr[idx].emailError ? false : true;
  }

  updateAccess(): void {
    this.commonFuntionToUpdateShareDoc('access');
  }

  /***
   * function to open share document popup
   */
  async openShareDocumentModal(content, row?: any, length?: number) {
    this.shareDocumentLength = length ? length : 1;
    if (row) {
      this.shareDocumentRow = row;
      this.fileId = row.id;
    }
    await this.updateClientArray();
    this.shareDocumentPopup = true;
    this.modalService
      .open(content, {
        size: 'lg',
        centered: true,
        backdrop: 'static'
      })
      .result.then(
        result => {
          // Final API
        },
        reason => {
          this.onCloseSharePopups();
        }
      );
  }

  /***** function to update client array based on individual or corporate */
  async updateClientArray(): Promise<any> {
    this.isCorporate = false;
    const idx = this.firmInfo.findIndex(x => x.name === 'Clients');
    let clientId: number;
    if (this.firmInfo[idx + 1]) {
      const path = this.firmInfo[idx + 1].folderPath.split('/');
      clientId = +path[path.length - 1];
    } else {
      const path = this.shareDocumentRow.folderPath.split('/');
      clientId = +path[path.length - 1];
    }
    const clientArr = this.clientsArray.filter(client => +client.id === +clientId);
    if (clientArr && clientArr[0]) {
      if (!clientArr[0].isCompany) {
        this.clientsArray = [...clientArr];
      } else {
        try {
          this.isCorporate = true;
          this.loading = true;
          let resp: any = await this.clientAssocService
            .v1ClientAssociationAllClientIdGet({ clientId: +clientArr[0].id })
            .toPromise();
          resp = JSON.parse(resp).results;
          let assocArr = [...resp];
          if (resp) {
            const type = [
              'Primary Contact',
              'Billing Contact',
              'General Counsel'
            ];
            resp = resp.filter(
              res =>
                type.includes(res.associationType) &&
                res.status &&
                res.status !== 'Inactive'
            );
            if (this.firmInfo && this.firmInfo.length) {
              assocArr = this.returnClientAssocArr(assocArr);
            }
            this.clientsAssocArray = [...assocArr];
            this.clientsAssocArray.forEach(item => {
              item.name = item.person;
              if (!item.email) {
                item.disabled = true;
              }
              item.checked = false;
            });
            this.clientsArray = [...resp];
            this.clientsArray.forEach(item => {
              item.name = item.firstName + ' ' + item.lastName;
              if (!item.email) {
                item.disabled = true;
              }
            });
          }
          this.loading = false;
        } catch (err) {
          this.loading = false;
        }
      }
    }
  }

  showError() {
    this.toastDisplay.showError(
      'You do not have permission to access this features.'
    );
  }

  applyFilter(): void {
    this.expirationDateErrMsg = '';
    if (this.linkExpirationDate) {
      if (!moment(this.linkExpirationDate).isAfter(moment())) {
        this.expirationDateErrMsg = 'Select a future date.';
      }
    }
  }

  /**
   * function to share document
   */
  shareDocument(): void {
    if (this.checkOtherUserArr()) {
      this.commonFuntionToUpdateShareDoc('share');
    } else {
      const tmp = [...this.otherUsersArr];
      tmp.forEach(x => {
        if (!x.email || this.sharedService.isEmailValid(x.email)) {
          x.emailError = 'Please enter valid email address.';
        }
      });
      this.otherUsersArr = [...tmp];
    }
  }

  /***
   * common function to share document and update access
   */
  async commonFuntionToUpdateShareDoc(type: string) {
    const finalData: any = {};
    if (!finalData.clientIds) {
      finalData.clientIds = [];
    }

    if (!finalData.clientAssociationIds) {
      finalData.clientAssociationIds = [];
    }

    if (!finalData.externalUsers) {
      finalData.externalUsers = [];
    }

    if (!this.isCorporate) {
      finalData.clientIds = this.selectedClients;
    } else {
      this.clientsArray.forEach(e => {
        if (this.selectedClients && this.selectedClients.includes(e.id)) {
          finalData.clientAssociationIds.push({
            personId: e.personId,
            securityGroupId: e.associationTypeId
          });
        }
      });
    }

    this.clientsAssocArray.forEach(e => {
      if (
        this.selectedClientsAssoc &&
        this.selectedClientsAssoc.includes(e.id)
      ) {
        finalData.clientAssociationIds.push({
          personId: e.personId,
          securityGroupId: e.associationTypeId
        });
      }
    });

    this.otherUsersArr.forEach(element => {
      delete element.emailError;
      finalData.externalUsers.push(element);
    });

    finalData.expirationDate = this.linkExpirationDate
      ? this.linkExpirationDate
      : null;

    if (finalData.expirationDate) {
      if (!moment(finalData.expirationDate).isAfter(moment())) {
        this.expirationDateErrMsg = 'Select a future date.';
        return;
      }
    }

    const selected = this.shareDocumentSelected.map(item => item.id);

    switch (type) {
      case 'access':
        this.shareDocLoading = true;
        finalData.folderId = parseInt(this.firmInfo[this.firmInfo.length - 1].id, 10);
        finalData.shareLink = this.shareLink;
        finalData.fileIds =
          this.docAccessArr && this.docAccessArr.length
            ? this.docAccessArr
            : [];
        try {
          if (this.revokeUsers && this.revokeUsers.length) {
            await this.revokeAccess();
          }
          await this.dmsService.v1DmsAddAccessDocumentportalPost$Json({ body: finalData }).toPromise();
          this.shareDocLoading = false;
          this.toastDisplay.showSuccess('Document access updated.');
          this.otherUsersArr = [];
          this.modalService.dismissAll();
          this.clearSelectionsAndResetBulk();
        } catch (err) {
          this.shareDocLoading = false;
        }
        break;

      case 'share':
        this.shareDocLoading = true;
        this.expirationDateErrMsg = '';
        finalData.fileIds = [...selected];
        finalData.folderId = this.fileId
          ? [this.fileId]
          : this.archivedselectedFolders;

        try {
          await this.dmsService.v1DmsGrantShareAccessBulkPut$Json({ body: finalData }).toPromise();
          this.shareDocLoading = false;
          this.toastDisplay.showSuccess('Document shared.');
          this.otherUsersArr = [];
          this.modalService.dismissAll();
          this.clearSelectionsAndResetBulk();
        } catch (err) {
          this.shareDocLoading = false;
        }
        break;
    }
  }

  RevokeAccessFilesManage(files: any): void {
    this.clientFolderNotSystem = false;
    this.noRevokeAccess = false;
    this.revokeFiles = [];
    if (files && files.selected.length) {
      files.selected.forEach(e => {
        if (e.id) {
          this.revokeFiles.push({
            id: e.id,
            type: e.fullFilePath ? 'file' : 'folder'
          });
        }
      });
    }
    let path;
    if (this.revokeFiles.length > 1 && this.folderList.length) {
      if (this.folderList[0].fullFolderPath) {
        path = this.folderList[0].fullFolderPath;
      } else if (this.folderList[0].fullFilePath) {
        path = this.folderList[0].fullFilePath;
      } else {
        path = this.folderList[0].folderPath;
      }
      const idx = this.bulkActions.findIndex(e => e.name === 'Revoke Access');
      if (idx !== -1) {
        files.selected.forEach(file => {
          if (!file.hasSharingRight) {
            this.noRevokeAccess = true;
          }
          if (file.folderPath) {
            const folderPath = file.folderPath.split('/');
            if (!file.isSystemFolder && (folderPath[folderPath.length - 2] === 'Clients')) {
              this.clientFolderNotSystem = true;
            }
          } else if (file.fullFilePath) {
            const filePath = file.fullFilePath.split('/');
            if (filePath[filePath.length - 2] === 'Clients') {
              this.clientFolderNotSystem = true;
            }
          }
        });
        this.revokedAccess = (this.validatePath(path) && this.documentPortalAccess && this.firmInfo.length > 1 && !this.noRevokeAccess && !this.clientFolderNotSystem) ? false : true;
        this.initializeBulkAction(4, this.revokedAccess);
      }
    }
  }

  RevokeAccessModalManage(
    fileId: number,
    sharedClientDom,
    noSharedClientDom
  ): void {
    this.revokeFiles = [];
    if (fileId) {
      this.setDocumentsId(
        [{ type: 'folder', id: fileId }],
        sharedClientDom,
        noSharedClientDom
      );
    }
  }

  async checkFileRevoke(clients, sharedClientDom, noSharedClientDom) {
    const params = {
      fileIds: clients
    };
    let resp: any = await this.dmsService
      .v1DmsSharedFileClientDetailsByFileIdsGet(params)
      .toPromise();
    resp = JSON.parse(resp);
    if (resp && resp.results && resp.results.length) {
      resp.results = _.orderBy(resp.results, [
        user => user.fullName.toLowerCase(),
        ['asc']
      ]);
      this.sharedFileClients = resp.results;
      this.openPersonalinfo(sharedClientDom, '', '');
    } else {
      this.openPersonalinfo(noSharedClientDom, '', '');
    }
  }

  async setDocumentsId(data, sharedClientDom, noSharedClientDom) {
    try {
      this.selectedDocumentsId = [];
      const folderId = [];
      data.forEach(el => {
        if (el.type === 'folder') {
          folderId.push(el.id);
        } else {
          this.selectedDocumentsId.push(el.id);
        }
      });
      const params = {
        folderIds: folderId
      };
      let resp: any = await this.dmsService
        .v1DmsListOfFileIdsByFolderIdsGet(params)
        .toPromise();
      resp = JSON.parse(resp);
      if (resp && resp.results) {
        this.selectedDocumentsId = [
          ...resp.results,
          ...this.selectedDocumentsId
        ];
      }
      this.checkFileRevoke(
        this.selectedDocumentsId,
        sharedClientDom,
        noSharedClientDom
      );
    } catch (e) { }
  }

  updateRevokeFiles(): void {
    const filesId = [];
    const clientsId = [];
    this.selectedDocumentsId.forEach(element => {
      filesId.push(element);
    });
    this.revokeUsers.forEach(element => {
      clientsId.push(element.userId);
    });
    const finalData = {
      clientIds: clientsId,
      fileIds: filesId,
      folderIds: []
    };
    this.dmsService.v1DmsRevokeShareAccessPut$Json({ body: finalData }).subscribe((res: any) => {
      res = JSON.parse(res);
      this.modalService.dismissAll();
      this.toastDisplay.showSuccess('Document access revoked.');
    }, err => {
      this.modalService.dismissAll();
    });
  }

  validateRole(roles: any): boolean {
    const unrevokableRoles = [
      'Responsible Attorney',
      'Billing Attorney',
      'Admin'
    ];
    let revokable = false;
    if (roles && roles.length) {
      unrevokableRoles.every(e => {
        const idx = this.currentUserInfo.groups.findIndex(el => el.name === e);
        if (idx > -1) {
          revokable = true;
          return false;
        }
      });
    }
    return revokable;
  }

  downloadFolder(id: any, name: string): void {
    this.loading = true;
    this.dms.v1DmsFolderZipDmsFolderIdGet(id).subscribe(
      (res: any) => {
        if (res && res.body) {
          name = name.replace('.', '_');
          UtilsHelper.downloadZip(res.body, name);
          this.loading = false;
        }
      },
      err => {
        this.loading = false;
      }
    );
  }

  setRevokeUsers(user, idx, bulkRevoke?) {
    this.revokeUsers.push(user);
    const arrKey = bulkRevoke ? 'sharedFileClients' : 'extraUsers';
    this[arrKey].splice(idx, 1);
  }

  async revokeAccess() {
    try {
      const ids = this.revokeUsers.map(x => x.personId);
      const finalData = {
        clientIds: ids,
        fileIds: this.docAccessArr,
        folderIds: []
      };
      await this.dmsService
        .v1DmsRevokeShareAccessPut$Json({ body: finalData })
        .toPromise();
    } catch (e) {
      console.log(e);
    }
  }

  returnClientAssocArr(arr) {
    const firmInfoNameArr = this.firmInfo.map(info => info.name);
    const clientType = ['Vendor', 'Subsidiary'];
    if (firmInfoNameArr.includes('Matters')) {
      clientType.push('Expert Witness');
      clientType.push('Opposing Party');
      clientType.push('Opposing Counsel');
      const idx = this.firmInfo.findIndex(y => y.name === 'Matters');
      let matterId: number;
      if (this.firmInfo[idx + 1]) {
        const path = this.firmInfo[idx + 1].folderPath.split('/');
        matterId = +path[path.length - 1];
      } else {
        if (this.shareDocumentRow) {
          const path = this.shareDocumentRow.folderPath.split('/');
          matterId = +path[path.length - 1];
        }
      }
      if (arr.length) {
        arr = arr.filter(list => {
          return ['Vendor', 'Subsidiary'].indexOf(list.associationType) > -1
            ? list
            : clientType.includes(list.associationType) &&
            +list.matterId === +matterId;
        });
      }
    } else {
      if (arr.length) {
        arr = arr.filter(list => clientType.includes(list.associationType));
      }
    }

    const unique = [];
    arr.map(x => unique.filter(a => a.personId === x.personId).length > 0 ? null : unique.push(x));
    return unique;
  }

  rejectDocument(content, action, doc?: any): void {
    if (doc && doc.id) {
      this.singleReviewPendingDocId = doc.id;
    }
    if (action === 'reject') {
      this.openPersonalinfo(content, '', '');
    } else {
      this.approveRejectDocument(this.singleReviewPendingDocId ? [this.singleReviewPendingDocId] : this.reviewPendingDocIds, action);
    }
  }

  rejectDocWithReason(action: string): void {
    this.rejectFormSubmitted = true;
    if ((this.rejectReason && action === 'reject')) {
      this.approveRejectDocument(this.singleReviewPendingDocId ? [this.singleReviewPendingDocId] : this.reviewPendingDocIds, action);
      this.resetRejectReasonParams();
    }
  }

  async approveRejectDocument(docsId, action, approveAndMove?) {
    try {

      if (!approveAndMove) {
        this.loading = true;
      }

      for (const doc of docsId) {
        const idx = this.folderList.findIndex(e => +e.id === +doc);
        if (this.folderList[idx].status && this.folderList[idx].status === 'Client Pending Review') {
          const params = {
            fileId: doc,
            body: {
              isApproved: action === 'approve' ? true : false,
              rejectReason: action === 'approve' ? '' : this.rejectReason
            }
          };
          this.approveLoading = true;
          await this.documentPortalService.v1DocumentPortalApproveOrRejectDocumentsFileIdPut$Json(params).toPromise();
        }
      }
      this.approveLoading = false;
      if (!approveAndMove) {
        this.loading = false;
      }
      this.selectedRowLength = 0;
      this.reviewPendingDocIds = [];
      this.singleReviewPendingDocId = 0;
      this.approveAndMoveDoc = false;
      this.selectFolder = '';
      this.clearSelectionsAndResetBulk();
      this.getFilelist();
      const msg = docsId.length + ' client pending ' + (docsId.length === 1 ? 'document has been ' : 'documents have been ') + (action === 'approve' ? ' approved.' : ' rejected.');
      this.toastDisplay.showSuccess(msg);
      this.modalService.dismissAll();
    } catch (e) {

      this.approveLoading = false;
      if (!approveAndMove) {
        this.loading = false;
      }
    }
  }

  resetRejectReasonParams() {
    this.rejectReason = '';
    this.rejectFormSubmitted = false;
    this.modalService.dismissAll();
  }

  addClassCategory(isadd: boolean, item?: any, event?: any) {
    const elementId = 'categoryHeading_' + item.id;
    const element = document.getElementById(elementId);
    const name = item.fileCategories;
    if (isadd && name.length > 19) {
      element.classList.add('text-underline');
    } else {
      element.classList.remove('text-underline');
    }
  }

  async revertVersion(row) {
    let resp = await this.dialogService.confirm(
      this.errorData.revert_doc_version,
      'Yes, revert Document',
      'No',
      'Revert to Version',
      true
    );

    if (resp) {
      const obj = {
        body: {
          fileId: row.dmsFileId,
          oldVersion: row.version
        }
      };
      try {
        this.loading = false;
        resp = await this.dmsService.v1DmsFileRevertVersionPut$Json(obj).toPromise();
        if (JSON.parse(resp).results) {
          this.isDocumentListing = false;
          this.isCheckInListing = false;
          this.toastDisplay.showSuccess(this.errorData.doc_reverted);
          this.getFolderContent(this.folderId);
        }
      } catch (err) {
        this.loading = false;
      }
    }
  }

  retry_cancelScan(row, type?: string, index?: any) {
    const idx = this.folderList.findIndex((val) => +val.id === +row.id);
    const params: any = {
      id: row.id,
      folderId: row.folderId,
      nameOfFile: row.fileName,
      status: 'Active',
      isFillableTemplate: row.isFillableTemplate,
      isDraftingTemplate: row.isDraftingTemplate,
      ownerId: row.owner.id,
      body: { file: null },
      // containsESignatureFields: row.iseSignatureField,
      dmsFileStatus: DMSFileStatus.SecurityScanInProgress
    };

    switch (type) {
      case 'remove':
        params.dmsFileStatus = DMSFileStatus.UploadCancelled;
        break;
      case 'retry':
        params.dmsFileStatus = DMSFileStatus.SecurityScanInProgress;
        this.folderList[idx].dmsFileStatus = 'SecurityScanInProgress';
        break;
    }
    this.loading = true;
    this.documentPortalService.v1DocumentPortalSendDocumentPost(params).subscribe(() => {
      const mess = type === 'remove' ? this.errorData.documentDeletedSuccessfully : '';
      if (type === 'remove') {
        this.toastDisplay.showSuccess(mess);
      }
      this.getFilelist();
      this.loading = false;
    }, err => {
      if (err.status === 400) {
        this.folderList[idx].dmsFileStatus = 'SecurityScanFailedError';
      }
      this.loading = false;
    });
  }

  getStatusForDoc(status: any) {
    let badge: any;
    switch (status) {
      case 'UploadInProgress':
        badge = 'Upload In Progress';
        break;
      case 'UploadFailed':
        badge = 'Upload Failed';
        break;
    }
    return badge;
  }

  show_hideStatus(status) {
    if (status === 'UploadInProgress' || status === 'UploadFailed') {
      return true;
    }
    return false;
  }

  async openESignComponent(row, content, notMatterFolder, DocAlreadyOutTemplate?, shouldOpenWarningPopup: boolean = false) {
    const matterFolderIdx = this.firmInfo.findIndex(x => x.name.toLowerCase() == 'matters' && x.isSystemFolder);
    if (matterFolderIdx > -1 && this.firmInfo[matterFolderIdx].isSystemFolder) {
      this.selectedRowForDownload = row;
      if (row.documentSigningStatus == DocumentSigningStatus.PendingSignature && shouldOpenWarningPopup) {
        this.openPersonalinfo(DocAlreadyOutTemplate, '', 'modal-md');
        return;
      }
      await this.fetchSignersList();
      this.modalService
        .open(content, {
          windowClass: 'modal-lmd',
          centered: true,
          backdrop: 'static'
        })
        .result.then(
          result => {
            if (this.eSignComponent) {
              // this.eSignComponent.clearSigners();
            }
          },
          reason => {
            if (this.eSignComponent) {
              // this.eSignComponent.clearSigners();
            }
          }
        );
    } else {
      this.openPersonalinfo(notMatterFolder, '', 'modal-md');
    }
  }

  sendForESign(row?: any,toManyTokens?: any,insufficientTokens?: any,isForcedESign: boolean = false) {
    let fullUrl = this.selectedRowForDownload.fullFilePath
    let tempArr = fullUrl.split('quarto-dms-data/').pop().split('/');
    let esign = this.eSignComponent;
    if (this.eSignComponent && (this.eSignComponent.checkESignValidate() || isForcedESign)) {
      let clientIndex = tempArr.findIndex(x => x == 'Clients');
      let matterIndex = tempArr.findIndex(x => x == 'Matters');
      let to_Array: any = this.eSignComponent.signersArr.map(signer => {
        let role = signer.items.find(x => x.id == signer.role);
        let email = signer.email;
        let isOthersRole = (role && role.name == 'Other') ? true : false;
        let clientIds = (clientIndex && !isOthersRole) ? [+tempArr[clientIndex + 1]] : [0];
        let matterIds = (matterIndex && !isOthersRole) ? [+tempArr[matterIndex + 1]] : [0];
        let name = signer.name;
        let inpersonSignature = signer.inpersonSignature;
        return { role: role.name, name, clientIds, matterIds, email, inpersonSignature };
      });
      let data = {
        documentId: this.selectedRowForDownload.id,
        to: to_Array,
        from: 'mchauhan@codal.com',
        subject: 'Document requires your signature',
        message: 'A document is ready for you to sign .',
        isOutforSignature: this.selectedRowForDownload.documentSigningStatus == DocumentSigningStatus.PendingSignature ? true : false,
        isForceProceed: isForcedESign
      }
      let index = this.folderList.findIndex(x => x.id == this.selectedRowForDownload.id);
      if (index > -1) {
        this.folderList[index].isSentForProcessing = true;
      }
      if (data.isOutforSignature) {
        this.folderList[index].documentSigningStatus = DocumentSigningStatus.Unknown;
      }
      this.sendEsignLoading = true;
      this.modalService.dismissAll();
      this.dmsService.v1DmsDocumentSendforSignaturePost$Json({ body: data })
        .pipe(finalize(() => {
          this.sendEsignLoading = false;
        }))
        .subscribe(res => {
          this.eSignComponent = esign;
          const response = JSON.parse(res as any).results;
          if(response && response.isInsufficientTokens){
            this.modalService
              .open(insufficientTokens, {
                windowClass: 'modal-lmd',
                centered: true,
                backdrop: 'static'
              })
              .result.then(
                result => {
                  if (this.eSignComponent) {
                    this.eSignComponent.clearSigners();
                  }
                },
                reason => {
                  if (this.eSignComponent) {
                    this.eSignComponent.clearSigners();
                  }
                }
              );
          }
          if(response && response.isManyTokens){
            this.modalService
              .open(toManyTokens, {
                windowClass: 'modal-lmd',
                centered: true,
                backdrop: 'static'
              })
              .result.then(
                result => {
                  if (this.eSignComponent) {
                    this.eSignComponent.clearSigners();
                  }
                },
                reason => {
                  if (this.eSignComponent) {
                    this.eSignComponent.clearSigners();
                  }
                }
              );
          }
          if (response.status && response.status.status && response.status.status == 'success') {
            this.toastDisplay.showSuccess(this.errorData.document_esign_sent_success);
            this.getFilelist();
          }
        }, err => {
          let error: any = err.error;
          if (error.split(';').length > 1) {
            error = error.split(';')[1] ? error.split(';')[1] : error.split(';')[0];
          } else {
            error = '';
          }
          if (index > -1) {
            this.folderList[index].isSentForProcessing = false;
            this.folderList[index].isEsignProcessingFailed = true;
            this.folderList[index].sentForEsignFailedMessage = error;
          }

        })
    }
  }

  openApproveAndMovePopup(popup, row) {
    if (this.firmInfo && this.firmInfo.length > 2) {
      const idx = this.firmInfo.findIndex(x => x.name === 'Clients' && x.isSystemFolder);
      if (idx > -1) {
        this.singleReviewPendingDocId = row.id;
        this.selectedSourceFullPath = row;
        this.clientFolder = this.firmInfo[idx + 1].id;
        this.openPersonalinfo(popup, '', '');
      }
    }
  }

  async approveAndMoveDocument() {
    try {
      if (this.approveAndMoveDoc) {
        if (!this.selectFolder || !this.selectedSourceFullPath) {
          return;
        }
        if (+this.selectedSourceFullPath.folderId === +this.selectFolder.id) {
          this.approveRejectDocument(this.singleReviewPendingDocId ? [this.singleReviewPendingDocId] : this.reviewPendingDocIds, 'approve', true);
        } else {
          this.approveLoading = true;
          let res: any = await this.dmsService.v1DmsGetFolderDetailFolderIdGet({ folderId: this.selectFolder.id }).toPromise();

          res = JSON.parse(res).results;
          this.selectFolder.sourceFullPath = res.folderPath;

          const filename = this.selectedSourceFullPath.fileName;
          res = await this.dmsService.v1DmsFileMoveGet$Response({
            sourceFullPath: this.selectedSourceFullPath.fullFilePath,
            targetFullPath: this.selectFolder.sourceFullPath + '/' + filename,
            isForApproveDocument: true
          }).toPromise();

          const ob = JSON.parse(res.body);

          if (ob && ob.results && !ob.results.id) {
            this.approveLoading = false;
            this.isExist = true;
            this.isExistErr = ob.results
              ? ob.results
              : this.errorData.document_name_exist;
          } else {
            this.approveRejectDocument(this.singleReviewPendingDocId ? [this.singleReviewPendingDocId] : this.reviewPendingDocIds, 'approve');
          }
        }
      } else {
        this.approveRejectDocument(this.singleReviewPendingDocId ? [this.singleReviewPendingDocId] : this.reviewPendingDocIds, 'approve');
      }
    } catch (e) {
      this.approveLoading = false;
    }
  }

  async downloadVersion(row) {
    try {
      this.loading = true;

      // Creating Viewer's History
      const obj = {
        action: 'download',
        dmsFileId: row.dmsFileId,
        id: 0,
        isActive: true,
        viewedBy: this.currentUserInfo.id,
        viewedByName: this.currentUserInfo.lastName
          ? this.currentUserInfo.firstName + ' ' + this.currentUserInfo.lastName
          : this.currentUserInfo.firstName
      };
      await this.dmsService.v1DmsFileViewerHistoryPost$Json({ body: obj }).toPromise();

      // Download specific version
      const suc: any = await this.dms.v1DmsFileDownloadVersionGet(row.fileFullPath).toPromise();

      const objRes: any = suc.body;

      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(
          objRes,
          row.fileName
        );
      } else {
        const blobURL = window.URL.createObjectURL(objRes);
        const anchor = document.createElement('a');
        anchor.download = row.fileName;
        anchor.href = blobURL;
        anchor.click();
      }
      this.loading = false;
    } catch (e) {
      this.loading = false;
    }
  }

  async bulkDownload() {
    const data = {
      folderIds: [...this.archivedselectedFolders, ...this.unarchivedselectedFolders],
      fileIds: [...this.archivedselectedFiles, ...this.unarchivedselectedFiles],
      parentFolderId: this.selected.id
    };

    try {
      this.loading = true;
      const res = await this.dms.v1DmsBulkDownloadPost(data).toPromise();
      let name = this.selected.name + '-' + moment().format('MMDDYYYY');
      if (res && res.body) {
        name = name.replace('.', '_');
        UtilsHelper.downloadZip(res.body, name);
      }
      this.loading = false;
      this.clearSelectionsAndResetBulk();
    } catch (e) {
      this.loading = false;
    }
  }

  clearSelectionsAndResetBulk() {
    this.fileId = 0;
    this.selectedTablerow = [];
    this.archivedselectedFiles = [];
    this.archivedselectedFolders = [];
    this.unarchivedselectedFiles = [];
    this.unarchivedselectedFolders = [];
    this.selectedCheckoutfiles = [];
    this.selectedNonCheckoutfiles = [];
    this.shareDocumentSelected = [];
    const bulkActions = this.bulkActions;
    bulkActions.map(obj => {
      obj.disabled = true;
    });
    this.bulkActions = [...bulkActions];
    this.selectedBulkAction = null;
  }

  toggleExpandRow(row) {
    if(this.selectedRow && this.selectedRow.id != row.id){
      this.table.rowDetail.collapseAllRows();
      removeAllBorders('app-document-management');
    }
    this.table.rowDetail.toggleExpandRow(row);
  }
  onDetailToggle(event){
    this.selectedRow = event.value;
  }

  back() {
    this.isDocumentListing = false;
    const parentId = this.firmInfo && this.firmInfo.length >= 2 ? 2 : 1;
    this.selected = this.firmInfo[this.firmInfo.length - parentId];
    this.getFilelist();
  }

  public async showSearchListFun() {
    try {
      return await this.returnShowListFlag();
    } catch (error) {

    }
  }

  public returnShowListFlag() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.showSearchList);
      });
    });
  }

  public viewAll() {
    let searchText = this.searchForm.get('searchInput').value;
    this.searchList = [];
    if (searchText) {
      this.refreshPage(searchText);
    }
  }

  refreshPage(searchText?): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    this.router.navigate(['/search'], { queryParams: { searchString: searchText, searchFilter: 'Documents', searchFilterStr: 7 } });
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  resendESignRequest() {
    this.loading = true;
    this.dmsService.v1DmsResendsignatureIdPut({ id: this.selected.id })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        let resp = JSON.parse(res as any).results;
        if (resp) {
          this.toastDisplay.showSuccess(this.errorData.esign_request_sent_success);
        }
      }, err => {
        this.toastDisplay.showError(this.errorData.esign_request_sent_failed);
      })
  }

  acceptESignForDocument(row, content, notMAtterFolderContent) {
    this.modalService.dismissAll();
    setTimeout(() => {
      this.openESignComponent(row, content, notMAtterFolderContent);
    }, 100)
  }
  forcedProceedEsign(row, content, notMAtterFolderContent,isForceProceed: boolean = false){
    this.modalService.dismissAll();
    if(!isForceProceed){
      this.openESignComponent(row, content, notMAtterFolderContent);
    }
  }

  get footerHeightFn() {
    if (this.folderList) {
      return this.folderList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  async fetchSignersList() {
    if (!this.signersList.length) {
      this.loading = true;
      try {
        let resp: any = await this.dmsService.v1DmsDocumentSignersGet().toPromise();
        resp = JSON.parse(resp).results;
        this.signersList = resp;
      } finally {
        this.loading = false;
      }
    }
  }

  getRowClass(row): string {
    let className = "";
    if(row.ishighlight){
      className = "expanded-row";
    }
    return className 
  }

   /**** function to select/deselect only displayed page record */
   selectDeselectRecords() {
    this.allSelected = !this.allSelected
    this.table.bodyComponent.temp.forEach(row => {
      const index = this.folderList.findIndex(list => list.id === row.id);
      if (index > -1) {
        this.folderList[index]['selected'] = this.allSelected;
      }
      const existingIndex = this.selectedList.findIndex(list => list.id === row.id);
      if (existingIndex > -1 && !row.selected) {
        this.selectedList.splice(existingIndex, 1)
      } else if (row.selected && existingIndex === -1) {
        this.selectedList.push(row);
      }
    })
    this.setSelected();
  }

  /******* function to select/deselect child checkbox  */
  changeChildSelection(row) {
    row.selected = !row.selected
    const existingIndex = this.selectedList.findIndex(list => list.id === row.id);
    if (existingIndex > -1 && !row.selected) {
      this.selectedList.splice(existingIndex, 1)
    } else if (row.selected && existingIndex === -1) {
      this.selectedList.push(row);
    }
    this.setSelected();
  }

  setSelected() {
    this.folderList.forEach(list => {
      const selectedIds = this.selectedList.filter(selected => selected.id === list.id);
      if (selectedIds.length > 0) {
        list['selected'] = true;
      }
    });

    const bulkActions = this.bulkActions;
    bulkActions.map(obj => {
      obj.disabled = true;
    });
    this.bulkActions = [...bulkActions];
    this.RevokeAccessFilesManage({selected: this.selectedList});
    if (this.selectedList && this.selectedList.length) {
      this.selectedRowLength = this.selectedList.length;
      this.selectedTablerow = this.selectedList;
      this.archivedselectedFiles = [];
      this.archivedselectedFolders = [];
      this.unarchivedselectedFiles = [];
      this.unarchivedselectedFolders = [];
      this.selectedCheckoutfiles = [];
      this.selectedNonCheckoutfiles = [];
      this.shareDocumentSelected = [];
      this.selectedList.forEach(element => {
        // for archiving/unarchiving folders and files
        if (element.status !== 'Archived') {
          if (element.name && !element.fileName) {
            this.archivedselectedFolders.push(element.id);
          } else {
            this.archivedselectedFiles.push(element.id);
          }
        } else {
          if (element.name && !element.fileName) {
            this.unarchivedselectedFolders.push(element.id);
          } else {
            this.unarchivedselectedFiles.push(element.id);
          }
        }
        // For downloading checked-out/ non checked-out files
        if (element.fileName) {
          this.shareDocumentSelected.push(element);
          if (element.checkedOutTo) {
            this.selectedCheckoutfiles.push(element);
          } else {
            this.selectedNonCheckoutfiles.push(element);
          }
        }
      });
    } else {
      this.archivedselectedFiles = [];
      this.archivedselectedFolders = [];
      this.unarchivedselectedFiles = [];
      this.unarchivedselectedFolders = [];
      this.selectedCheckoutfiles = [];
      this.selectedNonCheckoutfiles = [];
      this.selectedRowLength = 0;
      this.selectedTablerow = [];
    }
    this.reviewPendingDocIds = [];
    this.selectedList.forEach(el => {
      if (el.fullFilePath && this.validatePath(el.fullFilePath) && el.status === 'Client Pending Review') {
        this.reviewPendingDocIds.push(el.id);
      }
    });
    if (this.selectedTablerow.length > 1 && (this.selectedTablerow[0].isSystemFolder || this.selectedTablerow[0].isInsideSystemFolder) && this.firmInfo.length > 1) {
      if (
        this.selectedTablerow[0].canGrantSharingRight ||
        this.selectedTablerow[0].hasSharingRight
      ) {
        this.shareRightsAccess = true;
      } else {
        this.shareRightsAccess = false;
      }
      this.initializeBulkAction(this.shareDocId, !this.shareRightsAccess);
      this.shareRightsAccess = false;
    }
    if (this.selectedTablerow.length >= 2) {
      const archivDisable = !this.archivedselectedFiles.length && !this.archivedselectedFolders.length ? true : false;
      this.toggleBulkDisable(1, archivDisable);

      const unarchivDisable = !this.unarchivedselectedFolders.length && !this.unarchivedselectedFiles.length ? true : false;
      this.toggleBulkDisable(2, unarchivDisable);
    }
    
    this.checkParentCheckbox();
  }

  checkParentCheckbox() {
    setTimeout(() => {
      const currentArr = []
      this.table.bodyComponent.temp.forEach(row => {
        const existing = this.folderList.filter(list => list.id === row.id)[0];
        if (existing) {
          currentArr.push(existing)
        }
      });
      this.allSelected = currentArr.length && currentArr.every(row => row.selected);
    }, 100)
  }

  /*** function to remove selection */
  removeSelection() {
    this.folderList.forEach(list => {
      list['selected'] = false;
    })
    this.selectedList = [];
    this.checkParentCheckbox();
  }
}

