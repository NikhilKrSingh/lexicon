import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { TrustAccountService } from 'src/common/swagger-providers/services';
import { Page } from '../../models/page';
import * as errorData from '../../shared/error.json';

@Component({
  selector: 'app-transfer-queue',
  templateUrl: './transfer-queue.component.html',
  styleUrls: ['./transfer-queue.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TransferQueueComponent implements OnInit {

  alltabs1: string[] = ['Automatic Transfers', 'Manual Transfers'];
  selecttabs1 = this.alltabs1[1];
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild(DatatableComponent, { static: false }) table2: DatatableComponent;


  public modalOptions: NgbModalOptions;
  public closeResult: string;
  public automaticTransferQueueList = [];
  public manualTransferQueueList = [];
  public statusIdList = [];
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
  public footerHeight = 50;
  public errorData: any = (errorData as any).default;
  public messages = { emptyMessage: Constant.SharedConstant.TableNoDataFoundTransferQue };
  public counter = Array;
  public currentActive: number;
  public selectedTablerow: Array<any> = [];
  public SelectionType = SelectionType;
  public bulkActions: Array<{ id: number, name: string, disabled: boolean }>;
  public selectedRowLength = 0;
  public selectedBulkRows = [];
  public filterStatusArray = [];
  public selectedStatus: any;
  public searchValue = "";
  public approveBulkTrnasfer = false;
  public approveBulkRejectTrnasfer = false;
  public processNowTrnasfer = false;
  public setTransferToPendingBulk = false;
  public retryTrnasfer = true;
  public selectedBulkAction: string;
  public openDescriptionList = [];
  public trustAccountTime: string;
  constructor(
    private modalService: NgbModal,
    private trustAccountService: TrustAccountService,
    private toaster: ToastDisplay,
    private pagetitle: Title
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    this.pagetitle.setTitle("Transfer Queue");
    this.getStatusIds();
    this.loadManualTransferQueueList();
    this.loadAutomaticTransferQueueList();
    this.initBulkAction();
    this.getTrustAccountTime();
  }
  initBulkAction() {
    this.bulkActions = [
      { id: 1, name: 'Approve Transfer', disabled: this.approveBulkTrnasfer },
      { id: 2, name: 'Reject Transaction', disabled: this.approveBulkRejectTrnasfer },
      { id: 4, name: 'Process Now', disabled: this.processNowTrnasfer },
      { id: 3, name: 'Set Transfer to Pending Approval', disabled: this.setTransferToPendingBulk },
      { id: 5, name: 'Retry Transfer', disabled: this.retryTrnasfer },
    ];

  }

  getStatusIds() {
    this.trustAccountService
      .v1TrustAccountGetTrustTransferQueueStatuesGet$Response({}).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            let list = parsedRes.results;

            let modifyList = [];

            list.forEach(record => {
              let newRecord = record;
              if (record['name'] == 'Pending') {
                newRecord['name'] = 'Pending Approval';
              }
              modifyList.push(newRecord);
            });
            this.statusIdList = modifyList;
          }
        }
      });
  }

  getTrustAccountTime() {
    this.trustAccountService
      .v1TrustAccountGetTrustAccountTimeGet$Response({}).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            this.trustAccountTime = parsedRes.results;
          }
        }
      });
  }
  toggleExpandRow(row) {
    this.table.rowDetail.toggleExpandRow(row);
  }

  loadAutomaticTransferQueueList() {
    this.automaticTransferQueueList = this.oriArr = [];
    this.selectedRowLength = 0;
    if (this.table) {
      this.table.selected = [];
    }
    this.trustAccountService
      .v1TrustAccountGetAllTrustTransferQueuesGet$Response({}).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            if (parsedRes.results.length) {
              let dataList = parsedRes.results;
              let modifyDataList = [];
              dataList.forEach(row => {
                if (row['requestedDate']) {
                  if (!row['requestedDate'].includes('Z')) {
                    row['requestedDate'] = row['requestedDate'] + 'Z';
                  }
                }
                row['sourceAccountInfoName'] = row.sourceAccountInfo.accountTypeName;
                row['targetAccountInfoName'] = row.targetAccountInfo.accountTypeName;
                row['status'] = row.trustAccountStatus.name == "Pending" ? "Pending Approval" : row.trustAccountStatus.name;
                modifyDataList.push(row);
              });
              this.automaticTransferQueueList = JSON.parse(JSON.stringify(modifyDataList));
              this.oriArr = JSON.parse(JSON.stringify(modifyDataList));
              this.updateDatatableFooterPage();
              if (this.selectedStatus) {
                this.filterRecord();
              }
            }
          }
        }
      });
  }

  loadManualTransferQueueList() {
    this.manualTransferQueueList = this.oriArr2 = [];
    this.selectedRowLength = 0;
    if (this.table2) {
      this.table2.selected = [];
    }
    this.trustAccountService
      .v1TrustAccountGetAllTrustTransferQueuesGet$Response({}).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            if (parsedRes.results.length) {
              let dataList = parsedRes.results;
              let modifyDataList = [];
              dataList.forEach(row => {
                if (row['requestedDate']) {
                  if (!row['requestedDate'].includes('Z')) {
                    row['requestedDate'] = row['requestedDate'] + 'Z';
                  }
                }
                row['sourceAccountInfoName'] = row.sourceAccountInfo.accountTypeName;
                row['targetAccountInfoName'] = row.targetAccountInfo.accountTypeName;
                row['status'] = row.trustAccountStatus.name == "Pending" ? "Pending Approval" : row.trustAccountStatus.name;
                modifyDataList.push(row);
              });
              this.manualTransferQueueList = JSON.parse(JSON.stringify(modifyDataList));
              this.oriArr2 = JSON.parse(JSON.stringify(modifyDataList));
              this.updateDatatableFooterPage2();
              if (this.selectedStatus) {
                this.filterRecord2();
              }
            }

          }
        }
      });
  }

  showDescription(rowIndex) {
    this.openDescriptionList.push(rowIndex);
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.automaticTransferQueueList.length;
    this.page.totalPages = Math.ceil(this.automaticTransferQueueList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    UtilsHelper.aftertableInit();
  }
  changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    }
    UtilsHelper.aftertableInit();
  }

  pageChange(e) {
    this.pangeSelected = e.page;
    UtilsHelper.aftertableInit();
  }
  updateDatatableFooterPage2() {
    this.page.totalElements = this.manualTransferQueueList.length;
    this.page.totalPages = Math.ceil(this.manualTransferQueueList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    UtilsHelper.aftertableInit();
  }
  changePageSize2() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  changePage2() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    }
    UtilsHelper.aftertableInit();
  }

  pageChange2(e) {
    this.pangeSelected = e.page;
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
    // Pending Approval
    // Rejected
    // Approved
    // Error
    this.selectedManualAutomaticRow = null;
    this.selectedAutomaticRow = null;
    this.selectedBulkRows = event.selected;
    this.approveBulkTrnasfer = this.approveBulkRejectTrnasfer = this.setTransferToPendingBulk = this.processNowTrnasfer = false;
    this.selectedRowLength = event.selected.length;
    let approvedOrPending = [];
    let approvedOrReject = [];
    let pendingOrReject = [];
    event.selected.filter(item => {
      if (item.trustAccountStatus.name == 'Approved' || item.trustAccountStatus.name == 'Pending') {
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
    if (this.selectedBulkAction == 'Approve Transfer') {
      this.openPersonalinfo(TrustTransferAlertBulk, '', '');
    }
    if (this.selectedBulkAction == 'Reject Transaction') {
      this.openPersonalinfo(RejectTrustTrnasfer, '', '');
    }
    if (this.selectedBulkAction == 'Set Transfer to Pending Approval') {
      this.openPersonalinfo(SetPendingApproval, '', '');
    }
    if (this.selectedBulkAction == 'Process Now') {
      this.openPersonalinfo(TrustTransferAlert, '', '');
    }

  }

  filterRecord(event: any = null) {
    const val = event && event.target.value ? event.target.value : '';
    let filterList = this.oriArr;
    if (this.selectedStatus) {
      filterList = filterList.filter((item) => {
        var statusInfo = item['trustAccountStatus'];
        var statusName = statusInfo['name']
        if ((statusName && this.selectedStatus.indexOf(statusName) !== -1)) {
          return item;
        }
      });
    }
    if (val !== '') {
      filterList = filterList.filter(
        item =>
          this.matchName(item, val, 'sourceAccountInfo') || this.matchName(item, val, 'targetAccountInfo') ||
          this.matchName(item, val, 'requestedDate') || this.matchName(item, val, 'requestedBy') ||
          this.matchName(item, val, 'amount') || this.matchName(item, val, 'description') || this.matchName(item, val, 'client')
      );
    }

    this.automaticTransferQueueList = filterList;
    this.updateDatatableFooterPage();
  }

  filterRecord2(event: any = null) {
    const val = event && event.target.value ? event.target.value : '';
    let filterList = this.oriArr2;
    if (this.selectedStatus) {
      filterList = filterList.filter((item) => {
        var statusInfo = item['trustAccountStatus'];
        var statusName = statusInfo['name']
        if ((statusName && this.selectedStatus.indexOf(statusName) !== -1)) {
          return item;
        }
      });
    }
    if (val !== '') {
      filterList = filterList.filter(
        item =>
          this.matchName(item, val, 'sourceAccountInfo') || this.matchName(item, val, 'targetAccountInfo') ||
          this.matchName(item, val, 'requestedDate') || this.matchName(item, val, 'requestedBy') ||
          this.matchName(item, val, 'amount') || this.matchName(item, val, 'description') || this.matchName(item, val, 'client')
      );
    }

    this.manualTransferQueueList = filterList;
    this.updateDatatableFooterPage2();
  }
  private matchName(item: any, searchValue: string, fieldName: string): boolean {
    var searchName = '';
    if (fieldName === 'sourceAccountInfo') {
      var sourceAccountInfo = item['sourceAccountInfo'];
      var accountName = sourceAccountInfo['accountName'] ? sourceAccountInfo['accountName'] : sourceAccountInfo['trustName'];
      var matterName = sourceAccountInfo['matterName'];
      var trustClient = sourceAccountInfo['trustClient'];
      searchName = accountName ? accountName.toString().toUpperCase() : '';
      var searchMatterName = matterName ? matterName.toString().toUpperCase() : '';
      var searchtrustClient = trustClient ? trustClient.toString().toUpperCase() : '';
      return searchName.search(searchValue.toUpperCase()) > -1 || searchMatterName.search(searchValue.toUpperCase()) > -1
        || searchtrustClient.search(searchValue.toUpperCase()) > -1;
    }
    else if (fieldName === 'targetAccountInfo') {
      var targetAccountInfo = item['targetAccountInfo'];
      var accountName = targetAccountInfo['trustName'] ? targetAccountInfo['trustName'] : targetAccountInfo['accountName'];
      var matterName = targetAccountInfo['matterName'];
      var trustClient = targetAccountInfo['trustClient'];
      searchName = accountName ? accountName.toString().toUpperCase() : '';
      var searchMatterName = matterName ? matterName.toString().toUpperCase() : '';
      var searchtrustClient = trustClient ? trustClient.toString().toUpperCase() : '';
      return searchName.search(searchValue.toUpperCase()) > -1 || searchMatterName.search(searchValue.toUpperCase()) > -1
        || searchtrustClient.search(searchValue.toUpperCase()) > -1;
    }
    else if (fieldName === 'client') {
      var targetAccountInfo = item['targetAccountInfo'];
      var client = targetAccountInfo['trustClient']
      searchName = client ? client.toString().toUpperCase() : '';
      return searchName.search(searchValue.toUpperCase()) > -1;
    }
    else {
      searchName = item[fieldName] ? item[fieldName].toString().toUpperCase() : '';
      return searchName.search(searchValue.toUpperCase()) > -1;
    }
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
  changeTab() {
    if (this.selecttabs1 == this.alltabs1[0]) {
      this.loadAutomaticTransferQueueList();
    } else {
      this.loadManualTransferQueueList();
    }

    this.searchValue = "";
    this.selectedStatus = null;
    this.selectedBulkAction = null;
  }

  selectedManualAutomatic(row) {
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
    this.trustAccountService
      .v1TrustAccountProcessTrustTransferQueuePut$Json$Response({ body: this.updateRecordData }).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            this.selecttabs1 == this.alltabs1[1] ? this.loadManualTransferQueueList() : this.loadAutomaticTransferQueueList();
            this.selectedBulkAction = null;
          }
        }
      },
        () => {
        });

  }

  updateManualStatus(status) {
    this.trustAccountService
      .v1TrustAccountUpdateTrustTransferStatusPut$Json$Response({ body: this.updateRecordData }).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            this.selecttabs1 == this.alltabs1[1] ? this.loadManualTransferQueueList() : this.loadAutomaticTransferQueueList();
            this.selectedBulkAction = null;
            if (status == 'Approved') {
              this.toaster.showSuccess('Transfers approved.');
            } else if (status == 'Rejected') {
              this.toaster.showSuccess('Transfers rejected.');
            } else if (status == 'Pending Approval') {
              this.toaster.showSuccess('Transfers set to pending approval.');
            }
          }
        }
      },
        () => {
          this.toaster.showError('Other than 200 status code returned');
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
    }

    this.updateRecordData = [];
    this.updateRecordData.push(updateObject);
    this.updateManualStatus('Rejected');
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
      }
      this.updateRecordData.push(updateObject);
    });

    this.updateManualStatus('Rejected');
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
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
