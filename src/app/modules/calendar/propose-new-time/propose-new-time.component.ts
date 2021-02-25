import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import * as $ from 'jquery';
import * as moment from 'moment';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { CalendarService } from '../../../../common/swagger-providers/services/calendar.service';
import { MiscService } from "../../../../common/swagger-providers/services/misc.service";
import { CommonService } from '../../../service/common.service';
import { getWorkingHour, WORKING_DAYS } from '../../models/office-data';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-propose-new-time',
  templateUrl: './propose-new-time.component.html',
  styleUrls: ['./propose-new-time.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ProposeNewTimeComponent implements OnInit {
  private eventId: any;
  private dateTime = new Date();
  description: string;
  eventDetails: any;
  eventProposalForm: FormGroup;
  rsvpOptions = [{label: 'Yes', value: true}, {label: 'No', value: false}];
  fileData: Array<File> = [];
  startTime: Date;
  endTime: Date;
  loading = false;
  submitted = false;
  inviteeList = [];
  config: any = {
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
    onchange_callback: 'myCustomOnChangeHandler',
    setup: (editor) => {
      editor.ui.registry.addButton('customFileLink', {
        text: '<img src="/assets/images/icon/outlook.png" style="width: 30px; height: 23px;margin-left: -10px;margin-top: 3px; cursor: pointer">',
        tooltip: 'Upload File',
        onAction: () => {
          const inputFile = document.createElement('INPUT');
          inputFile.setAttribute('type', 'file');
          inputFile.setAttribute('style', 'display: none');
          inputFile.click();

          inputFile.addEventListener('change', (e: any) => {
            if (e.path && e.path[0] && e.path[0].files) {
              const file = e.path[0].files[0] as File;
              this.fileData.push(file);
              editor.insertContent('<div style=\'outline:0 !important;display:inline-block;padding:4px 9px 4px 9px;background-color: #E7EDF3;border-radius:4px;pointer-events:none;border:none;position:relative;\' contenteditable=\'false\'><span style=\'display:flex;font-size:12px;font-weight:500;line-height:16px\'><img style=\'margin-right:5px;\' src=' + this.commonService.getIcons(file.name) + '>' + file.name + '</span> </div>');
            }
          });
        }
      });
    }
  };

  rightTab: string[] = ['Invitee'];
  selectedRightTab = this.rightTab[0];

  leftTab: string[] = ['Find a Time'];
  selectedLeftTab = this.leftTab[0];
  public employee = false;
  public client = false;
  public potentialClient = false;
  public associations = false;
  calendarEvents: any[] = [];
  resourceArray: any[] = [];
  userDetails = JSON.parse(localStorage.getItem('profile'));

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
  calendarSettings: any;
  workingHoursList: any[];
  isLongEvent: boolean;
  eventTimeString: string;
  timezoneList: any = [];
  selectedTimezone: any = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private calendarService: CalendarService,
    private formBuilder: FormBuilder,
    private pageTitle: Title,
    private commonService: CommonService,
    private toastr: ToastDisplay,
    private datePipe: DatePipe,
    private router: Router,
    private miscService: MiscService
  ) {
  }

  ngOnInit() {
    this.pageTitle.setTitle('Propose New Time');
    this.eventId = this.activatedRoute.snapshot.params.eventId;
    this.getEventDetails();
    this.eventProposalForm = this.formBuilder.group({
      rsvp: new FormControl(true),
      description: new FormControl(null),
      startDate: new FormControl(null, [Validators.required]),
      startTime: new FormControl(null, [Validators.required]),
      endTime: new FormControl(null, [Validators.required]),
      endDate: new FormControl(null, [Validators.required]),
    });
  }

  get f() {
    return this.eventProposalForm.controls;
  }

  getEventDetails() {
    this.loading = true;
    this.calendarService.v1CalendarEventsMatterEventIdGet({
      matterEventId: this.eventId
    }).subscribe((data: any) => {
        this.eventDetails = JSON.parse(data as any).results;
        this.isLongEvent = (moment(new Date(this.eventDetails.endDateTime)).diff(moment(new Date(this.eventDetails.startDateTime)), 'days')) > 0;
        this.eventDetails.isAllDayEvent = new Date(this.eventDetails.startDateTime).toISOString() === new Date(this.eventDetails.endDateTime).toISOString();
        this.eventTimeString = this.getTimeString(this.eventDetails);
        this.eventDetails.invitees.forEach(element => {
          if (element) {
            let inviteeData: any = {};
            if (element.person) {
              inviteeData = Object.assign(element.person);
            }
            inviteeData.personEmail = element.personEmail;
            inviteeData.checked = true;
            inviteeData.acceptStatus = element.acceptStatus;
            inviteeData.inviteeType = element.inviteeType;
            inviteeData.isOrganiser = (!element.isOrganiser) ? false : element.isOrganiser;
            inviteeData.isHost = (!element.isHost) ? false : element.isHost;
            inviteeData.isRequired = (!element.isRequired) ? true : element.isRequired;
            inviteeData.isOptional = (!element.isOptional) ? false : element.isOoptional;
            inviteeData.doNotSchedule = (!element.doNotSchedule) ? false : element.doNotSchedule;
            inviteeData.doNotContact = (!element.doNotContact) ? false : element.doNotContact;
            inviteeData.inviteeId = (!element.id) ? 0 : element.id;
            let existInvitee = false;
            if (this.inviteeList.some(item => item.inviteeId == element.id)) {
              existInvitee = true;
            }
            if (!existInvitee) {
              if (element.person) {
                this.addResource(element.person);
                this.getUserEvent(element.person.id);
              }
              const len = this.inviteeList.length;
              inviteeData.eventBorderColor = this.eventColorMap[this.colorsArray[len]].bordercolor;
              inviteeData.eventBackgroundColor = this.eventColorMap[this.colorsArray[len]].bgcolor;
              this.inviteeList.push(inviteeData);
            }
          }
          this.eventProposalForm.patchValue({
            startDate: moment(this.eventDetails.startDateTime).format('YYYY-MM-DD') + 'T00:00:00',
            endDate: new Date(this.eventDetails.endDateTime),
            startTime: new Date(this.eventDetails.startDateTime),
            endTime: new Date(this.eventDetails.endDateTime)
          });
          this.startTime = new Date(this.eventDetails.startDateTime);
          this.endTime = new Date(this.eventDetails.endDateTime);
        });
        this.loading = false;
        setTimeout(() => {
          this.inviteeList.forEach(invitee => {
            this.mangeColorOnCheckbox(invitee.id, invitee.eventBorderColor);
          });
        }, 10);
      }, err => {
        this.loading = false;
        console.log(err);
      }
    );
  }

  getTimeString(data) {
    if (!this.eventDetails.isAllDayEvent && !this.isLongEvent) {
      return this.datePipe.transform(data.startDateTime, 'EEEE, MMMM dd - hh:mm aaa') + ' - ' + this.datePipe.transform(data.endDateTime, 'shortTime');
    } else if (this.isLongEvent) {
      return this.datePipe.transform(data.startDateTime, 'EEEE, MMMM dd - hh:mm aaa') + ' - ' + this.datePipe.transform(data.endDateTime, 'EEEE, MMMM dd - hh:mm aaa');
    } else if (this.eventDetails.isAllDayEvent) {
      return this.datePipe.transform(data.startDateTime, 'EEEE, MMMM dd') + ', All Day';
    }
  }

  addResource(obj: any) {
    let bgcolor: string;
    let bordercolor: string;
    const len = this.resourceArray.length;
    bordercolor = this.eventColorMap[this.colorsArray[len]].bordercolor;
    bgcolor = this.eventColorMap[this.colorsArray[len]].bgcolor;
    if (obj) {
      const data = {
        id: obj.id,
        title: (obj.lastName) ? obj.firstName + ' ' + obj.lastName : obj.firstName,
        eventBackgroundColor: bgcolor,
        eventBorderColor: bordercolor
      };
      let resourceExist = false;
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
            this.getTimeZone();
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
      const timeZoneDetail = this.timezoneList.filter(obj => obj.id == this.calendarSettings.timeZoneId);
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
   * Function to populate end date on selecting event start date
   */
  public setEndDate(date: any) {
    this.eventProposalForm.patchValue({
      endDate: date
    });
  }

  public changeEndTime(event) {
    const startTime: any = new Date(this.startTime);
    const endTime: any = new Date(this.endTime);
    const difference = (endTime - startTime);
    const dif = Math.round((difference / 1000) / 60);
    const dt = new Date(event);
    dt.setMinutes(dt.getMinutes() + dif);
    this.endTime = dt;
    this.eventProposalForm.patchValue({
      endDate: dt,
      endTime: dt
    });
  }

  get addCssEditor() {
    return $('.tox-edit-area__iframe').contents().find('.mce-content-body').css({
      'font-size': '14px',
      color: '#5D6A86'
    });
  }

  /**
   * Function to get the current calendar date
   */
  public calendarDate(event: any) {
    this.getAllUserEvents(event.startDate, event.endDate);
  }

  public getAllUserEvents(start?: any, end?: any) {
    this.calendarEvents = [];
    this.resourceArray.forEach(item => {
      this.getUserEvent(item.id, start, end);
    });
  }

  /***
   *
   * Function to fetch user events
   */
  public getUserEvent(id, startDate?: any, endDate?: any) {
    const curr = new Date(); // get current date
    const first = curr.getDate() - curr.getDay();
    const last = first + 6; // last day is the first day + 6
    const lastDay = endDate ? endDate : new Date(curr.setDate(last)).toUTCString();
    const firstDay = startDate ? startDate : new Date(curr.setDate(first)).toUTCString();
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
    }, () => {
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
    if (!invitee.isExternal) {
      if (!checkedValue) {
        this.resourceArray = this.resourceArray.filter(element => element.id != invitee.id);
        this.calendarEvents = this.calendarEvents.filter(element => element.resourceId != invitee.id);
      } else {
        this.resourceArray = [];
        this.calendarEvents = [];
        this.inviteeList.forEach(inviteeData => {
          if (inviteeData.id === invitee.id) {
            inviteeData.checked = checkedValue;
          }
          if (inviteeData.checked) {
            this.addResource(inviteeData);
            this.getUserEvent(inviteeData.id);
          }
        });
      }
    }
    this.mangeColorOnCheckbox(invitee.id, invitee.eventBorderColor);
  }

  public saveProposal() {
    this.submitted = true;
    if (!this.eventProposalForm.valid) {
      this.toastr.showError('Please provide a date and time.');
      return;
    }
    const proposedTimeData = this.eventProposalForm.value;
    if (proposedTimeData.startDate && proposedTimeData.startTime) {
      proposedTimeData.startDateTime = moment(proposedTimeData.startDate).format('YYYY-MM-DD') + 'T' + moment(proposedTimeData.startTime).format('HH:mm:ss');
    }
    if (proposedTimeData.endDate && proposedTimeData.endTime) {
      proposedTimeData.endDateTime = moment(proposedTimeData.endDate).format('YYYY-MM-DD') + 'T' + moment(proposedTimeData.endTime).format('HH:mm:ss');
    }
    const eventTimeString = this.getTimeString(proposedTimeData);
    if (proposedTimeData.startDateTime) {
      proposedTimeData.startDateTime = moment(proposedTimeData.startDateTime + this.selectedTimezone).utc().format('YYYY-MM-DD[T]HH:mm:ss');
    }
    if (proposedTimeData.endDateTime) {
      proposedTimeData.endDateTime = moment(proposedTimeData.endDateTime + this.selectedTimezone).utc().format('YYYY-MM-DD[T]HH:mm:ss');
    }
    proposedTimeData.matterEventId = this.eventDetails.id;
    proposedTimeData.eventName = this.eventDetails.title;
    proposedTimeData.description = proposedTimeData.description ? proposedTimeData.description.replace(/<[^>]*>/g, '') : '';
    this.loading = true;
    this.calendarService.v1CalendarEventsAddproposedtimePost$Json({body: proposedTimeData}).subscribe(() => {
      this.toastr.showSuccess('Proposed ' + eventTimeString + ' to organiser');
      this.router.navigate(['/calendar']);
      this.loading = false;
    }, () => {
      this.loading = false;
    });
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
