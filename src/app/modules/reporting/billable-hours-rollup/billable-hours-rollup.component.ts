import { DecimalPipe } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { BillableHoursRollUpModels } from '../../models/billable-hours-rollup.model';

@Component({
  selector: 'app-billable-hours-rollup',
  templateUrl: './billable-hours-rollup.component.html',
  styleUrls: ['./billable-hours-rollup.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BillableHoursRollupComponent implements OnInit {
  modalOptions: NgbModalOptions;
  closeResult: string;
  BillableHoursRollupForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  noDataToDisplay = false;
  exportCsvFlag = false;
  message: string;
  startDates:any;
  endDates:any;
  public loading: boolean = false;

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pagetitle: Title
  ) { }
  ngOnInit() {
    this.pagetitle.setTitle("Billable Hours Rollup Report");
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
    this.BillableHoursRollupReport();
  }
  addkeysIncolumnlist(keys: any[] | string[]) {
    this.columnList = [];
    for (let i = 0; i < keys.length; i++) {
      if(keys[i]=="hoursBillable"){
        this.columnList.push({
          Name: keys[i],
          displayName:'Hours (Billable)'
        });
      }else if(keys[i]=="hoursNonBillable"){
        this.columnList.push({
          Name: keys[i],
          displayName: 'Hours (Non-Billable)'
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
  BillableHoursRollupReport() {
    this.BillableHoursRollupForm = this.formBuilder.group({
      startDate: [null],
      endDate: [null],
      rollupCriteria: [null, Validators.required]
    });
    this.BillableHoursRollupForm.controls['endDate'].setValue(this.currentDate());
  }
  submitBillableHoursRollupReport(reportName) {
    let data: any = new BillableHoursRollUpModels();
    data.StartDate = this.startDates;
    data.EndDate = this.endDates;
    data.Timekeeper = this.BillableHoursRollupForm.value['rollupCriteria'] == '1' ? true : false;
    data.Client = this.BillableHoursRollupForm.value['rollupCriteria'] == '2' ? true : false;
    data.Matter = this.BillableHoursRollupForm.value['rollupCriteria'] == '3' ? true : false;
    data.PracticeArea = this.BillableHoursRollupForm.value['rollupCriteria'] == '4' ? true : false;
    data.MatterType = this.BillableHoursRollupForm.value['rollupCriteria'] == '5' ? true : false;
    data.Office = this.BillableHoursRollupForm.value['rollupCriteria'] == '6' ? true : false;
    data.groupCodeId = 0;
    if (data.StartDate == null) {
      this.noDataToDisplay = true;
      this.exportCsvFlag = true;
      this.message = "Start date required";
    }
    else {
      this.loading = true;
      this.reportService.v1ReportBilledHoursRollUpPost$Json$Response({ body: data })
        .subscribe((suc: {}) => {
          this.loading = false;
          const res: any = suc;
          if (res && res.body) {
            var records = JSON.parse(res.body);
            this.rows = [...records.results];
            this.formatData(this.rows);
            if (this.rows.length > 0) {
              const keys = Object.keys(this.rows[0]);
              this.addkeysIncolumnlist(keys);
            } else if (data.Timekeeper == true && this.rows.length == 0) {
              var columnListHeader = ['TimekeeperID', 'TimekeeperName', 'hoursBillable', 'hoursNonBillable'];
              const keys = columnListHeader;
              this.addkeysIncolumnlist(keys);
            } else if (data.Client == true && this.rows.length == 0) {
              var columnListHeader = ['ClientNumber', 'ClientName', 'hoursBillable', 'hoursNonBillable'];
              const keys = columnListHeader;
              this.addkeysIncolumnlist(keys);
            } else if (data.Matter == true && this.rows.length == 0) {
              var columnListHeader = ['MatterNumber', 'MatterName','ClientNumber','ClientName','PracticeArea','MatterType','Office', 'hoursBillable', 'hoursNonBillable'];
              const keys = columnListHeader;
              this.addkeysIncolumnlist(keys);
            } else if (data.PracticeArea == true && this.rows.length == 0) {
              var columnListHeader = ['PracticeArea', 'hoursBillable', 'hoursNonBillable'];
              const keys = columnListHeader;
              this.addkeysIncolumnlist(keys);
            } else if (data.MatterType == true && this.rows.length == 0) {
              var columnListHeader = ['MatterType', 'hoursBillable', 'hoursNonBillable'];
              const keys = columnListHeader;
              this.addkeysIncolumnlist(keys);
            }
            else if (data.Office == true && this.rows.length == 0) {
              var columnListHeader = ['OfficeName', 'hoursBillable', 'hoursNonBillable'];
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
  currentDate() {
    const currentDate = new Date();
    return currentDate.toISOString().substring(0, 10);
  }
  startDateChange() {
    this.exportCsvFlag = true;
    this.noDataToDisplay = false;
  }
  endDateChange() {
    this.exportCsvFlag = true;
    this.noDataToDisplay = false;
  }
  startDate(e){
    this.startDates = e;
    this.exportCsvFlag = e ? true : false;
    this.noDataToDisplay =false;
  }
  endDate(e){
    this.endDates = e;
    this.exportCsvFlag = this.startDates && e ? true : false;
  }
  private formatData(rows: Array<any>) {
    let np = new DecimalPipe('en-US');

    rows.forEach(a => {          
      if (a.hoursBillable) {
        a.hoursBillable = `"${np.transform(a.hoursBillable, '1.2-2')}"`;
      }
      if (a.hoursNonBillable) {
        a.hoursNonBillable = `"${np.transform(a.hoursNonBillable, '1.2-2')}"`;
      }
    });
  }
}
