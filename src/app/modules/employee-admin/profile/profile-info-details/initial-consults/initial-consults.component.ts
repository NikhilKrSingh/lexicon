import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { vwEmployee } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-employee-profile-initial-consults',
  templateUrl: './initial-consults.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class EmployeeProfileInitialConsultsComponent implements OnInit {
  @Input() employee: vwEmployee;

  constructor() {}

  ngOnInit() {}
}
