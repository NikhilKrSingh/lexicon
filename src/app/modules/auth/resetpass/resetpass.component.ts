import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/common/swagger-providers/services';
import * as errorData from '../../shared/error.json';

interface IPassValidArr {
  chrLength: boolean;
  oneCapital: boolean;
  oneNumber: boolean;
  oneSpecial: boolean;
}

@Component({
  selector: 'app-resetpass',
  templateUrl: './resetpass.component.html',
  styleUrls: ['./resetpass.component.scss']
})
export class ResetpassComponent implements OnInit {

  constructor(
    private activateRoute: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
  ) { }
  public viewPassword = false;
  public password = '';
  private passwordResetId: string;
  private userID: string;
  private callFlag = true;
  public passwordFlag = false;
  public passValidArr: IPassValidArr = {
    chrLength: false,
    oneCapital: false,
    oneNumber: false,
    oneSpecial: false
  };
  public errorData: any = (errorData as any).default;

  ngOnInit() {
    this.passwordResetId = this.activateRoute.snapshot.queryParams.rid;
    this.userID = this.activateRoute.snapshot.queryParams.uid;
    if (!this.passwordResetId && !this.userID) {
      this.router.navigate(['/login']);
    }
  }

  public passChange() {
    this.passValidArr.chrLength = (this.password && this.password.length > 7) ? true : false;
    this.passValidArr.oneCapital = (this.password && /[A-Z]/.test(this.password)) ? true : false;
    this.passValidArr.oneNumber = (this.password && /\d/.test(this.password)) ? true : false;
    this.passValidArr.oneSpecial = (this.password && /[!@#$%^&*]/.test(this.password)) ? true : false;
    this.passwordFlag = (this.passValidArr.chrLength && this.passValidArr.oneCapital && this.passValidArr.oneNumber && this.passValidArr.oneSpecial) ? true : false;
  }


  public setPassword() {
    if (this.callFlag) {
      const data = {
        newPassword: this.password,
        passwordResetId: this.passwordResetId,
        userID: this.userID
      };
      this.callFlag = false;
      this.authService.v1AuthResetUserPasswordPost$Json$Response({ body: data }).subscribe(suc => {
        this.callFlag = true;
        this.router.navigate(['/login']);
      }, err => {
        this.callFlag = true;
      });
    }
  }
}
