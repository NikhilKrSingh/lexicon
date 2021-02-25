import { Component, EventEmitter, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ModalDismissReasons, NgbDateAdapter, NgbDateNativeAdapter, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { debounceTime, distinctUntilChanged, finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwContact } from 'src/app/modules/models';
import { MatterListSearchOption, vwAttorneyViewModel, vwMatterResponse } from 'src/app/modules/models/matter.model';
import { Page } from 'src/app/modules/models/page';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwIdName } from 'src/common/swagger-providers/models';
import { BlockService, MatterService, TrustAccountService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-matter-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
  providers: [
    {
      provide: NgbDateAdapter,
      useClass: NgbDateNativeAdapter
    }
  ]
})
export class ListComponent implements OnInit {
  closeResult: string;
  errMessage:string = null;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild(DatatableComponent, { static: false }) tableBal: DatatableComponent;

  searchOption: MatterListSearchOption;
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  status = false;
  status1 = false;
  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  searchText = new FormControl();
  searchResults: Array<vwMatterResponse> = [];
  showSearchResults = false;
  statusList: Array<vwIdName> = [];
  officeList: Array<vwIdName> = [];
  matterList: Array<vwMatterResponse> = [];
  originalMatterList: Array<vwMatterResponse> = [];
  selectedMatterList: Array<vwMatterResponse> = [];
  blockedFromSomeMatters: boolean;
  public mtofcselected: any;
  public statusselected: any;
  public loading = true;
  public loading1 = false;
  selectedRowLength = 0;
  selectedMatters=[];
  positiveBalanceMatters=[];
  positiveBalaceMatterIds=[];
  selectedMattersPositiveBalance=[];
  isSingleMatterPositiveBal = false;
  isMultipleSomeMatterPositiveBal = false;
  isMultipleAllMatterPositiveBal = false;
  searchString: string = null;

  public currentActive: number;
  billTypeList: Array<vwIdName> = [{
    id: 1,
    name: 'Hourly'
  },{
    id: 2,
    name: 'Fixed Fee'
  }];
  public selected: Array<vwMatterResponse> = [];
  allSelected: boolean;

  constructor(
    private toastDisplay: ToastDisplay,
    private modalService: NgbModal,
    private matterService: MatterService,
    private blockService: BlockService,
    private pagetitle: Title,
    private trustAccountService: TrustAccountService,
  ) {
    this.searchOption = new MatterListSearchOption();
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    this.pagetitle.setTitle("Matters");
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

    this.initSearchText();
    this.getMatterList();
    this.checkBlockedMatters();
  }

  clickEvent() {
    this.status = !this.status;
  }

  cancelClickEvent() {
    this.status = !this.status;
  }

  private initSearchText() {
    this.searchText.valueChanges
      .pipe(distinctUntilChanged(), debounceTime(500))
      .subscribe((text: string) => {
        if (text && text.trim() !== '') {
          this.searchMatterByText(text);
        } else {
          this.searchResults = [];
          this.showSearchResults = false;
        }
      });
  }

