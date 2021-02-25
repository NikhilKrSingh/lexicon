import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { BillingService, TenantService } from 'src/common/swagger-providers/services';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SharedModule } from '../../../shared/shared.module';
import { ToastrModule } from 'ngx-toastr';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { of, throwError } from 'rxjs';
import * as _ from 'lodash';


import { ConsultationCodesComponent } from './consultation-codes.component'

let profileMock = {
    "tenantTier": {
      "tierLevel": 2,
      "tierName": "Ascending"
    },
    "id": 1304,
    "userName": "adminLex@yopmail.com",
    "password": "1otYec3T5BXeGjL8X6zgcDhVNhk32rlfbuEOwATQoSE=",
    "tenantId": 1006,
    "officeId": 5,
    "salutation": null,
    "companyName": null,
    "firstName": "Admin",
    "middleName": "",
    "lastName": "Lexicon dev",
    "suffix": null,
    "email": "adminLex@yopmail.com",
    "maidenName": "",
    "nickName": "",
    "commonName": "",
    "jobTitle": "Tenant Admin",
    "primaryPhone": null,
    "cellPhone": null,
    "fax": null,
    "employmentStartDate": null,
    "employmentEndDate": null,
    "primaryContactId": null,
    "addressId": null,
    "isCompany": false,
    "role": null,
    "preferredContactMethod": null,
    "uniqueNumber": 0,
    "isVisible": true,
    "isArchived": false,
    "groups": [
      {
        "id": 179,
        "name": "TenantAdmin"
      },
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
        "id": 294,
        "name": "Consult Attorney"
      },
      {
        "id": 361,
        "name": "Admin Setting TC1"
      }
    ]
};

let firmDetailsMock = {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDYxOTU0NzEsImV4cCI6MTYwNjIzODY3MSwiaWF0IjoxNjA2MTk1NDcxfQ.H9aLSZk7k1iIA70sz3pZARVZr8l8G7zGprpQJ6zdii8",
    "results": {
      "id": 1006,
      "name": "Flash 1.0",
      "appName": "https://sc1.lexiconservices.com/",
      "guid": "dcb04bbb-c123-485b-833b-33028ed12ced",
      "primaryContactId": null,
      "createdBy": 8,
      "createdAt": "2019-12-24T05:54:33.28",
      "updatedBy": 8226,
      "lastUpdated": "2020-11-23T11:15:27.987",
      "isActive": true,
      "office": []
    }
};

let tenantProfileMock = {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDYxOTU0NzEsImV4cCI6MTYwNjIzODY3MSwiaWF0IjoxNjA2MTk1NDcxfQ.H9aLSZk7k1iIA70sz3pZARVZr8l8G7zGprpQJ6zdii8",
    "results": {
      "id": 7,
      "tenantId": 1006,
      "tenantName": "Flash 1.0",
      "esign": null,
      "internalLogo": null,
      "faviconicon": null,
      "timeRoundInterval": null,
      "timeDisplayFormat": null,
      "changeStatusNotes": null,
      "tier": {
        "tierLevel": 2,
        "tierName": "Ascending"
      },
      "logo": null,
      "favicon": null
    }
};

