import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IOffice } from 'src/app/modules/models';
import * as errors from 'src/app/modules/shared/error.json';
import { vwEmployee } from 'src/common/swagger-providers/models';
import { EmployeeService, MiscService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-edit-personal-info',
  templateUrl: './personal-info.component.html'
})
export class EditPersonalInfoComponent implements OnInit {
  employee: vwEmployee;
  public employeeForm: FormGroup;
  public practiceList: Array<IOffice> = [];
  public titlePracticeArea = 'Practice Area(s)';
  public filterName = 'Apply';
  public retainerPracticeArea: Array<number> = [];
  public practiceListIC: Array<IOffice> = [];
  public titlePracticeAreai = 'Practice Area(s)';
  public initialConsulPracticeArea: Array<number> = [];
  public formSubmitted = false;
  public jobList:any =[];
  public jselected:any;
  public loading: boolean = false;
  public showDoNotScheduleWarning = false;

  errorData = (errors as any).default;
  baseRate: any;
  isCustom: boolean;
  constructor(
    private employeeService: EmployeeService,
    private activeModal: NgbActiveModal,
    private toaster: ToastDisplay,
    private builder: FormBuilder,
    private misc: MiscService,
  ) {
    this.initializeEmployeeForm();
  }

  /**** initialize employee form */
  initializeEmployeeForm() {
    this.employeeForm = this.builder.group({
      firstName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      middleName: new FormControl('', [Validators.maxLength(1000)]),
      lastName: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      maidenName:  new FormControl('', [Validators.maxLength(100)]),
      nickName: new FormControl('', [Validators.maxLength(100)]),
      commonName:  new FormControl('', [Validators.maxLength(100)]),
      jobTitle: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      jobFamily: new FormControl('', [Validators.required]),
      doNotSchedule: new FormControl(false,[]),
      retainer: new FormControl(false, []),
      initialConsultations: new FormControl(false, []),
    });
  }

  get f() {
    return this.employeeForm.controls;
  }

  async ngOnInit() {
    await this.getEmployeeCheckActiveMatter()
    await this.getJobList();
    await this.getPractices();
    await this.prefilledEmployeeForm();
    this.employeeForm.controls.jobFamily.valueChanges.subscribe((value) => {
      const selectedJobFamily = this.jobList.filter(jobItem => jobItem.id === value)[0];
      if (selectedJobFamily) {
        this.employee.jobFamilyName = selectedJobFamily.name;
        if (selectedJobFamily.id !== this.employee.jobFamily) {
          this.baseRate = selectedJobFamily.baseRate;
          this.isCustom = false;
        } else {
          this.baseRate = this.employee.jobFamilyBaseRate;
          this.isCustom = this.employee.jobFamilyIsCustom;
        }
      }
    });
  }

  /**
   * Get practice list
   *
   * @memberof GeneralinfoComponent
   */
  public getPractices() {
    this.loading = true;
    this.misc.v1MiscPracticesGet$Response({}).subscribe(suc => {
      let res: any = suc;
      this.practiceList = JSON.parse(res.body).results;
      this.practiceListIC = Object.assign([], JSON.parse(res.body).results);
      this.retainerPracticeArea = [];
      this.initialConsulPracticeArea = [];
      if (this.employee.retainerPracticeAreas && this.employee.retainerPracticeAreas.length) {
        this.employee.retainerPracticeAreas.forEach((emp) =>{
          this.retainerPracticeArea.push(emp['id']);
        });
        this.practiceList.forEach((value, index, self) => {
          if (this.retainerPracticeArea.includes(value['id'])) {
            this.practiceList[index].checked = true;
          }
        });
        this.titlePracticeArea = '' + this.employee.retainerPracticeAreas.length;
      }
      if (this.employee.initialConsultPracticeAreas && this.employee.initialConsultPracticeAreas.length) {
        this.employee.initialConsultPracticeAreas.forEach((emp) =>{
          this.initialConsulPracticeArea.push(emp['id']);
        });
        this.practiceListIC.forEach((value, index, self) => {
          if (this.initialConsulPracticeArea.includes(value['id'])) {
            this.practiceListIC[index].checked = true;
          }
        });
        this.titlePracticeAreai = '' + this.employee.initialConsultPracticeAreas.length;
      }
      this.loading = false;
    }, err => {
      this.loading = false;
      console.log(err);
    });
  }

