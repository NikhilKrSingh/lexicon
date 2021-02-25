import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import * as fromRoot from '../../../store';
@Component({
  selector: 'app-billing-code',
  templateUrl: './billing-code.component.html',
  styleUrls: ['./billing-code.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class BillingCodeComponent implements OnInit {
  mytab: string[] = [
    'Hourly Codes',
    'Consultation Codes',
    'Disbursement Types',
    'Fixed Fee Services',
    'Fixed Fee Add-Ons',
    'Write-Off Codes',
    'Write-Down Codes',
    'Transaction Reversal Codes',
  ];
  selecttabs = this.mytab[0];
  modalOptions: NgbModalOptions;
  closeResult: string;
  public permission: any;

  constructor(
    private store: Store<fromRoot.AppState>,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.getPermission();
  }

  /**
   * Get permission
   */
  private getPermission() {
    this.store.select('permissions').subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permission = obj.datas;
        }
      }
    });
  }

  openPersonalinfo(content: any, className, winClass) {
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
      })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
        },
        (reason) => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
