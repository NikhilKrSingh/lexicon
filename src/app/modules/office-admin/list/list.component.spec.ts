import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { reducers } from 'src/app/store';
import { OfficeService } from 'src/common/swagger-providers/services';
import { SharedModule } from '../../shared/shared.module';
import { UtilsHelper } from '../../shared/utils.helper';
import { ListComponent } from './list.component';

let officeMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDM5NDg0MDAsImV4cCI6MTYwMzk5MTYwMCwiaWF0IjoxNjAzOTQ4NDAwfQ.C_PkKOriffux_MaRL5rxWWZNSclc2mVjZtP5L_JSEIo",
  "results": [
    {
      "id": 1709,
      "officeName": " Andrews Office",
      "city": "Dothan",
      "state": "Alabama",
      "status": "Active",
      "employeeCount": 125,
      "address": "3300 South Oates Street Dothan - AL 36301",
      "phoneNumbers": [
        {
          "id": 61714,
          "type": "Phone1",
          "number": "5555555555",
          "personId": null
        },
        {
          "id": 62749,
          "type": "Phone2",
          "number": "",
          "personId": null
        }
      ],
      "officeHoliday": [
        {
          "holiday": "Holiday 1",
          "holidayDate": "2020-03-01T00:00:00"
        },
        {
          "holiday": "Holiday 2",
          "holidayDate": "2020-04-01T00:00:00"
        },
        {
          "holiday": "Holiday 3",
          "holidayDate": "2020-07-06T00:00:00"
        },
        {
          "holiday": "Birthday",
          "holidayDate": "2020-07-22T00:00:00"
        }
      ],
      "officePractice": [
        "Corporate Law",
        "Criminal Law",
        "Accidents",
        "Estate Planning",
        "Medicaid Chronic",
        "Guardianship",
        "Seminar"
      ],
      "openingDate": "2020-07-21T00:00:00",
      "tenantId": 1006,
      "acceptsInitialConsultation": true,
      "closingDate": null,
      "effectiveDate": null
    },
    {
      "id": 1654,
      "officeName": "1 Billing Office",
      "city": "Orlando",
      "state": "California",
      "status": "Active",
      "employeeCount": 123,
      "address": "7575 Dr Phillips Blvd Orlando - CA 65012",
      "phoneNumbers": [
        {
          "id": 61374,
          "type": "Phone1",
          "number": "1111111111",
          "personId": null
        }
      ],
      "officeHoliday": [
        {
          "holiday": "Holiday 1",
          "holidayDate": "2020-03-01T00:00:00"
        },
        {
          "holiday": "Holiday 2",
          "holidayDate": "2020-04-01T00:00:00"
        }
      ],
      "officePractice": [
        "Corporate Law",
        "Criminal Law",
        "Accidents",
        "Estate Planning",
        "Elder Law",
        "Ananta Test"
      ],
      "openingDate": "2020-07-01T00:00:00",
      "tenantId": 1006,
      "acceptsInitialConsultation": true,
      "closingDate": null,
      "effectiveDate": null
    },
    {
      "id": 1549,
      "officeName": "1 June Office",
      "city": "Chicago",
      "state": "Illinois",
      "status": "Active",
      "employeeCount": 55,
      "address": "11 E Hubbard St Chicago - IL 60611",
      "phoneNumbers": [
        {
          "id": 60688,
          "type": "Phone1",
          "number": "1111111111",
          "personId": null
        }
      ],
      "officeHoliday": [
        {
          "holiday": "Holiday 1",
          "holidayDate": "2020-03-01T00:00:00"
        },
        {
          "holiday": "Holiday 2",
          "holidayDate": "2020-04-01T00:00:00"
        },
        {
          "holiday": "Holiday 3",
          "holidayDate": "2020-05-01T00:00:00"
        }
      ],
      "officePractice": [
        "Family Law",
        "Corporate Law",
        "Mergers & Acquisitions",
        "Criminal Law",
        "Sports & Entertainment Law",
        "Intellectual Property Law",
        "International Law",
        "Labor & Employment Law",
        "Estates & Trusts",
        "Tax Law",
        "Extra Practice area new ",
        "Extra Practice Area",
        "Accidents",
        "Estate Planning",
        "Elder Law",
        "Ananta Test"
      ],
      "openingDate": "2020-06-01T00:00:00",
      "tenantId": 1006,
      "acceptsInitialConsultation": true,
      "closingDate": null,
      "effectiveDate": null
    },
    {
      "id": 1453,
      "officeName": "1 Office",
      "city": "Orlando",
      "state": "Florida",
      "status": "Active",
      "employeeCount": 67,
      "address": "7575 Dr Phillips Blvd Orlando - FL 32819",
      "phoneNumbers": [
        {
          "id": 59524,
          "type": "Phone1",
          "number": "1111111111",
          "personId": null
        },
        {
          "id": 59525,
          "type": "Phone2",
          "number": "2222222222",
          "personId": null
        },
        {
          "id": 59526,
          "type": "Fax",
          "number": "3333333333",
          "personId": null
        }
      ],
      "officeHoliday": [
        {
          "holiday": "Holiday 1",
          "holidayDate": "2020-03-01T00:00:00"
        },
        {
          "holiday": "Holiday 2",
          "holidayDate": "2020-04-01T00:00:00"
        },
        {
          "holiday": "Holiday 3",
          "holidayDate": "2020-05-01T00:00:00"
        },
        {
          "holiday": "Ugadi ",
          "holidayDate": "2020-04-06T00:00:00"
        }
      ],
      "officePractice": [
        "Family Law",
        "Corporate Law",
        "Mergers & Acquisitions",
        "Criminal Law",
        "Intellectual Property Law",
        "International Law",
        "Labor & Employment Law",
        "Estates & Trusts",
        "Accidents",
        "Estate Planning",
        "Elder Law"
      ],
      "openingDate": "2020-04-01T00:00:00",
      "tenantId": 1006,
      "acceptsInitialConsultation": false,
      "closingDate": null,
      "effectiveDate": null
    },
    {
      "id": 1620,
      "officeName": "Yahoo office",
      "city": "Bombay",
      "state": "Alabama",
      "status": "Active",
      "employeeCount": 0,
      "address": "yahoo address 1 Bombay - AL 382481",
      "phoneNumbers": [
        {
          "id": 61096,
          "type": "Phone1",
          "number": "5485458545",
          "personId": null
        },
        {
          "id": 61097,
          "type": "Phone2",
          "number": "2225552222",
          "personId": null
        },
        {
          "id": 61098,
          "type": "Fax",
          "number": "2225552222",
          "personId": null
        }
      ],
      "officeHoliday": [
        {
          "holiday": "Holiday 1",
          "holidayDate": "2020-03-01T00:00:00"
        },
        {
          "holiday": "Holiday 2",
          "holidayDate": "2020-04-01T00:00:00"
        }
      ],
      "officePractice": [
        "Family Law",
        "Corporate Law",
        "Criminal Law",
        "Intellectual Property Law",
        "Estates & Trusts",
        "Accidents",
        "Estate Planning",
        "Elder Law",
        "Ananta Test"
      ],
      "openingDate": "2020-06-25T00:00:00",
      "tenantId": 1006,
      "acceptsInitialConsultation": true,
      "closingDate": null,
      "effectiveDate": null
    },
    {
      "id": 1308,
      "officeName": "YAHOOOOO",
      "city": "qwqw",
      "state": "Florida",
      "status": "Active",
      "employeeCount": 1,
      "address": "ABC qwqw - FL 32003",
      "phoneNumbers": [
        {
          "id": 57712,
          "type": "Phone1",
          "number": "9999999999",
          "personId": null
        }
      ],
      "officeHoliday": [],
      "officePractice": [],
      "openingDate": null,
      "tenantId": 1006,
      "acceptsInitialConsultation": false,
      "closingDate": null,
      "effectiveDate": null
    },
    {
      "id": 1718,
      "officeName": "Yes Bank",
      "city": "Dothan",
      "state": "Alabama",
      "status": "Archived",
      "employeeCount": 0,
      "address": "3300 South Oates Street Dothan - AL 36301",
      "phoneNumbers": [
        {
          "id": 61757,
          "type": "Phone1",
          "number": "1234563132",
          "personId": null
        }
      ],
      "officeHoliday": [
        {
          "holiday": "Holiday 1",
          "holidayDate": "2020-03-01T00:00:00"
        },
        {
          "holiday": "Holiday 2",
          "holidayDate": "2020-04-01T00:00:00"
        },
        {
          "holiday": "Holiday 3",
          "holidayDate": "2020-07-06T00:00:00"
        },
        {
          "holiday": "Birthday",
          "holidayDate": "2020-07-22T00:00:00"
        }
      ],
      "officePractice": [
        "Corporate Law",
        "Criminal Law",
        "Accidents",
        "Ananta Test"
      ],
      "openingDate": "2020-07-24T00:00:00",
      "tenantId": 1006,
      "acceptsInitialConsultation": true,
      "closingDate": null,
      "effectiveDate": null
    }
  ]
};

