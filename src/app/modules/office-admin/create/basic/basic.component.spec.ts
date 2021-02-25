import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from 'src/app/modules/shared/shared.module';

import { BasicComponent } from './basic.component';
import { DesignatedContactComponent } from '../../designated-contact/designated-contact.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule } from 'ngx-toastr';
import { OfficeService } from 'src/common/swagger-providers/services';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';

describe('BasicComponent', () => {
  let component: BasicComponent;
  let fixture: ComponentFixture<BasicComponent>;
  let officeService: OfficeService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        HttpClientTestingModule,
        RouterTestingModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
      ],
      declarations: [ 
        BasicComponent,
        DesignatedContactComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicComponent);
    officeService = TestBed.get(OfficeService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    UtilsHelper.removeObject('office');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('save basic information in to localStorage', () => {

    component.officeStatus = [{id: 1, status: 'Active'}];
    component.stateList = [{code: 'AK', name: 'Alaska'}];
    fixture.detectChanges();
    component.officeAdminForm.patchValue({
      name: 'test office',
      openingDate: "2020-10-27T00:00:00.000Z",
      statusId: 1,
      acceptsInitialConsultation: true,
      street: 'address1',
      address2: 'address2',
      city: 'alaska',
      state: 'AK',
      zipCode: '123456',
      phone1: '1111111111',
      phone2: '2222222222',
      fax: '3333333333'
    });
    component.officeAdminForm.updateValueAndValidity();
    
    component.retainerPracticeArea = [145,73];
    component.designatedContact = {
      "id": 5785,
      "lastName": "5245",
      "email": "pmishra@codal.com",
      "firstName": "Employee",
      "phone": {
        "id": 61231,
        "number": "1566515611",
        "type": "primary",
        "isPrimary": true,
        "personId": 5785
      }
    };

    component.officeLocation = {
      lat: 0,
      lon: 0,
      placeId: 0
    };
    component.timeZoneDetails = {
      timeZone: null,
    };
    component.selectedStateName = 'Alaska';

    component.next();

    const localData = UtilsHelper.getObject('office');
    expect(component.formSubmitted).toEqual(true);
    expect(component.officeAdminForm.invalid).toEqual(false);
    expect(localData.basicDetails.name).toContain('test office');
    expect(localData.basicDetails.openingDate).toContain('2020-10-27');
    expect(localData.basicDetails.statusId).toBe(1);
    expect(localData.basicDetails.acceptsInitialConsultation).toBeTruthy();
    expect(localData.basicDetails.street).toContain('address1');
    expect(localData.basicDetails.address2).toContain('address2');
    expect(localData.basicDetails.city).toContain('alaska');
    expect(localData.basicDetails.state).toContain('AK');
    expect(localData.basicDetails.zipCode).toContain('123456');
    expect(localData.basicDetails.phone1).toContain('1111111111');
    expect(localData.basicDetails.phone2).toContain('2222222222');
    expect(localData.basicDetails.fax).toContain('3333333333');
    expect(localData.basicDetails.practiceAreaIds.length).toBe(2);
    expect(localData.basicDetails.lat).toBe(0);
    expect(localData.basicDetails.lon).toBe(0);
    expect(localData.basicDetails.timezone).toBeNull();
    expect(localData.selectedStateName).toContain('Alaska');
    expect(localData.designatedContactDetails.isOther).toEqual(false);
    expect(localData.designatedContactDetails.contact.id).toBe(5785);
  });
});
