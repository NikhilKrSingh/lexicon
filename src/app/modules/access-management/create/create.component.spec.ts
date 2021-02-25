import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StoreModule } from '@ngrx/store';
import { ToastrModule } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { reducers } from 'src/app/store';
import { EmployeeService, MiscService, ModuleConfigurationService, NotificationService, ObjectVisibilityService, SecurityGroupService } from 'src/common/swagger-providers/services';
import { SharedModule } from '../../shared/shared.module';
import { CreateComponent } from './create.component';

let emailTemplateMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDUwNzIxMjAsImV4cCI6MTYwNTExNTMyMCwiaWF0IjoxNjA1MDcyMTIwfQ._zvatW_7NdrmJnpu_XTx86-tN0J0M9_HABAhzX9SJKQ",
  "results": [
    {
      "id": 6,
      "emailTemplateCode": "MATTER_PAYMENT_FAILED_ATTORNEY",
      "subject": "Auto-payment has failed for your matter",
      "body": null,
      "isReadOnly": false,
      "description": "An auto-payment has failed on your matter.",
      "templateGroupId": 4,
      "templateGroupName": "Billing",
      "isVisible": true
    },
    {
      "id": 7,
      "emailTemplateCode": "ECHECK_TO_TRUST_PAYMENT_FAILED",
      "subject": "Your payment to trust has failed",
      "body": null,
      "isReadOnly": false,
      "description": "E-check payment to trust failed.",
      "templateGroupId": 9,
      "templateGroupName": "Trust Accounting",
      "isVisible": true
    },
    {
      "id": 11,
      "emailTemplateCode": "TRUST_TO_ECHECK_REFUND_FAILED",
      "subject": "Your refund from trust has failed",
      "body": null,
      "isReadOnly": false,
      "description": "E-Check refund from trust failed.",
      "templateGroupId": 9,
      "templateGroupName": "Trust Accounting",
      "isVisible": true
    },
    {
      "id": 12,
      "emailTemplateCode": "CLIENT_EMAIL_UPDATE",
      "subject": "Your email address has been updated",
      "body": null,
      "isReadOnly": false,
      "description": "A client's or corporate contact's email address has been updated.",
      "templateGroupId": 10,
      "templateGroupName": "Contact",
      "isVisible": true
    },
    {
      "id": 13,
      "emailTemplateCode": "CLIENT_PHONE_NUMBER_UPDATE",
      "subject": "Your phone number has been updated",
      "body": null,
      "isReadOnly": false,
      "description": "A client's or corporate contact's primary phone number has been updated.",
      "templateGroupId": 10,
      "templateGroupName": "Contact",
      "isVisible": true
    },
    {
      "id": 25,
      "emailTemplateCode": "EMPLOYEE_ASSIGNED_CLIENT",
      "subject": "You have a new potential client: [PotentialClientFullName]",
      "body": null,
      "isReadOnly": false,
      "description": "You've been assigned as the Consult Attorney on a new potential client.",
      "templateGroupId": 2,
      "templateGroupName": "Potential Client",
      "isVisible": true
    }
  ]
};

let moduleListMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDUwNzIxMjAsImV4cCI6MTYwNTExNTMyMCwiaWF0IjoxNjA1MDcyMTIwfQ._zvatW_7NdrmJnpu_XTx86-tN0J0M9_HABAhzX9SJKQ",
  "results": [
    {
      "id": 1,
      "moduleName": "Tenant Configuration",
      "note": "",
      "code": "TENANT_CONFIGURATION",
      "deny": true,
      "viewOnly": false,
      "edit": false,
      "admin": true,
      "isActive": true
    },
    {
      "id": 2,
      "moduleName": "Access Management",
      "note": "",
      "code": "ACCESS_MANAGEMENT",
      "deny": true,
      "viewOnly": false,
      "edit": false,
      "admin": true,
      "isActive": true
    },
    {
      "id": 3,
      "moduleName": "Office Management",
      "note": "",
      "code": "OFFICE_MANAGEMENT",
      "deny": false,
      "viewOnly": true,
      "edit": false,
      "admin": true,
      "isActive": true
    },
    {
      "id": 4,
      "moduleName": "Employee Management",
      "note": "",
      "code": "EMPLOYEE_MANAGEMENT",
      "deny": false,
      "viewOnly": true,
      "edit": false,
      "admin": true,
      "isActive": true
    },
    {
      "id": 5,
      "moduleName": "Client/Contact Management",
      "note": "The 'Edit' permission combines Intake and Retainer permissions.",
      "code": "CLIENT_CONTACT_MANAGEMENT",
      "deny": true,
      "viewOnly": true,
      "edit": true,
      "admin": true,
      "isActive": true
    },
    {
      "id": 6,
      "moduleName": "Matter Management",
      "note": "User must at least have Client/Contact Management (View) rights to have any functionality.",
      "code": "MATTER_MANAGEMENT",
      "deny": true,
      "viewOnly": true,
      "edit": true,
      "admin": true,
      "isActive": true
    },
    {
      "id": 7,
      "moduleName": "Billing",
      "note": "User must at least have Matter Management (View) rights to have any functionality.",
      "code": "BILLING_MANAGEMENT",
      "deny": true,
      "viewOnly": true,
      "edit": true,
      "admin": true,
      "isActive": true
    },
    {
      "id": 8,
      "moduleName": "Accounting",
      "note": "User must at least have Matter Management (View) rights to have any functionality.",
      "code": "ACCOUNTING",
      "deny": true,
      "viewOnly": false,
      "edit": true,
      "admin": true,
      "isActive": true
    },
    {
      "id": 14,
      "moduleName": "Bank Account Configuration",
      "note": "",
      "code": "BANK_ACCOUNT_CONFIGURATION",
      "deny": true,
      "viewOnly": false,
      "edit": false,
      "admin": true,
      "isActive": true
    },
    {
      "id": 15,
      "moduleName": "Timekeeping (Self)",
      "note": "",
      "code": "TIMEKEEPING_SELF",
      "deny": true,
      "viewOnly": false,
      "edit": true,
      "admin": false,
      "isActive": true
    },
    {
      "id": 16,
      "moduleName": "Timekeeping (Others)",
      "note": "",
      "code": "TIMEKEEPING_OTHERS",
      "deny": true,
      "viewOnly": false,
      "edit": false,
      "admin": true,
      "isActive": true
    },
    {
      "id": 10,
      "moduleName": "Document Management System (DMS)",
      "note": "",
      "code": "DOCUMENT_MANAGEMENT_SYSTEM",
      "deny": false,
      "viewOnly": true,
      "edit": false,
      "admin": true,
      "isActive": true
    },
    {
      "id": 11,
      "moduleName": "Support",
      "note": "",
      "code": "SUPPORT",
      "deny": true,
      "viewOnly": false,
      "edit": false,
      "admin": true,
      "isActive": true
    },
    {
      "id": 13,
      "moduleName": "Trust Accounting",
      "note": "",
      "code": "TRUSTACCOUNT_MANAGEMENT",
      "deny": true,
      "viewOnly": false,
      "edit": false,
      "admin": true,
      "isActive": true
    }
  ]
};

let officeListMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDUwNzIxMjAsImV4cCI6MTYwNTExNTMyMCwiaWF0IjoxNjA1MDcyMTIwfQ._zvatW_7NdrmJnpu_XTx86-tN0J0M9_HABAhzX9SJKQ",
  "results": [
    {
      "id": 1922,
      "name": "09 Nov office"
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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDUwNzIxMjAsImV4cCI6MTYwNTExNTMyMCwiaWF0IjoxNjA1MDcyMTIwfQ._zvatW_7NdrmJnpu_XTx86-tN0J0M9_HABAhzX9SJKQ",
  "results": [
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
        "name": "Andrews Office"
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
        "name": "Andrews Office"
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
        },
        {
          "id": 414,
          "name": "07 oct-vkjagat"
        }
      ],
      "profilePicture": null,
      "jobFamily": 0,
      "jobFamilyName": "Associate Attorney",
      "jobFamilyBaseRate": null,
      "jobFamilyIsCustom": null,
      "isActivated": true
    }
  ]
};


let emailTemplateListByIdMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDUwNzIxMjAsImV4cCI6MTYwNTExNTMyMCwiaWF0IjoxNjA1MDcyMTIwfQ._zvatW_7NdrmJnpu_XTx86-tN0J0M9_HABAhzX9SJKQ",
  "results": {
    "securityGroupId": 334,
    "personId": 0,
    "emailTemplates": [
      {
        "id": 6,
        "emailTemplateCode": "MATTER_PAYMENT_FAILED_ATTORNEY",
        "subject": "Auto-payment has failed for your matter",
        "body": null,
        "isReadOnly": false,
        "description": "An auto-payment has failed on your matter.",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": false
      },
      {
        "id": 7,
        "emailTemplateCode": "ECHECK_TO_TRUST_PAYMENT_FAILED",
        "subject": "Your payment to trust has failed",
        "body": null,
        "isReadOnly": false,
        "description": "E-check payment to trust failed.",
        "templateGroupId": 9,
        "templateGroupName": "Trust Accounting",
        "isVisible": false
      },
      {
        "id": 11,
        "emailTemplateCode": "TRUST_TO_ECHECK_REFUND_FAILED",
        "subject": "Your refund from trust has failed",
        "body": null,
        "isReadOnly": false,
        "description": "E-Check refund from trust failed.",
        "templateGroupId": 9,
        "templateGroupName": "Trust Accounting",
        "isVisible": false
      },
      {
        "id": 12,
        "emailTemplateCode": "CLIENT_EMAIL_UPDATE",
        "subject": "Your email address has been updated",
        "body": null,
        "isReadOnly": false,
        "description": "A client's or corporate contact's email address has been updated.",
        "templateGroupId": 10,
        "templateGroupName": "Contact",
        "isVisible": false
      },
      {
        "id": 13,
        "emailTemplateCode": "CLIENT_PHONE_NUMBER_UPDATE",
        "subject": "Your phone number has been updated",
        "body": null,
        "isReadOnly": false,
        "description": "A client's or corporate contact's primary phone number has been updated.",
        "templateGroupId": 10,
        "templateGroupName": "Contact",
        "isVisible": false
      },
      {
        "id": 25,
        "emailTemplateCode": "EMPLOYEE_ASSIGNED_CLIENT",
        "subject": "You have a new potential client: [PotentialClientFullName]",
        "body": null,
        "isReadOnly": false,
        "description": "You've been assigned as the Consult Attorney on a new potential client.",
        "templateGroupId": 2,
        "templateGroupName": "Potential Client",
        "isVisible": false
      },
      {
        "id": 26,
        "emailTemplateCode": "EMPLOYEE_REASSIGNED_CLIENT",
        "subject": "You’ve been reassigned to a potential client: [PotentialClientFullName]",
        "body": null,
        "isReadOnly": false,
        "description": "You've been assigned as the Consult Attorney to a potential client as part of reassignment.",
        "templateGroupId": 2,
        "templateGroupName": "Potential Client",
        "isVisible": false
      },
      {
        "id": 27,
        "emailTemplateCode": "EMPLOYEE_REMOVED_CLIENT",
        "subject": "You’ve been removed from a potential client: [PotentialClientFullName]",
        "body": null,
        "isReadOnly": false,
        "description": "You've been removed as the Consult Attorney to a potential client as part of reassignment.",
        "templateGroupId": 2,
        "templateGroupName": "Potential Client",
        "isVisible": false
      },
      {
        "id": 28,
        "emailTemplateCode": "ATTORNEY_ASSIGNED_MATTER",
        "subject": "You’ve been assigned to [MatterName]",
        "body": null,
        "isReadOnly": false,
        "description": "You've been assigned to a new matter.",
        "templateGroupId": 3,
        "templateGroupName": "Matters",
        "isVisible": false
      },
      {
        "id": 29,
        "emailTemplateCode": "ATTORNEY_REASSIGNED_MATTER",
        "subject": "You’ve been reassigned to a matter: [MatterName]",
        "body": null,
        "isReadOnly": false,
        "description": "You've been assigned to a matter as part of reassignment.",
        "templateGroupId": 3,
        "templateGroupName": "Matters",
        "isVisible": false
      },
      {
        "id": 30,
        "emailTemplateCode": "MATTER_CLOSED",
        "subject": "[MatterName] has been closed",
        "body": null,
        "isReadOnly": false,
        "description": "Your matter has been closed.",
        "templateGroupId": 3,
        "templateGroupName": "Matters",
        "isVisible": false
      },
      {
        "id": 31,
        "emailTemplateCode": "PRE_BILL_REVIEW",
        "subject": "Pre-bills are ready for your review",
        "body": null,
        "isReadOnly": false,
        "description": "Pre-Bills require the user's approval.",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": false
      },
      {
        "id": 32,
        "emailTemplateCode": "INVOICE_READY_PAYMENT",
        "subject": "Invoices are ready to be sent for payment",
        "body": null,
        "isReadOnly": false,
        "description": "Invoices are ready to be sent to clients.",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": false
      },
      {
        "id": 34,
        "emailTemplateCode": "ENTRY_DEADLINE",
        "subject": "Your time entry deadline is approaching",
        "body": null,
        "isReadOnly": false,
        "description": "The time entry deadline is upcoming.",
        "templateGroupId": 7,
        "templateGroupName": "Timekeeping",
        "isVisible": false
      },
      {
        "id": 41,
        "emailTemplateCode": "POTENTIAL_CLIENT_RETAINED",
        "subject": "Your potential client has retained: [ClientFullName]",
        "body": null,
        "isReadOnly": false,
        "description": "Your potential client has been converted to a client.",
        "templateGroupId": 2,
        "templateGroupName": "Potential Client",
        "isVisible": false
      },
      {
        "id": 42,
        "emailTemplateCode": "ATTORNEY_REMOVED_MATTER",
        "subject": "Your matter has been reassigned: [MatterName]",
        "body": null,
        "isReadOnly": false,
        "description": "You've been removed from a matter as part of reassignment.",
        "templateGroupId": 3,
        "templateGroupName": "Matters",
        "isVisible": false
      },
      {
        "id": 43,
        "emailTemplateCode": "MATTER_REOPENED",
        "subject": "[MatterName] has been reopened",
        "body": null,
        "isReadOnly": false,
        "description": "Your matter has been reopened.",
        "templateGroupId": 3,
        "templateGroupName": "Matters",
        "isVisible": false
      },
      {
        "id": 44,
        "emailTemplateCode": "CLIENT_CONTACT_INFO_UPDATED",
        "subject": "Contact info for [ClientName] has been updated",
        "body": null,
        "isReadOnly": false,
        "description": "Your client's email address has been updated.",
        "templateGroupId": 3,
        "templateGroupName": "Matters",
        "isVisible": false
      },
      {
        "id": 46,
        "emailTemplateCode": "DOCUMENT_NEW_REVISION",
        "subject": "New revision to document [DocumentName]",
        "body": null,
        "isReadOnly": false,
        "description": "A document the user owns has been replaced.",
        "templateGroupId": 5,
        "templateGroupName": "Documents",
        "isVisible": false
      },
      {
        "id": 51,
        "emailTemplateCode": "NEW_OFFICE_ASSIGNED_TO_MATTER",
        "subject": "Your matter has been assigned to a new office: [MatterName]",
        "body": null,
        "isReadOnly": false,
        "description": "Your matter has been reassigned to a new office.",
        "templateGroupId": 3,
        "templateGroupName": "Matters",
        "isVisible": false
      },
      {
        "id": 52,
        "emailTemplateCode": "PRE_BILLS_OVERDUE_ATTORNEY",
        "subject": "You have overdue pre-bills",
        "body": null,
        "isReadOnly": false,
        "description": "Invoices could not be generated because your pre-bills are not approved.",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": false
      },
      {
        "id": 53,
        "emailTemplateCode": "PRE_BILLS_OVERDUE_BILLING_ADMIN",
        "subject": "You have overdue pre-bills",
        "body": null,
        "isReadOnly": false,
        "description": "Invoices could not be generated because attorney pre-bills are not approved. (Billing Admin)",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": false
      },
      {
        "id": 64,
        "emailTemplateCode": "INSUFFICIENT_TRUST_BALANCE_BI_WEEKLY",
        "subject": "Client trust funds on some of your matters are running low",
        "body": null,
        "isReadOnly": false,
        "description": "Your matter has an insufficient trust balance. (Sent every 2 weeks on Monday.)",
        "templateGroupId": 9,
        "templateGroupName": "Trust Accounting",
        "isVisible": false
      },
      {
        "id": 67,
        "emailTemplateCode": "SECURITY_SCAN_VIRUS_DETECTED_FOR_ADMIN",
        "subject": "Security Alert: Virus detected in employee document",
        "body": null,
        "isReadOnly": false,
        "description": "Security scan detects an issue with a document. (DMS Admin)",
        "templateGroupId": 5,
        "templateGroupName": "Documents",
        "isVisible": false
      },
      {
        "id": 68,
        "emailTemplateCode": "SECURITY_SCAN_ISSUE_DETECTED_FOR_OWNER",
        "subject": "Security Alert: Virus detected for [DocumentName]",
        "body": null,
        "isReadOnly": false,
        "description": "Security scan detects an issue with your document.",
        "templateGroupId": 5,
        "templateGroupName": "Documents",
        "isVisible": false
      },
      {
        "id": 69,
        "emailTemplateCode": "DOCUMENT_SIGNED",
        "subject": "Your document has been signed",
        "body": null,
        "isReadOnly": false,
        "description": "All signatures on a document have been gathered.",
        "templateGroupId": 5,
        "templateGroupName": "Documents",
        "isVisible": false
      },
      {
        "id": 70,
        "emailTemplateCode": "READY_TO_BILLED",
        "subject": "Your Clients are ready to be billed",
        "body": null,
        "isReadOnly": false,
        "description": "Your Clients are ready to be billed.",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": false
      },
      {
        "id": 80,
        "emailTemplateCode": "DOCUMENT_SHARED_FOR_CLIENT",
        "subject": "A document has been shared with you : [FileName]",
        "body": null,
        "isReadOnly": false,
        "description": "A document has been shared with your client.",
        "templateGroupId": 5,
        "templateGroupName": "Documents",
        "isVisible": false
      },
      {
        "id": 96,
        "emailTemplateCode": "OPERATING_ACCOUNT_TO_ECHECK_PAYMENT_FAILED",
        "subject": "Your refund from matter balance has failed",
        "body": null,
        "isReadOnly": false,
        "description": "E-Check refund failed",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": false
      },
      {
        "id": 114,
        "emailTemplateCode": "ECHECK_PAYMENT_TO_MATTER_FAILED",
        "subject": "Your payment to a matter has failed",
        "body": null,
        "isReadOnly": false,
        "description": "Your payment to a matter has failed",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": false
      },
      {
        "id": 115,
        "emailTemplateCode": "CLIENTTRUST_TO_ECHECK_REFUND_FAILED",
        "subject": "Your refund from trust has failed",
        "body": null,
        "isReadOnly": false,
        "description": "E-Check refund failed",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": false
      }
    ]
  }
};

let groupObjectVisibilityMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDUwNzIxMjAsImV4cCI6MTYwNTExNTMyMCwiaWF0IjoxNjA1MDcyMTIwfQ._zvatW_7NdrmJnpu_XTx86-tN0J0M9_HABAhzX9SJKQ",
  "results": [
    {
      "id": 1666,
      "securityGroupObjectVisibilityId": 1657,
      "securityGroupId": 334,
      "name": "Tenant Configuration",
      "code": "TENANT_CONFIGURATION",
      "echelonId": 0,
      "echelonName": null,
      "isNoVisibility": false,
      "isViewOnly": false,
      "isEdit": false,
      "isAdmin": true
    },
    {
      "id": 1667,
      "securityGroupObjectVisibilityId": 1659,
      "securityGroupId": 334,
      "name": "Access Management",
      "code": "ACCESS_MANAGEMENT",
      "echelonId": 0,
      "echelonName": null,
      "isNoVisibility": false,
      "isViewOnly": false,
      "isEdit": false,
      "isAdmin": true
    },
    {
      "id": 1668,
      "securityGroupObjectVisibilityId": 1660,
      "securityGroupId": 334,
      "name": "Office Management",
      "code": "OFFICE_MANAGEMENT",
      "echelonId": 0,
      "echelonName": null,
      "isNoVisibility": false,
      "isViewOnly": false,
      "isEdit": false,
      "isAdmin": true
    },
    {
      "id": 1669,
      "securityGroupObjectVisibilityId": 1658,
      "securityGroupId": 334,
      "name": "Employee Management",
      "code": "EMPLOYEE_MANAGEMENT",
      "echelonId": 0,
      "echelonName": null,
      "isNoVisibility": false,
      "isViewOnly": false,
      "isEdit": false,
      "isAdmin": true
    },
    {
      "id": 1670,
      "securityGroupObjectVisibilityId": 1661,
      "securityGroupId": 334,
      "name": "Client/Contact Management",
      "code": "CLIENT_CONTACT_MANAGEMENT",
      "echelonId": 0,
      "echelonName": null,
      "isNoVisibility": false,
      "isViewOnly": false,
      "isEdit": false,
      "isAdmin": true
    },
    {
      "id": 1671,
      "securityGroupObjectVisibilityId": 1662,
      "securityGroupId": 334,
      "name": "Matter Management",
      "code": "MATTER_MANAGEMENT",
      "echelonId": 0,
      "echelonName": null,
      "isNoVisibility": false,
      "isViewOnly": false,
      "isEdit": false,
      "isAdmin": true
    },
    {
      "id": 1672,
      "securityGroupObjectVisibilityId": 1663,
      "securityGroupId": 334,
      "name": "Billing",
      "code": "BILLING_MANAGEMENT",
      "echelonId": 0,
      "echelonName": null,
      "isNoVisibility": false,
      "isViewOnly": false,
      "isEdit": false,
      "isAdmin": true
    },
    {
      "id": 1673,
      "securityGroupObjectVisibilityId": 1664,
      "securityGroupId": 334,
      "name": "Accounting",
      "code": "ACCOUNTING",
      "echelonId": 0,
      "echelonName": null,
      "isNoVisibility": false,
      "isViewOnly": false,
      "isEdit": false,
      "isAdmin": true
    },
    {
      "id": 1675,
      "securityGroupObjectVisibilityId": 1666,
      "securityGroupId": 334,
      "name": "Support",
      "code": "SUPPORT",
      "echelonId": 0,
      "echelonName": null,
      "isNoVisibility": false,
      "isViewOnly": false,
      "isEdit": false,
      "isAdmin": true
    },
    {
      "id": 1676,
      "securityGroupObjectVisibilityId": 1667,
      "securityGroupId": 334,
      "name": "Document Management System (DMS)",
      "code": "DOCUMENT_MANAGEMENT_SYSTEM",
      "echelonId": 0,
      "echelonName": null,
      "isNoVisibility": false,
      "isViewOnly": false,
      "isEdit": false,
      "isAdmin": true
    },
    {
      "id": 1713,
      "securityGroupObjectVisibilityId": 1704,
      "securityGroupId": 334,
      "name": "Reports",
      "code": "REPORTING",
      "echelonId": 0,
      "echelonName": null,
      "isNoVisibility": false,
      "isViewOnly": false,
      "isEdit": false,
      "isAdmin": true
    },
    {
      "id": 1873,
      "securityGroupObjectVisibilityId": 1864,
      "securityGroupId": 334,
      "name": "Trust Accounting",
      "code": "TRUSTACCOUNT_MANAGEMENT",
      "echelonId": 0,
      "echelonName": null,
      "isNoVisibility": false,
      "isViewOnly": false,
      "isEdit": false,
      "isAdmin": true
    },
    {
      "id": 2417,
      "securityGroupObjectVisibilityId": 2407,
      "securityGroupId": 334,
      "name": "Bank Account Configuration",
      "code": "BANK_ACCOUNT_CONFIGURATION",
      "echelonId": 0,
      "echelonName": null,
      "isNoVisibility": false,
      "isViewOnly": false,
      "isEdit": false,
      "isAdmin": true
    },
    {
      "id": 2466,
      "securityGroupObjectVisibilityId": 2456,
      "securityGroupId": 334,
      "name": "Timekeeping (Self)",
      "code": "TIMEKEEPING_SELF",
      "echelonId": 0,
      "echelonName": null,
      "isNoVisibility": false,
      "isViewOnly": false,
      "isEdit": true,
      "isAdmin": false
    },
    {
      "id": 2467,
      "securityGroupObjectVisibilityId": 2457,
      "securityGroupId": 334,
      "name": "Timekeeping (Others)",
      "code": "TIMEKEEPING_OTHERS",
      "echelonId": 0,
      "echelonName": null,
      "isNoVisibility": false,
      "isViewOnly": false,
      "isEdit": false,
      "isAdmin": true
    }
  ]
};

let securityGroupMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDUwNzIxMjAsImV4cCI6MTYwNTExNTMyMCwiaWF0IjoxNjA1MDcyMTIwfQ._zvatW_7NdrmJnpu_XTx86-tN0J0M9_HABAhzX9SJKQ",
  "results": [
    {
      "id": 332,
      "tenantId": 1006,
      "name": "View Read Only",
      "readOnly": null,
      "isVisible": true
    },
    {
      "id": 333,
      "tenantId": 1006,
      "name": "jagat Group 1",
      "readOnly": null,
      "isVisible": true
    },
    {
      "id": 334,
      "tenantId": 1006,
      "name": "admin",
      "readOnly": null,
      "isVisible": true
    },
    {
      "id": 356,
      "tenantId": 1006,
      "name": "Snehdeep_Group",
      "readOnly": null,
      "isVisible": true
    },
    {
      "id": 357,
      "tenantId": 1006,
      "name": "Testing",
      "readOnly": null,
      "isVisible": true
    }
  ]
};

let securityGroupUserMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDUwNzIxMjAsImV4cCI6MTYwNTExNTMyMCwiaWF0IjoxNjA1MDcyMTIwfQ._zvatW_7NdrmJnpu_XTx86-tN0J0M9_HABAhzX9SJKQ",
  "results": [
    {
      "id": 5741,
      "userName": "julia@email.com",
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
      "firstName": "Julia",
      "middleName": "",
      "lastName": "Maxwell",
      "suffix": null,
      "email": "julia@email.com",
      "maidenName": "",
      "nickName": "",
      "commonName": "",
      "jobTitle": "Miss",
      "employmentStartDate": "2020-06-01T00:00:00",
      "employmentEndDate": null,
      "isCompany": null,
      "isVisible": false,
      "preferredContactMethod": null,
      "doNotSchedule": null,
      "isInheritNotification": null,
      "initialJurisdictionId": null,
      "lastLoggedIn": null,
      "mondayOpenHours": "2020-11-11T07:00:00+00:00",
      "mondayCloseHours": "2020-11-11T14:00:00+00:00",
      "tuesdayOpenHours": "2020-11-11T09:30:00+00:00",
      "tuesdayCloseHours": "2020-11-11T16:30:00+00:00",
      "wednesdayOpenHours": "2020-11-11T09:00:00+00:00",
      "wednesdayCloseHours": "2020-11-11T17:00:00+00:00",
      "thursdayOpenHours": "2020-11-11T04:00:00+00:00",
      "thursdayCloseHours": "2020-11-11T16:30:00+00:00",
      "fridayOpenHours": "2020-11-11T09:30:00+00:00",
      "fridayCloseHours": "2020-11-11T18:30:00+00:00",
      "saturdayOpenHours": "2020-11-11T11:00:00+00:00",
      "saturdayCloseHours": "2020-11-11T13:30:00+00:00",
      "sundayOpenHours": "2020-11-11T00:00:00+00:00",
      "sundayCloseHours": "2020-11-11T00:00:00+00:00",
      "reportingManager": null,
      "approvingManager": {
        "id": 5683,
        "name": "aa, aa"
      },
      "practiceManager": null,
      "primaryOffice": {
        "id": 1453,
        "name": "1 Office"
      },
      "phones": [
        {
          "id": 61182,
          "number": "4567898765",
          "type": "primary",
          "isPrimary": true,
          "personId": 5741
        }
      ],
      "secondaryOffices": [
        {
          "id": 1453,
          "name": "1 Office"
        },
        {
          "id": 1654,
          "name": "1 Billing Office"
        },
        {
          "id": 1709,
          "name": "Andrews Office"
        }
      ],
      "retainerPracticeAreas": [
        {
          "id": 73,
          "name": "Corporate Law"
        },
        {
          "id": 145,
          "name": "Accidents"
        }
      ],
      "initialConsultPracticeAreas": [
        {
          "id": 73,
          "name": "Corporate Law"
        },
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
          "id": 3,
          "name": "Arizona"
        },
        {
          "id": 21,
          "name": "Maryland"
        },
        {
          "id": 24,
          "name": "Minnesota"
        },
        {
          "id": 26,
          "name": "Missouri"
        },
        {
          "id": 27,
          "name": "Montana"
        },
        {
          "id": 29,
          "name": "Nevada"
        },
        {
          "id": 31,
          "name": "New Jersey"
        },
        {
          "id": 39,
          "name": "Pennsylvania"
        },
        {
          "id": 49,
          "name": "Washington"
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
      "profilePicture": "",
      "jobFamily": 0,
      "jobFamilyName": "",
      "jobFamilyBaseRate": null,
      "jobFamilyIsCustom": null,
      "isActivated": true
    },
    {
      "id": 6517,
      "userName": "test@123.com",
      "password": null,
      "role": [
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
      "firstName": "first name",
      "middleName": "middle name",
      "lastName": "last name",
      "suffix": null,
      "email": "test@123.com",
      "maidenName": "maiden name",
      "nickName": "nick name",
      "commonName": "common name",
      "jobTitle": "title",
      "employmentStartDate": "2020-07-31T00:00:00",
      "employmentEndDate": null,
      "isCompany": null,
      "isVisible": true,
      "preferredContactMethod": null,
      "doNotSchedule": null,
      "isInheritNotification": null,
      "initialJurisdictionId": null,
      "lastLoggedIn": null,
      "mondayOpenHours": "2020-11-11T07:00:00+00:00",
      "mondayCloseHours": "2020-11-11T14:00:00+00:00",
      "tuesdayOpenHours": "2020-11-11T09:30:00+00:00",
      "tuesdayCloseHours": "2020-11-11T16:30:00+00:00",
      "wednesdayOpenHours": "2020-11-11T01:00:00+00:00",
      "wednesdayCloseHours": "2020-11-11T17:00:00+00:00",
      "thursdayOpenHours": "2020-11-11T02:00:00+00:00",
      "thursdayCloseHours": "2020-11-11T16:30:00+00:00",
      "fridayOpenHours": "2020-11-11T09:30:00+00:00",
      "fridayCloseHours": "2020-11-11T18:30:00+00:00",
      "saturdayOpenHours": "2020-11-11T01:30:00+00:00",
      "saturdayCloseHours": "2020-11-11T02:00:00+00:00",
      "sundayOpenHours": "2020-11-11T00:00:00+00:00",
      "sundayCloseHours": "2020-11-11T00:00:00+00:00",
      "reportingManager": null,
      "approvingManager": {
        "id": 5880,
        "name": "Avu naam, Hoy"
      },
      "practiceManager": {
        "id": 5880,
        "name": "Avu naam, Hoy"
      },
      "primaryOffice": {
        "id": 1654,
        "name": "1 Billing Office"
      },
      "phones": [
        {
          "id": 61927,
          "number": "8889990000",
          "type": "primary",
          "isPrimary": true,
          "personId": 6517
        },
        {
          "id": 61928,
          "number": "9878800000",
          "type": "cellphone",
          "isPrimary": false,
          "personId": 6517
        }
      ],
      "secondaryOffices": [
        {
          "id": 1654,
          "name": "1 Billing Office"
        },
        {
          "id": 1709,
          "name": "Andrews Office"
        },
        {
          "id": 1741,
          "name": "Office Name"
        }
      ],
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
          "id": 294,
          "name": "Consult Attorney"
        },
        {
          "id": 334,
          "name": "admin"
        }
      ],
      "profilePicture": "",
      "jobFamily": 0,
      "jobFamilyName": "",
      "jobFamilyBaseRate": null,
      "jobFamilyIsCustom": null,
      "isActivated": false
    }
  ]
};

