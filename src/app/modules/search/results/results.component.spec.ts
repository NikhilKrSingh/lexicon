import { HttpClientModule } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { NgxIndexedDBModule } from 'ngx-indexed-db';
import { of, pipe } from 'rxjs';
import { delay } from 'rxjs/operators';
import { reducers } from 'src/app/store';
import { ApiModule } from 'src/common/swagger-providers/api.module';
import { SearchService } from 'src/common/swagger-providers/services';
import { SharedModule } from '../../shared/shared.module';
import { SharedService } from "../../shared/sharedService";
import { ResultsComponent } from './results.component';
import { Router } from '@angular/router';

let filterListMock = {
  "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBhZG1pbiIsImF6cCI6IjEwMDYiLCJlbWFpbCI6ImFkbWluTGV4QHlvcG1haWwuY29tIiwiZmFtaWx5X25hbWUiOiJUZW5hbnQgQWRtaW4iLCJnZW5kZXIiOiIiLCJUaWVyIjoiSWNvbmljIiwiQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndNOVU1SGg3a0pwNmRDK2dzSWNBVVA4bzE2eXQxNEdkdHl1OGQxdXNDRjlPbkhVRk1CNzE0V0QyakNhWkY1VFZGQT09IiwiUmVwb3J0aW5nQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndNOVU1SGg3a0pwNmRDK2dzSWNBVVA4bzE2eXQxNEdkdHl1OGQxdXNDRjlPbkhVRk1CNzE0V0QyakNhWkY1VFZGQT09IiwibmJmIjoxNjExMTI0NTI0LCJleHAiOjE2MTExNjc3MjQsImlhdCI6MTYxMTEyNDUyNH0.hdfCM4TxQFo4CHvpn2CHFFd3Uaqkh425b0tmcGqxqPI",
  "results":[
    {"id":1,"moduleName":"All"},
    {"id":2,"moduleName":"Matters"},
    {"id":3,"moduleName":"Clients"},
    {"id":4,"moduleName":"Employees"},
    {"id":5,"moduleName":"Contacts"},
    {"id":6,"moduleName":"Offices"},
    {"id":7,"moduleName":"Documents"}
  ]
}

let searchResultMock ={
  "token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBhZG1pbiIsImF6cCI6IjEwMDYiLCJlbWFpbCI6ImFkbWluTGV4QHlvcG1haWwuY29tIiwiZmFtaWx5X25hbWUiOiJUZW5hbnQgQWRtaW4iLCJnZW5kZXIiOiIiLCJUaWVyIjoiSWNvbmljIiwiQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndNOVU1SGg3a0pwNmRDK2dzSWNBVVA4bzE2eXQxNEdkdHl1OGQxdXNDRjlPbkhVRk1CNzE0V0QyakNhWkY1VFZGQT09IiwiUmVwb3J0aW5nQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndNOVU1SGg3a0pwNmRDK2dzSWNBVVA4bzE2eXQxNEdkdHl1OGQxdXNDRjlPbkhVRk1CNzE0V0QyakNhWkY1VFZGQT09IiwibmJmIjoxNjExMTI0NTI0LCJleHAiOjE2MTExNjc3MjQsImlhdCI6MTYxMTEyNDUyNH0.hdfCM4TxQFo4CHvpn2CHFFd3Uaqkh425b0tmcGqxqPI",
  "results":{
    "searchResultCount":2645,
    "searchResults":[
      {
        "id":4698,"resultName":"Test29June",
        "resultType":"Matter",
        "metaData":[
          {"id":"OpenDate","name":"6/29/2020 1:40:33 PM"},
          {"id":"CloseDate","name":"1/1/0001 12:00:00 AM"},
          {"id":"Client","name":"test, test"},
          {"id":"Office","name":"1 June Office"},
          {"id":"MatterNumber","name":"2063"},
          {"id":"Attorney","name":"Chawla, Juhi"},
          {"id":"Opposing Party","name":"--"}
        ],
        "createdBy":null,
        "createdOn":"2020-06-25T13:34:14.873Z",
        "lastUpdated":null
      },
      {
        "id":7101,
        "resultName":"testt testt-7101",
        "resultType":"Matter",
        "metaData":[
          {"id":"OpenDate","name":"1/1/0001 12:00:00 AM"},
          {"id":"CloseDate","name":"1/1/0001 12:00:00 AM"},
          {"id":"Client","name":"testt, testt"},
          {"id":"Office","name":"Andrews Office"},
          {"id":"MatterNumber","name":"3894"},
          {"id":"Attorney","name":"--"},
          {"id":"Opposing Party","name":"--"}
        ],
        "createdBy":null,
        "createdOn":"2020-11-05T12:00:16.013Z",
        "lastUpdated":null
      }
    ]
  }
}


