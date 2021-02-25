import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, id } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { DaterangepickerDirective } from 'ngx-daterangepicker-material';
import { Observable, Subscription } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page, vmWriteOffs, vwMatterResponse } from 'src/app/modules/models';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { calculateTotalPages } from 'src/app/modules/shared/math.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { MatterService } from 'src/common/swagger-providers/services';
import { DateRangePickerComponent } from '../../date-range-picker/date-range-picker.component';
import * as errors from '../../error.json';
import { removeAllBorders, UtilsHelper } from '../../utils.helper';
import { RecordWriteOffComponent } from './record-write-off/record-write-off.component';


@Component({
  selector: 'app-new-write-offs',
  templateUrl: './new-write-offs.component.html',
  styleUrls: ['./new-write-offs.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class NewWriteOffsComponent implements OnInit {
  @ViewChild(DateRangePickerComponent, { static: false }) pickerDirective: DateRangePickerComponent;
  @Input() matterDetails: vwMatterResponse;
  @Input() balanceDue: number;
  @Input() invoiceId: number;
  @Input() prebillId: number;
  @Input() type: string;
  @Input() clientDetail;


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
  public search: string = '';
  totalWriteOffs: any;
  timeInterval: any;
  @Input() toggleViewButton: boolean = false;
  @Output() readonly toggleViewButtonChange = new EventEmitter();
  @Output() readonly refreshBilledBalance = new EventEmitter();
  selected: any = {};
  requestComplete = false;
  lifeOfMatter: boolean = true;
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
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
    this.managePermission();
    this.loadWriteOffs(true);
  }

  private loadWriteOffs(init = false) {
    if (this.matterDetails) {
      this.getWriteOffs(init);
    }
    if(this.clientDetail){
      this.getWriteOffsClient(init)
    }
  }

  ngOnChanges(changes) {
    if(changes && changes.balanceDue && changes.balanceDue.currentValue){
      this.balanceDue = changes.balanceDue.currentValue;
      this.managePermission();
    }
  }
  managePermission(){
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

    if (this.clientDetail) {
      let loginUserAttorny = UtilsHelper.checkPermissionOfConsultAtn(
        this.clientDetail
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

  private getWriteOffsClient(firstTime?:boolean){
    this.matterService
      .v1MatterContactWriteoffContactIdGet({
        contactId: this.clientDetail.id
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
      .subscribe((res: Array<vmWriteOffs>) => {
        if (res) {
          res.forEach( (obj:any) => {
            let createdAt = obj.createdAt;
            obj.createdAt = moment.utc(createdAt).local().format('YYYY-MM-DD[T]HH:mm:ss');
            obj.writeOffAmount = 0 - (obj.writeOffAmount);
          });
          this.writeOffs = res;
          this.originalWriteOffs = [...this.writeOffs];
          this.calcTotalPages();
          this.timeIntervalClear();
        }
      });
  }

  private getWriteOffs(firstTime?:boolean) {
    this.loading = true;
    if (firstTime) this.requestComplete = false;
    if(this.matterDetails && this.matterDetails.id){
      this.matterService
      .v1MatterWriteoffMatterIdGet({
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
      .subscribe((res: Array<vmWriteOffs>) => {
        if (res) {
          res.forEach( (obj:any) => {
            let createdAt = obj.createdAt;
            obj.createdAt = moment.utc(createdAt).local().format('YYYY-MM-DD[T]HH:mm:ss');
            obj.writeOffAmount = 0 - (obj.writeOffAmount);
          });
          this.writeOffs = res;
          this.originalWriteOffs = [...this.writeOffs];
          this.calcTotalPages();
          this.timeIntervalClear();
        }
      });
    }
  }

  applyFilter() {
    let rows = [...this.originalWriteOffs];
    if(this.selected && Object.keys(this.selected) && Object.keys(this.selected).length && !this.lifeOfMatter){
      let start = this.formatDate(moment(this.selected.startDate).add(-1,'d'));
      let end = this.formatDate(moment(this.selected.endDate).add(1,'d'));
      rows =  rows.filter((a) => moment(this.formatDate(a.applicableDate)).isBetween(start, end));
    }
    if(this.search && this.search !== '') {
      rows = rows.filter((a: any) =>
        ((a.writeOffCode.code.toString() || '').includes((this.search || '').toLowerCase())) ||
        ((a.createdBy || '').replace(/[, ]+/g, "").toLowerCase().includes((this.search || '').replace(/[, ]+/g, "").toLocaleLowerCase()) || (a.createdBy || '').split(',').reverse().join(' ').toLowerCase().includes((this.search || '').replace(/[, ]+/g, " ").toLocaleLowerCase()))
        || ((a.writeOffCode.name || '').toLowerCase().includes((this.search || '').toLowerCase())) ||
        ((a.noteToFile || '').toLowerCase().includes((this.search || '').toLowerCase()))
      );
    }
    this.writeOffs = [...rows];
    this.timeIntervalClear();
  }

  formatDate(date){
    return moment(date).format('YYYY-MM-DD');
  }

  timeIntervalClear() {
    if(this.timeInterval) {
      clearTimeout(this.timeInterval);
    }
    this.timeInterval = setTimeout(() => {
      this.getTotal();
    }, 1000);
  }

  toggleBodyView(){
    this.toggleViewButton = !this.toggleViewButton;
    this.toggleViewButtonChange.emit(this.toggleViewButton);
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
    if(this.table){
      this.table.offset = 0;
    }
  }

  toggleExpandRow(row: vmWriteOffs) {
    if(this.selectedRow && this.selectedRow.id != row.id){
      this.table.rowDetail.collapseAllRows();
      removeAllBorders('app-new-write-offs');
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
    let modalRef = this.modalService.open(RecordWriteOffComponent, {
      centered: true,
      keyboard: false,
      backdrop: 'static'
    });
    modalRef.componentInstance.balanceDue = this.balanceDue;
    modalRef.componentInstance.matterId = this.matterDetails ? this.matterDetails.id : this.clientDetail.matterId;
    modalRef.componentInstance.invoiceId = this.invoiceId;
    modalRef.componentInstance.isFixedFee = this.matterDetails ? this.matterDetails.isFixedFee : null;
    modalRef.componentInstance.prebillId = this.prebillId;
    modalRef.componentInstance.isPotentialClient = !!this.clientDetail;

    if (action === 'edit' && row) {
      modalRef.componentInstance.writeOffDetails = row;
    }

    modalRef.result.then(res => {
      if (res.type === 'added' || res.type === 'edit') {
        this.refreshBilledBalance.emit();
        this.loadWriteOffs();
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

  getTotal(){
    if(this.writeOffs && this.writeOffs.length){
      this.totalWriteOffs = (this.writeOffs.map( a => a.writeOffAmount)).reduce((a,b) => a + b);
    } else {
      this.totalWriteOffs = 0;
    }
  }

  choosedDate(event?) {
    this.selected = event;
    let check = moment(this.selected.startDate).isSame(this.selected.endDate);
    if(!check){
      this.onClickedOutside();
    }
    if(this.originalWriteOffs && this.originalWriteOffs.length){
      this.applyFilter();
    }
  }

  lifeOfMatterChange(event:boolean){
    this.lifeOfMatter = event;
    if(event){
      this.onClickedOutside();
      if(this.originalWriteOffs && this.originalWriteOffs.length){
        this.applyFilter();
      }
    }
  }
  onClickedOutside(){
    setTimeout(() => {
      this.pickerDirective.closeDateRange();
    }, 200);
  }
}
