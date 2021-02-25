import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StoreModule } from '@ngrx/store';
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db';
import { ToastrModule } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { TenantProfileService } from 'src/app/service/tenant-profile.service';
import { reducers } from 'src/app/store';
import { MiscService, TenantService } from 'src/common/swagger-providers/services';
import { DialogService } from '../../shared/dialog.service';
import { SharedModule } from '../../shared/shared.module';
import { SharedService } from '../../shared/sharedService';
import { GeneralComponent } from './general.component';
import { MatterTypeComponent } from './matter-type/matter-type.component';
import { PracticeAreaComponent } from './practice-area/practice-area.component';

const dbConfig: DBConfig = {
  name: 'Lexicon',
  version: 1,
  objectStoresMeta: [{
    store: 'config',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      { name: 'key', keypath: 'key', options: { unique: false } },
      { name: 'value', keypath: 'value', options: { unique: false } }
    ]
  }]
};

let tenatMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQ2NDAyOTAsImV4cCI6MTYwNDY4MzQ5MCwiaWF0IjoxNjA0NjQwMjkwfQ.FYWhg2MqWrQrL8JRCdKn4-HODnX0AWx6ykhw9kDawHE",
  "results": {
    "id": 1006,
    "name": "Flash 1.0",
    "appName": "https://sc1.lexiconservices.com/",
    "guid": "dcb04bbb-c123-485b-833b-33028ed12ced",
    "primaryContactId": null,
    "createdBy": 8,
    "createdAt": "2019-12-24T05:54:33.28",
    "updatedBy": 1304,
    "lastUpdated": "2020-11-06T09:31:12.743",
    "isActive": true,
    "office": []
  }
};

let practiceAreasMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQ2NDAyOTAsImV4cCI6MTYwNDY4MzQ5MCwiaWF0IjoxNjA0NjQwMjkwfQ.FYWhg2MqWrQrL8JRCdKn4-HODnX0AWx6ykhw9kDawHE",
  "results": [
    {
      "id": 72,
      "name": "Family Law",
      "createdBy": null,
      "createdDate": "2019-12-24T05:54:34.64"
    },
    {
      "id": 73,
      "name": "Corporate Law",
      "createdBy": null,
      "createdDate": "2019-12-24T05:54:34.647"
    },
    {
      "id": 74,
      "name": "Mergers & Acquisitions",
      "createdBy": null,
      "createdDate": "2019-12-24T05:54:34.647"
    },
    {
      "id": 75,
      "name": "Criminal Law",
      "createdBy": null,
      "createdDate": "2019-12-24T05:54:34.647"
    },
    {
      "id": 76,
      "name": "Sports & Entertainment Law",
      "createdBy": null,
      "createdDate": "2019-12-24T05:54:34.647"
    }
  ]
};

let tenantProfileMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQ2NDAyOTAsImV4cCI6MTYwNDY4MzQ5MCwiaWF0IjoxNjA0NjQwMjkwfQ.FYWhg2MqWrQrL8JRCdKn4-HODnX0AWx6ykhw9kDawHE",
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

let matterTypeMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQ2NDAyOTAsImV4cCI6MTYwNDY4MzQ5MCwiaWF0IjoxNjA0NjQwMjkwfQ.FYWhg2MqWrQrL8JRCdKn4-HODnX0AWx6ykhw9kDawHE",
  "results": [
    {
      "id": 70,
      "name": "Dowry Case",
      "practiceId": 72,
      "practice": "Family Law",
      "practices": null
    },
    {
      "id": 72,
      "name": "Money Laundring",
      "practiceId": 75,
      "practice": "Criminal Law",
      "practices": null
    },
    {
      "id": 73,
      "name": "Murder",
      "practiceId": 75,
      "practice": "Criminal Law",
      "practices": null
    },
    {
      "id": 75,
      "name": "Extra Matter Type",
      "practiceId": 85,
      "practice": "Extra Practice area new ",
      "practices": null
    },
    {
      "id": 76,
      "name": "New Sample Matter Type Edited",
      "practiceId": 73,
      "practice": "Corporate Law",
      "practices": null
    }
  ]
};

let timeZoneMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQ2NDAyOTAsImV4cCI6MTYwNDY4MzQ5MCwiaWF0IjoxNjA0NjQwMjkwfQ.FYWhg2MqWrQrL8JRCdKn4-HODnX0AWx6ykhw9kDawHE",
  "results": [
    {
      "id": "Hawaiian Standard Time",
      "name": "(UTC-10:00) Hawaii",
      "isSysytemTimeZone": false
    },
    {
      "id": "Alaskan Standard Time",
      "name": "(UTC-09:00) Alaska",
      "isSysytemTimeZone": false
    },
    {
      "id": "Pacific Standard Time",
      "name": "(UTC-08:00) Pacific Time (US & Canada)",
      "isSysytemTimeZone": false
    },
    {
      "id": "Mountain Standard Time",
      "name": "(UTC-07:00) Mountain Time (US & Canada)",
      "isSysytemTimeZone": false
    },
    {
      "id": "Central Standard Time",
      "name": "(UTC-06:00) Central Time (US & Canada)",
      "isSysytemTimeZone": true
    },
    {
      "id": "Eastern Standard Time",
      "name": "(UTC-05:00) Eastern Time (US & Canada)",
      "isSysytemTimeZone": false
    }
  ]
};

// Mock class for NgbModalRef
export class MockNgbModalRef {
  componentInstance = {
      prompt: undefined,
      title: undefined
  };
  result: Promise<any> = new Promise((resolve, reject) => resolve(true));
}

