import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { ReportService, TrustAccountService } from 'src/common/swagger-providers/services';
import { UtilsHelper } from '../modules/shared/utils.helper';
import { AuthGuard } from './auth-guard.service';
import { ToastDisplay } from './toast-service';
import { Subscription } from 'rxjs';
import { SharedService } from '../modules/shared/sharedService';
import { map } from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class BillingGuard implements CanActivate {
  constructor(
    private toaster: ToastDisplay,
    private auth: AuthGuard
  ) {
  }

  async canActivate(route: ActivatedRouteSnapshot) {
    try {
      const permissions: any = await this.auth.getPermissions();
      const type: string = route.data.type;
      if (!permissions.MATTER_MANAGEMENTisNoVisibility) {
        switch (type) {
          case 'admin':
            if (permissions.BILLING_MANAGEMENTisAdmin) {
              return true;
            }
            break;
          case 'edit':
            if (!permissions.BILLING_MANAGEMENTisNoVisibility) {
              return true;
            }
            break;
          case 'bill':
            if (!permissions.BILLING_MANAGEMENTisNoVisibility) {
              return true;
            }
        }
      }
      this.toaster.showPermissionError();
      return false;
    } catch (error) {
      console.log(error);
    }
  }
}

@Injectable({providedIn: 'root'})
export class TenantGuard implements CanActivate {
  constructor(
    private toaster: ToastDisplay,
    private auth: AuthGuard
  ) {
  }

