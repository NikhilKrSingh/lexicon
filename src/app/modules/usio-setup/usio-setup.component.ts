import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-usio-setup',
  templateUrl: './usio-setup.component.html',
  styleUrls: ['./usio-setup.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class UsioSetupComponent implements OnInit {

  constructor(private modalService: NgbModal) { }

  ngOnInit() {
  }
}
