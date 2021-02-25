import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { IEmployeeCreateStepEvent } from '../../models';


interface ICompleted {
  generalinfo: boolean;
  settings: boolean;
}

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateEmployeeComponent implements OnInit, OnDestroy, IBackButtonGuard {
  public step = 'generalinfo';

  public completedArr: ICompleted = {
    generalinfo: false,
    settings: false,
  };

  isOnFirstTab = false;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;

  constructor(
    private router: Router,
    private pagetitle: Title
  ) {
    router.events.subscribe((val) => {
      if (val instanceof NavigationStart) {
        this.navigateAwayPressed = true;
      }
    });
  }

  ngOnInit() {
    this.pagetitle.setTitle('Add New Employee');
    this.isOnFirstTab = true;
  }

  ngOnDestroy() {
    localStorage.removeItem('employee_profile');
    localStorage.removeItem('employee_general');
    localStorage.removeItem('employee_setting');
  }

  nextStep(e: IEmployeeCreateStepEvent) {
    this.step = e.nextStep;
    this.completedArr[e.currentStep] = true;
    window.scrollTo(0, 0);
    this.isOnFirstTab = false;
    this.backbuttonPressed = false;
    this.steps.push(e.currentStep);
  }

  prevStep(e: IEmployeeCreateStepEvent) {
    this.step = e.prevStep;
    this.steps.pop();
    const keys = Object.keys(this.completedArr);
    const indexNumber: number = keys.indexOf(e.prevStep);
    for (let counter = 0; counter < keys.length; counter++) {
      if (counter < indexNumber) {
        continue;
      }
      this.completedArr[keys[counter]] = false;
    }
    window.scrollTo(0, 0);
    this.backbuttonPressed = false;
  }

  /***
   * function to toggle tabs
   */
  changeTab(type: string, pushToStep = true) {
    if (type) {
      let changeStep = false;
      switch (type) {
        case 'generalinfo':
          this.completedArr.generalinfo = false;
          changeStep = true;
          this.isOnFirstTab = true;
          break;
        case 'settings':
          const savedData = UtilsHelper.getObject('employee_general');
          if (savedData && savedData.data) {
            this.completedArr.generalinfo = true;
            changeStep = true;
            this.isOnFirstTab = false;
          }
          break;
      }
      if (changeStep) {
        this.backbuttonPressed = false;
        if (pushToStep) {
          this.steps.push(this.step);
          this.steps = [...this.steps];
        }
        this.step = type;
      }
    }
  }

  @HostListener('window:popstate', ['$event']) onPopState(event) {
    if (this.steps.length > 0) {
      const step = this.steps.pop();
      this.changeTab(step, false);
      this.isOnFirstTab = false;
      this.backbuttonPressed = true;
    } else {
      this.isOnFirstTab = true;
      this.backbuttonPressed = true;
    }
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = true;
  }

  @HostListener('document:click', ['$event']) documentClick(event: MouseEvent) {
    if (localStorage.getItem('save') === 'true') {
      this.dataEntered = false;
      localStorage.removeItem('save');
    }
  }

}
