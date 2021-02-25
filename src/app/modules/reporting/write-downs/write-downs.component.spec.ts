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
import { WriteDownsComponent } from './write-downs.component';

describe('WriteDownsComponent', () => {
  let component: WriteDownsComponent;
  let fixture: ComponentFixture<WriteDownsComponent>;
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
      declarations: [ WriteDownsComponent, DateRangeReportComponent ]
    })
    .compileComponents();
  }));
  beforeEach(() => {
    fixture = TestBed.createComponent(WriteDownsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    de=fixture.debugElement;
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should have title "Write-Downs Journal Report"', () => {
    const h1=de.query(By.css('h1'));
    expect(h1.nativeElement.innerText).toEqual('Write-Downs Journal Report');
  });
  it('should have "Date of Service Range" selected', () => {
    expect(component.selectedType).toBe(1);
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
    const btn=de.query(By.css('button#export-to-csv'));
    expect(btn.nativeElement.disabled).not.toBe(component.exportCsvFlag);
  });

  it('should call export csv function', () => {
    component.exportCsvFlag = true;
    fixture.detectChanges();
    spyOn(component,'submitWriteDownReport');
    const btn = fixture.debugElement.nativeElement.querySelector('button#export-to-csv');
    expect(btn.disabled).not.toBe(component.exportCsvFlag);
    btn.click();
    expect(component.submitWriteDownReport).toHaveBeenCalled();
  });
});
