import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { SharedModule } from 'src/app/modules/shared/shared.module';

import { MatterTypeComponent } from './matter-type.component';

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

describe('MatterTypeComponent', () => {
  let component: MatterTypeComponent;
  let fixture: ComponentFixture<MatterTypeComponent>;
  let activeModal: NgbActiveModal;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
        BrowserAnimationsModule,
      ],
      declarations: [ MatterTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MatterTypeComponent);
    activeModal = TestBed.get(NgbActiveModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('save click required error', () => {
    spyOn(component, 'validateMatterType').and.callThrough();
    
    let saveButton = fixture.debugElement.nativeElement.querySelector('#save-btn');
    saveButton.click();

    expect(component.validateMatterType).toHaveBeenCalled();
    expect(component.matterTypePracticeAreasErrMsg).toContain('Please enter an associated practice area.');
    expect(component.matterTypeNameErrMsg).toContain('Please enter a matter type name.');
  });

  it('save click required error', () => {
    component.practiceAreas = JSON.parse(JSON.stringify(practiceAreasMock.results));
    component.matterType.practiceId = 72;
    component.matterType.name = 'unit testing 72';
    spyOn(component, 'validateMatterType').and.callThrough();
    spyOn(activeModal, 'close').and.callThrough();
    
    let saveButton = fixture.debugElement.nativeElement.querySelector('#save-btn');
    saveButton.click();

    expect(component.validateMatterType).toHaveBeenCalled();
    expect(activeModal.close).toHaveBeenCalledWith({ id: null, name: 'unit testing 72', practiceId: 72, practice: null, practices: [] });
  });

  it('cancel button should dismiss model', () => {
    spyOn(component, 'dismiss').and.callThrough();
    let cancelButton = fixture.debugElement.nativeElement.querySelector('#cancel-btn');
    cancelButton.click();
    expect(component.dismiss).toHaveBeenCalled();
  });

  it('matter type id null or 0 should add matter type title', () => {
    component.matterType.id = null;
    fixture.detectChanges();

    let title = fixture.debugElement.query(By.css('.modal-title'));
    expect(title.nativeElement.innerText).toContain('Add Matter Type');
  });

  it('matter type id should edit matter type title', () => {
    component.matterType.id = 72;
    fixture.detectChanges();

    let title = fixture.debugElement.query(By.css('.modal-title'));
    expect(title.nativeElement.innerText).toContain('Edit Matter Type');
  });

});
