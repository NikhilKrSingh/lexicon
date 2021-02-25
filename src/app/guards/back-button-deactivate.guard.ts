import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot } from '@angular/router';
import { DialogService } from '../modules/shared/dialog.service';

export interface IBackButtonGuard {
  isOnFirstTab: boolean;
  backbuttonPressed: boolean;
  steps?: Array<any>;
  navigateAwayPressed: boolean;
  dataEntered: boolean;
  isEditChargeComponent?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BackButtonRouteGuard implements CanDeactivate<IBackButtonGuard> {
  constructor(private dialogService: DialogService) { }

  canDeactivate(
    component: IBackButtonGuard,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot
  ): Promise<boolean> | boolean {
    let isEditChargeDialog = component.isEditChargeComponent;
    if (component.isOnFirstTab && component.backbuttonPressed && component.steps.length == 0) {
      return new Promise((res, rej) => {
        this.dialogService.openUnsavedChangedDialog(isEditChargeDialog).then(
          (r) => {
            if (r) {
              res(true);
            } else {
              window.history.pushState({}, currentState.url, currentState.url);
              component.backbuttonPressed = false;
              res(false);
            }
          },
          () => {
            window.history.pushState({}, currentState.url, currentState.url);
            component.backbuttonPressed = false;
            res(false);
          }
        );
      });
    } else if (!component.isOnFirstTab && component.backbuttonPressed) {
      window.history.pushState({}, currentState.url, currentState.url);
      component.backbuttonPressed = false;
      return false;
    } else if (!component.backbuttonPressed && component.navigateAwayPressed && component.dataEntered) {
      if (localStorage.getItem('done') === 'true') {
        return true;
      } else {
        return new Promise((res, rej) => {
          this.dialogService.openUnsavedChangedDialog(isEditChargeDialog).then(
            (r) => {
              if (r) {
                res(true);
              } else {
                window.history.pushState({}, currentState.url, currentState.url);
                component.navigateAwayPressed = false;
                res(false);
              }
            },
            () => {
              window.history.pushState({}, currentState.url, currentState.url);
              component.navigateAwayPressed = false;
              res(false);
            }
          );
        });
      }
    } else {
      return true;
    }
  }
}
