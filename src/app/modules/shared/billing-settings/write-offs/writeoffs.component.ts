import { Component, Input, OnChanges, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page, vmWriteOffs, vwMatterResponse } from 'src/app/modules/models';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { MatterService } from 'src/common/swagger-providers/services';
import * as errors from '../../error.json';
import { UtilsHelper } from '../../utils.helper';
import { MatterRecordWriteOffComponent } from './record-write-off/record-write-off.component';

@Component({
  selector: 'app-billing-write-offs',
  templateUrl: './writeoffs.component.html',
  styleUrls: ['./writeoffs.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class MatterWriteOffsComponent implements OnChanges, OnInit, OnDestroy {
  @Input() matterDetails: vwMatterResponse;
  @Input() balanceDue: number;
  @Input() invoiceId: number;
  @Input() prebillId: number;

  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  writeOffs: Array<vmWriteOffs>;
  originalWriteOffs: Array<vmWriteOffs>;
  error_data = (errors as any).default;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public displayWriteOffButton: boolean = false;
  private loggedInUser: any;
  public loading: boolean = true;
  selectedRow: any;

  constructor(
    private matterService: MatterService,
    private toastr: ToastDisplay,
    private modalService: NgbModal,
    private store: Store<fromRoot.AppState>,
    private dialogService: DialogService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.loggedInUser = UtilsHelper.getLoginUser();
    if (this.matterDetails) {
      this.getWriteOffs();
      let profile = JSON.parse(localStorage.getItem('profile'));
      this.permissionSubscribe = this.permissionList$.subscribe(obj => {
        if (obj.loaded) {
          if (obj && obj.datas) {
            this.permissionList = obj.datas;
          }
        }
      });
      let loginUserAttorny = UtilsHelper.checkPermissionOfRepBingAtn(
        this.matterDetails
      );
      if (
        this.balanceDue > 0 &&
        (this.permissionList.BILLING_MANAGEMENTisEdit ||
          this.permissionList.BILLING_MANAGEMENTisAdmin ||
          loginUserAttorny)
      ) {
        this.displayWriteOffButton = true;
      }
    }
  }

  ngOnChanges() {
    if (this.matterDetails) {
      let loginUserAttorny = UtilsHelper.checkPermissionOfRepBingAtn(
        this.matterDetails
      );
      if (
        this.balanceDue > 0 &&
        (this.permissionList.BILLING_MANAGEMENTisEdit ||
          this.permissionList.BILLING_MANAGEMENTisAdmin ||
          loginUserAttorny)
      ) {
        this.displayWriteOffButton = true;
      }
    }
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  private getWriteOffs() {
    this.loading = true;
    this.matterService
      .v1MatterWriteoffMatterIdGet({
        matterId: this.matterDetails.id
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe((res: Array<vmWriteOffs>) => {
        if (res) {
          this.writeOffs = res;
          this.originalWriteOffs = [...this.writeOffs];
          this.calcTotalPages();
          this.loading = false;
        } else {
          this.loading = false;
        }
      });
  }

  /**
   * Change Page size from Paginator
   */
  changePageSize() {
    this.page.size = this.pageSelector.value;
    this.calcTotalPages();
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
    this.page.totalElements = this.writeOffs.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    this.table.offset = 0;
  }

  toggleExpandRow(row: vmWriteOffs) {
    if(this.selectedRow && this.selectedRow != row.id){
      this.table.rowDetail.collapseAllRows();
    }
    this.table.rowDetail.toggleExpandRow(row);
  }
  onDetailToggle(event) {
    this.selectedRow = event.value;
  }

  /**
   *
   * @param action add/update write off record
   * @param row
   */
  recordWriteOff(action, row?: vmWriteOffs) {
    let modalRef = this.modalService.open(MatterRecordWriteOffComponent, {
      centered: true,
      keyboard: false,
      backdrop: 'static'
    });
    modalRef.componentInstance.balanceDue = this.balanceDue;
    modalRef.componentInstance.matterId = this.matterDetails.id;
    modalRef.componentInstance.invoiceId = this.invoiceId;
    modalRef.componentInstance.isFixedFee = this.matterDetails.isFixedFee;
    modalRef.componentInstance.prebillId = this.prebillId;

    if (action === 'edit' && row) {
      modalRef.componentInstance.writeOffDetails = row;
    }

    modalRef.result.then(res => {
      if (res.type === 'added' || res.type === 'edit') {
        this.getWriteOffs();
      }
    });
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get footerHeight() {
    if (this.writeOffs) {
      return this.writeOffs.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
