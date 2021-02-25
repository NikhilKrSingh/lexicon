import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { EmployeeService } from '../../../../../../common/swagger-providers/services/employee.service';

@Component({
  selector: 'app-employee-profile-base-rate',
  templateUrl: './employee-profile-base-rate.component.html',
  styleUrls: ['./employee-profile-base-rate.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class EmployeeProfileBaseRateComponent implements OnInit, OnChanges {
  @Input() employee: any;
  @Input() permissionList: any;
  @Output() readonly reloadEmployee = new EventEmitter();

  isEditMode: boolean;
  formSubmitted: boolean;
  loading: boolean;
  jobFamilyBaseRate: any;
  jobFamilyDetail: any;

  constructor(
    private employeeService: EmployeeService,
    private toastrService: ToastDisplay
  ) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.employee && changes.employee.currentValue) {
      this.employee.jobFamilyBaseRate = Number(this.employee.jobFamilyBaseRate).toFixed(2);
      this.jobFamilyBaseRate = this.employee.jobFamilyBaseRate;
      this.getJobFamilyDetail();
    }
  }

  editRate() {
    this.isEditMode = true;
  }

  getJobFamilyDetail() {
    this.employeeService.v1EmployeeJobFamilyJobfamilyidGet({jobfamilyid: this.employee.jobFamily})
      .subscribe((result: any) => {
        this.jobFamilyDetail = JSON.parse(result).results;
        this.jobFamilyDetail.baseRate = Number(this.jobFamilyDetail.baseRate).toFixed(2);
      });
  }

  setCurrencyValue() {
    if (this.jobFamilyBaseRate) {
      this.jobFamilyBaseRate = Number(this.jobFamilyBaseRate).toFixed(2);
    } else {
      this.jobFamilyBaseRate = null;
    }
  }

  setJobFamilyBaseRate() {
    this.jobFamilyBaseRate = this.employee.jobFamilyBaseRate;
  }

  saveRate() {
    this.formSubmitted = true;
    if (!this.jobFamilyBaseRate) {
      return;
    }
    this.loading = true;
    this.employee.jobFamilyBaseRate = parseFloat(this.jobFamilyBaseRate);
    this.employee.jobFamilyIsCustom = this.jobFamilyBaseRate !== this.jobFamilyDetail.baseRate;
    this.employeeService.v1EmployeePut$Json({body: this.employee}).subscribe(() => {
      this.loading = false;
      this.isEditMode = false;
      this.toastrService.showSuccess('Base rate updated.');
    }, () => {
      this.loading = false;
    });
  }

  cancel() {
    this.isEditMode = false;
    this.jobFamilyBaseRate = this.employee.jobFamilyBaseRate;
  }

}