const stateMock = [
  {id: 1, name: "Alabama"},
  {id: 2, name: "California"},
  {id: 3, name: "Illinois"},
  {id: 4, name: "Florida"}
];

const statusMock = [
  {id: 1, name: "Active"},
  {id: 2, name: "Archived"}
];


const columunMock = [
  {Name: "id", DisplayName: "Id", isChecked: true},
  {Name: "officeName", DisplayName: "OfficeName", isChecked: true},
  {Name: "city", DisplayName: "City"},
  {Name: "state", DisplayName: "State"},
  {Name: "status", DisplayName: "Status"},
  {Name: "employeeCount", DisplayName: "EmployeeCount"},
  {Name: "address", DisplayName: "Address"},
  {Name: "phoneNumbers", DisplayName: "PhoneNumbers"},
  {Name: "officeHoliday", DisplayName: "OfficeHoliday"},
  {Name: "officePractice", DisplayName: "OfficePractice"},
  {Name: "openingDate", DisplayName: "OpeningDate"},
  {Name: "tenantId", DisplayName: "TenantId"},
  {Name: "acceptsInitialConsultation", DisplayName: "AcceptsInitialConsultation"},
  {Name: "closingDate", DisplayName: "ClosingDate"},
  {Name: "effectiveDate", DisplayName: "EffectiveDate"}
];

