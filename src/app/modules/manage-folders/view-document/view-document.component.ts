import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-view-document',
  templateUrl: './view-document.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class ViewDocumentComponent implements OnInit {

  modalOptions: NgbModalOptions;
  closeResult: string;

  constructor(private modalService: NgbModal) {
  }

  isShow1: boolean = false;
  isShow: boolean = false;

  isShow2: boolean = false;
  isShow3: boolean = false;

  public title:'1';
  public dselected: any;
  testlist: string[] = ['Select an owner', 'Select an owner 1','Select an owner 2', ];

  ngOnInit() {
  }

  openPersonalinfo(content: any, className, winClass) {
    this.modalService
      .open(content, {
        size: className,
        windowClass:winClass,
        centered: true
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
