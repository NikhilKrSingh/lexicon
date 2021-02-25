import { CommonModule, DatePipe } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NgSelectModule } from '@ng-select/ng-select';
import { StoreModule } from '@ngrx/store';
import { ToastrModule } from 'ngx-toastr';
import { of } from "rxjs";
import { ApiModule } from '../../../../common/swagger-providers/api.module';
import { CalendarService } from '../../../../common/swagger-providers/services/calendar.service';
import { MiscService } from "../../../../common/swagger-providers/services/misc.service";
import { AppConfigService, IAppSettings } from '../../../app-config.service';
import { reducers } from '../../../store/reducers';
import { SharedModule } from '../../shared/shared.module';
import { ProposeNewTimeComponent } from './propose-new-time.component';

@Injectable()
export class CustomAppConfigService {
  appConfig: IAppSettings = {
    API_URL: 'https://sc1-api.lexiconservices.com',
    SWAGGER_PATH: 'src/common/swagger-providers/',
    SWAGGER_SUB_PATH: '/swagger/v1/swagger.json',
    calendar_key: '0540678778-fcs-1578950738',
    brand: 'CPMG',
    cpmg_domain: 'https://sc1.lexiconservices.com',
    default_logo: 'assets/images/default-logo-lexicon.png',
    Common_Logout:
      'https://quarto-mta-common-dev-ui.azurewebsites.net/logout-b2c',
    Common_Login: 'https://quarto-mta-common-dev-ui.azurewebsites.net',
    Common_API: 'https://quarto-mta-common-dev-api.azurewebsites.net',
    intervalTime: 60000,
    timerSyncInterval: 15000,
  };

  APP_URL = `${window.location.protocol}//${window.location.host}`;
}

let eventMock = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDY3MTM0NjgsImV4cCI6MTYwNjc1NjY2OCwiaWF0IjoxNjA2NzEzNDY4fQ.SoszXhw-Hiu28U28s9ERbfpo5nJKB6KKjKGuY1sb-rg",
  results: {
    "id": 23163,
    "matter": {
      "id": 7275,
      "name": "#Test Funding Matter - 5 (Do Not Contact)"
    },
    "client": {
      "id": 8898,
      "uniqueNumber": 0,
      "firstName": "Crown",
      "lastName": "Prince",
      "companyName": "",
      "clientFlag": null,
      "email": null,
      "jobTitle": null,
      "isVisible": true,
      "isCompany": false,
      "primaryOffice": null,
      "associationTypeId": 0,
      "associationTypeName": null,
      "associations": [],
      "phones": [],
      "preferredPhone": null,
      "role": null,
      "preferredContactMethod": null,
      "doNotContact": null,
      "doNotContactReason": null,
      "personPhoto": null,
      "doNotSchedule": null,
      "blockId": null,
      "description": null,
      "clientName": null,
      "clientNumber": null,
      "matterName": null,
      "responsibleAttorney": null,
      "primaryOfficeName": null,
      "primaryOfficeId": 0,
      "personPhotoURL": null,
      "clientId": null,
      "associatedWithClient": null,
      "associatedWithPC": null,
      "priority": 0,
      "tmpClientNumber": null,
      "totalCount": 0,
      "matterNumber": null,
      "empTimezone": null
    },
    "title": "Event -1 5-dec",
    "eventType": {
      "id": 27,
      "code": "MEETING",
      "name": "Meeting",
      "email": null,
      "primaryPhone": null,
      "uniqueNumber": 0
    },
    "description": null,
    "eventLocation": null,
    "startDateTime": "2020-12-05T18:30:00",
    "endDateTime": "2020-12-05T19:00:00",
    "beforeTravelTimeHours": 0,
    "beforeTravelTimeMinutes": 0,
    "afterTravelTimeHours": 0,
    "afterTravelTimeMinutes": 0,
    "isAllDayEvent": false,
    "isRecurringEvent": false,
    "office": null,
    "status": {
      "id": 29,
      "code": "BUSY",
      "name": "Busy",
      "email": null,
      "primaryPhone": null,
      "uniqueNumber": 0
    },
    "privacy": {
      "id": 32,
      "code": "PUBLIC",
      "name": "Public",
      "email": null,
      "primaryPhone": null,
      "uniqueNumber": 0
    },
    "invitees": [
      {
        "id": 61424,
        "matterEventId": 23163,
        "person": {
          "id": 1304,
          "uniqueNumber": 0,
          "firstName": "Admin",
          "lastName": "Lexicon dev",
          "companyName": null,
          "clientFlag": null,
          "email": "adminLex@yopmail.com",
          "jobTitle": "Tenant Admin",
          "isVisible": true,
          "isCompany": false,
          "primaryOffice": null,
          "associationTypeId": 0,
          "associationTypeName": null,
          "associations": [],
          "phones": [],
          "preferredPhone": null,
          "role": null,
          "preferredContactMethod": null,
          "doNotContact": null,
          "doNotContactReason": null,
          "personPhoto": null,
          "doNotSchedule": null,
          "blockId": null,
          "description": null,
          "clientName": null,
          "clientNumber": null,
          "matterName": null,
          "responsibleAttorney": null,
          "primaryOfficeName": null,
          "primaryOfficeId": 0,
          "personPhotoURL": null,
          "clientId": null,
          "associatedWithClient": null,
          "associatedWithPC": null,
          "priority": 0,
          "tmpClientNumber": null,
          "totalCount": 0,
          "matterNumber": null,
          "empTimezone": null
        },
        "personEmail": null,
        "inviteeType": {
          "id": 36,
          "code": "EMPLOYEE",
          "name": "Employee",
          "email": null,
          "primaryPhone": null,
          "uniqueNumber": 0
        },
        "isOrganiser": null,
        "isHost": false,
        "isRequired": true,
        "isOptional": false,
        "acceptStatus": null,
        "personPhoto": null,
        "doNotContact": false,
        "doNotSchedule": false
      },
      {
        "id": 61425,
        "matterEventId": 23163,
        "person": {
          "id": 5161,
          "uniqueNumber": 0,
          "firstName": "Pawan",
          "lastName": "Test",
          "companyName": null,
          "clientFlag": null,
          "email": "pmishra@codal.com",
          "jobTitle": "Mr.",
          "isVisible": true,
          "isCompany": false,
          "primaryOffice": null,
          "associationTypeId": 0,
          "associationTypeName": null,
          "associations": [],
          "phones": [],
          "preferredPhone": null,
          "role": null,
          "preferredContactMethod": null,
          "doNotContact": null,
          "doNotContactReason": null,
          "personPhoto": null,
          "doNotSchedule": null,
          "blockId": null,
          "description": null,
          "clientName": null,
          "clientNumber": null,
          "matterName": null,
          "responsibleAttorney": null,
          "primaryOfficeName": null,
          "primaryOfficeId": 0,
          "personPhotoURL": null,
          "clientId": null,
          "associatedWithClient": null,
          "associatedWithPC": null,
          "priority": 0,
          "tmpClientNumber": null,
          "totalCount": 0,
          "matterNumber": null,
          "empTimezone": null
        },
        "personEmail": null,
        "inviteeType": {
          "id": 36,
          "code": "EMPLOYEE",
          "name": "Employee",
          "email": null,
          "primaryPhone": null,
          "uniqueNumber": 0
        },
        "isOrganiser": null,
        "isHost": true,
        "isRequired": true,
        "isOptional": false,
        "acceptStatus": null,
        "personPhoto": null,
        "doNotContact": false,
        "doNotSchedule": true
      }
    ],
    "recurringEvent": null,
    "eventProposedTimeId": 0,
    "isDeleteAllProposal": false,
    "upcommingReccuringEventsTypeId": null,
    "empTimezone": null
  }
}

let timeZoneMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQ2NDAyOTAsImV4cCI6MTYwNDY4MzQ5MCwiaWF0IjoxNjA0NjQwMjkwfQ.FYWhg2MqWrQrL8JRCdKn4-HODnX0AWx6ykhw9kDawHE",
  "results": [
    {
      "id": "Hawaiian Standard Time",
      "name": "(UTC-10:00) Hawaii",
      "isSysytemTimeZone": false
    },
    {
      "id": "Alaskan Standard Time",
      "name": "(UTC-09:00) Alaska",
      "isSysytemTimeZone": false
    },
    {
      "id": "Pacific Standard Time",
      "name": "(UTC-08:00) Pacific Time (US & Canada)",
      "isSysytemTimeZone": false
    },
    {
      "id": "Mountain Standard Time",
      "name": "(UTC-07:00) Mountain Time (US & Canada)",
      "isSysytemTimeZone": false
    },
    {
      "id": "Central Standard Time",
      "name": "(UTC-06:00) Central Time (US & Canada)",
      "isSysytemTimeZone": true
    },
    {
      "id": "Eastern Standard Time",
      "name": "(UTC-05:00) Eastern Time (US & Canada)",
      "isSysytemTimeZone": false
    }
  ]
};

describe('ProposeNewTimeComponent', () => {
  let component: ProposeNewTimeComponent;
  let fixture: ComponentFixture<ProposeNewTimeComponent>;
  let mockCalendarService: CalendarService;
  let miscService: MiscService;
  let datePipe: DatePipe;
  beforeEach(async(() => {
    // jasmine.DEFAULT_TIMEOUT_INTERVAL = 150000;
    TestBed.configureTestingModule({
      declarations: [ProposeNewTimeComponent],
      imports: [
        NgSelectModule,
        SharedModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        SharedModule,
        CommonModule,
        ApiModule.forRoot({
          rootUrl: 'https://sc1-api.lexiconservices.com',
        }),
        StoreModule.forRoot(reducers),
        ToastrModule.forRoot({})
      ],
      providers: [
        CustomAppConfigService,
        {provide: ActivatedRoute, useValue: {snapshot: {params: {eventId: '123'}}}},
        {provide: DatePipe},
        {
          provide: AppConfigService,
          useClass: CustomAppConfigService,
        },
      ]

    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProposeNewTimeComponent);
    mockCalendarService = TestBed.get(CalendarService);
    miscService = TestBed.get(MiscService);
    datePipe = TestBed.get(DatePipe)
    component = fixture.debugElement.componentInstance;
    // component.loading = false;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get event details', () => {
    spyOn(mockCalendarService, 'v1CalendarEventsMatterEventIdGet').and.returnValue(of(JSON.stringify(eventMock) as any));
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.eventDetails).toEqual(eventMock.results);
  });

  it('should get all user events', function () {
    spyOn(component, 'getAllUserEvents').and.callThrough();
    component.calendarDate({startDate: new Date(), endDate: new Date()})
    expect(component.getAllUserEvents).toHaveBeenCalled();
  });

});

