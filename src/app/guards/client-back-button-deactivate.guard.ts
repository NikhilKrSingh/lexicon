import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UnsavedChangedClientDialogComponent } from '../modules/shared/unsaved-changed-client-dialog/unsaved-changed-client-dialog.component';

export interface ClientBackButtonGuard {
  isCustomBillingRate?: boolean;
  isEditRateTableModeOn?: boolean;
  rateTables?: Array<any>;
}

@Injectable({
  providedIn: 'root',
})
export class ClientBackButtonRouteGuard implements CanDeactivate<ClientBackButtonGuard> {
  constructor(private modalService: NgbModal) {}

  canDeactivate(
    component: ClientBackButtonGuard,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot
  ): Promise<boolean> | boolean {
    const isCustomBillingRate = component.isCustomBillingRate;
    const rateTables = component.rateTables;
    const isEditRateTableModeOn = component.isEditRateTableModeOn;
    if (isEditRateTableModeOn) {
      return new Promise(res => {
        const modalRef = this.modalService.open(UnsavedChangedClientDialogComponent, {
          windowClass: 'modal-md',
          centered: true,
          backdrop: 'static',
        });
        modalRef.componentInstance.isCustomBillingRate = isCustomBillingRate;
        modalRef.componentInstance.rateTables = rateTables;
        modalRef.result.then((result) => {
          res(false);
          component.isCustomBillingRate = result.isCustomBillingRate;
          component.rateTables = result.rateTables && result.rateTables.length ? result.rateTables : [];
        }, () => {
          res(true);
        });
      });
    } else {
      return true;
    }
  }
}
