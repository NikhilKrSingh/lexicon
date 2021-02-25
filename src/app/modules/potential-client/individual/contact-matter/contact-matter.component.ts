import { Component, EventEmitter, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IOffice, vwConflictPerson } from 'src/app/modules/models';
import { ConflictCheckDialogComponent } from 'src/app/modules/shared/conflict-check-dialog/conflict-check-dialog.component';
import * as Constant from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { MatterAssociationService } from 'src/app/service/matter-association.service';
import { PCConflictCheckRequest, vwMatterAssociation } from 'src/common/swagger-providers/models';
import { ClientService, ContactsService, MatterService, MiscService, OfficeService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../shared/error.json';

@Component({
  selector: 'app-contact-matter',
  templateUrl: './contact-matter.component.html',
  styleUrls: ['./contact-matter.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ContactMatterComponent implements OnInit {
  @Output() readonly nextStep = new EventEmitter<{ next?: string; current?: string }>();
  @Output() readonly prevStep = new EventEmitter<string>();

  public stateList: Array<any> = [];
  public consultationLawOfficeList: Array<any> = [];
  public practiceAreaList: Array<any> = [];
  public matterTypeList: Array<any> = [];
  public countryList: Array<any> = [];
  public statusList: Array<any> = [];
  public matterDetails: any;
  public contactDetails: any;
  public matterId: number;
  public opposingPartyList: Array<any> = [];
  public opposingCounselList: Array<any> = [];
  public expertWitnessList: Array<any> = [];
  public addOpposingParty: boolean = false;
  public addOpposingPartyMode: string = 'create';
  public selectedOpposingParty: any;
  public addExpertWitness: boolean = false;
  public addExpertWitnessMode: string = 'create';
  public selectedExpertWitness: any;
  public addOpposingCouncel: boolean = false;
  public addOpposingCouncelMode: string = 'create';
  public selectedOpposingCounsel: any;
  public addVendor: boolean = false;
  public addVendorMode: string = 'create';
  public addSubsidiary: boolean = false;
  public addSubsidiaryMode: string = 'create';
  public associateOpposingParty: IOffice;
  public clientAssociates: Array<IOffice> = [];
  public associateOpposingCouncil: IOffice;
  public associateExpertWitness: IOffice;
  public errorData: any = (errorData as any).default;
  public opposingPartyRepresentingThemselves: boolean = true;
  public officeId = new FormControl(null, [Validators.required]);
  public matterTypeId = new FormControl(null, [Validators.required]);
  public jurisdictionId = new FormControl(null);
  public MatterForm: FormGroup = this.builder.group({
    officeId: this.officeId,
    matterTypeId: this.matterTypeId,
    jurisdictionId: this.jurisdictionId,
    practiceId: null,
    jurisdictionCounty: null
  });
  public associateVendor: IOffice;
  public selectedVendor: any;
  public associateSubsidiary: IOffice;
  public selectedSubsidiary: any;
  public vendorList: Array<any> = [];
  public subsidiaryList: Array<any> = [];
  public runConflicts: boolean = false;
  public conflictArr: Array<vwConflictPerson> = [];
  public blockedPersonsArr: Array<any> = [];
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public displayCpnflict: boolean = false;
  public contactId: number;
  public addToDb: boolean = false;
  public estatePlanningPracticeAreaId: number;
  public estatePlanningMatterTypeId: number;
  private addedAssociations: vwMatterAssociation[] = [];
  public loading: boolean;
  public officesLoading = true;

  constructor(
    private builder: FormBuilder,
    private misc: MiscService,
    private toastDisplay: ToastDisplay,
    private officeService: OfficeService,
    private matterService: MatterService,
    private dialogService: DialogService,
    private matterAssociationService: MatterAssociationService,
    private clientService: ClientService,
    private contactsService: ContactsService,
    private modalService: NgbModal,
    private router: Router,
  ) {}

  ngOnInit() {
    this.getState();
    this.getlawoffices();
    this.getPracticeAreas();
    this.getCountries();
    this.getAssociateType();
    this.setInitialData();
  }

  private setInitialData() {
    this.MatterForm.get('matterTypeId').disable();
    let contactDetails = UtilsHelper.getObject('contactDetails');
    this.contactDetails = contactDetails;

    if (contactDetails && contactDetails.matterDetails) {
      this.setMatterDetails(contactDetails.matterDetails);
    }

    if (contactDetails.createDetails) {
      this.contactId = contactDetails.createDetails.clientId;
    }
  }

  public setMatterDetails(matterDetails) {
    this.matterDetails = matterDetails;
    this.opposingPartyList = this.matterDetails.opposingPartyList || [];
    this.vendorList = this.matterDetails.vendorList || [];
    this.opposingCounselList = this.matterDetails.opposingCounselList || [];
    this.subsidiaryList = this.matterDetails.subsidiaryList || [];
    this.expertWitnessList = this.matterDetails.expertWitnessList || [];
    this.opposingPartyRepresentingThemselves =
      this.matterDetails.opposingPartyRepresentingThemselves || [];

    this.MatterForm.patchValue({
      officeId: this.matterDetails.officeId
        ? this.matterDetails.officeId
        : null,
      matterTypeId: this.matterDetails.matterTypeId,
      jurisdictionId: this.matterDetails.jurisdictionId,
      practiceId: this.matterDetails.practiceId,
      jurisdictionCounty: this.matterDetails.jurisdictionCounty
    });

    if (this.matterDetails.practiceId) {
      let practiceId = { id: this.matterDetails.practiceId };
      this.onChange(practiceId);
    }
  }

  public getCountries() {
    this.misc.v1MiscCountryGet({}).subscribe(
      suc => {
        const res: any = suc;
        this.countryList = JSON.parse(res).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  public getPracticeAreas() {
    if(this.MatterForm.value.officeId){
      this.officeService.v1OfficePracticeAreasAllGet$Response({officeId:this.MatterForm.value.officeId}).subscribe(
        suc => {
          const res: any = suc;
          this.practiceAreaList = JSON.parse(res.body).results.officePractices;
          let row = this.practiceAreaList.filter(
            obj => obj.name.toLowerCase() == 'estate planning'
          );
          this.estatePlanningPracticeAreaId = row.length > 0 ? row[0].id: null;
        },
        err => {
          console.log(err);
        }
      );
    }else{
      this.MatterForm.patchValue({
        practiceId:null,
        matterTypeId:null
      })
    }

  }

  public getlawoffices() {
    this.officesLoading = true;
    this.officeService
      .v1OfficeTenantGet({ checkInitialConsultation: true })
      .subscribe(
        suc => {
          const res: any = suc;
          const listData = JSON.parse(res).results;
          if (listData && listData.length > 0) {
            this.consultationLawOfficeList = listData.filter(item => item.status === 'Active' || item.status === 'Open');
          }
          this.officesLoading = false;
          if(this.MatterForm.value.officeId){
            this.getPracticeAreas();
          }
        },
        err => {
          console.log(err);
          this.officesLoading = false;
        }
      );
  }

  public getState() {
    this.misc.v1MiscStatesGet$Response({}).subscribe(
      suc => {
        const res: any = suc;
        this.stateList = JSON.parse(res.body).results;
      },
      err => {
        console.log(err);
      }
    );
  }

  private getAssociateType() {
    this.misc.v1MiscClientassociationtypeGet$Response({}).subscribe(
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
          this.associateVendor = this.clientAssociates.filter(obj => {
            return obj.name === 'Vendor';
          })[0];
          this.associateSubsidiary = this.clientAssociates.filter(obj => {
            return obj.name === 'Subsidiary';
          })[0];
        }
      },
      err => {
        console.log(err);
      }
    );
  }

  addOpposingPartyClick() {
    this.addOpposingPartyMode = 'create';
    this.selectedOpposingParty = null;
    this.addOpposingParty = true;
  }

  editOpposingPartyClick(item: any, index) {
    item.indexNumber = index;
    this.addOpposingPartyMode = 'edit';
    this.selectedOpposingParty = item;
    this.addOpposingParty = true;
  }

  public closeOpposingParty(event) {
    this.addOpposingParty = false;
    this.manageMatterAssociate(
      event,
      this.opposingPartyList,
      this.associateOpposingParty
    );
  }

  addOpposingCounselClick() {
    this.addOpposingCouncelMode = 'create';
    this.selectedOpposingCounsel = null;
    this.addOpposingCouncel = true;
  }

  editOpposingCounselClick(item: any, index) {
    item.indexNumber = index;
    this.addOpposingCouncelMode = 'edit';
    this.selectedOpposingCounsel = item;
    this.addOpposingCouncel = true;
  }

  /***
   * capture popup close event for Opposing councel
   */
  public closeOpposingCouncel(event) {
    this.addOpposingCouncel = false;
    this.manageMatterAssociate(
      event,
      this.opposingCounselList,
      this.associateOpposingCouncil
    );
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
    } else if (event.type === 'edit') {
      let index = listArr.findIndex(
        (item, index) => index === event.data.indexNumber
      );
      if (index > -1) {
        listArr[index] = this.getData(event, associate);
      }
    }
  }

  private getData(event, associate) {
    return {
      isNew: this.contactId ? true : false,
      id: event.data.id,
      associationId: associate.id,
      associationType: associate.name,
      firstName: event.data.firstName,
      email: event.data.email,
      lastName: event.data.lastName,
      companyName: event.data.companyName,
      primaryPhone: event.data.primaryPhone,
      isCompany: event.data.isCompany,
      isVisible: event.data.isVisible ? event.data.isVisible : true,
      isArchived: event.data.isArchived ? event.data.isArchived : false
    };
  }

  addExpertWitnessClick() {
    this.addExpertWitnessMode = 'create';
    this.selectedExpertWitness = null;
    this.addExpertWitness = true;
  }

  editExpertWitnessClick(item: any, index) {
    item.indexNumber = index;
    this.addExpertWitness = true;
    this.addExpertWitnessMode = 'edit';
    this.selectedExpertWitness = item;
  }

  /***
   * capture popup close event for Expert Witness
   */
  public closeExpertWitness(event) {
    this.addExpertWitness = false;
    this.manageMatterAssociate(
      event,
      this.expertWitnessList,
      this.associateExpertWitness
    );
  }

  /***
   * common function to delete matter associations
   */
  async deleteMatterAssociations(
    messages: string,
    index: number,
    type: string
  ) {
    const resp: any = await this.dialogService.confirm(messages, 'Delete');
    if (resp) {
      let data;
      switch (type) {
        case 'Opposing Party':
          data = this.opposingPartyList.splice(index, 1);
          this.opposingPartyList = [...this.opposingPartyList];
          this.toastDisplay.showSuccess(this.errorData.opposingparty_delete);
          break;
        case 'Opposing Counsel':
          data = this.opposingCounselList.splice(index, 1);
          this.opposingCounselList = [...this.opposingCounselList];
          this.toastDisplay.showSuccess(this.errorData.opposingcounsel_delete);
          break;
        case 'Expert Witnesses':
          data = this.expertWitnessList.splice(index, 1);
          this.expertWitnessList = [...this.expertWitnessList];
          this.toastDisplay.showSuccess(this.errorData.expert_witnesses_delete);
          break;
        case 'Subsidiary':
          data = this.subsidiaryList.splice(index, 1);
          this.subsidiaryList = [...this.subsidiaryList];
          this.toastDisplay.showSuccess(this.errorData.subsidiary_delete);
          break;
        case 'Vendor':
          data = this.vendorList.splice(index, 1);
          this.vendorList = [...this.vendorList];
          this.toastDisplay.showSuccess(this.errorData.vendor_delete);
          break;
      }
      let index1 = this.addedAssociations.indexOf(data);
      if (index > -1) {
        this.addedAssociations.splice(index, 1);
      }
    }
  }

  next() {
    this.loading = true;
    const data = { ...this.MatterForm.value };
    if (!data.practiceId) {
      this.loading = false;
      this.toastDisplay.showError('Please select practice area');
      return;
    }

    if (
      this.opposingPartyRepresentingThemselves &&
      this.opposingPartyList.length > 0
    ) {
      let item;
      this.opposingCounselList = [];
      this.opposingPartyList.map(obj => {
        item = { ...obj };
        item['associationId'] = this.associateOpposingCouncil.id;
        item['associationType'] = 'Opposing Counsel';
        this.opposingCounselList.push(item);
      });
    }
    data[
      'opposingPartyRepresentingThemselves'
    ] = this.opposingPartyRepresentingThemselves;
    data['opposingPartyList'] = this.opposingPartyList;
    data['opposingCounselList'] = this.opposingCounselList;
    data['expertWitnessList'] = this.expertWitnessList;
    data['vendorList'] = this.vendorList;
    data['subsidiaryList'] = this.subsidiaryList;
    if (
      this.MatterForm.value.matterTypeId == this.estatePlanningMatterTypeId &&
      this.MatterForm.value.practiceId == this.estatePlanningPracticeAreaId
    ) {
      data['generateTaskBuilderTasks'] = true;
    } else {
      data['generateTaskBuilderTasks'] = false;
    }
    let contactDetails = UtilsHelper.getObject('contactDetails');
    if (contactDetails) {
      contactDetails['matterDetails'] = data;
      UtilsHelper.setObject('contactDetails', contactDetails);
    }
    this.nextStep.emit({ next: 'attorney', current: 'matter' });
    this.loading = false;
  }

  public cancel() {
    this.router.navigate(['/contact/potential-client']);
  }

  public prev() {
    this.prevStep.emit('basic');
  }

  public onChange(e: any) {
    this.MatterForm.patchValue({ matterTypeId: null });
    if (e && e.id) {
      this.matterService
        .v1MatterTypesPracticeIdGet({ practiceId: e.id })
        .subscribe(
          suc => {
            const res: any = suc;
            this.matterTypeList = JSON.parse(res).results;
            let row = this.matterTypeList.filter(
              obj => obj.name.toLowerCase() == 'estate planning'
            );
            this.estatePlanningMatterTypeId = row.length ? row[0].id : null;
            if (this.matterTypeList.length !== 0) {
              this.MatterForm.get('matterTypeId').enable();
            } else {
              this.MatterForm.get('matterTypeId').disable();
            }
            if (this.matterDetails) {
              this.MatterForm.patchValue({
                matterTypeId: this.matterDetails.matterTypeId
              });
            }
            this.MatterForm.updateValueAndValidity();
          },
          err => {
            console.log(err);
          }
        );
    } else {
      this.matterTypeList = [];
      this.MatterForm.patchValue({
        matterTypeId: null
      });
      this.MatterForm.updateValueAndValidity();
    }
  }

  runConflictsCheck(): void {
    const associations = [
      ...this.opposingPartyList,
      ...this.opposingCounselList,
      ...this.expertWitnessList,
      ...this.vendorList,
      ...this.subsidiaryList
    ];

    associations.forEach(a => {
      if (a.primaryPhone) {
        a.primaryPhone = a.primaryPhone.name;
      }

      delete a.email;
    });

    const request: PCConflictCheckRequest = {
      associations: associations,
      clientCompanyName: this.contactDetails.client.basicInformation
        .companyName,
      clientFirstName: this.contactDetails.client.basicInformation.firstName,
      clientLastName: this.contactDetails.client.basicInformation.lastName,
      isCompany:
        this.contactDetails.client.basicInformation.contactType == 'corporate'
    };

    this.contactsService
      .v1ContactsConflictPost$Json({
        body: request
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {})
      )
      .subscribe(response => {
        if (response && response.conflictPersons) {
          this.conflictArr = response.conflictPersons;
          this.blockedPersonsArr = response.blockedPersons;
        } else {
          this.conflictArr = [];
          this.blockedPersonsArr = [];
        }

        this.openConflictCheckDialog();
      });
  }

  private openConflictCheckDialog() {
    let modal = this.modalService.open(ConflictCheckDialogComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'modal-xlg'
    });

    let component = modal.componentInstance;

    component.conflicts = this.conflictArr;
    component.hasConflicts = this.conflictArr.length > 0;
    component.blockedUsers = this.blockedPersonsArr;

    modal.result.then(res => {
      if (res == 'save') {
        this.next();
      }

      if (res == 'discard') {
        this.setInitialData();

        const matterDetails = {};
        this.setMatterDetails(matterDetails);
      }
    });
  }

  addVendorClick() {
    this.addVendorMode = 'create';
    this.selectedVendor = null;
    this.addVendor = true;
  }

  editVendorClick(item: any, index) {
    item.indexNumber = index;
    this.addVendor = true;
    this.addVendorMode = 'edit';
    this.selectedVendor = item;
  }

  addSubsidiaryClick() {
    this.addSubsidiaryMode = 'create';
    this.selectedSubsidiary = null;
    this.addSubsidiary = true;
  }

  editSubsidiaryClick(item: any, index) {
    item.indexNumber = index;
    this.addSubsidiary = true;
    this.addSubsidiaryMode = 'edit';
    this.selectedSubsidiary = item;
  }

  public closeVendor(event) {
    this.addVendor = false;
    this.manageMatterAssociate(event, this.vendorList, this.associateVendor);
  }

  public closeSubsidiary(event) {
    this.addSubsidiary = false;
    this.manageMatterAssociate(
      event,
      this.subsidiaryList,
      this.associateSubsidiary
    );
  }

  /** show number with masking */
  getNumberMasking(number) {
    try {
      let x = number.replace(/\D/g, '').match(/(\d{3})(\d{3})(\d{4})/);
      x = '(' + x[1] + ') ' + x[2] + '-' + x[3];
      return x;
    } catch {
      return number;
    }
  }

  onAddAssoc(assoc) {
    this.addedAssociations.push(assoc);
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
