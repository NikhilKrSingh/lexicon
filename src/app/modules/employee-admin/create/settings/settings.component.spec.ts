import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router, Routes } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { BillingService, EmployeeService, MiscService, OfficeService, PersonService } from 'src/common/swagger-providers/services';
import { ListComponent } from '../../list/list.component';
import { SettingsComponent } from './settings.component';


let timeZoneMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQzODExNzYsImV4cCI6MTYwNDQyNDM3NiwiaWF0IjoxNjA0MzgxMTc2fQ.VlS-Dnq3EprZTlkDSrUMrmPShMQqnUrNo_RYsExrjFU",
  "results": [
    {
      "id": "Hawaiian Standard Time",
      "name": "(UTC-10:00) Hawaii"
    },
    {
      "id": "Alaskan Standard Time",
      "name": "(UTC-09:00) Alaska"
    },
    {
      "id": "Pacific Standard Time",
      "name": "(UTC-08:00) Pacific Time (US & Canada)"
    },
    {
      "id": "Mountain Standard Time",
      "name": "(UTC-07:00) Mountain Time (US & Canada)"
    },
    {
      "id": "Central Standard Time",
      "name": "(UTC-06:00) Central Time (US & Canada)"
    },
    {
      "id": "Eastern Standard Time",
      "name": "(UTC-05:00) Eastern Time (US & Canada)"
    }
  ]
};

let officeResMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQ0Njc0ODYsImV4cCI6MTYwNDUxMDY4NiwiaWF0IjoxNjA0NDY3NDg2fQ.o2jKhSp5aAYITs00mnhPWpuhgOQFeyG4A5mPt6eBtoQ",
  "results": {
    "id": 0,
    "name": " Andrews Office",
    "status": {
      "id": 1,
      "status": "Active",
      "createdBy": 3,
      "createdAt": "2019-11-13T05:06:36.44",
      "updatedBy": 3,
      "lastUpdated": "2019-11-13T05:06:36.44",
      "isActive": true
    },
    "openingDate": "2020-07-21T00:00:00",
    "closingDate": null,
    "effectiveDate": null,
    "acceptsInitialConsultation": true,
    "timeZone": "Alaskan Standard Time",
    "addressId": 0,
    "address": {
      "id": 11278,
      "guid": "ff89f804-9389-4fb1-b968-c07d8a6bfdab",
      "personId": null,
      "addressTypeId": null,
      "addressTypeName": null,
      "name": "Dothan ",
      "street": "3300 South Oates Street",
      "address2": "",
      "city": "Dothan",
      "state": "AL",
      "zipCode": "36301",
      "lat": 31.178953,
      "lon": -85.40449,
      "image": null,
      "googlePlaceId": "ChIJfQvcBC3tkogRK6-hflmazVg",
      "createdBy": 4121,
      "createdAt": "2020-07-22T13:36:02.853",
      "updatedBy": 1304,
      "lastUpdated": "2020-10-22T10:26:21.06",
      "isActive": true,
      "office": []
    },
    "practiceAreas": [
      {
        "id": 73,
        "name": "Corporate Law",
        "tenantId": 1006,
        "createdBy": 8,
        "createdAt": "2019-12-24T05:54:34.647",
        "updatedBy": 1304,
        "lastUpdated": "2020-10-12T10:20:14.36",
        "isActive": true
      },
      {
        "id": 75,
        "name": "Criminal Law",
        "tenantId": 1006,
        "createdBy": 8,
        "createdAt": "2019-12-24T05:54:34.647",
        "updatedBy": 8,
        "lastUpdated": "2019-12-24T05:54:34.647",
        "isActive": true
      },
      {
        "id": 145,
        "name": "Accidents",
        "tenantId": 1006,
        "createdBy": 1304,
        "createdAt": "2020-04-06T11:40:08.56",
        "updatedBy": 1304,
        "lastUpdated": "2020-04-06T11:40:08.563",
        "isActive": true
      },
      {
        "id": 148,
        "name": "Estate Planning",
        "tenantId": 1006,
        "createdBy": 1304,
        "createdAt": "2020-04-15T11:14:54.123",
        "updatedBy": 1304,
        "lastUpdated": "2020-04-15T11:14:54.123",
        "isActive": true
      },
      {
        "id": 170,
        "name": "Medicaid Chronic",
        "tenantId": 1006,
        "createdBy": 1304,
        "createdAt": "2020-10-23T10:09:50.743",
        "updatedBy": 1304,
        "lastUpdated": "2020-10-23T10:09:50.747",
        "isActive": true
      },
      {
        "id": 171,
        "name": "Guardianship",
        "tenantId": 1006,
        "createdBy": 1304,
        "createdAt": "2020-10-23T10:12:35.143",
        "updatedBy": 1304,
        "lastUpdated": "2020-10-23T10:12:35.143",
        "isActive": true
      },
      {
        "id": 172,
        "name": "Seminar",
        "tenantId": 1006,
        "createdBy": 1304,
        "createdAt": "2020-10-27T06:42:48.067",
        "updatedBy": 1304,
        "lastUpdated": "2020-10-27T06:42:48.067",
        "isActive": true
      },
      {
        "id": 176,
        "name": "Probate - Small Estate",
        "tenantId": 1006,
        "createdBy": 8,
        "createdAt": "2020-10-29T08:08:07.007",
        "updatedBy": 8,
        "lastUpdated": "2020-10-29T08:08:07.007",
        "isActive": true
      }
    ],
    "officeHoliday": [
      {
        "id": 1335,
        "officeId": 1709,
        "name": "Holiday 1",
        "date": "2020-03-01T00:00:00",
        "createdBy": 4121,
        "createdAt": "2020-07-22T13:36:09.157",
        "updatedBy": 4121,
        "lastUpdated": "2020-07-22T13:36:09.16",
        "isActive": true,
        "office": null
      },
      {
        "id": 1336,
        "officeId": 1709,
        "name": "Holiday 2",
        "date": "2020-04-01T00:00:00",
        "createdBy": 4121,
        "createdAt": "2020-07-22T13:36:09.18",
        "updatedBy": 4121,
        "lastUpdated": "2020-07-22T13:36:09.18",
        "isActive": true,
        "office": null
      },
      {
        "id": 1337,
        "officeId": 1709,
        "name": "Holiday 3",
        "date": "2020-07-06T00:00:00",
        "createdBy": 4121,
        "createdAt": "2020-07-22T13:36:09.187",
        "updatedBy": 4121,
        "lastUpdated": "2020-07-22T13:36:09.187",
        "isActive": true,
        "office": null
      },
      {
        "id": 1338,
        "officeId": 1709,
        "name": "Birthday",
        "date": "2020-07-22T00:00:00",
        "createdBy": 4121,
        "createdAt": "2020-07-22T13:36:09.193",
        "updatedBy": 4121,
        "lastUpdated": "2020-07-22T13:36:09.193",
        "isActive": true,
        "office": null
      }
    ],
    "phones": [
      {
        "id": 61714,
        "personId": null,
        "officeId": 1709,
        "type": "Phone1",
        "sort": null,
        "countryCodeId": null,
        "number": "5555555555",
        "isPrimary": false,
        "createdBy": 1304,
        "createdAt": "2020-10-22T10:26:21.097",
        "updatedBy": 1304,
        "lastUpdated": "2020-10-22T10:26:21.097",
        "isActive": true
      },
      {
        "id": 62749,
        "personId": null,
        "officeId": 1709,
        "type": "Phone2",
        "sort": null,
        "countryCodeId": null,
        "number": "",
        "isPrimary": false,
        "createdBy": 1304,
        "createdAt": "2020-10-22T10:26:21.1",
        "updatedBy": 1304,
        "lastUpdated": "2020-10-22T10:26:21.1",
        "isActive": true
      }
    ],
    "sundayOpen": "00",
    "sundayClose": "00",
    "mondayOpen": "09:00:00",
    "mondayClose": "18:30:00",
    "tuesdayOpen": "09:00:00",
    "tuesdayClose": "18:30:00",
    "wednesdayOpen": "09:00:00",
    "wednesdayClose": "18:30:00",
    "thursdayOpen": "10:00:00",
    "thursdayClose": "17:30:00",
    "fridayOpen": "10:00:00",
    "fridayClose": "17:30:00",
    "saturdayOpen": "00",
    "saturdayClose": "00",
    "echelon": null,
    "notes": "<p>\n\n<span style=\"color: rgb(29, 28, 29); font-family: Slack-Lato, appleLogo, sans-serif; font-size: 15px; font-style: normal; font-weight: 400; text-align: left; text-indent: 0px; white-space: normal; background-color: rgb(255, 255, 255); display: inline !important; float: none;\">3300 South Oates Street,</span><br style=\" color: rgb(29, 28, 29); font-family: Slack-Lato, appleLogo, sans-serif; font-size: 15px; font-style: normal; font-weight: 400; text-align: left; text-indent: 0px; white-space: normal; background-color: rgb(255, 255, 255);\"><span style=\"color: rgb(29, 28, 29); font-family: Slack-Lato, appleLogo, sans-serif; font-size: 15px; font-style: normal; font-weight: 400; text-align: left; text-indent: 0px; white-space: normal; background-color: rgb(255, 255, 255); display: inline !important; float: none;\">city - Dothan</span><br style=\" color: rgb(29, 28, 29); font-family: Slack-Lato, appleLogo, sans-serif; font-size: 15px; font-style: normal; font-weight: 400; text-align: left; text-indent: 0px; white-space: normal; background-color: rgb(255, 255, 255);\"><span style=\"color: rgb(29, 28, 29); font-family: Slack-Lato, appleLogo, sans-serif; font-size: 15px; font-style: normal; font-weight: 400; text-align: left; text-indent: 0px; white-space: normal; background-color: rgb(255, 255, 255); display: inline !important; float: none;\">state - AL</span><br style=\" color: rgb(29, 28, 29); font-family: Slack-Lato, appleLogo, sans-serif; font-size: 15px; font-style: normal; font-weight: 400; text-align: left; text-indent: 0px; white-space: normal; background-color: rgb(255, 255, 255);\"><span style=\"color: rgb(29, 28, 29); font-family: Slack-Lato, appleLogo, sans-serif; font-size: 15px; font-style: normal; font-weight: 400; text-align: left; text-indent: 0px; white-space: normal; background-color: rgb(255, 255, 255); display: inline !important; float: none;\">36301</span>\n\n<br></p>",
    "lastBillingDate": "2021-04-16T00:00:00",
    "billingStartDate": "2020-07-22T00:00:00",
    "designatedContact": {
      "id": 1366,
      "firstName": "Juhi",
      "lastName": "Chawla",
      "email": "juhichawla@codaldemo.com",
      "phone": {
        "id": 55292,
        "number": "1234567890",
        "type": "primary",
        "isPrimary": true,
        "personId": 1366
      }
    },
    "isDesignatedContactOther": false,
    "stateName": "Alabama",
    "rankAttorneys": null,
    "rankingView": null,
    "consultRankAttorneys": null,
    "consultRankingView": null
  }
};

