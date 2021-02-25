import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { AuthService } from 'src/common/swagger-providers/services';
@Component({
  selector: 'app-resetpass',
  templateUrl: './resetpass.component.html',
  styleUrls: ['./resetpass.component.scss']
})
export class ResetpassComponent implements OnInit {

  viewPassword = false;
  password = '';
  passwordResetId: string;
  userID: string;
  callFlag = true;
  passwordFlag = false;

  constructor(
    private activateRoute: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private toaster: ToastDisplay
  ) { }

  ngOnInit() {
    this.passwordResetId = this.activateRoute.snapshot.queryParams.rid || null;
    this.userID = this.activateRoute.snapshot.queryParams.uid || null;
    if (!this.passwordResetId || !this.userID) {
      this.router.navigate(['/dmsportal/login']);
    }
  }

  setPasswordFlag(value) {
    this.passwordFlag = value;
  }

  public setPassword() {
    if (this.callFlag) {
      const data = {
        newPassword: this.password,
        passwordResetId: this.passwordResetId,
        userID: this.userID
      };
      this.callFlag = false;
      this.authService.v1AuthResetUserPasswordPost$Json$Response({ isPortal:true, body: data }).subscribe(() => {
        this.toaster.showSuccess('Password changed. Please login to continue.');
        this.router.navigate(['/dmsportal/login']);
      }, () => {
        this.callFlag = true;
        this.router.navigate(['/dmsportal/login']);
      });
    }
  }
}
