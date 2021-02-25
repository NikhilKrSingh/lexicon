import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { ToastrModule } from 'ngx-toastr';
import { reducers } from 'src/app/store';
import { SharedModule } from '../../shared/shared.module';
import { DateRangeReportComponent } from '../date-range-report/date-range-report.component';
import { WipDetailComponent } from './wip-detail.component';

describe('WipDetailComponent', () => {
  let component: WipDetailComponent;
  let fixture: ComponentFixture<WipDetailComponent>;
  let de:DebugElement;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ SharedModule,
        RouterTestingModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
       StoreModule.forRoot(reducers),
      ],
      declarations: [ WipDetailComponent,DateRangeReportComponent ]
    })
    .compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(WipDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    de=fixture.debugElement;
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should have service date selected', () => {
    expect(component.selectedType).toBe('SERVICE_DATE');
  });
  it('should have title "WIP Detail Report"', () => {
    const h1=de.query(By.css('h1'));
    expect(h1.nativeElement.innerText).toEqual('WIP Detail Report');
  });

  it('should have end date as current date', () => {
    const currentDate = new Date();
    let current=currentDate.toISOString().substring(0, 10);
    const ed=component.endDates.toISOString().substring(0, 10);
    expect(ed).toEqual(current);
  });
  it('should change start date', () => {
    const currentDate = new Date();
    component.startDate(currentDate);
    fixture.detectChanges();
    expect(component.startDates).toBe(currentDate);
  });
  it('should disable button if exportCsvFlag is false', () => {
    expect(component.exportCsvFlag).toBe(false);
    const btn = fixture.debugElement.nativeElement.querySelector('button#export-to-csv');
    expect(btn.disabled).not.toBe(component.exportCsvFlag);
  });
  it('should call export csv function', () => {
    component.exportCsvFlag = true;
    fixture.detectChanges();
    spyOn(component,'submitWIPDetailReport');
    const btn = fixture.debugElement.nativeElement.querySelector('button#export-to-csv');
    expect(btn.disabled).not.toBe(component.exportCsvFlag);
    btn.click();
    expect(component.submitWIPDetailReport).toHaveBeenCalled();
  });
});
