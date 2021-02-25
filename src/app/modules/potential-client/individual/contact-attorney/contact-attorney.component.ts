import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { debounceTime, finalize, map } from 'rxjs/operators';
import * as Constant from 'src/app/modules/shared/const';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { ContactsService, OfficeService, PersonService, WorkFlowService } from 'src/common/swagger-providers/services';
import { Page } from '../../../models/page';

@Component({
  selector: 'app-contact-attorney',
  templateUrl: './contact-attorney.component.html',
  styleUrls: ['./contact-attorney.component.scss']
})

export class ContactAttorneyComponent implements OnInit {
  @Output() readonly nextStep = new EventEmitter<{next?:string; current?: string}>();
  @Output() readonly prevStep = new EventEmitter<string>();
  @ViewChild(DatatableComponent, { static: false }) attornyTable: DatatableComponent;

  public rows: Array<any> = [];
  public oriArr: Array<any> = [];
  public attorneyList: Array<any> = [];
  public attorneyListb: Array<any> = [];
  public oriArrAttorny: Array<any> = [];
  public consultAttorneyArr: Array<any> = [];
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selectedAttorny: Array<number> = [];
  public pangeSelected: number = 1;
  public counter = Array;
  public sameAsResponsible: boolean = true;
  public pageb = new Page();
  public pageSelectorb = new FormControl('10');
  public pangeSelectedb: number = 1;
  public selecteAttornyDefualt :number;
  public selected: any;
  public footerHeight = 50;
  public lawOfficeId: number;
  public practiceId: number;
  public jurisdictionId: string;
  public columnList = [];
  searchString = new FormControl();
  public loading: boolean;
  public attorneyLoading = true;

  constructor(
    private personService: PersonService,
    private contactsService: ContactsService,
    private officeService: OfficeService,
    private workflowService: WorkFlowService,
    private router: Router,
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    let contactDetails = UtilsHelper.getObject('contactDetails');
    if (contactDetails && contactDetails.matterDetails) {
      this.lawOfficeId = contactDetails.matterDetails.officeId;
      this.practiceId = contactDetails.matterDetails.practiceId;
      this.jurisdictionId = contactDetails.matterDetails.jurisdictionId;
    }
    if (contactDetails && contactDetails.initialConsultAttoney) {
      this.selected = contactDetails.initialConsultAttoney;
      this.getSelectedAttorney(contactDetails.initialConsultAttoney.id);
    }
    this.getattorneyList();
    this.page.pageNumber = 0;
    this.page.size = 10;
    /**** filter serach for Billing Attorney */
    this.searchString.valueChanges.pipe(debounceTime(500)).subscribe(text => {
      text = text.trim().replace(/ +/g, ' ');
      if (text && this.lawOfficeId) {
        const param = { search: text, officeId: +this.lawOfficeId };
        if (this.practiceId ) {
          param['practiceId'] = +this.practiceId;
        }
         if (this.jurisdictionId ) {
           param['stateId'] = +this.jurisdictionId;
         }

        this.officeService.v1OfficeConsultattroneyGet(param).subscribe(suc => {
          const res: any = suc;
          let arr = JSON.parse(res).results;
          arr = arr.filter(obj => obj.rank !== -1);
          this.attorneyList = arr.sort(this.compare);
          this.attorneyList.forEach(item => {
            this.consultAttorneyArr.push(item);
          })
          this.updateDatatableFooterPage();
          this.attorneyLoading = false;
        }, err => {
          console.log(err);
          this.attorneyLoading = false;
        });
      } else {
        this.attorneyList = [];
        this.getattorneyList()
        this.updateDatatableFooterPage();
      }
    });
  }

