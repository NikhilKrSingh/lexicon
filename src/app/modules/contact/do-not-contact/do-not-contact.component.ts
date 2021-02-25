import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import * as errors from 'src/app/modules/shared/error.json';
import { MiscService } from 'src/common/swagger-providers/services';
import { Page } from '../../models';
import { vwDoNotContactCode } from '../../models/do-not-contact-code';
import { DialogService } from '../../shared/dialog.service';
import { UtilsHelper } from '../../shared/utils.helper';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';

@Component({
  selector: 'app-do-not-contact',
  templateUrl: './do-not-contact.component.html',
  styleUrls: ['./do-not-contact.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class DoNotContactComponent implements OnInit {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  public codeList: Array<vwDoNotContactCode> = [];
  public originalCodeList: Array<vwDoNotContactCode> = [];
  error_data = (errors as any).default;
  contactCode: vwDoNotContactCode;
  modalRef: NgbModalRef<any>;
  public loading: boolean;
  public disable: boolean = true;
  public contactCodeErrMsg = '';
  public submitted = false;
  public searchText: string = null;
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selectPage = new FormControl('10');
  public pageSelected = 1;
  public page = new Page();
  @ViewChild(DatatableComponent, {static: false}) doNotContactTable: DatatableComponent;
  public page1 = new Page();
  public pageSelected1 = 1;
  public counter = Array;
  public pageSelector = new FormControl('10');
  public tables: any = {
    tableArr: [],
    frozenRightArr: []
  };
  public selected = [];
  public currentActive: number;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };


  constructor(
    private miscService: MiscService,
    private toastr: ToastDisplay,
    private modalService: NgbModal,
    private dialogService: DialogService,
    private pagetitle: Title
  ) { 
    this.page.size = 10;
    this.page.pageNumber = 0;
    this.page1.pageNumber = 0;
    this.page1.size = 10;
  }

  ngOnInit() {
    this.pagetitle.setTitle("Do Not Contact");
    this.getCodeList();
    this.disable = false;
  }

  ngAfterViewInit() {
    window.onresize = (e) => {
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

  ValidateDoNotContact() {
    this.contactCodeErrMsg = '';
    if (!this.contactCode.code) {
      this.contactCodeErrMsg = this.error_data.do_not_contact_error;
      this.disable = false;
      return;
    }
  }

  doNotContactCodeChange() {
    this.contactCodeErrMsg = '';
    if (!this.contactCode.code) {
      this.contactCodeErrMsg = this.error_data.do_not_contact_error;
    }
  }

  private getCodeList() {
    this.loading = true;
    this.miscService.v1MiscDoNotContactReasonCodesGet$Response().subscribe(
      (res) => {
        this.loading = false;
        const list = JSON.parse(res.body as any).results || [];
        this.codeList = [...list];
        this.originalCodeList = [...list];
        this.calcTotalPages();
      },
      (err) => {
        this.loading = false;
      }
    );
  }

  updateDatatableFooterPage() {
    this.page1.totalElements = this.codeList.length;
    this.page1.totalPages = Math.ceil(this.codeList.length / this.page1.size);
    this.page1.pageNumber = 0;
    this.pageSelected1 = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
  }

  /*** open menu on action click */
  openMenu(index: number, event): void {
    event.stopPropagation();
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

  /*** closed menu on body click */
  onClickedOutside(event: any, index: number) {
    if (index == this.currentActive) {
      this.currentActive = null;
    }
  }

  public changePageSize() {
    this.page1.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  public changePage1() {
    this.page1.pageNumber = this.pageSelected1 - 1;
    if (this.pageSelected1 == 1) {
      this.updateDatatableFooterPage();
    }
    UtilsHelper.aftertableInit();
  }

  public pageChange1(e) {
    this.pageSelected1 = e.page;
    UtilsHelper.aftertableInit();
  }

  deleteCode(id: number) {
    this.dialogService
      .confirm(
        'Are you sure you want to delete this Do Not Contact Reason Code?',
        'Ok',
        'Cancel',
        'Delete Code'
      )
      .then((res) => {
        if (res) {
          this.miscService
            .v1MiscDoNotContactReasonCodesIdDelete({
              id: id,
            })
            .pipe(map(UtilsHelper.mapData))
            .subscribe(
              (res1) => {
                if (res1 > 0) {
                  this.toastr.showSuccess(
                    'Do not contact reason code deleted.'
                  );
                  this.getCodeList();
                } else {
                }
              },
              () => {
              }
            );
        }
      });
  }

  addCode(addContactTemplate) {
    this.contactCodeErrMsg = '';
    this.contactCode = {} as vwDoNotContactCode;
    this.disable = false;

    this.modalRef = this.modalService.open(addContactTemplate, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
  }

  editCode(code: vwDoNotContactCode, editContactTemplate) {
    this.contactCodeErrMsg = '';
    this.disable = false;
    this.contactCode = { ...code };

    if (code.code !== 'Other') {
      this.modalRef = this.modalService.open(editContactTemplate, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
      });
    }
  }

  save() {
    let observable: Observable<any>;
    this.disable = true;
    this.submitted = true;

    if (
      this.contactCode &&
      this.contactCode.code &&
      this.contactCode.code.trim() != ''
    ) {
      if (this.contactCode.id) {
        this.contactCode.name = this.contactCode.code;

        observable = this.miscService.v1MiscDoNotContactReasonCodesPut$Json({
          body: this.contactCode,
        });
      } else {
        observable = this.miscService.v1MiscDoNotContactReasonCodesPost$Json({
          body: {
            code: this.contactCode.code,
            name: this.contactCode.code,
          },
        });
      }

      observable.pipe(map(UtilsHelper.mapData)).subscribe(
        (res) => {
          if (res) {
            if (this.contactCode.id) {
              this.toastr.showSuccess(
                'Do not contact reason code updated.'
              );
            } else {
              this.toastr.showSuccess(
                'Do not contact reason code created.'
              );
            }
            this.disable = false;
            this.submitted = false;
            if (this.modalRef) {
              this.modalRef.close();
            }
            this.getCodeList();
          } else {
            this.disable = false;
          }
        },
        () => {
        }
      );
    }
    else {
      this.ValidateDoNotContact();
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  /*** Claculates Total Pages ***/
  public calcTotalPages() {
    this.page.totalElements = this.codeList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    if (this.doNotContactTable) {
      this.doNotContactTable.offset = 0;
    }
    UtilsHelper.aftertableInit();
  }

   /** Data Table Items per page **/
   public pageSizeChange(): void {
    this.page.size = +this.selectPage.value;
    this.calcTotalPages();
  }

  /** Change Data Table Page **/
  public changePage() {
    this.page.pageNumber = +this.pageSelected;
    UtilsHelper.aftertableInit();
  }

  /*** update data table pager **/
  public pageChange(e) {
    this.pageSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  trackByFn_(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  /*** Apply Filter ***/
  public applyFilter() {
    let row = [...this.originalCodeList];
    if(this.searchText.trim()) {
      row = this.originalCodeList.filter(obj => (obj.name || '').toLowerCase().includes(this.searchText.trim().toLowerCase()));
    }
    this.codeList = [...row];
  }
  get codeListFooterHeight() {
    if (this.codeList) {
      return this.codeList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
