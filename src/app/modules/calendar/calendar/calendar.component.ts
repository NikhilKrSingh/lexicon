import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit{
  public matterName: string = null;
  public employeeName: string = null;
  public matterId: number;
  public employeeId: number;

  constructor(
    private activatedRoute: ActivatedRoute
  ) {
    this.matterName = this.activatedRoute.snapshot.queryParams.matterName;
    this.employeeName = this.activatedRoute.snapshot.queryParams.employeeName;
    this.matterId = this.activatedRoute.snapshot.queryParams.matterId;
    this.employeeId = this.activatedRoute.snapshot.queryParams.employeeId;
  }


  ngOnInit() {
  }
}
