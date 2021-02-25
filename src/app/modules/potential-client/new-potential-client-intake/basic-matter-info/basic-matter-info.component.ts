import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errorData from 'src/app/modules/shared/error.json';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { BlockService, MatterService, MiscService, OfficeService, PersonService } from 'src/common/swagger-providers/services';
import { vwAttorneyViewModel } from '../../../models';
import { AddBlockedEmployeeNewMatterWizardComponent } from '../../../shared/add-blocked-employee-new-matter-wizard/add-blocked-employee-new-matter-wizard.component';

@Component({
  selector: 'app-basic-matter-info',
  templateUrl: './basic-matter-info.component.html',
  styleUrls: ['./basic-matter-info.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class BasicMatterInfoComponent implements OnInit, OnChanges {
  @ViewChild(DatatableComponent, { static: false }) attornyTable: DatatableComponent;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild('table', { static: false }) notesTable: DatatableComponent;
  @Output() readonly matterDetails = new EventEmitter<any>();
  @Output() readonly showHideLoader = new EventEmitter();
  @Output() readonly stateListArr = new EventEmitter<any>();
  @Output() readonly blockedList = new EventEmitter<any>();
  @Input() formSubmitted: boolean;
  @Input() refresh: Date;
  @Input() updateDetails;
  public form: FormGroup;
  public errorData: any = (errorData as any).default;
  public practiceList: Array<any> = [];
  public matterTypeList: Array<any> = [];
  public stateList: Array<any> = [];
  public officeList: Array<any> = [];
  public origofficeList: Array<any> = [];
  public attorneyList: Array<any> = [];
  public estatePlanningPracticeAreaId: number;
  public practiceAreaSelected: boolean;
  public selectedPracticeArea: any;
  public originatingAttorneyList: Array<any> = [];
  public employeesRows: Array<vwAttorneyViewModel> = [];
  public originalBlockedEmployeesList: Array<vwAttorneyViewModel> = [];
  public blockedLoading: boolean;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public matterTypeLoad = false;
  constructor(
    private builder: FormBuilder,
    private matterService: MatterService,
    private miscService: MiscService,
    private officeService: OfficeService,
    private personService: PersonService,
    private blockService: BlockService,
    private dialogService: DialogService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.createForm();
    this.emitShowHideLoader(true);
    Promise.all([this.getPractices(), this.getState()]).then(() => {
      this.emitShowHideLoader(false);
    });

    this.form.valueChanges.subscribe(() => {
      this.emitFormDataMatter();
    });

    this.form.controls.practiceId.valueChanges.subscribe(val => {
      this.disableFields(val ? false : true);
    })

    this.getOriginatingAttorneyList();
  }

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('refresh')) {
      let refresh = changes.refresh.currentValue;
      if (refresh) {
        this.form.patchValue({
          initialConsultAttoney: this.updateDetails.attorney.id,
          initialConsultLawOffice: this.updateDetails.office.id,
          originatingAttoney: null
        });
        this.getAttorneyList();
      }
    }
  }

  /**** function to create form */
  createForm() {
    this.form = this.builder.group({
      contactType: [null, Validators.required],
      practiceId: [null, Validators.required],
      matterTypeId: [null, Validators.required],
      juridictionState: [null],
      juridictionCounty: [null, [PreventInject]],
      initialConsultLawOffice: [null, Validators.required],
      initialConsultAttoney: [null, Validators.required],
      originatingAttoney: [null, Validators.required]
    });
    this.disableFields(true)
  }

  /**
   * Function to get the Practice Area List
   *
   */
  public async getPractices(): Promise<any> {
    let resp = await this.miscService
      .v1MiscPracticesGet$Response({})
      .toPromise();
    this.practiceList = JSON.parse(resp.body as any).results;
    let row = this.practiceList.filter(
      obj => obj.name.toLowerCase() == 'estate planning'
    );
    this.estatePlanningPracticeAreaId = row.length ? row[0].id : null;
  }

  /**
   * Function to get the Matter Type List
   *
   */
  async getMatterType(e): Promise<any> {
    try {
      this.matterTypeLoad = true;
      let res: any = await this.matterService
        .v1MatterTypesPracticeIdGet({ practiceId: e.id })
        .toPromise();
      this.matterTypeList = JSON.parse(res).results;
      this.matterTypeList.sort((a, b) => {
        return this.compareStringName(a, b);
      });
      if(this.matterTypeList.length == 1){
        this.form.patchValue({
          matterTypeId: this.matterTypeList[0].id
        })
        this.form.controls.matterTypeId.disable();
      } else {
        this.form.controls.matterTypeId.enable();
      }
      this.matterTypeLoad = false;
      this.practiceAreaSelected = true;
    } catch (err) {
      this.matterTypeLoad = false;
    }
  }

  /**
   * Function to get the Jurisdication List
   *
   */
  public async getState() {
    try {
      let response: any = await this.miscService
        .v1MiscStatesGet$Response({})
        .toPromise();
      let resp: any = JSON.parse(response.body).results;
      this.stateListArr.emit(JSON.parse(response.body).results);
      this.stateList = [...resp];
      this.stateList.map(obj => (obj.name = obj.name + ' - ' + obj.code));
    } catch {}
  }

  /**
   * Function to get the Consultation Office List
   *
   */
  async getOffices(loading?: boolean): Promise<any> {
    let value = this.form.value;
    if (!value.practiceId) {
      return;
    }
    const data: any = {
      practiceId: value.practiceId
    };
    if (loading) {
      this.emitShowHideLoader(true);
    }
    try {
      let res: any = await this.miscService
        .v1MiscJurisdictionOfficesPracticeIdGet(data)
        .toPromise();
      if (loading) {
        this.emitShowHideLoader(false);
      }
      let list = JSON.parse(res).results;
      this.officeList = this.origofficeList = list;
      let officeId = this.form.value.initialConsultLawOffice;
      //If the list has select attorney
      if (officeId) {
        if (!this.officeList.some(x => x.id === officeId)) {
          this.form.patchValue({
            initialConsultLawOffice: null,
            initialConsultAttoney: null
          });
        }
      }

    } catch (err) {
      if (loading) {
        this.emitShowHideLoader(false);
      }
    }
  }
  /**
   * Function to get the Office and Matter List
   *
   */

  async changePracticeArea(value) {
    this.selectedPracticeArea = value ? value : null;
    this.form.patchValue({
      matterTypeId: null,
    });
    this.matterTypeList = [];
    this.officeList = [];
    this.attorneyList = [];
    if (this.selectedPracticeArea) {
      this.emitShowHideLoader(true);
      Promise.all([
        this.getMatterType(this.selectedPracticeArea),
        this.getOffices(),
        this.getAttorneyList()
      ]).then(() => {
        this.emitShowHideLoader(false);
      });
    }
  }

  changeState() {
  }

  getAttorneyList() {
    let matterDetails = this.form.value;
    if (!matterDetails.practiceId) {
      return;
    }
    let data: any = {
      practiceId: matterDetails.practiceId
    };
    if (matterDetails.initialConsultLawOffice) {
      data.officeId = matterDetails.initialConsultLawOffice;
    }
    if (matterDetails.juridictionState) {
      data.stateId = matterDetails.juridictionState;
    }
    this.emitShowHideLoader(true);
    this.officeService.v1OfficeResponsibleattroneyGet(data).subscribe(
      res => {
        this.attorneyList = JSON.parse(res as any).results;
        this.attorneyList = this.attorneyList.filter(v=> !v.doNotSchedule);
        this.attorneyList.sort((a: any, b: any) => {
          return this.compareStringName(a, b);
        });

        let attorneyId = this.form.controls['initialConsultAttoney'].value;
        if(attorneyId){
          let attorneyFound = this.attorneyList.some(x => x.id === attorneyId);
          if (!attorneyFound) {
            this.form.patchValue({
              initialConsultAttoney: null
            });
          }
        }
        this.emitShowHideLoader(false);
      },
      err => {
        this.emitShowHideLoader(false);
      }
    );
  }

  /**
   * convenience getter for easy access to form fields
   **/
  get f() {
    return this.form.controls;
  }

  /**** function to emit show/hide loader event */
  emitShowHideLoader(loader?: boolean) {
    this.showHideLoader.emit(loader);
  }

  compareStringName(a: string, b: string): number {
    let x: string = '';
    a['name']
      .split(',')[0]
      .split('')
      .forEach(val => {
        if ((val >= 'A' && val <= 'Z') || (val >= 'a' && val <= 'z')) {
          x += val;
        }
      });

    let y: string = '';
    b['name']
      .split(',')[0]
      .split('')
      .forEach(val => {
        if ((val >= 'A' && val <= 'Z') || (val >= 'a' && val <= 'z')) {
          y += val;
        }
      });
    return x.toUpperCase().localeCompare(y.toUpperCase());
  }

  public emitFormDataMatter() {
    let data: any = {
      formData: this.form
    };
    this.matterDetails.emit(data);
  }

  /*********** Getting OriginatingAttorneyList **********/
  public getOriginatingAttorneyList() {
    this.emitShowHideLoader(true);
    this.personService.v1PersonOriginatingattorneyGet().subscribe(
      res => {
        this.originatingAttorneyList = JSON.parse(res as any).results;
        this.originatingAttorneyList = this.originatingAttorneyList.filter(v=> !v.doNotSchedule);
        this.originatingAttorneyList.sort((a: any, b: any) => {
          return this.compareStringName(a, b);
        });
        this.emitShowHideLoader(false);
      },
      err => {
        this.emitShowHideLoader(false);
      }
    );
  }

  /****function to remove blocked employee */
  async removeBlockedEmployee(row: any, removeModal): Promise<any> {
    this.modalService
      .open(removeModal, {
        size: 'sm',
        centered: true,
        backdrop: 'static'
      })
      .result.then(result => {
        if (result) {
          let index = this.employeesRows.findIndex(item => item.id === row.id);
          this.employeesRows.splice(index, 1);
          this.employeesRows = [...this.employeesRows];
        }
      });
  }

  /**** function to open add blocked employee modal */
  addBlockedEmployee() {
    let modalRef = this.modalService.open(
      AddBlockedEmployeeNewMatterWizardComponent,
      {
        centered: true,
        backdrop: 'static',
        keyboard: false,
        size: 'xl'
      }
    );
    let alreadyConsultAttorney = [];
    let alreadyOriginatingAttorney = [];

    if (this.form.controls['initialConsultAttoney'].value) {
      alreadyConsultAttorney.push(this.form.controls['initialConsultAttoney']
        .value);
    }
    if (this.form.controls['originatingAttoney'].value) {
      alreadyOriginatingAttorney.push(this.form.controls['originatingAttoney']
        .value)
    }

    const alreadyBlocked = this.employeesRows.map((a: any) => a.id);

    const allAlready = [...alreadyConsultAttorney, ...alreadyOriginatingAttorney, ...alreadyBlocked];

    modalRef.componentInstance.matterId = 0;
    modalRef.componentInstance.clientId = 0;
    modalRef.componentInstance.alreadyBlockedEmployees = allAlready;

    modalRef.result.then(res => {
      if (res && res.length) {
        this.employeesRows = [...this.employeesRows, ...res];
        this.employeesRows.forEach(row => {
          row.fullName = (row.firstName) ? row.lastName + ', ' + row.firstName : row.firstName;
        });
        this.blockedList.emit(this.employeesRows);
      }
    });
  }

  disableFields(isdisabled: boolean){
    if(isdisabled){
      this.form.patchValue({
        initialConsultLawOffice: null,
        matterTypeId: null,
        initialConsultAttoney: null 
      })
      this.form.controls.initialConsultLawOffice.disable();
      this.form.controls.matterTypeId.disable();
      this.form.controls.initialConsultAttoney.disable();
    } else {
      this.form.controls.initialConsultLawOffice.enable();
      // this.form.controls.matterTypeId.enable();
      this.form.controls.initialConsultAttoney.enable();
    }
  }


  /**
   * when attorney is changed
   * @param event 
   */
  attorneychange(event){
    let attorney = this.attorneyList.find(x => x.id == event.id);
    let attOfficeIds = attorney.offices.map(x => x.officeId);
    let offices = this.origofficeList.filter(x => attOfficeIds.includes(x.id));
    this.officeList = offices;
    if(this.form.value.initialConsultLawOffice) {
      if(!(offices.some(x => x.id == this.form.value.initialConsultLawOffice))){
        this.form.patchValue({
          initialConsultLawOffice: null
        })
      }
    }
    if(offices && (offices.length == 1)){
      this.setOfficeValue(offices[0]);
    } 
  }


  /**
   * when office is changed
   * @param event 
   */
  officeChange(event?: any) {
    if(!this.form.value.initialConsultAttoney){
      this.attorneyList = [];
      this.getAttorneyList();
    }
  }

  setOfficeValue(office){
    this.form.patchValue({
      initialConsultLawOffice: office.id
    })
  }
  
}