let groupByEmailTemplateMock = [
  {
    "templateGroupName": "Billing",
    "templateGroupData": [
      {
        "id": 6,
        "emailTemplateCode": "MATTER_PAYMENT_FAILED_ATTORNEY",
        "subject": "Auto-payment has failed for your matter",
        "body": null,
        "isReadOnly": false,
        "description": "An auto-payment has failed on your matter.",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": true
      },
      {
        "id": 96,
        "emailTemplateCode": "OPERATING_ACCOUNT_TO_ECHECK_PAYMENT_FAILED",
        "subject": "Your refund from matter balance has failed",
        "body": null,
        "isReadOnly": false,
        "description": "E-Check refund failed",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": false
      },
      {
        "id": 115,
        "emailTemplateCode": "CLIENTTRUST_TO_ECHECK_REFUND_FAILED",
        "subject": "Your refund from trust has failed",
        "body": null,
        "isReadOnly": false,
        "description": "E-Check refund failed",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": false
      },
      {
        "id": 32,
        "emailTemplateCode": "INVOICE_READY_PAYMENT",
        "subject": "Invoices are ready to be sent for payment",
        "body": null,
        "isReadOnly": false,
        "description": "Invoices are ready to be sent to clients.",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": true
      },
      {
        "id": 53,
        "emailTemplateCode": "PRE_BILLS_OVERDUE_BILLING_ADMIN",
        "subject": "You have overdue pre-bills",
        "body": null,
        "isReadOnly": false,
        "description": "Invoices could not be generated because attorney pre-bills are not approved. (Billing Admin)",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": true
      },
      {
        "id": 52,
        "emailTemplateCode": "PRE_BILLS_OVERDUE_ATTORNEY",
        "subject": "You have overdue pre-bills",
        "body": null,
        "isReadOnly": false,
        "description": "Invoices could not be generated because your pre-bills are not approved.",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": true
      },
      {
        "id": 31,
        "emailTemplateCode": "PRE_BILL_REVIEW",
        "subject": "Pre-bills are ready for your review",
        "body": null,
        "isReadOnly": false,
        "description": "Pre-Bills require the user's approval.",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": true
      },
      {
        "id": 70,
        "emailTemplateCode": "READY_TO_BILLED",
        "subject": "Your Clients are ready to be billed",
        "body": null,
        "isReadOnly": false,
        "description": "Your Clients are ready to be billed.",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": true
      },
      {
        "id": 114,
        "emailTemplateCode": "ECHECK_PAYMENT_TO_MATTER_FAILED",
        "subject": "Your payment to a matter has failed",
        "body": null,
        "isReadOnly": false,
        "description": "Your payment to a matter has failed",
        "templateGroupId": 4,
        "templateGroupName": "Billing",
        "isVisible": false
      }
    ]
  },
  {
    "templateGroupName": "Contact",
    "templateGroupData": [
      {
        "id": 12,
        "emailTemplateCode": "CLIENT_EMAIL_UPDATE",
        "subject": "Your email address has been updated",
        "body": null,
        "isReadOnly": false,
        "description": "A client's or corporate contact's email address has been updated.",
        "templateGroupId": 10,
        "templateGroupName": "Contact",
        "isVisible": true
      },
      {
        "id": 13,
        "emailTemplateCode": "CLIENT_PHONE_NUMBER_UPDATE",
        "subject": "Your phone number has been updated",
        "body": null,
        "isReadOnly": false,
        "description": "A client's or corporate contact's primary phone number has been updated.",
        "templateGroupId": 10,
        "templateGroupName": "Contact",
        "isVisible": true
      }
    ]
  },
  {
    "templateGroupName": "Documents",
    "templateGroupData": [
      {
        "id": 80,
        "emailTemplateCode": "DOCUMENT_SHARED_FOR_CLIENT",
        "subject": "A document has been shared with you : [FileName]",
        "body": null,
        "isReadOnly": false,
        "description": "A document has been shared with your client.",
        "templateGroupId": 5,
        "templateGroupName": "Documents",
        "isVisible": true
      },
      {
        "id": 46,
        "emailTemplateCode": "DOCUMENT_NEW_REVISION",
        "subject": "New revision to document [DocumentName]",
        "body": null,
        "isReadOnly": false,
        "description": "A document the user owns has been replaced.",
        "templateGroupId": 5,
        "templateGroupName": "Documents",
        "isVisible": true
      },
      {
        "id": 69,
        "emailTemplateCode": "DOCUMENT_SIGNED",
        "subject": "Your document has been signed",
        "body": null,
        "isReadOnly": false,
        "description": "All signatures on a document have been gathered.",
        "templateGroupId": 5,
        "templateGroupName": "Documents",
        "isVisible": true
      },
      {
        "id": 67,
        "emailTemplateCode": "SECURITY_SCAN_VIRUS_DETECTED_FOR_ADMIN",
        "subject": "Security Alert: Virus detected in employee document",
        "body": null,
        "isReadOnly": false,
        "description": "Security scan detects an issue with a document. (DMS Admin)",
        "templateGroupId": 5,
        "templateGroupName": "Documents",
        "isVisible": true
      },
      {
        "id": 68,
        "emailTemplateCode": "SECURITY_SCAN_ISSUE_DETECTED_FOR_OWNER",
        "subject": "Security Alert: Virus detected for [DocumentName]",
        "body": null,
        "isReadOnly": false,
        "description": "Security scan detects an issue with your document.",
        "templateGroupId": 5,
        "templateGroupName": "Documents",
        "isVisible": true
      }
    ]
  },
  {
    "templateGroupName": "Matters",
    "templateGroupData": [
      {
        "id": 29,
        "emailTemplateCode": "ATTORNEY_REASSIGNED_MATTER",
        "subject": "You’ve been reassigned to a matter: [MatterName]",
        "body": null,
        "isReadOnly": false,
        "description": "You've been assigned to a matter as part of reassignment.",
        "templateGroupId": 3,
        "templateGroupName": "Matters",
        "isVisible": true
      },
      {
        "id": 28,
        "emailTemplateCode": "ATTORNEY_ASSIGNED_MATTER",
        "subject": "You’ve been assigned to [MatterName]",
        "body": null,
        "isReadOnly": false,
        "description": "You've been assigned to a new matter.",
        "templateGroupId": 3,
        "templateGroupName": "Matters",
        "isVisible": true
      },
      {
        "id": 42,
        "emailTemplateCode": "ATTORNEY_REMOVED_MATTER",
        "subject": "Your matter has been reassigned: [MatterName]",
        "body": null,
        "isReadOnly": false,
        "description": "You've been removed from a matter as part of reassignment.",
        "templateGroupId": 3,
        "templateGroupName": "Matters",
        "isVisible": true
      },
      {
        "id": 44,
        "emailTemplateCode": "CLIENT_CONTACT_INFO_UPDATED",
        "subject": "Contact info for [ClientName] has been updated",
        "body": null,
        "isReadOnly": false,
        "description": "Your client's email address has been updated.",
        "templateGroupId": 3,
        "templateGroupName": "Matters",
        "isVisible": true
      },
      {
        "id": 30,
        "emailTemplateCode": "MATTER_CLOSED",
        "subject": "[MatterName] has been closed",
        "body": null,
        "isReadOnly": false,
        "description": "Your matter has been closed.",
        "templateGroupId": 3,
        "templateGroupName": "Matters",
        "isVisible": true
      },
      {
        "id": 51,
        "emailTemplateCode": "NEW_OFFICE_ASSIGNED_TO_MATTER",
        "subject": "Your matter has been assigned to a new office: [MatterName]",
        "body": null,
        "isReadOnly": false,
        "description": "Your matter has been reassigned to a new office.",
        "templateGroupId": 3,
        "templateGroupName": "Matters",
        "isVisible": true
      },
      {
        "id": 43,
        "emailTemplateCode": "MATTER_REOPENED",
        "subject": "[MatterName] has been reopened",
        "body": null,
        "isReadOnly": false,
        "description": "Your matter has been reopened.",
        "templateGroupId": 3,
        "templateGroupName": "Matters",
        "isVisible": true
      }
    ]
  },
  {
    "templateGroupName": "Potential Client",
    "templateGroupData": [
      {
        "id": 25,
        "emailTemplateCode": "EMPLOYEE_ASSIGNED_CLIENT",
        "subject": "You have a new potential client: [PotentialClientFullName]",
        "body": null,
        "isReadOnly": false,
        "description": "You've been assigned as the Consult Attorney on a new potential client.",
        "templateGroupId": 2,
        "templateGroupName": "Potential Client",
        "isVisible": true
      },
      {
        "id": 26,
        "emailTemplateCode": "EMPLOYEE_REASSIGNED_CLIENT",
        "subject": "You’ve been reassigned to a potential client: [PotentialClientFullName]",
        "body": null,
        "isReadOnly": false,
        "description": "You've been assigned as the Consult Attorney to a potential client as part of reassignment.",
        "templateGroupId": 2,
        "templateGroupName": "Potential Client",
        "isVisible": true
      },
      {
        "id": 27,
        "emailTemplateCode": "EMPLOYEE_REMOVED_CLIENT",
        "subject": "You’ve been removed from a potential client: [PotentialClientFullName]",
        "body": null,
        "isReadOnly": false,
        "description": "You've been removed as the Consult Attorney to a potential client as part of reassignment.",
        "templateGroupId": 2,
        "templateGroupName": "Potential Client",
        "isVisible": true
      },
      {
        "id": 41,
        "emailTemplateCode": "POTENTIAL_CLIENT_RETAINED",
        "subject": "Your potential client has retained: [ClientFullName]",
        "body": null,
        "isReadOnly": false,
        "description": "Your potential client has been converted to a client.",
        "templateGroupId": 2,
        "templateGroupName": "Potential Client",
        "isVisible": true
      }
    ]
  },
  {
    "templateGroupName": "Timekeeping",
    "templateGroupData": [
      {
        "id": 34,
        "emailTemplateCode": "ENTRY_DEADLINE",
        "subject": "Your time entry deadline is approaching",
        "body": null,
        "isReadOnly": false,
        "description": "The time entry deadline is upcoming.",
        "templateGroupId": 7,
        "templateGroupName": "Timekeeping",
        "isVisible": true
      }
    ]
  },
  {
    "templateGroupName": "Trust Accounting",
    "templateGroupData": [
      {
        "id": 7,
        "emailTemplateCode": "ECHECK_TO_TRUST_PAYMENT_FAILED",
        "subject": "Your payment to trust has failed",
        "body": null,
        "isReadOnly": false,
        "description": "E-check payment to trust failed.",
        "templateGroupId": 9,
        "templateGroupName": "Trust Accounting",
        "isVisible": true
      },
      {
        "id": 11,
        "emailTemplateCode": "TRUST_TO_ECHECK_REFUND_FAILED",
        "subject": "Your refund from trust has failed",
        "body": null,
        "isReadOnly": false,
        "description": "E-Check refund from trust failed.",
        "templateGroupId": 9,
        "templateGroupName": "Trust Accounting",
        "isVisible": true
      },
      {
        "id": 64,
        "emailTemplateCode": "INSUFFICIENT_TRUST_BALANCE_BI_WEEKLY",
        "subject": "Client trust funds on some of your matters are running low",
        "body": null,
        "isReadOnly": false,
        "description": "Your matter has an insufficient trust balance. (Sent every 2 weeks on Monday.)",
        "templateGroupId": 9,
        "templateGroupName": "Trust Accounting",
        "isVisible": true
      }
    ]
  }
];

let moduleSelectedCreateMock = [
  {
    "id": 1,
    "moduleName": "Tenant Configuration",
    "note": "",
    "code": "TENANT_CONFIGURATION",
    "deny": true,
    "viewOnly": false,
    "edit": false,
    "admin": true,
    "isActive": true,
    "name": "Tenant Configuration",
    "isNoVisibility": true,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": false,
    "securityGroupObjectVisibilityId": 0
  },
  {
    "id": 2,
    "moduleName": "Access Management",
    "note": "",
    "code": "ACCESS_MANAGEMENT",
    "deny": true,
    "viewOnly": false,
    "edit": false,
    "admin": true,
    "isActive": true,
    "name": "Access Management",
    "isNoVisibility": true,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": false,
    "securityGroupObjectVisibilityId": 0
  },
  {
    "id": 3,
    "moduleName": "Office Management",
    "note": "",
    "code": "OFFICE_MANAGEMENT",
    "deny": false,
    "viewOnly": true,
    "edit": false,
    "admin": true,
    "isActive": true,
    "name": "Office Management",
    "isNoVisibility": false,
    "isViewOnly": true,
    "isEdit": false,
    "isAdmin": false,
    "securityGroupObjectVisibilityId": 0
  },
  {
    "id": 4,
    "moduleName": "Employee Management",
    "note": "",
    "code": "EMPLOYEE_MANAGEMENT",
    "deny": false,
    "viewOnly": true,
    "edit": false,
    "admin": true,
    "isActive": true,
    "name": "Employee Management",
    "isNoVisibility": false,
    "isViewOnly": true,
    "isEdit": false,
    "isAdmin": false,
    "securityGroupObjectVisibilityId": 0
  },
  {
    "id": 5,
    "moduleName": "Client/Contact Management",
    "note": "The 'Edit' permission combines Intake and Retainer permissions.",
    "code": "CLIENT_CONTACT_MANAGEMENT",
    "deny": true,
    "viewOnly": true,
    "edit": true,
    "admin": true,
    "isActive": true,
    "name": "Client/Contact Management",
    "isNoVisibility": true,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": false,
    "securityGroupObjectVisibilityId": 0
  },
  {
    "id": 6,
    "moduleName": "Matter Management",
    "note": "User must at least have Client/Contact Management (View) rights to have any functionality.",
    "code": "MATTER_MANAGEMENT",
    "deny": true,
    "viewOnly": true,
    "edit": true,
    "admin": true,
    "isActive": true,
    "name": "Matter Management",
    "isNoVisibility": true,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": false,
    "securityGroupObjectVisibilityId": 0
  },
  {
    "id": 7,
    "moduleName": "Billing",
    "note": "User must at least have Matter Management (View) rights to have any functionality.",
    "code": "BILLING_MANAGEMENT",
    "deny": true,
    "viewOnly": true,
    "edit": true,
    "admin": true,
    "isActive": true,
    "name": "Billing",
    "isNoVisibility": true,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": false,
    "securityGroupObjectVisibilityId": 0
  },
  {
    "id": 8,
    "moduleName": "Accounting",
    "note": "User must at least have Matter Management (View) rights to have any functionality.",
    "code": "ACCOUNTING",
    "deny": true,
    "viewOnly": false,
    "edit": true,
    "admin": true,
    "isActive": true,
    "name": "Accounting",
    "isNoVisibility": true,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": false,
    "securityGroupObjectVisibilityId": 0
  },
  {
    "id": 14,
    "moduleName": "Bank Account Configuration",
    "note": "",
    "code": "BANK_ACCOUNT_CONFIGURATION",
    "deny": true,
    "viewOnly": false,
    "edit": false,
    "admin": true,
    "isActive": true,
    "name": "Bank Account Configuration",
    "isNoVisibility": true,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": false,
    "securityGroupObjectVisibilityId": 0
  },
  {
    "id": 15,
    "moduleName": "Timekeeping (Self)",
    "note": "",
    "code": "TIMEKEEPING_SELF",
    "deny": true,
    "viewOnly": false,
    "edit": true,
    "admin": false,
    "isActive": true,
    "name": "Timekeeping (Self)",
    "isNoVisibility": true,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": false,
    "securityGroupObjectVisibilityId": 0
  },
  {
    "id": 16,
    "moduleName": "Timekeeping (Others)",
    "note": "",
    "code": "TIMEKEEPING_OTHERS",
    "deny": true,
    "viewOnly": false,
    "edit": false,
    "admin": true,
    "isActive": true,
    "name": "Timekeeping (Others)",
    "isNoVisibility": true,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": false,
    "securityGroupObjectVisibilityId": 0
  },
  {
    "id": 10,
    "moduleName": "Document Management System (DMS)",
    "note": "",
    "code": "DOCUMENT_MANAGEMENT_SYSTEM",
    "deny": false,
    "viewOnly": true,
    "edit": false,
    "admin": true,
    "isActive": true,
    "name": "Document Management System (DMS)",
    "isNoVisibility": false,
    "isViewOnly": true,
    "isEdit": false,
    "isAdmin": false,
    "securityGroupObjectVisibilityId": 0
  },
  {
    "id": 11,
    "moduleName": "Support",
    "note": "",
    "code": "SUPPORT",
    "deny": true,
    "viewOnly": false,
    "edit": false,
    "admin": true,
    "isActive": true,
    "name": "Support",
    "isNoVisibility": true,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": false,
    "securityGroupObjectVisibilityId": 0
  },
  {
    "id": 13,
    "moduleName": "Trust Accounting",
    "note": "",
    "code": "TRUSTACCOUNT_MANAGEMENT",
    "deny": true,
    "viewOnly": false,
    "edit": false,
    "admin": true,
    "isActive": true,
    "name": "Trust Accounting",
    "isNoVisibility": true,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": false,
    "securityGroupObjectVisibilityId": 0
  }
];