describe('GeneralComponent', () => {
  let component: GeneralComponent;
  let fixture: ComponentFixture<GeneralComponent>;
  let modalService: NgbModal;
  let tenantService: TenantService;
  let miscService: MiscService;
  let mockModalRef: MockNgbModalRef = new MockNgbModalRef();
  let toaster: ToastDisplay;
  let dialogService: DialogService;
  let sharedService: SharedService;
  let tenantProfileService: TenantProfileService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports:[
        SharedModule,
        StoreModule.forRoot(reducers),
        HttpClientTestingModule,
        RouterTestingModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
        BrowserAnimationsModule,
        NgxIndexedDBModule.forRoot(dbConfig),
      ],
      declarations: [ GeneralComponent, PracticeAreaComponent ],
      providers: [SharedService],
    }).overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [PracticeAreaComponent]
      }
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneralComponent);
    modalService = TestBed.get(NgbModal);
    tenantService = TestBed.get(TenantService);
    miscService = TestBed.get(MiscService);
    toaster = TestBed.get(ToastDisplay);
    dialogService = TestBed.get(DialogService);
    sharedService = TestBed.get(SharedService);
    tenantProfileService = TestBed.get(TenantProfileService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('getTenantData is true then called practice area, tenant profile, matter type should called in ngOnInIt', () => {
    spyOn(tenantService, 'v1TenantGet').and.returnValue(of(JSON.stringify(tenatMock) as any));
    spyOn(tenantService, 'v1TenantPracticeAreaGet').and.returnValue(of(JSON.stringify(practiceAreasMock) as any));
    spyOn(component, 'updateDatatableFooterPage').and.callThrough();
    spyOn(tenantService, 'v1TenantProfileGet').and.returnValue(of(JSON.stringify(tenantProfileMock) as any));
    spyOn(tenantService, 'v1TenantMattertypesGet').and.returnValue(of(JSON.stringify(matterTypeMock) as any));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.tenant.id).toBe(1006);
    expect(component.practiceAreas.length).toBe(5);
    expect(component.updateDatatableFooterPage).toHaveBeenCalled();
    expect(component.tenantProfile.id).toBe(7);
    expect(component.logoSrc).toBeNull();
    expect(component.faviconSrc).toBeNull();
    expect(component.matterTypes.length).toBe(5);
  });

  it('getTenantData error', () => {
    spyOn(tenantService, 'v1TenantGet').and.returnValue(of(JSON.stringify({results: null}) as any));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.practiceLoading).toBe(false);
    expect(component.matterLoading).toBe(false);
  });

  it('loadSystemTimeZones if selected set selected should called in ngOnIt', () => {
    let res = {body : JSON.stringify(timeZoneMock)};
    spyOn(miscService, 'v1MiscSystemtimezonesGet$Response').and.returnValue(of(res) as any);

    component.ngOnInit();

    expect(component.timeZones.length).toBe(6);
    expect(component.selectedSystemTimeZoneId).toContain('Central Standard Time');
  });

  it('loadSystemTimeZones if not selected default set', () => {
    timeZoneMock.results.filter(d => {
      return d.isSysytemTimeZone = false;
    });
    let res = {body : JSON.stringify(timeZoneMock)};
    spyOn(miscService, 'v1MiscSystemtimezonesGet$Response').and.returnValue(of(res) as any);

    component.ngOnInit();

    expect(component.timeZones.length).toBe(6);
    expect(component.selectedSystemTimeZoneId).toContain('Eastern Standard Time');
  });

  it('add practice area model should open and practice area add success', fakeAsync (() => {
    spyOn(modalService, 'open').and.returnValue(mockModalRef as any);
    spyOn(tenantService, 'v1TenantPracticeAreaPost$Json').and.returnValue(of(JSON.stringify(practiceAreasMock)) as any);
    spyOn(component, 'updateDatatableFooterPage').and.callThrough();
    spyOn(toaster, 'showSuccess').and.callThrough();
    tick(1);

    let addButton = fixture.debugElement.nativeElement.querySelector('#add-practice-area');
    addButton.click();

    tick(2);
    expect(modalService.open).toHaveBeenCalledWith(PracticeAreaComponent, { centered: true, backdrop: 'static', keyboard: false });
    expect(component.practiceAreas.length).toBe(5);
    expect(component.updateDatatableFooterPage).toHaveBeenCalledWith('Practice');
    expect(toaster.showSuccess).toHaveBeenCalledWith('Practice area added.');
    flush();
  }));

  it('add practice area model should open and practice area add Some error occurred', fakeAsync (() => {
    spyOn(modalService, 'open').and.returnValue(mockModalRef as any);
    spyOn(tenantService, 'v1TenantPracticeAreaPost$Json').and.returnValue(of(JSON.stringify({results: false})) as any);
    spyOn(toaster, 'showError').and.callThrough();
    tick(1);

    let addButton = fixture.debugElement.nativeElement.querySelector('#add-practice-area');
    addButton.click();

    tick(2);
    expect(modalService.open).toHaveBeenCalledWith(PracticeAreaComponent, { centered: true, backdrop: 'static', keyboard: false });
    expect(toaster.showError).toHaveBeenCalledWith('Some error occurred');
    flush();
  }));

  it('edit practice area model should open and practice area update success', fakeAsync (() => {
    component.practiceAreas = JSON.parse(JSON.stringify(practiceAreasMock.results));

    fixture.detectChanges();

    spyOn(modalService, 'open').and.returnValue(mockModalRef as any);
    spyOn(tenantService, 'v1TenantPracticeAreaPut$Json').and.returnValue(of(JSON.stringify(practiceAreasMock)) as any);
    spyOn(toaster, 'showSuccess').and.callThrough();
    tick(1);

    let editButton = fixture.debugElement.nativeElement.querySelector('#edit-practice-area-index-0');
    editButton.click();

    tick(2);
    expect(modalService.open).toHaveBeenCalledWith(PracticeAreaComponent, { centered: true, backdrop: 'static', keyboard: false });
    expect(component.practiceAreas.length).toBe(5);
    expect(toaster.showSuccess).toHaveBeenCalledWith('Practice area updated.');
    flush();
  }));

  it('edit practice area model should open and practice area Some error occurred', fakeAsync (() => {
    component.practiceAreas = JSON.parse(JSON.stringify(practiceAreasMock.results));

    fixture.detectChanges();

    spyOn(modalService, 'open').and.returnValue(mockModalRef as any);
    spyOn(tenantService, 'v1TenantPracticeAreaPut$Json').and.returnValue(of(JSON.stringify({results: false})) as any);
    spyOn(toaster, 'showError').and.callThrough();
    tick(1);

    let editButton = fixture.debugElement.nativeElement.querySelector('#edit-practice-area-index-0');
    editButton.click();

    tick(2);
    expect(modalService.open).toHaveBeenCalledWith(PracticeAreaComponent, { centered: true, backdrop: 'static', keyboard: false });
    expect(component.practiceAreas.length).toBe(5);
    expect(toaster.showError).toHaveBeenCalledWith('Some error occurred');
    flush();
  }));

  it('delete practice area model should open and practice area delete success', fakeAsync (() => {
    component.practiceAreas = JSON.parse(JSON.stringify(practiceAreasMock.results));

    fixture.detectChanges();

    spyOn(dialogService, 'confirm').and.returnValue(Promise.resolve(true));
    spyOn(tenantService, 'v1TenantPracticeAreaIdDelete').and.returnValue(of(JSON.stringify(practiceAreasMock) as any));
    spyOn(toaster, 'showSuccess').and.callThrough();
    tick(1);

    let editButton = fixture.debugElement.nativeElement.querySelector('#delete-practice-area-index-0');
    editButton.click();

    tick(2);
    expect(dialogService.confirm).toHaveBeenCalledWith('Are you sure you want to delete this practice area?', 'Delete');
    expect(component.practiceAreas.length).toBe(5);
    expect(toaster.showSuccess).toHaveBeenCalledWith('Practice area deleted');
    flush();
  }));

  it('delete practice area model should open and practice area delete error', fakeAsync (() => {
    component.practiceAreas = JSON.parse(JSON.stringify(practiceAreasMock.results));

    fixture.detectChanges();

    spyOn(dialogService, 'confirm').and.returnValue(Promise.resolve(true));
    spyOn(tenantService, 'v1TenantPracticeAreaIdDelete').and.returnValue(of(JSON.stringify({results: false})) as any);
    spyOn(toaster, 'showError').and.callThrough();

    let editButton = fixture.debugElement.nativeElement.querySelector('#delete-practice-area-index-0');
    editButton.click();

    tick(1);
    expect(dialogService.confirm).toHaveBeenCalledWith('Are you sure you want to delete this practice area?', 'Delete');
    expect(toaster.showError).toHaveBeenCalledWith('Some error occurred');
    flush();
  }));

  it('delete practice area model should open and practice area delete catch error', fakeAsync (() => {
    component.practiceAreas = JSON.parse(JSON.stringify(practiceAreasMock.results));

    fixture.detectChanges();

    spyOn(dialogService, 'confirm').and.returnValue(Promise.resolve(true));
    spyOn(tenantService, 'v1TenantPracticeAreaIdDelete').and.returnValue(throwError({error: 'error'}));
    tick(1);

    let editButton = fixture.debugElement.nativeElement.querySelector('#delete-practice-area-index-0');
    editButton.click();

    tick(2);
    expect(dialogService.confirm).toHaveBeenCalledWith('Are you sure you want to delete this practice area?', 'Delete');
    flush();
  }));

  it('add matter type model should open and matter type add success', fakeAsync (() => {
    spyOn(modalService, 'open').and.returnValue(mockModalRef as any);
    spyOn(tenantService, 'v1TenantMattertypePost$Json').and.returnValue(of(JSON.stringify(matterTypeMock)) as any);
    spyOn(component, 'getMatteTypes').and.callThrough();
    spyOn(toaster, 'showSuccess').and.callThrough();

    let addButton = fixture.debugElement.nativeElement.querySelector('#add-matter-type');
    addButton.click();

    tick(1);
    expect(modalService.open).toHaveBeenCalledWith(MatterTypeComponent, { centered: true, backdrop: 'static', keyboard: false });
    expect(component.getMatteTypes).toHaveBeenCalledWith();
    expect(toaster.showSuccess).toHaveBeenCalledWith('Matter Type added');
    flush();
  }));


  it('add matter type model should open and matter type add error', fakeAsync (() => {
    spyOn(modalService, 'open').and.returnValue(mockModalRef as any);
    spyOn(tenantService, 'v1TenantMattertypePost$Json').and.returnValue(of(JSON.stringify({results: false})) as any);
    spyOn(toaster, 'showError').and.callThrough();

    let addButton = fixture.debugElement.nativeElement.querySelector('#add-matter-type');
    addButton.click();

    tick(1);
    expect(modalService.open).toHaveBeenCalledWith(MatterTypeComponent, { centered: true, backdrop: 'static', keyboard: false });
    expect(toaster.showError).toHaveBeenCalledWith('Some error occurred');
    flush();
  }));

  it('edit matter type model should open and matter type update success', fakeAsync (() => {
    component.matterTypes = matterTypeMock.results;
    fixture.detectChanges();
    spyOn(modalService, 'open').and.returnValue(mockModalRef as any);
    spyOn(tenantService, 'v1TenantMattertypePut$Json').and.returnValue(of(JSON.stringify(matterTypeMock)) as any);
    spyOn(component, 'getMatteTypes').and.callThrough();
    spyOn(toaster, 'showSuccess').and.callThrough();

    let editButton = fixture.debugElement.nativeElement.querySelector('#edit-mattertype-index-0');
    editButton.click();

    tick(1);
    expect(modalService.open).toHaveBeenCalledWith(MatterTypeComponent, { centered: true, backdrop: 'static', keyboard: false });
    expect(component.getMatteTypes).toHaveBeenCalledWith();
    expect(toaster.showSuccess).toHaveBeenCalledWith('Matter Type updated.');
    flush();
  }));

  it('edit matter type model should open and matter type update error', fakeAsync (() => {
    component.matterTypes = matterTypeMock.results;
    fixture.detectChanges();
    spyOn(modalService, 'open').and.returnValue(mockModalRef as any);
    spyOn(tenantService, 'v1TenantMattertypePut$Json').and.returnValue(of(JSON.stringify({results: false})) as any);
    spyOn(toaster, 'showError').and.callThrough();

    let addButton = fixture.debugElement.nativeElement.querySelector('#edit-mattertype-index-0');
    addButton.click();

    tick(1);
    expect(modalService.open).toHaveBeenCalledWith(MatterTypeComponent, { centered: true, backdrop: 'static', keyboard: false });
    expect(toaster.showError).toHaveBeenCalledWith('Some error occurred');
    flush();
  }));

  it('delete matter type model should open and matter type delete error', fakeAsync (() => {
    component.matterTypes = matterTypeMock.results;

    fixture.detectChanges();

    spyOn(dialogService, 'confirm').and.returnValue(Promise.resolve(true));
    spyOn(tenantService, 'v1TenantMattertypeIdDelete').and.returnValue(of(JSON.stringify(matterTypeMock)) as any);
    spyOn(component, 'updateDatatableFooterPage').and.callThrough();
    spyOn(toaster, 'showSuccess').and.callThrough();
    tick(1);

    let editButton = fixture.debugElement.nativeElement.querySelector('#delete-mattertype-index-0');
    editButton.click();

    tick(2);
    expect(dialogService.confirm).toHaveBeenCalledWith('Are you sure you want to delete this matter Type?', 'Delete');
    expect(component.matterTypes.length).toBe(5);
    expect(component.updateDatatableFooterPage).toHaveBeenCalledWith('Matter');
    expect(toaster.showSuccess).toHaveBeenCalledWith('Matter Type deleted.');
    flush();
  }));

  it('delete matter type model should open and matter type delete error', fakeAsync (() => {
    component.matterTypes = matterTypeMock.results;

    fixture.detectChanges();

    spyOn(dialogService, 'confirm').and.returnValue(Promise.resolve(true));
    spyOn(tenantService, 'v1TenantMattertypeIdDelete').and.returnValue(of(JSON.stringify({results: false})) as any);
    spyOn(toaster, 'showError').and.callThrough();
    tick(1);

    let editButton = fixture.debugElement.nativeElement.querySelector('#delete-mattertype-index-0');
    editButton.click();

    tick(2);
    expect(dialogService.confirm).toHaveBeenCalledWith('Are you sure you want to delete this matter Type?', 'Delete');
    expect(toaster.showError).toHaveBeenCalledWith('Some error occurred');
    flush();
  }));

  it('delete matter type model should open and matter type delete catch error', fakeAsync (() => {
    component.matterTypes = matterTypeMock.results;

    fixture.detectChanges();

    spyOn(dialogService, 'confirm').and.returnValue(Promise.resolve(true));
    spyOn(tenantService, 'v1TenantMattertypeIdDelete').and.returnValue(of(throwError({error: 'error'})) as any);
    spyOn(toaster, 'showError').and.callThrough();
    tick(1);

    let editButton = fixture.debugElement.nativeElement.querySelector('#delete-mattertype-index-0');
    editButton.click();

    tick(2);
    expect(dialogService.confirm).toHaveBeenCalledWith('Are you sure you want to delete this matter Type?', 'Delete');
    flush();
  }));

  it('download logo file should download success', () => {
    spyOn(component, 'downloadLogoClick').and.callThrough();
    let downloadButton = fixture.debugElement.nativeElement.querySelector('#download-file');
    downloadButton.click();

    expect(component.uploadLogoSizeErrorWarning).toBe(false);
    expect(component.uploadLogoErrorWarning).toBe(false);
    expect(component.downloadLogoClick).toHaveBeenCalled();
  });

  it('revert logo should success', () => {
    spyOn(component, 'revertLogoButton').and.callThrough();
    spyOn(tenantService, 'v1TenantDeletelogoDelete').and.returnValue(of({results: true}) as any);
    spyOn(sharedService, 'setLogo').and.callThrough();
    spyOn(component, 'getTenantProfile').and.callThrough();

    let downloadButton = fixture.debugElement.nativeElement.querySelector('#revert-default');
    downloadButton.click();

    expect(component.revertLogoButton).toHaveBeenCalled();
    expect(component.getTenantProfile).toHaveBeenCalled();
    expect(component.internalLogo).toBeNull();
    expect(component.logoSrc).toBeNull();
  });

  it('download favicon should download success', () => {
    spyOn(component, 'downloadFaviconClick').and.callThrough();
    let downloadButton = fixture.debugElement.nativeElement.querySelector('#fav-download-file');
    downloadButton.click();

    expect(component.uploadFaviconSizeErrorWarning).toBe(false);
    expect(component.uploadFaviconErrorWarning).toBe(false);
    expect(component.downloadFaviconClick).toHaveBeenCalled();
  });

  it('revert favicon should success', () => {
    spyOn(component, 'revertFaviconButton').and.callThrough();
    spyOn(tenantService, 'v1TenantDeletefaviconDelete').and.returnValue(of({results: true}) as any);
    spyOn(component, 'getTenantProfile').and.callThrough();

    let downloadButton = fixture.debugElement.nativeElement.querySelector('#fav-revert-default');
    downloadButton.click();

    expect(component.revertFaviconButton).toHaveBeenCalled();
    expect(component.getTenantProfile).toHaveBeenCalled();
  });

  it('dismiss logo error', () => {
    component.dismissLogoError();
    expect(component.uploadLogoErrorWarning).toBe(false);
    expect(component.uploadLogoSizeErrorWarning).toBe(false);
  });

  it('dismiss favicon error', () => {
    component.dismissFaviconError();
    expect(component.uploadFaviconErrorWarning).toBe(false);
    expect(component.uploadFaviconSizeErrorWarning).toBe(false);
  });

  it('upload logo file drag and drop select 1 file error', () => {
    spyOn(toaster, 'showError').and.callThrough();
    const file = new File([''], 'dummy.jpg');
    component.uploadFileDragAndDrop([file, file]);
    expect(toaster.showError).toHaveBeenCalledWith('Please select only 1 file.');
  });

  it('upload logo file drag and drop should display error if invalid file', () => {
    spyOn(component, 'uploadFile').and.callThrough();
    const file = new File([''], 'dummy.svg');
    component.uploadFileDragAndDrop([file]);

    expect(component.uploadLogoErrorWarning).toBe(true);
    expect(component.uploadFile).toHaveBeenCalled();
  });

  it('upload favicon file drag and drop select 1 file error', () => {
    spyOn(toaster, 'showError').and.callThrough();
    const file = new File([''], 'dummy.jpg');
    component.uploadFaviconDragAndDrop([file, file]);
    expect(toaster.showError).toHaveBeenCalledWith('Please select only 1 file.');
  });

  it('upload favicon file drag and drop should display error if invalid file', () => {
    spyOn(component, 'uploadFavicon').and.callThrough();
    const file = new File([''], 'dummy.svg');
    component.uploadFaviconDragAndDrop([file]);

    expect(component.uploadFaviconErrorWarning).toBe(true);
    expect(component.uploadFavicon).toHaveBeenCalled();
  });

  it('logo browse reset logo error', () => {
    spyOn(component, 'uploadButtonClick').and.callThrough();
    let logoBrowse = fixture.debugElement.nativeElement.querySelector('#upload-btn-click');
    logoBrowse.click();

    expect(component.uploadButtonClick).toHaveBeenCalled();
    expect(component.uploadLogoErrorWarning).toBe(false);
    expect(component.uploadLogoSizeErrorWarning).toBe(false);
  });

  it('favicon browse reset favicon error', () => {
    spyOn(component, 'uploadFaviconButtonClick').and.callThrough();
    let faviconBrowse = fixture.debugElement.nativeElement.querySelector('#fav-drag-drop-click');
    faviconBrowse.click();

    expect(component.uploadFaviconButtonClick).toHaveBeenCalled();
    expect(component.uploadFaviconErrorWarning).toBe(false);
    expect(component.uploadFaviconSizeErrorWarning).toBe(false);
  });

  it('timeZone changes', () => {
    component.onChange('event')

    expect(component.changeTimeZoneValue).toBe(true);
  });

  it('save click, tenat name null should save return ', () => {
    let saveBtn = fixture.debugElement.nativeElement.querySelector('#save-btn');
    saveBtn.click();
    expect(component.dataEntered).toBe(false);
    expect(component.formSubmitted).toBe(true);
  });

  it('save click, tenat name, timezone, tenant profile, logo, favicon should save success', () => {
    component.timeZones = JSON.parse(JSON.stringify(timeZoneMock.results));
    component.selectedSystemTimeZoneId = 'Hawaiian Standard Time';
    component.changeTimeZoneValue = true;
    component.tenant.name = 'unit test';
    spyOn(tenantService, 'v1TenantSetUpdateSystemTimeZonePost$Json').and.returnValue(of(JSON.stringify({results: true})) as any)
    spyOn(tenantService, 'v1TenantPut$Json').and.returnValue(of(JSON.stringify({results: true})) as any);
    spyOn(tenantProfileService, 'v1TenantProfilePut').and.returnValue(of({results: true}) as any);
    spyOn(toaster, 'showSuccess').and.callThrough();

    let saveBtn = fixture.debugElement.nativeElement.querySelector('#save-btn');
    saveBtn.click();

    expect(component.dataEntered).toBe(false);
    expect(component.formSubmitted).toBe(false);
    expect(toaster.showSuccess).toHaveBeenCalledWith('Tenant details saved.');
  });

  it('save click, tenat name, timezone, tenant profile, logo, favicon should save error', () => {
    component.tenant.name = 'unit test';
    spyOn(tenantService, 'v1TenantPut$Json').and.returnValue(of(JSON.stringify({results: false})) as any);
    spyOn(tenantProfileService, 'v1TenantProfilePut').and.returnValue(of({results: false}) as any);
    spyOn(toaster, 'showError').and.callThrough();

    let saveBtn = fixture.debugElement.nativeElement.querySelector('#save-btn');
    saveBtn.click();

    expect(component.dataEntered).toBe(false);
    expect(toaster.showError).toHaveBeenCalledWith('Some error occurred');
  });

  it('save click, tenat name, timezone, tenant profile, logo, favicon should save catch error', () => {
    component.tenant.name = 'unit test';
    spyOn(tenantService, 'v1TenantPut$Json').and.returnValue(throwError({error: 'error'}));
    spyOn(tenantProfileService, 'v1TenantProfilePut').and.returnValue(throwError({error: 'error'}));

    let saveBtn = fixture.debugElement.nativeElement.querySelector('#save-btn');
    saveBtn.click();

    expect(component.formSubmitted).toBe(false);
  });

  it('should call selectNew data entered should be true', () => {
    component.selectNew();
    expect(component.dataEntered).toBe(true);
  });

});
