import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { vwClient } from 'src/common/swagger-providers/models';
import { BlockService, ClientAssociationService, ClientService, ContactsService, DmsService, DocumentPortalService, MatterService, MiscService, OfficeService, WorkFlowService } from 'src/common/swagger-providers/services';
import { ToastDisplay } from '../../../../guards/toast-service';
import * as fromRoot from '../../../../store';
import * as fromPermissions from '../../../../store/reducers/permission.reducer';
import { vwClientAssociation } from '../../../models/vw-client-association.model';
import * as errorData from '../../../shared/error.json';
import { UtilsHelper } from '../../../shared/utils.helper';
import { AttorneySearchComponent } from './attorney-search/attorney-search.component';

@Component({
  selector: 'app-matter-details',
  templateUrl: './matter-details.component.html',
  styleUrls: ['./matter-details.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class MatterDetailsComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild(DatatableComponent, { static: false }) corporatcnttable: DatatableComponent;

  @Input() formSubmitted: boolean;
  @Output() readonly sendDataAssociation = new EventEmitter<boolean>();
  @Output() readonly sendData = new EventEmitter<any>();
  @Output() readonly uniNumber = new EventEmitter();
  @Output() readonly prevMatterTypeId = new EventEmitter();
  searchOption: MatterListSearchOption;
  @Input() clientId: any;
  @Input() clientDetails: vwClient;
  @Input() pageType: any;
  @Input() parentuniqueNumber: any;
  @Output() readonly changesMade = new EventEmitter();
  @Output() readonly selectedOfficeDetails = new EventEmitter();

  public currentDate: any = new Date();
  public matterForm: FormGroup = this.builder.group({
    matterNumber: new FormControl('', []),
    matterName: new FormControl('', [Validators.required]),
    initialConsultLawOffice: new FormControl(null, [Validators.required]),
    juridictionState: new FormControl(null, [Validators.required]),
    caseNumbers: new FormControl(''),
    juridictionCounty: new FormControl('', [Validators.required]),
    practiceId: new FormControl(null, [Validators.required]),
    matterTypeId: new FormControl(null, [Validators.required]),
    matterOpenDate: new FormControl(this.currentDate, [Validators.required, this.isAfterContactDate.bind(this)]),
    contingentCase: new FormControl(false, []),
    isFixedFee: new FormControl(null, []),
    trustName: new FormControl(''),
    trustExecutionDate: new FormControl(null)
  });
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

  public addOpposingParty = false;
  public addOpposingPartyMode = 'create';
  public selectedOpposingParty: any;
  public opposingPartyList: Array<any> = [];
  public matterAssociationList: Array<any> = [];
  public addExpertWitness = false;
  public addExpertWitnessMode = 'create';
  public selectedExpertWitness: any;
  public expertWitnessList: Array<any> = [];
  public deletedExpertWitnessList: Array<any> = [];

  public addOpposingCouncel = false;
  public addOpposingCouncelMode = 'create';
  public selectedOpposingCounsel: any;
  public opposingCounselList: Array<any> = [];
  public deletedOpposingCounselList: Array<any> = [];
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
  public matterTypeList: any;
  private matterTypeRequest: any;
  public practiceAreaSelected = false;
  public isAttorneyLoading = false
  private modalRef: NgbModalRef;
  public corporateContactList: Array<any> = [];
  public deletedCorporateContactList: Array<any> = [];
  public contactType: Array<any> = [];
  public corporateContactOriginalList: Array<any> = [];
  public clientType: string;
  public isEdit = false;
  public vendorForm: FormGroup = this.builder.group({
    uniqueNumber: new FormControl(''),
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.email, Validators.pattern(REGEX_DATA.Email)]),
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
  public roleForm: FormGroup = this.builder.group({
    isPrimary: [null],
    isBilling: [null],
    isGeneralCounsel: [null]
  });
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
  selectedExistedContactList: any[];
  userInfo = UtilsHelper.getLoginUser();
  uniqueNumber: any;

  attorneys: FormArray;
  public attorneyForm = new FormGroup({
    attorneys: new FormArray([], Validators.required)
  });
  public searchSubscribe: Subscription;
  public displayDrpDwn: Array<{ display: boolean }> = [{ display: false }, { display: false }, { display: false }];
  public showLoaderDrpDwn: Array<{ display: boolean }> = [
    { display: false },
    { display: false },
    { display: false },
  ];
  public changeJurisdictionMatterMsg: string = '';
  public openPopup: string = 'state';
  public blankError: Boolean = false;
  public duplicate: Boolean = false;
  public corporateError: Boolean = false;
  public isSelectedEachError: Boolean = false;
  public errorHeader: string = 'Attorney';
  public errorMessage: string = 'Please select exactly one Originating, one Responsible and on Billing Attorney. One person can fill multiple roles.';
  public displayMessageForcrpc: boolean = false;
  public attorneyLoading: boolean = false;
  public ColumnMode = ColumnMode;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  currentActive: number;
  isSearchLoading: boolean = false;
  @Input() public initialConsultDate: Date;

  minMatterOpenDate: Date;

  constructor(
    private matterService: MatterService,
    private builder: FormBuilder,
    private miscService: MiscService,
    private dialogService: DialogService,
    private toastDisplay: ToastDisplay,
    private store: Store<fromRoot.AppState>,
    private officeService: OfficeService,
    private blockService: BlockService,
    private router: Router,
    private modalService: NgbModal,
    private clientAssociationService: ClientAssociationService,
    private route: ActivatedRoute,
    private clientService: ClientService,
    public config: NgbModalConfig,
    private workflowService: WorkFlowService,
    private contactsService: ContactsService,
    private exporttocsvService: ExporttocsvService,
    private dmsService: DmsService,
    private formBuilder: FormBuilder,
    private documentPortalService: DocumentPortalService,
    private el: ElementRef,
    private sharedService: SharedService
  ) {
    config.backdrop = 'static';
    config.keyboard = false;
    this.searchOption = new MatterListSearchOption();
    this.permissionList$ = this.store.select('permissions');

    this.route.queryParams.subscribe(params => {
      this.clientType = params['type'];
    });

    this.minMatterOpenDate = new Date();
  }


  async ngOnInit() {
    this.matterForm.valueChanges.subscribe(val => {
      this.sendData.emit({ basicForm: this.matterForm });
    });

    this.warning_msg = this.errorData.change_practice_area_warning;
    this.att_error_msg = this.errorData.no_attorney;
    this.att_select_msg = this.errorData.select_attorney;
    this.res_att_warn_msg = this.errorData.change_res_att_warning
    this.detailsLoading = true;
    await this.getOffices();
    await this.getAssociateType();
    await this.getState();

    /*** subscribe to permission list */
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
    if (this.pageType != 'client') {
      this.clientService.v1ClientGetClientUniqueNumberGet({ tenantId: this.userInfo.tenantId }).subscribe((data: any) => {
        this.uniqueNumber = JSON.parse(data).results.uniqueNumber;
      });
    } else {
      this.uniqueNumber = this.parentuniqueNumber;
      this.getBlockedEmployeeList();
    }
    if (this.clientType === 'company') {
      this.getContactType();
    }

    this.attorneyForm.valueChanges.subscribe(res => {
      this.isNotMatterDetailsValidate();
    });
    this.matterForm.get('matterName').valueChanges.subscribe(res => {
      this.changesMade.emit();
    });
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('clientDetails')) {
      this.clientDetails = changes.clientDetails.currentValue;
      this.getTempMatterId();
      this.getClientDetail();
    }
    if (changes.hasOwnProperty('parentuniqueNumber') && this.pageType && this.pageType == 'client') {
      this.uniqueNumber = this.parentuniqueNumber;
    }
  }

  get getAttorneyForm() {
    return this.attorneyForm.get('attorneys');
  }

  isAfterContactDate(control: FormControl) {
    if (control.value && this.clientDetails) {
      const isMatterDateValid = moment(control.value).isSameOrAfter(moment(this.clientDetails.initialContactDate), 'd');
      return !isMatterDateValid ? {matterDateBeforeContact: true} : null
    }
    return null;
  }

  get f() {
    return this.matterForm.controls;
  }

  get v() {
    return this.vendorForm.controls;
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
      secondaryOffices: '',
      doNotSchedule: false
    });
  }

  createAttorney(action: string = 'create'): void {
    this.attorneys = this.attorneyForm.get('attorneys') as FormArray;
    this.attorneys.push(this.attorney());
    if (action === 'create') {
      this.setAttornyRole();
      setTimeout(() => {
        const searchAttorney = this.el.nativeElement.querySelector(`#searchAttorney-${this.attorneys.length - 1}`);
        if (searchAttorney) {
          searchAttorney.focus();
        }
      }, 1000);
    }
  }


  public setAttornyRole() {
    let data = this.attorneyForm.value;
    let i = (data && data.attorneys) ? data.attorneys.length - 1 : 0;
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

    setTimeout(() => {
      const searchAttorney = this.el.nativeElement.querySelector(`#searchAttorney-${this.attorneys.length - 1}`);
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
    event.isVisible = (event.status === "Active") ? true : false;
    this.selectedExistedContactList.push(event);
  }

  public getTempMatterId() {
    if (!(this.localMatterDetails && this.localMatterDetails.matter && this.localMatterDetails.matter.matterNumber)) {
      this.matterService
        .v1MatterLatestmatternumberGet({ tenantId: +this.userInfo.tenantId })
        .pipe(map(UtilsHelper.mapData))
        .subscribe(suc => {
          console.log('testing', suc);
          this.matterForm.patchValue({
            matterNumber: suc.matterNumber
          });
        }, err => {
          console.log(err);
        });
    }
  }

  public getAttorneyDtls() {
    let isSet: number = 0;

    new Promise((resolve, reject) => {
      if (this.clientDetails && this.clientDetails.responsibleAttorneys && this.clientDetails.responsibleAttorneys.length > 0) {
        let data = this.attorneyForm.value;
        if (data.attorneys.some(obj => obj.id == this.clientDetails.responsibleAttorneys[0].id)) {
          data.attorneys.map(att => {
            if (att.id == this.clientDetails.responsibleAttorneys[0].id) {
              att.IsResponsibleAttorney = true;
            }
          });
          this.attorneyForm.patchValue(data);
          resolve(true);
        } else {
          this.attorneyLoading = true;
          this.officeService.v1OfficeReDesignAttorneysGet({ id: this.clientDetails.responsibleAttorneys[0].id })
            .pipe(map(UtilsHelper.mapData))
            .subscribe((res) => {
              if (res && res.length > 0) {
                this.createAttorney('init');
                resolve(this.setAttorny(res[0], isSet, true, 'responsible'));
                isSet = isSet + 1;
              }
              this.attorneyLoading = false;
            }, (err) => {
              this.attorneyLoading = false;
              resolve(true);
            });
        }
      } else {
        resolve(true);
      }
    }).then(() => {
      if (this.clientDetails && this.clientDetails.originatingAttorney && this.clientDetails.originatingAttorney.id > 0) {
        let data = this.attorneyForm.value;
        if (data.attorneys.some(obj => obj.id == this.clientDetails.originatingAttorney.id)) {
          data.attorneys.map(att => {
            if (att.id == this.clientDetails.originatingAttorney.id) {
              att.IsOriginatingAttorney = true;
            }
          });
          this.attorneyForm.patchValue(data);
          return true;
        } else {
          this.attorneyLoading = true;
          this.officeService.v1OfficeReDesignAttorneysGet({ id: this.clientDetails.originatingAttorney.id })
            .pipe(map(UtilsHelper.mapData))
            .subscribe((res) => {
              if (res && res.length > 0) {
                this.createAttorney('init');
                this.setAttorny(res[0], isSet, true, 'originating');
                isSet = isSet + 1;
              }
              this.attorneyLoading = false;
              return true;
            }, (err) => {
              this.attorneyLoading = false;
              return true;
            });
        }
      } else {
        return true;
      }
    }).then(() => {
      if (this.clientDetails && this.clientDetails.billingAttorney && this.clientDetails.billingAttorney.id > 0) {
        let data = this.attorneyForm.value;
        if (data.attorneys.some(obj => obj.id == this.clientDetails.billingAttorney.id)) {
          data.attorneys.map(att => {
            if (att.id == this.clientDetails.billingAttorney.id) {
              att.IsBillingAttorney = true;
            }
          });
          this.attorneyForm.patchValue(data);
        } else {
          this.attorneyLoading = true;
          this.officeService.v1OfficeReDesignAttorneysGet({ id: this.clientDetails.billingAttorney.id })
            .pipe(map(UtilsHelper.mapData))
            .subscribe((res) => {
              if (res && res.length > 0) {
                this.createAttorney('init');
                this.setAttorny(res[0], isSet, true, 'billing');
                isSet = isSet + 1;
              }
              this.attorneyLoading = false;
            }, (err) => {
              this.attorneyLoading = false;
            });
        }
      }
    });
    this.attorneyLoading = false;
  }

  public getClientDetail() {
    if (this.clientDetails && this.clientDetails.responsibleAttorneys.length > 0) {
      let clientResponsibleAttorney = this.clientDetails.responsibleAttorneys[0];
    }
    if (this.clientDetails) {
      let officeLawId = null;
      if (this.pageType === 'client' && this.clientDetails && this.clientDetails.consultationLawOffice) {
        officeLawId = this.clientDetails.consultationLawOffice.id;
      }
      if (this.pageType === 'matter' && this.clientDetails && this.clientDetails.primaryOffice) {
        officeLawId = this.clientDetails.primaryOffice.id;
      }
      this.matterForm.patchValue({
        practiceId: (this.clientDetails.matterPractices && this.clientDetails.matterPractices.id) ? this.clientDetails.matterPractices.id : null,
        matterTypeId: (this.clientDetails.matterType && this.clientDetails.matterType.length > 0) ? this.clientDetails.matterType[0].id : null,
        juridictionState: (this.clientDetails.jurisdiction && this.clientDetails.jurisdiction.length > 0) ? this.clientDetails.jurisdiction[0].id : null,
        initialConsultLawOffice: officeLawId,
        juridictionCounty: (this.clientDetails.jurisdictionCounty && this.pageType === 'client') ? this.clientDetails.jurisdictionCounty : '',
      });

      if (this.pageType === 'client') {
        this.getList();
      }
      if (this.matterForm.value.initialConsultLawOffice) {
        this.getPractices();
      }
      if (this.clientDetails.matterPractices && this.clientDetails.matterPractices.id) {
        this.getMatterType(this.clientDetails.matterPractices);
      }
      this.attorneyLoading = true;
      this.getAttorneyDtls();
      if (this.clientDetails.isCompany) {
        this.clientType = 'company'
        this.getCorporateContact();
        this.getContactType();
      }

      if (this.clientDetails.initialConsultDate) {
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
      } else if (this.clientDetails.initialContactDate) {
        this.minMatterOpenDate = moment(this.clientDetails.initialContactDate).toDate();
      } else {
        this.minMatterOpenDate = new Date();
      }

      this.minMatterOpenDate = moment(moment(this.minMatterOpenDate).format('YYYY-MM-DD')).toDate();
    }
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
  }

  public officeChange() {
    this.selectedOfficeDetails.emit(event);
    if (this.matterForm.value.initialConsultLawOffice === null) {
      this.raLoading = false;
      this.baLoading = false;
    } else {
      this.raLoading = true;
      this.baLoading = true;
    }
    this.matterForm.patchValue({
      practiceId: null,
      matterTypeId: null
    });
    this.getPractices();
    this.checkOfficeAssociatio();
  }


  public getState() {
    this.miscService.v1MiscStatesGet$Response({}).subscribe(suc => {
      let res: any = suc;
      this.stateList = JSON.parse(res.body).results;
    }, err => {
      console.log(err)
    });
  }

  private getAssociateType() {
    this.miscService
      .v1MiscGroupsGet$Response({})
      .subscribe(
        res => {
          this.clientAssociates = JSON.parse(res.body as any).results;
          if (this.clientAssociates && this.clientAssociates.length > 0) {
            this.associateOpposingParty = this.clientAssociates.filter((obj) => {
              return obj.name === 'Opposing Party';
            })[0];
            this.associateOpposingCouncil = this.clientAssociates.filter((obj) => {
              return obj.name === 'Opposing Counsel';
            })[0];
            this.associateExpertWitness = this.clientAssociates.filter((obj) => {
              return obj.name === 'Expert Witness';
            })[0];
            this.associateResponsibleAttorney = this.clientAssociates.filter((obj) => {
              return obj.name === 'Responsible Attorney';
            })[0];
            this.associateBillingAttorney = this.clientAssociates.filter((obj) => {
              return obj.name === 'Billing Attorney';
            })[0];
            this.associateAttorny = this.clientAssociates.filter(obj => {
              return obj.name === 'Attorney';
            })[0];
            this.associateOriginatingAttorney = this.clientAssociates.filter(obj => {
              return obj.name === 'Originating Attorney';
            })[0];
          }
        },
        err => {
          console.log(err);
        }
      );
  }

  /**
   * Get client detail and rate table list
   */
  private getList() {
    this.clientAssociationService.v1ClientAssociationAllClientIdGet({ clientId: this.clientDetails.id })
      .subscribe((res: any) => {
        const list = JSON.parse(res).results;

        this.opposingPartyList = list.filter(
          item => item.associationType === Constant.ClientAssociation.OpposingParty && item.isActive
        );
        this.opposingCounselList = list.filter(
          item => item.associationType === Constant.ClientAssociation.OpposingCounsel && item.isActive
        );
        this.expertWitnessList = list.filter(
          item => item.associationType === Constant.ClientAssociation.ExpertWitness && item.isActive
        );

        let opposingPartyRepresentingThemselves;
        if (this.opposingCounselList && this.opposingPartyList && this.opposingPartyList.length === this.opposingCounselList.length) {
          let ids = this.opposingCounselList.map(item => item.uniqueNumber);
          opposingPartyRepresentingThemselves = true;
          this.opposingPartyList.map((obj) => {
            if (ids.indexOf(obj.uniqueNumber) === -1) {
              opposingPartyRepresentingThemselves = false;
            }
          });
          if (opposingPartyRepresentingThemselves) {
            if (this.opposingPartyList && this.opposingPartyList.length > 0) {
              this.matterAssociationList = this.matterAssociationList.concat(this.opposingPartyList);
            }
            this.matterAssociationList.map((obj) => {
              if (obj.associationType === 'Opposing Party') {
                obj['isOpposingPartyRepresentThemselves'] = true;
              }
            });
          } else {
            if (this.opposingPartyList && this.opposingPartyList.length > 0) {
              this.matterAssociationList = this.matterAssociationList.concat(this.opposingPartyList);
            }
            if (this.opposingCounselList && this.opposingCounselList.length > 0) {
              this.matterAssociationList = this.matterAssociationList.concat(this.opposingCounselList);
            }
            this.checkOpposingCounciel();
          }
        } else {
          if (this.opposingPartyList && this.opposingPartyList.length > 0) {
            this.matterAssociationList = this.matterAssociationList.concat(this.opposingPartyList);
          }
          if (this.opposingCounselList && this.opposingCounselList.length > 0) {
            this.matterAssociationList = this.matterAssociationList.concat(this.opposingCounselList);
          }
          this.checkOpposingCounciel();
        }
        if (this.expertWitnessList && this.expertWitnessList.length > 0) {
          this.matterAssociationList = this.matterAssociationList.concat(this.expertWitnessList);
        }
      }, err => {
      });


  }


  /**
   * Get office list
   *
   * @memberof MatterDetailsComponent
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

  /**
   * Get practice area list
   *
   * @memberof MatterDetailsComponent
   */
  public getPractices() {
    if (this.matterForm.value.initialConsultLawOffice) {
      this.officeService.v1OfficePracticeAreasAllGet$Response({ officeId: this.matterForm.value.initialConsultLawOffice }).subscribe(
        suc => {
          this.practiceList = JSON.parse(suc.body as any).results.officePractices;
          let row = this.practiceList.filter(obj => obj.name.toLowerCase() == 'estate planning');
          this.estatePlanningPracticeAreaId = row.length > 0 ? row[0].id : null;
          if (!this.clientDetails.matterPractices) {
            this.detailsLoading = false;
          }
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
      officeId: +this.matterForm.value.initialConsultLawOffice
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
      officeId: +this.matterForm.value.initialConsultLawOffice
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
  }

  public editMatterAssociations(item, index: number) {
    if (item && item.associationType === 'Opposing Counsel') {
      this.editOpposingCounselClick(item, index);
    } else if (item && item.associationType === 'Opposing Party') {
      this.editOpposingPartyClick(item, index);
    } else if (item && item.associationType === 'Expert Witness') {
      this.editExpertWitnessClick(item, index);
    }
  }

  public editOpposingPartyClick(item: any, index) {
    item.indexNumber = index;
    this.addOpposingPartyMode = 'edit';
    this.selectedOpposingParty = item;
    this.addOpposingParty = true;
  }

  public editOpposingCounselClick(item: any, index) {
    item.indexNumber = index;
    this.addOpposingCouncelMode = 'edit';
    this.selectedOpposingCounsel = item;
    this.addOpposingCouncel = true;
  }

  public editExpertWitnessClick(item: any, index) {
    item.indexNumber = index;
    this.addExpertWitness = true;
    this.addExpertWitnessMode = 'edit';
    this.selectedExpertWitness = item;
  }

  public addOpposingCounselClick() {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.addOpposingCouncelMode = 'create';
    this.selectedOpposingCounsel = null;
    this.addOpposingCouncel = true;
  }

  public addExpertWitnessClick() {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.addExpertWitnessMode = 'create';
    this.selectedExpertWitness = null;
    this.addExpertWitness = true;
  }

  public closeOpposingParty(event) {
    if (event.type === 'close' && event && event.type && event.type !== 'edit') {
      this.uniqueNumber = this.uniqueNumber - 1;
    }
    this.addOpposingParty = false;
    if (event === 'add' || (event && event.type && event.type === 'add') || (event && event.type && event.type === 'edit')) {
      this.manageMatterAssociate(event, this.opposingPartyList, this.associateOpposingParty);
    }
  }

  /***
   * capture popup close event for Opposing councel
   */
  public closeOpposingCouncel(event) {
    if (event.type === 'close' && event && event.type && event.type !== 'edit') {
      this.uniqueNumber = this.uniqueNumber - 1;
    }
    this.addOpposingCouncel = false
    if (event === 'add' || (event && event.type && event.type === 'add') || (event && event.type && event.type === 'edit')) {
      this.manageMatterAssociate(event, this.opposingCounselList, this.associateOpposingCouncil);
    }
  }

  /***
   * capture popup close event for Expert Witness
   */
  public closeExpertWitness(event) {
    if (event.type === 'close' && event && event.type && event.type !== 'edit') {
      this.uniqueNumber = this.uniqueNumber - 1;
    }
    this.addExpertWitness = false
    if (event === 'add' || (event && event.type && event.type === 'add') || (event && event.type && event.type === 'edit')) {
      this.manageMatterAssociate(event, this.expertWitnessList, this.associateExpertWitness);
    }
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
      listArr.push(this.getData(event, associate));
      this.matterAssociationList.push(this.getData(event, associate));
      this.checkOpposingCounciel();
    } else if (event.type === 'edit') {
      let index = listArr.findIndex((item, idx) => idx === event.data.indexNumber);
      let index1 = this.matterAssociationList.findIndex((item, idx) => idx === event.data.indexNumber);
      if (index1 > -1) {
        listArr[index] = this.getData(event, associate);
        this.matterAssociationList[index1] = this.getData(event, associate);
        this.matterAssociationList = [...this.matterAssociationList];
      }
    }
    if (this.pageType == 'client') {
      this.uniNumber.emit(this.uniqueNumber)
    }
  }

  private getData(event, associate) {
    this.changesMade.emit();
    this.sendDataAssociation.emit(true);
    return {
      isNew: (event.data.id) ? ((this.pageType == 'matter') ? (!!(this.newMatterId)) : true) : true,
      id: event.data.id,
      uniqueNumber: +event.data.uniqueNumber,
      associationId: associate.id,
      associationType: associate.name,
      firstName: event.data.firstName,
      email: event.data.email,
      lastName: event.data.lastName,
      companyName: event.data.companyName,
      primaryPhone: event.data.primaryPhone,
      isOpposingPartyRepresentThemselves: (event.data.isOpposingPartyRepresentThemselves) ? true : false,
      isCompany: event.data.isCompany,
      isVisible: (event.data.isVisible) ? event.data.isVisible : true,
      isArchived: (event.data.isArchived) ? event.data.isArchived : false
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
  }

  /**
   * function to get blocked employee list
   *
   */
  getBlockedEmployeeList(): void {
    this.blockedLoading = true;
    const profile = localStorage.getItem('profile');
    if (profile) {
      let url: any = this.clientService.v1ClientBlockedUserClientIdGet$Response({ clientId: this.clientId });
      if (this.pageType == 'matter') {
        url = this.matterService.v1MatterBlockUsersMatterIdGet$Response({ matterId: +this.matterId })
      }
      url.subscribe(
        suc => {
          const res: any = suc;
          this.employeesRows = JSON.parse(res.body as any).results;
          this.employeesRows = _.orderBy(this.employeesRows, a => a.lastName);
          this.blockedLoading = false;
        },
        err => {
          console.log(err);
          this.blockedLoading = false;
        }
      );
    }
  }

  private addedItems(originalArray: vwClientAssociation[], items: vwClientAssociation[]) {
    let arr: vwClientAssociation[] = [];

    items.forEach(a => {
      let index = originalArray.findIndex(i => i.id == a.id);
      if (index == -1) {
        arr.push(a);
      }
    });

    return arr;
  }


  changePracticeArea(value, contanent) {
    this.selectedPracticeArea = value ? value : '';
    this.prevMatterTypeId.emit(this.matterForm.value.matterTypeId);
    this.getMatterType(this.selectedPracticeArea);
    this.matterForm.patchValue({
      matterTypeId: null
    });
    let data = this.attorneyForm.value;
    let displayWrnPopup: boolean = false;
    let userPracticeArea = [], diffPRaciceArea = [];
    if (data && data.attorneys && data.attorneys.length > 0) {
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
      }, reason => {
        if (reason === 'Cross click') {
          if (diffPRaciceArea) {
            diffPRaciceArea.reverse()
            diffPRaciceArea.map((obj) => {
              this.removeAttorney(obj);
            })
          }
        }
        if (reason === 'Save click') {
          this.matterForm.patchValue({
            practiceId: null
          })
        }
      }
      );
    }
  }

  open(content: any, className: any) {
    this.modalService
      .open(content, {
        size: className,
        centered: true,
        backdrop: 'static',
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
    this.matterForm.patchValue({ practiceId: this.matterDetails.practiceArea.length > 0 ? this.matterDetails.practiceArea[0].id : null });
  }

  public getMatterType(e) {
    if (e) {
      if (this.matterTypeRequest) {
        this.matterTypeRequest.unsubscribe();
      }
      this.matterTypeList = [];
      this.matterTypeRequest = this.matterService.v1MatterTypesPracticeIdGet({ practiceId: e.id }).subscribe(suc => {
        const res: any = suc;
        this.matterTypeList = JSON.parse(res).results;
        if (this.matterTypeList && this.matterTypeList.length) {
          this.matterTypeList = _.orderBy(this.matterTypeList, 'name', 'asc');
        }
        if(this.matterTypeList.length == 1){
           this.matterForm.patchValue({
            matterTypeId: this.matterTypeList[0].id
           });
           this.matterForm.controls.matterTypeId.disable()
        } else {
          this.matterForm.controls.matterTypeId.enable();
        }
        let row = this.matterTypeList.filter(obj => obj.name.toLowerCase() == 'estate planning');
        this.estatePlanningMatterTypeId = (row.length) ? row[0].id : null;
        this.practiceAreaSelected = true;
        this.detailsLoading = false;
      }, err => {
        this.detailsLoading = false;
        console.log(err);
      });
    } else {
      this.practiceAreaSelected = false;
      this.matterTypeList = [];
      this.detailsLoading = false;
    }
  }

  /**** function to open add blocked employee modal */
  addBlockedEmployeeClick() {
    let modalRef = this.modalService.open(AddBlockedEmployeeNewMatterWizardComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl',
    });

    const alreadyAttorney = this.attorneyForm.value.attorneys.map((obj: any) => obj.id);
    const alredyBlocked = this.employeesRows.map((a: any) => a.id);
    const allAlready = [...alreadyAttorney, ...alredyBlocked];

    modalRef.componentInstance.matterId = +this.matterId;
    modalRef.componentInstance.clientId = +this.clientId;
    modalRef.componentInstance.alreadyBlockedEmployees = allAlready

    modalRef.result.then(res => {
      if (res && res.length) {
        this.employeesRows = [...this.employeesRows, ...res];
      }
    });
  }

  /****function to delete blocked employee */
  async deleteBlockedEmployee(row: any): Promise<any> {
    try {
      let resp: any = await this.dialogService.confirm(errorData.delete_blocked_employee_confirm, 'Delete');
      if (resp) {
        let index = this.employeesRows.findIndex(item => item.id === row.id);
        this.employeesRows.splice(index, 1);
        this.employeesRows = [...this.employeesRows];
      }
    } catch (err) {
    }
  }

  openPersonalinfo(content: any, className, winClass, reset?: boolean) {
    if (reset) {
      this.isEdit = false;
      this.vendorForm.reset();
      this.uniqueNumber = this.uniqueNumber + 1;
      this.vendorForm.controls['uniqueNumber'].setValue(this.uniqueNumber);
      this.vendorForm.controls['isVisible'].setValue(true);
    }
    this.modalRef = this.modalService.open(content, {
      size: className,
      windowClass: winClass,
      centered: true,
      backdrop: 'static',
    });
    this.modalRef.result.then((result) => {
    }, (reason) => {
      this.uniqueNumber = this.uniqueNumber - 1;
    });
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
    this.clientAssociationService.v1ClientAssociationClientIdGet({ clientId: this.clientId }).subscribe(suc => {
      const res: any = suc;
      let list = JSON.parse(res).results
      if (list && list.length > 0) {
        list = list.filter(obj => {
          return obj.associationType !== 'Vendor' && obj.associationType !== 'Subsidiary';
        });
      };
      this.corporateContactOriginalList = list
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

        if (obj.isPrimary) {
          this.sharedService.ClientEmailChange$.next(obj.email);
        }
      });
      this.corporateContactList = [...this.corporateContactList];
      UtilsHelper.aftertableInit();
      this.contactLoading = false;
    }, err => {
      console.log(err);
      this.contactLoading = false;
    });
  }

  isCorporateFormValid(): boolean {
    if (this.createType == 'existing') {
      let data = this.roleForm.getRawValue();
      return !!(data && (data.isBilling || data.isGeneralCounsel || data.isPrimary));
    }
    if (this.createType == 'create') {
      let data = this.vendorForm.value;
      return !!(data &&
        this.vendorForm.valid &&
        (data.isBilling || data.isGeneralCounsel || data.isPrimary));
    }
  }

  public saveCorporateContact() {
    this.vendorFormSubmitted = true;
    if (this.isCorporateFormValid()) {
      let data;
      if (this.createType === 'create') {
        data = { ...this.vendorForm.value };
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
        let selectedId = (this.selectedExistedContactList && this.selectedExistedContactList.length > 0) ? this.selectedExistedContactList[0].id : 0;
        let exist = this.corporateContactList.find(item => item.personId === selectedId)
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
      role = role.split(',').filter((el) => {
        return el !== '';
      }).join();
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
      }
      item.cellPhoneNumber = item.cellPhone;
      item.id = 0;
      item.userName = item.email === '' || !item.email ? item.firstName + item.lastName + Math.floor(Math.random() * 10000) : item.email;
      item.status = (item.isVisible === true ? 'Active' : 'Inactive');
      item.role = role;
      if (item.generalCounsel) {
        item.isGeneralCounsel = item.generalCounsel;
      }
      item.id = (item.id) ? item.id : 0;
      this.corporateContactList.push(item);
      this.corporateContactList = [...this.corporateContactList];
      UtilsHelper.aftertableInit();
      this.vendorFormSubmitted = false;
      this.createType = 'create';
      this.vendorForm.reset();
      this.roleForm.reset();
      this.modalRef.close();
      this.sendDataAssociation.emit(true);
      this.checkCrpCntExtDmsAcnt();
      if (item.isPrimary) {
        this.sharedService.ClientEmailChange$.next(item.email);
      }
      this.changesMade.emit();
    }
  }

  public checkCrpCntExtDmsAcnt() {
    if (this.corporateContactList && this.corporateContactList.length > 0) {
      let exist = this.corporateContactList.some(item => item.externalPortalAccount === false);
      this.displayMessageForcrpc = (exist) ? true : false;
    } else {
      this.displayMessageForcrpc = false;
    }
  }

  public checkCrpContact(item) {
    if (item && (item.id > 0 || item.personId > 0)) {
      this.documentPortalService.v1DocumentPortalIsDocumentPortalExistPersonIdGet({ personId: item.id || item.personId })
        .pipe(map(UtilsHelper.mapData)).subscribe(suc => {
          if (!this.displayMessageForcrpc) {
            this.displayMessageForcrpc = (suc) ? false : true;
            item['externalPortalAccount'] = suc;
          }
        }, err => {
          console.log(err);
        });
    } else {
      this.displayMessageForcrpc = true;
    }
  }

  private isContactExist(type, fname?: string, lname?: string) {
    let exist = false;
    if (type === 'Primary') {
      if (fname && lname) {
        if (this.corporateContactDetails && this.corporateContactDetails.id) {
          exist = this.corporateContactList.some(e => e.isPrimary && fname !== e.firstName && lname !== e.lastName && this.corporateContactDetails.id !== e.id);
        } else {
          exist = this.corporateContactList.some(e => e.isPrimary && fname !== e.firstName && lname !== e.lastName && this.corporateContactDetails.indexNumber !== e.indexNumber);
        }
      } else {
        exist = this.corporateContactList.some(e => e.isPrimary);
      }
    }
    if (type === 'Billing') {
      if (fname && lname) {
        if (this.corporateContactDetails && this.corporateContactDetails.id) {
          exist = this.corporateContactList.some(e => e.isBilling && fname !== e.firstName && lname !== e.lastName && this.corporateContactDetails.id !== e.id);
        } else {
          exist = this.corporateContactList.some(e => e.isBilling && fname !== e.firstName && lname !== e.lastName && this.corporateContactDetails.indexNumber !== e.indexNumber);
        }
      } else {
        exist = this.corporateContactList.some(e => e.isBilling);
      }
    }
    if (exist) {
      this.toastDisplay.showError(type + ' Contact is already exists for this client.');
    }
    if (type === 'Primary' || 'Billing') {
      const data = { ...this.vendorForm.value };
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


  private setClientAssociations(personId) {
    const types = [];
    const data = { ...this.vendorForm.value };
    data.isPrimary ? this.getAssociationTypeId('Primary Contact', types) : null;
    data.isBilling ? this.getAssociationTypeId('Billing Contact', types) : null;
    data.isGeneralCounsel ? this.getAssociationTypeId('General Counsel', types) : null;
    types.forEach(element => {
      const param = {
        associationTypeId: +element.id,
        clientId: +this.clientId,
        personId: +personId
      };

      this.clientAssociationService.v1ClientAssociationPost$Json({ body: param }).subscribe(suc => {
        const res: any = suc;
        const list = JSON.parse(res).results;
        if (types[types.length - 1].id === element.id) {
          this.corporateContactList = [];
          this.isEdit = false;
          this.vendorForm.reset();
          this.modalRef.close();
          this.getCorporateContact();
          this.updateClientDMSAccount();
        }
      }, err => {
        console.log(err);
      });
    });
  }

  getAssociationTypeId(name, types) {
    const id = this.contactType.filter(obj => obj.name === name);
    types.push(id[0]);
    return types;
  }

  public getContactType() {
    this.miscService.v1MiscCorporatecontactassociationsGet({}).subscribe(suc => {
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
    }, err => {
      console.log(err);
    });
  }

  public async deleteClientAssociation($event, item, index) {
    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }
    const resp: any = await this.dialogService.confirm(
      'Are you sure to delete this corporate contact?',
      'Delete'
    );
    if (resp) {
      if (item.id > 0) {
        let row = { ...item };
        row['isDelete'] = true;
        row['status'] = (row.status === 'Active') ? true : false;
        this.deletedCorporateContactList.push(row);
      }
      this.corporateContactList.splice(index, 1);
      this.sendDataAssociation.emit(true);
      if (item.isPrimary) {
        this.sharedService.ClientEmailChange$.next(null);
      }
      this.checkCrpCntExtDmsAcnt();
    }
  }

  public editCorporateContact($event, content, item, index) {
    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }
    this.vendorForm.patchValue({
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
      id: (item.id) ? item.id : 0,
      indexNumber: index,
      isVisible: (item && item.status == 'Active')
    });

    if (item.isPrimary) {
      this.sharedService.ClientEmailChange$.next(null);
    }

    this.corporateContactDetails = item;
    this.isEdit = true;
    this.openPersonalinfo(content, 'xl', '');
  }

  public updateClientAssociation() {
    const data = { ...this.vendorForm.value };
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
    data.id = data.personId;
    data.isUpdate = !!(data.personId);
    data.status = (data.isVisible === true ? 'Active' : 'Inactive');
    data.dispPrimaryPhone = data.primaryPhone
      ? '(' +
      data.primaryPhone.substr(0, 3) +
      ') ' +
      data.primaryPhone.substr(3, 3) +
      '-' +
      data.primaryPhone.substr(6, 4)
      : '-';;
    this.corporateContactList[data.indexNumber] = data;
    this.toastDisplay.showSuccess('Corporate contact updated.');
    this.modalRef.close();
    this.sendDataAssociation.emit(true);
    if (data.isBilling || data.isPrimary) {
      this.checkCrpContact(data);
    }
    this.corporateContactList = [...this.corporateContactList];
    UtilsHelper.aftertableInit();
  }

  public insertanddeleteAssociation(personId) {
    const data = { ...this.vendorForm.value };
    const filterList = this.corporateContactOriginalList.filter(obj => obj.personId === personId);
    filterList.forEach(element => {
      this.clientAssociationService.v1ClientAssociationIdDelete({ id: +element.id }).subscribe(suc => {
        const res: any = suc;
        const list = JSON.parse(res).results;
        if (filterList[filterList.length - 1].id === element.id) {

          this.setClientAssociations(personId);
        }
      }, err => {
        console.log(err);
      });
    });
  }

  onBlurMethod(val: any, type: string) {
    type === 'primaryPhone' ? this.primaryPhoneBlur = this.isBlur(val) :
      type === 'cellPhone' ? this.cellPhoneBlur = this.isBlur(val) : '';
  }

  private isBlur(val: string | any[]) {
    return (val.length === 10) ? false : (val.length === 0) ? false : true;
  }

  async createNewWorkflowForMatter(data) {
    try {
      let res = await this.workflowService.v1WorkFlowGeneratenewPost$Json({ body: data }).toPromise();
    } catch (err) {
    }
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
      item.phones = item.phones.length > 0 ? item.phones[0].number : null
      return item
    })

    if (rows && rows.length > 0) {
      const keys = Object.keys(rows[0]);

      for (let i = 0; i < keys.length; i++) {
        columnList.push({ Name: keys[i], isChecked: true });
      }
    }
    this.exporttocsvService.downloadFile(
      rows,
      columnList,
      'Conflict Check'
    );
  }

  async updateClientDMSAccount() {
    const obj = {
      personId: +this.clientId,
      securityGroupId: 0,
      role: 'client'
    };
    await this.dmsService.v1DmsUpdateDocumentportalPost$Json({ body: obj }).toPromise();
  }

  async checkIfMatterWorkFlowCreated(matterId, data: any) {
    try {
      let res = await this.workflowService.v1WorkFlowVerifyMatterMatterIdGet({ matterId: +matterId }).toPromise();
      let isMatterFlowCreated = JSON.parse(res as any).results.isMatterWorkflowCreated;
      if (!isMatterFlowCreated) {
        await this.createNewWorkflowForMatter(data);
      } else {
      }
    } catch (err) {
    }
  }

  public checkPro(event, index) {
    if (event) {
      event.stopPropagation();
    }

    if (event && event.target.checked) {
      this.matterAssociationList.map((obj) => {
        if (obj.associationType === 'Opposing Party') {
          obj['isOpposingPartyRepresentThemselves'] = true;
        }
      });
    } else {
      this.matterAssociationList.map((obj) => {
        if (obj.associationType === 'Opposing Party') {
          obj['isOpposingPartyRepresentThemselves'] = false;
        }
      });
    }
  }

  public checkOpposingCounciel() {
    let exist = this.matterAssociationList.find(item => item.associationType === 'Opposing Counsel');
    if (exist) {
      this.selectOpposingCouncil = true;
      this.matterAssociationList.map((obj) => {
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
    let data = this.setFilterAttorneySearchParams(this.attorneyForm.value.attorneys[index].name);
    if (this.attorneyForm.value.attorneys[index].name.length >= 3) {
      if (this.searchSubscribe) {
        this.searchSubscribe.unsubscribe();
      }
      this.showLoaderDrpDwn[index].display = true;
      this.searchSubscribe = this.officeService.v1OfficeReDesignAttorneysGet(data).pipe(map(UtilsHelper.mapData))
        .subscribe((res) => {
          let selectedIds = [];
          if (this.attorneyForm.value && this.attorneyForm.value.attorneys && this.attorneyForm.value.attorneys.length > 0) {
            selectedIds = this.attorneyForm.value.attorneys.map(item => item.id);
          }
          if(!selectedIds[index]) {
            res = res.filter(item => selectedIds.indexOf(item.id) === -1);
          }
          this.attorneyList = res;
          this.showLoaderDrpDwn[index].display = false;
          this.displayDrpDwn[index].display = true;
        }, (err) => {
          this.showLoaderDrpDwn[index].display = false;
        });
    } else {
      this.showLoaderDrpDwn[index].display = false;
      this.attorneyList = [];
    }
  }

  /**
 *  clears search list dropdown
 */
  clearDropDown(event) {
    if (event && event.target && event.target.className && event.target.className.match('icon-angle-down')) {
    } else {
      this.attorneyList = [];
      this.closeDroDw();
      this.closeLoader();
    }
  }

  public changeState(event, contanent) {
    let data = this.attorneyForm.value;
    let displayWrnPopup: boolean = false;
    let userState = [], diffState = [];
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
      let stateName = (event) ? event.name : '';
      this.changeJurisdictionMatterMsg = `At least one attorney is not licensed to practice in the state where this case has jurisdiction (${stateName}). Do you want to remove or keep these attorneys?`;
      this.openPopup = 'state';
      this.modalService.open(contanent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        windowClass: ''
      }).result.then(result => {
      }, reason => {
        if (reason === 'Cross click') {
          if (diffState) {
            diffState.reverse()
            diffState.map((obj) => {
              this.removeAttorney(obj);
            })
          }
        }
      }
      );
    }
  }

  public selectAttorny(contanent, item, i: number) {
    let userState = [];
    if (item.personStates) {
      userState = item.personStates.split(',');
    }
    userState = userState.map(Number);
    if (this.matterForm.value.juridictionState && userState.indexOf(this.matterForm.value.juridictionState) === -1) {
      let state = this.stateList.find(item => +item.id === +this.matterForm.value.juridictionState);
      let stateName = (state) ? state.name : '';
      this.changeJurisdictionMatterMsg = `${item.name} is not licensed to practice in the state where this case has jurisdiction (${stateName}). Are you sure you want to assign this attorney?`;
      this.openPopup = 'state';
      this.modalService.open(contanent, {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        windowClass: ''
      }).result.then(result => {
      }, reason => {
        if (reason === 'Save click') {
          this.setAttorny(item, i);
        }
      }
      );
    } else {
      this.setAttorny(item, i);
    }
  }

  public setAttorny(item, i: number, init: boolean = null, type: string = "") {
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
        if(!init){
          obj.doNotSchedule = item.doNotSchedule;
        }
        obj.officeAssociation = this.getOfficeAssociation(obj);
        if (init && type === "responsible") {
          obj.IsResponsibleAttorney = true;
        }
        if (init && type === "originating") {
          obj.IsOriginatingAttorney = true;
        }
        if (init && type === "billing") {
          obj.IsBillingAttorney = true;
        }
        if(!init && item.doNotSchedule){
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
    if (this.matterForm.value.initialConsultLawOffice) {
      let otherOffice = [];
      if (item.secondaryOffices) {
        otherOffice = item.secondaryOffices.split(',');
        otherOffice = otherOffice.map(Number);
      }
      if (item.primaryOfficeId == this.matterForm.value.initialConsultLawOffice) {
        return 'Primary Office';
      } else if (otherOffice.indexOf(+this.matterForm.value.initialConsultLawOffice) > -1) {
        return 'Other Office';
      } else {
        return 'Not in Office';
      }
    } else {
      return '';
    }
  }

  public checkAttorny(event, index, key) {
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

  public advanceAttorneySearch(contanent: any, i: number) {
    let modal = this.modalService.open(AttorneySearchComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-xlg'
    });

    let component = modal.componentInstance;
    component.attorneyForm = this.attorneyForm;
    component.data = this.setFilterParams(null);;

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

      if (element.IsBillingAttorney === false && element.IsOriginatingAttorney === false && element.IsResponsibleAttorney === false && element.name !== '') {
        this.isSelectedEachError = true;
      }
    });

    if (IsBillingAttorneyCount.length === 0 &&
      IsOriginatingAttorneyCount.length === 0 &&
      IsResponsibleAttorneyCount.length === 0) {
      this.blankError = true;
    }
    if (IsBillingAttorneyCount.length !== 1 ||
      IsOriginatingAttorneyCount.length !== 1 ||
      IsResponsibleAttorneyCount.length !== 1) {
      this.duplicate = true;
    }

    /* Corporate client validation */
    if (this.clientType == 'company') {
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
        this.corporateError = !(isPrimary.length === 1 && isBilling.length === 1);
      } else {
        this.corporateError = true;
      }
    }
    // if (IsBillingAttorneyCount.length === 1 &&
    //   IsOriginatingAttorneyCount.length === 1 &&
    //   IsResponsibleAttorneyCount.length === 1
    // ) {
    //   this.isSelectedEachError = false;
    // }

    return (this.matterForm.invalid || this.isSelectedEachError || this.duplicate || this.blankError || this.corporateError) ? true : false;
  }

  public removeBlankAttorney() {
    let data = this.attorneyForm.value;
    let i = (data && data.attorneys) ? data.attorneys.length - 1 : 0;
    let isResponsible: boolean = false;
    let isBillling: boolean = false;
    let isOriginating: boolean = false;
    let motselectRole: boolean = false;
    if (data && data.attorneys && data.attorneys.length > 0) {
      isOriginating = data.attorneys.some(item => item.IsOriginatingAttorney);
      isResponsible = data.attorneys.some(item => item.IsResponsibleAttorney);
      isBillling = data.attorneys.some(item => item.IsBillingAttorney);
      motselectRole = data.attorneys.some(element => (element.IsBillingAttorney === false && element.IsOriginatingAttorney === false && element.IsResponsibleAttorney === false));
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

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj['uniqueNumber']|| obj : index ;
  }
}
