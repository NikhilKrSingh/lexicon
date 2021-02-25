import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import * as moment from 'moment';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import * as errorData from '../../shared/error.json';

@Component({
  selector: 'app-insufficient-funds-report',
  templateUrl: './insufficient-funds-report.component.html',
  styleUrls: ['./insufficient-funds-report.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class InsufficientFundsReportComponent implements OnInit {
  public dateRangeList: any[] = [{ id: 1, name: 'Posting Date Range'}, { id: 2, name: 'Transaction Date Range'}];
  public selectedDateRange: number = 1;
  public loading: boolean = false;
  public _startDate: string = null;
  public _endDate: string = null;
  public columnList: any[] = [
    {
      Name: 'transactionDate',
      displayName: 'Transaction Date'
    },
    {
      Name: 'postingDate',
      displayName: 'Posting Date'
    },
    {
      Name: 'transactionID',
      displayName: 'Transaction ID'
    },
    {
      Name: 'transactionType',
      displayName: 'Transaction Type'
    },
    {
      Name: 'checkNumber',
      displayName: 'Check Number'
    },
    {
      Name: 'clientNumber',
      displayName: 'Client Number'
    },
    {
      Name: 'clientName',
      displayName: 'Client Name'
    },
    {
      Name: 'matterNumber',
      displayName: 'Matter Number'
    },
    {
      Name: 'matterName',
      displayName: 'Matter Name'
    },
    {
      Name: 'practiceArea',
      displayName: 'Practice Area'
    },
    {
      Name: 'matterType',
      displayName: 'Matter Type'
    },
    {
      Name: 'officeName',
      displayName: 'Office Name'
    },
    {
      Name: 'status',
      displayName: 'Status'
    },
    {
      Name: 'attemptedAmount',
      displayName: 'Attempted Amount'
    },
    {
      Name: 'declineReasonCode',
      displayName: 'Decline Reason Code'
    },
    {
      Name: 'declineReasonDescription',
      displayName: 'Decline Reason Description'
    }
  ];
  public formSubmitted: boolean = false;
  public startDateError: boolean = false;
  public errorData: any = (errorData as any).default;


  constructor(
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService
    ) { }

  ngOnInit() {
  }

  public startDate(e){
    if(e) {
      this.startDateError = false;
    }
    this._startDate = e;
  }

  public endDate(e) {
    this._endDate = e;
  }

  public submitInsufficientFundsReport() {
    this.formSubmitted = true;
    if(!this.selectedDateRange || !this._startDate || !this._endDate) {
      if(!this._startDate) {
        this.startDateError = true;
        return;
      }
      return;
    }
    this.generateInsufficientFundsReport();
    this.formSubmitted = false;
  }

  public async generateInsufficientFundsReport() {
    let body: any = null;
    switch(+this.selectedDateRange) {
      case 1:
        body = {
          postEndDate: this._endDate,
          postStartDate: this._startDate,
        }
        break;
      case 2:
        body = {
          transactionEndDate: this._endDate,
          transactionStartDate: this._startDate,
        }
    }
    this.loading = true;
    try {
      let resp: any = await this.reportService
        .v1ReportInsufficientFundsReportPost$Json({ body })
        .toPromise();
        resp = JSON.parse(resp as any).results;
        if(resp && resp.length) {
          if(this.selectedDateRange == 1) {
            resp.sort((a, b) => {
              return moment(a.postingDate).isSameOrBefore(b.postingDate);
            });
          } else {
            resp.sort((a, b) => {
              return moment(a.transactionDate).isSameOrBefore(b.transactionDate);
            });
          }
        }
        this.ExportToCSV('Insufficient Fund Report', resp, this.columnList);
        this.loading = false;
    } catch (error) {
      this.loading = false;
    }
  }

  ExportToCSV(fileName, rows, columnList) {
    const selectedrows = Object.assign([], rows);
    this.exporttocsvService.downloadReportFile(
      selectedrows,
      columnList,
      fileName
    );
  }
}
