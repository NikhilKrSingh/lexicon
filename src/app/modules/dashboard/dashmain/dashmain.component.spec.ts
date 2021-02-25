import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { DashmainComponent } from './dashmain.component';


describe('DashmainComponent', () => {
  let component: DashmainComponent;
  let fixture: ComponentFixture<DashmainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashmainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashmainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
