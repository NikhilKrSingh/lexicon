import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { Observable, Subscription } from 'rxjs';
import { EmployeeService } from '../../../../../common/swagger-providers/services/employee.service';
import { RateTableService } from '../../../../../common/swagger-providers/services/rate-table.service';
import * as fromRoot from '../../../../store';
import * as fromPermissions from '../../../../store/reducers/permission.reducer';
import { Page } from '../../../models';
import * as Constant from '../../../shared/const';
import { SetRatesComponent } from "../set-rates/set-rates.component";
import { cloneDeep } from 'lodash';
import { ToastDisplay } from 'src/app/guards/toast-service';

@Component({
  selector: 'app-job-families-create',
  templateUrl: './job-families-create.component.html',
  styleUrls: ['./job-families-create.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class JobFamiliesCreateComponent implements OnInit {
  @ViewChild('jobRateTable', {static: false}) jobRateTable: DatatableComponent;

  jobFamilyForm: FormGroup;
  permissionList: any = {};
  formSubmitted = false;
  loading = false;
  jobFamilies = [];
  jobRateTables = [];
  originalJobRateTables = [];
  jobFamilyId = null;
  closeResult: string;
  jobRateTableSearchText: string;
  ColumnMode = ColumnMode;
  SelectionType = SelectionType;
  page = new Page();
  pageSelector = new FormControl('10');
  pageSelected = 1;
  limitArray: Array<number> = [10, 30, 50, 100];
  counter = Array;
  messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound
  };
  jobFamilyDetail: any;

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;

  constructor(
    private formBuilder: FormBuilder,
    private employeeService: EmployeeService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private store: Store<fromRoot.AppState>,
    private modalService: NgbModal,
    private title: Title,
    private toastrService: ToastDisplay,
    private rateTableService: RateTableService
  ) {
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.jobFamilyForm = this.formBuilder.group({
      name: ['', [Validators.required, this.checkJobNameUsed.bind(this)]],
      baseRate: [null, Validators.required]
    });
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (!this.permissionList.BILLING_MANAGEMENTisAdmin) {
            this.removeBaseRate();
          }
        }
      }
    });
    this.jobFamilyId = +this.activatedRoute.snapshot.params.jobFamilyId;
    if (this.jobFamilyId) {
      this.getJobFamilyDetail();
      this.title.setTitle('Edit Job Family');
    } else {
      this.title.setTitle('Create Job Family');
      this.getRateTables();
    }
    this.getAllJobFamilies();
    this.jobFamilyForm.controls.baseRate.valueChanges.subscribe(
      (baseRate: any) => {
        this.setBaseRateChangeInTables(baseRate);
      }
    );
  }

  setBaseRateChangeInTables(baseRate) {
    this.originalJobRateTables.forEach(jobRateTable => {
      if (jobRateTable.tableRate === jobRateTable.jobFamilyBaseRate) {
        jobRateTable.tableRate = baseRate;
      }
      jobRateTable.jobFamilyBaseRate = baseRate;
    });
    this.jobRateTables = [...this.originalJobRateTables];
    this.originalJobRateTables = [...this.originalJobRateTables];
  }

  checkJobNameUsed(control: FormControl) {
    if (control.value) {
      if (!this.jobFamilies.length) {
        return null;
      } else {
        const isJobNameUsed =
          this.jobFamilies.filter(jobFamily => {
            return (
              (this.jobFamilyId !== jobFamily.id &&
                jobFamily.name.toUpperCase() === control.value.toUpperCase()) ||
              (!this.jobFamilyId &&
                jobFamily.name.toUpperCase() === control.value.toUpperCase())
            );
          }).length > 0;
        return isJobNameUsed ? { jobNameUsed: true } : null;
      }
    }
    return null;
  }

  removeBaseRate() {
    this.jobFamilyForm.controls.baseRate.clearValidators();
    this.jobFamilyForm.controls.baseRate.disable();
    this.jobFamilyForm.controls.baseRate.updateValueAndValidity();
  }

  setCurrencyValue() {
    if (this.jobFamilyForm.controls.baseRate.value != null) {
      const baseRateValue = +this.jobFamilyForm.controls.baseRate.value;
      this.jobFamilyForm.patchValue({
        baseRate: baseRateValue.toFixed(2)
      });
    }
  }

  getAllJobFamilies() {
    this.loading = true;
    this.employeeService.v1EmployeeJobFamilyGet({}).subscribe(
      (data: any) => {
        this.jobFamilies = JSON.parse(data).results;
        this.loading = false;
      },
      err => {
        console.log(err);
        this.loading = false;
      }
    );
  }

  getRateTables() {
    this.rateTableService.v1RateTableGet().subscribe((data: any) => {
      const allRateTables = JSON.parse(data).results;
      this.setJobRateTables(allRateTables)
    });
  }

  setJobRateTables(rateTables) {
    rateTables.forEach(rateTable => {
      const existingJobRateTableIndex = this.originalJobRateTables.findIndex(jobRateTable => jobRateTable.rateTableId === rateTable.id);
      if (existingJobRateTableIndex > -1) {
        this.originalJobRateTables[existingJobRateTableIndex] = {
          rateTableId: rateTable.id,
          rateTableName: rateTable.name,
          tableRate: this.originalJobRateTables[existingJobRateTableIndex].tableRate,
          jobFamilyBaseRate: this.jobFamilyForm.value.baseRate
        };
        rateTable.tableRate = this.originalJobRateTables[
          existingJobRateTableIndex
        ].tableRate;
      } else {
        this.originalJobRateTables.push({
          rateTableId: rateTable.id,
          rateTableName: rateTable.name,
          tableRate: this.jobFamilyForm.value.baseRate,
          jobFamilyBaseRate: this.jobFamilyForm.value.baseRate
        });
        rateTable.tableRate = rateTable.baseRate;
      }
    });
    this.jobRateTables = [...this.originalJobRateTables];
    this.updateDatatableFooterPage();
  }

  getJobFamilyDetail() {
    this.employeeService
      .v1EmployeeJobFamilyJobfamilyidGet({ jobfamilyid: this.jobFamilyId })
      .subscribe((result: any) => {
        this.jobFamilyDetail = JSON.parse(result).results;
        if (this.jobFamilyDetail.baseRate) {
          this.jobFamilyDetail.baseRate = this.jobFamilyDetail.baseRate.toFixed(
            2
          );
        } else {
          this.jobFamilyDetail.baseRate = 0;
        }
        this.jobRateTables = [...this.jobFamilyDetail.rateTableJobfamilies];
        this.originalJobRateTables = [
          ...this.jobFamilyDetail.rateTableJobfamilies
        ];
        this.updateDatatableFooterPage();
        this.jobFamilyForm.patchValue({
          name: this.jobFamilyDetail.name,
          baseRate: this.jobFamilyDetail.baseRate
        });
        this.setCurrencyValue();
        this.getRateTables();
      });
  }

  save() {
    this.formSubmitted = true;
    if (this.jobFamilyForm.invalid) {
      return;
    }
    this.loading = true;
    const formData = this.jobFamilyForm.value;
    const id = this.jobFamilyId ? this.jobFamilyDetail.id : 0;
    const noOfEmp = this.jobFamilyId
      ? this.jobFamilyDetail.numberOfEmployee
      : 0;
    this.originalJobRateTables.forEach(jobRateTables => {
      if (!this.permissionList.BILLING_MANAGEMENTisAdmin) {
        jobRateTables.tableRate = 0;
        jobRateTables.jobFamilyBaseRate = 0;
      } else {
        jobRateTables.tableRate = parseFloat(jobRateTables.tableRate);
        jobRateTables.jobFamilyBaseRate = parseFloat(
          jobRateTables.jobFamilyBaseRate
        );
      }
    });
    const body = {
      id,
      name: formData.name,
      baseRate: +formData.baseRate,
      rateTableJobfamilies:
        this.originalJobRateTables && this.originalJobRateTables.length
          ? this.originalJobRateTables
          : [],
      numberOfEmployee: noOfEmp
    };
    if (this.jobFamilyId) {
      this.employeeService
        .v1EmployeeJobFamilyPut$Json$Response({
          body
        })
        .subscribe(
          () => {
            this.toastrService.showSuccess('Job family updated.');
            this.router.navigate(['firm/job-families']);
            this.loading = false;
          },
          err => {
            console.log(err);
            this.loading = false;
          }
        );
    } else {
      this.employeeService
        .v1EmployeeJobFamilyPost$Json$Response({
          body
        })
        .subscribe(
          () => {
            this.toastrService.showSuccess('Job family created.');
            this.router.navigate(['firm/job-families']);
            this.loading = false;
          },
          err => {
            console.log(err);
            this.loading = false;
          }
        );
    }
  }

  cancel() {
    this.router.navigate(['/firm/job-families']);
  }

  openModal(className, winClass) {
    const modalRef = this.modalService
      .open(SetRatesComponent, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static'
      })
    modalRef.componentInstance.originalAllRateTables = cloneDeep(this.originalJobRateTables);
    modalRef.componentInstance.allRateTables = cloneDeep(this.originalJobRateTables);
    modalRef.result.then(result => {
      this.originalJobRateTables = [...result];
      this.jobRateTables = [...result];
      this.updateDatatableFooterPage()
     }, reason => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  jobRateTableSearch() {
    const val = this.jobRateTableSearchText;
    const temp = this.originalJobRateTables.filter(item =>
      this.matchName(item, 'rateTableName', val)
    );
    this.jobRateTables = [...temp];
    this.updateDatatableFooterPage();
  }

  private matchName(item: any, fieldName, searchValue: string): boolean {
    const searchName =
      item && item[fieldName] ? item[fieldName].toString().toLowerCase() : '';
    return searchName.search(searchValue.toLowerCase()) > -1;
  }

  public pageChange(e) {
    this.pageSelected = e.page;
  }

  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateDatatableFooterPage();
    }
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.jobRateTables.length;
    this.page.totalPages = Math.ceil(
      this.jobRateTables.length / this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    // Whenever the filter changes, always go back to the first page
    if (this.jobRateTable) {
      this.jobRateTable.offset = 0;
    }
    this.loading = false;
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.jobRateTables) {
      return this.jobRateTables.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
