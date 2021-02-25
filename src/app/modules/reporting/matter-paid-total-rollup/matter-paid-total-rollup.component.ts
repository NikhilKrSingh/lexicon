import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { MatterPaidVsTotalRollUpModels } from '../../models/matter-paid-vs-total-rollup.model';

@Component({
  selector: 'app-matter-paid-total-rollup',
  templateUrl: './matter-paid-total-rollup.component.html',
  styleUrls: ['./matter-paid-total-rollup.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class MatterPaidTotalRollupComponent implements OnInit {
  modalOptions: NgbModalOptions;
  closeResult: string;
  MatterPaidVsTotalRollUpForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  noDataToDisplay = false;
  exportCsvFlag = false;
  message: string
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
    this.pagetitle.setTitle("Matter Paid vs. Total Rollup Report");
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
    this.MatterPaidVsTotalRollUpReport();
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

  MatterPaidVsTotalRollUpReport() {
    this.MatterPaidVsTotalRollUpForm = this.formBuilder.group({
      startDate: [null, Validators.required],
      endDate: [null, Validators.required]
    });
    this.MatterPaidVsTotalRollUpForm.controls['endDate'].setValue(this.currentDate());

  }
  submitMatterPaidVsTotalRollUpReport(reportName) {
    let data : any = new MatterPaidVsTotalRollUpModels();
    data.StartDate = this.startDates;
    data.EndDate = this.endDates;

    if (data.StartDate == null) {
      this.noDataToDisplay = true;
      this.exportCsvFlag = true;
      this.message = "Start date required";
    }
    else {
      this.loading = true;
      this.reportService.v1ReportMatterPaidTotalRollUpPost$Json$Response({ body: data })
        .subscribe((suc: {}) => {
        this.loading = false;
          const res: any = suc;
          if (res && res.body) {
            var records = JSON.parse(res.body);
            this.rows = [...records.results];
            if (this.rows.length > 0) {
              const keys = Object.keys(this.rows[0]);
              this.addkeysIncolumnlist(keys);
            }
            else {
              var columnListHeader = ['Matter Number', 'Matter Name', 'Total Billed', 'Total Paid'];
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
}
