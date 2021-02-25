import { Component, ElementRef, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { fromEvent } from 'rxjs';
import { debounceTime, take } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { MiscService, UsioService } from 'src/common/swagger-providers/services';
import * as errorData from '../../shared/error.json';

@Component({
  selector: 'app-usio-owner-details',
  templateUrl: './usio-owner-details.component.html',
  styleUrls: ['./usio-owner-details.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class UsioOwnerDetailsComponent implements OnInit {

  public params: {tenantId?: number; bankAccountId?:number; email?: string;} = null;
  public ownerTitles: Array<any> = [];
  public form: FormGroup;
  public stateList: Array<any>;
  public submitted: boolean = false;
  public success: boolean = false;
  public invalidLink: boolean = false;
  public errorData: any = (errorData as any).default;
  public loading: boolean = false;
  public currentDate: Date;
  public validationErrors: any = [];
  public errors: any = {};
  
  constructor(
  	private usioService: UsioService,
    private route: ActivatedRoute,
    private router: Router,
    private builder: FormBuilder,
    private miscService: MiscService,
    private el: ElementRef,
    private toastDisplay: ToastDisplay,
  ) {}

  ngOnInit() {
    this.currentDate = new Date();
  	this.route.queryParams.subscribe(param => {
      this.params = {
        tenantId: parseInt(param.tenantId),
        bankAccountId: parseInt(param.Id),
        email: param.email
      }
    })
    this.getState()
    this.getOwnerTitles()
    this.checkAccountStatus()
    this.createForm(this.params.tenantId, this.params.bankAccountId, this.params.email)
  }

  getOwnerTitles() {
    this.usioService
      .v1UsioGetOwnerTitlesGet()
      .subscribe(
        data => {
          const res: any = data;
          this.ownerTitles = JSON.parse(res).results;
        },
        err => {
          console.log(err)
        }
      )
  }

  checkAccountStatus() {
    this.loading = true;
    this.usioService
      .v1UsioCheckAccountStatusPost({
        tenantId: this.params.tenantId, 
        bankAccountId:this.params.bankAccountId
      }).subscribe(
        (data: any) => {
          const res: any = JSON.parse(data)
          console.log(res.results)
          if(res.results){
            this.invalidLink = true;
          }
          this.loading = false;
        }, 
        err => {
          console.log(err)
          this.loading = false;
          this.invalidLink = true;
        }
      )
  }

  getErrorMessage(field) {
    if (this.validationErrors.length > 0) {
      return this.validationErrors.filter(data => {
        return (data.fieldName === field);
      }).map(obj => {
        return obj;
      });
    } else {
      return [];
    }
  }

  public getState() {
    this.usioService.v1UsioGetStatesGet$Response({
      tenantId: this.params.tenantId
    }).subscribe(
      suc => {
        const res: any = suc;
        this.stateList = JSON.parse(res.body).results;
        console.log(this.stateList)
      },
      err => {
      }
    );
  }

  createForm(tenantId: number, bankAccountId: number, email: string) {
    this.form = this.builder.group({
      tenantId: [tenantId],
      bankAccountId: [bankAccountId],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: [email],
      title: [null, Validators.required],
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      state: [null, Validators.required],
      postalCode: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(6)]],
      phone: ['', Validators.required],
      dob: ['',Validators.required],
      last4SSN: ['', Validators.required],
      ownershipPercent: [null, [Validators.required, Validators.min(25), Validators.max(100)]],
      agreement: [false]
    })
  }

  get f() {
    return this.form.controls;
  }

  private getTopOffset(controlEl: HTMLElement): number {
    const labelOffset = 50;
    return controlEl.getBoundingClientRect().top + window.scrollY - labelOffset;
  }

  private scrollToFirstInvalidControl() {
    const firstInvalidControl: HTMLElement = this.el.nativeElement.querySelector(
      'form .ng-invalid'
    );

    // firstInvalidControl.focus(); // with smooth behavior
    if (firstInvalidControl) {
      window.scroll({
        top: this.getTopOffset(firstInvalidControl),
        left: 0,
        behavior: 'smooth'
      });

      fromEvent(window, 'scroll')
        .pipe(
          debounceTime(100),
          take(1)
        )
        .subscribe(() => firstInvalidControl.focus());
    }
  }

  submitDetails() {
    this.submitted = true;
    if (this.form.invalid) {
      this.scrollToFirstInvalidControl();
      return;
    }
    if(this.form.valid && this.form.controls.agreement.value) {
      this.form.value.dob = moment(this.form.value.dob).format('MM/DD/YYYY');
      this.usioService
        .v1UsioAddUsioBankOwnerPost$Json({
          body: this.form.value
        })
        .subscribe(
          (data: any) => {
            const res: any = JSON.parse(data);
            if(res.results.status === "success"){
              this.success = true;
              this.errors = {}
            } else if (res.results.status === 'failure') {
              if (res.results.validationErrors) {
                this.validationErrors = res.results.validationErrors;
                res.results.validationErrors.forEach(error => {
                  this.errors[error.fieldName] = []
                  this.errors[error.fieldName].push(error)
                })
                this.scrollToFirstInvalidControl();
              }
            } else if (res.results.status === 'Failure') {
              this.toastDisplay.showError(
                res.results.message
              );
            } else {
              this.toastDisplay.showError(
                res.results.message
              );
            }
          },
          err => {
            console.log(err)
          }
        )
    }
  }


  checkNumber(event) {
    let k;
    k = event.keyCode ? event.keyCode : event.which;
    return (k >= 48 && k <= 57) || +k === 8 || +k === 9;
  }

}
