import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { SelectService } from 'src/app/service/select.service';

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CreateEventComponent implements OnInit, IBackButtonGuard {

  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;

  constructor(
    private router: Router,
    private selectService: SelectService
  ) {
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart) === true) {
        this.navigateAwayPressed = true;
      }
    });
   }

  ngOnInit() {
    this.selectService.newSelection$.forEach(event => {
      if (event === 'remove data') {
        this.dataEntered = false;
      } else if (event === 'clicked!') {
        this.dataEntered = true;
      }
    })

  }

  public afterSave(event) {
    this.dataEntered = false;
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = true;
  }

}
