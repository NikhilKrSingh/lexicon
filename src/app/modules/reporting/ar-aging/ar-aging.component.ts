import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import * as _ from 'lodash';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { ArAgingModels } from '../../models/araging.model';

@Component({
  selector: 'app-ar-aging',
  templateUrl: './ar-aging.component.html',
  styleUrls: ['./ar-aging.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ArAgingComponent implements OnInit {
  arAgingReportForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  public loading: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pagetitle: Title
  ) { }

  ngOnInit() {
    this.pagetitle.setTitle("AR Aging Report");
    this.arAgingReport();
  }

  arAgingReport() {
    this.arAgingReportForm = this.formBuilder.group({
      dateAsOfInput: ['', Validators.required],
      agingBracket: new FormControl('120+'),
    });
    this.arAgingReportForm.controls['dateAsOfInput'].setValue(this.currentDate());

  }

  submitARAgingReport() {
    let data: any = new ArAgingModels();
    data.DateAsOf = this.arAgingReportForm.value['dateAsOfInput'];
    data.AgingBracket30 = this.arAgingReportForm.value['agingBracket'] == '30+' ? true : false;
    data.AgingBracket60 = this.arAgingReportForm.value['agingBracket'] == '60+' ? true : false;
    data.AgingBracket90 = this.arAgingReportForm.value['agingBracket'] == '90+' ? true : false;
    data.AgingBracket120Plus = this.arAgingReportForm.value['agingBracket'] == '120+' ? true : false;
    data.AgingBracket180Plus = this.arAgingReportForm.value['agingBracket'] == '180+' ? true : false;
    data.PowerFlag = true;
    this.loading = true;
    this.reportService.v1ReportArAgingReportPost$Json$Response({ body: data })
      .subscribe((suc: {}) => {
        this.loading = false;
        const res: any = suc;
        if (res && res.body) {
          var records = JSON.parse(res.body);
          this.rows = [...records.results];
          if (this.rows.length > 0) {
            const keys = Object.keys(this.rows[0]);
            this.addkeysIncolumnlist(keys);
          } else if (data.AgingBracket30 == true && this.rows.length == 0) {
            var columnListHeader = ['AttorneyID', 'AttorneyName', 'OfficeName', 'PracticeArea', 'MatterType', 'arCurrent', 'aR30Plus'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          } else if (data.AgingBracket60 == true && this.rows.length == 0) {
            var columnListHeader = ['AttorneyID', 'AttorneyName', 'OfficeName', 'PracticeArea', 'MatterType', 'arCurrent', 'aR30_59', 'aR60Plus'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          } else if (data.AgingBracket90 == true && this.rows.length == 0) {
            var columnListHeader = ['AttorneyID', 'AttorneyName', 'OfficeName', 'PracticeArea', 'MatterType', 'arCurrent', 'aR30_59', 'aR60_89', 'aR90Plus'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          } else if (data.AgingBracket120Plus == true && this.rows.length == 0) {
            var columnListHeader = ['AttorneyID', 'AttorneyName', 'OfficeName', 'PracticeArea', 'MatterType', 'arCurrent', 'aR30_59', 'aR60_89', 'aR90_120', 'aR120Plus'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          } else if (data.AgingBracket180Plus == true && this.rows.length == 0) {
            var columnListHeader = ['AttorneyID', 'AttorneyName', 'OfficeName', 'PracticeArea', 'MatterType', 'arCurrent', 'aR30_59', 'aR60_89', 'aR90_120', 'aR120_180', 'aR180Plus'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.ExportToCSV('AR Aging');
        console.log(res);
      },(err)=>{
        this.loading = false;
      });
  }

  addkeysIncolumnlist(keys: any[] | string[]) {
    this.columnList = [];
    for (let i = 0; i < keys.length; i++) {
      if(keys[i]=="arCurrent"){
        this.columnList.push({
          Name: keys[i],
          displayName:'AR Current'
        });
      }
      else if(keys[i]=="aR30_59"){
        this.columnList.push({
          Name: keys[i],
          displayName:'AR 30-59'
        });
      }
      else if(keys[i]=="aR60_89"){
        this.columnList.push({
          Name: keys[i],
          displayName:'AR 60-89'
        });
      }
      else if(keys[i]=="aR90_120"){
        this.columnList.push({
          Name: keys[i],
          displayName:'AR 90-119'
        });
      }
      else if(keys[i]=="aR120_180"){
        this.columnList.push({
          Name: keys[i],
          displayName:'AR 120-179'
        });
      }
      else if(keys[i]=="aR180Plus"){
        this.columnList.push({
          Name: keys[i],
          displayName:'AR 180+'
        });
      }
      else if(keys[i]=="aR30Plus"){
        this.columnList.push({
          Name: keys[i],
          displayName:'AR 30+'
        });
      }
      else if(keys[i]=="aR60Plus"){
        this.columnList.push({
          Name: keys[i],
          displayName:'AR 60+'
        });
      }
      else if(keys[i]=="aR90Plus"){
        this.columnList.push({
          Name: keys[i],
          displayName:'AR 90+'
        });
      }
      else if(keys[i]=="aR120Plus"){
        this.columnList.push({
          Name: keys[i],
          displayName:'AR 120+'
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

  ExportToCSV(fileName) {
    const temprows = JSON.parse(JSON.stringify(this.rows));
    const selectedrows = Object.assign([], temprows);

    this.exporttocsvService.downloadReportFile(
      selectedrows,
      this.columnList,
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
