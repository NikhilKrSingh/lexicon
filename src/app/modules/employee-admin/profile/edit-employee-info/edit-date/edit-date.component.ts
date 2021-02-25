import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IOffice } from 'src/app/modules/models';
import { vwEmployee } from 'src/common/swagger-providers/models';
import * as errorData from '../../../../shared/error.json';

@Component({
  selector: 'app-edit-dates',
  templateUrl: './edit-date.component.html'
})

export class EditDatesComponent implements OnInit {
  public employee: vwEmployee;
  public employeeList: Array<IOffice> = [];
  public employmentStartdt: any;
  public employmentEnddt: any;
  public errorData: any = (errorData as any).default;
  public formSubmitted = false;

  constructor(
    private activeModal: NgbActiveModal,
    private toastDisplay: ToastDisplay
  ) { }

  ngOnInit() {
    if (this.employee.employmentStartDate) {
      this.employmentStartdt = this.employee.employmentStartDate;
    }

    if (this.employee.employmentEndDate) {
      this.employmentEnddt = this.employee.employmentEndDate;
    }

    if(this.employee.isVisible) {
      this.employmentEnddt = null;
    }
  }

  get isStartDateGreaterThanEndDate() {
    return this.employmentStartdt && this.employmentEnddt && moment(this.employmentStartdt) > moment(this.employmentEnddt)
  }

  /**
   *Close model
   *
   * @param {*} reason
   * @memberof EditDatesComponent
   */
  dismiss(reason) {
    this.activeModal.dismiss(reason);
  }

  /**
   * Save employee
   *
   * @memberof EditDatesComponent
   */
  save() {
    this.formSubmitted = true;
    if (this.isStartDateGreaterThanEndDate || !this.employmentStartdt) {
      return;
    } else {
      this.employee['employmentStartDate'] = moment(this.employmentStartdt).format("YYYY-MM-DD") + 'T00:00:00.000Z';
      if (this.employmentEnddt) {
        this.employee['employmentEndDate'] = moment(this.employmentEnddt).format("YYYY-MM-DD") + 'T00:00:00.000Z';
      } else {
        this.employee.employmentEndDate = this.employmentEnddt;
      }
      this.activeModal.close(this.employee);
    }
  }
}