  public getattorneyList(){
    this.attorneyLoading = true;    

    if (this.lawOfficeId) {
      const param = { officeId: +this.lawOfficeId };
      if (this.practiceId ) {
        param['practiceId'] = +this.practiceId;
      }
      if (this.jurisdictionId ) {
        param['stateId'] = +this.jurisdictionId;
      }
    this.officeService.v1OfficeConsultattroneyGet(param).subscribe(suc => {
      const res: any = suc;
      let arr = JSON.parse(res).results;
      arr = arr.filter(obj => obj.rank !== -1);
      this.attorneyList = arr.sort(this.compare);
      this.attorneyList.forEach(item => {
        this.consultAttorneyArr.push(item);
      })
      this.updateDatatableFooterPage();
      this.attorneyLoading = false;
    }, err => {
      console.log(err);
      this.attorneyLoading = false;
    });
  }
}

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
  }

  public onSelect(row) {
    this.selected = row;

  }

  public getSelectedAttorney(id=null){
    this.attorneyLoading = true;
    let param = { personId:id };
    this.personService.v1PersonPersonIdGet$Response(param).subscribe(suc => {
       const res: any = suc;
       let record = JSON.parse(res.body);
       this.selecteAttornyDefualt = record.results.id;
       this.attorneyList=[];
       this.attorneyList.push(record.results);
        this.attorneyLoading = false;
    }, () => {
      this.attorneyLoading = false;
    });
  }


  public next() {
    this.loading = true;
    let contactDetails = UtilsHelper.getObject('contactDetails');
    let basicDetails, matterDetails, attorneyDetails, personFormBuilder = {}, matterAssociations = [];
    basicDetails = {...contactDetails.client.basicInformation};
    basicDetails = {...basicDetails, ...contactDetails.client.contactInformation}
    basicDetails = {...basicDetails, ...contactDetails.client.contactPreference}
    if (basicDetails.contactType === "corporate") {
      basicDetails['corporateContacts'] = contactDetails.client.corporateContactList;
    }
    if (contactDetails.matterDetails.opposingPartyList) {
      matterAssociations = [...contactDetails.matterDetails.opposingPartyList];
    }
    if (contactDetails.matterDetails.opposingCounselList) {
      matterAssociations = matterAssociations.concat(contactDetails.matterDetails.opposingCounselList);
    }
    if (contactDetails.matterDetails.expertWitnessList) {
      matterAssociations = matterAssociations.concat(contactDetails.matterDetails.expertWitnessList);
    }
    if (contactDetails.matterDetails.vendorList) {
      matterAssociations = matterAssociations.concat(contactDetails.matterDetails.vendorList);
    }
    if (contactDetails.matterDetails.subsidiaryList) {
      matterAssociations = matterAssociations.concat(contactDetails.matterDetails.subsidiaryList);
    }
    matterDetails = {
      "initialConsultLawOffice": +contactDetails.matterDetails.officeId,
      "practiceId": +contactDetails.matterDetails.practiceId,
      "matterTypeId": +contactDetails.matterDetails.matterTypeId,
      "juridictionState": +contactDetails.matterDetails.jurisdictionId,
      "juridictionCounty": contactDetails.matterDetails.jurisdictionCounty,
      "matterAssociations": matterAssociations
    }
    if (this.selected) {
      attorneyDetails = {initialConsultAttoney: +this.selected.id}
    }
    if(contactDetails.client.personFormBuilder){
      personFormBuilder = contactDetails.client.personFormBuilder;
    }
    let observal = this.contactsService.v1ContactsFullPost$Json({body: {basicDetails, matterDetails, attorneyDetails, personFormBuilder}});
    if (contactDetails && contactDetails.createDetails) {
      observal = this.contactsService.v1ContactsFullPut$Json({body: {id: contactDetails.createDetails.clientId, basicDetails, matterDetails, attorneyDetails}});
    }
    observal.pipe(
      map(UtilsHelper.mapData),
      finalize(() => {
      })
    )
    .subscribe(async res => {
      if (res) {
        if(contactDetails.matterDetails.generateTaskBuilderTasks){
          let data = {
            practiceAreaId: +contactDetails.matterDetails.practiceId,
            matterTypeId: +contactDetails.matterDetails.matterTypeId,
            matterId : +res.matterId
          };
          await this.checkIfMatterWorkFlowCreated(res.matterId, data);
        }
        if (contactDetails) {
          this.setMatterAssociation(res, contactDetails);
        }
        this.nextStep.emit({next:'scheduling', current: 'attorney'});
        this.loading = false;
      } else {
        this.loading = false;
      }
    });
  }

  public setMatterAssociation(res, contactDetails) {
    contactDetails.matterDetails.expertWitnessList = [];
    contactDetails.matterDetails.opposingCounselList = [];
    contactDetails.matterDetails.subsidiaryList = [];
    contactDetails.matterDetails.vendorList = [];
    contactDetails.matterDetails.opposingPartyList = [];
    if (res && res.matterAssociationPersonId && res.matterAssociationPersonId.length > 0) {
      res.matterAssociationPersonId.map((obj) => {
        if (obj.associationType === 'Vendor') {
          contactDetails.matterDetails.vendorList.push(obj);
        }
        if (obj.associationType === 'Subsidiary') {
          contactDetails.matterDetails.subsidiaryList.push(obj);
        }
        if (obj.associationType === 'Opposing Party') {
          contactDetails.matterDetails.opposingPartyList.push(obj);
        }
        if (obj.associationType === 'Opposing Counsel') {
          contactDetails.matterDetails.opposingCounselList.push(obj);
        }
        if (obj.associationType === 'Expert Witness') {
          contactDetails.matterDetails.expertWitnessList.push(obj);
        }
      });
    }
    if (contactDetails.client && contactDetails.client.corporateContactList.length > 0) {
      this.isNewFalse(contactDetails.client.corporateContactList);
    }
    contactDetails['initialConsultAttoney'] = this.selected;
    contactDetails['createDetails'] = res;
    UtilsHelper.setObject('contactDetails', contactDetails);
  }

  public cancel() {
    this.router.navigate(['/contact/potential-client']);
  }

  public prev() {
    this.prevStep.emit('matter');
  }


  private isNewFalse(arr) {
    arr.map((obj) => {
      if (obj.isNew) {
        obj.isNew = false;
      }
    });
  }

  public compare(a, b) {
    const bandA = a.rank;
    const bandB = b.rank;

    let comparison = 0;
    if (bandA > bandB) {
      comparison = 1;
    } else if (bandA < bandB) {
      comparison = -1;
    }
    return comparison;
  }

  /**** function to update data table footer section */
  updateDatatableFooterPage() {
    this.page.totalElements = this.attorneyList.length;
    this.page.totalPages = Math.ceil(
      this.attorneyList.length / this.page.size
    );
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    // Whenever the filter changes, always go back to the first page
    this.attornyTable.offset = 0;
  }

  async createNewWorkflowForMatter(data){
    try{
      let res=await this.workflowService.v1WorkFlowGeneratenewPost$Json({body:data}).toPromise();
    }catch(err){
    }
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
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
