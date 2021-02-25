import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterTestingModule } from '@angular/router/testing';
import { NgSelectModule } from '@ng-select/ng-select';
import { StoreModule } from '@ngrx/store';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { Ng5SliderModule } from 'ng5-slider';
import { NgxMaskModule } from 'ngx-mask';
import { NgSlimScrollModule } from 'ngx-slimscroll';
import { ToastrModule } from 'ngx-toastr';
import { DatePickerComponent } from 'src/app/modules/shared/date-picker/date-picker.component';
import { CommonInvoicePdfComponent } from 'src/app/modules/shared/invoice-pdf/invoice-pdf.component';
import { LoaderComponent } from 'src/app/modules/shared/loader/loader.component';
import { MultiSelectDropdownComponent } from 'src/app/modules/shared/multiselect-dropdown/multiselect-dropdown.component';
import { OrderByPipe } from 'src/app/modules/shared/pipes/orderBy.pipe';
import { SafeHTMLPipe } from 'src/app/modules/shared/pipes/safe-html.pipe';
import { MatterInvoicesComponent } from './invoices.component';

describe('MatterInvoicesComponent', () => {
  let component: MatterInvoicesComponent;
  let fixture: ComponentFixture<MatterInvoicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MatterInvoicesComponent, DatePickerComponent, MultiSelectDropdownComponent, LoaderComponent, CommonInvoicePdfComponent, OrderByPipe, SafeHTMLPipe ],
      imports: [ OwlNativeDateTimeModule, MatProgressSpinnerModule, NgSlimScrollModule, NgSelectModule, 
        NgxMaskModule.forRoot(), OwlDateTimeModule, ReactiveFormsModule, FormsModule, NgxDatatableModule, Ng5SliderModule, HttpClientTestingModule, RouterTestingModule, ToastrModule.forRoot(), StoreModule.forRoot({}) ]
    })
    .compileComponents().then(() => {
      fixture = TestBed.createComponent(MatterInvoicesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
