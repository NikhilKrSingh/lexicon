import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { debounceTime } from 'rxjs/operators';
import { EmployeeService } from 'src/common/swagger-providers/services';
import { vwDesignatedContact } from '../../models/vw-office-details';
import { REGEX_DATA } from "../../shared/const";

@Component({
  selector: 'app-office-designated-contact',
  templateUrl: './designated-contact.component.html',
  styleUrls: ['./designated-contact.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class DesignatedContactComponent implements OnInit {
  @Input() designatedContact: vwDesignatedContact;

  @Output() readonly designatedContactChange = new EventEmitter<vwDesignatedContact>();

  @Input() isDesignatedContactother = false;

  @Input() isFormSubmitted = false;

  @Input() isEdit = false;

  employeeList = [];
  searchEmployeeFilter = new FormControl('');
  searchEmployeeFilterSub: any;

  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;

  designatedContactForm: FormGroup;

  phoneBlur = false;

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService
  ) {
    this.designatedContactForm = this.fb.group({
      isDesignatedContactother: false,
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern(REGEX_DATA.Email)]],
      phone: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
        ],
      ],
    });
  }

  get phone() {
    return this.designatedContactForm.get('phone');
  }

  ngOnInit() {
    this.addConfigs();

    this.searchEmployeeFilter.valueChanges
      .pipe(debounceTime(200))
      .subscribe((text) => {
        if (text && text.trim() != '') {
          if (this.searchEmployeeFilterSub) {
            this.searchEmployeeFilterSub.unsubscribe();
          }

          this.searchEmployeeFilterSub = this.employeeService
            .v1EmployeeSearchGet({search: text})
            .subscribe(
              (suc) => {
                const res: any = suc;
                this.employeeList = JSON.parse(res).results;
                this.employeeList = this.employeeList.filter(item =>{
                    return item.isActivated && item.isVisible;
                })
              },
              (err) => {
                console.log(err);
              }
            );
        } else {
          this.employeeList = [];
        }
      });

    this.designatedContactForm.patchValue({
      isDesignatedContactother: this.isDesignatedContactother,
    });

    if (this.isDesignatedContactother) {
      this.designatedContactForm.patchValue({
        firstName: this.designatedContact.firstName,
        lastName: this.designatedContact.lastName,
        email: this.designatedContact.email,
        phone: this.designatedContact.phone ? this.designatedContact.phone.number : '',
      });
    }
  }

  changeType() {
    this.updateDesignatedContact(null);
    const isDesignatedContactother = this.designatedContactForm.value.isDesignatedContactother;
    this.designatedContactForm.reset();
    this.designatedContactForm.patchValue({
      isDesignatedContactother,
    });
  }

  public addConfigs() {
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.opts = {
      position: 'right',
      barBackground: '#413a93',
      barOpacity: '1',
      barWidth: '4',
      barBorderRadius: '4',
      barMargin: '2px',
      gridOpacity: '1',
      gridBackground: '#e7edf3',
      gridWidth: '8',
      gridMargin: '0',
      gridBorderRadius: '4',
      alwaysVisible: false,
    };
  }

  onBlurMethod(val: any) {
    this.phoneBlur = this.isBlur(val);
  }

  private isBlur(val: string) {
    return val && val.length === 10 ? false : val && val.length === 0 ? false : true;
  }

  selectEmployee(employee: any) {
    this.employeeList = [];

    this.designatedContact = {
      id: employee.id,
      lastName: employee.lastName,
      email: employee.email,
      firstName: employee.firstName,
      phone: employee.phones
        ? employee.phones.find((a) => a.isPrimary)
        : {
          number: '',
        },
    };

    this.designatedContactChange.emit(this.designatedContact);
    this.searchEmployeeFilter.setValue('');
  }

  updateDesignatedContact(employee: any) {
    this.designatedContact = employee;
    this.designatedContactChange.emit(this.designatedContact);
  }

  updateContactFromForm() {
    if (this.designatedContactForm.valid) {
      const employee = this.designatedContactForm.value;

      this.designatedContact = {
        id: 0,
        lastName: employee.lastName,
        email: employee.email,
        firstName: employee.firstName,
        phone: {
          number: employee.phone,
        },
      };

      this.designatedContactChange.emit(this.designatedContact);
    } else {
      this.designatedContactChange.emit(null);
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
