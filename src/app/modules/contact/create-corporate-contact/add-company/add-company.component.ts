import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Page } from '../../../models';
import { UtilsHelper } from '../../../shared/utils.helper';
import { ClientAssociationService, ClientService } from 'src/common/swagger-providers/services';
import { FormControl } from '@angular/forms';
import * as clone from 'clone';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-company',
  templateUrl: './add-company.component.html',
  styleUrls: ['./add-company.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddCompanyComponent implements OnInit {
  public searchStringPopup: any = '';
  public origPopupcompanyList: Array<any> = [];
  public popupcompanyList: Array<any> = [];
  public addCompanypage = new Page();
  public pageSelected = 1;
  @ViewChild(DatatableComponent, { static: false }) tableAddCompany: DatatableComponent;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public addSelectedCompanyList: any[] = [];
  public pageSelectorAddComapany = new FormControl('10');
  public selectedCompanyIds: any[];
  public currentActive: number;
  public contactId;
  public filterName = 'Apply Filter';
  public limitArray: Array<number> = [10, 30, 50, 100];
  private clientSearchSubscribe: Subscription;
  public companyLoading: boolean;
  public contactType;
  public companyList: Array<any> = [];
  private tempCompanyArr: Array<any> = [];
  public alreadyCompanyList;
  constructor(
    private activeModal: NgbActiveModal,
    private clientAssociationService: ClientAssociationService,
    private clientService: ClientService,

  ) { 
    this.addCompanypage.pageNumber = 0;
    this.addCompanypage.size = 10;
  }

  ngOnInit() {
    this.contactId = this.contactId.id;
    this.contactType = this.contactType.type;
    this.popupcompanyList = [];
    this.searchStringPopup = '';
    this.alreadyCompanyList = this.alreadyCompanyList.list;
    this.selectedCompanyIds = this.alreadyCompanyList.map(x => x.id);
    this.filterCompany(this.searchStringPopup, 'update');
  }

  public filterCompany(searchString, type) {
    const companyList = [];
    if (this.clientSearchSubscribe) {
      this.clientSearchSubscribe.unsubscribe();
    }
    this.companyLoading = true;
    this.clientSearchSubscribe = this.clientService.v1ClientCorporateGet({ search: searchString })
      .subscribe(suc => {
        this.companyLoading = false;
        const res: any = suc;
        const list = JSON.parse(res).results;
        list.map((obj) => {
          let title = 'All';
          const findIndex = this.alreadyCompanyList.find(x => x.id == obj.id);
          if (findIndex && findIndex.associations) {
            title = findIndex.associations.length;
          }
          const item = {
            id: obj.id,
            isSelectd: false,
            companyName: obj.companyName,
            clientFlag: obj.clientFlag,
            isVisible: obj.isVisible,
            seletedIds: [],
            title,
            previousSelected: (title !== 'All') ? true: false,
            contactType: clone(this.contactType)
          };
          companyList.push(item);
          // if (type === 'create') {
          //   companyList.push(item);
          // } else {
          //   let exist = this.companyList.find(item => item.id === obj.id);
          //   if (!exist) {
          //     companyList.push(item);
          //   }
          // }
        });
        if (type === 'create') {
          this.companyList = clone(companyList);
        } else {
          this.origPopupcompanyList = clone(companyList);
          this.origPopupcompanyList.forEach(item => {
            item.isSelectd = this.selectedCompanyIds.includes(item.id);
            // item.seletedIds = item.associations.map(x => x.id);
          });
          this.popupcompanyList = [...this.origPopupcompanyList];
          this.getTotalPagesAddCompany();
        }
        this.tempCompanyArr = JSON.parse(JSON.stringify(companyList));
      },
        err => {
          this.companyLoading = false;
        }
      );
    return companyList;
  }

  cancel() {
    this.activeModal.close(false);
  }

  public applyAddFilter() {
    let rows = [...this.origPopupcompanyList];
    if (this.searchStringPopup) {
      rows = this.origPopupcompanyList.filter(f => {
        return (f.companyName || '').toLowerCase().includes(this.searchStringPopup.toLowerCase());
      });
    }
    this.popupcompanyList = rows;
    this.getTotalPagesAddCompany();
  }

  public getTotalPagesAddCompany() {
    this.addCompanypage.totalElements = this.popupcompanyList.length;
    this.addCompanypage.totalPages = Math.ceil(
      this.popupcompanyList.length / this.addCompanypage.size
    );
    this.addCompanypage.pageNumber = 0;
    this.pageSelected = 1;
    this.tableAddCompany.offset = 0;
    UtilsHelper.aftertableInit();
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  public onSelectAddCompany(event) {
    this.addSelectedCompanyList = [...event.selected];
  }
  /**** Changes Rows Per Page *****/
  public changeAddComapanyPageSize() {
    this.addCompanypage.size = +this.pageSelectorAddComapany.value;
    this.getTotalPagesAddCompany()
  }
  /***** Change Page Dropdown ***/
  public changePageAddCompany() {
    this.addCompanypage.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.getTotalPagesAddCompany()
    }
    UtilsHelper.aftertableInit();
  }
  /****** Page Change Data table Pager */
  public pageChangeAddCompany(e) {
    this.pageSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  openMenu(index: number, event): void {
    setTimeout(() => {
      if (this.currentActive !== index) {
        this.currentActive = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        if (event.target.closest('.datatable-row-wrapper')) {
          event.target.closest('.datatable-row-wrapper').classList.add('datatable-row-hover');
        }
      } else {
        this.currentActive = null;
        if (event.target.closest('.datatable-row-wrapper')) {
          event.target.closest('.datatable-row-wrapper').classList.remove('datatable-row-hover');
        }
      }
    }, 50);
  }

  onClickedOutside(event: any, index: number) {
    if (index === this.currentActive) { this.currentActive = null; }
  }

  resetCurrentActive() {
    setTimeout(() => {
      this.currentActive = null;
    }, 100)
  }

  public selectDropdwnOffice(event: any, item, index: number, type: string): void {
    if (type === 'create') {
      if (event.length > 0) {
        this.companyList[index].title = event.length;
      } else {
        this.companyList[index].title = 'All';
      }
    } else {
      if (event.length > 0) {
        this.popupcompanyList[index].title = event.length;
        item.title = event.length;
        item.seletedIds = event;
      } else {
        this.popupcompanyList[index].title = 'All';
        item.title = 'All';
        item.seletedIds = [];
      }
    }
    // this.tempCompanyArr[index] = item;
  }

  public saveCompanyList(companyList: any = [], id = 0) {
    const arr = [];
    companyList =
      companyList.length === 0 ? this.addSelectedCompanyList : companyList;
    let associateIds = [];
    if (companyList && companyList.length > 0) {
      associateIds = companyList[0].contactType ? companyList[0].contactType.map(item => item.id) : companyList[0].associations ? companyList[0].associations.map(item => item.id) : [];
    }
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < companyList.length; i++) {
      const element = companyList[i];
      if (element.isSelectd) {
        arr.push({
          personId: id === 0 ? +this.contactId : +id,
          clientId: element.id,
          associationTypeId: (element.title === 'All') ? associateIds : element.seletedIds
        });
      }
    }

    this.addCompanyForcorporate(arr, id);
  }

  public addCompanyForcorporate(arr, id) {
    this.clientAssociationService
      .v1ClientAssociationBulkPost$Json({ body: arr })
      .subscribe(
        suc => {
          this.activeModal.close(true);
        },
        err => {
          console.log(err);
        }
      );
  }

  /**
 * function to clear company filters
 */
  public clearFilter(item: any, index: number, type: string) {
    item.seletedIds = [];
    item.contactType.map((type, i) => {
      item.contactType[i].checked = false;
    });
    this.tempCompanyArr[index] = item;
    if (type === 'create') {
      this.companyList = this.tempCompanyArr;
    }
    item.title = 'All';
  }

  get footerHeight() {
    if (this.popupcompanyList) {
      return this.popupcompanyList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
