import { DatePipe } from '@angular/common';
import {
  AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy,
  OnInit, Output, Renderer2, ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import { default as timeGridPlugin, default as timeGrigPlugin } from '@fullcalendar/timegrid';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { debounceTime, finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as timezone from 'src/app/service/timezones.json';
import * as fromRoot from 'src/app/store';
import * as fromPermissions from 'src/app/store/reducers/permission.reducer';
import { vwCalendarSettings, vwFullPerson, vwIdCodeName, vwMatterEvents, vwMatterType } from 'src/common/swagger-providers/models';
import { CalendarService, MatterService, MiscService, NoteService } from 'src/common/swagger-providers/services';
import { IEventType, IOffice, IPRofile, vwMatterEventsDetails } from '../../models';
import { CaledarFilterOptions, CalendarSearchResult, ISearchUser, ShowCaledarFilterOptions } from '../../models/calendar-filter';
import { getWorkingHour, WORKING_DAYS } from '../../models/office-data';
import * as errorData from '../../shared/error.json';
import { PersonRole } from '../const';
import { CreateCalendarEventComponent } from '../create-calendar-event/create-calendar-event.component';
import { DialogService } from '../dialog.service';
import { sleep, UtilsHelper } from '../utils.helper';

interface IAccepted {
  yes: number;
  maybe: number;
  declined: number;
  awaiting: number;
}

@Component({
  selector: 'app-calendar-list',
  templateUrl: './calendar-list.component.html',
  styleUrls: ['./calendar-list.component.scss']
})
export class CalendarListComponent implements OnInit, AfterViewInit, OnDestroy {
  public filterName = 'Apply Filter';
  public title: string;
  public currentActive: number;
  public orgSearchUserList: any = [];
  public subscriptionList: any = [];
  private eventList: Array<any> = [];
  private resourceEventList: Array<vwMatterEvents> = [];
  @Input() pageType: string;
  @Input() clientId: number;
  @Input() attorneyDetail: any;
  @Input() matterId: number;
  @Input() isTrustAccountEnabled: boolean;
  @Output() readonly nextStep = new EventEmitter<any>();
  @Output() readonly prevStep = new EventEmitter<any>();
  @Output() readonly goBack = new EventEmitter<string>();
  @ViewChild('calendar', {static: false}) calendarComponent: FullCalendarComponent; // the #calendar in the template
  @ViewChild('datePickerInput', {static: false}) datePicker: ElementRef;
  public calendarVisible = true;
  public isDatePickerOpen = false;
  public calendarPlugins = [
    dayGridPlugin,
    timeGrigPlugin,
    interactionPlugin,
    resourceTimeGridPlugin,
  ];
  public calendarWeekends = true;
  public showTimeZoneDetail = false;
  public calendarEvents: EventInput[] = [];
  public eventTimeFormat = {
    hour: '10',
    minute: '30',
    hour12: true
  };
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  public peoples = [];
  public options = [];
  public eventsModel: any;
  public userDetails: IPRofile;
  public sideBar: boolean = true;
  public filterSelected: string = 'all';
  public matterTypeList: Array<vwMatterType> = [];
  public calendar_key: string;
  public eventTypeList: Array<IEventType> = [];
  public clientList: Array<IOffice> = [];
  public potentialClientList: Array<IOffice> = [];
  public inviteeClientList: Array<IOffice> = [];
  public inviteePotentialClientList: Array<IOffice> = [];
  public employeeList: Array<IOffice> = [];
  public matterList: Array<IOffice> = [];
  public subscribedMatterList = [];
  public subscribedPeopleList = [];
  public peopleRole = [];
  public orgSubscribedPeopleList = [];
  public selectedRole: any;

  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public searchControl = new FormControl();
  public calendarSearchResults: Array<CalendarSearchResult> = [];
  public showResults = false;
  public displayDrpDwn: boolean = false;
  public calendarFilter: CaledarFilterOptions;
  public showFilterOptions: ShowCaledarFilterOptions;
  private inviteeSubscribe: Subscription;
  public openEditModelPopup: boolean = false;
  public openEditModelPopupNotification: boolean = false;
  public busyPrivacyPopup: boolean = false;
  public cancelConsultationPopup: boolean = false;
  public cancelConsultationContent: string;
  public eventTypeConsultation: boolean = false;
  public eventDetails: vwMatterEventsDetails;
  public modelRef: any;
  public eventAcceptStatusList: Array<vwIdCodeName> = [];
  public acceptedUser: IAccepted = {
    yes: 0,
    maybe: 0,
    declined: 0,
    awaiting: 0
  };
  public eventOrganizerDetls: any;
  public inviteeType: string = 'invitee';
  public showLoggedUserEvents: boolean = true;
  public myCalendar: boolean = true;
  public errorData: any = (errorData as any).default;
  public resourceArray: Array<any> = [];
  public resourceviewEventsArray: Array<any> = [];
  public fileName: any = [];
  public monthyearArr = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12
  };
  public calendarMonthYear = {month: 0, year: 0};
  public employeeEventsCache: { [id: number]: Array<vwMatterEvents> };
  public isResourceViewMode: boolean = false;
  public observer: any;
  private closeClick: boolean = true;
  public calendarSettings: vwCalendarSettings;
  public defaultView: string = 'timeGridWeek';
  public workingHoursList: Array<any> = [];
  public tempMatterList: Array<any> = [];
  public loggedUserWorkingHoursList: Array<any> = [];
  public calendarViewType: string;
  public eventmodRight: boolean = false;
  public innerHeight: any;
  public modalPaddingTop: any;
  public colorMapping: Array<string> = [
    'F44436', 'EA1E63', '9C27B0', '673AB7', '1d7220', '2096F3',
    '05A9F4', '02BCD4', '009688', '4CAF50', '8BC34A', 'CDDC39',
    'FFEB3B', 'FFC108', 'FF9800', 'FF5821'
  ];
  public eventColorMap = {
    '453599': {bordercolor: '#453599', bgcolor: '#C7CCEF'},
    'F44436': {bordercolor: '#F44436', bgcolor: '#FBC6C2'},
    'EA1E63': {bordercolor: '#EA1E63', bgcolor: '#F8BBD0'},
    '9C27B0': {bordercolor: '#9C27B0', bgcolor: '#E1BEE7'},
    '673AB7': {bordercolor: '#673AB7', bgcolor: '#D1C3E9'},
    '1d7220': {bordercolor: '#1d7220', bgcolor: '#8be18e'},
    '2096F3': {bordercolor: '#2096F3', bgcolor: '#BCDFFB'},
    '05A9F4': {bordercolor: '#05A9F4', bgcolor: '#B4E5FB'},
    '02BCD4': {bordercolor: '#02BCD4', bgcolor: '#B3EAF2'},
    '009688': {bordercolor: '#009688', bgcolor: '#B2DFDB'},
    '4CAF50': {bordercolor: '#4CAF50', bgcolor: '#C9E7CA'},
    '8BC34A': {bordercolor: '#8BC34A', bgcolor: '#DCEDC8'},
    'CDDC39': {bordercolor: '#CDDC39', bgcolor: '#F0F4C3'},
    'FFEB3B': {bordercolor: '#FFEB3B', bgcolor: '#FFF9C4'},
    'FFC108': {bordercolor: '#FFC108', bgcolor: '#FFECB4'},
    'FF9800': {bordercolor: '#FF9800', bgcolor: '#FFE0B2'},
    'FF5821': {bordercolor: '#FF5821', bgcolor: '#FFCCBC'},
  };
  private weekdays = ['SUN', 'MON', 'TUES', 'WED', 'THU', 'FRI', 'SAT'];
  public selectedMoment: any;
  private eventOriList: Array<any> = [];
  private timeZoneList: Array<any> = [];
  public localTimeZone: any;
  public searchUserList: Array<ISearchUser> = [];
  public selectedFilterUser: Array<ISearchUser> = [];
  private searchResultEvents: any = {};
  private subscribeFilterEvents: any = {};
  public loading: boolean;
  public matterFilterId: number;
  public employeeFilterId: number;
  public employeeName: string;
  public isInitialMatterFilterCall: boolean = true;
  public isInitialEmployeeFilterCall: boolean = true;
  public searchLoading: boolean;
  public isEventCancelled: boolean;
  public view: any;
  public notificationEventId = 0;
  public newPotentialClientData: any;
  public showMoreFilters = false;
  public currentSearchPageNumber = 1;
  public totalSearchResults: any;
  timezones: any = (timezone as any).default;
  myTimezone: any;
  isLongEvent: boolean;
  eventLoading: boolean;
  calendarTitle = '';
  allDayHtml: string;
  timeZones: any = [];
  userTimezone: any;
  timeZoneEnum = {
    'Hawaiian Standard Time': 'HT',
    'Pacific Standard Time': 'PT',
    'Mountain Standard Time': 'MT',
    'Central Standard Time': 'CT',
    'Eastern Standard Time': 'ET',
    'Alaskan Standard Time': 'AT',
  };
  timeZoneNameEnum = {
    'HT': 'HT (GMT-10:00)',
    'PT': 'PT (GMT-08:00)',
    'MT': 'MT (GMT-07:00)',
    'CT': 'CT (GMT-06:00)',
    'ET': 'ET (GMT-05:00)',
    'AT': 'AT (GMT-09:00)',
  };
  empTimezoneList = [];
  timezoneLoading: boolean = true;
  loggedInUserTimezone = UtilsHelper.getObject('userTimezone');
  public multiDayEvent: boolean = false;
  public daysList =  {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private calendarService: CalendarService,
    private matterService: MatterService,
    private modalService: NgbModal,
    private toastDisplay: ToastDisplay,
    private dialogService: DialogService,
    private noteService: NoteService,
    private renderer: Renderer2,
    private miscService: MiscService,
    private appConfigService: AppConfigService,
    private activatedRoute: ActivatedRoute,
    private elementRef: ElementRef,
    private pagetitle: Title,
    private store: Store<fromRoot.AppState>,
    private datePipe: DatePipe
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.calendarFilter = new CaledarFilterOptions();
    this.showFilterOptions = new ShowCaledarFilterOptions();
    this.employeeEventsCache = {};

    this.searchControl.valueChanges.pipe(debounceTime(500)).subscribe(res => {
      if (res) {
        this.getSearchUser(res);
      }
      else{
        this.searchUserList =  [];
      }
    });

    this.calendar_key = this.appConfigService.appConfig.calendar_key;
    if (
      this.router.getCurrentNavigation() &&
      this.router.getCurrentNavigation().extras &&
      this.router.getCurrentNavigation().extras.state
    ) {
      this.newPotentialClientData = this.router.getCurrentNavigation().extras.state.potentialClient;
    }
  }

  gotoPast() {
    let calendarApi = this.calendarComponent.getApi();

    calendarApi.gotoDate('2000-01-01');
  }

  handleDateClick(arg) {
    if (confirm('Would you like to add an event to ' + arg.dateStr + ' ?')) {
      this.calendarEvents = this.calendarEvents.concat({
        title: 'New Event',
        start: arg.date,
        allDay: arg.allDay
      });
    }
  }

  public scrollChanged($event) {
    if (this.searchUserList.length < this.totalSearchResults) {
      this.currentSearchPageNumber++;
      this.getSearchUser(this.searchControl.value, this.currentSearchPageNumber);
    }
  }

  isToday(givenDate) {
    const today = new Date();
    return givenDate.getDate() === today.getDate() &&
      givenDate.getMonth() === today.getMonth() &&
      givenDate.getFullYear() === today.getFullYear();
  }

  ngOnInit() {
    $(document).click((event) => {
      if ($(event.target).parents('#employee-timezone-list').length || $(event.target).parents('#employee-timezone-small').length) {
        this.setUserTimeZoneDetail();
      } else {
        this.setUserTimeZoneSmall();
      }
    })
    this.userDetails = UtilsHelper.getLoginUser();
    this.getTimeZoneList()
    this.pagetitle.setTitle("Calendar View");
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
        }
      }
    });

    var date = new Date();
    this.calendarMonthYear.month = date.getMonth() + 1;
    this.calendarMonthYear.year = date.getFullYear();
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    let calView = UtilsHelper.getObject('calendarView');
    if (calView) {
      switch (calView) {
        case  1:
          this.defaultView = "timeGridDay";
          break;
        case  2:
          this.defaultView = "agendaFiveDay";
          break;
        case  3:
          this.defaultView = 'timeGridWeek';
          break;
        case  4:
          this.defaultView = 'dayGridMonth';
          break;
        default:
          this.defaultView = 'timeGridWeek';
      }
    }
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
      alwaysVisible: true
    };
    /* Calendar Options */
    this.options[0] = {
      editable: true,
      nowIndicator: true,
      now: this.changeTimezone(new Date(), this.myTimezone),
      theme: 'standart', // default view, may be bootstrap
      eventLimit: true,
      views: {
        agendaFiveDay: {
          type: 'timeGridWeek',
          dayCount: 5,
          buttonText: '5 day',
          hiddenDays: [0, 6],
          titleFormat: {year: 'numeric', month: 'long'},
          columnHeaderHtml: (dateValue) => {
            if (this.isToday(dateValue)) {
              return '<div><span class="font-16">' + this.weekdays[dateValue.getDay()] + '</span></div>' +
                '<div><span class="font-24 text-body-color font-weight-medium today">' + dateValue.getDate() + '</span></div>';
            }
            return '<div><span class="font-16">' + this.weekdays[dateValue.getDay()] + '</span></div>' +
              '<div><span class="font-24 text-body-color font-weight-medium">' + dateValue.getDate() + '</span></div>';
          },
        },
        timeGridWeek: {
          titleFormat: {year: 'numeric', month: 'long'},
          columnHeaderHtml: (dateValue) => {
            if (this.isToday(dateValue)) {
              return '<div><span class="font-16">' + this.weekdays[dateValue.getDay()] + '</span></div>' +
                '<div><span class="font-24 text-body-color font-weight-medium today">' + dateValue.getDate() + '</span></div>';
            }
            return '<div><span class="font-16">' + this.weekdays[dateValue.getDay()] + '</span></div>' +
              '<div><span class="font-24 text-body-color font-weight-medium">' + dateValue.getDate() + '</span></div>';
          }
        },
        dayGridMonth: {
          eventLimit: 5,
          dayPopoverFormat: { day: '2-digit', weekday: 'short' },
        },
        timeGridDay: {
          titleFormat: {year: 'numeric', month: 'long'},
          columnHeaderHtml: (dateValue) => {
            if (this.isToday(dateValue)) {
              return '<div><span class="font-16">' + this.weekdays[dateValue.getDay()] + '</span></div>' +
                '<div><span class="font-24 text-body-color font-weight-medium today">' + dateValue.getDate() + '</span></div>';
            }
            return '<div><span class="font-16">' + this.weekdays[dateValue.getDay()] + '</span></div>' +
              '<div><span class="font-24 text-body-color font-weight-medium">' + dateValue.getDate() + '</span></div>';
          }
        }
      },
      header: false,
      plugins: [
        dayGridPlugin,
        interactionPlugin,
        timeGridPlugin,
        resourceTimeGridPlugin
      ],
      week: {
        timeFormat: 'H:mm' //this will return 23:00 time format
      },
      businessHours: {
        daysOfWeek: [1, 2, 3, 4, 5],
        startTime: '08:00',
        endTime: '18:00',
      },
      resources: [],
      scrollTime: '06:00:00'
    };

    this.options[1] = {
      editable: true,
      nowIndicator: true,
      now: this.changeTimezone(new Date(), this.myTimezone),
      businessHours: {
        daysOfWeek: [1, 2, 3, 4, 5],
        startTime: '08:00',
        endTime: '18:00',
      },
      theme: 'standart', // default view, may be bootstrap
      eventLimit: true,
      views: {
        agendaFiveResourceDay: {
          type: 'resourceTimeGridWeek',
          dayCount: 5,
          buttonText: '5 day',
          hiddenDays: [0, 6],
          titleFormat: {year: 'numeric', month: 'long'},
          columnHeaderHtml: (dateValue) => {
            if (this.isToday(dateValue)) {
              return '<div><span class="font-16">' + this.weekdays[dateValue.getDay()] + '</span></div>' +
                '<div><span class="font-24 text-body-color font-weight-medium today">' + dateValue.getDate() + '</span></div>';
            }
            return '<div><span class="font-16">' + this.weekdays[dateValue.getDay()] + '</span></div>' +
              '<div><span class="font-24 text-body-color font-weight-medium">' + dateValue.getDate() + '</span></div>';
          }
        },
        resourceTimeGridWeek: {
          titleFormat: {year: 'numeric', month: 'long'},
          columnHeaderHtml: (dateValue) => {
            if (this.isToday(dateValue)) {
              return '<div><span class="font-16">' + this.weekdays[dateValue.getDay()] + '</span></div>' +
                '<div><span class="font-24 text-body-color font-weight-medium today">' + dateValue.getDate() + '</span></div>';
            }
            return '<div><span class="font-16">' + this.weekdays[dateValue.getDay()] + '</span></div>' +
              '<div><span class="font-24 text-body-color font-weight-medium">' + dateValue.getDate() + '</span></div>';
          }
        },
        dayGridMonth: {
          eventLimit: 5,
          dayPopoverFormat: { day: '2-digit', weekday: 'short' },
        },
        resourceTimeGridDay: {
          titleFormat: {year: 'numeric', month: 'long'},
          columnHeaderHtml: (dateValue) => {
            if (this.isToday(dateValue)) {
              return '<div><span class="font-16">' + this.weekdays[dateValue.getDay()] + '</span></div>' +
                '<div><span class="font-24 text-body-color font-weight-medium today">' + dateValue.getDate() + '</span></div>';
            }
            return '<div><span class="font-16">' + this.weekdays[dateValue.getDay()] + '</span></div>' +
              '<div><span class="font-24 text-body-color font-weight-mediumF">' + dateValue.getDate() + '</span></div>';
          }
        }
      },
      header: false
    };

    this.activatedRoute.queryParams.subscribe(value => {
      this.matterFilterId = +value.matterId;
      this.employeeFilterId = +value.employeeId;
      this.employeeName = value.employeeName;
      this.notificationEventId = +value.eventId;
      if (this.notificationEventId) {
        this.loading = true;
        this.getEventDetails();
      }
    });

    this.userDetails['name'] = this.userDetails.lastName
      ? this.userDetails.firstName + ' ' + this.userDetails.lastName
      : this.userDetails.firstName;
    let curr = new Date(); // get current date
    let first = curr.getDate() - curr.getDay();
    let last = first + 8; // last day is the first day + 8
    let firstday = new Date(curr.setDate(first)).setHours(0, 0, 0);
    let lastday = new Date(curr.setDate(last)).setHours(0, 0, 0);
    this.getList(moment(firstday).format('MM/DD/YYYY'), moment(lastday).format('MM/DD/YYYY'));
    this.getWorkingHours(this.userDetails, true);
    this.loadSystemTimeZones();
  }

  eventRenderFn(info) {
    info.el.setAttribute('data-event-id', info.event.id);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.getTitle();
    }, 100);
  }

  ngOnDestroy() {
    this.removeBodyClass();
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  getTimeZoneList() {
    this.userTimezone = this.timeZoneEnum[this.loggedInUserTimezone];
    this.miscService
      .v1MiscTimezonesGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.timeZones = res;
          this.timeZones = _.orderBy(this.timeZones,["name"],"asc");
          this.setEmpTimezoneList();
        } else {
          this.timezoneLoading = false;
        }
      }, () => {
        this.timezoneLoading = false;
      });
  }

  changeTimezone(date, ianatz) {
    // suppose the date is 12:00 UTC
    var invdate = new Date(date.toLocaleString('en-US', {
      timeZone: ianatz
    }));
    return invdate;
  }

  createEvent() {
    if (
      this.pageType == 'matter' ||
      this.pageType == 'clientconversion' ||
      this.pageType == 'potentialClient'
    ) {
      this.openCreateEventModal();
    } else {
      this.router.navigate(['/calendar/create-event']);
    }
  }

  changeCalendarView(viewName) {
    this.calendarComponent.getApi().changeView(viewName);
    this.getTitle();
  }

  goToPrevious() {
    this.calendarComponent.getApi().prev();
    this.getTitle();
  }

  goToNext() {
    this.calendarComponent.getApi().next();
    this.getTitle();
  }

  getTitle() {
    if (this.calendarComponent && this.calendarComponent.getApi()) {
      this.calendarTitle = this.calendarComponent.getApi().view.title;
    } else {
      this.calendarTitle = this.datePipe.transform(new Date(), 'MMMM yyyy');
    }
  }

  getEventDetails() {
    this.calendarService.v1CalendarEventsMatterEventIdGet({matterEventId: this.notificationEventId}).subscribe(async (data: any) => {
        let res: any = data;
        if (res) {
          res = JSON.parse(res as any).results;
          this.eventDetails = res;
          this.loading = true;
          this.navigateToDateIfDifferent();

          for (const data of this.eventDetails.invitees) {
            this.eventDetails['isSameDay'] = moment(this.eventDetails.startDateTime, 'DD-MM-YYYY').isSame(moment(this.eventDetails.endDateTime, 'DD-MM-YYYY'), 'day');
            data['proposalTimeString'] = data['proposedTime'] ? this.getProposalTimeString(data['proposedTime']) : "";
          }

          if (!this.openEditModelPopupNotification) {
            try {
              this.loading = true;
              let instance = this;
              let whileCount = 100;
              let aTag = document.querySelector(`a[data-event-id="${this.notificationEventId}"]`);

              while(!aTag && whileCount > 0) {
                await sleep(100);
                aTag = document.querySelector(`a[data-event-id="${this.notificationEventId}"]`);
                whileCount--;
              }

              let evt = {
                event: {
                  _def: {
                    publicId: this.notificationEventId
                  }
                },
                el: aTag,
                jsEvent: {},
                view: {}
              };
              instance.eventClickNotification(evt, instance.notificationEventId);
              this.loading = false;
            } catch {
              this.loading = false;
            }
          } else {
            this.loading = false;
          }
        }
      }, err => {
        console.log(err);
        this.loading = false;
      }
    )
  }


  openDatePicker() {
    this.isDatePickerOpen = !this.isDatePickerOpen;
  }

  closeDatePicker() {
    this.isDatePickerOpen = false;
  }

  setCalendarView($event, today: string = null) {
    let date = (today === 'today') ? new Date() : $event;
    this.calendarComponent.getApi().gotoDate(date);
    this.getTitle();
  }

  /**
   *
   * Function to Open create/edit event in Modal
   * @param type
   * @param id
   * @param startDate
   * @param endDate
   */
  openCreateEventModal(type?: string, id?: any, startDate?: Date, endDate?: Date) {
    let contactDetails = UtilsHelper.getObject('contactDetails');
    let data: any;
    if (contactDetails) {
      data = contactDetails.createDetails;
      data['generateTaskBuilderTasks'] = contactDetails.matterDetails.generateTaskBuilderTasks;
      delete data.matterAssociationPersonId;
    }
    if (event) {
      let modalRef = this.modalService.open(CreateCalendarEventComponent, {
        centered: true,
        keyboard: false,
        size: 'xl',
        backdrop: 'static',
        windowClass: 'app-calender-event-modal'
      });
      if (type == 'Edit') {
        modalRef.componentInstance.isEditMode = true;
        modalRef.componentInstance.eventId = id;
        modalRef.componentInstance.startTime = startDate;
        modalRef.componentInstance.endTime = endDate;
      } else {
        if (this.pageType == 'matter') {
          modalRef.componentInstance.MatterId = this.matterId;
          modalRef.componentInstance.selectedStartTime = startDate;
          modalRef.componentInstance.selectedEndTime = endDate;
        }
        if (this.pageType == 'clientconversion') {
          modalRef.componentInstance.clientConversionId = this.clientId;
          modalRef.componentInstance.MatterId = this.matterId;
          modalRef.componentInstance.selectedStartTime = startDate;
          modalRef.componentInstance.selectedEndTime = endDate;
        }
        if (this.pageType == 'potentialClient') {
          modalRef.componentInstance.potentialClientId = this.clientId;
          modalRef.componentInstance.attorneyDetails = this.attorneyDetail;
          modalRef.componentInstance.potentialClientDetails = data;
          modalRef.componentInstance.selectedStartTime = startDate;
          modalRef.componentInstance.selectedEndTime = endDate;
        }
        modalRef.componentInstance.startTime = startDate;
        modalRef.componentInstance.endTime = endDate;
      }
      modalRef.result.then(res => {
        if (res) {
          console.log(res);
        }
      });
      modalRef.componentInstance.refresh.subscribe(suc => {
        if (suc) {
          this.getEvents(null);
        }
      })
    }
  }

  /***
   *
   * Function to redirect to Edit event Page
   */
  redirectEditEvent() {
    if (
      this.pageType == 'matter' ||
      this.pageType == 'clientconversion' ||
      this.pageType == 'potentialClient'
    ) {
      this.openCreateEventModal(
        'Edit',
        parseInt(this.modelRef.event._def.publicId)
      );
    } else {
      let id = parseInt(this.modelRef.event._def.publicId);
      this.router.navigate(['/calendar/edit-event', id]);
    }
  }

  /***
   *
   * Function to redirect to Edit event Page
   */
  redirectEditEventFromNotification() {
    if (
      this.pageType == 'matter' ||
      this.pageType == 'clientconversion' ||
      this.pageType == 'potentialClient'
    ) {
      this.openCreateEventModal(
        'Edit',
        this.notificationEventId
      );
    } else {
      let id = this.notificationEventId;
      this.router.navigate(['/calendar/edit-event', id]);
    }
  }

  /**
   *
   * Function to open busy Popup
   */
  openBusyPopup(event: any) {
    let eventId = event ? +event.event._def.publicId : 0;
    this.eventDetails = this.eventList.find(obj => obj.id === +eventId);
    if (
      this.eventDetails &&
      this.eventDetails.privacy &&
      this.eventDetails.privacy.name &&
      this.eventDetails.privacy.name == 'Private'
    ) {
      this.busyPrivacyPopup = true;
    }
  }

  /**
   *
   * Function to open Event Details
   */
  eventClick(model, id?: number) {
    this.openEditModelPopupNotification = false;
    this.closePrivacyPopup();
    this.closeCmodal();
    this.eventLoading = true;
    let eventId = model ? +model.event._def.publicId : id;
    if (!eventId) {
      return;
    }
    this.getEventFile(eventId);
    if (this.isResourceViewMode) {
      this.eventDetails = this.resourceEventList.find(obj => obj.id === +eventId);
    } else {
      this.eventDetails = this.eventList.find(obj => obj.id === +eventId);
    }
    this.acceptedUser.yes = 0;
    this.acceptedUser.maybe = 0;
    this.acceptedUser.declined = 0;
    this.acceptedUser.awaiting = 0;
    this.isLongEvent = (this.eventDetails && this.eventDetails.endDateTime && this.eventDetails.startDateTime) ? (moment(new Date(this.eventDetails.endDateTime)).diff(moment(new Date(this.eventDetails.startDateTime)), 'days')) > 0 : true;
    this.eventDetails['isSameDay'] = moment(this.eventDetails.startDateTime, 'DD-MM-YYYY').isSame(moment(this.eventDetails.endDateTime, 'DD-MM-YYYY'), 'day');
    const inviteeIds = [];
    this.calendarService.v1CalendarEventsProposedtimeListGet({
      eventId: this.eventDetails.id
    }).subscribe((result: any) => {
      const proposedTime = JSON.parse(result).results;
      if (this.eventDetails.invitees && this.eventDetails.invitees.length) {
        this.eventDetails.invitees.map(obj => {
          if (proposedTime && proposedTime.length) {
            const inviteeProposedTime = proposedTime.findIndex((proposal) => obj.person && proposal.personId === obj.person.id);
            if (inviteeProposedTime > -1) {
              obj['proposedTime'] = proposedTime[inviteeProposedTime];
              obj['proposalTimeString'] = this.getProposalTimeString(obj['proposedTime']);
            }
          }
          if (obj.acceptStatus === null) {
            this.acceptedUser.awaiting = +this.acceptedUser.awaiting + 1;
          }
          if (obj.acceptStatus && obj.acceptStatus.code === 'ACCEPTED') {
            this.acceptedUser.yes = +this.acceptedUser.yes + 1;
          }
          if (obj.acceptStatus && obj.acceptStatus.code === 'REJECTED') {
            this.acceptedUser.declined = +this.acceptedUser.declined + 1;
          }
          if (obj.acceptStatus && obj.acceptStatus.code === 'TENTATIVE') {
            this.acceptedUser.maybe = +this.acceptedUser.maybe + 1;
          }
          if (obj.person && obj.person.id === this.userDetails.id) {
            if (obj.isOrganiser || obj.isHost) {
              this.inviteeType = 'hostorganiser';
            }
          }
          if (obj.isOrganiser) {
            this.eventOrganizerDetls = obj;
          }
          if (obj.person) {
            inviteeIds.push(obj.person.id);
          }
        });
      }
      this.eventLoading = false;
    }, () => {
      this.eventLoading = false;
    });
    if (
      this.eventDetails &&
      this.eventDetails.privacy &&
      this.eventDetails.privacy.name &&
      this.eventDetails.privacy.name == 'Private' &&
      inviteeIds.indexOf(this.userDetails.id) === -1
    ) {
      this.busyPrivacyPopup = true;
    } else {

      this.eventTypeConsultation = this.eventDetails.eventType &&
        this.eventDetails.eventType.name &&
        this.eventDetails.eventType.name == 'Consultation';
      this.modelRef = model ? model : this.modelRef;
      this.openEditModelPopup = true;
      if (moment(this.eventDetails.endDateTime).format('DD') != moment(this.eventDetails.startDateTime).format('DD')) {
        this.multiDayEvent = true;
      } else {
        this.multiDayEvent = false;
      }
    }
    if (this.eventDetails.description) {
      let desc = this.eventDetails.description;
      desc = desc.replace(/<div(.*?)>[\s\S]*?<\/div>/g, '');
      this.eventDetails.description = desc;
    }

    if (model) {
      this.renderer.addClass(document.body, 'cmodal-open');
      setTimeout(() => {
        this.innerHeight = window.innerHeight;
        let ele = model.el.closest('a');
        if (model.el.closest('.fc-scroller')) {
          model.el.closest('.fc-scroller').style.overflow = 'hidden';
        }
        if (model.el.closest('.fc-day-grid-container')) {
          model.el.closest('.fc-day-grid-container').style.overflow = 'hidden';
        }
        let rect = ele.getBoundingClientRect();
        let modelPopup: any = document.querySelectorAll('.cmodal-event');
        let modalpopEvents = modelPopup[0].getBoundingClientRect();
        let ModalPopH = modalpopEvents.height / 2;

        this.modalPaddingTop = window.getComputedStyle(modelPopup[0], null).getPropertyValue('padding-top').replace("px", "");

        let modalArrow: any = document.querySelectorAll('.cmodal-event .arrow-point');
        this.eventmodRight = false;
        if (model.view && model.view.type === 'timeGridDay') {
          modelPopup[0].style.left = (rect.left + rect.width) / 2 + "px";
          this.eventmodRight = true;
        } else {
          modelPopup[0].style.left = rect.left - modalpopEvents.width + "px";
          if (modalpopEvents.width >= rect.left) {
            modelPopup[0].style.left = rect.left + rect.width + "px";
            this.eventmodRight = true;
          }
        }

        let EventBottomSpace = innerHeight - (rect.top + rect.height);
        if (EventBottomSpace < ModalPopH) {
          modelPopup[0].style.top = "auto";
          modelPopup[0].style.bottom = 0;
          let ModalTopSpace = innerHeight - modalpopEvents.height;
          if (modalArrow && modalArrow.length > 0) {
            modalArrow[0].style.top = ((rect.top + (rect.height / 2) - 10) - ModalTopSpace - this.modalPaddingTop) + "px";
          }
        } else if (rect.top < ModalPopH) {
          modelPopup[0].style.top = 0;
          if (modalArrow && modalArrow.length > 0) {
            modalArrow[0].style.top = (rect.top + (rect.height / 2) - 10) - this.modalPaddingTop + "px";
          }
        } else {
          modelPopup[0].style.top = rect.top - ModalPopH + "px";
          let ModalCentTopSpace = rect.top - ModalPopH;
          if (modalArrow && modalArrow.length > 0) {
            modalArrow[0].style.top = ((rect.top + (rect.height / 2) - 10) - ModalCentTopSpace - this.modalPaddingTop) + "px";
          }
        }
      }, 100);
    }

  }

  /**
   *
   * Function to open Event Details
   */
  eventClickNotification(model, id?: number) {
    let eventId = model ? +model.event._def.publicId : id;
    if (!eventId) {
      return;
    }
    this.getEventFile(eventId);
    if (!this.eventDetails) {
      return;
    }
    this.acceptedUser.yes = 0;
    this.acceptedUser.maybe = 0;
    this.acceptedUser.declined = 0;
    this.acceptedUser.awaiting = 0;
    let inviteeIds = [];
    this.eventDetails['isSameDay'] = moment(this.eventDetails.startDateTime, 'DD-MM-YYYY').isSame(moment(this.eventDetails.endDateTime, 'DD-MM-YYYY'), 'day');
    this.calendarService.v1CalendarEventsProposedtimeListGet({
      eventId: this.eventDetails.id
    }).subscribe((result: any) => {
      const proposedTime = JSON.parse(result).results;
      if (this.eventDetails.invitees && this.eventDetails.invitees.length) {
        this.eventDetails.invitees.map(obj => {
          if (proposedTime && proposedTime.length) {
            const inviteeProposedTime = proposedTime.findIndex((proposal) => obj.person && proposal.personId === obj.person.id);
            if (inviteeProposedTime > -1) {
              obj['proposedTime'] = proposedTime[inviteeProposedTime];
              obj['proposalTimeString'] = this.getProposalTimeString(obj['proposedTime']);
            }
          }
          if (obj.acceptStatus === null) {
            this.acceptedUser.awaiting = +this.acceptedUser.awaiting + 1;
          }
          if (obj.acceptStatus && obj.acceptStatus.code === 'ACCEPTED') {
            this.acceptedUser.yes = +this.acceptedUser.yes + 1;
          }
          if (obj.acceptStatus && obj.acceptStatus.code === 'REJECTED') {
            this.acceptedUser.declined = +this.acceptedUser.declined + 1;
          }
          if (obj.acceptStatus && obj.acceptStatus.code === 'TENTATIVE') {
            this.acceptedUser.maybe = +this.acceptedUser.maybe + 1;
          }
          if (obj.isOrganiser) {
            this.eventOrganizerDetls = obj;
          }
          if (obj.person) {
            inviteeIds.push(obj.person.id);
          }
        });
      }
      this.eventLoading = false;
    }, () => {
      this.eventLoading = false;
    });
    if (
      this.eventDetails &&
      this.eventDetails.privacy &&
      this.eventDetails.privacy.name &&
      this.eventDetails.privacy.name == 'Private' &&
      inviteeIds.indexOf(this.userDetails.id) === -1
    ) {
      this.busyPrivacyPopup = true;
    } else {
      this.eventTypeConsultation = this.eventDetails.eventType && this.eventDetails.eventType.name && this.eventDetails.eventType.name == 'Consultation';
      this.modelRef = model ? model : this.modelRef;
      this.openEditModelPopupNotification = true;
    }
    if (this.eventDetails.description) {
      let desc = this.eventDetails.description;
      desc = desc.replace(/<div(.*?)>[\s\S]*?<\/div>/g, '');
      this.eventDetails.description = desc;
    }
    if (model) {
      this.renderer.addClass(document.body, 'cmodal-open');
      setTimeout(() => {
        if (!model.el) {
          model.el = document.querySelector(`a[data-event-id="${eventId}"]`);
        }
        this.innerHeight = window.innerHeight;
        let ele = model.el.closest('a');
        if (model.el.closest('.fc-scroller')) {
          model.el.closest('.fc-scroller').style.overflow = 'hidden';
        }
        if (model.el.closest('.fc-day-grid-container')) {
          model.el.closest('.fc-day-grid-container').style.overflow = 'hidden';
        }
        let rect = ele.getBoundingClientRect();
        let modelPopup: any = document.querySelectorAll('.cmodal-event');
        let modalpopEvents = modelPopup[0].getBoundingClientRect();
        let ModalPopH = modalpopEvents.height / 2;

        this.modalPaddingTop = window.getComputedStyle(modelPopup[0], null).getPropertyValue('padding-top').replace("px", "");

        let modalArrow: any = document.querySelectorAll('.cmodal-event .arrow-point');
        this.eventmodRight = false;
        if (model.view && model.view.type === 'timeGridDay') {
          modelPopup[0].style.left = (rect.left + rect.width) / 2 + "px";
          this.eventmodRight = true;
        } else {
          modelPopup[0].style.left = rect.left - modalpopEvents.width + "px";
          if (modalpopEvents.width >= rect.left) {
            modelPopup[0].style.left = rect.left + rect.width + "px";
            this.eventmodRight = true;
          }
        }

        let EventBottomSpace = innerHeight - (rect.top + rect.height);
        if (EventBottomSpace < ModalPopH) {
          modelPopup[0].style.top = "auto";
          modelPopup[0].style.bottom = 0;
          let ModalTopSpace = innerHeight - modalpopEvents.height;
          if (modalArrow && modalArrow.length > 0) {
            modalArrow[0].style.top = ((rect.top + (rect.height / 2) - 10) - ModalTopSpace - this.modalPaddingTop) + "px";
          }
        } else if (rect.top < ModalPopH) {
          modelPopup[0].style.top = 0;
          if (modalArrow && modalArrow.length > 0) {
            modalArrow[0].style.top = (rect.top + (rect.height / 2) - 10) - this.modalPaddingTop + "px";
          }
        } else {
          modelPopup[0].style.top = rect.top - ModalPopH + "px";
          let ModalCentTopSpace = rect.top - ModalPopH;
          if (modalArrow && modalArrow.length > 0) {
            modalArrow[0].style.top = ((rect.top + (rect.height / 2) - 10) - ModalCentTopSpace - this.modalPaddingTop) + "px";
          }
        }
      });
    }
  }

  private navigateToDateIfDifferent() {
    let startDate = moment(this.eventDetails.startDateTime);
    let calendarAPI = this.calendarComponent.getApi();
    if (calendarAPI) {
      let currentDate = moment(calendarAPI.getDate());
      this.selectedMoment = startDate.toDate();

      if (!currentDate.isSame(startDate, 'd')) {
        calendarAPI.gotoDate(startDate.toDate());
      }

      calendarAPI.scrollToTime(startDate.subtract(30, 'minutes').format('HH:mm'));

      this.getTitle();
    }
  }

  /* For close event popup */
  closeCmodal() {
    this.openEditModelPopup = false;
    this.removeBodyClass();
  }

  /* For close event popup */
  closeCmodalNotification() {
    this.openEditModelPopupNotification = false;
    this.removeBodyClass();
  }

  closePrivacyPopup() {
    this.busyPrivacyPopup = false;
    this.removeBodyClass();
  }

  /***
   *
   * Function to fetch the event file (If any)
   */
  public getEventFile(id) {
    this.fileName = [];
    this.calendarService.v1CalendarUploadCalendarIdGet$Response({calendarId: id}).subscribe(res => {
      const files = JSON.parse(res.body as any).results;
      this.fileName = files;
      if (files && files.length) {
        this.fileName = files.map(e => {
          if (e) {
            const initialPart = e.substring(e.lastIndexOf('/') + 1, e.length);
            return initialPart.split('.')[0].substring(0, 17) + '...' + initialPart.split('.')[initialPart.split('.').length - 1];
          }
        });
      }
    }, err => {
      this.fileName = [];
    });


  }

  /***
   *
   * FullCalendar Handler Functions
   */
  eventDragStop(model) {
    console.log(model);
  }

  mouseEnter(model) {
    let FC_ele_content = model.el.closest('a').children[0];
    let FC_ele_title = model.el.closest('a').children[0].children[0];
    let FC_ele_time;
    if(model.el.closest('a').children.length > 0 && model.el.closest('a').children[0].children.length > 1 && model.el.closest('a').children[0].children[1].children.length > 0){
      FC_ele_time = model.el.closest('a').children[0].children[1].children[0];
    }
    let FC_ele_content_width = (FC_ele_content) ? FC_ele_content.getBoundingClientRect().width : null;
    let FC_ele_title_width = (FC_ele_title) ? FC_ele_title.getBoundingClientRect().width : null;
    let FC_ele_time_width = (FC_ele_time) ? FC_ele_time.getBoundingClientRect().width: null;

    if(FC_ele_content_width < FC_ele_title_width ){
      let WidthTotal = (FC_ele_title_width - FC_ele_content_width) + 8;
      let Tansition = ((WidthTotal * 8)/100)/10;
      const style = {
        left: '-' + WidthTotal + "px",
        transitionDuration : Tansition + 's'
      };
      Object.assign(FC_ele_title.style, style);
    }
    if(FC_ele_time_width && FC_ele_content_width < FC_ele_time_width ){
      let WidthTime = (FC_ele_time_width - FC_ele_content_width) + 8;
      let Tansition = ((WidthTime * 8)/100)/10;
      const style = {
        left: '-' + WidthTime + "px",
        transitionDuration : Tansition + 's'
      };
      Object.assign(FC_ele_time.style, style);
    }
  }

  mouseLeave(model) {
    if (model) {
      if(model.el.closest('a').children[0] && model.el.closest('a').children[0].children[0]) {
        model.el.closest('a').children[0].children[0].style.left = 0;
      }
      if(model.el.closest('a').children.length > 0 && model.el.closest('a').children[0].children.length > 1 && model.el.closest('a').children[0].children[1].children.length > 0){
        model.el.closest('a').children[0].children[1].children[0].style.left = 0;
      }
    }
  }

  dateClick(model) {
    console.log(model);
  }

  updateEvents() {
    this.eventsModel = [
      {
        title: 'Updaten Event',
        start: this.yearMonth + '-08',
        end: this.yearMonth + '-10'
      }
    ];
  }

  get yearMonth(): string {
    const dateObj = new Date();

    return dateObj.getUTCFullYear() + '-' + (dateObj.getUTCMonth() + 1);
  }

  /***
   *
   * Function to toggle the filter sidebar
   */
  public openSideBar() {
    this.closeClick = false;
    this.sideBar = !this.sideBar;
  }


  /***
   *
   * Function to get Event, Eventtype, EventAcceptstatus List
   */
  private getList(startDate, endDate) {
    this.loading = true;
    if (this.yearMonth) {
      this.getSubscribtionList();
      forkJoin([
        this.matterService.v1MatterEventsTypesListGet$Response({}),
        this.calendarService.v1CalendarEventsPersonPersonIdGet$Response({
          personId: this.userDetails.id,
          startDate: startDate,
          endDate: endDate
        }),
        this.matterService.v1MatterEventsAcceptstatusesListGet$Response({})
      ])
        .pipe(
          map(res => {
            // JSON.parse(res[1].body as any).results.forEach(obj=>{
            //   obj.startDateTime = this.convertDateTimeToUsersDefaultTime(obj.startDateTime);
            //   obj.endDateTime = this.convertDateTimeToUsersDefaultTime(obj.endDateTime);
            // });
            return {
              eventTypeList: JSON.parse(res[0].body as any).results,
              eventList: JSON.parse(res[1].body as any).results,
              eventAcceptStatus: JSON.parse(res[2].body as any).results
            };
          }),
          finalize(() => {
          })
        )
        .subscribe(res => {
          if (res.eventTypeList && res.eventTypeList.length > 0) {
            res.eventTypeList = res.eventTypeList.sort((a, b) => a.name ? a.name.localeCompare(b.name) : '');
            res.eventTypeList.map((item) => {
              item.checked = true;
              this.calendarFilter.eventTypes.push({
                id: item.id,
                name:
                  item['name'] ||
                  this.getName({
                    type: 'person',
                    person: item
                  })
              });
            });
            this.eventTypeList = res.eventTypeList;
          }
          this.eventList = res.eventList;
          this.eventAcceptStatusList = res.eventAcceptStatus;
          this.createCalendarEvents(this.eventList);
          if (this.eventList && this.eventList.length > 0) {
            // this.setListItems(this.eventList);
            this.applyFilter();

          }
        }, (err) => {
          this.loading = false;
        });
    }
  }

  /***
   *
   * Function to format the events in fullcalendar events format
   */
  private createCalendarEvents(eventList: any) {
    this.busyPrivacyPopup = false;
    this.cancelConsultationPopup = false;
    // this.calendarEvents = [];
    let bcolor;
    let tcolor;
    let myEvents: any[] = [];
    if (eventList && eventList.length) {
      eventList.map(obj => {
        if (obj) {
          let passedEvent = (this.compareCurrentTime(obj.endDateTime)) ? 'fc-event-past' : '';
          let eventAccept = '';
          if (obj && obj.invitees && obj.invitees.length > 0) {
            obj.invitees.map((obja) => {
              if (obj.employeeId && obja.person && obja.person.id === obj.employeeId) {
                if (!obja.acceptStatus) {
                  eventAccept = 'fc-notresponce';
                } else if (obja.acceptStatus && obja.acceptStatus.code === "REJECTED") {
                  eventAccept = 'fc-event-reject';
                } else if (obja.acceptStatus && obja.acceptStatus.code === "TENTATIVE") {
                  eventAccept = 'fc-event-maybe';
                }
              } else if (!obj.employeeId && obja.person && obja.person.id === this.userDetails.id) {
                if (!obja.acceptStatus) {
                  eventAccept = 'fc-notresponce';
                } else if (obja.acceptStatus && obja.acceptStatus.code === "REJECTED") {
                  eventAccept = 'fc-event-reject';
                } else if (obja.acceptStatus && obja.acceptStatus.code === "TENTATIVE") {
                  eventAccept = 'fc-event-maybe';
                }
              }
            });
          }
          let inviteeIds = [];
          if (obj.invitees && obj.invitees.length > 0) {
            inviteeIds = obj.invitees.map(obj => obj.person && obj.person.id);
          }
          // bcolor = '#C7CCEF';
          tcolor = '#4752D6';
          if (obj.beforeTravelTimeHours || obj.beforeTravelTimeMinutes) {
            let minute =
              +obj.beforeTravelTimeHours * 60 + +obj.beforeTravelTimeMinutes;
            let dt = new Date(obj.startDateTime);
            dt.setHours(dt.getHours() - +obj.beforeTravelTimeHours);
            dt.setMinutes(dt.getMinutes() - +obj.beforeTravelTimeMinutes);
            if (this.showLoggedUserEvents) {
              if (minute <= 15) {
                myEvents.push({
                  start: dt,
                  end: new Date(obj.startDateTime),
                  title: minute + ' Minutes Travel Time',
                  description: '',
                  id: null,
                  timeGridEventMinHeight: '150px',
                  // minute: minute,
                  eventtype: 'travel',
                  classNames:[passedEvent],
                  eventtitle: minute + ' Minutes Travel Time',
                  backgroundColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bgcolor : bcolor,
                  textColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bordercolor : tcolor,
                  borderColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bordercolor : tcolor,
                });
              } else {
                myEvents.push({
                  start: dt,
                  end: new Date(obj.startDateTime),
                  title: minute + ' Minutes Travel Time',
                  description: '',
                  id: null,
                  eventtype: 'travel',
                  classNames:[passedEvent],
                  eventtitle: minute + ' Minutes Travel Time',
                  backgroundColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bgcolor : bcolor,
                  textColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bordercolor : tcolor,
                  borderColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bordercolor : tcolor,
                });
              }
            }
          }
          if (obj.afterTravelTimeHours || obj.afterTravelTimeMinutes) {
            let minute =
              +obj.afterTravelTimeHours * 60 + +obj.afterTravelTimeMinutes;
            let dt = new Date(obj.endDateTime);
            dt.setHours(dt.getHours() + +obj.afterTravelTimeHours);
            dt.setMinutes(dt.getMinutes() + +obj.afterTravelTimeMinutes);
            if (this.showLoggedUserEvents) {
              if (minute <= 15) {
                myEvents.push({
                  start: new Date(obj.endDateTime),
                  end: dt,
                  title: minute + ' Minutes Travel Time',
                  description: '',
                  id: null,
                  // minute: minute,
                  eventtype: 'travel',
                  classNames:[passedEvent],
                  eventtitle: minute + ' Minutes Travel Time',
                  backgroundColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bgcolor : bcolor,
                  textColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bordercolor : tcolor,
                  borderColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bordercolor : tcolor,
                });
              } else {
                myEvents.push({
                  start: new Date(obj.endDateTime),
                  end: dt,
                  title: minute + ' Minutes Travel Time',
                  description: '',
                  id: null,
                  eventtype: 'travel',
                  eventtitle: minute + ' Minutes Travel Time',
                  classNames:[passedEvent],
                  backgroundColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bgcolor : bcolor,
                  textColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bordercolor : tcolor,
                  borderColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bordercolor : tcolor,
                });
              }
            }
          }
          bcolor =
            obj.privacy && obj.privacy.code === 'PRIVATE' ? '#FBCABB' : bcolor;
          tcolor =
            obj.privacy && obj.privacy.code === 'PRIVATE' ? '#F4511E' : tcolor;

          if (this.showLoggedUserEvents) {
            const classes = [];
            if (passedEvent != '') {
              classes.push(passedEvent);
            }
            if (eventAccept != '') {
              classes.push(eventAccept);
            }
            if (this.getTimeDifference(new Date(obj.startDateTime), new Date(obj.endDateTime)) <= 30 && this.calendarViewType != "dayGridMonth") {
              classes.push('fc-time-hide');
            }
            if (obj.eventType && obj.eventType.code === 'OUT_OF_OFFICE') {
              classes.push('fc-out-of-office');
              classes.push('fc-time-grid-event');
              obj.isOutOfOfficeAllDay = (moment(obj.startDateTime).format('h:mma') === moment(obj.endDateTime).format('h:mma')) ? true : false;
              obj.isAllDayEvent = true;
              obj.isOutOfOffice = true;
            }
            if (!obj.isOutOfOffice && !obj.isAllDayEvent) {
              myEvents.push({
                start: new Date(obj.startDateTime),
                end: new Date(obj.endDateTime),
                title: (inviteeIds.indexOf(this.userDetails.id) === -1 && obj.privacy && obj.privacy.code === 'PRIVATE') ? 'Busy' : obj.title,
                description: obj.description,
                id: obj.id,
                allDay: obj.isAllDayEvent,
                isOutOfOffice: obj.isOutOfOffice,
                classNames: classes.length ? classes : [],
                backgroundColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bgcolor : bcolor,
                textColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bordercolor : tcolor,
                borderColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bordercolor : tcolor,
              });
            } else {
              let dates = [];
              dates.push(moment(obj.startDateTime).format('YYYY-MM-DD'));
              dates = dates.concat(this.enumerateDaysBetweenDates(new Date(obj.startDateTime), new Date(obj.endDateTime)));
              dates.push(moment(obj.endDateTime).format('YYYY-MM-DD'));
              for (let i = 0; i < dates.length - 1; i++) {
                myEvents.push({
                  start: new Date(dates[i]).toISOString(),
                  end: new Date(dates[i + 1]).toISOString(),
                  title: (inviteeIds.indexOf(this.userDetails.id) === -1 && obj.privacy && obj.privacy.code === 'PRIVATE') ? 'Busy' : obj.title,
                  description: obj.description,
                  id: obj.id,
                  allDay: obj.isAllDayEvent,
                  isOutOfOffice: obj.isOutOfOffice,
                  classNames: classes.length ? classes : [],
                  backgroundColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bgcolor : bcolor,
                  textColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bordercolor : tcolor,
                  borderColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bordercolor : tcolor,
                });
              }
              if (dates.length > 2) {
                myEvents.push({
                  start: new Date(dates[dates.length - 1]).toISOString(),
                  end: new Date(obj.endDateTime).toISOString(),
                  title: (inviteeIds.indexOf(this.userDetails.id) === -1 && obj.privacy && obj.privacy.code === 'PRIVATE') ? 'Busy' : obj.title,
                  description: obj.description,
                  id: obj.id,
                  allDay: obj.isAllDayEvent,
                  isOutOfOffice: obj.isOutOfOffice,
                  classNames: classes.length ? classes : [],
                  backgroundColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bgcolor : bcolor,
                  textColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bordercolor : tcolor,
                  borderColor: obj.hasOwnProperty('colorObj') ? obj.colorObj.bordercolor : tcolor,
                });
              }
            }
          }
        }
      });
    }
    this.calendarEvents = [...myEvents];
    setTimeout(() => {
      this.loading = false;
      this.displayBackground();
    }, 50);
  }

  compareCurrentTime(endTime) {
    return moment(this.changeTimezone(new Date(), this.myTimezone)).isAfter(moment(endTime));
  }

  enumerateDaysBetweenDates(startDate, endDate) {
    const dates = [];

    const currDate = moment(startDate).startOf('day');
    const lastDate = moment(endDate).startOf('day');

    while (currDate.add(1, 'days').diff(lastDate) < 0) {
      dates.push(moment(currDate.toDate()).format('YYYY-MM-DD'));
    }
    return dates;
  }

  displayBackground() {
    if (this.calendarViewType != 'dayGridMonth') {
      let elements: any = [];
      elements = Array.from(document.getElementsByClassName('fc-day fc-widget-content'));
      if (elements.length) {
        const requiredElementsLength = elements.length / 2;
        elements = requiredElementsLength > 1 ? elements.splice(0, requiredElementsLength - 1) : elements.splice(0, 1);
      }
      elements.forEach(element => {
        if (element.attributes.getNamedItem('data-date')) {
          const elementDate = element.attributes.getNamedItem('data-date').value;
          const isOutOfOfficeDay = this.calendarEvents.filter(event => {
            const dates = this.enumerateDaysBetweenDates(event.start, event.end);
            dates.push(moment(event.start).format('YYYY-MM-DD'));
            return dates.findIndex(date => date == elementDate) > -1 && event.isOutOfOffice;
          }).length > 0;
          if (isOutOfOfficeDay) {
            const elementData = document.getElementsByClassName(element.classList);
            if (elementData.length) {
              elementData[elementData.length - 1].classList.add('fc-out-of-office-day');
            }
          } else {
            const elementData = document.getElementsByClassName(element.classList);
            if (elementData.length) {
              elementData[elementData.length - 1].classList.remove('fc-out-of-office-day');
            }
          }
        }
      });
    }
  }

  getTimeDifference(date1, date2) {
    let diff = (date2.getTime() - date1.getTime()) / 1000;
    diff /= 60;
    return Math.abs(Math.round(diff));
  }

  private setListItems(userEvents: Array<vwMatterEvents>) {
    this.applyFilter();
    // this.matterList = [];
    // this.clientList = [];
    // this.potentialClientList = [];
    // this.inviteeClientList = [];
    // this.inviteePotentialClientList = [];
    // if(this.calendarFilter && this.calendarFilter.eventTypes && this.calendarFilter.eventTypes.length ) {
    //   this.calendarFilter.eventTypes = [];
    // }
    // if(this.calendarFilter && this.calendarFilter.eventTypes && this.calendarFilter.eventTypes.length ) {
    //   this.calendarFilter.eventTypes = [];
    // }

    // if (this.calendarFilter && this.calendarFilter.matters && this.calendarFilter.matters.length > 0) {
    //   this.clientList = [];
    //   this.potentialClientList = [];
    // }
    // userEvents
    //   .filter(a => a.matter)
    //   .forEach((a: any) => {
    //     let matter: any = a.matter;
    //     if (a.client) {
    //       matter.clientId = a.client.id;
    //       let index = this.matterList.findIndex(x => matter.id == x.id);
    //       if (index == -1) {
    //         this.matterList.push(matter);
    //       }
    //     }
    //   });
    // this.tempMatterList = this.matterList;
    // userEvents
    //   .filter(a => a.client)
    //   .forEach(c => {
    //     if (c.client.role == PersonRole.PotentialClient) {
    //       this.addFromPerson(this.potentialClientList, c.client);
    //     }
    //     if (c.client.role == PersonRole.Client) {
    //       this.addFromPerson(this.clientList, c.client);
    //     }
    //   });

    // userEvents.forEach(a => {
    //   if (a.invitees) {
    //     a.invitees.forEach(i => {
    //       if (i.inviteeType) {
    //         if (i.inviteeType.name == PersonRole.Client) {
    //           this.addFromPerson(this.inviteeClientList, i.person);
    //         } else if (i.inviteeType.name == PersonRole.PotentialClient) {
    //           this.addFromPerson(this.inviteePotentialClientList, i.person);
    //         } else if (i.inviteeType.name == PersonRole.Employee) {
    //           this.addFromPerson(this.employeeList, i.person);
    //         } else {
    //           this.addFromPerson(this.inviteeClientList, i.person);
    //         }
    //       } else {
    //         this.addFromPerson(this.inviteeClientList, i.person);
    //       }
    //     });
    //   }
    // });
    // if (this.inviteePotentialClientList && this.inviteePotentialClientList.length > 0) {
    //   this.inviteePotentialClientList.map((obj, index) => {
    //     obj.colorCode = (obj.id === this.userDetails.id) ? '453599' : this.colorMapping[index];
    //   });
    // }
    // if (this.inviteeClientList && this.inviteeClientList.length > 0) {
    //   this.inviteeClientList.map((obj, index) => {
    //     obj.colorCode = (obj.id === this.userDetails.id) ? '453599' : this.colorMapping[index];
    //   });
    // }
    // if (this.employeeList && this.employeeList.length > 0) {
    //   this.employeeList.map((obj, index) => {
    //     obj.colorCode = (obj.id === this.userDetails.id) ? '453599' : this.colorMapping[index];
    //   });
    // }
    // if (this.matterFilterId) {
    //   let matter = this.matterList.find(obj => obj.id == this.matterFilterId);
    //   let index = this.matterList.findIndex(obj => obj.id == this.matterFilterId);
    //   if (matter && this.isInitialMatterFilterCall) {
    //     this.isInitialMatterFilterCall = false;
    //     this.calendarFilter.matters.push(matter);
    //     this.matterList[index].checked = true;
    //     this.applyFilter();
    //   }
    // }
    // if (this.employeeFilterId) {
    //   let employee = this.employeeList.find(obj => obj.id == this.employeeFilterId);
    //   let index = this.employeeList.findIndex(obj => obj.id == this.employeeFilterId);
    //   if (employee && this.isInitialEmployeeFilterCall) {
    //     this.isInitialEmployeeFilterCall = false;
    //     this.calendarFilter.invitee.employees.push(employee);
    //     this.employeeList[index].checked = true;
    //     this.applyFilter();
    //   } else if (!employee && this.isInitialEmployeeFilterCall) {
    //     let employee = {
    //       id: this.employeeFilterId,
    //       name: this.employeeName,
    //       checked: true,
    //       colorCode: this.colorMapping[this.employeeList.length - 1] ?
    //         this.colorMapping[this.employeeList.length - 1] :
    //         this.colorMapping[this.colorMapping.length - 1]
    //     };
    //     this.employeeList.push(employee);
    //     this.isInitialEmployeeFilterCall = false;
    //     this.calendarFilter.invitee.employees.push(employee);
    //     this.applyFilter();
    //   }
    // }
  }

  private addFromPerson(array: IOffice[], person: vwFullPerson) {
    if (person) {
      let index = array.findIndex(a => a.id == person.id);
      if (index == -1) {
        array.push({
          id: person.id,
          name: this.getName({
            type: 'person',
            person: person
          })
        });
      }
    }
  }


  /***
   *
   * Function to emit the next step(For potential Client, Client-
   * Conversion and Matter creation)
   */
  public next() {
    switch (this.pageType) {
      case 'matter':
        this.nextStep.emit({next: 'documents', current: 'calendar'});
        break;
      case 'potentialClient':
        this.nextStep.emit('notes');
        break;
      case 'clientconversion':
        this.nextStep.emit({next: 'documents', current: 'calendar'});
        break;
    }
  }

  changeSearchType(selected: string) {
    this.filterSelected = selected;
    this.calendarSearchResults = [];
    if (this.searchControl.value) {
      this.getSearchUser(this.searchControl.value);
    }
  }

  getName(row: CalendarSearchResult) {
    if (row.type == 'matter') {
      return row.matter.name;
    } else if (row.type == 'employee') {
      return row.employee.name;
    } else {
      if (row.person.isCompany) {
        return row.person.companyName;
      } else {
        return row.person.lastName + ', ' + row.person.firstName;
      }
    }
  }

  toggle(key: string) {
    this.showFilterOptions[key] = !this.showFilterOptions[key];
  }

  toggleRow(row: vwFullPerson) {
    row['expanded'] = !row['expanded'];
  }

  get searchCategory() {
    if (this.filterSelected == 'all') {
      return 'All';
    }

    if (this.filterSelected == 'matter') {
      return 'Matter';
    }

    if (this.filterSelected == 'employees') {
      return 'Employees';
    }

    if (this.filterSelected == 'client') {
      return 'Client';
    }

    if (this.filterSelected == 'potentialClient') {
      return 'Potential Client';
    }
  }

  public toggleItem(
    array: Array<vwIdCodeName>,
    item: vwFullPerson,
    $event,
    type = 'person'
  ) {
    let index = array.findIndex(a => a.id == item.id);
    if ($event.target.checked) {
      if (index == -1) {
        array.push({
          id: item.id,
          name:
            item['name'] ||
            this.getName({
              type: type,
              person: item
            })
        });
      }
    } else {
      if (index > -1) {
        array.splice(index, 1);

      }
    }
    if (this.calendarFilter.getInviteeFilters() === 0 && (this.calendarViewType == 'timeGridDay' || this.calendarViewType == 'resourceTimeGridDay')) {
      this.loading = true;
      this.calendarViewType = 'timeGridDay';
      this.changeView('timeGridDay');
    } else if ((array == this.calendarFilter.invitee.clients || array == this.calendarFilter.invitee.employees || array == this.calendarFilter.invitee.potentialClients) && (this.calendarViewType == 'timeGridDay' || this.calendarViewType == 'resourceTimeGridDay')) {
      this.loading = true;
      this.changeView('resourceTimeGridDay');
    }
    this.myCalendarSelect();
  }


  public markChecked(array: Array<IOffice>, id: number) {
    let index = array.findIndex(a => a.id == id);
    if (index > -1) {
      array[index].checked = false
      setTimeout(() => {
        array[index].checked = true;
      }, 50)
    }
  }

  deleteSearchUser(row: ISearchUser) {
    const index = this.selectedFilterUser.findIndex(item => item.id === row.id);
    if (index > -1) {
      this.selectedFilterUser.splice(index, 1);
      this.selectedFilterUser = [...this.selectedFilterUser];
    } else {
      this.selectedFilterUser = [];
      this.searchResultEvents = {};
      return;
    }
    this.searchResultEvents[row.id].forEach(searchResultEvent => {
      const searchResultIndex = this.eventList.findIndex(item => item.id === searchResultEvent.id && item.colorObj && item.colorObj.bgcolor === searchResultEvent.colorObj.bgcolor);
      if (searchResultIndex > -1) {
        this.eventList.splice(searchResultIndex, 1);
      }
    });
    delete this.searchResultEvents[row.id];
    this.myCalendarSelect();
    this.setEmpTimezoneList();
  }

  selectUser(row: any) {
    if (this.selectedFilterUser && this.selectedFilterUser.length > 0) {
      const exist = this.selectedFilterUser.find(item => item.id === row.id);
      if (exist) {
        return;
      }
      row.colorCode = this.colorMapping[this.selectedFilterUser.length];
    } else {
      row.colorCode = this.colorMapping[0];
    }
    row.timezone = this.timeZoneEnum[row.empTimezone];
    this.selectedFilterUser.unshift(row);
    const colorObj = {
      bordercolor: this.eventColorMap[row.colorCode].bordercolor,
      bgcolor: this.eventColorMap[row.colorCode].bgcolor
    };
    this.showResults = false;
    this.setEmpTimezoneList();
    this.getEvents('calendarFilter', row.id, colorObj, 'topsearch', row.role);
  }

  public getSearchUser(text: string, currentPage = 1) {
    text = (text) ? text.trim() : '';

    this.searchLoading = text !== '';
    let data: any = {};
    switch (this.filterSelected) {
      case 'all':
        data['isAll'] = true;
        break;
      case 'client':
        data['isClient'] = true;
        break;
      case 'potentialClient':
        data['isPotentialClient'] = true;
        break;
      case 'matter':
        data['isMatter'] = true;
        break;
      case 'employees':
        data['isEmployee'] = true;
        break;
      default:
        data['isAll'] = true;
    }
    if (!!text) {
      data['search'] = text;
    } else {
      return;
    }
    if (this.inviteeSubscribe) {
      this.inviteeSubscribe.unsubscribe();
    }
    data.pageNumber = currentPage;
    if (currentPage === 1) {
      this.currentSearchPageNumber = 1;
    }
    this.inviteeSubscribe = this.miscService.v1MiscInviteesMatterSearchGet$Response(data).subscribe(res => {
      let ulist = JSON.parse(res.body as any).results;
      if (ulist && ulist.length > 0) {
        ulist.map((obj) => {
          obj.name = (obj.isCompany) ? obj.companyName : (obj.lastName) ? obj.lastName + ', ' + obj.firstName : obj.firstName;
          if (obj.role === 'Matter') {
            obj.name = obj.matterName;
          }
        });
      }
      if (this.permissionList.MATTER_MANAGEMENTisNoVisibility) {
        ulist = ulist.filter(item => {
          return item.role !== 'Matter';
        });
      }
      ulist = ulist.filter(list => {
        if (this.subscriptionList.length > 0) {
          let result = this.subscriptionList.filter(val => {
            if (list.role != 'Matter') {
              if (list.id == val.subscribePersonId) {
                return val;
              }
            } else {
              if (list.id == val.subscribeMatterId) {
                return val;
              }
            }
          });
          return result.length > 0 ? list['subId'] = result[0].id : [];
        }
        return list;
      });
      this.totalSearchResults = (ulist && ulist.length > 0) ? ulist[0].totalCount : 0;
      this.searchUserList = ulist;
      this.showResults = true;
      this.searchLoading = false;
    }, (err) => {
      this.searchLoading = false;
    });
  }

  public myCalendarSelect() {
    let result = [];
    if (this.myCalendar) {
      result.forEach(resultEvent => {
        const existingEvent = this.eventList.findIndex(item => item.id === resultEvent.id && item.colorObj && item.colorObj.bgcolor === resultEvent.colorObj.bgcolor);
        if (existingEvent > -1) {
          this.eventList.splice(existingEvent, 1);
        }
      });
      result = result.concat(this.eventList);
    }
    if (this.calendarFilter.matters && this.calendarFilter.matters.length > 0) {
      this.calendarFilter.matters.map((item) => {
        if (this.subscribeFilterEvents[item.id]) {
          result = result.concat(this.subscribeFilterEvents[item.id]);
        }
      });
    }
    if (this.calendarFilter.client && this.calendarFilter.client.clients && this.calendarFilter.client.clients.length > 0) {
      this.calendarFilter.client.clients.map((item) => {
        if (this.subscribeFilterEvents[item.id]) {
          result = result.concat(this.subscribeFilterEvents[item.id]);
        }
      });
    }
    if (this.calendarFilter.eventTypes.length > 0) {
      result = result
        .filter(a => a.eventType)
        .filter(a =>
          this.calendarFilter.eventTypes.some(e => e.id == a.eventType.id)
        );
    }
    if (this.searchResultEvents && this.selectedFilterUser && this.selectedFilterUser.length > 0) {
      this.selectedFilterUser.map((item) => {
        result = result.concat(this.searchResultEvents[item.id]);
      });
    }

    this.createCalendarEvents(result);
  }

  public focusSearchInput() {
    if (this.searchUserList && this.searchUserList.length > 0) {
      // this.showResults = true;
    }
  }

  public getNameForSearch(row: ISearchUser) {
    if (row.isCompany) {
      return row.companyName;
    } else {
      return row.lastName + ", " + row.firstName;
    }
  }


  private filterClientAndPotentialClient(text: string) {
    this.eventList
      .filter(a => a.client)
      .filter(a => this.searchClient(a, text))
      .map(a => {
        return {
          type: 'client',
          person: a.client
        } as CalendarSearchResult;
      })
      .forEach(a => {
        this.addResult(a);
      });

    this.eventList
      .filter(a => a.client)
      .filter(a => a.client.role == PersonRole.PotentialClient)
      .filter(a => this.searchClient(a, text))
      .map(a => {
        return {
          type: 'potentialClient',
          person: a.client
        } as CalendarSearchResult;
      })
      .forEach(a => {
        this.addResult(a);
      });
  }

  private searchClient(a: vwMatterEvents, text: string) {
    if (a.client.isCompany) {
      return a.client.companyName.toLowerCase().includes(text.toLowerCase());
    } else {
      return `${a.client.lastName}, ${a.client.firstName}`
        .toLowerCase()
        .includes(text.toLowerCase());
    }
  }

  private addResult(item: CalendarSearchResult) {
    let isExisitng = this.calendarSearchResults.some(a =>
      this.compareResultItem(a, item)
    );

    if (!isExisitng) {
      this.calendarSearchResults.push(item);
    }
  }

  public outsideClick(event) {
    if (event && event.target && event.target.className && event.target.className.match('calendar-top-search')) {
      this.showResults = (this.searchUserList && this.searchUserList.length > 0);
    } else {
      this.showResults = false;
    }
  }

  private compareResultItem(a: CalendarSearchResult, b: CalendarSearchResult) {
    if (a.type == b.type) {
      if (a.type == 'matter') {
        return a.matter.id == b.matter.id;
      } else if (a.type == 'employee') {
        return a.employee.id == b.employee.id;
      } else {
        return a.person.id == b.person.id;
      }
    } else {
      return false;
    }
  }

  private getTotalEvents() {
    let events: Array<vwMatterEvents> = [...this.eventList];

    // Object.keys(this.employeeEventsCache).forEach(empId => {
    //   events = events.concat(this.employeeEventsCache[empId]);
    // });
    events = _.uniqBy(events, a => a.id);
    return events;
  }

  /***
   *
   * Function to apply Calendar filter
   */
  public applyFilter() {
    let events = this.getTotalEvents();
    if (this.calendarFilter.matters && this.calendarFilter.matters.length > 0) {
      this.calendarFilter.matters.map((item) => {
        if (this.subscribeFilterEvents[item.id]) {
          events = events.concat(this.subscribeFilterEvents[item.id]);
        }
      });
    }
    if (this.calendarFilter.client && this.calendarFilter.client.clients && this.calendarFilter.client.clients.length > 0) {
      this.calendarFilter.client.clients.map((item) => {
        if (this.subscribeFilterEvents[item.id]) {
          events = events.concat(this.subscribeFilterEvents[item.id]);
        }
      });
    }
    if (this.calendarFilter.eventTypes.length > 0) {
      events = events
        .filter(a => a.eventType)
        .filter(a =>
          this.calendarFilter.eventTypes.some(e => e.id == a.eventType.id)
        );
    }
    if (this.searchResultEvents && this.selectedFilterUser && this.selectedFilterUser.length > 0) {
      this.selectedFilterUser.map((item) => {
        events = events.concat(this.searchResultEvents[item.id]);
      });
    }
    this.createCalendarEvents(events);
  }


  /**** function to remove event */
  async removeEvent(): Promise<any> {
    try {
      let resp: any = await this.dialogService.confirm(
        this.errorData.delete_event,
        'Delete'
      );
      if (resp) {
        this.isEventCancelled = false;
        this.remove();
      }
    } catch (err) {
    }
  }

  /***
   *
   * Function to hit the API to delete event
   */
  public remove() {
    this.matterService
      .v1MatterEventsDelete$Response({
        matterEventId: this.eventDetails.id,
        isEventCancelled: this.isEventCancelled
      })
      .subscribe((result: {}) => {
        const res: any = result;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes && parsedRes.results > 0) {
            this.openEditModelPopup = false;
            this.openEditModelPopupNotification = false;
            this.removeBodyClass();
            this.getEvents(null);
          } else {
            this.toastDisplay.showError(this.errorData.server_error);
          }
        } else {
          this.toastDisplay.showError(this.errorData.server_error);
        }
      }, err => {
      });
  }

  /***
   *
   * Function to send the Attending status of the event
   */
  public replay(item) {
    let items = this.eventAcceptStatusList.find(obj => obj.code === item);
    let inviteeDetails = this.eventDetails.invitees.find(
      obj => obj.person && obj.person.email === this.userDetails.email
    );
    this.matterService
      .v1MatterEventsInviteeAcceptstatusInviteeIdAcceptStatusIdPut({
        inviteeId: inviteeDetails.id,
        acceptStatusId: items.id
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res > 0) {
            if (this.isResourceViewMode) {
              this.resourceEventList = [];
              this.resourceviewEventsArray = [];
              this.calendarFilter.invitee.employees.forEach(item => {
                this.getResourceUserEvent(item.id);
              });
              this.openEditModelPopup = false;
              this.openEditModelPopupNotification = false;
            } else {
              this.getEvents(1);
              if (this.openEditModelPopupNotification) {
                if (this.notificationEventId) {
                  this.getEventDetails();
                }
              }
            }
          }
        },
        err => {
        }
      );
  }


  /**
   *
   * @param action
   * Function to get the user events
   */
  public getEvents(action, id?: number, colorObj?: any, from?: string, role?: string, section?: string) {
    // this.loading = true;
    // this.calendarEvents = [];
    const calendarApi = this.calendarComponent.getApi();
    const startDate = new Date(calendarApi.view.activeStart).setHours(0, 0, 0);
    const endDate = new Date(calendarApi.view.activeEnd).setHours(0, 0, 0);

    let observe;
    if (role === 'Matter') {
      observe = this.matterService.v1MatterEventsListMatterIdGet({
        matterId: id
      });
    } else {
      // if(role) {
        observe = this.calendarService.v1CalendarEventsPersonPersonIdGet({
          personId: id ? id : this.userDetails.id,
          startDate: moment(startDate).format('MM/DD/YYYY'),
          endDate: moment(endDate).format('MM/DD/YYYY')
        });
      // }
    }
    if(observe) {
      observe.pipe(map(UtilsHelper.mapData),
      finalize(() => {
        // this.loading = false;
      }))
      .subscribe(
        res => {
          // res.map(obj=>{
          //   obj.startDateTime = this.convertDateTimeToUsersDefaultTime(obj.startDateTime);
          //   obj.endDateTime = this.convertDateTimeToUsersDefaultTime(obj.endDateTime);
          // });
          if (action === 'calendarFilter') {
            const newArray = res.map(obj => ({...obj, colorObj: colorObj}));
            let result = [];
            if (section !== 'subscribeFilter') {
              res.forEach(resultEvent => {
                const existingEvent = this.eventList.findIndex(item => item.id === resultEvent.id && item.colorObj && resultEvent.colorObj && item.colorObj.bgcolor === resultEvent.colorObj.bgcolor);
                if (existingEvent > -1) {
                  this.eventList.splice(existingEvent, 1);
                }
              });
            }
            if (this.myCalendar) {
              result = result.concat(this.eventList);
            }
            if (from === 'topsearch') {
              if (section === 'subscribeFilter') {
                this.subscribeFilterEvents[id] = newArray;
              } else {
                this.searchResultEvents[id] = newArray;
              }
              Object.keys(this.searchResultEvents).forEach(key => {
                this.searchResultEvents[key].forEach(searchResultEvent => {
                  const searchResultIndex = result.findIndex(item => item.id === searchResultEvent.id && item.colorObj && item.colorObj.bgcolor === searchResultEvent.colorObj.bgcolor);
                  if (searchResultIndex > -1) {
                    result.splice(searchResultIndex, 1);
                  }
                });
              });

              if (this.calendarFilter.matters && this.calendarFilter.matters.length > 0) {
                this.calendarFilter.matters.map((item) => {
                  if (this.subscribeFilterEvents[item.id]) {
                    result = result.concat(this.subscribeFilterEvents[item.id]);
                  }
                });
              }
              if (this.calendarFilter.client && this.calendarFilter.client.clients && this.calendarFilter.client.clients.length > 0) {
                this.calendarFilter.client.clients.map((item) => {
                  if (this.subscribeFilterEvents[item.id] && this.subscribeFilterEvents[item.id].length) {
                    this.subscribeFilterEvents[item.id].map((obj1) => {
                      obj1['employeeId'] = item.id;
                    });
                    result = result.concat(this.subscribeFilterEvents[item.id]);
                  }
                });
              }
              if (this.selectedFilterUser && this.selectedFilterUser.length) {
                this.selectedFilterUser.map((item) => {
                  if (this.searchResultEvents[item.id] && this.searchResultEvents[item.id].length) {
                    this.searchResultEvents[item.id].map((obj1) => {
                      obj1['employeeId'] = item.id;
                    });
                    result = result.concat(this.searchResultEvents[item.id]);
                  }
                });
              }

            } else if (from === 'inviteeSelect') {
              // this.searchResultEvents[id] = newArray;
              // if (this.calendarFilter.invitee.clients) {
              //   this.calendarFilter.invitee.clients.map((item) => {
              //     result = result.concat(this.searchResultEvents[item.id]);
              //   });
              // }
              // if (this.calendarFilter.invitee.potentialClients) {
              //   this.calendarFilter.invitee.potentialClients.map((item) => {
              //     result = result.concat(this.searchResultEvents[item.id]);
              //   });
              // }
              // if (this.calendarFilter.invitee.employees) {
              //   this.calendarFilter.invitee.employees.map((item) => {
              //     result = result.concat(this.searchResultEvents[item.id]);
              //   });
              // }
            } else {
              result = _.unionBy(newArray, this.eventList, 'id');
            }
            result.forEach(obj => {
              if (!(this.eventList.some(val => val && obj && val.id == obj.id))) {
                this.eventList.push(obj);
              }
            });
            // this.setListItems(result);
            this.applyFilter();
            this.createCalendarEvents(result);
          } else {
            this.eventList = res;

            if (this.eventList && this.eventList.length > 0) {
              // this.setListItems(this.eventList);
              this.applyFilter();
            }
            this.createCalendarEvents(this.eventList);
            if (action === 1) {
              this.eventClick(null, this.eventDetails.id);
            }
            setTimeout(() => {
              this.applyFilter();
            }, 200);
          }
        },
        err => {
          this.loading = false;
        }
      );
    } else {
      this.loading = false;
    }
  }

  /***
   *
   * Function to cancel the intial consultation
   */
  public cancelInitialConsultation() {
    let data = {
      content: null,
      isVisibleToClient: true,
      name: ' '
    };
    if (
      this.cancelConsultationContent &&
      this.cancelConsultationContent != ''
    ) {
      data.content = this.cancelConsultationContent;
    }
    if (this.eventDetails.client && this.eventDetails.client.firstName) {
      data.name = this.eventDetails.client.lastName
        ? this.eventDetails.client.firstName +
        ' ' +
        this.eventDetails.client.lastName
        : this.eventDetails.client.firstName;
    } else if (this.eventDetails.client && this.eventDetails.client.companyName) {
      data.name = this.eventDetails.client.companyName;
    }
    this.noteService
      .v1NotePersonAddPersonIdPost$Json$Response({
        personId: this.userDetails.id,
        body: data
      })
      .subscribe(
        (res: any) => {
          res = JSON.parse(res.body as any).results;
          this.cancelConsultationPopup = false;
          if (res > 0) {
            this.isEventCancelled = true;
            this.remove();
          }
        },
        err => {
          console.log(err);
        }
      );
  }

  /***
   *
   * Function to add user as resource for timeline-view
   */
  addResource(obj: any) {
    if (!this.showLoggedUserEvents && this.userDetails.id == obj.id) {
      return;
    }
    let bgcolor, bordercolor;
    if (!obj.colorCode && (obj.id === this.userDetails.id)) {
      obj.colorCode = '453599'
    }
    let colorCode
    if (this.employeeList.find(item => item.id === obj.id)) {
      colorCode = this.employeeList.find(item => item.id === obj.id);
    } else if (obj.colorCode) {
      colorCode = obj
    }

    if (this.inviteeClientList.find(item => item.id === obj.id)) {
      colorCode = this.inviteeClientList.find(item => item.id === obj.id);
    }

    if (this.inviteePotentialClientList.find(item => item.id === obj.id)) {
      colorCode = this.inviteePotentialClientList.find(item => item.id === obj.id);
    }

    bordercolor = this.eventColorMap[colorCode.colorCode].bordercolor;
    bgcolor = this.eventColorMap[colorCode.colorCode].bgcolor;
    if (obj) {
      const data = {
        id: obj.id,
        email: obj.email,
        personPhoto: obj.personPhoto,
        title: (obj.lastName) ? obj.firstName + ' ' + obj.lastName : obj.name,
        eventBackgroundColor: bgcolor,
        eventBorderColor: bordercolor
      };
      let resourceExist = false;
      if (this.resourceArray.some(element => element.id === obj.id)) {
        resourceExist = true;
      }
      if (!resourceExist) {
        this.resourceArray.push(data);
        this.getWorkingHours(data);
      }
    }
  }

  private getWorkingHours(data, isLoggedUser?: boolean) {
    this.calendarService
      .v1CalendarSettingsPersonIdGet({
        personId: data.id
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
        })
      )
      .subscribe(
        res => {
          if (res) {
            this.calendarSettings = res;
            let selectedTimezone = this.timezones.filter(list => list.value == this.calendarSettings.timeZoneId);
            if (selectedTimezone && selectedTimezone.length) {
              this.myTimezone = selectedTimezone[0].utc[0];
            }
            this.setEmpTimezoneList();
            let type = isLoggedUser;
            this.createWorkingHoursList(data, type);
          }
        },
        () => {
        }
      );
  }

  setUserTimeZoneDetail() {
    this.setEmpTimezoneList();
    this.showTimeZoneDetail = true;
  }

  setUserTimeZoneSmall() {
    this.showTimeZoneDetail = false
  }

  private createWorkingHoursList(data, isLoggedUSer?: boolean) {
    let obj = {};
    this.workingHoursList = [];
    if (this.calendarSettings) {
      Object.values(WORKING_DAYS).map((day, indexNumber) => {
        const hr = getWorkingHour(day);
        obj = {
          daysOfWeek: [indexNumber + 1],
          startTime: moment(UtilsHelper.workingHoursFormat(this.calendarSettings[hr.open]), ['h:mm A']).format('HH:mm'),
          endTime: moment(UtilsHelper.workingHoursFormat(this.calendarSettings[hr.close]), ['h:mm A']).format('HH:mm')
        };
        if (isLoggedUSer) {
          this.loggedUserWorkingHoursList.push(obj);
        } else {
          this.workingHoursList.push(obj);
        }
      });
      if (isLoggedUSer) {
        this.options[0].businessHours = this.loggedUserWorkingHoursList;
        this.options[0].now = this.changeTimezone(new Date(), this.myTimezone);
        let basicStartTime = this.loggedUserWorkingHoursList[0].startTime.split(':');
        let earlyTime = basicStartTime[0];
        this.loggedUserWorkingHoursList.forEach(obj => {
          let time = obj.startTime.split(':');
          let startTime = time[0];
          if (parseInt(earlyTime) > parseInt(startTime) && startTime != '00') {
            earlyTime = startTime;
          }
        })
        const timer = (parseInt(earlyTime) < 10) ? '0' + (((+earlyTime === 0) ? 2: +earlyTime)  - 1).toString() + ':00:00' : (+earlyTime - 1).toString() + ':00:00';
        this.options[0].scrollTime = timer;
      }
    } else {
      this.workingHoursList = [];
    }

    const index = this.resourceArray.findIndex(x => x.id === data.id);
    if (index > -1) {
      this.resourceArray[index].businessHours = this.workingHoursList;
    }
    if (this.newPotentialClientData) {
      this.openSideBar();
      setTimeout(() => {
        this.selectUser(this.newPotentialClientData);
      }, 1000);
    }
  }

  /***
   *
   * Function to get the events of the selected resource users
   */
  public getResourceUserEvent(id) {
    this.loading = true;
    if (!this.showLoggedUserEvents && (this.userDetails.id == id)) {
      return;
    }
    const calendarApi = this.calendarComponent.getApi();
    const startDate = moment(calendarApi.view.activeStart).format('MM/DD/YYYY');
    const endDate = moment(calendarApi.view.activeEnd).format('MM/DD/YYYY');
    this.calendarService.v1CalendarEventsPersonPersonIdGet$Response({
      personId: id,
      startDate,
      endDate
    }).subscribe(res => {
      if (res) {
        const userEvents = JSON.parse(res.body as any).results;
        if (userEvents && userEvents.length > 0) {
          userEvents.forEach(element => {
            this.resourceEventList.push(element);
          });
          userEvents.map((obj) => {
            let exist = false;
            if (this.resourceviewEventsArray.some(item => item.id == obj.id)) {
              exist = true;
            }
            if (!exist) {
              let inviteeIds = [];
              if (obj.invitees && obj.invitees.length > 0) {
                inviteeIds = obj.invitees.map(obj => obj.person && obj.person.id);
              }
              this.resourceviewEventsArray.push({
                id: obj.id,
                // start: this.convertDateTimeToUsersDefaultTime(obj.startDateTime),
                // end: this.convertDateTimeToUsersDefaultTime(obj.endDateTime),
                start: obj.startDateTime,
                end: obj.endDateTime,
                title: (inviteeIds.indexOf(this.userDetails.id) === -1 && obj.privacy && obj.privacy.code === 'PRIVATE') ? 'Busy' : obj.title,
                description: obj.description,
                resourceId: id
              });
            }
          });
        }
        this.loading = false;
      } else {
        this.loading = false;
      }
    }, err => {
      this.loading = false;
    });
  }

  prev() {
    if (this.isTrustAccountEnabled) {
      this.prevStep.emit({
        current: 'calendar',
        next: 'trustaccount'
      });
    } else {
      this.prevStep.emit({
        current: 'calendar',
        next: 'billing'
      });
    }
  }

  back(action) {
    if (action === 'previous') {
      this.goBack.emit();
    } else {
      this.router.navigate(['/contact/potential-client'])
    }
  }

  /**
   *
   * @param event
   * Function to create height for the particular calendar event
   */
  public changeHeight(event: any) {
    this.calendarViewType = event.view.type;
    if (event.event._def.extendedProps.minute && (event.view.type == 'timeGridDay' || event.view.type == 'timeGridWeek')) {
      let m = event.event._def.extendedProps.minute;
      let mTop = -14;
      if (m > 7) {
        mTop = mTop + ((7 - m) * 2);
        event.el.style.marginTop = (mTop.toString()) + 'px';
      } else {
        mTop = mTop - ((7 - m) * 2);
        event.el.style.marginTop = (mTop.toString()) + 'px';
      }
      event.el.style.height = '25px';
    }
    if (event.event._def.extendedProps.eventtype == 'travel') {
      event.el.style.borderLeft = 'dotted';
      let html = event.el.innerHTML;
      let title: string = event.event._def.extendedProps.eventtitle;
      // Put custom icon here
      let newHTML: string = '<div class="fc-content"><div class="fc-title"><i class="icon icon-travel" style="margin:0px 2px 0px 1.5px"></i>' + title + '</div></div>';
      let desc = html.replace(/<div(.*?)class="fc-title">[\s\S]*?<\/div>/g, newHTML);
      event.el.innerHTML = desc;
    } else if (this.calendarViewType != "dayGridMonth" && !event.event._def.allDay) {
      let title = event.event.title;
      let tempString = this.formatTime(event.event.start, event.event.end);
      let newHTML: string = '<div class="fc-content"><div class="fc-title"><span>' + title + '</span></div>'+
      '<div class="fc-time"><span>' + tempString +'</span></div>'
      '</div>';
      event.el.innerHTML = newHTML;
    }

    setTimeout(() => {
      if (this.calendarViewType === "dayGridMonth") {
        let el = document.querySelector('.fc-more-popover .fc-header .fc-title') as HTMLSpanElement;
        if (el) {
          const _text = el.innerText;
          const arr = (_text) ? _text.split(" "): [];
          if (Number.isInteger(+arr[0]) ) {
            el.innerHTML = (arr && arr.length > 1) ? arr[1] + '<span>'+arr[0]+'</span>' : _text;
          }
        }
      }
    },0)
  }

  public getAllResourceUserEvents() {
    this.loading = true;
    let index;
    if (this.calendarFilter.invitee.employees) {
      index = this.calendarFilter.invitee.employees.findIndex(x => x.id === this.userDetails.id);
    } else if (this.calendarFilter.invitee.clients) {
      index = this.calendarFilter.invitee.clients.findIndex(x => x.id === this.userDetails.id);
    } else if (this.calendarFilter.invitee.potentialClients) {
      index = this.calendarFilter.invitee.potentialClients.findIndex(x => x.id === this.userDetails.id);
    }
    if (index === -1 && (this.calendarFilter.invitee.employees.length > 0 || this.calendarFilter.invitee.clients.length > 0 || this.calendarFilter.invitee.potentialClients.length > 0)) {
      const obj = {
        id: this.userDetails.id,
        name: this.userDetails.name
      };
      this.addResource(obj);
      this.getResourceUserEvent(obj.id);
    }

    this.calendarFilter.invitee.employees.forEach((obj) => {
      this.addResource(obj);
      this.getResourceUserEvent(obj.id);
    });

    this.calendarFilter.invitee.clients.forEach((obj) => {
      this.addResource(obj);
      this.getResourceUserEvent(obj.id);
    });

    this.calendarFilter.invitee.potentialClients.forEach((obj) => {
      this.addResource(obj);
      this.getResourceUserEvent(obj.id);
    });
    this.loading = false;
  }


  calendarClickSelect(info) {
    if (
      this.pageType == 'matter' ||
      this.pageType == 'clientconversion' ||
      this.pageType == 'potentialClient'
    ) {
      this.openCreateEventModal(undefined, undefined, info.start, info.end);
    } else {
      this.router.navigate(['/calendar/create-event'], {queryParams: {start: info.start, end: info.end}});
    }
  }

  changeView(e) {
    this.searchControl.patchValue('');
    this.isResourceViewMode = false;
    if (e == 'resourceTimeGridDay') {
      this.calendarViewType = e;
      this.isResourceViewMode = true;
    } else if (e == 'timeGridDay') {
      this.isResourceViewMode = false;
      this.calendarViewType = e;
    } else {
      this.view = e;
      this.calendarViewType = e.view.type;
    }
    this.closeCmodal();

    setTimeout(() => {
      if ((this.calendarViewType === 'timeGridDay' || this.calendarViewType === 'resourceTimeGridDay') && (this.calendarFilter.invitee.employees.length > 0 || this.calendarFilter.invitee.potentialClients.length > 0 || this.calendarFilter.invitee.clients.length > 0)) {
        this.isResourceViewMode = true;
        this.resourceviewEventsArray = [];
        this.resourceArray = [];
        let notExisitingEmployeeEvents;
        if (this.calendarFilter.invitee.employees.length > 0) {
          notExisitingEmployeeEvents = this.calendarFilter.invitee.employees.filter(
            a => !this.employeeEventsCache[a.id]
          );
        } else if (this.calendarFilter.invitee.potentialClients.length > 0) {
          notExisitingEmployeeEvents = this.calendarFilter.invitee.potentialClients.filter(
            a => !this.employeeEventsCache[a.id]
          );
        } else if (this.calendarFilter.invitee.clients.length > 0) {
          notExisitingEmployeeEvents = this.calendarFilter.invitee.clients.filter(
            a => !this.employeeEventsCache[a.id]
          );
        }

        if (notExisitingEmployeeEvents.length > 0) {
          this.getAllResourceUserEvents();
        } else {
          let events = this.getTotalEvents();
          if (this.showLoggedUserEvents) {
            this.createCalendarEvents(events);
          }
        }
      } else if ((this.calendarFilter.invitee.employees.length == 0 && this.calendarFilter.invitee.potentialClients.length == 0 && this.calendarFilter.invitee.clients.length == 0)) {
        // if (this.closeClick) {
        if (this.selectedFilterUser && this.selectedFilterUser.length > 0) {
          let colorObj;
          this.searchResultEvents = {};
          this.getEvents(null);
          this.selectedFilterUser.map((row) => {
            colorObj = {
              bordercolor: this.eventColorMap[row.colorCode].bordercolor,
              bgcolor: this.eventColorMap[row.colorCode].bgcolor
            };
            this.getEvents('calendarFilter', row.id, colorObj, 'topsearch', row.role);
          });
        } else {
          this.getEvents(null);
        }
        // }
        this.closeClick = true;
      } else {
        this.resourceviewEventsArray = [];
        this.getAllResourceUserEvents();
      }
    }, 100);
    let calendarView = 3;
    switch (this.calendarViewType) {
      case 'timeGridDay':
        calendarView = 1;
        break;
      case 'agendaFiveDay':
        calendarView = 2;
        break;
      case 'timeGridWeek':
        calendarView = 3;
        break;
      case 'dayGridMonth':
        calendarView = 4;
        break;
    }
    this.calendarService
      .v1CalendarSettingsCalendarViewPut({
        personId: this.userDetails.id,
        calendarView: calendarView
      }).pipe(map(UtilsHelper.mapData)
    ).subscribe(res => {
      UtilsHelper.setObject('calendarView', calendarView);
      }, () => {
      }
    );
  }

  public filterMatters() {
    this.matterList = this.tempMatterList;
    let clientmatter = [], potentialclientmatter = [];
    if (this.calendarFilter.client.clients.length > 0) {
      this.matterList.forEach(x => {
        let id: any = x;
        id = id.clientId;
        const idx = this.calendarFilter.client.clients.findIndex(y => y.id === id);
        if (idx > -1) {
          clientmatter.push(x);
        }
      });
    }
    if (this.calendarFilter.client.potentialClients.length > 0) {
      this.matterList.forEach(x => {
        let id: any = x;
        id = id.clientId;
        const idx = this.calendarFilter.client.potentialClients.findIndex(y => y.id === id);
        if (idx > -1) {
          potentialclientmatter.push(x);
        }
      });
      clientmatter = clientmatter.concat(potentialclientmatter);
    }
    this.matterList = clientmatter;
  }

  private removeLoggedUserEvents() {
    this.resourceArray = this.resourceArray.filter(element => element.id != this.userDetails.id);
    this.resourceviewEventsArray = this.resourceviewEventsArray.filter(element => element.id != this.userDetails.id);
  }

  public showloggedUserCalendarEvents() {
    this.showLoggedUserEvents = this.myCalendar;
    this.applyFilter();
  }

  public formatTime(start, end) {
    const startTime = moment(start).format('a');
    const endTime = moment(end).format('a');
    if (moment(start, 'DD-MM-YYYY').isSame(moment(end, 'DD-MM-YYYY'), "day")) {
      if (startTime == endTime) {
        return moment(start).format('hh:mm') + ' - ' + moment(end).format('hh:mm a');
      } else {
        return moment(start).format('hh:mm a') + ' - ' + moment(end).format('hh:mm a');
      }
    } else {
      return moment(start).format('MMM, DD - hh:mm a') + ' - ' + moment(end).format('MMM, DD - hh:mm a')
    }
  }

  public clearAllFilter() {
    this.eventList.forEach((event) => {
      // if (event.client) {
      if (event.colorObj) {
        delete event.colorObj;
      }
      // }
    });
  }

  /**
   * function to call when clicked on cancel consultation
   */
  cancelConsultationClicked(userDetail: any): void {
    this.openEditModelPopup = false;
    this.openEditModelPopupNotification = false;
    if (this.eventOrganizerDetls && this.eventOrganizerDetls.person && this.eventOrganizerDetls.person.id == userDetail.id) {
      this.cancelConsultationContent = '';
      this.cancelConsultationPopup = true;
      this.renderer.addClass(document.body, 'cmodal-open');
    }
  }

  /***** function to remove body class on popup close */
  removeBodyClass(): void {
    this.renderer.removeClass(document.body, 'cmodal-open');
    let calendarScroll: any = document.querySelectorAll('.fc-scroller');
    let calendarScroll1: any = document.querySelectorAll('.fc-day-grid-container');
    if (calendarScroll && calendarScroll.length > 0) {
      calendarScroll[0].style.overflow = 'hidden scroll';
    }
    if (calendarScroll1 && calendarScroll1.length > 0) {
      calendarScroll1[0].style.overflow = 'auto';
    }
  }

  /***
   * function to close open cancel consulation popup
   */
  closeCancelConsulationPopup(): void {
    this.cancelConsultationPopup = false;
    this.removeBodyClass();
  }

  public getDocIcon(file) {
    let ext = file.split('.').pop();
    let icon;
    switch (ext) {
      case 'pdf':
        icon = '../../../../../../assets/images/dms/pdffilled.svg';
        break;
      case 'xls':
      case 'xlsx':
        icon = '../../../../../../assets/images/dms/excel.png';
        break;
      case 'docx':
      case 'doc':
      case 'rtf':
        icon = '../../../../../../assets/images/dms/worddoc.png';
        break;
      // case 'jpg':
      // case 'jpeg':
      // case 'png':
      //   icon = '../../../../../../assets/images/dms/pdffilled.svg';
      //   break;
      case 'ppt':
        icon = '../../../../../../assets/images/dms/powerpoint.png';
        break;
      default:
        icon = '../../../../../../assets/images/dms/document.png';
    }
    return icon;
  }

  public onClickedOutside(event) {
    this.displayDrpDwn = false;
  }

  subscribed(row, colorObj: any = null) {
    if (this.subscriptionList && this.subscriptionList.length > 0) {
      let colors = this.colorMapping;
      this.subscriptionList.forEach(subscription => {
        let colorCode = subscription.colorCode.split(',')
        colors = colors.filter(v => v !== colorCode[1].slice(1))
      })
      // row.colorCode = this.colorMapping[this.subscriptionList.length];
      if (colors.length > 0) {
        row.colorCode = colors[0];
      } else if (this.subscriptionList.length > 15) {
        row.colorCode = this.colorMapping[this.subscriptionList.length - 16]
      }
    } else {
      row.colorCode = this.colorMapping[0];
    }

    let colorObj2 = {
      bordercolor: this.eventColorMap[row.colorCode].bordercolor,
      bgcolor: this.eventColorMap[row.colorCode].bgcolor
    };
    this.searchLoading = true;
    let data = {
      "id": 0,
      "personId": JSON.parse(localStorage.getItem('profile')).id,
      "subscribeRole": row.role,
      "subscribePersonId": row.role != 'Matter' ? row.id : 0,
      "subscribeMatterId": row.role == 'Matter' ? row.id : 0,
      "subscribeSnap": JSON.stringify(row),
      "colorCode": colorObj2.bgcolor + ',' + colorObj2.bordercolor
    }
    this.calendarService.v1CalendarSubscriptionsPost$Json$Response({body: data}).subscribe(res => {
      const list = JSON.parse(res.body as any).results;
      this.subscriptionList = list;
      this.searchLoading = false;
      if (row.role != 'Matter') {
        this.calendarFilter.client.clients.push({
          id: row.id,
          name:
            row['name'] ||
            this.getName({
              type: 'person',
              person: row
            })
        });
      } else {
        this.calendarFilter.matters.push({
          id: row.id,
          name:
            row['name'] ||
            this.getName({
              type: 'person',
              person: row
            })
        });
      }
      this.getEvents('calendarFilter', row.id, colorObj2, 'topsearch', row.role, 'subscribeFilter');
      this.manageSubscriptionData(list);
    }, err => {
      this.searchLoading = false;
    });
  }

  unSubscribed(row) {
    this.searchLoading = true;
    this.subscriptionList = this.subscribedPeopleList.concat(this.subscribedMatterList);
    this.calendarService.v1CalendarSubscriptionsIdDelete$Response({id: row.subId}).subscribe(res => {
      const list = JSON.parse(res.body as any).results;
      this.subscriptionList = list;
      this.searchLoading = false;
      this.manageSubscriptionData(list);
      if (row.role == 'Matter') {
        let index = this.calendarFilter.matters.findIndex(a => a.id == row.id);
        this.calendarFilter.matters.splice(index, 1);
      } else {
        let index = this.calendarFilter.client.clients.findIndex(a => a.id == row.id);
        this.calendarFilter.client.clients.splice(index, 1);
      }

      this.applyFilter();
    }, err => {
      this.searchLoading = false;
    });
  }

  getSubscribtionList() {
    this.searchLoading = true;
    this.calendarService.v1CalendarSubscriptionsGet$Response().subscribe(res => {
      const list = JSON.parse(res.body as any).results;
      this.subscriptionList = list;
      this.subscribedMatterList = [];
      this.subscribedPeopleList = [];
      this.peopleRole = [];
      if (list && list.length) {
        list.map(lst => {
          const subscriberData = JSON.parse(lst.subscribeSnap);
          if (lst.subscribeMatterId && lst.subscribeMatterId > 0) {
            this.mangeColorOnCheckbox(lst.subscribeMatterId, lst.colorCode);
            this.subscribedMatterList.push({
              id: lst.subscribeMatterId,
              colorCode: lst.colorCode,
              name: lst.subscribeMatterName,
              checked: true,
              subId: lst.id,
              role: lst.subscribeRole
            });
          } else {
            this.mangeColorOnCheckbox(lst.subscribePersonId, lst.colorCode);
            this.subscribedPeopleList.push({
              id: lst.subscribePersonId,
              colorCode: lst.colorCode,
              clientName: lst.subscribePersonName,
              checked: true,
              subId: lst.id,
              role: lst.subscribeRole,
              timezone: this.timeZoneEnum[subscriberData.empTimezone],
              primaryOffice: subscriberData.primaryOfficeName
            });
            this.orgSubscribedPeopleList.push({
              id: lst.subscribePersonId,
              colorCode: lst.colorCode,
              clientName: lst.subscribePersonName,
              checked: true,
              subId: lst.id,
              role: lst.subscribeRole,
              timezone: this.timeZoneEnum[subscriberData.empTimezone],
              primaryOffice: subscriberData.primaryOfficeName
            });
          }
        });
      }
      this.subscribedMatterList = this.subscribedMatterList.sort((a, b) => a.name ? a.name.localeCompare(b.name) : '');
      this.subscribedPeopleList = this.subscribedPeopleList.sort((a, b) => a.clientName ? a.clientName.localeCompare(b.clientName) : '');
      this.sortingSubscribedPeople(this.subscribedPeopleList);
      this.getRoleList(this.subscribedPeopleList);
      this.setEmpTimezoneList();
      this.clearFilter();
      this.searchLoading = false;
      if (this.subscribedMatterList && this.subscribedMatterList.length > 0) {
        let colorObj, color;
        this.subscribedMatterList.map((obj) => {
          color = obj.colorCode.split(',');
          colorObj = {
            bordercolor: color[1],
            bgcolor: color[0]
          };
          this.getEvents('calendarFilter', obj.id, colorObj, 'topsearch', obj.role, 'subscribeFilter');
          obj.checked = true;
          this.calendarFilter.matters.push({
            id: obj.id,
            name:
              obj['name'] ||
              this.getName({
                type: 'person',
                person: obj
              })
          });
        });
      }
      if (this.subscribedPeopleList && this.subscribedPeopleList.length > 0) {
        let colorObj, color;
        this.subscribedPeopleList.map((obj) => {
          color = obj.colorCode.split(',');
          colorObj = {
            bordercolor: color[1],
            bgcolor: color[0]
          };
          this.getEvents('calendarFilter', obj.id, colorObj, 'topsearch', obj.role, 'subscribeFilter');
          obj.checked = true;
          this.calendarFilter.client.clients.push({
            id: obj.id,
            name:
              obj['name'] ||
              this.getName({
                type: 'person',
                person: obj
              })
          });
        });
      }
    }, err => {
      this.searchLoading = false;
    });
  }

  private sortingSubscribedPeople(people) {
    people.filter(obj => {
      switch (obj.role) {
        case "Client":
          obj['order'] = 1;
          break;
        case "Corporate Contact":
          obj['order'] = 2;
          break;
        case "Potential Client":
          obj['order'] = 3;
          break;
        case "Employee":
          obj['order'] = 4;
          break;
        default:
        // code block
      }
      return obj;
    })
    people.sort(function (a, b) {
      return a.order - b.order;
    });
    this.subscribedPeopleList = people;
  }

  private getRoleList(list: any[]) {
    const returnList = [];
    for (let i = 0; i < list.length; i++) {
      let exist = this.peopleRole.filter((obj: { name: any }) => obj.name.includes(list[i].role))
      exist.length == 0 ? this.peopleRole.push({id: i + 1, name: list[i].role}) : '';
    }
  }

  openMenu(index: number, event: any): void {
    setTimeout(() => {
      if (this.currentActive !== index) {
        this.currentActive = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        event.target
          .classList.add('datatable-row-hover');
      } else {
        this.currentActive = null;
        event.target
          .classList.remove('datatable-row-hover');
      }
    }, 50);
  }

  public applyFilter2() {
    let filterList = this.orgSubscribedPeopleList;
    if (this.selectedRole > 0) {
      const cat = this.peopleRole
        .filter((obj: { id: any }) => this.selectedRole == obj.id)
        .map(({name}) => name);
      filterList = filterList.filter(item => {
        if (item.role && cat.indexOf(item.role) !== -1) {
          return item;
        }
      });
    }

    this.subscribedPeopleList = filterList;
    this.sortingSubscribedPeople(this.subscribedPeopleList);
  }

  public getSelectedRole(event) {
    this.title = '';
    if (event.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'All';
    }
  }

  public clearFilter() {
    this.selectedRole = [];
    this.peopleRole.forEach(item => (item.checked = false));
    this.title = 'All';
    this.applyFilter2();
  }

  mangeColorOnCheckbox(id, colorObj) {
    if (colorObj) {
      colorObj = colorObj.split(',');
      $('.custom-control-label').append('<style>.custom-control-input:checked ~ .custom-control-label.add_color_' + id + '::before{background-color:' + colorObj[1] + ' !important;border-color:' + colorObj[1] + '}</style>');

    }
  }

  manageSubscriptionData(list) {
    this.subscribedMatterList = [];
    this.subscribedPeopleList = [];
    this.orgSubscribedPeopleList = [];
    this.peopleRole = [];
    if (list && list.length) {
      list.map(lst => {
        const subscriberData = JSON.parse(lst.subscribeSnap);
        let color = lst.colorCode.split(',');
        let colorObj = {
          bordercolor: color[1],
          bgcolor: color[0]
        };

        if (lst.subscribeMatterId && lst.subscribeMatterId > 0) {
          this.mangeColorOnCheckbox(lst.subscribeMatterId, lst.colorCode);
          this.subscribedMatterList.push({
            id: lst.subscribeMatterId,
            name: lst.subscribeMatterName,
            checked: true,
            subId: lst.id,
            role: lst.subscribeRole,
            colorCode: lst.colorCode
          });
        } else {
          this.mangeColorOnCheckbox(lst.subscribePersonId, lst.colorCode);
          this.subscribedPeopleList.push({
            id: lst.subscribePersonId,
            clientName: lst.subscribePersonName,
            checked: true,
            subId: lst.id,
            role: lst.subscribeRole,
            colorCode: lst.colorCode,
            timezone: this.timeZoneEnum[subscriberData.empTimezone],
            primaryOffice: subscriberData.primaryOfficeName
          });
          this.orgSubscribedPeopleList.push({
            id: lst.subscribePersonId,
            clientName: lst.subscribePersonName,
            checked: true,
            subId: lst.id,
            role: lst.subscribeRole,
            colorCode: lst.colorCode,
            timezone: this.timeZoneEnum[subscriberData.empTimezone],
            primaryOffice: subscriberData.primaryOfficeName
          })
        }
      });
    }
    this.subscribedMatterList = this.subscribedMatterList.sort((a, b) => a.name ? a.name.localeCompare(b.name) : '');
    this.subscribedPeopleList = this.subscribedPeopleList.sort((a, b) => a.clientName ? a.clientName.localeCompare(b.clientName) : '');
    this.getRoleList(this.subscribedPeopleList);
    this.sortingSubscribedPeople(this.subscribedPeopleList);
    this.setEmpTimezoneList();
    this.clearFilter();
    // toggle plus minus icon while subscribe
    if (this.searchUserList.length > 0) {
      this.searchUserList = this.searchUserList.filter(list => {
        if (this.subscriptionList.length > 0) {
          var result = this.subscriptionList.filter(val => {
            if (val['subscribeRole'] != 'Matter') {
              if (list.id == val.subscribePersonId) {
                return val;
              }
            } else {
              if (list.id == val.subscribeMatterId) {
                return val;
              }
            }
          });
          return result.length > 0 ? list['subId'] = result[0].id : list['subId'] ? delete list['subId'] : [];
        }
        return list;
      })
    }
  }

  loadSystemTimeZones() {
    this.miscService
      .v1MiscSystemtimezonesGet$Response()
      .subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            let defaultTimeZone;
            for (let i = 0; i < parsedRes.results.length; i++) {
              if (parsedRes.results[i].isSysytemTimeZone == true) {
                this.localTimeZone = parsedRes.results[i];
                break;
              }
              if (parsedRes.results[i].id === 'Eastern Standard Time') {
                defaultTimeZone = parsedRes.results[i];
              }
            }
            if (!this.localTimeZone) {
              this.localTimeZone = defaultTimeZone;
            }
          }
        }
      });
  }

  convertDateTimeToUsersDefaultTime(dateTime) {
    let newDateTime: any;
    let timeZone = this.localTimeZone.name.substr(4, 6);
    let reg = new RegExp(/^[+:\d-]+$/);
    let currentTimeZone = timeZone.split(':');
    currentTimeZone = (reg.test(timeZone) && currentTimeZone.length > 1) ? currentTimeZone.join('') : "+00:00";
    //converting to utc
    newDateTime = moment.utc(dateTime).format('YYYY-MM-DD[T]HH:mm:ssZ');
    //converting to system time zone
    newDateTime = moment(newDateTime).utcOffset(currentTimeZone).format('YYYY-MM-DD[T]HH:mm:ssZ');
    return newDateTime;
  }

  get isInviteeOnly() {
    if (this.eventDetails.invitees && this.eventDetails.invitees.length) {
      const currentUser = this.eventDetails.invitees.filter((invitee) => {
        return invitee && invitee.person && invitee.person.id === this.userDetails.id;
      })[0];
      return currentUser ? !currentUser.isHost && !currentUser.isOrganiser : false;
    }
    return false;
  }

  proposeNewTime() {
    this.router.navigate(['/calendar/propose-new-time/' + this.eventDetails.id]);
  }

  getProposalTimeString(data) {
    if ((this.eventDetails && !this.eventDetails.isAllDayEvent) && !this.isLongEvent) {
      return this.datePipe.transform(data.startDateTime, 'MMM dd, hh:mm aaa') + ' - ' + this.datePipe.transform(data.endDateTime, 'shortTime');
    } else if (this.isLongEvent) {
      return this.datePipe.transform(data.startDateTime, 'MMM dd, hh:mm aaa') + ' - ' + this.datePipe.transform(data.endDateTime, 'MMM dd, hh:mm aaa');
    } else if (this.eventDetails && this.eventDetails.isAllDayEvent) {
      return this.datePipe.transform(data.startDateTime, 'MMM dd') + ', All Day';
    }
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  setEmpTimezoneList() {
    this.empTimezoneList = [];
    this.empTimezoneList.push({
      id: this.userDetails.id,
      name: this.userDetails.lastName + ', ' + this.userDetails.firstName + ' (Me)',
      currentTime: this.calendarSettings ? this.getCurrentTime(this.timeZoneNameEnum[this.timeZoneEnum[this.calendarSettings.timeZoneId]]) : '',
      timezoneName: this.userTimezone ? this.timeZoneNameEnum[this.userTimezone] : '',
      primaryLawOffice: this.calendarSettings && this.calendarSettings['primaryOffice'] ? this.calendarSettings['primaryOffice'].name : '',
      colorCode: '',
    });
    this.selectedFilterUser.forEach(filteredUser => {
      const isExisting = this.empTimezoneList.filter(item => item.id === filteredUser.id).length > 0;
      if (!isExisting && filteredUser.role === 'Employee') {
        this.empTimezoneList.push({
          id: filteredUser.id,
          name: filteredUser.name,
          currentTime: this.getCurrentTime(this.timeZoneNameEnum[this.timeZoneEnum[filteredUser['empTimezone']]]),
          colorCode: '#' + filteredUser.colorCode,
          timezoneName: this.timeZoneNameEnum[this.timeZoneEnum[filteredUser['empTimezone']]],
          primaryLawOffice: filteredUser['primaryOfficeName']
        })
      }
    })
    this.subscribedPeopleList.forEach(filteredUser => {
      const isExisting = this.empTimezoneList.filter(item => item.id === filteredUser.id).length > 0;
      if (!isExisting && filteredUser.role === 'Employee') {
        this.empTimezoneList.push({
          id: filteredUser.id,
          name: filteredUser.clientName,
          currentTime: this.getCurrentTime(this.timeZoneNameEnum[filteredUser['timezone']]),
          colorCode: filteredUser.colorCode.split(',')[1],
          timezoneName: this.timeZoneNameEnum[filteredUser['timezone']],
          primaryLawOffice: filteredUser['primaryOffice']
        })
      }
    })
  }

  getCurrentTime(timezoneName) {
    if (timezoneName) {
      const timezone = timezoneName.split('GMT')[1];
      return moment(new Date()).utcOffset(timezone).format('hh:mm');
    }
    return '';
  }
}

