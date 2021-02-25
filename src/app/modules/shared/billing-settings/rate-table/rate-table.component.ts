import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { cloneDeep } from "lodash";
import { Observable, Subscription } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwMatterResponse } from 'src/app/modules/models';
import { vwRate } from 'src/common/swagger-providers/models';
import { BillingService, RateTableService } from 'src/common/swagger-providers/services';
import { ClientBackButtonGuard } from '../../../../guards/client-back-button-deactivate.guard';
import * as fromRoot from '../../../../store';
import * as fromPermissions from '../../../../store/reducers/permission.reducer';
import { RateTableModalComponent } from '../../rate-table-modal/rate-table-modal.component';

@Component({
  selector: 'app-billing-rate-table',
  templateUrl: './rate-table.component.html',
  styleUrls: ['./rate-table.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BillingRateTableComponent implements OnInit, OnChanges, ClientBackButtonGuard {
  @Input() matterDetails: vwMatterResponse;
  @Input() clientId: number;
  @Output() readonly sendRateList = new EventEmitter<{rateList: Array<vwRate>}>();
  @Input() isCustomBillingRate: boolean;
  @Input() isEditRateTable: boolean;
  @Input() rateTables: any = [];
  @Output() readonly isEditRateTableChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() readonly rateTablesChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() readonly isCustomBillingRateChange: EventEmitter<any> = new EventEmitter<any>();

  public loading = true;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  rateTableFormSubmitted: boolean;

  constructor(
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private store: Store<fromRoot.AppState>,
    private modalService: NgbModal,
    private rateTableService: RateTableService
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
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('matterDetails')) {
      this.matterDetails = changes.matterDetails.currentValue;
      if (this.matterDetails) {
        this.getRateTable();
      }
    }
    if (changes.isEditRateTable) {
      if (!this.isEditRateTable) {
        this.getRateTable();
      }
    }
  }

  private getRateTable() {
    this.loading = true;
    this.rateTableService.v1RateTableViewGet({matterid: this.matterDetails.id}).subscribe((result: any) => {
      const rateTable = JSON.parse(result).results;
      this.loading = false;
      if (rateTable.name) {
        if (rateTable.jobFamily && rateTable.jobFamily.length) {
          rateTable.jobFamily.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : (a.name.toLowerCase() < b.name.toLowerCase()) ? -1 : 0);
        }
        this.rateTables = [rateTable];
      } else {
        this.rateTables = [];
      }
      this.isCustomBillingRate = this.rateTables.length > 0;
      this.isCustomBillingRateChange.emit(this.isCustomBillingRate);
      this.rateTablesChange.emit(this.rateTables);
    }, () => {
      this.loading = false;
    });
  }

  editRateTable() {
    this.isEditRateTable = true;
    this.isEditRateTableChange.emit(true);
  }

  openRateTableModal() {
    const modalRef = this.modalService.open(RateTableModalComponent, {
      centered: true,
      backdrop: 'static',
      size: 'xl',
      windowClass: 'modal-xlg'
    });
    modalRef.componentInstance.rateTables = cloneDeep(this.rateTables);
    modalRef.result.then((result) => {
      this.rateTables = result;
      this.rateTablesChange.emit(this.rateTables);
    }, () => {});

  }

  deleteRateTable() {
    if (this.isEditRateTable) {
      this.loading = true;
      this.rateTableService.v1RateTableDeleteDelete({matterid: this.matterDetails.id}).subscribe((result) => {
        this.getRateTable();
      }, () => {
        this.loading = false;
      });
    }
  }

  customBillingChange(event) {
    this.rateTables = [];
    this.isCustomBillingRateChange.emit(event);
    this.rateTablesChange.emit(this.rateTables);
  }

  saveRateTable() {
    this.rateTableFormSubmitted = true;
    if (!this.isCustomBillingRate) {
      this.deleteRateTable();
      this.isEditRateTableChange.emit(false);
      this.rateTableFormSubmitted = false;
    } else if (this.isCustomBillingRate && this.rateTables.length) {
      this.loading = true;
      this.rateTables.forEach(rateTable => {
        rateTable.matterId = this.matterDetails.id;
        rateTable.id = rateTable.id ? rateTable.id : 0;
      });
      this.rateTableService.v1RateTableEditPut$Json({body: this.rateTables[0]}).subscribe(() => {
        this.rateTableFormSubmitted = false;
        this.isEditRateTableChange.emit(false);
        this.getRateTable();
      }, () => {
        this.loading = false;
        this.isEditRateTableChange.emit(false);
        this.rateTableFormSubmitted = false;
      });
    } else {
      return;
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
