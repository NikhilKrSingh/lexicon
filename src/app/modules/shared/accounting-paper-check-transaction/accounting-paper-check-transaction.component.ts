import { Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import { BillingService, TrustAccountService } from 'src/common/swagger-providers/services';
import { Page } from '../../models/page';
import * as errorData from '../../shared/error.json';
import { UtilsHelper } from '../utils.helper';

@Component({
  selector: 'app-accounting-paper-check-transaction',
  templateUrl: './accounting-paper-check-transaction.component.html',
  styleUrls: ['./accounting-paper-check-transaction.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class AccountingPaperCheckTransactionComponent implements OnInit {

  alltabs1: string[] = ['Automatic Transfers', 'Manual Transfers'];
  selecttabs1 = this.alltabs1[1];
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild(DatatableComponent, { static: false }) table2: DatatableComponent;
  @Input() trustAccountTime: string;
  @Input() firmAccountList: any;
  @Input() statusIdList: any;

  public modalOptions: NgbModalOptions;
  public closeResult: string;
  public automaticTransferQueueList = [];
  public manualTransferQueueList = [];
  public firmAccountLists: any = [{ name: 'All', id: -1 }, { name: 'Firm Operating Account', id: 0, accountNumber: 5454 }];
  public selectedManualAutomaticRow: any = null;
  public selectedAutomaticRow: any = null;
  public updateRecordData: any = [];


  public oriArr = [];
  public oriArr2 = [];

  public page = new Page();
  public pangeSelected: number = 1;
  public pageSelector = new FormControl('10');
  public ColumnMode = ColumnMode;
  public limitArray: Array<number> = [10, 30, 50, 100];
  public errorData: any = (errorData as any).default;
  public messages = { emptyMessage: Constant.SharedConstant.TableNoDataFoundTransferQue };
  public currentActive: number;
  public selectedTablerow: Array<any> = [];
  public SelectionType = SelectionType;
  public bulkActions: Array<{ id: number, name: string, disabled: boolean }>;
  public selectedBulkRows = [];
  public filterStatusArray = [];
  public selectedStatus = 0;
  public selectedFirmAccount = 'All';
  public selectedRowLength = 0;
  public searchValue = "";
  public approveBulkTrnasfer = false;
  public approveBulkRejectTrnasfer = false;
  public processNowTrnasfer = false;
  public setTransferToPendingBulk = false;
  public retryTrnasfer = true;
  public selectedBulkAction: string;
  public openDescriptionList = [];
  public noReasonSelectFlag: boolean = false;
  public loading = false;
  public amount: any = { inBound: 0, outBound: 0, totalAmount: 0 };
  public subAmount: any = { inBound: 0, outBound: 0, totalAmount: 0 };
  public inboundCheck: boolean = true;
  public outoundCheck: boolean = true;
  public selectedtransactionType = 1;
  public transactionTypeList = [{ id: 1, name: "Cash and Paper Checks" }, { id: 2, name: "Paper Checks" }, { id: 3, name: "Cash" }];
  public rejectReason: any = null;
  public reasonCodeList: any[] = []
  public isBulk: boolean = false;
  public singleTransac: boolean = false;
  public counter = Array;
  public selected: Array<any> = [];
  allSelected: boolean;

  constructor(
    private modalService: NgbModal,
    private trustAccountService: TrustAccountService,
    private toaster: ToastDisplay,
    private pagetitle: Title,
    private billingService: BillingService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    this.pagetitle.setTitle("Transfer Queue");
    // this.generateAccountDropdown();
    // this.getStatusIds();
    this.loadManualTransferQueueList();
    this.initBulkAction();
    this.getReasonCodeList();
  }
  ngOnChanges() {
    if (this.firmAccountList) {
      this.firmAccountLists.push(...this.firmAccountList);
    }
    this.firmAccountLists = [...this.firmAccountLists];

  }
  initBulkAction() {
    this.bulkActions = [
      { id: 1, name: 'Approve Transaction', disabled: this.approveBulkTrnasfer },
      { id: 2, name: 'Reject Transaction', disabled: this.approveBulkRejectTrnasfer },
      { id: 4, name: 'Process Now', disabled: this.processNowTrnasfer },
      { id: 3, name: 'Set Transaction to Pending Approval', disabled: this.setTransferToPendingBulk },
      { id: 5, name: 'Retry Transaction', disabled: this.retryTrnasfer },
    ];

  }

  // getStatusIds() {
  //   this.trustAccountService
  //     .v1TrustAccountGetTrustTransferQueueStatuesGet$Response({}).subscribe((data: {}) => {
  //       const res: any = data;
  //       if (res && res.body) {
  //         var parsedRes = JSON.parse(res.body);
  //         if (parsedRes != null && parsedRes.results) {
  //           let list = parsedRes.results;

  //           let modifyList = [{ id: 0, name: "All" }];

  //           list.forEach(record => {
  //             let newRecord = record;
  //             if (record['name'] == 'Pending') {
  //               newRecord['name'] = 'Pending Approval';
  //             }
  //             modifyList.push(newRecord);
  //           });
  //           this.statusIdList = modifyList;
  //         }
  //       }
  //     });
  // }

  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  loadManualTransferQueueList() {
    this.loading = true;
    this.manualTransferQueueList = this.oriArr2 = [];
    this.selectedRowLength = 0;
    if (this.table2) {
      this.table2.selected = [];
    }

    this.trustAccountService
      .v1TrustAccountGetPaperCheckQueueGet({}).pipe(map(UtilsHelper.mapData)).subscribe(res => {
        if (res) {
          this.removeSelection();
          this.oriArr2 = [...res];
          this.oriArr2.forEach(obj => {
            if (obj.targetAccountInfo.title && obj.targetAccountInfo.title.toLowerCase().includes('check')) {
              obj.amount = -Math.abs(+obj.amount);
            }

            if (obj.requestedDate) {
              obj.requestedDate = UtilsHelper.dateUtcToLocaLe(obj.requestedDate);
            }
          });
          this.resetFilter();
          this.manualTransferQueueList = [...this.oriArr2];
          this.loading = false;
          this.updateDatatableFooterPage2();
          UtilsHelper.aftertableInit();
        }

        this.resetFilter();
        this.manualTransferQueueList = [...this.oriArr2];
        for (const data of this.manualTransferQueueList) {
          data.showMore = false;
        }
        this.loading = false;
        UtilsHelper.aftertableInit();
      }, error => {
        this.loading = false;
      });
  }

  showMoreDescription(data) {
    data.showMore = true;
  }

  showDescription(rowIndex) {
    this.openDescriptionList.push(rowIndex);
  }



  updateDatatableFooterPage2() {
    this.page.totalElements = this.manualTransferQueueList.length;
    this.page.totalPages = Math.ceil(this.manualTransferQueueList.length / this.page.size);
    this.table2.offset = 0;
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.checkParentCheckbox();
    UtilsHelper.aftertableInit();
  }
  changePageSize2() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage2();
  }

  changePage2() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage2();
    }
    this.checkParentCheckbox();
    UtilsHelper.aftertableInit();
  }

  pageChange2(e) {
    this.pangeSelected = e.page;
    this.changePage2();
  }
  openMenu(index: number, event): void {
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

  onSelectRow(event) {
    this.selectedManualAutomaticRow = null;
    this.selectedAutomaticRow = null;
    this.selectedBulkRows = event.selected;
    this.approveBulkTrnasfer = this.approveBulkRejectTrnasfer = this.setTransferToPendingBulk = this.processNowTrnasfer = false;
    this.selectedRowLength = event.selected.length;
    let approvedOrPending = [];
    let approvedOrReject = [];
    let pendingOrReject = [];
    event.selected.filter(item => {
      if (((item.trustAccountStatus.name == 'Approved') || (item.trustAccountStatus.name == 'Pending')) && (item.amount >= 0)) {
        approvedOrPending.push(true);
      }
      if (item.trustAccountStatus.name == 'Rejected' || item.trustAccountStatus.name == 'Pending') {
        pendingOrReject.push(true);
      }
      if (item.trustAccountStatus.name == 'Approved' || item.trustAccountStatus.name == 'Rejected') {
        approvedOrReject.push(true);
      }
    });

    if (event.selected.length != approvedOrPending.length) {
      this.approveBulkRejectTrnasfer = true;
    }
    if (event.selected.length != approvedOrReject.length) {
      this.setTransferToPendingBulk = true;
      this.processNowTrnasfer = true;
    }
    if (event.selected.length != pendingOrReject.length) {
      this.approveBulkTrnasfer = true;
    }
    this.initBulkAction();
  }
  selectBulkAction(TrustTransferAlertBulk, RejectTrustTrnasfer, SetPendingApproval, TrustTransferAlert) {
    this.singleTransac = false;
    if (this.selectedBulkAction == 'Approve Transaction') {
      this.openPersonalinfo(TrustTransferAlertBulk, '', '');
    }
    if (this.selectedBulkAction == 'Reject Transaction') {
      this.isBulk = true;
      this.openPersonalinfo(RejectTrustTrnasfer, '', 'modal-xlms');
    }
    if (this.selectedBulkAction == 'Set Transaction to Pending Approval') {
      this.openPersonalinfo(SetPendingApproval, '', '');
    }
    if (this.selectedBulkAction == 'Process Now') {
      this.openPersonalinfo(TrustTransferAlert, '', '');
    }

  }

  applyFilter(event?) {
    let rows = [...this.oriArr2];
    if (this.searchValue.trim() !== '') {
      rows = rows.filter(f => {
        return (f.amount.toString() || '').toLowerCase().includes(this.searchValue.toLowerCase()) ||
          (f.description || '').toLowerCase().includes(this.searchValue.toLowerCase()) ||
          (f.requestedBy || '').toLowerCase().includes(this.searchValue.toLowerCase()) ||
          (f.sourceAccountInfo.title || '').toLowerCase().includes(this.searchValue.toLowerCase()) ||
          (f.targetAccountInfo.title || '').toLowerCase().includes(this.searchValue.toLowerCase());
      });
    }

    if (this.selectedStatus) {
      rows = rows.filter(f => {
        return f.trustAccountStatus.id === this.selectedStatus;
      });
    }

    if (this.selectedFirmAccount !== 'All') {
      rows = rows.filter(f => {
        return (f.sourceAccountInfo.title || '').toLowerCase().includes(this.selectedFirmAccount.toLowerCase()) ||
          (f.targetAccountInfo.title || '').toLowerCase().includes(this.selectedFirmAccount.toLowerCase());
      });
    }

    switch (this.selectedtransactionType) {
      case 1:
        rows = rows;
        break;
      case 2:
        rows = rows.filter(item => item.transactionType == 'Check');
        break;
      case 3:
        rows = rows.filter(item => item.transactionType == 'Cash');
        break;
    }

    if (event) {
      if (event.target.value === 'inbound') {
        this.inboundCheck = event.target.checked;
      } else {
        this.outoundCheck = event.target.checked;
      }
    }

    this.manualTransferQueueList = [];
    this.manualTransferQueueList = [...rows];
    this.clearAmount();
    this.calcTotalRollUp();
    this.calcSubTotalRollUp();
    this.updateDatatableFooterPage2();
  }

  openPersonalinfo(content: any, className, winClass, singleTransc: boolean = false) {
    this.singleTransac = singleTransc;
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
          this.singleTransac = false;
        },
        reason => {
          this.selectedBulkAction = null;
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

  selectedManualAutomatic(row, template?) {
    this.selectedManualAutomaticRow = row;
    this.selectedAutomaticRow = null;
  }

  processNowBulk() {
    this.updateRecordData = [];
    this.selectedBulkRows.forEach(record => {
      let updateObject = {
        "trustTransferQueueId": record['id'],
        "matterId": 0,
        "currentStatus": record['trustAccountStatus']['id'],
      }
      this.updateRecordData.push(updateObject);
    });
    this.processNowManual();
  }

  processNow() {
    this.updateRecordData = [];
    let updateObject = {
      "trustTransferQueueId": this.selectedManualAutomaticRow['id'],
      "matterId": 0,
      "currentStatus": this.selectedManualAutomaticRow['trustAccountStatus']['id'],
    }
    this.updateRecordData.push(updateObject);
    this.processNowManual();
  }

  processNowManual() {
    this.loading = true;
    this.trustAccountService
      .v1TrustAccountProcessTrustTransferQueuePut$Json$Response({ body: this.updateRecordData }).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            this.loadManualTransferQueueList();
            this.selectedBulkAction = null;
            this.loading = false;
          }
        }
      },
        () => {
          this.loading = false;
        });

  }

  updateManualStatus(status) {
    this.trustAccountService
      .v1TrustAccountUpdateTrustTransferStatusPut$Json({ body: this.updateRecordData })
      .map(UtilsHelper.mapData)
      .subscribe(resp => {
        if (resp) {
          const length = this.selectedRowLength
          this.loadManualTransferQueueList();
          this.selectedBulkAction = null;
          let message = 'Transaction';
          switch (status) {
            case 'Approved':
              if (!this.singleTransac && (length > 1)) {
                message = 'Transactions';
              }
              this.toaster.showSuccess(`${message} approved.`);
              break;
            case 'Rejected':
              if (!this.singleTransac && (length > 1)) {
                message = 'Transactions';
              }
              this.toaster.showSuccess(`${message} rejected.`);
              this.rejectReason = null;
              break;
            case 'Pending Approval':
              if (!this.singleTransac && (length > 1)) {
                message = 'Transactions';
              }
              this.toaster.showSuccess(`${message} successfully Pending Approval.`);
              break;
          }
          this.singleTransac = false;
          this.noReasonSelectFlag = false;
          this.isBulk = false;
          this.modalService.dismissAll();
        }
      },
        err => {
          this.loading = false;
          this.toaster.showError(err);
        });
  }

  approvedTransfer() {
    let newStatus = 0;
    this.statusIdList.forEach(record => {
      if (record['name'] == 'Approved') {
        newStatus = record['id']
      }
    });

    let updateObject = {
      "trustTransferQueueId": this.selectedManualAutomaticRow['id'],
      "matterId": 0,
      "currentStatus": this.selectedManualAutomaticRow['trustAccountStatus']['id'],
      "newStatus": newStatus,
      "isManualTrustTransfer": this.selecttabs1 == this.alltabs1[1] ? true : false,
    }

    this.updateRecordData = [];
    this.updateRecordData.push(updateObject);
    this.updateManualStatus('Approved');
  }

  rejectTransfer() {
    if (!this.rejectReason) {
      this.noReasonSelectFlag = true;
    } else {
      let newStatus = 0;
      this.statusIdList.forEach(record => {
        if (record['name'] == 'Rejected') {
          newStatus = record['id']
        }
      });

      let updateObject = {
        "trustTransferQueueId": this.selectedManualAutomaticRow['id'],
        "matterId": 0,
        "currentStatus": this.selectedManualAutomaticRow['trustAccountStatus']['id'],
        "newStatus": newStatus,
        "isManualTrustTransfer": this.selecttabs1 == this.alltabs1[1] ? true : false,
        "ReasonForRejection": (this.rejectReason.code || '') + ' - ' + (this.rejectReason.description || '')
      }
      this.updateRecordData = [];
      this.updateRecordData.push(updateObject);
      this.updateManualStatus('Rejected');
    }

  }

  pendingApproval() {
    let newStatus = 0;
    this.statusIdList.forEach(record => {
      if (record['name'] == 'Pending Approval') {
        newStatus = record['id']
      }
    });
    let updateObject = {
      "trustTransferQueueId": this.selectedManualAutomaticRow['id'],
      "matterId": 0,
      "currentStatus": this.selectedManualAutomaticRow['trustAccountStatus']['id'],
      "newStatus": newStatus,
      "isManualTrustTransfer": this.selecttabs1 == this.alltabs1[1] ? true : false,
    }

    this.updateRecordData = [];
    this.updateRecordData.push(updateObject);
    this.updateManualStatus('Pending Approval');
  }

  approvedTransferBulk() {
    let newStatus = 0;
    this.statusIdList.forEach(record => {
      if (record['name'] == 'Approved') {
        newStatus = record['id']
      }
    });

    this.updateRecordData = [];
    this.selectedBulkRows.forEach(record => {
      let updateObject = {
        "trustTransferQueueId": record['id'],
        "matterId": 0,
        "currentStatus": record['trustAccountStatus']['id'],
        "newStatus": newStatus,
        "isManualTrustTransfer": this.selecttabs1 == this.alltabs1[1] ? true : false,
      }
      this.updateRecordData.push(updateObject);
    });

    this.updateManualStatus('Approved');
  }

  rejectTransferBulk() {
    if (!this.rejectReason) {
      this.noReasonSelectFlag = true;
    } else {
      let newStatus = 0;
      this.statusIdList.forEach(record => {
        if (record['name'] == 'Rejected') {
          newStatus = record['id']
        }
      });
      this.updateRecordData = [];
      this.selectedBulkRows.forEach(record => {
        let updateObject = {
          "trustTransferQueueId": record['id'],
          "matterId": 0,
          "currentStatus": record['trustAccountStatus']['id'],
          "newStatus": newStatus,
          "isManualTrustTransfer": this.selecttabs1 == this.alltabs1[1] ? true : false,
          "ReasonForRejection": (this.rejectReason.code || '') + ' - ' + (this.rejectReason.description || '')
        }
        this.updateRecordData.push(updateObject);
      });
      this.updateManualStatus('Rejected');
    }

  }

  pendingApprovalBulk() {
    let newStatus = 0;
    this.statusIdList.forEach(record => {
      if (record['name'] == 'Pending Approval') {
        newStatus = record['id']
      }
    });
    this.updateRecordData = [];
    this.selectedBulkRows.forEach(record => {
      let updateObject = {
        "trustTransferQueueId": record['id'],
        "matterId": 0,
        "currentStatus": record['trustAccountStatus']['id'],
        "newStatus": newStatus,
        "isManualTrustTransfer": this.selecttabs1 == this.alltabs1[1] ? true : false,
      }
      this.updateRecordData.push(updateObject);
    });
    this.updateManualStatus('Pending Approval');
  }
  cancelClick() {
    this.rejectReason = null;
    this.noReasonSelectFlag = false;
    this.isBulk = false;
    this.singleTransac = false;
  }
  /****** Generates Account Dropdown list ***********/
  // public async generateAccountDropdown() {
  //   try {
  //     let list: any = await this.trustAccountService
  //       .v1TrustAccountGetFirmAccountListGet()
  //       .toPromise();
  //     list = JSON.parse(list as any).results;
  //     if(list) {
  //       this.firmAccountList.push(...list);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  //   this.firmAccountList = [...this.firmAccountList];
  // }

  /***************** Select firm account, Function triggers ************/
  public calcTotalRollUp() {
    if (this.selectedFirmAccount !== 'All') {
      this.manualTransferQueueList.forEach(item => {
        if (item && item.trustAccountStatus && (+item.trustAccountStatus.id != 120)) {
          if (+item.amount && (+item.amount < 0)) {
            if (this.outoundCheck) {
              this.amount.outBound += (+item.amount);
            }
          } else {
            if (this.inboundCheck) {
              this.amount.inBound += (+item.amount);
            }
          }
        }
      });
    }

    this.amount.totalAmount = this.amount.inBound + this.amount.outBound;
  }

  public calcSubTotalRollUp() {
    if (this.selectedFirmAccount !== 'All') {
      let list: any = [...this.manualTransferQueueList];

      if ((this.page.size * (this.pangeSelected)) <= this.manualTransferQueueList.length) {
        list = list.splice(this.page.size * (this.pangeSelected - 1), this.page.size);
      } else {
        list = list.splice(this.page.size * (this.pangeSelected - 1), this.manualTransferQueueList.length);
      }

      list.forEach(item => {
        if (item && item.trustAccountStatus && (+item.trustAccountStatus.id !== 120)) {
          if (item.amount && (item.amount < 0)) {
            if (this.outoundCheck) {
              this.subAmount.outBound += item.amount;
            }
          } else {
            if (this.inboundCheck) {
              this.subAmount.inBound += item.amount;
            }
          }
        }
      });

      this.subAmount.totalAmount = this.subAmount.inBound + this.subAmount.outBound;
    }
  }

  clearAmount() {
    this.subAmount = {
      inBound: 0,
      outBound: 0,
      totalAmount: 0
    }

    this.amount = {
      inBound: 0,
      outBound: 0,
      totalAmount: 0
    }
  }


  /****** Reset Filters *******/
  private resetFilter() {
    this.selectedStatus = 0;
    this.selectedFirmAccount = 'All';
    this.searchValue = "";
    this.inboundCheck = true;
    this.outoundCheck = true;
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }
  public async getReasonCodeList() {
    //this.loading = true;
    try {
      let resp: any = await this.billingService
        .v1BillingGetcheckreasoncodesforaccountingqueueGet()
        .toPromise();
      resp = JSON.parse(resp as any).results;
      if (resp && resp.length) {
        this.reasonCodeList = [...resp];
      }
      //this.loading = false;
    } catch (error) {
      //  this.loading = false;
    }
  }

  get footerHeight() {
    return this.page.totalPages > 0 ? 200 : 0
  }

  get checkListLength() {
    return this.manualTransferQueueList.length <= 10 ? true : false;
  }

  /**** function to select/deselect only displayed page record */
  selectDeselectRecords() {
    this.allSelected = !this.allSelected
    this.table.bodyComponent.temp.forEach(row => {
      const index = this.manualTransferQueueList.findIndex(list => list.id === row.id);
      if (index > -1) {
        this.manualTransferQueueList[index]['selected'] = this.allSelected;
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
    this.manualTransferQueueList.forEach(list => {
      const selectedIds = this.selected.filter(selected => selected.id === list.id);
      if (selectedIds.length > 0) {
        list['selected'] = true;
      }
    });

    this.selectedManualAutomaticRow = null;
    this.selectedAutomaticRow = null;
    this.selectedBulkRows = this.selected;
    this.approveBulkTrnasfer = this.approveBulkRejectTrnasfer = this.setTransferToPendingBulk = this.processNowTrnasfer = false;
    this.selectedRowLength = this.selected.length;
    let approvedOrPending = [];
    let approvedOrReject = [];
    let pendingOrReject = [];
    this.selected.filter(item => {
      if (((item.trustAccountStatus.name == 'Approved') || (item.trustAccountStatus.name == 'Pending')) && (item.amount >= 0)) {
        approvedOrPending.push(true);
      }
      if (item.trustAccountStatus.name == 'Rejected' || item.trustAccountStatus.name == 'Pending') {
        pendingOrReject.push(true);
      }
      if (item.trustAccountStatus.name == 'Approved' || item.trustAccountStatus.name == 'Rejected') {
        approvedOrReject.push(true);
      }
    });

    if (this.selected.length != approvedOrPending.length) {
      this.approveBulkRejectTrnasfer = true;
    }
    if (this.selected.length != approvedOrReject.length) {
      this.setTransferToPendingBulk = true;
      this.processNowTrnasfer = true;
    }
    if (this.selected.length != pendingOrReject.length) {
      this.approveBulkTrnasfer = true;
    }
    this.initBulkAction();

    this.checkParentCheckbox();
  }

  checkParentCheckbox() {
    setTimeout(() => {
      const currentArr = []
      this.table.bodyComponent.temp.forEach(row => {
        const existing = this.manualTransferQueueList.filter(list => list.id === row.id)[0];
        if (existing) {
          currentArr.push(existing)
        }
      });
      this.allSelected = currentArr.length && currentArr.every(row => row.selected);
    }, 100)
  }

  /*** function to remove selection */
  removeSelection() {
    this.manualTransferQueueList.forEach(list => {
      list['selected'] = false;
    })
    this.selected = [];
    this.checkParentCheckbox();
  }
}

