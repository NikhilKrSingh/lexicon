import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormControl } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { EmployeeService, MiscService, SecurityGroupService } from 'src/common/swagger-providers/services';

import { GeneralinfoComponent } from './generalinfo.component';

let jobListMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQyOTUxNzcsImV4cCI6MTYwNDMzODM3NywiaWF0IjoxNjA0Mjk1MTc3fQ.0rJ8s1AmKnMAKku96pZ1flqcd7pyO61yJh_jT0gbL8k",
  "results": [
    {
      "id": 70,
      "name": "aaaaaaa",
      "numberOfEmployee": 16,
      "baseRate": null,
      "rateTableJobfamilies": []
    },
    {
      "id": 71,
      "name": "aaaaaaaa",
      "numberOfEmployee": 5,
      "baseRate": null,
      "rateTableJobfamilies": []
    },
    {
      "id": 73,
      "name": "Aadarsh1",
      "numberOfEmployee": 12,
      "baseRate": null,
      "rateTableJobfamilies": []
    },
    {
      "id": 74,
      "name": "actor",
      "numberOfEmployee": 4,
      "baseRate": null,
      "rateTableJobfamilies": []
    },
    {
      "id": 75,
      "name": "Actress",
      "numberOfEmployee": 4,
      "baseRate": null,
      "rateTableJobfamilies": []
    },
    {
      "id": 76,
      "name": "Advocate",
      "numberOfEmployee": 8,
      "baseRate": null,
      "rateTableJobfamilies": []
    },
    {
      "id": 77,
      "name": "Application",
      "numberOfEmployee": 5,
      "baseRate": null,
      "rateTableJobfamilies": []
    },
    {
      "id": 78,
      "name": "asd",
      "numberOfEmployee": 1,
      "baseRate": null,
      "rateTableJobfamilies": []
    },
    {
      "id": 79,
      "name": "asdg4",
      "numberOfEmployee": 2,
      "baseRate": null,
      "rateTableJobfamilies": []
    },
    {
      "id": 62,
      "name": "Associate Attorney",
      "numberOfEmployee": 16,
      "baseRate": null,
      "rateTableJobfamilies": []
    }
  ]
};

let officeListMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQyOTUxNzcsImV4cCI6MTYwNDMzODM3NywiaWF0IjoxNjA0Mjk1MTc3fQ.0rJ8s1AmKnMAKku96pZ1flqcd7pyO61yJh_jT0gbL8k",
  "results": [
    {
      "id": 1709,
      "name": " Andrews Office"
    },
    {
      "id": 1654,
      "name": "1 Billing Office"
    },
    {
      "id": 1549,
      "name": "1 June Office"
    },
    {
      "id": 1453,
      "name": "1 Office"
    },
    {
      "id": 1821,
      "name": "1 Office LEX-6356"
    },
    {
      "id": 1461,
      "name": "10 Office"
    },
    {
      "id": 1612,
      "name": "1000 Office"
    },
    {
      "id": 1613,
      "name": "101 Office"
    },
    {
      "id": 1614,
      "name": "102 Office"
    },
    {
      "id": 1615,
      "name": "103 Office"
    },
  ]
};

let jobFamilyListMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQyOTUxNzcsImV4cCI6MTYwNDMzODM3NywiaWF0IjoxNjA0Mjk1MTc3fQ.0rJ8s1AmKnMAKku96pZ1flqcd7pyO61yJh_jT0gbL8k",
  "results": [
    {
      "id": 168,
      "name": "23 sept test"
    },
    {
      "id": 145,
      "name": "Accidents"
    },
    {
      "id": 162,
      "name": "Ananta Test"
    },
    {
      "id": 73,
      "name": "Corporate Law"
    },
    {
      "id": 75,
      "name": "Criminal Law"
    },
    {
      "id": 167,
      "name": "Demo_Practice Area"
    },
    {
      "id": 151,
      "name": "Elder Law"
    },
    {
      "id": 148,
      "name": "Estate Planning"
    },
    {
      "id": 81,
      "name": "Estates & Trusts"
    },
    {
      "id": 107,
      "name": "Extra Practice Area"
    }
  ]
};

let stateListMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQyOTUxNzcsImV4cCI6MTYwNDMzODM3NywiaWF0IjoxNjA0Mjk1MTc3fQ.0rJ8s1AmKnMAKku96pZ1flqcd7pyO61yJh_jT0gbL8k",
  "results": [
    {
      "id": 1,
      "code": "AL",
      "name": "Alabama",
      "email": null,
      "primaryPhone": null,
      "uniqueNumber": 0
    },
    {
      "id": 2,
      "code": "AK",
      "name": "Alaska",
      "email": null,
      "primaryPhone": null,
      "uniqueNumber": 0
    },
    {
      "id": 3,
      "code": "AZ",
      "name": "Arizona",
      "email": null,
      "primaryPhone": null,
      "uniqueNumber": 0
    },
    {
      "id": 4,
      "code": "AR",
      "name": "Arkansas",
      "email": null,
      "primaryPhone": null,
      "uniqueNumber": 0
    },
    {
      "id": 5,
      "code": "CA",
      "name": "California",
      "email": null,
      "primaryPhone": null,
      "uniqueNumber": 0
    },
    {
      "id": 6,
      "code": "CO",
      "name": "Colorado",
      "email": null,
      "primaryPhone": null,
      "uniqueNumber": 0
    },
    {
      "id": 7,
      "code": "CT",
      "name": "Connecticut",
      "email": null,
      "primaryPhone": null,
      "uniqueNumber": 0
    },
    {
      "id": 8,
      "code": "DE",
      "name": "Delaware",
      "email": null,
      "primaryPhone": null,
      "uniqueNumber": 0
    },
    {
      "id": 9,
      "code": "DC",
      "name": "District of Columbia",
      "email": null,
      "primaryPhone": null,
      "uniqueNumber": 0
    },
    {
      "id": 10,
      "code": "FL",
      "name": "Florida",
      "email": null,
      "primaryPhone": null,
      "uniqueNumber": 0
    },
  ]
};

let employeeListMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQyOTUxNzcsImV4cCI6MTYwNDMzODM3NywiaWF0IjoxNjA0Mjk1MTc3fQ.0rJ8s1AmKnMAKku96pZ1flqcd7pyO61yJh_jT0gbL8k",
  "results": [
    {
      "id": 6728,
      "userName": "mithundaa@yopmail.com",
      "password": null,
      "role": [
        {
          "id": 180,
          "name": "Responsible Attorney"
        },
        {
          "id": 181,
          "name": "Originating Attorney"
        },
        {
          "id": 193,
          "name": "Attorney"
        },
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 195,
          "name": "Billing Attorney"
        },
        {
          "id": 196,
          "name": "Everyone"
        },
        {
          "id": 294,
          "name": "Consult Attorney"
        }
      ],
      "salutation": null,
      "companyName": null,
      "firstName": "Mithun",
      "middleName": "",
      "lastName": "Daa",
      "suffix": null,
      "email": "mithundaa@yopmail.com",
      "maidenName": "",
      "nickName": "",
      "commonName": "",
      "jobTitle": "Employee",
      "employmentStartDate": "2020-08-01T00:00:00",
      "employmentEndDate": null,
      "isCompany": null,
      "isVisible": true,
      "preferredContactMethod": null,
      "doNotSchedule": false,
      "isInheritNotification": null,
      "initialJurisdictionId": null,
      "lastLoggedIn": null,
      "mondayOpenHours": "1900-01-01T07:00:00",
      "mondayCloseHours": "1900-01-01T14:00:00",
      "tuesdayOpenHours": "1900-01-01T09:30:00",
      "tuesdayCloseHours": "1900-01-01T16:30:00",
      "wednesdayOpenHours": "1900-01-01T01:00:00",
      "wednesdayCloseHours": "1900-01-01T17:00:00",
      "thursdayOpenHours": "1900-01-01T02:00:00",
      "thursdayCloseHours": "1900-01-01T16:30:00",
      "fridayOpenHours": "1900-01-01T09:30:00",
      "fridayCloseHours": "1900-01-01T18:30:00",
      "saturdayOpenHours": "1900-01-01T00:00:00",
      "saturdayCloseHours": "1900-01-01T00:00:00",
      "sundayOpenHours": "1900-01-01T00:00:00",
      "sundayCloseHours": "1900-01-01T00:00:00",
      "reportingManager": null,
      "approvingManager": {
        "id": 5046,
        "name": "Modi, Narendra"
      },
      "practiceManager": {
        "id": 5046,
        "name": "Modi, Narendra"
      },
      "primaryOffice": {
        "id": 1754,
        "name": "Office Billing 37"
      },
      "phones": [
        {
          "id": 62131,
          "number": "1234567890",
          "type": "primary",
          "isPrimary": true,
          "personId": 6728
        }
      ],
      "secondaryOffices": [
        {
          "id": 1779,
          "name": "38 Billing Office"
        },
        {
          "id": 1780,
          "name": "LEX-5416 Re-testing"
        },
        {
          "id": 1782,
          "name": "40 Billing Office"
        },
        {
          "id": 1784,
          "name": "8 Sept Office (1)"
        },
        {
          "id": 1785,
          "name": "8 Sept Office (2)"
        },
        {
          "id": 1787,
          "name": "15 Sept Dishant DND (1)"
        },
        {
          "id": 1791,
          "name": "16 Sept Dishant DND"
        },
        {
          "id": 1810,
          "name": "LEX-6356 Office 1"
        },
        {
          "id": 1811,
          "name": "LEX-6356 Office 2"
        },
        {
          "id": 1812,
          "name": "LEX-6356 Office 3"
        },
        {
          "id": 1819,
          "name": "LEX-6356 Office 4"
        },
        {
          "id": 1834,
          "name": "30 Sept LEX-6360 1"
        },
        {
          "id": 1837,
          "name": "30 Sept LEX-6360 2"
        },
        {
          "id": 1839,
          "name": "LEX-6362 Office 1"
        },
        {
          "id": 1840,
          "name": "LEX-6362 Office 2"
        },
        {
          "id": 1841,
          "name": "LEX-6362 Office 3"
        },
        {
          "id": 1848,
          "name": "6358 Office (1)"
        }
      ],
      "retainerPracticeAreas": [
        {
          "id": 73,
          "name": "Corporate Law"
        },
        {
          "id": 75,
          "name": "Criminal Law"
        }
      ],
      "initialConsultPracticeAreas": [
        {
          "id": 73,
          "name": "Corporate Law"
        },
        {
          "id": 75,
          "name": "Criminal Law"
        },
        {
          "id": 145,
          "name": "Accidents"
        },
        {
          "id": 151,
          "name": "Elder Law"
        },
        {
          "id": 162,
          "name": "Ananta Test"
        }
      ],
      "states": [
        {
          "id": 1,
          "name": "Alabama"
        },
        {
          "id": 2,
          "name": "Alaska"
        },
        {
          "id": 3,
          "name": "Arizona"
        },
        {
          "id": 4,
          "name": "Arkansas"
        }
      ],
      "groups": [
        {
          "id": 180,
          "name": "Responsible Attorney"
        },
        {
          "id": 181,
          "name": "Originating Attorney"
        },
        {
          "id": 193,
          "name": "Attorney"
        },
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 195,
          "name": "Billing Attorney"
        },
        {
          "id": 196,
          "name": "Everyone"
        },
        {
          "id": 294,
          "name": "Consult Attorney"
        },
        {
          "id": 333,
          "name": "jagat Group 1"
        }
      ],
      "profilePicture": null,
      "jobFamily": 0,
      "jobFamilyName": "Associate Attorney",
      "jobFamilyBaseRate": null,
      "jobFamilyIsCustom": null,
      "isActivated": true
    },
    {
      "id": 6731,
      "userName": "gitamaa@yopmail.com",
      "password": null,
      "role": [
        {
          "id": 180,
          "name": "Responsible Attorney"
        },
        {
          "id": 181,
          "name": "Originating Attorney"
        },
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 195,
          "name": "Billing Attorney"
        },
        {
          "id": 196,
          "name": "Everyone"
        },
        {
          "id": 294,
          "name": "Consult Attorney"
        }
      ],
      "salutation": null,
      "companyName": null,
      "firstName": "Gita",
      "middleName": "",
      "lastName": "Maa",
      "suffix": null,
      "email": "gitamaa@yopmail.com",
      "maidenName": "",
      "nickName": "",
      "commonName": "",
      "jobTitle": "Employee",
      "employmentStartDate": "2020-08-01T00:00:00",
      "employmentEndDate": null,
      "isCompany": null,
      "isVisible": true,
      "preferredContactMethod": null,
      "doNotSchedule": false,
      "isInheritNotification": null,
      "initialJurisdictionId": null,
      "lastLoggedIn": null,
      "mondayOpenHours": "1900-01-01T07:00:00",
      "mondayCloseHours": "1900-01-01T14:00:00",
      "tuesdayOpenHours": "1900-01-01T09:30:00",
      "tuesdayCloseHours": "1900-01-01T16:30:00",
      "wednesdayOpenHours": "1900-01-01T01:00:00",
      "wednesdayCloseHours": "1900-01-01T17:00:00",
      "thursdayOpenHours": "1900-01-01T02:00:00",
      "thursdayCloseHours": "1900-01-01T16:30:00",
      "fridayOpenHours": "1900-01-01T09:30:00",
      "fridayCloseHours": "1900-01-01T18:30:00",
      "saturdayOpenHours": "1900-01-01T00:00:00",
      "saturdayCloseHours": "1900-01-01T00:00:00",
      "sundayOpenHours": "1900-01-01T00:00:00",
      "sundayCloseHours": "1900-01-01T00:00:00",
      "reportingManager": null,
      "approvingManager": {
        "id": 5046,
        "name": "Modi, Narendra"
      },
      "practiceManager": {
        "id": 5046,
        "name": "Modi, Narendra"
      },
      "primaryOffice": {
        "id": 1754,
        "name": "Office Billing 37"
      },
      "phones": [
        {
          "id": 62134,
          "number": "1234596789",
          "type": "primary",
          "isPrimary": true,
          "personId": 6731
        }
      ],
      "secondaryOffices": [
        {
          "id": 1779,
          "name": "38 Billing Office"
        },
        {
          "id": 1782,
          "name": "40 Billing Office"
        },
        {
          "id": 1784,
          "name": "8 Sept Office (1)"
        },
        {
          "id": 1785,
          "name": "8 Sept Office (2)"
        },
        {
          "id": 1787,
          "name": "15 Sept Dishant DND (1)"
        },
        {
          "id": 1791,
          "name": "16 Sept Dishant DND"
        },
        {
          "id": 1810,
          "name": "LEX-6356 Office 1"
        },
        {
          "id": 1811,
          "name": "LEX-6356 Office 2"
        },
        {
          "id": 1812,
          "name": "LEX-6356 Office 3"
        },
        {
          "id": 1819,
          "name": "LEX-6356 Office 4"
        },
        {
          "id": 1840,
          "name": "LEX-6362 Office 2"
        },
        {
          "id": 1841,
          "name": "LEX-6362 Office 3"
        }
      ],
      "retainerPracticeAreas": [
        {
          "id": 145,
          "name": "Accidents"
        },
        {
          "id": 162,
          "name": "Ananta Test"
        },
        {
          "id": 73,
          "name": "Corporate Law"
        },
        {
          "id": 75,
          "name": "Criminal Law"
        }
      ],
      "initialConsultPracticeAreas": [
        {
          "id": 145,
          "name": "Accidents"
        },
        {
          "id": 162,
          "name": "Ananta Test"
        },
        {
          "id": 73,
          "name": "Corporate Law"
        },
        {
          "id": 75,
          "name": "Criminal Law"
        }
      ],
      "states": [
        {
          "id": 1,
          "name": "Alabama"
        },
        {
          "id": 2,
          "name": "Alaska"
        },
        {
          "id": 3,
          "name": "Arizona"
        },
        {
          "id": 4,
          "name": "Arkansas"
        },
        {
          "id": 5,
          "name": "California"
        }
      ],
      "groups": [
        {
          "id": 180,
          "name": "Responsible Attorney"
        },
        {
          "id": 181,
          "name": "Originating Attorney"
        },
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 195,
          "name": "Billing Attorney"
        },
        {
          "id": 196,
          "name": "Everyone"
        },
        {
          "id": 294,
          "name": "Consult Attorney"
        },
        {
          "id": 326,
          "name": "6394 8 Sept"
        }
      ],
      "profilePicture": null,
      "jobFamily": 0,
      "jobFamilyName": "Associate Attorney",
      "jobFamilyBaseRate": null,
      "jobFamilyIsCustom": null,
      "isActivated": true
    },
    {
      "id": 7020,
      "userName": "rbginger@email.com",
      "password": null,
      "role": [
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 196,
          "name": "Everyone"
        }
      ],
      "salutation": null,
      "companyName": null,
      "firstName": "Rebecca",
      "middleName": "",
      "lastName": "Gingerbread",
      "suffix": null,
      "email": "rbginger@email.com",
      "maidenName": "",
      "nickName": "",
      "commonName": "",
      "jobTitle": "Miss",
      "employmentStartDate": "2020-08-01T00:00:00",
      "employmentEndDate": null,
      "isCompany": null,
      "isVisible": true,
      "preferredContactMethod": null,
      "doNotSchedule": false,
      "isInheritNotification": null,
      "initialJurisdictionId": null,
      "lastLoggedIn": null,
      "mondayOpenHours": "1900-01-01T07:00:00",
      "mondayCloseHours": "1900-01-01T14:00:00",
      "tuesdayOpenHours": "1900-01-01T09:30:00",
      "tuesdayCloseHours": "1900-01-01T16:30:00",
      "wednesdayOpenHours": "1900-01-01T01:00:00",
      "wednesdayCloseHours": "1900-01-01T17:00:00",
      "thursdayOpenHours": "1900-01-01T02:00:00",
      "thursdayCloseHours": "1900-01-01T16:30:00",
      "fridayOpenHours": "1900-01-01T09:30:00",
      "fridayCloseHours": "1900-01-01T18:30:00",
      "saturdayOpenHours": "1900-01-01T01:30:00",
      "saturdayCloseHours": "1900-01-01T02:00:00",
      "sundayOpenHours": "1900-01-01T00:00:00",
      "sundayCloseHours": "1900-01-01T00:00:00",
      "reportingManager": null,
      "approvingManager": null,
      "practiceManager": null,
      "primaryOffice": {
        "id": 1654,
        "name": "1 Billing Office"
      },
      "phones": [
        {
          "id": 62324,
          "number": "4568765432",
          "type": "primary",
          "isPrimary": true,
          "personId": 7020
        }
      ],
      "secondaryOffices": [],
      "retainerPracticeAreas": [],
      "initialConsultPracticeAreas": [],
      "states": [],
      "groups": [
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 196,
          "name": "Everyone"
        }
      ],
      "profilePicture": null,
      "jobFamily": 0,
      "jobFamilyName": "Associate Attorney",
      "jobFamilyBaseRate": null,
      "jobFamilyIsCustom": null,
      "isActivated": false
    },
    {
      "id": 7043,
      "userName": "sgambhir@yopmail.com",
      "password": null,
      "role": [
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 196,
          "name": "Everyone"
        }
      ],
      "salutation": null,
      "companyName": null,
      "firstName": "Shubhangi ",
      "middleName": "",
      "lastName": "Gambhir",
      "suffix": null,
      "email": "sgambhir@yopmail.com",
      "maidenName": "",
      "nickName": "",
      "commonName": "",
      "jobTitle": "Engg",
      "employmentStartDate": "2020-08-20T00:00:00",
      "employmentEndDate": null,
      "isCompany": null,
      "isVisible": true,
      "preferredContactMethod": null,
      "doNotSchedule": false,
      "isInheritNotification": null,
      "initialJurisdictionId": null,
      "lastLoggedIn": null,
      "mondayOpenHours": "1900-01-01T09:00:00",
      "mondayCloseHours": "1900-01-01T18:30:00",
      "tuesdayOpenHours": "1900-01-01T09:00:00",
      "tuesdayCloseHours": "1900-01-01T18:30:00",
      "wednesdayOpenHours": "1900-01-01T09:00:00",
      "wednesdayCloseHours": "1900-01-01T18:30:00",
      "thursdayOpenHours": "1900-01-01T10:00:00",
      "thursdayCloseHours": "1900-01-01T17:30:00",
      "fridayOpenHours": "1900-01-01T10:00:00",
      "fridayCloseHours": "1900-01-01T17:30:00",
      "saturdayOpenHours": "1900-01-01T00:00:00",
      "saturdayCloseHours": "1900-01-01T00:00:00",
      "sundayOpenHours": "1900-01-01T00:00:00",
      "sundayCloseHours": "1900-01-01T00:00:00",
      "reportingManager": null,
      "approvingManager": null,
      "practiceManager": null,
      "primaryOffice": {
        "id": 1709,
        "name": " Andrews Office"
      },
      "phones": [
        {
          "id": 62338,
          "number": "4223423423",
          "type": "primary",
          "isPrimary": true,
          "personId": 7043
        }
      ],
      "secondaryOffices": [],
      "retainerPracticeAreas": [],
      "initialConsultPracticeAreas": [],
      "states": [],
      "groups": [
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 196,
          "name": "Everyone"
        },
        {
          "id": 361,
          "name": "Admin Setting TC1"
        }
      ],
      "profilePicture": null,
      "jobFamily": 0,
      "jobFamilyName": "Associate Attorney",
      "jobFamilyBaseRate": null,
      "jobFamilyIsCustom": null,
      "isActivated": true
    },
    {
      "id": 7147,
      "userName": "shushant@yopmail.com",
      "password": null,
      "role": [
        {
          "id": 180,
          "name": "Responsible Attorney"
        },
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 195,
          "name": "Billing Attorney"
        },
        {
          "id": 196,
          "name": "Everyone"
        },
        {
          "id": 294,
          "name": "Consult Attorney"
        }
      ],
      "salutation": null,
      "companyName": null,
      "firstName": "Shushant101",
      "middleName": "A",
      "lastName": "Rajput",
      "suffix": null,
      "email": "shushant@yopmail.com",
      "maidenName": "Shushant",
      "nickName": "shushant",
      "commonName": "",
      "jobTitle": "Actor",
      "employmentStartDate": "2020-08-27T00:00:00",
      "employmentEndDate": null,
      "isCompany": null,
      "isVisible": true,
      "preferredContactMethod": null,
      "doNotSchedule": false,
      "isInheritNotification": null,
      "initialJurisdictionId": null,
      "lastLoggedIn": null,
      "mondayOpenHours": "1900-01-01T09:00:00",
      "mondayCloseHours": "1900-01-01T18:30:00",
      "tuesdayOpenHours": "1900-01-01T09:00:00",
      "tuesdayCloseHours": "1900-01-01T18:30:00",
      "wednesdayOpenHours": "1900-01-01T09:00:00",
      "wednesdayCloseHours": "1900-01-01T18:30:00",
      "thursdayOpenHours": "1900-01-01T10:00:00",
      "thursdayCloseHours": "1900-01-01T17:30:00",
      "fridayOpenHours": "1900-01-01T10:00:00",
      "fridayCloseHours": "1900-01-01T17:30:00",
      "saturdayOpenHours": "1900-01-01T00:00:00",
      "saturdayCloseHours": "1900-01-01T00:00:00",
      "sundayOpenHours": "1900-01-01T00:00:00",
      "sundayCloseHours": "1900-01-01T00:00:00",
      "reportingManager": null,
      "approvingManager": {
        "id": 5143,
        "name": "Bhadresha, Dishant"
      },
      "practiceManager": {
        "id": 5143,
        "name": "Bhadresha, Dishant"
      },
      "primaryOffice": {
        "id": 1709,
        "name": " Andrews Office"
      },
      "phones": [
        {
          "id": 62404,
          "number": "3333333333",
          "type": "primary",
          "isPrimary": true,
          "personId": 7147
        },
        {
          "id": 62405,
          "number": "2222222222",
          "type": "cellphone",
          "isPrimary": false,
          "personId": 7147
        },
        {
          "id": 62406,
          "number": "4444444444",
          "type": "fax",
          "isPrimary": false,
          "personId": 7147
        }
      ],
      "secondaryOffices": [],
      "retainerPracticeAreas": [
        {
          "id": 145,
          "name": "Accidents"
        },
        {
          "id": 162,
          "name": "Ananta Test"
        },
        {
          "id": 73,
          "name": "Corporate Law"
        },
        {
          "id": 75,
          "name": "Criminal Law"
        },
        {
          "id": 151,
          "name": "Elder Law"
        },
        {
          "id": 148,
          "name": "Estate Planning"
        }
      ],
      "initialConsultPracticeAreas": [
        {
          "id": 145,
          "name": "Accidents"
        },
        {
          "id": 162,
          "name": "Ananta Test"
        },
        {
          "id": 73,
          "name": "Corporate Law"
        },
        {
          "id": 81,
          "name": "Estates & Trusts"
        },
        {
          "id": 148,
          "name": "Estate Planning"
        },
        {
          "id": 151,
          "name": "Elder Law"
        },
        {
          "id": 75,
          "name": "Criminal Law"
        }
      ],
      "states": [
        {
          "id": 1,
          "name": "Alabama"
        }
      ],
      "groups": [
        {
          "id": 180,
          "name": "Responsible Attorney"
        },
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 195,
          "name": "Billing Attorney"
        },
        {
          "id": 196,
          "name": "Everyone"
        },
        {
          "id": 294,
          "name": "Consult Attorney"
        },
        {
          "id": 333,
          "name": "jagat Group 1"
        }
      ],
      "profilePicture": null,
      "jobFamily": 0,
      "jobFamilyName": "Associate Attorney",
      "jobFamilyBaseRate": null,
      "jobFamilyIsCustom": null,
      "isActivated": false
    },
    {
      "id": 7152,
      "userName": "sachinm@yopmail.com",
      "password": null,
      "role": [
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 196,
          "name": "Everyone"
        }
      ],
      "salutation": null,
      "companyName": null,
      "firstName": "Sachin",
      "middleName": "",
      "lastName": "Mhetre",
      "suffix": null,
      "email": "sachinm@yopmail.com",
      "maidenName": "",
      "nickName": "",
      "commonName": "",
      "jobTitle": "Admin",
      "employmentStartDate": "2020-08-01T00:00:00",
      "employmentEndDate": null,
      "isCompany": null,
      "isVisible": true,
      "preferredContactMethod": null,
      "doNotSchedule": false,
      "isInheritNotification": null,
      "initialJurisdictionId": null,
      "lastLoggedIn": null,
      "mondayOpenHours": "1900-01-01T07:00:00",
      "mondayCloseHours": "1900-01-01T14:00:00",
      "tuesdayOpenHours": "1900-01-01T09:30:00",
      "tuesdayCloseHours": "1900-01-01T16:30:00",
      "wednesdayOpenHours": "1900-01-01T01:00:00",
      "wednesdayCloseHours": "1900-01-01T17:00:00",
      "thursdayOpenHours": "1900-01-01T02:00:00",
      "thursdayCloseHours": "1900-01-01T16:30:00",
      "fridayOpenHours": "1900-01-01T09:30:00",
      "fridayCloseHours": "1900-01-01T18:30:00",
      "saturdayOpenHours": "1900-01-01T01:30:00",
      "saturdayCloseHours": "1900-01-01T02:00:00",
      "sundayOpenHours": "1900-01-01T00:00:00",
      "sundayCloseHours": "1900-01-01T00:00:00",
      "reportingManager": null,
      "approvingManager": null,
      "practiceManager": null,
      "primaryOffice": {
        "id": 1654,
        "name": "1 Billing Office"
      },
      "phones": [
        {
          "id": 62409,
          "number": "2222222222",
          "type": "primary",
          "isPrimary": true,
          "personId": 7152
        }
      ],
      "secondaryOffices": [],
      "retainerPracticeAreas": [],
      "initialConsultPracticeAreas": [],
      "states": [],
      "groups": [
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 196,
          "name": "Everyone"
        },
        {
          "id": 334,
          "name": "admin"
        }
      ],
      "profilePicture": null,
      "jobFamily": 0,
      "jobFamilyName": "Associate Attorney",
      "jobFamilyBaseRate": null,
      "jobFamilyIsCustom": null,
      "isActivated": true
    },
    {
      "id": 7167,
      "userName": "dear@yopmail.com",
      "password": null,
      "role": [
        {
          "id": 180,
          "name": "Responsible Attorney"
        },
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 196,
          "name": "Everyone"
        },
        {
          "id": 294,
          "name": "Consult Attorney"
        }
      ],
      "salutation": null,
      "companyName": null,
      "firstName": "Dear",
      "middleName": "",
      "lastName": "One",
      "suffix": null,
      "email": "dear@yopmail.com",
      "maidenName": "",
      "nickName": "",
      "commonName": "",
      "jobTitle": "aa",
      "employmentStartDate": "2020-08-28T00:00:00",
      "employmentEndDate": null,
      "isCompany": null,
      "isVisible": true,
      "preferredContactMethod": null,
      "doNotSchedule": false,
      "isInheritNotification": null,
      "initialJurisdictionId": null,
      "lastLoggedIn": null,
      "mondayOpenHours": "1900-01-01T09:00:00",
      "mondayCloseHours": "1900-01-01T18:30:00",
      "tuesdayOpenHours": "1900-01-01T09:00:00",
      "tuesdayCloseHours": "1900-01-01T18:30:00",
      "wednesdayOpenHours": "1900-01-01T09:00:00",
      "wednesdayCloseHours": "1900-01-01T18:30:00",
      "thursdayOpenHours": "1900-01-01T10:00:00",
      "thursdayCloseHours": "1900-01-01T17:30:00",
      "fridayOpenHours": "1900-01-01T10:00:00",
      "fridayCloseHours": "1900-01-01T17:30:00",
      "saturdayOpenHours": "1900-01-01T00:00:00",
      "saturdayCloseHours": "1900-01-01T00:00:00",
      "sundayOpenHours": "1900-01-01T00:00:00",
      "sundayCloseHours": "1900-01-01T00:00:00",
      "reportingManager": null,
      "approvingManager": {
        "id": 5847,
        "name": "07th July, Employee"
      },
      "practiceManager": {
        "id": 5896,
        "name": "3548, LEX"
      },
      "primaryOffice": {
        "id": 1709,
        "name": " Andrews Office"
      },
      "phones": [
        {
          "id": 62422,
          "number": "2222222222",
          "type": "primary",
          "isPrimary": true,
          "personId": 7167
        }
      ],
      "secondaryOffices": [],
      "retainerPracticeAreas": [
        {
          "id": 145,
          "name": "Accidents"
        },
        {
          "id": 162,
          "name": "Ananta Test"
        }
      ],
      "initialConsultPracticeAreas": [
        {
          "id": 162,
          "name": "Ananta Test"
        },
        {
          "id": 73,
          "name": "Corporate Law"
        },
        {
          "id": 75,
          "name": "Criminal Law"
        }
      ],
      "states": [
        {
          "id": 1,
          "name": "Alabama"
        },
        {
          "id": 6,
          "name": "Colorado"
        },
        {
          "id": 2,
          "name": "Alaska"
        }
      ],
      "groups": [
        {
          "id": 180,
          "name": "Responsible Attorney"
        },
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 196,
          "name": "Everyone"
        },
        {
          "id": 294,
          "name": "Consult Attorney"
        },
        {
          "id": 333,
          "name": "jagat Group 1"
        }
      ],
      "profilePicture": null,
      "jobFamily": 0,
      "jobFamilyName": "Associate Attorney",
      "jobFamilyBaseRate": null,
      "jobFamilyIsCustom": null,
      "isActivated": false
    },
    {
      "id": 7206,
      "userName": "imAlexcarry@yopmail.com",
      "password": null,
      "role": [
        {
          "id": 180,
          "name": "Responsible Attorney"
        },
        {
          "id": 181,
          "name": "Originating Attorney"
        },
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 195,
          "name": "Billing Attorney"
        },
        {
          "id": 196,
          "name": "Everyone"
        }
      ],
      "salutation": null,
      "companyName": null,
      "firstName": "Alex",
      "middleName": "",
      "lastName": "Carry",
      "suffix": null,
      "email": "imAlexcarry@yopmail.com",
      "maidenName": "",
      "nickName": "",
      "commonName": "",
      "jobTitle": "AA",
      "employmentStartDate": "2020-08-06T00:00:00",
      "employmentEndDate": null,
      "isCompany": null,
      "isVisible": true,
      "preferredContactMethod": null,
      "doNotSchedule": false,
      "isInheritNotification": null,
      "initialJurisdictionId": null,
      "lastLoggedIn": null,
      "mondayOpenHours": "1900-01-01T09:00:00",
      "mondayCloseHours": "1900-01-01T18:30:00",
      "tuesdayOpenHours": "1900-01-01T09:00:00",
      "tuesdayCloseHours": "1900-01-01T18:30:00",
      "wednesdayOpenHours": "1900-01-01T09:00:00",
      "wednesdayCloseHours": "1900-01-01T18:30:00",
      "thursdayOpenHours": "1900-01-01T10:00:00",
      "thursdayCloseHours": "1900-01-01T17:30:00",
      "fridayOpenHours": "1900-01-01T10:00:00",
      "fridayCloseHours": "1900-01-01T17:30:00",
      "saturdayOpenHours": "1900-01-01T00:00:00",
      "saturdayCloseHours": "1900-01-01T00:00:00",
      "sundayOpenHours": "1900-01-01T00:00:00",
      "sundayCloseHours": "1900-01-01T00:00:00",
      "reportingManager": null,
      "approvingManager": null,
      "practiceManager": null,
      "primaryOffice": {
        "id": 1709,
        "name": " Andrews Office"
      },
      "phones": [
        {
          "id": 62462,
          "number": "7894446413",
          "type": "primary",
          "isPrimary": true,
          "personId": 7206
        }
      ],
      "secondaryOffices": [
        {
          "id": 1654,
          "name": "1 Billing Office"
        }
      ],
      "retainerPracticeAreas": [
        {
          "id": 145,
          "name": "Accidents"
        }
      ],
      "initialConsultPracticeAreas": [],
      "states": [],
      "groups": [
        {
          "id": 180,
          "name": "Responsible Attorney"
        },
        {
          "id": 181,
          "name": "Originating Attorney"
        },
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 195,
          "name": "Billing Attorney"
        },
        {
          "id": 196,
          "name": "Everyone"
        },
        {
          "id": 361,
          "name": "Admin Setting TC1"
        }
      ],
      "profilePicture": null,
      "jobFamily": 0,
      "jobFamilyName": "Associate Attorney",
      "jobFamilyBaseRate": null,
      "jobFamilyIsCustom": null,
      "isActivated": true
    },
    {
      "id": 7208,
      "userName": "mgevariy@codal.com",
      "password": null,
      "role": [
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 196,
          "name": "Everyone"
        }
      ],
      "salutation": null,
      "companyName": null,
      "firstName": "Mansi",
      "middleName": "",
      "lastName": "Gevariya",
      "suffix": null,
      "email": "mgevariy@codal.com",
      "maidenName": "",
      "nickName": "",
      "commonName": "",
      "jobTitle": "Lawyer",
      "employmentStartDate": "2020-08-01T00:00:00",
      "employmentEndDate": null,
      "isCompany": null,
      "isVisible": true,
      "preferredContactMethod": null,
      "doNotSchedule": false,
      "isInheritNotification": null,
      "initialJurisdictionId": null,
      "lastLoggedIn": null,
      "mondayOpenHours": "1900-01-01T09:00:00",
      "mondayCloseHours": "1900-01-01T18:30:00",
      "tuesdayOpenHours": "1900-01-01T09:00:00",
      "tuesdayCloseHours": "1900-01-01T18:30:00",
      "wednesdayOpenHours": "1900-01-01T09:00:00",
      "wednesdayCloseHours": "1900-01-01T18:30:00",
      "thursdayOpenHours": "1900-01-01T10:00:00",
      "thursdayCloseHours": "1900-01-01T17:30:00",
      "fridayOpenHours": "1900-01-01T10:00:00",
      "fridayCloseHours": "1900-01-01T17:30:00",
      "saturdayOpenHours": "1900-01-01T00:00:00",
      "saturdayCloseHours": "1900-01-01T00:00:00",
      "sundayOpenHours": "1900-01-01T00:00:00",
      "sundayCloseHours": "1900-01-01T00:00:00",
      "reportingManager": null,
      "approvingManager": null,
      "practiceManager": null,
      "primaryOffice": {
        "id": 1709,
        "name": " Andrews Office"
      },
      "phones": [
        {
          "id": 62464,
          "number": "9726896427",
          "type": "primary",
          "isPrimary": true,
          "personId": 7208
        },
        {
          "id": 62468,
          "number": "9726896428",
          "type": "cellphone",
          "isPrimary": true,
          "personId": 7208
        }
      ],
      "secondaryOffices": [],
      "retainerPracticeAreas": [],
      "initialConsultPracticeAreas": [],
      "states": [
        {
          "id": 1,
          "name": "Alabama"
        },
        {
          "id": 2,
          "name": "Alaska"
        },
        {
          "id": 3,
          "name": "Arizona"
        },
        {
          "id": 6,
          "name": "Colorado"
        },
        {
          "id": 7,
          "name": "Connecticut"
        },
        {
          "id": 8,
          "name": "Delaware"
        }
      ],
      "groups": [
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 196,
          "name": "Everyone"
        },
        {
          "id": 334,
          "name": "admin"
        }
      ],
      "profilePicture": null,
      "jobFamily": 0,
      "jobFamilyName": "Associate Attorney",
      "jobFamilyBaseRate": null,
      "jobFamilyIsCustom": null,
      "isActivated": true
    },
    {
      "id": 7213,
      "userName": "mgevariya@yopmail.com",
      "password": null,
      "role": [
        {
          "id": 180,
          "name": "Responsible Attorney"
        },
        {
          "id": 193,
          "name": "Attorney"
        },
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 195,
          "name": "Billing Attorney"
        },
        {
          "id": 196,
          "name": "Everyone"
        },
        {
          "id": 294,
          "name": "Consult Attorney"
        }
      ],
      "salutation": null,
      "companyName": null,
      "firstName": "Mansi",
      "middleName": "",
      "lastName": "Gevariya",
      "suffix": null,
      "email": "mgevariya@yopmail.com",
      "maidenName": "",
      "nickName": "",
      "commonName": "",
      "jobTitle": "Attorney",
      "employmentStartDate": "2020-08-01T00:00:00",
      "employmentEndDate": null,
      "isCompany": null,
      "isVisible": true,
      "preferredContactMethod": null,
      "doNotSchedule": false,
      "isInheritNotification": null,
      "initialJurisdictionId": null,
      "lastLoggedIn": null,
      "mondayOpenHours": "1900-01-01T09:00:00",
      "mondayCloseHours": "1900-01-01T18:30:00",
      "tuesdayOpenHours": "1900-01-01T09:00:00",
      "tuesdayCloseHours": "1900-01-01T18:30:00",
      "wednesdayOpenHours": "1900-01-01T09:00:00",
      "wednesdayCloseHours": "1900-01-01T18:30:00",
      "thursdayOpenHours": "1900-01-01T10:00:00",
      "thursdayCloseHours": "1900-01-01T17:30:00",
      "fridayOpenHours": "1900-01-01T10:00:00",
      "fridayCloseHours": "1900-01-01T17:30:00",
      "saturdayOpenHours": "1900-01-01T00:00:00",
      "saturdayCloseHours": "1900-01-01T00:00:00",
      "sundayOpenHours": "1900-01-01T00:00:00",
      "sundayCloseHours": "1900-01-01T00:00:00",
      "reportingManager": null,
      "approvingManager": null,
      "practiceManager": null,
      "primaryOffice": {
        "id": 1709,
        "name": " Andrews Office"
      },
      "phones": [
        {
          "id": 62469,
          "number": "9726896424",
          "type": "primary",
          "isPrimary": true,
          "personId": 7213
        },
        {
          "id": 62470,
          "number": "9726896424",
          "type": "cellphone",
          "isPrimary": false,
          "personId": 7213
        }
      ],
      "secondaryOffices": [],
      "retainerPracticeAreas": [
        {
          "id": 145,
          "name": "Accidents"
        }
      ],
      "initialConsultPracticeAreas": [
        {
          "id": 145,
          "name": "Accidents"
        }
      ],
      "states": [
        {
          "id": 1,
          "name": "Alabama"
        },
        {
          "id": 2,
          "name": "Alaska"
        },
        {
          "id": 3,
          "name": "Arizona"
        },
        {
          "id": 4,
          "name": "Arkansas"
        }
      ],
      "groups": [
        {
          "id": 180,
          "name": "Responsible Attorney"
        },
        {
          "id": 193,
          "name": "Attorney"
        },
        {
          "id": 194,
          "name": "Employee"
        },
        {
          "id": 195,
          "name": "Billing Attorney"
        },
        {
          "id": 196,
          "name": "Everyone"
        },
        {
          "id": 294,
          "name": "Consult Attorney"
        },
        {
          "id": 334,
          "name": "admin"
        }
      ],
      "profilePicture": null,
      "jobFamily": 0,
      "jobFamilyName": "Associate Attorney",
      "jobFamilyBaseRate": null,
      "jobFamilyIsCustom": null,
      "isActivated": true
    },
  ]
};

let gropListMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQyOTUxNzcsImV4cCI6MTYwNDMzODM3NywiaWF0IjoxNjA0Mjk1MTc3fQ.0rJ8s1AmKnMAKku96pZ1flqcd7pyO61yJh_jT0gbL8k",
  "results": [
    {
      "id": 179,
      "tenantId": 1006,
      "name": "TenantAdmin",
      "readOnly": true,
      "isVisible": true
    },
    {
      "id": 180,
      "tenantId": 1006,
      "name": "Responsible Attorney",
      "readOnly": true,
      "isVisible": true
    },
    {
      "id": 181,
      "tenantId": 1006,
      "name": "Originating Attorney",
      "readOnly": true,
      "isVisible": true
    },
    {
      "id": 182,
      "tenantId": 1006,
      "name": "Primary Contact",
      "readOnly": true,
      "isVisible": true
    },
    {
      "id": 183,
      "tenantId": 1006,
      "name": "General Counsel",
      "readOnly": true,
      "isVisible": true
    },
    {
      "id": 184,
      "tenantId": 1006,
      "name": "Billing Contact",
      "readOnly": true,
      "isVisible": true
    },
    {
      "id": 185,
      "tenantId": 1006,
      "name": "Expert Witness",
      "readOnly": true,
      "isVisible": true
    },
    {
      "id": 186,
      "tenantId": 1006,
      "name": "Opposing Counsel",
      "readOnly": false,
      "isVisible": true
    },
    {
      "id": 187,
      "tenantId": 1006,
      "name": "Consult Attorney",
      "readOnly": true,
      "isVisible": true
    },
    {
      "id": 188,
      "tenantId": 1006,
      "name": "Employee",
      "readOnly": true,
      "isVisible": true
    },
  ]
}

