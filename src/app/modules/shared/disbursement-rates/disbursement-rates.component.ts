import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as clone from 'clone';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import * as Constant from 'src/app/modules/shared/const';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwDisbursement } from 'src/common/swagger-providers/models';
import { BillingService } from 'src/common/swagger-providers/services';
import { IPRofile } from '../../models';
import { UnsavedChangedClientDialogComponent } from '../unsaved-changed-client-dialog/unsaved-changed-client-dialog.component';
import { SetDisbursementRatesComponent } from './set-disbursement-rates/set-disbursement-rates.component';

@Component({
  selector: 'app-disbursement-rates',
  templateUrl: './disbursement-rates.component.html',
  styleUrls: ['./disbursement-rates.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DisbursementRatesComponent implements OnInit, OnDestroy {
  @ViewChild(DatatableComponent, { static: true }) jobfamilynametable: DatatableComponent;
  @Input() clientId: number;
  @Input() matterId: number = null;
  @Input() pageType: string;
  @Input() isEditRateTable: boolean;
  @Output() readonly isEditRateTableChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() isCustomBillingRate: boolean;
  @Output() readonly isCustomBillingRateChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() rateTables = [];
  @Output() readonly rateTablesChange: EventEmitter<any> = new EventEmitter<any>();
  @Output() readonly getDisburs = new EventEmitter<Array<vwDisbursement>>();

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public oriDisbursementTypes: Array<vwDisbursement> = [];
  public disbursementTypes: Array<vwDisbursement> = [];
  public selDisbursementTypes: Array<vwDisbursement> = [];
  public disbursementList: Array<vwDisbursement> = [];
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public loginUser: IPRofile;

  constructor(
    private billingService: BillingService,
    private modalService: NgbModal,
    private store: Store<fromRoot.AppState>,

  ) {
    this.permissionList$ = this.store.select('permissions');
   }

  ngOnInit() {
    this.loginUser = UtilsHelper.getLoginUser();
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
            this.permissionList = obj.datas;
        }
      }
    });
    this.getDisbursement();
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
        this.permissionSubscribe.unsubscribe();
    }
  }

  public getDisbursement() {
    let observable = this.billingService.v1BillingDisbursementTypeTenantTenantIdGet({
      tenantId: this.loginUser.tenantId
    });

    if (this.pageType === 'creatematter' || this.pageType === 'clientdetals') {
      observable = this.billingService.v1BillingDisbursementTypePersonPersonIdGet({personId: this.clientId});
    }
    if (this.pageType === 'matterdashboard') {
      observable = this.billingService.v1BillingDisbursementTypeMatterMatterIdGet({matterId: this.matterId});
    }

    observable.pipe(map(UtilsHelper.mapData)).subscribe((res) => {
      if (res && res.length > 0) {
        const result = res.filter((item) => item.billType && item.status === "Active" && item.billType.code != 'OPEN');
        if (result && result.length > 0) {
          result.map((obj) => {
            obj.customRate = (obj.customRate || obj.customRate === 0) ? (+obj.customRate).toFixed(2) : obj.customRate;
          });
        }
        if (this.pageType === 'matterdashboard' || this.pageType === 'clientdetals' || this.pageType === 'creatematter') {
          this.disbursementList = res.filter((item) => item.isCustom && item.customRate != item.rate);
        }
        this.disbursementTypes = result;
        this.oriDisbursementTypes = [...this.disbursementTypes];
        this.getDisburs.emit([...this.disbursementTypes]);
      }
    }, err => {});
  }

  public setDisbursementRate() {
    if (this.isEditRateTable) {
      const unsavedChangedClientDialogComponentNgbModalRef = this.modalService.open(UnsavedChangedClientDialogComponent, {
        windowClass: 'modal-md',
        centered: true,
        backdrop: 'static',
      });
      unsavedChangedClientDialogComponentNgbModalRef.componentInstance.isCustomBillingRate = this.isCustomBillingRate;
      unsavedChangedClientDialogComponentNgbModalRef.componentInstance.rateTables = this.rateTables;
      unsavedChangedClientDialogComponentNgbModalRef.result.then((result) => {
        this.isCustomBillingRate = result.isCustomBillingRate;
        this.rateTables = result.rateTables && result.rateTables.length ? result.rateTables : [];
        this.isCustomBillingRateChange.emit(this.isCustomBillingRate);
        this.rateTablesChange.emit(this.rateTables);
      }, () => {
        this.isEditRateTableChange.emit(false);
        this.openDisbursementModal();
      });
    } else {
      this.openDisbursementModal();
    }
  }

  openDisbursementModal() {
    const modalRef = this.modalService.open(SetDisbursementRatesComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-xlg'
    });

    const component = modalRef.componentInstance;
    component.disbursementTypes = _.cloneDeep(this.disbursementTypes);
    component.oriDisbursementTypes = _.cloneDeep(this.oriDisbursementTypes);
    component.pageType = this.pageType;

    modalRef.result.then((res) => {
        if (res) {
          this.disbursementList = (res && res.execeptionRate) ? res.execeptionRate : [];
          if (this.pageType === 'matterdashboard' || this.pageType === 'clientdetals') {
            this.updateDisburs(res);
          }
          this.disbursementTypes = [...res.disbursementTypes];
          this.oriDisbursementTypes = [...res.disbursementTypes];
          this.getDisburs.emit(clone(this.disbursementTypes));
        }
    });
  }

  public updateDisburs(res) {
    const newArr = clone(res.execeptionSame);
    if (newArr && newArr.length > 0) {
      newArr.map((item) => {
        item['isNew'] = false;
        item.customRate = (item.customRate) ? +item.customRate : item.customRate;
      });
    }
    let body = {
      vwDisbursementRate : newArr
    };
    this.billingService.v1BillingDisbursementTypeCustomRatesPut$Json({body})
    .pipe(map(UtilsHelper.mapData)).subscribe((res) => {
    }, err => {});
  }

}
