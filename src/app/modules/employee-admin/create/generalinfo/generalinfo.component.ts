import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild, } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IEmployeeCreateStepEvent, IOffice, IPRofile } from 'src/app/modules/models';
import * as Constant from 'src/app/modules/shared/const';
import { REGEX_DATA } from 'src/app/modules/shared/const';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { vwIdCodeName } from 'src/common/swagger-providers/models.js';
import { EmployeeService, MiscService, SecurityGroupService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../shared/error.json';
import { fromEvent } from 'rxjs';
import { debounceTime, take } from 'rxjs/operators';
@Component({
  selector: 'app-generalinfo',
  templateUrl: './generalinfo.component.html',
  styleUrls: ['./generalinfo.component.scss']
})
export class GeneralinfoComponent implements OnInit {
  @Output() readonly nextStep = new EventEmitter<IEmployeeCreateStepEvent>();
  public employeeForm: FormGroup;
  public profileImage: File;
  @ViewChild('profileImageInput', {static: false}) public profileImageInput: ElementRef<HTMLInputElement>;
  public primaryPhoneNumberBlur = false;
  public cellPhoneNumberBlur = false;
  public faxBlur = false;
  public errorData: any = (errorData as any).default;
  public title = 'Secondary Office(s)';
  public titlePracticeArea = 'Practice Area(s)';
  public filterName = 'Apply Filter';
  public sndryOfficeSelected: Array<number> = [];
  public groupsSelected: Array<number> = [];
  public retainerPracticeArea: Array<number> = [];
  public initialConsulPracticeArea: Array<number> = [];
  public practiceList: Array<IOffice> = [];
  public practiceListIC: Array<IOffice> = [];
  public stateList: Array<vwIdCodeName> = [];
  public groupList: Array<IOffice> = [];
  public groupListAll: Array<IOffice> = [];
  public employeeList: Array<IOffice> = [];
  public titlePracticeAreai = 'Practice Area(s)';
  public groupsTitle = 'Add employee to a Group';
  public consultAttorneyGroup: IOffice;
  public employeeGroup: IOffice;
  public responsibleAttorneyGroup: IOffice;
  public userDetails: IPRofile;
  public officeList: Array<IOffice>;
  public employmentStartdt: any;
  public employmentEnddt: any = null;
  public minDate: any;
  public isDoNotSchedule = false;
  public callFlag = true;
  public tempFormData: any;
  public emailExistence: boolean;
  public noEmployees: boolean;
  public reporting_relations: boolean;
  public formSubmitted = false;
  public jobList: any = [];
  public groupValidation = false;
  public offsetValue;
  public topbarHeight: number;
  profileImageSrc: string | ArrayBuffer;
  uploadProfileSizeErrorWarning: boolean;


  constructor(
    private builder: FormBuilder,
    private misc: MiscService,
    private employeeService: EmployeeService,
    private toastDisplay: ToastDisplay,
    private securityGroupService: SecurityGroupService,
    private el: ElementRef,
  ) {
  }

  ngOnInit() {
    this.createForm();
    this.getJobList();
    this.userDetails = JSON.parse(localStorage.getItem('profile'));
    this.tempFormData = UtilsHelper.getObject('employee_general');
    if (this.tempFormData && this.tempFormData.data) {
      this.updateEmployeeForm(this.tempFormData.data);
    }
    this.getOffices();
    this.getPractices();
    this.getState();
    this.getEmployees();
    this.getSecurityGroup();
  }

  ngAfterViewInit() {
    // const elements = document.querySelectorAll('.scrolling-steps');
    // this.offsetValue =
    //   elements && elements.length > 0 ? elements[0].getBoundingClientRect() : 0;
    const ele = document.querySelectorAll('.top-bar');
    this.topbarHeight =
      ele && ele.length > 0 ? ele[0].getBoundingClientRect().height : 0;
  }


  private scrollToFirstInvalidControl() {
    const firstInvalidControl: HTMLElement = this.el.nativeElement.querySelector(
      '.emp-frm .ng-invalid'
    );
    if (firstInvalidControl) {
      window.scroll({
        top: this.getTopOffset(firstInvalidControl),
        left: 0,
        behavior: 'smooth'
      });
      fromEvent(window, 'scroll')
        .pipe(debounceTime(100), take(1))
        .subscribe(() => firstInvalidControl.focus());
    }
  }
  private getTopOffset(controlEl: HTMLElement): number {
    const labelOffset = 300;
    return (
      controlEl.getBoundingClientRect().top +
      window.scrollY -
      ( this.topbarHeight + labelOffset)
    );
  }

  /***
   * function to create employee form
   */
  createForm(): void {
    this.employeeForm = this.builder.group({
      firstName: new FormControl('', [Validators.required, Validators.maxLength(100), PreventInject]),
      middleName: new FormControl('', [Validators.maxLength(100), PreventInject]),
      lastName: new FormControl('', [Validators.required, Validators.maxLength(100), PreventInject]),
      maidenName: new FormControl('', [Validators.maxLength(100), PreventInject]),
      nickName: new FormControl('', [Validators.maxLength(100), PreventInject]),
      commonName: new FormControl('', [Validators.maxLength(100), PreventInject]),
      email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(100), Validators.pattern(REGEX_DATA.Email), PreventInject]),
      jobTitle: new FormControl('', [Validators.required, Validators.maxLength(100), PreventInject]),
      jobFamily: new FormControl(null, [Validators.required]),
      primaryPhoneNumber: new FormControl('', [Validators.required, Validators.maxLength(10)]),
      cellPhoneNumber: new FormControl('', [Validators.maxLength(10)]),
      fax: new FormControl('', [Validators.maxLength(10)]),
      primaryOffice: new FormControl(null, [Validators.required]),
      retainer: new FormControl(false, []),
      initialConsultations: new FormControl(false, []),
      states: new FormArray([]),
      employmentStartDate: new FormControl('', [Validators.required]),
      employmentEndDate: new FormControl(null, [])
    });

  }

  /***
   * function to add validators employee form
   */
  addFormcontrol(value): void {
    this.employeeForm.addControl('directManager', value ? new FormControl(null) : new FormControl(null));
    this.employeeForm.addControl('approvingManager', value ? new FormControl(null) : new FormControl(null));
    this.employeeForm.addControl('practiceManager', value ? new FormControl(null) : new FormControl(null));
  }

  /***
   * function to update form value
   */
  updateEmployeeForm(data: any) {
    this.employeeForm.patchValue({
      firstName: (data.firstName) ? data.firstName : '',
      middleName: (data.middleName) ? data.middleName : '',
      lastName: (data.lastName) ? data.lastName : '',
      maidenName: (data.maidenName) ? data.maidenName : '',
      nickName: (data.nickName) ? data.nickName : '',
      commonName: (data.commonName) ? data.commonName : '',
      jobTitle: (data.jobTitle) ? data.jobTitle : '',
      jobFamily: (data.jobFamily) ? data.jobFamily : null,
      email: (data.email) ? data.email : '',
      primaryPhoneNumber: (data.primaryPhoneNumber) ? data.primaryPhoneNumber : '',
      cellPhoneNumber: (data.cellPhoneNumber) ? data.cellPhoneNumber : '',
      fax: (data.fax) ? data.fax : '',
      retainer: (data.retainer) ? data.retainer : false,
      initialConsultations: (data.initialConsultations) ? data.initialConsultations : false,
      employmentStartDate: (data.employmentStartDate) ? data.employmentStartDate : null
    });
    this.isDoNotSchedule = data.DoNotSchedule;
    if (data.profileImage) {
      this.profileImage = this.readFileObject(data.profileImage);
    }
  }

  /***
   * function to check email existence
   */
  async checkEmailExistence() {
    this.emailExistence = false;
    const email = this.employeeForm.value.email;
    if (email && email.trim() != '') {
      if (this.employeeForm.controls.email.valid) {
        this.misc.v1MiscEmailCheckGet({email, id: 0})
          .subscribe((result: any) => {
            this.emailExistence = JSON.parse(result).results;
          });
      }
    }
  }

  /**
   * Get office list
   *
   */
  public getOffices() {
    this.misc.v1MiscOfficesGet$Response({}).subscribe(suc => {
      const res: any = suc;
      this.officeList = JSON.parse(res.body).results;
      if (this.tempFormData && this.tempFormData.data) {
        this.employeeForm.patchValue({
          primaryOffice: (this.tempFormData.data.primaryOffice && this.tempFormData.data.primaryOffice.id) ? this.tempFormData.data.primaryOffice.id : null
        });
        if (this.tempFormData.data.secondaryOffices && this.tempFormData.data.secondaryOffices.length) {
          const selectedOffice: any = [...new Set(this.tempFormData.data.secondaryOffices.map(it => it.id))];
          this.sndryOfficeSelected = selectedOffice;
          this.title = selectedOffice.length;
          this.officeList.map((item, index) => {
            if (this.sndryOfficeSelected.includes(item.id)) {
              this.officeList[index].checked = true;
            }
          });
        }
      }
    });
  }

  /**
   * Get practice list
   *
   */
  public getPractices() {
    this.misc.v1MiscPracticesGet$Response({}).subscribe(suc => {
      const res: any = suc;
      this.practiceList = JSON.parse(res.body).results;
      this.practiceListIC = Object.assign([], JSON.parse(res.body).results);
      if (this.tempFormData && this.tempFormData.data) {

        if (this.tempFormData.data.retainerPracticeAreas && this.tempFormData.data.retainerPracticeAreas.length) {
          const selectedretainerPractice: any = [...new Set(this.tempFormData.data.retainerPracticeAreas.map(it => it.id))];
          this.retainerPracticeArea = selectedretainerPractice;
          this.titlePracticeArea = selectedretainerPractice.length;
          this.practiceList.map((item, index) => {
            if (this.retainerPracticeArea.includes(item.id)) {
              this.practiceList[index].checked = true;
            }
          });
        }

        if (this.tempFormData.data.initialConsultPracticeAreas && this.tempFormData.data.initialConsultPracticeAreas.length) {
          const initialConsultretainerPractice: any = [...new Set(this.tempFormData.data.initialConsultPracticeAreas.map(it => it.id))];
          this.initialConsulPracticeArea = initialConsultretainerPractice;
          this.titlePracticeAreai = initialConsultretainerPractice.length;
          this.practiceListIC.map((item, index) => {
            if (this.initialConsulPracticeArea.includes(item.id)) {
              this.practiceListIC[index].checked = true;
            }
          });
        }
      }
    });
  }

  /**
   * Get state list
   *
   */
  public getState() {
    this.misc.v1MiscStatesGet$Response({}).subscribe(suc => {
      const res: any = suc;
      this.stateList = JSON.parse(res.body).results;
      if (this.tempFormData && this.tempFormData.data && this.tempFormData.data.states && this.tempFormData.data.states.length) {
        const selectedStates: any = [...new Set(this.tempFormData.data.states.map(it => it.id))];
        const formArray: FormArray = this.employeeForm.get('states') as FormArray;
        selectedStates.forEach(element => {
          formArray.push(new FormControl(element));
        });
        this.stateList.map((item, index) => {
          if (selectedStates.includes(item.id)) {
            this.stateList[index]['checked'] = true;
          }
        });
      }
    });
  }

  public getSecurityGroup() {
    this.securityGroupService.v1SecurityGroupGet({})
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res) => {
        if (res && res.length > 0) {
          this.employeeGroup = res.find(item => item.name === 'Employee');
          this.consultAttorneyGroup = res.find(item => item.name === 'Consult Attorney');
          this.responsibleAttorneyGroup = res.find(item => item.name === 'Responsible Attorney');
          this.groupList = res.filter(data => !data.readOnly && data.isVisible);
          if (this.tempFormData && this.tempFormData.data && this.tempFormData.data.groups.length > 1) {
            const selectedGroups = this.tempFormData.data.groups.filter(item => item.id !== this.employeeGroup.id && item.id !== this.consultAttorneyGroup.id && item.id !== this.responsibleAttorneyGroup.id);
            if (selectedGroups && selectedGroups.length > 0) {
              const ids = selectedGroups.map(obj1 => obj1.id);
              this.groupList.map(item => {
                if (ids.indexOf(item.id) > -1) {
                  item.checked = true;
                  item.disabled = false;
                  this.groupsSelected.push(item.id);
                }
              });
              this.checkGroupSelected();
            }
          }
        }
      });
  }

  /**
   * Get employee list
   *
   */
  public getEmployees() {
    this.misc.v1MiscEmployeesActiveGet$Response({}).subscribe(suc => {
      const res: any = suc;
      this.employeeList = JSON.parse(res.body).results;
      this.noEmployees = (this.employeeList.length === 0);
      this.addFormcontrol(this.noEmployees);
      this.reporting_relations = true;
      if (this.tempFormData && this.tempFormData.data) {
        this.addToList();
        setTimeout(() => {
          this.employeeForm.patchValue({
            directManager: (this.tempFormData.data.reportingManager && this.tempFormData.data.reportingManager.id) ? this.tempFormData.data.reportingManager.id : null,
            approvingManager: (this.tempFormData.data.approvingManager && this.tempFormData.data.approvingManager.id) ? this.tempFormData.data.approvingManager.id : null,
            practiceManager: (this.tempFormData.data.practiceManager && this.tempFormData.data.practiceManager.id) ? this.tempFormData.data.practiceManager.id : null
          });
        }, 200);
      }
    });

  }

  /**
   * Currently not use
   *
   */
  public applyFilter() {
  }

  /**
   * Clear selected drop down of primary office
   *
   */
  public clrFilterPrmOfc() {
    this.sndryOfficeSelected = [];
    this.officeList.forEach(item => (item.checked = false));
    this.title = 'Secondary Office(s)';
  }

  /**
   * office selected
   *
   */
  public getOfficeSelected(event) {
    const selectedPrimaryOff: any = this.employeeForm.controls.primaryOffice.value;
    this.title = '';
    if (selectedPrimaryOff && this.sndryOfficeSelected && this.sndryOfficeSelected.length) {
      if (this.sndryOfficeSelected.includes(selectedPrimaryOff)) {
        const index = this.sndryOfficeSelected.indexOf(selectedPrimaryOff);
        if (index > -1) {
          this.sndryOfficeSelected.splice(index, 1);
          setTimeout(() => {
            this.officeList.forEach(item => {
              if (selectedPrimaryOff == item.id) {
                item.checked = false;
              }
            });
          }, 100);
          this.toastDisplay.showError(this.errorData.primary_office_not_same_secondary);
        }
      }
    }
    if (this.sndryOfficeSelected.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'Secondary Office(s)';
    }
  }

  /**
   * Clear selected drop down of Retainer
   *
   */
  public clearFilterRetainer() {
    this.retainerPracticeArea = [];
    this.practiceList.forEach(item => (item.checked = false));
    this.titlePracticeArea = 'Practice Area(s)';
  }

  /**
   * retainer practice area selected
   *
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
   * Clear selected drop down of initial consultant
   *
   */
  public clearFilterInitialConsul() {
    this.initialConsulPracticeArea = [];
    this.practiceListIC.forEach(item => (item.checked = false));
    this.titlePracticeAreai = 'Practice Area(s)';
  }

  /**
   * initial consultant practice area selected
   *
   */
  public initialConsulSelected(event) {
    this.titlePracticeAreai = '';
    if (event.length > 0) {
      this.titlePracticeAreai = event.length;
    } else {
      this.titlePracticeAreai = 'Practice Area(s)';
    }
  }

  /**
   * Groups selected
   *
   */
  public getGroupsSelected(event) {
    this.groupsTitle = '';
    if (event.length > 0) {
      this.groupsTitle = event.length;
      this.groupValidation = false;
    } else {
      this.groupsTitle = 'Add employee to a Group';
      this.groupValidation = true;
    }
  }

  /**
   * Clear selected drop down of groups
   *
   */
  public clrFilterGroups() {
    this.groupsSelected = [];
    for (let counter = 0; counter < this.groupList.length; counter++) {
      if (this.groupList[counter].disabled) {
        this.groupsSelected.push(this.groupList[counter].id);
        continue;
      }
      this.groupList[counter].checked = false;
    }
    if (this.groupsSelected.length > 0) {
      this.groupsTitle = (this.groupsSelected.length).toString();
    } else {
      this.groupsTitle = 'Add employee to a Group';
    }
  }


  //

  /**
   * Handle state select
   *
   */
  public onCheckChange(event) {
    const formArray: FormArray = this.employeeForm.get('states') as FormArray;
    /* Selected */
    if (event.target.checked) {
      // Add a new control in the arrayForm
      formArray.push(new FormControl(event.target.value));
    } else {
      // find the unselected element
      let i = 0;
      formArray.controls.forEach((ctrl: FormControl) => {
        if (ctrl.value == event.target.value) {
          // Remove the unselected element from the arrayForm
          formArray.removeAt(i);
          return;
        }
        i++;
      });
    }
  }

  public onDateSelects(event) {
  }

  /**
   * Call final form submit (create employee)
   *
   */
  next() {
    this.formSubmitted = true;
    if (this.groupsSelected.length == 0){
      this.groupValidation = true;
    }
    if (!this.employeeForm.valid || this.emailExistence) {
      this.scrollToFirstInvalidControl();
      return;
    }
    if (this.groupValidation) {
      return;
    }

    if (moment(this.employeeForm.value.employmentStartDate) > moment(this.employeeForm.value.employmentEndDate)) {
      this.toastDisplay.showError(this.errorData.startdate_lessthen_enddate);
      return;
    }
    if (this.employeeForm.value.retainer && !this.retainerPracticeArea.length) {
      return;
    }
    if (this.employeeForm.value.initialConsultations && !this.initialConsulPracticeArea.length) {
      return;
    }

    const data = {...this.employeeForm.value};
    const profile = JSON.parse(localStorage.getItem('profile'));
    data.reportingManager = {id: this.noEmployees ? profile.id : +data.directManager};
    data.approvingManager = {id: this.noEmployees ? profile.id : +data.approvingManager};
    data.practiceManager = {id: this.noEmployees ? profile.id : +data.practiceManager};
    data.primaryOffice = {id: +data.primaryOffice};
    if (this.sndryOfficeSelected.length > 0) {
      data.secondaryOffices = this.sndryOfficeSelected.map((obj) => {
        return {id: +obj};
      });
    }
    if (this.employeeForm.value.states.length > 0) {
      data.states = this.employeeForm.value.states.map(obj => {
        return {id: +obj};
      });
    }
    if (this.groupsSelected.length > 0) {
      data.groups = this.groupsSelected.map((obj) => {
        return {id: +obj};
      });
    } else {
      data.groups = [];
    }
    data.groups.push({id: this.employeeGroup.id});
    if (this.employeeForm.value.retainer && this.retainerPracticeArea.length > 0) {
      data.retainerPracticeAreas = this.retainerPracticeArea.map(obj => {
        return {id: +obj};
      });
      data.groups.push({id: +this.responsibleAttorneyGroup.id});
    }
    if (this.employeeForm.value.initialConsultations && this.initialConsulPracticeArea.length > 0) {
      data.initialConsultPracticeAreas = this.initialConsulPracticeArea.map((obj) => {
        return {id: +obj};
      });
      data.groups.push({id: +this.consultAttorneyGroup.id});
    }
    if (this.employeeForm.value.primaryPhoneNumber) {
      data.phones = [{
        id: 0,
        isPrimary: true,
        number: this.employeeForm.value.primaryPhoneNumber,
        type: 'primary'
      }];
      if (this.employeeForm.value.cellPhoneNumber) {
        data.phones.push({
          id: 0,
          isPrimary: false,
          number: this.employeeForm.value.cellPhoneNumber,
          type: 'cellphone'
        });
      }
      if (this.employeeForm.value.fax) {
        data.phones.push({
          id: 0,
          isPrimary: false,
          number: this.employeeForm.value.fax,
          type: 'fax'
        });
      }
      if (this.employeeForm.value.employmentStartDate) {
        data.employmentStartDate = moment(this.employeeForm.value.employmentStartDate).format(Constant.SharedConstant.DateFormat)
          + Constant.SharedConstant.TimeFormat;
      }
      if (this.employeeForm.value.employmentEndDate) {
        data.employmentEndDate = moment(this.employeeForm.value.employmentEndDate).format(Constant.SharedConstant.DateFormat)
          + Constant.SharedConstant.TimeFormat;
      }
    }
    data.role = [{
      name: 'Employee'
    }];
    data.username = data.email;
    data.password = 'password';
    data.DoNotSchedule = this.isDoNotSchedule;
    if (this.profileImage) {
      data.profileImage = {
        name: this.profileImage.name,
        type: this.profileImage.type
      };
      const fileReader: any = new FileReader();
      fileReader.onload = () => {
        localStorage.setItem('employee_profile', fileReader.result as string);
      };
      fileReader.readAsDataURL(this.profileImage);
    }
    UtilsHelper.setObject('employee_general', {data});
    this.nextStep.emit({
      nextStep: 'settings',
      currentStep: 'generalinfo',
    });
    this.formSubmitted = false;

  }


  uploadButtonClick() {
    if (this.profileImageInput) {
      this.profileImageInput.nativeElement.value = null;
      this.profileImageInput.nativeElement.click();
    }
  }

  public uploadFile(files: File[]) {
    const fileToUpload = files[0];

    if (!UtilsHelper.isValidProfileImage(fileToUpload)) {
      this.toastDisplay.showError(this.errorData.profile_photo_format_error);
    } else if (fileToUpload.size > 5000000) {
      this.toastDisplay.showError('Profile photo must be smaller than 5 MB');
    } else {
      const img = new Image();
      let naturalWidth = 0;
      let naturalHeight = 0;
      img.src = window.URL.createObjectURL(fileToUpload);

      img.onload = () => {
        naturalWidth = img.naturalWidth;
        naturalHeight = img.naturalHeight;

        window.URL.revokeObjectURL(img.src);
        this.profileImage = fileToUpload;
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent) => {
          this.profileImageSrc = (event.target as FileReader).result;
        };
        reader.readAsDataURL(fileToUpload);
      };
    }
  }

  public uploadFileDragAndDrop(files: Array<File>) {
    const filesFromDragAndDrop = files;

    if (filesFromDragAndDrop && filesFromDragAndDrop.length > 0) {
      if (filesFromDragAndDrop.length > 1) {
        this.toastDisplay.showError('Please select only 1 file.');
      } else {
        this.uploadFile(filesFromDragAndDrop);
      }
    }
  }

  /**** function to detect primary office change */
  changePrimaryOffice(event: any): void {
    if (event && event.id) {
      if (this.sndryOfficeSelected && this.sndryOfficeSelected.length) {
        if (this.sndryOfficeSelected.includes(event.id)) {
          this.toastDisplay.showError(this.errorData.primary_office_not_same_secondary);
          this.employeeForm.controls.primaryOffice.setValue(null);
        }
      }
    }
  }

  public selectRetainer(type) {
  }

  /**
   * Check group selected than display count of selected groups
   *
   */
  public checkGroupSelected() {
    if (this.groupList && this.groupList.length > 0) {
      const selecteds = this.groupList.filter(item => item.checked);
      this.groupsTitle = '';
      if (selecteds && selecteds.length > 0) {
        this.groupsTitle = (selecteds.length).toString();
      } else {
        this.groupsTitle = 'Add employee to a Group';
      }
    }
  }

  onBlurMethod(val: any, type: string) {
    type === 'primaryPhoneNumber' ? this.primaryPhoneNumberBlur = this.isBlur(val) :
      type === 'cellPhoneNumber' ? this.cellPhoneNumberBlur = this.isBlur(val) :
        type === 'fax' ? this.faxBlur = this.isBlur(val) : '';
  }

  private isBlur(val: string | any[]) {
    return (val.length === 10) ? false : (val.length !== 0);
  }

  /**
   * function to read encoding file object
   */
  readFileObject(data: any): any {
    if (localStorage.getItem('employee_profile')) {
      const byteString = atob(localStorage.getItem('employee_profile').split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ia], {type: data.type});
      return new File([blob], data.name, {type: data.type});
    }
  }

  get f() {
    return this.employeeForm.controls;
  }

  /**
   * Function to add employee to the Relationship manager list
   */
  addToList() {
    const value = this.employeeForm.value;
    const firstName = value.firstName;
    const lastName = value.lastName;
    const index = this.employeeList.findIndex(v => v.id === -1);
    if (index > -1) {
      this.employeeList = this.employeeList.filter(val => val.id != -1);
    }
    if (!firstName && !lastName && firstName == '') {
      this.employeeForm.patchValue({
        directManager: (this.employeeForm.value.directManager == -1) ? null : this.employeeForm.value.directManager,
        practiceManager: (this.employeeForm.value.practiceManager == -1) ? null : this.employeeForm.value.practiceManager,
        approvingManager: (this.employeeForm.value.approvingManager == -1) ? null : this.employeeForm.value.approvingManager,
      });
      return;
    }
    const name: string = (lastName) ? `${lastName}, ${firstName}` : firstName;
    this.employeeList = [{id: -1, name}, ...this.employeeList];
  }

  getJobList() {
    this.employeeService.v1EmployeeJobFamilyGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        const response = JSON.parse(res.body);
        this.jobList = response.results;
      },
      err => {
        console.log(err);
      }
    );
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  deleteProfileImage() {
    this.profileImageSrc = null;
    this.profileImage = null;
  }
}
