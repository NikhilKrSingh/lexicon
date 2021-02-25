import {
  Component,
  ElementRef, HostListener,
  OnDestroy, OnInit, TemplateRef, ViewChild, ViewEncapsulation
} from '@angular/core';
import {
  FormArray, FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import {
  ColumnMode,

  DatatableComponent, SelectionType
} from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwClient, vwIdName, vwMatterBasics } from 'src/common/swagger-providers/models';
import {
  ClientService,


  ContactsService, MatterService,
  MiscService, OfficeService,



  PersonService
} from 'src/common/swagger-providers/services';
import * as errorData from '../../../modules/shared/error.json';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { IOffice, vwMatterResponse } from '../../models';
import { Page } from '../../models/page';
import { UtilsHelper } from '../../shared/utils.helper';
import { PCAdvanceSearchComponent } from './advance-search/advance-search.component';



@Component({
  selector: 'app-reassign-client',
  templateUrl: './reassign-client.component.html',
  styleUrls: ['./reassign-client.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ReassignClientComponent implements OnInit, OnDestroy, IBackButtonGuard {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  @ViewChild('ReassignConsultAttorney', { static: false }) ReassignConsultAttorney: TemplateRef<any>;

  modalRef: NgbModalRef<any>;
  public clientId: number;
  public matterId: number;
  public attorneyList: Array<any> = [];
  public errorData: any = (errorData as any).default;
  public originalAttorneyList: Array<any> = [];
  public consultofficelist: Array<any> = [];
  public clientDetail: vwClient;
  public consultOffice: number;
  public footerHeight = 50;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public counter = Array;
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 20];
  public selectedAttorney: any;
  public selectedAttorneyId: number;
  public selectedOffice: any;
  private previousSelectedOffice: any;
  private request: any;
  public searchStr: string;
  public pageSelected = 1;
  public changeNotes: string;

  public matterDetails: vwMatterResponse;
  public practiceList: Array<IOffice> = [];
  public selectedPracticeArea: any;
  public practiceAreaSelected: boolean = false;
  public matterTypes: Array<IOffice> = [];

  public matterType: any;
  public practiceArea: any;
  public lastSelectedPracticeArea: any;

  public loading: boolean = true;
  public topLoading = true;

  private oldAttorneyId: number;
  private oldOriginatingAttorneyId: number;
  public attorneyLoading: boolean = true;
  public nextLoading: boolean;

  public attorneyForm: FormGroup;
  public attorneys: FormArray;
  public formSubmitted: boolean = false;
  public isSelectedEachError: Boolean = false;
  public blankError: Boolean = false;
  public duplicate: Boolean = false;
  public missingTypeAttorney: boolean = false;
  public newAttorneyList: Array<any> = [];
  public sortingAttorney = { 'name': true, 'primaryOffice': true, 'officeAssociation': true };
  public displayDrpDwn: Array<{ display: boolean }> = [
    { display: false },
    { display: false },
    { display: false },
  ];
  public showLoaderDrpDwn: Array<{ display: boolean }> = [
    { display: false },
    { display: false },
    { display: false },
  ];
  public searchSubscribe: Subscription;
  public stateList: Array<IOffice> = [];
  public changeJurisdictionMatterMsg: string = '';
  public openPopup: string = 'state';
  public jurisdictionStateList: Array<any> = [];
  public jurisdictionCounty: string = null;
  public jurisdictionStateId: number;
  officeList: Array<vwIdName>;
  public isAdminPermission: boolean = false;
  public isError: boolean = false;


  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;

  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public originatingAttorney: number = 0;
  public permissionList: any;
  private permissionSubscribe: Subscription;

  officeError = '';
  practiceAreaError = '';

  constructor(
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private officeService: OfficeService,
    private clientService: ClientService,
    private toastr: ToastDisplay,
    private router: Router,
    private matterService: MatterService,
    private miscService: MiscService,
    private contactService: ContactsService,
    private appConfig: AppConfigService,
    private pagetitle: Title,
    private store: Store<fromRoot.AppState>,
    private personService:PersonService,
    private formBuilder: FormBuilder,
    private el: ElementRef,
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart) === true) {
        this.navigateAwayPressed = true;
      }
    });
    this.officeList = [];
    this.permissionList$ = this.store.select('permissions');
    this.initAttorneyForm();
  }

  ngOnInit() {
    this.getPractices();
    this.getconsultOffices();

    this.route.queryParams.subscribe((params) => {
      this.clientId = +params['clientId'];
      this.matterId = +params['matterId'];
      if (this.clientId) {
        this.getclientDetails();
      }

      if (this.matterId) {
        this.getMatterDetails();
      }
    });

    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (obj.datas.CLIENT_CONTACT_MANAGEMENTisAdmin) {
            this.isAdminPermission = true;
          }
        }
      }
    });
    this.getState()

  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }

    if (this.searchSubscribe) {
      this.searchSubscribe.unsubscribe();
    }
  }


  initAttorneyForm() {
    this.attorneyForm = new FormGroup({
      attorneys: new FormArray([], Validators.required),
    });
  }

  attorney(): FormGroup {
    return this.formBuilder.group({
      name: ['', Validators.required],
      IsOriginatingAttorney: {value: false, disabled: !this.isAdminPermission},
      IsConsultAttorney: false,
      IsAttorney: false,
      primaryOffice: '',
      officeAssociation: '',
      id: [null, Validators.required],
      display: false,
      personStates: '',
      practiceAreas: '',
      primaryOfficeId: 0,
      secondaryOffices: '',
      doNotSchedule: false
    });
  }

  /**
   *
   * Function to get the client details
   */
  getclientDetails() {
    this.topLoading = true;
    this.clientService
      .v1ClientClientIdGet({ clientId: this.clientId })
      .subscribe(
        (res) => {
          this.clientDetail = JSON.parse(res as any).results;
          this.clientDetail.firstName = this.clientDetail.firstName || '';
          this.clientDetail.lastName = this.clientDetail.lastName || '';
          if (this.clientDetail.isCompany) {
            this.pagetitle.setTitle('Reassign Potential Client - ' + this.clientDetail.companyName);
          } else {
            this.pagetitle.setTitle('Reassign Potential Client - ' + this.clientDetail.firstName + ' ' + this.clientDetail.lastName);
          }

          this.consultOffice = this.clientDetail.consultationLawOffice ? this.clientDetail.consultationLawOffice.id : null;
          this.selectedAttorney = this.clientDetail.consultAttorney;

          if(this.clientDetail.originatingAttorney && this.clientDetail.originatingAttorney.id) {
            this.originatingAttorney = +this.clientDetail.originatingAttorney.id;
            this.oldOriginatingAttorneyId = this.originatingAttorney;
          }

          if (this.selectedAttorney) {
            this.selectedAttorneyId = this.selectedAttorney.id;
            this.oldAttorneyId = this.selectedAttorneyId;
          }

          this.setConsultOffice();

          if (this.originatingAttorney === this.selectedAttorneyId){
            this.createAttorney('')
            this.getExistingAttorney(this.clientDetail.consultAttorney.id, 'both')
          } else {
            if (this.clientDetail.consultAttorney){
              this.createAttorney('')
              this.getExistingAttorney(this.clientDetail.consultAttorney.id, 'consult')
            }

            if (this.clientDetail.originatingAttorney){
              this.createAttorney('')
              this.getExistingAttorney(this.clientDetail.originatingAttorney.id, 'origin')

            }
          }
          this.topLoading = false;
        },
        (err) => {
          this.topLoading = false;
        }
      );
  }

  /**
   * function to consultation offices
   */
  getconsultOffices(): void {
    this.loading = true;
    this.officeService
      .v1OfficeCompactByTenantGet$Response({ checkInitialConsultation: true })
      .subscribe(
        (suc) => {
          const res: any = suc;
          const listData = JSON.parse(res.body).results;
          if (listData && listData.length > 0) {
            this.consultofficelist = listData.filter(item => item.status === 'Active' || item.status === 'Open');
          }
          this.setConsultOffice();
        },
        (err) => {
          this.loading = false;
        }
      );
  }

  private setConsultOffice() {
    if (this.consultOffice && !this.selectedOffice) {
      this.previousSelectedOffice = this.consultOffice;
      let row = this.consultofficelist.filter(
        (office) => office.id === this.consultOffice
      );
      this.selectedOffice = row[0];
    }
  }

  createAttorney(action: string = 'create'): void {
    this.attorneys = this.attorneyForm.get('attorneys') as FormArray;
    this.attorneys.push(this.attorney());

    if (action === 'create') {
      this.setAttornyRole();

      setTimeout(() => {
        const searchAttorney = this.el.nativeElement.querySelector(
          `#searchAttorney-${this.attorneys.length - 1}`
        );
        if (searchAttorney) {
          searchAttorney.focus();
        }
      }, 1000);
    }
  }

  public setAttornyRole() {
    let data = this.attorneyForm.getRawValue();
    let i = data && data.attorneys ? data.attorneys.length - 1 : 0;
    let isConsult: boolean = false;
    let isOriginating: boolean = false;

    if (data && data.attorneys && data.attorneys.length > 0) {
      isOriginating = data.attorneys.some((item) => item.IsOriginatingAttorney);
      isConsult = data.attorneys.some((item) => item.IsConsultAttorney);
    }

    data.attorneys.map((obj, index) => {
      if (i === index) {
        if (!isOriginating) {
          obj.IsOriginatingAttorney = true;
        }

        if (!isConsult) {
          obj.IsConsultAttorney = true;
        }
      }
    });

    this.attorneyForm.patchValue(data);
  }

  sortAttorney(col: string) {
    if (this.attorneyForm && this.attorneyForm.value && this.attorneyForm.value.attorneys) {
      let array = this.attorneyForm.value.attorneys;
      array = _.orderBy(array, a => a[col], this.sortingAttorney[col] ? "asc" : 'desc');
      this.sortingAttorney[col] = !this.sortingAttorney[col];
      this.attorneyForm.get('attorneys').patchValue(array);
    }
  }

  public advanceAttorneySearch(contanent: any, i: number) {
    let modal = this.modalService.open(PCAdvanceSearchComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-xlg',
    });
    let component = modal.componentInstance;
    component.attorneyForm = this.attorneyForm;
    component.data = this.setFilterParams(null);
    modal.result.then((res) => {
      if (res) {
        this.selectAttorny(contanent, res, i);
      }
    });
  }

  public selectAttorny(contanent, item, i: number) {
    let userState = [];

    if (item.personStates) {
      userState = item.personStates.split(',');
    }

    userState = userState.map(Number);

    if (
      this.clientDetail.jurisdiction.length > 0 &&
      this.clientDetail.jurisdiction[0].id &&
      userState.indexOf(this.clientDetail.jurisdiction[0].id) === -1
    ) {
      let state = this.stateList.find(
        (item) => +item.id === +this.clientDetail.jurisdiction[0].id
      );
      let stateName = state ? state.name : '';
      this.changeJurisdictionMatterMsg = `${item.name} is not licensed to practice in the state where this case has jurisdiction (${stateName}). Are you sure you want to assign this attorney?`;
      this.openPopup = 'attorneyState';
      this.modalService
        .open(contanent, {
          centered: true,
          backdrop: 'static',
          keyboard: false,
          windowClass: '',
        })
        .result.then(
          (result) => {
            if (result === 'Save click') {
              this.setAttorny(item, i, false);
            } else if (result === 'Cross click'){
              this.removeAttorney(i)
            }
          },
          (reason) => { }
        );
    } else {
      this.setAttorny(item, i);
    }
  }

  public setAttorny(item, i: number, init: boolean = null, type: string = '') {
    let data = this.attorneyForm.getRawValue();
    data.attorneys.map((obj, index) => {
      if (i === index) {
        obj.primaryOffice = item.primaryOffice;
        obj.name = item.name;
        obj.id = item.id;
        obj.personStates = item.personStates;
        obj.practiceAreas = item.practiceAreas;
        obj.primaryOfficeId = item.primaryOfficeId;
        obj.secondaryOffices = item.secondaryOffices;
        if(!init){
          obj.doNotSchedule = item.doNotSchedule;
        }
        obj.officeAssociation = this.getOfficeAssociation(obj);
        if (init && type === 'consult') {
          obj.IsConsultAttorney = true;
        }
        if (init && type === 'originating') {
          obj.IsOriginatingAttorney = true;
        }
        if(init && type === 'both'){
          obj.IsOriginatingAttorney = true;
          obj.IsConsultAttorney = true;
        }
        if (init === false) {
          let isOriginating = data.attorneys.some((item) => item.IsOriginatingAttorney);
          let isConsult = data.attorneys.some((item) => item.IsConsultAttorney);
          if(!isOriginating){
            obj.IsOriginatingAttorney = true;
          }
          if(!isConsult){
            obj.IsConsultAttorney = true;
          }
          obj.IsResponsibleAttorney = false;
          obj.IsBillingAttorney = false;
        }
        if(!init && obj.doNotSchedule){
          obj.IsResponsibleAttorney = false;
          obj.IsBillingAttorney = false;
          obj.IsConsultAttorney = false;
        }
      }
    });
    this.attorneyForm.patchValue(data);
    this.attorneyForm.updateValueAndValidity();
    this.validateAttorney();
    this.attorneyList = [];
    this.closeDroDw();
    this.closeLoader();
  }

  public getOfficeAssociation(item) {
    if (this.consultOffice) {
      let otherOffice = [];
      if (item.secondaryOffices) {
        otherOffice = item.secondaryOffices.split(',');
        otherOffice = otherOffice.map(Number);
      }
      if (item.primaryOfficeId == this.consultOffice) {
        return 'Primary Office';
      } else if (
        otherOffice.indexOf(+this.consultOffice) > -1
      ) {
        return 'Other Office';
      } else {
        return 'Not in Office';
      }
    } else {
      return '';
    }
  }

  removeAttorney(i) {
    this.attorneys.removeAt(i);

    setTimeout(() => {
      const searchAttorney = this.el.nativeElement.querySelector(
        `#searchAttorney-${this.attorneys.length - 1}`
      );
      if (searchAttorney) {
        searchAttorney.focus();
      }
    }, 1000);

    this.validateAttorney();
  }

  setFilterParams(text: any) {
    const param = {
      search: text,
      officeId: +this.consultOffice,
    };

    if (this.practiceArea) {
      param['practiceId'] = +this.practiceArea;
    }

    if (this.clientDetail.jurisdiction[0]) {
      param['stateId'] = +this.clientDetail.jurisdiction[0].id;
    }
    return param;
  }

  /**
   *  clears search list dropdown
   */
  clearDropDown(event) {
    if (
      event &&
      event.target &&
      event.target.className &&
      event.target.className.match('icon-angle-down')
    ) {
    } else {
      this.attorneyList = [];
      this.closeDroDw();
      this.closeLoader();
    }
  }

  private closeDroDw() {
    this.displayDrpDwn.map((obj) => {
      obj.display = false;
    });
  }
  private closeLoader(){
    this.showLoaderDrpDwn.map((obj) => {
      obj.display = false;
    })
  }

  public serachAttorny(index: number) {
    this.closeDroDw();
    this.closeLoader();
    let data = this.setFilterAttorneySearchParams(
      this.attorneyForm.value.attorneys[index].name
    );
    if (this.attorneyForm.value.attorneys[index].name.length >= 3) {
      if (this.searchSubscribe) {
        this.searchSubscribe.unsubscribe();
      }
      this.showLoaderDrpDwn[index].display = true;
      this.searchSubscribe = this.officeService
        .v1OfficeReDesignAttorneysGet(data)
        .pipe(map(UtilsHelper.mapData))
        .subscribe(
          (res: any) => {
            let selectedIds = [];
            if (
              this.attorneyForm.value &&
              this.attorneyForm.value.attorneys &&
              this.attorneyForm.value.attorneys.length > 0
            ) {
              selectedIds = this.attorneyForm.value.attorneys.map(
                (item) => item.id
              );
            }
            if(!selectedIds[index]) {
              res = res.filter(item => selectedIds.indexOf(item.id) === -1);
            }
            this.newAttorneyList = res;
            this.showLoaderDrpDwn[index].display = false;
            this.displayDrpDwn[index].display = true;
          },
          (err) => {
            this.showLoaderDrpDwn[index].display = false;
          }
        );
    } else {
      this.attorneyList = [];
      this.showLoaderDrpDwn[index].display = false;
    }
  }

  getExistingAttorney(id: number, type: string){
    this.attorneyLoading = true;

    this.officeService
      .v1OfficeReDesignAttorneysGet({id})
      .subscribe(
        (data: any) => {
          const res = JSON.parse(data).results
          if(res[0]){
            if(type === 'consult') {
              this.setAttorny(res[0], 1, true, 'consult')
            }
            if(type === 'origin') {
              this.setAttorny(res[0], 0, true, 'originating')
            }
            if(type === 'both') {
              this.setAttorny(res[0], 0, true, 'both')
            }
          }
          this.attorneyLoading = false;
        },
        () => {
          this.attorneyLoading = false;
        }
      );
  }

  public getState() {
    this.miscService.v1MiscStatesGet$Response({}).subscribe(
      (suc) => {
        let res: any = suc;
        this.stateList = JSON.parse(res.body).results;
        this.jurisdictionStateList = JSON.parse(res.body).results;
      },
      (err) => {
        console.log(err);
      }
    );
  }

  getStateName(id?){
    let state: any = this.jurisdictionStateList.filter(obj => obj.id == this.jurisdictionStateId);
    state = state[0];
    return state.name;
  }

  setFilterAttorneySearchParams(text: any) {
    const param = {
      search: text,
      officeId: +this.consultOffice,
    };

    if (this.practiceArea) {
      param['practiceId'] = +this.practiceArea;
    }

    return param;
  }

  get attorneyFormGroup() {
    return this.attorneyForm.get('attorneys') as FormArray;
  }

  private validateAttorney() {
    this.blankError = false;
    this.duplicate = false;
    let IsConsultAttorneyCount = [];
    let IsOriginatingAttorneyCount = [];
    this.isSelectedEachError = false;
    this.missingTypeAttorney = false;

    let data = this.attorneyForm.getRawValue()

    data.attorneys.forEach((element, index) => {
      if (element.IsConsultAttorney) {
        if (element.id) {
          IsConsultAttorneyCount.push(element.IsConsultAttorney);
        }
      }

      if (element.IsOriginatingAttorney) {
        if (element.id) {
          IsOriginatingAttorneyCount.push(element.IsOriginatingAttorney);
        }
      }


      if (
        element.IsConsultAttorney === false &&
        element.IsOriginatingAttorney === false
      ) {
        this.isSelectedEachError = true;
      }
    });

    if (
      IsConsultAttorneyCount.length === 0 &&
      IsOriginatingAttorneyCount.length === 0
    ) {
      this.blankError = true;
    }
    if (
      IsConsultAttorneyCount.length > 1 ||
      IsOriginatingAttorneyCount.length > 1
    ) {
      this.duplicate = true;
    }

    if (
      IsConsultAttorneyCount.length === 0 ||
      IsOriginatingAttorneyCount.length === 0
    ) {
      this.missingTypeAttorney = true;
    }

    /* Corporate client validation */

    if (
      IsConsultAttorneyCount.length === 1 &&
      IsOriginatingAttorneyCount.length === 1
    ) {
      this.isSelectedEachError = false;
    }
  }

  isNotMatterDetailsValidate() {
    this.validateAttorney();
    this.validateOffice();

    if (!this.practiceAreaSelected) {
      this.practiceAreaError = this.errorData.practice_area_error;
    } else {
      this.practiceAreaError = null;
    }

    return this.isSelectedEachError ||
      this.duplicate ||
      this.blankError ||
      this.missingTypeAttorney ||
      this.officeError
      ? true
      : false;
  }

  public changeState(event, contanent) {
    if(!event){
      return;
    }
    let data = this.attorneyForm.value;
    let displayWrnPopup: boolean = false;
    let userState = [], diffState = [];
    if (data && data.attorneys && data.attorneys.length > 0) {
      data.attorneys.map((obj, index) => {
        userState = [];
        if (obj.personStates) {
          userState = obj.personStates.split(',');
          userState = userState.map(Number);
          if (userState.indexOf(event) === -1) {
            displayWrnPopup = true;
            diffState.push(index);
          }
        }
      });
    }
    if (displayWrnPopup) {
      let stateName = (event) ? (this.jurisdictionStateList.find(obj => obj.id == event)).name : '';
      this.changeJurisdictionMatterMsg = `At least one attorney is not licensed to practice in the state where this case has jurisdiction (${stateName}). Do you want to remove or keep these attorneys?`;
      this.openPopup = 'state';
      this.modalService.open(contanent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        windowClass: ''
      }).result.then(result => {
        if (result === 'Cross click') {
          if (diffState) {
            diffState.reverse()
            diffState.map((obj) => {
              this.removeAttorney(obj);
            })
          }
        }
      }, reason => {

      }
      );
    }
  }


  /**
   *
   * Open Modal
   * @param content
   * @param className
   * @param winClass
   */
  openPersonalinfo(content: any, className, winClass) {
    this.nextLoading = false;
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
      })
      .result.then((result) => {
        this.selectedAttorney = null;
        this.selectedAttorneyId = null;
        this.searchStr = '';
        this.changeNotes = '';
      });
  }

  /**
   *
   * @param event
   * Functiont to search the attorneys
   */
  searchAttorney() {
    this.attorneyLoading = true;
    if (!this.selectedOffice) {
      this.attorneyLoading = false;
      return;
    }
    if (this.request) {
      this.request.unsubscribe();
    }

    let val = this.searchStr || '';
    val = val.trim();

    let body = {
      search: val,
      officeId: this.selectedOffice.id,
    };

    if (this.practiceArea) {
      body['practiceId'] = this.practiceArea;
    }

    this.request = this.officeService
      .v1OfficeConsultattroneyGet$Response(body)
      .subscribe(
        (res) => {
          this.attorneyLoading = false;
          let list = JSON.parse(res.body as any).results || [];
          list = _.sortBy(list, (a) => (a.name || '').toLowerCase());
          this.originalAttorneyList = [...list];
          this.attorneyList = [...list];

          if (this.selectedAttorneyId) {
            let attorney = this.originalAttorneyList.find(
              (a) => a.id == this.selectedAttorneyId
            );
            if (attorney) {
              this.selectedAttorney = attorney;
            }
          }

        },
        (err) => {
          this.attorneyLoading = false;
        }
      );
  }

  /**
   *
   * @param event
   * Function to selected the office
   */
  consultOfficeChanged() {
    let data = this.attorneyForm.getRawValue();
    data.attorneys.map(obj => {
      obj.officeAssociation = this.getOfficeAssociation(obj);
    });

    this.attorneyForm.patchValue(data);
    this.validateOffice();
  }

  private validateOffice() {
    if (this.consultOffice) {
      this.officeError = null;
    } else {
      this.officeError = this.errorData.consult_law_office_required;
    }
  }

  /**
   *
   * @param row
   * Function to select the attorney
   */
  onSelect(row: any) {
    this.dataEntered = true;
    this.selectedAttorney = row;
    this.selectedAttorneyId = row.id;
  }

  isValuesNotValid(){
    return (!this.jurisdictionStateId || !this.practiceArea || !this.matterType || (this.jurisdictionCounty && this.jurisdictionCounty.trim() == '') || (this.jurisdictionCounty == null) ||  !this.consultOffice);
  }

  /**
   *
   * Function to update the consulation office and attorney for the client
   */
  public UpdateAttorney() {
    let row: Array<any> = []
    let data = { ...this.clientDetail };
    let item = data;

    if(this.isValuesNotValid()) {
      this.isError = true;
      return;
    }

    let currentAttorneyId = 0;
    let currentOriginatingAttorneyId = 0;

    this.attorneys.value.forEach(element => {
      if (element.IsConsultAttorney) {
        item.consultAttorney.id = element.id;
        item.consultAttorney.name = element.name;
        currentAttorneyId = element.id;
      }

      if (element.IsOriginatingAttorney) {
        item.originatingAttorney.id = element.id;
        item.originatingAttorney.name = element.name;
        currentOriginatingAttorneyId = item.originatingAttorney.id;
      }
    });


    let state = this.jurisdictionStateList.find(element => element.id === this.jurisdictionStateId)

    item.consultationLawOffice = {
      id: this.consultOffice
    };

    if (this.changeNotes && this.changeNotes != '') {
      item.changeStatusNotes = this.changeNotes;
    }

    this.nextLoading = true;

    this.clientService.v1ClientPost$Json({ body: item }).subscribe(
      (res) => {
        this.nextLoading = false;
        if (this.oldAttorneyId != currentAttorneyId) {
          this.toastr.showSuccess(this.errorData.attorney_reassign_success);
        } else if (this.oldOriginatingAttorneyId != currentOriginatingAttorneyId) {
          this.toastr.showSuccess(this.errorData.originating_attorney_reassign_success);
        } else {
          this.toastr.showSuccess(this.errorData.matter_details_save_success);
        }
        this.savePracticeArea();
        this.router.navigate(['/contact/view-potential-client'], {
          queryParams: { clientId: this.clientId, state: 'edit' },
        });
      },
      (err) => {
        this.nextLoading = false;
      }
    );

    if (this.oldAttorneyId) {
      if (currentAttorneyId && this.oldAttorneyId != currentAttorneyId) {
        this.contactService.v1ContactsSendAssignReassignEmailToAttorneyPost$Json({
          body: {
            appURL: this.appConfig.APP_URL,
            attorneyId: currentAttorneyId,
            oldAttorneyId: this.oldAttorneyId,
            potentialClientId: this.clientId
          }
        }).subscribe(res => { });
      }
    } else {
      if (this.selectedAttorney && currentAttorneyId) {
        this.contactService.v1ContactsSendAssignReassignEmailToAttorneyPost$Json({
          body: {
            appURL: this.appConfig.APP_URL,
            attorneyId: currentAttorneyId,
            oldAttorneyId: 0,
            potentialClientId: this.clientId
          }
        }).subscribe(res => { });
      }
    }
  }

  /**
   *
   * @param event
   * Check if the selected attorney is associated with office and licensed
   */
  checkAssociated(event: any) {
    this.dataEntered = false;
    this.formSubmitted = true;

    let invalid = this.isNotMatterDetailsValidate()
    if (!invalid) {
      this.UpdateAttorney();
    }
  }

  private getMatterDetails() {
    this.matterService
      .v1MatterMatterIdGet({
        matterId: this.matterId,
      })
      .pipe(
        map((res) => {
          return JSON.parse(res as any).results as vwMatterResponse;
        })
      )
      .subscribe((res) => {
        if (res) {
          this.matterDetails = res;
          if (this.matterDetails) {
            if (
              this.matterDetails.practiceArea &&
              this.matterDetails.practiceArea.length > 0
            ) {
              this.lastSelectedPracticeArea = this.matterDetails.practiceArea[0];
              this.practiceArea = this.lastSelectedPracticeArea.id;
              this.getMatterType(this.lastSelectedPracticeArea);
            } else {
              this.loading = false;
            }

            if (this.matterDetails.matterType) {
              this.matterType = this.matterDetails.matterType.id;
            }
            if(this.matterDetails.jurisdictionStateId) {
              this.jurisdictionStateId = +this.matterDetails.jurisdictionStateId;
            }

            if(this.matterDetails.jurisdictionCounty) {
              this.jurisdictionCounty = this.matterDetails.jurisdictionCounty;
            }
          } else {
            this.loading = false;
          }
        }
      }, () => {
        this.loading = false;
      });
  }

  public getPractices() {
    this.miscService.v1MiscPracticesGet$Response({}).subscribe(
      (suc) => {
        this.practiceList = JSON.parse(suc.body as any).results;
        this.loading = false;
      },
      (err) => {
        console.log(err);
        this.loading = false;
      }
    );
  }

  public getMatterType(e) {
    if (e) {
      this.matterTypes = []
      this.matterService
        .v1MatterTypesPracticeIdGet({ practiceId: e.id })
        .subscribe(
          (suc) => {
            this.loading = false;
            const res: any = suc;
            this.matterTypes = JSON.parse(res).results;
            if(this.matterTypes && this.matterTypes.length){
              this.matterTypes =  _.orderBy(this.matterTypes,'name','asc');
            }
            if(this.matterTypes.length == 1){
                this.matterType = this.matterTypes[0].id
            }
            this.practiceAreaSelected = true;
          },
          (err) => {
            this.loading = false;
            console.log(err);
          }
        );
    } else {
      this.practiceAreaSelected = false;
      this.loading = false;
      this.matterTypes = [];
    }
  }

  public clearMatterType() {
    this.matterType = null;
  }

  changePracticeArea(value, contanent) {
    this.lastSelectedPracticeArea = this.selectedPracticeArea ? this.selectedPracticeArea : this.lastSelectedPracticeArea;
    this.selectedPracticeArea = value ? value : '';

    if (this.selectedPracticeArea) {
      this.practiceAreaError = null;
      this.practiceAreaSelected = true;
    } else {
      this.practiceAreaError = this.errorData.practice_area_error;
      this.practiceAreaSelected = false;
    }

    let data = this.attorneyForm.value;
    let displayWrnPopup: boolean = false;
    let userPracticeArea = [], diffPRaciceArea = [];
    if (data && data.attorneys && data.attorneys.length > 0) {
      data.attorneys.map((obj, index) => {
        userPracticeArea = [];
        if (obj.practiceAreas) {
          userPracticeArea = obj.practiceAreas.split(',');
          userPracticeArea = userPracticeArea.map(Number);
          if (value && userPracticeArea.indexOf(value.id) === -1) {
            displayWrnPopup = true;
            diffPRaciceArea.push(index);
          }
        }
      });
    }
    if (displayWrnPopup) {
      this.changeJurisdictionMatterMsg = `At least one attorney does not work in the selected practice area. Do you want to remove these attorneys or not apply the selected practice area?`;
      this.openPopup = 'practicearea';
      this.modalService.open(contanent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        windowClass: ''
      }).result.then(result => {
        if (result === 'RemoveAttorneys') {// right button
          if (diffPRaciceArea) {
            diffPRaciceArea.reverse()
            diffPRaciceArea.map((obj) => {
              this.removeAttorney(obj);
            });
          }
          this.matterType = null;
          this.getMatterType(this.selectedPracticeArea);
        }
        if (result === 'DoNotApplyPracticeArea') {//left button
          this.cancelChangePracticeArea();
        }
      }, reason => {
      }
      );
    } else {
      this.matterType = null;
      this.getMatterType(this.selectedPracticeArea);
    }
  }

  open(content: any, className: any) {
    this.modalService
      .open(content, {
        size: className,
        centered: true,
        backdrop: 'static',
      })
      .result.then();
  }

  public cancelChangePracticeArea() {
    this.selectedPracticeArea = null;
    this.practiceArea = this.lastSelectedPracticeArea
      ? this.lastSelectedPracticeArea.id
      : null;
  }

  public confirmChangePracticeArea() {
    this.dataEntered = true;
    this.matterType = null;
    this.getMatterType(this.selectedPracticeArea);
    this.selectedAttorneyId = 0;
    this.selectedAttorney = null;
    this.attorneyLoading = true;
    this.searchAttorney();
  }

  private savePracticeArea() {
    const data: vwMatterBasics = {
      id: this.matterDetails.id,
      name: this.matterDetails.matterName,
      clientId: this.matterDetails.clientName
        ? this.matterDetails.clientName.id
        : null,
      matterTypeId: this.matterType,
      officeId: this.matterDetails.matterPrimaryOffice
        ? this.matterDetails.matterPrimaryOffice.id
        : null,
      openDate: this.matterDetails.matterOpenDate,
      closeDate: this.matterDetails.matterCloseDate,
      contingentCase: this.matterDetails.isContingentCase,
      isPlaintiff: this.matterDetails.isPlainTiff,
      jurisdictionStateId: this.jurisdictionStateId,
      jurisdictionCounty: this.jurisdictionCounty,
    };

    if (this.practiceArea && this.practiceArea != '') {
      let data: any = {
        matterId: this.clientDetail.matterId,
        practiceId: this.practiceArea,
      };

      this.matterService
        .v1MatterPracticesAssociateMatterIdPracticeIdPost$Response(data)
        .subscribe(() => {});
    }

    this.matterService
      .v1MatterBasicsPut$Json({
        body: data,
      })
      .pipe(
        map((res) => {
          return JSON.parse(res as any).results as any;
        }),
        finalize(() => {
        })
      )
      .subscribe(
        (res) => {},
        () => {}
      );
  }

  changeMatterType() {
    this.dataEntered = true;
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = true;
  }
  compareStringName(a: string, b: string): number {
    let x: string = '';
    a['name'].split(",")[0].split("").forEach(val => {
      if ((val >= 'A' && val <= 'Z') || (val >= 'a' && val <= 'z')) {
        x += val;
      }
    });

    let y: string = '';
    b['name'].split(",")[0].split("").forEach(val => {
      if ((val >= 'A' && val <= 'Z') || (val >= 'a' && val <= 'z')) {
        y += val;
      }
    });
    return x.toUpperCase().localeCompare(y.toUpperCase());
  }

  onSelectConsult($event) {
    if ($event.type === 'click') {
      this.onSelect($event.row)
    }
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
