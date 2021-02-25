import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { finalize, map } from 'rxjs/operators';
import * as errors from 'src/app/modules/shared/error.json';
import { vwDisbursementType, vwIdCodeName, vwRate } from 'src/common/swagger-providers/models';
import { BillingService, TenantService } from 'src/common/swagger-providers/services';
import { IBillPeriod, Page } from '../../models';
import { IBillingSettings, IDisplaySettings } from '../../models/billing-setting.model';
import { Tenant } from '../../models/firm-settinngs.model';
import { AutoUnsubscribe, SubscriptionList } from '../../shared/auto-unsubscribe';
import { BillingSettingsHelper, IBillGeneratetionPeriod } from '../../shared/billing-settings-helper';
import { DialogService } from '../../shared/dialog.service';
import { calculateTotalPages } from '../../shared/math.helper';
import { UtilsHelper } from '../../shared/utils.helper';
import { CustomizeOfficeRateComponent } from './customize-rate/customize-rate.component';

@Component({
  selector: 'app-office-admin-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
@AutoUnsubscribe({
  subscriptionListKey: 'subscriptionList'
})
export class OfficeAdminBillingComponent implements OnInit, OnChanges {
  error_data = (errors as any).default;
  @Input() officeId: number;
  @Input() fromCreate = false;
  @Input() officeDetails: any;
  @Output() readonly rateValues = new EventEmitter();
  @Output() readonly disbursementValues = new EventEmitter();
  @Input() selectedRateTable: any[];
  @Input() selectedDisbursementType: any[];
  @Input() isViewOnly: boolean = false;
  @Input() editBill: boolean = false;
  @Input() editBillUpcoming: boolean = false;
  @Input() isFormSubmitted = false;
  @Input() refresh: Date;
  @Input() loadderVisible = false;
  @Output() readonly sendValue = new EventEmitter<IBillPeriod>();
  @Output() readonly editBillFreq = new EventEmitter<string>();
  @Output() readonly removeUpcomingFreq = new EventEmitter<boolean>();

  public ColumnMode = ColumnMode;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  @ViewChild('table', { static: false }) rateTable: DatatableComponent;
  public disbursementpage = new Page();
  public disbursementpageSelector = new FormControl('10');
  public disbursementpageSelected = 1;
  @ViewChild('disbursementTable', { static: false }) disbursementTable: DatatableComponent;
  rateList: Array<vwRate>;
  originalRateList: Array<vwRate>;
  selectedRateList: Array<vwRate> = [];
  disbursementList: Array<vwDisbursementType>;
  originalDisbursementList: Array<vwDisbursementType>;
  selectedDisbursementList: Array<vwDisbursementType> = [];
  billingSettings: IBillingSettings;
  billFrequencyList: Array<vwIdCodeName>;
  private tenant: Tenant;
  subscriptionList = new SubscriptionList();
  userDetails: any = {};
  billGenerationPeriod: IBillGeneratetionPeriod;
  public billFrequencyDayObj: {value?: number; name?: string};
  public effectiveBillFrequencyDayObj: {value?: number; name?: string};
  public recurringName: Array<string> = ['First', 'Second', 'Third', 'Fourth', 'Last'];
  public pageType: string = 'editoffice';
  public billFrequencyDurationName: string = '';
  public loading: boolean;
  public showUpcoming: boolean = false;
  public displayCurrentPeriodDate: string;
  public action: string = 'basic';
  public upcomingChangesDisplay: IDisplaySettings;
  public billFrequencyEndDate: string;

  constructor(
    private billingService: BillingService,
    private modalService: NgbModal,
    private tenantService: TenantService,
    private billingSettingsHelper: BillingSettingsHelper,
    private dialogService: DialogService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.disbursementpage.pageNumber = 0;
    this.disbursementpage.size = 10;
  }

  ngOnInit() {
    this.userDetails = UtilsHelper.getObject('profile');
    if (this.officeId && !this.fromCreate) {
      if (!this.officeDetails) {
        this.loadRateTable();
      }
      if (this.officeDetails) {
        this.subscriptionList.v1TenantGetSub = this.tenantService
          .v1TenantGet()
          .pipe(map(UtilsHelper.mapData))
          .subscribe(res => {
            if (res) {
              this.tenant = res;
              this.getBillingSettings(true);
            }
          });
      }
    } else if (!this.officeDetails) {
      this.loadRateTableWhenCreating();
      this.loadDisbursementTypesWhenCreating();
    }
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('refresh')) {
      this.refresh = changes.refresh.currentValue;
      this.getBillingSettings(true);
    }
    if (changes.hasOwnProperty('editBillUpcoming')) {
      if (changes.editBillUpcoming.currentValue === false && this.billingSettings) {
        this.setValue(null, 'settings');
      }
    }
    if(changes.loadderVisible && changes.loadderVisible.currentValue){
      this.loading = true;
    }
    else{
      this.loading = false;
    }
  }

  loadRateTableWhenCreating() {
    this.billingService.v1BillingRateTenantTenantIdGet({
      tenantId: this.userDetails.tenantId
    }).pipe(map(UtilsHelper.mapData)).subscribe(res => {
      if (res) {
        this.originalRateList = res;
        this.rateList = [...this.originalRateList];
        this.rateValues.emit([...this.originalRateList]);
        if(this.fromCreate && this.selectedRateTable && this.selectedRateTable.length) {
          this.selectedRateList.push(...this.selectedRateTable);
        }
        this.calcTotalPages();
      }
    });
  }
  rowIdentity = (row) => { return row.id }

  loadDisbursementTypesWhenCreating() {
    this.billingService.v1BillingDisbursementTypeTenantTenantIdGet({
      tenantId: this.userDetails.tenantId
    }).pipe(map(UtilsHelper.mapData)).subscribe(res => {
      if (res) {
        this.originalDisbursementList = res;
        this.disbursementList = [...this.originalDisbursementList];
        this.disbursementValues.emit([...this.originalDisbursementList]);
        if(this.fromCreate && this.selectedDisbursementType && this.selectedDisbursementType.length) {
          this.selectedDisbursementList.push(...this.selectedDisbursementType);
        }
        this.calcTotalDisbursementPages();
      }
    });
  }

  private loadRateTable() {
    this.subscriptionList.v1BillingRateOfficeOfficeIdGetSub = this.billingService
      .v1BillingRateOfficeOfficeIdGet({
        officeId: this.officeId
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.loadDisbursementTypes();
        })
      )
      .subscribe(
        res => {
          if (res) {
            this.originalRateList = res;
            this.rateList = [...this.originalRateList];
            this.calcTotalPages();
          }
        },
        () => {
          this.showError();
        }
      );
  }

  private loadDisbursementTypes() {
    this.subscriptionList.v1BillingDisbursementTypeOfficeOfficeIdGet = this.billingService
      .v1BillingDisbursementTypeOfficeOfficeIdGet({
        officeId: this.officeId
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
        })
      )
      .subscribe(
        res => {
          if (res) {
            this.originalDisbursementList = res;
            this.disbursementList = [...this.originalDisbursementList];
            this.calcTotalDisbursementPages();
          }
        },
        () => {
          this.showError();
        }
      );
  }

  private getBillingSettings(loadListItems = false) {
    this.loading = true;
    this.subscriptionList.v1BillingSettingsOfficeOfficeIdGet = this.billingService
      .v1BillingSettingsOfficeOfficeIdGet({
        officeId: this.officeId
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res && res.length > 0) {
            this.billingSettings = res[0];
            this.setValue(null, 'settings');
            let daysList = UtilsHelper.getDayslistn();
            this.billFrequencyDurationName =
              this.billingSettings.billFrequencyQuantity == 1
                ? this.billingSettings.billFrequencyDuration.name.slice(0, -1)
                : this.billingSettings.billFrequencyDuration.name;
            this.billFrequencyDayObj = daysList.find(
              item => item.value === this.billingSettings.billFrequencyDay
            );
          } else {
            this.billingSettings = {};
          }
          this.billGenerationPeriod = this.billingSettingsHelper.getBillGenerationPeriod(
            this.billingSettings
          );
          if (loadListItems) {
            this.getBillingListItem();
          }
          this.loading = false;
        },
        err => {
          this.loading = false;
        }
      );
  }

  private getBillingListItem() {
    this.subscriptionList.v1BillingBillfrequencyListGet = this.billingService
      .v1BillingBillfrequencyListGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        })
      )
      .subscribe(res => {
        if (res) {
          this.billFrequencyList = res;
          const weeks = this.billFrequencyList.find(a => a.code === 'WEEKS');
          if (!this.billingSettings.id && weeks) {
            this.billingSettings.billFrequencyQuantity = 2;
            this.billingSettings.billFrequencyDuration = weeks;
            this.createBillingSettings();
          }
        }
      });
  }

  private createBillingSettings() {
    const settings = {
      ...this.billingSettings
    };
    settings.office = {
      id: +this.officeId
    };
    settings.tenant = {
      id: this.tenant.id
    };
    this.subscriptionList.v1BillingSettingsPost = this.billingService
      .v1BillingSettingsPost$Json({
        body: settings
      })
      .subscribe(res => { });
  }

  showError() {
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
    this.page.totalElements = this.rateList.length;
    this.page.totalPages = calculateTotalPages(
      this.page.totalElements,
      this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    if (this.rateTable) {
      this.rateTable.offset = 0;
    }
  }

  /**
   * select rows
   *
   */
  public onSelect({ selected }) {
    this.selectedRateList.splice(0, this.selectedRateList.length);
    this.selectedRateList.push(...selected);
    if (this.fromCreate) {
    }
  }

  /**
   * select rows
   *
   */
  public onSelectDisbursement({ selected }) {
    this.selectedDisbursementList.splice(
      0,
      this.selectedDisbursementList.length
    );
    this.selectedDisbursementList.push(...selected);
    if (this.fromCreate) {
    }
  }

  /**
   * Change Page size from Paginator
   */
  changeDisbursementPageSize() {
    this.disbursementpage.size = this.disbursementpageSelector.value;
    this.calcTotalDisbursementPages();
  }

  /**
   * Change page number
   */
  public changeDisbursementPage() {
    this.disbursementpage.pageNumber = this.disbursementpageSelected - 1;
  }

  /**
   * Handle change page number
   */
  public DisbursementpageChange(e) {
    this.disbursementpageSelected = e.page;
  }

  /**
   * Calculates Page Count besed on Page Size
   */
  public calcTotalDisbursementPages() {
    this.disbursementpage.totalElements = this.disbursementList.length;
    this.disbursementpage.totalPages = calculateTotalPages(
      this.disbursementpage.totalElements,
      this.disbursementpage.size
    );
    this.disbursementpage.pageNumber = 0;
    this.disbursementpageSelected = 1;
    if (this.disbursementTable) {
      this.disbursementTable.offset = 0;
    }
  }

  customizeRate() {
    if (this.selectedRateList && this.selectedRateList.length > 0) {
      const modalRef = this.modalService.open(CustomizeOfficeRateComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        size: 'xl'
      });
      modalRef.componentInstance.selectedRateList = [...this.selectedRateList];
      modalRef.result.then(res => {
        console.log(res);
      });
    }
  }

  public editBilling() {
    this.action = 'basic';
    this.editBill = true;
    this.editBillFreq.emit('basic');
  }
  public editUpcoming() {
    this.action = 'upcoming';
    this.editBillUpcoming = true;
    this.showUpcoming = true
    this.editBillFreq.emit('upcoming');
  }

  public getValue(event: IBillPeriod) {
    this.setValue(event, 'changes');
    this.sendValue.emit(event);
  }

  /**
   * Remove upcoming billing frequency changes
   */
  public removeUpcoming() {
    this.dialogService
    .confirm(
      'Are you sure you want to delete the upcoming billing frequency settings? This will leave the current settings active.',
      'Yes, delete upcoming changes',
      'Cancel',
      'Delete Upcoming Changes',
      true
    )
    .then(response => {
      if (response) {
        this.sendValue.emit({billingSettings: this.billingSettings});
        this.loading = true;
        this.removeUpcomingFreq.emit(true);
      }
    });
  }

  public setValue(item, type) {
    const daysList = UtilsHelper.getDayslistn();
    if (type === 'changes') {
      const day: number = item.billFrequencyDay;
      this.effectiveBillFrequencyDayObj = daysList.find(item => item.value === day);
      let fDuration;
      if (this.billFrequencyList && this.billFrequencyList.length > 0) {
        fDuration = this.billFrequencyList.find(a => a.id === item.billFrequencyDuration);
      }
      this.upcomingChangesDisplay = {
        effectiveBillFrequencyDuration : fDuration,
        effectiveBillFrequencyQuantity : item.billFrequencyQuantity,
        effectiveBillFrequencyStartingDate : item.effectiveDate,
        effectiveBillFrequencyRecursOn: item.billFrequencyRecursOn
      };
    } else {
      this.effectiveBillFrequencyDayObj = daysList.find(item => item.value === this.billingSettings.effectiveBillFrequencyDay);
      this.upcomingChangesDisplay = {
        effectiveBillFrequencyDuration : this.billingSettings.effectiveBillFrequencyDuration,
        effectiveBillFrequencyQuantity : this.billingSettings.effectiveBillFrequencyQuantity,
        effectiveBillFrequencyStartingDate : this.billingSettings.effectiveBillFrequencyStartingDate,
        effectiveBillFrequencyRecursOn : this.billingSettings.effectiveBillFrequencyRecursOn
      };
      if (this.billingSettings.effectiveBillFrequencyStartingDate) {
        this.billFrequencyEndDate = moment(this.billingSettings.effectiveBillFrequencyStartingDate).add(-1, 'days').format('MM/DD/YYYY');
      }
    }
    this.effectiveBillFrequencyDayObj = {...this.effectiveBillFrequencyDayObj};
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
