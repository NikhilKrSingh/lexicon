import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { finalize, first, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page, vwMatterResponse } from 'src/app/modules/models';
import { Tenant } from 'src/app/modules/models/firm-settinngs.model';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwBillingSettings, vwDisbursement, vwDisbursementType, vwIdCodeName, vwRecordDisbursement } from 'src/common/swagger-providers/models';
import { BillingService, DmsService, ClockService } from 'src/common/swagger-providers/services';
import { DateRangePickerComponent } from '../../date-range-picker/date-range-picker.component';
import * as errors from '../../error.json';
import { RecordDisbursementComponent } from '../../record-disbursement/record-disbursement.component';
import { UnsavedChangedClientDialogComponent } from "../../unsaved-changed-client-dialog/unsaved-changed-client-dialog.component";
import { removeAllBorders, UtilsHelper } from '../../utils.helper';
import { TimeWriteDownComponent } from 'src/app/modules/billing/pre-bill/view/time/write-down/write-down.component';
import * as _ from 'lodash';
import { SetDisbursementRatesComponent } from '../../disbursement-rates/set-disbursement-rates/set-disbursement-rates.component';
import * as clone from 'clone';
import { DisbursementWriteDownComponent } from 'src/app/modules/billing/pre-bill/view/disbursements/write-down/write-down.component';

