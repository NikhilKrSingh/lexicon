import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { async, ComponentFixture, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { StoreModule } from '@ngrx/store';
import { ToastrModule } from 'ngx-toastr';
import { of } from 'rxjs';
import { AppConfigService, IAppSettings } from 'src/app/app-config.service';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { RecordDisbursementComponent } from 'src/app/modules/shared/record-disbursement/record-disbursement.component';
import { SharedModule } from 'src/app/modules/shared/shared.module';
import { reducers } from 'src/app/store';
import { BillingService } from 'src/common/swagger-providers/services';
import * as config from '../../../../../../assets/web.config.json';
import { ViewPreBillingDisbursementsComponent } from './disbursements.component';

@Injectable()
export class CustomAppConfigService {
  appConfig: IAppSettings = config;

  APP_URL = `${window.location.protocol}//${window.location.host}`;
  valid_payment_methods = ['CASH', 'CHECK', 'E-CHECK', 'CREDIT_CARD'];
}

export class MockNgbModalRef {
  result: Promise<any> = new Promise((resolve, reject) => resolve(true));
}
describe('ViewPreBillingDisbursementsComponent', () => {
  let component: ViewPreBillingDisbursementsComponent;
  let fixture: ComponentFixture<ViewPreBillingDisbursementsComponent>;
  let billingService: BillingService;
  let modalService: NgbModal;
  let applicationRef: NgbModalRef;
  let ngbActiveModal: NgbActiveModal;
  let dialogService: DialogService;
  let originalTimeout = 0;
  let mockModalRef: MockNgbModalRef = new MockNgbModalRef();
  beforeEach(async(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
    TestBed.configureTestingModule({
      declarations: [ViewPreBillingDisbursementsComponent],
      imports: [HttpClientTestingModule, RouterTestingModule, SharedModule, StoreModule.forRoot(reducers), ToastrModule.forRoot({})],
      providers: [RecordDisbursementComponent, BillingService, CustomAppConfigService, NgbActiveModal,
        {
          provide: AppConfigService,
          useClass: CustomAppConfigService,
        }
      ]
    })
    .overrideModule(BrowserDynamicTestingModule, {
        set: {
          entryComponents: [RecordDisbursementComponent]
        }
      })
      .compileComponents().then(() => {
        fixture = TestBed.createComponent(ViewPreBillingDisbursementsComponent);
        component = fixture.debugElement.componentInstance;
        component.matterDetails.matterPrimaryOffice = { id: 15 };
        fixture.detectChanges();
      });
    billingService = TestBed.get(BillingService);
    modalService = TestBed.get(NgbModal);
    ngbActiveModal = modalService.open(RecordDisbursementComponent);
    dialogService = TestBed.get(DialogService);
    applicationRef = TestBed.get(RecordDisbursementComponent);
  }));
  
  afterEach(() => {
    ngbActiveModal.close(null);
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open Add Disbursement Popup', () => {
    spyOn(component, 'recordDisbursement');
    let modalServiceSpy = spyOn(modalService, 'open').and.returnValue(applicationRef);
    component.firmDetails.id = 2;
    component.matterDetails = {
      id: 1542,
      matterPrimaryOffice: { id: 15 },
      matterStatus: { name: 'Open' },
      clientName: {
        id: 8873,
        name: '',
        matterType: null,
        associationType: null,
        clientId: null,
        companyName: null,
        isClientAssociation: null,
        officeName: null,
        doNotContact: null,
        isCorporate: null,
        isPotentialClient: null,
        attorney: null,
        isVisible: null,
        isArchived: null,
        doNotContactReason: null,
        primaryContact: {
          id: 0, name: '',
          email: '',
          phones: [{
            id: 0,
            type: '',
            number: 'string'
          }]
        },
        preferredContact: '',
        archiveReason: null,
        corporateContactTypes: null,
        sort: 0,
        client: null,
        firstName: 'client-scheduler',
        lastName: '16.10.1',
        email: 'client-scheduler-16.10.1@yopmail.com',
        jobTitle: null,
        isPrimary: false,
        isCompany: false,
        company: null,
        status: null,
        type: null,
        matterName: null,
        clientName: null,
        conflictObject: null,
        preferredContactMethod: null,
        office: null,
        phones: '',
      }
    };
    component.permissionList.BILLING_MANAGEMENTisEdit = true;
    component.permissionList.BILLING_MANAGEMENTisAdmin = true;
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      const downloadButton = fixture.debugElement.nativeElement.querySelector('button#review-add-disbursement-entry');
      downloadButton.click();
      tick();
      
      expect(modalService.open).toHaveBeenCalled();
      expect(modalServiceSpy.length).toBeGreaterThanOrEqual(1);
      expect(component.recordDisbursement).toBeTruthy();
    });
  });

  it('should call Delete methid on click of Delete Disbursement', () => {
    spyOn(component, 'delete').and.callThrough();
    component.disbursementList = [
      {
        id: 1489,
        date: '2020-10-22T00:00:00',
        person: {
          id: 8691,
          name: ''
        },
        status: {
          name: 'Recorded',
        },
        createdBy: {
          id: 1304,
          name: 'Lexicon dev, Admin'
        },
        createdOn: '2020-10-22T08:06:30.807',
        note: {
          id: 4077,
          name: 'test',
          content: 'test',
          applicableDate: '2020-10-22T08:06:16.87',
          isVisibleToClient: true,
          rivisionNumber: 1,
          noteType: 'Disbursement',
          lastUpdated: '2020-10-22T08:06:30.777',
        },
        isNegative: false,
        hours: null,
        description: null,
        amount: 50.00,
        disbursementType: {
          id: 6853,
          code: '235',
          description: 'O',
          isBillable: true,
          rate: 25.00,
          billingType: null,
          billableTo: null,
          isNegative: false
        },
        writeDown: [

        ]
      }
    ];
    component.permissionList.BILLING_MANAGEMENTisEdit = true;
    component.isBillingAttorney = true;
    component.viewmode = true;
    fixture.detectChanges();
    const downloadButton = fixture.debugElement.nativeElement.querySelector('#disbursement-delete-0');
    downloadButton.click();
    expect(downloadButton.innerHTML).toBe(' Remove Disbursement ');
    expect(component.delete).toHaveBeenCalledTimes(1);
  });

  it('Should call edit methid on click of Edit Disbursement', (done) => {
    spyOn(component, 'edit').and.callThrough();
    component.disbursementList = [
      {
        id: 1489,
        date: '2020-10-22T00:00:00',
        person: {
          id: 8691,
          name: ''
        },
        status: {
          name: 'Recorded',
        },
        createdBy: {
          id: 1304,
          name: 'Lexicon dev, Admin'
        },
        createdOn: '2020-10-22T08:06:30.807',
        note: {
          id: 4077,
          name: 'test',
          content: 'test',
          applicableDate: '2020-10-22T08:06:16.87',
          isVisibleToClient: true,
          rivisionNumber: 1,
          noteType: 'Disbursement',
          lastUpdated: '2020-10-22T08:06:30.777',
        },
        isNegative: false,
        hours: null,
        description: null,
        amount: 50.00,
        disbursementType: {
          id: 6853,
          code: '235',
          description: 'O',
          isBillable: true,
          rate: 25.00,
          billingType: null,
          billableTo: null,
          isNegative: false
        },
        writeDown: [

        ]
      }
    ];
    component.permissionList.BILLING_MANAGEMENTisEdit = true;
    component.isBillingAttorney = true;
    component.viewmode = true;
    fixture.detectChanges();
    const downloadButton = fixture.debugElement.nativeElement.querySelector('#disbursement-edit-0');
    downloadButton.click();
    expect(component.edit).toHaveBeenCalled();
    done();
  });

  it('should call a `delete` with success', fakeAsync(() => {
    const dump = { token: '', result: 1454 };
    const data = {
      applicableDate: '2020-10-22T08:06:16.87',
      createdAt: null,
      createdBy: null,
      dateOfService: null,
      disbursementType: {
        id: 6853,
        code: '235',
        description: 'O',
        isBillable: true,
        rate: 25.00,
        billingType: null,
        billableTo: null,
        isNegative: false
      },
      finalBilledAmount: null,
      fixedAmount: null,
      hoursBilled: null,
      id: 1489,
      isVendorPaid: null,
      isVisibleToClient: null,
      note: {
        id: 4077,
        name: 'test',
        content: 'test',
        applicableDate: '2020-10-22T08:06:16.87',
        isVisibleToClient: true,
        rivisionNumber: 1,
        noteType: 'Disbursement',
        lastUpdated: '2020-10-22T08:06:30.777',
      },
      person: {
        id: 8691,
        name: ''
      },
      rateAmount: null,
      status: {
        name: 'Recorded',
      },
    };
    component.permissionList.BILLING_MANAGEMENTisEdit = true;
    fixture.detectChanges();
    const dialogServiceSpy = spyOn(dialogService, 'confirm').and.returnValue(Promise.resolve(dump));
    component.delete(data, new Event('click'));
    expect(dialogServiceSpy.calls.any()).toEqual(true);
    flush();
  }));

  it('should call a `edit` with success', fakeAsync(() => {
    const dump = JSON.stringify({
      results: {
        id: 61743,
        tenantId: 1006,
        name: 'Disbursement Receipts',
        parentFolderId: 61732,
        folderPath: 'https://quartodmsqa.blob.core.windows.net/quarto-dms-data/tenant-1006/Clients/6763/Matters/5690/Disbursement_Receipts',
        isSystemFolder: true,
        status: 'Active',
        createdBy: 1304,
        createdAt: '2020-08-11T18:47:10.663',
        updatedBy: 1304,
        lastUpdated: '2020-08-11T18:47:10.663',
        isActive: true
      }
    });
    const billingServiceSpy = spyOn(billingService, 'v1BillingRecordRecordDisbursementIdGet').and.returnValue(of(dump as any));
    const data: any = {
      applicableDate: '2020-10-22T08:06:16.87',
      createdAt: null,
      createdBy: null,
      dateOfService: null,
      disbursementType: {
        id: 6853,
        code: '235',
        description: 'O',
        isBillable: true,
        rate: 25.00,
        billingType: null,
        billableTo: null,
        isNegative: false
      },
      finalBilledAmount: null,
      fixedAmount: null,
      hoursBilled: null,
      id: 1489,
      isVendorPaid: null,
      isVisibleToClient: null,
      note: {
        id: 4077,
        name: 'test',
        content: 'test',
        applicableDate: '2020-10-22T08:06:16.87',
        isVisibleToClient: true,
        rivisionNumber: 1,
        noteType: 'Disbursement',
        lastUpdated: '2020-10-22T08:06:30.777',
      },
      person: {
        id: 8691,
        name: ''
      },
      rateAmount: null,
      status: {
        name: 'Recorded',
      },
    };
    component.matterDetails.id = 1542;
    component.matterDetails.matterPrimaryOffice = { id: 15 };
    component.matterDetails.matterStatus = { name: 'Open' };
    component.matterDetails.clientName = {
      id: 8873,
      name: '',
      matterType: null,
      associationType: null,
      clientId: null,
      companyName: null,
      isClientAssociation: null,
      officeName: null,
      doNotContact: null,
      isCorporate: null,
      isPotentialClient: null,
      attorney: null,
      isVisible: null,
      isArchived: null,
      doNotContactReason: null,
      primaryContact: {
        id: 0, name: '',
        email: '',
        phones: [{
          id: 0,
          type: '',
          number: 'string'
        }]
      },
      preferredContact: '',
      archiveReason: null,
      corporateContactTypes: null,
      sort: 0,
      client: null,
      firstName: 'client-scheduler',
      lastName: '16.10.1',
      email: 'client-scheduler-16.10.1@yopmail.com',
      jobTitle: null,
      isPrimary: false,
      isCompany: false,
      company: null,
      status: null,
      type: null,
      matterName: null,
      clientName: null,
      conflictObject: null,
      preferredContactMethod: null,
      office: null,
      phones: '',
    };
    component.permissionList.BILLING_MANAGEMENTisEdit = true;
    component.permissionList.BILLING_MANAGEMENTisAdmin = true;
    fixture.detectChanges();
    component.edit(data, new Event('click'));
    expect(billingServiceSpy.calls.any()).toEqual(true);
    flush();
  }));
});
