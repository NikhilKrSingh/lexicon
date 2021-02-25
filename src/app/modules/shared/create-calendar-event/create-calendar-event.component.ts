import { DatePipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGrigPlugin from '@fullcalendar/timegrid';
import { ModalDismissReasons, NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { forkJoin, Subscription } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { EventFormError } from 'src/app/modules/models/fillable-form.model';
import * as Constant from 'src/app/modules/shared/const';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { CommonService } from 'src/app/service/common.service';
import { PostPaymentService } from 'src/app/service/post-payment.service';
import { SelectService } from 'src/app/service/select.service';
import { vwCalendarSettings, vwClient, vwMatterBasics } from 'src/common/swagger-providers/models';
import {
  CalendarService,
  ClientService,
  ContactsService,
  MatterService,
  MiscService,
  OfficeService, PersonService
} from 'src/common/swagger-providers/services';
import { IEventType, IPRofile } from '../../models';
import { getWorkingHour, WORKING_DAYS } from '../../models/office-data';
import { vwClientExtended } from '../../models/vw-client-extended';
import { DialogService } from '../dialog.service';
import * as errorData from '../../shared/error.json';
import { nearestFutureMinutes, UtilsHelper } from '../utils.helper';
import { vwInvitee } from '../../models/vw-invitee.model';

@Component({
  selector: 'app-create-calendar-event',
  templateUrl: './create-calendar-event.component.html',
  styleUrls: ['./create-calendar-event.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CreateCalendarEventComponent implements OnInit, OnDestroy {
  @ViewChild('recurringDataUpdate', {static: false}) recurringDataUpdate: TemplateRef<any>;
  public calendarSettings: vwCalendarSettings;
  public workingHoursList: Array<any> = [];
  public scrollbarOptions = { axis: 'y', theme: 'dark-3' };
  @Input() type: string;
  @Input() eventId: any;
  @Input() isEditMode: boolean;
  @Input() potentialClientId: number;
  @Input() clientConversionId: number;
  @Input() MatterId: number;
  @Input() attorneyDetails: any;
  @Input() potentialClientDetails: any;
  @Output() readonly refresh = new EventEmitter<boolean>();
  @Output() afterSave = new EventEmitter<boolean>();
  closeResult: any;
  @Input() selectedStartTime: any;
  @Input() selectedEndTime: any;
  proposals: any = [];
  isLongEvent: boolean;
  private acceptedProposalId: any;
  timezoneList: any;
  selectedTimezone: any;
  loggedInUserCalendarSettings: any;
  isInviteeSearchLoading = false;
  officeSearchBoxFocused = false;
  officeSubscribe: Subscription;
  openMenuClientSearchActive: boolean = false;
  consultationId: number;
  eventLoading: boolean;

  constructor(
    private modalService: NgbModal,
    public commonService: CommonService,
    private builder: FormBuilder,
    private activeModal: NgbActiveModal,
    private matterService: MatterService,
    private miscService: MiscService,
    private officeService: OfficeService,
    private toastDisplay: ToastDisplay,
    private calendarService: CalendarService,
    private router: Router,
    private dialogService: DialogService,
    private postPaymentService: PostPaymentService,
    private clientService: ClientService,
    private route: ActivatedRoute,
    private contactsService: ContactsService,
    private selectService: SelectService,
    private pagetitle: Title,
    private datePipe: DatePipe,
    private personService: PersonService
  ) {
    this.minDate.setHours(0, 0, 0, 0);
    if (!this.isEditMode) {
      this.isEditMode = false;
    }
    this.userDetails = JSON.parse(localStorage.getItem('profile'));
    this.eventFormError = new EventFormError();
  }

  mytab: string[] = ['Invitee'];
  selecttabs = this.mytab[0];

  myfirsttab: string[] = ['Event Details', 'Find a Time'];
  selectftabs = this.myfirsttab[0];
  public isClientRequired: boolean = false;
  public isAnyClientRequired: boolean = false;
  public dateTime: Date;
  public startTime: Date;
  public endTime: Date;
  public userDetails: IPRofile;
  public matterTypeList: Array<IEventType>;
  public eventStatusList: Array<any>;
  public eventPrivacyList: Array<any>;
  public minDate = new Date();
  public inviteeTypeList: Array<any>;
  public daysselected: Array<any> = [];
  public inviteeTypeMap = {};
  public recurringTypesList: Array<{ id: number, name: string }>;
  public eventForm: FormGroup = this.builder.group({
    title: new FormControl(null, [Validators.required, PreventInject]),
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
    ends: new FormControl('on'),
    recurringEndDate: new FormControl(),
    recurringEvent: new FormControl(),
    numberOfOccurancesEnd: new FormControl(),
  });
  public customeHoursBeforEventForm: FormGroup = this.builder.group({
    hours: new FormControl(null, [Validators.required]),
    minutes: new FormControl(null, [Validators.required]),
  });
  public customeHoursAfterEventForm: FormGroup = this.builder.group({
    hours: new FormControl(null, [Validators.required]),
    minutes: new FormControl(null, [Validators.required]),
  });
  public recurringEventArr: Array<{ name: string, value: string }> = [{value: 'Daily', name: 'Days'}, {
    value: 'Week',
    name: 'Weeks'
  }, {value: 'Month', name: 'Months'}, {value: 'Years', name: 'Years'}];
  public recurringDaysArr: Array<{ name: string, value: number }> = UtilsHelper.getDayslistn();
  public selectedFilterValue: any = '0';
  public clientTypeArr = {'0': 'All', '1': 'Client', '2': 'Potential Client'};
  public clientList: Array<vwClientExtended> = [];
  public inviteeList: Array<vwInvitee> = [];
  public matterList: Array<vwMatterBasics> = [];
  private clientSubscribe: Subscription;
  private inviteeSubscribe: Subscription;
  public opts: ISlimScrollOptions;
  public scrollEvents: EventEmitter<SlimScrollEvent>;
  public showSearchResults: boolean = false;
  public showOfficeSearchResults: boolean = false;
  public selectedClient: vwClient;
  public clientData: any;
  public officeSearchResults: any = []
  public officeSearchResultsLoading = false
  public selctedClentName: string;
  public eventLocation: string;
  public eventPrivacy: number;
  public eventStatus: number;
  public description: string;
  public clientMatter: number;
  public filedata: Array<File> = [];
  public eventDetails: any;
  public hoursArray: Array<{ id: number; name: string }> = [];
  public hoursArray2: Array<{ id: number; name: string }> = [];
  public minutesArray: Array<{ id: number; name: string }> = [];
  public dayofweekArray: Array<any> = [];
  public selectedDaysOfWeek: Array<any> = [];
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
      editor.on('focus', () => {
        this.onLocationKeyPress();
      });
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

  public employee: boolean = false;
  public client: boolean = false;
  public potentialClient: boolean = false;
  public associations: boolean = false;
  public inviteeListDisplay: boolean = false;
  public searchInvitee: string;
  public errorData: any = (errorData as any).default;
  public selectedInvite: Array<any> = [];
  public options: any;
  public calendarEvents: EventInput[] = [];
  public calendarPlugins = [dayGridPlugin, timeGrigPlugin, interactionPlugin];
  private callFlag: boolean = true;
  public canEditClient: boolean = false;
  public canEditMatter: boolean = false;
  public currentIndex: number = null;
  public inviteeType: string;
  public resourceArray: Array<any> = [];
  public colorsArray: Array<string> = [
    'F44436', 'EA1E63', '9C27B0', '673AB7', '1d7220', '2096F3',
    '05A9F4', '02BCD4', '009688', '4CAF50', '8BC34A', 'CDDC39',
    'FFEB3B', 'FFC108', 'FF9800', 'FF5821'
  ];

  public eventColorMap = {
    453599: {bordercolor: '#453599', bgcolor: '#C7CCEF'},
    F44436: {bordercolor: '#F44436', bgcolor: '#FBC6C2'},
    EA1E63: {bordercolor: '#EA1E63', bgcolor: '#F8BBD0'},
    '9C27B0': {bordercolor: '#9C27B0', bgcolor: '#E1BEE7'},
    '673AB7': {bordercolor: '#673AB7', bgcolor: '#D1C3E9'},
    '1d7220': {bordercolor: '#1d7220', bgcolor: '#8be18e'},
    '2096F3': {bordercolor: '#2096F3', bgcolor: '#BCDFFB'},
    '05A9F4': {bordercolor: '#05A9F4', bgcolor: '#B4E5FB'},
    '02BCD4': {bordercolor: '#02BCD4', bgcolor: '#B3EAF2'},
    '009688': {bordercolor: '#009688', bgcolor: '#B2DFDB'},
    '4CAF50': {bordercolor: '#4CAF50', bgcolor: '#C9E7CA'},
    '8BC34A': {bordercolor: '#8BC34A', bgcolor: '#DCEDC8'},
    CDDC39: {bordercolor: '#CDDC39', bgcolor: '#F0F4C3'},
    FFEB3B: {bordercolor: '#FFEB3B', bgcolor: '#FFF9C4'},
    FFC108: {bordercolor: '#FFC108', bgcolor: '#FFECB4'},
    FF9800: {bordercolor: '#FF9800', bgcolor: '#FFE0B2'},
    FF5821: {bordercolor: '#FF5821', bgcolor: '#FFCCBC'},
  };
  public recurVal: number = 100;
  public isPotentialClientEvent: boolean = false;
  public searchLoading: boolean;
  public matterListLoading = false;
  public saveLoading: boolean;
  public clientSelectedType: any;
  public isInvalidEmail: Boolean = false;
  public submitted: Boolean = false;
  public formBeforEvent: Boolean = false;
  public formAfterEvent: Boolean = false;
  public isSearchLoading = false;
  eventFormError: EventFormError;
  timeZoneEnum = {
    'Hawaiian Standard Time': 'HT',
    'Pacific Standard Time': 'PT',
    'Mountain Standard Time': 'MT',
    'Central Standard Time': 'CT',
    'Eastern Standard Time': 'ET',
    'Alaskan Standard Time': 'AT',
  };

  eventTimeString;

  @HostListener('document:click', ['$event']) documentClick(event: MouseEvent) {
    if (event.target['id'] === 'office-search-result' || $(event.target).parents('#office-no-result').length) {
      this.officeSearchBoxFocused = true;
    } else {
      this.officeSearchBoxFocused = false;
      this.showOfficeSearchResults = false;
    }
  }

  ngOnInit() {
    if (this.isEditMode) {
      this.pagetitle.setTitle("Edit Calendar Event");
    } else {
      this.pagetitle.setTitle("Create Calendar Event");
    }
    const date = new Date();
    this.calendarMonthYear.month = date.getMonth() + 1;
    this.calendarMonthYear.year = date.getFullYear();

    if (this.potentialClientId) {
      this.isPotentialClientEvent = true;
    }

    if (this.clientConversionId && this.MatterId) {
      this.getmatterDetails(this.clientConversionId, this.MatterId);
      this.getclientDetails(this.clientConversionId);
    }

    if (this.route.snapshot.queryParams["matterId"] != undefined) {
      this.MatterId = +this.route.snapshot.queryParams["matterId"];
    }

    if (this.MatterId && !this.clientConversionId) {
      this.getmatterDetails(null, this.MatterId);
    }

    this.recurringDaysArr.map(item => {
      let obj = {name: item.name, id: +item.value, checked: false};
      this.dayofweekArray.push(obj);
    });

    this.dateTime = new Date();

    if (!this.isEditMode && this.selectedStartTime) {
      var dates = new Date(this.selectedStartTime);
      var startTime = dates.getTime();
      var endTime = dates.getTime() + (30 * 60 * 1000);
      this.eventForm.patchValue({
        startDate: moment(this.selectedStartTime).format('YYYY-MM-DD') + 'T00:00:00',
        endDate: this.selectedStartTime,
        startTime: startTime,
        endTime: endTime
      });
    } else {
      let now = moment();
      this.startTime = nearestFutureMinutes(30, now).toDate();
      this.endTime = new Date(this.startTime.getTime() + 30 * 60000);
      this.eventForm.patchValue({
        startDate: moment(this.dateTime).format('YYYY-MM-DD') + 'T00:00:00',
        endDate: this.dateTime,
        startTime: this.startTime,
        endTime: this.endTime
      });
    }

    this.getList();
    if (!this.isEditMode) {
      this.userDetails.role = (this.userDetails.role) ? this.userDetails.role : 'Employee';
      this.personService.v1PersonPhotoPersonIdGet({personId: this.userDetails.id}).subscribe((result: any) => {
        this.userDetails['personPhoto'] = JSON.parse(result).results;
        this.selectUser(this.userDetails, true);
      })
    }
    this.getLoggedInUserTimezone();
    this.counter();
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

    if (this.attorneyDetails) {
      this.selectUser(this.attorneyDetails);
    }

    if (this.route.snapshot.queryParams["start"] != undefined) {
      this.dateTime = new Date(this.route.snapshot.queryParams["start"]);
      this.eventForm.patchValue({
        startDate: moment(this.dateTime).format('YYYY-MM-DD') + 'T00:00:00'
      });
      this.startTime = new Date(this.route.snapshot.queryParams["start"]);
    }

    if (this.route.snapshot.queryParams["end"] != undefined) {
      this.setEndDate(new Date(this.route.snapshot.queryParams["end"]));
      this.endTime = new Date(this.route.snapshot.queryParams["end"]);
    }

    this.eventForm.controls.startDate.valueChanges.subscribe((data) => {
      const startTime = new Date(data)
      startTime.setHours(this.startTime.getHours());
      startTime.setMinutes(this.startTime.getMinutes());
      this.startTime = startTime;
    });

    this.eventForm.controls.endDate.valueChanges.subscribe((data) => {
      const endTime = new Date(data)
      endTime.setHours(this.endTime.getHours());
      endTime.setMinutes(this.endTime.getMinutes());
      this.endTime = endTime;
    })
  }

  get f() {
    return this.eventForm.controls;
  }

  get fBeforEvent() {
    return this.customeHoursBeforEventForm.controls
  }

  get fAfterEvent() {
    return this.customeHoursAfterEventForm.controls
  }

  changeRecurring(event) {
    if (event) {
      if (event.id === 1) {
        this.eventForm.controls['recurringEndDate'].setValidators([Validators.required]);
        this.eventForm.controls['recurringEventEvery'].clearValidators();
        this.eventForm.controls['repeatEvery'].clearValidators();

      } else if (event.id === 10) {
        this.eventForm.controls['recurringEventEvery'].setValidators([Validators.required]);
        this.eventForm.controls['repeatEvery'].setValidators([Validators.required]);

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
    }
    this.eventForm.controls["recurringEndDate"].updateValueAndValidity();
    this.eventForm.controls["recurringEventEvery"].updateValueAndValidity();
    this.eventForm.controls['repeatEvery'].updateValueAndValidity();
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

  ngOnDestroy() {
    if (this.clientSubscribe) {
      this.clientSubscribe.unsubscribe();
    }
    if (this.inviteeSubscribe) {
      this.inviteeSubscribe.unsubscribe();
    }
  }

  /**
   * Get matter event type, event recurring type
   *
   * @private
   * @memberof CreateEventComponent
   */
  private getList() {
    this.saveLoading = true;
    forkJoin([
      this.matterService.v1MatterEventsTypesListGet$Response({}),
      this.matterService.v1MatterEventsRecurringtypesListGet$Response({}),
      this.matterService.v1MatterEventsStatusesListGet$Response({}),
      this.matterService.v1MatterEventsPrivacyListGet$Response({}),
      this.matterService.v1MatterEventsInviteetypesListGet$Response({})
    ]).pipe(
      map(res => {
        return {
          matterTypes: JSON.parse(res[0].body as any).results,
          recurringtypes: JSON.parse(res[1].body as any).results,
          eventStatus: JSON.parse(res[2].body as any).results,
          eventPrivacy: JSON.parse(res[3].body as any).results,
          inviteeType: JSON.parse(res[4].body as any).results
        };
      }),
      finalize(() => {
        if (this.isEditMode) {
          this.getEventDetails();
        } else {
        }
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
      if (this.eventStatusList && this.eventStatusList.length > 0) {
        this.eventStatus = this.eventStatusList.find(obj => obj.code === 'BUSY').id;
      }
      if (this.eventPrivacyList && this.eventPrivacyList.length > 0) {
        this.eventPrivacy = this.eventPrivacyList.find(obj => obj.code === 'PUBLIC').id;
      }
      this.saveLoading = false;
    }, () => {
      this.saveLoading = false;
    });
  }

  /**
   *
   * Function to remove title of the event
   */
  public removeTilte() {
    this.eventForm.controls['title'].setValue('');
  }

  public selectType(type) {
    this.clientSelectedType = type;
    if (type == '2') {
      this.clientMatter = null;
    }
    if (this.isClientRequired && (type === '0' || type === '2')) {
      return;
    }
    this.selectedFilterValue = type
    if (this.selctedClentName && this.selctedClentName.length > 0 && !this.isEditMode) {
      this.searchClients(this.selctedClentName);
    }
  }

  public searchClients(search) {
    this.isSearchLoading = true;

    if (!search) {
      this.clientList = [];
      this.selectedClient = null;
      this.isSearchLoading = false;
      return;

    }
    let data = {
      searchType: this.selectedFilterValue
    }
    if (search) {
      data['search'] = search;
    }
    if (this.clientSubscribe) {
      this.clientSubscribe.unsubscribe();
    }
    this.showSearchResults = true;
    this.clientSubscribe = this.miscService.v1MiscClientsSearchGet$Response(data).subscribe(res => {
      this.clientList = JSON.parse(res.body as any).results;
      if (this.clientList) {
        this.clientList.map((item) => {
          item['view'] = false;
          item['name'] = (item.companyName) ? item.companyName : item.lastName + ", " + item.firstName;
          item['phoneNumber'] = (item.phones && item.phones.length) ? item.phones[0].number : "";
          item['uniqueNumber'] = item && item.uniqueNumber ? item.uniqueNumber : null;
        })
      }
      this.showSearchResults = true;
      this.isSearchLoading = false;
    }, (err) => {
      this.clientList = [];
      this.isSearchLoading = false;
    });
  }

  /**
   *
   * Function to create hours/minutes array
   */
  public counter() {
    this.hoursArray = [
      {id: 15, name: '15 minutes'},
      {id: 30, name: '30 minutes'},
      {id: 45, name: '45 minutes'},
      {id: 1, name: '1 hour'},
      {id: 1.5, name: '1.5 hours'},
      {id: 2, name: '2 hours'},
      {id: 0, name: 'Custom'},
    ]
    this.hoursArray = [...this.hoursArray];
    this.hoursArray2 = [
      {id: 15, name: '15 minutes'},
      {id: 30, name: '30 minutes'},
      {id: 45, name: '45 minutes'},
      {id: 1, name: '1 hour'},
      {id: 1.5, name: '1.5 hours'},
      {id: 2, name: '2 hours'},
      {id: 0, name: 'Custom'},
    ]
  }

  public selectLocation(item: any) {
    this.eventLocation = item.consultationLawOffice.name;
  }

  public selectEventType(item: any) {
    if (this.matterTypeList && this.matterTypeList.length) {
      this.eventForm.controls.eventType.setValue(this.matterTypeList.filter((v, i, o) => v.code == 'CONSULTATION')[0].id);
    }
  }

  public selectClient(item: any, type?: string) {
    this.selectedClient = item;
    this.clientData = item;
    this.selctedClentName = (item.firstName && item.lastName && item.firstName != '' && item.lastName != '') ? `${item.firstName} ${item.lastName}` : item.companyName ? item.companyName : item.company;
    this.showSearchResults = false;
    if (type && type == 'search') {
      const inviteeIds = [];
      this.selectedInvite.map(obj => {
        if (obj.id !== this.userDetails.id && !obj.isOrganiser && !obj.isHost && obj.id) {
          inviteeIds.push(obj.id);
        }
      });
      // if (inviteeIds && inviteeIds.length > 0) {
      //   this.calendarService.v1CalendarInviteesVerifyPost$Json({
      //     body: {
      //       clientId: item.id,
      //       matterEventId: this.eventId,
      //       invitees: inviteeIds
      //     }
      //   })
      //     .pipe(map(UtilsHelper.mapData))
      //     .subscribe(res => {
      //       if (res && res.invitees && res.invitees.length > 0) {
      //         let associatedIds = [];
      //         res.invitees.map((item) => {
      //           if (item.isAssociatedWithClient) {
      //             associatedIds.push(item.inviteePersonId);
      //           }
      //         });
      //         this.selectedInvite = this.selectedInvite.filter(guest => (guest.id === this.userDetails.id || guest.isOrganiser || guest.isHost || associatedIds.indexOf(guest.id) > -1));
      //       } else {
      //         this.selectedInvite = this.selectedInvite.filter(guest => (guest.id === this.userDetails.id || guest.isOrganiser || guest.isHost));
      //       }
      //     }, () => {
      //     });
      // } else {
      //   this.selectedInvite = this.selectedInvite.filter(guest => (guest.id === this.userDetails.id || guest.isOrganiser || guest.isHost));
      // }
    }
    if (item.role == 'Potential Client') {
      this.clientMatter = null;
    }
    this.getClientMatters();
  }

  getProposalTimeStringGuest() {
    for(const data of this.selectedInvite) {
      if(data.proposedEvent) {
        data['getProposalTimeString'] = this.getProposalTimeString(data.proposedEvent);
      }
    }
  }

  public getClientMatters() {
    this.saveLoading = true;
    this.matterService.v1MatterClientClientIdGet$Response({clientId: this.selectedClient.id}).subscribe(res => {
      this.matterList = JSON.parse(res.body as any).results;
      this.saveLoading = false;
    }, (err) => {
      this.saveLoading = false;
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
      if (this.selectedClient) {
        data['calendarClientId'] = this.selectedClient.id;
      } else {
        data['calendarClientId'] = 0;
      }
      if (!this.employee && !this.client && !this.associations && !this.potentialClient) {
        data['isAll'] = true;
      }
      if (this.inviteeSubscribe) {
        this.inviteeSubscribe.unsubscribe();
      }
      this.inviteeSubscribe = this.miscService.v1MiscInviteesSearchGet$Response(data).subscribe(res => {
        this.inviteeList = JSON.parse(res.body as any).results;
        if (this.searchInvitee) {
          this.inviteeListDisplay = true;
        }
        this.isInviteeSearchLoading = false;
      }, (err) => {
      });
    } else {
      this.inviteeListDisplay = false;
      this.isInviteeSearchLoading = false;
    }

  }


  /***
   *
   * Function to add user in invitee list
   */
  public selectUser(item, Organiser?: boolean) {
    this.inviteeListDisplay = false;
    let existInvitee: boolean = false;
    if (item.role && item.role.search('Employee') === -1) {
      item.isExternal = true;
    }
    if (this.selectedInvite.some(element => element.id == item.id)) {
      existInvitee = true;
    }
    item.checked = true;
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
        if (this.selectedInvite.some(item => item.email === this.searchInvitee)) {
          this.searchInvitee = '';
          return;
        }
        this.selectedInvite.push({
          personEmail: this.searchInvitee,
          email: this.searchInvitee,
          firstName: null,
          lastName: null,
          id: null,
          role: 'Custom',
          isExternal: true
        });
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

  /*** closed menu on body click */
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
   * Function to fetch user events
   */
  public getUserEvent(id, startDate?: any, endDate?: any) {
    let curr = new Date; // get current date
    let first = curr.getDate() - curr.getDay();
    let last = first + 6; // last day is the first day + 6
    let lastDay = endDate ? endDate : new Date(curr.setDate(last)).toUTCString();
    let firstDay = startDate ? startDate : new Date(curr.setDate(first)).toUTCString();
    this.eventLoading = true;
    this.calendarService.v1CalendarEventsPersonPersonIdGet$Response({
      personId: id,
      startDate: firstDay,
      endDate: lastDay
    }).subscribe(res => {
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
      setTimeout(() => {
        this.calendarEvents = [...this.calendarEvents]
      }, 200)
      this.eventLoading = false;
    }, err => {

    });
  }

  setDateTime(event) {
    let now = moment(event);
    this.startTime = nearestFutureMinutes(30, now).toDate();
    this.endTime = new Date(this.startTime.getTime() + 30 * 60000);
    this.eventForm.patchValue({
      startDate: moment(this.startTime).format('YYYY-MM-DD') + 'T00:00:00',
      endDate: this.endTime,
      startTime: this.startTime,
      endTime: this.endTime
    });
  }

  public checkInviteeType(event, type) {
    this.selectService.newSelection('clicked!');
  }

  isRecurrenceUpdated() {
    return this.eventForm.controls.recurringType.dirty ||
      this.eventForm.controls.recurringEndDate.dirty ||
      this.eventForm.controls.repeatEvery.dirty ||
      this.eventForm.controls.recurringEventEvery.dirty ||
      this.eventForm.controls.daysOfWeek.dirty;
  }
  /***
   *
   *
   * Function to create the event
   */
  public createEvent(event_type?: string) {
    this.submitted = true;
    this.tempEnableValidation();
    if (!this.eventForm.valid || (!this.selectedClient && (this.isClientRequired || this.isAnyClientRequired))) {
      return;
    }
    this.selectService.newSelection('remove data');
    this.saveLoading = true;
    const data = {...this.eventForm.value};
    data.eventType = {id: data.eventType};
    if (this.acceptedProposalId) {
      data.eventProposedTimeId = this.acceptedProposalId;
      data.isDeleteAllProposal = true;
    }
    if (!data.isAllDayEvent) {
      if (data.startDate && data.startTime) {
        data.startDateTime = moment(data.startDate).format('YYYY-MM-DD') + 'T' + moment(data.startTime).format('HH:mm:ss');
      }
      if (data.endDate && data.endTime) {
        data.endDateTime = moment(data.endDate).format('YYYY-MM-DD') + 'T' + moment(data.endTime).format('HH:mm:ss');
      }
    } else {
      data.startDateTime =  moment(data.startDate).format('YYYY-MM-DD') + 'T' + '00:00:00';
      data.endDateTime =  moment(data.endDate).format('YYYY-MM-DD') + 'T' + '00:00:00';
    }
    data.startDateTime = moment(data.startDateTime + this.selectedTimezone).utc().format('YYYY-MM-DD[T]HH:mm:ss');
    data.endDateTime = moment(data.endDateTime + this.selectedTimezone).utc().format('YYYY-MM-DD[T]HH:mm:ss');
    if (data.recurringType) {
      let id = 0;
      if (this.eventDetails && this.eventDetails.recurringEvent) {
        id = this.eventDetails.recurringEvent.id;
      }
      if (data.recurringType === 1) {
        const dailyRecurrenceCount = (moment(new Date(data.recurringEndDate)).diff(moment(new Date(data.startDate)), 'days')) + 1;
        data['recurringEvent'] = {
          recurringEndDate: moment(data.recurringEndDate).format(Constant.SharedConstant.DateFormat) + Constant.SharedConstant.TimeFormat,
          recurringType: data.recurringType,
          recurringEveryNumber: 1,
          dailyRecurrenceCount,
          id
        };
      } else {
        data['recurringEvent'] = {
          recurringEndDate: (!data.numberOfOccurancesEnd) ? moment(data.recurringEndDate).format(Constant.SharedConstant.DateFormat) + Constant.SharedConstant.TimeFormat : null,
          recurringType: 10,
          id,
          daysOfWeek: this.daysselected,
          numberOfOccurancesEnd: +data.numberOfOccurancesEnd,
          recurringEveryNumber: +data.repeatEvery,
          recurringEveryUnit: data.recurringEventEvery
        };
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

    data.beforeTravelTimeHours = (data.beforeTravelTimeHours) ? data.beforeTravelTimeHours : 0;
    data.beforeTravelTimeMinutes = (data.beforeTravelTimeMinutes) ? data.beforeTravelTimeMinutes : 0;
    data.afterTravelTimeHours = (data.afterTravelTimeHours) ? data.afterTravelTimeHours : 0;
    data.afterTravelTimeMinutes = (data.afterTravelTimeMinutes) ? data.afterTravelTimeMinutes : 0;
    if (data.beforeTravelTimeHours && data.beforeTravelTimeMinutes) {
      data['beforeTravelTimeHours'] = parseInt(data.beforeTravelTimeHours);
      data['beforeTravelTimeMinutes'] = parseInt(data.beforeTravelTimeMinutes);
    }
    if (data.afterTravelTimeHours && data.afterTravelTimeMinutes) {
      data['afterTravelTimeHours'] = parseInt(data.afterTravelTimeHours);
      data['afterTravelTimeMinutes'] = parseInt(data.afterTravelTimeMinutes);
    }
    if (this.selectedClient) {
      data['client'] = {id: this.selectedClient.id};
    }
    if (this.clientMatter) {
      data['matter'] = {id: this.clientMatter};
    }
    if (this.clientData && this.clientData.role == 'Potential Client') {
      data['matter'] = {id: this.matterList[0].id};
    }
    if (this.eventLocation) {
      data['eventLocation'] = this.eventLocation;
    }
    if (this.eventStatus) {
      data['status'] = {id: this.eventStatus};
    }
    if (this.eventPrivacy) {
      data['privacy'] = {id: this.eventPrivacy};
    }
    if (this.description) {
      data['description'] = this.description;
    }
    if (this.potentialClientDetails && this.potentialClientDetails.clientId == data.client.id && this.potentialClientDetails.generateTaskBuilderTasks && this.matterList.some(obj => obj.id == this.potentialClientDetails.matterId)) {
      data['matter'] = {id: this.potentialClientDetails.matterId};
    }
    if (this.selectedInvite && this.selectedInvite.length > 0) {
      data['invitees'] = [];
      const inviteeArr = [];
      this.selectedInvite.map((obj) => {
        let invitee: any = {};
        if (obj.id) {
          invitee = {
            person: {id: obj.id, email: obj.email, firstName: obj.firstName, lastName: obj.lastName},
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
            person: {id: 0, email: obj.personEmail, firstName: obj.personEmail, lastName: obj.personEmail},
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
      data['invitees'] = inviteeArr;
      if (this.isEditMode) {
        data.id = this.eventId;
      }
    }
    delete data.startDate;
    delete data.startTime;
    delete data.endDate;
    delete data.endTime;
    delete data.recurringType;
    delete data.recurringEndDate;
    delete data.ends;
    delete data.repeatEvery;
    delete data.recurringEventEvery;
    delete data.daysOfWeek;
    delete data.numberOfOccurancesEnd;
    const isDateChanged = this.eventForm.controls.startDate.dirty || this.eventForm.controls.endDate.dirty || this.eventForm.controls.startTime.dirty || this.eventForm.controls.endTime.dirty;
    if (this.isEditMode && isDateChanged) {
      data.isDeleteAllProposal = isDateChanged;
    }
    if (this.callFlag) {
      this.callFlag = false;
      let url: any;
      if (event_type != 'update') {
        url = this.matterService.v1MatterEventsPost$Json$Response({body: data});
      } else {
        url = this.matterService.v1MatterEventsPut$Json$Response({body: data});
      }
      if (this.isEditMode && this.eventDetails.recurringEvent) {
        if (this.isRecurrenceUpdated()) {
          data.upcommingReccuringEventsTypeId = 2;
          this.completeApiCall(url, event_type, data);
        } else {
          const modalRef = this.modalService.open(this.recurringDataUpdate, {
            windowClass: 'modal-md',
            backdrop: 'static',
            centered: true
          });
          modalRef.result.then((recurringType) => {
            data.upcommingReccuringEventsTypeId = recurringType;
            this.completeApiCall(url, event_type, data);
          }, () => {
            this.callFlag = true;
            this.saveLoading = false;
          });
        }
      } else {
        this.completeApiCall(url, event_type, data);
      }
    }

  }

  completeApiCall(url, event_type, data) {
    url.subscribe(suc => {
      this.callFlag = true;
      let res = JSON.parse(suc.body as any).results;
      if (event_type != 'update') {
        if (this.clientConversionId && res && res.length > 0) {
          let existEventIds = UtilsHelper.getObject('conversationEventIds');
          let eventIds = [...res];
          if (existEventIds && existEventIds.length > 0) {
            eventIds = res.concat(existEventIds);
          }
          UtilsHelper.setObject('conversationEventIds', eventIds);
        }
        if (this.potentialClientId) {
          let contactDetails = UtilsHelper.getObject('contactDetails');
          if (contactDetails) {
            contactDetails['eventDetails'] = res;
            UtilsHelper.setObject('contactDetails', contactDetails);
          }
        }
        if (res && res.length > 0 && this.filedata && this.filedata.length > 0) {
          res.map(obj => {
            this.filedata.map(item => {
              if (this.description.search(item.name) > -1) {
                let formdata = new FormData();
                formdata.append('file', item);
                this.postPaymentService.v1EventFilePost(formdata, obj).subscribe(res1 => {
                });
              }
            });
          });
        }
      } else {
        if (this.filedata && this.filedata.length > 0 && res && res > 0) {
          this.filedata.map(item => {
            if (this.description.search(item.name) > -1) {
              let formdata = new FormData();
              formdata.append('file', item);
              this.postPaymentService.v1EventFilePost(formdata, res).subscribe(res1 => {
              });
            }
          });
        }
      }
      if (res && this.selectedClient) {
        this.contactsService.v1ContactsPut$Json$Response({
          body: {
            id: this.selectedClient.id,
            consultation: {initialConsultDate: data.startDateTime}
          }
        }).subscribe(res1 => {});
      }

      if (this.type == 'calendar') {
        this.afterSave.emit(true);
        if (data.recurringEvent && this.isEditMode) {
          const waitingTime = data.recurringEvent.dailyRecurrenceCount ? 500 * data.recurringEvent.dailyRecurrenceCount : 200;
          setTimeout(() => {
            if (event_type != 'update') {
              this.toastDisplay.showSuccess(this.errorData.create_event_success);
            } else {
              this.toastDisplay.showSuccess(this.errorData.edit_event_success);
            }
            this.router.navigate(['/calendar']);
          }, waitingTime);
        } else {
          if (event_type != 'update') {
            this.toastDisplay.showSuccess(this.errorData.create_event_success);
          } else {
            this.toastDisplay.showSuccess(this.errorData.edit_event_success);
          }
          this.router.navigate(['/calendar']);
        }
      } else {
        if (event_type != 'update') {
          this.toastDisplay.showSuccess(this.errorData.create_event_success);
        } else {
          this.toastDisplay.showSuccess(this.errorData.edit_event_success);
        }
        this.refresh.emit(true);
        this.saveLoading = false;
      }
      this.close();
    }, err => {
      this.callFlag = true;
      this.saveLoading = false;
    });
  }

  /***
   *
   * Function to close Edit/Create modal
   */
  close() {
    this.activeModal.close(null);
    this.changeRecurring(null);
    this.changedRecurringEvery(null);
    this.changeEnds(null);
    this.submitted = false;
  }


  /***
   *
   * Function to add options for the invitees
   */
  public addOptions(type: string, index: number) {
    switch (type) {
      case 'host':
        this.selectedInvite[index].isHost = !this.selectedInvite[index].isHost;
        this.currentIndex = null;
        break;
      case 'organiser':
        this.selectedInvite[index].isOrganiser = !this.selectedInvite[index].isOrganiser;
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
   * Function to get event details
   */
  getEventDetails() {
    this.saveLoading = true;
    this.calendarService.v1CalendarEventsProposedtimeListGet({eventId: this.eventId}).subscribe((data: any) => {
      this.proposals = JSON.parse(data).results;
      for(const data of this.proposals) {
        data['proposalTimeString'] = this.getProposalTimeString(data);
      }
      this.calendarService.v1CalendarEventsMatterEventIdGet({matterEventId: this.eventId}).subscribe(
        res => {
          res = JSON.parse(res as any).results;
          this.eventDetails = res;
          this.eventTimeString = this.getProposalTimeString(this.eventDetails);
          this.isLongEvent = (moment(new Date(this.eventDetails.endDateTime)).diff(moment(new Date(this.eventDetails.startDateTime)), 'days')) > 0;
          if (this.eventDetails.client) {
            this.selectClient(this.eventDetails.client);
            this.canEditClient = true;
          }
          if (this.eventDetails.matter) {
            this.clientMatter = this.eventDetails.matter.id;
            this.canEditMatter = true;
          }
          this.eventForm.patchValue({
            title: this.eventDetails.title,
            eventType: this.eventDetails.eventType.id,
            startDate: moment(this.eventDetails.startDateTime).format('YYYY-MM-DD') + 'T00:00:00',
            startTime: new Date(this.eventDetails.startDateTime),
            endTime: new Date(this.eventDetails.endDateTime),
            endDate: new Date(this.eventDetails.endDateTime),
            isAllDayEvent: this.eventDetails.isAllDayEvent,
          });
          this.customeHoursBeforEventForm.setValue({
            hours: this.eventDetails.beforeTravelTimeHours,
            minutes: this.eventDetails.beforeTravelTimeMinutes
          });
          this.saveCustomHoursBeforEvent(true);
          this.customeHoursAfterEventForm.setValue({
            hours: this.eventDetails.afterTravelTimeHours,
            minutes: this.eventDetails.afterTravelTimeMinutes
          });
          this.saveCustomHoursAfterEvent(true);

          this.setFieldsRequired(null, true);
          if (this.eventDetails.recurringEvent) {
            if (this.eventDetails.recurringEvent.recurringType) {
              this.eventForm.controls['recurringType'].setValue(this.eventDetails.recurringEvent.recurringType);
            }
            if (this.eventDetails.recurringEvent.recurringEndDate) {
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
              this.eventForm.controls['numberOfOccurancesEnd'].setValue(this.eventDetails.recurringEvent.numberOfOccurancesEnd);
            }
            if (this.eventDetails.recurringEvent.recurringEveryNumber) {
              this.eventForm.controls['repeatEvery'].setValue(this.eventDetails.recurringEvent.recurringEveryNumber);
            }
            if (this.eventDetails.recurringEvent.recurringEveryUnit) {
              this.eventForm.controls['recurringEventEvery'].setValue(this.eventDetails.recurringEvent.recurringEveryUnit);
            }
          }
          this.eventLocation = (this.eventDetails.eventLocation) ? this.eventDetails.eventLocation : '';
          this.eventStatus = (this.eventDetails.status) ? this.eventDetails.status.id : null;
          this.eventPrivacy = (this.eventDetails.privacy) ? this.eventDetails.privacy.id : null;
          this.description = (this.eventDetails.description) ? this.eventDetails.description : '';

          this.eventDetails.invitees.forEach(element => {
            if (element) {
              let data: any = {};
              if (element.person) {
                data = Object.assign(element.person);
              }
              const proposedEventIndex = this.proposals.findIndex(proposal => proposal.personId === element.person.id);
              if (proposedEventIndex > -1) {
                data.proposedEvent = this.proposals[proposedEventIndex];
              } else {
                data.proposedEvent = null;
              }
              data.personEmail = element.personEmail;
              data.acceptStatus = element.acceptStatus;
              data.inviteeType = element.inviteeType;
              data.isOrganiser = (!element.isOrganiser) ? false : element.isOrganiser;
              data.isHost = (!element.isHost) ? false : element.isHost;
              data.isRequired = (!element.isRequired) ? true : element.isRequired;
              data.isOptional = (element.isOptional) ? true : false;
              data.doNotSchedule = (!element.doNotSchedule) ? false : element.doNotSchedule;
              data.doNotContact = (!element.doNotContact) ? false : element.doNotContact;
              data.inviteeId = (!element.id) ? 0 : element.id;
              data['checked'] = true;
              data['isExternal'] = (element && element.personEmail) ? true : false;
              let existInvitee = false;
              if (this.selectedInvite.some(item => item.inviteeId == element.id)) {
                existInvitee = true;
              }
              if (!existInvitee) {
                if (element.person) {
                  this.addResource(element.person);
                  this.getUserEvent(element.person.id);
                }
                const len = this.inviteeList.length;
                data.eventBorderColor = this.eventColorMap[this.colorsArray[len]].bordercolor;
                data.eventBackgroundColor = this.eventColorMap[this.colorsArray[len]].bgcolor;
                data.eventTextColor = this.eventColorMap[this.colorsArray[len]].bordercolor;
                if (data.id === this.userDetails.id) {
                  if (data.isHost || data.isOrganiser) {
                    this.inviteeType = 'hostorganiser';
                  } else {
                    this.inviteeType = 'invitee';
                    this.canEditClient = true;
                    this.canEditMatter = true;
                  }
                }
                this.selectedInvite.push(data);
              }
            }
            setTimeout(() => {
              this.inviteeList.forEach(invitee => {
                this.mangeColorOnCheckbox(invitee.id, invitee['eventBorderColor']);
              });
            }, 10);
            this.saveLoading = false;
          });
        }, err => {
          console.log(err);
          this.saveLoading = false;
        }
      );
    });
  }

  /***
   *
   * Function to add user as resource for timeline-view
   */
  addResource(obj: any) {
    let bgcolor: string;
    let bordercolor: string;
    const len = this.resourceArray.length;
    bordercolor = this.eventColorMap[this.colorsArray[len]].bordercolor;
    bgcolor = this.eventColorMap[this.colorsArray[len]].bgcolor;
    if (obj) {
      let data = {
        id: obj.id,
        email: obj.email,
        personPhoto: obj.personPhoto,
        title: (obj.lastName) ? obj.firstName + ' ' + obj.lastName : obj.firstName,
        eventBackgroundColor: bgcolor,
        eventBorderColor: bordercolor,
        eventTextColor: bordercolor
      };
      let resourceExist = false;
      if (this.resourceArray.some(element => element.id == obj.id)) {
        resourceExist = true;
      }
      if (!resourceExist) {
        this.resourceArray.push(data);
        this.getWorkingHours(data);
      }
      this.resourceArray = [...this.resourceArray];
      this.mangeColorOnCheckbox(data.id, data.eventBorderColor);
    }
  }

  getLoggedInUserTimezone() {
    this.calendarService
      .v1CalendarSettingsPersonIdGet({
        personId: this.userDetails.id
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {})
      )
      .subscribe(
        res => {
          if (res) {
            this.loggedInUserCalendarSettings = res;
            this.getTimeZone();
          }
        },
        () => {
        }
      );
  }

  private getWorkingHours(data) {
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
            this.createWorkingHoursList(data);
          }
        },
        () => {
        }
      );
  }

  getTimeZone() {
    this.miscService.v1MiscTimezonesGet({}).subscribe((result: any) => {
      this.timezoneList = JSON.parse(result).results;
      const timeZoneDetail = this.timezoneList.filter(obj => obj.id == this.loggedInUserCalendarSettings.timeZoneId);
      const tZ = timeZoneDetail[0];
      const officeTimeZoneDetails = tZ.name.substr(4,6);
      const reg = new RegExp(/^[+:\d-]+$/);
      const timeZone = officeTimeZoneDetails.split(':');
      this.selectedTimezone = (reg.test(officeTimeZoneDetails) && timeZone.length > 1 ) ? timeZone.join('') : '+00:00';
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

  /***
   *
   * Function to delete the event
   */
  public deleteEvent(): void {
    this.matterService
      .v1MatterEventsDelete$Response({
        matterEventId: this.eventId,
        isEventCancelled: false
      })
      .subscribe((result: {}) => {
        const res: any = result;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes && parsedRes.results > 0) {
            if (this.type == 'calendar') {
              this.router.navigate(['/calendar']);
            } else {
              this.close();
            }
          } else {
            this.toastDisplay.showError(this.errorData.server_error);
          }
        } else {
          this.toastDisplay.showError(this.errorData.server_error);
        }
      }, err => {
      });
  }

  /**** function to remove event */
  async removeEvent(): Promise<any> {
    try {
      const resp: any = await this.dialogService.confirm(this.errorData.delete_event, 'Delete');
      if (resp) {
        this.deleteEvent();
      }
    } catch (err) {
    }
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
      this.recurringTypesList = [...this.recurringTypesList, {
        id: this.recurVal,
        name: "Custom: Repeat Every " + this.eventForm.controls['repeatEvery'].value + ' ' + day + recDays
      }];// + day.name
    }
    this.recurringTypesList = [...this.recurringTypesList];
    this.eventForm.controls['recurringType'].setValue(this.recurVal);
    this.tempEnableValidation();
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

  /***
   *
   * Function to populate end date on selecting event start date
   */
  public setEndDate(date: any) {
    this.eventForm.patchValue({
      endDate: date
    });
    this.selectService.newSelection('clicked!');
  }

  public changeEndTime(event) {
    let startTime: any = moment(this.startTime);
    let endTime: any = moment(this.endTime);
    let diff = endTime.diff(startTime, 'minutes');
    var dt = moment(event).add(diff, 'minutes').toDate();
    this.endTime = dt;
    this.startTime = event;
    this.eventForm.patchValue({
      endDate: dt,
      endTime: dt,
      startDate: event
    });
  }

  /***
   *
   * Function to setClient/portential field required
   */
  public setFieldsRequired(event?: any, flag?: boolean) {
    if (event) {
      this.isClientRequired = (event.code === 'COURT_MEETING');
      this.isAnyClientRequired = (event.code === 'CONSULTATION' || event.code === 'APPOINTMENT');
    }
    if (!event && flag) {
      const eventId = this.eventForm.value.eventType;
      const eventTypes = this.matterTypeList.filter(item => item.id === eventId);
      this.isClientRequired = (eventTypes[0].code === 'COURT_MEETING');
      this.isAnyClientRequired = (eventTypes[0].code === 'CONSULTATION' || eventTypes[0].code === 'APPOINTMENT');
    }

    if (!event && !flag) {
      this.isAnyClientRequired = false;
      this.isAnyClientRequired = false;
    }

    if (this.isClientRequired) {
      this.selectedFilterValue = '1';
    } else {
      this.selectedFilterValue = '0';
    }
    this.selectService.newSelection('clicked!');
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
      this.eventForm.controls.daysOfWeek.markAsDirty();
    }

  }

  onMultiSelectSelectedOptions(event) {
  }

  clrFilterdays() {
    this.daysselected = [];
    this.selectedDaysOfWeek = [];
    this.eventForm.patchValue({
      daysOfWeek: null
    });
    this.dayofweekArray.forEach(item => (item.checked = false));
  }

  applyFilter(event: any) {
  }


  /**
   *
   * @param id
   * Function to get the potential client details
   */
  public getclientDetails(id: number) {
    this.clientService
      .v1ClientClientIdGet({clientId: id}).subscribe((res: any) => {
      const detail = JSON.parse(res).results;
      this.addResource(detail);
      this.setType(detail);
      this.selectClient(detail);
      this.selectEventType(detail);
      this.selectLocation(detail);
      if (this.isPotentialClientEvent) {
        this.setEventDate(detail);
      }
    }, err => {
      console.log(err);
    });
  }

  private setType(detail) {
    if (this.potentialClientId) {
      detail.role = 'Potential Client';
    }

    if (this.clientConversionId) {
      detail.role = 'Client';
    }
  }

  /**
   *
   * @param id
   * @param mId
   * Function to gte the client details
   */
  public getmatterDetails(id: number, mId: number) {
    this.matterService
      .v1MatterMatterIdGet({
        matterId: mId
      }).subscribe((res: any) => {
      const matterDetail = JSON.parse(res).results;
      if (matterDetail.clientName && !this.clientConversionId) {
        this.addResource(matterDetail.clientName);
        this.selectUser(matterDetail.clientName);
        this.selectClient(matterDetail.clientName);
      }
      this.clientMatter = matterDetail.id;
      if (matterDetail.responsibleAttorney.length) {
        matterDetail.responsibleAttorney.forEach(element => {
          this.selectUser(element);
          this.addResource(element);
        });
      }
    }, err => {
      console.log(err);
    })
  }

  /**
   *
   * Function to gte the current calendar date
   */
  public calendarDate(event: any) {
    this.getalluserEvents(event.startDate, event.endDate);
  }

  public getalluserEvents(start?: any, end?: any) {
    this.calendarEvents = [];
    this.resourceArray.forEach(item => {
      this.getUserEvent(item.id, start, end);
    });
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

  setEventDate(obj: any) {
    if (obj.initialConsultDate) {
      this.eventForm.patchValue({
        startDate: moment(obj.initialConsultDate).format('YYYY-MM-DD') + 'T00:00:00',
        endDate: new Date(obj.initialConsultDate)
      });
    }
  }

  travelTime() {
    this.selectService.newSelection('clicked!');
  }

  travelTimeBeforEvent(content) {
    if (this.eventForm.value.beforeTravelTimeHours == 0) {
      this.openPersonalinfo(content, '', '');
    } else {
      this.eventForm.patchValue({afterTravelTimeHours: this.eventForm.value.beforeTravelTimeHours});
    }
    if (!this.eventForm.value.beforeTravelTimeHours) {
      this.hoursArray = [
        {id: 15, name: '15 minutes'},
        {id: 30, name: '30 minutes'},
        {id: 45, name: '45 minutes'},
        {id: 1, name: '1 hour'},
        {id: 1.5, name: '1.5 hours'},
        {id: 2, name: '2 hours'},
        {id: 0, name: 'Custom'},
      ]
      this.hoursArray = [...this.hoursArray];
      this.customeHoursBeforEventForm.reset();
      this.formBeforEvent = false;
      this.travelTimeAfterEvent(null);
    }
  }

  travelTimeAfterEvent(content) {
    if (this.eventForm.value.afterTravelTimeHours == 0) {
      if (content) {
        this.openPersonalinfo(content, '', '');
      }
    }
    if (!this.eventForm.value.afterTravelTimeHours) {
      this.hoursArray2 = [
        {id: 15, name: '15 minutes'},
        {id: 30, name: '30 minutes'},
        {id: 45, name: '45 minutes'},
        {id: 1, name: '1 hour'},
        {id: 1.5, name: '1.5 hours'},
        {id: 2, name: '2 hours'},
        {id: 0, name: 'Custom'},
      ]
      this.hoursArray2 = [...this.hoursArray2];
      this.customeHoursAfterEventForm.reset();
      this.formAfterEvent = false;

    }
  }

  saveCustomHoursBeforEvent(CallFromApi: any = false) {
    this.formBeforEvent = true;
    if (!this.customeHoursBeforEventForm.valid) {
      return;
    }
    let hours = this.hoursArray.filter(hr => {
      if (hr.id == 0) {
        this.hoursArray[6].id = 0;

        if (parseInt(this.customeHoursBeforEventForm.value.hours) > 0) {
          if (parseInt(this.customeHoursBeforEventForm.value.hours) == 1 && parseInt(this.customeHoursBeforEventForm.value.minutes) == 0) {
            this.eventForm.patchValue({beforeTravelTimeHours: 1});
          } else if (parseInt(this.customeHoursBeforEventForm.value.hours) == 1 && parseInt(this.customeHoursBeforEventForm.value.minutes) == 30) {
            this.eventForm.patchValue({beforeTravelTimeHours: 1.5});
          } else if (parseInt(this.customeHoursBeforEventForm.value.hours) == 2 && parseInt(this.customeHoursBeforEventForm.value.minutes) == 0) {
            this.eventForm.patchValue({beforeTravelTimeHours: 2});
          } else {
            this.hoursArray[6].name = 'Custom: ' + parseInt(this.customeHoursBeforEventForm.value.hours) + (parseInt(this.customeHoursBeforEventForm.value.hours) > 1 ? ' hours ' : ' hour ') + parseInt(this.customeHoursBeforEventForm.value.minutes) + (parseInt(this.customeHoursBeforEventForm.value.minutes) > 1 ? ' minutes' : ' minute');
            this.eventForm.patchValue({beforeTravelTimeHours: 0});
            this.hoursArray = [...this.hoursArray];
          }
        } else {
          if (parseInt(this.customeHoursBeforEventForm.value.minutes) == 15) {
            this.eventForm.patchValue({beforeTravelTimeHours: 15});
          } else if (parseInt(this.customeHoursBeforEventForm.value.minutes) == 30) {
            this.eventForm.patchValue({beforeTravelTimeHours: 30});
          } else if (parseInt(this.customeHoursBeforEventForm.value.minutes) == 45) {
            this.eventForm.patchValue({beforeTravelTimeHours: 45});
          } else {
            if (parseInt(this.customeHoursBeforEventForm.value.hours) == 0 && parseInt(this.customeHoursBeforEventForm.value.minutes) == 0) {
              this.eventForm.patchValue({beforeTravelTimeHours: null});
            } else {
              this.hoursArray[6].name = 'Custom: ' + parseInt(this.customeHoursBeforEventForm.value.hours) + (parseInt(this.customeHoursBeforEventForm.value.hours) > 1 ? ' hours ' : ' hour ') + parseInt(this.customeHoursBeforEventForm.value.minutes) + (parseInt(this.customeHoursBeforEventForm.value.minutes) > 1 ? ' minutes' : ' minute');
              this.eventForm.patchValue({beforeTravelTimeHours: 0});
              this.hoursArray = [...this.hoursArray];
            }
          }
        }
        this.customeHoursAfterEventForm.patchValue({
          hours: parseInt(this.customeHoursBeforEventForm.value.hours),
          minutes: parseInt(this.customeHoursBeforEventForm.value.minutes)
        });
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
            this.eventForm.patchValue({afterTravelTimeHours: 1});
          } else if (parseInt(this.customeHoursAfterEventForm.value.hours) == 1 && parseInt(this.customeHoursAfterEventForm.value.minutes) == 30) {
            this.eventForm.patchValue({afterTravelTimeHours: 1.5});
          } else if (parseInt(this.customeHoursAfterEventForm.value.hours) == 2 && parseInt(this.customeHoursAfterEventForm.value.minutes) == 0) {
            this.eventForm.patchValue({afterTravelTimeHours: 2});
          } else {
            this.eventForm.patchValue({afterTravelTimeHours: 0});
            this.hoursArray2[6].name = 'Custom: ' + parseInt(this.customeHoursAfterEventForm.value.hours) + (parseInt(this.customeHoursAfterEventForm.value.hours) > 1 ? ' hours ' : ' hour ') + parseInt(this.customeHoursAfterEventForm.value.minutes) + (parseInt(this.customeHoursAfterEventForm.value.minutes) > 1 ? ' minutes' : ' minute');
            this.hoursArray2 = [...this.hoursArray2];
          }

        } else {
          if (parseInt(this.customeHoursAfterEventForm.value.minutes) == 15) {
            this.eventForm.patchValue({afterTravelTimeHours: 15});
          } else if (parseInt(this.customeHoursAfterEventForm.value.minutes) == 30) {
            this.eventForm.patchValue({afterTravelTimeHours: 30});
          } else if (parseInt(this.customeHoursAfterEventForm.value.minutes) == 45) {
            this.eventForm.patchValue({afterTravelTimeHours: 45});
          } else {
            if (parseInt(this.customeHoursAfterEventForm.value.hours) == 0 && parseInt(this.customeHoursAfterEventForm.value.minutes) == 0) {
              this.eventForm.patchValue({afterTravelTimeHours: null});
            } else {
              this.hoursArray2[6].name = 'Custom: ' + parseInt(this.customeHoursAfterEventForm.value.hours) + (parseInt(this.customeHoursAfterEventForm.value.hours) > 1 ? ' hours ' : ' hour ') + parseInt(this.customeHoursAfterEventForm.value.minutes) + (parseInt(this.customeHoursAfterEventForm.value.minutes) > 1 ? ' minutes' : ' minute');
              this.eventForm.patchValue({afterTravelTimeHours: 0});
              this.hoursArray2 = [...this.hoursArray2];
            }
          }

        }
        return true;
      }
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  openPersonalinfo(content: any, className, winClass) {
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        backdrop: 'static',
        centered: true
      })
      .result.then(
      result => {
        this.closeResult = `Closed with: ${result}`;
      },
      reason => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  validateBeforHours() {
    let hour = parseInt(this.customeHoursBeforEventForm.value.hours);
    if (hour > 23) {
      this.customeHoursBeforEventForm.patchValue({hours: '23'})
    }
    if (hour < 0) {
      this.customeHoursBeforEventForm.patchValue({hours: '0'})
    }
  }

  validateBeforMinutes() {
    let min = parseInt(this.customeHoursBeforEventForm.value.minutes);
    if (min > 59) {
      this.customeHoursBeforEventForm.patchValue({minutes: '59'})
    }
    if (min < 0) {
      this.customeHoursBeforEventForm.patchValue({minutes: '0'})
    }
  }

  validateAfterHours() {
    let hour = parseInt(this.customeHoursAfterEventForm.value.hours);
    if (hour > 23) {
      this.customeHoursAfterEventForm.patchValue({hours: '23'})
    }
    if (hour < 0) {
      this.customeHoursAfterEventForm.patchValue({hours: '0'})
    }
  }

  validateAfterMinutes() {
    let min = parseInt(this.customeHoursAfterEventForm.value.minutes);
    if (min > 59) {
      this.customeHoursAfterEventForm.patchValue({minutes: '59'})
    }
    if (min < 0) {
      this.customeHoursAfterEventForm.patchValue({minutes: '0'})
    }
  }

  addHoursLabelBeforeEvent(value) {
    value = parseInt(value);
    if (value || value == 0) {
      this.customeHoursBeforEventForm.patchValue({hours: value + (value > 1 ? ' hours' : ' hour')});
    }
  }

  addMinutesLabelBeforeEvent(value) {
    value = parseInt(value);
    if (value || value == 0) {
      this.customeHoursBeforEventForm.patchValue({minutes: value + (value > 1 ? ' minutes' : ' minute')});
    }
  }

  addHoursLabelAfterEvent(value) {
    value = parseInt(value);
    if (value || value == 0) {
      this.customeHoursAfterEventForm.patchValue({hours: value + (value > 1 ? ' hours' : ' hour')});
    }
  }

  addMinutesLabelAfterEvent(value) {
    value = parseInt(value);
    if (value || value == 0) {
      this.customeHoursAfterEventForm.patchValue({minutes: value + (value > 1 ? ' minutes' : ' minute')});
    }
  }

  customSearchFn(term: string, item: any) {
    term = term.toLocaleLowerCase();
    return item.matterNumber.toLocaleLowerCase().indexOf(term) > -1 ||
      item.matterName.toLocaleLowerCase().indexOf(term) > -1;
  }

  get addCssEditor() {
    $('.tox-edit-area__iframe').contents().find('.mce-content-body').css({
      'font-size': '14px',
      'color': '#5D6A86'
    });
    return;
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

  acceptProposal(proposal) {
    this.eventForm.patchValue({
      startDate: moment(proposal.startDateTime).format('YYYY-MM-DD') + 'T00:00:00',
      endDate: moment(proposal.endDateTime).format('YYYY-MM-DD') + 'T00:00:00',
    });
    this.startTime = new Date(proposal.startDateTime);
    this.endTime = new Date(proposal.endDateTime);
    this.acceptedProposalId = proposal.id;
    this.proposals = [];
    const relatedInviteeIndex = this.selectedInvite.findIndex(invitee => invitee['proposedEvent'] &&  invitee['proposedEvent'].id === proposal.id);
    this.selectedInvite[relatedInviteeIndex]['proposedEvent'].isAccepted = true;
    this.selectedInvite.forEach(invitee => {
      invitee.proposedEvent = invitee.proposedEvent && invitee.proposedEvent.isAccepted ? invitee.proposedEvent : null;
    });
    this.eventForm.controls.startDate.markAsDirty();
    this.eventForm.controls.endDate.markAsDirty();
  }

  deleteProposal(deletedProposal) {
    this.dialogService.confirm(this.errorData.delete_proposal, 'Delete').then(() => {
      this.saveLoading = true;
      this.calendarService.v1CalendarEventsProposedtimeIdDelete({id: deletedProposal.id}).subscribe(() => {
        this.toastDisplay.showSuccess('Proposal deleted.');
        const deletedProposalIndex = this.proposals.findIndex((proposal) => proposal.id === deletedProposal.id);
        if (deletedProposalIndex > -1) {
          this.proposals.splice(deletedProposalIndex, 1);
        }
        const relatedInviteeIndex = this.selectedInvite.findIndex(invitee => invitee['proposedEvent'] && invitee['proposedEvent'].id === deletedProposal.id);
        this.selectedInvite[relatedInviteeIndex]['proposedEvent'] = null;
        this.saveLoading = false;
      }, () => {
        this.saveLoading = false;
      });
    });
  }

  mangeColorOnCheckbox(id, colorObj) {
    if (colorObj) {
      colorObj = colorObj.split(',');
      $('.custom-control-label').append(
        '<style>.custom-control-input:checked ~ .custom-control-label.add_color_' + id +
        '::before{background-color:' + colorObj[0] + ' !important;border-color:' + colorObj[0] + '}</style>'
      );
    }
  }

  public toggleTimelineData(checkedValue, invitee) {
    this.mangeColorOnCheckbox(invitee.id, invitee.eventBorderColor);
    if (!invitee.isExternal || !invitee.personEmail) {
      if (!checkedValue) {
        this.resourceArray = this.resourceArray.filter(element => element.id != invitee.id);
        this.calendarEvents = this.calendarEvents.filter(element => element.resourceId != invitee.id);
      } else {
        this.resourceArray = [];
        this.calendarEvents = [];
        this.selectedInvite.forEach(inviteeData => {
          if (inviteeData.id === invitee.id) {
            inviteeData['checked'] = checkedValue;
          }
          if (inviteeData['checked'] && inviteeData.id) {
            this.addResource(inviteeData);
            this.getUserEvent(inviteeData.id);
          }
        });
      }
    }
  }

  searchOffice(text) {
    const searchString = text.trim()
    if (searchString && searchString.length > 2) {
      this.officeSearchResultsLoading = true;
      if (this.officeSubscribe) {
        this.officeSubscribe.unsubscribe();
      }
      this.officeSubscribe = this.officeService.v1OfficeSearchGet({search: searchString}).subscribe((result: any) => {
        this.officeSearchResults = JSON.parse(result).results
        this.showOfficeSearchResults = true;
        this.officeSearchBoxFocused = true;
        this.officeSearchResultsLoading = false;
      })
    }
  }

  onLocationKeyPress() {
    this.officeSearchBoxFocused = false;
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
    this.eventLocation = location
    this.officeSearchBoxFocused = false;
    this.showOfficeSearchResults = false;
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  openMenuClientSearch(): void {
    setTimeout(() => {
      this.openMenuClientSearchActive = !this.openMenuClientSearchActive;
    }, 50);
  }

  openMenuClientSearchOutside(event?: any) {
    this.openMenuClientSearchActive = false;
  }
}
