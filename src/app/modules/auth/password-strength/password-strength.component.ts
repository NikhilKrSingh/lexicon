import { Component, EventEmitter, Input, OnChanges, Output, ViewEncapsulation } from '@angular/core';

interface IPassValidArr {
  chrLength: boolean;
  oneCapital: boolean;
  oneNumber: boolean;
  oneSpecial: boolean;
}

@Component({
  selector: 'app-password-strength',
  templateUrl: './password-strength.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class PasswordStrengthComponent implements OnChanges {

  @Input() password: any = '';
  @Output() readonly setPasswordFlag = new EventEmitter();
  passValidArr: IPassValidArr = {
    chrLength: false,
    oneCapital: false,
    oneNumber: false,
    oneSpecial: false
  };
  passwordFlag = false;
  constructor() { }

  ngOnChanges() {
    this.passChange();
  }

  passChange() {
    this.passValidArr.chrLength = (this.password && this.password.length > 7) ? true : false;
    this.passValidArr.oneCapital = (this.password && /[A-Z]/.test(this.password)) ? true : false;
    this.passValidArr.oneNumber = (this.password && /\d/.test(this.password)) ? true : false;
    this.passValidArr.oneSpecial = (this.password && /[!@#$%^&*]/.test(this.password)) ? true : false;
    this.passwordFlag = (this.passValidArr.chrLength && this.passValidArr.oneCapital && this.passValidArr.oneNumber && this.passValidArr.oneSpecial) ? true : false;
    this.setPasswordFlag.emit(this.passwordFlag);
  }

}
