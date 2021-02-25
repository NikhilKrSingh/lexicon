import { Component, OnInit } from '@angular/core';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit {
  modalOptions: NgbModalOptions;
  closeResult: string;

  isShow1: boolean = false;
  isShow: boolean = false;

  public title: string = 'All';
  public title1: string = 'All';
  public filterName: string = 'Apply Filter';
  public selections: Array<number> = [];
  public dropdownList: Array<any> = [
    {
      id: 1,
      name: 'Firm Name',
      checked: false
    },
    {
      id: 2,
      name: 'All Regions',
      checked: false
    },
    {
      id: 3,
      name: 'East',
      checked: false
    },
    {
      id: 4,
      name: 'Midwest',
      checked: false
    }
  ];
  public selections1: Array<number> = [];
  public dropdownList1: Array<any> = [
    {
      id: 1,
      name: 'Active',
      checked: false
    },
    {
      id: 2,
      name: 'Pending',
      checked: false
    },
    {
      id: 3,
      name: 'Closed',
      checked: false
    }
  ];

  constructor(private modalService: NgbModal) {}

  ngOnInit() {}
  public getDropdownSelected(event) {
    let locationsCounter: number = 1;
    this.title = '';
    if (event.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'All';
    }
  }

  public getDropdownSelected1(event) {
    let locationsCounter: number = 1;
    this.title1 = '';
    if (event.length > 0) {
      this.title1 = event.length;
    } else {
      this.title1 = 'All';
    }
  }

  public onMultiSelectSelectedOptions(event) {
  }

  public clearFilter() {
    this.selections = [];
    this.dropdownList.forEach(item => (item.checked = false));
    this.title = 'All';
  }

  public clearFilter1() {
    this.selections1 = [];
    this.dropdownList1.forEach(item => (item.checked = false));
    this.title1 = 'All';
  }

  public applyFilter() {
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
