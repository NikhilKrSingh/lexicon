import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing'
import { RouterTestingModule } from '@angular/router/testing'
import { StoreModule } from '@ngrx/store'
import { exception } from 'console'
import { DBConfig, NgxIndexedDBModule } from 'ngx-indexed-db'
import { ToastrModule } from 'ngx-toastr'
import { Observable, of } from 'rxjs'
import { reducers } from 'src/app/store'
import { ApiModule } from 'src/common/swagger-providers/api.module'
import { SharedModule } from '../../shared/shared.module'
import { SharedService } from '../../shared/sharedService'
import { DocumentManagementComponent } from '../document-management/document-management.component'
import { ManageFoldersModule } from '../manage-folders.module'
import { UploadDocvComponent } from "./upload-docv.component"


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

let documentSettingsMockData = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBhZG1pbiIsImF6cCI6IjEwMDYiLCJlbWFpbCI6ImFkbWluTGV4QHlvcG1haWwuY29tIiwiZmFtaWx5X25hbWUiOiJUZW5hbnQgQWRtaW4iLCJnZW5kZXIiOiIiLCJUaWVyIjoiSWNvbmljIiwiQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndNOVU1SGg3a0pwNmRDK2dzSWNBVVA4bzE2eXQxNEdkdHl1OGQxdXNDRjlPbkhVRk1CNzE0V0QyakNhWkY1VFZGQT09IiwiUmVwb3J0aW5nQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndNOVU1SGg3a0pwNmRDK2dzSWNBVVA4bzE2eXQxNEdkdHl1OGQxdXNDRjlPbkhVRk1CNzE0V0QyakNhWkY1VFZGQT09IiwibmJmIjoxNjExMTI0NTI0LCJleHAiOjE2MTExNjc3MjQsImlhdCI6MTYxMTEyNDUyNH0.hdfCM4TxQFo4CHvpn2CHFFd3Uaqkh425b0tmcGqxqPI",
  "results": {
    "id": 30,
    "officeId": null,
    "personId": null,
    "matterId": null,
    "tenantId": 1006,
    "isBulkApproval": true,
    "documentPortalAccess": true,
    "isDocuSyncEnable": true,
    "changeNotes": null,
    "isSignatureEnable": true
  }
}

let userInfoMock = {
  "addressId": null,
  "cellPhone": null,
  "commonName": "",
  "companyName": null,
  "email": "adminLex@yopmail.com",
  "employmentEndDate": null,
  "employmentStartDate": null,
  "fax": null,
  "firstName": "Admin",
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
      "id": 334,
      "name": "admin"
    }
  ],
  "id": 1304,
  "isArchived": false,
  "isCompany": false,
  "isVisible": true,
  "jobTitle": "Tenant Admin",
  "lastName": "Lexicon dev",
  "maidenName": "",
  "middleName": "",
  "nickName": "",
  "officeId": 5,
  "password": "1otYec3T5BXeGjL8X6zgcDhVNhk32rlfbuEOwATQoSE=",
  "preferredContactMethod": null,
  "primaryContactId": null,
  "primaryPhone": null,
  "role": null,
  "salutation": null,
  "suffix": null,
  "tenantId": 1006,
  "tenantTier": {
    "tierLevel": 3,
    "tierName": "Iconic"
  },
  "uniqueNumber": 0,
  "userName": "adminLex@yopmail.com"
}

