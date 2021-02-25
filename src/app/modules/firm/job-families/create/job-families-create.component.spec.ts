import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { ToastrModule } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { reducers } from 'src/app/store';
import { EmployeeService, RateTableService } from 'src/common/swagger-providers/services';
import { JobFamiliesCreateComponent } from './job-families-create.component';

let jobFamiliesMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQ1NTM4MTEsImV4cCI6MTYwNDU5NzAxMSwiaWF0IjoxNjA0NTUzODExfQ.jXIj1wnEZ_H24LUP3lof5RjfekL69maJssGk5kObnt4",
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
      "numberOfEmployee": 16,
      "baseRate": null,
      "rateTableJobfamilies": []
    },
  ]
};

let rateTableMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQ1NTM4MTEsImV4cCI6MTYwNDU5NzAxMSwiaWF0IjoxNjA0NTUzODExfQ.jXIj1wnEZ_H24LUP3lof5RjfekL69maJssGk5kObnt4",
  "results": [
    {
      "id": 1,
      "name": "Rate Table 1",
      "tenantId": 1006,
      "description": null,
      "effectiveDate": null,
      "submitNewChanges": false,
      "changeNotes": null,
      "isActive": true,
      "chargeCodeIds": null,
      "lstvwCustomizeRateTableJobfamily": null
    },
    {
      "id": 2,
      "name": "Rate Table 2",
      "tenantId": 1006,
      "description": null,
      "effectiveDate": null,
      "submitNewChanges": false,
      "changeNotes": null,
      "isActive": true,
      "chargeCodeIds": null,
      "lstvwCustomizeRateTableJobfamily": null
    },
    {
      "id": 10,
      "name": "cxvbnww",
      "tenantId": null,
      "description": null,
      "effectiveDate": null,
      "submitNewChanges": false,
      "changeNotes": null,
      "isActive": true,
      "chargeCodeIds": null,
      "lstvwCustomizeRateTableJobfamily": null
    },
    {
      "id": 11,
      "name": "taaata",
      "tenantId": null,
      "description": null,
      "effectiveDate": null,
      "submitNewChanges": false,
      "changeNotes": null,
      "isActive": true,
      "chargeCodeIds": null,
      "lstvwCustomizeRateTableJobfamily": null
    },
    {
      "id": 12,
      "name": "Mansi Test 1",
      "tenantId": null,
      "description": null,
      "effectiveDate": null,
      "submitNewChanges": false,
      "changeNotes": null,
      "isActive": true,
      "chargeCodeIds": null,
      "lstvwCustomizeRateTableJobfamily": null
    },
    {
      "id": 13,
      "name": "fghjhgfdfgh",
      "tenantId": null,
      "description": null,
      "effectiveDate": null,
      "submitNewChanges": false,
      "changeNotes": null,
      "isActive": true,
      "chargeCodeIds": null,
      "lstvwCustomizeRateTableJobfamily": null
    },
    {
      "id": 14,
      "name": "asdfghjk",
      "tenantId": null,
      "description": null,
      "effectiveDate": null,
      "submitNewChanges": false,
      "changeNotes": null,
      "isActive": true,
      "chargeCodeIds": null,
      "lstvwCustomizeRateTableJobfamily": null
    }
  ]
};

let originalRateTableMock = [
  {
    "rateTableId": 1,
    "rateTableName": "Rate Table 1",
    "tableRate": null,
    "jobFamilyBaseRate": null
  },
  {
    "rateTableId": 2,
    "rateTableName": "Rate Table 2",
    "tableRate": null,
    "jobFamilyBaseRate": null
  },
  {
    "rateTableId": 10,
    "rateTableName": "cxvbnww",
    "tableRate": null,
    "jobFamilyBaseRate": null
  },
  {
    "rateTableId": 11,
    "rateTableName": "taaata",
    "tableRate": null,
    "jobFamilyBaseRate": null
  },
  {
    "rateTableId": 12,
    "rateTableName": "Mansi Test 1",
    "tableRate": null,
    "jobFamilyBaseRate": null
  },
  {
    "rateTableId": 13,
    "rateTableName": "fghjhgfdfgh",
    "tableRate": null,
    "jobFamilyBaseRate": null
  },
  {
    "rateTableId": 14,
    "rateTableName": "asdfghjk",
    "tableRate": null,
    "jobFamilyBaseRate": null
  }
];

let JobFamilyDetailsMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQ2NDAyOTAsImV4cCI6MTYwNDY4MzQ5MCwiaWF0IjoxNjA0NjQwMjkwfQ.FYWhg2MqWrQrL8JRCdKn4-HODnX0AWx6ykhw9kDawHE",
  "results": {
    "id": 74,
    "name": "actor",
    "numberOfEmployee": 0,
    "baseRate": 10.10,
    "rateTableJobfamilies": [
      {
        "rateTableId": 1,
        "rateTableName": "Rate Table 1",
        "jobFamilyId": 74,
        "jobFamilyName": "actor",
        "jobFamilyBaseRate": null,
        "tableRate": 0
      },
      {
        "rateTableId": 2,
        "rateTableName": "Rate Table 2",
        "jobFamilyId": 74,
        "jobFamilyName": "actor",
        "jobFamilyBaseRate": null,
        "tableRate": 0
      },
      {
        "rateTableId": 11,
        "rateTableName": "taaata",
        "jobFamilyId": 74,
        "jobFamilyName": "actor",
        "jobFamilyBaseRate": null,
        "tableRate": 0
      },
      {
        "rateTableId": 12,
        "rateTableName": "Mansi Test 1",
        "jobFamilyId": 74,
        "jobFamilyName": "actor",
        "jobFamilyBaseRate": null,
        "tableRate": 0
      },
      {
        "rateTableId": 13,
        "rateTableName": "fghjhgfdfgh",
        "jobFamilyId": 74,
        "jobFamilyName": "actor",
        "jobFamilyBaseRate": null,
        "tableRate": 0
      },
      {
        "rateTableId": 14,
        "rateTableName": "asdfghjk",
        "jobFamilyId": 74,
        "jobFamilyName": "actor",
        "jobFamilyBaseRate": null,
        "tableRate": 0
      }
    ]
  }
};

let mockActivatedRoute = {
  snapshot: {
    params: {
      jobFamilyId: null
    }
  }
};

