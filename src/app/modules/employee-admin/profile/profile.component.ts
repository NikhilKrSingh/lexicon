import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable, Subscription, throwError } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import {
  vwCalendarSettings, vwEchelon, vwEmployee,
  vwPersonPhone
} from 'src/common/swagger-providers/models';
import {
  CalendarService, EmployeeService, HierarchyService, MiscService, PersonService
} from 'src/common/swagger-providers/services';
import {
  getWorkingHour, IWorkingDay,
  WORKING_DAYS
} from '../../models/office-data';
import { DialogService } from '../../shared/dialog.service';
import * as errorData from '../../shared/error.json';
import { SharedService } from '../../shared/sharedService';
import { UtilsHelper } from '../../shared/utils.helper';
import { CustomizeDayAndHourComponent } from '../../shared/work-day-and-hours/customize-hour/customize-hour.component';
import * as fromRoot from './../../../store';
import * as fromPermissions from './../../../store/reducers/permission.reducer';
import { EditContactComponent } from './edit-employee-info/edit-contact/edit-contact.component';
import { EditDatesComponent } from './edit-employee-info/edit-date/edit-date.component';
import { EditStateComponent } from './edit-employee-info/edit-state/edit-state.component';
import { EditOfficeComponent } from './edit-employee-info/office/office.component';
import { EditPersonalInfoComponent } from './edit-employee-info/personal-info/personal-info.component';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

  public employee: vwEmployee;
  public primaryOfficeInfo: vwEchelon[];
  public secondaryOfficeHierarchy: { [key: string]: vwEchelon[] };
  public currentDay: number;
  public isEditMode = true;
  public profileImage: string;
  @ViewChild('profilePictureInput', {static: false}) public profilePictureInput: ElementRef<HTMLInputElement>;
  public officetab = ['Primary Office', 'Secondary Office'];
  public selecttabs = this.officetab[0];
  public errorData: any = (errorData as any).default;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public lessEmployementEndDate = false;
  public calendarSettings: vwCalendarSettings;
  public workingHoursList: Array<IWorkingDay> = [];
  public loggedInUser: vwEmployee;
  public loading = true;
  public infoLoading: boolean;
  public timeZones: any;
  nameLength: number;
  cellphone;
  fax;
  primaryPhoneNumber;
  deactivateMsg: string;
  public newProfileImage: string;
  private profilePictureSelected;

  constructor(
    private employeeService: EmployeeService,
    private activateRoute: ActivatedRoute,
    private hierarchyService: HierarchyService,
    private personService: PersonService,
    private toaster: ToastDisplay,
    private modalService: NgbModal,
    private dialogService: DialogService,
    private store: Store<fromRoot.AppState>,
    private router: Router,
    private calendarService: CalendarService,
    private miscService: MiscService,
    private pagetitle: Title,
    private sharedService: SharedService
  ) {
    this.currentDay = new Date().getDay();
    this.primaryOfficeInfo = [];
    this.secondaryOfficeHierarchy = {};
    this.permissionList$ = this.store.select('permissions');
    this.router.routeReuseStrategy.shouldReuseRoute = () => {
      return false;
    };
  }

  ngOnInit() {
    this.loggedInUser = UtilsHelper.getLoginUser();
    this.getEmployeeBasicDetails();
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
    this.loadTimeZones();
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  /**
   * Get Employee Details
   */
  getEmployeeBasicDetails() {
    this.loading = true;
    this.activateRoute.queryParamMap
      .pipe(
        switchMap(params => {
          const employeeId = params.get('employeeId');
          if (employeeId) {
            this.loadCalendarSettings(+employeeId);
            return this.employeeService.v1EmployeeIdGet({
              id: +employeeId
            });
          } else {
            this.loading = false;
            return throwError('Please select a valid Employee');
          }
        }),
        map(
          res => {
            return JSON.parse(res as any).results as vwEmployee;
          }, error => {
            this.loading = false;
          }
        )
      )
      .subscribe(
        employee => {
          this.loading = false;
          this.employee = employee;
          this.primaryPhoneNumber = this.getPrimaryPhoneNumber(this.employee.phones).number;
          if(this.getPhoneNumberByType(this.employee.phones, 'fax') && this.getPhoneNumberByType(this.employee.phones, 'fax').number) {
            this.fax = this.getPhoneNumberByType(this.employee.phones, 'fax').number;
          }
          if(this.getPhoneNumberByType(this.employee.phones, 'cellphone') && this.getPhoneNumberByType(this.employee.phones, 'cellphone').number) {
            this.cellphone = this.getPhoneNumberByType(this.employee.phones, 'cellphone').number;
          }
          this.nameLength = (employee.firstName || '').length + (employee.lastName || '').length + 1;
          this.pagetitle.setTitle(employee.firstName + ' ' + employee.lastName);
          if (
            this.employee.employmentEndDate &&
            this.employee.employmentEndDate !== ''
          ) {
            this.lessEmployementEndDate = moment(
              this.employee.employmentEndDate,
              'YYYY/MM/DD'
            ).isBefore(moment());
          }
          if(this.employee && this.employee.retainerPracticeAreas && this.employee.retainerPracticeAreas.length ){
            this.employee.retainerPracticeAreas = _.orderBy(this.employee.retainerPracticeAreas,'name','asc');
          }
          if(this.employee && this.employee.initialConsultPracticeAreas && this.employee.initialConsultPracticeAreas.length ){
            this.employee.initialConsultPracticeAreas = _.orderBy(this.employee.initialConsultPracticeAreas,'name','asc');
          }
          if(this.employee && this.employee.states && this.employee.states.length){
            this.employee.states = _.orderBy(this.employee.states,'id','asc');
          }
          this.getEmployeeDetails();
        },
        error => {
          this.loading = false;
        }
      );
  }

  /**
   * Get calendar settings
   *
   * @private
   * @param {number} employeeId
   * @memberof ProfileComponent
   */
  private loadCalendarSettings(employeeId: number) {
    this.infoLoading = true;
    this.calendarService
      .v1CalendarSettingsPersonIdGet({
        personId: employeeId
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
        })
      )
      .subscribe(
        res => {
          if (res) {
            this.infoLoading = false;
            this.calendarSettings = res;
            this.calendarSettings.personId = employeeId;
            this.createWorkingHoursList();
          } else {
            this.infoLoading = false;
          }
        },
        () => {
          this.infoLoading = false;
        }
      );
  }

  private createWorkingHoursList() {
    if (this.calendarSettings) {
      this.workingHoursList = Object.values(WORKING_DAYS).map((day, index) => {
        const hr = getWorkingHour(day);
        let isOff = false;
        if (this.calendarSettings[hr.open] == this.calendarSettings[hr.close]) {
          isOff = true;
        }
        return {
          index,
          name: day,
          open: this.calendarSettings[hr.open],
          openDisplay: isOff
            ? 'Off'
            : UtilsHelper.workingHoursFormat(this.calendarSettings[hr.open]),
          close: this.calendarSettings[hr.close],
          closeDisplay: isOff
            ? 'Off'
            : UtilsHelper.workingHoursFormat(this.calendarSettings[hr.close]),
          isCustom: this.calendarSettings[`is${day}Custom`]
        } as IWorkingDay;
      });
    } else {
      this.workingHoursList = [];
    }
  }

  /**
   * Get Employee Related Details - Profile Picture, Office
   */
  private getEmployeeDetails() {
    this.infoLoading = true;
    if (this.employee.id > 0) {
      if (this.loggedInUser.id == this.employee.id) {
        this.sharedService.profilePictureLink$.subscribe(res => {
          this.profileImage = res;
        });
      } else {
        this.getProfilePicture();
      }
      this.getOfficeDetails();
    } else {
      this.toaster.showError('No Profile Found');
      this.infoLoading = false;
    }
  }

  /**
   * Get Details for Primary office and Secondary Office
   */
  private getOfficeDetails() {
    this.infoLoading = true;
    if (this.employee.primaryOffice) {
      this.getPrimaryOfficeHierarchy();
      this.infoLoading = false;
    } else {
      this.primaryOfficeInfo = [];
      this.infoLoading = false;
    }
    this.getSecondaryOfficeHierarchy();
  }

  /**
   * Get Hierarchy for Primary Offcie
   */
  private getPrimaryOfficeHierarchy() {
    this.getOfficeHierarchyFromAPI(this.employee.primaryOffice.id).subscribe(
      office => {
        this.primaryOfficeInfo = office;
      }
    );
  }

  /**
   * Get Hierarchy for All Secondary Office
   */
  private getSecondaryOfficeHierarchy() {
    if (this.employee && this.employee.secondaryOffices) {
      this.employee.secondaryOffices.forEach(office => {
        this.getOfficeHierarchyFromAPI(office.id).subscribe(officeInfo => {
          this.secondaryOfficeHierarchy[office.id] = officeInfo;
        });
      });
    }
    this.infoLoading = false;
  }

  /**
   * Get Office Hierarchy
   * @param officeId Office Id
   */
  private getOfficeHierarchyFromAPI(officeId: number) {
    return this.hierarchyService
      .v1HierarchyOfficeIdGet({
        id: officeId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwEchelon[];
        })
      );
  }

  /**
   * Get Profile Picture for Employee
   */
  private getProfilePicture() {
    if (this.employee) {
      this.personService
        .v1PersonPhotoPersonIdGet({
          personId: this.employee.id
        })
        .pipe(
          map(res => {
            return JSON.parse(res as any).results as string;
          })
        )
        .subscribe(res => {
          this.profileImage = res;
        });
    }
  }

  /**
   * Opens File Picker for Upload Profile Picture
   */
  public editProfilePicture() {
    this.profilePictureInput.nativeElement.click();
  }

  /**
   * Uploads Profile Picture to API/DB
   * @param files File
   */
  public uploadProfilePicture(files: File[]) {
    const fileToUpload = files[0];

    if (!UtilsHelper.isValidImageFile(fileToUpload)) {
      this.toaster.showError('Profile photo must be in a valid image format');
    } else if (fileToUpload.size > 5000000) {
      this.toaster.showError('Profile photo must be smaller than 5 MB');
    } else {
      const body = {
        file: fileToUpload
      };
      this.personService
        .v1PersonPhotoPersonIdPost$Response({
          personId: this.employee.id,
          body: body as any
        })
        .pipe(
          map(res => {
            return JSON.parse(res.body as any).results as any;
          }),
          finalize(() => {
            this.getProfilePicture();
            //For Topbar and rest of application
            if (this.employee.id == this.loggedInUser.id) {
              this.sharedService.getProfilePicture();
            }
          })
        )
        .subscribe(
          () => {
            this.toaster.showSuccess('Profile picture uploaded.');
            this.profilePictureInput.nativeElement.value = null;
          },
          error => {
            console.log(error);
          }
        );
    }
    const form = document.getElementById('imageForm') as HTMLFormElement;
    form.reset();
  }

  /**
   * Save Employee to DB
   * @param emp Employee Data
   * @param saveFrom Page From Which Save Action is Getting Called
   */
  public saveEmployee(emp: vwEmployee, saveFrom: string) {
    this.infoLoading = true;
    this.employeeService
      .v1EmployeePut$Json({
        body: emp
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        })
      )
      .subscribe(
        res => {
          if (res) {
            this.infoLoading = false;
            this.reloadEmployeeInfo(emp);
            if (saveFrom == 'Office') {
              this.getOfficeDetails();
            }
          } else {
            this.toaster.showError('Some Error Occured');
            this.infoLoading = false;
          }
        },
        () => {
          this.infoLoading = false;
          this.reloadEmployeeInfo(emp);
        }
      );
  }

  /**
   * Reloads Employee Info After Saving Employee
   * @param emp Employye
   */
  reloadEmployeeInfo(emp: vwEmployee) {
    this.loading = true;
    this.employeeService
      .v1EmployeeIdGet({
        id: emp.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        })
      )
      .subscribe(employee => {
        this.loading = false;
        this.employee = employee;
        this.nameLength = (employee.firstName || '').length + (employee.lastName || '').length + 1;
        if(this.employee && this.employee.retainerPracticeAreas && this.employee.retainerPracticeAreas.length ){
          this.employee.retainerPracticeAreas = _.orderBy(this.employee.retainerPracticeAreas,'name','asc');
        }
        if(this.employee && this.employee.initialConsultPracticeAreas && this.employee.initialConsultPracticeAreas.length ){
          this.employee.initialConsultPracticeAreas = _.orderBy(this.employee.initialConsultPracticeAreas,'name','asc');
        }
        this.primaryPhoneNumber = this.getPrimaryPhoneNumber(this.employee.phones).number;
        if(this.getPhoneNumberByType(this.employee.phones, 'fax') && this.getPhoneNumberByType(this.employee.phones, 'fax').number) {
          this.fax = this.getPhoneNumberByType(this.employee.phones, 'fax').number;
        }
        if(this.getPhoneNumberByType(this.employee.phones, 'cellphone') && this.getPhoneNumberByType(this.employee.phones, 'cellphone').number) {
          this.cellphone = this.getPhoneNumberByType(this.employee.phones, 'cellphone').number;
        }
        if(this.employee && this.employee.states && this.employee.states.length){
          this.employee.states = _.orderBy(this.employee.states,'id','asc');
        }
        this.toaster.showSuccess('Employee updated.');
      }, () => {
        this.loading = false;
      });
  }

  /**
   * Gets Primary Phone Number
   * @param phoneNumbers Phone Numbers Associated with Employee
   */
  public getPrimaryPhoneNumber(phoneNumbers: vwPersonPhone[]) {
    if (phoneNumbers) {
      return phoneNumbers.find(a => a.isPrimary);
    }
  }

  /**
   * Gets Phone Number based on type
   * @param phoneNumbers Phone Numbers Associated with Employee
   * @param type Phone Number Type - `cellphone`, `fax`
   */
  public getPhoneNumberByType(phoneNumbers: vwPersonPhone[], type: string) {
    if (phoneNumbers) {
      return phoneNumbers.find(a => a.type == type);
    }
  }

  /**
   * Gets Concatenatd String of Office Hierarchy to display in UI
   * @param officeInfo Office Hierarchy
   */
  public getOfficeHierarchy(officeInfo: any) {
    if (officeInfo) {
      // return officeInfo.map(a => a.name).join(' / ');
      if (officeInfo && officeInfo.length > 0) {
        return `${officeInfo[0].hierarchyName} / ${officeInfo[0].name}`;
      } else {
        return '';
      }
    }
  }

  /**
   * Gets formatted string (open - close) to display in UI
   * @param open Opening hours
   * @param close Closing hours
   */
  public getWorkingHours(open: string, close: string) {
    if (open && close) {
      if (
        open == close &&
        open.includes('00:00:00') &&
        close.includes('00:00:00')
      ) {
        return 'Off';
      } else {
        const opening = UtilsHelper.workingHoursFormat(open);
        const closing = UtilsHelper.workingHoursFormat(close);
        return `${opening} - ${closing}`;
      }
    } else {
      return '-';
    }
  }

  openEditModel(event) {
    if (event) {
      this.openDialog(event);
    }
  }

  updateDoNotSchedule(doNotSchedule: boolean) {
    this.employee.doNotSchedule = doNotSchedule;
    this.saveEmployee(this.employee, '');

  }

  openDialog(type: string, modalSize = '') {
    switch (type) {
      case 'Office':
        this.openEditDialog(EditOfficeComponent, modalSize, 'Office');
        break;
      case 'PersonalInfo':
        this.openEditDialog(EditPersonalInfoComponent, modalSize, 'PersonalInfo');
        break;
      case 'WorkingHours':
        this.customizeHours();
        break;
      case 'EditDates':
        this.openEditDialog(EditDatesComponent, modalSize, 'EditDates');
        break;
      case 'EditContact':
        this.openEditDialog(EditContactComponent, modalSize, 'EditContact');
        break;
      case 'EditState':
        this.openEditDialog(EditStateComponent, modalSize, 'EditState');
    }
  }

  customizeHours() {
    const modalRef = this.modalService.open(CustomizeDayAndHourComponent, {
      centered: true,
      keyboard: false,
      backdrop: 'static',
      size: 'lg'
    });
    modalRef.componentInstance.workingHoursList = JSON.parse(
      JSON.stringify(this.workingHoursList)
    );
    modalRef.componentInstance.calendarSettings = this.calendarSettings;
    modalRef.componentInstance.timezones = this.timeZones;
    modalRef.result.then(res => {
      if (res) {
        this.assignWorkingHours(res.workingHours, res.timezone);
      }
    });
  }

  private assignWorkingHours(workingHours: Array<IWorkingDay>, newTz) {
    workingHours.forEach(a => {
      this.calendarSettings[`${a.name.toLowerCase()}OpenHours`] = a.open;
      this.calendarSettings[`${a.name.toLowerCase()}CloseHours`] = a.close;
      this.calendarSettings[`is${a.name}Custom`] = a.isCustom;
    });
    this.calendarSettings.timeZoneId = newTz;
    this.saveChanges(this.calendarSettings);
  }

  public saveChanges(settings: vwCalendarSettings) {
    this.calendarService
      .v1CalendarSettingsPost$Json({
        body: settings
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        })
      )
      .subscribe(
        res => {
          if (res) {
            this.toaster.showSuccess(this.errorData.working_hours_update_success);
            this.loadCalendarSettings(this.employee.id);
          } else {
            this.toaster.showError(this.errorData.server_error);
          }
        },
        () => {
        }
      );
  }

  openEditDialog(component, size, from) {
    const modalRef = this.modalService.open(component, {
      size,
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    const componentInstance = modalRef.componentInstance;
    componentInstance.employee = JSON.parse(JSON.stringify(this.employee));
    modalRef.result
      .then(result => {
        this.employee = result;
        this.saveEmployee(this.employee, from);
      })
      .catch(reason => {
        console.log(reason);
      });
  }

  /**
   * Deactivate employee
   *
   * @memberof ProfileComponent
   */
  confirmEmpDeactivate() {
    this.dialogService
      .confirm(this.errorData.employee_deactivate_confirm, 'Deactivate','','Deactivate Employee')
      .then(res => {
        if (res) {
          this.employeeService
            .v1EmployeeDeactivateIdPut$Response({id: this.employee.id})
            .subscribe(
              suc => {
                const flag = JSON.parse(suc.body as any).results;
                if (flag) {
                  this.toaster.showSuccess(this.errorData.employee_deactivate);
                  this.getEmployeeBasicDetails();
                } else {
                  this.toaster.showError(this.errorData.employee_deactivate_error);
                }
              },
              err => {
              }
            );
        }
      });
  }

  public timesheet() {
    this.router.navigate(['/timekeeping/my-timesheet'], {
      queryParams: {
        personId: this.employee.id,
        name: this.employee.firstName + ' ' + this.employee.lastName,
        fromEmployeeProfile: true
      }
    });
  }

  public calendar() {
    this.router.navigate(['/calendar/list'], {
      queryParams: {
        employeeId: this.employee.id,
        employeeName: this.employee.lastName + ', ' + this.employee.firstName
      }
    });
  }

  copyEmail(email: string) {
    UtilsHelper.copyText(email);
  }

  private loadTimeZones() {
    this.miscService
      .v1MiscTimezonesGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.timeZones = res;
        }
      });
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  empDeactivate(DeactivateModal) {
    this.loading = true;
    this.employeeService
      .v1EmployeeCheckDeactivateIdPut({ id: this.employee.id })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        }))
      .subscribe(
        suc => {
          if (suc) {
            console.log('suc', suc);
            switch (suc) {
              case 'MATTER': {
                this.showWarningPopup(DeactivateModal, this.errorData.deactivate_employee_having_matter);
                break;
              }
              case 'REPORTING': {
                this.showWarningPopup(DeactivateModal, this.errorData.deactivate_employee_having_reporting);
                break;
              }
              case 'ATTORNEY': {
                this.showWarningPopup(DeactivateModal, this.errorData.deactivate_employee_having_attorney);
                break;
              }
              case 'DEACTIVATE': {
                this.confirmEmpDeactivate();
                this.loading = false;
                break;
              }
            }
          }
        },
        err => {
          this.loading = false;
        }
      );
  }
  showWarningPopup(content, msg) {
    this.loading = true;
    this.loading = false;
    this.deactivateMsg = msg;
    this.modalService
      .open(content, {
        centered: true,
        backdrop: 'static',
        keyboard: false
      });
  }

  openProfilePicPopup(content){
    if(!this.profileImage){
      this.newProfileImage = null;
    } else {
      this.newProfileImage = this.profileImage;
    }
    this.modalService
      .open(content, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        windowClass: 'profile-photo-modal'
      });
  }

  removeProfilePicture(flag?){
    if(this.newProfileImage){
      this.newProfileImage = null;
      const form = document.getElementById('imageForm') as HTMLFormElement;
      form.reset();
    }
  }

  previewProfilePicture(flag = false){
    const pic = this.profilePictureInput.nativeElement.files[0];
    const reader = new FileReader();
    reader.onload = e => this.newProfileImage = (reader.result as string);
    this.profilePictureSelected = pic;
    reader.readAsDataURL(pic);
  }

  saveProfilePicture(){
    if(!this.newProfileImage && this.profileImage){
      this.personService.v1PersonPhotoPersonIdDelete({personId: this.employee.id}).subscribe(res => {
        const response = JSON.parse(res as any).results;
        this.toaster.showSuccess(errorData.profile_removed);
        this.getProfilePicture();
      },err => {})
    }

    if(this.newProfileImage){
      this.uploadProfilePicture([this.profilePictureSelected]);
    } else {
      this.getProfilePicture();
      //For Topbar and rest of application
      if (this.employee.id == this.loggedInUser.id) {
        this.sharedService.getProfilePicture();
      }
    }
  }
}

