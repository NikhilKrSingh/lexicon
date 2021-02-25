import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import * as _ from 'lodash';
import { finalize, map } from 'rxjs/operators';
import { BillingService } from 'src/common/swagger-providers/services';
import {
  vwBillingCodeRange,
  vwBillingCodeRangeModel
} from '../../models/used-billing-code.model';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-billing-code-ranges',
  templateUrl: './billing-code-ranges.component.html',
  styleUrls: ['./billing-code-ranges.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class BillingCodeRangesComponent implements OnInit {
  private billingCodeRanges: vwBillingCodeRange[];
  public data: Array<vwBillingCodeRangeModel>;

  loading = true;

  constructor(private billingService: BillingService, private title: Title) {
    this.data = [];
    this.title.setTitle('Code Ranges');
  }

  ngOnInit() {
    this.billingService
      .v1BillingBillingCodeRangesGet()
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        this.billingCodeRanges = res || [];

        this.prepareData();
        this.loading = false;
      }, () => {
        this.loading = false;
      });
  }

  private prepareData() {
    if (this.billingCodeRanges) {
      let data = [];

      let codes = _.groupBy(
        this.billingCodeRanges,
        (a) => a.billingCodeCategory
      );
      for (let category in codes) {
        data.push({
          category: category,
          codes: codes[category],
        });
      }

      this.data = data;
    }
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
