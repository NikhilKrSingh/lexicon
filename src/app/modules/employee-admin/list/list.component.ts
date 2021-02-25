import { AfterViewInit, Component, NgZone, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import {
  ModalDismissReasons, NgbModal,

  NgbModalOptions
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as clone from 'clone';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { jwtValidation } from 'src/common/CommonService/jwtValidation.service';
import { AuthService, EmployeeService, MiscService, NoteService } from 'src/common/swagger-providers/services';
import { IOffice } from '../../models';
import { Page } from '../../models/page';
import { DialogService } from '../../shared/dialog.service';
import * as errorData from '../../shared/error.json';
import { UtilsHelper } from '../../shared/utils.helper';
import { WarningMessageDialogComponent } from '../../shared/warning-message-dialog/warning-message-dialog.component';
import * as fromRoot from './../../../store';
import * as fromPermissions from './../../../store/reducers/permission.reducer';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild('actionTemplate', { static: false }) actionTemplate: TemplateRef<any>;
  public searchText = '';
  public columnList: any = [];
  public modalOptions: NgbModalOptions;
  public closeResult: string;
  public rows: Array<any> = [];
  public oriArr: Array<any> = [];
  public isLoading = false;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public title = 'All';
  public title1 = 'All';
  public filterName = 'Apply Filter';
  public selectedOffice: Array<number> = [];
  public selectedStatus: Array<number> = [];
  public statusList: Array<any> = [
    {
      id: 1,
      name: 'Active',
      checked: false
    },
    {
      id: 2,
      name: 'Inactive',
      checked: false
    },
    {
      id: 3,
      name: 'Pending',
      checked: false
    }
  ];
  public selected = [];
  public officeList: Array<IOffice> = [];
  public callFlag = true;
  public errorData: any = (errorData as any).default;
  public pangeSelected = 1;
  public counter = Array;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public currentActive: number;
  public loading = true;
  public noteForm: FormGroup;
  public showForm = false;
  public formSubmitted = false;
  public reactivateEmployee: any = {};
  public tenantId: number;
  public uId: string;
  public deactivateMsg: string;
  public tables: any = {
    tableArr: [],
    frozenRightArr: []
  };
  allSelected: boolean;

  constructor(
    private modalService: NgbModal,
    private employeeService: EmployeeService,
    private misc: MiscService,
    private authService: AuthService,
    private toastDisplay: ToastDisplay,
    private exporttocsvService: ExporttocsvService,
    private store: Store<fromRoot.AppState>,
    private dialogService: DialogService,
    private pagetitle: Title,
    private fb: FormBuilder,
    private noteService: NoteService,
    public JWTservice: jwtValidation,
    private router: Router
  ) {
    this.modalOptions = {
      size: 'xl',
      centered: true,
      backdrop: 'static'
    };
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');
    this.noteForm = this.fb.group({
      id: new FormControl(0),
      applicableDate: null,
      content: ['', [Validators.required]],
      isVisibleToClient: false
    });
  }

  ngOnInit() {
    this.pagetitle.setTitle('Employees');
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
    this.tenantId = Number(localStorage.getItem("tenantId"));
    this.getOffices();
    this.getDetails();
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  ngAfterViewInit() {
    window.onresize = () => {
      this.initScrollDetector([this.table]);
      window.onresize = () => {
        UtilsHelper.checkDataTableScroller(this.tables);
      };
    };
  }

  /**** Calls when resize screen *****/
  public initScrollDetector(tableArr = []) {
    this.tables.tableArr = [...tableArr];
    this.tables.frozenRightArr = []
    this.tables.tableArr.forEach(x => this.tables.frozenRightArr.push(false));
  }

  /**
   * Get employee list
   *
   * @memberof ListComponent
   */
  public getDetails() {
    this.employeeService.v1EmployeesGet$Response({}).subscribe(
      (res: any) => {
        res = JSON.parse(res.body);
        this.removeSelection();
        if (res.status !== 500) {
          this.rows = res.results;
          this.rows.forEach(row => {
            row.firstName = row.firstName ? row.firstName : '';
            row.lastName = row.lastName ? row.lastName : '';
            row.status = (!row.isActivated && row.isVisible) ? 'Pending' : (row.isVisible) ? 'Active' : 'Inactive';
          });
          if (this.rows && this.rows.length > 0) {
            const keys = Object.keys(this.rows[0]);
            this.addkeysIncolumnlist(keys);
          }
          this.oriArr = [...this.rows];
          this.applyFilterPrimaryOffice();
          this.initScrollDetector([this.table]);
          UtilsHelper.checkDataTableScroller(this.tables);
          this.loading = false;
        } else {
          this.loading = false;
        }
      },
      err => {
        console.log(err);
        this.loading = false;
      }
    );
  }

  /**
   * Export CSV
   *
   * @param {(any[] | string[])} keys
   * @memberof ListComponent
   */
  addkeysIncolumnlist(keys: any[] | string[]) {
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < keys.length; i++) {
      this.columnList.push({ Name: keys[i] });
    }
  }

  /**
   * Get office list
   *
   * @memberof ListComponent
   */
  public getOffices() {
    this.isLoading = true;
    this.misc.v1MiscOfficesGet$Response({}).subscribe(
      (res: any) => {
        this.officeList = JSON.parse(res.body).results;
        this.isLoading = false;
      },
      err => {
        this.isLoading = false;
        console.log(err);
      }
    );
  }

  /**
   * Change per page size
   *
   * @memberof ListComponent
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  /**
   * Change page number
   *
   * @memberof ListComponent
   */
  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    }
    this.checkParentCheckbox();
    UtilsHelper.aftertableInit();
  }

  /**
   * Handle change page number
   *
   * @param {*} e
   * @memberof ListComponent
   */
  public pageChange(e) {
    this.pangeSelected = e.page;
    this.changePage()
  }

  /**
   * select rows
   *
   * @param {*} { selected }
   * @memberof ListComponent
   */
  public onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  /**
   * Apply filter for primary office
   *
   * @memberof ListComponent
   */
  public applyFilterPrimaryOffice() {
    let stdstatus = [];
    if (this.selectedStatus && this.selectedStatus.length > 0) {
      this.statusList.map((item) => {
        if (this.selectedStatus.indexOf(item.id) !== -1) {
          stdstatus.push(item.name);
        }
      });
    }
    this.rows = this.oriArr.filter(a => {
      let matching = true;

      if (this.selectedOffice && this.selectedOffice.length > 0) {
        matching = matching && a.primaryOffice && this.selectedOffice.indexOf(a.primaryOffice.id) !== -1;
      }
      if (this.selectedStatus && this.selectedStatus.length > 0) {
        matching = matching && a.status && stdstatus.indexOf(a.status) !== -1;
      }
      if (this.searchText) {
        matching = matching && (
          this.matchName(a, this.searchText, 'firstName') ||
          this.matchName(a, this.searchText, 'email') ||
          this.matchName(a, this.searchText, 'primaryOffice') ||
          this.matchName(a, this.searchText, 'jobTitle') ||
          this.matchName(a, this.searchText, 'middleName') ||
          this.matchName(a, this.searchText, 'lastName') ||
          this.matchName(a, this.searchText, 'empName') ||
          this.matchName(a, this.searchText, 'firstlast') ||
          this.matchName(a, this.searchText, 'lastfirst')
        );
      }
      return matching;
    });
    this.updateDatatableFooterPage();

  }

  /**
   *
   * Clear filter of primary office
   * @memberof ListComponent
   */
  public clearFilterPrimaryOffice() {
    this.selectedOffice = [];
    this.officeList.forEach(item => (item.checked = false));
    this.rows = [...this.oriArr];
    this.title = 'All';
    this.applyFilterPrimaryOffice();
  }

  /**
   * Clear status filter
   *
   * @memberof ListComponent
   */
  public clearStatusFilter() {
    this.selectedStatus = [];
    this.statusList.forEach(item => (item.checked = false));
    this.rows = [...this.oriArr];
    this.title1 = 'All';
    this.applyFilterPrimaryOffice();
  }

  /**
   * search record from tables
   *
   * @private
   * @param {*} item
   * @param {string} searchValue
   * @param {*} fieldName
   * @returns {boolean}
   * @memberof ListComponent
   */
  private matchName(item: any, searchValue: string, fieldName): boolean {
    let searchName;
    if (fieldName === 'primaryOffice') {
      searchName =
        item[fieldName] && item[fieldName].name
          ? item[fieldName].name.toString().toUpperCase()
          : '';
    } else if (fieldName === 'empName') {
      searchName = item.lastName
        ? item.lastName
          .toString()
          .toUpperCase()
          .trim() +
        ',' +
        item.firstName
          .toString()
          .toUpperCase()
          .trim()
        : item.firstName
          .toString()
          .toUpperCase()
          .trim();
    } else if (fieldName === 'firstlast') {
      searchName = item.firstName ? item.firstName.toString().toUpperCase().trim() + ' ' +
        item.lastName.toString().toUpperCase().trim()
        : item.lastName.toString().toUpperCase().trim();
    } else if (fieldName === 'lastfirst') {
      searchName = item.lastName ? item.lastName.toString().toUpperCase().trim() + ' ' +
        item.firstName.toString().toUpperCase().trim()
        : item.firstName.toString().toUpperCase().trim();
    } else {
      searchName = item[fieldName]
        ? item[fieldName].toString().toUpperCase()
        : '';
    }
    return (
      searchName.search(searchValue.toUpperCase().replace(/\s*,\s*/g, ',')) > -1
    );
  }

  /**
   * Resend activate account email
   *
   * @param {*} obj
   * @memberof ListComponent
   */
  rsndActEml(obj) {
    if (this.callFlag) {
      this.callFlag = false;
      this.authService
        .v1AuthPasswordResetRequestPost$Json$Response({
          body: { email: obj.email, type: 'activate' }
        })
        .subscribe(
          suc => {
            this.callFlag = true;
          },
          err => {
            this.callFlag = true;
          }
        );
    }
    this.JWTservice.v1UsersChangeStatusPost$Response(obj.id, this.uId, this.tenantId)
      .subscribe((suc: {}) => {
        const res: any = suc;
        if (res) {
          this.toastDisplay.showSuccess("Invitation sent.");
        }
      });
  }

  /**
   * Deactivate employee
   *
   * @param {*} obj
   * @memberof ListComponent
   */
  empDeactivate(obj, DeactivateModal) {
    this.loading = true;
    this.employeeService
      .v1EmployeeCheckDeactivateIdPut({ id: obj.id })
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
                this.confirmEmpDeactivate(obj);
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
  confirmEmpDeactivate(obj) {
    this.loading = false;
    this.dialogService
      .confirm(
        this.errorData.employee_deactivate_confirm,
        'Deactivate',
        'Cancel',
        this.errorData.employee_deactivate_title
      )
      .then(res => {
        if (res) {
          this.employeeService
            .v1EmployeeDeactivateIdPut$Response({ id: obj.id })
            .subscribe(
              suc => {
                this.getDetails();
                this.toastDisplay.showSuccess(
                  this.errorData.employee_deactivate
                );
              },
              err => { }
            );
        }
      });
  }
  showWarningPopup(content, msg) {
    this.loading = false;
    this.deactivateMsg = msg;
    this.modalService
      .open(content, {
        centered: true,
        backdrop: 'static',
        keyboard: false
      });
  }

  /**
   * Deactivate employee
   *
   * @param {*} obj
   * @memberof ListComponent
   */
  empDelete(obj) {
    this.dialogService
      .confirm(this.errorData.employee_delete_confirm, 'Delete')
      .then(res => {
        if (res) {
          this.employeeService
            .v1EmployeeIdDelete$Response({ id: obj.id })
            .subscribe(
              suc => {
                this.getDetails();
                this.toastDisplay.showSuccess(this.errorData.employee_delete);
              },
              err => { }
            );
        }
      });
  }

  /**
   * select primary office drop down
   *
   * @param {*} event
   * @memberof ListComponent
   */
  public selectDropdwnPo(event) {
    this.title = '';
    if (event.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'All';
    }
  }

  /**
   * select status drop down
   *
   * @param {*} event
   * @memberof ListComponent
   */
  public selectStatus(event) {
    this.title1 = '';
    if (event.length > 0) {
      this.title1 = event.length;
    } else {
      this.title1 = 'All';
    }
  }

  public onMultiSelectSelectedOptions(event) {
  }

  open(content) {
    this.noteForm.patchValue({
      id: 0,
      applicableDate: null,
      content: null,
      isVisibleToClient: false
    });
    this.showForm = true;
    this.modalService.open(content, this.modalOptions).result.then(
      result => {
        this.closeResult = `Closed with: ${result}`;
      },
      reason => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  private getDismissReason(reason: any): string {
    this.columnList.forEach(element => (element.isChecked = false));
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  ExportToCSV() {
    const rows = clone(this.rows);
    rows.map(obj => {
      obj.primaryOffice = obj.primaryOffice ? obj.primaryOffice.name : '';
      obj.reportingManager = obj.reportingManager
        ? obj.reportingManager.name.replace(/,/g, ' ')
        : '';
      obj.approvingManager = obj.approvingManager
        ? obj.approvingManager.name.replace(/,/g, ' ')
        : '';
      obj.practiceManager = obj.practiceManager
        ? obj.practiceManager.name.replace(/,/g, ' ')
        : '';

      if (obj.role && obj.role.length > 0) {
        let role = '';
        obj.role.map(item => {
          role = role + item.number + '/';
        });
        obj.role = role;
      }
      if (obj.phones && obj.phones.length > 0) {
        let phones = '';
        obj.phones.map(item => {
          phones = phones + item.number + '/';
        });
        obj.phones = phones;
      }
      if (obj.secondaryOffices && obj.secondaryOffices.length > 0) {
        let secondaryOffices = '';
        obj.secondaryOffices.map(item => {
          secondaryOffices = secondaryOffices + item.number + '/';
        });
        obj.secondaryOffices = secondaryOffices;
      }
      if (obj.retainerPracticeAreas && obj.retainerPracticeAreas.length > 0) {
        let retainerPracticeAreas = '';
        obj.retainerPracticeAreas.map(item => {
          retainerPracticeAreas = retainerPracticeAreas + item.number + '/';
        });
        obj.retainerPracticeAreas = retainerPracticeAreas;
      }
      if (
        obj.initialConsultPracticeAreas &&
        obj.initialConsultPracticeAreas.length > 0
      ) {
        let initialConsultPracticeAreas = '';
        obj.initialConsultPracticeAreas.map(item => {
          initialConsultPracticeAreas =
            initialConsultPracticeAreas + item.number + '/';
        });
        obj.initialConsultPracticeAreas = initialConsultPracticeAreas;
      }
      if (obj.states && obj.states.length > 0) {
        let states = '';
        obj.states.map(item => {
          states = states + item.number + '/';
        });
        obj.states = states;
      }
      if (obj.groups && obj.groups.length > 0) {
        let groups = '';
        obj.groups.map(item => {
          groups = groups + item.number + '/';
        });
        obj.groups = groups;
      }
    });

    this.exporttocsvService.downloadFile(rows, this.columnList, 'EmployeeList');
  }

  /** update Attorney table footer page count */
  updateDatatableFooterPage() {
    this.page.totalElements = this.rows.length;
    this.page.totalPages = Math.ceil(this.rows.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.table.offset = 0;
    this.checkParentCheckbox();
    UtilsHelper.aftertableInit();
  }

  /*** open menu on action click */
  openMenu(index: number, event): void {
    event.stopPropagation();
    setTimeout(() => {
      if (this.currentActive !== index) {
        this.currentActive = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        event.target
          .closest('.datatable-row-wrapper')
          .classList.add('datatable-row-hover');
      } else {
        this.currentActive = null;
        event.target
          .closest('.datatable-row-wrapper')
          .classList.remove('datatable-row-hover');
      }
    }, 50);
  }

  /*** closed menu on body click */
  onClickedOutside(index: number) {
    if (index === this.currentActive) {
      this.currentActive = null;
    }
  }

  /**
   * Reactivate employee
   *
   * @param {*} obj
   * @memberof ListComponent
   */
  empReactivate() {
    this.employeeService
      .v1EmployeeReactivateIdPut$Response({ id: this.reactivateEmployee.id })
      .subscribe(
        suc => {
          this.getDetails();
          this.modalService.dismissAll('Employee reactivated.');
          this.toastDisplay.showSuccess(this.errorData.employee_reactivate);
          if (this.noteForm.value.content != null) {
            this.saveNotes(this.reactivateEmployee);
          }
        },
        err => { }
      );
  }

  reactivateEmp(obj) {
    this.reactivateEmployee = obj;
  }

  saveNotes(obj) {
    this.formSubmitted = true;
    if (this.noteForm.valid) {
      const data = { ...this.noteForm.value };
      data.name = 'reactivate employee note';
      if (data.id === 0) {
        this.noteService
          .v1NotePersonAddPersonIdPost$Json({
            personId: obj.id,
            body: data
          })
          .pipe(finalize(() => { }))
          .subscribe(
            suc => {
              this.noteForm.reset();
              this.showForm = false;
              this.toastDisplay.showSuccess(this.errorData.add_note_success);
            },
            err => {
              console.log(err);
            }
          );
      } else {
        this.noteService
          .v1NotePersonUpdatePersonIdPut$Json({
            personId: obj.id,
            body: data
          })
          .pipe(finalize(() => { }))
          .subscribe(
            suc => {
              this.noteForm.reset();
              this.showForm = false;
              this.toastDisplay.showSuccess(this.errorData.update_note_success);
            },
            err => {
              console.log(err);
            }
          );
      }
    }
  }

  get isExportValid() {
    return (this.rows.length && this.columnList.some(item => item.isChecked));
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.rows) {
      return this.rows.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  /**** function to select/deselect only displayed page record */
  selectDeselectRecords() {
    this.allSelected = !this.allSelected
    this.table.bodyComponent.temp.forEach(row => {
      const index = this.rows.findIndex(list => list.id === row.id);
      if (index > -1) {
        this.rows[index]['selected'] = this.allSelected;
      }
      const existingIndex = this.selected.findIndex(list => list.id === row.id);
      if (existingIndex > -1 && !row.selected) {
        this.selected.splice(existingIndex, 1)
      } else if (row.selected && existingIndex === -1) {
        this.selected.push(row);
      }
    })
    this.setSelected();
  }

  /******* function to select/deselect child checkbox  */
  changeChildSelection(row) {
    row.selected = !row.selected
    const existingIndex = this.selected.findIndex(list => list.id === row.id);
    if (existingIndex > -1 && !row.selected) {
      this.selected.splice(existingIndex, 1)
    } else if (row.selected && existingIndex === -1) {
      this.selected.push(row);
    }
    this.setSelected();
  }

  setSelected() {
    this.rows.forEach(list => {
      const selectedIds = this.selected.filter(selected => selected.id === list.id);
      if (selectedIds.length > 0) {
        list['selected'] = true;
      }
    });
    this.checkParentCheckbox();
  }

  checkParentCheckbox() {
    setTimeout(() => {
      const currentArr = []
      this.table.bodyComponent.temp.forEach(row => {
        const existing = this.rows.filter(list => list.id === row.id)[0];
        if (existing) {
          currentArr.push(existing)
        }
      });
      this.allSelected = currentArr.length && currentArr.every(row => row.selected);
    }, 100)
  }

  /*** function to remove selection */
  removeSelection() {
    this.rows.forEach(list => {
      list['selected'] = false;
    })
    this.selected = [];
    this.checkParentCheckbox();
  }
}

