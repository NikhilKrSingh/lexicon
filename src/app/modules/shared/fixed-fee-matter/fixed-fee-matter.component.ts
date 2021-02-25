import { Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as errors from 'src/app/modules/shared/error.json';
import { FixedFeeServiceService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import { Page } from '../../models';
import { UtilsHelper } from '../utils.helper';

@Component({
  selector: 'app-fixed-fee-matter',
  templateUrl: './fixed-fee-matter.component.html',
  styleUrls: ['./fixed-fee-matter.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class FixedFeeMatterComponent implements OnInit {
  public page = new Page();
  public ColumnMode = ColumnMode;
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public SelectionType = SelectionType;
  public loading: boolean = true;
  public selectPageSize = new FormControl('10');
  public searchText: string;
  public createType: string = 'existing';
  public customFixedFee: FormGroup;
  public formSubmitted: boolean;
  public existFormSubmitted: boolean = false;

  public originnalFixeFeeList: Array<any> = [];
  public fixeFeeList: Array<any> = [];
  public selectedRows: Array<any> = [];
  public selectedFixedFeeId: number;

  public permissionList: any;
  public tenantTierName: string;
  public existing_matter_warning: string;
  error_data = (errors as any).default;

  @Input() modalType: string;
  @Input() parentList: any;
  @Input() isExistingMatter: boolean = false;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  constructor(
    private fixedFeeService: FixedFeeServiceService,
    private fb: FormBuilder,
    private store: Store<fromRoot.AppState>,
    private activeModal: NgbActiveModal
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    this.getPermission();
    this.existing_matter_warning = this.error_data.existing_matter_warning;
    const userInfo: any = UtilsHelper.getLoginUser();
    if (userInfo && userInfo.tenantTier) {
      this.tenantTierName = userInfo.tenantTier.tierName;
    }

    switch (this.modalType) {
      case 'fixedFeeservice':
        this.getFixedFeeListService();
        break;

      case 'addOn':
        this.getFixedFeeListAddOn();
        break;
    }
  }


  /*********** Getting Permissions ***********/
  private getPermission() {
    this.store.select('permissions').subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  /*** getting Fixed Fee Add-On List *******/
  private async getFixedFeeListAddOn() {
    try {
      const resp: any = await this.fixedFeeService
        .v1FixedFeeServiceAddonmasterListGet()
        .toPromise();
      if (resp) {
        this.fixeFeeList = JSON.parse(resp as any).results;
        this.fixeFeeList = this.fixeFeeList.filter((item) => {
          return item.isVisible ? !/^(C-[0-9]+)$/.test(item.code) : false;
        });
        this.originnalFixeFeeList = [...this.fixeFeeList];
        this.originnalFixeFeeList = _.sortBy(this.originnalFixeFeeList, 'code');
        this.loading = false;
        if (this.parentList && this.parentList.length) {
          let i: Array<any> = this.parentList.map(item => item.id);
          i = i.filter(n => n)
          this.originnalFixeFeeList = this.originnalFixeFeeList.filter(item => {
            return !i.includes(item.id);
          })
        }
        this.fixeFeeList = [...this.originnalFixeFeeList];
        this.updateDatatableFooterPage();
      }
    } catch (error) {
      console.error(error);
      this.loading = false;
    }
  }

  /************* getting Fixed Fee Service List ********/
  private async getFixedFeeListService() {
    try {
      const resp: any = await this.fixedFeeService
        .v1FixedFeeServiceGet()
        .toPromise();
      if (resp) {
        this.fixeFeeList = JSON.parse(resp as any).results;
        this.fixeFeeList = this.fixeFeeList.filter((item) => {
          return item.isVisible ? !/^(C-[0-9]+)$/.test(item.code) : false;
        });
        this.originnalFixeFeeList = [...this.fixeFeeList];
        this.originnalFixeFeeList = _.sortBy(this.originnalFixeFeeList, 'code');
        this.loading = false;
        if (this.parentList && this.parentList.length) {
          let i: Array<any> = this.parentList.map(item => item.id);
          i = i.filter(n => n)
          this.originnalFixeFeeList = this.originnalFixeFeeList.filter(item => {
            return !i.includes(item.id);
          });
        }
        this.fixeFeeList = [...this.originnalFixeFeeList];
        this.updateDatatableFooterPage();
      }
    } catch (error) {
      console.error(error);
      this.loading = false;
    }
  }

  /******* Apply Filter ********/
  applyFilter() {
    let rows = [...this.originnalFixeFeeList];

    if (this.searchText) {
      rows = this.originnalFixeFeeList.filter(f => {
        return (
          (f.code || '').toLowerCase().includes(this.searchText) ||
          (f.description || '').toLowerCase().includes(this.searchText.toLowerCase())
        );
      });
    }
    this.fixeFeeList = rows;
    this.updateDatatableFooterPage();
  }

  /**** Clears Selected Rows ******/
  public clearSelectedRows() {
    this.fixeFeeList = [];
    this.table.selected = [];
    this.onSelect({ selected: [] });
    this.fixeFeeList = [...this.originnalFixeFeeList];
  }

  /******** trigger when create radio button select ************/
  public onSelectRadioFixedFee(event?: any) {
    this.formSubmitted = false;
    this.existFormSubmitted = false;
    this.createType = event.target.value;
    if (this.createType === 'custom') {
      this.clearSelectedRows();
      this.createCustomFixedFeeForm();
      let customAddon: Array<any> = [];
      if (this.parentList && this.parentList.length > 0) {
        customAddon = this.parentList.filter(list => list.hasOwnProperty('isCustomAddOn'));
      }
      this.selectedFixedFeeId = null;
      if (!customAddon.length) {
        switch (this.modalType) {
          case 'addOn':
            this.getCustomGeneratedAddOnCode();
            break;

          case 'fixedFeeservice':
            this.getCustomGeneratedFixedFeeServiceCode();
            break;
        }

      } else {
        let code: any = customAddon[0].code;
        code = code.replace(/\d+/ig, function (a) { return a * 1 + customAddon.length; });
        this.customFixedFee.controls['code'].setValue(code);
      }
      return;
    }
  }

  /******** Creates Form ************/
  private createCustomFixedFeeForm() {
    this.customFixedFee = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      amount: [null, Validators.required]
    });
  }

  /********** get custom generated code **********/
  private async getCustomGeneratedAddOnCode() {
    this.loading = true;
    try {
      let resp: any = await this.fixedFeeService
        .v1FixedFeeServiceAddonmastercustomcodeGet()
        .toPromise();

      resp = JSON.parse(resp as any).results;
      if (resp) {
        this.f['code'].patchValue(resp);
      }
      this.loading = false;
    } catch (error) {
      console.error(error);
      this.loading = false;
    }
  }

  /********** get custom generated code **********/
  private async getCustomGeneratedFixedFeeServiceCode() {
    this.loading = true;
    try {
      let resp: any = await this.fixedFeeService
        .v1FixedFeeServiceFixedfeeservicecustomcodeGet()
        .toPromise();

      resp = JSON.parse(resp as any).results;
      if (resp) {
        this.f['code'].setValue(resp);
      }
      this.loading = false;
    } catch (error) {
      console.error(error);
      this.loading = false;
    }
  }

  /**
   * get form controls.
   */
  get f() {
    return this.customFixedFee.controls;
  }

  /**
   * checks is form valid.
   */
  private isFormValid(): boolean {
    this.formSubmitted = true;
    return this.customFixedFee.valid;
  }

  /******  trriger when select row from data table *****/
  public onSelect(data, inf?: any) {
    if (inf && inf === 'existing') {
      this.selectedRows = [];
      this.selectedRows.push(data);
      return;
    }

    this.selectedRows = [];
    this.selectedRows = [...data.selected];
  }

  /** Data Table Items per page */
  public pageSizeChange(): void {
    this.page.size = +this.selectPageSize.value;
    this.updateDatatableFooterPage();
  }

  /**
   * Calculate total pages
   */
  public calculateTotalPage() {
    this.page.totalPages = Math.ceil(
      this.fixeFeeList.length / this.page.size
    );
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.fixeFeeList.length;
    this.page.totalPages = Math.ceil(this.fixeFeeList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
  }

  /**
   * utility function
   */
  public counter(): Array<any> {
    return new Array(this.page.totalPages);
  }

  /**
   * Change Data Table Page
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateDatatableFooterPage();
    }
    UtilsHelper.aftertableInit();
  }

  /****** Change Page Drop Down */
  public changePageDropDown(e) {
    this.pageSelected = e.page;
  }

  public close() {
    this.activeModal.close(null);
  }

  /********** Save Fixed Fee ********/
  public save() {
    switch (this.createType) {
      case 'existing':
        this.existFormSubmitted = true;
        this.createExistingFixedFee();
        break;

      case 'custom':
        this.formSubmitted = true;
        this.createCustomFixedFee();
        break;
    }
  }

  public createExistingFixedFee() {
    if (this.selectedRows.length === 0) {
      return;
    }
    this.selectedRows.map((obj) => {
      obj['oriAmount'] = obj.amount;
    });
    this.existFormSubmitted = false;
    this.activeModal.close(this.selectedRows);
  }

  public createCustomFixedFee() {
    if (!this.isFormValid()) {
      this.removePrefix();
      return;
    }

    this.formSubmitted = false;
    this.activeModal.close(
      [{
        code: this.f['code'].value,
        description: this.f['name'].value,
        amount: +this.f['amount'].value,
        isCustomAddOn: true
      }]
    );
  }

  removePrefix(): void {
    if (+this.customFixedFee.controls['amount'].value <= 0 || this.customFixedFee.controls['amount'].value.trim() === '') {
      this.customFixedFee.controls['amount'].setValue(null);
    }
  }

  addCent(): void {
    if (+this.customFixedFee.controls['amount'].value > 0) {
      this.customFixedFee.controls['amount'].setValue((+this.customFixedFee.controls['amount'].value).toFixed(2));
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.fixeFeeList) {
      return this.fixeFeeList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}

