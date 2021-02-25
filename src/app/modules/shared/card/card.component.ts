import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-common-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CardComponent implements OnInit {
  @Input() collapsible = false;
  @Input() header: string;
  @Input() expanded = false;
  isCollapsible = false;
  isCollapsed = true;

  constructor() {}

  ngOnInit() {
    this.isCollapsed = !this.expanded;
  }

  toggle() {
    this.isCollapsed = !this.isCollapsed;
  }
}
