import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { jwtValidation } from 'src/common/CommonService/jwtValidation.service';
import { FormControl } from '@angular/forms';
import { Page } from '../../modules/models/page';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as Constant from 'src/app/modules/shared/const';
import { CommonService } from 'src/app/service/common.service';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { AuthService, TenantService, CalendarService } from 'src/common/swagger-providers/services';
import { SharedService } from 'src/app/modules/shared/sharedService';

@Component({
  selector: 'app-change-tenant',
  templateUrl: './change-tenant.component.html',
  styleUrls: ['./change-tenant.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ChangeTenantComponent implements OnInit {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  tenantList: any = [];
  oriArr: any = [];
  tenantId: any;
  loading: boolean = true;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pangeSelected = 1;
  public counter = Array;
  public ColumnMode = ColumnMode;
  public messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound
  };
  token: any;
  constructor(
    public JWTservice: jwtValidation,
    public commonService: CommonService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private tenantService: TenantService,
    private sharedService: SharedService,
    private calendarService: CalendarService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    this.getTenantList();
  }

  getTenantList() {
    this.loading = true;
    let token = localStorage.getItem('jwtToken');
    this.token = token;
    let email = JSON.parse(localStorage.getItem('profile')).email;
    this.tenantId = localStorage.getItem('tenantId');
    this.JWTservice.getAllTenant(token, email).subscribe(
      res => {
        if (res && res.status !== 500 && res.status !== 400) {
          this.tenantList = res['results'];
          this.oriArr = res['results'];
          this.updateDatatableFooterPage();
          this.loading = false;
        }
      },
      error => {
        this.loading = false;
      }
    );
  }


  /**
   * Change per page size
   *
   * @memberof ListComponent
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  /**
   * Change page number
   *
   * @memberof ListComponent
   */
  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    }
    UtilsHelper.aftertableInit();
  }

  /**
   * Handle change page number
   *
   * @param {*} e
   * @memberof ListComponent
   */
  public pageChange(e) {
    this.pangeSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.tenantList.length;
    this.page.totalPages = Math.ceil(this.tenantList.length / this.page.size);
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
  }

  public searchFilter(event) {
    const val = event.target.value;
    const temp = this.oriArr.filter(
      item =>
        this.matchName(item, val, 'email') ||
        this.matchName(item, val, 'tenantName') ||
        this.matchName(item, val, 'customDomain')
    );
    this.tenantList = temp;
    this.updateDatatableFooterPage();
  }
  private matchName(item: any, searchValue: string, fieldName): boolean {
    let searchName = item[fieldName]
      ? item[fieldName].toString().toUpperCase()
      : '';
    return searchName.search(searchValue.toUpperCase().replace(/\s*,\s*/g, ",")) > -1;
  }

  public connectWithOtherTenant(row) {
    const logindata = {
      customDomain: row.customDomain,
      userName: row.email,
      isRememberMe: false,
      connectionString: row.connectionString,
      reportingConnectionString: row.reportingConnectionString
    };
    this.loading = true;
    this.authService
      .v1AuthExternalAuthPost$Json({ body: logindata })
      .subscribe(
        s => {
          const res = JSON.parse(s as any);
          if (res.status !== 500 && res.status !== 400) {
            let path = 'https://' + logindata.customDomain + '/login?returnUrl=change-tenant&tknlgn=' + res.token;
            window.location.href = path;
            localStorage.clear();
          }
        },
        err => {
        }
      );
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.tenantList) {
      return this.tenantList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
