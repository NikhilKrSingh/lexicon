import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { AuthGuard } from 'src/app/guards/auth-guard.service';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-trust-ledger-history',
  templateUrl: './trust-ledger-history.component.html',
  styleUrls: ['./trust-ledger-history.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TrustLedgerHistoryComponent implements OnInit {

  selectedMatter = [];
  selectedMatterList = [];
  searchSelectedMatterList = [];
  selectedMatterListClone = [];
  matterList = [];
  matterIdsList = [];
  searchMatterList = [];
  matterListClone = [];
  public filterName = 'Select Matters';
  public selectedMessage = 'matters selected';
  public title = 0;
  public allTotal = 0;
  public currentTotal = 0;
  public searchTotal = 0;
  public getSearchRecord = [];
  public searchTotalPrevious = 0;
  public placeholder = "Search by matter name";
  exportCsvFlag = false;
  message: string;
  startDates: any;
  endDates: any;
  public rows: Array<any> = [];
  public columnList: any = [];
  noDataToDisplay = false;
  public isBillingOrResponsibleAttorney: boolean = false;
  public searchText: string = "";
  public searchTextMinCount = 3;
  private searchSubscribe: Subscription;
  public isAll = true;
  public pageNo = 0;
  public totalPages = 0;
  public pageSize = 100;
  public pageSizeSearch = 500;
  public latestSearchIdList = [];
  public isPagination = true;
  public loading = false;
  public isPerformSearch = false;
  public isSelectAllWithoutSearchManually = true;
  public isSelectAllWithSearchManually = true;
  public unSelectedIds = [];
  public loadingReport: boolean = false;

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private auth: AuthGuard,
    private pagetitle: Title
  ) { }

  ngOnInit() {
    this.pagetitle.setTitle("Trust Ledger History Report");
    this.checkPowerUser();
  }

  async checkPowerUser() {
    const permissions: any = await this.auth.getPermissions();
    if (permissions.ACCOUNTINGisAdmin || permissions.ACCOUNTINGisEdit
      || permissions.BILLING_MANAGEMENTisAdmin
      || permissions.BILLING_MANAGEMENTisEdit) {
      this.isBillingOrResponsibleAttorney = false;
      this.getMatters();
    }
    else {
      this.isBillingOrResponsibleAttorney = true;
      this.getMatters();
    }
  }

  getMatters() {
    this.loading = true;
    this.reportService
      .v1ReportGetAllMattersTrustTransactionWithPaginationGet$Response({
        isRAorBa: this.isBillingOrResponsibleAttorney, searchText: "",
        pageNo: this.pageNo,
        pageSize: this.pageSize,
        isPagination: this.isPagination
      }).subscribe((data: {}) => {
        this.loading = false;
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results && parsedRes.results.records) {
            if (parsedRes.results.records.length) {
              let filteredArray = [];
              let selectedMatterList = [];
              let instance = this;
              parsedRes.results.records.filter(function (item) {
                if (item.matterId) {
                  let newRecord = {};
                  let checked = instance.isSelectAllWithoutSearchManually;
                  let present = false;
                  if (instance.matterIdsList.includes(item.matterId)) {
                    checked = false;
                  } else {
                    instance.matterIdsList.push(item.matterId);
                  }
                  if (instance.selectedMatterList.includes(item.matterId)) {
                    checked = true;
                    present = true;
                  }

                  newRecord['id'] = item.matterId;
                  if (item.matterName === null) {
                    newRecord['name'] = ' (' + (item.matterNumber || item.matterId) + ')';
                  } else {
                    newRecord['name'] = item.matterName + ' (' + (item.matterNumber || item.matterId) + ')';
                  }
                  newRecord['checked'] = checked;
                  filteredArray.push(newRecord);
                  if (checked) {
                    if (!present) {
                      selectedMatterList.push(item.matterId);
                    }
                  }
                }
              });
              this.selectedMatterList = [...this.selectedMatterList, ...selectedMatterList];
              this.selectedMatterListClone = JSON.parse(JSON.stringify(this.selectedMatterList));

              this.matterList = [...this.matterList, ...filteredArray];
              this.matterList.sort(this.sort);
              if (this.pageNo == 0) {
                if (parsedRes.results.totalCount) {
                  this.totalPages = parsedRes.results.totalCount / this.pageSize;
                } else {
                  this.totalPages = 0;
                }
                this.allTotal = parsedRes.results.totalCount;
                this.title = parsedRes.results.totalCount;
              }
            }
            this.matterList = JSON.parse(JSON.stringify(this.matterList));
            this.matterListClone = JSON.parse(JSON.stringify(this.matterList));
          }
        }
      }, error => {
        this.loading = false;
      });
  }

  getMattersOnSearch(searchText) {
    this.loading = true;
    if (this.searchSubscribe) {
      this.searchSubscribe.unsubscribe();
    }
    this.latestSearchIdList = [];
    this.searchSubscribe = this.reportService
      .v1ReportGetAllMattersTrustTransactionWithPaginationGet$Response({
        isRAorBa: this.isBillingOrResponsibleAttorney, searchText: searchText,
        pageNo: 0,
        pageSize: this.pageSizeSearch,
        isPagination: this.isPagination
      }).subscribe((data: {}) => {
        this.searchMatterList = [];
        this.loading = false;
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results && parsedRes.results.records) {
            if (parsedRes.results.records.length) {
              let filteredArray = [];
              let selectedMatterList = [];
              let instance = this;
              parsedRes.results.records.filter(function (item) {
                if (item.matterId) {
                  let newRecord = {};
                  let checked = instance.isSelectAllWithoutSearchManually;
                  let present = false;
                  if (checked && instance.matterIdsList.includes(item.matterId)) {
                    checked = false;
                  }
                  if (instance.selectedMatterList.includes(item.matterId)) {
                    checked = true;
                    present = true;
                  }

                  newRecord['id'] = item.matterId;
                  if (item.matterName === null) {
                    newRecord['name'] = ' (' + (item.matterNumber || item.matterId) + ')';
                  } else {
                    newRecord['name'] = item.matterName + ' (' + (item.matterNumber || item.matterId) + ')';
                  }
                  newRecord['checked'] = checked;
                  filteredArray.push(newRecord);
                  if (checked) {
                    if (!present) {
                      selectedMatterList.push(item.matterId);
                      instance.selectedMatterList.push(item.matterId);
                    }
                  }
                  instance.latestSearchIdList.push(item.matterId);
                  if (!instance.matterIdsList.includes(item.matterId)) {
                    instance.matterIdsList.push(item.matterId);
                    instance.matterList.push(JSON.parse(JSON.stringify(newRecord)));
                  }
                }
              });
              this.matterList.sort(this.sort);
              this.searchSelectedMatterList = selectedMatterList;
              this.selectedMatterListClone = JSON.parse(JSON.stringify(this.searchSelectedMatterList));
              this.searchMatterList = filteredArray;
              this.matterList = JSON.parse(JSON.stringify(this.matterList));
              this.matterListClone = JSON.parse(JSON.stringify(this.searchMatterList));
            }
          }
        }
      }, error => {
        this.loading = false;
      });
  }

  unselectedMatterFilterData() {
    let notSelectedMatterData = [];
    this.matterList.filter(function (item) {
      if (!item.checked) {
        notSelectedMatterData.push(item.id);
      }
    });
    return notSelectedMatterData;
  }

  sort(a, b) {
    if (a.name && b.name) {
      if (a.name.toLowerCase() < b.name.toLowerCase()) {
        return -1;
      }
      if (a.name.toLowerCase() > b.name.toLowerCase()) {
        return 1;
      }
      return 0;
    } else {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    }

  }

  processSelectUnselect(data) {
    if (data['isPerformSearch']) {
      this.getSelectedMatterSearch(data);
    } else {
      this.getSelectedMatter(data);
    }
  }

  getSelectedMatter(data) {
    let selectedMatterList = data['selections'];
    let checked = data['checked'];
    let allChecked = data['allChecked'];
    let itemId = data['itemId'];
    selectedMatterList = [...new Set(selectedMatterList)];

    if (!this.isPerformSearch) {
      if (selectedMatterList.length == 0 && allChecked == false) {
        this.title = selectedMatterList.length;
        this.selectedMatterList = JSON.parse(JSON.stringify(selectedMatterList));
        this.isSelectAllWithoutSearchManually = false;
        this.getUnselectedList();
      } else {
        if (checked == false) {
          this.title = this.title - 1;
          this.unSelectedIds.push(itemId);
        } else if (checked == true) {
          let index = this.unSelectedIds.indexOf(itemId);
          if (index > -1) {
            this.unSelectedIds.splice(index, 1);
          }
          this.title = this.title + 1;
        } else if (allChecked == true) {
          this.isSelectAllWithoutSearchManually = true;
          this.title = this.allTotal;
        } else if (allChecked == false) {
          this.isSelectAllWithoutSearchManually = false;
          this.title = 0;
        }
        this.selectedMatterList = JSON.parse(JSON.stringify(selectedMatterList));
        if (!this.isSelectAllWithoutSearchManually && this.selectedMatterList.length == this.matterList.length) {
          this.isSelectAllWithoutSearchManually = true;
          this.title = this.allTotal;
        }
      }
      if (this.title < 0) {
        this.title = 0;
      }
    }
  }

  getSelectedMatterSearch(data) {
    let selectedMatterList = data['selections'];
    let checked = data['checked'];
    let allChecked = data['allChecked'];
    let itemId = data['itemId'];
    selectedMatterList = [...new Set(selectedMatterList)];

    if (this.isPerformSearch) {
      if (selectedMatterList.length == 0 && allChecked == false) {
        let a = new Set(JSON.parse(JSON.stringify(this.selectedMatterList)));
        let b = new Set(JSON.parse(JSON.stringify(this.latestSearchIdList)));
        let intersection = new Set(
          [...a].filter(x => b.has(x)));
        let intersectionArray = [...intersection];
        this.latestSearchIdList.forEach(itemId => {
          if (intersectionArray.includes(itemId)) {
            let index = this.selectedMatterList.indexOf(itemId);
            if (index > -1) {
              this.selectedMatterList.splice(index, 1);
            }
          }
        })
        this.title = this.title - intersectionArray.length;
        this.searchSelectedMatterList = JSON.parse(JSON.stringify(selectedMatterList));
      } else {
        if (checked == true) {
          this.title = this.title + 1;
          let index = this.unSelectedIds.indexOf(itemId);
          if (index > -1) {
            this.unSelectedIds.splice(index, 1);
          }
          this.selectedMatterList.push(itemId);
        } else if (checked == false) {
          this.unSelectedIds.push(itemId);
          let index = this.selectedMatterList.indexOf(itemId);
          if (index > -1) {
            this.selectedMatterList.splice(index, 1);
          }
          this.title = this.title - 1;
        } else if (allChecked == true) {
          let a = new Set(JSON.parse(JSON.stringify(this.selectedMatterList)));
          let b = new Set(JSON.parse(JSON.stringify(selectedMatterList)));
          let intersection = new Set(
            [...a].filter(x => b.has(x)));
          let intersectionArray = [...intersection];
          this.latestSearchIdList.forEach(itemId => {
            if (!intersectionArray.includes(itemId)) {
              this.selectedMatterList.push(itemId);
            }
          })
          this.title = this.title - intersectionArray.length + this.searchMatterList.length;
        }

        this.searchSelectedMatterList = JSON.parse(JSON.stringify(selectedMatterList));
      }
      if (this.title < 0) {
        this.title = 0;
      }
    }
  }

  getUnselectedList() {
    let unSelectedIds = [];
    this.matterList.forEach(item => {
      unSelectedIds.push(item.id);
    })
    unSelectedIds = [...new Set(unSelectedIds)];
    this.unSelectedIds = unSelectedIds;
  }

  getUnselectedSearchList() {
    let unSelectedIds = [];
    this.searchMatterList.forEach(item => {
      unSelectedIds.push(item.id);
    })
    unSelectedIds = [...new Set(unSelectedIds)];
    this.unSelectedIds = unSelectedIds;
  }

  public clearFilter() {
    this.isSelectAllWithoutSearchManually = false;
    this.selectedMatterList = [];
    this.matterList.forEach(item => (item.checked = false));
    this.searchMatterList.forEach(item => (item.checked = false));
    this.title = 0;
    if (this.searchText && this.searchText.length >= this.searchTextMinCount) {
      this.selectedMatterListClone = [];
      this.matterListClone = JSON.parse(JSON.stringify(this.searchMatterList));
    } else if (!this.searchText) {
      this.selectedMatterListClone = [];
      this.matterListClone = JSON.parse(JSON.stringify(this.matterList));
    }
  }

  public applyFilter() {

  }

  public scrollEnd() {
    if (this.loading) {
      return;
    }
    if (this.searchText) {
      return;
    } else if (Math.trunc(this.totalPages) <= this.pageNo) {
      return;
    } else {
      this.pageNo = this.pageNo + 1;
      this.getMatters();
    }

  }

  isAllStatus(isAll) {
    this.isAll = isAll;
  }

  public onSearch(searchText) {
    this.searchText = searchText;
    if (this.searchText && this.searchText.length >= this.searchTextMinCount) {
      this.isPerformSearch = true;
      this.selectedMatterListClone = JSON.parse(JSON.stringify(this.searchSelectedMatterList));
      this.matterListClone = JSON.parse(JSON.stringify(this.searchMatterList));
      this.getMattersOnSearch(this.searchText);
    } else if (!this.searchText) {
      this.isPerformSearch = false;
      this.matterList.sort();
      this.selectedMatterListClone = JSON.parse(JSON.stringify(this.selectedMatterList));
      this.matterListUpdateCheck();
      this.matterListClone = JSON.parse(JSON.stringify(this.matterList));
      this.searchMatterList = [];
    }
  }

  matterListUpdateCheck() {
    this.selectedMatterList = [...new Set(this.selectedMatterList)];
    let newMatterList = [];
    let cloneMatterList = JSON.parse(JSON.stringify(this.matterList));
    cloneMatterList.forEach(item => {
      let checked = false;
      if (this.selectedMatterList.includes(item.id)) {
        checked = true;
      } else {
        checked = false;
      }
      item.checked = checked;
      newMatterList.push(item);
    })
    this.matterList = newMatterList;
  }

  startDate(e) {
    this.startDates = e;
    this.exportCsvFlag = e ? true : false;
  }
  endDate(e) {
    this.endDates = e;
    this.exportCsvFlag = this.startDates && e ? true : false;
  }

  submitTrustTransactionDetailReport1() {
    let data: any = {};
    data.transactionStartDate = this.startDates;
    data.transactionEndDate = this.endDates;
    data.matterIds = this.selectedMatterList.length == this.matterList.length ? null : this.selectedMatterList.join();
    data.isAll = this.selectedMatterList.length == this.matterList.length ? true : false;
    this.reportService.v1ReportTrustTransactionReportPost$Json$Response({ body: data })
      .subscribe((suc: {}) => {
        const res: any = suc;
        if (res && res.body && JSON.parse(res.body).results) {
          var records = JSON.parse(res.body);
          this.rows = [...records.results];
          if (this.rows.length > 0) {
            const keys = Object.keys(this.rows[0]);
            this.addkeysIncolumnlist(keys);
          } else {
            var columnListHeader = ['ClientNumber', 'ClientName', 'MatterNumber', 'MatterName','TargetTrustNumber', 'TargetTrust',
              'Source', 'dateOfPost', 'TransactionType', 'RefNumber', 'BeginningBalance', 'FundsIn', 'FundsOut',
              'EndingBalance', 'Description'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.ExportToCSV('TrustTransaction', this.rows, this.columnList);

      });
  }

  submitTrustTransactionDetailReport() {
    let unSelectedMatterIds = this.unselectedMatterFilterData();
    let data: any = {};
    data.transactionStartDate = this.startDates;
    data.transactionEndDate = this.endDates;
    data.isRAorBa = this.isBillingOrResponsibleAttorney;
    data.selectedMatterIds = this.selectedMatterList.length ? this.selectedMatterList.join() : null;
    data.unSelectedMatterIds = unSelectedMatterIds.length ? unSelectedMatterIds.join() : null;
    data.isSelectAllManually = this.isSelectAllWithoutSearchManually;
    this.loadingReport = true;
    this.reportService.v1ReportTrustTransactionReportWithPaginationPost$Json$Response({ body: data })
      .subscribe((suc: {}) => {
        this.loadingReport = false;
        const res: any = suc;
        if (res && res.body && JSON.parse(res.body).results) {
          var records = JSON.parse(res.body);
          this.rows = [...records.results];
          if (this.rows.length > 0) {
            const keys = Object.keys(this.rows[0]);
            this.addkeysIncolumnlist(keys);
          } else {
            var columnListHeader = ['ClientNumber', 'ClientName', 'MatterNumber', 'MatterName', 'TargetTrustNumber','TargetTrust',
              'Source', 'dateOfPost', 'TransactionType', 'RefNumber', 'BeginningBalance', 'FundsIn', 'FundsOut',
              'EndingBalance', 'Description'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.ExportToCSV('TrustLedgerHistory', this.rows, this.columnList);

      },(err)=>{
        this.loadingReport = false;
      });
  }

  addkeysIncolumnlist(keys: any[] | string[]) {
    this.columnList = [];
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] == "dateOfPost") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Date of Post'
        });
      } else {
        this.columnList.push({
          Name: keys[i],
          displayName: keys[i] = _.startCase(keys[i])
        });
      }
    }
  }

  ExportToCSV(fileName, rows, columnList) {
    const temprows = JSON.parse(JSON.stringify(rows));
    const selectedrows = Object.assign([], temprows);

    this.exporttocsvService.downloadReportFile(
      selectedrows,
      columnList,
      fileName
    );
  }

  GetColumnHeaderList() {
    return [];
  }

  currentDate() {
    const currentDate = new Date();
    return currentDate.toISOString().substring(0, 10);
  }
}
