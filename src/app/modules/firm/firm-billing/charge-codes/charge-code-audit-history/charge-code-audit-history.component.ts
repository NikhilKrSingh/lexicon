import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  ModalDismissReasons,
  NgbModal,
  NgbModalOptions
} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-firm-charge-code-audit-history',
  templateUrl: './charge-code-audit-history.component.html',
  styleUrls: ['./charge-code-audit-history.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class FirmChargeCodeAuditHistoryComponent implements OnInit {
  modalOptions: NgbModalOptions;
  closeResult: string;

  constructor(private modalService: NgbModal, private route: ActivatedRoute) {
    this.route.queryParams.subscribe(params => {
      let chargeCodeId = params['id'];
    });
  }

  ngOnInit() {}

  open(content: any, className: any) {
    this.modalService
      .open(content, {
        size: className,
        centered: true,
        backdrop: 'static',
      })
      .result.then(
        result => {
          this.closeResult = `Closed with: ${result}`;
        },
        reason => {
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
}