let calendarSettingMock = {
    "sundayOpenHours": "00",
    "sundayCloseHours": "00",
    "mondayOpenHours": "09:00:00",
    "mondayCloseHours": "18:30:00",
    "tuesdayOpenHours": "09:00:00",
    "tuesdayCloseHours": "18:30:00",
    "wednesdayOpenHours": "09:00:00",
    "wednesdayCloseHours": "18:30:00",
    "thursdayOpenHours": "10:00:00",
    "thursdayCloseHours": "17:30:00",
    "fridayOpenHours": "10:00:00",
    "fridayCloseHours": "17:30:00",
    "saturdayOpenHours": "00",
    "saturdayCloseHours": "00",
    "timeZone": "Alaskan Standard Time"
};

let generalInfoMock = {
  "data": {
    "firstName": "first name",
    "middleName": "middle name",
    "lastName": "last name",
    "maidenName": "maiden name",
    "nickName": "nick name",
    "commonName": "common name",
    "email": "unittest@yopmail.com",
    "jobTitle": "job title",
    "jobFamily": 70,
    "primaryPhoneNumber": 1111111111,
    "cellPhoneNumber": 2222222222,
    "fax": 3333333333,
    "primaryOffice": {
      "id": 1709
    },
    "retainer": true,
    "initialConsultations": true,
    "states": [
      {
        "id": 1
      },
      {
        "id": 2
      }
    ],
    "employmentStartDate": "2020-11-03T00:00:00.000Z",
    "employmentEndDate": null,
    "directManager": 6728,
    "approvingManager": {
      "id": 6728
    },
    "practiceManager": {
      "id": 6728
    },
    "reportingManager": {
      "id": 6728
    },
    "groups": [
      {
        "id": 186
      },
      {
        "id": 188
      },
      {
        "id": 180
      },
      {
        "id": 187
      }
    ],
    "retainerPracticeAreas": [
      {
        "id": 168
      }
    ],
    "initialConsultPracticeAreas": [
      {
        "id": 145
      },
      {
        "id": 162
      }
    ],
    "phones": [
      {
        "id": 0,
        "isPrimary": true,
        "number": 1111111111,
        "type": "primary"
      },
      {
        "id": 0,
        "isPrimary": false,
        "number": 2222222222,
        "type": "cellphone"
      },
      {
        "id": 0,
        "isPrimary": false,
        "number": 3333333333,
        "type": "fax"
      }
    ],
    "role": [
      {
        "name": "Employee"
      }
    ],
    "username": "unittest@yopmail.com",
    "password": "password",
    "DoNotSchedule": false
  }
};

