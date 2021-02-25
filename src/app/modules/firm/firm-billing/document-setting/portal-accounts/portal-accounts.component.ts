import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/Rx';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { CommonService } from 'src/app/service/common.service';
import { DmsService } from 'src/common/swagger-providers/services';
import { Page } from '../../../../models/page';
import * as errorData from '../../../../shared/error.json';


@Component({
  selector: 'app-portal-accounts',
  templateUrl: './portal-accounts.component.html',
  styleUrls: ['./portal-accounts.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class PortalAccountsComponent implements OnInit {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild('search', { static: false }) search: ElementRef;

  modalOptions: NgbModalOptions;
  closeResult: string;
  public page = new Page();
  public pangeSelected = 1;
  public pageSelector = new FormControl('10');
  public ColumnMode = ColumnMode;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public errorData: any = (errorData as any).default;
  public limitArray: Array<number> = [10, 30, 50, 100];
  public counter = Array;
  public currentActive: number;
  public title = 'All';
  public title1 = 'All';
  public filterName = 'Apply Filter';
  public selectedType: Array<any> = [];
  public stateList: Array<any> = [];
  public statusList: Array<any> = [];
  public selectedStatus: Array<number> = [];
  public oriArr: Array<any> = [];
  public portalAccountList = [];
  public typeList = [];
  public sharedDocument: any;
  public selectedRecord: any;
  public selectedRevokeRecord: any;
  public folderList: Array<any> = [];
  public currentUserInfo: any;
  public tenantFolder: any;
  public breadCrumb: Array<any> = [];
  public currentIndex: any;
  public loading = false;
  public portalLoading = true;
  public searchInput: string;
  public tables: any = {
    tableArr: [],
    frozenRightArr: []
  };
  orgFolders: any = [];

  constructor(
    private dmsService: DmsService,
    private toastDisplay: ToastDisplay,
    private router: Router,
    private modalService: NgbModal,
    private dialogService: DialogService,
    public commonService: CommonService,
    private fb: FormBuilder) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    this.currentUserInfo = JSON.parse(localStorage.getItem('profile'));
    this.getPortalAccounts();
    this.getTenantFolder();
  }

  ngAfterViewInit() {
    window.onresize = () => {
      this.initScrollDetector([this.table]);
    };
  }

  /**** Calls when resize screen *****/
  public initScrollDetector(tableArr = []) {
    this.tables.tableArr = [...tableArr];
    this.tables.frozenRightArr = []
    this.tables.tableArr.forEach(x => this.tables.frozenRightArr.push(false));
    window.onresize = () => {
      UtilsHelper.checkDataTableScroller(this.tables);
    };
  }

  openPersonalinfo(content: any, className, winClass, row, selected = true) {
    if (selected) {
      this.selectedRecord = row;
    }
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
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
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  public updateDatatableFooterPage() {
    this.page.totalElements = this.portalAccountList.length;
    this.page.totalPages = Math.ceil(this.portalAccountList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  public getPortalAccounts() {
    this.dmsService.v1DmsPortalAccountGet$Response().subscribe(suc => {
      const res: any = suc;
      this.portalAccountList = JSON.parse(res.body).results;
      this.oriArr = this.portalAccountList;
      this.getStatusList(this.portalAccountList);
      this.getTypeList(this.portalAccountList);
      this.updateDatatableFooterPage();
      UtilsHelper.checkDataTableScroller([this.table]);
      this.portalLoading = false;
      this.applyFilter();
    }, err => {
      console.log(err);
      this.portalLoading = false;
    });
  }

  public openMenu(index: number, event): void {
    setTimeout(() => {
      if (this.currentActive !== index) {
        this.currentActive = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        event.target.closest('.datatable-row-wrapper').classList.add('datatable-row-hover');
      } else {
        this.currentActive = null;
        event.target.closest('.datatable-row-wrapper').classList.remove('datatable-row-hover');
      }
    }, 50);

  }
  onClickedOutside(event: any, index: number) {
    if (index === this.currentActive) { this.currentActive = null; }
  }

  public getSelectedType(event) {
    this.title = '';
    if (event.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'All';
    }
  }

  public clearFilter(type: string) {
    if (type === 'type') {
      this.selectedType = [];
      this.typeList.forEach(item => (item.checked = false));
      this.title = 'All';
    }
    if (type === 'search') {
      this.search.nativeElement.value = '';
    } else {
      this.selectedStatus = [];
      this.statusList.forEach(item => (item.checked = false));
      this.title1 = 'All';
    }
    this.applyFilter();
  }


  public applyFilter(event: any = null) {
    const val = this.searchInput ? this.searchInput : '';
    let filterList = this.oriArr;
    if (this.selectedType && this.selectedType.length > 0) {
      const type = this.typeList.filter((obj: { id: any }) => this.selectedType.includes(obj.id)).map(({ name }) => name);
      filterList = filterList.filter((item) => {
        if ((item.type && type.indexOf(item.type) !== -1)) {
          return item;
        }
      });
    }
    if (this.selectedStatus && this.selectedStatus.length > 0) {
      const status = this.statusList.filter((obj: { id: any }) => this.selectedStatus.includes(obj.id)).map(({ name }) => name);
      filterList = filterList.filter((item) => {
        if ((item.statusName && status.indexOf(item.statusName) !== -1)) {
          return item;
        }
      });
    }
    if (this.sharedDocument) {
      filterList = filterList.filter((item) => {
        if (+item.sharedDocumentCount === 0) {
          return item;
        }
      });
    }
    if (val !== '') {
      filterList = filterList.filter(
        item =>
          this.matchName(item, val, 'name') || this.matchName(item, val, 'email') ||
          this.matchName(item, val, 'companyName')
      );
    }

    this.portalAccountList = filterList;
    this.updateDatatableFooterPage();
  }

  private matchName(item: any, searchValue: string, fieldName: string): boolean {
    const searchName = item[fieldName] ? item[fieldName].toString().toUpperCase() : '';
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  public getSelectedStatus(event) {
    this.title1 = '';
    if (event.length > 0) {
      this.title1 = event.length;
    } else {
      this.title1 = 'All';
    }
  }
  private getStatusList(data: any[]) {
    let statusLst = data.filter((obj: { statusName: any }) => obj.statusName !== null).map(({ statusName }) => statusName);
    statusLst = statusLst.filter(UtilsHelper.onlyUnique);
    this.statusList = this.getList(statusLst);
  }
  private getTypeList(data: any[]) {
    let typeLst = data.filter((obj: { type: any }) => obj.type !== null).map(({ type }) => type);
    typeLst = typeLst.filter(UtilsHelper.onlyUnique);
    this.typeList = this.getList(typeLst);
  }

  private getList(list: any[]) {
    const returnList = [];
    for (let i = 0; i < list.length; i++) {
      returnList.push({ id: i + 1, name: list[i] });
    }
    return returnList;
  }

  public deactivateAccount() {
    this.dmsService.v1DmsActiveOrDeactivePortalGet$Response({ id: this.selectedRecord.id, isActivated: true }).subscribe(suc => {
      let res: any = suc;
      res = JSON.parse(res.body).results;
      if (res) {
        this.toastDisplay.showSuccess('Account is deactivated.');
        this.getPortalAccounts();
        this.clearFilter('search');
        this.selectedRecord = null;
        this.modalService.dismissAll();
      }
    }, err => {
      console.log(err);
    });
  }
  public activateAccount() {
    this.dmsService.v1DmsActiveOrDeactivePortalGet$Response({ id: this.selectedRecord.id, isActivated: false }).subscribe(suc => {
      let res: any = suc;
      res = JSON.parse(res.body).results;
      if (res) {
        this.toastDisplay.showSuccess('Account is activated.');
        this.clearFilter('search');
        this.getPortalAccounts();
        this.selectedRecord = null;
        this.modalService.dismissAll();
      }
    }, err => {
      console.log(err);
    });
  }

  public deleteAccount() {
    this.dmsService.v1DmsDeleteDocumentportalIdDelete$Response({ id: this.selectedRecord.id }).subscribe(suc => {
      let res: any = suc;
      res = JSON.parse(res.body).results;
      if (res) {
        this.toastDisplay.showSuccess('Account deleted.');
        this.clearFilter('search');
        this.getPortalAccounts();
        this.selectedRecord = null;
        this.modalService.dismissAll();
      }
    }, err => {
      console.log(err);
    });
  }

  public resendActivationLink(row) {
    this.dmsService.v1DmsResendInvitationEmailPersonIdGet$Response({ personId: row.personId }).subscribe(suc => {
      let res: any = suc;
      res = JSON.parse(res.body).results;
      if (res) {
        this.toastDisplay.showSuccess('Activation email sent.');
        this.getPortalAccounts();
        this.clearFilter('search');
        this.selectedRecord = null;
        this.modalService.dismissAll();
      }
    }, err => {
      console.log(err);
    });
  }

  public getTenantFolder() {
    this.dmsService.v1DmsTenantFolderGet$Response().subscribe(suc => {
      let res: any = suc;
      res = JSON.parse(res.body).results;
      if (res) {
        this.tenantFolder = res;
      }
    }, err => {
      console.log(err);
    });
  }


  public getSharedDocuments(content: any = null, size: any = null, data: any = null, row: any = null) {
    this.portalLoading = true;
    this.breadCrumb = [];
    this.selectedRecord = row;
    this.loading = true;
    this.dmsService.v1DmsDocumentportalSharedFolderAndDocumentPersonIdFolderIdGet$Response({ personId: row.personId, folderId: this.tenantFolder.id }).subscribe(suc => {
      let res: any = suc;
      this.loading = false;
      res = JSON.parse(res.body).results;
      if (res) {
        const folders = res.folders && res.folders.filter(item => {
          return item;
        });
        const files = res.files && res.files.filter(item => {
          return item;
        });
        this.folderList = folders.concat(files);
        if (content) {
          this.openPersonalinfo(content, size, data, row, true);
        }
      }
      this.portalLoading = false;
    }, err => {
      this.loading = false;
      this.portalLoading = false;
      this.modalService.dismissAll();
    });
  }

  getDetailsFolder(row, index: any = null) {
    if (index != null) {
      this.breadCrumb.length = index + 1;
    } else {
      this.breadCrumb.push(row);
    }
    this.loading = true;
    this.dmsService.v1DmsDocumentportalSharedFolderAndDocumentPersonIdFolderIdGet$Response({ personId: this.selectedRecord.personId, folderId: row.id }).subscribe(suc => {
      let res: any = suc;
      res = JSON.parse(res.body).results;
      if (res) {
        let folders = res.folders && res.folders.filter(item => {
          return item;
        });
        folders = folders.sort((a, b) =>
          a.name
            ? a.name.localeCompare(b.name)
            : a.fileName.localeCompare(b.fileName)
        );
        let files = res.files && res.files.filter(item => {
          return item;
        });
        files = files.sort((a, b) =>
        a.name
          ? a.name.localeCompare(b.name)
          : a.fileName.localeCompare(b.fileName)
        );
        let foldernFiles = [...folders];
        files.forEach(element => {
          foldernFiles.push(element);
        });
        if (foldernFiles.some(obj => obj.lastUpdated)) {
          foldernFiles.map(obj => {
            const testDateUtc = moment.utc(obj.lastUpdated);
            const localDate = testDateUtc.local();
            obj.lastUpdated = localDate.format('YYYY-MM-DD HH:mm:ss');
          });
        }
        this.folderList = [...foldernFiles];
        this.orgFolders = [...foldernFiles];
      }
      this.loading = false;
    }, err => {
      this.modalService.dismissAll();
      this.loading = false;
    });

  }

  public revokeAccess(modalOptions) {
    this.dmsService.v1DmsDocumentFileIdPersonIdRevokeShareRightsDelete$Response({ personId: this.selectedRecord.personId, fileId: this.selectedRevokeRecord.id }).subscribe(suc => {
      let res: any = suc;
      res = JSON.parse(res.body).results;
      if (res) {
        this.toastDisplay.showSuccess(this.errorData.access_revoked_success);
        this.getDetailsFolder(this.breadCrumb[this.breadCrumb.length - 1]);
        modalOptions.close('ESC');
        this.selectedRevokeRecord = null;
        this.getPortalAccounts();
        this.sharedDocument = false;
      }
    }, err => {
      console.log(err);
    });
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.portalAccountList) {
      return this.portalAccountList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  public mySortingFunction(event:any) {
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
    if (event.column.prop === 'name') {
      if (event.newValue === 'asc') {
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
    if (event.column.prop === 'owner.firstName') {
      if (event.newValue === 'asc') {
        folders = folders.sort((a, b) =>
          a.name
            ? a.owner.firstName.localeCompare(b.owner.firstName)
            : a.owner.firstName.localeCompare(b.owner.firstName)
        );
        files = files.sort((a, b) =>
          a.name
            ? a.owner.firstName.localeCompare(b.owner.firstName)
            : a.owner.firstName.localeCompare(b.owner.firstName)
        );
      } else {
        folders = folders.sort((a, b) =>
          b.owner.firstName
            ? b.owner.firstName.localeCompare(a.owner.firstName)
            : b.owner.firstName.localeCompare(a.owner.firstName)
        );
        files = files.sort((a, b) =>
          b.owner.firstName
            ? b.owner.firstName.localeCompare(a.owner.firstName)
            : b.owner.firstName.localeCompare(a.owner.firstName)
        );
      }
    }
    if (event.column.prop === 'category_name') {
      if (event.newValue === 'asc') {
        folders = folders.sort((a, b) =>
          a.category_name
            ? a.category_name.localeCompare(b.category_name)
            : a.category_name.localeCompare(b.category_name)
        );
        files = files.sort((a, b) =>
          a.category_name
            ? a.category_name.localeCompare(b.category_name)
            : a.category_name.localeCompare(b.category_name)
        );
      } else {
        folders = folders.sort((a, b) =>
          b.category_name
            ? b.category_name.localeCompare(a.category_name)
            : b.category_name.localeCompare(a.category_name)
        );
        files = files.sort((a, b) =>
          b.category_name
            ? b.category_name.localeCompare(a.category_name)
            : b.category_name.localeCompare(a.category_name)
        );
      }
    }

    if (event.column.prop === 'fileSizeInKB') {
      if (event.newValue === 'asc') {
        files = files.sort((a, b) => a.fileSizeInKB - b.fileSizeInKB);
      } else {
        files = files.sort((a, b) => b.fileSizeInKB - a.fileSizeInKB);
      }
    }

    if (event.column.prop === 'lastUpdated') {
      files = files.sort((a, b) => {
        const firstDate = new Date(a.lastUpdated).getTime();
        const secondDate = new Date(b.lastUpdated).getTime();
        return event.newValue === 'asc'
          ? firstDate - secondDate
          : secondDate - firstDate;
      });
    }
    this.folderList = folders.concat(files);
  }
}
