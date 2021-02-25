import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  @Output() readonly prevStep = new EventEmitter<string>();
  @Input() public officeId: number = 0;

  constructor() { }

  ngOnInit() {
  }
  prev() {
    this.prevStep.emit('lawofficenotes');
  }


}
