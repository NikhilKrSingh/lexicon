import { Component, EventEmitter, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import {
  ColumnMode,
  DatatableComponent,
  SelectionType
} from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { MalihuScrollbarService } from 'ngx-malihu-scrollbar';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { CommonService } from 'src/app/service/common.service';
import { DownloadFileService } from 'src/app/service/download-file.service';
import {
  DmsService,
  DocumentPortalService
} from 'src/common/swagger-providers/services';
import * as Constant from '../../../modules/shared/const';
import { Page } from '../../models';
import { DialogService } from '../../shared/dialog.service';
import * as errorData from '../../shared/error.json';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-document-portal',
  templateUrl: './document-portal.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class DocumentPortalComponent implements OnInit, OnDestroy {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  modalOptions: NgbModalOptions;
  closeResult: string;
  matterList: any = [];
  matterLoader = false;
  folderList = [];
  orgFolders = [];
  ColumnMode = ColumnMode;
  SelectionType = SelectionType;
  selectedTablerow = [];
  counter = Array;
  pangeSelected = 1;
  messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  page = new Page();
  pageSelector = new FormControl('10');
  limitArray: Array<number> = [10, 30, 50, 100];
  selected: any = [];
  checkSerachObs: any;
  searchList = [];
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  currentActive: number;
  userId = '';
  tenantDetail: any = {};
  breadCrumb = [];
  docStatuses = ['All', 'New', 'Client Pending Review', 'Archived'];
  status = 'All';
  filterStatusArray = [];
  selectedStatus = [];
  titleStatus = 'All';
  breadCrumbPath = '';
  momentObj = moment;
  rootClientFolder = '';
  isExternal = false;
  folders = [];
  searchTimeOut: any;
  searchInput = '';
  searchLoader = false;
  public archDocWarn: string;
  public errorData: any = (errorData as any).default;
  public loading = true;
  public sharedFolderId: any;
  public sharedFolderResponse: any;
  private refreshListingSubscription: any;
  private getListingTimeout: any;
  private dmsInetConnectSubscription: any;

  constructor(
    private modalService: NgbModal,
    private dmsService: DmsService,
    private fb: FormBuilder,
    public commonService: CommonService,
    private mScrollbarService: MalihuScrollbarService,
    private downloadService: DownloadFileService,
    private portalService: DocumentPortalService,
    private dialogService: DialogService,
    private router: Router,
    private toaster: ToastDisplay
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    this.archDocWarn = this.errorData.archive_document_warning;
    this.userId = UtilsHelper.getObject('profile')
      ? UtilsHelper.getObject('profile').id
      : '';

    if (this.userId) {
      const groups = UtilsHelper.getObject('profile')
        ? UtilsHelper.getObject('profile').groups
        : '';
      if (groups && groups.length) {
        const roles = groups.map(x => x.name);
        if (roles.indexOf('ExternalUser') > -1) {
          this.isExternal = true;
          this.getClientRootFolderAndMattersForExternalUser();
        } else {
          this.isExternal = false;
          this.getMatterFolderListing();
        }
      }
      this.getFoldersListing();
      this.getSharedDocs();
    }

    this.refreshListingSubscription = this.commonService.isDmsRefresh.subscribe(val => {
      if(val) {
        if(this.getListingTimeout) {
          clearInterval(this.getListingTimeout);
        }

        this.getListingTimeout = setTimeout(() => {
          this.reloadDocs();
        }, 5000);
      }
    });

    this.dmsInetConnectSubscription = this.commonService.isDMSInetConnection.subscribe(val => {
      if(val && this.loading){
        this.loading = false;
        this.reloadDocs();
      }
    });
    
  }

  ngOnDestroy() {
    if(this.refreshListingSubscription) {
      this.refreshListingSubscription.unsubscribe();
    }

    if(this.dmsInetConnectSubscription){
      this.dmsInetConnectSubscription.unsubscribe();
    }
    this.commonService.isDMSInetConnection.next(null);
  }

  async getFoldersListing() {
    try {
      let resp: any = await this.dmsService
        .v1DmsFolderDocumentPortalSearchListGet()
        .toPromise();
      resp = JSON.parse(resp).results;
      this.folders = resp;
    } catch (e) {
      this.loading = false;
    }
  }

  async getSharedDocs() {
    try {
      this.breadCrumb = [];
      let resp: any;
      if (this.isExternal) {
        resp = await this.dmsService.v1DmsTenantFolderGet().toPromise();
      } else {
        resp = await this.dmsService
          .v1DmsTenantFolderPersonIdGet({ personId: +this.userId })
          .toPromise();
      }
      resp = JSON.parse(resp).results;
      this.tenantDetail = resp;
      if (!this.isExternal) {
        this.rootClientFolder = resp.rootClientFolder;
      }
      if (localStorage.getItem('fileId')) {
        if (+localStorage.getItem('fileTenantId') === resp.tenantId) {
          this.portalService
            .v1DocumentPortalFilesHashedFileIdGet({
              hashedFileId: localStorage.getItem('fileId')
            })
            .subscribe(
              s => {
                const res = JSON.parse(s as any);
                if (res) {
                  this.sharedFolderId = res.results.folderId;
                  this.sharedFolderResponse = res.results;
                  this.getFolderDetails(this.tenantDetail);
                }
              },
              error => {
                this.loading = false;
              }
            );
        } else {
          this.clearLocal();
          this.toaster.showError(this.errorData.invalid_tenant);
          this.getFolderDetails(this.tenantDetail);
        }
      } else {
        this.getFolderDetails(this.tenantDetail);
      }
    } catch (e) {
      this.loading = false;
    }
  }

  async getClientRootFolderAndMattersForExternalUser() {
    this.matterLoader = true;
    this.portalService
      .v1DocumentPortalMattersClientRootFolderExternalUserExternalUserIdGet({
        externalUserId: +this.userId
      })
      .subscribe(
        (res: any) => {
          res = JSON.parse(res).results;
          if (res && res.vwmattersbyClient && res.vwmattersbyClient.length) {
            const matterFolders = res.vwmattersbyClient.filter(x => x.folderId);
            this.matterList =
              matterFolders && matterFolders.length ? [...matterFolders] : [];
          }
          this.rootClientFolder = res.rootClientFolder;
          this.matterLoader = false;
        },
        error => {
          this.matterLoader = false;
        }
      );
  }

  async getFolderDetails(row, i?) {
    try {
      this.loading = true;
      this.searchList = [];
      this.searchInput = '';
      this.status = 'All';
      if (row.name === 'Clients' || this.breadCrumb.length) {
        if (i === 'search') {
          this.breadCrumbPath = row.name ? row.folderPath : row.fullFolderPath;
        } else {
          if (i || i === 0) {
            this.breadCrumb.length = i + 1;
          } else {
            this.breadCrumb.push(row);
          }
        }
      }
      let fId;
      if (localStorage.getItem('fileId')) {
        if (this.sharedFolderResponse.breadcrumb === []) {
          this.loading = false;
        }
        fId = this.sharedFolderId;
        const newArray = [];
        for (const breadcrumb of this.sharedFolderResponse.breadcrumb) {
          newArray.push(breadcrumb);
          if (breadcrumb.folderName === 'Clients') {
            break;
          }
        }
        const newArray2 = newArray.reverse();
        newArray2.forEach(breadcrumb => {
          this.breadCrumb.push({
            id: breadcrumb.folderId,
            name: breadcrumb.folderName,
            parentFolderId: breadcrumb.parentFolderId,
            folderPath: breadcrumb.folderPath
          });
        });
      } else if (i === 'search' && row.fileName) {
        fId = row.folderId;
      } else {
        fId = row.id;
      }
      let resp: any;
      if (fId) {
        resp = await this.dmsService
          .v1DmsDocumentportalSharedFolderAndDocumentPersonIdFolderIdGet({
            personId: +this.userId,
            folderId: fId
          })
          .toPromise();

        if (i === 'search') {
          const paths = this.breadCrumbPath
            .split('quarto-dms-data/')
            .pop()
            .split('/');
          this.breadCrumb = [];
          paths.forEach((element: any) => {
            let rowElem = this.folders.filter(arr =>
              arr.name.includes(element)
            );
            if (rowElem.length !== 0) {
              rowElem = rowElem[0];
              this.breadCrumb.push(rowElem);
            }
          });
          this.searchList = [];
        }
        this.selectedTablerow = [];
        this.selected = [];
        resp = JSON.parse(resp).results;
        this.clearLocal();
        if (resp && resp.folders && resp.folders.length) {
          const clientsObj = resp.folders.find(el => el.name === 'Clients' && el.isSystemFolder);
          if (this.breadCrumb.length && !clientsObj) {
            this.filterGrid(resp);
            this.loading = false;
          } else if (!this.breadCrumb.length && clientsObj.hasOwnProperty('id')) {
            this.getFolderDetails(clientsObj);
          } else {
            this.filterGrid(resp);
            this.loading = false;
          }
        } else if (this.breadCrumb.length && !resp.folders.length) {
          this.filterGrid(resp);
          this.loading = false;
        } else {
          this.filterGrid(resp);
          this.loading = false;
        }
      }
    } catch (e) {
      this.loading = false;
    }
  }

  getMatterFolderListing() {
    this.matterLoader = true;
    this.dmsService
      .v1DmsClientClientIdGet({ clientId: +this.userId })
      .subscribe(
        (res: any) => {
          res = JSON.parse(res).results;
          if (res && res.length) {
            const matterFolders = res.filter(x => x.folderId);
            this.matterList =
              matterFolders && matterFolders.length ? [...matterFolders] : [];
          }
          this.matterLoader = false;
        },
        e => {
          this.matterLoader = false;
        }
      );
  }

  onActivate(event: any) {
    if (
      event.type === 'dblclick' &&
      !event.row.fileName &&
      event.row.status !== 'Archived'
    ) {
      this.getFolderDetails(event.row, event.rowIndex);
    }
  }

  filterGrid(foldersAndFiles?: any) {
    let folderList = [];

    if (
      foldersAndFiles &&
      foldersAndFiles.folders &&
      foldersAndFiles.folders.length
    ) {
      folderList = [...foldersAndFiles.folders];
    }

    if (
      foldersAndFiles &&
      foldersAndFiles.files &&
      foldersAndFiles.files.length
    ) {
      const docs = foldersAndFiles.files.filter(
        x =>
          (x.status.toLowerCase() === 'archived' &&
            moment(x.lastUpdated).isAfter(moment().subtract(30, 'day'))) ||
          x.status.toLowerCase() !== 'archived'
      );
      folderList = [...folderList.concat(docs)];

      // Status filter options
      docs.forEach(element => {
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
      });
    }

    this.orgFolders = [...folderList];
    this.setFolderList();
    this.mySortingFunction();
    this.updateDatatableFooterPage();
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    }
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.folderList.length;
    this.page.totalPages = Math.ceil(this.folderList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.table.offset = 0;
  }

  search(withoutTimer?: boolean) {
    if (this.searchInput.trim() === '') {
      this.searchInput = '';
      this.searchLoader = false;
      return;
    }

    const timer = withoutTimer ? 0 : 1000;
    if (this.searchTimeOut) {
      clearTimeout(this.searchTimeOut);
      this.searchTimeOut = null;
    }

    this.searchTimeOut = setTimeout(() => {
      const search = this.searchInput.trim().replace(/ +/g, ' ');
      if (search) {
        this.searchFolderOrDoc(search);
      }
      if (search === '') {
        this.searchList = [];
      }
    }, timer);
  }

  addConfigs() {
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
      alwaysVisible: false
    };
  }

  async searchFolderOrDoc(search: any): Promise<any> {
    try {
      this.searchLoader = true;
      const resp: any = await this.portalService
        .v1DocumentPortalSearchGet({ search })
        .toPromise();
      this.searchList = [];

      const result: any = JSON.parse(resp).results;

      if (result.folders && result.folders.length) {
        this.searchList = result.folders;
      }

      if (result.files && result.files.length) {
        this.searchList = this.searchList.concat(result.files);
      }

      setTimeout(() => {
        this.searchLoader = false;
      }, 0);
    } catch (err) {
      this.searchList = [];
      this.searchLoader = false;
      this.searchInput = '';
    }
  }

  openMenu(index: number, event: any, fileName: any): void {
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
      if (fileName) {
        this.mScrollbarService.initScrollbar('.dropdown-slimscrol', {
          axis: 'y',
          theme: 'dark-3'
        });
      }
    }, 50);
  }

  onClickedOutside(event: any, index: number) {
    if (index === this.currentActive) {
      this.currentActive = null;
    }
  }

  async downloadDocument(doc) {
    this.loading = true;
    try {
      const suc: any = await this.downloadService
        .v1DownloadLatestFile(+doc.id)
        .toPromise();
      const objRes: any = suc.body;
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(objRes, doc.fileName);
      } else {
        const blobURL = window.URL.createObjectURL(objRes);
        const anchor = document.createElement('a');
        anchor.download = doc.fileName;
        anchor.href = blobURL;
        anchor.click();
      }
      this.selectedTablerow = [];
      this.selected = [];
    } finally {
      this.loading = false;
    } 
  }

  openModal(content: any) {
    const idx = this.matterList.findIndex(
      el =>
        el.matterName === 'Not Matter Related' &&
        el.folderId === this.rootClientFolder
    );
    if (idx !== 0) {
      this.matterList.unshift({
        folderId: this.rootClientFolder,
        matterName: 'Not Matter Related'
      });
    }
    this.modalService.open(content, { size: 'lg', centered: true });
  }

  deleteDocument(id) {
    this.dialogService
      .confirm(
        'Are you sure you want to delete this document?',
        'Delete',
        'Cancel',
        'Delete Document'
      )
      .then(res => {
        if (res) {
          this.loading = true;
          const params: any = {
            fileId: id,
            personId: +this.userId
          };

          const firmInfoNameArr = this.breadCrumb.map(info => info.name);
          if (firmInfoNameArr.includes('Matters')) {
            params.isMatterFolder = true;
          }
          this.portalService
            .v1DocumentPortalDeleteDocumentDelete(params)
            .subscribe(
              () => {
                this.reloadDocs();
                this.loading = false;
              },
              () => { 
                this.loading = false;
              }
            );
        }
      });
  }

  selectStatusDropDown(event) {
    this.titleStatus = '';
    if (event.length > 0) {
      this.titleStatus = event.length;
    } else {
      this.titleStatus = 'All';
    }
  }

  clearStatusFilter() {
    this.selectedStatus = [];
    this.filterStatusArray.forEach(item => (item.checked = false));
    this.titleStatus = 'All';
    this.setFolderList();
  }

  applyFilterStatus() {
    if (this.selectedStatus && !this.selectedStatus.length) {
      this.setFolderList();
    } else {
      const docs = this.orgFolders.filter(
        x =>
          !x.fileName ||
          (x.fileName &&
            this.selectedStatus.indexOf(x.status.toLowerCase()) > -1)
      );
      this.folderList = [...docs];
    }
    this.updateDatatableFooterPage();
  }

  public mySortingFunction() {
    let folders = this.orgFolders.filter(item => {
      if (item.name && !item.fileName) {
        return item;
      }
    });

    let files = this.orgFolders.filter(item => {
      if (item.fileName && item.status.toLowerCase() !== 'archived') {
        return item;
      }
    });

    if (this.table.sorts[0].prop === 'name') {
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

    if (this.table.sorts[0].prop === 'fileSizeInKB') {
      if (this.table.sorts[0].dir === 'asc') {
        files = files.sort((a, b) => a.fileSizeInKB - b.fileSizeInKB);
      } else {
        files = files.sort((a, b) => b.fileSizeInKB - a.fileSizeInKB);
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

    this.folderList = folders.concat(files);
  }

  closeModal(reload) {
    if (reload) {
      this.reloadDocs();
    }
    this.modalService.dismissAll();
  }

  reloadDocs() {
    const ob =
      this.breadCrumb && this.breadCrumb.length
        ? this.breadCrumb[this.breadCrumb.length - 1]
        : this.tenantDetail;
    const idx =
      this.breadCrumb && this.breadCrumb.length
        ? this.breadCrumb.length - 1
        : 0;
    this.getFolderDetails(ob, idx);
  }

  setFolderList() {
    const docs = this.orgFolders.filter(
      x => !x.fileName || (x.fileName && x.status.toLowerCase() !== 'archived')
    );
    this.folderList = [...docs];
  }

  get checkArchivedFiles() {
    const archivedFiles = this.folderList.filter(
      x =>
        x.fileName &&
        x.status.toLowerCase() === 'archived' &&
        moment(x.lastUpdated).isAfter(moment().subtract(30, 'day'))
    );
    return this.selectedStatus.indexOf('archived') > -1 && archivedFiles.length
      ? true
      : false;
  }

  sendDocument() {
    this.router.navigate(['/dmsportal/send-document'], { queryParams: { rootClientFolder: this.rootClientFolder } })
  }

  clearLocal() {
    localStorage.removeItem('fileId');
    localStorage.removeItem('fileName');
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.folderList) {
      return this.folderList.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
