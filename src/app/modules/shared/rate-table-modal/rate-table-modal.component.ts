import { Component, EventEmitter, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { cloneDeep } from 'lodash';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { Observable, Subscription } from 'rxjs';
import { EmployeeService } from '../../../../common/swagger-providers/services/employee.service';
import { RateTableMappingService } from '../../../../common/swagger-providers/services/rate-table-mapping.service';
import { RateTableService } from '../../../../common/swagger-providers/services/rate-table.service';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { Page } from '../../models';
import * as Constant from '../const';
import { CurrencyPipe } from "@angular/common";
import { ToastDisplay } from 'src/app/guards/toast-service';

@Component({
  selector: 'app-rate-table-modal',
  templateUrl: './rate-table-modal.component.html',
  styleUrls: ['./rate-table-modal.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class RateTableModalComponent implements OnInit {
  @ViewChild('jobFamilyTable', {static: false}) jobFamilyTable: DatatableComponent;
  @ViewChild(DatatableComponent, {static: false}) rateDataTable: DatatableComponent;

  public searchStr: string;
  public rateTableSearchStr: string;
  public jobFamilyList = [];
  public originalJobFamilyList = [];
  public rateTables = [];
  public rateTableList = [];
  public originalRateTableList = [];
  public isClient = false;
  showJobFamilyList: boolean;
  rateTableFormSubmitted: boolean;
  createRateTableFormSubmitted: boolean;
  SelectionType = SelectionType;
  ColumnMode = ColumnMode;
  footerHeight = 50;
  public createRateTableForm: FormGroup;
  public tableRateForm: FormGroup;

  page = new Page();
  pageSelector = new FormControl('10');
  pageSelected = 1;

  rateTablePage = new Page();
  rateTablePageSelector = new FormControl('10');
  rateTablePageSelected = 1;
  limitArray: Array<number> = [10, 30, 50, 100];
  counter = Array;
  messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound
  };
  selectedJobFamilies: any = [];
  selectedJobFamilyDisplayList: any[] = [];
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  isExistingName: any;
  selectedRateTable: any = [];
  loading = false;

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  detailsLoading: boolean;
  allJobFamiliesSelected: boolean;
  selectedRow: any;

  constructor(
    private employeeService: EmployeeService,
    private rateTableService: RateTableService,
    private rateTableMappingService: RateTableMappingService,
    private formBuilder: FormBuilder,
    private activeModal: NgbActiveModal,
    private toastr: ToastDisplay,
    private store: Store<fromRoot.AppState>,
    private currencyPipe: CurrencyPipe
  ) {
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
    this.getJobFamilies();
    this.createRateTableForm = this.formBuilder.group({
      id: [0],
      isNewRateTable: [false],
      name: [''],
      description: [''],
      jobFamily: [[]]
    });
    let rateTableData: any = {};
    if (this.rateTables.length) {
      rateTableData = this.rateTables[0];
      if (!rateTableData.isNewRateTable) {
        this.selectedRateTable = cloneDeep(this.rateTables);
        this.createRateTableForm.patchValue({
          id: rateTableData.id
        });
      } else {
        this.createRateTableForm.patchValue({
          id: rateTableData.id ? rateTableData.id : 0,
          isNewRateTable: rateTableData.isNewRateTable ? rateTableData.isNewRateTable : false,
          name: rateTableData.name,
          description: rateTableData.description,
          jobFamily: rateTableData.jobFamily
        });
      }
    }
    this.createRateTableForm.controls.isNewRateTable.valueChanges.subscribe((value) => {
      if (!value) {
        this.createRateTableForm.controls.name.disable();
        this.createRateTableForm.controls.name.clearValidators();
        this.createRateTableForm.updateValueAndValidity();
      } else {
        this.createRateTableForm.controls.name.enable();
        this.createRateTableForm.controls.name.setValidators(Validators.required);
        this.createRateTableForm.updateValueAndValidity();
        this.selectedRateTable = [];
      }
    });
  }

  cancelRateTableModal() {
    if (this.tableRateForm) {
      this.tableRateForm.reset();
    }
    this.createRateTableForm.reset();
    this.removeJobFamilySelection();
    this.activeModal.dismiss('Cross click');
    this.createRateTableFormSubmitted = false;
    this.rateTableFormSubmitted = false;
    this.showJobFamilyList = false;
    this.isExistingName = false;
  }

  saveRateTable() {
    this.createRateTableFormSubmitted = true;
    const formData = this.createRateTableForm.value;
    if (formData.isNewRateTable) {
      this.createNewRateTable(formData)
    } else {
      this.setExistingRateTable(formData);
    }
  }

  createNewRateTable(formData) {
    if (this.createRateTableForm.invalid || (this.tableRateForm && this.tableRateForm.invalid)) {
      return;
    }
    this.loading = true;
    this.rateTableService.v1RateTableCheckGet({id: formData.id, name: formData.name})
      .subscribe((result: any) => {
        this.isExistingName = JSON.parse(result).results;
        this.loading = false;
        if (!this.isExistingName) {
          const jobFamily = [];
          this.originalJobFamilyList.forEach(jobFamilyDetail => {
            const item: any = {};
            item.id = jobFamilyDetail.id;
            item.name = jobFamilyDetail.name;
            item.baseRate = jobFamilyDetail.baseRate || 0;
            item.tableRate = jobFamilyDetail.tableRate || 0;
            item.exceptionRate = jobFamilyDetail.tableRate !== parseFloat(jobFamilyDetail.exceptionRate) ? parseFloat(jobFamilyDetail.exceptionRate) : 0;
            item.isCustom = jobFamilyDetail.baseRate !== jobFamilyDetail.tableRate;
            jobFamily.push(item);
          });
          this.rateTables = [{
            id: formData.isNewRateTable || !formData.id ? 0 : formData.id,
            name: formData.name,
            description: formData.description,
            isNewRateTable: formData.isNewRateTable,
            jobFamily
          }];
          this.closeRateTableModal()
        } else {
          return;
        }
      }, () => {
        this.loading = false;
      });
  }

  setExistingRateTable(formData) {
    if (!this.selectedRateTable || !this.selectedRateTable.length) {
      const errorMsg = this.isClient ? 'Please select a rate table to apply to this client.' : 'Please select a rate table to apply to this matter.';
      this.toastr.showError(errorMsg);
      return;
    }
    let isEdit = false;
    if (this.selectedRateTable.length && this.rateTables.length && this.selectedRateTable[0].id === formData.id) {
      isEdit = true;
    }
    this.loading = true;
    this.rateTableService.v1RateTableIdGet({id: this.selectedRateTable[0].id}).subscribe((result: any) => {
      const rateTableDetail = JSON.parse(result).results;
      rateTableDetail.lstvwCustomizeRateTableJobfamily.forEach(customJobFamily => {
        const existingJobFamily = this.selectedRateTable[0].jobFamily.findIndex(jobFamilyDetail => jobFamilyDetail.id === customJobFamily.jobFamilyId);
        if (existingJobFamily > -1) {
          this.selectedRateTable[0].jobFamily[existingJobFamily].tableRate = customJobFamily.tableRate;
        } else {
          customJobFamily.tableRate = customJobFamily.jobFamilyBaseRate;
        }
      });
      this.loading = false;
      this.rateTables = cloneDeep(this.selectedRateTable);
      this.rateTables[0].jobFamily.forEach(jobFamilyDetail => {
        if (jobFamilyDetail.exceptionRate) {
          jobFamilyDetail.exceptionRate = jobFamilyDetail.exceptionRate.replace('$', '');
          jobFamilyDetail.exceptionRate = jobFamilyDetail.tableRate !== parseFloat(jobFamilyDetail.exceptionRate) ? parseFloat(jobFamilyDetail.exceptionRate) : null;
        } else {
          jobFamilyDetail.exceptionRate = null;
        }
      });
      this.rateTables[0].isNewRateTable = false;
      this.rateTables[0].isEdit = this.rateTables[0].jobFamily.some(item => item.exceptionRate >= 0) && isEdit;
      this.closeRateTableModal()
    }, () => {
      this.loading = false;
    });

  }

  closeRateTableModal() {
    if (this.tableRateForm) {
      this.tableRateForm.reset();
    }
    this.createRateTableForm.reset();
    this.removeJobFamilySelection();
    this.activeModal.close(this.rateTables);
    this.createRateTableFormSubmitted = false;
    this.rateTableFormSubmitted = false;
    this.showJobFamilyList = false;
    this.isExistingName = false;
  }

  showJobFamilyRate() {
    this.showJobFamilyList = true;
    this.tableRateForm = this.formBuilder.group({
      tableRate: [null]
    });
    setTimeout(() => {
      if (this.jobFamilyTable) {
        this.jobFamilyTable.selectAllRowsOnPage = true;
      }
    }, 500)
  }

  public pageChange(e) {
    this.pageSelected = e.page;
    this.changePage();
  }

  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    this.checkSelectedJobFamily();
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  checkSelectedJobFamily() {
    setTimeout(() => {
      if (this.selectedJobFamilies.length) {
        this.tableRateForm.controls.tableRate.setValidators(Validators.required);
        this.tableRateForm.controls.tableRate.enable();
        this.tableRateForm.updateValueAndValidity();
      } else {
        if (this.tableRateForm) {
          this.tableRateForm.controls.tableRate.clearValidators();
          this.tableRateForm.controls.tableRate.disable();
          this.tableRateForm.updateValueAndValidity();
        }
      }
      const currentJobFamilies = []
      this.jobFamilyTable.bodyComponent.temp.forEach(row => {
        const existingJobFamily = this.jobFamilyList.filter(jobFamily => jobFamily.id === row.id)[0];
        if (existingJobFamily) {
          currentJobFamilies.push(existingJobFamily)
        }
      });
      this.allJobFamiliesSelected = currentJobFamilies.length && currentJobFamilies.every(row => row.selected);
    }, 100)
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.jobFamilyList.length;
    this.page.totalPages = Math.ceil(
      this.jobFamilyList.length / this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    // Whenever the filter changes, always go back to the first page
    if (this.jobFamilyTable) {
      this.jobFamilyTable.offset = 0;
    }
    this.checkSelectedJobFamily();
  }

  selectJobFamiliesInPage() {
    this.allJobFamiliesSelected = !this.allJobFamiliesSelected
    this.jobFamilyTable.bodyComponent.temp.forEach(row => {
      const index = this.jobFamilyList.findIndex(jobFamily => jobFamily.id === row.id);
      if (index > -1) {
        this.jobFamilyList[index].selected = this.allJobFamiliesSelected;
      }
      const existingJobFamilyIndex = this.selectedJobFamilies.findIndex(jobFamily => jobFamily.id === row.id);
      if (existingJobFamilyIndex > -1 && !row.selected) {
        this.selectedJobFamilies.splice(existingJobFamilyIndex, 1)
      } else if (row.selected && existingJobFamilyIndex === -1) {
        this.selectedJobFamilies.push(row);
      }
    })
    this.setSelectedJobFamilyDetails();
  }

  changeJobFamilySelection(row) {
    row.selected = !row.selected
    const existingJobFamilyIndex = this.selectedJobFamilies.findIndex(jobFamily => jobFamily.id === row.id);
    if (existingJobFamilyIndex > -1 && !row.selected) {
      this.selectedJobFamilies.splice(existingJobFamilyIndex, 1)
    } else if (row.selected && existingJobFamilyIndex === -1) {
      this.selectedJobFamilies.push(row);
    }
    this.setSelectedJobFamilyDetails();
  }

  removeJobFamilySelection() {
    this.jobFamilyList.forEach(jobFamily => {
      jobFamily.selected = false;
    })
    this.selectedJobFamilies = [];
    this.checkSelectedJobFamily();
  }

  setSelectedJobFamilyDetails() {
    this.getDisplayList();
    this.jobFamilyList.forEach(jobFamily => {
      const selectedJobFamily = this.selectedJobFamilies.filter(selected => selected.id === jobFamily.id);
      if (selectedJobFamily.length > 0) {
        jobFamily.selected = true;
      }
    });
    this.checkSelectedJobFamily();
  }

  getDisplayList() {
    this.selectedJobFamilyDisplayList = [];
    const displayList = [...this.selectedJobFamilies];
    // This is to show minimum of 4 entries in each column
    const chunkSize = Math.ceil(displayList.length / 3) > 4 ? Math.ceil(displayList.length / 3) : 4;
    displayList.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : (a.name.toLowerCase() < b.name.toLowerCase()) ? -1 : 0);
    while (displayList.length) {
      this.selectedJobFamilyDisplayList.push(displayList.splice(0, chunkSize));
    }
  }

  setTableRate() {
    if (this.tableRateForm.controls.tableRate.value) {
      const baseRateValue = +this.tableRateForm.controls.tableRate.value;
      this.tableRateForm.patchValue({
        tableRate: baseRateValue.toFixed(2)
      });
    }
  }

  saveJobFamilyRate() {
    this.rateTableFormSubmitted = true;
    if (this.tableRateForm.invalid) {
      return;
    }
    const tableRateFormData = this.tableRateForm.value;
    this.jobFamilyList.forEach(jobFamily => {
      const selectedJobFamily = this.selectedJobFamilies.filter(selected => selected.id === jobFamily.id);
      if (selectedJobFamily.length > 0) {
        jobFamily.tableRate = parseFloat(tableRateFormData.tableRate);
      }
    });
    this.jobFamilyList = [...this.jobFamilyList];
    this.tableRateForm.reset();
    this.selectedJobFamilyDisplayList = [];
    this.rateTableFormSubmitted = false;
    this.removeJobFamilySelection();
  }

  searchJobFamily() {
    const val = this.searchStr;
    const temp = this.originalJobFamilyList.filter(
      item =>
        this.matchName(item, 'name', val)
    );
    this.jobFamilyList = [...temp];
    this.updateDatatableFooterPage();
  }

  private matchName(item: any, fieldName, searchValue: string): boolean {
    const searchName =
      item && item[fieldName] ? item[fieldName].toString().toLowerCase() : '';
    return searchName.search(searchValue.toLowerCase()) > -1;
  }

  getJobFamilies() {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.loading = true;
    this.employeeService.v1EmployeeJobFamilyGet().subscribe((result: any) => {
      this.jobFamilyList = JSON.parse(result).results;
      this.jobFamilyList.forEach(jobFamily => {
        jobFamily.baseRate = jobFamily.baseRate ? jobFamily.baseRate : 0;
        if (this.createRateTableForm.value.isNewRateTable && this.createRateTableForm.value.jobFamily) {
          this.showJobFamilyRate();
          const existingJobFamilyIndex = this.createRateTableForm.value.jobFamily.findIndex(jobFamilyDetail => jobFamilyDetail.id === jobFamily.id);
          if (existingJobFamilyIndex > -1) {
            jobFamily.tableRate = this.createRateTableForm.value.jobFamily[existingJobFamilyIndex].tableRate;
          } else {
            jobFamily.tableRate = jobFamily.baseRate;
          }
        } else {
          jobFamily.tableRate = jobFamily.baseRate;
        }
      });
      this.originalJobFamilyList = [...this.jobFamilyList];
      this.updateDatatableFooterPage();
      this.getRateTables();
    }, () => {
      this.loading = false;
    });
  }

  getRateTables() {
    this.loading = true;
    this.rateTablePage.pageNumber = 0;
    this.rateTablePage.size = 10;
    this.rateTableMappingService.v1RateTableMappingGet().subscribe((result: any) => {
      let list = JSON.parse(result).results;
      list = list.filter(item => item.status);
      this.rateTableList = [...list];
      this.rateTableList.forEach(rateTable => {
        if (!this.createRateTableForm.value.isNewRateTable) {
          if (this.selectedRateTable && this.selectedRateTable.length && rateTable.id === this.selectedRateTable[0].id) {
            rateTable.selected = true;
            rateTable.jobFamily = cloneDeep(this.selectedRateTable[0].jobFamily);
          } else {
            rateTable.jobFamily = cloneDeep(this.jobFamilyList);
          }
        } else if (this.createRateTableForm.value.isNewRateTable && this.createRateTableForm.value.jobFamily) {
          rateTable.jobFamily = cloneDeep(this.createRateTableForm.value.jobFamily);
        }
      });
      this.originalRateTableList = [...this.rateTableList];
      this.updateRateDatatableFooterPage();
      this.loading = false;
    }, () => {
      this.loading = false;
    });
  }

  searchRateTable() {
    const val = this.rateTableSearchStr;
    const temp = this.originalRateTableList.filter(
      item =>
        this.matchName(item, 'name', val) ||
        this.matchName(item, 'description', val)
    );
    this.rateTableList = [...temp];
    this.updateRateDatatableFooterPage();
  }

  public rateTablePageChange(e) {
    this.rateTablePageSelected = e.page;
  }

  public changeRateTablePage() {
    this.rateTablePage.pageNumber = this.rateTablePageSelected - 1;
  }

  public changeRateTablePageSize() {
    this.rateTablePage.size = +this.rateTablePageSelector.value;
    this.updateRateDatatableFooterPage();
  }

  updateRateDatatableFooterPage() {
    this.rateTablePage.totalElements = this.rateTableList.length;
    this.rateTablePage.totalPages = Math.ceil(
      this.rateTableList.length / this.rateTablePage.size
    );
    this.rateTablePage.pageNumber = 0;
    this.rateTablePageSelected = 1;
    // Whenever the filter changes, always go back to the first page
    if (this.rateDataTable) {
      this.rateDataTable.offset = 0;
    }
  }

  toggleRow(row) {
    if(this.selectedRow && this.selectedRow.id != row.id){
      this.rateDataTable.rowDetail.collapseAllRows();
    }
    row.showExceptionRate = false;
    this.showRowDetails(row, false);
  }
  onDetailToggle(event) {
    this.selectedRow = event.value;
  }

  showRowDetails(row, type: boolean) {
    if (type) {
      if (!row.expanded) {
        this.rateDataTable.rowDetail.toggleExpandRow(row);
        row['expanded'] = !row['expanded'];
      }
    } else {
      this.rateDataTable.rowDetail.toggleExpandRow(row);
      row['expanded'] = !row['expanded'];
    }
    if (row.expanded) {
      this.detailsLoading = true;
      this.rateTableService.v1RateTableIdGet({id: row.id}).subscribe((result: any) => {
        const rateTableDetail = JSON.parse(result).results;
        rateTableDetail.lstvwCustomizeRateTableJobfamily.forEach(customJobFamily => {
          const existingJobFamily = row.jobFamily.findIndex(jobFamilyDetail => jobFamilyDetail.id === customJobFamily.jobFamilyId);
          if (existingJobFamily > -1) {
            row.jobFamily[existingJobFamily].tableRate = customJobFamily.tableRate;
          } else {
            customJobFamily.tableRate = customJobFamily.jobFamilyBaseRate;
          }
        });
        row.jobFamily.forEach(jobFamilyDetail => {
          this.rateFormat(jobFamilyDetail)
        })
        this.detailsLoading = false;
      }, () => {
        this.detailsLoading = false;
      });
    }
  }

  setExceptionRate(row) {
    row.selected = true;
    row.showExceptionRate = true;
    this.showRowDetails(row, true);
  }

  public rateFormat(jobFamilyDetail) {
    if (jobFamilyDetail && +jobFamilyDetail.exceptionRate >= 0) {
      jobFamilyDetail.exceptionRate = this.currencyPipe.transform(jobFamilyDetail.exceptionRate, 'USD');
    }
  }

  public onRadioSelected(row) {
    this.selectedRateTable = [row];
  }

  public setRate(event, row) {
    if (event.keyCode == 46 || event.keyCode == 8) {
      if (event.target.value == '$') {
        row.exceptionRate = ''
      }
    }
  }

  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || k == 8 || k == 9;
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get rtFooterHeight() {
    if (this.rateTableList) {
      return this.rateTableList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  get jfFooterHeight() {
    if (this.jobFamilyList) {
      return this.jobFamilyList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
