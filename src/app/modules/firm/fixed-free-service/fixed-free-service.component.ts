import { Component, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwFixedFeeServices, vwIdName } from 'src/common/swagger-providers/models';
import { FixedFeeServiceService, TenantService } from 'src/common/swagger-providers/services';
import { Page } from '../../models';
import { Tenant } from '../../models/firm-settinngs.model';
import * as errorData from '../../shared/error.json';
import { calculateTotalPages } from '../../shared/math.helper';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-fixed-free-service',
  templateUrl: './fixed-free-service.component.html',
  styleUrls: ['./fixed-free-service.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class FixedFreeServiceComponent implements OnInit {
  firmDetails: Tenant;
  statusList: Array<vwIdName>;
  statusId: number;
  searchText: string;
  fixedFeeServiceList: Array<vwFixedFeeServices>;
  originalFixedFeeServiceList: Array<vwFixedFeeServices>;

  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public loading = true;

  currentActive: number;
  action: any;
  public formSubmitted: boolean = false;
  public modalHeader: string;
  public modal: NgbModal;
  public errorData: any = (errorData as any).default;
  private confirmMessage: string;

  @Input() public permission: any;
  @ViewChild(DatatableComponent, {static: false}) table: DatatableComponent;

  constructor(
    private fixedFeeService: FixedFeeServiceService,
    private tenantService: TenantService,
    private pagetitle: Title,
    private modalService: NgbModal,
    private toast: ToastDisplay
  ) {
    this.modal = this.modalService;
    this.page.pageNumber = 0;
    this.page.size = 10;

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
    this.pagetitle.setTitle("Fixed Fee Services");
    this.getTenantDetail();

  }

  getTenantDetail() {
    this.tenantService
      .v1TenantGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          this.firmDetails = res;
          if (this.firmDetails) {
            this.getFixedFeeServiceList();
          } else {
            this.showError();
          }
        },
        () => {
          this.showError();
        }
      );
  }

  private showError() {
  }

  getFixedFeeServiceList() {
    this.fixedFeeService
      .v1FixedFeeServiceGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res) {
            this.originalFixedFeeServiceList = res;
            this.fixedFeeServiceList = [...this.originalFixedFeeServiceList];
            this.page.totalElements = this.originalFixedFeeServiceList.length;
            this.page.totalPages = Math.ceil(
              this.originalFixedFeeServiceList.length / this.page.size
            );
            this.loading = false;
            this.applyFilter();
          } else {
            this.showError();
            this.loading = false;
          }
        },
        () => {
          this.showError();
          this.loading = false;
        }
      );
  }

  /**
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.page.totalPages = Math.ceil(
      this.fixedFeeServiceList.length / this.page.size
    );
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.calcTotalPages();
    }
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalPages() {
    this.page.totalElements = this.fixedFeeServiceList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
  }

  applyFilter() {
    let rows = [...this.originalFixedFeeServiceList];

    if (this.statusId && this.searchText) {
      rows = this.originalFixedFeeServiceList.filter(f => {
        if (this.statusId == 1) {
          return (
            f.status == 'Active' &&
            (f.description || '')
              .toLowerCase()
              .includes(this.searchText.toLowerCase()) ||
            (f.code || '').toLowerCase().includes(this.searchText.toLowerCase())
          );
        }
        if (this.statusId == 2) {
          return (
            f.status == 'Disabled' &&
            (f.description || '')
              .toLowerCase()
              .includes(this.searchText.toLowerCase()) ||
            (f.code || '').toLowerCase().includes(this.searchText.toLowerCase())
          );
        }
      });
    } else if (this.statusId) {
      rows = this.originalFixedFeeServiceList.filter(f => {
        if (this.statusId == 1) {
          return f.status == 'Active';
        }
        return f.status == 'Disabled';
      });
    } else if (this.searchText) {
      rows = this.originalFixedFeeServiceList.filter(f => {
        return (
          (f.description || '')
            .toLowerCase()
            .includes(this.searchText.toLowerCase()) ||
          (f.code || '').toLowerCase().includes(this.searchText.toLowerCase())
        );
      });
    }

    this.fixedFeeServiceList = rows;
    this.calcTotalPages();
  }

  /*** open menu on action click */
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

  /*** closed menu on body click */
  onClickedOutside(index: number, event?: any) {
    if (index == this.currentActive) {
      this.currentActive = null;
    }
  }

  /**
   *  opens Fixed Fee Service Modal #isActiveFixedFeeServiceModal
   */
  public async openFixedFeeAction(data: any, action?: string, template?: any) {
    this.selectModalHeader(action);
    this.action = {data, type: action, chargeCode: ''};

    if (action === 'Create') {
      this.loading = true;
      try {
        let resp: any = await this.fixedFeeService
          .v1FixedFeeServiceFixedfeeservicecodeGet()
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
      windowClass: 'modal-md',
    });
  }

  public performAction(data: any) {
    if (data === 'Close') {
      this.modal.dismissAll()
      return;
    }

    this.loading = true;
    switch (this.action.type) {
      case 'Create':
        this.confirmMessage = this.errorData.success_fixed_fee_service_create;
        this.createFixedFeeService(data);
        break;

      case 'Edit':
        this.confirmMessage = this.errorData.success_fixed_fee_service_edit;
        this.updateFixedFeeService(data);
        break;

      case 'Enable':
      case 'Disable':
        this.confirmMessage = this.action.type === 'Enable'
          ? this.errorData.success_fixed_fee_service_enable
          : this.errorData.success_fixed_fee_service_disable;
        this.changeStatusFixedFeeService(data);
        break;
    }
  }

  public selectModalHeader(action: string) {
    switch (action) {
      case 'Create':
        this.modalHeader = 'Create Billing Code';
        break;

      case 'Edit':
      case 'Enable':
      case 'Disable':
        this.modalHeader = action + ' Fixed Fee Service';
        break;
    }
  }

  /**
   * Create Fixed Fee Service
   */
  private async createFixedFeeService(data: any) {
    const param: vwFixedFeeServices = {
      code: data.code.value,
      tenantId: this.firmDetails.id,
      description: data.name.value,
      amount: +data.amount.value,
    };

    try {
      const resp: any = await this.fixedFeeService
        .v1FixedFeeServicePost$Json({body: param})
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
  private async updateFixedFeeService(data: any) {
    const param: vwFixedFeeServices = {
      id: this.action.data.id,
      code: this.action.data.code,
      tenantId: this.firmDetails.id,
      description: data.name.value,
      amount: +data.amount.value,
    };

    try {
      const resp: any = await this.fixedFeeService
        .v1FixedFeeServicePut$Json({body: param})
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

  private async changeStatusFixedFeeService(isVisible: boolean) {
    try {
      const resp: any = await this.fixedFeeService
        .v1FixedFeeServiceEnabledisableIdPut({id: this.action.data.id, isVisible})
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
    if (resp && JSON.parse(resp as any).results > 0) {
      this.modalService.dismissAll();
      this.getFixedFeeServiceList();
      setTimeout(() => {
        this.toast.showSuccess(this.confirmMessage);
      }, 1000)
      return;
    }
    this.toast.showError(this.errorData.server_error);
    this.loading = false;
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.fixedFeeServiceList) {
      return this.fixedFeeServiceList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
