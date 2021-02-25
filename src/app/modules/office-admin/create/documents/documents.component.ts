import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss']
})
export class DocumentsComponent implements OnInit {
  @Output() readonly nextStep = new EventEmitter<string>();
  @Output() readonly prevStep = new EventEmitter<string>();
  @Input() public officeId: number = 0;

  constructor() { }

  ngOnInit() {
  }
  next() {
    this.nextStep.emit('lawofficenotes');
  }
  prev() {
    this.prevStep.emit('settings');
  }
}
