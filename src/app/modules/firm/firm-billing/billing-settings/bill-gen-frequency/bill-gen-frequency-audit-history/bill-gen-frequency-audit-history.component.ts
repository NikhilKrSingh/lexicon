import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-bill-gen-frequency-audit-history.component',
  templateUrl: './bill-gen-frequency-audit-history.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class BillGenFrequencyAuditHistoryComponent implements OnInit {
  modalOptions: NgbModalOptions;
  closeResult: string;
  constructor(
    private modalService: NgbModal,
  ) { }

  ngOnInit() {
  }

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
