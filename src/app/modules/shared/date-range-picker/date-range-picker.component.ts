import {
  Component,
  ElementRef,
  EventEmitter,
  Input, OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import * as moment from 'moment';
import { DaterangepickerComponent } from 'ngx-daterangepicker-material';
import { ToastDisplay } from 'src/app/guards/toast-service';

@Component({
  selector: 'app-date-range-picker',
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DateRangePickerComponent implements OnInit, OnChanges {

  @ViewChild('picker2', {static: false}) picker2: DaterangepickerComponent;
  @Output() readonly dateChange = new EventEmitter();
  @Output() readonly lifeofMatterChange = new EventEmitter();
  @Input() placeholderText:string = 'Life Of Matter';
  @Input() lifeofMatter = true;
  dateRange: any = {};
  isShow: boolean;
  test: any;
  startDate = moment();
  endDate = moment();
  constructor(private toast:ToastDisplay) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.lifeofMatter && changes.lifeofMatter.currentValue) {
      this.choosedDate();
    }
  }

  choosedDate(event?: any) {
    this.lifeofMatterChange.emit(this.lifeofMatter);
    if(this.lifeofMatter) {
      this.startDate = moment();
      this.endDate = moment();
      this.placeholderText = this.placeholderText;
    } else {
      if (event) {
        this.startDate = moment(event.startDate);
        this.endDate = moment(event.endDate);
        this.placeholderText = event.chosenLabel;
        this.setDate();
      } else {
        this.startDate = moment();
        this.endDate = moment();
        this.placeholderText = this.formatDate(this.startDate) + ' - ' + this.formatDate(this.endDate);
        this.setDate();
      }
    }
    if(this.picker2){
      this.picker2.setStartDate(this.startDate);
      this.picker2.setEndDate(this.endDate);
      this.picker2.updateView();
    }
  }


  setDate(){
    let startDate = this.formatDate(this.startDate);
    let endDate = this.formatDate(this.endDate);
    this.dateChange.emit({startDate, endDate});
  }

  formatDate(date){
    return moment(date).format('MM/DD/YYYY');
  }

  show(flag){
    if(flag) {
      this.isShow = !this.isShow;
    }
  }
  closeDateRange(){
    this.isShow = false;
  }

  dontAllow(){
    return false;
  }
}
