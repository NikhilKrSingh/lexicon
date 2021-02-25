import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { ToastrModule } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { reducers } from 'src/app/store';
import { EmployeeService } from 'src/common/swagger-providers/services';
import { SharedModule } from '../../shared/shared.module';
import { JobFamiliesComponent } from './job-families.component';

let jobFamiliesMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQ0Njc0ODYsImV4cCI6MTYwNDUxMDY4NiwiaWF0IjoxNjA0NDY3NDg2fQ.o2jKhSp5aAYITs00mnhPWpuhgOQFeyG4A5mPt6eBtoQ",
  "results": [
    {
      "id": 70,
      "name": "aaaaaaa",
      "numberOfEmployee": 16,
      "baseRate": 15,
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
      "numberOfEmployee": 0,
      "baseRate": null,
      "rateTableJobfamilies": []
    },
  ]
};

let employeeMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQ0Njc0ODYsImV4cCI6MTYwNDUxMDY4NiwiaWF0IjoxNjA0NDY3NDg2fQ.o2jKhSp5aAYITs00mnhPWpuhgOQFeyG4A5mPt6eBtoQ",
  "results": [
    {
      "id": 4110,
      "userName": null,
      "password": null,
      "role": null,
      "salutation": null,
      "companyName": null,
      "firstName": "aaaaaaa",
      "middleName": null,
      "lastName": "ssssss",
      "suffix": null,
      "email": null,
      "maidenName": null,
      "nickName": null,
      "commonName": null,
      "jobTitle": "aaaaaa",
      "employmentStartDate": null,
      "employmentEndDate": null,
      "isCompany": null,
      "isVisible": false,
      "preferredContactMethod": null,
      "doNotSchedule": null,
      "isInheritNotification": null,
      "initialJurisdictionId": null,
      "lastLoggedIn": null,
      "mondayOpenHours": "2020-11-04T00:00:00+00:00",
      "mondayCloseHours": "2020-11-04T00:00:00+00:00",
      "tuesdayOpenHours": "2020-11-04T00:00:00+00:00",
      "tuesdayCloseHours": "2020-11-04T00:00:00+00:00",
      "wednesdayOpenHours": "2020-11-04T00:00:00+00:00",
      "wednesdayCloseHours": "2020-11-04T00:00:00+00:00",
      "thursdayOpenHours": "2020-11-04T00:00:00+00:00",
      "thursdayCloseHours": "2020-11-04T00:00:00+00:00",
      "fridayOpenHours": "2020-11-04T00:00:00+00:00",
      "fridayCloseHours": "2020-11-04T00:00:00+00:00",
      "saturdayOpenHours": "2020-11-04T00:00:00+00:00",
      "saturdayCloseHours": "2020-11-04T00:00:00+00:00",
      "sundayOpenHours": "2020-11-04T00:00:00+00:00",
      "sundayCloseHours": "2020-11-04T00:00:00+00:00",
      "reportingManager": null,
      "approvingManager": null,
      "practiceManager": null,
      "primaryOffice": null,
      "phones": [],
      "secondaryOffices": [],
      "retainerPracticeAreas": [],
      "initialConsultPracticeAreas": [],
      "states": [],
      "groups": [],
      "profilePicture": "",
      "jobFamily": 0,
      "jobFamilyName": "aaaaaaa",
      "jobFamilyBaseRate": null,
      "jobFamilyIsCustom": null,
      "isActivated": false
    },
    {
      "id": 8066,
      "userName": null,
      "password": null,
      "role": null,
      "salutation": null,
      "companyName": null,
      "firstName": "Kiram",
      "middleName": null,
      "lastName": "P",
      "suffix": null,
      "email": null,
      "maidenName": null,
      "nickName": null,
      "commonName": null,
      "jobTitle": "Admin",
      "employmentStartDate": null,
      "employmentEndDate": null,
      "isCompany": null,
      "isVisible": false,
      "preferredContactMethod": null,
      "doNotSchedule": null,
      "isInheritNotification": null,
      "initialJurisdictionId": null,
      "lastLoggedIn": null,
      "mondayOpenHours": "2020-11-04T00:00:00+00:00",
      "mondayCloseHours": "2020-11-04T00:00:00+00:00",
      "tuesdayOpenHours": "2020-11-04T00:00:00+00:00",
      "tuesdayCloseHours": "2020-11-04T00:00:00+00:00",
      "wednesdayOpenHours": "2020-11-04T00:00:00+00:00",
      "wednesdayCloseHours": "2020-11-04T00:00:00+00:00",
      "thursdayOpenHours": "2020-11-04T00:00:00+00:00",
      "thursdayCloseHours": "2020-11-04T00:00:00+00:00",
      "fridayOpenHours": "2020-11-04T00:00:00+00:00",
      "fridayCloseHours": "2020-11-04T00:00:00+00:00",
      "saturdayOpenHours": "2020-11-04T00:00:00+00:00",
      "saturdayCloseHours": "2020-11-04T00:00:00+00:00",
      "sundayOpenHours": "2020-11-04T00:00:00+00:00",
      "sundayCloseHours": "2020-11-04T00:00:00+00:00",
      "reportingManager": null,
      "approvingManager": null,
      "practiceManager": null,
      "primaryOffice": null,
      "phones": [],
      "secondaryOffices": [],
      "retainerPracticeAreas": [],
      "initialConsultPracticeAreas": [],
      "states": [],
      "groups": [],
      "profilePicture": "",
      "jobFamily": 0,
      "jobFamilyName": "aaaaaaa",
      "jobFamilyBaseRate": null,
      "jobFamilyIsCustom": null,
      "isActivated": false
    }
  ]
};
describe('JobFamiliesComponent', () => {
  let component: JobFamiliesComponent;
  let fixture: ComponentFixture<JobFamiliesComponent>;
  let employeeService: EmployeeService;
  let router: Router;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        RouterTestingModule,
        HttpClientTestingModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
        StoreModule.forRoot(reducers),
      ],
      declarations: [ JobFamiliesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobFamiliesComponent);
    employeeService = TestBed.get(EmployeeService);
    router = TestBed.get(Router);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('job families listing', () => {
    let res = {body: JSON.stringify(jobFamiliesMock)};
    spyOn(employeeService, 'v1EmployeeJobFamilyGet$Response').and.returnValue(of(res as any));
    spyOn(component, 'updateDatatableFooterPage').and.callThrough();

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.updateDatatableFooterPage).toHaveBeenCalled();
    expect(component.isLoading).toBe(false);
    expect(component.rows.length).toBe(10);
    expect(component.oriArr.length).toBe(10);
  });

  it('job families listing catch error', () => {
    spyOn(employeeService, 'v1EmployeeJobFamilyGet$Response').and.returnValue(throwError({err: 'err'}) as any);

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.isLoading).toBe(false);
  });

  it('job families search by name', () => {
    component.oriArr = jobFamiliesMock.results;
    spyOn(component, 'updateDatatableFooterPage').and.callThrough();
    let inputSearch = fixture.debugElement.nativeElement.querySelector('#search-job-family');
    inputSearch.value = 'ac';
    let e = new KeyboardEvent("keyup", {
      key: "a",
      bubbles: true,
      cancelable: true,
    });
    inputSearch.dispatchEvent(e);

    fixture.detectChanges();

    expect(component.rows.length).toBe(2);
    expect(component.updateDatatableFooterPage).toHaveBeenCalled();
  });

  it('job families edit should have correct url', () => {
    component.rows = jobFamiliesMock.results;
    component.oriArr = jobFamiliesMock.results;
    fixture.detectChanges();
    let edit = fixture.debugElement.nativeElement.querySelector('#edit-emp-index-0');
    expect(edit.getAttribute('href')).toBe('/firm/job-families/edit/70');
  });

  it('job families view employee', () => {
    let res = {body: JSON.stringify(employeeMock)};
    spyOn(component, 'getEmployeeList').and.callThrough();
    spyOn(employeeService, 'v1EmployeeJobFamilyUsersJobfamilyidGet$Response').and.returnValue(of(res as any));
    component.rows = jobFamiliesMock.results;
    component.oriArr = jobFamiliesMock.results;
    fixture.detectChanges();
    let view = fixture.debugElement.nativeElement.querySelector('#view-emp-index-0');
    view.click();

    fixture.detectChanges();

    let closeBtn = document.querySelector('#close-btn-bottom');
    closeBtn.dispatchEvent(new Event('click'));

    expect(component.getEmployeeList).toHaveBeenCalled();
    expect(employeeService.v1EmployeeJobFamilyUsersJobfamilyidGet$Response).toHaveBeenCalled();
  });

  it('job families on row select should navigate to edit',() => {
    const navigateSpy = spyOn(router, 'navigate');

    let mockRoute = {
      'selected': [{
        id: 1,
      }]
    };

    expect(navigateSpy).toHaveBeenCalledWith(['/firm/job-families/edit/1']);
  });

  it('view employee profile', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.redirectEmployeePage(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/employee/profile'], { queryParams: { employeeId: 1 } });
  });

  it('job family delete should show warning can not delete', async() => {
    spyOn(component, 'getDetails').and.callThrough();
    spyOn(employeeService, 'v1EmployeeJobFamilyJobfamilyidDelete').and.returnValue(of(true as any));
    component.rows = jobFamiliesMock.results;
    component.oriArr = jobFamiliesMock.results;
    fixture.detectChanges();

    let deleteIndex = fixture.debugElement.nativeElement.querySelector('#delete-emp-index-0');
    deleteIndex.click();
    expect(component.isDelete).toBe(false);
  });

  it('job family delete', async() => {
    spyOn(component, 'getDetails').and.callThrough();
    spyOn(employeeService, 'v1EmployeeJobFamilyJobfamilyidDelete').and.returnValue(of(true as any));
    component.rows = jobFamiliesMock.results;
    component.oriArr = jobFamiliesMock.results;
    fixture.detectChanges();

    let deleteIndex = fixture.debugElement.nativeElement.querySelector('#delete-emp-index-9');
    deleteIndex.click();
    await fixture.detectChanges();
    let yesDel = document.querySelector('#yes-delete');
    yesDel.dispatchEvent(new Event('click'));

    expect(component.isDelete).toBe(false);
    expect(component.message).toContain('The job family has been deleted');
    expect(employeeService.v1EmployeeJobFamilyJobfamilyidDelete).toHaveBeenCalled();
    expect(component.getDetails).toHaveBeenCalled();
  });

  it('change page size job families', () => {
    component.pageSelector.setValue(15);
    component.changePageSize();
    expect(component.page1.size).toBe(15);
  });

  it('changePage job families', () => {
    component.pageSelected1 = 2

    component.changePage();

    expect(component.page1.pageNumber).toBe(1);
  });

  it('page select job families', () => {
    let page = {
      page: 1,
    };
    component.pageChange(page);

    expect(component.pageSelected1).toBe(1);
  });

});
