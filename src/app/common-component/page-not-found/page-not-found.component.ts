import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})

export class PageNotFoundComponent implements OnInit, OnDestroy {

  constructor(
    private router: Router,
    private pagetitle: Title
  ) { }

  ngOnInit() {
    this.pagetitle.setTitle("Page Not Found");
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  ngOnDestroy() {
  }

}