let permissionListMock = [
  {
    "id": 0,
    "securityGroupObjectVisibilityId": 0,
    "securityGroupId": 0,
    "name": "Matter Management",
    "code": "MATTER_MANAGEMENT",
    "echelonId": 0,
    "echelonName": "",
    "isNoVisibility": false,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": true
  },
  {
    "id": 0,
    "securityGroupObjectVisibilityId": 0,
    "securityGroupId": 0,
    "name": "Employee Management",
    "code": "EMPLOYEE_MANAGEMENT",
    "echelonId": 0,
    "echelonName": "",
    "isNoVisibility": false,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": true
  },
  {
    "id": 0,
    "securityGroupObjectVisibilityId": 0,
    "securityGroupId": 0,
    "name": "Office Management",
    "code": "OFFICE_MANAGEMENT",
    "echelonId": 0,
    "echelonName": "",
    "isNoVisibility": false,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": true
  },
  {
    "id": 0,
    "securityGroupObjectVisibilityId": 0,
    "securityGroupId": 0,
    "name": "Billing",
    "code": "BILLING_MANAGEMENT",
    "echelonId": 0,
    "echelonName": "",
    "isNoVisibility": false,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": true
  },
  {
    "id": 0,
    "securityGroupObjectVisibilityId": 0,
    "securityGroupId": 0,
    "name": "Access Management",
    "code": "ACCESS_MANAGEMENT",
    "echelonId": 0,
    "echelonName": "",
    "isNoVisibility": false,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": true
  },
  {
    "id": 0,
    "securityGroupObjectVisibilityId": 0,
    "securityGroupId": 0,
    "name": "Tenant Configuration",
    "code": "TENANT_CONFIGURATION",
    "echelonId": 0,
    "echelonName": "",
    "isNoVisibility": false,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": true
  },
  {
    "id": 0,
    "securityGroupObjectVisibilityId": 0,
    "securityGroupId": 0,
    "name": "Client/Contact Management",
    "code": "CLIENT_CONTACT_MANAGEMENT",
    "echelonId": 0,
    "echelonName": "",
    "isNoVisibility": false,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": true
  },
  {
    "id": 0,
    "securityGroupObjectVisibilityId": 0,
    "securityGroupId": 0,
    "name": "Support",
    "code": "SUPPORT",
    "echelonId": 0,
    "echelonName": "",
    "isNoVisibility": false,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": true
  },
  {
    "id": 0,
    "securityGroupObjectVisibilityId": 0,
    "securityGroupId": 0,
    "name": "Accounting",
    "code": "ACCOUNTING",
    "echelonId": 0,
    "echelonName": "",
    "isNoVisibility": false,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": true
  },
  {
    "id": 0,
    "securityGroupObjectVisibilityId": 0,
    "securityGroupId": 0,
    "name": "Document Management System (DMS)",
    "code": "DOCUMENT_MANAGEMENT_SYSTEM",
    "echelonId": 0,
    "echelonName": "",
    "isNoVisibility": false,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": true
  },
  {
    "id": 0,
    "securityGroupObjectVisibilityId": 0,
    "securityGroupId": 0,
    "name": "Reports",
    "code": "REPORTING",
    "echelonId": 0,
    "echelonName": "",
    "isNoVisibility": false,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": true
  },
  {
    "id": 0,
    "securityGroupObjectVisibilityId": 0,
    "securityGroupId": 0,
    "name": "Trust Accounting",
    "code": "TRUSTACCOUNT_MANAGEMENT",
    "echelonId": 0,
    "echelonName": "",
    "isNoVisibility": false,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": true
  },
  {
    "id": 0,
    "securityGroupObjectVisibilityId": 0,
    "securityGroupId": 0,
    "name": "Bank Account Configuration",
    "code": "BANK_ACCOUNT_CONFIGURATION",
    "echelonId": 0,
    "echelonName": "",
    "isNoVisibility": false,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": true
  },
  {
    "id": 0,
    "securityGroupObjectVisibilityId": 0,
    "securityGroupId": 0,
    "name": "Timekeeping (Self)",
    "code": "TIMEKEEPING_SELF",
    "echelonId": 0,
    "echelonName": "",
    "isNoVisibility": false,
    "isViewOnly": false,
    "isEdit": true,
    "isAdmin": false
  },
  {
    "id": 0,
    "securityGroupObjectVisibilityId": 0,
    "securityGroupId": 0,
    "name": "Timekeeping (Others)",
    "code": "TIMEKEEPING_OTHERS",
    "echelonId": 0,
    "echelonName": "",
    "isNoVisibility": false,
    "isViewOnly": false,
    "isEdit": false,
    "isAdmin": true
  }
];

