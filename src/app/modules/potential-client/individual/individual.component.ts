import { Component, HostListener, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { UtilsHelper } from '../../shared/utils.helper';

interface ICompleted {
  basic: boolean;
  matter: boolean;
  attorney: boolean;
  scheduling: boolean;
  notes: boolean;
}

@Component({
  selector: 'app-individual-potential-client',
  templateUrl: './individual.component.html',
  styleUrls: ['./individual.component.scss']
})
export class IndividualPotentialClientComponent implements OnInit, IBackButtonGuard {
  public step: string = 'basic';
  public completedArr: ICompleted = {
    basic: false,
    matter: false,
    attorney: false,
    scheduling: false,
    notes: false
  };
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;

  constructor(
    private router: Router,
    private pagetitle: Title
  ) {
    router.events.subscribe((val) => {
      if ((val instanceof NavigationStart) === true) {
        this.navigateAwayPressed = true;
      }
    });
  }

  ngOnInit() {
    this.pagetitle.setTitle("Add New Potential Client");
    const user:any = UtilsHelper.getLoginUser();
    if(user && user.tenantTier) {
      if(UtilsHelper.validTenantTier().includes(user.tenantTier.tierName)) {
        this.router.navigate(['/potential-client/new-potential-client-intake']);
        return;
      }
    }
    let curStep = UtilsHelper.getObject('pccreatestep');
    if (curStep) {
      this.step = curStep;
      this.manageStep(this.step);

      if (this.step == 'basic') {
        this.steps = [];
      }

      if (this.step == 'matter') {
        this.steps = ['basic'];
      }

      if (this.step == 'attorney') {
        this.steps = ['basic', 'matter'];
      }

      if (this.step == 'scheduling') {
        this.steps = ['basic', 'matter', 'attorney'];
      }

      if (this.step == 'notes') {
        this.steps = ['basic', 'matter', 'attorney', 'notes'];
      }
    }
  }

  nextStep(e) {
    this.step = e.next;
    this.completedArr[e.current] = true;
    UtilsHelper.setObject('pccreatestep', e.next);
    window.scrollTo(0, 0);
    this.steps.push(e.current);
  }

  prevStep(e) {
    this.step = e;
    this.completedArr[e] = true;
    this.changeStep(e);
    UtilsHelper.setObject('pccreatestep', this.step);
    this.steps.pop();
  }

  public changeStep(step) {
    if (this.completedArr[step]) {
      this.steps.push(this.step);
      this.steps = [...this.steps];
      this.step = step;
      UtilsHelper.setObject('pccreatestep', step);
      this.manageStep(step);
    }
  }

  public manageStep(step) {
    var keys = Object.keys(this.completedArr);
    let indexNumber: number = keys.findIndex(item => item === step);
    for (var counter = 0; counter < keys.length; counter++) {
      if (counter < indexNumber) {
        this.completedArr[keys[counter]] = true;
      } else {
        this.completedArr[keys[counter]] = false;
      }
    }
  }

  changeTab(type: string) {
    if (type) {
      let changeStep = false;
      this.manageStep(type);
      switch (type) {
        case 'basic':
          changeStep = true;
          break;
        case 'matter':
          this.completedArr.basic = true;
            changeStep = true;
          break;
        case 'attorney':
          this.completedArr.basic = true;
          this.completedArr.matter = true;
          changeStep = true;
          break;
        case 'scheduling':
          this.completedArr.basic = true;
          this.completedArr.matter = true;
          this.completedArr.attorney = true;
          changeStep = true;
          break;
        case 'notes':
          this.completedArr.basic = true;
          this.completedArr.matter = true;
          this.completedArr.attorney = true;
          this.completedArr.scheduling = true;
          changeStep = true;
          break;
      }

      this.step = type;
    }
  }

  @HostListener('window:popstate', ['$event']) onPopState(event) {
    if (this.steps.length > 0) {
      let step = this.steps.pop();
      this.changeTab(step);
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
    if (localStorage.getItem('done') === 'true') {
      this.dataEntered = false;
      localStorage.removeItem('done')
    }
  }

}