let fileMockData = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBhZG1pbiIsImF6cCI6IjEwMDYiLCJlbWFpbCI6ImFkbWluTGV4QHlvcG1haWwuY29tIiwiZmFtaWx5X25hbWUiOiJUZW5hbnQgQWRtaW4iLCJnZW5kZXIiOiIiLCJUaWVyIjoiSWNvbmljIiwiQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndNOVU1SGg3a0pwNmRDK2dzSWNBVVA4bzE2eXQxNEdkdHl1OGQxdXNDRjlPbkhVRk1CNzE0V0QyakNhWkY1VFZGQT09IiwiUmVwb3J0aW5nQ29ubmVjdGlvblN0cmluZyI6IkdWSnVQQk1kc0RhRzU1dXRwN005SmwxNzBWY2d3MHlvdFNhY0FEWW4vbG5LV0c2UHNEaHo4dno5N0ZQWnBscUJEWTZGUHY3MnlrY1oyNW1mbXMxdndNOVU1SGg3a0pwNmRDK2dzSWNBVVA4bzE2eXQxNEdkdHl1OGQxdXNDRjlPbkhVRk1CNzE0V0QyakNhWkY1VFZGQT09IiwibmJmIjoxNjExMjIwMDQ5LCJleHAiOjE2MTEyNjMyNDksImlhdCI6MTYxMTIyMDA0OX0.qZ1W_BJksnG5i60RNi5Mzgwnz8tkAnRAA3MGKfJeEhE",
  "results": {
    "id": 49233,
    "folderId": 84083,
    "fileName": "All_Field_in_Client (5) (1).pdf",
    "status": "Active",
    "isDraftingTemplate": true,
    "isFillableTemplate": true,
    "containsESignatureFields": false,
    "owner": {
      "id": 1304,
      "uniqueNumber": 0,
      "firstName": "Admin",
      "lastName": "Lexicon dev",
      "companyName": null,
      "clientFlag": null,
      "email": "adminLex@yopmail.com",
      "jobTitle": "Tenant Admin",
      "isVisible": true,
      "isCompany": false,
      "primaryOffice": null,
      "associationTypeId": 0,
      "associationTypeName": null,
      "associations": [],
      "phones": [],
      "preferredPhone": null,
      "role": null,
      "preferredContactMethod": null,
      "doNotContact": null,
      "doNotContactReason": null,
      "personPhoto": null,
      "doNotSchedule": null,
      "blockId": null,
      "description": null,
      "clientName": null,
      "clientNumber": null,
      "matterName": null,
      "responsibleAttorney": null,
      "primaryOfficeName": null,
      "primaryOfficeId": 0,
      "personPhotoURL": null,
      "clientId": null,
      "associatedWithClient": null,
      "associatedWithPC": null,
      "priority": 0,
      "tmpClientNumber": null,
      "totalCount": 0,
      "matterNumber": null,
      "empTimezone": null
    },
    "coOwner": [],
    "version": 3,
    "fileSizeInKB": 0,
    "lastUpdated": "2020-12-30T12:43:10.32Z",
    "fullFolderPath": null,
    "fullFilePath": "https://quartodmsqa.blob.core.windows.net/quarto-dms-data/tenant-1006/aaa-Do Not Touch - Testing/All_Field_in_Client (5) (1)_3.pdf",
    "checkedOutDateTime": null,
    "checkedOutTo": null,
    "checkedInDateTime": null,
    "checkedInBy": null,
    "isForcedCheckIn": null,
    "categories": [
    ],
    "canGrantSharingRight": false,
    "hasSharingRight": false,
    "isInsideSystemFolder": false,
    "dmsFileStatus": "UploadDone",
    "dmsFileStatusDetails": "",
    "documentSigningStatus": 0,
    "lexiconAppOpenDocLink": null,
    "originalFileName": "All_Field_in_Client (5) (1).pdf"
  }
}

let fileCateoriesMock = [
  {
    "id": 37,
    "name": "DAS1101"
  },
  {
    "id": 39,
    "name": "Category 1"
  },
  {
    "id": 44,
    "name": "Catagory 122"
  },
  {
    "id": 46,
    "name": "cate-1992"
  }
]