@Component({
  selector: 'app-new-billing-disbursements',
  templateUrl: './new-billing-disbursements.component.html',
  styleUrls: ['./new-billing-disbursements.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class NewBillingDisbursementsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() matterDetails: vwMatterResponse;
  @Input() firmDetails: Tenant;
  @Input() officeBillingSettings: vwBillingSettings;

  @Input() isEditRateTable: boolean;
  @Input() updateDisbursMent: Date = null;
  @Output() readonly isEditRateTableChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() isCustomBillingRate: boolean;
  @Output() readonly isCustomBillingRateChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() rateTables = [];
  @Output() readonly rateTablesChange: EventEmitter<any> = new EventEmitter<any>();
  @Input() lifeOfMatter = true;
  @Output() readonly lifeOfMatterChange = new EventEmitter();
  @Input() selectedFilter = 3;
  @Output() readonly selectedFilterChange = new EventEmitter();
  @Output() readonly refreshUnbilledBalance = new EventEmitter();
  @Input() isShow: boolean = false;
  @Output() readonly isShowChange = new EventEmitter();

  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild(DateRangePickerComponent, { static: false }) pickerDirective: DateRangePickerComponent;

  disbursements: any[];
  originalDisbursements: any[] = [];
  disbursementTypes: Array<any>;
  disbusementStatusList: Array<vwIdCodeName>;
  error_data = (errors as any).default;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  loading = false;
  public filterOptions = [
    { id: 3, name: 'Unbilled Only' },
    { id: 2, name: 'Billed Only' },
    { id: 1, name: 'All Charges' },
  ];
  search: string;
  selected: any = {};
  timeInterval: any;
  loggedinUser: any;
  totalDisbursements: any;
  public currentActive: number;
  requestComplete = false;
  openMatter: boolean = false;
  billingAdminEdit: boolean = false;
  matterMgmtAdmin: boolean = false;
  writeDownDetailList: boolean = false;
  currentActiveDetls: number;
  isBillingOrRespAttorney: boolean = false;
  public tables: any = {
    tableArr: [],
    frozenRightArr: []
  };
  selectedRow: any;

  constructor(
    private billingService: BillingService,
    private toastr: ToastDisplay,
    private modalService: NgbModal,
    private store: Store<fromRoot.AppState>,
    private dialogService: DialogService,
    private dmsService: DmsService,
    private clockService: ClockService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.loggedinUser = UtilsHelper.getLoginUser();
    if (this.matterDetails) {
      this.getDisbursements(true);
      this.getDisbursementType();
      this.isBillingOrRespAttorney  = UtilsHelper.checkPermissionOfRepBingAtn(
        this.matterDetails
      );
      this.billingService
        .v1BillingDisbursementstatusListGet()
        .pipe(
          map(res => {
            return JSON.parse(res as any).results;
          })
        )
        .subscribe(res => {
          this.disbusementStatusList = res;
        });
    }
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (this.permissionList.BILLING_MANAGEMENTisEdit ||
            this.permissionList.BILLING_MANAGEMENTisAdmin) {
            this.billingAdminEdit = true;
          }
          if (this.permissionList.MATTER_MANAGEMENTisAdmin) {
            this.matterMgmtAdmin = true;
          }
        }
      }
    });

    if (this.matterDetails.matterStatus.name.toLowerCase() == "open" && this.matterDetails.clientName) {
      this.openMatter = true;
    }
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.hasOwnProperty('updateDisbursMent')) {
      this.getDisbursementType();
    }
    if (changes.selectedFilter && changes.selectedFilter.currentValue) {
      if (this.originalDisbursements && this.originalDisbursements.length) {
        this.filterDisbursement(this.selectedFilter)
      }
    }
  }

  public initScrollDetector(tableArr = []) {
    this.tables.tableArr = [...tableArr];
    this.tables.frozenRightArr = []
    this.tables.tableArr.forEach(x => this.tables.frozenRightArr.push(false));
  }
  public async getDisbursementType(isRefreshList? : boolean) {
    if (this.matterDetails && this.matterDetails.id) {
      if(isRefreshList){
        try {
        let resp: any = await this.billingService.v1BillingDisbursementTypeMatterMatterIdGet({ matterId: this.matterDetails.id }).toPromise();
        let list = JSON.parse(resp as any).results;
        this.disbursementTypes = list;
        } catch {}
      } else {
        this.billingService.v1BillingDisbursementTypeMatterMatterIdGet({ matterId: this.matterDetails.id })
        .pipe(
          map(res => {
            return JSON.parse(res as any).results;
          })
        )
        .subscribe(res => {
          this.disbursementTypes = res;
        });
      }

    }
  }

  private getDisbursements(firstTime?: boolean) {
    this.loading = true;
    if (firstTime) this.requestComplete = false;
    this.clockService
      .v1ClockMatterDashboardDisbursementsListMatterIdGet({
        matterId: this.matterDetails.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {
          this.loading = false;
          if (firstTime) this.requestComplete = true;
        })
      )
      .subscribe((res: Array<vwRecordDisbursement>) => {
        if (res) {
          res.forEach((row: any) => {
            row.disbursements_List.amount = row.disbursements_List.originalAmount;
            row.disbursements_List.applicableDate = row.disbursements_List.date = row.disbursements_List.dateOfService;
            let createdAt = row.disbursements_List.createdAt;
            row.disbursements_List.createdAt = moment.utc(createdAt).local().format('YYYY-MM-DD[T]HH:mm:ss');
          })
          this.disbursements = res;
          if (this.disbursements.length) {
            this.disbursements = _.sortBy(this.disbursements, ['disbursements_List.dateOfService']).reverse();
          }
          this.originalDisbursements = [...this.disbursements];
          this.filterDisbursement();
          this.calcTotalPages();
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
    this.page.totalElements = this.disbursements.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    if (this.table) {
      this.table.offset = 0;
    }
    this.timeIntervalClear();
  }

  toggleExpandRow(row: any) {
    if(this.selectedRow && this.selectedRow.disbursements_List.id != row.disbursements_List.id){
      this.table.rowDetail.collapseAllRows();
      removeAllBorders('app-new-billing-disbursements');
    }
    this.table.rowDetail.toggleExpandRow(row);
    row['isExpended'] = !row['isExpended'];
    this.writeDownDetailList = false;
  }
  onDetailToggle(event) {
    this.selectedRow = event.value;
  }

  getRowClass(row): string {
    let cssClass = '';
    if (row.isExpended) {
      cssClass = 'expanded-row';
    }
    return cssClass;
  }

  edit(row: vwRecordDisbursement, $event) {
    $event.target.closest('datatable-body-cell').blur();
    // if (
    //   row &&
    //   row.status &&
    //   (row.status.code == 'RECORDED' ||
    //     row.status.code == 'PENDING_APPROVAL' ||
    //     row.status.code == 'NEEDS_FURTHER_REVIEW' ||
    //     row.status.code == 'APPROVED')
    // ) {
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
          this.isEditRateTable = false;
          this.isEditRateTableChange.emit(false);
          this.openEditDisbursementModal(row);
        });
      } else {
        this.isEditRateTable = false;
        this.isEditRateTableChange.emit(false);
        this.openEditDisbursementModal(row);
      }
    // }
  }

  openEditDisbursementModal(row) {
    const modalRef = this.modalService.open(RecordDisbursementComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });

    if (!row.note) {
      row.note = {
        isVisibleToClient: false,
        applicableDate: new Date() as any,
        name: ''
      };
    }
    modalRef.componentInstance.common = true;
    modalRef.componentInstance.searchclient = this.matterDetails.clientName.isCompany ? this.matterDetails.clientName.company : this.matterDetails.clientName.lastName + ', ' + this.matterDetails.clientName.firstName;
    modalRef.componentInstance.searchMatter = this.matterDetails.matterNumber + ' - ' + this.matterDetails.matterName;
    modalRef.componentInstance.clientDetail = this.matterDetails.clientName;
    modalRef.componentInstance.matterDetail = this.matterDetails;


    modalRef.componentInstance._disbursementTypes = this.disbursementTypes;
    modalRef.componentInstance.recordDisbursement = JSON.parse(JSON.stringify(row));
    modalRef.componentInstance.officeBillingSettings = this.officeBillingSettings;
    modalRef.componentInstance.matterDetails = this.matterDetails;
    modalRef.componentInstance.pageType = 'matter';

    modalRef.result.then((res: vwRecordDisbursement) => {
      if (res) {
        if (res && res.note && !res.note.name) {
          res.note = null;
        }
        if (res.disbursementType && !res.disbursementType.isBillableToClient) {
          res.finalBilledAmount = -res.finalBilledAmount;
        }
        if (res.disbursementType && res.disbursementType.customRate) {
          res.disbursementType.customRate = +(res.disbursementType.customRate);
        }
        this.updateDisbursement(res);
      }
    });
  }

  private updateDisbursement(record: vwRecordDisbursement) {
    this.loading = true;
    this.billingService
      .v1BillingRecordPut$Json({
        body: record
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        }),
        finalize(() => {
        })
      )
      .subscribe(
        res => {
          if (res > 0) {
            this.getDisbursements();
            this.refreshUnbilledBalance.emit();
            this.toastr.showSuccess(
              this.error_data.update_disbursement_success
            );
          } else {
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  delete(row, $event) {
    $event.target.closest('datatable-body-cell').blur();

    // if (
    //   row && row.disbursements_List &&
    //   (row.disbursements_List.status.code === 'RECORDED' ||
    //     row.disbursements_List.status.code === 'PENDING_APPROVAL' ||
    //     row.disbursements_List.status.code === 'NEEDS_FURTHER_REVIEW' ||
    //     row.disbursements_List.status.code == 'APPROVED')
    // ) {
      this.dialogService
        .confirm(
          this.error_data.delete_disbursement_confirm,
          'Delete',
          'Cancel',
          'Delete Disbursement'
        )
        .then(res => {
          if (res) {
            this.loading = true;
            this.billingService
              .v1BillingRecordRecordDisbursementIdDelete({
                recordDisbursementId: row.id
              })
              .pipe(
                map(res => {
                  return JSON.parse(res as any).results as number;
                }),
                finalize(() => {
                })
              )
              .subscribe(
                res => {
                  if (res > 0) {
                    if (row.receiptFileId) {
                      this.dmsService
                        .v1DmsFileDeleteIdDelete({ id: row.receiptFileId })
                        .pipe(map(UtilsHelper.mapData))
                        .subscribe(res => {
                          this.getDisbursements();
                        }, () => {
                        });
                    } else {
                      this.getDisbursements();
                    }
                    this.refreshUnbilledBalance.emit();
                    this.toastr.showSuccess(
                      this.error_data.delete_disbursement_success
                    );
                  } else {
                    this.toastr.showError(this.error_data.error_occured);
                  }
                },
                () => {
                  this.loading = false;
                }
              );
          }
        });
    // }
  }

  recordDisbursement() {
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
        this.isEditRateTable = false;
        this.isEditRateTableChange.emit(false);
        this.refreshUnbilledBalance.emit();
        this.openDisbursementModal();
      });
    } else {
      this.isEditRateTable = false;
      this.isEditRateTableChange.emit(false);
      this.refreshUnbilledBalance.emit();
      this.openDisbursementModal();
    }
  }

  openDisbursementModal() {
    const modalRef = this.modalService.open(RecordDisbursementComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance._disbursementTypes = this.disbursementTypes;
    modalRef.componentInstance.recordDisbursement = {
      disbursementType: {},
      note: {
        isVisibleToClient: false,
        applicableDate: new Date() as any,
        name: ''
      },
      dateOfService: new Date() as any,
      applicableDate: new Date() as any
    };

    modalRef.componentInstance.officeBillingSettings = this.officeBillingSettings;
    modalRef.componentInstance.matterDetails = this.matterDetails;

    modalRef.result.then((res: vwRecordDisbursement) => {
      if (res) {
        if (res && res.note && !res.note.name) {
          res.note = null;
        }

        res.matter = {
          id: this.matterDetails.id
        };

        res.office = {
          id: this.matterDetails.matterPrimaryOffice.id
        };

        res.tenant = {
          id: this.firmDetails.id
        };

        res.person = {
          id: this.matterDetails.clientName.id
        };

        let recordedStatus = this.disbusementStatusList.find(
          a => a.code === 'RECORDED'
        );

        res.status = recordedStatus;

        this.addDisbursement(res);
      }
    });
  }

  private addDisbursement(record: vwRecordDisbursement) {
    this.loading = true;

    this.billingService
      .v1BillingRecordPost$Json({
        body: record
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        }),
        finalize(() => {
        })
      )
      .subscribe(
        res => {
          if (res > 0) {
            this.getDisbursements();
            this.refreshUnbilledBalance.emit();
            this.toastr.showSuccess(
              this.error_data.record_disbursement_success
            );
          } else {
            this.toastr.showError(this.error_data.error_occured);
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  // get footerHeight() {
  //   if (this.disbursements) {
  //     return this.disbursements.length > 10 ? 50 : 0
  //   } else {
  //     return 0
  //   }
  // }

  filterDisbursement(event?: any) {
    let row = [];
    if (this.originalDisbursements && ((event && event.id) || this.selectedFilter)) {
      switch (this.selectedFilter) {
        case 1:
          this.selectedFilter = 1;
          row = [...this.originalDisbursements];
          break;
        case 2:
          row = this.originalDisbursements.filter(
            obj => obj.disbursements_List.status.toLowerCase() === "billed"
          );
          break;
        case 3:
          row = this.originalDisbursements.filter(
            obj => obj.disbursements_List.status.toLowerCase() !== "billed"
          );
          break;
      }
    }

    if (this.selected && Object.keys(this.selected) && Object.keys(this.selected).length && !this.lifeOfMatter) {
       let start = moment(this.selected.startDate).add(-1,'d').format('MM/DD/YYYY');
       let end = moment(this.selected.endDate).add(1, 'd').format('MM/DD/YYYY');
       row = row.filter((a) => moment(a.disbursements_List.dateOfService).isBetween(start, end));
    }

    if (this.search && this.search !== '') {
      row = row.filter((a: any) =>
        ((a.disbursements_List.code.toString() || '').includes((this.search || '').toLowerCase())) ||
        ((a.disbursements_List.enterBy || '').replace(/[, ]+/g, "").toLowerCase().includes((this.search || '').replace(/[, ]+/g, "").toLocaleLowerCase()) || (a.disbursements_List.enterBy || '').split(',').reverse().join(' ').toLowerCase().includes((this.search || '').replace(/[, ]+/g, " ").toLocaleLowerCase()))
        || ((a.disbursements_List.name || '').toLowerCase().includes((this.search || '').toLowerCase())) ||
        ((a.disbursements_List.note || '').toLowerCase().includes((this.search || '').toLowerCase()))
      );
    }

    this.disbursements = [...row];
    this.calcTotalPages();
    this.selectedFilterChange.emit(this.selectedFilter);
  }

  choosedDate(event) {
    this.selected = event;
    let check = moment(this.selected.startDate).isSame(this.selected.endDate);
    if(!check){
      this.onClickedOutside();
    }
    if (this.originalDisbursements && this.originalDisbursements.length) {
      this.filterDisbursement();
    }
  }
  onClickedOutside() {
    setTimeout(() => {
      this.pickerDirective.closeDateRange();
    }, 200);
  }

  timeIntervalClear() {
    if (this.timeInterval) {
      clearTimeout(this.timeInterval);
    }
    this.timeInterval = setTimeout(() => {
      this.getTotal();
    }, 1000);
  }
  getTotal() {
    if (this.disbursements && this.disbursements.length) {
      const Unbilled = this.disbursements.filter(x => x.disbursements_List.isBillableToClient);
      if (Unbilled && Unbilled.length) {
        this.totalDisbursements = (Unbilled.map(a => a.disbursements_List.displayAmount)).reduce((a, b) => a + b);
      } else {
        this.totalDisbursements = 0;
      }
    } else {
      this.totalDisbursements = 0;
    }
  }

  onClickedOutsideMenu(index: number) {
    if (index == this.currentActive) {
      this.currentActive = null;
    }
  }
  openMenu(index: number, row: any, event): void {
    // this.currentActive = (row.id == this.currentActive) ? null : row.id;
    setTimeout(() => {
      if (this.currentActive !== index) {
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
    }, 80);
  }

  changeAccordion() {
    this.isShow = !this.isShow;
    if (this.isShow) {
      window.onresize = () => {
        this.initScrollDetector([this.table]);
        window.onresize = () => {
          UtilsHelper.checkDataTableScroller(this.tables);
        };
      };
    }
    this.isShowChange.emit(this.isShow)
  }

  setLifeOfMatter(event:boolean) {
    this.lifeOfMatter = event;
    this.lifeOfMatterChange.emit(this.lifeOfMatter);
    if(event){
      this.onClickedOutside();
      if (this.originalDisbursements && this.originalDisbursements.length) {
        this.filterDisbursement();
      }
    }
  }

  openMenudetls(index: number, event): void {
    setTimeout(() => {
      if (this.currentActiveDetls !== index) {
        this.currentActiveDetls = index;
      } else {
        this.currentActiveDetls = null;
      }
    }, 50);
  }

  onClickedOutsidedetls(event: any, index: number) {
      this.currentActiveDetls = null;
  }

  public timeWriteDown(row, action, detsils) {
    const modalRef = this.modalService.open(DisbursementWriteDownComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'create-new-time-entry modal-xlg'
    });

    let rowDetails = { ...row.disbursements_List };
    rowDetails.createdBy = {
      name: row.disbursements_List.enterBy,
    }

    rowDetails.disbursementType = {code: row.disbursements_List.code, description: row.disbursements_List.name ? row.disbursements_List.name : null};
    rowDetails.oriAmount =rowDetails.displayAmount;
    rowDetails.amount =rowDetails.displayAmount;
    modalRef.componentInstance.rowDetails = rowDetails;

    let writeDownDetails = {
      applicableDate: row.disbursements_List.applicableDate,
      changeNotes: null,
      createdAt: row.disbursements_List.createdAt,
      createdBy: row.disbursements_List.enterBy,
      id: detsils ? detsils.id : null,
      writeDownAmount: row.disbursements_List.writeDownAmount,
      writeDownCode: detsils,
      writeDownHours: null,
      writeDownNarrative: detsils && detsils.writeDownNarrative ? detsils.writeDownNarrative : rowDetails.writeDownNarrative ? rowDetails.writeDownNarrative : null,
    }

    switch (action) {
      case 'add':
        modalRef.componentInstance.isEdit = true;
        modalRef.componentInstance.billedAmount = row.disbursements_List.displayAmount;
        break;
      case 'edit':
        writeDownDetails.writeDownCode.id = detsils.writeDownCodeId;
        modalRef.componentInstance.writeDownDetails = writeDownDetails;
        modalRef.componentInstance.rowDetails.amount += writeDownDetails.writeDownAmount || 0;
        modalRef.componentInstance.title = 'Edit Disbursement Write-Down';
        modalRef.componentInstance.isEdit = true;
        break;
      case 'view':
        modalRef.componentInstance.isView = true;
        modalRef.componentInstance.title = 'View Disbursement Write-Down';
        rowDetails.oriAmount = rowDetails.originalAmount;
        rowDetails.amount = rowDetails.originalAmount;
        writeDownDetails.writeDownAmount = detsils.writeDownAmount;
        modalRef.componentInstance.writeDownDetails = writeDownDetails;
        break;
    }

    modalRef.result.then((res) => {
      if (res) {
        this.getDisbursements();
        this.refreshUnbilledBalance.emit();
      }
    });
  }

  async removeWriteDown(row) {
    const resp: any = await this.dialogService.confirm(
      this.error_data.time_write_down_delete_warning_message,
      'Yes, delete',
      'Cancel',
      'Delete Write-Down',
      true,
      ''
    );
    if (resp) {
      try {
        await this.billingService.v1BillingWriteDownIdDelete({ id: row.id }).toPromise();
        this.toastr.showSuccess(this.error_data.disbursements_write_down_deleted);
        this.refreshUnbilledBalance.emit();
        this.getDisbursements();
      } catch (err) {
      }
    }
  }

  async openSetExceptionRateModal() {
    await this.getDisbursementType(true);
    const modalRef = this.modalService.open(SetDisbursementRatesComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-xlg'
    });

    const component = modalRef.componentInstance;
    let disbArray = this.disbursementTypes.filter(x => x.status !== 'Disabled');
    let oriDisbursements = disbArray.filter(x => x.billType.code !== 'OPEN');
    component.disbursementTypes = oriDisbursements;
    component.oriDisbursementTypes = [...oriDisbursements];

    modalRef.result.then((res) => {
        if (res) {
          this.updateDisburs(res);
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
