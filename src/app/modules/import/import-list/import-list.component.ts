import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { ExportModel } from 'src/common/swagger-providers/models/export-model';
import { ExportModelMapper } from 'src/common/swagger-providers/models/export-model-mapper';
import { ExportService, ImportService, TrustAccountService } from 'src/common/swagger-providers/services';
import * as errorData from '../../shared/error.json';

interface IuplodedUser {
  importType: string;
  lastUpdatedBy: string;
  lastUpdated: string;
}

@Component({
  selector: 'app-import-list',
  templateUrl: './import-list.component.html',
  styleUrls: ['./import-list.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ImportListComponent implements OnInit, OnDestroy {
  modalOptions: NgbModalOptions;
  closeResult: string;
  modalReference: any;


  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public isTrustAccountEnabled = false;
  public selectModel: any;
  public selectModelName: any;

  constructor(
    private importService: ImportService,
    private modalService: NgbModal,
    private trustAccountService: TrustAccountService,
    private store: Store<fromRoot.AppState>,
    private pagetitle: Title,
    private exportService: ExportService,
    private exporttocsvService: ExporttocsvService
  ) {
    this.permissionList$ = this.store.select('permissions');
  }
  public errorData: any = (errorData as any).default;
  public clientImport: IuplodedUser;
  public trustImport: IuplodedUser;
  public officeImport: IuplodedUser;
  public employeeImport: IuplodedUser;
  public matterimport: IuplodedUser;
  public potentialimport: IuplodedUser;
  public corporateimport: IuplodedUser;
  public clientassociateimport: IuplodedUser;

  public exportColumnList: Array<any> =[];
  public selectAllColumn: boolean = false;
  public loading: boolean = false;
  public showAllOptions: boolean = false;

  ngOnInit() {
    this.pagetitle.setTitle("Data Import");
    this.getTenantTrustAccountStatus();
    this.getDetails();
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
  }

  openModal(content: any, className: any, winClass: string) {
    this.modalReference = this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static'
      })
      .result.then(
        result => {
        },
        reason => {
        }
      );
  }

  private getTenantTrustAccountStatus() {
    this.loading = true;
    this.trustAccountService
      .v1TrustAccountGetTrustAccountStatusGet$Response()
      .pipe(
        map(res => {
          return JSON.parse(res.body as any).results as boolean;
        }),
        finalize(() => {
        })
      )
      .subscribe(res => {
        if (res) {
          this.isTrustAccountEnabled = true;
          this.showAllOptions = true;
          this.loading = false;
        } else {
          this.isTrustAccountEnabled = false;
          this.showAllOptions = true;
          this.loading = false;
        }
      }, () => {
        this.loading = false;
      });
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  public getDetails() {
    this.importService.v1ImportLastUpdatedGet$Response({}).subscribe(suc => {
      const uploadedDetails = JSON.parse(suc.body as any).results;
      if (uploadedDetails && uploadedDetails.length > 0) {
        this.clientImport = uploadedDetails.find(a => a.importType === 'ImportClient');
        this.trustImport = uploadedDetails.find(a => a.importType === 'ImportTrust');
        this.officeImport = uploadedDetails.find(a => a.importType === 'ImportOffice');
        this.employeeImport = uploadedDetails.find(a => a.importType === 'ImportEmployee');
        this.matterimport = uploadedDetails.find(a => a.importType === 'ImportMatter');
        this.potentialimport = uploadedDetails.find(a => a.importType === 'ImportPotential');
        this.corporateimport = uploadedDetails.find(a => a.importType === 'ImportCorporate');
        this.clientassociateimport = uploadedDetails.find(a => a.importType === 'ImportCLientAssociation');

        if (this.clientImport) {
          this.clientImport.lastUpdated = (this.clientImport.lastUpdated) ? moment(this.clientImport.lastUpdated).format('DD/MM/YY') : '';
        }
        if (this.trustImport) {
          this.trustImport.lastUpdated = (this.trustImport.lastUpdated) ? moment(this.trustImport.lastUpdated).format('DD/MM/YY') : '';
        }
        if (this.officeImport) {
          this.officeImport.lastUpdated = (this.officeImport.lastUpdated) ? moment(this.officeImport.lastUpdated).format('DD/MM/YY') : '';
        }
        if (this.employeeImport) {
          this.employeeImport.lastUpdated = (this.employeeImport.lastUpdated) ? moment(this.employeeImport.lastUpdated).format('DD/MM/YY') : '';
        }
        if (this.matterimport) {
          this.matterimport.lastUpdated = (this.matterimport.lastUpdated) ? moment(this.matterimport.lastUpdated).format('DD/MM/YY') : '';
        }
        if (this.potentialimport) {
          this.potentialimport.lastUpdated = (this.potentialimport.lastUpdated) ? moment(this.potentialimport.lastUpdated).format('DD/MM/YY') : '';
        }
        if (this.corporateimport) {
          this.corporateimport.lastUpdated = (this.corporateimport.lastUpdated) ? moment(this.corporateimport.lastUpdated).format('DD/MM/YY') : '';
        }
        if (this.clientassociateimport) {
          this.clientassociateimport.lastUpdated = (this.clientassociateimport.lastUpdated) ? moment(this.clientassociateimport.lastUpdated).format('DD/MM/YY') : '';
        }

      }
    }, err => {
    });
  }

  fetchExportModelList(templateContent: any, model: string){
    this.loading = true;
    this.selectModel = model;
    this.selectModelName = this.getSelectedModelName(model);
    this.exportService.v1ExportModelFieldsGet({model: this.selectModel}).subscribe(res=>{
      let list = JSON.parse(res as any).results.modelFields;
      list.map(obj=>{
        obj.isChecked = false;
      })
      this.exportColumnList = list;
      this.selectAllColumn = false;
      this.loading = false;
      this.openModal(templateContent, 'xl', '');
    },err=>{
      this.loading = false;
    })
  }

  ExportToCSV(){
    let list: Array<ExportModelMapper> =[];
    let columnList :  Array<any> = this.exportColumnList.filter(obj=>obj.isChecked);
    if(!columnList.length){
      return;
    }
    this.modalService.dismissAll();
    this.loading = true;
    columnList.forEach(obj => {
        let field: ExportModelMapper = {
          friendlyName: obj.FriendlyName,
          technicalName: obj.TechnicalName,
          model: this.selectModel
        }
        list.push(field);
        obj.Name = obj.FriendlyName
    });
    let data: any = {
        model: ExportModel[this.selectModel] ,
        selectedFields: list
    }
    this.exportService.v1ExportModelExportDataPost$Json({model: ExportModel[this.selectModel], body: data}).subscribe((res: any)=>{
      let dataList: Array<any> = res.split('\n');//split response in to single rows
      let rows = [];
      let columns = (dataList[0].trim()).split(',');//first row in response is of columns
      dataList.splice(0, 1);

      for(let i=0;i<dataList.length;i++){
        let item = dataList[i].trim();
        let singleRow ={}
        item.split(",").forEach((obj, index)=>{
          let colName = columns[index]//.trim();
          singleRow[colName] = obj ? obj : '';
          });
        rows.push(singleRow);
      }
      let fname = this.selectModel == 'ClientMatterAssociations' ? 'clientassociations' : this.selectModel;
      let fileName = `${fname.toLowerCase()}-${moment(new Date()).format('MMDDYYYY')}`;
      this.exporttocsvService.downloadFile(rows, columnList, fileName);
      this.loading = false;
    },err=>{
      this.loading = false;
    }
    );
  }

  selectAllColumnsForExport(){
    this.exportColumnList.map(obj=>{
      obj.isChecked = this.selectAllColumn
    })
  }

  singleColumnChange(index){
    this.exportColumnList[index].isChecked = !this.exportColumnList[index].isChecked
    if(this.exportColumnList.every(obj=> obj.isChecked)){
      this.selectAllColumn = true;
    }else{
      this.selectAllColumn = false;
    }
  }

  getSelectedModelName(model){
    let name = '';
    switch(model){
      case 'Employees':
        name = 'Employee';
        break;
      case 'Clients':
        name = 'Client'
        break;
      case 'CorporateContacts':
        name = 'Corporate Contact'
        break;
      case 'Matters':
        name = 'Matter'
        break;
      case 'PotentialClients':
        name = 'Potential Client'
        break;
      case 'ClientMatterAssociations':
        name = 'Client/Matter Association'
        break;
    }
    return name;
  }

  get getButtonStatus(){
    return (!this.exportColumnList.some(obj=>obj.isChecked)) ;
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
