import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-matter-progress',
  templateUrl: './matter-progress.component.html',
  styleUrls: ['./matter-progress.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class MatterProgressComponent implements OnInit {
  @Input() matterId: number;
  constructor() { }

  ngOnInit() {
  }
}