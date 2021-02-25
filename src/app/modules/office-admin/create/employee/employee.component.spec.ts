import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';

import { OfficeEmployeeComponent } from './employee.component';

const mockEmp = {
  "id": 3673,
  "userName": "rpsssssssatel1@gmail.com",
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
  "firstName": "r.hasmukhbhai.patel",
  "middleName": "",
  "lastName": "11176956",
  "suffix": null,
  "email": "rpsssssssatel1@gmail.com",
  "maidenName": "",
  "nickName": "",
  "commonName": "",
  "jobTitle": "Dr.",
  "employmentStartDate": "2020-04-03T00:00:00",
  "employmentEndDate": null,
  "isCompany": null,
  "isVisible": true,
  "preferredContactMethod": null,
  "doNotSchedule": false,
  "isInheritNotification": null,
  "initialJurisdictionId": null,
  "lastLoggedIn": null,
  "mondayOpenHours": "2020-10-27T00:00:00+00:00",
  "mondayCloseHours": "2020-10-27T00:00:00+00:00",
  "tuesdayOpenHours": "2020-10-27T00:00:00+00:00",
  "tuesdayCloseHours": "2020-10-27T00:00:00+00:00",
  "wednesdayOpenHours": "2020-10-27T00:00:00+00:00",
  "wednesdayCloseHours": "2020-10-27T00:00:00+00:00",
  "thursdayOpenHours": "2020-10-27T00:00:00+00:00",
  "thursdayCloseHours": "2020-10-27T00:00:00+00:00",
  "fridayOpenHours": "2020-10-27T00:00:00+00:00",
  "fridayCloseHours": "2020-10-27T00:00:00+00:00",
  "saturdayOpenHours": "2020-10-27T00:00:00+00:00",
  "saturdayCloseHours": "2020-10-27T00:00:00+00:00",
  "sundayOpenHours": "2020-10-27T00:00:00+00:00",
  "sundayCloseHours": "2020-10-27T00:00:00+00:00",
  "reportingManager": {
    "id": 1304,
    "name": "Lexicon dev, Admin"
  },
  "approvingManager": {
    "id": 3673,
    "name": "11176956, r.hasmukhbhai.patel"
  },
  "practiceManager": {
    "id": 3673,
    "name": "11176956, r.hasmukhbhai.patel"
  },
  "primaryOffice": {
    "id": 1453,
    "name": "1 Office"
  },
  "phones": [
    {
      "id": 58690,
      "number": "1111111111",
      "type": "primary",
      "isPrimary": true,
      "personId": 3673
    }
  ],
  "secondaryOffices": [
    {
      "id": 1453,
      "name": "1 Office"
    },
    {
      "id": 1461,
      "name": "10 Office"
    },
    {
      "id": 1464,
      "name": "12 Office "
    },
    {
      "id": 1489,
      "name": "Office-05"
    },
    {
      "id": 1499,
      "name": "Bill_1 week"
    },
    {
      "id": 1529,
      "name": "TrialTrial"
    },
    {
      "id": 1530,
      "name": "fdf"
    },
    {
      "id": 1654,
      "name": "1 Billing Office"
    },
    {
      "id": 1709,
      "name": " Andrews Office"
    },
    {
      "id": 1771,
      "name": "14 August"
    },
    {
      "id": 1798,
      "name": "test office for bill generation frequency"
    },
    {
      "id": 1901,
      "name": "sdfsdf"
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
      "id": 2,
      "name": "Alaska"
    },
    {
      "id": 5,
      "name": "California"
    },
    {
      "id": 6,
      "name": "Colorado"
    },
    {
      "id": 18,
      "name": "Kentucky"
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
      "id": 396,
      "name": "6394 8 Sept"
    }
  ],
  "profilePicture": "",
  "jobFamily": 0,
  "jobFamilyName": "",
  "isActivated": false
};

describe('OfficeEmployeeComponent', () => {
  let component: OfficeEmployeeComponent;
  let fixture: ComponentFixture<OfficeEmployeeComponent>;
  let dialogService: DialogService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        HttpClientTestingModule,
      ],
      declarations: [ 
        OfficeEmployeeComponent 
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OfficeEmployeeComponent);
    dialogService = TestBed.get(DialogService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('selected employee length should be 1', () => {
    component.selectEmployee(mockEmp);

    expect(component.gridEmployeeList.length).toBe(1);
    expect(component.attorneysList.length).toBe(1);
    expect(component.consultAttorneyList.length).toBe(1);
  });

  it('next click and save employeedetails on localStorage', () => {
    component.selectEmployee(mockEmp);

    component.next();

    const localData = UtilsHelper.getObject('office');
    expect(localData.employeesDetails.attorneys.length).toBe(1, 'attorneys length must be 1');
    expect(localData.employeesDetails.consultRankingView).toBe(true, 'consultRankingView must be boolean');
    expect(localData.employeesDetails.consultVisibilityId).toBe(1, 'Administrators and Schedulers only selected');
    expect(localData.employeesDetails.consultant.length).toBe(1, 'consultant length must be 1');
    expect(localData.employeesDetails.employees.length).toBe(1, 'employees length must be 1');
    expect(localData.employeesDetails.grid.length).toBe(1, 'grid length must be 1');
    expect(localData.employeesDetails.rankingView).toBe(true, 'rankingView must be boolean');
    expect(localData.employeesDetails.responsibleVisibilityId).toBe(1, 'Administrators and Schedulers only selected');
  });

});