  async canActivate() {
    try {
      const permissions: any = await this.auth.getPermissions();
      if (permissions.TENANT_CONFIGURATIONisAdmin) {
        return true;
      } else {
        this.toaster.showPermissionError();
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  }
}

@Injectable({providedIn: 'root'})
export class DocumentGuard implements CanActivate {
  constructor(
    private toaster: ToastDisplay,
    private auth: AuthGuard
  ) {
  }

  async canActivate() {
    try {
      const permissions: any = await this.auth.getPermissions();
      const profile = UtilsHelper.getObject('profile');
      const validTier = (
        profile && profile.tenantTier &&
        profile.tenantTier.tierName &&
        profile.tenantTier.tierName !== 'Emerging'
      ) ? true : false;
      if (permissions.DOCUMENT_MANAGEMENT_SYSTEMisAdmin && validTier) {
        return true;
      } else {
        this.toaster.showPermissionError();
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  }
}

@Injectable({providedIn: 'root'})
export class ContactGuard implements CanActivate {
  constructor(
    private toaster: ToastDisplay,
    private auth: AuthGuard
  ) {
  }

  async canActivate(route: ActivatedRouteSnapshot) {
    const permissions: any = await this.auth.getPermissions();
    const type: string = route.data.type;
    switch (type) {
      case 'edit':
        if (
          permissions.CLIENT_CONTACT_MANAGEMENTisAdmin || permissions.CLIENT_CONTACT_MANAGEMENTisEdit) {
          return true;
        }
        break;
      case 'view':
        if (!permissions.CLIENT_CONTACT_MANAGEMENTisNoVisibility) {
          return true;
        }
        break;
      case 'admin':
        if (permissions.CLIENT_CONTACT_MANAGEMENTisAdmin) {
          return true;
        }
        break;
    }
    this.toaster.showPermissionError();
    return false;
  }
}

@Injectable({providedIn: 'root'})
export class CreateClientGuard implements CanActivate {
  constructor(
    private toaster: ToastDisplay,
    private auth: AuthGuard
  ) {}

  async canActivate(route: ActivatedRouteSnapshot) {
    const permissions: any = await this.auth.getPermissions();
    if (permissions.CLIENT_CONTACT_MANAGEMENTisAdmin || permissions.CLIENT_CONTACT_MANAGEMENTisEdit) {
      return true;
    }
    this.toaster.showPermissionError();
    return false;
  }
}

@Injectable({providedIn: 'root'})
export class MatterGuard implements CanActivate {
  constructor(
    private toaster: ToastDisplay,
    private auth: AuthGuard
  ) {
  }

  async canActivate(route: ActivatedRouteSnapshot) {
    try {
      const permissions: any = await this.auth.getPermissions();
      const type: string = route.data.type;

      switch (type) {
        case 'admin':
          if (
            (
              permissions.CLIENT_CONTACT_MANAGEMENTisEdit || permissions.CLIENT_CONTACT_MANAGEMENTisAdmin
            ) && !permissions.MATTER_MANAGEMENTisNoVisibility
          ) {
            return true;
          }
          break;

        case 'reassign':
          if (
            !permissions.CLIENT_CONTACT_MANAGEMENTisNoVisibility && permissions.MATTER_MANAGEMENTisAdmin
          ) {
            return true;
          }
          break;

        case 'edit':
          if (
            (
              permissions.MATTER_MANAGEMENTisEdit ||
              permissions.MATTER_MANAGEMENTisAdmin
            ) && !permissions.CLIENT_CONTACT_MANAGEMENTisNoVisibility
          ) {
            return true;
          }
          break;

        case 'list':
          if (
            !permissions.CLIENT_CONTACT_MANAGEMENTisNoVisibility &&
            !permissions.MATTER_MANAGEMENTisNoVisibility
          ) {
            return true;
          }
          break;
      }
      this.toaster.showPermissionError();
      return false;
    } catch (error) {
      console.log(error);
    }
  }
}

@Injectable({providedIn: 'root'})
export class AccessGuard implements CanActivate {
  constructor(
    private toaster: ToastDisplay,
    private auth: AuthGuard
  ) {
  }

  async canActivate() {
    try {
      const permissions: any = await this.auth.getPermissions();
      if (permissions.ACCESS_MANAGEMENTisAdmin) {
        return true;
      } else {
        this.toaster.showPermissionError();
        return false;
      }
    } catch (error) {
      console.log(error);
    }
  }
}

@Injectable({providedIn: 'root'})
export class EmployeeGuard implements CanActivate {
  constructor(
    private toaster: ToastDisplay,
    private auth: AuthGuard
  ) {
  }

  async canActivate(route: ActivatedRouteSnapshot) {
    const type: string = route.data.type;
    const permissions: any = await this.auth.getPermissions();
    if (type === 'admin') {
      if (permissions.EMPLOYEE_MANAGEMENTisAdmin) {
        return true;
      }
    }
    if (type === 'list') {
      if (permissions.EMPLOYEE_MANAGEMENTisAdmin || permissions.EMPLOYEE_MANAGEMENTisViewOnly) {
        return true;
      }
    }
    this.toaster.showPermissionError();
    return false;
  }
}

@Injectable({providedIn: 'root'})
export class OfficeGuard implements CanActivate {
  constructor(
    private toaster: ToastDisplay,
    private auth: AuthGuard
  ) {
  }

  async canActivate(route: ActivatedRouteSnapshot) {
    const type: string = route.data.type;
    const permissions: any = await this.auth.getPermissions();

    if (type === 'admin') {
      if (permissions.OFFICE_MANAGEMENTisAdmin) {
        return true;
      }
    }
    if (type === 'list') {
      if (permissions.OFFICE_MANAGEMENTisAdmin || permissions.OFFICE_MANAGEMENTisViewOnly) {
        return true;
      }
    }
    this.toaster.showPermissionError();
    return false;
  }
}

@Injectable({providedIn: 'root'})
export class SupportGuard implements CanActivate {
  constructor(
    private toaster: ToastDisplay,
    private auth: AuthGuard
  ) {
  }

  async canActivate() {
    const permissions: any = await this.auth.getPermissions();
    if (permissions.SUPPORTisAdmin) {
      return true;
    }
    this.toaster.showPermissionError();
    return false;
  }
}

@Injectable({providedIn: 'root'})
export class TrustAccountGuard implements CanActivate {
  constructor(
    private toaster: ToastDisplay,
    private auth: AuthGuard
  ) {
  }

  async canActivate() {
    const permissions: any = await this.auth.getPermissions();
    if (permissions.TENANT_CONFIGURATIONisAdmin || permissions.ACCOUNTINGisAdmin) {
      return true;
    } else {
      this.toaster.showPermissionError();
      return false;
    }
  }
}

@Injectable({providedIn: 'root'})
export class AccountingGuard implements CanActivate {
  isTrustAccountingEnable = false;
  isEmergingTier = false;
  public profile = null;

  constructor(
    private toaster: ToastDisplay,
    private auth: AuthGuard,
    private router: Router,
    private trustAccountService: TrustAccountService,
  ) {
    this.checkTrustAccountStatus();
    this.isEmergingTier = false;
    this.profile = UtilsHelper.getObject('profile');
    if (this.profile) {
      if (this.profile.tenantTier && this.profile.tenantTier.tierName &&
        (this.profile.tenantTier.tierName === 'Emerging')) {
        this.isEmergingTier = true;
      }
    }
  }

  async canActivate() {
    const permissionList: any = await this.auth.getPermissions();

    if (this.isEmergingTier) {
      this.router.navigate(['/page-not-found']);
      return false;
    } else {
      if ((permissionList.ACCOUNTINGisAdmin || permissionList.ACCOUNTINGisEdit)) {
        return true;
      } else {
        UtilsHelper.setObject('access-denied', 'TRue');
        this.router.navigate(['/access-denied']);
        return false;
      }
    }
  }

  async checkTrustAccountStatus(): Promise<any> {
    let resp: any = await this.trustAccountService.v1TrustAccountGetTrustAccountStatusGet$Response().toPromise();
    resp = JSON.parse(resp.body as any).results;
    this.isTrustAccountingEnable = !!resp;
    return this.isTrustAccountingEnable;
  }

}

@Injectable({providedIn: 'root'})
export class AccountingIntegrationGuard implements CanActivate {
  isAscendingorIconicTier = false;
  public profile = null;
  constructor(
    private toaster: ToastDisplay,
    private auth: AuthGuard,
    private router: Router,
    private trustAccountService: TrustAccountService,
  ) {
    this.isAscendingorIconicTier = false;
    this.profile = UtilsHelper.getObject('profile');
    if (this.profile) {
      if (this.profile.tenantTier && this.profile.tenantTier.tierName &&
        (this.profile.tenantTier.tierName === 'Ascending'||this.profile.tenantTier.tierName === 'Iconic')) {
        this.isAscendingorIconicTier = true;
      }
    }
  }
  async canActivate() {
    const permissionList: any = await this.auth.getPermissions();
    if ((permissionList.ACCOUNTINGisAdmin || permissionList.ACCOUNTINGisEdit)&&this.isAscendingorIconicTier==true ) {
      return true;
    } else {
      UtilsHelper.setObject('access-denied', 'TRue');
      this.router.navigate(['/access-denied']);
      return false;
    }
  }
}


@Injectable({ providedIn: 'root' })
export class FirmAccountingGuard implements CanActivate {
  public profile = null;

  constructor(
    private auth: AuthGuard,
    private router: Router,
  ) {

  }

  async canActivate() {
    const permissionList: any = await this.auth.getPermissions();
    if ((permissionList.ACCOUNTINGisAdmin || permissionList.ACCOUNTINGisEdit)) {
      return true;
    } else {
      UtilsHelper.setObject('access-denied', 'TRue');
      this.router.navigate(['/access-denied']);
      return false;
    }
  }
}

@Injectable({providedIn: 'root'})
export class TimekeepingGuard implements CanActivate {

  constructor(private auth: AuthGuard, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot) {
    const permissionList: any = await this.auth.getPermissions();

    if (permissionList.TIMEKEEPING_OTHERSisAdmin || permissionList.TIMEKEEPING_SELFisEdit || permissionList.TIMEKEEPING_OTHERSisViewOnly) {
      return true;
    }
    this.router.navigate(['/calendar']);
  }
}

@Injectable({providedIn: 'root'})
export class ImportExportGuard implements CanActivate {

  constructor(private auth: AuthGuard, private router: Router) {
  }

  async canActivate() {
    const permissionList: any = await this.auth.getPermissions();
    if (permissionList.TENANT_CONFIGURATIONisAdmin) {
      return true;
    }
    this.router.navigate(['/dashboard']);
  }
}

@Injectable({providedIn: 'root'})
export class ReportingPermissionFlag implements CanActivate {

  constructor(private auth: AuthGuard, private router: Router) {
  }

  async canActivate() {
    const permissionList: any = await this.auth.getPermissions();
    if (permissionList.ACCOUNTINGisAdmin || permissionList.ACCOUNTINGisEdit
      || permissionList.BILLING_MANAGEMENTisAdmin
      || permissionList.BILLING_MANAGEMENTisEdit) {
      return true;
    }
    else {
      UtilsHelper.setObject('access-denied', 'TRue');
      this.router.navigate(['/access-denied']);
      return false;
    }
  }
}

@Injectable({providedIn: 'root'})
export class ReportingBillingOrResponsibleAttorneyFlag implements CanActivate {

  constructor(private auth: AuthGuard, private router: Router,private reportService: ReportService) {
  }
  public isBillingOrResponsibleAttorney: boolean = false;
  async canActivate() {
    const res: any = await this.reportService.v1ReportGetBillingOrReposponsibleAttorneyGet$Response().toPromise();
    this.isBillingOrResponsibleAttorney = JSON.parse(res.body as any).results;
    const permissionList: any = await this.auth.getPermissions();
    if (permissionList.ACCOUNTINGisAdmin || permissionList.ACCOUNTINGisEdit
      || permissionList.BILLING_MANAGEMENTisAdmin
      || permissionList.BILLING_MANAGEMENTisEdit) {
      return true;
    }
    else if (this.isBillingOrResponsibleAttorney) {
      return true;
    }
    else {
      UtilsHelper.setObject('access-denied', 'TRue');
      this.router.navigate(['/access-denied']);
      return false;
    }
  }
}

@Injectable({providedIn: 'root'})
export class ReportingAccountingFlag implements CanActivate {

  constructor(private auth: AuthGuard, private router: Router) {
  }

  async canActivate() {
    const permissionList: any = await this.auth.getPermissions();
    if (permissionList.ACCOUNTINGisAdmin || permissionList.ACCOUNTINGisEdit) {
      return true;
    }
    else {
      UtilsHelper.setObject('access-denied', 'TRue');
      this.router.navigate(['/access-denied']);
      return false;
    }
  }
}

@Injectable({providedIn: 'root'})
export class ReportingConsultAttorneyFlag implements CanActivate {

  constructor(private auth: AuthGuard, private router: Router,private reportService: ReportService) {
  }
  public isBillingOrResponsibleAttorney: boolean = false;
  public isConsultAttorney: boolean = false;

  async canActivate() {
    const permissionList: any = await this.auth.getPermissions();
    const res: any = await this.reportService.v1ReportGetBillingOrReposponsibleAttorneyGet$Response().toPromise();
    this.isBillingOrResponsibleAttorney = JSON.parse(res.body as any).results;
    const res1: any = await this.reportService.v1ReportGetConsultAttorneyGet$Response().toPromise();
    this.isConsultAttorney = JSON.parse(res1.body as any).results;

    if (permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin || permissionList.CLIENT_CONTACT_MANAGEMENTisEdit
      || this.isBillingOrResponsibleAttorney || this.isConsultAttorney) {
      return true;
    }
    else {
      UtilsHelper.setObject('access-denied', 'TRue');
      this.router.navigate(['/access-denied']);
      return false;
    }
  }
}

@Injectable({providedIn: 'root'})
export class ReportingClientDetailFlag implements CanActivate {

  constructor(private auth: AuthGuard, private router: Router,private reportService: ReportService) {
  }

  public isBillingOrResponsibleOrOriginatingAttorney: boolean = false;
  public isConsultAttorney: boolean = false;
  public isBillingOrResponsibleOrOriginatingAttorneyClient: boolean = false;

  async canActivate() {
    const permissionList: any = await this.auth.getPermissions();
    const res: any = await this.reportService.v1ReportGetBillingOrReposponsibleOrOriginatingAttorneyGet$Response().toPromise();
    this.isBillingOrResponsibleOrOriginatingAttorney = JSON.parse(res.body as any).results;

    const res1: any = await this.reportService.v1ReportGetConsultAttorneyForPcGet$Response().toPromise();
    if (res1 != null) {
      this.isConsultAttorney = JSON.parse(res1.body as any).results;
    }

    const res3: any = await this.reportService.v1ReportGetBillingOrReposponsibleOrOriginatingAttorneyClientGet$Response().toPromise();
    if (res3 != null) {
      this.isBillingOrResponsibleOrOriginatingAttorneyClient = JSON.parse(res3.body as any).results;
    }

    if (permissionList.CLIENT_CONTACT_MANAGEMENTisAdmin || permissionList.CLIENT_CONTACT_MANAGEMENTisEdit
      || this.isBillingOrResponsibleOrOriginatingAttorney || this.isConsultAttorney ||
      this.isBillingOrResponsibleOrOriginatingAttorneyClient) {
      return true;
    }
    else {
      UtilsHelper.setObject('access-denied', 'TRue');
      this.router.navigate(['/access-denied']);
      return false;
    }
  }
}

@Injectable({providedIn: 'root'})
export class ReportingTimeKeepingFlag implements CanActivate {

  constructor(private auth: AuthGuard, private router: Router,private reportService: ReportService) {
  }
  public isBillingOrResponsibleAttorney: boolean = false;
  async canActivate() {
    const permissionList: any = await this.auth.getPermissions();
    const res: any = await this.reportService.v1ReportGetBillingOrReposponsibleAttorneyGet$Response().toPromise();
    this.isBillingOrResponsibleAttorney = JSON.parse(res.body as any).results;

    if (permissionList.TIMEKEEPING_OTHERSisAdmin || this.isBillingOrResponsibleAttorney) {
      return true;
    }
    else {
      UtilsHelper.setObject('access-denied', 'TRue');
      this.router.navigate(['/access-denied']);
      return false;
    }
  }
}

@Injectable({providedIn: 'root'})
export class ReportingUserAccountDetailFlag implements CanActivate {
  constructor(private auth: AuthGuard, private router: Router) {
  }
  async canActivate() {
    const permissionList: any = await this.auth.getPermissions();
    if (permissionList.EMPLOYEE_MANAGEMENTisAdmin || !permissionList.TENANT_CONFIGURATIONisNoVisibility) {
      return true;
    }
    else {
      UtilsHelper.setObject('access-denied', 'TRue');
      this.router.navigate(['/access-denied']);
      return false;
    }
  }
}

@Injectable({providedIn: 'root'})
export class ReportingPermissionOrBillingOrResponsibleAttorneyFlag implements CanActivate {

  constructor(private auth: AuthGuard, private router: Router,private reportService: ReportService) {
  }
  public isBillingOrResponsibleAttorney: boolean = false;
  async canActivate() {
    const permissionList: any = await this.auth.getPermissions();
    const res: any = await this.reportService.v1ReportGetBillingOrReposponsibleAttorneyGet$Response().toPromise();
    this.isBillingOrResponsibleAttorney = JSON.parse(res.body as any).results;

    if (permissionList.ACCOUNTINGisAdmin || permissionList.ACCOUNTINGisEdit
      || permissionList.BILLING_MANAGEMENTisAdmin
      || permissionList.BILLING_MANAGEMENTisEdit || this.isBillingOrResponsibleAttorney) {
      return true;
    }
    else {
      UtilsHelper.setObject('access-denied', 'TRue');
      this.router.navigate(['/access-denied']);
      return false;
    }
  }
}

@Injectable({providedIn: 'root'})
export class ReportingAccuntingAdminOrUserFlag implements CanActivate {

  constructor(private auth: AuthGuard, private router: Router) {  }

  async canActivate() {
    const permissionList: any = await this.auth.getPermissions();
    if (permissionList.ACCOUNTINGisAdmin || permissionList.ACCOUNTINGisEdit) {
      return true;
    } else {
      UtilsHelper.setObject('access-denied', 'TRue');
      this.router.navigate(['/access-denied']);
      return false;
    }
  }
}
@Injectable ({providedIn: 'root'})
export class DashGuard implements CanActivate {
  constructor(private sharedService: SharedService, private router: Router) {
  }
  canActivate () {
    return new Promise<boolean>((resolve, rej) => {
      this.sharedService.getTuckerAllenAccount().then(() => {
        this.sharedService.isTuckerAllenAccount$.subscribe(
          res => {
            let isTuckerAllenUser = res ? true : false;
            if(isTuckerAllenUser){
              resolve(true);
            } else {
              this.router.navigate(['/timekeeping']);
              resolve(false);
            }
          }
        );
      });
    })
  }
}

