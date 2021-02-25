import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewEncapsulation } from '@angular/core';
import * as _ from 'lodash';
import { DmsService } from 'src/common/swagger-providers/services';
import { SharedService } from '../sharedService';

@Component({
  selector: 'app-send-for-esign',
  templateUrl: './send-for-esign.component.html',
  styleUrls: ['./send-for-esign.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class SendForESignComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() documentData: any;
  @Input() type: string;
  @Input() selectedClients: any;
  @Input() isMattersSelected: any;
  @Output() readonly initialised = new EventEmitter();
  @Input() listOfSigners: Array<any>;
  loading = false;
  signersArr = [
    { items: [], inpersonSignature: false, role: null, errorExists: false, name: '', email: '', otherEmailErr: false, otherNameErr: false }
  ];
  signers = [];
  oriSigners = [];
  otherRoleId = null;

  constructor(
    private dmsService: DmsService,
    private sharedService: SharedService
  ) { }

  ngOnInit() {
    this.getSignerList();
  }

  ngAfterViewInit() {
    this.initialised.emit(this);
  }

  ngOnChanges(changes){
    if(this.oriSigners && this.oriSigners.length){
      this.disableOptins();
    }
  }

  async getSignerList() {
    try {
      // this.loading = true;
      let resp: any;
      if((this.type == 'generate')){
        this.loading = true;
        resp = await this.dmsService.v1DmsDocumentSignersGet().toPromise();
        resp = JSON.parse(resp).results;
      } else {
        resp = this.listOfSigners;
      }
      const idx = resp.findIndex(x => x.name === 'Other');
      this.otherRoleId = resp[idx].id;
      this.signers = this.oriSigners = resp;
      this.disableOptins();
      setTimeout(x => {
        this.signersArr[0].items = JSON.parse(JSON.stringify(this.oriSigners));
        // this.loading = false;
      }, 1000)
      if(this.loading){
        this.loading = false;
      }
    } catch (e) {
      this.loading = false;
    }
  }

  clearSigners() {
    this.signersArr = [{ items: JSON.parse(JSON.stringify(this.oriSigners)), inpersonSignature: false, role: null, errorExists: false, name: '', email: '', otherEmailErr: false, otherNameErr: false }];
  }

  checkESignValidate() {
    if (!this.documentData.containsESignatureFields) {
      return true;
    }

    this.signersArr.forEach(x => {
      if (x.role === this.otherRoleId) {
        if (!x.name.trim()) {
          x.otherNameErr = true;
        }

        if (!x.email.trim()) {
          x.otherEmailErr = true;
        }

        if (x.email.trim() && !this.sharedService.isEmailValid(x.email.trim())) {
          x.otherEmailErr = true;
        }
      } else {
        x.errorExists = !x.role ? true : false;
      }
    });

    const resp = this.signersArr.some(x => x.otherNameErr || x.otherEmailErr || !x.role);
    return resp ? false : true;
  }

  signerChange(i) {
    this.signersArr[i].errorExists = false;
    this.checkAlloctedSigners();
    this.roleSelectionChanged();
    
  }

  addSigner() {
    let signersList = this.getSignersListForRoles();
    this.signersArr.push({ items: signersList, inpersonSignature: false, role: null, errorExists: false, name: '', email: '', otherEmailErr: false, otherNameErr: false });
  }

  removeSigner(i) {
    this.signersArr.splice(i, 1);
    this.checkAlloctedSigners();
    this.roleSelectionChanged();
  }

  checkNameEmail(idx, type) {
    switch (type) {
      case 'name':
        this.signersArr[idx].otherNameErr = this.signersArr[idx].name ? false : true;
        break;

      case 'email':
        if (this.signersArr[idx].email) {
          if (this.sharedService.isEmailValid(this.signersArr[idx].email)) {
            this.signersArr[idx].otherEmailErr = false;
          } else {
            this.signersArr[idx].otherEmailErr = true;
          }
        } else {
          this.signersArr[idx].otherEmailErr = true;
        }
        break;
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  getSignersListForRoles() {
    let signersList = [...this.oriSigners];
    signersList = signersList.filter(x => !x.isSelected);
    return signersList;
  }

  //Function to remove and shuffle  
  roleSelectionChanged(){
    this.signersArr.forEach(signer => {
      let list = _.cloneDeep(this.oriSigners);
      let sameSigneeObj = null;
      if(signer.role) {
        sameSigneeObj = this.oriSigners.find(x => x.id ==signer.role);
      }
      list = list.filter(x => !x.isSelected);
      if(sameSigneeObj && sameSigneeObj.isSelected){
        signer.items = _.cloneDeep([sameSigneeObj, ...list, ]);
      } else {
        signer.items = _.cloneDeep(list);
      }
      signer.items.map(x => delete x.isSelected);
    });
  }

  disableOptins(){
    if(this.type == 'generate'){
      this.oriSigners = this.signers;
      //Delet the selections from original array
        this.oriSigners.forEach(x => {
          if (x.name ==="Client"){
            x.isDelete = (this.selectedClients && this.selectedClients.length && this.selectedClients.every(x => !x.isCompany)) ? false : true;
          } else if (x.name == "Billing Contact" || x.name ==="Primary Contact") {
            x.isDelete = (this.selectedClients && this.selectedClients.length && this.selectedClients.every(x => x.isCompany)) ? false : true;
          } else if (x.name ==="Billing Attorney" || x.name ==="Responsible Attorney") {
            x.isDelete = (this.isMattersSelected) ? false : true;
          }
        });
        this.oriSigners = this.oriSigners.filter(x => !x.isDelete);
          if(this.signersArr.some(x => x.role)){
            this.signersArr.forEach(signer => {
              if(signer.role){
                let roleName = (this.signers.find(x => x.id == signer.role)).name;
                if(
                  (!this.selectedClients || !this.selectedClients.length) && 
                  (roleName == 'Client' || roleName == 'Billing Contact' || roleName == 'Primary Contact')
                  ){                  
                  signer.role = null
                }
                if(!this.isMattersSelected && (roleName == 'Billing Attorney' || roleName == 'Responsible Attorney')){
                  signer.role = null;
                }
              }
            })
      }
    }
    this.checkAlloctedSigners();
    this.roleSelectionChanged();
  }

  getRoleName(id) {
    return (this.oriSigners.find(x => x.id == id)).name;
  }

  checkAlloctedSigners(){
    this.oriSigners.map(x => x.isSelected = false);
    this.oriSigners.forEach(signer => {
      if(this.signersArr.some(x => x.role == signer.id) && this.getRoleName(signer.id) != 'Other'){
        signer.isSelected = true;
      }
    });
  }

  clearSelectionsForClients(){
    this.signersArr.forEach(signer => {
      let roleName = signer.role ? (this.signers.find(x => x.id == signer.role)).name : null;
      if(roleName == 'Client' || roleName == 'Billing Contact' || roleName == 'Primary Contact') {
        signer.role = null;
      }
    })
  }
}
