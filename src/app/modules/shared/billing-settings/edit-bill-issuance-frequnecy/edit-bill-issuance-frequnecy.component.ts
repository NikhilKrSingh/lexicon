import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import * as moment from 'moment';
import {finalize, map} from 'rxjs/operators';
import {ToastDisplay} from 'src/app/guards/toast-service';
import {IDisplaySettings} from 'src/app/modules/models/billing-setting.model';
import {vwBillingSettings} from 'src/common/swagger-providers/models';
import {BillingService} from 'src/common/swagger-providers/services';
import * as errors from '../../../shared/error.json';
import {UtilsHelper} from '../../utils.helper';

@Component({
  selector: 'app-edit-bill-issuance-frequnecy',
  templateUrl: './edit-bill-issuance-frequnecy.component.html',
  styleUrls:['edit-bill-issuance-frequency.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class EditBillIssuanceFrequnecyComponent implements OnInit {
  billingSettings: vwBillingSettings;
  billData: any;
  public billFrequencyDurationName: string = '';
  public billFrequencyDayObj: {value?: number; name?: string};
  public effectiveBillFrequencyDayObj: {value?: number; name?: string};
  public recurringName: Array<string> = ['First', 'Second', 'Third', 'Fourth', 'Last'];
  public editBillUpcoming: boolean = false;
  public removeBillUpcoming: boolean = false;
  public showUpcoming: boolean = false;
  public updateBillUpcoming: boolean = false;
  error_data = (errors as any).default;
  public loading: boolean = false;
  public upcomingChangesDisplay: any;
  public billFrequencyEndDate: string;
  public officeId: number;
  public clientId: number;
  public formSubmitted: boolean = false;

  constructor(
    private activeModal: NgbActiveModal,
    private billingService: BillingService,
    private toastr: ToastDisplay,
  ) {
  }

  public pageType: string = 'editmatter';

  ngOnInit() {
    if (this.billingSettings) {
      this.getBillingSettings();
    }
  }

  public getValue(data: any) {
    this.billData = data;
    this.billData.billFrequencyStartingDate = moment(this.billData.billFrequencyStartingDate).format('YYYY-MM-DD');
    this.billData.billFrequencyNextDate = moment(this.billData.billFrequencyNextDate).format('YYYY-MM-DD');
    this.billData.effectiveDate = moment(this.billData.effectiveDate).format('YYYY-MM-DD');
    if (this.billData.effectiveBillFrequencyNextDate) {
      this.billData.effectiveBillFrequencyNextDate = moment(this.billData.effectiveBillFrequencyNextDate).format('YYYY-MM-DD');
    }
    this.setValue(data, 'changes');
  }

  public updateValue(eve) {
    this.updateBillUpcoming = true;
  }


  dismiss() {
    this.activeModal.close(null);
  }

  close() {
    this.formSubmitted = true;
    if (!this.billData.isWorkComplete && (
      !this.billData.billFrequencyQuantity ||
      !this.billData.billFrequencyDuration ||
      !this.billData.effectiveDate)
    ) {
      return;
    }
    if (this.billData && this.billData.billFrequencyDurationType === 'MONTHS') {
      if (!this.billData.billFrequencyRecursOn) {
        return;
      }
    }
    if (this.billData.effectiveDate > moment().format('YYYY-MM-DD')) {
      this.billingSettings.effectiveBillFrequencyDay = this.billData.billFrequencyDay;
      this.billingSettings.effectiveBillFrequencyRecursOn = this.billData.billFrequencyRecursOn;
      this.billingSettings.effectiveBillFrequencyQuantity = this.billData.billFrequencyQuantity;
      this.billingSettings.effectiveBillFrequencyDuration = { id: this.billData.billFrequencyDuration };
      this.billingSettings.effectiveBillFrequencyStartingDate = this.billData.effectiveDate;
      this.billingSettings.effectiveIsInherited = this.billData.isInherited;
      this.billingSettings.effectiveRepeatType = this.billData.repeatType;
      this.billingSettings.effectiveBillWhenHoliday = this.billData.billWhenHoliday;
      this.billingSettings.effectiveBillFrequencyNextDate = moment(UtilsHelper.getEffectiveDateUpcoming(this.billData.effectiveDate, this.billData)).format('YYYY-MM-DD');
      if (this.billData.effectiveDate <= moment(this.billingSettings.billFrequencyNextDate).format('YYYY-MM-DD')) {
        this.billingSettings.billFrequencyNextDate = moment(this.billData.effectiveDate).add(-1, 'days').format('YYYY-MM-DD');
      }
    } else {
      let effectivePeriod = UtilsHelper.getFinalEffectiveDate(this.billData.effectiveDate, this.billData);
      this.billingSettings.billFrequencyNextDate = this.billData.effectiveDate;
      this.billingSettings.isInherited = this.billData.isInherited;
      this.billingSettings.isWorkComplete = this.billData.isWorkComplete;
      this.billingSettings.billFrequencyDay = this.billData.billFrequencyDay;
      this.billingSettings.billFrequencyRecursOn = this.billData.billFrequencyRecursOn;
      this.billingSettings.billFrequencyQuantity = this.billData.billFrequencyQuantity;
      this.billingSettings.billFrequencyDuration = !this.billData.isWorkComplete ? { id: this.billData.billFrequencyDuration } : null;
      this.billingSettings.billFrequencyStartingDate = !this.billData.isWorkComplete ? moment(effectivePeriod.previosEffectiveDate).format('YYYY-MM-DD') : null;
      this.billingSettings.billFrequencyNextDate = !this.billData.isWorkComplete ? moment(effectivePeriod.newEffectiveDate).format('YYYY-MM-DD') : null;
      this.billingSettings.repeatType = this.billData.repeatType;
      this.billingSettings.billWhenHoliday = this.billData.billWhenHoliday;
      this.billingSettings.isWorkComplete = this.billData.isWorkComplete;
      this.billingSettings.isInherited = this.billData.isInherited;
      this.billingSettings.effectiveBillFrequencyDay = null;
      this.billingSettings.effectiveBillFrequencyRecursOn = null;
      this.billingSettings.effectiveBillFrequencyQuantity = null;
      this.billingSettings.effectiveBillFrequencyDuration = null;
      this.billingSettings.effectiveBillFrequencyNextDate = null;
      this.billingSettings.effectiveBillFrequencyStartingDate = null;
      this.billingSettings.effectiveIsInherited = null;
      this.billingSettings.effectiveRepeatType = null;
      this.billingSettings.effectiveBillWhenHoliday = null;
      this.billingSettings.effectiveRepeatType = null;
      this.billingSettings.effectiveBillWhenHoliday = null;
    }
    if (this.billData.effectiveDate > moment().format('YYYY-MM-DD')) {
      this.updateBillingSettings(this.billingSettings);
    } else {
      this.activeModal.close(this.billingSettings);
    }
  }

  public removeUpcoming() {
    this.billingSettings.effectiveBillFrequencyDay = null;
    this.billingSettings.effectiveBillFrequencyRecursOn = null;
    this.billingSettings.effectiveBillFrequencyQuantity = null;
    this.billingSettings.effectiveBillFrequencyDuration = null;
    this.billingSettings.effectiveBillFrequencyNextDate = null;
    this.billingSettings.effectiveBillFrequencyStartingDate = null;
    this.billingSettings.effectiveIsInherited = null;
    let settings = {
      billFrequencyQuantity: this.billingSettings.billFrequencyQuantity,
      billFrequencyDurationType: this.billingSettings.billFrequencyDuration ? this.billingSettings.billFrequencyDuration.code : null,
      billFrequencyDay: this.billingSettings.billFrequencyDay,
      billFrequencyRecursOn: this.billingSettings.billFrequencyRecursOn,
      repeatType: this.billingSettings.repeatType,
    }
    this.billingSettings.billFrequencyNextDate =  moment(UtilsHelper.getEffectiveDateUpcoming(moment(this.billingSettings.billFrequencyStartingDate).format('YYYY-MM-DD'), settings)).format('YYYY-MM-DD');
    this.activeModal.close(this.billingSettings);
  }

  public editUpcoming() {
    this.showUpcoming = true;
    this.editBillUpcoming = true;
  }

  private updateBillingSettings(billingSettings: vwBillingSettings) {
    this.loading = true;
    this.billingService
      .v1BillingSettingsPut$Json({
        body: billingSettings
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {
        })
      )
      .subscribe(
        response => {
          if (response) {
            this.getBillingSettings();
            if (this.billingSettings.isWorkComplete) {
              this.activeModal.close();
            }
            this.toastr.showSuccess(
              this.error_data.billing_settings_updated_success
            );
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  private getBillingSettings() {
    this.loading = true;
    let observal;
    if (this.pageType === 'editclient') {
      observal = this.billingService.v1BillingSettingsPersonPersonIdGet({
        personId: this.clientId
      });
    } else {
      observal = this.billingService.v1BillingSettingsMatterMatterIdGet({
        matterId: this.billingSettings.matter.id
      });
    }
    observal.pipe(
      map(res => {
        return JSON.parse(res as any).results[0] || {};
      }),
      finalize(() => {
        this.loading = false;
        this.editBillUpcoming = false;
        this.updateBillUpcoming = false;
      })
    )
    .subscribe(
      res => {
        if (res) {
          this.billingSettings = res;
          if (this.billingSettings) {
            this.setBillingData();
          }
        } else {
          this.billingSettings = {};
        }
      },
      () => {
        this.loading = false;
      }
    );
  }

  private setBillingData() {
    let daysList = UtilsHelper.getDayslistn();
    this.billFrequencyDurationName = (this.billingSettings.billFrequencyQuantity == 1) && this.billingSettings.billFrequencyDuration ? this.billingSettings.billFrequencyDuration.name.slice(0, -1) : this.billingSettings.billFrequencyDuration ? this.billingSettings.billFrequencyDuration.name : '';
    this.billFrequencyDayObj = daysList.find(item => item.value === this.billingSettings.billFrequencyDay);
    this.setValue(null, 'settings');
  }

  public setValue(item, type) {
    let daysList = UtilsHelper.getDayslistn();
    if (type === 'changes') {
      if (!item.isWorkComplete) {
        let day: number = item.billFrequencyDay;
        this.effectiveBillFrequencyDayObj = daysList.find(item => item.value === day);
        let fDuration =  {
          code: item.billFrequencyDurationType,
          id: item.billFrequencyDuration,
          name: _.capitalize(item.billFrequencyDurationType)
        }
        this.upcomingChangesDisplay = {
          effectiveBillFrequencyDuration : fDuration,
          effectiveBillFrequencyQuantity : item.billFrequencyQuantity,
          effectiveBillFrequencyStartingDate : item.effectiveDate,
          effectiveBillFrequencyRecursOn: item.billFrequencyRecursOn,
          effectiveIsWorkComplete: item.isWorkComplete
        }
      } else {
        this.upcomingChangesDisplay = {};
        this.effectiveBillFrequencyDayObj = {};
        this.billingSettings.effectiveBillFrequencyQuantity = null;
        this.billingSettings.isWorkComplete = item.isWorkComplete;
        this.billingSettings.isInherited = false;
        this.billData.effectiveDate = moment().format('YYYY-MM-DD');
      }
    } else {
      this.effectiveBillFrequencyDayObj = daysList.find(item => item.value === this.billingSettings.effectiveBillFrequencyDay);
      this.upcomingChangesDisplay = {
        effectiveBillFrequencyDuration : this.billingSettings.effectiveBillFrequencyDuration,
        effectiveBillFrequencyQuantity : this.billingSettings.effectiveBillFrequencyQuantity,
        effectiveBillFrequencyStartingDate : this.billingSettings.effectiveBillFrequencyStartingDate,
        effectiveBillFrequencyRecursOn : this.billingSettings.effectiveBillFrequencyRecursOn,
      }
      if (this.billingSettings.effectiveBillFrequencyStartingDate) {
        this.billFrequencyEndDate = moment(this.billingSettings.effectiveBillFrequencyStartingDate).add(-1, 'days').format('MM/DD/YYYY');
      }
    }
    this.effectiveBillFrequencyDayObj = {...this.effectiveBillFrequencyDayObj};
  }

}

