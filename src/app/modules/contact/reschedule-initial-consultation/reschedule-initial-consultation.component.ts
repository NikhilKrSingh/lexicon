import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {
  ModalDismissReasons, NgbModal, NgbModalOptions
} from "@ng-bootstrap/ng-bootstrap";
@Component({
  selector: 'app-reschedule-initial-consultation',
  templateUrl: './reschedule-initial-consultation.component.html',
  styleUrls: ['./reschedule-initial-consultation.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class RescheduleInitialConsultationComponent implements OnInit {
  modalOptions: NgbModalOptions;
  closeResult: string;

  constructor(private modalService: NgbModal) {
  }

  ngOnInit() {
  }
  openPersonalinfo(content: any, className, winClass) {
    this.modalService
      .open(content, {
        size: className,
        windowClass:winClass,
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
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }
}
