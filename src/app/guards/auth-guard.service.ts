import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { UserService } from '../../common/swagger-providers/services/user.service';
import { IndexDbService } from '../index-db.service';
import { UtilsHelper } from '../modules/shared/utils.helper';
import * as fromRoot from '../store';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  permissionSubscribe: Subscription;
  constructor(
      private router: Router,
      private store: Store<fromRoot.AppState>,
      public indexDbService: IndexDbService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const token = UtilsHelper.getToken();
    const isDMSUser = localStorage.getItem('isDMSUser');
    const redirect: boolean = route.data.redirect;

    // For DMS portal routes
    if (redirect && token && isDMSUser && isDMSUser === 'TrUe') {
      return true;
    }

    // For lexicon routes
    if (token && !isDMSUser && !redirect) {
      return true;
    }

    // When a dms portal logged user tried to open lexicon routes
    if (token && isDMSUser && isDMSUser === 'TrUe' && !redirect) {
      this.router.navigate(['/dmsportal/dashboard']);
      return false;
    }

    // When a logged lexicon user tried to open dms portal routes
    if (token && !isDMSUser && redirect) {
      this.router.navigate(['/dashboard']);
      return false;
    }

    // Clearing storage and redirecting to respective login
    localStorage.clear();
    sessionStorage.clear();
    this.indexDbService.clearDatabase();

    if (isDMSUser && isDMSUser === 'TrUe') {
      this.router.navigate(['/dmsportal/login']);
    } else {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    }
    return false;
  }

  async getPermissions() {
    return new Promise(resolve => {
      if (this.permissionSubscribe) {
        this.permissionSubscribe.unsubscribe();
      }

      this.permissionSubscribe = this.store.select('permissions').subscribe((obj) => {
        if (obj.loaded) {
          if (obj && obj.datas) {
            resolve(obj.datas);
          }
        }
      });
    });
  }
}

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {
  constructor(
    private router: Router,
    private userService: UserService
  ) { }

  async canActivate(route: ActivatedRouteSnapshot) {
    const token = UtilsHelper.getToken();
    const isDMSUser = localStorage.getItem('isDMSUser');
    const redirect: boolean = route.data.redirect;

    // When dms portal routes
    if (redirect && token && isDMSUser && isDMSUser === 'TrUe') {
      if (route.paramMap.get('id') && route.paramMap.get('tenantId')) {
        localStorage.setItem('fileId', route.paramMap.get('id'));
        localStorage.setItem('fileTenantId', route.paramMap.get('tenantId'));
      }
      this.router.navigate(['/dmsportal/dashboard']);
      return false;
    }

    // When lexicon logged user open lexicon auth routes
    if (token && !isDMSUser && !redirect) {
      this.router.navigate(['/dashboard']);
      return false;
    }

    // When a dms portal logged user tried to open lexicon auth routes
    if (token && isDMSUser && isDMSUser === 'TrUe' && !redirect) {
      this.router.navigate(['/dmsportal/dashboard']);
      return false;
    }

    // When a logged lexicon user tried to open dms portal auth routes
    if (token && !isDMSUser && redirect) {
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}
