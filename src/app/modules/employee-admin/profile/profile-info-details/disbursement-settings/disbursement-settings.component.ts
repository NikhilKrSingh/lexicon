import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { vwEmployee } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-employee-profile-disbursement-settings',
  templateUrl: './disbursement-settings.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class DisbursementSettingsComponent implements OnInit {
  @Input() employee: vwEmployee;

  constructor() {}

  ngOnInit() {}
}
