import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as errors from 'src/app/modules/shared/error.json';
import { PreventInject } from 'src/app/modules/shared/validators/prevent-inject.validator';
import { vwMatterAlert } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-create-matter-alert',
  templateUrl: './create-alert.component.html',
  encapsulation: ViewEncapsulation.Emulated,
})
export class CreateMatterAlertComponent implements OnInit {
  matterAlert: vwMatterAlert;
  @Input() public matterStatusArr;
  @Input() public matterPriorityArr;

  public statusList: Array<any> = [];

  public expiryDateType: number;
  public effectiveDateType: number;
  public currentDate = new Date();
  public form: FormGroup;
  public formSubmitted: boolean = false;

  expiryDateFilter: (d: Date) => boolean;

  error_data = (errors as any).default;

  constructor(
    private activeModal: NgbActiveModal,
    private toastr: ToastDisplay,
    private fb: FormBuilder
  ) {
    this.matterAlert = {} as vwMatterAlert;

    this.expiryDateFilter = (d: Date) => {
      let now = moment();
      return moment(d).isAfter(now, 'd');
    };
  }

  async ngOnInit() {
    this.statusList = [...this.matterStatusArr];
    this.createForm();

    if (this.matterAlert) {
      this.form.patchValue({
        content: this.matterAlert.content,
        effectiveDate: this.matterAlert.effectiveDate,
        expirationDate: this.matterAlert.expirationDate,
        statusId: this.matterAlert.statusId,
        priorityId: this.matterAlert.priorityId,
      });
    }

    this.expiryDateFilter = (d: Date) => {
      let now = moment();
      if (this.form.value.effectiveDate) {
        return (
          moment(d).isAfter(now, 'd') &&
          moment(d).isAfter(moment(this.form.value.effectiveDate), 'd')
        );
      } else {
        return moment(d).isAfter(now, 'd');
      }
    };
  }

  /***
   * function to create matter alert form
   */
  createForm(): void {
    this.form = this.fb.group({
      content: new FormControl('', [Validators.required, PreventInject]),
      effectiveDate: new FormControl('', [Validators.required]),
      expirationDate: new FormControl(),
      statusId: new FormControl(null, [Validators.required]),
      priorityId: new FormControl(null, [Validators.required]),
    });

    this.form.patchValue({
      effectiveDate: this.currentDate,
    });
  }

  dismiss() {
    this.activeModal.close(null);
  }

  save(alert: vwMatterAlert) {
    this.formSubmitted = true;
    alert.id = this.matterAlert.id;

    console.log(this.form.value.content)

    if (this.form.invalid) {
      return;
    }

    if (!alert.id) {
      alert.title = alert.content.substr(0, 100);
    } else {
      alert.title = this.matterAlert.title;
    }

    let effectivedate = moment(alert.effectiveDate);
    let expirationDate = moment(alert.expirationDate);

    if (alert.expirationDate) {
      if (expirationDate.isBefore(effectivedate, 'd')) {
        this.toastr.showError(this.error_data.expiration_date_before_effective_date);
        return;
      }

      if (expirationDate.isBefore(moment(), 'd')) {
        this.toastr.showError(this.error_data.expiration_date_today_or_past_date);
        return;
      }
    }

    console.log(alert);

    this.activeModal.close(alert);
  }

  changeStatus() {
    if (this.effectiveDateType == -1 || this.effectiveDateType == 0) {
      this.statusList = this.matterStatusArr.filter(
        (element) => element.code != 'PENDING'
      );
    } else if (this.effectiveDateType == 1) {
      this.statusList = this.matterStatusArr.filter(
        (element) => element.code != 'ACTIVE'
      );
    } else {
      this.statusList = this.matterStatusArr.filter(
        (element) => element.code == 'INACTIVE'
      );
    }
  }

  /**
   *Function to check the date type
   *returns 1 for future, -1 for past and 0 for today
   */
  checkDate(selectedDate) {
    let now = moment();
    let date = moment(selectedDate);

    if (date.isAfter(now, 'd')) {
      return 1;
    } else if (date.isBefore(now, 'd')) {
      return -1;
    } else {
      return 0;
    }
  }

  dateChanged(event: any, type: string) {
    let date = new Date(event);
    if (type == 'expiry') {
      this.expiryDateType = this.checkDate(date);
    } else {
      this.effectiveDateType = this.checkDate(date);
      this.form.patchValue({
        statusId: null,
      });

      if (this.form.value.expirationDate) {
        if (
          moment(this.form.value.expirationDate).isBefore(
            moment(this.form.value.effectiveDate),
            'd'
          )
        ) {
          this.form.patchValue({
            expirationDate: null,
          });
        }
      }

      this.expiryDateFilter = (d: Date) => {
        let now = moment();
        if (this.form.value.effectiveDate) {
          return (
            moment(d).isAfter(now, 'd') &&
            moment(d).isAfter(moment(this.form.value.effectiveDate), 'd')
          );
        } else {
          return moment(d).isAfter(now, 'd');
        }
      };
    }
    this.changeStatus();
  }
}