describe('JobFamiliesCreateComponent', () => {
  let component: JobFamiliesCreateComponent;
  let fixture: ComponentFixture<JobFamiliesCreateComponent>;
  let employeeService: EmployeeService;
  let rateTableService: RateTableService;
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
      declarations: [ JobFamiliesCreateComponent ],
      providers: [JobFamiliesCreateComponent, {
          provide: ActivatedRoute,
          useValue: mockActivatedRoute
          }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobFamiliesCreateComponent);
    employeeService = TestBed.get(EmployeeService);
    rateTableService = TestBed.get(RateTableService);
    router = TestBed.get(Router);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('get all job families and rate table', () => {
    spyOn(component, 'getAllJobFamilies').and.callThrough();
    spyOn(component, 'getRateTables').and.callThrough();
    spyOn(component, 'setJobRateTables').and.callThrough();
    spyOn(employeeService, 'v1EmployeeJobFamilyGet').and.returnValue(of(JSON.stringify(jobFamiliesMock) as any));
    spyOn(rateTableService, 'v1RateTableGet').and.returnValue(of(JSON.stringify(rateTableMock) as any));
    component.ngOnInit();

    expect(component.jobFamilies.length).toBe(10);
    expect(component.jobRateTables.length).toBe(7);
    expect(component.getAllJobFamilies).toHaveBeenCalled();
    expect(component.getRateTables).toHaveBeenCalled();
  });

  it('get all job families error', () => {
    spyOn(component, 'getAllJobFamilies').and.callThrough();
    spyOn(employeeService, 'v1EmployeeJobFamilyGet').and.returnValue(throwError({err: 'err'}) as any);

    component.ngOnInit();

    expect(component.jobFamilies.length).toBe(0);
  });

  it('name already exists', () => {
    component.jobFamilies = jobFamiliesMock.results;
    component.jobFamilyForm.patchValue({
      name: 'Aadarsh1'
    });
    component.jobFamilyForm.updateValueAndValidity();

    fixture.detectChanges();
    let existName = fixture.debugElement.nativeElement.querySelector('#error-already-exists-name');
    expect(existName.innerText).toContain('A job family with that name already exists.');
  });

  it('name already exists check should return null', () => {
    component.jobFamilies = jobFamiliesMock.results;
    component.jobFamilyForm.patchValue({
      name: 'Aadarsh1Aadarsh1'
    });
    component.jobFamilyForm.updateValueAndValidity();

    expect(component.jobFamilyForm.errors).toBeNull();
  });

  it('name already exists check should return null if jobFamilies length 0', () => {
    component.jobFamilies = [];
    component.jobFamilyForm.patchValue({
      name: 'Aadarsh1Aadarsh1'
    });
    component.jobFamilyForm.updateValueAndValidity();

    expect(component.jobFamilyForm.errors).toBeNull();
  });

  it('show information-message if jobFailyId && BILLING_MANAGEMENTisAdmin permission is null', () => {
    component.jobFamilyId = null;
    component.permissionList.BILLING_MANAGEMENTisAdmin = false;

    fixture.detectChanges();

    let infoMessage = fixture.debugElement.nativeElement.querySelector('#information-message');
    expect(infoMessage.innerText).toContain('A Billing Admin will enter a base rate and rate table configuration for this Job Family.');
  });

  it('set fixed value to baseRate if BILLING_MANAGEMENTisAdmin', () => {
    component.jobFamilyForm.patchValue({
      baseRate: "10.1000"
    });

    component.setCurrencyValue();

    expect(component.jobFamilyForm.value.baseRate).toBe("10.10");
  });

  it('create job family', () => {
    component.permissionList.BILLING_MANAGEMENTisAdmin = true;
    component.jobFamilyForm.patchValue({
      name: 'Unittesting',
      baseRate: "10.1000"
    });
    component.jobRateTables = rateTableMock.results;
    spyOn(employeeService, 'v1EmployeeJobFamilyPost$Json$Response').and.returnValue(of(true as any));
    const navigateSpy = spyOn(router, 'navigate');

    fixture.detectChanges();

    let saveBtn = fixture.debugElement.nativeElement.querySelector('#save-btn');
    saveBtn.click();

    expect(navigateSpy).toHaveBeenCalledWith(['firm/job-families']);
    let body = {
      id: 0,
      name: 'Unittesting',
      baseRate: 10.1,
      rateTableJobfamilies: [],
      numberOfEmployee: 0
    }
    expect(employeeService.v1EmployeeJobFamilyPost$Json$Response).toHaveBeenCalledWith({body: body});
  });

  it('create job family error', () => {
    component.permissionList.BILLING_MANAGEMENTisAdmin = true;
    component.jobFamilyForm.patchValue({
      name: 'Unittesting',
      baseRate: "10.1000"
    });
    component.jobRateTables = rateTableMock.results;
    spyOn(employeeService, 'v1EmployeeJobFamilyPost$Json$Response').and.returnValue(throwError({err: "err"}) as any);
    const navigateSpy = spyOn(router, 'navigate');

    fixture.detectChanges();

    let saveBtn = fixture.debugElement.nativeElement.querySelector('#save-btn');
    saveBtn.click();

    expect(navigateSpy).not.toHaveBeenCalled();
    let body = {
      id: 0,
      name: 'Unittesting',
      baseRate: 10.1,
      rateTableJobfamilies: [],
      numberOfEmployee: 0
    }
    expect(component.loading).toBe(false);
    expect(employeeService.v1EmployeeJobFamilyPost$Json$Response).toHaveBeenCalledWith({body: body});
  });


  it('create job family cancel button should navigate to listing', () => {
    component.permissionList.BILLING_MANAGEMENTisAdmin = true;
    component.jobFamilyForm.patchValue({
      name: 'Unittesting',
      baseRate: "10.1000"
    });
    component.jobRateTables = rateTableMock.results;
    const navigateSpy = spyOn(router, 'navigate');

    fixture.detectChanges();

    let cancelBtn = fixture.debugElement.nativeElement.querySelector('#cancel-btn');
    cancelBtn.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/firm/job-families']);
  });

  it('search `name` rate table', () => {
    component.jobRateTables = originalRateTableMock;
    component.originalJobRateTables = originalRateTableMock
    component.jobRateTableSearchText = 'taaata';

    component.jobRateTableSearch();

    expect(component.jobRateTables.length).toBe(1);
  });

  it('get edit Job Family by id', () => {
    spyOn(employeeService, 'v1EmployeeJobFamilyJobfamilyidGet').and.returnValue(of(JSON.stringify(JobFamilyDetailsMock) as any));
    spyOn(component, 'setCurrencyValue').and.callThrough();
    spyOn(component, 'getRateTables').and.callThrough();
    spyOn(component, 'updateDatatableFooterPage').and.callThrough();

    component.getJobFamilyDetail();
    fixture.detectChanges();

    expect(component.jobFamilyDetail.id).toBe(74);
    expect(component.jobRateTables.length).toBe(6);
    expect(component.originalJobRateTables.length).toBe(6);
    expect(component.jobFamilyForm.value.name).toContain('actor');
    expect(component.jobFamilyForm.value.baseRate).toBe('10.10');
    expect(component.setCurrencyValue).toHaveBeenCalled();
    expect(component.getRateTables).toHaveBeenCalled();
    expect(component.updateDatatableFooterPage).toHaveBeenCalled();
  });

  it('edit rate table and search keyword', () => {
    component.jobRateTables = rateTableMock.results;
    component.permissionList.BILLING_MANAGEMENTisAdmin = true;

    fixture.detectChanges();

    let editRateTable = fixture.debugElement.nativeElement.querySelector('#edit-rate-table');
    editRateTable.click();

    fixture.detectChanges();

    let search = document.querySelector('#rate-table-search');
    let e = new KeyboardEvent("keyup", {
      key: "a",
      bubbles: true,
      cancelable: true,
    });
    search.dispatchEvent(e);

    fixture.detectChanges();
    let closeModel = document.querySelector('#rate-table-cancel-btn');
    closeModel.dispatchEvent(new Event('click'));

    expect(component.jobRateTables.length).toBe(1);
  });

  it('edit job family save success', () => {
    component.originalJobRateTables = rateTableMock.results;
    component.jobFamilyDetail = JobFamilyDetailsMock;
    component.jobFamilyId = 74;
    component.permissionList.BILLING_MANAGEMENTisAdmin = false;

    component.jobFamilyForm.patchValue({
      name: 'actor',
      baseRate: '10:10',
    });
    component.jobFamilyForm.updateValueAndValidity();
    spyOn(employeeService, 'v1EmployeeJobFamilyPut$Json$Response').and.returnValue(of(true as any));
    const navigateSpy = spyOn(router, 'navigate');

    component.save();

    expect(navigateSpy).toHaveBeenCalledWith(['firm/job-families']);
    expect(component.jobFamilyForm.invalid).toBe(false);
  });

  it('edit job family save error', () => {
    component.originalJobRateTables = rateTableMock.results;
    component.jobFamilyDetail = JobFamilyDetailsMock;
    component.jobFamilyId = 74;

    component.jobFamilyForm.patchValue({
      name: 'actor',
      baseRate: '10:10',
    });
    component.jobFamilyForm.updateValueAndValidity();
    spyOn(employeeService, 'v1EmployeeJobFamilyPut$Json$Response').and.returnValue(throwError({err: 'err'}));
    const navigateSpy = spyOn(router, 'navigate');

    component.save();

    expect(navigateSpy).not.toHaveBeenCalledWith(['firm/job-families']);
    expect(component.jobFamilyForm.invalid).toBe(false);
  });
});