let billingListMock = {
    results: [ 
        {id: 1, code: "HOURLY", name: "Hourly", categoryCode: "RATE_BILLING_TYPE"},
        {id: 2, code: "FIXED", name: "Fixed", categoryCode: "RATE_BILLING_TYPE"},
        {id: 3, code: "CLIENT", name: "Client", categoryCode: "RATE_BILLING_TO"},
        {id: 9, code: "PER_UNIT", name: "Per Unit", categoryCode: "DISBURSEMENT_TYPE_BILL_TYPE"},
        {id: 10, code: "FIXED", name: "Fixed", categoryCode: "DISBURSEMENT_TYPE_BILL_TYPE"},
        {id: 11, code: "OPEN", name: "Open", categoryCode: "DISBURSEMENT_TYPE_BILL_TYPE"},
        {id: 12, code: "HARD", name: "Hard", categoryCode: "DISBURSEMENT_TYPE_TYPE"},
        {id: 13, code: "SOFT", name: "Soft", categoryCode: "DISBURSEMENT_TYPE_TYPE"},
        {id: 54, code: "OVERHEAD", name: "Overhead", categoryCode: "RATE_BILLING_TO"},
        {id: 190, code: "FIXED", name: "Fixed", categoryCode: "CONSULTATION_FEE_BILL_TYPE"},
        {id: 191, code: "HOURLY", name: "Hourly", categoryCode: "CONSULTATION_FEE_BILL_TYPE"},
        {id: 192, code: "OPEN", name: "Open", categoryCode: "CONSULTATION_FEE_BILL_TYPE"}
    ],
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiI3MTUyIiwiYWN0b3J0IjoiU2FjaGluIiwiYW1yIjoiTWhldHJlIiwiYXVkIjoiRW1wbG95ZWVARXZlcnlvbmVAYWRtaW5AQ29weSAtIDA3IG9jdC12a2phZ2F0IiwiYXpwIjoiMTAwNiIsImVtYWlsIjoic2FjaGlubUB5b3BtYWlsLmNvbSIsImZhbWlseV9uYW1lIjoiQWRtaW4iLCJnZW5kZXIiOiIiLCJUaWVyIjoiQXNjZW5kaW5nIiwiQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndHd05MRGtXcTBPYW52STB4U3RWd2NtUDh3eUY2MnZNZEptTjlkVHk5eTgrUTJTUFZpOVBNNjd4cG9zdmJHZUtyYVg4dE1Fc1JyOTBaLzBLemxmUjBiTT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiR1ZKdVBCTWRzRGFHNTV1dHA3TTlKbDE3MFZjZ3cweW90U2FjQURZbi9sbktXRzZQc0Roejh2ejk3RlBacGxxQkRZNkZQdjcyeWtjWjI1bWZtczF2d0d3TkxEa1dxME9hbnZJMHhTdFZ3Y21QOHd5RjYydk1kSm1OOWRUeTl5OCtRMlNQVmk5UE02N3hwb3N2YkdlS3JhWDh0TUVzUnI5MFovMEt6bGZSMGJNPSIsIm5iZiI6MTYxMTA4NjIyNCwiZXhwIjoxNjExMTI5NDI0LCJpYXQiOjE2MTEwODYyMjR9.fVC_xf3DUuWMENARBCnUhWzqrB4Gl8u5Zgat-POhwZo"
}

let usedCodesMock = { 
    results: {
        consultationFeeCodes: ["13000", "13001", "13002", "13003", "13004", "13005", "13006", "13007", "13008", "13009", "14000"],
        disbursementTypes: ["20004", "50029", "6059", "6060", "20012", "1451", "1607", "50032", "6056", "5966", "39", "50027"],
        fixedFeeAddOns: ["12000", "12001", "12002", "12003", "12004", "12005", "12006", "12007", "12008", "12009", "12010"],
        fixedFeeServices: ["11002", "11003", "11004", "11005", "11006", "11007", "11008", "11009", "11010", "11011", "11012"],
        hourlyCodes: ["15306", "10008", "90001", "90008", "90041", "90067", "15329", "90014", "90090", "15275", "90011"],
        reversedCheckReasonCodes: ["#", "30053", "50000", "50034", "50036", "50037", "50038", "50039", "50040", "50041", "50042"],
        writeDownCodes: ["30000", "30001", "30002", "30003", "30004", "30005", "30006", "30007", "30008", "30009", "30010"],
        writeOffCodes: ["1295", "256", "40000", "40001", "40002", "40003", "40004", "40005", "40006", "40007", "40008"]
    },
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiI3MTUyIiwiYWN0b3J0IjoiU2FjaGluIiwiYW1yIjoiTWhldHJlIiwiYXVkIjoiRW1wbG95ZWVARXZlcnlvbmVAYWRtaW5AQ29weSAtIDA3IG9jdC12a2phZ2F0IiwiYXpwIjoiMTAwNiIsImVtYWlsIjoic2FjaGlubUB5b3BtYWlsLmNvbSIsImZhbWlseV9uYW1lIjoiQWRtaW4iLCJnZW5kZXIiOiIiLCJUaWVyIjoiQXNjZW5kaW5nIiwiQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndHd05MRGtXcTBPYW52STB4U3RWd2NtUDh3eUY2MnZNZEptTjlkVHk5eTgrUTJTUFZpOVBNNjd4cG9zdmJHZUtyYVg4dE1Fc1JyOTBaLzBLemxmUjBiTT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiR1ZKdVBCTWRzRGFHNTV1dHA3TTlKbDE3MFZjZ3cweW90U2FjQURZbi9sbktXRzZQc0Roejh2ejk3RlBacGxxQkRZNkZQdjcyeWtjWjI1bWZtczF2d0d3TkxEa1dxME9hbnZJMHhTdFZ3Y21QOHd5RjYydk1kSm1OOWRUeTl5OCtRMlNQVmk5UE02N3hwb3N2YkdlS3JhWDh0TUVzUnI5MFovMEt6bGZSMGJNPSIsIm5iZiI6MTYxMTA4NjIyNCwiZXhwIjoxNjExMTI5NDI0LCJpYXQiOjE2MTEwODYyMjR9.fVC_xf3DUuWMENARBCnUhWzqrB4Gl8u5Zgat-POhwZo"
};