  private searchMatterByText(text: string) {
    this.matterService
      .v1MatterSearchPost$Json({
        body: {
          name: text
        }
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwMatterResponse>;
        })
      )
      .subscribe(
        res => {
          this.searchResults = res;
          this.showSearchResults = true;
        },
        () => {
          this.searchResults = [];
          this.showSearchResults = false;
        }
      );
  }

  private getMatterList() {
    this.loading = true;
    this.matterService
      .v1MatterByuserGet({})
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwMatterResponse[];
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          this.removeSelection();
          if (res) {
            this.originalMatterList = res;
            this.loading = false;
          } else {
            this.originalMatterList = [];
            this.loading = false;
          }

          if (this.originalMatterList && this.originalMatterList.length > 0) {
            this.originalMatterList.map(obj => {
              if (
                obj.clientName &&
                (obj.clientName.company === '' ||
                  obj.clientName.company === null)
              ) {
                obj.cname = obj.clientName.firstName
                  ? obj.clientName.lastName + ', ' + obj.clientName.firstName
                  : obj.clientName.lastName;
              } else {
                obj.cname =
                  obj.clientName && obj.clientName.company
                    ? obj.clientName.company
                    : '';
              }
              if (
                obj.responsibleAttorney &&
                obj.responsibleAttorney.length > 0
              ) {
                obj.rname = obj.responsibleAttorney[0].firstName
                  ? obj.responsibleAttorney[0].lastName +
                    ', ' +
                    obj.responsibleAttorney[0].firstName
                  : obj.responsibleAttorney[0].lastName;
              }

              if (obj.matterName) {
                obj.matterName = obj.matterName.trim();
              }

              if (obj.cname && obj.cname.length > 0) {
                obj.cname = obj.cname.trim();
              }

              if (obj.rname && obj.rname.length > 0) {
                obj.rname = obj.rname.trim();
              }
              if (obj.isFixedFee) {
                obj.billType = 'Fixed Fee'
              } else {
                obj.billType = 'Hourly'
              }
            });
          }
          this.matterList = [...this.originalMatterList];
          this.updateDatatableFooterPage();
          this.getOfficeList();
          this.getStatusList();
        }, err => {
          this.loading = false;
        }
      );
  }

  private checkBlockedMatters() {
    const profile = localStorage.getItem('profile');
    if (profile) {
      const person = JSON.parse(profile);
      if (person && person.id) {
        this.blockService
          .v1BlockPersonPersonIdGet({
            personId: person.id
          })
          .pipe(
            map(res => {
              return JSON.parse(res as any).results as any[];
            })
          )
          .subscribe(res => {
            if (res && res.length > 0) {
              this.blockedFromSomeMatters = true;
            } else {
              this.blockedFromSomeMatters = false;
            }
          });
      }
    }
  }

  private getStatusList() {
     if (this.originalMatterList) {
       var statusList = this.originalMatterList
         .filter(a => a.matterStatus)
         .map(m => m.matterStatus);
         statusList = statusList.filter(item => {
          if (item.name){
            return item
          }
         })
       this.statusList = _.uniqBy(statusList, a => a.id);
     }
  }

  private getOfficeList() {
    if (this.originalMatterList) {
      const officeList = this.originalMatterList
        .filter(a => a.matterPrimaryOffice)
        .map(m => m.matterPrimaryOffice);
      this.officeList = _.uniqBy(officeList, a => a.id);
    }
  }

  /**
   * Change Page size from Paginator
   */
  changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateDatatableFooterPage();
    }    
    this.checkParentCheckbox();
    UtilsHelper.aftertableInit();
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
    this.changePage();
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.page.totalElements = this.matterList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
  }

  public applyFilter() {
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

        if (this.searchOption.closeDate) {
          matching =
            matching &&
            a.matterCloseDate &&
            +new Date(a.matterCloseDate).setHours(0, 0, 0, 0) ==
              +new Date(this.searchOption.closeDate).setHours(0, 0, 0, 0);
        }

        if (this.searchOption.statusId) {
          matching =
            matching &&
            a.matterStatus &&
            a.matterStatus.id == this.searchOption.statusId;
        }
        if (this.searchOption.billTypeId) {
          const billTypeFilterId = this.searchOption.billTypeId;
          matching = (billTypeFilterId === 1) ? matching && !a.isFixedFee : matching && a.isFixedFee;
        }

        return matching;
      });

      if (this.searchString && this.searchString.trim() != ''){
        this.newFilter(this.searchString, this.matterList);
      } else {
        this.updateDatatableFooterPage();
      }
    }
  }

  /**
   * select rows
   *
   * @param {*} { selected }
   */
  public onSelect({ selected }) {
    this.selectedMatterList.splice(0, this.selectedMatterList.length);
    this.selectedMatterList.push(...selected);
  }

  getName(user: vwAttorneyViewModel | vwContact) {
    if (user) {
      if (user.company) {
        return user.company;
      } else {
        let name = user.lastName;

        if (name) {
          name += ', ';
        }

        name += user.firstName;

        return name || '';
      }
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

  public searchFilter(event) {
    const val = event.target.value;
    let filters = Object.keys(this.searchOption);
    if(filters.length && filters.some(filter => filter)){
      this.applyFilter();
    } else {
      this.newFilter(val, this.originalMatterList);
    }
  }

  newFilter(val, list) {
    const temp = list.filter(
      item =>
        this.matchName(item, val, 'matterNumber') ||
        this.matchName(item, val, 'matterName') ||
        this.matchName(item, val, 'matterPrimaryOffice') ||
        this.matchName(item, val, 'clientName') ||
        this.matchName(item, val, 'matterType.name') ||
        this.matchName(item, val, 'primaryContactPerson.name') ||
        this.matchName(item, val, 'preferredContactMethod') ||
        this.matchName(item, val, 'primaryOffice') ||
        this.matchName(item, val, 'companyName') ||
        this.matchName(item, val, 'responsibleAttorney') ||
        UtilsHelper.matchFullEmployeeName(item.clientName, val) ||
        UtilsHelper.matchFullEmployeeName(item.responsibleAttorney[0], val)
    );
    // update the rows
    this.matterList = temp;
    this.updateDatatableFooterPage();
  }

  private matchName(item: any, searchValue: string, fieldName): boolean {
    let searchName;
    if (fieldName === 'preferredContactMethod') {
      if (item.preferredContactMethod === 'Email') {
        searchName = item.email ? item.email.toString().toUpperCase() : '';
      } else if (
        item.preferredContactMethod === 'Text' ||
        item.preferredContactMethod === 'Call'
      ) {
        if (item.phones) {
          const phone = item.phones.find(a => a.isPrimary).number;
          searchName = phone ? phone : '';
        } else {
          searchName = '';
        }
      } else {
        searchName = '';
      }
    } else if (fieldName === 'responsibleAttorney') {
      if (item[fieldName].length > 0) {
        searchName = item[fieldName][0].firstName
          ? item[fieldName][0].firstName.toString().toUpperCase() +
            ' ' +
            item[fieldName][0].lastName.toString().toUpperCase()
          : '';
      }
    } else if (fieldName === 'primaryOffice') {
      searchName =
        item[fieldName] && item[fieldName].name
          ? item[fieldName].name.toString().toUpperCase()
          : '';
    } else if (fieldName === 'matterPrimaryOffice') {
      searchName =
        item[fieldName] && item[fieldName].name
          ? item[fieldName].name.toString().toUpperCase()
          : '';
    } else if (fieldName === 'clientName') {
      if (item[fieldName] && item[fieldName]['isCompany']) {
        searchName =
          item[fieldName] && item[fieldName].company
            ? item[fieldName].company.toString().toUpperCase()
            : '';
      } else {
        searchName =
          item[fieldName] && item[fieldName].firstName
            ? item[fieldName].lastName.toString().toUpperCase().trim() +
              ',' +
              item[fieldName].firstName.toString().toUpperCase().trim()
            : '';
      }
    } else {
      searchName = item[fieldName]
        ? item[fieldName].toString().toUpperCase()
        : '';
    }
    return searchName
      ? searchName.search(searchValue.toUpperCase().replace(/\s*,\s*/g, ",")) > -1
      : null;
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.matterList.length;
    this.page.totalPages = Math.ceil(this.matterList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
    this.checkParentCheckbox();
    UtilsHelper.aftertableInit();
  }

  public onSelectRow(event?: any) {
    if (event && event.selected && event.selected.length) {
      const closeMatter = event.selected.filter(item => item.matterStatus && item.matterStatus.name !== 'Closed');
      this.selectedRowLength = (closeMatter) ? closeMatter.length : 0;
      this.selectedMatters = [...event.selected];
    } else {
      this.selectedRowLength = 0;
    }
  }
  closeWarningModal(content,row:any = null, contentBal){
    if(row){
      this.selectedMatters =[];
      this.selectedMatters.push(row);
      this.selectedRowLength = 1;
    }
    this.loading = true;
    this.errMessage = "";
    let params = [];
    this.selectedMatters.filter(item=>{
      params.push(item.id) ;
    });
    this.isSingleMatterPositiveBal = this.isMultipleSomeMatterPositiveBal = this.isMultipleAllMatterPositiveBal = false;
    this.trustAccountService
      .v1TrustAccountGetMatterListTrustBalanceDetailsPost$Json({ body: params })
      .subscribe(
        res => {
          this.loading = false;
          let matterList = JSON.parse(res as any).results;
          let isPositiveBalance = false;
          let positiveBalanceMatterCount = 0;
          this.positiveBalaceMatterIds = [];
          this.positiveBalanceMatters = [];

          for(let i = 0; i < matterList.length; i++){
            if(matterList[i]['isPositiveMatterBalance']){
              isPositiveBalance = true;
              positiveBalanceMatterCount = positiveBalanceMatterCount + 1;
              this.positiveBalaceMatterIds.push(matterList[i]['matterId']);
            }
          }

          this.selectedMatters.forEach(matter=>{
            if(this.positiveBalaceMatterIds.includes(matter['id'])){
              this.positiveBalanceMatters.push(matter);
            }
          })

          this.positiveBalanceMatters = [...this.positiveBalanceMatters];
          if(isPositiveBalance && this.selectedMatters.length == 1){
            this.openPersonalinfo(contentBal,'md','');
            this.isSingleMatterPositiveBal = true;
          }else if(isPositiveBalance && this.selectedMatters.length > 1 && positiveBalanceMatterCount == this.selectedMatters.length){
            this.openPersonalinfo(contentBal,'lg','');
            this.isMultipleAllMatterPositiveBal = true;
          }else if(isPositiveBalance && this.selectedMatters.length > 1 && positiveBalanceMatterCount != this.selectedMatters.length){
            this.openPersonalinfo(contentBal,'lg','');
            this.isMultipleSomeMatterPositiveBal = true;
          }

          if(!isPositiveBalance){
            this.openPersonalinfo(content,'md','');
          }
        },
        err => {
          this.loading = false;
          this.errMessage = err.error;
        }
      );

  }

  reopenWarningModal(content,row:any = null){
    if(row){
      this.selectedMatters =[];
      this.selectedMatters.push(row);
      this.selectedRowLength = 1;
    }
    this.openPersonalinfo(content,'sm','')
  }
  reopenMatter(){
    this.loading1 = true;
    let params = [];
    this.selectedMatters.filter(item=>{
      params.push(item.id) ;
    });
    this.matterService
      .v1MatterReopenMatterIdPost$Response({ matterId: params[0] })
      .subscribe(
        response => {
          this.searchOption = new MatterListSearchOption();
          if(this.selectedRowLength > 1){
            this.toastDisplay.showSuccess('These matters reopened.');
          }else{
            this.toastDisplay.showSuccess('Matter reopened.');
          }
          this.loading1 = false;
          this.getMatterList();
          this.selectedRowLength = 0;
          this.selectedMatters = [];
          this.modalService.dismissAll();
        },
        err => {
          this.loading1 = false;
          this.errMessage = err.error;
        }
      );
  }

  closeMatter(content = null){
    this.loading1 = true;
    let params = [];
    this.selectedMatters.filter(item=>{
      if(!this.positiveBalaceMatterIds.includes(item['id'])){
        params.push(item.id) ;
      }
    });
    this.matterService
      .v1MatterBulkCloseMatterPost$Json$Response({ body: params })
      .subscribe(
        response => {
          if(this.selectedRowLength > 1){
            this.toastDisplay.showSuccess('Matters closed.');
          }else{
            this.toastDisplay.showSuccess('Matter closed.');
          }
          this.loading1 = false;
          this.selectedMatters = [];
          this.selectedMatterList = [];
          this.getMatterList();
          this.selectedRowLength = 0;
          this.modalService.dismissAll();
        },
        err => {
          this.loading1 = false;
          this.errMessage = err.error;
          if(content){
            this.modalService.dismissAll();
            this.openPersonalinfo(content,'md','');
          }
        }
      );
  }
  openPersonalinfo(content: any, className, winClass) {
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
  onClickedOutside(event: any, index: number) {
    if (index == this.currentActive) {
      this.currentActive = null;
    }
  }
  openMenu(index: number, event): void {
    setTimeout(() => {
      if (this.currentActive != index) {
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
    }, 50);
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.matterList) {
      return this.matterList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  /**** function to select/deselect only displayed page record */
  selectDeselectRecords() {
    this.allSelected = !this.allSelected
    this.table.bodyComponent.temp.forEach(row => {
      const index = this.matterList.findIndex(list => list.id === row.id);
      if (index > -1) {
        this.matterList[index]['selected'] = this.allSelected;
      }
      const existingIndex = this.selected.findIndex(list => list.id === row.id);
      if (existingIndex > -1 && !row.selected) {
        this.selected.splice(existingIndex, 1)
      } else if (row.selected && existingIndex === -1) {
        this.selected.push(row);
      }
    })
    this.setSelected();
  }

  /******* function to select/deselect child checkbox  */
  changeChildSelection(row) {
    row.selected = !row.selected
    const existingIndex = this.selected.findIndex(list => list.id === row.id);
    if (existingIndex > -1 && !row.selected) {
      this.selected.splice(existingIndex, 1)
    } else if (row.selected && existingIndex === -1) {
      this.selected.push(row);
    }
    this.setSelected();
  }

  setSelected() {
    this.matterList.forEach(list => {
      const selectedIds = this.selected.filter(selected => selected.id === list.id);
      if (selectedIds.length > 0) {
        list['selected'] = true;
      }
    });

    const closeMatter = this.selected.filter(item => item.matterStatus && item.matterStatus.name !== 'Closed');
    this.selectedRowLength = (closeMatter) ? closeMatter.length : 0;
    this.checkParentCheckbox();
  }

  checkParentCheckbox() {
    setTimeout(() => {
      const currentArr = []
      this.table.bodyComponent.temp.forEach(row => {
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
    this.matterList.forEach(list => {
      list['selected'] = false;
    })
    this.selected = [];
    this.checkParentCheckbox();
  }
}
