import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { TotalRealizationModels } from '../../models/totalrealization.model';

@Component({
  selector: 'app-total-realization',
  templateUrl: './total-realization.component.html',
  styleUrls: ['./total-realization.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class TotalRealizationComponent implements OnInit {

  modalOptions: NgbModalOptions;
  closeResult: string;
  TotalRealizationForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  errorFlag = false;
  exportCsvFlag = false;
  message: string
  openReset:boolean=false;
  closeReset:boolean =false;
  public loading: boolean = false;

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pagetitle: Title
  ) { }

  ngOnInit() {
    this.pagetitle.setTitle("Total Realization Report");
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
    this.totalRealizationReport();
  }

  addkeysIncolumnlist(keys: any[] | string[]) {
    this.columnList = [];
    for (let i = 0; i < keys.length; i++) {
      this.columnList.push({
        Name: keys[i],
        displayName: keys[i] = _.startCase(keys[i])
      });
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

  totalRealizationReport() {
    this.TotalRealizationForm = this.formBuilder.group({
      BilledStartDate: [null],
      BilledEndDate: [null],
      CashReceiptStartDate: [null],
      CashReceiptEndDate: [null]
    });
    this.TotalRealizationForm.controls['BilledEndDate'].setValue(this.currentDate());
    this.TotalRealizationForm.controls['CashReceiptEndDate'].setValue(this.currentDate());

  }
  submitTotalrealizationReport(reportName) {
    let data: any = new TotalRealizationModels();
    data.BilledStartDate = this.TotalRealizationForm.value['BilledStartDate'];
    data.BilledEndDate = this.TotalRealizationForm.value['BilledEndDate'];
    data.CashReceiptStartDate = this.TotalRealizationForm.value['CashReceiptStartDate'];
    data.CashReceiptEndDate = this.TotalRealizationForm.value['CashReceiptEndDate'];

    if (this.TotalRealizationForm.value['BilledStartDate'] == null || this.TotalRealizationForm.value['BilledEndDate'] == null || this.TotalRealizationForm.value['CashReceiptStartDate'] == null || this.TotalRealizationForm.value['CashReceiptEndDate'] == null) {
      this.errorFlag = true;
      this.message = "Date can not be Null"
    }
    else {
      this.loading = true;
      this.reportService.v1ReportTotalRealizationReportPost$Json$Response({ body: data })
        .subscribe((suc: {}) => {
          const res: any = suc;
          if (res && res.body) {
            this.loading = false;
            var records = JSON.parse(res.body);
            this.rows = [...records.results];
            if (this.rows.length > 0) {
              const keys = Object.keys(this.rows[0]);
              this.addkeysIncolumnlist(keys);
            } else {
              var columnListHeader = ['MatterNumber', 'MatterName', 'TimekeeperID', 'TimekeeperName',
                'OfficeName', 'BillableHoursRelieved', 'BillableTimeOriginalRelieved', 'BillableTimeBilled',
                'CashReceiptAmount', 'InternalRealization', 'ExternalRealization', 'TotalRealization'];
              const keys = columnListHeader;
              this.addkeysIncolumnlist(keys);
            }
          }
          this.ExportToCSV(reportName);
        },(err)=>{
          this.loading = false;
        });
    }
  }

  openStartDateChange() {
    if (this.TotalRealizationForm.value['BilledStartDate'] != null && this.TotalRealizationForm.value['BilledEndDate'] != null && this.TotalRealizationForm.value['CashReceiptStartDate'] != null && this.TotalRealizationForm.value['CashReceiptEndDate'] != null) {
      this.exportCsvFlag = true;
    }
    else {
      this.exportCsvFlag = false;
      this.errorFlag = true;
      this.message = "Date can not be Null"
    }
  }
  openEndDateChange() {
    if(this.TotalRealizationForm.value['BilledStartDate'] != null && this.TotalRealizationForm.value['BilledEndDate'] != null){
      if(this.TotalRealizationForm.value.BilledStartDate > this.TotalRealizationForm.value.BilledEndDate){
        this.TotalRealizationForm.patchValue({
          BilledStartDate:null
        });
        this.openReset =true;
        this.closeStartDateChange();
        setTimeout(() => {
          this.openReset = false;
        }, 0);
     }
     else {
      this.checkDateSelection();
     }

    }

    else{
      this.exportCsvFlag =false;
      this.errorFlag = true;
      this.message = "Date can not be Null"
    }
  }
  closeStartDateChange() {
    if (this.TotalRealizationForm.value['BilledStartDate'] != null && this.TotalRealizationForm.value['BilledEndDate'] != null && this.TotalRealizationForm.value['CashReceiptStartDate'] != null && this.TotalRealizationForm.value['CashReceiptEndDate'] != null) {
      this.exportCsvFlag = true;
    }
    else {
      this.exportCsvFlag = false;
      this.errorFlag = true;
      this.message = "Date can not be Null"
    }
  }
  closeEndDateChange(){
    if(this.TotalRealizationForm.value['CashReceiptStartDate'] != null && this.TotalRealizationForm.value['CashReceiptEndDate'] != null){
      if(this.TotalRealizationForm.value.CashReceiptStartDate > this.TotalRealizationForm.value.CashReceiptEndDate){
        this.TotalRealizationForm.patchValue({
          CashReceiptStartDate:null
        });
        this.closeReset =true;
        this.closeStartDateChange();
        setTimeout(() => {
          this.closeReset = false;
        }, 0);
     }
     else {
      this.checkDateSelection();
     }


    }
    else {
      this.exportCsvFlag = false;
      this.errorFlag = true;
      this.message = "Date can not be Null"
    }
  }
  checkDateSelection(){
    if(this.TotalRealizationForm.value['BilledStartDate'] != null && this.TotalRealizationForm.value['BilledEndDate'] != null && this.TotalRealizationForm.value['CashReceiptStartDate'] != null && this.TotalRealizationForm.value['CashReceiptEndDate'] != null)
      {
        this.exportCsvFlag = true;
      }
  }
  currentDate() {
    const currentDate = new Date();
    return currentDate.toISOString().substring(0, 10);
  }
}
