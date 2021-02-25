import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UtilsHelper } from '../modules/shared/utils.helper';

@Injectable({ providedIn: 'root' })
export class ToastDisplay {
  constructor(
      private router: Router,
      private toastr: ToastrService
  ) { 
    toastr.toastrConfig.preventDuplicates = true;
  }

  showSuccess(msg) {
    this.toastr.success(msg, 'Success');
  }

  showError(msg) {
    this.toastr.error(msg, 'Error');
  }

  showWarning(msg) {
    this.toastr.warning(msg, 'Warning');
  }

  showPermissionError() {
    UtilsHelper.setObject('access-denied', 'TRue');
    this.router.navigate(['/access-denied']);
  }
}
