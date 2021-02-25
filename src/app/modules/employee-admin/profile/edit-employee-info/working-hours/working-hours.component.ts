import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwEmployee } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-edit-working-hours',
  templateUrl: './working-hours.component.html'
})
export class EditWorkingHoursComponent implements OnInit {
  public employee: vwEmployee;

  constructor(
    private activeModal: NgbActiveModal,
    private toaster: ToastDisplay
  ) {}

  ngOnInit() {}

  dismiss(reason: string) {
    this.activeModal.dismiss(reason);
  }

  /**
   * Validates Each Open and Close Hours
   */
  private validateWorkingHours() {
    let isValid = true;

    if (
      !this.isValidOfficeHours(
        this.employee.sundayOpenHours,
        this.employee.sundayCloseHours
      )
    ) {
      isValid = false;
    }

    if (
      !this.isValidOfficeHours(
        this.employee.mondayOpenHours,
        this.employee.mondayCloseHours
      )
    ) {
      isValid = false;
    }

    if (
      !this.isValidOfficeHours(
        this.employee.tuesdayOpenHours,
        this.employee.tuesdayCloseHours
      )
    ) {
      isValid = false;
    }

    if (
      !this.isValidOfficeHours(
        this.employee.wednesdayOpenHours,
        this.employee.wednesdayCloseHours
      )
    ) {
      isValid = false;
    }

    if (
      !this.isValidOfficeHours(
        this.employee.thursdayOpenHours,
        this.employee.thursdayCloseHours
      )
    ) {
      isValid = false;
    }

    if (
      !this.isValidOfficeHours(
        this.employee.fridayOpenHours,
        this.employee.fridayCloseHours
      )
    ) {
      isValid = false;
    }

    if (
      !this.isValidOfficeHours(
        this.employee.saturdayOpenHours,
        this.employee.saturdayCloseHours
      )
    ) {
      isValid = false;
    }

    return isValid;
  }

  private isValidOfficeHours(open: string, close: string) {
    if (open == close) {
      return true;
    } else {
      return +new Date(open) <= +new Date(close);
    }
  }

  save() {
    let isValid = this.validateWorkingHours();
    if (isValid) {
      this.activeModal.close(this.employee);
    } else {
      this.toaster.showError('Please select valid hours');
    }
  }
}
