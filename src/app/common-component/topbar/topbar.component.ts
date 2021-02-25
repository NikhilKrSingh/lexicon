import { DatePipe } from '@angular/common';
import { Component, EventEmitter, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { NavigationExtras, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { interval, Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { IPRofile } from 'src/app/modules/models/index.js';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { CommonService } from 'src/app/service/common.service';
import { SharedDataService } from 'src/app/service/shared-data.service';
import { jwtValidation } from 'src/common/CommonService/jwtValidation.service';
import { MiscService, NotificationService, PersonService, SearchService, TenantService } from 'src/common/swagger-providers/services';
import { IndexDbService } from '../../index-db.service';
import * as errorData from '../../modules/shared/error.json';
import * as fromRoot from '../../store';
import * as fromPermissions from '../../store/reducers/permission.reducer';
import { LogTimeComponent } from './log-time/log-time.component';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit, OnDestroy {
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  public errorData: any = (errorData as any).default;
  public userDetails: IPRofile;
  public profileImage: string;
  public addClassFlag = false;
  public searchResultList: Array<any> = [];
  public originalSearchResultList: Array<any> = [];
  public searchForm: FormGroup;
  public searchFilter = 'All';
  private sameRoute: Subject<any>;
  private searchFormat = { isAll: true, isDocument: false, isMatter: false, isClient: false, isEmployee: false, isContact: false, isOffice: false };
  public searchText = new FormControl();
  private request: any;
  public searchFilterList: Array<any> = [];
  public currentActive = false;
  public currentActive1 = false;
  public showSearchBox = false;
  public pageIndex = 0;
  public noResultFound = false;
  public matterPermission = true;
  public clientPermission = true;
  public contactPermission = true;
  public unReadNotificationCount = 0;
  public previousUnReadNotificationCount = 0;
  public isShowQuickView = false;
  public isClickBell = false;
  public datePipe = new DatePipe('en-US');
  public isSearchLoading=false;
  clearFilterSubscribe: Subscription;
  public flag:boolean;
  public refreshUserName:any;
  public userTenantCount: number = null;
  previousSearch:  string = '';

  constructor(
    private store: Store<fromRoot.AppState>,
    private personService: PersonService,
    private router: Router,
    private sharedService: SharedService,
    private miscService: MiscService,
    private builder: FormBuilder,
    private searchService: SearchService,
    public commonService: CommonService,
    public indexDbService: IndexDbService,
    private modalService: NgbModal,
    private tenantService: TenantService,
    private sharedDataService: SharedDataService,
    private notificationService: NotificationService,
    public appConfigService: AppConfigService,
    public JWTservice: jwtValidation,
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.clearFilterSubscribe = this.commonService.isClearFilter.subscribe((obj) => {
      if (obj) {
        this.searchText.patchValue('');
      }
    });
    this.refreshUserName = this.sharedService.refreshUserName$.subscribe((obj)=>{
      if(obj){
       this.setUserName();
      }
    })
  }

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public totalResultCount: any;
  public searchFilterStr: any;
  pollingNotificationData: any;
  public quickViewList = [];
  public notificationLoader = false;

  ngOnInit() {
    if (localStorage.getItem('notificationCount')) {
      this.unReadNotificationCount = parseInt(localStorage.getItem('notificationCount'), 10);
      this.updateTitle();
    }
    this.getCountOnInit();
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });
    this.getFiltersList();
    this.searchText.valueChanges.pipe(debounceTime(1000)).subscribe((text: string) => {
      text = text.trim();
      this.noResultFound = false;
      this.searchResultList = [];
      this.getsearchResult(text, true);
    });

    this.opts = {
      position: 'right',
      barBackground: '#413a93',
      barOpacity: '1',
      barWidth: '4',
      barBorderRadius: '4',
      barMargin: '2px',
      gridOpacity: '1',
      gridBackground: '#e7edf3',
      gridWidth: '8',
      gridMargin: '0',
      gridBorderRadius: '4',
      alwaysVisible: true,
    };
    this.setUserName();
    this.getProfilePicture();
    this.getNotificationCount();
    this.getUserTenantCount();
    this.sharedDataService.currentNotificationCount.subscribe(count => {
      if (count != null) {
        this.unReadNotificationCount = count;
        UtilsHelper.setObject('notificationCount', count);
        this.updateTitle();
      }
    });
  }
  setUserName(){
    this.userDetails = JSON.parse(localStorage.getItem('profile'));
    if (this.userDetails) {
      this.userDetails.name = this.userDetails.lastName ? this.userDetails.firstName + ' ' + this.userDetails.lastName : this.userDetails.firstName;
    }
  }
  
  getUserTenantCount() {
    let token = localStorage.getItem('jwtToken');
    let email = JSON.parse(localStorage.getItem('profile')).email;
    if (email) {
      this.JWTservice.getUserTenantCount(token, email).subscribe(
        (res: any) => {
          if (res) {
            this.userTenantCount = res.results;
          }
        },
        error => {
        }
      );
    }
  }
  
  ngOnDestroy() {
    if (this.pollingNotificationData) {
      this.pollingNotificationData.unsubscribe();
    }
    if(this.refreshUserName){
      this.refreshUserName.unsubscribe();
    }
  }

  updateTitle() {
    let title = document.title;
    if (this.previousUnReadNotificationCount > 0){
      title = title.substr(title.indexOf(') ') + 1)
    } 
    const newTitle = this.unReadNotificationCount ? '(' + this.unReadNotificationCount + ') ' + title : title;
    document.title = newTitle;
    this.previousUnReadNotificationCount = this.unReadNotificationCount;
  }

  openQuickView() {
    if (!this.isShowQuickView) {
      const instance = this;
      setTimeout(() => { instance.isShowQuickView = true; }, 10);
      this.loadQuickView();
    }
  }

  loadQuickView() {
    this.notificationLoader = true;
    this.quickViewList = [];
    this.notificationService
      .v1NotificationGetNotificationReadUnreadGet$Response({ isAll: false }).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          const parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            this.quickViewList = parsedRes.results;
            if (this.quickViewList && this.quickViewList.length) {
              this.unReadNotificationCount = this.quickViewList[0].unreadCount;
            }
            const formatDate = (date: Date) => this.datePipe.transform(date, 'MM/dd/yy');
            const formatTime = (date: Date) => this.datePipe.transform(date, 'hh:mm a');
            this.quickViewList.forEach(item => {
              if (item.lastUpdated) {
                if (!item.lastUpdated.includes('Z')) {
                  item.lastUpdated = item.lastUpdated + 'Z';
                }
              } else {
                item.lastUpdated = new Date();
              }
              if (this.checkTodaysDate(item.lastUpdated)) {
                item.notificationDate = formatTime(item.lastUpdated);
              } else {
                item.notificationDate = formatDate(item.lastUpdated);
              }
            });
          }
        }
        this.notificationLoader = false;
      }, err => {
        this.quickViewList = [];
        this.notificationLoader = false;
      });
  }

  checkTodaysDate(inputDate) {
    const todaysDate = new Date();
    inputDate = new Date(inputDate);
    return inputDate.setHours(0, 0, 0, 0) === todaysDate.setHours(0, 0, 0, 0) ? true : false;
  }

  onClickedOutsideQuickView(e: Event) {
    if (this.isShowQuickView) {
      this.isShowQuickView = false;
      this.markAsRead();
    }
  }

  getNotificationCount() {
    try {
      this.pollingNotificationData = interval(this.appConfigService.appConfig.intervalTime)
        .pipe(switchMap(() => this.getCount()))
        .subscribe(
          (res) => {
            const data = JSON.parse(res.body);
            if (data && data.results != null) {
              if (this.isShowQuickView && data.results != 0
                && this.unReadNotificationCount != data.results) {
                this.loadQuickView();
              }
              if ((!this.unReadNotificationCount && data.results) ||
                (this.unReadNotificationCount && data.results && this.unReadNotificationCount < data.results)) {
                this.playSound();
              }
              UtilsHelper.setObject('notificationCount', data.results);
              this.unReadNotificationCount = data.results;
              this.updateTitle();
            }
          },
          error => console.log(error));
    } catch (ex) {
      console.log('GetNotification Count Error', ex);
    }
  }

  openMessage(row) {
    this.markAsRead();
    this.isShowQuickView = false;
    this.router.onSameUrlNavigation = 'reload';
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    switch (row.category) {
      case 'Matter':
        this.router.navigate(['/matter/dashboard'], { queryParams: { matterId: row.targetEntityId } });
        break;
      case 'Matters':
        this.router.navigate(['/matter/dashboard'], { queryParams: { matterId: row.targetEntityId } });
        break;
      case 'Matter Ledger':
        this.router.navigate(['/matter/dashboard'], { queryParams: { matterId: row.targetEntityId, selectedtab: 'ledger' } });
        break;
      case 'Client':
        this.router.navigate(['/client-view/individual'], { queryParams: { clientId: row.targetEntityId } });
        break;
      case 'Potential Client':
        this.router.navigate(['/contact/view-potential-client'], { queryParams: { clientId: row.targetEntityId, state: 'view' } });
        break;
      case 'Potential Clients':
        this.router.navigate(['/contact/view-potential-client'], { queryParams: { clientId: row.targetEntityId, state: 'view' } });
        break;
      case 'Employee':
        this.router.navigate(['/employee/profile'], { queryParams: { employeeId: row.targetEntityId } });
        break;
      case 'Calendar':
        this.router.navigate(['/calendar/list']);
        break;
      case 'Office':
        this.router.navigate(['/office/detail'], { queryParams: { officeId: row.targetEntityId, state: 'view' } });
        break;
      case 'Profile Billing':
        this.router.navigate(['/employee/profile'], { queryParams: { employeeId: row.targetEntityId } });
        break;
      case 'Pre Bill':
        this.router.navigate(['/billing/pre-bills/list']);
        break;
      case 'Calendar Event':
        this.router.navigate(['/calendar/list'], { queryParams: { eventId: row.targetEntityId } });
        break;
      case 'Timesheet':
        this.router.navigate(['/timekeeping/all-timesheets']);
        break;
      case 'JobFamily':
        this.router.navigate(['/firm/job-families/edit/' + row.targetEntityId]);
        break;
      case 'DMS Path':
        this.router.navigate(['/manage-folders/document'], { queryParams: { folderId: row.targetEntityId } });
        break;
      case 'DMS Matter Folder':
        this.router.navigate(['/manage-folders/document'], { queryParams: { folderId: row.targetEntityId } });
        break;
    }
  }

  viewAllNotifications() {
    UtilsHelper.setObject('clearNotificationCount', true);
    this.isShowQuickView = false;
    this.router.onSameUrlNavigation = 'reload';
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.navigate(['/notifications/all']);
  }

  getCount() {
    if (UtilsHelper.getToken()) {
      return this.notificationService.v1NotificationGetUnreadNotificationCountBellIconGet$Response({});
    } else {
      return [];
    }
  }

  markAsRead() {
    const unReadMessageIds = [];
    this.quickViewList.forEach(record => {
      if (!record.markAsRead) {
        unReadMessageIds.push(record.id);
      }
    });


    if (!unReadMessageIds.length) {
      return;
    }

    this.notificationService
      .v1NotificationUpdateMarkAsReadPut$Json$Response({ body: unReadMessageIds }).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          const parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            this.getCountOnInit();
          }
        }
      });
  }

  getCountOnInit() {
    const clearNotificationCount = UtilsHelper.getObject('clearNotificationCount');
    if (clearNotificationCount) {
      return true;
    }
    this.notificationService
      .v1NotificationGetUnreadNotificationCountBellIconGet$Response({}).subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          const parsedRes = JSON.parse(res.body);
          if (parsedRes != null) {
            if ((!this.unReadNotificationCount && parsedRes.results) ||
              (this.unReadNotificationCount && this.unReadNotificationCount < parsedRes.results)) {
              if (!localStorage.getItem('firstTimeLoadTopBar')) {
                UtilsHelper.setObject('firstTimeLoadTopBar', true);
              } else if (parsedRes.results > 0 && localStorage.getItem('notificationCount') != parsedRes.results) {
                this.playSound();
              }
            }
            UtilsHelper.setObject('notificationCount', parsedRes.results);
            this.unReadNotificationCount = parsedRes.results;
            this.updateTitle();
          }
        }
      }, err => {
        this.unReadNotificationCount = 0;
      });
  }

  playSound() {
    const audio = new Audio();
    audio.src = 'assets/tones/notifcation-tone.mp3';
    audio.load();
    audio.play();
  }

  public doLogout() {
    this.commonService.isLogOutRequest.next(true);
  }


  /**
   * Get Profile Picture for Employee
   */
  private getProfilePicture() {
    this.sharedService.profilePictureLink$.subscribe(res => {
      this.profileImage = res;
    });
  }

  /**
   *
   * Fetch searchResult
   */
  public getsearchResult(search: string, isNewReq: boolean = false) {
    if (!this.searchResultList.length) {
      this.showSearchBox = false;
    }
    if (this.request) {
      this.request.unsubscribe();
    }
    this.previousSearch = search;
    if (search && search !== '' && search.length >= 3) {
      const pageindex = (isNewReq) ? 1 : +this.pageIndex;
      this.isSearchLoading=true;
      this.showSearchBox=true;
      this.request = this.miscService.v1MiscSearchGlobalGet$Response({
        searchString: search,
        isAll: this.searchFormat.isAll,
        isDocument: this.searchFormat.isDocument,
        isClient: this.searchFormat.isClient,
        isEmployee: this.searchFormat.isEmployee,
        isContact: this.searchFormat.isContact,
        isOffice: this.searchFormat.isOffice,
        isMatter: this.searchFormat.isMatter,
        pageIndex: pageindex,
        pageSize: 10,
        searchFilterStr: this.searchFilterStr
      }).subscribe(res => {
        const result: any = JSON.parse(res.body as any).results;
        const list = result.searchResults;
        if (!list.length || list.length < 10) {
          this.noResultFound = true;
        }
        if (list.length >= 0) {
          this.totalResultCount = result.searchResultCount;
        }
        if (isNewReq) {
          this.searchResultList = this.originalSearchResultList = list;
        } else {
          this.searchResultList = this.searchResultList.concat(list);
          this.originalSearchResultList = this.searchResultList;
        }
        this.showSearchBox = true;
        this.filterListOnPermissions();
        this.isSearchLoading=false;
      });
    } else {
      this.searchResultList = [];
      this.showSearchBox = false;
      this.isSearchLoading=false;
    }
  }

  /**
   *
   *
   */
  public changeFilter(type: string) {
    type = type.toUpperCase();
    this.allFiltersfalse();
    const filter = this.searchFilter;
    switch (type) {
      case 'ALL':
        this.searchFilter = 'All';
        this.searchFormat.isAll = true;
        break;
      case 'MATTERS':
        this.searchFilter = 'Matters';
        this.searchFormat.isMatter = true;
        break;
      case 'CLIENTS':
        this.searchFilter = 'Clients';
        this.searchFormat.isClient = true;
        break;
      case 'DOCUMENTS':
        this.searchFilter = 'Documents';
        this.searchFormat.isDocument = true;
        break;
      case 'OFFICES':
        this.searchFilter = 'Offices';
        this.searchFormat.isOffice = true;
        break;
      case 'EMPLOYEES':
        this.searchFilter = 'Employees';
        this.searchFormat.isEmployee = true;
        break;
      case 'CONTACTS':
        this.searchFilter = 'Contacts';
        this.searchFormat.isContact = true;
        break;
    }
    if (this.searchResultList.length && filter === 'All') {
      this.filterList(type);
    }
    if (filter !== this.searchFilter) {
      this.noResultFound = false;
      this.searchResultList = [];
      this.getsearchResult(this.searchText.value, true);
    }
  }

  public allFiltersfalse() {
    this.searchFormat.isAll = false;
    this.searchFormat.isClient = false;
    this.searchFormat.isContact = false;
    this.searchFormat.isDocument = false;
    this.searchFormat.isEmployee = false;
    this.searchFormat.isMatter = false;
    this.searchFormat.isOffice = false;
  }

  private filterList(type: string) {
    switch (type) {
      case 'ALL':
        this.searchResultList = this.originalSearchResultList;
        break;
      case 'MATTER':
        this.searchResultList = this.originalSearchResultList.filter(item => item.resultType === 'Matter');
        break;
      case 'CLIENTS':
        this.searchResultList = this.originalSearchResultList.filter(item => item.resultType === 'Client');
        break;
      case 'DOCUMENTS':
        this.searchResultList = this.originalSearchResultList.filter(item => item.resultType === 'Document');
        break;
      case 'OFFICES':
        this.searchResultList = this.originalSearchResultList.filter(item => item.resultType === 'Office');
        break;
      case 'EMPLOYEES':
        this.searchResultList = this.originalSearchResultList.filter(item => item.resultType === 'Employee');
        break;
      case 'CONTACTS':
        this.searchResultList = this.originalSearchResultList.filter(item => item.resultType === 'Contact');
        break;

    }
  }

  public viewAll() {
    this.searchResultList = [];
    const url = this.router.url.substr(0, 7);
    if (url === '/search') {
      this.refreshPage();
    } else {
      this.router.navigate(['/search'], { queryParams: { searchString: this.searchText.value, searchFilter: this.searchFilter, searchFilterStr: this.searchFilterStr } });
    }
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
  public redirecttoDMS(row) {
    const folderIndx = row.metaData.findIndex(x => x.id === 'FolderId');
    if (folderIndx > -1) {
      this.searchResultList = [];
      const navigationExtras: NavigationExtras = {
        state: {
          docPath: row.metaData[folderIndx].name
        }
      };

      if (row.resultName) {
        navigationExtras.state.fileName = row.resultName;
      }

      if (this.router.url.includes('/manage-folders')) {
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;
        this.router.onSameUrlNavigation = 'reload';
        this.router.navigate([], navigationExtras);
      } else {
        this.router.navigate(['/manage-folders'], navigationExtras);
      }
    }
  }

  /**
   *
   * @param row
   * Function to redirect to contact
   */
  public redirecttoContact(row) {
    if (row.metaData[10].name === 'True') { // For IsClientAsscoiation
      this.router.navigate(['/contact/edit-client-association'], { queryParams: { clientId: row.id, isViewMode: 1 } });
    } else if (row.metaData[11].name === 'True') { // For IsCorporate
      this.router.navigate(['/contact/create-corporate-contact'], { queryParams: { contactId: row.id } });
    } else if (row.metaData[12].name === 'True') { // For isPotential-client
      this.router.navigate(['/contact/view-potential-client'], { queryParams: { clientId: row.id, state: 'view' } });
    } else { }

    this.searchResultList = [];
  }

  /**
   * @param options
   * Fucntion to refresh the current page
   */
  refreshPage(type?: string, path?: string, options?: NavigationExtras): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    if (!type) {
      this.router.navigate(['/search'], { queryParams: { searchString: this.searchText.value, searchFilter: this.searchFilter, searchFilterStr: this.searchFilterStr } });
    }
    if (type && path && options) {
      this.router.navigate([this.router.url], options);
    }
  }

  getFiltersList() {
    this.searchService.v1SearchAllmodulesGet().subscribe(res => {
      this.searchFilterList = JSON.parse(res as any).results;
      if (!this.permissionList.MATTER_MANAGEMENTisAdmin && !this.permissionList.MATTER_MANAGEMENTMATTER_MANAGEMENTisViewOnly && !this.permissionList.MATTER_MANAGEMENTisEdit) {
        this.searchFilterList = this.searchFilterList.filter(obj => obj.moduleName.toLowerCase() !== 'matters');
        this.matterPermission = false;
      }
      if (!this.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin && !this.permissionList.CLIENT_CONTACT_MANAGEMENTisEdit && !this.permissionList.CLIENT_CONTACT_MANAGEMENTisViewOnly) {
        this.searchFilterList = this.searchFilterList.filter(obj => obj.moduleName.toLowerCase() !== 'clients' && obj.moduleName.toLowerCase() !== 'contacts');
        this.clientPermission = false;
        this.contactPermission = false;
      }
      this.searchFilterStr = '';
      const searchFilterArray = [];
      this.searchFilterList.forEach(value => {
        searchFilterArray.push(value.id);
      });
      this.searchFilterStr = searchFilterArray.join(',');
    });
  }

  openMenu(): void {
    setTimeout(() => {
      this.currentActive = !this.currentActive;
    }, 50);

  }
  openMenu1(): void {
    setTimeout(() => {
      this.currentActive1 = !this.currentActive1;
    }, 50);

  }

  onClickedOutside(event?: any) {
    this.currentActive = false;
  }
  onClickedOutside1(event?: any) {
    this.currentActive1 = false;
  }

  @HostListener('scroll', ['$event']) onScroll(event: any) {
    if ((event.target.offsetHeight + event.target.scrollTop >= event.target.scrollHeight - 5) && !this.noResultFound) {
      const index = this.searchResultList.length / 10;
      this.pageIndex = Math.ceil(index + 1);
      this.getsearchResult(this.searchText.value);
    }
  }

  onsearchResultOutsideClick(event?: any) {
    if (event.target.id === 'globalSearchBtnId' || event.target.id === 'q') {
      return;
    }
    this.showSearchBox = false;
  }

  onSearchBoxClick() {
    let searchString = this.searchText.value;
    if( searchString && searchString.trim()!='' && searchString.length >=3){
      if (searchString === this.previousSearch) {
        this.showSearchBox = true;
        return;
      }
      this.noResultFound = false;
      this.searchResultList =[];
      this.getsearchResult(searchString, true);
    }
  }

  getHeaderName(name: string) {
    if (name.length > 24) {
      name = name.slice(0, 24);
      name = name + '...';
    }
    return name;
  }
  getCategoryName(name: string) {
    if (name.length > 15) {
      name = name.slice(0, 15);
      name = name + '...';
    }
    return name;
  }


  filterListOnPermissions() {
    if (!this.matterPermission) {
      this.searchResultList = this.searchResultList.filter(item => item.resultType.toLowerCase() !== 'matter');
    }
    if (!this.clientPermission || !this.contactPermission) {
      this.searchResultList = this.searchResultList.filter(item => item.resultType.toLowerCase() !== 'client' && item.resultType.toLowerCase() !== 'contact');
    }
  }

  getContactType(item?: any) {
    let type: string;
    if (item.metaData[10].name === 'True') {
      type = 'Client Association';
    } else if (item.metaData[11].name === 'True') {
      type = 'Corporate Contact';
    } else if (item.metaData[12].name === 'True') {
      type = 'Potential Client';
    } else {
      type = '--';
    }
    return type;
  }

  getFormattedPhoneNumber(phone: any) {
    let formattedPhone;
    if (phone && phone !== '--' && phone !== '') {
      formattedPhone = '(' + phone.substr(0, 3) + ') ' + phone.substr(3, 3) + '-' + phone.substr(6, 4);
    } else {
      formattedPhone = (phone) ? phone : '--';
    }
    return formattedPhone;
  }

  redirectToPage(row: any) {
    this.showSearchBox = false;
    switch (row.resultType) {
      case 'Matter':
        this.router.navigate(['/matter/dashboard'], { queryParams: { matterId: row.id } });
        break;
      case 'Client':
        this.router.navigate(['/client-view/individual'], { queryParams: { clientId: row.id } });
        break;
      case 'Employee':
        this.router.navigate(['/employee/profile'], { queryParams: { employeeId: row.id } });
        break;
      case 'Office':
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;
        this.router.onSameUrlNavigation = 'reload';
        this.router.navigate(['/office/detail'], { queryParams: { officeId: row.id, state: 'view' } });
        break;
      case 'Contact':
        this.redirecttoContact(row);
        break;
      case 'Document':
        this.redirecttoDMS(row);
        break;
    }
  }

  addClass(isadd: boolean, item?: any, category?: any) {
    const length = category ? 15 : 24;
    const elementId = category ? 'categoryHeading_' + item.id : 'mainHeading_' + item.id;
    const element = document.getElementById(elementId);
    const name = item.resultName;
    if (isadd && name.length > length) {
      element.classList.add('text-underline');
    } else {
      element.classList.remove('text-underline');
    }
  }

  logTime() {
    this.modalService.open(LogTimeComponent, {
      centered: true,
      windowClass: 'modal-xlg',
      backdrop: 'static'
    });
  }


}