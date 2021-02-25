import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { TrustAccountService } from 'src/common/swagger-providers/services/trust-account.service';
import { NetCreditBalanceModels } from '../../models/net-credit-balance.model';

@Component({
  selector: 'app-net-credit-balance',
  templateUrl: './net-credit-balance.component.html',
  styleUrls: ['./net-credit-balance.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class NetCreditBalanceComponent implements OnInit {
  modalOptions: NgbModalOptions;
  closeResult: string;
  NetCreditBalanceReportForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  public noDataToDisplay: boolean = false;
  public trustAccountingFlag: boolean = false;
  public message: string = "";
  public loading: boolean = false;

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private trustAccountService: TrustAccountService,
    private pagetitle: Title
  ) { }

  ngOnInit() {
    this.checkTrustAccountStatus();
    this.pagetitle.setTitle("Net Credit Balance Report");
    this.initReportForms();
  }
  initReportForms() {
    this.netCreditBalanceReport();
  }

  addkeysIncolumnlist(keys: any[] | string[]) {
    this.columnList = [];
    for (let i = 0; i < keys.length; i++) {
      if (keys[i] == "arBalance") {
        this.columnList.push({
          Name: keys[i],
          displayName: 'AR Balance'
        });
      } else {
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

  currentDate() {
    const currentDate = new Date();
    return currentDate.toISOString().substring(0, 10);
  }
  netCreditBalanceReport() {
    this.NetCreditBalanceReportForm = this.formBuilder.group({
      startDateInput: [null, Validators.required],
      arBalanceLessThanZero: new FormControl('arBalanceLessThanZero'),
    });
    this.NetCreditBalanceReportForm.controls['startDateInput'].setValue(this.currentDate());

  }

  submitNetCreditBalanceReport(reportName) {
    let data: any = new NetCreditBalanceModels();
    data.startDate = this.NetCreditBalanceReportForm.value['startDateInput'];
    data.arBalanceLessThanZero = this.NetCreditBalanceReportForm.value['arBalanceLessThanZero'] == 'arBalanceLessThanZero' ? 'true' : 'false';
    data.trustBalanceLessThanZero = this.NetCreditBalanceReportForm.value['arBalanceLessThanZero'] == 'trustBalanceLessThanZero' ? 'true' : 'false';
    data.isTrustBalanceEnabled = this.trustAccountingFlag ? 'true' : 'false'
    this.loading = true;
    this.reportService.v1ReportNetCreditBalanceReportPost$Json$Response({ body: data })
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
            var columnListHeader = ['Client Number', 'Client Name', 'Matter Number', 'Matter Name',
              'Practice Area', 'Matter Type', 'Office Name', 'AR Balance', 'TrustBalance'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.ExportToCSV(reportName);
        console.log(res);
      },(err)=>{
        this.loading = false;
      });
  }
  async checkTrustAccountStatus(): Promise<any> {
    this.loading = true;
    try {
      let resp: any = await this.trustAccountService.v1TrustAccountGetTrustAccountStatusGet$Response().toPromise();  
      resp = JSON.parse(resp.body as any).results;
      this.trustAccountingFlag = resp;
      this.loading = false;
    } catch (error) {
      this.loading = false; 
    }
    
    
  }
}
