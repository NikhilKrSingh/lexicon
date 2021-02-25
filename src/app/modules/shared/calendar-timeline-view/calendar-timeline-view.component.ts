import { DatePipe } from "@angular/common";
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import timeGrigPlugin from '@fullcalendar/timegrid';
import { AppConfigService } from 'src/app/app-config.service';
import * as moment from "moment";

@Component({
  selector: 'app-calendar-timeline-view',
  templateUrl: './calendar-timeline-view.component.html',
  styleUrls: ['./calendar-timeline-view.component.scss'],
})
export class CalendarTimelineViewComponent implements OnInit, OnChanges, AfterViewInit {
  LICENSE_KEY = '0540678778-fcs-1578950738';
  @Input() eventsArr: any;
  @Input() resourceArr: [];
  @Input() eventsLoading = false;
  @Input() startDateTime: any;
  @Input() endDateTime: any;
  @Output() readonly nextStep = new EventEmitter<any>();
  @ViewChild('calendar', {static: false}) calendarComponent: FullCalendarComponent; // the #calendar in the template
  @ViewChild(FullCalendarComponent, {static: false}) fullcalendar: FullCalendarComponent;
  @Output() readonly calendarDate = new EventEmitter<any>();
  @Output() readonly  dateClicked = new EventEmitter();

  public calendarPlugins = [
    dayGridPlugin,
    timeGrigPlugin,
    interactionPlugin,
    resourceTimeGridPlugin
  ];

  public calendarWeekends = true;
  public calendarEvents: EventInput[] = [];
  public options: any;
  public calendar_key: string;
  public calendarCurrentDate = {month: 0, year: 0};
  public calendarTitle = '';

  constructor(private appConfigService: AppConfigService, private datePipe: DatePipe) {
    this.calendar_key = this.appConfigService.appConfig.calendar_key;
  }

