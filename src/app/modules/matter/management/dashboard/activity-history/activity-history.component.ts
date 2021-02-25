import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-matter-activity-history',
  templateUrl: './activity-history.component.html',
  styleUrls: ['./activity-history.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class MatterActivityHistoryComponent implements OnInit {
  myText =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

  date = new Date();
  constructor() {}

  ngOnInit() {}
}
