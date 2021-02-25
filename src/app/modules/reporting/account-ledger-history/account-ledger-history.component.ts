import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { ArLedgerReportModels } from '../../models/ar-ledger.model';

@Component({
  selector: 'app-account-ledger-history',
  templateUrl: './account-ledger-history.component.html',
  styleUrls: ['./account-ledger-history.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AccountLedgerHistoryComponent implements OnInit {
  modalOptions: NgbModalOptions;
  closeResult: string;
  ArLedgerHistoryForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  noDataToDisplay = false;
  exportCsvFlag = false;
  message: string
  startDates: any;
  endDates: any;
  public loading: boolean = false;

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pagetitle: Title
  ) { }

  ngOnInit() {
    this.pagetitle.setTitle("AR/Account Ledger History Report");
    this.initReportForms();
  }
  /**
   *
   * To open create folder popup
   * @param content
   * @param className
   * @param winClass
   */
  openPersonalinfo(content: any, className, winClass) {
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
          this.modalService.dismissAll();
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }
  /**
   *
   * @param reason
   *
   */
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  initReportForms() {
    this.ArLedgerHistoryReport();
  }

  addkeysIncolumnlist(keys: any[] | string[]) {
    this.columnList = [];
    for (let i = 0; i < keys.length; i++) {
      if(keys[i]=="feesAmount"){
        this.columnList.push({
          Name: keys[i],
          displayName:'Fees $'
        });
      }else if(keys[i]=="disbursementsAmount"){
        this.columnList.push({
          Name: keys[i],
          displayName:'Disbursements $'
        });
      }
      else if(keys[i]=="writeOffAmount"){
        this.columnList.push({
          Name: keys[i],
          displayName:'Write-Offs $'
        });
      }
      else if(keys[i]=="cashReceipts"){
        this.columnList.push({
          Name: keys[i],
          displayName:'Cash Receipts $'
        });
      }
      else{
        this.columnList.push({
          Name: keys[i],
          displayName: keys[i] = _.startCase(keys[i])
        });
      }
    }
  }

  ExportToCSV(reportName) {
    const temprows = JSON.parse(JSON.stringify(this.rows));
    const selectedrows = Object.assign([], temprows);

    this.exporttocsvService.downloadReportFile(
      selectedrows,
      this.columnList,
      reportName
    );
  }
  GetColumnHeaderList() {
    return [];
  }

  ArLedgerHistoryReport() {
    this.ArLedgerHistoryForm = this.formBuilder.group({
      startDate: [null, Validators.required],
      endDate: [null, Validators.required]
    });
    this.ArLedgerHistoryForm.controls['endDate'].setValue(this.currentDate());

  }
  submitArLedgerReport(reportName) {
    let data: any = new ArLedgerReportModels;
    data.StartDate = this.startDates;
    data.EndDate = this.endDates;

    this.loading = true;
    this.reportService.v1ReportArLedgerReportPost$Json$Response({ body: data })
      .subscribe((suc: {}) => {
        this.loading = false;
        const res: any = suc;
        if (res && res.body) {
          var records = JSON.parse(res.body);
          this.rows = [...records.results];
          if (this.rows.length > 0) {
            const keys = Object.keys(this.rows[0]);
            this.addkeysIncolumnlist(keys);
          } else {
            var columnListHeader = ['Client Number', 'Client Name','Matter Number', 'Matter Name',
              'Date of Post', 'Beginnning Balance', 'feesAmount', 'disbursementsAmount',
              'writeOffAmount', 'cashReceipts', 'EndingBalance'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }

        this.ExportToCSV(reportName);

      },(err)=>{
        this.loading = false;
      });
    // }

  }
  currentDate() {
    const currentDate = new Date();
    return currentDate.toISOString().substring(0, 10);
  }

  startDate(e) {
    this.startDates = e;
    this.exportCsvFlag = e ? true : false;
    this.noDataToDisplay = false;
  }
  endDate(e) {
    this.endDates = e;
    this.exportCsvFlag = this.startDates && e ? true : false;
  }


}
