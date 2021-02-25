import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import * as errorData from '../../shared/error.json';

@Component({
  selector: 'app-date-range-report',
  templateUrl: './date-range-report.component.html',
  styleUrls: ['./date-range-report.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DateRangeReportComponent implements OnInit {
  DateRangeReportForm: FormGroup;
  noDataToDisplay = false;
  exportCsvFlag = false;
  reset: boolean = false;
  @Output() readonly startDate = new EventEmitter<any>();
  @Output() readonly endDate = new EventEmitter<any>();
  @Input() title: string = 'Date Range';
  @Input() type: string = null ;
  @Input() startEndDateAsTodayFlag: boolean = false;
  @Input() startDateError = false;
  public errorData: any = (errorData as any).default;


  constructor(
    private modalService: NgbModal,
    private formBuilder: FormBuilder, ) { }

  ngOnInit() {
    if(this.type == 'writeoff'){
      this.title = 'Write-Off Date Range' ;
    }
    this.DateRangeReportForm = this.formBuilder.group({
      startDate: [null, Validators.required],
      endDate: [null, Validators.required]
    });
    this.DateRangeReportForm.controls['endDate'].setValue(new Date());
    this.endDateChange();
    if(this.startEndDateAsTodayFlag){
      this.DateRangeReportForm.controls['startDate'].setValue(new Date());
    this.startDateChange();
    }
  }

  get currentDate() {
    const currentDate = new Date();
    return currentDate.toISOString().substring(0, 10);
  }
  startDateChange() {
    this.startDate.emit(this.DateRangeReportForm.value.startDate);
  }

  endDateChange() {
    this.endDate.emit(this.DateRangeReportForm.value.endDate);
    if (moment(this.DateRangeReportForm.value.startDate).isAfter(moment(this.DateRangeReportForm.value.endDate), 'd')) {
      this.DateRangeReportForm.patchValue({
        startDate: null
      });
      this.startDate.emit(this.DateRangeReportForm.value.startDate);
      this.reset = true;
      this.startDateChange();
      setTimeout(() => {
        this.reset = false;
      }, 0);
    }
  }

}