describe('CreateComponent', () => {
  let component: CreateComponent;
  let fixture: ComponentFixture<CreateComponent>;
  let GroupService: SecurityGroupService;
  let moduleConfigurationService: ModuleConfigurationService;
  let MiscServ: MiscService;
  let EmpService: EmployeeService;
  let activatedRoute: ActivatedRoute;
  let ObjectVisService: ObjectVisibilityService;
  let NotiService: NotificationService;
  let modalService: NgbModal;
  let toastDisplay: ToastDisplay;
  let router: Router;
  let objectVisibilityService: ObjectVisibilityService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports:[
        SharedModule,
        HttpClientTestingModule,
        RouterTestingModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
        BrowserAnimationsModule,
        StoreModule.forRoot(reducers),
      ],
      declarations: [ CreateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateComponent);
    GroupService = TestBed.get(SecurityGroupService);
    moduleConfigurationService = TestBed.get(ModuleConfigurationService);
    MiscServ = TestBed.get(MiscService);
    EmpService = TestBed.get(EmployeeService);
    activatedRoute = TestBed.get(ActivatedRoute);
    ObjectVisService = TestBed.get(ObjectVisibilityService);
    NotiService = TestBed.get(NotificationService);
    modalService = TestBed.get(NgbModal);
    toastDisplay = TestBed.get(ToastDisplay);
    router = TestBed.get(Router);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('get all email template, get all modulelist, get all office list should called in ngOnInIt', () => {
    let res = {body: JSON.stringify(emailTemplateMock)};
    spyOn(component, 'getEmailTemplates').and.callThrough();
    spyOn(component, 'getList').and.callThrough();
    spyOn(GroupService, 'v1SecurityGroupEmailTemplatesGet$Response').and.returnValue(of(res) as any);
    spyOn(moduleConfigurationService, 'v1ModuleConfigurationGet').and.returnValue(of(JSON.stringify(moduleListMock) as any));
    spyOn(MiscServ, 'v1MiscOfficesGet').and.returnValue(of(JSON.stringify(officeListMock) as any));

    component.ngOnInit();

    expect(component.emailTemplateLoading).toBe(false);
    expect(component.emailTemplateList.length).toBe(6);
    expect(component.groupByEmailTemplateList.length).toBe(4);
    expect(component._groupByEmailTemplateList.length).toBe(4);
    expect(component.permissionsLoading).toBe(false);
    expect(component.moduleList.length).toBe(14);
    expect(component.Offices.length).toBe(10);
    expect(component.EditText).toContain('Create New');
  });

  it('get all email template should called in ngOnInIt', () => {
    let res = {body: JSON.stringify(null)};
    spyOn(component, 'getEmailTemplates').and.callThrough();
    spyOn(GroupService, 'v1SecurityGroupEmailTemplatesGet$Response').and.returnValue(of(res) as any);

    component.ngOnInit();

    expect(component.emailTemplateLoading).toBe(false);
  });

  it('get all email template empty array should called in ngOnInIt emailTemplateLoading false', () => {
    let res = {body: JSON.stringify({results: []})};
    spyOn(component, 'getEmailTemplates').and.callThrough();
    spyOn(GroupService, 'v1SecurityGroupEmailTemplatesGet$Response').and.returnValue(of(res) as any);

    component.ngOnInit();

    expect(component.emailTemplateLoading).toBe(false);
  });

  it('get all email template throw error should called in ngOnInIt emailTemplateLoading false', () => {
    let res = {body: JSON.stringify({results: []})};
    spyOn(component, 'getEmailTemplates').and.callThrough();
    spyOn(GroupService, 'v1SecurityGroupEmailTemplatesGet$Response').and.returnValue(throwError({error: 'error'}));

    component.ngOnInit();

    expect(component.emailTemplateLoading).toBe(false);
  });

  it('add user model should open and get all employee success', fakeAsync (() => {
    let res = {body: JSON.stringify(employeeListMock)};
    spyOn(component, 'getList').and.callThrough();
    spyOn(EmpService, 'v1EmployeesGet$Response').and.returnValue(of(res) as any);
    let addUserBtn = fixture.debugElement.query(By.css('#add-user-btn'));
    addUserBtn.nativeElement.dispatchEvent(new Event('click'));

    tick(1);

    let closeBtn = document.querySelector('#close-btn');
    closeBtn.dispatchEvent(new Event('click'));

    expect(component.searchOfficeEmployee).toBe('');
    expect(component.primaryOfficeId).toBeNull();
    expect(component.OfficeEmployees.length).toBe(5);
    expect(component.oriOfficeEmployees .length).toBe(5);
    expect(component.addLoading).toBe(false);
    expect(component.getList).toHaveBeenCalled();
  }));

  it('add user model should open and get all employee error', fakeAsync(() => {
    spyOn(component, 'getList').and.callThrough();
    spyOn(EmpService, 'v1EmployeesGet$Response').and.returnValue(throwError({error: 'error'}));
    let addUserBtn = fixture.debugElement.query(By.css('#add-user-btn'));
    addUserBtn.nativeElement.dispatchEvent(new Event('click'));

    tick(1);

    let closeBtn = document.querySelector('#close-btn');
    closeBtn.dispatchEvent(new Event('click'));

    expect(component.searchOfficeEmployee).toBe('');
    expect(component.primaryOfficeId).toBeNull();
    expect(component.getList).toHaveBeenCalled();
    expect(component.addLoading).toBe(false);
  }));

  it('add user model should open and get all employee and search keyword should return employee', fakeAsync (() => {
    let res = {body: JSON.stringify(employeeListMock)};
    spyOn(component, 'getList').and.callThrough();
    spyOn(EmpService, 'v1EmployeesGet$Response').and.returnValue(of(res) as any);
    let addUserBtn = fixture.debugElement.query(By.css('#add-user-btn'));
    addUserBtn.nativeElement.dispatchEvent(new Event('click'));
    tick(1);
    let search = document.querySelector('#q');
    component.searchOfficeEmployee = 'Gita';
    search.dispatchEvent(new Event('keyup'));
    tick(2);
    let closeBtn = document.querySelector('#close-btn');
    closeBtn.dispatchEvent(new Event('click'));
    tick(3);
    expect(component.getList).toHaveBeenCalled();
    expect(component.primaryOfficeId).toBeNull();
    expect(component.OfficeEmployees.length).toBe(1);
    flush();
  }));

  it('add user model should open and get all employee and filter primary office should return employee', fakeAsync (() => {
    let res = {body: JSON.stringify(employeeListMock)};
    component.Offices = officeListMock.results;
    let res1 = {body: JSON.stringify({results: [employeeListMock.results[1]]})}
    spyOn(component, 'getList').and.callThrough();
    spyOn(EmpService, 'v1EmployeesGet$Response').and.returnValue(of(res) as any);
    spyOn(EmpService, 'v1EmployeeSearchPrimaryOfficeIdGet$Response').and.returnValue(of(res1) as any);
    let addUserBtn = fixture.debugElement.query(By.css('#add-user-btn'));
    addUserBtn.nativeElement.dispatchEvent(new Event('click'));
    tick(1);
    component.primaryOfficeId = 1654;
    let primaryOfficeSelect = document.querySelector('#primary-office-select');
    primaryOfficeSelect.dispatchEvent(new Event('change'));
    tick(2);
    let closeBtn = document.querySelector('#close-btn');
    closeBtn.dispatchEvent(new Event('click'));
    tick(3);
    expect(component.getList).toHaveBeenCalled();
    expect(component.OfficeEmployees.length).toBe(1);
    flush();
  }));

  it('add user model should open and get all employee and reset primary office  should return employee', fakeAsync (() => {
    let res = {body: JSON.stringify(employeeListMock)};
    component.Offices = officeListMock.results;
    let res1 = {body: JSON.stringify({results: [employeeListMock.results[1]]})}
    spyOn(component, 'getList').and.callThrough();
    spyOn(EmpService, 'v1EmployeesGet$Response').and.returnValue(of(res) as any);
    spyOn(EmpService, 'v1EmployeeSearchPrimaryOfficeIdGet$Response').and.returnValue(of(res1) as any);
    let addUserBtn = fixture.debugElement.query(By.css('#add-user-btn'));
    addUserBtn.nativeElement.dispatchEvent(new Event('click'));
    tick(1);
    component.primaryOfficeId = null;
    let primaryOfficeSelect = document.querySelector('#primary-office-select');
    primaryOfficeSelect.dispatchEvent(new Event('change'));
    tick(2);
    let closeBtn = document.querySelector('#close-btn');
    closeBtn.dispatchEvent(new Event('click'));
    tick(3);
    expect(component.getList).toHaveBeenCalled();
    expect(component.oriOfficeEmployees.length).toBe(5);
    expect(component.OfficeEmployees.length).toBe(5);
    flush();
  }));

  it('groupId params, get email template by id should called ngOnInIt', () => {
    activatedRoute.snapshot.queryParams['groupId'] = 101;
    let res = {body : JSON.stringify(emailTemplateListByIdMock)};
    spyOn(GroupService, 'v1SecurityGroupNotificationSettingsSecurityGroupIdGet$Response').and.returnValue(of(res) as any);

    component.ngOnInit();

    expect(component.EditText).toContain('Edit');
    expect(component.emailTemplateLoading).toBe(false);
    expect(component.emailTemplateList.length).toBe(31);
    expect(component.groupByEmailTemplateList.length).toBe(7);
    expect(component._groupByEmailTemplateList.length).toBe(7);
  });

  it('groupId params, get email template by id results array length 0 should called ngOnInIt emailTemplateLoading false', () => {
    activatedRoute.snapshot.queryParams['groupId'] = 101;
    let res = {body : JSON.stringify({results: []})};
    spyOn(GroupService, 'v1SecurityGroupNotificationSettingsSecurityGroupIdGet$Response').and.returnValue(of(res) as any);

    component.ngOnInit();

    expect(component.EditText).toContain('Edit');
    expect(component.emailTemplateLoading).toBe(false);
  });

  it('groupId params, get email template by id results null should called ngOnInIt emailTemplateLoading false', () => {
    activatedRoute.snapshot.queryParams['groupId'] = 101;
    let res = {body : JSON.stringify(null)};
    spyOn(GroupService, 'v1SecurityGroupNotificationSettingsSecurityGroupIdGet$Response').and.returnValue(of(res) as any);

    component.ngOnInit();

    expect(component.EditText).toContain('Edit');
    expect(component.emailTemplateLoading).toBe(false);
  });

  it('groupId params, get email template by id throw error should called ngOnInIt emailTemplateLoading false', () => {
    activatedRoute.snapshot.queryParams['groupId'] = 101;
    spyOn(GroupService, 'v1SecurityGroupNotificationSettingsSecurityGroupIdGet$Response').and.returnValue(throwError({error: 'error'}));

    component.ngOnInit();

    expect(component.EditText).toContain('Edit');
    expect(component.emailTemplateLoading).toBe(false);
  });


  it('groupId params, get email template by id throw error should called ngOnInIt emailTemplateLoading false', () => {
    activatedRoute.snapshot.queryParams['groupId'] = 334;
    spyOn(component, 'getList').and.callThrough();
    spyOn(GroupService, 'v1SecurityGroupNotificationSettingsSecurityGroupIdGet$Response').and.returnValue(throwError({error: 'error'}));

    component.ngOnInit();

    expect(component.EditText).toContain('Edit');
    expect(component.emailTemplateLoading).toBe(false);
  });

  it('groupId params, Object visibility group by id should called in ngOnInIt', () => {
    activatedRoute.snapshot.queryParams['groupId'] = 334;
    spyOn(moduleConfigurationService, 'v1ModuleConfigurationGet').and.returnValue(of(JSON.stringify(moduleListMock) as any));
    spyOn(MiscServ, 'v1MiscOfficesGet').and.returnValue(of(JSON.stringify(officeListMock) as any));
    spyOn(ObjectVisService, 'v1ObjectVisibilityGroupGroupIdGet').and.returnValue(of(JSON.stringify(groupObjectVisibilityMock) as any));
    spyOn(GroupService, 'v1SecurityGroupGet$Response').and.returnValue(of());

    component.ngOnInit();

    expect(component.permissionsLoading).toBe(false);
    expect(component.moduleList.length).toBe(14);
    expect(component.Offices.length).toBe(10);
    expect(component.groupObjectVisibilty.length).toBe(15);
  });

  it('groupId params, groups lists, group by id users should called in ngOnInIt', () => {
    activatedRoute.snapshot.queryParams['groupId'] = 334;
    spyOn(GroupService, 'v1SecurityGroupGet$Response').and.returnValue(of({body: JSON.stringify(securityGroupMock)} as any));
    spyOn(GroupService, 'v1SecurityGroupUserGroupIdGet$Response').and.returnValue(of({body : JSON.stringify(securityGroupUserMock)} as any));
    spyOn(component, 'updateEmpDatatableFooterPage').and.callThrough();

    component.ngOnInit();

    expect(component.usersLoading).toBe(false);
    expect(component.nameLoading).toBe(false);
    expect(component.EditGroup.id).toBe(334);
    expect(component.GroupEmployees.length).toBe(2);
    expect(component.OriginalGroupEmployees.length).toBe(2);
    expect(component.updateEmpDatatableFooterPage).toHaveBeenCalled();
  });

  it('search user', fakeAsync(() => {
    activatedRoute.snapshot.queryParams['groupId'] = 334;
    component.OriginalGroupEmployees = securityGroupUserMock.results;
    component.searchUser = 'julia@email.com';

    fixture.detectChanges();
    tick(1)
    let addUserBtn = fixture.debugElement.query(By.css('#qUsers'));
    addUserBtn.nativeElement.dispatchEvent(new Event('input'));
    tick(2)

    expect(component.GroupEmployees.length).toBe(1)
    flush();
  }));

  it('employee add function', () => {
    spyOn(component, 'updateEmpDatatableFooterPage').and.callThrough();
    component.OfficeEmployees = employeeListMock.results;
    component.selected = [6731];

    component.OnEmployeesAdded();

    expect(component.GroupEmployees.length).toBe(1);
    expect(component.OriginalGroupEmployees.length).toBe(1);
    expect(component.dataEntered).toBe(true);
    expect(component.updateEmpDatatableFooterPage).toHaveBeenCalled();
  });

  it('employee remove function', () => {
    spyOn(component, 'updateEmpDatatableFooterPage').and.callThrough();
    component.GroupEmployees = JSON.parse(JSON.stringify(employeeListMock.results));
    component.selected = [{id: 6731}];

    component.OnEmployeesRemoved(6731, null, null);

    expect(component.GroupEmployees.length).toBe(4);
    expect(component.dataEntered).toBe(true);
    expect(component.updateEmpDatatableFooterPage).toHaveBeenCalled();
  });

  it('set notification click model should open', fakeAsync(() => {
    spyOn(modalService, 'open').and.returnValue({result: Promise.resolve(true)} as any);
    component.emailTemplateLoading = false;
    component._groupByEmailTemplateList = groupByEmailTemplateMock
    let setNotificationBtn = fixture.debugElement.query(By.css('#set-notification-btn'));
    setNotificationBtn.nativeElement.dispatchEvent(new Event('click'));

    tick(1);
    fixture.detectChanges();

    expect(modalService.open).toHaveBeenCalled();
  }));

  it('should create group name error if name not entered', () => {
    spyOn(component, 'onFinalSave').and.callThrough();

    let saveBtn = fixture.debugElement.query(By.css('#save-btn'));
    saveBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.editGroupErrMsg).toContain('Please enter a group name.');

  });

  it('should create group show permission error if not selected', () => {
    spyOn(component, 'onFinalSave').and.callThrough();
    spyOn(toastDisplay, 'showError').and.callThrough();
    component.EditGroup.name = 'unit test create group';
    component.moduleList = moduleListMock.results;

    let saveBtn = fixture.debugElement.query(By.css('#save-btn'));
    saveBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.onFinalSave).toHaveBeenCalled();
    expect(toastDisplay.showError).toHaveBeenCalledWith('Please select all modules permission.');
  });

  it('should create group success', () => {
    const navigateSpy = spyOn(router, 'navigate');
    spyOn(toastDisplay, 'showSuccess').and.callThrough();
    spyOn(component, 'onFinalSave').and.callThrough();
    spyOn(GroupService, 'v1SecurityGroupPost$Json$Response').and.returnValue(of({body: JSON.stringify({results: 102})} as any));
    spyOn(ObjectVisService, 'v1ObjectVisibilityGroupGroupIdPost$Json$Response').and.returnValue(of({results: true} as any));
    spyOn(ObjectVisService, 'v1ObjectVisibilityUserGet').and.returnValue(of(JSON.stringify({results: permissionListMock}) as any));
    component.EditGroup.name = 'unit test create group';
    component.moduleList = moduleSelectedCreateMock;

    let saveBtn = fixture.debugElement.query(By.css('#save-btn'));
    saveBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.onFinalSave).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/access-management/list']);
    expect(toastDisplay.showSuccess).toHaveBeenCalledWith('Group created.');
    expect(GroupService.v1SecurityGroupPost$Json$Response).toHaveBeenCalled();
    expect(ObjectVisService.v1ObjectVisibilityGroupGroupIdPost$Json$Response).toHaveBeenCalled();
    expect(ObjectVisService.v1ObjectVisibilityUserGet).toHaveBeenCalled();
  });

  it('should create group catch error', () => {
    spyOn(component, 'onFinalSave').and.callThrough();
    spyOn(GroupService, 'v1SecurityGroupPost$Json$Response').and.returnValue(throwError({error: 'error'}));
    component.EditGroup.name = 'unit test create group';
    component.moduleList = moduleSelectedCreateMock;

    let saveBtn = fixture.debugElement.query(By.css('#save-btn'));
    saveBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.onFinalSave).toHaveBeenCalled();
    expect(component.saveLoader).toBe(false);
  });


  it('should update group success', () => {
    activatedRoute.snapshot.queryParams['groupId'] = 334;
    component.ngOnInit();
    const navigateSpy = spyOn(router, 'navigate');
    spyOn(toastDisplay, 'showSuccess').and.callThrough();
    spyOn(component, 'onFinalSave').and.callThrough();
    spyOn(GroupService, 'v1SecurityGroupPut$Json$Response').and.returnValue(of({body: JSON.stringify({results: 102})} as any));
    spyOn(ObjectVisService, 'v1ObjectVisibilityGroupGroupIdPost$Json$Response').and.returnValue(of({results: true} as any));
    spyOn(ObjectVisService, 'v1ObjectVisibilityUserGet').and.returnValue(of(JSON.stringify({results: permissionListMock}) as any));
    component.EditGroup.name = 'unit test create group';
    component.moduleList = moduleSelectedCreateMock;
    let saveBtn = fixture.debugElement.query(By.css('#save-btn'));
    saveBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.onFinalSave).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/access-management/list']);
    expect(toastDisplay.showSuccess).toHaveBeenCalledWith('Group updated.');
    expect(GroupService.v1SecurityGroupPut$Json$Response).toHaveBeenCalled();
    expect(ObjectVisService.v1ObjectVisibilityGroupGroupIdPost$Json$Response).toHaveBeenCalled();
    expect(ObjectVisService.v1ObjectVisibilityUserGet).toHaveBeenCalled();
  });

  it('should update group catch error', () => {
    activatedRoute.snapshot.queryParams['groupId'] = 334;
    component.ngOnInit();
    spyOn(component, 'onFinalSave').and.callThrough();
    spyOn(GroupService, 'v1SecurityGroupPut$Json$Response').and.returnValue(throwError({error: 'error'}));
    component.EditGroup.name = 'unit test create group';
    component.moduleList = moduleSelectedCreateMock;

    let saveBtn = fixture.debugElement.query(By.css('#save-btn'));
    saveBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.onFinalSave).toHaveBeenCalled();
    expect(component.saveLoader).toBe(false);
  });

  it('on radio select function isNoVisibility checked', () => {
    component.moduleList = moduleListMock.results;
    fixture.detectChanges();
    spyOn(component, 'onRadioSelected').and.callThrough();
    let isNoVisibility = fixture.debugElement.query(By.css('#novis1'));
    isNoVisibility.nativeElement.checked = true;
    isNoVisibility.nativeElement.dispatchEvent(new Event('change'));

    expect(component.onRadioSelected).toHaveBeenCalled();
    expect(component.moduleList[0].isNoVisibility).toBe(true);
  });

  it('on radio select function isViewOnly checked', () => {
    component.moduleList = moduleListMock.results;
    fixture.detectChanges();
    spyOn(component, 'onRadioSelected').and.callThrough();
    let viewCheck = fixture.debugElement.query(By.css('#view3'));
    viewCheck.nativeElement.checked = true;
    viewCheck.nativeElement.dispatchEvent(new Event('change'));

    expect(component.onRadioSelected).toHaveBeenCalled();
    expect(component.moduleList[2].isViewOnly).toBe(true);
  });

  it('on radio select function isEdit checked', () => {
    component.moduleList = moduleListMock.results;
    fixture.detectChanges();
    spyOn(component, 'onRadioSelected').and.callThrough();
    let isEdit = fixture.debugElement.query(By.css('#edit5'));
    isEdit.nativeElement.checked = true;
    isEdit.nativeElement.dispatchEvent(new Event('change'));

    expect(component.onRadioSelected).toHaveBeenCalled();
    expect(component.moduleList[4].isEdit).toBe(true);
  });

  it('on radio select function isAdmin checked', () => {
    component.moduleList = moduleListMock.results;
    fixture.detectChanges();
    spyOn(component, 'onRadioSelected').and.callThrough();
    let isAdmin = fixture.debugElement.query(By.css('#admin4'));
    isAdmin.nativeElement.checked = true;
    isAdmin.nativeElement.dispatchEvent(new Event('change'));

    expect(component.onRadioSelected).toHaveBeenCalled();
    expect(component.moduleList[3].isAdmin).toBe(true);
  });
});