  ngOnInit() {
    const date = new Date();
    this.calendarCurrentDate.month = date.getMonth() + 1;
    this.calendarCurrentDate.year = date.getFullYear();
    this.options = {
      editable: true,
      nowIndicator: true,
      theme: 'standart', // default view, may be bootstrap
      eventLimit: true,
      defaultView: 'timeGridDay',
      views: {
        timeGridDay: {
          eventLimit: 5,
        },
        timeGrid: {},
        day: {
          titleFormat: { // will produce something like "Tuesday, September 18, 2018"
            month: 'long',
            year: 'numeric',
            day: 'numeric',
            weekday: 'long'
          },
        }
      },
      header: false,
      plugins: [],
      week: {
        timeFormat: 'H:mm',
      },
      scrollTime: '08:00:00',
      businessHours: {
        daysOfWeek: [1, 2, 3, 4, 5],
        startTime: '08:00',
        endTime: '18:00',
      },
      resources: this.resourceArr,
    };
    this.setScrollTime();
    setTimeout(() => {
      this.reverseDisplayEventTitle();
    }, 800)
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.eventsArr && changes.eventsArr.currentValue) {
      this.eventsLoading = true;
      setTimeout(() => {
        this.reverseDisplayEventTitle();
        this.eventsLoading = false;
      }, 1000)
    }
    if (changes.startDateTime && changes.startDateTime.currentValue) {
      this.highlightSelectedTime();
    }
    if (changes.endDateTime && changes.endDateTime.currentValue) {
      this.highlightSelectedTime();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.getTitle();
      this.highlightSelectedTime();
    }, 100);
  }

  /**
   *
   * FullCalendar Handler Functions
   */
  eventClick(model) {
  }

  eventDragStop(model) {
    console.log(model);
  }

  dateClick(model) {
    this.dateClicked.emit(model.date)
  }

  goToPrevious() {
    this.calendarComponent.getApi().prev();
    this.getTitle();
    this.highlightSelectedTime();
  }

  goToNext() {
    this.calendarComponent.getApi().next();
    this.getTitle();
    this.highlightSelectedTime();
  }

  getTitle() {
    if (this.calendarComponent) {
      this.calendarTitle = this.calendarComponent.getApi().view.title;
    } else {
      this.calendarTitle = this.datePipe.transform(new Date(), 'MMMM yyyy');
    }
  }

  changeView(event: any) {
    if (this.calendarComponent) {
      const calendarApi = this.calendarComponent.getApi();
      const startDate = calendarApi.view.activeStart.toUTCString();
      const endDate = calendarApi.view.activeEnd.toUTCString();
      this.calendarDate.emit({startDate, endDate});
      this.getTitle();
      this.highlightSelectedTime();
    }
  }

  setScrollTime() {
    let businessHours = [];
    const date = new Date();
    const day = date.getDay();
    this.resourceArr.forEach((item: any) => {
      businessHours = businessHours.concat(item.businessHours);
    });
    businessHours = businessHours.filter(obj => obj && obj.daysOfWeek && obj.daysOfWeek[0] == day);
    if (businessHours && businessHours.length) {
      const basicStartTime = businessHours[0].startTime.split(':');
      let earlyTime = basicStartTime[0];
      businessHours.forEach(obj => {
        const time = obj.startTime.split(':');
        const startTime = time[0];
        if (parseInt(earlyTime) > parseInt(startTime) && startTime != '00') {
          earlyTime = startTime;
        }
      });
      this.options.scrollTime = (parseInt(earlyTime) < 10) ? '0' + (parseInt(earlyTime) - 1).toString() + ':00:00' : (parseInt(earlyTime) - 1).toString() + ':00:00';
    }
  }

  private reverseDisplayEventTitle() {
    var els = document.getElementsByClassName("fc-content");
    let i: number;
    if (els.length > 0) {
      for (i = 0; i < els.length; i++) {
        // this.resourceViewLoading = true;
        let html = els[i].innerHTML;
        let isAllday: boolean = false
        if (html.match(/<span class="fc-title">[\s\S]*?<\/span>/g)) {
          isAllday = true;
        }
        var idx = html.indexOf("<span>");
        idx += 6;

        if (!isAllday) {
          let index: any = html.substr(0, idx).indexOf('data-full="');
          let tempString = html.substr(index + 11, html.length);
          index = tempString.indexOf('">');
          tempString = tempString.substr(0, index);
          let time = html.substr(0, idx).concat(tempString + "</span></div>");
          index = html.indexOf("</div>")
          let title = html.substr(index, html.length);
          var contentClass = new RegExp("fc-title");
          if (!time.match(contentClass)) {
            els[i].innerHTML = `${title} ${time}`
          }
        }
      }
    }
  }

  displayResourceData($event) {
    const element = $event.el;
    const resourceItem = $event.resource;
    let newHtml = '<div class="font-weight-normal font-12 text-align-end">' + resourceItem.extendedProps.email + '</div>';
    if (resourceItem.extendedProps.personPhoto) {
      newHtml += '<div><img class="profile-picture" src="' + resourceItem.extendedProps.personPhoto +'"></div>'
    } else {
      newHtml += '<div><img class="profile-picture" src="assets/images/user.png"></div>';
    }
    element.classList.add('pr-3');
    element.innerHTML = newHtml;
  }

  highlightSelectedTime() {
    let elements: any = [];
    elements = Array.from(document.querySelectorAll('[data-time]'));
    elements.forEach(element => {
      element.lastElementChild.classList.remove('selected-time-highlight');
    })
    const startDate = moment(this.startDateTime).format('DD-MM-YYYY');
    const endDate = moment(this.endDateTime).format('DD-MM-YYYY');
    const calendarDate = this.calendarComponent ? moment(this.calendarComponent.getApi().getDate()).format('DD-MM-YYYY') : null;
    if (calendarDate <= endDate && calendarDate >= startDate) {
      const startTime = this.startDateTime.getMinutes() >= 30 ? moment(this.startDateTime).format('HH') + ':30:00' : moment(this.startDateTime).format('HH') + ':00:00';
      const endTime = this.endDateTime.getMinutes() >= 30 ? moment(this.endDateTime).format('HH') + ':30:00' : moment(this.endDateTime).format('HH') + ':00:00';
      if (startDate == endDate) {
        elements.forEach(element => {
          const timeFrame = element.attributes.getNamedItem('data-time').value
          if (timeFrame >= startTime && timeFrame < endTime) {
            element.lastElementChild.classList.add('selected-time-highlight');
          }
        })
      } else {
        elements.forEach(element => {
          const timeFrame = element.attributes.getNamedItem('data-time').value
          if (timeFrame >= startTime && calendarDate == startDate) {
            element.lastElementChild.classList.add('selected-time-highlight');
          } else if (calendarDate < endDate && calendarDate != startDate) {
            element.lastElementChild.classList.add('selected-time-highlight');
          } else if (calendarDate == endDate && timeFrame <= endTime && calendarDate != startDate) {
            element.lastElementChild.classList.add('selected-time-highlight');
          }
        })
      }
    }
  }
}
