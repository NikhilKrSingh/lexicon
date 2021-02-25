import { Component, ElementRef, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { forkJoin, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwClient } from 'src/common/swagger-providers/models';
import { ClientService, OfficeService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../../store';
import * as errorData from '../../../shared/error.json';
import { ClientAttorneySearchComponent } from '../../creating/matter-details/attorney-search/attorney-search.component';

interface AttorneyErrors {
  blankError: boolean;
  duplicate: boolean;
  isSelectedEachError: boolean;
}

@Component({
  selector: 'app-reassign-client',
  templateUrl: './reassign-client.component.html',
  styleUrls: ['./reassign-client.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ReassignClientComponent implements OnInit, OnDestroy {
  client: vwClient;
  public errorData: any = (errorData as any).default;
  public stateList: Array<any> = [];
  public consultationLawOfficeList: Array<any> = [];
  public primaryLawOfficeList: Array<any> = [];
  public attorneyList: Array<any> = [];
  public attorneyLoading: boolean = false;
  clientId: number;
  public res_att_warn_msg: string;
  public permissionList: any;
  public permissionList$: any;
  public MatterForm: FormGroup = this.builder.group({
    officeId: new FormControl(null, [Validators.required]),
    primaryOffice: new FormControl(null, [Validators.required]),
    changeNotes: new FormControl(null)
  });
  private permissionSubscribe: Subscription;
  public editLawInfoLoading: boolean;
  public attorneyForm: FormGroup = this.builder.group({
    attorneys: new FormArray([], Validators.required)
  });
  attorneys: FormArray;
  public displayDrpDwn: Array<{ display: boolean }> = [{ display: false }, { display: false }, { display: false }];
  public showLoaderDrpDwn: Array<{ display: boolean }> = [
    { display: false },
    { display: false },
    { display: false },
  ];
  public searchSubscribe: Subscription;
  public isAdminPermission: boolean = false;
  public formSubmitted: boolean = false;
  public attErrors: AttorneyErrors;

  constructor(
    private builder: FormBuilder,
    private officeService: OfficeService,
    private toastDisplay: ToastDisplay,
    private activateRoute: ActivatedRoute,
    private clientService: ClientService,
    private pagetitle: Title,
    private modalService: NgbModal,
    private router: Router,
    private store: Store<fromRoot.AppState>,
    private el: ElementRef
  ) {
    this.activateRoute.queryParams.subscribe(params => {
      this.clientId = params.clientId;
    });
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.pagetitle.setTitle('Reassign Client')
    this.editLawInfoLoading = true;
    this.attorneyLoading = true;
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (obj.datas.CLIENT_CONTACT_MANAGEMENTisAdmin) {
            this.isAdminPermission = true;
          }
        }
      }
    });
    this.res_att_warn_msg = this.errorData.change_res_att_warning;
    this.getOfficesList();
    this.activateRoute.queryParams.subscribe((params) => {
      this.clientId = +params.clientId;
      if (this.clientId) {
        this.getClientDetails();
      }
    });
  }

  get getAttorneyLength() {
    return this.attorneyForm.get('attorneys')['controls'].length >= 3;
  }

  get getAttorneyForm() {
    const attorneys = this.attorneyForm.get('attorneys');
    for(let i = 0 , len = attorneys['controls'].length ; i < len ; i++) {
      attorneys['controls'][i]['showRemoveIcon'] = this.showRemoveIcon(i);
    }
    return attorneys;
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  public updateClientInfo() {
    this.formSubmitted = true;
    if (this.MatterForm.invalid) {
      return;
    }
    if (this.attorneyForm.invalid) {
      return;
    }
    this.attErrors = {
      isSelectedEachError: false,
      duplicate: false,
      blankError: false
    };
    let IsBillingAttorneyCount = [];
    let IsOriginatingAttorneyCount = [];
    let IsResponsibleAttorneyCount = [];
    let isBillingAttorneyId = null;
    let isOriginatingAttorneyId = null;
    let isResponsibleAttorneyId = null;

    let attorneys = this.isAdminPermission ? this.attorneyForm.value.attorneys : (this.attorneyForm.controls['attorneys'] as FormGroup).getRawValue();
    attorneys.forEach((element, index) => {
      if (element.id){
        if (element.IsBillingAttorney) {
          IsBillingAttorneyCount.push(element.IsBillingAttorney);
          isBillingAttorneyId = element.id;
        }
        if (element.IsOriginatingAttorney) {
          IsOriginatingAttorneyCount.push(element.IsOriginatingAttorney);
          isOriginatingAttorneyId = element.id;
        }
        if (element.IsResponsibleAttorney) {
          IsResponsibleAttorneyCount.push(element.IsResponsibleAttorney);
          isResponsibleAttorneyId = element.id;
        }

        if (element.IsBillingAttorney === false && element.IsOriginatingAttorney === false && element.IsResponsibleAttorney === false) {
          this.attErrors.isSelectedEachError = true;
        }
      }
    });
    //multiple returns for one error at one time
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
    if (Object.values(this.attErrors).some(obj => obj)) {
      return;
    } else {
      const data = {...this.MatterForm.value};
      const item = JSON.parse(JSON.stringify(this.client));
      item.primaryOffice = {id: data.primaryOffice, name: ''};
      item.consultationLawOffice = {id: data.officeId};
      if (isResponsibleAttorneyId) {
        item.responsibleAttorneys = [];
        item.responsibleAttorneys.push({id: isResponsibleAttorneyId, name: ''});
      }
      if (isBillingAttorneyId) {
        item.billingAttorney = {id: isBillingAttorneyId, name: ''};
      }
      if (isOriginatingAttorneyId) {
        item.originatingAttorney = {id: isOriginatingAttorneyId, name: ''};
      }
      this.updateContact(item);
    }
  }

  public updateContact(item) {
    this.editLawInfoLoading = true;
    this.clientService.v1ClientPost$Json({body: item}).subscribe(response => {
      this.editLawInfoLoading = false;
      const res = JSON.parse(response as any);
      if (res.results === 0) {
        this.toastDisplay.showError(this.errorData.server_error);
      } else {
        this.MatterForm.reset();
        this.toastDisplay.showSuccess('Client Updated.');
        this.nevigate();
      }
    }, err => {
      this.editLawInfoLoading = false;
    });
  }

  nevigate() {
    if (this.client.isCompany) {
      this.router.navigate(['/client-view/corporate'], {
        queryParams: {clientId: this.clientId, state: 'edit'},
      });
    } else {
      this.router.navigate(['/client-view/individual'], {
        queryParams: {clientId: this.clientId, state: 'edit'},
      });
    }
  }

  public getOfficesList() {
    forkJoin([
      this.officeService
      .v1OfficeCompactByTenantGet({checkInitialConsultation: false})
    ])
    .subscribe((response) => {
      const res: any = response[0];

      const listData = JSON.parse(res).results;
      if (listData && listData.length > 0) {
        this.consultationLawOfficeList = listData.filter(item => item.status === 'Active' || item.status === 'Open' && item.acceptsInitialConsultation);
      }
      this.editLawInfoLoading = false;

      this.setConsultationOffice();

      const listData1 = JSON.parse(res).results;
      if (listData1 && listData1.length > 0) {
        this.primaryLawOfficeList = listData1.filter(item => item.status === 'Active' || item.status === 'Open');
      }

      this.editLawInfoLoading = false;
    },
    err => {
      console.log(err);
      this.editLawInfoLoading = false;
    });
  }

  private setConsultationOffice() {
    if (this.client && this.client.consultationLawOffice && this.consultationLawOfficeList && !this.MatterForm.value.officeId) {
      let exist = this.consultationLawOfficeList.find(item => item.id === this.client.consultationLawOffice.id);
      if (exist) {
        this.MatterForm.patchValue({
          officeId: this.client.consultationLawOffice.id
        });
      }
    }
  }

  getClientDetails() {
    this.clientService
      .v1ClientClientIdGet({clientId: this.clientId})
      .subscribe(
        (res) => {
          this.client = JSON.parse(res as any).results;
          this.MatterForm.patchValue({
            primaryOffice: this.client && this.client.primaryOffice ? this.client.primaryOffice.id : null,
            changeNotes: ''
          });
          this.getAttorneyDtls();
          this.setConsultationOffice();
        },
        (err) => {
        }
      );
  }

  public getAttorneyDtls() {
    let isSet: number = 0;
    new Promise((resolve, reject) => {
      if (this.client && this.client.originatingAttorney) {
        this.attorneyLoading = true;
        this.officeService.v1OfficeReDesignAttorneysGet({ id: this.client.originatingAttorney.id })
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
      } else {
        resolve(false);
      }
    }).then(() => {
      if (this.client && this.client.responsibleAttorneys && this.client.responsibleAttorneys.length > 0) {
        let data = this.attorneyForm.value;
        if (data.attorneys.some(obj => obj.id == this.client.responsibleAttorneys[0].id)) {
          data.attorneys.map(att => {
            if (att.id == this.client.responsibleAttorneys[0].id) {
              att.IsResponsibleAttorney = true;
            }
          });
          this.attorneyForm.patchValue(data);
          return true;
        } else {
        this.officeService.v1OfficeReDesignAttorneysGet({ id: this.client.responsibleAttorneys[0].id })
          .pipe(map(UtilsHelper.mapData))
          .subscribe((res) => {
            if (res && res.length > 0) {
              this.createAttorney('init');
              this.setAttorny(res[0], isSet, true, 'responsible');
              isSet = isSet + 1;
            }
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
      if (this.client && this.client.billingAttorney) {
        let data = this.attorneyForm.value;
        if (data.attorneys.some(obj => obj.id == this.client.billingAttorney.id)) {
          data.attorneys.map(att => {
            if (att.id == this.client.billingAttorney.id) {
              att.IsBillingAttorney = true;
            }
          });
          this.attorneyForm.patchValue(data);
        } else {
        this.officeService.v1OfficeReDesignAttorneysGet({ id: this.client.billingAttorney.id})
          .pipe(map(UtilsHelper.mapData))
          .subscribe((res) => {
            if (res && res.length > 0) {
              let data = this.attorneyForm.value;
              if (data.attorneys.some(obj => obj.id == this.client.billingAttorney.id)) {
                data.attorneys.map(att => {
                  if (att.id == this.client.billingAttorney.id) {
                    att.IsBillingAttorney = true;
                  }
                });
                this.attorneyForm.patchValue(data);
              } else {
                this.createAttorney('init');
                this.setAttorny(res[0], isSet, true, 'billing');
              }
              isSet = isSet + 1;
            }
          }, (err) => {
            this.attorneyLoading = false;
          });
        }
      } else {
        this.attorneyLoading = false;
      }
    }).then(() => {
      this.attorneyLoading = false;
    }).catch(() => {
      this.attorneyLoading = false;
    });
  }

  attorney(): FormGroup {
    return this.builder.group({
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
        if(!init && item.doNotSchedule){
          obj.IsResponsibleAttorney = false;
          obj.IsBillingAttorney = false;
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
    if (+this.MatterForm.value.primaryOffice) {
      let otherOffice = [];
      if (item.secondaryOffices) {
        otherOffice = item.secondaryOffices.split(',');
        otherOffice = otherOffice.map(Number);
      }
      if (item.primaryOfficeId == +this.MatterForm.value.primaryOffice) {
        return 'Primary Office';
      } else if (otherOffice.indexOf(+this.MatterForm.value.primaryOffice) > -1) {
        return 'Other Office';
      } else {
        return 'Not in Office';
      }
    } else {
      return '';
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

  createAttorney(action: string = 'create'): void {
    this.attorneys = this.attorneyForm.get('attorneys') as FormArray;
    let attorney = this.attorney();
    if (!this.isAdminPermission) {
      attorney.controls['IsOriginatingAttorney'].disable();
    }
    this.attorneys.push(attorney);
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

  setFilterAttorneySearchParams(text: any) {
    const param = {
      search: text,
      officeId: +this.MatterForm.value.primaryOffice
    };
    return param;
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


  public advanceAttorneySearch(i: number) {
    let modal = this.modalService.open(ClientAttorneySearchComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-xlg'
    });

    let component = modal.componentInstance;
    component.attorneyForm = this.attorneyForm;
    component.pageType = 'clientreassign';
    component.data = this.setFilterAttorneySearchParams(null);;

    modal.result.then(res => {
      if (res) {
        this.selectAttorny(res, i);
      }
    });
  }

  public selectAttorny(item, i: number) {
    let userState = [];
    if (item.personStates) {
      userState = item.personStates.split(',');
    }
    userState = userState.map(Number);
    this.setAttorny(item, i);

  }

  showRemoveIcon(index){
    let selectedAttorneys = this.isAdminPermission ?  this.attorneyForm.value.attorneys : (this.attorneyForm.controls['attorneys'] as FormGroup).getRawValue();
    if(!this.isAdminPermission && selectedAttorneys[index].IsOriginatingAttorney){
      return false;
    }
    return true;
  }

  primaryOfficeChanged() {
    let data = this.attorneyForm.value;
    data.attorneys.map((obj, index) => {
      obj.officeAssociation = this.getOfficeAssociation(obj);
    });
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

}
