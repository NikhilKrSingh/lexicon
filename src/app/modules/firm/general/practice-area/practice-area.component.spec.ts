import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrModule } from 'ngx-toastr';
import { SharedModule } from 'src/app/modules/shared/shared.module';

import { PracticeAreaComponent } from './practice-area.component';

describe('PracticeAreaComponent', () => {
  let component: PracticeAreaComponent;
  let fixture: ComponentFixture<PracticeAreaComponent>;
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
      declarations: [ PracticeAreaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PracticeAreaComponent);
    activeModal = TestBed.get(NgbActiveModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('save click practice area required error', () => {
    spyOn(component, 'validatePracticeArea').and.callThrough();
    
    let saveButton = fixture.debugElement.nativeElement.querySelector('#save-btn');
    saveButton.click();

    expect(component.validatePracticeArea).toHaveBeenCalled();
    expect(component.practieAreaNameErrMsg).toContain('Please enter a practice area name.');
  });

  it('save click should close model and set practice object', () => {
    spyOn(activeModal, 'close').and.callThrough();
    component.practieArea.name = 'unit test practice';
    let saveButton = fixture.debugElement.nativeElement.querySelector('#save-btn');
    saveButton.click();

    expect(activeModal.close).toHaveBeenCalledWith({ name: 'unit test practice', createdBy: '', createdDate: '', id: null });
  });

  it('cancel button should dismiss model', () => {
    spyOn(component, 'dismiss').and.callThrough();
    let cancelButton = fixture.debugElement.nativeElement.querySelector('#cancel-btn');
    cancelButton.click();
    expect(component.dismiss).toHaveBeenCalled();
  });

  it('practice area id null or 0 should add practice area title', () => {
    component.practieArea.id = null;
    fixture.detectChanges();

    let title = fixture.debugElement.query(By.css('.modal-title'));
    expect(title.nativeElement.innerText).toContain('Add Practice Area');
  });

  it('practice area id should edit practice area title', () => {
    component.practieArea.id = 101;
    fixture.detectChanges();

    let title = fixture.debugElement.query(By.css('.modal-title'));
    expect(title.nativeElement.innerText).toContain('Edit Practice Area');
  });

});
