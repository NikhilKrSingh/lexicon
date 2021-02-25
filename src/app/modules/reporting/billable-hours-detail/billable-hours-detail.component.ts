import { DecimalPipe } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { AuthGuard } from 'src/app/guards/auth-guard.service';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { BilledHoursModels } from '../../models/billed-hours.model';

@Component({
  selector: 'app-billable-hours-detail',
  templateUrl: './billable-hours-detail.component.html',
  styleUrls: ['./billable-hours-detail.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BillableHoursDetailComponent implements OnInit {

  modalOptions: NgbModalOptions;
  closeResult: string;
  BilledHoursForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  noDataToDisplay = false;
  message: string;
  exportCsvFlag = false;
  startDates:any;
  endDates:any;
  public loading: boolean = false;
  public powerFlag: boolean = false;

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pagetitle: Title,
    private auth: AuthGuard

  ) { }

  ngOnInit() {
    this.pagetitle.setTitle("Billable Hours Detail Report");
    this.initReportForms();
    this.checkPowerUser();
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

  async checkPowerUser() {
    const permissions: any = await this.auth.getPermissions();
    if (permissions.ACCOUNTINGisAdmin || permissions.ACCOUNTINGisEdit
      || permissions.BILLING_MANAGEMENTisAdmin
      || permissions.BILLING_MANAGEMENTisEdit) {
      this.powerFlag = true
    }
    else {
      this.powerFlag = false
    }
  }

  initReportForms() {
    this.totalBilledHoursReport();
  }

  addkeysIncolumnlist(keys: any[] | string[]) {
    this.columnList = [];
    for (let i = 0; i < keys.length; i++) {
      if(keys[i]=="billableHours"){
        this.columnList.push({
          Name: keys[i],
          displayName:'Hours (Billable)'
        });
      }else if(keys[i]=="nonBillableHours"){
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

  totalBilledHoursReport() {
    this.BilledHoursForm = this.formBuilder.group({
      startDate: [null, Validators.required],
      endDate: [null, Validators.required]
    });
    this.BilledHoursForm.controls['endDate'].setValue(this.currentDate());
  }
  submitBilledHoursReport(reportName) {
    let data : any = new BilledHoursModels();
    data.StartDate = this.startDates;
    data.EndDate = this.endDates;
    data.PowerFlag = this.powerFlag
    this.loading = true;
    this.reportService.v1ReportBilledHoursPost$Json$Response({ body: data })
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
          } else {
            var columnListHeader = ['TimekeeperId', 'TimekeeperName', 'DateOfService', 'DateOfPost',
              'DelayInPost', 'billableHours', 'nonBillableHours'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.ExportToCSV(reportName);
      },(err)=>{
        this.loading = false;
      });

  }

  private formatData(rows: Array<any>) {
    let np = new DecimalPipe('en-US');

    rows.forEach(a => {          
      if (a.billableHours) {
        a.billableHours = `"${np.transform(a.billableHours, '1.2-2')}"`;
      }
      if (a.nonBillableHours) {
        a.nonBillableHours = `"${np.transform(a.nonBillableHours, '1.2-2')}"`;
      }
    });
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