let resultListMockData =[
  {
    "id": 8677,
    "resultName": "Test 2, Testing",
    "resultType": "Client",
    "metaData": [
      {
        "id": "FirstName",
        "name": "Testing"
      },
      {
        "id": "LastName",
        "name": "Test 2"
      },
      {
        "id": "Email",
        "name": "Testing123123@yopmail.com"
      },
      {
        "id": "JobTitle",
        "name": null
      },
      {
        "id": "CompanyName",
        "name": ""
      },
      {
        "id": "IsCompany",
        "name": "False"
      },
      {
        "id": "IsVisible",
        "name": "True"
      },
      {
        "id": "DoNotContactReason",
        "name": ""
      },
      {
        "id": "PhoneNumber",
        "name": "7868767868"
      },
      {
        "id": "PrimaryContact",
        "name": "--"
      },
      {
        "id": "Attorney",
        "name": "--"
      },
      {
        "id": "PrimaryLawOffice",
        "name": "Andrews Office"
      }
    ],
    "createdBy": null,
    "createdOn": "2020-10-07T16:53:41.927Z",
    "lastUpdated": null
  },
  {
    "id": 4698,
    "resultName": "Test29June",
    "resultType": "Matter",
    "metaData": [
      {
        "id": "OpenDate",
        "name": "6/29/2020 1:40:33 PM"
      },
      {
        "id": "CloseDate",
        "name": "1/1/0001 12:00:00 AM"
      },
      {
        "id": "Client",
        "name": "test, test"
      },
      {
        "id": "Office",
        "name": "1 June Office"
      },
      {
        "id": "MatterNumber",
        "name": "2063"
      },
      {
        "id": "Attorney",
        "name": "Chawla, Juhi"
      },
      {
        "id": "Opposing Party",
        "name": "--"
      }
    ],
    "createdBy": null,
    "createdOn": "2020-06-25T13:34:14.873Z",
    "lastUpdated": null
  },
  {
    "id": 7101,
    "resultName": "testt testt-7101",
    "resultType": "Matter",
    "metaData": [
      {
        "id": "OpenDate",
        "name": "1/1/0001 12:00:00 AM"
      },
      {
        "id": "CloseDate",
        "name": "1/1/0001 12:00:00 AM"
      },
      {
        "id": "Client",
        "name": "testt, testt"
      },
      {
        "id": "Office",
        "name": "Andrews Office"
      },
      {
        "id": "MatterNumber",
        "name": "3894"
      },
      {
        "id": "Attorney",
        "name": "--"
      },
      {
        "id": "Opposing Party",
        "name": "--"
      }
    ],
    "createdBy": null,
    "createdOn": "2020-11-05T12:00:16.013Z",
    "lastUpdated": null
  },
  {
    "id": 41708,
    "resultName": "Invoice-1180-20201026101037-6881.pdf",
    "resultType": "Document",
    "metaData": [
      {
        "id": "Status",
        "name": "active"
      },
      {
        "id": "IsDraftingTemplate",
        "name": "False"
      },
      {
        "id": "IsFillableTemplate",
        "name": "False"
      },
      {
        "id": "FolderFullPath",
        "name": "https://quartodmsqa.blob.core.windows.net/quarto-dms-data/tenant-1006/Clients/8898/Matters/6881/Billing_Invoices_Expenses"
      },
      {
        "id": "Owner",
        "name": "Majaanu, Saras"
      },
      {
        "id": "Version",
        "name": "1"
      },
      {
        "id": "LastUpdated",
        "name": "10/28/2020 2:05:11 PM"
      },
      {
        "id": "FirmPath",
        "name": "https://quartodmsqa.blob.core.windows.net/quarto-dms-data/Codal/Clients/Prince, Crown(2929)/Matters/watch accident test(3741)/Billing_Invoices_Expenses"
      },
      {
        "id": "FolderId",
        "name": "78374"
      },
      {
        "id": "ParentFolderId",
        "name": "78373"
      },
      {
        "id": "Category",
        "name": "--"
      }
    ],
    "createdBy": null,
    "createdOn": "2020-10-26T10:26:38.74Z",
    "lastUpdated": "2020-10-28T14:05:11.553Z"
  },
  {
    "id": 5596,
    "resultName": "test 2, test 2",
    "resultType": "Client",
    "metaData": [
      {
        "id": "FirstName",
        "name": "test 2"
      },
      {
        "id": "LastName",
        "name": "test 2"
      },
      {
        "id": "Email",
        "name": "testtest@donot.com"
      },
      {
        "id": "JobTitle",
        "name": null
      },
      {
        "id": "CompanyName",
        "name": ""
      },
      {
        "id": "IsCompany",
        "name": "False"
      },
      {
        "id": "IsVisible",
        "name": "True"
      },
      {
        "id": "DoNotContactReason",
        "name": ""
      },
      {
        "id": "PhoneNumber",
        "name": "3423325353"
      },
      {
        "id": "PrimaryContact",
        "name": "--"
      },
      {
        "id": "Attorney",
        "name": "Chawda, KANO"
      },
      {
        "id": "PrimaryLawOffice",
        "name": "Billing Office New 1000"
      }
    ],
    "createdBy": null,
    "createdOn": "2020-06-23T14:30:33.65Z",
    "lastUpdated": null
  },
]

