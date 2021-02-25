import { Component, EventEmitter, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGrigPlugin from '@fullcalendar/timegrid';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { forkJoin, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { IEventType, IPRofile } from 'src/app/modules/models';
import { EventFormError } from 'src/app/modules/models/fillable-form.model';
import { getWorkingHour, WORKING_DAYS } from 'src/app/modules/models/office-data';
import * as Constant from 'src/app/modules/shared/const';
import { nearestFutureMinutes, UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { CommonService } from 'src/app/service/common.service';
import { SelectService } from 'src/app/service/select.service';
import { vwCalendarSettings, vwClient } from 'src/common/swagger-providers/models';
import { CalendarService, MatterService, MiscService, OfficeService } from 'src/common/swagger-providers/services';
import { vwInvitee } from 'src/app/modules/models/vw-invitee.model';

@Component({
  selector: 'app-add-event',
  templateUrl: './add-event.component.html',
  styleUrls: ['./add-event.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AddEventComponent implements OnInit, OnDestroy {

  public config: any = {
    height: 250,
    menubar: false,
    placeholder: 'Enter a description',
    statusbar: false,
    plugins: 'image imagetools media  lists link autolink imagetools noneditable placeholder',
    toolbar: 'bold italic underline  alignleft aligncenter alignright alignjustify   outdent indent bullist numlist  customFileLink ',
    content_css: [
      '//fonts.googleapis.com/css?family=Lato:300,300i,400,400i',
      'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css'
    ],
    link_context_toolbar: true,
    link_title: false,
    onchange_callback: "myCustomOnChangeHandler",
    setup: (editor) => {
      editor.ui.registry.addButton('customFileLink', {
        text: '<img src="/assets/images/icon/outlook.png" style="width: 30px; height: 23px;margin-left: -10px;margin-top: 3px; cursor: pointer">',
        tooltip: 'Upload File',
        onAction: () => {
          let inputFile = document.createElement("INPUT");
          inputFile.setAttribute("type", "file");
          inputFile.setAttribute("style", "display: none");
          inputFile.click();

          inputFile.addEventListener("change", (e: any) => {
            if (e.path && e.path[0] && e.path[0].files) {
              let file = e.path[0].files[0] as File;
              this.filedata.push(file);
              editor.insertContent("<div style='outline:0 !important;display:inline-block;padding:4px 9px 4px 9px;background-color: #E7EDF3;border-radius:4px;pointer-events:none;border:none;position:relative;' contenteditable='false'><span style='display:flex;font-size:12px;font-weight:500;line-height:16px'><img style='margin-right:5px;' src=" + this.commonService.getIcons(file.name) + ">" + file.name + "</span> </div>");
            }
          })
        }
      });
    }
  }
  public filedata: Array<File> = [];
  public myfirsttab: string[] = ['Event Details', 'Find a Time'];
  public selectftabs = this.myfirsttab[0];
  public mytab: string[] = ['Invitee'];
  public selecttabs = this.mytab[0];
  public eventFormError: EventFormError;
  public calendarEvents: EventInput[] = [];
  public calendarPlugins = [dayGridPlugin, timeGrigPlugin, interactionPlugin];
  public resourceArray: Array<any> = [];
  public userDetails: IPRofile;
  public currentIndex: number = null;
  public selectedInvite: Array<any> = [];
  private inviteeSubscribe: Subscription;
  public opts: ISlimScrollOptions;
  public scrollEvents: EventEmitter<SlimScrollEvent>;
  public matterTypeList: Array<IEventType>;
  public iLoading: boolean = false;
  public recurringTypesList: Array<{ id: number, name: string }>;
  public eventStatusList: Array<any>;
  public eventPrivacyList: Array<any>;
  public inviteeTypeList: Array<any>;
  public inviteeTypeMap = {};
  public eventLocation: string;
  public eventPrivacy: number;
  public eventForm: FormGroup = this.builder.group({
    title: new FormControl(null, [Validators.required]),
    eventType: new FormControl(null, [Validators.required]),
    startDate: new FormControl(null, [Validators.required]),
    startTime: new FormControl(null, [Validators.required]),
    endTime: new FormControl(null, [Validators.required]),
    endDate: new FormControl(null, [Validators.required]),
    beforeTravelTimeHours: new FormControl(),
    afterTravelTimeHours: new FormControl(),
    beforeTravelTimeMinutes: new FormControl(0),
    afterTravelTimeMinutes: new FormControl(0),
    recurringType: new FormControl(),
    isAllDayEvent: new FormControl(false),
    repeatEvery: new FormControl(),
    recurringEventEvery: new FormControl(),
    daysOfWeek: new FormControl(),
    ends: new FormControl(null),
    recurringEndDate: new FormControl(),
    recurringEvent: new FormControl(),
    numberOfOccurancesEnd: new FormControl(),
    eventLocation: new FormControl(),
    eventStatus: new FormControl(),
    eventPrivacy: new FormControl(),
    description: new FormControl(),
  });
  public customeHoursBeforEventForm: FormGroup = this.builder.group({
    hours: new FormControl(null, [Validators.required]),
    minutes: new FormControl(null, [Validators.required]),
  });
  public customeHoursAfterEventForm: FormGroup = this.builder.group({
    hours: new FormControl(null, [Validators.required]),
    minutes: new FormControl(null, [Validators.required]),
  });
  public inviteeListDisplay: boolean = false;
  public searchInvitee: string;
  public dateTime: Date;
  public startTime: Date;
  public endTime: Date;
  public employee: boolean = false;
  public client: boolean = false;
  public potentialClient: boolean = false;
  public associations: boolean = false;
  public clientDetails: vwClient;
  public inviteeList: Array<vwInvitee> = [];
  public isInvalidEmail: Boolean = false;
  public colorsArray = ['#453599', '#c7ccef', '#f44436', '#fbc6c2', '#ea1e63', '#f8bbd0', '#9c27b0', '#e1bee7', '#673ab7', '#d1c3e9', '#3f51b5', '#c5cae8', '2096f3', '#b4e5fb', '#05a9f4', '#b4e5fb', '#02bcd4', '#b3eaf2', '#009688', '#b2dfdb', '#4caf50', '#c9e7ca', '#8bc34a', '#dcedc8']
  public calendarSettings: vwCalendarSettings;
  public workingHoursList: Array<any> = [];
  public submitted: boolean = false;
  public hoursArray: Array<{ id: number; name: string }> = [];
  public hoursArray2: Array<{ id: number; name: string }> = [];
  public minutesArray: Array<{ id: number; name: string }> = [];
  public dayofweekArray: Array<any> = [];
  public selectedDaysOfWeek: Array<any> = [];
  public monthyearArr = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  public calendarMonthYear = { month: 0, year: 0 };
  public formBeforEvent: Boolean = false;
  public formAfterEvent: Boolean = false;
  public recurringEventArr: Array<{ name: string, value: string }> = [{ value: 'Daily', name: 'Days' }, { value: 'Week', name: 'Weeks' }, { value: 'Month', name: 'Months' }, { value: 'Years', name: 'Years' }];
  public recurringDaysArr: Array<{ name: string, value: number }> = UtilsHelper.getDayslistn();
  public selectedFilterValue: any = '0';
  public recurVal: number = 100;
  public daysselected: Array<any> = [];
  public colorMapping: Array<string> = [
    'F44436', 'EA1E63', '9C27B0', '673AB7', '1d7220', '2096F3',
    '05A9F4', '02BCD4', '009688', '4CAF50', '8BC34A', 'CDDC39',
    'FFEB3B', 'FFC108', 'FF9800', 'FF5821'
  ];
  public eventColorMap = {
    '453599': { bordercolor: '#453599', bgcolor: '#C7CCEF' },
    'F44436': { bordercolor: '#F44436', bgcolor: '#FBC6C2' },
    'EA1E63': { bordercolor: '#EA1E63', bgcolor: '#F8BBD0' },
    '9C27B0': { bordercolor: '#9C27B0', bgcolor: '#E1BEE7' },
    '673AB7': { bordercolor: '#673AB7', bgcolor: '#D1C3E9' },
    '1d7220': { bordercolor: '#1d7220', bgcolor: '#8be18e' },
    '2096F3': { bordercolor: '#2096F3', bgcolor: '#BCDFFB' },
    '05A9F4': { bordercolor: '#05A9F4', bgcolor: '#B4E5FB' },
    '02BCD4': { bordercolor: '#02BCD4', bgcolor: '#B3EAF2' },
    '009688': { bordercolor: '#009688', bgcolor: '#B2DFDB' },
    '4CAF50': { bordercolor: '#4CAF50', bgcolor: '#C9E7CA' },
    '8BC34A': { bordercolor: '#8BC34A', bgcolor: '#DCEDC8' },
    'CDDC39': { bordercolor: '#CDDC39', bgcolor: '#F0F4C3' },
    'FFEB3B': { bordercolor: '#FFEB3B', bgcolor: '#FFF9C4' },
    'FFC108': { bordercolor: '#FFC108', bgcolor: '#FFECB4' },
    'FF9800': { bordercolor: '#FF9800', bgcolor: '#FFE0B2' },
    'FF5821': { bordercolor: '#FF5821', bgcolor: '#FFCCBC' },
  };
  public eventDetails: any;
  public action: string = 'add';
  public minDate = new Date();
  officeSearchResultsLoading: boolean;
  officeSearchResults: any = [];
  showOfficeSearchResults: boolean;
  timeZoneEnum = {
    'Hawaiian Standard Time': 'HT',
    'Pacific Standard Time': 'PT',
    'Mountain Standard Time': 'MT',
    'Central Standard Time': 'CT',
    'Eastern Standard Time': 'ET',
    'Alaskan Standard Time': 'AT',
  };
  consultationId: number;
  isInviteeSearchLoading = false;
  public scrollbarOptions = { axis: 'y', theme: 'dark-3' };

  constructor(
    private activeModal: NgbActiveModal,
    public commonService: CommonService,
    private calendarService: CalendarService,
    private matterService: MatterService,
    private officeService: OfficeService,
    private builder: FormBuilder,
    private miscService: MiscService,
    private modalService: NgbModal,
    private selectService: SelectService,
  ) {
    this.eventFormError = new EventFormError();
    this.userDetails = JSON.parse(localStorage.getItem('profile'));
  }

  ngOnInit() {
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
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

    this.dateTime = new Date();
    let now = moment();
    this.startTime = nearestFutureMinutes(30, now).toDate();
    this.endTime = new Date(this.startTime.getTime() + 30 * 60000);
    this.eventForm.patchValue({
      startDate: moment(this.dateTime).format('YYYY-MM-DD') + 'T00:00:00',
      endDate: this.dateTime,
      startTime: this.startTime,
      endTime: this.endTime,
      eventLocation: ''
    });
    this.recurringDaysArr.map(item => {
      let obj = { name: item.name, id: +item.value, checked: false };
      this.dayofweekArray.push(obj);
    })
    this.getList();
    this.counter();
  }


  ngOnDestroy() {
    if (this.inviteeSubscribe) {
      this.inviteeSubscribe.unsubscribe();
    }
  }

  get f() { return this.eventForm.controls; }

  get fBeforEvent() { return this.customeHoursBeforEventForm.controls }

  get fAfterEvent() { return this.customeHoursAfterEventForm.controls }

  public close() {
    this.activeModal.close(null);
  }

  public save() {
    this.submitted = true;
    if (this.eventForm.valid) {
      let data = {...this.eventForm.value};
      let inviteeArr = [];
      let displayRecurringEvent = '-';
      if (this.selectedInvite && this.selectedInvite.length > 0) {
        this.selectedInvite.map((obj) => {
          let invitee: any = {};
          if (obj.id) {
            invitee = {
              person: { id: obj.id, email: obj.email, firstName: obj.firstName, lastName: obj.lastName },
              isOptional: obj.isOptional,
              isRequired: obj.isRequired,
              isOrganiser: obj.isOrganiser,
              isHost: obj.isHost,
              id: obj.inviteeId,
              acceptStatus: obj.acceptStatus
            };
            invitee.inviteeType = {
              id: (obj.role) ? this.inviteeTypeMap[obj.role] : (obj.inviteeType) ? obj.inviteeType.id : undefined
            };
          } else {
            invitee = {
              personEmail: obj.personEmail,
              person: { id: 0, email: obj.personEmail, firstName: obj.personEmail, lastName: obj.personEmail },
              inviteeType: {
                id: this.inviteeTypeMap[obj.role],
              },
              isOptional: obj.isOptional,
              isRequired: obj.isRequired,
              isOrganiser: obj.isOrganiser,
              isHost: obj.isHost,
              id: obj.inviteeId,
              acceptStatus: obj.acceptStatus
            };
          }
          inviteeArr.push(invitee);
        });
      }
      let isRecurringEvent = false;
      let recurringEvent = null;
      if (data.recurringType) {
        isRecurringEvent = true;
        let id = 0;
        if (data.recurringType === 1) {
          recurringEvent = {
            recurringEndDate: moment(data.recurringEndDate).format(Constant.SharedConstant.DateFormat) + Constant.SharedConstant.TimeFormat,
            recurringType: data.recurringType,
            recurringEveryNumber: 1,
            id
          };
          displayRecurringEvent = 'Daily';
        } else {
          recurringEvent = {
            recurringEndDate: (data.ends === 'on') ? moment(data.recurringEndDate).format(Constant.SharedConstant.DateFormat) + Constant.SharedConstant.TimeFormat : null,
            recurringType: 10,
            id,
            daysOfWeek: this.daysselected,
            numberOfOccurancesEnd: (data.ends === 'after') ? +data.numberOfOccurancesEnd : null,
            recurringEveryNumber: +data.repeatEvery,
            recurringEveryUnit: data.recurringEventEvery
          };
          let exist = this.recurringTypesList.find(item => item.id === this.recurVal);
          if (exist) {
            let name_ = exist.name.split(':');
            displayRecurringEvent = (name_ && name_.length > 1) ? name_[1] : '';
          } else {
            let selectedRecuring = this.recurringEventArr.find(item => item.value === this.eventForm.controls['recurringEventEvery'].value)
            let day: string = this.eventForm.controls['recurringEventEvery'].value;
            if (selectedRecuring) {
              day = selectedRecuring.name;
            }
            let recDays = '';
            if (this.eventForm.value.daysOfWeek && this.eventForm.value.daysOfWeek.length > 0 && this.eventForm.value.recurringEventEvery !== 'Daily') {
              this.eventForm.value.daysOfWeek.map((item, index) => {
                recDays = (index === 0) ? ' on ' + this.dayofweekArray[item].name : recDays + "," + this.dayofweekArray[item].name;
              });
            }
            displayRecurringEvent = "Repeat Every " + this.eventForm.controls['repeatEvery'].value + ' ' + day + recDays;
          }
        }
      }
      if (data.beforeTravelTimeHours == 0) {
        data.beforeTravelTimeHours = parseInt(this.customeHoursBeforEventForm.value.hours);
        data.beforeTravelTimeMinutes = parseInt(this.customeHoursBeforEventForm.value.minutes);
      } else {
        if (data.beforeTravelTimeHours == 15 || data.beforeTravelTimeHours == 30 || data.beforeTravelTimeHours == 45) {
          data.beforeTravelTimeHours = 0;
          data.beforeTravelTimeMinutes = this.eventForm.value.beforeTravelTimeHours;
        } else if (data.beforeTravelTimeHours == 1.5) {
          data.beforeTravelTimeHours = 1;
          data.beforeTravelTimeMinutes = 30;
        } else {
          data.beforeTravelTimeHours = this.eventForm.value.beforeTravelTimeHours;
          data.beforeTravelTimeMinutes = 0;
        }
      }

      if (data.afterTravelTimeHours == 0) {
        data.afterTravelTimeHours = parseInt(this.customeHoursAfterEventForm.value.hours);
        data.afterTravelTimeMinutes = parseInt(this.customeHoursAfterEventForm.value.minutes);
      } else {
        if (data.afterTravelTimeHours == 15 || data.afterTravelTimeHours == 30 || data.afterTravelTimeHours == 45) {
          data.afterTravelTimeHours = 0;
          data.afterTravelTimeMinutes = this.eventForm.value.afterTravelTimeHours;
        } else if (data.afterTravelTimeHours == 1.5) {
          data.afterTravelTimeHours = 1;
          data.afterTravelTimeMinutes = 30;
        } else {
          data.afterTravelTimeHours = this.eventForm.value.afterTravelTimeHours;
          data.afterTravelTimeMinutes = 0;
        }
      }
      data.beforeTravelTimeHours = (data.beforeTravelTimeHours) ? +data.beforeTravelTimeHours : 0;
      data.beforeTravelTimeMinutes = (data.beforeTravelTimeMinutes) ? +data.beforeTravelTimeMinutes : 0;
      data.afterTravelTimeHours = (data.afterTravelTimeHours) ? +data.afterTravelTimeHours : 0;
      data.afterTravelTimeMinutes = (data.afterTravelTimeMinutes) ? +data.afterTravelTimeMinutes : 0;

      let event = {
        client: {
          id: this.clientDetails.id
        },
        title: data.title,
        eventType: this.matterTypeList.find(item => item.id === +data.eventType),
        description: data.description,
        startDateTime: moment(data.startDate).format('YYYY-MM-DD') + 'T' + moment(data.startTime).format('HH:mm:ss'),
        endDateTime: moment(data.endDate).format('YYYY-MM-DD') + 'T' + moment(data.endTime).format('HH:mm:ss'),
        beforeTravelTimeHours: data.beforeTravelTimeHours,
        beforeTravelTimeMinutes: data.beforeTravelTimeMinutes,
        afterTravelTimeHours: data.afterTravelTimeHours,
        afterTravelTimeMinutes: data.afterTravelTimeMinutes,
        isAllDayEvent: data.isAllDayEvent,
        eventLocation: data.eventLocation,
        privacy: this.eventPrivacyList.find(item => item.id === +data.eventPrivacy),
        status: this.eventStatusList.find(item => item.id === +data.eventStatus),
        invitees: inviteeArr,
        isRecurringEvent: isRecurringEvent,
        recurringEvent: recurringEvent,
        displayRecurringEvent: displayRecurringEvent,
        displayDescription: false
      }
      this.activeModal.close(event);
    }
  }

  public counter() {
    this.hoursArray = [
      { id: 15, name: '15 minutes' },
      { id: 30, name: '30 minutes' },
      { id: 45, name: '45 minutes' },
      { id: 1, name: '1 hour' },
      { id: 1.5, name: '1.5 hours' },
      { id: 2, name: '2 hours' },
      { id: 0, name: 'Custom' },
    ]
    this.hoursArray = [...this.hoursArray];
    this.hoursArray2 = [
      { id: 15, name: '15 minutes' },
      { id: 30, name: '30 minutes' },
      { id: 45, name: '45 minutes' },
      { id: 1, name: '1 hour' },
      { id: 1.5, name: '1.5 hours' },
      { id: 2, name: '2 hours' },
      { id: 0, name: 'Custom' },
    ]
  }

  /**
   * Get matter event type, event recurring type
   *
   * @private
   * @memberof CreateEventComponent
   */
  private getList() {
    this.iLoading = true;
    forkJoin([
      this.matterService.v1MatterEventsTypesListGet({}),
      this.matterService.v1MatterEventsRecurringtypesListGet({}),
      this.matterService.v1MatterEventsStatusesListGet({}),
      this.matterService.v1MatterEventsPrivacyListGet({}),
      this.matterService.v1MatterEventsInviteetypesListGet({})
    ]).pipe(
      map(res => {
        return {
          matterTypes: JSON.parse(res[0] as any).results,
          recurringtypes: JSON.parse(res[1] as any).results,
          eventStatus: JSON.parse(res[2] as any).results,
          eventPrivacy: JSON.parse(res[3] as any).results,
          inviteeType: JSON.parse(res[4] as any).results
        }
      }),
      finalize(() => {
        this.iLoading = false;
      })
    ).subscribe(res => {
      this.matterTypeList = res.matterTypes;
      this.recurringTypesList = res.recurringtypes;
      this.eventStatusList = res.eventStatus;
      this.eventPrivacyList = res.eventPrivacy;
      this.inviteeTypeList = res.inviteeType;
      let index = this.matterTypeList.findIndex(v=> v.code == 'CONSULTATION');
      if(index > -1){
        this.consultationId = this.matterTypeList[index].id;
      }
      this.matterTypeList.sort((a, b) => {
        var nameA = a.name.toLowerCase();
        var nameb = b.name.toLowerCase();
        if (nameA < nameb) {
          return -1;
        }
        if (nameA > nameb) {
          return 1;
        }
        return 0;
      });
      if (this.inviteeTypeList && this.inviteeTypeList.length > 0) {
        this.inviteeTypeList.map((obj) => {
          this.inviteeTypeMap[obj.name] = obj.id;
        });
      }
      let statusId = null, eventPrivacy = null;

      if (this.eventStatusList && this.eventStatusList.length > 0) {
        statusId = this.eventStatusList.find(obj => obj.code === 'BUSY').id;
      }
      if (this.eventPrivacyList && this.eventPrivacyList.length > 0) {
        eventPrivacy = this.eventPrivacyList.find(obj => obj.code === 'PUBLIC').id;
      }
      if (this.action === 'add') {
        this.eventForm.patchValue({
          eventStatus: statusId,
          eventPrivacy: eventPrivacy,
        });
      } else {
        this.getEventDetails();
      }
      this.iLoading = false;
    });
  }

  /**
   * Function to gte the current calendar date
   */
  public calendarDate(event: any) {
    this.getalluserEvents(event.startDate, event.endDate);
  }


  public getalluserEvents(start?: any, end?: any) {
    this.calendarEvents = [];
    this.resourceArray.forEach(item => {
      this.getUserEvent(item.id, start, end);
    })
  }


  /***
   *
   * Function to fetch user events
   */
  public getUserEvent(id, startDate?: any, endDate?: any) {
    let curr = new Date; // get current date
    let first = curr.getDate() - curr.getDay();
    let last = first + 6; // last day is the first day + 6
    let lastDay = endDate ? endDate : new Date(curr.setDate(last)).toUTCString();
    let firstDay = startDate ? startDate : new Date(curr.setDate(first)).toUTCString();
    this.calendarService.v1CalendarEventsPersonPersonIdGet$Response({ personId: id, startDate: firstDay, endDate: lastDay }).subscribe(res => {
      if (res) {
        let userEvents = JSON.parse(res.body as any).results;
        if (this.userDetails.id != id) {
          userEvents = userEvents.filter(event => event.status.code !== 'FREE');
        }
        if (userEvents && userEvents.length > 0) {
          userEvents.map((obj) => {
            this.calendarEvents.push({
              start: obj.startDateTime,
              end: obj.endDateTime,
              title: obj.title,
              description: obj.description,
              resourceId: id
            });
          });
        }
      }
    }, err => {

    });
  }


  /***
   *
   * Function to add options for the invitees
   */
  public addOptions(type: string, index: number) {
    switch (type) {
      case 'host':
        if (this.selectedInvite[index].isHost) {
          this.selectedInvite[index].isHost = false;
        } else {
          this.selectedInvite[index].isHost = true;
        }
        this.currentIndex = null;
        break;
      case 'organiser':
        if (this.selectedInvite[index].isOrganiser) {
          this.selectedInvite[index].isOrganiser = false;
        } else {
          this.selectedInvite[index].isOrganiser = true;
        }
        this.currentIndex = null;
        break;
      case 'optional':
        this.selectedInvite[index].isOptional = !this.selectedInvite[index].isOptional;
        this.selectedInvite[index].isRequired = !this.selectedInvite[index].isRequired;
        break;
    }
  }

  /***
   *
   * Function to options popup
   */
  public openMenu(index: number) {
    setTimeout(() => {
      if (this.currentIndex != index) {
        this.currentIndex = index;
      } else {
        this.currentIndex = null
      }
    }, 50)
  }

  /***
   * closed menu on body click
   */
  onClickedOutside(event: any, index: number) {
    if (index == this.currentIndex) this.currentIndex = null;
  }

  /***
   *
   * Function to delete the user from invitee list
   */
  public deleteInvitee(item) {
    this.resourceArray = this.resourceArray.filter(element => element.id != item.id);
    this.calendarEvents = this.calendarEvents.filter(element => element.resourceId != item.id);
    if (item && this.selectedInvite && this.selectedInvite.length > 0) {
      if (item.id > 0) {
        this.selectedInvite = this.selectedInvite.filter((v, i, o) => v.id != item.id);
      }
      if (item.email !== undefined && item.email !== null && item.email !== "") {
        this.selectedInvite = this.selectedInvite.filter((v, i, o) => v.email != item.email);
      }
    }
  }


  /***
   *
   * Function to populate end date on selecting event start date
   */
  public setEndDate(date: any) {
    this.eventForm.patchValue({
      endDate: date
    });
  }

  public changeEndTime(event) {
    let startTime: any =  new Date(this.startTime);
    let endTime: any = new Date(this.endTime);
    let dif = (endTime - startTime);
    dif = Math.round((dif/1000)/60);
    let dt = new Date(event);
    dt.setMinutes( dt.getMinutes() + dif );
    this.endTime = dt;
    this.eventForm.patchValue({
      endTime: this.endTime
    });
  }

  public selectEmpType(event) {
    let search: any = this.searchInvitee.trim().replace(/ +/g, " ");
    if (search) {
      this.isInviteeSearchLoading = true;
      let data = {};
      if (this.employee) {
        data['isEmployee'] = true;
      }
      if (this.client) {
        data['isClient'] = true;
      }
      if (this.associations) {
        data['isAssociations'] = true;
      }
      if (this.potentialClient) {
        data['isPotentialClient'] = true;
      }
      if (this.searchInvitee) {
        data['search'] = search;
      }
      if (this.clientDetails) {
        data['calendarClientId'] = this.clientDetails.id;
      }
      if (!this.employee && !this.client && !this.associations && !this.potentialClient) {
        data['isAll'] = true;
      }
      if (this.inviteeSubscribe) {
        this.inviteeSubscribe.unsubscribe();
      }
      this.inviteeSubscribe = this.miscService.v1MiscInviteesSearchGet$Response(data)
      .subscribe(res => {
        this.inviteeList = JSON.parse(res.body as any).results;
        if (this.searchInvitee) {
          this.inviteeListDisplay = true;
        }
        this.isInviteeSearchLoading = false;
      }, (err) => {
      });
    } else {
      this.isInviteeSearchLoading = false;
      this.inviteeListDisplay = false;
    }
  }


  /***
   *
   * Function to add user in invitee list
   */
  public selectUser(item, Organiser?: boolean) {
    this.inviteeListDisplay = false;
    let existInvitee: boolean = false;
    if (this.resourceArray && this.resourceArray.length > 0) {
      item.colorCode = this.colorMapping[this.resourceArray.length];
    } else {
      item.colorCode = this.colorMapping[0];
    }

    if (item.role && item.role.search('Employee') === -1) {
      item.isExternal = true;
    }
    if (this.selectedInvite.some(element => element.id == item.id)) {
      existInvitee = true;
    }
    if (!item.firstName && !item.lastNAme) {
      const compName = item.companyName ? item.companyName.split(' ') : null;
      const comp = item.company ? item.company.split(' ') : null;
      if (compName && compName.length > 1) {
        item.firstName = compName[0];
        item.lastName = compName[1];
      } else if (comp && comp.length > 1) {
        item.firstName = comp[0];
        item.lastName = comp[1];
      } else {
        item.firstName = (compName && compName[0]) ? compName[0] : (comp && comp[0]) ? comp[0] : null;
        item.companyName = (compName && compName[0]) ? compName[0] : (comp && comp[0]) ? comp[0] : null;
      }
    }
    if (!existInvitee) {
      item.isOptional = false;
      item.isRequired = true;
      item.isHost = false;
      item.isOrganiser = Organiser;
      this.selectedInvite.push(item);
      this.searchInvitee = '';
      this.getUserEvent(item.id);
      this.addResource(item);
    }
  }

  public enterInvitee(event) {
    if (event.keyCode == 13) {
      this.isInvalidEmail = false;
      if (UtilsHelper.validateEmail(this.searchInvitee)) {
        this.selectedInvite.push({ personEmail: this.searchInvitee, email: this.searchInvitee, firstName: null, lastName: null, id: null, role: 'Custom', isExternal: true });
        this.searchInvitee = '';
      } else {
        this.isInvalidEmail = true;
      }
    }
    if (event.keyCode == 38) {
      let invitList = document.getElementsByClassName("result-item");
      if (invitList == null) {
        return;
      }
      let found = false;
      for (var cntup = 0; cntup < invitList.length; cntup++) {
        if (invitList[cntup].className.indexOf("focus") >= 0) {
          found = true;
          if (cntup > 0 && cntup < invitList.length) {
            invitList[cntup].className = invitList[cntup].className.replace(/\b focus\b/g, "");
            invitList[cntup - 1].className = invitList[cntup - 1].className.concat(" focus");
            let evtup = new SlimScrollEvent({
              type: 'scrollTo',
              y: ((cntup - 1) * 58),
              duration: 0,
              easing: 'linear'
            });

            this.scrollEvents.emit(evtup);
          }
          break;
        }
      }
      if (found == false) {
        invitList[0].className = invitList[0].className.concat(" focus");
      }
      event.preventDefault();
    } else if (event.keyCode == 40) {
      let invitList = document.getElementsByClassName("result-item");
      if (invitList == null) {
        return;
      }
      let found = false;
      for (var cntdn = 0; cntdn < invitList.length; cntdn++) {
        if (invitList[cntdn].className.indexOf("focus") >= 0) {
          found = true;
          if (cntdn >= 0 && cntdn < invitList.length - 1) {
            invitList[cntdn].className = invitList[cntdn].className.replace(/\b focus\b/g, "");
            invitList[cntdn + 1].className = invitList[cntdn + 1].className.concat(" focus");
            let evtdn = new SlimScrollEvent({
              type: 'scrollTo',
              y: (cntdn * 58),
              duration: 0,
              easing: 'linear'
            });

            this.scrollEvents.emit(evtdn);
          }
          break;
        }
      }
      if (found == false) {
        invitList[0].className = invitList[0].className.concat(" focus");
      }
      event.preventDefault();
    }
  }

  /***
   *
   * Function to add user as resource for timeline-view
   */
  addResource(obj: any) {
    let bgcolor: string, bordercolor: string;
    let colorCode
    if (this.resourceArray.find(item => item.id === obj.id)) {
      colorCode = this.resourceArray.find(item => item.id === obj.id);
    } else if (obj.colorCode) {
      colorCode = obj
    }
    bordercolor = this.eventColorMap[colorCode.colorCode].bordercolor;
    bgcolor = this.eventColorMap[colorCode.colorCode].bgcolor;
    if (obj) {
      let data = {
        id: obj.id,
        title: (obj.lastName) ? obj.firstName + ' ' + obj.lastName : obj.firstName,
        eventBackgroundColor: bgcolor,
        eventBorderColor: bordercolor
      }
      let resourceExist: boolean = false;
      if (this.resourceArray.some(element => element.id == obj.id)) {
        resourceExist = true;
      }
      if (!resourceExist) {
        this.resourceArray.push(data);
        this.getWorkingHours(data);
      }
    }
  }

  private getWorkingHours(data) {
    this.calendarService.v1CalendarSettingsPersonIdGet({
      personId: data.id
    }).pipe( map(UtilsHelper.mapData),finalize(() => {})
    ).subscribe(res => {
      if (res) {
        this.calendarSettings = res;
        this.createWorkingHoursList(data);
      }
    },(err) => {
    });
  }

  private createWorkingHoursList(data) {
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
        this.workingHoursList.push(obj);
      });
    } else {
      this.workingHoursList = [];
    }

    const index = this.resourceArray.findIndex(x => x.id === data.id);
    if (index > -1) {
      this.resourceArray[index].businessHours = this.workingHoursList;
    }
  }

  disableEventTime(event: any) {
    if (this.eventForm.value.isAllDayEvent) {
      this.eventForm.controls['startTime'].disable();
      this.eventForm.controls['endTime'].disable();
      this.eventForm.controls['afterTravelTimeMinutes'].disable();
      this.eventForm.controls['beforeTravelTimeMinutes'].disable();
      this.eventForm.controls['afterTravelTimeHours'].disable();
      this.eventForm.controls['beforeTravelTimeHours'].disable();
    } else {
      this.eventForm.controls['startTime'].enable();
      this.eventForm.controls['endTime'].enable();
      this.eventForm.controls['afterTravelTimeMinutes'].enable();
      this.eventForm.controls['beforeTravelTimeMinutes'].enable();
      this.eventForm.controls['afterTravelTimeHours'].enable();
      this.eventForm.controls['beforeTravelTimeHours'].enable();
    }
  }

  travelTime() {
    this.selectService.newSelection('clicked!');
  }

  public checkInviteeType(event, type) {
    this.selectService.newSelection('clicked!');
  }

  travelTimeBeforEvent(content) {
    if (this.eventForm.value.beforeTravelTimeHours == 0) {
      this.openPersonalinfo(content, '', '');
    } else {
      this.eventForm.patchValue({afterTravelTimeHours:this.eventForm.value.beforeTravelTimeHours});
    }
    if (!this.eventForm.value.beforeTravelTimeHours) {
      this.hoursArray = [
        { id: 15, name: '15 minutes' },
        { id: 30, name: '30 minutes' },
        { id: 45, name: '45 minutes' },
        { id: 1, name: '1 hour' },
        { id: 1.5, name: '1.5 hours' },
        { id: 2, name: '2 hours' },
        { id: 0, name: 'Custom' },
      ]
      this.hoursArray = [...this.hoursArray];
      this.customeHoursBeforEventForm.reset();
      this.formBeforEvent = false;
      this.travelTimeAfterEvent(null);
    }
  }
  travelTimeAfterEvent(content) {
    if (this.eventForm.value.afterTravelTimeHours == 0) {
      this.openPersonalinfo(content, '', '');
    }
    if (!this.eventForm.value.afterTravelTimeHours) {
      this.hoursArray2 = [
        { id: 15, name: '15 minutes' },
        { id: 30, name: '30 minutes' },
        { id: 45, name: '45 minutes' },
        { id: 1, name: '1 hour' },
        { id: 1.5, name: '1.5 hours' },
        { id: 2, name: '2 hours' },
        { id: 0, name: 'Custom' },
      ]
      this.hoursArray2 = [...this.hoursArray2];
      this.customeHoursAfterEventForm.reset();
      this.formAfterEvent = false;

    }
  }

  saveCustomHoursBeforEvent(CallFromApi: boolean = false) {
    this.formBeforEvent = true;
    if (!this.customeHoursBeforEventForm.valid) {
      return;
    }
    let hours = this.hoursArray.filter(hr => {
      if (hr.id == 0) {
        this.hoursArray[6].id = 0;

        if (parseInt(this.customeHoursBeforEventForm.value.hours) > 0) {
          if (parseInt(this.customeHoursBeforEventForm.value.hours) == 1 && parseInt(this.customeHoursBeforEventForm.value.minutes) == 0) {
            this.eventForm.patchValue({ beforeTravelTimeHours: 1 });
          } else if (parseInt(this.customeHoursBeforEventForm.value.hours) == 1 && parseInt(this.customeHoursBeforEventForm.value.minutes) == 30) {
            this.eventForm.patchValue({ beforeTravelTimeHours: 1.5 });
          } else if (parseInt(this.customeHoursBeforEventForm.value.hours) == 2 && parseInt(this.customeHoursBeforEventForm.value.minutes) == 0) {
            this.eventForm.patchValue({ beforeTravelTimeHours: 2 });
          }  else {
            this.hoursArray[6].name = 'Custom: ' + parseInt(this.customeHoursBeforEventForm.value.hours) + (parseInt(this.customeHoursBeforEventForm.value.hours) > 1 ? ' hours ' : ' hour ') + parseInt(this.customeHoursBeforEventForm.value.minutes) +(parseInt(this.customeHoursBeforEventForm.value.minutes) > 1 ? ' minutes':' minute');
            this.eventForm.patchValue({ beforeTravelTimeHours: 0 });
            this.hoursArray = [...this.hoursArray];
          }
        } else {
          if (parseInt(this.customeHoursBeforEventForm.value.minutes) == 15) {
            this.eventForm.patchValue({ beforeTravelTimeHours: 15 });
          } else if (parseInt(this.customeHoursBeforEventForm.value.minutes) == 30) {
            this.eventForm.patchValue({ beforeTravelTimeHours: 30 });
          } else if (parseInt(this.customeHoursBeforEventForm.value.minutes) == 45) {
            this.eventForm.patchValue({ beforeTravelTimeHours: 45 });
          } else {
            if (parseInt(this.customeHoursBeforEventForm.value.hours) == 0 && parseInt(this.customeHoursBeforEventForm.value.minutes) == 0){
              this.eventForm.patchValue({ beforeTravelTimeHours: null });
            } else {
              this.hoursArray[6].name = 'Custom: ' + parseInt(this.customeHoursBeforEventForm.value.hours) + (parseInt(this.customeHoursBeforEventForm.value.hours) > 1 ? ' hours ' : ' hour ') + parseInt(this.customeHoursBeforEventForm.value.minutes) + (parseInt(this.customeHoursBeforEventForm.value.minutes) > 1 ?' minutes':' minute');
              this.eventForm.patchValue({ beforeTravelTimeHours: 0 });
              this.hoursArray = [...this.hoursArray];
            }
          }
        }
        this.customeHoursAfterEventForm.patchValue({hours:parseInt(this.customeHoursBeforEventForm.value.hours),minutes:parseInt(this.customeHoursBeforEventForm.value.minutes)});
        this.saveCustomHoursAfterEvent();
        return true;
      }
    });
  }
  saveCustomHoursAfterEvent(CallFromApi: any = false) {
    this.formAfterEvent = true;
    if (!this.customeHoursAfterEventForm.valid) {
      return;
    }
    let hours = this.hoursArray2.filter(hr => {
      if (hr.id == 0) {
        this.hoursArray2[6].id = 0;
        if (parseInt(this.customeHoursAfterEventForm.value.hours) > 0) {
          if (parseInt(this.customeHoursAfterEventForm.value.hours) == 1 && parseInt(this.customeHoursAfterEventForm.value.minutes) == 0) {
            this.eventForm.patchValue({ afterTravelTimeHours: 1 });
          } else if (parseInt(this.customeHoursAfterEventForm.value.hours) == 1 && parseInt(this.customeHoursAfterEventForm.value.minutes) == 30) {
            this.eventForm.patchValue({ afterTravelTimeHours: 1.5 });
          } else if (parseInt(this.customeHoursAfterEventForm.value.hours) == 2 && parseInt(this.customeHoursAfterEventForm.value.minutes) == 0) {
            this.eventForm.patchValue({ afterTravelTimeHours: 2 });
          } else {
            this.eventForm.patchValue({ afterTravelTimeHours: 0 });
            this.hoursArray2[6].name = 'Custom: ' + parseInt(this.customeHoursAfterEventForm.value.hours) + (parseInt(this.customeHoursAfterEventForm.value.hours) > 1 ? ' hours ' : ' hour ') + parseInt(this.customeHoursAfterEventForm.value.minutes) + (parseInt(this.customeHoursAfterEventForm.value.minutes) > 1 ?' minutes':' minute');
            this.hoursArray2 = [...this.hoursArray2];
          }
        } else {
          if (parseInt(this.customeHoursAfterEventForm.value.minutes) == 15) {
            this.eventForm.patchValue({ afterTravelTimeHours: 15 });
          } else if (parseInt(this.customeHoursAfterEventForm.value.minutes) == 30) {
            this.eventForm.patchValue({ afterTravelTimeHours: 30 });
          } else if (parseInt(this.customeHoursAfterEventForm.value.minutes) == 45) {
            this.eventForm.patchValue({ afterTravelTimeHours: 45 });
          } else {
            if (parseInt(this.customeHoursAfterEventForm.value.hours) == 0 && parseInt(this.customeHoursAfterEventForm.value.minutes) == 0 ){
              this.eventForm.patchValue({ afterTravelTimeHours: null });
            } else {
              this.hoursArray2[6].name = 'Custom: ' + parseInt(this.customeHoursAfterEventForm.value.hours) + (parseInt(this.customeHoursAfterEventForm.value.hours) > 1 ? ' hours ' : ' hour ') + parseInt(this.customeHoursAfterEventForm.value.minutes) + (parseInt(this.customeHoursAfterEventForm.value.minutes ) > 1 ? ' minutes':' minute');
              this.eventForm.patchValue({ afterTravelTimeHours: 0 });
              this.hoursArray2 = [...this.hoursArray2];
            }
          }
        }
        return true;
      }
    });
  }

  openPersonalinfo(content: any, className, winClass) {
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
      })
      .result.then(
        result => {
        },
        reason => {
        }
      );
  }
  validateBeforHours() {
    let hour = parseInt(this.customeHoursBeforEventForm.value.hours);
    if (hour > 23) {
      this.customeHoursBeforEventForm.patchValue({ hours: '23' })
    }
    if (hour < 0) {
      this.customeHoursBeforEventForm.patchValue({ hours: '0' })
    }
  }
  validateBeforMinutes() {
    let min = parseInt(this.customeHoursBeforEventForm.value.minutes);
    if (min > 59) {
      this.customeHoursBeforEventForm.patchValue({ minutes: '59' })
    }
    if (min < 0) {
      this.customeHoursBeforEventForm.patchValue({ minutes: '0' })
    }
  }
  validateAfterHours() {
    let hour = parseInt(this.customeHoursAfterEventForm.value.hours);
    if (hour > 23) {
      this.customeHoursAfterEventForm.patchValue({ hours: '23' })
    }
    if (hour < 0) {
      this.customeHoursAfterEventForm.patchValue({ hours: '0' })
    }
  }
  validateAfterMinutes() {
    let min = parseInt(this.customeHoursAfterEventForm.value.minutes);
    if (min > 59) {
      this.customeHoursAfterEventForm.patchValue({ minutes: '59' })
    }
    if (min < 0) {
      this.customeHoursAfterEventForm.patchValue({ minutes: '0' })
    }
  }
  addHoursLabelBeforeEvent(value) {
    value = parseInt(value);
    if (value || value == 0) {
      this.customeHoursBeforEventForm.patchValue({ hours: value + (value > 1 ? ' hours':' hour')});
    }
  }
  addMinutesLabelBeforeEvent(value) {
    value = parseInt(value);
    if (value || value == 0) {
      this.customeHoursBeforEventForm.patchValue({ minutes: value + (value > 1 ? ' minutes': ' minute') });
    }
  }
  addHoursLabelAfterEvent(value) {
    value = parseInt(value);
    if (value || value == 0) {
      this.customeHoursAfterEventForm.patchValue({ hours: value + (value > 1 ? ' hours':' hour') });
    }
  }
  addMinutesLabelAfterEvent(value) {
    value = parseInt(value);
    if (value || value == 0) {
      this.customeHoursAfterEventForm.patchValue({ minutes: value + (value > 1 ? ' minutes': ' minute') });
    }
  }
  customSearchFn(term: string, item: any) {
    term = term.toLocaleLowerCase();
    return item.matterNumber.toLocaleLowerCase().indexOf(term) > -1 ||
      item.matterName.toLocaleLowerCase().indexOf(term) > -1;
  }

  changeRecurring(event) {
    if (event) {
      if (event.id === 1) {
        this.eventForm.controls['recurringEndDate'].setValidators([Validators.required]);
        this.eventForm.controls['recurringEventEvery'].clearValidators();
        this.eventForm.controls['repeatEvery'].clearValidators();
        this.eventForm.controls['ends'].clearValidators();

      } else if (event.id === 10) {
        this.eventForm.controls['recurringEventEvery'].setValidators([Validators.required]);
        this.eventForm.controls['repeatEvery'].setValidators([Validators.required]);
        this.eventForm.controls['ends'].setValidators([Validators.required]);
        this.eventForm.controls['ends'].setValue(null);
        // recurring end date validation
        if (this.eventForm.controls['ends'].value === 'on') {
          this.eventForm.controls['recurringEndDate'].setValidators([Validators.required]);
        } else {
          this.eventForm.controls['recurringEndDate'].clearValidators();
        }
      }
    } else {
      this.eventForm.controls['recurringEventEvery'].clearValidators();
      this.eventForm.controls['recurringEndDate'].clearValidators();
      this.eventForm.controls['repeatEvery'].clearValidators();
      this.eventForm.controls['ends'].clearValidators();
    }
    this.eventForm.controls["recurringEndDate"].updateValueAndValidity();
    this.eventForm.controls["recurringEventEvery"].updateValueAndValidity();
    this.eventForm.controls['repeatEvery'].updateValueAndValidity();
    this.eventForm.controls['ends'].updateValueAndValidity();
  }

  changedRecurringEvery(event) {
    if (event) {
      if (event.value !== 'Daily') {
        this.eventForm.controls['daysOfWeek'].setValidators([Validators.required]);
      } else {
        this.eventForm.controls['daysOfWeek'].clearValidators();
      }
    } else {
      this.eventForm.controls['daysOfWeek'].clearValidators();
    }
    this.eventForm.controls["daysOfWeek"].updateValueAndValidity();
  }

  changeEnds(event) {
    if (event) {
      if (event.target.value === 'on') {
        // on
        this.eventForm.controls['recurringEndDate'].setValidators([Validators.required]);
        this.eventForm.controls['numberOfOccurancesEnd'].clearValidators();
      } else {
        // after
        this.eventForm.controls['recurringEndDate'].clearValidators();
        this.eventForm.controls['numberOfOccurancesEnd'].setValidators([Validators.required]);
      }
    } else {
      this.eventForm.controls['numberOfOccurancesEnd'].clearValidators();
      this.eventForm.controls['recurringEndDate'].clearValidators();
    }
    this.eventForm.controls["recurringEndDate"].updateValueAndValidity();
    this.eventForm.controls["numberOfOccurancesEnd"].updateValueAndValidity();
  }

  public checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57 || k == 8 || k == 9);
  }

  public removeRecuringEvent() {
    this.eventForm.controls['recurringType'].setValue(null);
    this.changeRecurring(null);
    this.changedRecurringEvery(null);
    this.changeEnds(null);
  }

   /***
   *
   * Function to save recurring event options
   */

  public saveRecuringEvent() {
    this.submitted = true;
    this.tempDisableValidation();

    if (!this.eventForm.valid) {
      return;
    }

    let selectedRecuring = this.recurringEventArr.find(item => item.value === this.eventForm.controls['recurringEventEvery'].value)
    let day: string = this.eventForm.controls['recurringEventEvery'].value;
    if (selectedRecuring) {
      day = selectedRecuring.name;
    }
    let recDays = '';
    if (this.eventForm.value.daysOfWeek && this.eventForm.value.daysOfWeek.length > 0 && this.eventForm.value.recurringEventEvery !== 'Daily') {
      this.eventForm.value.daysOfWeek.map((item, index) => {
        recDays = (index === 0) ? ' on ' + this.dayofweekArray[item].name : recDays + "," + this.dayofweekArray[item].name;
      });
    }
    let exist = this.recurringTypesList.findIndex(item => item.id === this.recurVal);
    if (exist > -1) {
      this.recurringTypesList[exist].name = "Custom: Repeat Every " + this.eventForm.controls['repeatEvery'].value + ' ' + day + recDays;// + day.name
    } else {
      this.recurringTypesList = [...this.recurringTypesList, { id: this.recurVal, name: "Custom: Repeat Every " + this.eventForm.controls['repeatEvery'].value + ' ' + day + recDays }];// + day.name
    }
    this.recurringTypesList = [...this.recurringTypesList];
    this.eventForm.controls['recurringType'].setValue(this.recurVal);
    this.tempEnableValidation();
  }


  tempDisableValidation() {
    this.eventForm.controls['title'].clearValidators();
    this.eventForm.controls['eventType'].clearValidators();
    this.eventForm.controls['startDate'].clearValidators();
    this.eventForm.controls['startTime'].clearValidators();
    this.eventForm.controls['endTime'].clearValidators();
    this.eventForm.controls['endDate'].clearValidators();

    this.eventForm.controls['title'].updateValueAndValidity();
    this.eventForm.controls['eventType'].updateValueAndValidity();
    this.eventForm.controls['startDate'].updateValueAndValidity();
    this.eventForm.controls['startTime'].updateValueAndValidity();
    this.eventForm.controls['endTime'].updateValueAndValidity();
    this.eventForm.controls['endDate'].updateValueAndValidity();
  }

  tempEnableValidation() {
    this.eventForm.controls['title'].setValidators([Validators.required]);
    this.eventForm.controls['eventType'].setValidators([Validators.required]);
    this.eventForm.controls['startDate'].setValidators([Validators.required]);
    this.eventForm.controls['startTime'].setValidators([Validators.required]);
    this.eventForm.controls['endTime'].setValidators([Validators.required]);
    this.eventForm.controls['endDate'].setValidators([Validators.required]);

    this.eventForm.controls['title'].updateValueAndValidity();
    this.eventForm.controls['eventType'].updateValueAndValidity();
    this.eventForm.controls['startDate'].updateValueAndValidity();
    this.eventForm.controls['startTime'].updateValueAndValidity();
    this.eventForm.controls['endTime'].updateValueAndValidity();
    this.eventForm.controls['endDate'].updateValueAndValidity();
  }

  /***
   *
   * Function to remove recurring event options
   */
  public removeOption() {
    this.eventForm.controls['daysOfWeek'].setValue(null);
    this.eventForm.controls['recurringEventEvery'].setValue(null);
    this.eventForm.controls['repeatEvery'].setValue(null);
    this.eventForm.controls['recurringEndDate'].setValue(null);
    this.eventForm.controls['numberOfOccurancesEnd'].setValue(null);

    this.changeRecurring(null);
    this.changedRecurringEvery(null);
    this.changeEnds(null);

    let customValue = this.recurringTypesList.find(item => item.id === 100);
    if (customValue) {
      this.recurringTypesList.pop();
    }
    this.recurringTypesList = [...this.recurringTypesList];
    this.dayofweekArray.forEach(item => (item.checked = false));
    this.daysselected = [];
    this.selectedDaysOfWeek = [];
  }

  clrFilterdays() {
    this.daysselected = [];
    this.selectedDaysOfWeek = [];
    this.eventForm.patchValue({
      daysOfWeek: null
    });
    this.dayofweekArray.forEach(item => (item.checked = false));
  }


  /**
   *
   * @param event
   * Function to get the selected days of week
   */
  public getDaySelected(index: number) {
    this.dayofweekArray[index].checked = !this.dayofweekArray[index].checked;
    let selectedDays = this.dayofweekArray.filter(item => item.checked);
    if (selectedDays) {
      this.daysselected = selectedDays.map((v, i, o) => v.id);
      this.eventForm.patchValue({
        daysOfWeek: this.daysselected
      });
    }
  }

  /***
   *
   * Function to get event details
   */
  getEventDetails() {

    if (this.eventDetails) {

      this.eventForm.patchValue({
        title: this.eventDetails.title,
        eventType: this.eventDetails.eventType.id,
        startDate: moment(this.eventDetails.startDateTime).format('YYYY-MM-DD') + 'T00:00:00',
        startTime: new Date(this.eventDetails.startDateTime),
        endTime: new Date(this.eventDetails.endDateTime),
        endDate: new Date(this.eventDetails.endDateTime),
        eventLocation: (this.eventDetails.eventLocation) ? this.eventDetails.eventLocation : '',
        eventStatus: (this.eventDetails.status) ? this.eventDetails.status.id : null,
        eventPrivacy: (this.eventDetails.privacy) ? this.eventDetails.privacy.id : null,
        description: (this.eventDetails.description) ? this.eventDetails.description : '',
        isAllDayEvent: this.eventDetails.isAllDayEvent,
      });

      this.customeHoursBeforEventForm.patchValue({ hours: this.eventDetails.beforeTravelTimeHours, minutes: this.eventDetails.beforeTravelTimeMinutes });
      this.saveCustomHoursBeforEvent(true);
      this.customeHoursAfterEventForm.patchValue({ hours: this.eventDetails.afterTravelTimeHours, minutes: this.eventDetails.afterTravelTimeMinutes });
      this.saveCustomHoursAfterEvent(true);

      if (this.eventDetails.recurringEvent) {
        if (this.eventDetails.recurringEvent.recurringType) {
          this.eventForm.controls['recurringType'].setValue(this.eventDetails.recurringEvent.recurringType);
        }
        if (this.eventDetails.recurringEvent.recurringEndDate) {
          this.eventForm.controls['ends'].setValue('on');
          this.eventForm.controls['recurringEndDate'].setValue(new Date(this.eventDetails.recurringEvent.recurringEndDate));
        }
        if (this.eventDetails.recurringEvent.daysOfWeek && this.eventDetails.recurringEvent.daysOfWeek.length > 0) {
          this.daysselected = this.eventDetails.recurringEvent.daysOfWeek;
          this.eventForm.controls['daysOfWeek'].setValue(this.eventDetails.recurringEvent.daysOfWeek);
          if (this.daysselected && this.daysselected.length > 0) {
            this.daysselected.map((obj) => {
              this.dayofweekArray[obj].checked = true;
            });
          }
        }
        if (this.eventDetails.recurringEvent.numberOfOccurancesEnd) {
          this.eventForm.controls['ends'].setValue('after');
          this.eventForm.controls['numberOfOccurancesEnd'].setValue(this.eventDetails.recurringEvent.numberOfOccurancesEnd);
        }
        if (this.eventDetails.recurringEvent.recurringEveryNumber) {
          this.eventForm.controls['repeatEvery'].setValue(this.eventDetails.recurringEvent.recurringEveryNumber);
        }
        if (this.eventDetails.recurringEvent.recurringEveryUnit) {
          this.eventForm.controls['recurringEventEvery'].setValue(this.eventDetails.recurringEvent.recurringEveryUnit);
        }
      }

      this.eventDetails.invitees.forEach(element => {
        if (element /*&& element.person*/) {
          let data: any = {};
          if (element.person) {
            data = Object.assign(element.person);
          }
          data.personEmail = element.personEmail;
          data.acceptStatus = element.acceptStatus;
          // data.inviteeType = element.inviteeType;
          data.isOrganiser = (!element.isOrganiser) ? false : element.isOrganiser;
          data.isHost = (!element.isHost) ? false : element.isHost;
          data.isRequired = (!element.isRequired) ? true : element.isRequired;
          data.isOptional = (!element.isOptional) ? false : element.isOoptional;
          data.doNotSchedule = (!element.doNotSchedule) ? false : element.doNotSchedule;
          data.doNotContact = (!element.doNotContact) ? false : element.doNotContact;
          data.inviteeId = (!element.id) ? 0 : element.id;
          let existInvitee: boolean = false;
          if (this.selectedInvite.some(item => item.inviteeId == element.id)) {
            existInvitee = true;
          }
          if (!existInvitee) {
            if (element.person) {
              if (this.resourceArray && this.resourceArray.length > 0) {
                element.person.colorCode = this.colorMapping[this.resourceArray.length];
              } else {
                element.person.colorCode = this.colorMapping[0];
              }
              this.addResource(element.person);
              this.getUserEvent(element.person.id);
            }
            this.selectedInvite.push(data);
          }
        }
      });
    }
  }

  get addCssEditor(){
    return $('.tox-edit-area__iframe').contents().find('.mce-content-body').css({
      'font-size':'14px',
       'color': '#5D6A86'
   });
  }

  searchOffice(text) {
    const searchString = text.trim()
    if (searchString && searchString.length > 2) {
      this.officeSearchResultsLoading = true;
      this.officeService.v1OfficeSearchGet({search: searchString}).subscribe((result: any) => {
        this.officeSearchResults = JSON.parse(result).results
        this.showOfficeSearchResults = true;
        this.officeSearchResultsLoading = false;
      })
    }
  }

  selectOffice(office) {
    let location = office.officeName;
    if (office.address1) {
      location += ', ' + office.address1;
    }
    if (office.address2) {
      location += ', ' + office.address2;
    }
    if (office.city) {
      location += ', ' + office.city;
    }
    if (office.state) {
      location += ', ' + office.state;
    }
    if (office.zipCode) {
      location += ' ' + office.zipCode;
    }
    this.eventForm.patchValue({
      eventLocation: location
    })
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
