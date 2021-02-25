import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IOffice, Page, vwAssociationTypes, vwMatterResponse } from 'src/app/modules/models';
import * as Constant from 'src/app/modules/shared/const';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwIdName, vwMatterBasics } from 'src/common/swagger-providers/models';
import { MatterService, MiscService, OfficeService, PersonService } from 'src/common/swagger-providers/services';
import * as errors from '../../../shared/error.json';
import { AttorneySearchComponent } from '../../new-matter-wizard/matter-details/attorney-search/attorney-search.component';

interface AttorneyErrors {
  blankError: boolean;
  duplicate: boolean;
  isSelectedEachError: boolean;
}

@Component({
  selector: 'app-re-assign',
  templateUrl: './re-assign.component.html',
  styleUrls: ['./re-assign.component.scss']
})

export class ReAssignComponent implements OnInit, IBackButtonGuard, OnDestroy {
  matterId: number;
  matterDetails: any;
  officeList: Array<vwIdName>;

  error_data = (errors as any).default;

  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selectedAttorny: Array<number> = [];
  public pangeSelected = 1;
  public counter = Array;
  public sameAsResponsible = true;
  public pageb = new Page();
  public pageSelectorb = new FormControl('10');
  public pangeSelectedb = 1;

  public oriArrAttorny: Array<any> = [];
  public attorneyList: Array<any> = [];

  public oriArrBillingAttorny = [];
  public attorneyListb: Array<any> = [];
  public clientAssociates: Array<any> = [];

  public responsibelAttorneyId: number;
  public billingAttorneyId: number;
  public primaryOfficeId: number;

  public originatingAttorneyList: Array<any> = [];
  public originatingAttorneyId: number;

  searchAttorneyControl = new FormControl();
  searchBillingAttorneyControl = new FormControl();

  responsibleAttorneyType: vwAssociationTypes;
  billingAttorneyType: vwAssociationTypes;

  public practiceList: Array<IOffice> = [];
  public selectedPracticeArea: any;
  public practiceAreaSelected: boolean = false;
  public matterTypes: Array<IOffice> = [];

  public matterType: any;
  public practiceArea: any;
  public lastSelectedPracticeArea: any;
  private slectedAttPracticeStateInfo: any;
  public permissionList: any = {};

  public reassignAttorney = false;
  public loading = true;
  public raLoading = true;
  public baLoading: boolean;
  public mainLoader: boolean = false;
  public isAdminPermission: boolean = false;
  public isMatterAttorney:boolean = false;


  public warning_msg: string;
  public att_error_msg: string;
  public att_select_msg: string;

  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  public detailsLoading: boolean = true;

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public jurisdictionStateId: number;
  public jurisdictionCounty: string = null;
  public jurisdictionStateList: Array<any> = [];
  public isError: boolean = false;

  public userInfo = UtilsHelper.getLoginUser();
  attorneys: FormArray;
  public attorneyForm: FormGroup = this.fb.group({
    attorneys: new FormArray([], Validators.required)
  });
  public displayDrpDwn: Array<{ display: boolean }> = [{ display: false }, { display: false }, { display: false }];
  public showLoaderDrpDwn: Array<{ display: boolean }> = [
    { display: false },
    { display: false },
    { display: false },
  ];
  public attorneyLoading = false;
  public searchSubscribe: Subscription;
  public changeJurisdictionMatterMsg: string;
  public openPopup: string = 'state';
  public isSelectedEachError: Boolean = false;
  public blankError: Boolean = false;
  public duplicate: Boolean = false;
  public corporateError: Boolean = false;
  public attErrors: AttorneyErrors;
  public formSubmitted: boolean = false;
  public matterTypeLoad = false;

