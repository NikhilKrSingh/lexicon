import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalDismissReasons, NgbModal, NgbModalConfig, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import * as clone from 'clone';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { IOffice, vwAttorneyViewModel } from 'src/app/modules/models';
import { MatterListSearchOption } from 'src/app/modules/models/matter.model';
import { AddBlockedEmployeeNewMatterWizardComponent } from 'src/app/modules/shared/add-blocked-employee-new-matter-wizard/add-blocked-employee-new-matter-wizard.component';
import * as Constant from 'src/app/modules/shared/const';
import { REGEX_DATA } from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ContactsService, DocumentPortalService, MatterService, MiscService, OfficeService, WorkFlowService } from 'src/common/swagger-providers/services';
import { ToastDisplay } from '../../../../guards/toast-service';
import * as fromRoot from '../../../../store';
import * as fromPermissions from '../../../../store/reducers/permission.reducer';
import { vwClientAssociation } from '../../../models/vw-client-association.model';
import * as errorData from '../../../shared/error.json';
import { UtilsHelper } from '../../../shared/utils.helper';
import { ClientAttorneySearchComponent } from './attorney-search/attorney-search.component';

@Component({
  selector: 'app-client-matter-details',
  templateUrl: './matter-details.component.html',
  styleUrls: ['./matter-details.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ClientMatterDetailsComponent
  implements OnInit, OnChanges, OnDestroy {
  @ViewChild(DatatableComponent, { static: false })  corporatcnttable: DatatableComponent;
  @Input() formSubmitted: boolean;
  @Output() readonly sendDataAssociation = new EventEmitter<boolean>();
  @Output() readonly sendData = new EventEmitter<any>();
  @Output() readonly uniNumber = new EventEmitter();
  @Input() clientType;
  @Input() pageType: any;
  @Input() parentuniqueNumber: any;
  clientDetails: any;
  minMatterOpenDate = new Date();
  @Output() readonly changesMade = new EventEmitter();
  @Output() readonly practiceAreaChange = new EventEmitter<any>();
  @Output() readonly selectedOfficeDetails = new EventEmitter();

  searchOption: MatterListSearchOption;

  public currentDate: any = new Date();
  public matterForm: FormGroup;
  public isTuckerAllen = true;
  public rows: Array<any> = [];
  public matterDetails: any;
  public clientAssociates: Array<IOffice> = [];
  public associateExpertWitness: IOffice;
  public associateOpposingParty: IOffice;
  public associateOpposingCouncil: IOffice;
  public associateResponsibleAttorney: IOffice;
  public associateBillingAttorney: IOffice;
  public associateOriginatingAttorney: IOffice;
  public associateAttorny: IOffice;
  public officeList: Array<IOffice>;
  public stateList: Array<IOffice> = [];
  public practiceList: Array<IOffice> = [];
  public attorneyList: Array<any> = [];

  public matterAssociationList: Array<any> = [];

  public addOpposingParty = false;
  public addOpposingPartyMode = 'create';
  public selectedOpposingParty: any;

  public addExpertWitness = false;
  public addExpertWitnessMode = 'create';
  public selectedExpertWitness: any;

  public addOpposingCouncel = false;
  public addOpposingCouncelMode = 'create';
  public selectedOpposingCounsel: any;

  public matterId: string;
  public isShow1 = false;
  public isShow2 = false;
  public errorData: any = (errorData as any).default;
  public employeesRows: Array<vwAttorneyViewModel> = [];
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public conflictArr: Array<any> = [];
  public blockedPersonsArr: Array<any> = [];
  public runConflicts = false;
  public matterTypeList: any =[];
  public practiceAreaSelected = false;
  public isAttorneyLoading = false;
  private modalRef: NgbModalRef;
  public corporateContactList: Array<any> = [];
  public contactType: Array<any> = [];
  public corporateContactOriginalList: Array<any> = [];

  public isEdit = false;
  public corporateContactForm: FormGroup;
  public roleForm: FormGroup;
  public localEmailExist = false;
  public displayCpnflict = false;
  public primaryPhoneBlur = false;
  public cellPhoneBlur = false;
  public closeResult: String;
  public selectedPracticeArea: number;
  public selectedAttorneyId: number;
  public estatePlanningPracticeAreaId: number;
  public estatePlanningMatterTypeId: number;
  public userSubscribe: Subscription;
  public localMatterDetails: any = {};
  public newMatterId: number;
  public addToDb: boolean = false;

  public warning_msg: string;
  public att_error_msg: string;
  public att_select_msg: string;
  public res_att_warn_msg: string;
  public contactLoading: boolean;
  public raLoading = true;
  public baLoading: boolean;
  public matterAssocLoading: boolean;
  public blockedLoading: boolean;
  public loading: boolean;
  public detailsLoading: boolean;
  public corporateContactDetails: any;
  public createType = 'create';
  public vendorFormSubmitted = false;
  public selectOpposingCouncil: boolean = false;
  public matterLoading: boolean = false;
  public matterTypeLoad = false;
  selectedExistedContactList: any[];
  userInfo = UtilsHelper.getLoginUser();
  uniqueNumber: any;

  attorneys: FormArray;
  public attorneyForm: FormGroup;
  public searchSubscribe: Subscription;
  public displayDrpDwn: Array<{ display: boolean }> = [
    { display: false },
    { display: false },
    { display: false }
  ];
  public showLoaderDrpDwn: Array<{ display: boolean }> = [
    { display: false },
    { display: false },
    { display: false }
  ];
  public changeJurisdictionMatterMsg: string = '';
  public openPopup: string = 'state';
  public blankError: Boolean = false;
  public duplicate: Boolean = false;
  public corporateError: Boolean = false;
  public isSelectedEachError: Boolean = false;
  public errorHeader: string = 'Attorney';
  public errorMessage: string = this.errorData.attorney_message;
  public displayMessageForcrpc: boolean = false;
  public attorneyLoading: boolean = false;
  public ColumnMode = ColumnMode;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  currentActive: number;

  practiceAreaId = 0;

  UploadDocumentSub: Subscription;
  uploadedDocuments: any[] = [];
  public missingTypeAttorney: boolean = false;
  public sortingAttorney = {
    name: true,
    primaryOffice: true,
    officeAssociation: true
  };

  datesChageSub: Subscription;

  constructor(
    private matterService: MatterService,
    private builder: FormBuilder,
    private miscService: MiscService,
    private dialogService: DialogService,
    private toastDisplay: ToastDisplay,
    private store: Store<fromRoot.AppState>,
    private officeService: OfficeService,
    private modalService: NgbModal,
    public config: NgbModalConfig,
    private workflowService: WorkFlowService,
    private contactsService: ContactsService,
    private exporttocsvService: ExporttocsvService,
    private formBuilder: FormBuilder,
    private documentPortalService: DocumentPortalService,
    private el: ElementRef,
    private sharedService: SharedService
  ) {
    config.backdrop = 'static';
    config.keyboard = false;
    this.searchOption = new MatterListSearchOption();
    this.permissionList$ = this.store.select('permissions');
  }

  async ngOnInit() {
    this.initiMatterForm();
    this.initCorporateContactForm();
    this.initRoleForm();
    this.initAttorneyForm();

    this.getTempMatterId();
    this.matterAssociationList = [];

    this.matterForm.valueChanges.subscribe(val => {
      this.sendData.emit({ basicForm: this.matterForm });
    });

    this.warning_msg = this.errorData.change_practice_area_warning;
    this.att_error_msg = this.errorData.no_attorney;
    this.att_select_msg = this.errorData.select_attorney;
    this.res_att_warn_msg = this.errorData.change_res_att_warning;
    this.detailsLoading = true;
    await this.getOffices();
    await this.getAssociateType();
    await this.getState();

    /*** subscribe to permission list */
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });

    if (this.clientType === 'corporate') {
      this.getContactType();
    }

    this.attorneyForm.valueChanges.subscribe(res => {
      this.isNotMatterDetailsValidate();
    });

    this.matterForm.get('matterName').valueChanges.subscribe(res => {
      this.changesMade.emit();
    });

    this.UploadDocumentSub = this.sharedService.UploadedDocuments$.subscribe(
      docs => {
        this.uploadedDocuments = docs || [];
      }
    );

    this.datesChageSub = this.sharedService.datesChange$.subscribe(
      res => {
        this.clientDetails = res;
        this.setClientDetails();
      }
    );
  }

  //#region [Initialize Forms]

  initiMatterForm() {
    this.matterForm = this.builder.group({
      matterNumber: new FormControl('', []),
      matterName: new FormControl('', [Validators.required]),
      primaryLawOffice: new FormControl(null, [Validators.required]),
      juridictionState: new FormControl(null, [Validators.required]),
      caseNumbers: new FormControl(''),
      juridictionCounty: new FormControl('', [Validators.required]),
      practiceId: new FormControl(null, [Validators.required]),
      matterTypeId: new FormControl(null, [Validators.required]),
      matterOpenDate: new FormControl(this.currentDate, [Validators.required]),
      contingentCase: new FormControl(false, []),
      isFixedFee: new FormControl(null, []),
      trustName: new FormControl(''),
      trustExecutionDate: new FormControl(null)
    });
  }

  initCorporateContactForm() {
    this.corporateContactForm = this.builder.group({
      uniqueNumber: new FormControl(''),
      firstName: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [Validators.required]),
      email: new FormControl('', [
        Validators.email,
        Validators.pattern(REGEX_DATA.Email)
      ]),
      jobTitle: new FormControl(''),
      primaryPhone: new FormControl(''),
      cellPhone: new FormControl(''),
      isPrimary: new FormControl(false),
      isBilling: new FormControl(false),
      isGeneralCounsel: new FormControl(false),
      isVisible: new FormControl(true, [Validators.required]),
      personId: new FormControl(''),
      id: new FormControl(0),
      indexNumber: new FormControl(null)
    });
  }

  initRoleForm() {
    this.roleForm = this.builder.group({
      isPrimary: [null],
      isBilling: [null],
      isGeneralCounsel: [null]
    });
  }

  initAttorneyForm() {
    this.attorneyForm = new FormGroup({
      attorneys: new FormArray([], Validators.required)
    });
  }

  //#endregion [Initialize Forms]

  ngOnChanges(changes) {
    this.uniqueNumber = this.parentuniqueNumber;
    if (changes.hasOwnProperty('clientType')) {
      let type = changes.clientType.currentValue;
      if (type) {
        this.clientType = type;
      }
    }
  }

  private setClientDetails() {
    if (this.clientDetails && this.clientDetails.initialConsultDate) {
      if (this.clientDetails.initialContactDate) {
        let d1 = moment(this.clientDetails.initialConsultDate);
        let d2 = moment(this.clientDetails.initialContactDate);

        if (d1.isSameOrAfter(d2, 'd')) {
          this.minMatterOpenDate = d1.toDate();
        } else {
          this.minMatterOpenDate = d2.toDate();
        }
      } else {
        this.minMatterOpenDate = moment(this.clientDetails.initialConsultDate).toDate();
      }
    } else if (this.clientDetails && this.clientDetails.initialContactDate) {
      this.minMatterOpenDate = moment(this.clientDetails.initialContactDate).toDate();
    } else {
      this.minMatterOpenDate = new Date();
    }

    this.minMatterOpenDate = moment(moment(this.minMatterOpenDate).format('YYYY-MM-DD')).toDate();

    if (this.matterForm) {
      let matterOpenDate = moment(this.matterForm.value.matterOpenDate);
      let mindate = moment(this.minMatterOpenDate);

      if (mindate.isSameOrAfter(matterOpenDate, 'd')) {
        this.matterForm.patchValue({
          matterOpenDate: mindate.toDate()
        });
      }
    }
  }

  get f() {
    return this.matterForm.controls;
  }

  get v() {
    return this.corporateContactForm.controls;
  }

  attorney(): FormGroup {
    return this.formBuilder.group({
      name: ['', Validators.required],
      IsOriginatingAttorney: false,
      IsResponsibleAttorney: false,
      IsBillingAttorney: false,
      IsAttorney: false,
      primaryOffice: '',
      officeAssociation: '',
      id: [null, Validators.required],
      display: false,
      personStates: '',
      practiceAreas: '',
      primaryOfficeId: 0,
      doNotSchedule: false,
      secondaryOffices: ''
    });
  }

  createAttorney(action: string = 'create'): void {
    this.attorneys = this.attorneyForm.get('attorneys') as FormArray;
    this.attorneys.push(this.attorney());
    if (action === 'create') {
      this.setAttornyRole();
    }

    setTimeout(() => {
      const searchAttorney = this.el.nativeElement.querySelector(
        `#searchAttorney-${this.attorneys.length - 1}`
      );
      if (searchAttorney) {
        searchAttorney.focus();
      }
    }, 1000);
  }

  public setAttornyRole() {
    let data = this.attorneyForm.value;
    let i = data && data.attorneys ? data.attorneys.length - 1 : 0;
    let isResponsible: boolean = false;
    let isBillling: boolean = false;
    let isOriginating: boolean = false;

    if (data && data.attorneys && data.attorneys.length > 0) {
      isOriginating = data.attorneys.some(item => item.IsOriginatingAttorney);
      isResponsible = data.attorneys.some(item => item.IsResponsibleAttorney);
      isBillling = data.attorneys.some(item => item.IsBillingAttorney);
    }

    data.attorneys.map((obj, index) => {
      if (i === index) {
        if (!isOriginating) {
          obj.IsOriginatingAttorney = true;
        }
        if (!isResponsible) {
          obj.IsResponsibleAttorney = true;
        }
        if (!isBillling) {
          obj.IsBillingAttorney = true;
        }
      }
    });

    this.attorneyForm.patchValue(data);
  }

  removeAttorney(i) {
    this.attorneys.removeAt(i);
    this.markChange();

    setTimeout(() => {
      const searchAttorney = this.el.nativeElement.querySelector(
        `#searchAttorney-${this.attorneys.length - 1}`
      );
      if (searchAttorney) {
        searchAttorney.focus();
      }
    }, 1000);
  }

  onSelect(event): void {
    this.selectedExistedContactList = [];
    if (event.isBilling || event.isPrimary) {
      this.checkCrpContact(event);
    }
    event.uniqueNumber = event.uniqueNumber ? Number(event.uniqueNumber) : 0;
    event.isVisible = event.status === 'Active' ? true : false;
    this.selectedExistedContactList.push(event);
  }

  public getTempMatterId() {
    this.matterService
      .v1MatterLatestmatternumberGet({ tenantId: +this.userInfo.tenantId })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        suc => {
          this.matterForm.patchValue({
            matterNumber: suc.matterNumber
          });
        },
        err => {
          console.log(err);
        }
      );
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }

    if (this.userSubscribe) {
      this.userSubscribe.unsubscribe();
    }

    if (this.searchSubscribe) {
      this.searchSubscribe.unsubscribe();
    }

    if (this.UploadDocumentSub) {
      this.UploadDocumentSub.unsubscribe();
    }

    if (this.datesChageSub) {
      this.datesChageSub.unsubscribe();
    }
  }

  public officeChange() {
    this.selectedOfficeDetails.emit(event);
    if (this.matterForm.value.primaryLawOffice === null) {
      this.raLoading = false;
      this.baLoading = false;
    } else {
      this.raLoading = true;
      this.baLoading = true;
    }

    this.sharedService.MatterLawOfficeChange$.next(
      this.matterForm.value.primaryLawOffice || 0
    );

    this.matterForm.patchValue({
      practiceId: null,
      matterTypeId: null
    });

    this.getPractices();
    this.checkOfficeAssociatio();
  }

  public getState() {
    this.miscService.v1MiscStatesGet$Response({}).subscribe(
      suc => {
        let res: any = suc;
        this.stateList = JSON.parse(res.body).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  private getAssociateType() {
    this.miscService.v1MiscGroupsGet$Response({}).subscribe(
      res => {
        this.clientAssociates = JSON.parse(res.body as any).results;
        if (this.clientAssociates && this.clientAssociates.length > 0) {
          this.associateOpposingParty = this.clientAssociates.filter(obj => {
            return obj.name === 'Opposing Party';
          })[0];
          this.associateOpposingCouncil = this.clientAssociates.filter(obj => {
            return obj.name === 'Opposing Counsel';
          })[0];
          this.associateExpertWitness = this.clientAssociates.filter(obj => {
            return obj.name === 'Expert Witness';
          })[0];
          this.associateResponsibleAttorney = this.clientAssociates.filter(
            obj => {
              return obj.name === 'Responsible Attorney';
            }
          )[0];
          this.associateBillingAttorney = this.clientAssociates.filter(obj => {
            return obj.name === 'Billing Attorney';
          })[0];
          this.associateAttorny = this.clientAssociates.filter(obj => {
            return obj.name === 'Attorney';
          })[0];
          this.associateOriginatingAttorney = this.clientAssociates.filter(
            obj => {
              return obj.name === 'Originating Attorney';
            }
          )[0];
        }
      },
      err => {
        console.log(err);
      }
    );
  }

  /**
   * Get office list
   *
   * @memberof BasicInfoComponent
   */
  public getOffices() {
    this.miscService.v1MiscOfficesGet$Response({}).subscribe(
      suc => {
        let res: any = suc;
        this.officeList = JSON.parse(res.body).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  public clearDate() {
    this.searchOption.openDate = null;
  }

  public getPractices() {
    if (this.matterForm.value.primaryLawOffice) {
      this.officeService
        .v1OfficePracticeAreasAllGet$Response({
          officeId: this.matterForm.value.primaryLawOffice
        })
        .subscribe(
          suc => {
            this.practiceList = JSON.parse(
              suc.body as any
            ).results.officePractices;
            let row = this.practiceList.filter(
              obj => obj.name.toLowerCase() == 'estate planning'
            );
            this.estatePlanningPracticeAreaId =
              row.length > 0 ? row[0].id : null;
            this.detailsLoading = false;
          },
          err => {
            console.log(err);
            this.detailsLoading = false;
          }
        );
    } else {
      this.matterForm.patchValue({
        practiceId: null,
        matterTypeId: null
      });
    }
  }

  setFilterParams(text: any) {
    const param = {
      search: text,
      officeId: +this.matterForm.value.primaryLawOffice
    };

    if (this.matterForm.value.practiceId) {
      param['practiceId'] = +this.matterForm.value.practiceId;
    }

    if (this.matterForm.value.juridictionState) {
      param['stateId'] = +this.matterForm.value.juridictionState;
    }
    return param;
  }

  setFilterAttorneySearchParams(text: any) {
    const param = {
      search: text,
      officeId: +this.matterForm.value.primaryLawOffice
    };

    if (this.matterForm.value.practiceId) {
      param['practiceId'] = +this.matterForm.value.practiceId;
    }

    return param;
  }

  public addOpposingPartyClick() {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.addOpposingPartyMode = 'create';
    this.selectedOpposingParty = null;
    this.addOpposingParty = true;
    UtilsHelper.aftertableInit();
  }

  public addOpposingCounselClick() {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.addOpposingCouncelMode = 'create';
    this.selectedOpposingCounsel = null;
    this.addOpposingCouncel = true;
    UtilsHelper.aftertableInit();
  }

  public addExpertWitnessClick() {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.addExpertWitnessMode = 'create';
    this.selectedExpertWitness = null;
    this.addExpertWitness = true;
    UtilsHelper.aftertableInit();
  }

  public closeOpposingParty(event) {
    if (
      event.type === 'close' &&
      event &&
      event.type &&
      event.type !== 'edit'
    ) {
      this.uniqueNumber = this.uniqueNumber - 1;
    }
    this.addOpposingParty = false;
    if (
      event === 'add' ||
      (event && event.type && event.type === 'add') ||
      (event && event.type && event.type === 'edit')
    ) {
      this.manageMatterAssociate(
        event,
        this.matterAssociationList,
        this.associateOpposingParty
      );
    }
    UtilsHelper.aftertableInit();
  }

  /***
   * capture popup close event for Opposing councel
   */
  public closeOpposingCouncel(event) {
    if (
      event.type === 'close' &&
      event &&
      event.type &&
      event.type !== 'edit'
    ) {
      this.uniqueNumber = this.uniqueNumber - 1;
    }
    this.addOpposingCouncel = false;
    if (
      event === 'add' ||
      (event && event.type && event.type === 'add') ||
      (event && event.type && event.type === 'edit')
    ) {
      this.manageMatterAssociate(
        event,
        this.matterAssociationList,
        this.associateOpposingCouncil
      );
    }
    UtilsHelper.aftertableInit();
  }

  /***
   * capture popup close event for Expert Witness
   */
  public closeExpertWitness(event) {
    if (
      event.type === 'close' &&
      event &&
      event.type &&
      event.type !== 'edit'
    ) {
      this.uniqueNumber = this.uniqueNumber - 1;
    }
    this.addExpertWitness = false;
    if (
      event === 'add' ||
      (event && event.type && event.type === 'add') ||
      (event && event.type && event.type === 'edit')
    ) {
      this.manageMatterAssociate(
        event,
        this.matterAssociationList,
        this.associateExpertWitness
      );
    }
    UtilsHelper.aftertableInit();
  }

  private manageMatterAssociate(event, listArr, associate) {
    if (event.type === 'add') {
      if (event.data.id && listArr && listArr.length > 0) {
        let exist = listArr.some(obj => obj.id === event.data.id);
        if (exist) {
          this.toastDisplay.showError('Record already selcted.');
          return;
        }
      }

      let item = this.getData(event, associate);
      listArr.push({ ...item });

      this.checkOpposingCounciel();

      if (event.data.uniqueNumber != this.uniqueNumber) {
        this.uniqueNumber = this.uniqueNumber - 1;
      }
    } else if (event.type === 'edit') {
      let index = listArr.findIndex(
        (item, idx) => idx === event.data.indexNumber
      );

      if (index > -1) {
        let item = this.getData(event, associate);
        listArr[index] = { ...item };
      }
    }

    this.matterAssociationList = UtilsHelper.clone(listArr);

    this.uniNumber.emit(this.uniqueNumber);
  }

  private getData(event, associate) {
    this.changesMade.emit();
    this.sendDataAssociation.emit(true);
    return {
      isNew: event.data.id
        ? this.pageType == 'matter'
          ? !!this.newMatterId
          : true
        : true,
      id: event.data.id,
      uniqueNumber: +event.data.uniqueNumber,
      associationId: associate.id,
      associationType: associate.name,
      firstName: event.data.firstName,
      email: event.data.email,
      lastName: event.data.lastName,
      companyName: event.data.companyName,
      primaryPhone: event.data.primaryPhone,
      isOpposingPartyRepresentThemselves: event.data
        .isOpposingPartyRepresentThemselves
        ? true
        : false,
      isCompany: event.data.isCompany,
      isVisible: event.data.isVisible ? event.data.isVisible : true,
      isArchived: event.data.isArchived ? event.data.isArchived : false
    };
  }

  /***
   * common function to delete matter associations
   */
  async deleteMatterAssociations(row, index: number) {
    let messages = '';
    if (row.associationType === 'Opposing Party') {
      messages = this.errorData.opposingparty_delete_confirm;
    } else if (row.associationType === 'Opposing Counsel') {
      messages = this.errorData.opposingcounsel_delete_confirm;
    } else {
      messages = this.errorData.expert_witnesses_delete_confirm;
    }
    let resp: any = await this.dialogService.confirm(messages, 'Delete');
    if (resp) {
      this.deleteFromArr(row.associationType, index);
    }
    UtilsHelper.aftertableInit();
  }

  private deleteFromArr(type: string, index: number) {
    this.matterAssociationList.splice(index, 1);
    this.matterAssociationList = [...this.matterAssociationList];
    this.sendDataAssociation.emit(true);
    switch (type) {
      case 'Opposing Party':
        this.toastDisplay.showSuccess(this.errorData.opposingparty_delete);
        break;
      case 'Opposing Counsel':
        this.toastDisplay.showSuccess(this.errorData.opposingcounsel_delete);
        this.checkOpposingCounciel();
        break;
      case 'Expert Witness':
        this.toastDisplay.showSuccess(this.errorData.expert_witnesses_delete);
        break;
    }
    UtilsHelper.aftertableInit();
  }

  private addedItems(
    originalArray: vwClientAssociation[],
    items: vwClientAssociation[]
  ) {
    let arr: vwClientAssociation[] = [];

    items.forEach(a => {
      let index = originalArray.findIndex(i => i.id == a.id);
      if (index == -1) {
        arr.push(a);
      }
    });

    return arr;
  }

  prevPracticeArea = 0;
  removeDocuments = false;

  setPrevPracticeArea() {
    this.prevPracticeArea = this.matterForm.value.practiceId;
  }

  changePracticeArea(value, attorneyTemplate, docTemplate) {
    this.removeDocuments = false;

    if (this.uploadedDocuments && this.uploadedDocuments.length > 0) {
      const activeModal = this.modalService.open(docTemplate, {
        centered: true,
        backdrop: 'static',
        keyboard: false
      });

      activeModal.result.then(res => {
        if (res) {
          this.removeDocuments = true;
          this.showAttorneyWarning(value, attorneyTemplate);
        } else {
          this.matterForm.patchValue({
            practiceId: this.prevPracticeArea
          });
        }
      });
    } else {
      this.showAttorneyWarning(value, attorneyTemplate);
    }
  }

  private showAttorneyWarning(value, content) {
    let data = this.attorneyForm.value;

    if (data && data.attorneys && data.attorneys.length > 0) {
      let displayWrnPopup: boolean = false;
      let userPracticeArea = [];
      let diffPRaciceArea = [];

      data.attorneys.map((obj, index) => {
        userPracticeArea = [];
        if (obj.practiceAreas) {
          userPracticeArea = obj.practiceAreas.split(',');
          userPracticeArea = userPracticeArea.map(Number);
          if (userPracticeArea.indexOf(value.id) === -1) {
            displayWrnPopup = true;
            diffPRaciceArea.push(index);
          }
        }
      });

      if (displayWrnPopup) {
        this.changeJurisdictionMatterMsg = this.errorData.change_practice_area_remove_attorney_warning;
        this.openPopup = 'practicearea';

        this.modalService
          .open(content, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: ''
          })
          .result.then(
            result => {
              if (result === 'RemoveAttorneys') {
                if (diffPRaciceArea) {
                  diffPRaciceArea.reverse();
                  diffPRaciceArea.map(obj => {
                    this.removeAttorney(obj);
                  });
                }

                this.selectedPracticeArea = value ? value : '';
                this.getMatterType(this.selectedPracticeArea);

                this.matterForm.patchValue({
                  matterTypeId: null
                });

                if (this.removeDocuments) {
                  this.sharedService.RemoveUploadedDocuments$.emit();
                }
              }

              if (result === 'DoNotApplyPracticeArea') {
                this.matterForm.patchValue({
                  practiceId: this.prevPracticeArea
                });
              }
            },
            reason => {}
          );
      }
    } else {
      this.matterForm.patchValue({
        matterTypeId: null
      });
      this.selectedPracticeArea = value;
      this.getMatterType(this.selectedPracticeArea);

      if (this.removeDocuments) {
        this.sharedService.RemoveUploadedDocuments$.emit();
      }
    }
  }

  open(content: any, className: any) {
    this.modalService
      .open(content, {
        size: className,
        centered: true,
        backdrop: 'static'
      })
      .result.then(
        result => {
          this.closeResult = `Closed with: ${result}`;
        },
        reason => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }

  public cancelChangePracticeArea(content) {
    this.selectedPracticeArea = null;
    this.matterForm.patchValue({
      practiceId:
        this.matterDetails.practiceArea.length > 0
          ? this.matterDetails.practiceArea[0].id
          : null
    });
  }

  public getMatterType(e) {
    if (e) {
      this.matterTypeList = [];
      this.matterTypeLoad = true;
      this.matterService
        .v1MatterTypesPracticeIdGet({ practiceId: e.id })
        .subscribe(
          suc => {
            const res: any = suc;
            this.matterTypeList = JSON.parse(res).results;
            if (this.matterTypeList && this.matterTypeList.length) {
              this.matterTypeList = _.orderBy(
                this.matterTypeList,
                'name',
                'asc'
              );
            }
            if(this.matterTypeList.length == 1){
              this.matterForm.patchValue({
                matterTypeId: this.matterTypeList[0].id
              })
            }
            let row = this.matterTypeList.filter(
              obj => obj.name.toLowerCase() == 'estate planning'
            );
            this.estatePlanningMatterTypeId = row.length ? row[0].id : null;
            this.practiceAreaSelected = true;
            this.detailsLoading = false;
            this.matterTypeLoad = false;
          },
          err => {
            this.detailsLoading = false;
            this.matterTypeLoad = false;
            console.log(err);
          }
        );
    } else {
      this.practiceAreaSelected = false;
      this.matterTypeList = [];
      this.detailsLoading = false;
    }
  }

  /**** function to open add blocked employee modal */
  addBlockedEmployeeClick() {
    let modalRef = this.modalService.open(
      AddBlockedEmployeeNewMatterWizardComponent,
      {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        size: 'xl'
      }
    );

    const alreadyAttorney = this.attorneyForm.value.attorneys.map(
      (obj: any) => obj.id
    );
    const alredyBlocked = this.employeesRows.map((a: any) => a.id);
    const allAlready = [...alreadyAttorney, ...alredyBlocked];

    modalRef.componentInstance.matterId = 0;
    modalRef.componentInstance.clientId = 0;
    modalRef.componentInstance.alreadyBlockedEmployees = allAlready;

    modalRef.result.then(res => {
      if (res && res.length) {
        this.employeesRows = [...this.employeesRows, ...res];
        if (this.employeesRows.length) {
          this.employeesRows.forEach((ele: any) => {
            ele.fullName = ele.lastName
              ? ele.lastName + ', ' + ele.firstName
              : ele.firstName;
          });
        }
      }
    });
  }

  /****function to delete blocked employee */
  async deleteBlockedEmployee(row: any): Promise<any> {
    try {
      let resp: any = await this.dialogService.confirm(
        errorData.delete_blocked_employee_confirm,
        'Delete'
      );
      if (resp) {
        let index = this.employeesRows.findIndex(item => item.id === row.id);
        this.employeesRows.splice(index, 1);
        this.employeesRows = [...this.employeesRows];
      }
    } catch (err) {}
  }

  openAddCorporateContactDialog(
    content: any,
    className,
    winClass,
    reset?: boolean
  ) {
    if (reset) {
      this.isEdit = false;
      this.vendorFormSubmitted = false;
      this.corporateContactForm.reset();
      this.uniqueNumber = this.uniqueNumber + 1;
      this.corporateContactForm.controls['uniqueNumber'].setValue(
        this.uniqueNumber
      );
      this.corporateContactForm.controls['isVisible'].setValue(true);
    }
    this.modalRef = this.modalService.open(content, {
      size: className,
      windowClass: winClass,
      centered: true,
      backdrop: 'static'
    });
    this.modalRef.result.then(
      result => {},
      reason => {
        this.uniqueNumber = this.uniqueNumber - 1;
      }
    );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  public getCorporateContact() {
    this.contactLoading = true;
    let list = [];
    if (list && list.length > 0) {
      list = list.filter(obj => {
        return (
          obj.associationType !== 'Vendor' &&
          obj.associationType !== 'Subsidiary'
        );
      });
    }
    this.corporateContactOriginalList = list;
    list.map((obj, index) => {
      obj.primaryPhoneNumber = obj.primaryPhone;
      obj.cellPhoneNumber = obj.cellPhone;
      obj.isGeneralCounsel = obj.generalCounsel;
      obj.id = obj.personId;
      obj.dispPrimaryPhone = obj.primaryPhone
        ? '(' +
          obj.primaryPhone.substr(0, 3) +
          ') ' +
          obj.primaryPhone.substr(3, 3) +
          '-' +
          obj.primaryPhone.substr(6, 4)
        : '-';
      if (index === 0) {
        this.corporateContactList.push(obj);
      } else {
        const contact = this.corporateContactList.filter(
          (item: { personId: any }) => +item.personId === +obj.personId
        );
        if (contact.length > 0) {
          if (obj.isPrimary) {
            contact[0].isPrimary = true;
          }
          if (obj.isBilling) {
            contact[0].isBilling = true;
          }
          if (obj.isGeneralCounsel) {
            contact[0].isGeneralCounsel = true;
          }
        } else {
          this.corporateContactList.push(obj);
        }
      }
    });
    this.corporateContactList = [...this.corporateContactList];
    UtilsHelper.aftertableInit();
    this.contactLoading = false;
  }

  isCorporateFormValid(): boolean {
    if (this.createType == 'existing') {
      let data = this.roleForm.getRawValue();
      return !!(
        data &&
        (data.isBilling || data.isGeneralCounsel || data.isPrimary)
      );
    }
    if (this.createType == 'create') {
      let data = this.corporateContactForm.value;
      return !!(
        data &&
        this.corporateContactForm.valid &&
        (data.isBilling || data.isGeneralCounsel || data.isPrimary)
      );
    }
  }

  public saveCorporateContact() {
    this.vendorFormSubmitted = true;
    if (this.isCorporateFormValid()) {
      let data;
      if (this.createType === 'create') {
        data = { ...this.corporateContactForm.value };
        data['externalPortalAccount'] = false;
        if (data.isPrimary) {
          if (this.isContactExist('Primary', null, null)) {
            return;
          }
        }
        if (data.isBilling) {
          if (this.isContactExist('Billing', null, null)) {
            return;
          }
        }
        data.generalCounsel = data.isGeneralCounsel;
      } else {
        let selectedId =
          this.selectedExistedContactList &&
          this.selectedExistedContactList.length > 0
            ? this.selectedExistedContactList[0].id
            : 0;
        let exist = this.corporateContactList.find(
          item => item.personId === selectedId
        );
        if (exist) {
          this.toastDisplay.showSuccess('This user already exist.');
          return;
        }
        data = this.selectedExistedContactList[0];
        data.primaryPhone = data.primaryPhoneNumber;
        data.dispPrimaryPhone = data.primaryPhoneNumber
          ? '(' +
            data.primaryPhoneNumber.substr(0, 3) +
            ') ' +
            data.primaryPhoneNumber.substr(3, 3) +
            '-' +
            data.primaryPhoneNumber.substr(6, 4)
          : '-';
        data.cellPhone = data.cellPhoneNumber;
        data.generalCounsel = this.roleForm.controls['isGeneralCounsel'].value;
        data.isPrimary = this.roleForm.controls['isPrimary'].value;
        data.isBilling = this.roleForm.controls['isBilling'].value;
      }
      const item = data;
      item.person = data.firstName + ',' + data.lastName;

      const corporate = 'Corporate Contact,';
      const primaryRole = data.isPrimary ? 'Primary Contact,' : ',';
      const BillingRole = data.isBilling ? 'Billing Contact,' : ',';
      const GeneralRole = data.isGeneralCounsel ? 'General Counsel,' : ',';
      let role = corporate + primaryRole + BillingRole + GeneralRole;
      role = role
        .split(',')
        .filter(el => {
          return el !== '';
        })
        .join();
      item.isNew = true;
      item.primaryPhoneNumber = item.primaryPhone;
      if (item.primaryPhone) {
        item.primaryPhone = item.primaryPhone
          ? '(' +
            item.primaryPhone.substr(0, 3) +
            ') ' +
            item.primaryPhone.substr(3, 3) +
            '-' +
            item.primaryPhone.substr(6, 4)
          : '-';
        item.dispPrimaryPhone = item.primaryPhone;
      }
      item.cellPhoneNumber = item.cellPhone;
      item.id = 0;
      item.userName =
        item.email === '' || !item.email
          ? item.firstName + item.lastName + Math.floor(Math.random() * 10000)
          : item.email;
      item.status = item.isVisible === true ? 'Active' : 'Inactive';
      item.role = role;
      if (item.generalCounsel) {
        item.isGeneralCounsel = item.generalCounsel;
      }
      item.id = item.id ? item.id : 0;
      this.corporateContactList.push(item);
      this.vendorFormSubmitted = false;
      this.createType = 'create';
      this.corporateContactForm.reset();
      this.roleForm.reset();
      this.modalRef.close();
      this.sendDataAssociation.emit(true);
      this.checkCrpCntExtDmsAcnt();
      this.changesMade.emit();

      if (data.isPrimary) {
        this.sharedService.ClientEmailChange$.emit(item.email);
      }
    }
    UtilsHelper.aftertableInit();
  }

  public checkCrpCntExtDmsAcnt() {
    this.contactLoading = true;
    if (this.corporateContactList && this.corporateContactList.length > 0) {
      this.corporateContactList = [...this.corporateContactList];
      let exist = this.corporateContactList.some(
        item => item.externalPortalAccount === false
      );
      this.displayMessageForcrpc = exist ? true : false;
      this.contactLoading = false;
    } else {
      this.corporateContactList = [...this.corporateContactList];
      this.displayMessageForcrpc = false;
      this.contactLoading = false;
    }
    UtilsHelper.aftertableInit();
  }

  public checkCrpContact(item) {
    if (item && (item.id > 0 || item.personId > 0)) {
      this.documentPortalService
        .v1DocumentPortalIsDocumentPortalExistPersonIdGet({
          personId: item.id || item.personId
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(
          suc => {
            if (!this.displayMessageForcrpc) {
              this.displayMessageForcrpc = suc ? false : true;
              item['externalPortalAccount'] = suc;
            }
          },
          err => {
            console.log(err);
          }
        );
    } else {
      this.displayMessageForcrpc = true;
    }
    UtilsHelper.aftertableInit();
  }

  private isContactExist(type, fname?: string, lname?: string) {
    let exist = false;
    if (type === 'Primary') {
      if (fname && lname) {
        if (this.corporateContactDetails && this.corporateContactDetails.id) {
          exist = this.corporateContactList.some(
            e =>
              e.isPrimary &&
              fname !== e.firstName &&
              lname !== e.lastName &&
              this.corporateContactDetails.id !== e.id
          );
        } else {
          exist = this.corporateContactList.some(
            e =>
              e.isPrimary &&
              fname !== e.firstName &&
              lname !== e.lastName &&
              this.corporateContactDetails.indexNumber !== e.indexNumber
          );
        }
      } else {
        exist = this.corporateContactList.some(e => e.isPrimary);
      }
    }
    if (type === 'Billing') {
      if (fname && lname) {
        if (this.corporateContactDetails && this.corporateContactDetails.id) {
          exist = this.corporateContactList.some(
            e =>
              e.isBilling &&
              fname !== e.firstName &&
              lname !== e.lastName &&
              this.corporateContactDetails.id !== e.id
          );
        } else {
          exist = this.corporateContactList.some(
            e =>
              e.isBilling &&
              fname !== e.firstName &&
              lname !== e.lastName &&
              this.corporateContactDetails.indexNumber !== e.indexNumber
          );
        }
      } else {
        exist = this.corporateContactList.some(e => e.isBilling);
      }
    }
    if (exist) {
      this.toastDisplay.showError(
        type + ' Contact is already exists for this client.'
      );
    }
    if (type === 'Primary' || 'Billing') {
      const data = { ...this.corporateContactForm.value };
      if (!data.email) {
        exist = true;
        this.toastDisplay.showError('Please enter Email address.');
      }
      if (!data.primaryPhone) {
        exist = true;
        this.toastDisplay.showError('Please enter Phone number.');
      }
    }
    return exist;
  }

  public isExist(type: string) {
    let exist = false;
    if (type === 'Primary') {
      exist = this.corporateContactList.some(e => e.isPrimary);
    }
    if (type === 'Billing') {
      exist = this.corporateContactList.some(e => e.isBilling);
    }
    return exist;
  }

  getAssociationTypeId(name, types) {
    const id = this.contactType.filter(obj => obj.name === name);
    types.push(id[0]);
    return types;
  }

  public getContactType() {
    this.miscService.v1MiscCorporatecontactassociationsGet({}).subscribe(
      suc => {
        const res: any = suc;
        const list = JSON.parse(res).results;
        for (let i = 0; i < list.length; i++) {
          const element = list[i];
          const item = {
            id: element.id,
            name: element.name,
            checked: false
          };
          this.contactType.push(item);
        }
      },
      err => {
        console.log(err);
      }
    );
  }

  public async deleteClientAssociation($event, item, index) {
    $event.target.closest('datatable-body-cell').blur();
    const resp: any = await this.dialogService.confirm(
      'Are you sure to delete this corporate contact?',
      'Delete'
    );
    if (resp) {
      this.corporateContactList.splice(index, 1);
      this.sendDataAssociation.emit(true);
      this.checkCrpCntExtDmsAcnt();
      if (item.isPrimary) {
        this.sharedService.ClientEmailChange$.next(null);
      }
    }
  }

  public editCorporateContact($event, content, item, index) {
    $event.target.closest('datatable-body-cell').blur();
    this.corporateContactForm.patchValue({
      uniqueNumber: +item.uniqueNumber,
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      companyName: item.companyName,
      jobTitle: item.jobTitle,
      primaryPhone: item.primaryPhone,
      cellPhone: item.cellPhone,
      isPrimary: item.isPrimary,
      isBilling: item.isBilling,
      generalCounsel: item.isGeneralCounsel,
      isGeneralCounsel: item.isGeneralCounsel,
      personId: item.personId,
      id: item.id ? item.id : 0,
      indexNumber: index,
      isVisible: item && item.status == 'Active'
    });
    this.corporateContactDetails = item;
    this.isEdit = true;
    this.openAddCorporateContactDialog(content, 'xl', '');
  }

  public updateClientAssociation() {
    const data = { ...this.corporateContactForm.value };
    if (data.isPrimary) {
      if (this.isContactExist('Primary', data.firstName, data.lastName)) {
        return;
      }
    }
    if (data.isBilling) {
      if (this.isContactExist('Billing', data.firstName, data.lastName)) {
        return;
      }
    }
    data.generalCounsel = data.isGeneralCounsel;
    data.id = 0;
    data.isUpdate = !!data.personId;
    data.status = data.isVisible === true ? 'Active' : 'Inactive';
    if (data.primaryPhone && data.primaryPhone.charAt(0) != '(') {
      data.dispPrimaryPhone = data.primaryPhone
        ? '(' +
          data.primaryPhone.substr(0, 3) +
          ') ' +
          data.primaryPhone.substr(3, 3) +
          '-' +
          data.primaryPhone.substr(6, 4)
        : '-';
    } else {
      data.dispPrimaryPhone = data.primaryPhone;
    }
    this.corporateContactList[data.indexNumber] = data;
    this.toastDisplay.showSuccess('Corporate contact updated.');
    this.modalRef.close();
    this.sendDataAssociation.emit(true);
    if (data.isBilling || data.isPrimary) {
      this.checkCrpContact(data);
    }
    this.corporateContactList = [...this.corporateContactList];

    if (data.isPrimary) {
      this.sharedService.ClientEmailChange$.emit(data.email);
    }
    this.isNotMatterDetailsValidate();
  }

  onBlurMethod(val: any, type: string) {
    type === 'primaryPhone'
      ? (this.primaryPhoneBlur = this.isBlur(val))
      : type === 'cellPhone'
      ? (this.cellPhoneBlur = this.isBlur(val))
      : '';
  }

  private isBlur(val: string | any[]) {
    return val.length === 10 ? false : val.length === 0 ? false : true;
  }

  async createNewWorkflowForMatter(data) {
    try {
      let res = await this.workflowService
        .v1WorkFlowGeneratenewPost$Json({ body: data })
        .toPromise();
    } catch (err) {}
  }

  /*....Export to CSV in conflict check
   */
  ExportToCSV() {
    let columnList = [];
    let rows = clone(this.conflictArr);

    rows = rows.filter(item => {
      item.conflictType = item.conflictType.name;
      item.matterName = item.matterName.name;
      item.clientName = item.clientName.name.replace(/,/g, ' ');
      item.office = item.office.name;
      item.phones = item.phones.length > 0 ? item.phones[0].number : null;
      return item;
    });

    if (rows && rows.length > 0) {
      const keys = Object.keys(rows[0]);

      for (let i = 0; i < keys.length; i++) {
        columnList.push({ Name: keys[i], isChecked: true });
      }
    }
    this.exporttocsvService.downloadFile(rows, columnList, 'Conflict Check');
  }

  async checkIfMatterWorkFlowCreated(matterId, data: any) {
    try {
      let res = await this.workflowService
        .v1WorkFlowVerifyMatterMatterIdGet({ matterId: +matterId })
        .toPromise();
      let isMatterFlowCreated = JSON.parse(res as any).results
        .isMatterWorkflowCreated;
      if (!isMatterFlowCreated) {
        await this.createNewWorkflowForMatter(data);
      } else {
      }
    } catch (err) {}
  }

  public checkPro(event, index) {
    if (event && event.target.checked) {
      this.matterAssociationList.map(obj => {
        if (obj.associationType === 'Opposing Party') {
          obj['isOpposingPartyRepresentThemselves'] = true;
        }
      });
    } else {
      this.matterAssociationList.map(obj => {
        if (obj.associationType === 'Opposing Party') {
          obj['isOpposingPartyRepresentThemselves'] = false;
        }
      });
    }
  }

  public checkOpposingCounciel() {
    let exist = this.matterAssociationList.find(
      item => item.associationType === 'Opposing Counsel'
    );
    if (exist) {
      this.selectOpposingCouncil = true;
      this.matterAssociationList.map(obj => {
        if (obj.associationType === 'Opposing Party') {
          obj['isOpposingPartyRepresentThemselves'] = false;
        }
      });
      this.matterAssociationList = [...this.matterAssociationList];
    } else {
      this.selectOpposingCouncil = false;
    }
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
          res => {
            let selectedIds = [];
            if (
              this.attorneyForm.value &&
              this.attorneyForm.value.attorneys &&
              this.attorneyForm.value.attorneys.length > 0
            ) {
              selectedIds = this.attorneyForm.value.attorneys.map(
                item => item.id
              );
            }
            if(!selectedIds[index]) {
              res = res.filter(item => selectedIds.indexOf(item.id) === -1);
            }
            this.attorneyList = res;
            this.showLoaderDrpDwn[index].display = false;
            this.displayDrpDwn[index].display = true;
          },
          err => {
            this.showLoaderDrpDwn[index].display = false;
          }
        );
    } else {
      this.attorneyList = [];
      this.showLoaderDrpDwn[index].display = false;
    }
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

  public changeState(event, contanent) {
    let data = this.attorneyForm.value;
    let displayWrnPopup: boolean = false;
    let userState = [],
      diffState = [];
    if (data && data.attorneys && data.attorneys.length > 0) {
      data.attorneys.map((obj, index) => {
        userState = [];
        if (obj.personStates) {
          userState = obj.personStates.split(',');
          userState = userState.map(Number);
          if (userState.indexOf(event.id) === -1) {
            displayWrnPopup = true;
            diffState.push(index);
          }
        }
      });
    }
    if (displayWrnPopup) {
      let stateName = event ? event.name : '';
      this.changeJurisdictionMatterMsg = `At least one attorney is not licensed to practice in the state where this case has jurisdiction (${stateName}). Do you want to remove or keep these attorneys?`;
      this.openPopup = 'attorneyState';
      this.modalService
        .open(contanent, {
          centered: true,
          backdrop: 'static',
          keyboard: false,
          windowClass: ''
        })
        .result.then(
          result => {
            if (result === 'Cross click') {
              if (diffState) {
                diffState.reverse();
                diffState.map(obj => {
                  this.removeAttorney(obj);
                });
              }
            }
          },
          reason => {}
        );
    }
  }

  public selectAttorny(contanent, item, i: number) {
    let userState = [];
    if (item.personStates) {
      userState = item.personStates.split(',');
    }
    userState = userState.map(Number);
    if (
      this.matterForm.value.juridictionState &&
      userState.indexOf(this.matterForm.value.juridictionState) === -1
    ) {
      let state = this.stateList.find(
        item => +item.id === +this.matterForm.value.juridictionState
      );
      let stateName = state ? state.name : '';
      this.changeJurisdictionMatterMsg = `${item.name} is not licensed to practice in the state where this case has jurisdiction (${stateName}). Are you sure you want to assign this attorney?`;
      this.openPopup = 'state';
      this.modalService
        .open(contanent, {
          centered: true,
          backdrop: 'static',
          keyboard: false,
          windowClass: ''
        })
        .result.then(
          result => {
            if (result === 'Save click') {
              this.setAttorny(item, i, false);
            }
          },
          reason => {}
        );
    } else {
      this.setAttorny(item, i);
    }
  }

  markChange() {
    this.changesMade.emit();
  }

  public setAttorny(item, i: number, init: boolean = null, type: string = '') {
    this.changesMade.emit();
    let data = this.attorneyForm.value;
    data.attorneys.map((obj, index) => {
      if (i === index) {
        obj.primaryOffice = item.primaryOffice;
        obj.name = item.name;
        obj.id = item.id;
        obj.personStates = item.personStates;
        obj.practiceAreas = item.practiceAreas;
        obj.primaryOfficeId = item.primaryOfficeId;
        obj.secondaryOffices = item.secondaryOffices;
        obj.officeAssociation = this.getOfficeAssociation(obj);
        if(!init){
          obj.doNotSchedule = item.doNotSchedule;
        }
        if (init && type === 'responsible') {
          obj.IsResponsibleAttorney = true;
        }
        if (init && type === 'originating') {
          obj.IsOriginatingAttorney = true;
        }
        if (init && type === 'billing') {
          obj.IsBillingAttorney = true;
        }
        if (init === false) {
          obj.IsResponsibleAttorney = false;
          obj.IsBillingAttorney = false;
        }
        if(!init && obj.doNotSchedule){
          obj.IsResponsibleAttorney = false;
          obj.IsBillingAttorney = false;
        }
      }
    });
    this.attorneyForm.patchValue(data);
    this.attorneyList = [];
    this.closeDroDw();
    this.closeLoader();
  }

  public checkOfficeAssociatio() {
    let data = this.attorneyForm.value;
    if (data && data.attorneys && data.attorneys.length > 0) {
      data.attorneys.map((obj, index) => {
        if (obj.id > 0) {
          obj.officeAssociation = this.getOfficeAssociation(obj);
        }
      });
    }
  }

  public getOfficeAssociation(item) {
    if (this.matterForm.value.primaryLawOffice) {
      let otherOffice = [];
      if (item.secondaryOffices) {
        otherOffice = item.secondaryOffices.split(',');
        otherOffice = otherOffice.map(Number);
      }
      if (item.primaryOfficeId == this.matterForm.value.primaryLawOffice) {
        return 'Primary Office';
      } else if (
        otherOffice.indexOf(+this.matterForm.value.primaryLawOffice) > -1
      ) {
        return 'Other Office';
      } else {
        return 'Not in Office';
      }
    } else {
      return '';
    }
  }

  public checkAttorny(event, index, key) {
    this.markChange();
  }

  private closeDroDw() {
    this.displayDrpDwn.map(obj => {
      obj.display = false;
    });
  }
  private closeLoader() {
    this.showLoaderDrpDwn.map(obj => {
      obj.display = false;
    });
  }

  get attorneyFormGroup() {
    return this.attorneyForm.get('attorneys') as FormArray;
  }

  public advanceAttorneySearch(contanent: any, i: number) {
    let modal = this.modalService.open(ClientAttorneySearchComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-xlg'
    });
    let component = modal.componentInstance;
    component.attorneyForm = this.attorneyForm;
    component.data = this.setFilterParams(null);
    modal.result.then(res => {
      if (res) {
        this.selectAttorny(contanent, res, i);
      }
    });
  }

  isNotMatterDetailsValidate() {
    this.blankError = false;
    this.duplicate = false;
    this.corporateError = false;
    let IsBillingAttorneyCount = [];
    let IsOriginatingAttorneyCount = [];
    let IsResponsibleAttorneyCount = [];
    this.isSelectedEachError = false;
    this.missingTypeAttorney = false;

    this.attorneyForm.value.attorneys.forEach((element, index) => {
      if (element.IsBillingAttorney) {
        IsBillingAttorneyCount.push(element.IsBillingAttorney);
      }
      if (element.IsOriginatingAttorney) {
        IsOriginatingAttorneyCount.push(element.IsOriginatingAttorney);
      }
      if (element.IsResponsibleAttorney) {
        IsResponsibleAttorneyCount.push(element.IsResponsibleAttorney);
      }

      if (
        element.IsBillingAttorney === false &&
        element.IsOriginatingAttorney === false &&
        element.IsResponsibleAttorney === false &&
        element.name !== ""
      ) {
        this.isSelectedEachError = true;
      }
    });

    if (
      IsBillingAttorneyCount.length === 0 &&
      IsOriginatingAttorneyCount.length === 0 &&
      IsResponsibleAttorneyCount.length === 0
    ) {
      this.blankError = true;
    }
    if (
      IsBillingAttorneyCount.length > 1 ||
      IsOriginatingAttorneyCount.length > 1 ||
      IsResponsibleAttorneyCount.length > 1
    ) {
      this.duplicate = true;
    }

    if (
      IsBillingAttorneyCount.length === 0 ||
      IsOriginatingAttorneyCount.length === 0 ||
      IsResponsibleAttorneyCount.length === 0
    ) {
      this.missingTypeAttorney = true;
    }

    /* Corporate client validation */
    if (this.clientType == 'corporate') {
      if (this.corporateContactList.length > 0) {
        let isPrimary = [];
        let isBilling = [];
        this.corporateContactList.forEach(element => {
          if (element.isPrimary) {
            isPrimary.push(element.isPrimary);
          }
          if (element.isBilling) {
            isBilling.push(element.isBilling);
          }
        });
        if (isPrimary.length === 1 && isBilling.length === 1) {
          this.corporateError = false;
        } else {
          this.corporateError = true;
        }
      } else {
        this.corporateError = true;
      }
    }
    // if (
    //   IsBillingAttorneyCount.length === 1 &&
    //   IsOriginatingAttorneyCount.length === 1 &&
    //   IsResponsibleAttorneyCount.length === 1
    // ) {
    //   this.isSelectedEachError = false;
    // }

    return this.matterForm.invalid ||
      this.isSelectedEachError ||
      this.duplicate ||
      this.blankError ||
      this.corporateError ||
      this.missingTypeAttorney
      ? true
      : false;
  }

  public removeBlankAttorney() {
    let data = this.attorneyForm.value;
    let i = data && data.attorneys ? data.attorneys.length - 1 : 0;
    let isResponsible: boolean = false;
    let isBillling: boolean = false;
    let isOriginating: boolean = false;
    let motselectRole: boolean = false;
    if (data && data.attorneys && data.attorneys.length > 0) {
      isOriginating = data.attorneys.some(item => item.IsOriginatingAttorney);
      isResponsible = data.attorneys.some(item => item.IsResponsibleAttorney);
      isBillling = data.attorneys.some(item => item.IsBillingAttorney);
      motselectRole = data.attorneys.some(
        element =>
          element.IsBillingAttorney === false &&
          element.IsOriginatingAttorney === false &&
          element.IsResponsibleAttorney === false
      );
    }
    if (isOriginating && isResponsible && isBillling && motselectRole) {
      this.removeAttorney(this.attorneyForm.value.attorneys.length - 1);
    }
  }

  /*** open menu on action click */
  openMenu(index: number, event): void {
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
  onClickedOutside(event: any, index: number) {
    if (index == this.currentActive) this.currentActive = null;
  }
  sortAttorney(col: string) {
    if (
      this.attorneyForm &&
      this.attorneyForm.value &&
      this.attorneyForm.value.attorneys
    ) {
      let array = this.attorneyForm.value.attorneys;
      array = _.orderBy(
        array,
        a => a[col],
        this.sortingAttorney[col] ? 'asc' : 'desc'
      );
      this.sortingAttorney[col] = !this.sortingAttorney[col];
      this.attorneyForm.get('attorneys').patchValue(array);
    }
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.employeesRows) {
      return this.employeesRows.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }

  get footerHeightM() {
    if (this.matterAssociationList) {
      return this.matterAssociationList.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
