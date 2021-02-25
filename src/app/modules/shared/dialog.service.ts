import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { UnsavedChangedDialogComponent } from './unsaved-changed-dialog/unsaved-changed-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  constructor(private modalService: NgbModal) {}

  public confirm(
    messageText: string,
    btnOkText = 'Ok',
    btnCancelText = 'Cancel',
    title = 'Confirm',
    icon: boolean = true,
    windowclass = '',
    dispConfirmBtn: boolean = true,
    bulletList: Array<string> = null,
    btnLight = false
  ) {
    const modalRef = this.modalService.open(ConfirmDialogComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: windowclass
    });

    const component: ConfirmDialogComponent = modalRef.componentInstance;

    component.message = messageText;
    component.cancelButtonText = btnCancelText;
    component.okButtonText = btnOkText;
    component.title = title;
    component.icon = icon;
    component.dispConfirmBtn = dispConfirmBtn;
    component.bulletList = bulletList;
    component.btnLight = btnLight;

    return modalRef.result;
  }


  openUnsavedChangedDialog(isEditChargeDialog?: boolean) {
    const modalRef = this.modalService.open(UnsavedChangedDialogComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.isEditChargeDialog = isEditChargeDialog

    return modalRef.result;
  }
}
