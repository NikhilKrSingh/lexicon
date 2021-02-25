import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { Observable, Subscription } from 'rxjs';
import * as Constant from 'src/app/modules/shared/const';
import { CommonService } from 'src/app/service/common.service';
import { MiscService, SearchService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { Page } from '../../models/page';

@Component({
  selector: 'app-search-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit, OnDestroy {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;

  public searchFormat={isAll:true, isDocument:false, isMatter:false, isClient:false, isEmployee:false, isContact:false, isOffice:false};

  public searchFilter:any;
  public isLoading: boolean = false;
  public searchString:string;
  public resultList:Array<any> = [];
  public originalResultList:Array<any> = [];
  public isShow8: boolean = false;
  public isShow7: boolean = false;
  public currentActive: boolean =  false;
  public itemsPerPage:number =10;
  public searchFilterList: Array<any> =[];

  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pangeSelected: number = 1;
  public ColumnMode = ColumnMode;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  public counter = Array;

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public matterPermission: boolean = true;
  public clientPermission: boolean = true;
  public totalResultCount: any;
  public searchFilterStr: any;
  constructor(
    public miscService: MiscService,
    private router: Router,
    public searchService: SearchService,
    private activateRoute: ActivatedRoute,
    private store: Store<fromRoot.AppState>,
    public  commonService: CommonService
  ) {
    this.router.onSameUrlNavigation='reload';
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.activateRoute.queryParams.subscribe(params => {
      this.searchString = params.searchString;
      this.searchFilter = params.searchFilter;
      this.searchFilterStr=params.searchFilterStr;
    });
    this.permissionList$ = this.store.select('permissions');
   }


  ngOnInit() {
     this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
    this.getFiltersList();
    if(this.searchString){
      this.changeFilter(this.searchFilter, true);
    }

  }
  
  /**
   * 
   * @param search 
   * Function to fetch search Results
   */
  getsearchResult(search:string){
      if(search && search!=''){
      this.isLoading = true;
      this.miscService.v1MiscSearchGlobalGet({searchString:search, isAll: this.searchFormat.isAll, isDocument:this.searchFormat.isDocument, isClient: this.searchFormat.isClient, isEmployee:this.searchFormat.isEmployee, isContact:this.searchFormat.isContact, isOffice:this.searchFormat.isOffice, isMatter:this.searchFormat.isMatter, pageIndex:1, pageSize:10000,searchFilterStr:this.searchFilterStr}).subscribe(res=>{
        const result = JSON.parse(res as any).results;
        const list= result["searchResults"];
        this.resultList= this.originalResultList = list;
        let filter = this.searchFilter.substring(0, this.searchFilter.length-1)
        if(this.searchFilter && this.searchFilter!='All'){
          this.resultList=this.resultList.filter(item => item.resultType == filter);
        }
        if(list.length >= 0){
          this.totalResultCount = result["searchResultCount"];
        }
        this.filterListOnPermissions();
        this.updateDatatableFooterPage();
        this.isLoading = false;
      },err=>{
        this.isLoading = false;
        console.log(err);
      })
    }
  }

  /**
   * 
   * Remove LocalStorage items when destroyed
   */
  ngOnDestroy(){
    
  }

  /**
   * 
   * Function to redirect to DMS
   */
  public redirecttoDMS(row){
    const navigationExtras: NavigationExtras = {
      state: {
        docPath: row.metaData[3].name
      }
    }
    this.router.navigate(['/manage-folders'], navigationExtras);
  }


  public changeFilter(type:string, isInitial?:boolean){
      type=type.toUpperCase();
      this.allFiltersfalse();
      let filter = this.searchFilter;
      switch(type){
        case 'ALL':
          this.searchFilter='All';
          this.searchFormat.isAll=true;
          break;
        case 'MATTERS':
          this.searchFilter='Matters';
          this.searchFormat.isMatter=true;
          break;
        case 'CLIENTS':
          this.searchFilter='Clients';
          this.searchFormat.isClient=true;
          break;
        case 'DOCUMENTS':
          this.searchFilter='Documents';
          this.searchFormat.isDocument=true;
          break;
        case 'OFFICES':
          this.searchFilter='Offices';
          this.searchFormat.isOffice=true;
          break;
        case 'EMPLOYEES':
          this.searchFilter='Employees';
          this.searchFormat.isEmployee=true;
          break;
        case 'CONTACTS':
          this.searchFilter='Contacts';
          this.searchFormat.isContact=true;
          break;
        default: 
          this.searchFilter='All';
          this.searchFormat.isAll=true;
          break;
      }
      if(this.searchFilter != filter || isInitial){
        this.getsearchResult(this.searchString);
      }
}

  public allFiltersfalse(){
    this.searchFormat.isAll=false;
    this.searchFormat.isClient=false;
    this.searchFormat.isContact=false;
    this.searchFormat.isDocument=false;
    this.searchFormat.isEmployee=false;
    this.searchFormat.isMatter=false;
    this.searchFormat.isOffice=false;
  }

   /**
   * Change per page size
   *
   * @memberof ListComponent
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  /**
   * Change page number
   *
   * @memberof ListComponent
   */
  public changePage() {
    this.page.pageNumber = this.pangeSelected -1;
  }

  /**
   * Handle change page number
   *
   * @param {*} e
   * @memberof ListComponent
   */
  public pageChange(e) {
    this.pangeSelected = e.page;
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.originalResultList.length;
    this.page.totalPages = Math.ceil(this.originalResultList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    if(this.table){
      this.table.offset = 0;
    }
  }

  /**
   * 
   * @param row 
   * Function to redirect to contact page
   */
  public redirecttoContact(row){
    if(row.metaData[10].name=='True'){ // For IsClientAsscoiation
      this.router.navigate(['/contact/edit-client-association'], { queryParams: {clientId: row.id,isViewMode:1 }});
    }else if(row.metaData[11].name=='True'){ // For IsCorporate
      this.router.navigate(['/contact/create-corporate-contact'], { queryParams: {contactId: row.id }});
    } else if(row.metaData[12].name=='True'){ // For isPotential-client
      this.router.navigate(['/contact/view-potential-client'], { queryParams: {clientId: row.id,state:'view' }});
    }else{}
  }

  openMenu(): void {
    setTimeout(() => {
      this.currentActive = !this.currentActive;
    }, 50);

  }

  onClickedOutside(event?:any) {
    this.currentActive = false;
  }

  getFiltersList(){
      this.searchService.v1SearchAllmodulesGet().subscribe(res=>{
        this.searchFilterList = JSON.parse(res as any).results;
        if(!this.searchFilterList.some(obj=> obj.moduleName == this.searchFilter) || !this.searchFilter){
          this.searchFilter='All';
        }
         if(!this.permissionList.MATTER_MANAGEMENTisAdmin && !this.permissionList.MATTER_MANAGEMENTMATTER_MANAGEMENTisViewOnly && !this.permissionList.MATTER_MANAGEMENTisEdit){
          this.searchFilterList = this.searchFilterList.filter(obj => obj.moduleName.toLowerCase() != 'matters');
          this.matterPermission = false;
        }
        if(!this.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin && !this.permissionList.CLIENT_CONTACT_MANAGEMENTisEdit && !this.permissionList.CLIENT_CONTACT_MANAGEMENTisViewOnly){
          this.searchFilterList = this.searchFilterList.filter(obj => obj.moduleName.toLowerCase() != 'clients' && obj.moduleName.toLowerCase() != 'contacts');
          this.clientPermission = false;
        }

        this.searchFilterStr="";
        let searchFilterArray = [];
        this.searchFilterList.forEach(function (value) {
          searchFilterArray.push(value.id)
        });
        this.searchFilterStr = searchFilterArray.join(',');
      },err=>{
      })
    }

    filterListOnPermissions(){
    if(!this.matterPermission){
      this.resultList = this.resultList.filter(item=> item.resultType.toLowerCase() != 'matter');
    }
    if(!this.clientPermission){
      this.resultList = this.resultList.filter(item=> item.resultType.toLowerCase() != 'client' && item.resultType.toLowerCase() != 'contact');
    }
  }

  getContactType(item?:any){
    let type:string;
    if(item.metaData[10].name=='True'){
      type= "Client Association";
    }else if(item.metaData[11].name=='True'){
      type="Corporate Client";
    }else if(item.metaData[12].name=='True'){
      type="Potential Client";
    }else{
      type="--";
    }
    return type;
  }

  getFormattedPhoneNumber(phone:any){
    let formattedPhone;
    if(phone && phone!='--' && phone!=''){
      formattedPhone = '(' + phone.substr(0, 3) + ') ' + phone.substr(3, 3) + '-' + phone.substr(6, 4);
    }else{
      formattedPhone=(phone) ? phone : '--';
    }
    return formattedPhone;
  }

  redirectToPage(row:any){
    switch(row.resultType){
      case 'Matter':
        this.router.navigate(['/matter/dashboard'], { queryParams: {matterId: row.id}});
        break;
      case 'Client':
        this.router.navigate(['/client-view/individual'], {queryParams: {clientId: row.id}});
        break;
      case 'Employee':
        this.router.navigate(['/employee/profile'], {queryParams: {employeeId: row.id}});
        break;
      case 'Office':
        this.router.navigate(['/office/detail'], {queryParams: {officeId: row.id, state: 'view'}});
        break;
      case 'Contact':
        this.redirecttoContact(row);
        break;
      case 'Document':
        this.redirecttoDMS(row);
        break;
    }
  }
  getCategoryName(name:string){
    if(name.length > 19){
      name=name.slice(0,19);
      name = name+'...';
    }
    return name;
  }
  addClassCategory(isadd:boolean, item?:any, event?:any){
    let elementId='categoryHeading_'+item.id;
    const element= document.getElementById(elementId);
    let name = item.metaData[10];
    if(isadd && name.length > 19){
      element.classList.add("text-underline");
    }else{
      element.classList.remove("text-underline");
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