let consultationCodeMock = {
  results: [
    {
      billTypeId: 190,
      billTypeName: "Fixed",
      code: "13000",
      id: 1,
      name: "Fixed-Consultation-1",
      rate: 100,
      status: "Active"
    },
    {
      billTypeId: 192,
      billTypeName: "Open",
      code: "14000",
      id: 2,
      name: "Open-Consultation",
      rate: null,
      status: "Active",
    },
    {
      billTypeId: 191,
      billTypeName: "Hourly",
      code: "14001",
      id: 3,
      name: "Hourly-Consultation",
      rate: 110,
      status: "Active",
    },
    {
      billTypeId: 190,
      billTypeName: "Fixed",
      code: "13007",
      id: 10,
      name: "test6",
      rate: 55,
      status: "Disabled"
    },
    {
      billTypeId: 190,
      billTypeName: "Fixed",
      code: "13008",
      id: 11,
      name: "test7",
      rate: 35,
      status: "Active",
    },
    {
      billTypeId: 190,
      billTypeName: "Fixed",
      code: "13009",
      id: 12,
      name: "It is a long established fact that a reader will b",
      rate: 0,
      status: "Active",
    }
  ],
token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiI3MTUyIiwiYWN0b3J0IjoiU2FjaGluIiwiYW1yIjoiTWhldHJlIiwiYXVkIjoiRW1wbG95ZWVARXZlcnlvbmVAYWRtaW5AQ29weSAtIDA3IG9jdC12a2phZ2F0IiwiYXpwIjoiMTAwNiIsImVtYWlsIjoic2FjaGlubUB5b3BtYWlsLmNvbSIsImZhbWlseV9uYW1lIjoiQWRtaW4iLCJnZW5kZXIiOiIiLCJUaWVyIjoiQXNjZW5kaW5nIiwiQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndHd05MRGtXcTBPYW52STB4U3RWd2NtUDh3eUY2MnZNZEptTjlkVHk5eTgrUTJTUFZpOVBNNjd4cG9zdmJHZUtyYVg4dE1Fc1JyOTBaLzBLemxmUjBiTT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiR1ZKdVBCTWRzRGFHNTV1dHA3TTlKbDE3MFZjZ3cweW90U2FjQURZbi9sbktXRzZQc0Roejh2ejk3RlBacGxxQkRZNkZQdjcyeWtjWjI1bWZtczF2d0d3TkxEa1dxME9hbnZJMHhTdFZ3Y21QOHd5RjYydk1kSm1OOWRUeTl5OCtRMlNQVmk5UE02N3hwb3N2YkdlS3JhWDh0TUVzUnI5MFovMEt6bGZSMGJNPSIsIm5iZiI6MTYxMTI0MDI0OSwiZXhwIjoxNjExMjgzNDQ5LCJpYXQiOjE2MTEyNDAyNDl9.qyyaE0cgZ8AjIzdoK3Ey3Lf_-VPnKr-dH5MyniHOrVc"
}

