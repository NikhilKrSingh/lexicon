import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwEmployee } from 'src/common/swagger-providers/models';

@Component({
  selector: 'app-profile-info-details',
  templateUrl: './profile-info-details.component.html'
})
export class EmployeeProfileInfoDetailsComponent implements OnInit, OnChanges {
  @Input() employee: vwEmployee;
  @Input() permissionList: any = {};
  @Output() readonly openEditModel = new EventEmitter<string>();
  @Output() readonly reloadEmployee = new EventEmitter();

  alltabs1 = [
    'Matters',
    'Base Rate',
    'Reporting Relations',
    'Groups',
    'Notes'
  ];

  public selecttabs1 = this.alltabs1[0];
  public closeResult: string;
  public title1 = 'All';
  public showLess = false;
  public showMore = false;

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.selecttabs1 = this.alltabs1[0];
      }
    });
  }

  ngOnInit() {}

  ngOnChanges() {
    if (this.permissionList && this.permissionList.MATTER_MANAGEMENTisNoVisibility) {
      const cindex = UtilsHelper.getIndex('Matters', this.alltabs1);
      this.alltabs1.splice(cindex, 1);
      this.selecttabs1 = this.alltabs1[0];
    }

    if (this.permissionList && !this.permissionList.ACCESS_MANAGEMENTisAdmin) {
      const cindex = UtilsHelper.getIndex('Groups', this.alltabs1);
      this.alltabs1.splice(cindex, 1);
      this.selecttabs1 = this.alltabs1[0];
    }
  }

  /**
   * Open edit model
   *
   */
  public openModel(item: string) {
    this.openEditModel.emit(item);
  }

  public reloadEmployeeDetails() {
    this.reloadEmployee.emit();
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
