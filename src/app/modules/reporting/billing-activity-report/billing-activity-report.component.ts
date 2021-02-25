import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { BillingActivityReportModels } from '../../models/billing-activity.model';

@Component({
  selector: 'app-billing-activity-report',
  templateUrl: './billing-activity-report.component.html',
  styleUrls: ['./billing-activity-report.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BillingActivityReportComponent implements OnInit {
  modalOptions: NgbModalOptions;
  closeResult: string;
  billingActivityReportForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  allRecordsFlag: boolean = false;
  exportCsvFlag = false;
  message: string
  public dateResetServiceStart: boolean = false;
  public dateResetServiceEnd: boolean = false;

  public dateResetPostStart: boolean = false;
  public dateResetPostEnd: boolean = false;
  public loading: boolean = false;


  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pagetitle: Title
  ) { }

  ngOnInit() {
    this.pagetitle.setTitle("Billing Activity Report");
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
    this.billingActivityReport();
  }

  addkeysIncolumnlist(keys: any[] | string[]) {
    this.columnList = [];
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] == "billableHour") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Base/Billable Hours Total'
        });
      }else if (keys[i] == "billableAmount") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Base/Billable Hours $'
        });
      }
      else if (keys[i] == "billedHours") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Billed Hours Total'
        });
      }
      else if (keys[i] == "billedAmount") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Billed Hours $'
        });
      }
      else if (keys[i] == "fixedFeeServices") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Fixed Fee Services $'
        });
      }
      else if (keys[i] == "fixedFeeServicesAddons") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Fixed Fee Add-Ons $'
        });
      }
      else if (keys[i] == "disbursement") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Disbursements $'
        });
      }
      else if (keys[i] == "cashReceiptsforDisbursements") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Cash Receipts for Disbursements'
        });
      }
      else if (keys[i] == "cashReceiptsforTime") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Cash Receipts for Time'
        });
      }
      else if (keys[i] == "cashReceiptsforFixedFeeService") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Cash Receipts for Fixed Fee Service'
        });
      }
      else if (keys[i] == "cashReceiptsforFixedFeeAddOn") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'Cash Receipts for Fixed Fee Add-On'
        });
      }
       else {
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
  billingActivityReport() {
    this.billingActivityReportForm = this.formBuilder.group({
      dateRange: new FormControl('false'),
      startDateInputPost: [null],
      endDateInputPost: [null],
      startDateInputService: [null],
      endDateInputService: [null],
    });
  }

  generateBillingActivityReport(reportName) {
    let data: any = new BillingActivityReportModels();
    data.startDatePost = this.billingActivityReportForm.value['startDateInputPost'];
    data.endDatePost = this.billingActivityReportForm.value['endDateInputPost'];
    data.startDateService = this.billingActivityReportForm.value['startDateInputService'];
    data.endDateService = this.billingActivityReportForm.value['endDateInputService'];
    data.allrecords = this.billingActivityReportForm.value['dateRange'] == 'allRecords' ? 'true' : 'false';
    data.dateOfPostRange = this.billingActivityReportForm.value['dateRange'] == 'dateOfPostRange' ? 'true' : 'false';
    data.dateOfServiceRange = this.billingActivityReportForm.value['dateRange'] == 'dateOfServiceRange' ? 'true' : 'false';
    this.loading = true;

    this.reportService.v1ReportBillingActivityReportPost$Json$Response({ body: data })
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
            var columnListHeader = ['MonthOfPost', 'MonthOfService', 'TimekeeperID', 'TimekeeperName',
              'ClientNumber', 'ClientName', 'MatterNumber',
              'MatterName', 'PracticeArea', 'MatterType', 'OfficeName',
              'billableHour', 'billableAmount', 'billedHours', 'billedAmount', 'fixedFeeServices',
              'fixedFeeServicesAddons', 'disbursement','UnappliedCash', 'cashReceiptsforDisbursements','cashReceiptsforTime',
            'cashReceiptsforFixedFeeService','cashReceiptsforFixedFeeAddOn'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.ExportToCSV(reportName);
      },(err)=>{
        this.loading = false;
      });
  }
  allRecordsChange(event) {
    if (event.target.checked == true) {
      this.exportCsvFlag = true;
      this.allRecordsFlag = true
      this.dateResetServiceStart = true;
      this.dateResetServiceEnd = true;
      setTimeout(() => {
        this.dateResetServiceStart = false;
        this.dateResetServiceEnd = false;
      }, 20);
      this.dateResetPostStart = true
      this.dateResetPostEnd = true
      setTimeout(() => {
        this.dateResetPostStart = false
        this.dateResetPostEnd = false
      }, 20);
    }
  }

  dateOfPostChange(event) {
    if (event.target.checked == true) {
      this.exportCsvFlag = false;
      this.dateResetPostStart = true
      this.billingActivityReportForm.controls['endDateInputPost'].setValue(this.currentDate());
    }
  }

  dateOfServiceChange(event) {
    if (event.target.checked == true) {
      this.exportCsvFlag = false;
      this.dateResetServiceStart = true;
      this.billingActivityReportForm.controls['endDateInputService'].setValue(this.currentDate());
    }
  }
  currentDate() {
    const currentDate = new Date();
    return currentDate.toISOString().substring(0, 10);
  }

  startDatePostChange() {
    if (this.billingActivityReportForm.value['endDateInputPost'] != null && this.billingActivityReportForm.value['startDateInputPost'] != null) {
      this.exportCsvFlag = true
    }
    else {
      this.exportCsvFlag = false
    }
    this.billingActivityReportForm.controls['startDateInputService'].setValue(null);
    this.billingActivityReportForm.controls['endDateInputService'].setValue(null);
  }

  endDatePostChange() {
    this.billingActivityReportForm.controls['startDateInputService'].setValue(null);
    this.billingActivityReportForm.controls['endDateInputService'].setValue(null);
    if (this.billingActivityReportForm.value.startDateInputPost > this.billingActivityReportForm.value.endDateInputPost) {
      this.billingActivityReportForm.patchValue({
        startDateInputPost: null
      })
      this.startDatePostChange();
      this.dateResetPostStart = true;
      setTimeout(() => {
        this.dateResetPostStart = false;
      }, 0);
    }

  }

  startDateServicehange() {
    if (this.billingActivityReportForm.value['endDateInputService'] != null && this.billingActivityReportForm.value['startDateInputService'] != null) {
      this.exportCsvFlag = true
    }
    else {
      this.exportCsvFlag = false
    }
    this.billingActivityReportForm.controls['startDateInputPost'].setValue(null);
    this.billingActivityReportForm.controls['endDateInputPost'].setValue(null);
  }

  endDateServicehange() {
    this.billingActivityReportForm.controls['startDateInputPost'].setValue(null);
    this.billingActivityReportForm.controls['endDateInputPost'].setValue(null);
    if (this.billingActivityReportForm.value.startDateInputService > this.billingActivityReportForm.value.endDateInputService) {
      this.billingActivityReportForm.patchValue({
        startDateInputService: null
      })
      this.startDateServicehange();
      this.dateResetServiceStart = true;
      setTimeout(() => {
        this.dateResetServiceStart = false;
      }, 0);
    }

  }
}