describe("UploadDocvComponent", () => {
  let component: UploadDocvComponent;
  let fixture: ComponentFixture<UploadDocvComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[SharedModule, RouterTestingModule.withRoutes([
        {path:'manage-folders/document', component: DocumentManagementComponent}
      ]), HttpClientTestingModule, StoreModule.forRoot(reducers), ApiModule.forRoot({
        rootUrl: 'sc1-api.lexiconservices.com'
        }),ToastrModule.forRoot({
          closeButton: true
        }),
        NgxIndexedDBModule.forRoot(dbConfig),

      ],
      providers:[SharedService],
      declarations:[
        UploadDocvComponent
      ]
    });

    fixture = TestBed.createComponent(UploadDocvComponent);
    component = fixture.componentInstance; 
    component.ngOnInit();
  })

  it('should initialize Component', () => {
    expect(component).toBeTruthy();
  })

  it('should have title Modify Document Properties', () => {
    component.isEditMode = true;
    const heading = fixture.debugElement.nativeElement.querySelector('h1');
    fixture.detectChanges();
    expect(heading.textContent).toEqual('Modify Document Properties');
  })

  it('should have title Upload Document', () => {
    component.isEditMode = false;
    const heading = fixture.debugElement.nativeElement.querySelector('h1');
    fixture.detectChanges();
    expect(heading.textContent).toEqual('Upload Document');
  })

  it('should call initAllEditDocumentAsyncFunctionCall', () => {
    component.isEditMode = true;
    spyOn(component, 'initAllEditDocumentAsyncFunctionCall').and.callThrough();
    component.ngOnInit();
    expect(component.initAllEditDocumentAsyncFunctionCall).toHaveBeenCalled();
  })

  it('should call the Initializer functions', fakeAsync(() => {
    component.isEditMode = true;
    spyOn(component, 'getDocumentSettings').withArgs(true).and.callThrough();
    spyOn(component, 'getDesignateOwners').and.callThrough();
    component.initAllEditDocumentAsyncFunctionCall();
    expect(component.getDocumentSettings).toHaveBeenCalledWith(true);
    expect(component.getDesignateOwners).toHaveBeenCalled();
  }));

  it('should call fileList after Promise resolves', fakeAsync(() => {
    component.isEditMode = true;
    spyOn(component, 'getDocumentSettings').and.returnValue(Promise.resolve());
    spyOn(component, 'getDesignateOwners').and.returnValue(Promise.resolve());
    spyOn(component, 'getFilesList')
    component.initAllEditDocumentAsyncFunctionCall();
    tick();
    expect(component.getFilesList).toHaveBeenCalled();
  }))

  it('should fetch Document Settings', () => {
    component.currentUserInfo = userInfoMock;
    spyOn(component.documentSettingService, 'v1DocumentSettingTenantTenantIdGet').and.returnValue(of(JSON.stringify(documentSettingsMockData) as any));
    component.getDocumentSettings(true);
    fixture.detectChanges();
    expect(component.esignEnabled).toBeDefined();
  })

  it('should remove Contains E-Signature if not ', fakeAsync(() => {
    let userInfoMockCopy = documentSettingsMockData;
    userInfoMockCopy.results.isSignatureEnable = false;
    component.isEditMode = true;
    component.currentUserInfo = userInfoMock;
    spyOn(component.documentSettingService, 'v1DocumentSettingTenantTenantIdGet').and.returnValue(of(JSON.stringify(userInfoMockCopy) as any));
    component.getDocumentSettings(true);
    tick();
    expect(component.docAttributes.length).toEqual(2);//fillable/drafting template will be left
  }));

  it('should get details of the file', fakeAsync(() => {
    component.documentId = 49233;
    spyOn(component.dmsService, 'v1DmsFileIdGet').and.returnValue(of(JSON.stringify(fileMockData) as any));
    spyOn(component, 'setDocAttr').withArgs(fileMockData.results).and.callThrough();
    component.getFilesList();
    tick();
    
    let fileExtension = fileMockData.results.fileName.split('.').pop();
    expect(component.fileExtenson).toEqual(fileExtension);
    let categoryIdsArr = fileMockData.results.categories.map(x => x.id);
    expect(component.selectedCategories).toEqual(categoryIdsArr);
    expect(component.setDocAttr).toHaveBeenCalledWith(fileMockData.results);
    expect(component.editDocumentForm.controls['id'].value).toEqual(fileMockData.results.id);
    expect(component.editDocumentForm.controls['nameOfFile'].value).toEqual(fileMockData.results.fileName);
    expect(component.editDocumentForm.controls['ownerId'].value).toEqual(fileMockData.results.owner.id);
    expect(component.editDocumentForm.controls['status'].value).toEqual(fileMockData.results.status);
    expect(component.editDoc).toEqual(fileMockData.results);
  }));

  it('should disable attirbutes based on the file extension', fakeAsync(() => {
    let modifiedData = fileMockData;
    modifiedData.results.fileName="test.png";
    component.documentId = 49233;
    spyOn(component.dmsService, 'v1DmsFileIdGet').and.returnValue(of(JSON.stringify(fileMockData) as any));
    spyOn(component, 'setDocAttr').withArgs(fileMockData.results).and.callThrough();
    component.getFilesList();
    tick();
    let disabledAttributesLength = [
      { id: 'isDraftingTemplate', name: 'Drafting Template', checked: true },
      { id: 'isFillableTemplate', name: 'Fillable Template', disabled: true, checked: false },
      { id: 'containsESignatureFields', name: 'Contains E-Signature Fields', disabled: true, checked: false }
    ]
    expect(component.docAttributes).toEqual(disabledAttributesLength);
  }))

  it('should disable Contains E-signature fields', fakeAsync(() => {
    let modifiedData = fileMockData;
    modifiedData.results.documentSigningStatus = 1;
    component.documentId = 49233;
    spyOn(component.dmsService, 'v1DmsFileIdGet').and.returnValue(of(JSON.stringify(fileMockData) as any));
    spyOn(component, 'setDocAttr').withArgs(fileMockData.results).and.callThrough();
    component.getFilesList();
    tick();
    let containsESignatureIDX = component.docAttributes.findIndex(x => x.id == 'containsESignatureFields')
    expect((component.docAttributes[containsESignatureIDX] as any).disabled).toBeTruthy();
  }))

  it('should call manageRouting if error occurred', fakeAsync(() => {
    component.documentId = 49233;
    spyOn(component.dmsService, 'v1DmsFileIdGet').and.returnValue(Observable.throwError('Error'));
    spyOn(component, 'manageRouting').and.callThrough();
    component.getFilesList();
    tick();
    expect(component.manageRouting).toHaveBeenCalled();
  }));

  it('should not select all attributes', () => {
    let fileAttributesMockData = {
      isDraftingTemplate : false,
      isFillableTemplate : false,
      containsESignatureFields: false,
      fileName: "test.pdf",
    };
    
    let dummyDocAttriibutes = [
      { id: 'isDraftingTemplate', name: 'Drafting Template', checked: false },
      { id: 'isFillableTemplate', name: 'Fillable Template', checked: false },
      { id: 'containsESignatureFields', name: 'Contains E-Signature Fields', checked: false }
    ]
    component.esignEnabled = true;
    component.setDocAttr(fileAttributesMockData);
    expect(component.docAttributes).toEqual(dummyDocAttriibutes);
    expect(component.selectedAttributes.length).toEqual(0);
  })

  it('should not select drafting template', () => {
    let fileAttributesMockData = {
      isDraftingTemplate : false,
      isFillableTemplate : true,
      containsESignatureFields: true,
      fileName: "test.pdf",
    };

    let dummyDocAttriibutes = [
      { id: 'isDraftingTemplate', name: 'Drafting Template', checked: false },
      { id: 'isFillableTemplate', name: 'Fillable Template', checked: true },
      { id: 'containsESignatureFields', name: 'Contains E-Signature Fields', checked: true }
    ]
  component.esignEnabled = true;
    component.setDocAttr(fileAttributesMockData);
    expect(component.docAttributes).toEqual(dummyDocAttriibutes);
    expect(component.selectedAttributes.length).toEqual(2);
  })

  it('should not select fillable template', () => {
    let fileAttributesMockData = {
      isDraftingTemplate : true,
      isFillableTemplate : false,
      containsESignatureFields: true,
      fileName: "test.pdf",
    };

    let dummyDocAttriibutes = [
      { id: 'isDraftingTemplate', name: 'Drafting Template', checked: true },
      { id: 'isFillableTemplate', name: 'Fillable Template', checked: false },
      { id: 'containsESignatureFields', name: 'Contains E-Signature Fields', checked: true }
    ]
    component.esignEnabled = true;
    component.setDocAttr(fileAttributesMockData);
    expect(component.docAttributes).toEqual(dummyDocAttriibutes);
    expect(component.selectedAttributes.length).toEqual(2);
  })

  it('should not select contains E-Signature', () => {
    let fileAttributesMockData = {
      isDraftingTemplate : true,
      isFillableTemplate : true,
      containsESignatureFields: false,
      fileName: "test.pdf",
    };

    let dummyDocAttriibutes = [
      { id: 'isDraftingTemplate', name: 'Drafting Template', checked: true },
      { id: 'isFillableTemplate', name: 'Fillable Template', checked: true },
      { id: 'containsESignatureFields', name: 'Contains E-Signature Fields', checked: false }
    ]
    component.esignEnabled = true;
    component.setDocAttr(fileAttributesMockData);
    expect(component.docAttributes).toEqual(dummyDocAttriibutes);
    expect(component.selectedAttributes.length).toEqual(2);
  });

  it('should not select fillable and contains E-signature attributes is file not a pdf or doc', () => {
    let fileAttributesMockData = {
      isDraftingTemplate : true,
      isFillableTemplate : true,
      containsESignatureFields: true,
      fileName: "test.png",
    };
    component.esignEnabled = true;
    let dummyDocAttriibutes = [
      { id: 'isDraftingTemplate', name: 'Drafting Template', checked: true },
      { id: 'isFillableTemplate', name: 'Fillable Template', checked: false },
      { id: 'containsESignatureFields', name: 'Contains E-Signature Fields', checked: false }
    ]
    component.setDocAttr(fileAttributesMockData);
    expect(component.docAttributes).toEqual(dummyDocAttriibutes);
    expect(component.selectedAttributes.length).toEqual(1);
  })

  it('should not select contains E-signature attributes if E-Sign not enabled for tenant', () => {
    let fileAttributesMockData = {
      isDraftingTemplate : true,
      isFillableTemplate : true,
      containsESignatureFields: true,
      fileName: "test.pdf",
    };
    component.esignEnabled = false;
    let dummyDocAttriibutes = [
      { id: 'isDraftingTemplate', name: 'Drafting Template', checked: true },
      { id: 'isFillableTemplate', name: 'Fillable Template', checked: true },
      { id: 'containsESignatureFields', name: 'Contains E-Signature Fields', checked: false }
    ]
    component.setDocAttr(fileAttributesMockData);
    expect(component.docAttributes).toEqual(dummyDocAttriibutes);
    expect(component.selectedAttributes.length).toEqual(2);
  })
})