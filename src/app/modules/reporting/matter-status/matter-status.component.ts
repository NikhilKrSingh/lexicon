import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { MatterStatusModels } from '../../models/matter-status.model';

@Component({
  selector: 'app-matter-status',
  templateUrl: './matter-status.component.html',
  styleUrls: ['./matter-status.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class MatterStatusComponent implements OnInit {
  modalOptions: NgbModalOptions;
  closeResult: string;
  MatterStatusReportForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  errorFlag = false;
  exportCsvFlag = false;
  message: string
  openReset:boolean=false;
  openEndReset:boolean=false;

  closeReset:boolean =false;
  closeEndReset:boolean =false;
  public loading: boolean = false;

  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private pagetitle: Title
  ) { }
  ngOnInit() {
    this.pagetitle.setTitle("Matter Status Report");
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
    this.MatterStatusReport();
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
  MatterStatusReport() {
    this.MatterStatusReportForm = this.formBuilder.group({
      openStartDate: [null],
      openEndDate: [null],
      closeStartDate: [null],
      closeEndDate: [null]
    });
  }
  submitMatterStatusReport(reportName) {
    let data: any = new MatterStatusModels();
    data.OpenDateStartRange = this.MatterStatusReportForm.value['openStartDate'];
    data.OpenDateEndRange = this.MatterStatusReportForm.value['openEndDate'];
    data.CloseDateStartRange = this.MatterStatusReportForm.value['closeStartDate'];
    data.CloseDateEndRange = this.MatterStatusReportForm.value['closeEndDate'];
    data.PowerFlag = true
    if (this.MatterStatusReportForm.value['openStartDate'] == "" || this.MatterStatusReportForm.value['openEndDate'] == "" || this.MatterStatusReportForm.value['closeStartDate'] == "" || this.MatterStatusReportForm.value['closeEndDate'] == "") {
      this.errorFlag = true;
      this.message = "Date can not be Null"
    }
    else {
      this.loading = true;
      this.reportService.v1ReportMatterStatusReportPost$Json$Response({ body: data })
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
              var columnListHeader = ['ClientNumber', 'ClientName', 'MatterNumber', 'MatterName',
                'PracticeArea', 'MatterType', 'OfficeName',
                'ResponsibleAttorneyID', 'ResponsibleAttorneyName', 'BillingAttorneyID', 'BillingAttorneyName', 'MatterStatus',
                'TimeOpen'];
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
    if (this.MatterStatusReportForm.value['openStartDate'] != null && this.MatterStatusReportForm.value['openEndDate'] != null) {
      if (this.MatterStatusReportForm.value['closeStartDate'] == null
        || this.MatterStatusReportForm.value['closeEndDate'] == null) {
        this.exportCsvFlag = false;
      } else {
        this.exportCsvFlag = true;
      }
    }
    if (this.MatterStatusReportForm.value['openStartDate'] != null
      && this.MatterStatusReportForm.value['openEndDate'] != null
      && this.MatterStatusReportForm.value['closeStartDate'] == null
      && this.MatterStatusReportForm.value['closeEndDate'] == null) {
      this.exportCsvFlag = true;
    } else if (this.MatterStatusReportForm.value['openStartDate'] != null
      && this.MatterStatusReportForm.value['openEndDate'] != null
      && this.MatterStatusReportForm.value['closeStartDate'] != null
      && this.MatterStatusReportForm.value['closeEndDate'] != null) {
      this.exportCsvFlag = true;
    }
    else {
      this.exportCsvFlag = false;
    }
  }
  openEndDateChange() {
    if (this.MatterStatusReportForm.value['openStartDate'] != null && this.MatterStatusReportForm.value['openEndDate'] != null) {
      if (this.MatterStatusReportForm.value.openStartDate > this.MatterStatusReportForm.value.openEndDate) {
        this.MatterStatusReportForm.patchValue({
          openStartDate: null
        });
        this.openReset = true;
        this.openStartDateChange();
        setTimeout(() => {
          this.openReset = false;
        }, 0);
      }
      if (this.MatterStatusReportForm.value['openStartDate'] != null && this.MatterStatusReportForm.value['openEndDate'] != null) {
        if (this.MatterStatusReportForm.value['closeStartDate'] == null
          || this.MatterStatusReportForm.value['closeEndDate'] == null) {
          this.exportCsvFlag = false
        } else {
          this.exportCsvFlag = true;
        }
      }
      if (this.MatterStatusReportForm.value['openStartDate'] != null
        && this.MatterStatusReportForm.value['openEndDate'] != null
        && this.MatterStatusReportForm.value['closeStartDate'] == null
        && this.MatterStatusReportForm.value['closeEndDate'] == null) {
        this.exportCsvFlag = true;
      } else if (this.MatterStatusReportForm.value['openStartDate'] != null
        && this.MatterStatusReportForm.value['openEndDate'] != null
        && this.MatterStatusReportForm.value['closeStartDate'] != null
        && this.MatterStatusReportForm.value['closeEndDate'] != null) {
        this.exportCsvFlag = true;
      }
      else {
        this.exportCsvFlag = false;
      }
    }
  }
  closeStartDateChange() {
    if (this.MatterStatusReportForm.value['closeStartDate'] != null && this.MatterStatusReportForm.value['closeEndDate'] != null) {
      if (this.MatterStatusReportForm.value['openStartDate'] == null
        || this.MatterStatusReportForm.value['openEndDate'] == null) {
        this.exportCsvFlag = false
      } else {
        this.exportCsvFlag = true
      }
    }
    if (this.MatterStatusReportForm.value['closeStartDate'] != null
      && this.MatterStatusReportForm.value['closeEndDate'] != null
      && this.MatterStatusReportForm.value['openStartDate'] == null
      && this.MatterStatusReportForm.value['openEndDate'] == null) {
      this.exportCsvFlag = true
    } else if (this.MatterStatusReportForm.value['closeStartDate'] != null
      && this.MatterStatusReportForm.value['closeEndDate'] != null
      && this.MatterStatusReportForm.value['openStartDate'] != null
      && this.MatterStatusReportForm.value['openEndDate'] != null) {
      this.exportCsvFlag = true
    }
    else {
      this.exportCsvFlag = false;
    }
  }
  closeEndDateChange() {
    if (this.MatterStatusReportForm.value['closeStartDate'] != null && this.MatterStatusReportForm.value['closeEndDate'] != null) {
      if (this.MatterStatusReportForm.value.closeStartDate > this.MatterStatusReportForm.value.closeEndDate) {
        this.MatterStatusReportForm.patchValue({
          closeStartDate: null
        });
        this.closeReset = true;
        this.closeStartDateChange();
        setTimeout(() => {
          this.closeReset = false;
        }, 0);
      }
      if (this.MatterStatusReportForm.value['closeStartDate'] != null && this.MatterStatusReportForm.value['closeEndDate'] != null) {
        if (this.MatterStatusReportForm.value['openStartDate'] == null
          || this.MatterStatusReportForm.value['openEndDate'] == null) {
          this.exportCsvFlag = false
        } else {
          this.exportCsvFlag = true;
        }
      }
      if (this.MatterStatusReportForm.value['closeStartDate'] != null
        && this.MatterStatusReportForm.value['closeEndDate'] != null
        && this.MatterStatusReportForm.value['openStartDate'] == null
        && this.MatterStatusReportForm.value['openEndDate'] == null) {
        this.exportCsvFlag = true;
      } else if (this.MatterStatusReportForm.value['closeStartDate'] != null
        && this.MatterStatusReportForm.value['closeEndDate'] != null
        && this.MatterStatusReportForm.value['openStartDate'] != null
        && this.MatterStatusReportForm.value['openEndDate'] != null) {
        this.exportCsvFlag = true;
      }
      else {
        this.exportCsvFlag = false;
      }
    }
  }

  isValidDateRange(){
    if (this.MatterStatusReportForm.value.openStartDate != null && this.MatterStatusReportForm.value.openEndDate != null) {
      if(this.MatterStatusReportForm.value.openStartDate > this.MatterStatusReportForm.value.openEndDate){
        this.exportCsvFlag = false;
        this.MatterStatusReportForm.get('openStartDate').setValue(null);

        this.openReset =true;
        setTimeout(() => {
          this.openReset = false;
        }, 0);
     }else{
      if(this.MatterStatusReportForm.value['closeStartDate'] != null || this.MatterStatusReportForm.value['closeEndDate'] != null){
        this.exportCsvFlag = false;
      }else{
        this.exportCsvFlag = true;
      }
     }
    }

    if (this.MatterStatusReportForm.value.closeStartDate != null && this.MatterStatusReportForm.value.closeEndDate != null) {
      this.exportCsvFlag = false;
      if(this.MatterStatusReportForm.value.closeStartDate > this.MatterStatusReportForm.value.closeEndDate){
        this.exportCsvFlag = false;
        this.MatterStatusReportForm.get('closeStartDate').setValue(null);
        this.closeReset =true;
        setTimeout(() => {
          this.closeReset = false;
        }, 0);
      }else if(this.MatterStatusReportForm.value.openStartDate != null && this.MatterStatusReportForm.value.openEndDate != null){
        if(this.MatterStatusReportForm.value.openEndDate < this.MatterStatusReportForm.value.closeStartDate && this.MatterStatusReportForm.value.openEndDate < this.MatterStatusReportForm.value.closeEndDate){
          this.exportCsvFlag = true;
        }else{
          this.exportCsvFlag = false;
          this.MatterStatusReportForm.get('openStartDate').setValue(null);
          this.MatterStatusReportForm.get('openEndDate').setValue(null);

          this.openReset =true;
          this.openEndReset =true;
          setTimeout(() => {
            this.openReset = false;
            this.openEndReset = false;
          }, 0);
        }
      }else{
        if(this.MatterStatusReportForm.value.openStartDate != null || this.MatterStatusReportForm.value.openEndDate != null){
          this.exportCsvFlag = false;
        }else{
          this.exportCsvFlag = true;
        }
      }
    }
  }
}
