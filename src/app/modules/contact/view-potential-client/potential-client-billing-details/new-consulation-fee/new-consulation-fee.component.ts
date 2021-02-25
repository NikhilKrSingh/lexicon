import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
  OnChanges,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  ModalDismissReasons,
  NgbModal,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page } from 'src/app/modules/models';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import {
  BillingService,
  PotentialClientBillingService,
} from 'src/common/swagger-providers/services';
import * as errors from 'src/app/modules/shared/error.json';
import { removeAllBorders, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { TimeWriteDownComponent } from 'src/app/modules/billing/pre-bill/view/time/write-down/write-down.component';
import { DateRangePickerComponent } from 'src/app/modules/shared/date-range-picker/date-range-picker.component';
import { AddEditConsulationComponent } from './add-edit-consulation/add-edit-consulation.component';
import { DialogService } from 'src/app/modules/shared/dialog.service';

@Component({
  selector: 'app-new-consulation-fee',
  templateUrl: './new-consulation-fee.component.html',
  styleUrls: ['./new-consulation-fee.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class NewConsulationFeeComponent implements OnInit, OnChanges {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild(DateRangePickerComponent, { static: false })
  pickerDirective: DateRangePickerComponent;

  @Input() clientDetails: any;
  @Input() consulationFeesToggle: boolean = false;
  @Input() unbilledFeeStatus: boolean = false;

  @Output() readonly refreshBillingWidget = new EventEmitter<any>();
  @Output() readonly consulationFeesToggleChange = new EventEmitter();
  @Output() readonly unbilledFeeStatusChange = new EventEmitter();

  consulationFeesStatusList: { id: string; name: string; checked: boolean }[];
  consulationFeeList: any = [];
  orgFeesList: any = [];
  selectedconsulationFeeStatus: any = 'unbilled_only';
  placeholdertext = 'Life of Potential Client';
  // selectedconsulationFeeStatus: any;
  consulationFeesTotal: number = 0;
  public titletype = 'All';
  public titlestatus = 'All';
  public filterName = 'Apply Filter';
  public consulationFeeSearchString: string = '';
  writeDownDetailList: any;
  consulationFeesLoading: boolean = false;
  public pageSelected: number = 1;
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public errorData = (errors as any).default;
  public currentActiveDetls: number;
  private modalRef: NgbModalRef;
  consulationFeeDetails: any;
  consulationFeeDateRangselected: any;
  public lifeOfMatterFees = true;
  public page = new Page();
  public ColumnMode = ColumnMode;
  isAdmin: boolean = false;
  isWriteDownAdmin: boolean = false;
  private permissionSubscribe: Subscription;
  public permissionList: any = {};
  public permissionList$: Observable<fromPermissions.PermissionDataState>;
  currentActive: any;
  closeResult: string;
  selectedRow: any;

  constructor(
    private billingService: BillingService,
    private modalService: NgbModal,
    private toastr: ToastDisplay,
    private store: Store<fromRoot.AppState>,
    private potentialClientBillingService: PotentialClientBillingService,
    private dialogService: DialogService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnChanges(changes) {
    if (this.unbilledFeeStatus) {
      this.selectedconsulationFeeStatus = 'unbilled_only';
      this.lifeOfMatterFees = true;
      this.applyFilterForList();
    }
    if(changes.clientDetails && changes.clientDetails.currentValue){
        this.clientDetails = changes.clientDetails.currentValue;
    }
  }

  ngOnInit() {
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;

          let loginUserAttorny = UtilsHelper.checkPermissionOfConsultAtn(
            this.clientDetails
          );

          if (
            loginUserAttorny ||
            this.permissionList.BILLING_MANAGEMENTisEdit ||
            this.permissionList.BILLING_MANAGEMENTisAdmin ||
            this.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin ||
            this.permissionList.CLIENT_CONTACT_MANAGEMENTisEdit
          ) {
            this.isAdmin = true;
          }

          if (
            loginUserAttorny ||
            this.permissionList.BILLING_MANAGEMENTisEdit ||
            this.permissionList.BILLING_MANAGEMENTisAdmin
          ) {
            this.isWriteDownAdmin = true;
          }
        }
      }
    });

    this.getConsulationFeesList();
    this.consulationFeesStatusList = [
      {
        id: 'unbilled_only',
        name: 'Unbilled Only',
        checked: false,
      },
      {
        id: 'Billed',
        name: 'Billed Only',
        checked: false,
      },
      {
        id: 'all_charges',
        name: 'All Charges',
        checked: false,
      },
    ];
  }
  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  getConsulationFeesList() {
    this.consulationFeesLoading = true;
    this.potentialClientBillingService
      .v1PotentialClientBillingConsultationFeeListContactIdGet$Response({
        contactId: this.clientDetails.id,
      })
      .subscribe((res) => {
        let data = JSON.parse(res.body as any).results;
        data.forEach((obj: any) => {
          if (obj.consultationFeeList) {
            let timeEntered = obj.consultationFeeList.timeEntered;
            obj.consultationFeeList.timeEntered = moment
              .utc(timeEntered)
              .local()
              .format('YYYY-MM-DD[T]HH:mm:ss');
            obj.consultationFeeList.hour = obj.consultationFeeList.totalHours;
            obj.consultationFeeList.min = obj.consultationFeeList.totalMins;
            obj.consultationFeeList.duration = ((obj.consultationFeeList.hour * 60) + obj.consultationFeeList.min);
            if (obj.consultationFeeList.isNegetive) {
              obj.consultationFeeList.duration = obj.consultationFeeList.duration * -1;
            }
          }
        });
        this.consulationFeeList = data;
        this.orgFeesList = data;
        this.consulationFeesTotal = 0;
        this.consulationFeesLoading = false;
        this.applyFilterForList();
      });
  }
  toggleExpandRow(row) {
    if (this.selectedRow && this.selectedRow.consultationFeeList.id != row.consultationFeeList.id) {
      this.table.rowDetail.collapseAllRows();
      removeAllBorders('app-new-consulation-fee');
    }
    this.table.rowDetail.toggleExpandRow(row);
    row['isExpended'] = !row['isExpended'];
    this.writeDownDetailList = false;
  }

  onDetailToggle(event) {
     this.selectedRow = event.value;
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
  openMenu(index, event): void {
    setTimeout(() => {
      if (this.currentActive != index) {
        this.currentActive = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach((ele) => {
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

  public applyFilterForList() {
    var temp = [...this.orgFeesList];
    if (this.selectedconsulationFeeStatus) {
      if (this.selectedconsulationFeeStatus == 'unbilled_only') {
        temp = temp.filter((item) => {
          if (
            item.consultationFeeList.status &&
            item.consultationFeeList.status != 'Billed'
          ) {
            return item;
          }
        });
      } else if (this.selectedconsulationFeeStatus == 'Billed') {
        temp = temp.filter((item) => {
          if (
            item.consultationFeeList.status &&
            item.consultationFeeList.status == 'Billed'
          ) {
            return item;
          }
        });
      } else {
        temp = this.orgFeesList;
      }
    }

    if (this.consulationFeeDateRangselected && !this.lifeOfMatterFees) {
      let check = moment(this.consulationFeeDateRangselected.startDate).isSame(
        this.consulationFeeDateRangselected.endDate
      );
      if (!check) {
        temp = temp.filter(
          (a) =>
            moment(
              this.formatDate(a.consultationFeeList.dateOfService)
            ).isBetween(
              this.consulationFeeDateRangselected.startDate,
              this.consulationFeeDateRangselected.endDate
            ) ||
            moment(this.formatDate(a.consultationFeeList.dateOfService)).isSame(
              this.consulationFeeDateRangselected.startDate
            ) ||
            moment(this.formatDate(a.consultationFeeList.dateOfService)).isSame(
              this.consulationFeeDateRangselected.endDate
            )
        );
      }
    }
    this.onClickedOutsideDatePicker();
    if (this.consulationFeeSearchString !== '') {
      temp = temp.filter(
        (item) =>
          this.matchClientSearch(
            item,
            this.consulationFeeSearchString,
            'code'
          ) ||
          this.matchClientSearch(
            item,
            this.consulationFeeSearchString,
            'name'
          ) ||
          this.matchClientSearch(
            item,
            this.consulationFeeSearchString,
            'enterBy'
          ) ||
          this.matchClientSearch(item, this.consulationFeeSearchString, 'note') ||
          this.matchFirstLast(item.consultationFeeList.enterBy || '', this.consulationFeeSearchString)
      );
    }
    // update the rows
    this.consulationFeeList = [...temp];
    this.consulationFeesTotal = 0;
    this.consulationFeeList.filter((item) => {
      this.consulationFeesTotal =
        this.consulationFeesTotal + item.consultationFeeList.displayAmount;
    });
    if (this.unbilledFeeStatus) {
      this.unbilledFeeStatus = !this.unbilledFeeStatus;
      this.unbilledFeeStatusChange.emit(this.unbilledFeeStatus);
    }
    this.updateDatatableFooterPage();
  }

  private matchFirstLast(enterBy: string, val)  {
    let [lastName, firstName] = enterBy.split(',').map(a => a.trim());
    let obj = {
      firstName,
      lastName
    };

    return UtilsHelper.matchFullEmployeeName(obj, val);
  }

  formatDate(date) {
    return moment(date).format('YYYY-MM-DD');
  }

  /** update table footer page count */
  public updateDatatableFooterPage() {
    this.page.totalElements = this.consulationFeeList.length;
    this.page.totalPages = Math.ceil(
      this.consulationFeeList.length / this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    if (this.table) {
      this.table.offset = 0;
    }
  }
  onClickedOutside() {
    this.currentActive = null;
  }
  onClickedOutsideDatePicker() {
    setTimeout(() => {
      this.pickerDirective.isShow = false;
    }, 200);
  }
  onClickedOutsidedetls(event: any, index: number) {
    if (index === this.currentActiveDetls) {
      this.currentActiveDetls = null;
    }
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateDatatableFooterPage();
    }
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  public pageChange(e) {
    this.pageSelected = e.page;
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  private matchClientSearch(
    item: any,
    searchValue: string,
    fieldName: string
  ): boolean {
    const searchName = item['consultationFeeList'][fieldName]
      ? item['consultationFeeList'][fieldName].toString().toLowerCase()
      : '';
    return searchName.search(searchValue.toString().trim().toLowerCase()) > -1;
  }

  choosedDate(event) {
    this.consulationFeeDateRangselected = event;
    if (this.orgFeesList && this.orgFeesList.length > 0) {
      this.applyFilterForList();
    }
  }

  addConsulation(action, row = null, $event) {
    if ($event && $event.target && row && $event.target.closest('datatable-body-cell')) {
      $event.target.closest('datatable-body-cell').blur();
    }

    let modalRef = this.modalService.open(AddEditConsulationComponent, {
      centered: true,
      keyboard: false,
      backdrop: 'static',
    });
    if (action == 'edit') {
      modalRef.componentInstance.selectedRow = row;
    }
    modalRef.componentInstance.action = action;
    modalRef.componentInstance.clientDetails = this.clientDetails;
    modalRef.result.then((res) => {
      if (res) {
        this.getConsulationFeesList();
        this.refreshBillingWidget.emit();
      }
    });
  }

  openModal(row, content, className: any = null, winClass: any = null) {
    this.selectedRow = row;
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
      })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }
  getDismissReason(reason) {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }
  deleteConsultation() {
    this.potentialClientBillingService
      .v1PotentialClientBillingConsultationFeeIdDelete$Response({
        id: this.selectedRow.consultationFeeList.id,
      })
      .subscribe((res) => {
        res = JSON.parse(res.body as any).results;
        if (res) {
          this.modalService.dismissAll();
          this.toastr.showSuccess('Consultation fee successfully deleted.');
          this.getConsulationFeesList();
          this.refreshBillingWidget.emit();
          this.selectedRow = null;
        }
      });
  }

  witeDown(row, action, detsils) {
    row = {
      id: row.consultationFeeList.id,
      amount: row.consultationFeeList.displayAmount,
      oriAmount: row.consultationFeeList.displayAmount,
      date:
        action == 'add'
          ? row.consultationFeeList.dateOfService
          : row.writeDownDetailList.length > 0
          ? row.writeDownDetailList[0].writeDownDateTime
          : null,
      person: { name: row.consultationFeeList.timeKeeper },
      disbursementType: {
        code: row.consultationFeeList.code,
        description: row.consultationFeeList.name,
        isBillable: null,
      },
      status: {
        name: row.consultationFeeList.status
      },
      hours: {
        value: {
          hours: row.consultationFeeList.totalHours,
          minutes: row.consultationFeeList.totalMins,
        },
      },
      writeDown:
        row.writeDownDetailList.length > 0
          ? [
              {
                writeDownAmount: row.writeDownDetailList[0].writeDownAmount,
                writeDownCode: {
                  code: row.writeDownDetailList[0].code,
                  name: row.writeDownDetailList[0].name,
                },
              },
            ]
          : null,
    };
    detsils = {
      id: detsils ? detsils.id : null,
      writeDownAmount: detsils ? detsils.writeDownAmount : null,
      writeDownCode: detsils
        ? {
            code: detsils.code,
            name: detsils.name,
            id: detsils.writeDownCodeId,
            WriteDownCodeId: detsils.writeDownCodeId,
          }
        : null,
        writeDownNarrative: detsils ? detsils.writeDownNarrative : null
    };
    let modalRef = this.modalService.open(TimeWriteDownComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'create-new-time-entry modal-xlg',
    });
    this.onClickedOutside();
    modalRef.componentInstance.rowDetails = { ...row };
    modalRef.componentInstance.writeDownDetails = { ...detsils };
    modalRef.componentInstance.type = 'consultation';

    if (action == 'add') {
      modalRef.componentInstance.billedAmount = Math.round(
        row.amount
      ).toString();
      modalRef.componentInstance.title = 'Consultation Fee Write-Down';
    }

    if (action === 'edit') {
      modalRef.componentInstance.isEdit = true;
      modalRef.componentInstance.writeDownDetails = detsils;
      modalRef.componentInstance.title = 'Edit Consultation Fee Write-Down';
      modalRef.componentInstance.rowDetails.amount +=
        detsils.writeDownAmount || 0;
    }

    if (action === 'view') {
      modalRef.componentInstance.isView = true;
      modalRef.componentInstance.title = 'View Consultation Fee Write-Down';
      modalRef.componentInstance.writeDownDetails = detsils;
      modalRef.componentInstance.rowDetails.amount +=
        detsils.writeDownAmount || 0;
    }

    modalRef.result.then((res) => {
      if (res && res.action) {
        this.getConsulationFeesList();
        this.refreshBillingWidget.emit();
      }
    });
  }

  getRowClass(row): string {
    let cssClass = '';
    if (row.isExpended) {
      cssClass = 'expanded-row';
    }
    return cssClass;
  }

  async removeWriteDown(row) {
    const resp: any = await this.dialogService.confirm(
      'You are about to delete a time write-down from this pre-bill, Do you want to continue?',
      'Yes, delete Write-Down',
      'Cancel',
      'Delete Consultation Fee Write-Down',
      true,
      ''
    );
    if (resp) {
      try {
        await this.billingService
          .v1BillingWriteDownIdDelete({ id: row.id })
          .toPromise();
        this.toastr.showSuccess('Consultation Fee Write-Down deleted.');
        this.getConsulationFeesList();
        this.refreshBillingWidget.emit();
      } catch (err) {}
    }
  }

  toggleBodyView() {
    this.consulationFeesToggle = !this.consulationFeesToggle;
    this.consulationFeesToggleChange.emit(this.consulationFeesToggle);
  }

  get footerHeight() {
    if (this.consulationFeeList) {
      return this.consulationFeeList.length > 10 ? 50: 0;
    } else {
      return 0;
    }
  }
}
