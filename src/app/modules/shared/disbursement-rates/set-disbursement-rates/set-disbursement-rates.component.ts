import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { IOffice, Page } from 'src/app/modules/models';
import * as Constant from 'src/app/modules/shared/const';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwDisbursement } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-set-disbursement-rates',
  templateUrl: './set-disbursement-rates.component.html',
  styleUrls: ['./set-disbursement-rates.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class SetDisbursementRatesComponent implements OnInit {
  @ViewChild(DatatableComponent, { static: true }) jobfamilynametable: DatatableComponent;

  public page = new Page();
  public pangeSelected: number = 1;
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelector = new FormControl('10');
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public counter = Array;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public oriDisbursementTypes: Array<any> = [];
  public disbursementTypes: Array<any> = [];
  public isLoading: boolean = false;
  public statusList: Array<IOffice> = [
    {
      id: 1,
      name: 'Hard'
    },
    {
      id: 2,
      name: 'Soft'
    },
    {
      id: 3,
      name: 'All'
    }
  ];
  public type: number = 3;
  public searchinput: string;
  public pageType: string;

  constructor(
    private activeModal: NgbActiveModal
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
   }

  ngOnInit() {
    this.disbursementTypes.map((obj) => {
      obj.customRate = (obj.customRate || obj.customRate === 0) ? (+obj.customRate).toFixed(2) : obj.customRate;
    });
    this.oriDisbursementTypes = [...this.disbursementTypes];
    this.updateDatatableFooterPage();
  }



  /**
   * Handle search filter
   *
   */
  public searchFilter() {
    this.disbursementTypes = this.oriDisbursementTypes.filter(a => {
      let matching = true;
      if (this.type && this.type !== 3) {
        let type = (this.type === 1) ? 'Hard' : 'Soft';
        matching = matching && a.type.name === type;
      }
      if (this.searchinput) {
        matching = matching && (UtilsHelper.matchName(a, this.searchinput, 'code') || UtilsHelper.matchName(a, this.searchinput, 'description'))
      }
      return matching;
    });
    this.updateDatatableFooterPage();
  }

  /**
   * Formate number to 2 digit after decimal
   *
   */
  public formatRate(row) {
    if (row && row.customRate) {
      row.customRate = (+row.customRate).toFixed(2);
      this.oriDisbursementTypes.map(d => {
        if (d.id === row.id) {
          d.customRate = row.customRate
        }
      });
    } else {
      this.oriDisbursementTypes.map(d => {
        if (d.id === row.id) {
          d.customRate = row.customRate
        }
      });
    }
  }

  /**
   * Handle save button
   *
   */
  public setrates() {
    let execeptionRate = [];
    let execeptionSame = [];

    if (this.oriDisbursementTypes && this.oriDisbursementTypes.length > 0) {
      this.oriDisbursementTypes.map((obj) => {
        if (obj.customRate && obj.rate !== +obj.customRate) {
          obj.isCustom = true;
          execeptionRate.push(obj);
          execeptionSame.push(obj);
        } else {
          if (obj.isCustom) {
            obj.isCustom = false;
            execeptionSame.push(obj);
          }
          obj.customRate = null;
        }
      });
    }
    this.activeModal.close({execeptionRate, execeptionSame, disbursementTypes: this.oriDisbursementTypes});
  }


  public close() {
    this.activeModal.close(null);
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
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  /**
   * Handle change page number
   *
   */
  public pageChange(e) {
    this.pangeSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  /**
   * Update datatable footer
   */
  updateDatatableFooterPage() {
    this.page.totalElements = this.disbursementTypes.length;
    this.page.totalPages = Math.ceil(this.disbursementTypes.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.jobfamilynametable.offset = 0;
    UtilsHelper.aftertableInit();
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.disbursementTypes) {
      return this.disbursementTypes.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
