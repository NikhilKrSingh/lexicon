import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { Page } from "../../../models";
import * as Constant from "../../../shared/const";

@Component({
  selector: 'app-set-rates',
  templateUrl: './set-rates.component.html',
  styleUrls: ['./set-rates.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class SetRatesComponent implements OnInit {
  @ViewChild('allRateTable', {static: false}) allRateTable: DatatableComponent;

  tableRateForm: FormGroup;
  tableRateFormSubmitted = false;
  allRateTableSearchText: string;
  allRateTables = [];
  originalAllRateTables = [];
  ColumnMode = ColumnMode;
  SelectionType = SelectionType
  allRateTablesPage = new Page();
  allRateTablesPageSelector = new FormControl('10');
  allRateTablesPageSelected = 1;
  limitArray: Array<number> = [10, 30, 50, 100];
  counter = Array;
  messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound
  };
  selectedRateTables = [];
  selectedRateTableDisplayList = [];
  loading = false;
  allRateTableSelected = false;

  constructor(
    private modalService: NgbActiveModal,
    private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.allRateTablesPage.pageNumber = 0;
    this.allRateTablesPage.size = 10;
    this.tableRateForm = this.formBuilder.group({
      tableRate: [''],
    });
    this.updateDatatableFooterAllRateTablesPage();
  }

  cancelTableRate() {
    this.tableRateForm.reset();
    this.modalService.dismiss();
    this.tableRateFormSubmitted = false;
    this.allRateTableSearchText = null;
    this.allRateTables = [...this.originalAllRateTables];
  }

  allRateTableSearch() {
    const val = this.allRateTableSearchText;
    const temp = this.originalAllRateTables.filter(
      item =>
        this.matchName(item, 'rateTableName', val)
    );
    this.allRateTables = [...temp];
    this.updateDatatableFooterAllRateTablesPage();
  }

  private matchName(item: any, fieldName, searchValue: string): boolean {
    const searchName =
      item && item[fieldName] ? item[fieldName].toString().toLowerCase() : '';
    return searchName.search(searchValue.toLowerCase()) > -1;
  }

  public allRateTablesPageChange(e) {
    this.allRateTablesPageSelected = e.page;
    this.changeAllRateTablesPage();
  }

  public changeAllRateTablesPage() {
    this.allRateTablesPage.pageNumber = this.allRateTablesPageSelected - 1;
    this.checkSelectedRateTable()
  }

  public changeAllRateTablesPageSize() {
    this.allRateTablesPage.size = +this.allRateTablesPageSelector.value;
    this.updateDatatableFooterAllRateTablesPage();
  }

  updateDatatableFooterAllRateTablesPage() {
    this.allRateTablesPage.totalElements = this.allRateTables.length;
    this.allRateTablesPage.totalPages = Math.ceil(
      this.allRateTables.length / this.allRateTablesPage.size
    );
    this.allRateTablesPage.pageNumber = 0;
    this.allRateTablesPageSelected = 1;
    // Whenever the filter changes, always go back to the first page
    if (this.allRateTable) {
      this.allRateTable.offset = 0;
      this.allRateTable.selectAllRowsOnPage = true;
    }
    this.checkSelectedRateTable();
    this.loading = false;
  }

  selectRateTablesInPage() {
    this.allRateTableSelected = !this.allRateTableSelected;
    this.allRateTable.bodyComponent.temp.forEach(row => {
      const index = this.allRateTables.findIndex(jobFamily => jobFamily.rateTableId === row.rateTableId);
      if (index > -1) {
        this.allRateTables[index].selected = this.allRateTableSelected;
      }
      const existingRateTableIndex = this.selectedRateTables.findIndex(jobFamily => jobFamily.rateTableId === row.rateTableId);
      if (existingRateTableIndex > -1 && !row.selected) {
        this.selectedRateTables.splice(existingRateTableIndex, 1)
      } else if (row.selected && existingRateTableIndex === -1) {
        this.selectedRateTables.push(row);
      }
    })
    this.setSelectedRateTableDetails();
  }

  changeRateTableSelection(row) {
    row.selected = !row.selected
    const existingRateTableIndex = this.selectedRateTables.findIndex(jobFamily => jobFamily.rateTableId === row.rateTableId);
    if (existingRateTableIndex > -1 && !row.selected) {
      this.selectedRateTables.splice(existingRateTableIndex, 1)
    } else if (row.selected && existingRateTableIndex === -1) {
      this.selectedRateTables.push(row);
    }
    this.setSelectedRateTableDetails();
  }

  setSelectedRateTableDetails() {
    this.getDisplayList();
    this.allRateTables.forEach(rateTable => {
      const selectedRateTable = this.selectedRateTables.filter(selected => selected.rateTableId === rateTable.rateTableId);
      if (selectedRateTable.length > 0) {
        rateTable.selected = true;
      }
    });
    this.originalAllRateTables.forEach(rateTable => {
      const selectedRateTable = this.selectedRateTables.filter(selected => selected.rateTableId === rateTable.rateTableId);
      rateTable.selected = selectedRateTable.length > 0;
    });
    this.checkSelectedRateTable();
  }

  checkSelectedRateTable() {
    setTimeout(() => {
      if (this.selectedRateTables.length) {
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
      const currentRateTables = []
      this.allRateTable.bodyComponent.temp.forEach(row => {
        const existingRateTable = this.allRateTables.filter(jobFamily => jobFamily.rateTableId === row.rateTableId)[0];
        if (existingRateTable) {
          currentRateTables.push(existingRateTable)
        }
      });
      this.allRateTableSelected = currentRateTables.length && currentRateTables.every(row => row.selected);
    }, 100)
  }

  getDisplayList() {
    this.selectedRateTableDisplayList = [];
    const displayList = [...this.selectedRateTables];
    // This is to show minimum of 4 entries in each column
    const chunkSize = Math.ceil(displayList.length / 3) > 4 ? Math.ceil(displayList.length / 3) : 4;
    displayList.sort((a, b) => (a.rateTableName.toLowerCase() > b.rateTableName.toLowerCase()) ? 1 : (a.rateTableName.toLowerCase() < b.rateTableName.toLowerCase()) ? -1 : 0);
    while (displayList.length) {
      this.selectedRateTableDisplayList.push(displayList.splice(0, chunkSize));
    }
  }

  saveRateTables() {
    if (this.selectedRateTables && this.tableRateForm.valid) {
      this.saveTableRate();
    } else {
      this.tableRateFormSubmitted = true;
      if (this.tableRateForm.invalid) {
        return;
      }
      this.modalService.close(this.originalAllRateTables);
    }
  }

  saveTableRate() {
    this.tableRateFormSubmitted = true;
    if (this.tableRateForm.invalid) {
      return;
    }
    const tableRateFormData = this.tableRateForm.value;
    this.selectedRateTables.forEach(rateTable => {
      const selectedRateTableIndex = this.originalAllRateTables.findIndex(selectedTable => selectedTable.rateTableId === rateTable.rateTableId);
      if (selectedRateTableIndex > -1) {
        this.originalAllRateTables[selectedRateTableIndex].tableRate = tableRateFormData.tableRate;
        this.originalAllRateTables[selectedRateTableIndex].selected = false;
      }
    });
    this.allRateTables = [...this.originalAllRateTables];
    this.originalAllRateTables = [...this.originalAllRateTables];
    this.selectedRateTables = [];
    this.selectedRateTableDisplayList = [];
    this.tableRateFormSubmitted = false;
    this.tableRateForm.reset();
    this.checkSelectedRateTable();
  }

  setTableRate() {
    if (this.tableRateForm.controls.tableRate.value) {
      const baseRateValue = +this.tableRateForm.controls.tableRate.value;
      this.tableRateForm.patchValue({
        tableRate: baseRateValue.toFixed(2)
      });
    }
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.allRateTables) {
      return this.allRateTables.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
