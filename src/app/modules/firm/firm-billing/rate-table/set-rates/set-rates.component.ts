import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { IJobFamilyRate, Page } from 'src/app/modules/models';
import * as Constant from 'src/app/modules/shared/const';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';

@Component({
  selector: 'app-set-rates',
  templateUrl: './set-rates.component.html',
  styleUrls: ['./set-rates.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class SetRatesComponent implements OnInit {
  @ViewChild('jobfamilynametable', { static: true }) jobfamilynametable: DatatableComponent;

  public page = new Page();
  public pangeSelected: number = 1;
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelector = new FormControl('10');
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public counter = Array;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public selecteFamilyRates: Array<IJobFamilyRate> = [];
  public jobFamilyRates: Array<IJobFamilyRate> = [];
  public oriJobFamilyRates: Array<IJobFamilyRate> = [];
  public isLoading: boolean = false;
  public rateTableError: boolean = true;
  public submitRateTable: boolean = false;
  public rateTableRow: IJobFamilyRate;
  public rateTableId: number;
  public tableRate: string;
  public searchinput: string;
  public dispMessage: string = '';
  public selected: Array<IJobFamilyRate> = [];
  public sortedSelected: Array<IJobFamilyRate> = [];
  allJobFamiliesSelected: boolean;
  selectedJobFamilyDisplayList: any[] = [];
  searchString: string = '';
  constructor(
    private activeModal: NgbActiveModal,
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
   }

  ngOnInit() {
    this.updateDatatableFooterPage();
  }

  /**
   * Handle search filter
   *
   */
  public searchFilter(event) {
    const val = (event && event.target) ? event.target.value : '';
    this.searchString = val;
    let temp = [];
    temp = this.oriJobFamilyRates.filter(
      item => UtilsHelper.matchName(item, this.searchString, 'name')
    );
    this.jobFamilyRates = temp;
    this.updateDatatableFooterPage();
  }

  /**
   * Formate number to 2 digit after decimal
   *
   */
  public formatRate(row, type: string = null) {
    if (type === 'tablerate') {
      if (this.tableRate) {
        this.tableRate = (+this.tableRate).toFixed(2);
      }
    } else {
      if (row && row.tableRate) {
        row.tableRate = (+row.tableRate).toFixed(2);
        this.oriJobFamilyRates.map(d => {
          if (d.id === row.id) {
            d.tableRate = row.tableRate
          }
        });
        row.error = false;
      }
    }
  }

  rateTableSave() {
    this.submitRateTable = true;
    this.dispMessage = 'Please select at least one job and enter a table rate.';
    if (this.tableRate && this.selected && this.selected.length > 0) {
      this.updateValue();
    }
  }

  public updateValue() {
    this.jobFamilyRates.map((item) => {
      let existRct = this.selected.find(obj => obj.id === item.id);
      item.tableRate =  ((existRct) ? this.tableRate : item.tableRate);
    });
    this.tableRate = null;
    this.searchinput = null;
    let arrayMerged = [];
    if (this.searchString) {
      arrayMerged = this.oriJobFamilyRates.filter(obj => {
        return this.jobFamilyRates.filter(obj1 => {
          return +obj.id !== + obj1.id;
        });
      });
    } else {
      arrayMerged = this.jobFamilyRates;
    }
    this.jobFamilyRates = arrayMerged;
    this.jobfamilynametable.onColumnSort({ sorts: [{prop: 'name', dir: 'asc'}] });
    this.selected = [];
    this.submitRateTable = false;
  }

  /**
   * Handle save button
   *
   */
  public setrates() {
    if (this.rateTableId) {
      if (this.selected && this.selected.length > 0 && !this.tableRate) {
        this.submitRateTable = true;
        this.dispMessage = 'Enter a rate or clear your job selection.';
        return;
      } else {
        this.updateValue();
      }
    } else {
      if (this.jobFamilyRates && this.jobFamilyRates.length > 0) {
        this.rateTableError = false;
        this.jobFamilyRates.map((obj) => {
          if (!obj.tableRate) {
            this.rateTableError = true;
            obj.error = true;
          }
        });
      }
      if (this.rateTableError) {
        this.jobfamilynametable.onColumnSort({ sorts: [{prop: 'tableRate', dir: 'asc'}] });
        return;
      } else {
        this.updateValue();
      }
    }
    this.activeModal.close(this.jobFamilyRates);
  }

  selectJobFamiliesInPage() {
    this.allJobFamiliesSelected = !this.allJobFamiliesSelected
    this.jobfamilynametable.bodyComponent.temp.forEach(row => {
      const index = this.jobFamilyRates.findIndex(jobFamily => jobFamily.id === row.id);
      if (index > -1) {
        this.jobFamilyRates[index]['selected'] = this.allJobFamiliesSelected;
      }
      const existingJobFamilyIndex = this.selected.findIndex(jobFamily => jobFamily.id === row.id);
      if (existingJobFamilyIndex > -1 && !row.selected) {
        this.selected.splice(existingJobFamilyIndex, 1)
      } else if (row.selected && existingJobFamilyIndex === -1) {
        this.selected.push(row);
      }
    })
    this.setSelectedJobFamilyDetails();
  }

  changeJobFamilySelection(row) {
    row.selected = !row.selected
    const existingJobFamilyIndex = this.selected.findIndex(jobFamily => jobFamily.id === row.id);
    if (existingJobFamilyIndex > -1 && !row.selected) {
      this.selected.splice(existingJobFamilyIndex, 1)
    } else if (row.selected && existingJobFamilyIndex === -1) {
      this.selected.push(row);
    }
    this.setSelectedJobFamilyDetails();
  }

  setSelectedJobFamilyDetails() {
    this.getDisplayList();
    this.jobFamilyRates.forEach(jobFamily => {
      const selectedJobFamily = this.selected.filter(selected => selected.id === jobFamily.id);
      if (selectedJobFamily.length > 0) {
        jobFamily['selected'] = true;
      }
    });
  }

  getDisplayList() {
    this.selectedJobFamilyDisplayList = [];
    const displayList = [...this.selected];
    // This is to show minimum of 4 entries in each column
    const chunkSize = Math.ceil(displayList.length / 3) > 4 ? Math.ceil(displayList.length / 3) : 4;
    displayList.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : (a.name.toLowerCase() < b.name.toLowerCase()) ? -1 : 0);
    while (displayList.length) {
      this.selectedJobFamilyDisplayList.push(displayList.splice(0, chunkSize));
    }
  }



  public close() {
    this.activeModal.close(null);
    this.removeJobFamilySelection();
  }

  /**
   * Change per page size
   *
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  /**
   * Change page number
   *
   */
  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    }
    this.checkSelectedJobFamily();
    UtilsHelper.aftertableInit();
  }

  /**
   * Handle change page number
   *
   */
  public pageChange(e) {
    this.pangeSelected = e.page;
    this.changePage();
  }

  removeJobFamilySelection() {
    this.jobFamilyRates.forEach(jobFamily => {
      jobFamily['selected'] = false;
    })
    this.checkSelectedJobFamily();
  }

  checkSelectedJobFamily() {
    setTimeout(() => {
      const currentJobFamilies = []
      this.jobfamilynametable.bodyComponent.temp.forEach(row => {
        const existingJobFamily = this.jobFamilyRates.filter(jobFamily => jobFamily.id === row.id)[0];
        if (existingJobFamily) {
          currentJobFamilies.push(existingJobFamily)
        }
      });
      this.allJobFamiliesSelected = currentJobFamilies.length && currentJobFamilies.every(row => row.selected);
    }, 100)
  }

  /**
   * Update datatable footer
   */
  updateDatatableFooterPage() {
    this.page.totalElements = this.jobFamilyRates.length;
    this.page.totalPages = Math.ceil(this.jobFamilyRates.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.jobfamilynametable.offset = 0;
    this.checkSelectedJobFamily();
    UtilsHelper.aftertableInit();
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.jobFamilyRates) {
      return this.jobFamilyRates.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