describe('ConsultationCodesComponent', () => {
    let component: ConsultationCodesComponent;
    let fixture: ComponentFixture<ConsultationCodesComponent>;
    let billingService: BillingService;
    let tenantService: TenantService;
    let modalService: NgbModal;
    let toastDisplay: ToastDisplay;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule,
                RouterTestingModule,
                SharedModule,
                ToastrModule.forRoot({
                    closeButton: true
                }),
            ],
            declarations: [ ConsultationCodesComponent ]
        })
        .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ConsultationCodesComponent);
        modalService = TestBed.get(NgbModal);
        toastDisplay = TestBed.get(ToastDisplay);
        billingService = TestBed.get(BillingService);
        tenantService = TestBed.get(TenantService)
        component = fixture.componentInstance;
        fixture.detectChanges();
    })

    it('should create', () => {
        expect(component).toBeTruthy();
    })

    it('should get tenant information onInit', () => {
        UtilsHelper.setObject('profile', profileMock);
        
        component.ngOnInit();

        expect(component.tenantTierName).toBe(profileMock.tenantTier.tierName)
        expect(component.firmDetails.id).toBe(profileMock.tenantId)
    })

    it('should get used billing codes on init', () => {
        let res = JSON.stringify(usedCodesMock)
        spyOn(component, 'getUsedBillingCodes').and.callThrough();
        spyOn(billingService, 'v1BillingUsedBillingCodesGet').and.returnValue(of(res) as any);

        component.ngOnInit()

        expect(component.usedCodeRange).toEqual(usedCodesMock.results)
    })

    it('should get billing list items on init', () => {
        let res = JSON.stringify(usedCodesMock)
        let res2 = JSON.stringify(billingListMock)
        spyOn(component, 'getUsedBillingCodes').and.callThrough();
        spyOn(billingService, 'v1BillingUsedBillingCodesGet').and.returnValue(of(res) as any);
        spyOn(component, 'getListItems').and.callThrough();
        spyOn(billingService, 'v1BillingBillingcodelistitemsGet').and.returnValue(of(res2) as any);

        component.ngOnInit()

        expect(component.listItems).toEqual(billingListMock.results)
        expect(component.consultationBillingTypeList).toEqual(billingListMock.results.filter(a => a.categoryCode == 'CONSULTATION_FEE_BILL_TYPE'));
    })

    it('should get consultation codes on init', () => {
        let res = JSON.stringify(usedCodesMock)
        let res2 = JSON.stringify(billingListMock)
        let res3 = JSON.stringify(consultationCodeMock)
        let sortedResults = _.orderBy(
          consultationCodeMock.results,
          a => a.code,
          'asc'
        )
        spyOn(component, 'getUsedBillingCodes').and.callThrough();
        spyOn(billingService, 'v1BillingUsedBillingCodesGet').and.returnValue(of(res) as any);
        spyOn(component, 'getListItems').and.callThrough();
        spyOn(billingService, 'v1BillingBillingcodelistitemsGet').and.returnValue(of(res2) as any);
        spyOn(component, 'getConsultationCodes').and.callThrough();
        spyOn(billingService, 'v1BillingConsultationFeeCodesGet').and.returnValue(of(res3) as any)

        component.ngOnInit()

        expect(component.originalConsultationCodes).toEqual(sortedResults);
        expect(component.consultationCodes).toEqual(sortedResults);
        expect(component.page.totalElements).toBe(consultationCodeMock.results.length);
        expect(component.page.totalPages).toBe(Math.ceil(
          consultationCodeMock.results.length / component.page.size
        ));
    })

})