import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { IOffice } from 'src/app/modules/models';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { vwMatterAssociation } from 'src/common/swagger-providers/models';
import { MiscService } from 'src/common/swagger-providers/services';
import { ToastDisplay } from '../../../../guards/toast-service';
import * as errorData from '../../../shared/error.json';
import { UtilsHelper } from '../../../shared/utils.helper';

@Component({
  selector: 'app-client-association',
  templateUrl: './client-association.component.html',
  styleUrls: ['./client-association.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ClientAssociationComponent implements OnInit, OnChanges {
  @Output() readonly getAssociates = new EventEmitter<any>();
  @Output() readonly uniqueNumberChange = new EventEmitter<any>();
  @Input() uniqueNumber: any;

  public addToDb: boolean = false;
  public opposingPartyList: Array<any> = [];
  public opposingCounselList: Array<any> = [];
  public expertWitnessList: Array<any> = [];
  public addOpposingParty: boolean = false;
  public actionMode: string = 'create';
  public associateOpposingParty: IOffice;
  public clientAssociates: Array<IOffice> = [];
  public associateOpposingCouncil: IOffice;
  public associateExpertWitness: IOffice;
  public associateVendor: IOffice;
  public associateSubsidiary: IOffice;
  public opposingPartyRepresentingThemselves: boolean = true;
  public type: string = 'Vendor';
  private addedAssociations: vwMatterAssociation[] = [];
  public vendorList: Array<any> = [];
  public subsidiaryList: Array<any> = [];
  public addVendorSubsidiary: boolean = false;
  public addSubsidiary: boolean = false;
  public selectedRecord: any;


  public selectedOpposingParty: any;
  public addExpertWitness: boolean = false;
  public selectedExpertWitness: any;
  public addOpposingCouncel: boolean = false;
  public selectedOpposingCounsel: any;
  public errorData: any = (errorData as any).default;
  userInfo = UtilsHelper.getLoginUser();

  constructor(
    private toastDisplay: ToastDisplay,
    private misc: MiscService,
    private dialogService: DialogService,
  ) { }


  ngOnInit() {
    this.sendData();
    this.getAssociateType();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.uniqueNumber && changes.uniqueNumber.currentValue) {
      this.uniqueNumber = +changes.uniqueNumber.currentValue;
      this.uniqueNumberChange.emit(this.uniqueNumber);
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
      }
    );
  }

  public addOpposingPartyClick() {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.uniqueNumberChange.emit(this.uniqueNumber);
    this.actionMode = 'create';
    this.selectedOpposingParty = null;
    this.addOpposingParty = true;
  }


  public editOpposingPartyClick(item: any, index) {
    item.indexNumber = index;
    this.actionMode = 'edit';
    this.selectedOpposingParty = item;
    this.addOpposingParty = true;
  }

  public closeOpposingParty(event) {
    if (event.type === 'close') {
      this.uniqueNumber = this.uniqueNumber - 1;
      this.uniqueNumberChange.emit(this.uniqueNumber);
    }
    this.addOpposingParty = false;
    this.manageMatterAssociate(
      event,
      this.opposingPartyList,
      this.associateOpposingParty
    );
  }

  public addOpposingCounselClick() {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.uniqueNumberChange.emit(this.uniqueNumber);
    this.actionMode = 'create';
    this.selectedOpposingCounsel = null;
    this.addOpposingCouncel = true;
  }

  public editOpposingCounselClick(item: any, index) {
    item.indexNumber = index;
    this.actionMode = 'edit';
    this.selectedOpposingCounsel = item;
    this.addOpposingCouncel = true;
  }

  public closeOpposingCouncel(event) {
    if (event.type === 'close') {
      this.uniqueNumber = this.uniqueNumber - 1;
      this.uniqueNumberChange.emit(this.uniqueNumber);
    }
    this.addOpposingCouncel = false;
    this.manageMatterAssociate(
      event,
      this.opposingCounselList,
      this.associateOpposingCouncil
    );
  }

  public addExpertWitnessClick() {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.uniqueNumberChange.emit(this.uniqueNumber);
    this.actionMode = 'create';
    this.selectedExpertWitness = null;
    this.addExpertWitness = true;
  }

  public editExpertWitnessClick(item: any, index) {
    item.indexNumber = index;
    this.addExpertWitness = true;
    this.actionMode = 'edit';
    this.selectedExpertWitness = item;
  }

  public closeExpertWitness(event) {
    if (event.type === 'close') {
      this.uniqueNumber = this.uniqueNumber - 1;
      this.uniqueNumberChange.emit(this.uniqueNumber);
    }
    this.addExpertWitness = false;
    this.manageMatterAssociate(
      event,
      this.expertWitnessList,
      this.associateExpertWitness
    );
  }

  addVendorSubsidiaryClick(type) {
    this.uniqueNumber = this.uniqueNumber + 1;
    this.uniqueNumberChange.emit(this.uniqueNumber);
    this.type = type;
    this.actionMode = 'create';
    this.selectedRecord = null;
    this.addVendorSubsidiary = true;
  }

  public editVendorSubsidiaryClick(item: any, index: number, type: string) {
    this.type = type;
    item.indexNumber = index;
    this.addVendorSubsidiary = true;
    this.actionMode = 'edit';
    this.selectedRecord = item;
  }

  public closeVendor(event) {
    if (event.type === 'close') {
      this.uniqueNumber = this.uniqueNumber - 1;
      this.uniqueNumberChange.emit(this.uniqueNumber);
    }
    this.addVendorSubsidiary = false;
    this.manageMatterAssociate(
      event,
      (this.type === 'Vendor') ? this.vendorList : this.subsidiaryList,
      (this.type === 'Vendor') ? this.associateVendor : this.associateSubsidiary);
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
      if (index > -1) {
        this.addedAssociations.splice(index, 1);
      }
      this.sendData();
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
    } else if (event.type === 'edit') {
      let index = listArr.findIndex((item, index) => index === event.data.indexNumber);
      if (index > -1) {
        listArr[index] = this.getData(event, associate);
      }
    }
    this.sendData();
  }

  private getData(event, associate) {
    return {
      id: event.data.id,
      uniqueNumber: +event.data.uniqueNumber,
      associationId: associate.id,
      associationType: associate.name,
      firstName: event.data.firstName,
      email: event.data.email,
      lastName: event.data.lastName,
      companyName: event.data.companyName,
      primaryPhone: event.data.primaryPhone,
      isCompany: event.data.isCompany,
      isVisible: (event.data.isVisible) ? event.data.isVisible : true,
      isArchived: (event.data.isArchived) ? event.data.isArchived : false
    };
  }

  /** show number with masking */
  getNumberMasking(number: any) {
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

  public sameAsOppParty() {
    this.sendData();
  }

  public sendData() {
    if (this.opposingPartyRepresentingThemselves) {
      this.opposingCounselList = [];
    }
    if (this.opposingPartyList && this.opposingPartyList.length) {
      this.opposingPartyList.map((obj: any) => {
        obj.IsOpposingPartyRepresentThemselves = this.opposingPartyRepresentingThemselves;
      });
    }
    this.getAssociates.emit({
      addedAssociations: this.addedAssociations,
      opposingPartyList: this.opposingPartyList,
      opposingCounselList: this.opposingCounselList,
      expertWitnessList: this.expertWitnessList,
      subsidiaryList: this.subsidiaryList,
      vendorList: this.vendorList
    });
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj['uniqueNumber']|| obj : index ;
  }
}
