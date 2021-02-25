import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { REGEX_DATA } from 'src/app/modules/shared/const';
import { vwEmployee, vwPersonPhone } from 'src/common/swagger-providers/models';
import { MiscService } from '../../../../../../common/swagger-providers/services/misc.service';
import * as errors from '../../../../shared/error.json';

@Component({
  selector: 'app-edit-contact',
  templateUrl: './edit-contact.component.html'
})
export class EditContactComponent implements OnInit {
  public employee: vwEmployee;
  public employeeForm: FormGroup;
  public closeResult: string;
  public primaryPhoneNumberBlur = false;
  public cellPhoneNumberBlur = false;
  public faxBlur = false;
  public formSubmitted = false;
  public emailExists = false;
  public loading = false;
  errorData = (errors as any).default;

  constructor(
    private activeModal: NgbActiveModal,
    private builder: FormBuilder,
    private miscService: MiscService
  ) {
    this.initializeEmployeeForm();
  }

  ngOnInit() {
    this.editContactInfo();
  }

  /**** initialize employee form */
  initializeEmployeeForm() {
    this.employeeForm = this.builder.group({
      primaryPhoneNumber: new FormControl('', [
        Validators.required,
        Validators.maxLength(10)
      ]),
      cellPhoneNumber: new FormControl('', Validators.maxLength(10)),
      email: new FormControl('', [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(REGEX_DATA.Email)
      ]),
      fax: new FormControl('', Validators.maxLength(10))
    });
  }

  /**
   * Set employee details
   *
   */
  public editContactInfo() {
    const primary = this.getPrimaryPhoneNumber(this.employee.phones);
    const cell = this.getPhoneNumber(this.employee.phones, 'cellphone');
    const fax = this.getPhoneNumber(this.employee.phones, 'fax');

    this.employeeForm.setValue({
      email: this.employee.email,
      primaryPhoneNumber: primary,
      cellPhoneNumber: cell ? cell : '',
      fax: fax ? fax : ''
    });
  }

  /**
   * Gets Primary Phone Number
   * @param phoneNumbers Phone Numbers Associated with Employee
   */
  public getPrimaryPhoneNumber(phoneNumbers: vwPersonPhone[]) {
    if (phoneNumbers) {
      const phone = phoneNumbers.find(a => a.isPrimary);
      if (phone) {
        return phone.number;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  /**
   * Gets Phone Number based on type
   * @param phoneNumbers Phone Numbers Associated with Employee
   * @param type Phone Number Type - `cellphone`, `fax`
   */
  public getPhoneNumber(phoneNumbers: vwPersonPhone[], type: string) {
    if (phoneNumbers) {
      const phone = phoneNumbers.find(a => a.type == type);
      if (phone) {
        return phone.number;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  get f() {
    return this.employeeForm.controls;
  }

  /**
   * Close model pop up
   */
  dismiss(reason: string) {
    this.emailExists = false;
    this.employeeForm.reset();
    this.activeModal.dismiss(reason);
  }

  /**
   * Save employee details
   *
   */
  save() {
    this.formSubmitted = true;
    if (this.employeeForm.valid) {
      this.loading = true;
      const data = this.employeeForm.value;
      const email = this.employeeForm.value.email;
      if (email && email.trim() != '') {
        this.miscService.v1MiscEmailCheckGet({email, id: this.employee.id}).subscribe((result: any) => {
          this.emailExists = JSON.parse(result).results;
          this.loading = false;
          if (!this.emailExists) {
            this.employee.email = data.email;
            this.employee.userName = data.email;
            if (data.primaryPhoneNumber) {
              const primaryPhone = this.employee.phones.findIndex(obj => obj.isPrimary);
              if (primaryPhone > -1) {
                this.employee.phones[primaryPhone].number = data.primaryPhoneNumber;
              } else {
                this.employee.phones.push({
                  id: 0,
                  isPrimary: true,
                  number: data.primaryPhoneNumber,
                  type: 'primary'
                });
              }
            }
            const cell = this.employee.phones.findIndex(obj => obj.type === 'cellphone');
            if (data.cellPhoneNumber) {
              if (cell > -1) {
                this.employee.phones[cell].number = data.cellPhoneNumber;
              } else {
                this.employee.phones.push({
                  id: 0,
                  isPrimary: true,
                  number: data.cellPhoneNumber,
                  type: 'cellphone'
                });
              }
            } else {
              if (cell > -1) {
                this.employee.phones[cell].number = null;
              }
            }
            const faxPhone = this.employee.phones.findIndex(obj => obj.type === 'fax');
            if (data.fax) {
              if (faxPhone > -1) {
                this.employee.phones[faxPhone].number = data.fax;
              } else {
                this.employee.phones.push({
                  id: 0,
                  isPrimary: true,
                  number: data.fax,
                  type: 'fax'
                });
              }
            } else {
              if (faxPhone > -1) {
                this.employee.phones[faxPhone].number = null;
              }
            }
            this.activeModal.close(this.employee);
          } else {
            this.loading = false;
            return;
          }
        });
      }
    } else {
      return;
    }
  }

  onBlurMethod(val: any, type: string) {
    type === 'primaryPhoneNumber' ? this.primaryPhoneNumberBlur = this.isBlur(val) :
      type === 'cellPhoneNumber' ? this.cellPhoneNumberBlur = this.isBlur(val) :
        type === 'fax' ? this.faxBlur = this.isBlur(val) : '';
  }

  private isBlur(val: string | any[]) {
    return (val.length === 10) ? false : (val.length !== 0);
  }

  checkEmailExistence() {
    this.emailExists = false;
    const email = this.employeeForm.value.email;
    if (email && email.trim() != '') {
      if (this.employeeForm.controls.email.valid) {
        this.miscService.v1MiscEmailCheckGet({email, id: this.employee.id}).subscribe((result: any) => {
          this.emailExists = JSON.parse(result).results;
        });
      }
    }
  }
}