  constructor(
    private miscService: MiscService,
    private matterService: MatterService,
    private route: ActivatedRoute,
    private toastr: ToastDisplay,
    private modalService: NgbModal,
    private router: Router,
    private officeService: OfficeService,
    private appConfig: AppConfigService,
    private pagetitle: Title,
    private store: Store<fromRoot.AppState>,
    private personService: PersonService,
    private fb: FormBuilder,
    private el: ElementRef
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;

    this.pageb.pageNumber = 0;
    this.pageb.size = 10;

    this.officeList = [];

    this.responsibelAttorneyId = 0;
    this.billingAttorneyId = 0;


    router.events.subscribe(val => {
      if (val instanceof NavigationStart === true) {
        this.navigateAwayPressed = true;
      }
    });

    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.getState();
    this.warning_msg = this.error_data.change_practice_area_warning_matter_reassign;
    this.att_error_msg = this.error_data.no_attorney;
    this.att_select_msg = this.error_data.select_attorney;
    this.route.queryParams.subscribe(params => {
      const matterId = params['matterId'];
      this.matterId = +matterId;

      if (matterId > 0) {
        this.getMatterDetails();
      } else {
        this.toastr.showError('Please select a matter');
      }
    });

    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas
          if (obj.datas.MATTER_MANAGEMENTisAdmin) {
            this.isAdminPermission = true;
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if(this.permissionSubscribe){
      this.permissionSubscribe.unsubscribe();
    }
  }

  get getAttorneyForm() {

  	for(let i = 0 , len = this.attorneyForm.get('attorneys')['controls'].length ; i < len ; i++) {
      this.attorneyForm.get('attorneys')['controls'][i]['showRemoveIconFlag'] = this.showRemoveIcon(i);
    }
    return this.attorneyForm.get('attorneys');
  }

  private getMatterDetails() {
    this.mainLoader = true;
    this.matterService
      .v1MatterMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwMatterResponse;
        }),
        finalize(() => {
          this.getAttorneyTypes();
          this.getAttorneyDtls();
          this.mainLoader = false;
          this.detailsLoading = false;
        })
      )
      .subscribe(
        res => {
          if (res) {

            let pageVisible = false;
            if(this.permissionList.MATTER_MANAGEMENTisAdmin || this.permissionList.MATTER_MANAGEMENTisEdit || (res.billingAttorney && res.billingAttorney.some(att=> att.id == this.userInfo.id)) || (res.responsibleAttorney && res.responsibleAttorney.some(att=> att.id == this.userInfo.id))){
              pageVisible = true;
            }
            if(!pageVisible){
              this.showPermissionError();
              return;
            }
            this.matterDetails = res;
            this.getPractices();
            this.getAssociateType();
            this.pagetitle.setTitle(
              'Reassign Matter - ' + this.matterDetails.matterName
            );
            if(this.matterDetails && this.matterDetails.originatingAttorney && this.matterDetails.originatingAttorney.length){
              let attorney = this.matterDetails.originatingAttorney[0];
              this.originatingAttorneyId = attorney.id;
            }
            this.primaryOfficeId = this.matterDetails.matterPrimaryOffice ? this.matterDetails.matterPrimaryOffice.id : null;
            if (
              this.matterDetails.practiceArea &&
              this.matterDetails.practiceArea.length > 0
            ) {
              this.lastSelectedPracticeArea = this.matterDetails.practiceArea[0];
              this.practiceArea = this.lastSelectedPracticeArea.id;
              this.getMatterType(this.lastSelectedPracticeArea);
              this.getOfficesByPracticeArea(this.lastSelectedPracticeArea);
            } else {
              this.getOffices();
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
          }
        },
        err => {
          this.loading = false;
        }
      );
  }

  public getPractices() {
    this.miscService.v1MiscPracticesGet$Response({}).subscribe(
      suc => {
        this.practiceList = JSON.parse(suc.body as any).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  public getMatterType(e) {
    if (e) {
      this.matterTypes = [];
      this.matterTypeLoad = true;
      this.matterService
        .v1MatterTypesPracticeIdGet({ practiceId: e.id })
        .subscribe(
          suc => {
            const res: any = suc;
            this.matterTypes = JSON.parse(res).results;
            if(this.matterTypes.length == 1){
              this.matterType = this.matterTypes[0].id
          }
            this.practiceAreaSelected = true;
            this.matterTypeLoad = false;
          },
          err => {
            console.log(err);
            this.loading = false;
            this.matterTypeLoad = false;
          }
        );
    } else {
      this.practiceAreaSelected = false;
      this.matterTypes = [];
      this.loading = false;
    }
  }

  public clearMatterType() {
    this.matterType = null;
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
    this.practiceArea = this.lastSelectedPracticeArea
      ? this.lastSelectedPracticeArea.id
      : null;
    this.selectedPracticeArea = this.lastSelectedPracticeArea;
  }


  private getOffices() {
    this.miscService
      .v1MiscOfficesGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwIdName>;
        }),
        finalize(() => {})
      )
      .subscribe(res => {
        this.officeList = res;
        this.loading = false;
      });
  }

  private getOfficesByPracticeArea(practiceArea) {
    const data: any = {
      practiceId: practiceArea.id
    };
    this.miscService
      .v1MiscJurisdictionOfficesPracticeIdGet(data)
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwIdName>;
        }),
        finalize(() => {})
      )
      .subscribe(res => {
        this.officeList = res;
        const office = this.officeList.filter(
          office => office.id === this.primaryOfficeId
        );
        if (office.length === 0) {
          this.primaryOfficeId = null;
        }
        this.loading = false;
      });
  }

  private getAttorneyTypes() {
    forkJoin([
      this.matterService.v1MatterBillingattorneyAssociationsListGet(),
      this.matterService.v1MatterResponsibleattorneyAssociationsListGet()
    ])
      .pipe(
        map(res => {
          return {
            Billingattorney: JSON.parse(res[0] as any).results,
            Responsibleattorney: JSON.parse(res[1] as any).results
          };
        }),
        finalize(() => {})
      )
      .subscribe(res => {
        this.responsibleAttorneyType = res.Responsibleattorney[0];
        this.billingAttorneyType = res.Billingattorney[0];
      });
  }



  public officeChange() {
    if(this.primaryOfficeId){
    let data = this.attorneyForm.value;
    data.attorneys.map((obj, index) => {
      obj.officeAssociation = this.getOfficeAssociation(obj);
    });
    this.attorneyForm.patchValue(data);
    }
  }


  async reassign(attorneySelectionWarningTemplate) {
    this.dataEntered = false;
    this.formSubmitted = true;
    if(this.isValuesNotValid()) {
      this.isError = true;
      return;
    }
    if (this.attorneyForm.invalid) {
      return;
    }
    if (this.matterDetails) {
      this.attErrors = {
        isSelectedEachError: false,
        duplicate: false,
        blankError: false
      };
        let IsBillingAttorneyCount = [];
        let IsOriginatingAttorneyCount = [];
        let IsResponsibleAttorneyCount = [];

        let attorneys = this.isAdminPermission ? this.attorneyForm.value.attorneys : (this.attorneyForm.controls['attorneys'] as FormGroup).getRawValue();
        attorneys.forEach((element, index) => {
          if(element.id){
            if (element.IsBillingAttorney) {
              IsBillingAttorneyCount.push(element.IsBillingAttorney);
            }
            if (element.IsOriginatingAttorney) {
              IsOriginatingAttorneyCount.push(element.IsOriginatingAttorney);
            }
            if (element.IsResponsibleAttorney) {
              IsResponsibleAttorneyCount.push(element.IsResponsibleAttorney);
            }

            if (element.IsBillingAttorney === false && element.IsOriginatingAttorney === false && element.IsResponsibleAttorney === false) {
              this.attErrors.isSelectedEachError = true;
            }
          }
        });

        if (IsBillingAttorneyCount.length === 0 &&
          IsOriginatingAttorneyCount.length === 0 &&
          IsResponsibleAttorneyCount.length === 0) {
            this.attErrors.blankError = true;
          }
        if (IsBillingAttorneyCount.length !== 1 ||
          IsOriginatingAttorneyCount.length !== 1 ||
          IsResponsibleAttorneyCount.length !== 1) {
            this.attErrors.duplicate = true;
        }
      if(Object.values(this.attErrors).some(obj => obj)){
        return;
      }else{
        await this.saveAttorneyDetails();
        this.saveMatterOffice();
      }

    }
  }



  private saveMatterOffice() {
    const matterOffice = this.officeList.find(
      a => a.id === this.primaryOfficeId
    );

    const data: vwMatterBasics = {
      id: this.matterDetails.id,
      name: this.matterDetails.matterName,
      clientId: this.matterDetails.clientName
        ? this.matterDetails.clientName.id
        : null,
      matterTypeId: this.matterType,
      officeId: matterOffice ? matterOffice.id : null,
      openDate: this.matterDetails.matterOpenDate,
      contingentCase: this.matterDetails.isContingentCase,
      isPlaintiff: this.matterDetails.isPlainTiff,
      jurisdictionStateId: this.jurisdictionStateId,
      jurisdictionCounty: this.jurisdictionCounty
    };

    if (this.practiceArea && this.practiceArea != '') {
      let data: any = {
        matterId: this.matterId,
        practiceId: this.practiceArea
      };

      this.matterService
        .v1MatterPracticesAssociateMatterIdPracticeIdPost$Response(data)
        .subscribe(() => {});
    }
    this.matterService
      .v1MatterBasicsPut$Json({
        body: data
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          if (res > 0) {
            this.toastr.showSuccess(this.error_data.edit_matter_success);
            this.router.navigate(['/matter/dashboard'], {
              queryParams: {
                matterId: this.matterId
              }
            });
          } else {
            this.toastr.showError(this.error_data.server_error);
          }
        },
        () => {}
      );
  }

  changeMatterType() {
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

  originatingAttorneyChange(event){

  }

  async saveAttorneyDetails(){
    let selectedAttorneys = this.isAdminPermission ?  this.attorneyForm.value.attorneys : (this.attorneyForm.controls['attorneys'] as FormGroup).getRawValue();
      let originatingAttorney = {
        oldId: (this.matterDetails.originatingAttorney.length) ? this.matterDetails.originatingAttorney[0].id : 0,
        newId: (selectedAttorneys.find(obj => obj.IsOriginatingAttorney)).id
      }
      let responsibelAttorney = {
        oldId: (this.matterDetails.responsibleAttorney.length) ? this.matterDetails.responsibleAttorney[0].id : 0,
        newId: (selectedAttorneys.find(obj => obj.IsResponsibleAttorney)).id
      }
      let billingAttorney = {
        oldId: (this.matterDetails.billingAttorney.length) ? this.matterDetails.billingAttorney[0].id : 0,
        newId: (selectedAttorneys.find(obj => obj.IsBillingAttorney)).id
      }

      if(originatingAttorney.oldId != originatingAttorney.newId){
        let originatingAttorneyType = (this.clientAssociates.find(obj => obj.name === 'Originating Attorney')).id;
        if(originatingAttorney.oldId){
          await this.dis_associateAttorney(originatingAttorney.oldId, originatingAttorneyType, 'disassociate');
        }
        await this.dis_associateAttorney(originatingAttorney.newId, originatingAttorneyType, 'associate');
      }

      if(responsibelAttorney.oldId != responsibelAttorney.newId){
        let responsibelAttorneyType = (this.clientAssociates.find(obj => obj.name === 'Responsible Attorney')).id;
        if(responsibelAttorney.oldId){
          await this.dis_associateAttorney(responsibelAttorney.oldId, responsibelAttorneyType, 'disassociate');
        }
        await this.dis_associateAttorney(responsibelAttorney.newId, responsibelAttorneyType, 'associate');
      }
      if(billingAttorney.oldId != billingAttorney.newId){
        let originatingAttorneyType = (this.clientAssociates.find(obj => obj.name === 'Billing Attorney')).id;
        if(billingAttorney.oldId){
          await this.dis_associateAttorney(billingAttorney.oldId, originatingAttorneyType, 'disassociate');
        }
        await this.dis_associateAttorney(billingAttorney.newId, originatingAttorneyType, 'associate');
      }
  }

  async dis_associateAttorney(personId: number, typeId: number, operation: string){
    this.mainLoader= true;
    let data = {
      personId,
      matterId: this.matterId,
      associationTypeId: typeId
    }
    try{
      let resp: any;
      switch(operation){
        case 'disassociate':
          resp = await this.matterService.v1MatterPersonDisassociateDelete$Json({body: data}).toPromise();
          break;
        case 'associate':
          resp = await this.matterService.v1MatterPersonAssociatePost$Json({body: data}).toPromise();
          break;
      }
      resp = JSON.parse(resp as any).results;
      this.mainLoader = false;
    } catch(err) {
      this.mainLoader = false;
    }
  }


  /**
   * function to get association type
   */
  private getAssociateType(): void {
    this.miscService.v1MiscClientassociationtypeGet$Response({}).subscribe(
      res => {
        const clientAssociates: any = JSON.parse(res.body as any).results;
        if (clientAssociates && clientAssociates.length > 0) {
          this.clientAssociates = clientAssociates;
        }
      }
    );
  }

  /******** Getting State List ******/
  public getState() {
    this.miscService.v1MiscStatesGet$Response({})
      .subscribe( resp => {
        const res: any = resp;
        this.jurisdictionStateList = JSON.parse(res.body).results;
      }
    );
  }

  getStateName(id?){
    let state: any = this.jurisdictionStateList.filter(obj => obj.id == this.jurisdictionStateId);
    state = state[0];
    return state.name;
  }


  showPermissionError() {
    UtilsHelper.setObject('access-denied', 'TRue');
    this.router.navigate(['/access-denied']);
  }

  createAttorney(action: string = 'create'): void {
    this.attorneys = this.attorneyForm.get('attorneys') as FormArray;
    let attorney = this.attorney();
    if(!this.isAdminPermission){
      attorney.controls['IsOriginatingAttorney'].disable();
    }
    this.attorneys.push(attorney);
    if (action === 'create') {
      this.setAttornyRole();
    }

    setTimeout(() => {
      const searchAttorney = this.el.nativeElement.querySelector(`#searchAttorney-${this.attorneys.length - 1}`);
      if (searchAttorney) {
        searchAttorney.focus();
      }
    }, 1000);
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
          obj.IsOriginatingAttorney = (this.isAdminPermission) ? true : false;
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
    let attorney = this.isAdminPermission ? this.attorneys.value[i] : this.attorneys.getRawValue()[i];
    if(!this.isAdminPermission && attorney.IsOriginatingAttorney){
      return;
    }
    this.attorneys.removeAt(i);

    setTimeout(() => {
      const searchAttorney = this.el.nativeElement.querySelector(`#searchAttorney-${this.attorneys.length - 1}`);
      if (searchAttorney) {
        searchAttorney.focus();
      }
    }, 1000);
  }

  attorney(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      IsOriginatingAttorney: [false, ],
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

  public getAttorneyDtls() {
    let isSet: number = 0;
    new Promise((resolve, reject) => {
      if (this.matterDetails && this.matterDetails.originatingAttorney && this.matterDetails.originatingAttorney.length > 0) {
        this.attorneyLoading = true;
        this.officeService.v1OfficeReDesignAttorneysGet({ id: this.matterDetails.originatingAttorney[0].id })
          .pipe(map(UtilsHelper.mapData))
          .subscribe((res) => {
            if (res && res.length > 0) {
              this.createAttorney('init');
              resolve(this.setAttorny(res[0], isSet, true, 'originating'));
              isSet = isSet + 1;
            }
            this.attorneyLoading = false;
          }, (err) => {
            this.attorneyLoading = false;
            resolve(true);
           });
      }
    }).then(() => {
      if (this.matterDetails && this.matterDetails.responsibleAttorney && this.matterDetails.responsibleAttorney.length > 0) {
        let data = this.attorneyForm.value;
        if (data.attorneys.some(obj => obj.id == this.matterDetails.responsibleAttorney[0].id)){
          data.attorneys.map(att => {
            if(att.id == this.matterDetails.responsibleAttorney[0].id){
              att.IsResponsibleAttorney = true;
            }
          });
          this.attorneyForm.patchValue(data);
          return true;
        } else {
        this.attorneyLoading = true;
        this.officeService.v1OfficeReDesignAttorneysGet({ id: this.matterDetails.responsibleAttorney[0].id })
          .pipe(map(UtilsHelper.mapData))
          .subscribe((res) => {
            if (res && res.length > 0) {
              this.createAttorney('init');
              this.setAttorny(res[0], isSet, true, 'responsible');
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
      if (this.matterDetails && this.matterDetails.billingAttorney && this.matterDetails.billingAttorney.length > 0) {
        let data = this.attorneyForm.value;
        if (data.attorneys.some(obj => obj.id == this.matterDetails.billingAttorney[0].id)){
          data.attorneys.map(att => {
            if(att.id == this.matterDetails.billingAttorney[0].id){
              att.IsBillingAttorney = true;
            }
          });
          this.attorneyForm.patchValue(data);
        } else {
        this.attorneyLoading = true;
        this.officeService.v1OfficeReDesignAttorneysGet({ id: this.matterDetails.billingAttorney[0].id})
          .pipe(map(UtilsHelper.mapData))
          .subscribe((res) => {
            if (res && res.length > 0) {
              let data = this.attorneyForm.value;
              if (data.attorneys.some(obj => obj.id == this.matterDetails.billingAttorney[0].id)) {
                data.attorneys.map(att => {
                  if (att.id == this.matterDetails.billingAttorney[0].id) {
                    att.IsBillingAttorney = true;
                  }
                });
                this.attorneyForm.patchValue(data);
              } else {
                this.createAttorney('init');
                this.setAttorny(res[0], isSet, true, 'billing');
                isSet = isSet + 1;
              }
            }
            this.attorneyLoading = false;
          }, (err) => {
            this.attorneyLoading = false;
          });
        }
      }
    });
  }

  clearDropDown(event) {
    if (event && event.target && event.target.className && event.target.className.match('icon-angle-down')) {
    } else {
      this.closeLoader();
      this.closeDroDw();
    }
  }

  private closeDroDw() {
    this.displayDrpDwn.map((obj) => {
      obj.display = false;
    });
  }
  private closeLoader() {
    this.showLoaderDrpDwn.map((obj) => {
      obj.display = false;
    });
  }
  public setAttorny(item, i: number, init: boolean = null, type: string = "") {
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
        if(!init && obj.doNotSchedule){
          obj.IsBillingAttorney = false;
          obj.IsResponsibleAttorney = false;
        }
      }
    });
    this.attorneyForm.patchValue(data);
    if (init && type === "originating") {
      if (!this.isAdminPermission) {
        let aform = this.attorneyForm.get('attorneys');
        if (aform && aform['controls'] && aform['controls'].length > 0) {
          aform['controls'][0].controls['name'].disable();
        }
      }
    }
    this.attorneyList = [];
    this.closeLoader();
    this.closeDroDw();
  }

  public getOfficeAssociation(item) {
    if (this.primaryOfficeId) {
      let otherOffice = [];
      if (item.secondaryOffices) {
        otherOffice = item.secondaryOffices.split(',');
        otherOffice = otherOffice.map(Number);
      }
      if (item.primaryOfficeId == this.primaryOfficeId) {
        return 'Primary Office';
      } else if (otherOffice.indexOf(+this.primaryOfficeId) > -1) {
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

  setFilterAttorneySearchParams(text: any) {
    const param = {
      search: text,
      officeId: +this.primaryOfficeId
    };

    if (this.practiceArea) {
      param['practiceId'] = +this.practiceArea;
    }

    return param;
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

  setFilterParams(text: any) {
    const param = {
      search: text,
      officeId: +this.primaryOfficeId
    };

    if (this.practiceArea) {
      param['practiceId'] = +this.practiceArea;
    }

    if (this.jurisdictionStateId) {
      param['stateId'] = +this.jurisdictionStateId;
    }
    return param;
  }

  public selectAttorny(contanent, item, i: number) {
    let userState = [];
    if (item.personStates) {
      userState = item.personStates.split(',');
    }
    userState = userState.map(Number);
    if (this.jurisdictionStateId && userState.indexOf(this.jurisdictionStateId) === -1) {
      let state = this.jurisdictionStateList.find(item => +item.id === +this.jurisdictionStateId);
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
      this.openPopup = 'employee change';
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

  changePracticeArea(value, contanent) {
    this.lastSelectedPracticeArea = this.selectedPracticeArea ? this.selectedPracticeArea : this.lastSelectedPracticeArea;
    this.selectedPracticeArea = value ? value : '';
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
        if (reason === 'Cross click') {// right button
          if (diffPRaciceArea) {
            diffPRaciceArea.reverse()
            diffPRaciceArea.map((obj) => {
              this.removeAttorney(obj);
            });
          }
          this.getOfficesByPracticeArea({id: this.practiceArea});
          this.matterType = null;
          this.getMatterType(this.selectedPracticeArea);
        }
        if (reason === 'Save click') {//left button
          this.cancelChangePracticeArea();
        }
      }
      );
    } else {
      this.matterType = null;
      this.getMatterType(this.selectedPracticeArea);
      this.getOfficesByPracticeArea({id: this.practiceArea});
    }
  }

  isValuesNotValid(){
    return (!this.jurisdictionStateId || !this.practiceArea || !this.matterType || (this.jurisdictionCounty.trim() == '') || (this.jurisdictionCounty == null) ||  !this.primaryOfficeId);
  }

  showRemoveIcon(index){
    let selectedAttorneys = this.isAdminPermission ?  this.attorneyForm.value.attorneys : (this.attorneyForm.controls['attorneys'] as FormGroup).getRawValue();
    if(!this.isAdminPermission && selectedAttorneys[index].IsOriginatingAttorney){
      return false;
    }
    return true;
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