describe('GeneralinfoComponent', () => {
  let component: GeneralinfoComponent;
  let fixture: ComponentFixture<GeneralinfoComponent>;
  let employeeService: EmployeeService;
  let misc: MiscService;
  let securityGroupService: SecurityGroupService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
      ],
      declarations: [ GeneralinfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneralinfoComponent);
    employeeService = TestBed.get(EmployeeService);
    misc = TestBed.get(MiscService);
    securityGroupService = TestBed.get(SecurityGroupService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('createForm should called in ngOnInIt', () => {
    component.ngOnInit();

    let formInIt = {
      cellPhoneNumber: "",
      commonName: "",
      email: "",
      employmentEndDate: null,
      employmentStartDate: "",
      fax: "",
      firstName: "",
      initialConsultations: false,
      jobFamily: null,
      jobTitle: "",
      lastName: "",
      maidenName: "",
      middleName: "",
      nickName: "",
      primaryOffice: null,
      primaryPhoneNumber: "",
      retainer: false,
      states: []
    }
    expect(component.employeeForm.value).toEqual(formInIt);
  });

  it('getJobList should called in ngOnInIt', () => {
    let res = {body: JSON.stringify(jobListMock)};
    spyOn(component, 'getJobList').and.callThrough();
    spyOn(employeeService, 'v1EmployeeJobFamilyGet$Response').and.returnValue(of(res as any))

    component.ngOnInit();

    expect(component.getJobList).toHaveBeenCalled();
    expect(employeeService.v1EmployeeJobFamilyGet$Response).toHaveBeenCalled();
    expect(component.jobList.length).toBe(10);
  });

  it('getOffices should called in ngOnInIt', () => {
    let res = {body: JSON.stringify(officeListMock)};
    spyOn(component, 'getOffices').and.callThrough();
    spyOn(misc, 'v1MiscOfficesGet$Response').and.returnValue(of(res as any));
    let localDataMock = {
      "data": {
        "primaryOffice": {
          "id": 1709
        },
        "secondaryOffices": [{
          "id": 1654
        }]
      }
    };
    UtilsHelper.setObject('employee_general', localDataMock);

    component.ngOnInit();

    
    expect(component.employeeForm.value.primaryOffice).toBe(1709);
    expect(component.sndryOfficeSelected.length).toBe(1);
    expect(component.sndryOfficeSelected[0]).toBe(1654);
    expect(component.getOffices).toHaveBeenCalled();
    expect(misc.v1MiscOfficesGet$Response).toHaveBeenCalled();
    expect(component.officeList.length).toBe(10);
    expect(component.officeList[1].checked).toBe(true);
    expect()
  });

  it('getPractices should called in ngOnInIt', () => {
    let res = {body: JSON.stringify(jobFamilyListMock)};
    spyOn(component, 'getPractices').and.callThrough();
    spyOn(misc, 'v1MiscPracticesGet$Response').and.returnValue(of(res as any));
    let localDataMock = {
      "data": {
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
      }
    };
    UtilsHelper.setObject('employee_general', localDataMock);

    component.ngOnInit();

    expect(component.getPractices).toHaveBeenCalled();
    expect(misc.v1MiscPracticesGet$Response).toHaveBeenCalled();
    expect(component.retainerPracticeArea.length).toBe(1);
    expect(component.practiceList[0].checked).toBe(true);
    expect(component.initialConsulPracticeArea.length).toBe(2);
    expect(component.practiceListIC[1].checked).toBe(true);
    expect(component.practiceListIC[2].checked).toBe(true);
    expect(component.practiceList.length).toBe(10);
    expect(component.practiceListIC.length).toBe(10);
  });

  it('getState should called in ngOnInIt', () => {
    let res = {body: JSON.stringify(stateListMock)};
    spyOn(component, 'getState').and.callThrough();
    spyOn(misc, 'v1MiscStatesGet$Response').and.returnValue(of(res as any));

    let localDataMock = {
      "data": {
        "states": [
          {
            "id": 1
          },
          {
            "id": 2
          }
        ],
      }
    };
    UtilsHelper.setObject('employee_general', localDataMock);
    component.ngOnInit();

    expect(component.getState).toHaveBeenCalled();
    expect(misc.v1MiscStatesGet$Response).toHaveBeenCalled();
    expect(component.employeeForm.value.states.length).toBe(2);
    expect(component.stateList.length).toBe(10);
  });

  it('getEmployees should called in ngOnInIt', () => {
    let res = {body: JSON.stringify(employeeListMock)};
    spyOn(component, 'getEmployees').and.callThrough();
    spyOn(misc, 'v1MiscEmployeesActiveGet$Response').and.returnValue(of(res as any));
    spyOn(component, 'addFormcontrol').and.callThrough();
    let localDataMock = {
      "data": {
        "firstName": "first name",
        "middleName": "middle name",
        "lastName": "last name",
        "approvingManager": {
          "id": 6728
        },
        "practiceManager": {
          "id": 6728
        },
        "reportingManager": {
          "id": 6728
        },
      }
    };
    UtilsHelper.setObject('employee_general', localDataMock);

    component.ngOnInit();

    expect(component.getEmployees).toHaveBeenCalled();
    expect(misc.v1MiscEmployeesActiveGet$Response).toHaveBeenCalled();
    setTimeout(() => {
      expect(component.employeeForm.value.directManager).toBe(6728);
      expect(component.employeeForm.value.approvingManager).toBe(6728);
      expect(component.employeeForm.value.practiceManager).toBe(6728);
    }, 300);
    expect(component.employeeList.length).toBe(11);
    expect(component.noEmployees).toBe(false);
    expect(component.addFormcontrol).toHaveBeenCalled();
    expect(component.reporting_relations).toBe(true);
  });

  it('getSecurityGroup should called in ngOnInIt', () => {
    let res = JSON.stringify(gropListMock);
    spyOn(component, 'getSecurityGroup').and.callThrough();
    spyOn(securityGroupService, 'v1SecurityGroupGet').and.returnValue(of(res as any));
    let localDataMock = {
      "data": {
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
      }
    };
    UtilsHelper.setObject('employee_general', localDataMock);
    component.ngOnInit();

    expect(component.getSecurityGroup).toHaveBeenCalled();
    expect(securityGroupService.v1SecurityGroupGet).toHaveBeenCalled();
    expect(component.groupsSelected.length).toBe(1);
    expect(component.groupList[0].checked).toBe(true);
    expect(component.groupList[0].disabled).toBe(false);
    expect(component.groupList.length).toBe(1);
    expect(component.employeeGroup).toEqual(gropListMock.results[9]);
    expect(component.consultAttorneyGroup).toEqual(gropListMock.results[8]);
    expect(component.responsibleAttorneyGroup).toEqual(gropListMock.results[1]);
  });

  it('email is already exist check', () => {
    spyOn(component, 'checkEmailExistence').and.callThrough();
    spyOn(misc, 'v1MiscEmailCheckGet').and.returnValue(of(JSON.stringify({results: true}) as any));
    const emailField = fixture.debugElement.nativeElement.querySelector('#email-address');
    emailField.value = 'unittest@yopmail.com';
    emailField.dispatchEvent(new Event('input'));
    emailField.dispatchEvent(new Event('blur'));

    fixture.detectChanges();
    
    
    expect(component.checkEmailExistence).toHaveBeenCalled();
    expect(component.employeeForm.controls.email.valid).toBe(true);
    expect(misc.v1MiscEmailCheckGet).toHaveBeenCalled();
    expect(component.emailExistence).toBe(true);
  });

  it('email is invalid check', () => {
    const emailField = fixture.debugElement.nativeElement.querySelector('#email-address');
    emailField.value = 'unittest@unittest';
    emailField.dispatchEvent(new Event('input'));
    emailField.dispatchEvent(new Event('blur'));

    fixture.detectChanges();
    expect(component.employeeForm.controls.email.valid).toBe(false);
  });

  it('set file upload spyon', () => {
    spyOn(component, 'uploadFileDragAndDrop').and.callThrough();
    spyOn(component, 'uploadFile').and.callThrough();

    let file = new File(['test'], 'test.png', { type: 'image/png' });
    component.uploadFileDragAndDrop([file])

    expect(component.uploadFileDragAndDrop).toHaveBeenCalled();
    expect(component.uploadFile).toHaveBeenCalled();
  });
  
  it('`general info` on next click save to localStorage', () => {

    component.addFormcontrol(false);
    component.reporting_relations = true;
    fixture.detectChanges();
    component.employeeForm.patchValue({
      firstName: 'first name',
      middleName: 'middle name',
      lastName: 'last name',
      maidenName: 'maiden name',
      nickName: 'nick name',
      commonName: 'common name',
      email: 'unittest@yopmail.com',
      jobTitle: 'job title',
      jobFamily: 70,
      primaryPhoneNumber: 1111111111,
      cellPhoneNumber: 2222222222,
      fax: 3333333333,
      primaryOffice: 1709,
      retainer: true,
      initialConsultations: true,
      employmentStartDate: '11/03/2020',
      directManager: 6728,
      approvingManager: 6728,
      practiceManager: 6728
    });
    const formArray: FormArray = component.employeeForm.get('states') as FormArray;
    formArray.push(new FormControl(1));
    formArray.push(new FormControl(2));
    component.employeeForm.updateValueAndValidity();
    component.retainerPracticeArea = [168];
    component.initialConsulPracticeArea = [145,162];
    component.isDoNotSchedule = false;
    component.groupsSelected = [186];
    component.employeeGroup = gropListMock.results[9];
    component.consultAttorneyGroup = gropListMock.results[8];
    component.responsibleAttorneyGroup = gropListMock.results[1];
    component.sndryOfficeSelected = [1654];
    fixture.detectChanges();

    
    component.next();

    let localData = UtilsHelper.getObject('employee_general');
    let localDataImg = UtilsHelper.getObject('employee_profile');
    expect(localDataImg).toBeNull();
    expect(localData.data.DoNotSchedule).toBe(false);
    expect(localData.data.approvingManager.id).toBe(6728);
    expect(localData.data.cellPhoneNumber).toBe(2222222222);
    expect(localData.data.commonName).toBe('common name');
    expect(localData.data.directManager).toBe(6728);
    expect(localData.data.email).toBe("unittest@yopmail.com");
    expect(localData.data.employmentEndDate).toBeNull();
    expect(localData.data.employmentStartDate).toContain('2020-11-03');
    expect(localData.data.fax).toBe(3333333333);
    expect(localData.data.firstName).toBe("first name");
    expect(localData.data.groups.length).toBe(4);
    expect(localData.data.initialConsultPracticeAreas.length).toBe(2);
    expect(localData.data.initialConsultations).toBe(true);
    expect(localData.data.jobFamily).toBe(70);
    expect(localData.data.jobTitle).toBe("job title");
    expect(localData.data.lastName).toBe("last name");
    expect(localData.data.maidenName).toBe("maiden name");
    expect(localData.data.middleName).toBe("middle name");
    expect(localData.data.nickName).toBe("nick name");
    expect(localData.data.password).toBe("password");
    expect(localData.data.phones.length).toBe(3);
    expect(localData.data.practiceManager.id).toBe(6728);
    expect(localData.data.primaryOffice.id).toBe(1709);
    expect(localData.data.primaryPhoneNumber).toBe(1111111111);
    expect(localData.data.reportingManager.id).toBe(6728);
    expect(localData.data.retainer).toBe(true);
    expect(localData.data.retainerPracticeAreas.length).toBe(1);
    expect(localData.data.role[0].name).toBe("Employee");
    expect(localData.data.states.length).toBe(2);
    expect(localData.data.username).toBe('unittest@yopmail.com');
    expect(localData.data.secondaryOffices.length).toBe(1, '1654');
  });

  it('`general info` should return if in localStorage', () => {
    let localDataMock = {
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
    UtilsHelper.setObject('employee_general', localDataMock);
    spyOn(component, 'updateEmployeeForm').and.callThrough();

    component.ngOnInit();

    let employeeData = component.employeeForm.value;
    expect(component.updateEmployeeForm).toHaveBeenCalled();
    expect(employeeData.firstName).toBe("first name");
    expect(employeeData.middleName).toBe("middle name");
    expect(employeeData.lastName).toBe("last name");
    expect(employeeData.maidenName).toBe("maiden name");
    expect(employeeData.nickName).toBe("nick name");
    expect(employeeData.commonName).toBe("common name");

    expect(employeeData.jobTitle).toBe("job title");
    expect(employeeData.jobFamily).toBe(70);
    expect(employeeData.email).toBe("unittest@yopmail.com");
    expect(employeeData.primaryPhoneNumber).toBe(1111111111);
    expect(employeeData.cellPhoneNumber).toBe(2222222222);
    expect(employeeData.fax).toBe(3333333333);
    expect(employeeData.retainer).toBe(true);
    expect(employeeData.initialConsultations).toBe(true);
    expect(employeeData.employmentStartDate).toContain('2020-11-03');
  });
});
