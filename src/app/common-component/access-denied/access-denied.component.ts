import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';

@Component({
  selector: 'app-access-denied',
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AccessDeniedComponent implements OnInit, OnDestroy {

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
    if (UtilsHelper.getObject('access-denied') !== 'TRue') {
      this.goToDashboard();
    }
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  ngOnDestroy() {
    UtilsHelper.removeObject('access-denied');
  }

}
