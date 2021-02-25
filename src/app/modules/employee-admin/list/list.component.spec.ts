import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import * as _ from 'lodash';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { reducers } from 'src/app/store';
import { jwtValidation } from 'src/common/CommonService/jwtValidation.service';
import { AuthService, EmployeeService, MiscService, NoteService } from 'src/common/swagger-providers/services';
import { SharedModule } from '../../shared/shared.module';
import { UtilsHelper } from '../../shared/utils.helper';
import { ListComponent } from './list.component';

let officelistMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQwNDEyNzIsImV4cCI6MTYwNDA4NDQ3MiwiaWF0IjoxNjA0MDQxMjcyfQ.3Pj2L-SH_8Ywxv95eXmAsYgIkXcVqRjg_cTAt27anR8",
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
    }
  ]
};

let employeeListMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQwNDEyNzIsImV4cCI6MTYwNDA4NDQ3MiwiaWF0IjoxNjA0MDQxMjcyfQ.3Pj2L-SH_8Ywxv95eXmAsYgIkXcVqRjg_cTAt27anR8",
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
  ],
  "status": 200
};

let columunMock = [
  {Name: "id", isChecked: true},
  {Name: "userName", isChecked: true},
  {Name: "password"},
  {Name: "role"},
  {Name: "salutation"},
  {Name: "companyName"},
  {Name: "firstName"},
  {Name: "middleName"},
  {Name: "lastName"},
  {Name: "suffix"},
  {Name: "email"},
  {Name: "maidenName"},
  {Name: "nickName"},
  {Name: "commonName"},
  {Name: "jobTitle"},
  {Name: "employmentStartDate"},
  {Name: "employmentEndDate"},
  {Name: "isCompany"},
  {Name: "isVisible"},
  {Name: "preferredContactMethod"},
  {Name: "doNotSchedule"},
  {Name: "isInheritNotification"},
  {Name: "initialJurisdictionId"},
  {Name: "lastLoggedIn"},
  {Name: "mondayOpenHours"},
  {Name: "mondayCloseHours"},
  {Name: "tuesdayOpenHours"},
  {Name: "tuesdayCloseHours"},
  {Name: "wednesdayOpenHours"},
  {Name: "wednesdayCloseHours"},
  {Name: "thursdayOpenHours"},
  {Name: "thursdayCloseHours"},
  {Name: "fridayOpenHours"},
  {Name: "fridayCloseHours"},
  {Name: "saturdayOpenHours"},
  {Name: "saturdayCloseHours"},
  {Name: "sundayOpenHours"},
  {Name: "sundayCloseHours"},
  {Name: "reportingManager"},
  {Name: "approvingManager"},
  {Name: "practiceManager"},
  {Name: "primaryOffice"},
  {Name: "phones"},
  {Name: "secondaryOffices"},
  {Name: "retainerPracticeAreas"},
  {Name: "initialConsultPracticeAreas"},
  {Name: "states"},
  {Name: "groups"},
  {Name: "profilePicture"},
  {Name: "jobFamily"},
  {Name: "jobFamilyName"},
  {Name: "jobFamilyBaseRate"},
  {Name: "jobFamilyIsCustom"},
  {Name: "isActivated"},
  {Name: "status"},
];
describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;
  let misc: MiscService;
  let employeeService: EmployeeService;
  let exporttocsvService: ExporttocsvService;
  let noteService: NoteService;
  let authService: AuthService;
  let JWTservice: jwtValidation;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        SharedModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
        StoreModule.forRoot(reducers),
      ],
      declarations: [
        ListComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListComponent);
    misc =  TestBed.get(MiscService);
    employeeService = TestBed.get(EmployeeService);
    exporttocsvService = TestBed.get(ExporttocsvService);
    noteService = TestBed.get(NoteService);
    authService = TestBed.get(AuthService);
    JWTservice = TestBed.get(jwtValidation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  beforeEach(() => {
    UtilsHelper.setObject('tenantId', 1006);
  });

  afterEach(() => {
    UtilsHelper.removeObject('tenantId');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('heading should be `Employees`', () => {
    const heading = fixture.debugElement.nativeElement.querySelector('.heading');
    expect(heading.innerText).toContain('Employees');
  });

  it('employee, office, tenantId should called in ngOnInIt', () => {
    let resOffice = {body: JSON.stringify(officelistMock)}
    let resEmployee = {body: JSON.stringify(employeeListMock)}

    spyOn(component, 'getOffices').and.callThrough();
    spyOn(misc, 'v1MiscOfficesGet$Response').and.returnValue(of(resOffice as any));

    spyOn(component, 'getDetails').and.callThrough();
    spyOn(employeeService, 'v1EmployeesGet$Response').and.returnValue(of(resEmployee as any));

    component.ngOnInit();
    fixture.detectChanges();
    
    expect(component.getOffices).toHaveBeenCalled();
    expect(component.getDetails).toHaveBeenCalled();
    expect(component.columnList.length).toBe(55);
    expect(component.officeList.length).toBe(10);
    expect(component.rows.length).toBe(10);
    expect(component.oriArr.length).toBe(10);
    expect(component.isLoading).toBe(false);
    expect(component.tenantId).toBe(1006);
  });

  it('Permission test on actions', () => {
    component.permissionList.EMPLOYEE_MANAGEMENTisAdmin = true;

    fixture.detectChanges();

    const csvBtn = fixture.debugElement.nativeElement.querySelector('#export-to-csv');
    expect(csvBtn.innerText).toContain('Export to CSV');
    
    const addNewBtn = fixture.debugElement.nativeElement.querySelector('#add-new-employee');
    expect(addNewBtn.innerText).toContain('Add New Employee');
  });

  it('search employee should filtered employees', () => {
    component.rows = employeeListMock.results;
    component.oriArr = employeeListMock.results;
    component.searchText = 'Actor';
    spyOn(component, 'applyFilterPrimaryOffice').and.callThrough();
    spyOn(component, 'updateDatatableFooterPage').and.callThrough();
    fixture.detectChanges();

    let inputSearch = fixture.debugElement.nativeElement.querySelector('#search-text');
    let e = new KeyboardEvent("keyup", {
      key: "a",
      bubbles: true,
      cancelable: true,
    });
    inputSearch.dispatchEvent(e);

    expect(component.searchText).toContain('Actor');
    expect(component.rows.length).toBe(1);
    expect(component.applyFilterPrimaryOffice).toHaveBeenCalled();
    expect(component.updateDatatableFooterPage).toHaveBeenCalled();
  });

  it('office filter should return filtered employees', () => {
    component.rows = employeeListMock.results;
    component.oriArr = employeeListMock.results;
    component.selectedOffice = [1709, 1654];
    spyOn(component, 'applyFilterPrimaryOffice').and.callThrough();
    
    component.applyFilterPrimaryOffice();

    expect(component.rows.length).toBe(8);
    expect(component.applyFilterPrimaryOffice).toHaveBeenCalled();
  });


  it('status filter should return filtered employees', () => {
    component.rows = employeeListMock.results;
    component.oriArr = employeeListMock.results;
    component.selectedStatus = [1, 2];
    spyOn(component, 'applyFilterPrimaryOffice').and.callThrough();
    
    component.applyFilterPrimaryOffice();

    expect(component.rows.length).toBe(7);
    expect(component.applyFilterPrimaryOffice).toHaveBeenCalled();
  });

  it('export csv model should open and download csv if is employee admin permission', () => {
    component.columnList = columunMock;
    component.rows = employeeListMock.results;
    component.oriArr = employeeListMock.results;
    component.permissionList.EMPLOYEE_MANAGEMENTisAdmin = true;
    spyOn(component, 'open').and.callThrough();
    spyOn(component, 'ExportToCSV').and.callThrough();
    spyOn(exporttocsvService, 'downloadFile').and.callThrough();

    fixture.detectChanges();

    let exportCsvModel = fixture.debugElement.nativeElement.querySelector('#export-to-csv');
    exportCsvModel.click();

    fixture.detectChanges();

    let exportCsvBtn1 = document.querySelector('#export-btn');
    exportCsvBtn1.dispatchEvent(new Event('click'));
    expect(component.open).toHaveBeenCalled();
    expect(component.ExportToCSV).toHaveBeenCalled();
    expect(exporttocsvService.downloadFile).toHaveBeenCalled();
  });

  it('reactivate employee with entered note text', () => {
    /* temp status */
    let clone = _.cloneDeep(employeeListMock);
    clone.results[0].isVisible = false

    component.rows = clone.results;
    component.oriArr = clone.results;
    component.currentActive = 0;
    spyOn(component, 'open').and.callThrough();
    spyOn(component, 'reactivateEmp').and.callThrough();
    spyOn(employeeService, 'v1EmployeeReactivateIdPut$Response').and.returnValue(of(true as any));
    spyOn(component, 'getDetails').and.callThrough();
    spyOn(component, 'saveNotes').and.callThrough();
    spyOn(noteService, 'v1NotePersonAddPersonIdPost$Json').and.returnValue(of(true as any));

    fixture.detectChanges();

    let exportCsvModel = fixture.debugElement.nativeElement.querySelector('#reactivate-user-index-1');
    exportCsvModel.click();

    fixture.detectChanges();

    component.noteForm.patchValue({
      id: 0,
      applicableDate: null,
      content: 'unit test note',
      isVisibleToClient: false
    });

    component.noteForm.updateValueAndValidity();

    let reactivateBtn = document.querySelector('#reactivate-employee');
    reactivateBtn.dispatchEvent(new Event('click'));

    expect(component.open).toHaveBeenCalled();
    expect(component.reactivateEmp).toHaveBeenCalled();
    expect(component.reactivateEmployee.id).toBe(employeeListMock.results[0].id);
    expect(employeeService.v1EmployeeReactivateIdPut$Response).toHaveBeenCalled();
    expect(component.getDetails).toHaveBeenCalled();
    expect(component.saveNotes).toHaveBeenCalled();
    expect(noteService.v1NotePersonAddPersonIdPost$Json).toHaveBeenCalled();
    expect(component.showForm).toBe(false);
  });

  it('deactivate employee check and show deactivate confirm box', () => {
    let res = {results: 'DEACTIVATE'};
    component.rows = employeeListMock.results;
    component.oriArr = employeeListMock.results;
    spyOn(component, 'empDeactivate').and.callThrough();
    spyOn(employeeService, 'v1EmployeeCheckDeactivateIdPut').and.returnValue(of(JSON.stringify(res) as any));
    spyOn(component, 'confirmEmpDeactivate').and.callThrough();

    fixture.detectChanges();
    let deaactiveAnchor = fixture.debugElement.nativeElement.querySelector('#deactivate-user-index-0');
    deaactiveAnchor.click();

    expect(component.empDeactivate).toHaveBeenCalled();
    expect(employeeService.v1EmployeeCheckDeactivateIdPut).toHaveBeenCalled();
    expect(component.confirmEmpDeactivate).toHaveBeenCalled();
  });

  it('deactivate employee check and return ATTORNEY warning', () => {
    let res = {results: 'ATTORNEY'};
    component.rows = employeeListMock.results;
    component.oriArr = employeeListMock.results;
    spyOn(component, 'empDeactivate').and.callThrough();
    spyOn(employeeService, 'v1EmployeeCheckDeactivateIdPut').and.returnValue(of(JSON.stringify(res) as any));
    spyOn(component, 'showWarningPopup').and.callThrough();

    fixture.detectChanges();
    let deaactiveAnchor = fixture.debugElement.nativeElement.querySelector('#deactivate-user-index-0');
    deaactiveAnchor.click();
    
    expect(component.empDeactivate).toHaveBeenCalled();
    expect(employeeService.v1EmployeeCheckDeactivateIdPut).toHaveBeenCalled();
    expect(component.showWarningPopup).toHaveBeenCalled();
  });

  it('deactivate employee check and return MATTER warning', () => {
    let res = {results: 'MATTER'};
    component.rows = employeeListMock.results;
    component.oriArr = employeeListMock.results;
    spyOn(component, 'empDeactivate').and.callThrough();
    spyOn(employeeService, 'v1EmployeeCheckDeactivateIdPut').and.returnValue(of(JSON.stringify(res) as any));
    spyOn(component, 'showWarningPopup').and.callThrough();

    fixture.detectChanges();
    let deaactiveAnchor = fixture.debugElement.nativeElement.querySelector('#deactivate-user-index-0');
    deaactiveAnchor.click();
    
    expect(component.empDeactivate).toHaveBeenCalled();
    expect(employeeService.v1EmployeeCheckDeactivateIdPut).toHaveBeenCalled();
    expect(component.showWarningPopup).toHaveBeenCalled();
  });

  it('deactivate employee check and return REPORTING warning', () => {
    let res = {results: 'REPORTING'};
    component.rows = employeeListMock.results;
    component.oriArr = employeeListMock.results;
    spyOn(component, 'empDeactivate').and.callThrough();
    spyOn(employeeService, 'v1EmployeeCheckDeactivateIdPut').and.returnValue(of(JSON.stringify(res) as any));
    spyOn(component, 'showWarningPopup').and.callThrough();

    fixture.detectChanges();
    let deaactiveAnchor = fixture.debugElement.nativeElement.querySelector('#deactivate-user-index-0');
    deaactiveAnchor.click();
    
    expect(component.empDeactivate).toHaveBeenCalled();
    expect(employeeService.v1EmployeeCheckDeactivateIdPut).toHaveBeenCalled();
    expect(component.showWarningPopup).toHaveBeenCalled();
  });

  it('resend activation email', () => {
    let clone = _.cloneDeep(employeeListMock);
    clone.results[0].isActivated = false;
    
    spyOn(authService, 'v1AuthPasswordResetRequestPost$Json$Response').and.returnValue(of(true as any));
    spyOn(JWTservice, 'v1UsersChangeStatusPost$Response').and.returnValue(of(true as any));

    component.rsndActEml(clone.results[0]);

    expect(authService.v1AuthPasswordResetRequestPost$Json$Response).toHaveBeenCalled();
    expect(JWTservice.v1UsersChangeStatusPost$Response).toHaveBeenCalled();
  });
});
