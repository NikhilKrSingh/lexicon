import { Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Options } from 'ng5-slider';
import { Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page } from 'src/app/modules/models';
import { vwInvoice } from 'src/app/modules/models/vw-invoice';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { DisplayReverseChargeComponent } from 'src/app/modules/shared/display-reverse-charge/display-reverse-charge.component';
import * as errors from 'src/app/modules/shared/error.json';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { InvoiceService } from 'src/app/service/invoice.service';
import { vwIdCodeName } from 'src/common/swagger-providers/models';
import { BillingService, MatterService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../../../store';

@Component({
  selector: 'app-matter-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class MatterInvoicesComponent implements OnInit {
  errorData = (errors as any).default;

  originalInvoiceList: Array<vwInvoice>;
  invoiceList: Array<vwInvoice>;
  selectedInvoiceList: Array<vwInvoice>;
  selectedTableRow = [];
  selectedInvoice: any;

  @Input() matterId: number;

  invoiceStatusList: Array<any>;
  invoicePrefList: Array<any>;
  clientList: Array<vwIdCodeName>;
  sentByList: Array<vwIdCodeName>;

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public invoiceDetls: vwInvoice;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild('invoicePDF', { static: false }) invoicePDF: ElementRef<
    HTMLDivElement
  >;

  currentActive: number;

  description: string;
  dateGenerated: Date;
  dateSent: Date;
  dueDate: Date;
  invoicePref: number;
  clientId: number;
  sentById: number;

  rate_min = 100;
  rate_max = 1000;

  rateMin: number = 100;
  rateMax: number = 1000;
  rateOptions: Options = {
    floor: 100,
    ceil: 1000,
    translate: opt => {
      return '$' + opt.toLocaleString('en-US');
    }
  };

  paidInvoiceStatus: vwIdCodeName;
  notIssuedStatus: vwIdCodeName;

  paperInvoice: vwIdCodeName;
  electronicInvoice: vwIdCodeName;
  paperAndElectronicInvoice: vwIdCodeName;

  modalOptions: NgbModalOptions;
  closeResult: string;
  hasBillingPermission = false;
  permissionSubscribe: Subscription;
  public loading = true;
  public permissionList: any = {};
  startServiceDate = null;
  endServiceDate = null;
  startBilledDate = null;
  endBilledDate = null;
  titleInvoicePreference = null;
  selectedStatus: Array<number> = [];
  public titleInvoiceStatus = 'Select invoice status';
  private modalRef: NgbModalRef;

  allSelected: boolean;

  constructor(
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private matterService: MatterService,
    private router: Router,
    private invoiceService: InvoiceService,
    private modalService: NgbModal,
    private store: Store<fromRoot.AppState>,
    private dialogService: DialogService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;

    this.selectedInvoiceList = [];
  }

  ngOnInit() {
    if (this.matterId) {
      this.getListItems();
      this.getInvoiceList();

      this.permissionSubscribe = this.store
        .select('permissions')
        .subscribe(obj => {
          if (obj.loaded) {
            if (obj && obj.datas) {
              this.permissionList = obj.datas;
              if (
                this.permissionList.BILLING_MANAGEMENTisEdit ||
                this.permissionList.BILLING_MANAGEMENTisAdmin
              ) {
                this.hasBillingPermission = true;
              }
            }
          }
        });
    } else {
      this.loading = false;
    }
  }

  getListItems() {
    this.billingService
      .v1BillingInvoicestatusGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res && res.length) {
          this.invoiceStatusList = res.filter(x =>
            UtilsHelper.invoiceStatusCodes().includes(x.code)
          );
        } else {
          this.invoiceStatusList = [];
        }
      });

    this.billingService
      .v1BillingInvoicedeliveryListGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.invoicePrefList = res;

          this.paperInvoice = this.invoicePrefList.find(a => a.code == 'PAPER');

          this.electronicInvoice = this.invoicePrefList.find(
            a => a.code == 'ELECTRONIC'
          );

          this.paperAndElectronicInvoice = this.invoicePrefList.find(
            a => a.code == 'PAPER_AND_ELECTRONIC'
          );
        } else {
          this.invoicePrefList = [];
        }
      });
  }

  getInvoiceList(populateListItems = true) {
    this.matterService
      .v1MatterInvoicesMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          this.removeSelection();
          if (res) {
            this.invoiceList = res;
            this.originalInvoiceList = [...res];

            this.calcTotalPages();
            UtilsHelper.aftertableInit();
            this.assignRangeSliderProperties();
            if (populateListItems) {
              this.populateList();
            }
            this.loading = false;
          } else {
            this.showError();
            this.loading = false;
          }
        },
        err => {
          console.log(err);
          this.loading = false;
        },
        () => {}
      );
  }

  private populateList() {
    if (this.invoiceList) {
      this.clientList = this.invoiceList
        .filter(a => a.client)
        .map(a => {
          return a.client;
        });

      this.sentByList = this.invoiceList
        .filter(a => a.sentByPersonId)
        .map(a => {
          return a.sentByPersonId;
        });
    }
  }

  private showError() {
    this.toastr.showError(this.errorData.error_occured);
  }

  private assignRangeSliderProperties() {
    if (this.invoiceList && this.invoiceList.length > 0) {
      this.rate_min = _.minBy(
        this.invoiceList,
        a => a.totalInvoiced
      ).totalInvoiced;

      this.rate_max = _.maxBy(
        this.invoiceList,
        a => a.totalInvoiced
      ).totalInvoiced;

      this.rateMin = Math.floor(this.rate_min);
      this.rateMax = Math.ceil(this.rate_max);

      this.rateOptions.floor = this.rateMin;
      this.rateOptions.ceil = this.rateMax;

      this.rateOptions = { ...this.rateOptions };
    }
  }

  /**
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
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
    this.page.totalElements = this.invoiceList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
    this.checkParentCheckbox();
  }

  /*** open menu on action click */
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

  /*** closed menu on body click */
  onClickedOutside(event: any, index: number) {
    if (index === this.currentActive) {
      this.currentActive = null;
    }
  }

  /**
   * select rows
   *
   * @param {*} { selected }
   */
  public onSelect({ selected }) {
    this.selectedInvoiceList.splice(0, this.selectedInvoiceList.length);
    this.selectedInvoiceList.push(...selected);
  }

  public onSelectSingle(row) {
    this.selectedInvoice = row;
  }

  applyFilter() {
    let rows = [...this.originalInvoiceList];

    if (this.description && this.description.trim() != '') {
      const text = this.description.trim().toLowerCase();

      rows = rows.filter(
        a =>
          a.id.toString().includes(text) ||
          this.matchName(a.client, 'name', text) ||
          this.matchName(a.sentByPersonId, 'name', text)
      );
    }

    if (this.clientId) {
      rows = rows.filter(a => this.compareId(a.client, this.clientId));
    }

    if (this.sentById) {
      rows = rows.filter(a => this.compareId(a.sentByPersonId, this.sentById));
    }

    if (this.selectedStatus && this.selectedStatus.length) {
      rows = rows.filter(
        (a: any) =>
          a.invoiceStatusId &&
          this.selectedStatus.includes(a.invoiceStatusId.id)
      );
    }

    if (this.invoicePref) {
      rows = rows.filter(a =>
        this.compareId(a.invoicePreference, this.invoicePref)
      );
    }

    if (this.dateGenerated) {
      rows = rows.filter(
        a =>
          a.generated &&
          +new Date(a.generated).setHours(0, 0, 0, 0) ==
            +new Date(this.dateGenerated).setHours(0, 0, 0, 0)
      );
    }

    if (this.dateSent) {
      rows = rows.filter(
        a =>
          a.sent &&
          +new Date(a.sent).setHours(0, 0, 0, 0) ==
            +new Date(this.dateSent).setHours(0, 0, 0, 0)
      );
    }

    if (this.dueDate) {
      rows = rows.filter(
        a =>
          a.due &&
          +new Date(a.due).setHours(0, 0, 0, 0) ==
            +new Date(this.dueDate).setHours(0, 0, 0, 0)
      );
    }

    if (this.rateMin) {
      rows = rows.filter(a => a.totalInvoiced >= Math.floor(this.rateMin));
    }

    if (this.rateMax) {
      rows = rows.filter(a => a.totalInvoiced <= Math.ceil(this.rateMax));
    }

    if (this.startServiceDate !== null) {
      rows = rows.filter(a =>
        !a.generated
          ? false
          : moment(a.generated).isSameOrAfter(this.startServiceDate, 'd')
      );
    }

    if (this.endServiceDate !== null) {
      rows = rows.filter(a =>
        !a.generated
          ? false
          : moment(a.generated).isSameOrBefore(this.endServiceDate, 'd')
      );
    }

    if (this.startBilledDate !== null) {
      rows = rows.filter(a =>
        !a.billedDate
          ? false
          : moment(a.billedDate).isSameOrAfter(this.startBilledDate, 'd')
      );
    }

    if (this.endBilledDate !== null) {
      rows = rows.filter(a =>
        !a.billedDate
          ? false
          : moment(a.billedDate).isSameOrBefore(this.endBilledDate, 'd')
      );
    }

    if (this.description) {
      rows = rows.filter(
        a =>
          this.matchName(a, 'id', this.description) ||
          this.matchName(a.client, 'name', this.description) ||
          this.matchName(a.matter, 'name', this.description) ||
          this.matchName(a.sentByPersonId, 'name', this.description)
      );
    }

    this.invoiceList = rows;
    this.table.offset = 0;
  }

  private matchName(item: any, fieldName, searchValue: string): boolean {
    const searchName =
      item && item[fieldName] ? item[fieldName].toString().toLowerCase() : '';
    return searchName.search(searchValue) > -1;
  }

  private compareId(item: any, id: number): boolean {
    const searchName = item ? item.id : null;
    return searchName == id;
  }

  downloadInvoices() {
    if (this.selectedTableRow && this.selectedTableRow.length === 1) {
      this.router.navigate([`/billing/invoices/pdf`], {
        queryParams: {
          invoiceId: this.selectedTableRow[0].id,
          print: 1
        }
      });
    }
  }

  printToPDF(row: vwInvoice) {
    this.router.navigate([`/billing/invoices/pdf`], {
      queryParams: {
        invoiceId: row.id,
        print: 1,
        matterId: this.matterId
      }
    });
  }

  private changeStatusToSendForPayment(row: vwInvoice) {
  }

  emailInvoice(row: vwInvoice) {
    this.invoiceService.sendEmail$.next({
      invoiceId: row.id,
      markAsMailed: 0
    });
  }

  emailInvoiceAndMarkAsMailed(row: vwInvoice) {
    this.invoiceService.sendEmail$.next({
      invoiceId: row.id,
      markAsMailed: 1
    });
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

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  reverseInvoice(row) {
    this.modalService
      .open(DisplayReverseChargeComponent, {
        centered: true,
        windowClass: 'modal-xlg',
        backdrop: 'static'
      })
      .result.then(res => {
        if (res) {
          const body = {
            invoiceId: row.id,
            matterId: row.matter ? row.matter.id : 0,
            clientId: 0,
            nextInvoicePreference: res.nextInvoicePreference,
            billNarrative: res.billNarrative,
            visibleToClient: res.visibleToClient,
            noteToFile: res.noteToFile,
            dateOfReveresal: moment().format('YYYY-MM-DD')
          };
          this.loading = true;
          this.billingService
            .v1BillingReversebillpreferencePut$Json({ body })
            .subscribe(
              () => {
                this.loading = false;
                if (UtilsHelper.getTenantTierDetails()) {
                  if (row.id && row.matter.id) {
                    this.router.navigate([`billing/invoice/edit-charges`], {
                      queryParams: {
                        invoiceId: row.id,
                        matterId: row.matter.id,
                        pageType: 'matter'
                      }
                    });
                  }
                } else {
                  this.toastr.showSuccess(
                    this.errorData.reverse_invoice_success
                  );
                  this.getInvoiceList();
                }
              },
              err => {
                this.loading = false;
              }
            );
        }
      });
  }
  public clearFilter(key: string) {
    switch (key) {
      case 'Invoice':
        {
          this.selectedInvoice = [];
          this.invoicePrefList.forEach(item => (item.checked = false));
          this.titleInvoicePreference = 'Select invoice preferences';
          this.applyFilter();
        }
        break;

      case 'status':
        {
          this.selectedStatus = [];

          this.invoiceStatusList.forEach(item => (item.checked = false));
          this.titleInvoiceStatus = 'Select invoice status';
          this.applyFilter();
        }
        break;
    }
  }

  public selectStatus(event: any) {
    this.titleInvoiceStatus = '';
    if (event.length > 0) {
      this.titleInvoiceStatus = event.length;
    } else {
      this.titleInvoiceStatus = 'All';
    }
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.invoiceList) {
      return this.invoiceList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
  onSelectRow({ selected }) {
    this.selectedTableRow.splice(0, this.selectedTableRow.length);
    this.selectedTableRow.push(...selected);
  }

  /**** function to select/deselect only displayed page record */
  selectDeselectRecords() {
    this.allSelected = !this.allSelected
    this.table.bodyComponent.temp.forEach(row => {
      const index = this.invoiceList.findIndex(list => list.id === row.id);
      if (index > -1) {
        this.invoiceList[index]['selected'] = this.allSelected;
      }
      const existingIndex = this.selectedTableRow.findIndex(list => list.id === row.id);
      if (existingIndex > -1 && !row.selected) {
        this.selectedTableRow.splice(existingIndex, 1)
      } else if (row.selected && existingIndex === -1) {
        this.selectedTableRow.push(row);
      }
    })
    this.setSelected();
  }

  /******* function to select/deselect child checkbox  */
  changeChildSelection(row) {
    row.selected = !row.selected
    const existingIndex = this.selectedTableRow.findIndex(list => list.id === row.id);
    if (existingIndex > -1 && !row.selected) {
      this.selectedTableRow.splice(existingIndex, 1)
    } else if (row.selected && existingIndex === -1) {
      this.selectedTableRow.push(row);
    }
    this.setSelected();
  }

  setSelected() {
    this.invoiceList.forEach(list => {
      const selectedIds = this.selectedTableRow.filter(selected => selected.id === list.id);
      if (selectedIds.length > 0) {
        list['selected'] = true;
      }
    });

    this.checkParentCheckbox();
  }

  checkParentCheckbox() {
    setTimeout(() => {
      const currentArr = []
      this.table.bodyComponent.temp.forEach(row => {
        const existing = this.invoiceList.filter(list => list.id === row.id)[0];
        if (existing) {
          currentArr.push(existing)
        }
      });
      this.allSelected = currentArr.length && currentArr.every(row => row.selected);
    }, 100)
  }

  /*** function to remove selection */
  removeSelection() {
    if (this.invoiceList && this.invoiceList.length) {
      this.invoiceList.forEach(list => {
        list['selected'] = false;
      });
    }
    this.selectedTableRow = [];
    this.checkParentCheckbox();
  }
}
