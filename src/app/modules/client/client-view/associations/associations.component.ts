import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { forkJoin, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { IOffice, vwMatterResponse } from 'src/app/modules/models';
import { vwClientAssociation } from 'src/app/modules/models/vw-client-association.model';
import { ConflictCheckDialogComponent } from 'src/app/modules/shared/conflict-check-dialog/conflict-check-dialog.component';
import * as Constant from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errorData from 'src/app/modules/shared/error.json';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { MatterAssociationService } from 'src/app/service/matter-association.service';
import { PCConflictCheckRequest, vwClient } from 'src/common/swagger-providers/models';
import { ClientAssociationService, ContactsService, MatterService, MiscService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-associations',
  templateUrl: './associations.component.html',
  styleUrls: ['./associations.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AssociationsComponent implements OnInit, OnDestroy {
  @Input() clientDetails: vwClient;
  @Input() originalMatterList: Array<vwMatterResponse> = [];
  @Input() addEditAssociation: boolean;
  @Input() uniqueNumber: any;
  @Output() readonly editAssoc = new EventEmitter();
  @Input() hasEditPermission = false;
  matterList: Array<vwMatterResponse> = [];

  clientAssociates: any;

  public addVendor: boolean = false;
  public addVendorMode: string = 'create';
  public associateVendor: IOffice;
  public selectedVendor: any;

  public addSubsidiary: boolean = false;
  public addSubsidiaryMode: string = 'create';
  public associateSubsidiary: IOffice;
  public selectedSubsidiary: any;

  public addExpertWitness: boolean = false;
  public addExpertWitnessMode: string = 'create';
  public associateExpertWitness: IOffice;
  public selectedExpertWitness: any;

  public addOpposingParty: boolean = false;
  public addOpposingPartyMode: string = 'create';
  public associateOpposingParty: IOffice;
  public selectedOpposingParty: any;

  public addOpposingCouncel: boolean = false;
  public addOpposingCouncelMode: string = 'create';
  public associateOpposingCouncil: IOffice;
  public selectedOpposingCounsel: any;

  public vendorList: Array<any> = [];
  public _vendorList: Array<any> = [];
  public subsidiaryList: Array<any> = [];
  public _subsidiaryList: Array<any> = [];
  public expertWitnessList: Array<any> = [];
  public _expertWitnessList: Array<any> = [];
  public opposingPartyList: Array<any> = [];
  private _opposingPartyList: Array<any> = [];
  public opposingCounselList: Array<any> = [];
  private _opposingCounselList: Array<any> = [];
  isOppoRepreThemselves: boolean = false;
  public errorData: any = (errorData as any).default;

  conflictArr = [];
  blockedPersonsArr = [];

  clientConfictCheckSub: Subscription;

  public loading: boolean;

  constructor(
    private matterAssociationService: MatterAssociationService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private misc: MiscService,
    private toastDisplay: ToastDisplay,
    private matterService: MatterService,
    private sharedService: SharedService,
    private contactsService: ContactsService,
    private clientAssociationService: ClientAssociationService
  ) { }

  ngOnInit() {
    if (this.clientDetails) {
      this.getClientAssociations();
      this.getAssociateType();
    }

    this.clientConfictCheckSub = this.sharedService.clientConfictCheck$.subscribe(
      () => {
        this.runConflictsCheck();
      }
    );
  }

  ngOnDestroy() {
    if (this.clientConfictCheckSub) {
      this.clientConfictCheckSub.unsubscribe();
    }
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

  addExpertWitnessClick() {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.matterList = this.originalMatterList.filter(a => !!a.matterName);
    this.addExpertWitnessMode = 'create';
    this.selectedExpertWitness = null;
    this.addExpertWitness = true;
  }

  editExpertWitnessClick(item: any) {
    this.matterList = this.originalMatterList.filter(a => !!a.matterName);
    this.addExpertWitness = true;
    this.addExpertWitnessMode = 'edit';
    this.selectedExpertWitness = item;
  }

  async deleteMatterAssociations(
    messages: string,
    person: any,
    type: string
  ) {
    try {
      const resp: any = await this.dialogService.confirm(messages, 'Delete');
      if (resp) {
        const data: any = {
          body: {
            associationTypeId:
              type == 'Opposing Party'
                ? this.associateOpposingParty.id
                : type == 'Opposing Counsel'
                  ? this.associateOpposingCouncil.id
                  : this.associateExpertWitness.id,
            matterId: person.matterId,
            personId: person.id
          }
        };
        this.matterService
          .v1MatterPersonDisassociateDelete$Json$Response(data)
          .subscribe(
            suc => {
              let index: any;
              switch (type) {
                case 'Opposing Party':
                  index = this.opposingPartyList.findIndex(
                    x => x.id === person.id
                  );
                  this.opposingPartyList.splice(index, 1);
                  this.opposingPartyList = [...this.opposingPartyList];
                  this.toastDisplay.showSuccess(
                    this.errorData.opposingparty_delete
                  );
                  break;
                case 'Opposing Counsel':
                  index = this.opposingCounselList.findIndex(
                    x => x.id === person.id
                  );
                  this.opposingCounselList.splice(index, 1);
                  this.opposingCounselList = [...this.opposingCounselList];
                  this.toastDisplay.showSuccess(
                    this.errorData.opposingcounsel_delete
                  );
                  break;
                case 'Expert Witnesses':
                  index = this.expertWitnessList.findIndex(
                    x => x.id === person.id
                  );
                  this.expertWitnessList.splice(index, 1);
                  this.expertWitnessList = [...this.expertWitnessList];
                  this.toastDisplay.showSuccess(
                    this.errorData.expert_witnesses_delete
                  );
                  break;
              }
            },
            err => { }
          );
      }
    } catch (err) { }
  }

  /***
   * capture popup close event for Expert Witness
   */
  public closeExpertWitness(event) {
    if (event.type === 'close') {
      this.uniqueNumber = this.uniqueNumber - 1;
    }
    this.addExpertWitness = false;
    if (event === 'add' || (event && event.type && event.type === 'add')) {
      this.getClientAssociations();
    }
  }

  addVendorClick() {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.addVendorMode = 'create';
    this.selectedVendor = null;
    this.addVendor = true;
  }

  editVendorClick(item: any) {
    this.addVendor = true;
    this.addVendorMode = 'edit';
    this.selectedVendor = item;
  }

  deleteVendorClick(item: any) {
    this.dialogService
      .confirm(
        this.errorData.vendor_delete_confirm,
        'Delete',
        'Cancel',
        'Delete Vendor'
      )
      .then(res => {
        if (res) {
          this.clientAssociationService
            .v1ClientAssociationIdDelete$Response({
              id: item.id
            })
            .subscribe(
              () => {
                this.toastDisplay.showSuccess(this.errorData.vendor_delete);
                this.getClientAssociations();
              },
              () => { }
            );
        }
      });
  }

  addSubsidiaryClick() {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.addSubsidiaryMode = 'create';
    this.selectedSubsidiary = null;
    this.addSubsidiary = true;
  }

  editSubsidiaryClick(item: any) {
    this.addSubsidiary = true;
    this.addSubsidiaryMode = 'edit';
    this.selectedSubsidiary = item;
  }

  deleteSubsidiaryClick(item: any) {
    this.dialogService
      .confirm(
        this.errorData.subsidiary_delete_confirm,
        'Delete',
        'Cancel',
        'Delete Subsidiary'
      )
      .then(res => {
        if (res) {
          this.clientAssociationService
            .v1ClientAssociationIdDelete$Response({
              id: item.id
            })
            .subscribe(
              () => {
                this.toastDisplay.showSuccess(this.errorData.subsidiary_delete);
                this.getClientAssociations();
              },
              () => { }
            );
        }
      });
  }

  getNumberMasking(phoneNumber) {
    try {
      let x = phoneNumber.replace(/\D/g, '').match(/(\d{3})(\d{3})(\d{4})/);
      x = '(' + x[1] + ') ' + x[2] + '-' + x[3];
      return x;
    } catch {
      return phoneNumber;
    }
  }

  public closeVendor(event) {
    if (event.type === 'close') {
      this.uniqueNumber = this.uniqueNumber - 1;
    }
    this.addVendor = false;
    if (event != 'close') {
      this.getClientAssociations();
    }
  }

  public closeSubsidiary(event) {
    if (event.type === 'close') {
      this.uniqueNumber = this.uniqueNumber - 1;
    }
    this.addSubsidiary = false;
    if (event != 'close') {
      this.getClientAssociations();
    }
  }

  runConflictsCheck(): void {
    let associations = [
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
      clientId: this.clientDetails.id,
      matterId: this.clientDetails.matterId,
      associations: associations,
      clientCompanyName: this.clientDetails.companyName,
      clientFirstName: this.clientDetails.firstName,
      clientLastName: this.clientDetails.lastName,
      isCompany: this.clientDetails.isCompany
    };

    this.contactsService
      .v1ContactsConflictPost$Json({
        body: request
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => { })
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

    component.header = this.errorData.normal_conflict;
    component.message = this.errorData.changes_potential_conflict;
    component.returnButtonText = 'Return to Client Profile';

    modal.result.then(res => {
      if (res == 'save') {
        this.save();
      }

      if (res == 'discard') {
        this.discard();
      }
    });
  }

  private save() {
    this._expertWitnessList = [...this.expertWitnessList];
    this._subsidiaryList = [...this.subsidiaryList];
    this._vendorList = [...this.vendorList];
  }

  private discard() {
    let newlyAddedAssociations = [
      ...this.addedItems(this._expertWitnessList, this.expertWitnessList),
      ...this.addedItems(this._vendorList, this.vendorList),
      ...this.addedItems(this._subsidiaryList, this.subsidiaryList)
    ];

    if (newlyAddedAssociations.length > 0) {
      const Observables = newlyAddedAssociations.map(a => {
        const data: any = {
          body: {
            associationTypeId: a.associationTypeId,
            matterId: a.matterId,
            personId:
              a['associationTypeName'] == 'Subsidiary' ||
                a['associationTypeName'] == 'Vendor'
                ? a.id
                : a.personId
          }
        };
        return this.matterService.v1MatterPersonDisassociateDelete$Json$Response(
          data
        );
      });

      forkJoin(Observables)
        .pipe(finalize(() => { }))
        .subscribe(() => {
          this.getClientAssociations();
        });
    }
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

  public closeOpposingParty(event) {
    if (event.type === 'close') {
      this.uniqueNumber = this.uniqueNumber - 1;
    }
    this.addOpposingParty = false;
    if (event === 'add' || (event && event.type && event.type === 'add')) {
      this.getClientAssociations();
    }
  }

  public closeOpposingCouncel(event) {
    if (event.type === 'close') {
      this.uniqueNumber = this.uniqueNumber - 1;
    }
    this.addOpposingCouncel = false;
    if (event === 'add' || (event && event.type && event.type === 'add')) {
      this.getClientAssociations();
    }
  }

  addOpposingPartyClick() {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.addOpposingPartyMode = 'create';
    this.selectedOpposingParty = null;
    this.addOpposingParty = true;
  }

  editOpposingPartyClick(item: any) {
    this.addOpposingPartyMode = 'edit';
    this.selectedOpposingParty = item;
    this.addOpposingParty = true;
  }

  addOpposingCounselClick() {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.addOpposingCouncelMode = 'create';
    this.selectedOpposingCounsel = null;
    this.addOpposingCouncel = true;
  }

  editOpposingCounselClick(item: any) {
    this.addOpposingCouncelMode = 'edit';
    this.selectedOpposingCounsel = item;
    this.addOpposingCouncel = true;
  }

  getClientAssociations() {
    this.loading = true;
    this.clientAssociationService.v1ClientAssociationOnlyassociationsClientIdGet({ clientId: this.clientDetails.id })
    .pipe(map(UtilsHelper.mapData))
    .subscribe((res) => {
      const list = res;
      this.loading = false;
      this.subsidiaryList = list.filter(
        item => item.associationType === Constant.ClientAssociation.Subsidiary && item.isActive
      );
      this.vendorList = list.filter(
        item => item.associationType === Constant.ClientAssociation.Vendor && item.isActive
      );
      this.opposingPartyList = list.filter(
        item => item.associationType === Constant.ClientAssociation.OpposingParty && item.isActive
      );
      this.opposingCounselList = list.filter(
        item => item.associationType === Constant.ClientAssociation.OpposingCounsel && item.isActive
      );
      this.expertWitnessList = list.filter(
        item => item.associationType === Constant.ClientAssociation.ExpertWitness && item.isActive
      );
      this.sharedService.refreshVendor$.next();
      this.sharedService.refreshSubsidiary$.next();

      this._vendorList = [...this.vendorList];
      this._subsidiaryList = [...this.subsidiaryList];
      this._opposingPartyList = [...this.opposingPartyList];
      this._opposingCounselList = [...this.opposingCounselList];
      this._expertWitnessList = [...this.expertWitnessList];
      this.checkIfOppoPartyRepresenting();
    }, err => {
      this.loading = false;
    })
  }

  editAssociations() {
    this.editAssoc.emit();
  }

  checkIfOppoPartyRepresenting() {
    let arr1 = this.opposingPartyList.map(x => x.uniqueNumber);
    let arr2 = this.opposingCounselList.map(x => x.uniqueNumber);
    arr1.sort(function(a, b) {
      return a - b;
    });
    arr2.sort(function(a, b) {
      return a - b;
    });
    this.isOppoRepreThemselves = _.isEqual(arr1, arr2) ? true : false;
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj['uniqueNumber'] || obj : index ;
  }
}
