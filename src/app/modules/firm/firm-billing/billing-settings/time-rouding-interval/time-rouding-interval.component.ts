import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { SelectService } from 'src/app/service/select.service';
import { vwBillingSettings } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-time-rouding-interval',
  templateUrl: './time-rouding-interval.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class TimeRoudingIntervalComponent implements OnInit {
  @Input() billingSettings: vwBillingSettings;

  constructor(
    private selectService: SelectService
  ) { }

  ngOnInit() {
  }

  timeChange() {
    this.selectService.newSelection('clicked!');
  }

}