@Component({
  template: ''
})
class DummyComponent {
}

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;
  let officeService: OfficeService;
  let exporttocsvService: ExporttocsvService;
  let router: Router;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        RouterTestingModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
        StoreModule.forRoot(reducers),
      ],
      declarations: [
        ListComponent,
        DummyComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListComponent);
    officeService = TestBed.get(OfficeService);
    exporttocsvService = TestBed.get(ExporttocsvService);
    router = TestBed.get(Router);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getOfficeList, column list, stateList, statusList called in ngOnInIt', () => {
    const res = JSON.stringify(officeMock);
    spyOn(officeService, 'v1OfficeTenantGet').and.returnValue(of(res as any));
    spyOn(UtilsHelper, 'aftertableInit').and.callThrough();
    spyOn(UtilsHelper, 'addkeysIncolumnlist').and.callThrough();
    spyOn(component, 'updateDatatableFooterPage').and.callThrough();

    component.ngOnInit();

    fixture.detectChanges();
    expect(component.rows.length).toBe(7);
    expect(component.loading).toBe(false);
    expect(UtilsHelper.aftertableInit).toHaveBeenCalled();
    expect(UtilsHelper.addkeysIncolumnlist).toHaveBeenCalled();
    expect(component.updateDatatableFooterPage).toHaveBeenCalled();
    expect(component.columnList.length).toBe(15);
    expect(component.stateList.length).toBe(4);
    expect(component.statusList.length).toBe(2);

  });

  it('multi select State filter should return filtered office', () => {
    component.oriArr = officeMock.results;
    component.stateList = stateMock;
    component.selectedState = [1, 2];

    component.applyFilter();

    expect(component.rows.length).toBe(4);
  });

  it('multi select status filter should return filtered office', () => {
    component.oriArr = officeMock.results;
    component.statusList = statusMock;
    component.selectedStatus = [2];

    component.applyFilter();

    expect(component.rows.length).toBe(1);
  });

  it('OFFICE_MANAGEMENTisAdmin permission should show add new office button and view office from action', () => {
    component.rows = officeMock.results;
    component.permissionList.OFFICE_MANAGEMENTisAdmin = true;
    fixture.detectChanges();
    const btn1 = fixture.debugElement.nativeElement.querySelector('#export-csv');
    const btn2 = fixture.debugElement.nativeElement.querySelector('#add-new-office');
    const listingIndexAnchor = fixture.debugElement.nativeElement.querySelector('#view-office-index-0');
    const listingIndexAnchor1 = fixture.debugElement.nativeElement.querySelector('#reopen-office-index-0');
    const listingIndexAnchor2 = fixture.debugElement.nativeElement.querySelector('#close-office-index-0');
    fixture.detectChanges();

    expect(btn1.innerText).toContain('Export to CSV');
    expect(btn2.innerText).toContain('Add New Office');
    expect(listingIndexAnchor.innerText).toContain('View Office');
    expect(listingIndexAnchor1).toBeNull();
    expect(listingIndexAnchor2.innerText).toContain('Close Office');
  });


  it('OFFICE_MANAGEMENTisViewOnly permission should View Office and render correct url', () => {
    component.rows = officeMock.results;
    component.permissionList.OFFICE_MANAGEMENTisViewOnly = true;
    fixture.detectChanges();
    const anchorView = fixture.debugElement.nativeElement.querySelector('#view-office-index-0');
    expect(anchorView.getAttribute('href')).toBe('/office/detail?officeId=1709&state=view');
  });

  it('Search keyword `1 billing` should return filtered office', () => {
    component.oriArr = officeMock.results;
    spyOn(component, 'applyFilter').and.callThrough();
    fixture.detectChanges();
    let inputSearch = fixture.debugElement.nativeElement.querySelector('#search-office');
    inputSearch.value = '1 Billing';
    let e = new KeyboardEvent("keyup", {
      key: "a",
      bubbles: true,
      cancelable: true,
    });
    inputSearch.dispatchEvent(e);

    expect(component.searchString).toContain('1 Billing');
    expect(component.rows.length).toBe(1);
    expect(component.applyFilter).toHaveBeenCalled();
  });

  it('export csv model should open and download csv if is office admin permission', () => {
    component.columnList = columunMock;
    component.rows = officeMock.results;
    component.oriArr = officeMock.results;
    component.permissionList.OFFICE_MANAGEMENTisAdmin = true;
    spyOn(component, 'open').and.callThrough();
    spyOn(component, 'ExportToCSV').and.callThrough();
    spyOn(exporttocsvService, 'downloadFile').and.callThrough();

    fixture.detectChanges();

    let exportCsvModel = fixture.debugElement.nativeElement.querySelector('#export-csv');
    exportCsvModel.click();

    fixture.detectChanges();

    let exportCsvBtn1 = document.querySelector('#export-csv-btn');
    exportCsvBtn1.dispatchEvent(new Event('click'));
    expect(component.open).toHaveBeenCalled();
    expect(component.ExportToCSV).toHaveBeenCalled();
    expect(exporttocsvService.downloadFile).toHaveBeenCalled();
  });

  it('close office should open popUp model and functions to be called with success and display message', () => {
    component.rows = officeMock.results;
    component.oriArr = officeMock.results;
    component.permissionList.OFFICE_MANAGEMENTisAdmin = true;
    spyOn(component, 'updateCloseStatus').and.callThrough();
    spyOn(component, 'updateStatus').and.callThrough();
    spyOn(officeService, 'v1OfficeUpdateStatusOfficeIdPut$Json').and.returnValue(of(true as any));

    fixture.detectChanges();

    let closeOffice = fixture.debugElement.nativeElement.querySelector('#close-office-index-0');
    closeOffice.click();

    fixture.detectChanges();

    component.officeStatus.patchValue({
      closingDate: '10/30/2020',
      efftctDate: '10/31/2020'
    });
    component.officeStatus.updateValueAndValidity();

    fixture.detectChanges();

    let closeBtn = document.querySelector('#close-office-btn');
    closeBtn.dispatchEvent(new Event('click'));

    fixture.detectChanges();
    let msg = fixture.debugElement.nativeElement.querySelector('.alert-success');


    expect(component.updateCloseStatus).toHaveBeenCalled();
    expect(component.updateStatus).toHaveBeenCalled();
    expect(officeService.v1OfficeUpdateStatusOfficeIdPut$Json).toHaveBeenCalled();
    expect(component.officeStatus.value.closingDate).toBeNull();
    expect(component.officeStatus.value.efftctDate).toBeNull();
    expect(msg.innerText).toContain('The office has been closed and the indicated parties have been notified.');
    
  });


  it('open office should open popUp model and functions to be called', () => {
    officeMock.results[0].status = 'Closed'
    component.rows = officeMock.results;
    component.oriArr = officeMock.results;
    component.permissionList.OFFICE_MANAGEMENTisAdmin = true;
    spyOn(component, 'updateReOpenStatus').and.callThrough();
    spyOn(component, 'updateStatus').and.callThrough();
    spyOn(officeService, 'v1OfficeUpdateStatusOfficeIdPut$Json').and.returnValue(of(true as any));

    fixture.detectChanges();

    let openOffice = fixture.debugElement.nativeElement.querySelector('#reopen-office-index-0');
    openOffice.click();

    fixture.detectChanges();

    component.reopenofficeStatus.patchValue({
      openingDate: '10/30/2020',
      effctDate: '10/31/2020'
    });
    component.reopenofficeStatus.updateValueAndValidity();

    fixture.detectChanges();

    let reOpenBtn = document.querySelector('#reopen-office');
    reOpenBtn.dispatchEvent(new Event('click'));

    expect(component.updateReOpenStatus).toHaveBeenCalled();
    expect(component.updateStatus).toHaveBeenCalled();
    expect(officeService.v1OfficeUpdateStatusOfficeIdPut$Json).toHaveBeenCalled();

    officeMock.results[0].status = 'Active'

  });


});
