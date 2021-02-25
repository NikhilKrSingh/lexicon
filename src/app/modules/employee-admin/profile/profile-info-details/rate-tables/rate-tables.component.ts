import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { Options } from 'ng5-slider';
import { forkJoin } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { CustomizeMatterRateComponent } from 'src/app/modules/shared/billing-settings';
import {
  vwEmployee, vwIdCodeName, vwRate
} from 'src/common/swagger-providers/models';
import { BillingService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-employee-profile-rate-tables',
  templateUrl: './rate-tables.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class EmployeeRateTablesComponent implements OnInit {
  @Input() employee: vwEmployee;

  public rateList: Array<vwRate>;
  public originalRateList: Array<vwRate>;
  public selectedRate: vwRate;
  public billingToList: Array<vwIdCodeName>;
  public billingTypeList: Array<vwIdCodeName>;
  public billingTo: number;
  public billType: number;
  public description: string;
  public rate_min = 100;
  public rate_max = 1000;
  public rateMin: number = 100;
  public rateMax: number = 1000;
  public rateOptions: Options = {
    floor: 100,
    ceil: 1000,
    translate: opt => {
      return '$' + opt.toLocaleString('en-US');
    }
  };
  public loading = true;

  constructor(
    private billingService: BillingService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    if (this.employee) {
      this.getRateTable();
      this.getListItems();
    } else {
      this.loading = false;
    }
  }

  /**
   * Get rate table
   *
   * @private
   * @memberof EmployeeRateTablesComponent
   */
  private getRateTable() {
    this.billingService
      .v1BillingRatePersonPersonIdGet({
        personId: this.employee.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        }),
        finalize(() => {})
      )
      .subscribe(
        res => {
          this.rateList = res;
          this.originalRateList = [...this.rateList];

          this.assignRangeSliderProperties();
          this.loading = false;
        }, error => {
          this.loading = false;
        }
      );
  }

  private assignRangeSliderProperties() {
    if (this.rateList && this.rateList.length > 0) {
      this.rate_min = _.minBy(this.rateList, a => a.rateAmount).rateAmount;
    this.rate_max = _.maxBy(this.rateList, a => a.rateAmount).rateAmount;
    this.rateMin = this.rate_min;
    this.rateMax = this.rate_max;
    this.rateOptions.floor = this.rateMin;
    this.rateOptions.ceil = this.rateMax;
    this.rateOptions = { ...this.rateOptions };
  }

}


  private getListItems() {
    forkJoin([
      this.billingService.v1BillingBillingtoListGet().pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwIdCodeName>;
        })
      ),
      this.billingService.v1BillingBillingtypeListGet().pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwIdCodeName>;
        })
      )
    ]).subscribe(res => {
      this.billingToList = res[0];
      this.billingTypeList = res[1];
    });
  }

  applyFilter() {
    let rows = [...this.originalRateList];
    if (this.billType) {
      rows = rows.filter(a => a.billingType.id == this.billType);
    }

    if (this.billingTo) {
      rows = rows.filter(a => a.billingTo.id == this.billingTo);
    }

    if (this.rateMin) {
      rows = rows.filter(a => a.rateAmount >= this.rateMin);
    }

    if (this.rateMax) {
      rows = rows.filter(a => a.rateAmount <= this.rateMax);
    }

    if (this.description && this.description.trim() != '') {
      rows = rows.filter(
        a =>
          (a.description || '')
            .toLowerCase()
            .includes(this.description.toLowerCase()) ||
          (a.code || '').toLowerCase().includes(this.description.toLowerCase())
      );
    }

    this.rateList = rows;
  }

  customizeRate() {
    if (this.selectedRate) {
      let modalRef = this.modalService.open(CustomizeMatterRateComponent, {
        centered: true,
        backdrop: 'static',
        keyboard: false
      });

      modalRef.componentInstance.rate = this.selectedRate;

      modalRef.result.then(res => {
        console.log(res);
      });
    }
  }
}
