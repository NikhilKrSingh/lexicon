import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { HtmlEditorService, ImageService, ResizeService, ToolbarService } from '@syncfusion/ej2-angular-richtexteditor';
import { finalize, map } from 'rxjs/operators';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { TrustAccountService } from 'src/common/swagger-providers/services';
import { IEmployeeCreateStepEvent } from '../../models';
import { UtilsHelper } from '../../shared/utils.helper';

interface ICompleted {
  basic: boolean;
  employee: boolean;
  settings: boolean;
  documents: boolean;
  trustaccount: boolean;
  lawofficenotes: boolean;
}

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
  providers: [ToolbarService, ImageService, ResizeService, HtmlEditorService]
})
export class CreateComponent implements OnInit, OnDestroy, IBackButtonGuard {
  public tools: object = {
    items: [
      'Bold',
      'Italic',
      'Underline',
      '|',
      'Alignments',
      '|',
      'OrderedList',
      'UnorderedList',
      '|',
      'Indent',
      'Outdent',
      '|',
      'Image',
      '|'
    ]
  };
  public step = 'basic';
  public completedArr: ICompleted = {
    basic: false,
    employee: false,
    settings: false,
    documents: false,
    trustaccount: false,
    lawofficenotes: false,
  };
  public officeId: number;
  public isTrustAccountEnabled = true;

  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;

  constructor(
    private trustAccountService: TrustAccountService,
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
    this.pagetitle.setTitle("Add New Office");
    this.getTenantTrustAccountStatus();
  }

  private getTenantTrustAccountStatus() {
    this.trustAccountService
      .v1TrustAccountGetTrustAccountStatusGet$Response()
      .pipe(
        map(res => {
          return JSON.parse(res.body as any).results as boolean;
        }),
        finalize(() => {
        })
      )
      .subscribe(res => {
        if (res) {
          this.isTrustAccountEnabled = true;
        } else {
          this.isTrustAccountEnabled = false;
          if (this.completedArr['trustaccount'] != null && this.completedArr['trustaccount'] != undefined) {
            delete this.completedArr['trustaccount'];
          }
        }
      });
  }

  nextStep(e: IEmployeeCreateStepEvent) {
    this.step = e.nextStep;
    this.completedArr[e.currentStep] = true;
    this.steps.push(e.currentStep);
    window.scrollTo(0, 0);
  }

  prevStep(e: IEmployeeCreateStepEvent) {
    this.step = e.prevStep;
    this.steps.pop();
    this.checkedUncheckedTabs(e.prevStep);
    window.scrollTo(0, 0);
  }

  ngOnDestroy() {
    localStorage.removeItem('office');
    localStorage.removeItem('officeSetTrustAccount');
  }

  /***
   * function to checked/unchecked tabs
   */
  checkedUncheckedTabs(type?: string) {
    const keys = Object.keys(this.completedArr);
    const indexNumber: number = keys.indexOf(type);
    for (let counter = 0; counter < keys.length; counter++) {
      if (counter < indexNumber) {
        continue;
      }
      this.completedArr[keys[counter]] = false;
    }
  }

  changeTab(type: string, pushToStep = true) {
    if (type) {
      let changeStep = false;
      const obj = UtilsHelper.getObject('office');
      this.checkedUncheckedTabs(type);
      switch (type) {
        case 'basic':
          changeStep = true;
          break;
        case 'employee':
          if (obj && obj.basicDetails) {
            this.completedArr.basic = true;
            changeStep = true;
          }
          break;
        case 'settings':
          if (obj && obj.employeesDetails) {
            this.completedArr.basic = true;
            this.completedArr.employee = true;
            changeStep = true;
          }
          break;
        case 'trustaccount':
          if (obj && obj.employeesDetails) {
            this.completedArr.basic = true;
            this.completedArr.employee = true;
            this.completedArr.settings = true;
            changeStep = true;
          }
          break;
        case 'lawofficenotes':
          if (obj && obj.settings) {
            this.completedArr.basic = true;
            this.completedArr.employee = true;
            this.completedArr.settings = true;
            if (this.isTrustAccountEnabled) {
              this.completedArr.trustaccount = true;
            }
            changeStep = true;
          }
          break;
      }
      if (changeStep) {
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
      let step = this.steps.pop();
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
      localStorage.removeItem('save')
    }
  }
}
