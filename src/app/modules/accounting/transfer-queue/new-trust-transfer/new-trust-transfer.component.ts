import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { SelectService } from 'src/app/service/select.service';

@Component({
  selector: 'app-new-trust-transfer',
  templateUrl: './new-trust-transfer.component.html',
  styleUrls: ['./new-trust-transfer.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class NewTrustTransferComponent implements OnInit, IBackButtonGuard {

  modalOptions: NgbModalOptions;
  closeResult: string;
  isAddedSourceAccount = false;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;

  constructor(
    private modalService: NgbModal,
    private router: Router,
    private selectService: SelectService
  ) {
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart) === true) {
        console.log(val)
        this.navigateAwayPressed = true;
      }
    });
  }

  ngOnInit() {
    this.selectService.newSelection$.forEach(event => {
      if (event === 'remove data') {
        this.dataEntered = false;
      } else if (event === 'clicked!') {
        this.dataEntered = true;
      }
    })
  }
  
  openPersonalinfo(content: any, className, winClass) {
    this.modalService
      .open(content, {
        size: className,
        windowClass:winClass,
        centered: true,
        backdrop: 'static'
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

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = true;
  }

}
