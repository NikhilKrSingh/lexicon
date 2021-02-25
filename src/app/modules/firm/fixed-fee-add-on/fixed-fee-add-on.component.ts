import { Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwFixedFeeAddOn } from 'src/common/swagger-providers/models';
import { FixedFeeServiceService, TenantService } from 'src/common/swagger-providers/services';
import { Page } from '../../models';
import { Tenant } from '../../models/firm-settinngs.model';
import * as errorData from '../../shared/error.json';
import { calculateTotalPages } from '../../shared/math.helper';

@Component({
  selector: 'app-fixed-fee-add-on',
  templateUrl: './fixed-fee-add-on.component.html',
  styleUrls: ['./fixed-fee-add-on.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class FixedFeeAddOnComponent implements OnInit {
  @Input() public permission: any;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  public ColumnMode = ColumnMode;
  public action: any;
  public modalHeader: string;
  public statusList: Array<any>;

  public page = new Page();
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selectPageSize = new FormControl('10');
  public fixeFeeAddOnList: any;
  public originnalFixeFeeAddOnList: any;
  public pageSelected = 1;
  public currentActive: number;
  public loading: boolean = false;
  public statusId: number;
  public searchText: string = '';

  private confirmMessage: string;
  private errorData: any = (errorData as any).default;

  private firmDetails: Tenant;

  constructor(
    private modalService: NgbModal,
    private fixedFeeService: FixedFeeServiceService,
    private tenantService: TenantService,
    private toast: ToastDisplay
  ) {
    this.statusList = [
      {
        id: 1,
        name: 'Active'
      },
      {
        id: 2,
        name: 'Disabled'
      }
    ];
  }

  ngOnInit() {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.getTenantDetail();
    this.getFixedFeeServiceListAddOn();
  }

  /**
   * Get tenant details
   */
  private async getTenantDetail() {
    try {
      const resp: any = await this.tenantService.v1TenantGet().toPromise();
      if (resp) {
        this.firmDetails = JSON.parse(resp as any).results;
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * getting Fixed Fee Add-On List
   */
  private async getFixedFeeServiceListAddOn() {
    this.loading = true;
    try {
      const resp: any = await this.fixedFeeService
        .v1FixedFeeServiceAddonmasterListGet()
        .toPromise();
      if (resp) {
        this.originnalFixeFeeAddOnList = JSON.parse(resp as any).results;
        this.fixeFeeAddOnList = [...this.originnalFixeFeeAddOnList];
        this.calcTotalPages();
        this.loading = false;
        this.applyFilter();
      } else {
        this.loading = false;
      }
    } catch (error) {
      console.error(error);
      this.loading = false;
    }
  }

  /**
   * opens modal
   */

  public async openFixedFeeAction(row: any, action?: string, template?: any) {
    this.selectModalHeader(action);
    this.action = { data: row, type: action, chargeCode: '' };
    if (action === 'Create') {
      this.loading = true;
      try {
        let resp: any = await this.fixedFeeService
          .v1FixedFeeServiceAddonmastercodeGet()
          .toPromise();

        resp = JSON.parse(resp as any);
        if (resp.results) {
          this.action.chargeCode = resp.results;
        }
        this.loading = false;
      } catch (error) {
        console.error(error);
        this.loading = false;
      }
    }

    this.modalService.open(template, {
      centered: true,
      backdrop: 'static',
      windowClass: 'modal-md'
    });
  }

  public selectModalHeader(action: string) {
    switch (action) {
      case 'Create':
        this.modalHeader = 'Create Billing Code';
        break;

      case 'Edit':
      case 'Enable':
      case 'Disable':
        this.modalHeader = action + ' Fixed Fee Add-On';
        break;
    }
  }

  public applyFilter() {
    let filteredList: any = this.originnalFixeFeeAddOnList;
    if (this.statusId && this.searchText) {
      this.searchText = this.searchText.trim().toLowerCase();
      if (this.statusId) {
        filteredList = this.originnalFixeFeeAddOnList.filter(f => {
          if (this.statusId === 1) {
            return (
              (f.status == 'Active' &&
                (f.description || '')
                  .toLowerCase()
                  .includes(this.searchText.toLowerCase())) ||
              (f.code || '')
                .toLowerCase()
                .includes(this.searchText.toLowerCase())
            );
          }

          if (this.statusId === 2) {
            return (
              (f.status == 'Disabled' &&
                (f.description || '')
                  .toLowerCase()
                  .includes(this.searchText.toLowerCase())) ||
              (f.code || '')
                .toLowerCase()
                .includes(this.searchText.toLowerCase())
            );
          }
        });
      }
    } else {
      if (this.statusId) {
        filteredList = this.originnalFixeFeeAddOnList.filter(f => {
          if (this.statusId === 1) return f.status === 'Active';
          return f.status === 'Disabled';
        });
      }

      if (this.searchText) {
        this.searchText = this.searchText.trim().toLowerCase();
        filteredList = this.originnalFixeFeeAddOnList.filter(f => {
          return (
            (f.code || '')
              .toLowerCase()
              .includes(this.searchText.toLowerCase()) ||
            (f.description || '')
              .toLowerCase()
              .includes(this.searchText.toLowerCase())
          );
        });
      }
    }

    this.fixeFeeAddOnList = [...filteredList];
    this.calcTotalPages();
  }

  /** Data Table Items per page */
  public pageSizeChange(): void {
    this.page.size = +this.selectPageSize.value;
    this.page.totalPages = Math.ceil(
      this.fixeFeeAddOnList.length / this.page.size
    );
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
  }

  /**
   * Calculate total pages
   */

  public calcTotalPages() {
    this.page.totalElements = this.fixeFeeAddOnList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
  }

  /**
   * utility function
   */
  public counter(): Array<any> {
    return new Array(this.page.totalPages);
  }
  
  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
  }

  /**
   * Change Data Table Page
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.calcTotalPages();
    }
  }

  /**
   * open menu on action click
   */
  openMenu(index: number, event): void {
    event.stopPropagation();
    setTimeout(() => {
      if (this.currentActive != index) {
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

  /**
   * closed menu on body click
   */
  onClickedOutside(index: number, event?: any) {
    if (index == this.currentActive) {
      this.currentActive = null;
    }
  }

  /**
   * perform actions create, edit, disable, enable
   */
  public performAction(data: any) {
    if (data === 'Close') {
      this.modalService.dismissAll();
      return;
    }

    this.loading = true;
    switch (this.action.type) {
      case 'Create':
        this.confirmMessage = this.errorData.success_fixed_fee_service_create_addon;
        this.createFixedFeeServiceAddOn(data);
        break;

      case 'Edit':
        this.confirmMessage = this.errorData.success_fixed_fee_service_edit_addon;
        this.updateFixedFeeServiceAddOn(data);
        break;

      case 'Enable':
      case 'Disable':
        this.confirmMessage =
          this.action.type === 'Enable'
            ? this.errorData.success_fixed_fee_service_enable_addon
            : this.errorData.success_fixed_fee_service_disable_addon;
        this.changeStatusFixedFeeServiceAddOn(data);
        break;
    }
  }

  /**
   * Create Fixed Fee Service
   */
  private async createFixedFeeServiceAddOn(data: any) {
    const body: vwFixedFeeAddOn = {
      tenantId: +this.firmDetails.id,
      code: data.code.value,
      description: data.name.value,
      amount: +data.amount.value
    };
    try {
      const resp: any = await this.fixedFeeService
        .v1FixedFeeServiceAddonmasterCreatePost$Json({ body })
        .toPromise();
      this.confirmFixedFeeRequest(resp);
    } catch (error) {
      console.error(error);
      this.loading = false;
    }
  }

  /**
   * Update Fixed Fee Service
   */
  private async updateFixedFeeServiceAddOn(data: any) {
    const body: vwFixedFeeAddOn = {
      id: +this.action.data.id,
      tenantId: +this.firmDetails.id,
      code: data.code.value,
      description: data.name.value,
      amount: +data.amount.value
    };
    try {
      const resp: any = await this.fixedFeeService
        .v1FixedFeeServiceAddonmasterUpdatePut$Json({ body })
        .toPromise();
      this.confirmFixedFeeRequest(resp);
    } catch (error) {
      console.error(error);
      this.loading = false;
    }
  }

  /**
   * Enable/Disaable Fixed Fee Service
   */

  private async changeStatusFixedFeeServiceAddOn(isVisible: boolean) {
    try {
      const resp: any = await this.fixedFeeService
        .v1FixedFeeServiceAddonmasterEnabledisableIdPut({
          id: this.action.data.id,
          isVisible
        })
        .toPromise();
      this.confirmFixedFeeRequest(resp);
    } catch (error) {
      console.error(error);
      this.loading = false;
    }
  }

  /**
   * Confirms Fixed Fee Service either success or failure
   */
  private confirmFixedFeeRequest(resp: any) {
    if (JSON.parse(resp as any).results) {
      this.getFixedFeeServiceListAddOn();
      this.modalService.dismissAll();
      setTimeout(() => {
        this.toast.showSuccess(this.confirmMessage);
      }, 1000);
      return;
    }
    this.toast.showError(this.errorData.server_error);
    this.loading = false;
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.fixeFeeAddOnList) {
      return this.fixeFeeAddOnList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