  /*** function to prefilled employee form value */
  prefilledEmployeeForm() {
    if (this.employee) {
      this.employeeForm.patchValue({
        firstName: (this.employee.firstName) ? this.employee.firstName : '',
        middleName: (this.employee.middleName) ? this.employee.middleName : '',
        lastName: (this.employee.lastName) ? this.employee.lastName : '',
        maidenName: (this.employee.maidenName) ? this.employee.maidenName : '',
        nickName: (this.employee.nickName) ? this.employee.nickName : '',
        commonName: (this.employee.commonName) ? this.employee.commonName : '',
        jobTitle: (this.employee.jobTitle) ? this.employee.jobTitle : '',
        jobFamily: (this.employee.jobFamily) ? this.employee.jobFamily : '',
        doNotSchedule: (this.employee.doNotSchedule) ? this.employee.doNotSchedule : false,
        retainer: !!(this.employee.retainerPracticeAreas && this.employee.retainerPracticeAreas.length),
        initialConsultations: !!(this.employee.initialConsultPracticeAreas && this.employee.initialConsultPracticeAreas.length)});
    }
  }

  dismiss(reason: string) {
    this.activeModal.dismiss(reason);
  }

  private validatePersonalInfo() {
    let isValid = true;
    if (!this.employee.firstName || !this.employee.lastName || !this.employee.jobTitle) {
      isValid = false;
    }
    return isValid;
  }

  /**
   * Save employee details
   *
   * @param {*} value
   * @memberof EditPersonalInfoComponent
   */
  save(value: any) {
    this.formSubmitted = true;
    if (this.employeeForm.valid) {
      this.employee = Object.assign(this.employee, value);
      if (value.retainer && this.retainerPracticeArea.length == 0) {
        return;
      }
      if (value.initialConsultations && this.initialConsulPracticeArea.length == 0) {
        return;
      }
      if (value.retainer && this.retainerPracticeArea.length > 0) {
        this.employee['retainerPracticeAreas'] = this.retainerPracticeArea.map(obj => {
          return {id: +obj};
        });
      } else {
        this.employee['retainerPracticeAreas'] = [];
        this.employee['groups'] = this.employee['groups'].filter(obj => obj.name !== 'Responsible Attorney');
      }
      if (value.initialConsultations && this.initialConsulPracticeArea.length > 0) {
        this.employee['initialConsultPracticeAreas'] = this.initialConsulPracticeArea.map((obj) => {
          return {id: +obj};
        });
      } else {
        this.employee['initialConsultPracticeAreas'] = [];
        this.employee['groups'] = this.employee['groups'].filter(obj => obj.name !== 'Consult Attorney');
      }
      this.employee.jobFamilyBaseRate = this.baseRate;
      this.employee.jobFamilyIsCustom = this.isCustom;
      this.activeModal.close(this.employee);
    }
  }

   /**
   * retainer practice area selected
   *
   * @param {*} event
   * @memberof GeneralinfoComponent
   */
  public retainerSelected(event) {
    this.titlePracticeArea = '';
    if (event.length > 0) {
      this.titlePracticeArea = event.length;
    } else {
      this.titlePracticeArea = 'Practice Area(s)';
    }
  }

  /**
   * Clear selected drop down of Retainer
   *
   * @memberof GeneralinfoComponent
   */
  public clearFilterRetainer() {
    this.retainerPracticeArea = [];
    this.practiceList.forEach(item => (item.checked = false));
    this.titlePracticeArea = 'Practice Area(s)';
  }

  /**
   * initial consultant practice area selected
   *
   * @param {*} event
   * @memberof GeneralinfoComponent
   */
  public initialConsulSelected(event) {
    this.titlePracticeAreai = '';
    if (event.length > 0) {
      this.titlePracticeAreai = event.length;
    } else {
      this.titlePracticeAreai = 'Practice Area(s)';
    }
  }

  public onMultiSelectSelectedOptions(event) {
  }

  /**
   * Clear selected drop down of initial consultant
   *
   * @memberof GeneralinfoComponent
   */
  public clearFilterInitialConsul() {
    this.initialConsulPracticeArea = [];
    this.practiceListIC.forEach(item => (item.checked = false));
    this.titlePracticeAreai = 'Practice Area(s)';
  }

  public applyFilter() {}
  getJobList(){
    this.employeeService.v1EmployeeJobFamilyGet$Response({}).subscribe(
      suc => {
        let res: any = suc;
        let response = JSON.parse(res.body);
          this.jobList = response.results;
      },
      err => {
        console.log(err);
      }
    );
  }
  getEmployeeCheckActiveMatter(){
    this.employeeService.v1EmployeeCheckActiveMattersAndPcIdPut$Response({id:this.employee.id}).subscribe(
      suc => {
        let res: any = suc;
        let response = JSON.parse(res.body);
        this.showDoNotScheduleWarning = response.results;
      },
      err => {
        console.log(err);
      }
    );
  }
}
