import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  public addBtmPng: boolean = true;

  constructor(
    private router: Router,
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (event.url.includes('/calendar/create-event') || event.url.includes('/calendar/edit-event')) {
          this.addBtmPng = true;
        } else if (event.url.includes('/calendar')) {
          this.addBtmPng = false;
        } else {
          this.addBtmPng = true;
        }
      }
    });
  }

  ngOnInit() { }

}
