import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { IJobFamilyRate, IOffice, IPRofile, Page } from 'src/app/modules/models';
import * as Constant from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { EmployeeService, MiscService, RateTableService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../../shared/error.json';
import { SetRatesComponent } from '../set-rates/set-rates.component';
import { ConfirmModelComponent } from './confirm-model/confirm-model.component';

interface IRateTblClient {
  clientId?: number;
  clientName?: string;
  clientNumber?: string;
  iscompany?: boolean;
  matterId?: number;
  primanyLawOffice?: string;
  primanyLawOfficeId?: number;
  rateTableId?: number;
  responsibleAttoneyId?: number;
  responsibleAttorney?: [{id?: number; name?: string;}]
  status?: string;
  isBlockedForCurrentUser?: boolean;
};
interface IRateTblMatter {
  cclientName?: string;
  id?: number;
  matterLawOffice?: string;
  matterName?: string;
  matterNumber?: number;
  practiceArea?: Array<IOffice>;
  responsibleAttorney?: Array<IOffice>;
  status?: string;
  statusId?: number;
  isBlockedForCurrentUser?: boolean;
};

@Component({
  selector: 'app-create-rate-table',
  templateUrl: './create-rate-table.component.html',
  styleUrls: ['./create-rate-table.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CreateRateTableComponent implements OnInit {
  @ViewChild(DatatableComponent, { static: true }) jobfamilynameselttable: DatatableComponent;
  @ViewChild(DatatableComponent, { static: true }) jobfamilyclienttable: DatatableComponent;
  @ViewChild(DatatableComponent, { static: true }) jobfamilymattertable: DatatableComponent;

  public createRateForm: FormGroup;
  public formSubmitted: boolean = false;
  public nameExist: boolean = false;
  public checkingExist: boolean = false;
  public existSubscription: Subscription;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public pages = new Page();
  public pangeSelecteds: number = 1;
  public pagec = new Page();
  public pangeSelectedc: number = 1;
  public pagem = new Page();
  public pangeSelectedm: number = 1;
  public isLoading: boolean = false;
  public matterLoading: boolean = false;
  public clientLoading: boolean = false;
  public pageSelectors = new FormControl('10');
  public pageSelectorc = new FormControl('10');
  public pageSelectorm = new FormControl('10');
  public counter = Array;
  public selecteFamilyRates: Array<IJobFamilyRate> = [];
  public rateTableDetails: IJobFamilyRate;
  public limitArray: Array<number> = [10, 30, 50, 100];
  public loginUser: IPRofile;
  public errorData: any = (errorData as any).default;
  public rateTableId: number = null;
  public jobFamilyRates: Array<IJobFamilyRate> = [];
  public oriJobFamilyRates: Array<IJobFamilyRate> = [];
  public clientList: Array<IRateTblClient> = [];
  public oriClientList: Array<IRateTblClient> = [];
  public matterList: Array<IRateTblMatter> = [];
  public oriMatterList: Array<IRateTblMatter> = [];
  public titlereasatt: string = 'All';
  public title: string = 'All';
  public titlestatus: string = 'All';
  public titlematterresp: string = 'All';
  public responattorn: Array<number> = [];
  public resattrList1: Array<IOffice> = [];
  public resattrListm: Array<IOffice> = [];
  public filterName: string = 'Apply Filter';
  public selectedOffice: Array<number> = [];
  public selectedmOffice: Array<number> = [];
  public officeList: Array<IOffice> = [];
  public officeListm: Array<IOffice> = [];
  public dropdownList1: Array<{id?: string; name?: string; checked?: boolean;}> = [
    {
      id: 'active',
      name: 'Active',
      checked: false
    },
    {
      id: 'inactive',
      name: 'Inactive',
      checked: false
    },
    {
      id: 'archive',
      name: 'Archived',
      checked: false
    }
  ];
  public selectedStatus: Array<string> = [];
  public selectedStatusm: Array<string> = [];
  public practiceAreaList: Array<IOffice> = [];
  public selectedPractice: Array<number> = [];
  public clientSearch: string;
  public matterSearch: string;
  public statusListm: Array<{id?: string; name?: string;checked?: boolean}> = [];
  public titlematterres: string = 'All';
  public titlem: string = 'All';
  public titlestatusm: string = 'All';
  public responattornm: Array<number> = [];
  public viewMode: boolean = false;
  public submitNewChanges: boolean = false;
  public isBlockedForCurrentUser: boolean = false;
  public isBlockedForCurrentMatter: boolean = false;
  public newChanges: string;

  constructor(
    private builder: FormBuilder,
    private modalService: NgbModal,
    private rateTableService: RateTableService,
    private router: Router,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private employeeService: EmployeeService,
    private misc: MiscService,
  ) {
    this.pages.pageNumber = 0;
    this.pages.size = 10;
    this.pagec.pageNumber = 0;
    this.pagec.size = 10;
    this.pagem.pageNumber = 0;
    this.pagem.size = 10;
  }

  ngOnInit() {
    this.loginUser = UtilsHelper.getLoginUser();
    if (this.router.url.includes('/firm/view-rate-table')) {
      this.viewMode = true;
    }
    this.route.queryParams.subscribe(params => {
      this.rateTableId = params['rateTableId'];
      this.newChanges = params['newChanges'];
      this.rateTableId = (this.rateTableId) ? +this.rateTableId : null;
      if (this.rateTableId) {
        this.createRateForm = this.builder.group({
          name: [null, [Validators.required]],
          description: ['', []],
          effectiveDate: [new Date(), Validators.required],
        });
        this.getRateTablesDtls();
        this.getResposibleAttorny();
        this.getOffices();
        this.getPracticeAreas();
      } else {
        this.getJobFamily('init');
        this.createRateForm = this.builder.group({
          name: [null, [Validators.required]],
          description: ['', []]
        });
      }
    });
  }

  /**
   * get job family list
   *
   */
  public getJobFamily(type) {
    this.isLoading = true;
    this.employeeService.v1EmployeeJobFamilyGet()
    .pipe(map(UtilsHelper.mapData)).subscribe((res) => {
      this.isLoading = false;
      if (res && res.length > 0) {
        res.map((item) => {
          item.baseRate = item.baseRate ? (+item.baseRate).toFixed(2) : (0).toFixed(2);
          let existRct = (type === 'newchanges') ? null : this.selecteFamilyRates.find(obj => obj.id === item.id);
          item.tableRate =  (existRct) ? (existRct.tableRate) ? (+existRct.tableRate).toFixed(2) : (0).toFixed(2) : item.baseRate;
          item.error = false;
        });
        this.jobFamilyRates = res;
        this.oriJobFamilyRates = [...this.jobFamilyRates];
        this.isLoading = false;
        setTimeout(() => {
          this.changePageSizes();
        }, 0);
      }
    }, err => {this.isLoading = false;});
  }

  public getRateTablesDtls() {
    this.isLoading = true;
    this.rateTableService.v1RateTableIdGet({id: this.rateTableId})
    .pipe(map(UtilsHelper.mapData))
    .subscribe((res) => {
      this.rateTableDetails = res;
      this.createRateForm.patchValue({
        name: this.rateTableDetails.name,
        description: this.rateTableDetails.description,
        effectiveDate: (this.newChanges === 'newchanges') ? new Date() : (this.rateTableDetails.effectiveDate) ? this.rateTableDetails.effectiveDate : new Date()
      });
      if (this.rateTableDetails && this.rateTableDetails.lstvwCustomizeRateTableJobfamily &&
        this.rateTableDetails.lstvwCustomizeRateTableJobfamily.length > 0
      ) {
        this.selecteFamilyRates = [...this.rateTableDetails.lstvwCustomizeRateTableJobfamily];
        this.selecteFamilyRates.map((obj) => {
          obj.name = obj.jobFamilyName;
          obj.id = obj.jobFamilyId;
          obj.baseRate = +(obj.jobFamilyBaseRate ? obj.jobFamilyBaseRate.toFixed(2) : (0).toFixed(2));
          obj.tableRate =  +((obj.tableRate) ? (+obj.tableRate).toFixed(2) : (0).toFixed(2));
        });
      }
      this.submitNewChanges = (this.newChanges === 'newchanges') ? true : false;
      this.getJobFamily((this.newChanges === 'newchanges') ? 'newchanges' : 'edit');
      this.getClient();
      this.getMatter();
    }, err => {
      this.isLoading = false;
    });
  }

  public getClient() {
    this.clientLoading = true;
    this.rateTableService.v1RateTableRateTableClientsPost({id: this.rateTableId})
    .pipe(map(UtilsHelper.mapData)).subscribe((res) => {
      this.clientLoading = false;
      if (res && res.length > 0) {
        this.isBlockedForCurrentUser = res[0].isBlockedForCurrentUser;
        this.clientList = res.filter(item => item.clientId > 0);
        this.oriClientList = [...this.clientList];
        setTimeout(() => {
          this.clientUpdateDatatableFooterPage();
        }, 0);
      }
    }, err => {this.clientLoading = false;});
  }

  public getMatter() {
    this.matterLoading = true;
    this.rateTableService.v1RateTableRateTableMattersPost({id: this.rateTableId})
    .pipe(map(UtilsHelper.mapData)).subscribe((res) => {
      this.matterLoading = false;
      if (res && res.length > 0) {
        this.isBlockedForCurrentMatter = res[0].isBlockedForCurrentUser;
        this.matterList = res.filter(item => item.matterNumber > 0);
        this.oriMatterList = [...this.matterList];
        this.getStatusList();
        setTimeout(() => {
          this.matterUpdateDatatableFooterPage();
        }, 0);
      }
    }, err => {this.matterLoading = false;});
  }

  /**
   * Get responsible attorney list
   *
   */
  public getResposibleAttorny() {
    this.isLoading = true;
    this.misc.v1MiscAttornysGet().pipe(map(UtilsHelper.mapData))
    .subscribe(suc => {
        this.resattrList1 = suc.filter(x => x.name != null);
        this.resattrListm = [...this.resattrList1];
        this.isLoading = false;
      },err => {
        this.isLoading = false;
        console.log(err);
      }
    );
  }

   /**
   * Get office list
   *
   */
  public getOffices() {
    this.isLoading = true;
    this.misc.v1MiscOfficesGet().pipe(map(UtilsHelper.mapData))
    .subscribe(suc => {
        this.officeList = suc.filter(x => x.name != null);
        this.officeListm = [...this.officeList];
        this.isLoading = false;
      },err => {
        this.isLoading = false;
        console.log(err);
      }
    );
  }

  private getStatusList() {
    if (this.matterList) {
      var statusList = this.oriMatterList
        .filter(a => a.status)
        .map(m => m.status);
        statusList = _.uniqBy(statusList, a => a);
        if (statusList && statusList.length > 0) {
          statusList.map((item) => {
            this.statusListm.push({id: item, name: item});
          });
        }
    }
  }

  public getPracticeAreas() {
    this.misc.v1MiscPracticesGet({}).pipe(map(UtilsHelper.mapData))
    .subscribe(suc => {
        this.practiceAreaList = suc.filter(x => x.name != null);
      }, err => {
        console.log(err);
      }
    );
  }

  public checkExist() {
    let name = (this.createRateForm.value.name) ? this.createRateForm.value.name.trim() : null;
    if (name && name !== "") {
      this.checkingExist = true;
      if (this.existSubscription) {
        this.existSubscription.unsubscribe();
      }
      let body = { name: name };
      if (this.rateTableId) {
        body['id'] = this.rateTableId;
      }
      this.existSubscription = this.rateTableService
      .v1RateTableRateTableExistPost$Json({body : body})
      .subscribe((result: any) => {
        this.checkingExist = false;
        this.nameExist = JSON.parse(result).results;
      }, err => {this.checkingExist = false;});
    }
  }


  public save() {
    this.formSubmitted = true;
    if (!this.createRateForm.valid || this.checkingExist || this.nameExist) {
      return;
    }

    if (this.rateTableId) {
      let message = `All unbilled fees for matters that use this rate table, with a date of service of ${moment(this.createRateForm.value.effectiveDate).format('MM/DD/YYYY')}, will be adjusted to use the new rates. Are you sure you want to proceed?`;
      if (moment(this.createRateForm.value.effectiveDate).isAfter(new Date())) {
        message = `Your changes to this rate table will take effect on ${moment(this.createRateForm.value.effectiveDate).format('MM/DD/YYYY')}. Are you sure you want to proceed?`;
      }
      this.dialogService.confirm(
        message,
        'Yes, use this effective date',
        'Cancel',
        'Effective Date',
        true,
      ).then(res => {
        if (res) {
          this.saveApiCall();
        }
      });
    } else {
      this.saveApiCall();
    }
  }

  public saveApiCall() {
    this.isLoading = true;
    let jobFamilyIds = [];


    if (this.rateTableId) {
      let existIds = []
      if (this.rateTableId) {
        existIds = this.selecteFamilyRates.map(obj => obj.id);
      }

      this.oriJobFamilyRates.map((obj) => {
        if (obj.baseRate != obj.tableRate || existIds.includes(obj.id)) {
          jobFamilyIds.push({
            jobFamilyId: obj.id,
            tableRate: +obj.tableRate,
            isNew: !existIds.includes(obj.id)
          });
        }
      });
    } else if (this.oriJobFamilyRates && this.oriJobFamilyRates.length > 0) {
      this.oriJobFamilyRates.map((obj) => {
        if (obj.baseRate != obj.tableRate) {
          jobFamilyIds.push({
            jobFamilyId: obj.id,
            tableRate: +obj.tableRate
          });
        }
      });
    }
    const body = {
      id: (this.rateTableId) ? (this.rateTableId) : 0,
      isActive: (this.rateTableId) ? this.rateTableDetails.isActive: true,
      name: this.createRateForm.value.name,
      description: this.createRateForm.value.description,
      tenantId: this.loginUser.tenantId,
      lstvwCustomizeRateTableJobfamily: jobFamilyIds,
      chargeCodeIds: [],
    }
    if (this.rateTableId) {
      body['effectiveDate'] = moment(this.createRateForm.value.effectiveDate).format('YYYY-MM-DD')
      const isFutureDate = moment(this.createRateForm.value.effectiveDate).isAfter(new Date());
      body['submitNewChanges'] = this.submitNewChanges || isFutureDate;
    }
    let observable = this.rateTableService.v1RateTablePost$Json({body}).pipe(map(UtilsHelper.mapData));
    if (this.rateTableId) {
      observable = this.rateTableService.v1RateTableIdPut$Json({id: this.rateTableId, body}).pipe(map(UtilsHelper.mapData));
    }
    observable.subscribe((res) => {
      this.isLoading = false;
      this.router.navigate(['/firm/rate-table'], { queryParams: { created: 'yes' } });
    }, err => {
      this.isLoading = false;
    });
  }

  setRate(className, winClass) {
    let modalRef = this.modalService.open(SetRatesComponent, {
      size: className,
      windowClass: winClass,
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.selecteFamilyRates = _.cloneDeep(this.selecteFamilyRates);
    modalRef.componentInstance.jobFamilyRates = _.cloneDeep(this.oriJobFamilyRates);
    modalRef.componentInstance.oriJobFamilyRates = _.cloneDeep(this.oriJobFamilyRates);
    modalRef.componentInstance.rateTableId = this.rateTableId;

    modalRef.result.then((res: Array<IJobFamilyRate>) => {
      if (res && res.length > 0) {
        this.jobFamilyRates = [...res];
        this.oriJobFamilyRates = [...this.jobFamilyRates];
        setTimeout(() => {
          this.changePageSizes();
        }, 0);
      }
    });
  }

  public searchFilters(event) {
    const val = (event && event.target) ? event.target.value : '';
    let temp = [];
    temp = this.oriJobFamilyRates.filter(
      item => UtilsHelper.matchName(item, val, 'name')
    );
    this.jobFamilyRates = temp;
    this.updateDatatableFooterPages();
  }

  /**
   * Change per page size
   *
   */
  public changePageSizes() {
    this.pages.size = +this.pageSelectors.value;
    this.updateDatatableFooterPages();
  }

  /**
   * Change page number
   *
   */
  public changePages() {
    this.pages.pageNumber = this.pangeSelecteds - 1;
    if (this.pangeSelecteds == 1) {
      this.updateDatatableFooterPages();
    }
  }

  /**
   * Handle change page number
   *
   */
  public pageChanges(e) {
    this.pangeSelecteds = e.page;
  }


  /**
   * Update datatable footer
   */
  updateDatatableFooterPages() {
    this.pages.totalElements = this.jobFamilyRates.length;
    this.pages.totalPages = Math.ceil(this.jobFamilyRates.length / this.pages.size);
    this.pages.pageNumber = 0;
    this.pangeSelecteds = 1;
    this.jobfamilynameselttable.offset = 0;
  }

  /**
   * select responsible attorney drop down
   *
   */
  public selectDropdwnRa(event) {
    this.titlereasatt = '';
    if (event.length > 0) {
      this.titlereasatt = event.length;
    } else {
      this.titlereasatt = 'All';
    }
  }

  /**
   *
   * Clear filter of responsible attorney
   */
  public clearFilterResponsibleAttorney() {
    this.responattorn = [];
    this.resattrList1.forEach(item => (item.checked = false));
    this.titlereasatt = 'All';
    this.applyFilter();
  }

  public onMultiSelectSelectedOptions(event) {
  }


  public selectDropdwnPo(event) {
    this.title = '';
    if (event.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'All';
    }
  }

  /**
   *
   * Clear filter of primary office
   */
  public clearFilterPrimaryOffice() {
    this.selectedOffice = [];
    this.officeList.forEach(item => (item.checked = false));
    this.title = 'All';
    this.applyFilter();
  }

  /**
   * select status drop down
   *
   */
  public selectStatus(event) {
    this.titlestatus = '';
    if (event.length > 0) {
      this.titlestatus = event.length;
    } else {
      this.titlestatus = 'All';
    }
  }

  /**
   * Clear status filter
   */
  public clearFilter1() {
    this.selectedStatus = [];
    this.dropdownList1.forEach(item => (item.checked = false));
    this.titlestatus = 'All';
    this.applyFilter();
  }

  public applyFilter() {
    let selectedoffice = [];
    let selectedstatus = [];
    if (this.selectedOffice && this.selectedOffice.length > 0) {
      this.officeList.map((item) => {
        if (this.selectedOffice.indexOf(item.id) !== -1) {
          selectedoffice.push(item.name);
        }
      });
    }
    if (this.selectedStatus && this.selectedStatus.length > 0) {
      this.dropdownList1.map((item) => {
        if (this.selectedStatus.indexOf(item.id) !== -1) {
          selectedstatus.push(item.name);
        }
      });
    }
    this.clientList = this.oriClientList.filter(a => {
      let matching = true;

      if (this.responattorn && this.responattorn.length > 0) {
        matching = matching && a.responsibleAttorney && a.responsibleAttorney.length &&
          this.responattorn.indexOf(a.responsibleAttorney[0].id) !== -1;
      }
      if (this.selectedOffice && this.selectedOffice.length > 0) {
        matching = matching && a.primanyLawOffice &&
          selectedoffice.indexOf(a.primanyLawOffice) !== -1;
      }
      if (this.selectedStatus && this.selectedStatus.length > 0) {
        matching = matching && a.status &&
        selectedstatus.indexOf(a.status) !== -1;
      }
      if (this.clientSearch) {
        matching = matching && (
          UtilsHelper.matchName(a, this.clientSearch, 'clientNumber') ||
          UtilsHelper.matchName(a, this.clientSearch, 'clientName')  ||
          UtilsHelper.matchName(a, this.clientSearch, 'primanyLawOffice') ||
          UtilsHelper.matchName(a,  this.clientSearch, 'responsibleAttorney')
        );
      }
      return matching;
    });
    this.clientUpdateDatatableFooterPage();
  }

  public viewProfile(row) {
    if (row.iscompany) {
      this.router.navigate(['/client-view/corporate'], {queryParams: {clientId: row.clientId}});
    } else {
      this.router.navigate(['/client-view/individual'], {queryParams: {clientId: row.clientId}});
    }
  }

  /**
   * Change per page size
   *
   */
  public clientChangePageSize() {
    this.pagec.size = +this.pageSelectorc.value;
    this.clientUpdateDatatableFooterPage();
  }

  /**
   * Change page number
   *
   */
  public clientChangePage() {
    this.pagec.pageNumber = this.pangeSelectedc - 1;
    if (this.pangeSelectedc == 1) {
      this.clientUpdateDatatableFooterPage();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  /**
   * Handle change page number
   *
   */
  public clientPageChange(e) {
    this.pangeSelectedc = e.page;
    UtilsHelper.aftertableInit();
  }


  /**
   * Update datatable footer
   */
  clientUpdateDatatableFooterPage() {
    this.pagec.totalElements = this.clientList.length;
    this.pagec.totalPages = Math.ceil(this.clientList.length / this.pages.size);
    this.pagec.pageNumber = 0;
    this.pangeSelectedc = 1;
    this.jobfamilyclienttable.offset = 0;
  }

  /**
   * select responsible attorney drop down
   *
   */
  public selectDropdwnRam(event) {
    this.titlematterres = '';
    if (event.length > 0) {
      this.titlematterres = event.length;
    } else {
      this.titlematterres = 'All';
    }
  }

  /**
   *
   * Clear filter of responsible attorney
   */
  public clearFilterResponsibleAttorneym() {
    this.responattornm = [];
    this.resattrListm.forEach(item => (item.checked = false));
    this.titlematterres = 'All';
    this.applyFilterMatter();
  }

  public selectDropdwnPom(event) {
    this.titlem = '';
    if (event.length > 0) {
      this.titlem = event.length;
    } else {
      this.titlem = 'All';
    }
  }

  /**
   *
   * Clear filter of primary office
   */
  public clearFilterPrimaryOfficem() {
    this.selectedmOffice = [];
    this.officeListm.forEach(item => (item.checked = false));
    this.titlem = 'All';
    this.applyFilterMatter();
  }

    /**
   * select status drop down
   *
   */
  public selectStatusm(event) {
    this.titlestatusm = '';
    if (event.length > 0) {
      this.titlestatusm = event.length;
    } else {
      this.titlestatusm = 'All';
    }
  }

  /**
   *
   * Clear filter of primary office
   */
  public clearFilterst() {
    this.selectedStatusm = [];
    this.statusListm.forEach(item => (item.checked = false));
    this.titlestatusm = 'All';
    this.applyFilterMatter();
  }

  /**
   *
   * Clear filter of primary office
   */
  public clearFilterResponsibleAttorneyp() {
    this.selectedPractice = [];
    this.practiceAreaList.forEach(item => (item.checked = false));
    this.titlematterresp = 'All';
    this.applyFilterMatter();
  }

  /**
   * select responsible attorney drop down
   *
   */
  public selectDropdwnRap(event) {
    this.titlematterresp = '';
    if (event.length > 0) {
      this.titlematterresp = event.length;
    } else {
      this.titlematterresp = 'All';
    }
  }

  public applyFilterMatter() {
    let selectedoffice = [];
    let selectedstatus = [];
    if (this.selectedmOffice && this.selectedmOffice.length > 0) {
      this.officeListm.map((item) => {
        if (this.selectedmOffice.indexOf(item.id) !== -1) {
          selectedoffice.push(item.name);
        }
      });
    }
    if (this.selectedStatusm && this.selectedStatusm.length > 0) {
      this.statusListm.map((item) => {
        if (this.selectedStatusm.indexOf(item.id) !== -1) {
          selectedstatus.push(item.name);
        }
      });
    }

    this.matterList = this.oriMatterList.filter(a => {
      let matching = true;

      if (this.responattornm && this.responattornm.length > 0) {
        matching = matching && a.practiceArea && a.practiceArea.length &&
          this.responattornm.indexOf(a.practiceArea[0].id) !== -1;
      }
      if (this.selectedPractice && this.selectedPractice.length > 0) {
        matching = matching && a.practiceArea && a.practiceArea.length &&
          this.selectedPractice.indexOf(a.practiceArea[0].id) !== -1;
      }
      if (this.selectedmOffice && this.selectedmOffice.length > 0) {
        matching = matching && a.matterLawOffice &&
          selectedoffice.indexOf(a.matterLawOffice) !== -1;
      }
      if (this.selectedStatusm && this.selectedStatusm.length > 0) {
        matching = matching && a.status &&
        selectedstatus.indexOf(a.status) !== -1;
      }
      if (this.matterSearch) {
        matching = matching && (
          UtilsHelper.matchName(a, this.matterSearch, 'clientName') ||
          UtilsHelper.matchName(a, this.matterSearch, 'matterNumber') ||
          UtilsHelper.matchName(a, this.matterSearch, 'matterName') ||
          UtilsHelper.matchName(a, this.matterSearch, 'responsibleAttorney') ||
          UtilsHelper.matchName(a, this.matterSearch, 'practiceArea') ||
          UtilsHelper.matchName(a, this.matterSearch, 'matterLawOffice') ||
          UtilsHelper.matchName(a, this.matterSearch, 'status')
        );
      }
      return matching;
    });
    this.matterUpdateDatatableFooterPage();
  }

  /**
   * Change per page size
   *
   */
  public matterChangePageSize() {
    this.pagem.size = +this.pageSelectorm.value;
    this.matterUpdateDatatableFooterPage();
  }

  /**
   * Change per page size
   *
   */
  public matterChangePages() {
    this.pagem.size = +this.pageSelectorm.value;
    this.matterUpdateDatatableFooterPage();
  }

  /**
   * Change page number
   *
   */
  public matterChangePage() {
    this.pagem.pageNumber = this.pangeSelectedm - 1;
    if (this.pangeSelectedm == 1) {
      this.matterUpdateDatatableFooterPage();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  /**
   * Handle change page number
   *
   */
  public matterPageChange(e) {
    this.pangeSelectedm = e.page;
    UtilsHelper.aftertableInit();
  }


  /**
   * Update datatable footer
   */
  matterUpdateDatatableFooterPage() {
    this.pagem.totalElements = this.matterList.length;
    this.pagem.totalPages = Math.ceil(this.matterList.length / this.pagem.size);
    this.pagem.pageNumber = 0;
    this.pangeSelectedm = 1;
    this.jobfamilymattertable.offset = 0;
    UtilsHelper.aftertableInit();
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get jfFooterHeight() {
    if (this.jobFamilyRates) {
      return this.jobFamilyRates.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  get cFooterHeight() {
    if (this.clientList) {
      return this.clientList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  get mFooterHeight() {
    if (this.matterList) {
      return this.matterList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