const testRoutes: Routes = [
  {
    path: 'employee',
    children: [
      {
        path: 'list',
        component: ListComponent
      },
    ]
  }
];

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let miscService: MiscService;
  let employeeService: EmployeeService;
  let officeService: OfficeService;
  let billingService: BillingService;
  let router: Router;
  let personService: PersonService;
  
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        RouterTestingModule.withRoutes(
          testRoutes
        ),
        HttpClientTestingModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
      ],
      declarations: [ SettingsComponent , ListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsComponent);
    miscService = TestBed.get(MiscService);
    employeeService = TestBed.get(EmployeeService);
    officeService = TestBed.get(OfficeService);
    billingService = TestBed.get(BillingService);
    router = TestBed.get(Router);
    personService = TestBed.get(PersonService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    localStorage.clear();
  })

  it('loadtimezone should called in ngOnInIt', () => {
    spyOn(component, 'loadTimeZones').and.callThrough();
    spyOn(miscService, 'v1MiscTimezonesGet').and.returnValue(of(JSON.stringify(timeZoneMock) as any));

    component.ngOnInit();

    expect(component.loadTimeZones).toHaveBeenCalled();
    expect(miscService.v1MiscTimezonesGet).toHaveBeenCalled();
  });

  it('jobfamily baserate set 10.10', () => {
    let localDataMock = {
      "data": {
        "jobFamily": 70,
      }
    };
    UtilsHelper.setObject('employee_general', localDataMock);

    let res = JSON.stringify({results: {baseRate: 10.10000}})
    spyOn(employeeService, 'v1EmployeeJobFamilyJobfamilyidGet').and.returnValue(of(res as any));

    component.ngOnInit();

    expect(employeeService.v1EmployeeJobFamilyJobfamilyidGet).toHaveBeenCalled();
    expect(component.jobFamilyBaseRate).toBe('10.10');

  });

  it('jobfamily baserate set 0.00', () => {
    let localDataMock = {
      "data": {
        "jobFamily": 70,
      }
    };
    UtilsHelper.setObject('employee_general', localDataMock);

    let res = JSON.stringify({results: {baseRate: null}})
    spyOn(employeeService, 'v1EmployeeJobFamilyJobfamilyidGet').and.returnValue(of(res as any));

    component.ngOnInit();

    expect(employeeService.v1EmployeeJobFamilyJobfamilyidGet).toHaveBeenCalled();
    expect(component.jobFamilyBaseRate).toBe('0.00');
  });

  it('get primary office id from localStorage call office details and rate list', () => {
    let localDataMock = {
      "data": {
        "primaryOffice": {
          "id": 1709
        },
      }
    };
    UtilsHelper.setObject('employee_general', localDataMock);

    let billingRes = {results: []};
    spyOn(officeService, 'v1OfficeIdGet$Response').and.returnValue(of({body: JSON.stringify(officeResMock)} as any))
    spyOn(billingService, 'v1BillingRateOfficeOfficeIdGet$Response').and.returnValue(of({body: JSON.stringify(billingRes)} as any))
    spyOn(component, 'setOfficeHours').and.callThrough();
    component.timeZones = timeZoneMock.results;
    
    component.ngOnInit();

    expect(component.setOfficeHours).toHaveBeenCalled();
  });

  it('job family base rate should fixed value', () => {
    component.jobFamilyBaseRate = 20.2000;

    component.setCurrencyValue();

    expect(component.jobFamilyBaseRate).toBe('20.20');
  });

  it('job family base rate should fixed value', () => {
    component.jobFamilyBaseRate = null;

    component.setCurrencyValue();

    expect(component.jobFamilyBaseRate).toBeNull();
  });

  it('setJobFamilyBaseRate default', () => {
    component.jobFamilyDetail.baseRate = '10.10';

    component.setJobFamilyBaseRate();

    expect(component.jobFamilyBaseRate).toBe('10.10');
  });

  it('hourChange key `00` set value to `00`', () => {
    component.calendarSettings = calendarSettingMock;

    component.hourChange('sundayOpenHours', 'sundayCloseHours');
    fixture.detectChanges();

    expect(component.calendarSettings.sundayCloseHours).toBe('00');
  });

  it('finish', () => {
    let finishRes = {body: JSON.stringify({results: 1})}
    component.tempFormData = generalInfoMock;
    component.jobFamilyBaseRate = "20.20";
    component.calendarSettings = calendarSettingMock;
    spyOn(employeeService, 'v1EmployeeFullPost$Json$Response').and.returnValue(of(finishRes as any));

    component.finish();

    expect(employeeService.v1EmployeeFullPost$Json$Response).toHaveBeenCalled();
    expect(component.loading).toBe(true);
    expect(UtilsHelper.getObject('employee_profile')).toBeNull();
    expect(UtilsHelper.getObject('employee_general')).toBeNull();
    expect(UtilsHelper.getObject('employee_setting')).toBeNull();
    router.navigate(['/'])
        .then(() => {
          expect(router.url).toEqual('/employee/list');
        });
  });

  it('uploadFileToDB', () => {
    let res = JSON.stringify({results: true});
    spyOn(component, 'uploadFileToDB').and.callThrough();
    spyOn(personService, 'v1PersonPhotoPersonIdPost').and.returnValue(of(res as any));

    component.uploadFileToDB(1, 'test',  () => {
    });

    expect(component.uploadFileToDB).toHaveBeenCalled();
    expect(personService.v1PersonPhotoPersonIdPost).toHaveBeenCalled();
  });

  it('timezone null should return' , () => {
    component.calendarSettings.timeZone = null;

    component.finish();

    expect(component.formSubmitted).not.toBe(false);
  });

  it('timezone null should return' , () => {
    component.calendarSettings.timeZone = 'timezone';
    component.jobFamilyBaseRate = null;

    component.finish();

    expect(component.formSubmitted).not.toBe(false);
  });
});
