import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import * as moment from 'moment';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { SelectService } from 'src/app/service/select.service';

@Component({
  selector: 'app-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DatePickerComponent implements OnInit, OnChanges {
  @Input() isNgModel = false;
  @Input() data: any;
  @Output() readonly dataChange = new EventEmitter<any>();

  @Input() isForm = false;
  @Input() dateform: FormGroup;
  @Input() controlName: string;

  @Input() isFormControl = false;
  @Input() dateFormControl: FormControl;

  @Input() placeholderText: string = 'mm/dd/yyyy';
  @Input() isDisabled = false;
  @Input() minDate: any;
  @Input() maxDate: any;

  @Input() disableInput = false;
  @Input() dateTimeFilter: (d: Date) => boolean;
  @Input() id: string = 'date-picker-app';
  @Input() page: string = null;

  dateRegEx = /^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}$/;
  dateRegEx1 = /^[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2}$/;

  localDate: any;
  localdata: string;

  readonly DT_FORMAT = 'MM/DD/YYYY';

  @Input() set reset(reset: boolean) {
    if(reset){
      this.localdata = null;
    }
  }

  constructor(private toastr: ToastDisplay,
  private selectService: SelectService) {
    this.dateTimeFilter = (d: Date) => {
      return true;
    }
  }

  ngOnInit() {
    if (this.maxDate && this.page === 'clientretention') {
      this.maxDate = new Date(this.maxDate.getFullYear(), this.maxDate.getMonth(), this.maxDate.getDate(), 23, 0, 0, 0);
    }

    if (this.isNgModel) {
      this.localDate = this.data;
      if (this.localDate) {
        this.localdata = moment(this.data).format(this.DT_FORMAT);
      }
    }

    if (this.isForm) {
      this.localDate = this.dateControl.value;
      if (this.localDate) {
        this.localdata = moment(this.dateControl.value).format(this.DT_FORMAT);
      }

      this.isDisabled = this.dateControl.disabled;

      this.dateControl.valueChanges.subscribe(res => {
        this.localDate = res;
        if (this.localDate) {
          this.localdata = moment(res).format(this.DT_FORMAT);
        } else {
          this.localdata = null;
        }
      });
    }

    if (this.isFormControl) {
      this.localDate = this.dateFormControl.value;
      if (this.localDate) {
        this.localdata = moment(this.dateFormControl.value).format(
          this.DT_FORMAT
        );
      }

      this.isDisabled = this.dateFormControl.disabled;
    }
  }

  ngOnChanges() {
    if (this.isNgModel) {
      this.localDate = this.data;
      if (this.localDate) {
        this.localdata = moment(this.data).format(this.DT_FORMAT);
      } else {
        this.localdata = null;
      }
    }
  }

  get dateControl() {
    if (this.dateform && this.controlName) {
      return this.dateform.controls[this.controlName];
    }
  }

  changeDate() {
    if (typeof this.localDate === 'string') {
      this.localdata = moment(this.localDate).format(this.DT_FORMAT);
    } else {
      let date = this.localDate;
      if (date.year) {
        this.localdata = moment([date.year, date.month - 1, date.day]).format(
          this.DT_FORMAT
        );
      } else {
        this.localdata = moment(date).format(this.DT_FORMAT);
      }
    }
    this.selectService.newSelection('clicked!');

    this.setDate();
  }

  onDateBlur() {
    if (this.localdata) {
      let mt = moment(this.localdata, this.DT_FORMAT);
      if (!mt.isValid()) {
        this.toastr.showError('Enter a valid date');
        this.setDate(false);
      } else {
        if (this.maxDate && moment(this.maxDate).isBefore(mt, 'd')) {
          this.toastr.showError('Enter a valid date');
          this.setDate(false);
        } else if (
          this.dateRegEx.test(this.localdata) ||
          this.dateRegEx1.test(this.localdata)
        ) {
          if (this.dateRegEx.test(this.localdata)) {
            this.setDate();
          } else {
            this.localdata = this.formatDate(this.localdata);
            this.setDate();
          }
        } else {
          this.toastr.showError('Enter a valid date');
          this.setDate(false);
        }
      }
    } else {
      this.setDate(false);
    }
  }

  formatDate(value: string) {
    let x = new Date();
    let year = x
      .getUTCFullYear()
      .toString()
      .substr(0, 2);

    return (
      value.substring(0, value.lastIndexOf('/') + 1) + year + value.substr(-2)
    );
  }

  setDate(isValid = true) {
    if (isValid) {
      if (this.isNgModel) {
        this.dataChange.emit(this.correctDate);
      }

      if (this.isForm) {
        this.dateControl.setValue(this.correctDate);
        this.dateform.updateValueAndValidity();
        this.dataChange.emit(this.correctDate);
      }

      if (this.isFormControl) {
        this.dateFormControl.setValue(this.correctDate);
        this.dateFormControl.updateValueAndValidity();
        this.dataChange.emit(this.correctDate);
      }
    } else {
      if (this.isNgModel) {
        this.dataChange.emit(null);
      }

      if (this.isForm) {
        this.dateControl.setValue(null);
        this.dateform.updateValueAndValidity();
        this.dataChange.emit(null);
      }

      if (this.isFormControl) {
        this.dateFormControl.setValue(null);
        this.dateFormControl.updateValueAndValidity();
        this.dataChange.emit(null);
      }

      this.localdata = null;
      this.localDate = null;
    }
  }

  get correctDate() {
    try {
      if (this.localdata) {
        return  moment(this.localdata).format('YYYY-MM-DD') + 'T00:00:00';
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }
}
