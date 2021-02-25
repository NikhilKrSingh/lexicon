import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/Rx';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { AuthService, DmsService } from 'src/common/swagger-providers/services';
import { Page } from '../../../../models/page';
import * as errorData from '../../../../shared/error.json';

@Component({
  selector: 'app-portal-access-history',
  templateUrl: './portal-access-history.component.html',
  styleUrls: ['./portal-access-history.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class PortalAccessHistoryComponent implements OnInit {

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  modalOptions: NgbModalOptions;
  closeResult: string;
  public page = new Page();
  public pangeSelected: number = 1;
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
  public statusList:Array<any> = [];
  public selectedStatus: Array<number> = [];
  public oriArr: Array<any> = [];
  public historyList=[];
  public typeList = [];
  public sharedDocument:any;
  public selectedRecord:any;
  public date:any;
  public startDate:any;
  public endDate:any;
  public searchTerm:string = '';
  public loading = true;
  constructor(
    private dmsService: DmsService,
    private authService:AuthService,
    private toastDisplay: ToastDisplay,
    private router: Router,
    private modalService: NgbModal,
    private dialogService: DialogService,
    private fb: FormBuilder ) {
     this.page.pageNumber = 0;
     this.page.size = 10;
  }

  ngOnInit() {
     this.getHistory();
  }

  openPersonalinfo(content: any, className, winClass, row) {
    this.selectedRecord = row;
    this.modalService
      .open(content, {
        size: className,
        windowClass:winClass,
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
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }

  public updateDatatableFooterPage() {
    this.page.totalElements = this.historyList.length;
    this.page.totalPages = Math.ceil(this.historyList.length / this.page.size);
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

  public getHistory(){
    this.authService.v1AuthPortalLoginHistoryGet$Response().subscribe(suc => {
      const res: any = suc;
      this.historyList = JSON.parse(res.body).results;
        this.oriArr = this.historyList;
        this.getTypeList(this.historyList);
        this.updateDatatableFooterPage();
        this.loading = false
    }, err => {
      this.loading = false;
      console.log(err);
    });
  }
 public  openMenu(index: number, event): void {
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
    } else {
      this.selectedStatus = [];
      this.statusList.forEach(item => (item.checked = false));
      this.title1 = 'All';
    }
    this.applyFilter();
  }


  public applyFilter(event:any = null) {
    let filterList = this.oriArr;
    if (this.selectedType && this.selectedType.length > 0) {
      const type = this.typeList.filter((obj: { id: any }) => this.selectedType.includes(obj.id)).map(({ name }) => name);
      filterList = filterList.filter((item) => {
        if ((item.type && type.indexOf(item.type) !== -1)) {
          return item;
        }
      });
    }
    if (this.sharedDocument) {
      filterList = filterList.filter((item) => {
        if (item.sharedDocumentCount == 0) {
          return item;
        }
      });
    }

    if (this.startDate || this.endDate) {
      filterList = filterList.filter((item) => {
        let itemDate = new Date(item.lastUpdated).setHours(0, 0, 0, 0);
        let startDate = this.startDate ? new Date(this.startDate).setHours(0, 0, 0, 0):null;
        let endDate = this.endDate ? new Date(this.endDate).setHours(0, 0, 0, 0):null;

        if(startDate && endDate){
          if(itemDate >= startDate && itemDate <= endDate){
              return item
           }
        }
        if(startDate && !endDate){
          if(itemDate >= startDate){
                 return item
            }
        }
        if(endDate && !startDate){
          if(itemDate <= endDate){
                 return item
            }
        }
      });
    }

    if (this.searchTerm !== '') {
      filterList = filterList.filter(
        item =>
          this.matchName(item, this.searchTerm, 'email') || this.matchName(item, this.searchTerm, 'ipaddress')
      );
    }

    this.historyList = filterList;
    this.updateDatatableFooterPage();
  }

  private matchName(item: any, searchValue: string, fieldName: string): boolean {
    const searchName = item[fieldName] ? item[fieldName].toString().toUpperCase() : '';
    return searchName.search(searchValue.toUpperCase()) > -1;
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

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.historyList) {
      return this.historyList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }


}