let dummyfilterList = [
  {"id":1,"moduleName":"All"},
  {"id":2,"moduleName":"Matters"},
  {"id":3,"moduleName":"Clients"},
  {"id":4,"moduleName":"Employees"},
  {"id":5,"moduleName":"Contacts"},
  {"id":6,"moduleName":"Offices"},
  {"id":7,"moduleName":"Documents"}
]


describe('ResultsComponent', () => {
  let sharedService: SharedService;
  let component: ResultsComponent;
  let fixture: ComponentFixture<ResultsComponent>;
  let routerSpy = {navigate: jasmine.createSpy('navigate')};

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[SharedModule, RouterTestingModule, HttpClientTestingModule, StoreModule.forRoot(reducers), ApiModule.forRoot({
        rootUrl: 'https://sc1-api.lexiconservices.com',
      })],
      providers:[SharedService,
      /*{ provide: Router, useValue: routerSpy }*/],
      declarations:[ResultsComponent]
    });
    fixture = TestBed.createComponent(ResultsComponent);
    component = fixture.componentInstance;
    // searchService = fixture.debugElement.injector.get(SearchService);
    component.ngOnInit();
  })

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getFiltersList in ngOninit', () => {
    spyOn(component,'getFiltersList').and.callThrough();
    component.ngOnInit();
    expect(component.getFiltersList).toHaveBeenCalled();
  })

  it('should call changeFilter in ngOninit if searchFilter has value', () => {
    component.searchString = 'test';
    component.searchFilter = 'All';
    spyOn(component,'changeFilter').withArgs(component.searchFilter, true).and.callThrough();
    component.ngOnInit();
    expect(component.changeFilter).toHaveBeenCalled();
  })

  it('should fetch the list using mock', () => {
    spyOn(component.searchService, 'v1SearchAllmodulesGet').and.returnValue(of(JSON.stringify(filterListMock) as any));
    component.permissionList.MATTER_MANAGEMENTisAdmin = true;
    component.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin = true;
    component.getFiltersList();
    fixture.detectChanges();
    expect(component.searchFilterList).toEqual(filterListMock.results);
  })

  it('should remove filters if not matters and client permissions', () => {
    spyOn(component.searchService, 'v1SearchAllmodulesGet').and.returnValue(of(JSON.stringify(filterListMock) as any));
    component.permissionList.MATTER_MANAGEMENTisAdmin = false;
    component.permissionList.MATTER_MANAGEMENTMATTER_MANAGEMENTisViewOnly= false;
    component.permissionList.MATTER_MANAGEMENTisEdit = false;
    component.permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin = false;
    component.permissionList.CLIENT_CONTACT_MANAGEMENTisEdit = false;
    component.permissionList.CLIENT_CONTACT_MANAGEMENTisViewOnly = false;
    component.getFiltersList();
    fixture.detectChanges();
    let filterdData = [
      {"id":1,"moduleName":"All"},
      {"id":4,"moduleName":"Employees"},  
      {"id":6,"moduleName":"Offices"},
      {"id":7,"moduleName":"Documents"}
    ]
    expect(component.searchFilterList).toEqual(filterdData);
    expect(component.searchFilterList.length).toEqual(4);
  });

  it('should fetch search results', () => {
    component.searchFilter = 'All';
    component.searchFilterStr = '1,2,3,4,5,6,7';
    component.matterPermission = true;
    component.clientPermission = true;
    spyOn(component.miscService, 'v1MiscSearchGlobalGet').and.returnValue(of(JSON.stringify(searchResultMock) as any));
    component.getsearchResult('test');
    fixture.detectChanges();
    //the result could be empty array also
    expect(component.resultList.length).toBeGreaterThanOrEqual(0);
    expect(component.totalResultCount).toBeGreaterThanOrEqual(0);
  });

  // it('should fetch search result contact', () => {
  //   component.searchFilter = 'Contact';
  //   component.searchFilterStr = '1,2,3,4,5,6,7';
  //   component.matterPermission = true;
  //   component.clientPermission = true;
  //   let resultList = []
  //   spyOn(component.miscService, 'v1MiscSearchGlobalGet').and.returnValue(of(JSON.stringify(searchResultMock) as any));
  //   component.getsearchResult('jan');
  //   fixture.detectChanges();
  //   expect(component.resultList.length).toBeGreaterThan(0);
  //   expect(component.totalResultCount).toBeGreaterThanOrEqual(0);
  // });


  it('should filter matter results based on Permissions', () => {
    component.resultList = resultListMockData;
    component.matterPermission = false;
    component.filterListOnPermissions();
    fixture.detectChanges();
    expect(component.resultList.length).toEqual(3);
  });

  it('should filter contacts/clients results based on Permissions', () => {
    component.resultList = resultListMockData;
    component.clientPermission = false;
    component.filterListOnPermissions();
    fixture.detectChanges();
    expect(component.resultList.length).toEqual(3);
  });

  it('should assign false to all the filter selections', () => {
    spyOn(component, 'allFiltersfalse').and.callThrough();
    component.allFiltersfalse();
    expect(component.searchFormat.isAll).toBeFalsy();
    expect(component.searchFormat.isClient).toBeFalsy();
    expect(component.searchFormat.isContact).toBeFalsy();
    expect(component.searchFormat.isMatter).toBeFalsy();
    expect(component.searchFormat.isDocument).toBeFalsy();
    expect(component.searchFormat.isEmployee).toBeFalsy();
    expect(component.searchFormat.isOffice).toBeFalsy();
  })

  it('should change filter', () => {
    spyOn(component, 'changeFilter').withArgs('Employees').and.callThrough();
    spyOn(component, 'allFiltersfalse').and.callThrough();
    component.searchFilterList = dummyfilterList;
    component.currentActive = true;
    fixture.detectChanges();
    const searchFilterButton = fixture.debugElement.nativeElement.querySelector('#option-Employees');
    searchFilterButton.click();
    fixture.detectChanges();
    expect(component.changeFilter).toHaveBeenCalled();
    expect(component.allFiltersfalse).toHaveBeenCalled();
  });

  it('Should change the filter selection to All', () => {
    spyOn(component, 'changeFilter').withArgs('All').and.callThrough();
    component.changeFilter('All');
    expect(component.searchFilter).toEqual('All');
    expect(component.searchFormat.isAll).toBeTruthy();
  })

  it('Should change the filter selection to All if no argumemt passed', () => {
    spyOn(component, 'changeFilter').and.callThrough();
    component.changeFilter('');
    expect(component.searchFilter).toEqual('All');
    expect(component.searchFormat.isAll).toBeTruthy();
  })

  it('Should change the filter selection to Clients', () => {
    spyOn(component, 'changeFilter').withArgs('Clients').and.callThrough();
    component.changeFilter('Clients');
    expect(component.searchFilter).toEqual('Clients');
    expect(component.searchFormat.isClient).toBeTruthy();
  })

  it('Should change the filter selection to Matters', () => {
    spyOn(component, 'changeFilter').withArgs('Matters').and.callThrough();
    component.changeFilter('Matters');
    expect(component.searchFilter).toEqual('Matters');
    expect(component.searchFormat.isMatter).toBeTruthy();
  })

  it('Should change the filter selection to Employees', () => {
    spyOn(component, 'changeFilter').withArgs('Employees').and.callThrough();
    component.changeFilter('Employees');
    expect(component.searchFilter).toEqual('Employees');
    expect(component.searchFormat.isEmployee).toBeTruthy();
  })

  it('Should change the filter selection to Contacts', () => {
    spyOn(component, 'changeFilter').withArgs('Contacts').and.callThrough();
    component.changeFilter('Contacts');
    expect(component.searchFilter).toEqual('Contacts');
    expect(component.searchFormat.isContact).toBeTruthy();
  })

  it('Should change the filter selection to Offices', () => {
    spyOn(component, 'changeFilter').withArgs('Offices').and.callThrough();
    component.changeFilter('Offices');
    expect(component.searchFilter).toEqual('Offices');
    expect(component.searchFormat.isOffice).toBeTruthy();
  })

  it('Should change the filter selection to Documents', () => {
    spyOn(component, 'changeFilter').withArgs('Documents').and.callThrough();
    component.changeFilter('Documents');
    expect(component.searchFilter).toEqual('Documents');
    expect(component.searchFormat.isDocument).toBeTruthy();
  })
});