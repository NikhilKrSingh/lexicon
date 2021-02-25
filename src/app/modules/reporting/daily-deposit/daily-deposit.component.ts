import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { vwDailyDepositReportRequest } from 'src/common/swagger-providers/models';
import { ReportService } from 'src/common/swagger-providers/services';
import * as errors from 'src/app/modules/shared/error.json';
@Component({
  selector: 'app-daily-deposit',
  templateUrl: './daily-deposit.component.html',
  styleUrls: ['./daily-deposit.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DailyDepositComponent implements OnInit {
  public loading: boolean = true;
  public bankAccountList: Array<any> = [];
  public postingDate: string;
  public selectedAccountList: Array<any> = [];
  public officeList: Array<any> = [];
  public officeTitle: any = 'All';
  public selectedOffice: Array<number> = [];
  public officeFilterName = 'Apply Filter';
  public officeMessage = 'offices selected';

  public placeholder =
    'Search operating, trust, or credit card trust bank account';
  public filterName = 'Select bank account';
  public selectedMessage = 'bank accounts selected';
  public title: any = 'All';
  public officeFlag: boolean;
  public bankFlag: boolean;

  error_data = (errors as any).default;

  submitted = false;

  accountErrorMsg = null;
  officeErrorMsg = null;
  postingDateMsg = null;

  fromAccounting = false;

  dateFilter = (d: Date)  => {
    return moment().isSameOrAfter(moment(d), 'd');
  }

  constructor(
    private reportService: ReportService,
    private pagetitle: Title,
    private modalService: NgbModal,
    private activatedRoute: ActivatedRoute
  ) {
    this.pagetitle.setTitle('Daily Deposit Report');
    this.postingDate = new Date().toJSON();

    this.activatedRoute.queryParams.subscribe(params => {
      this.fromAccounting = params['from'] == 'accounting';
    });
  }

  ngOnInit() {
    this.getdata();
  }

  submitDailyDepositReport(noResultsTemplate) {
    this.submitted = true;

    this.validateBankAccountList();
    this.validateOfficeList();
    this.validatePostingDate();

    if (this.postingDateMsg || this.officeErrorMsg || this.accountErrorMsg) {
      return;
    }

    const data: vwDailyDepositReportRequest = {
      officeIds: this.selectedOffice,
      bankAccountIds: this.selectedAccountList,
      postingDate: this.postingDate,
    };

    this.loading = true;

    this.reportService
      .v1ReportDailyDepositReportPost$Json({ body: data })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res: any) => {
        const response = JSON.parse(res).results;
        if (response) {
          this.exportToPdf(response);
        } else {
          this.modalService.open(noResultsTemplate, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: '',
          });
        }
      });
  }

  validatePostingDate() {
    if (!this.postingDate) {
      this.postingDateMsg = this.error_data.posting_date_select_error;
    } else {
      this.postingDateMsg = null;
    }
  }

  validateOfficeList() {
    if (this.selectedOffice.length == 0) {
      this.officeErrorMsg = this.error_data.office_select_error;
    } else {
      this.officeErrorMsg = null;
    }
  }

  validateBankAccountList() {
    if (this.selectedAccountList.length == 0) {
      this.accountErrorMsg = this.error_data.bank_account_select_error;
    } else {
      this.accountErrorMsg = null;
    }
  }

  exportToPdf(base64: any) {
    let file = UtilsHelper.base64toFile(
      base64,
      `deposits-${moment(this.postingDate).format('MMDDYYYY')}.pdf`,
      'application/pdf'
    );
    saveAs(file);
  }

  private getdata() {
    forkJoin([
      this.reportService.v1ReportAllBankAccountsWithOfficeGet$Response(),
      this.reportService.v1ReportGetAllOfficesGet$Response(),
    ])
      .pipe(
        map((res) => {
          return {
            bankAccountList: JSON.parse((res[0] as any).body).results || [],
            offcieList: JSON.parse((res[1] as any).body).results || [],
          };
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        this.bankAccountList = res.bankAccountList || [];
        this.bankAccountList.map((item, index) => {
          this.bankAccountList[index].checked = true;
          this.selectedAccountList.push(item.id);
        });
        if (this.bankAccountList.length) {
          this.bankFlag = true;
        }

        this.officeList = res.offcieList || [];

        this.officeList.map((item, index) => {
          this.officeList[index].id = item.officeId;
          this.officeList[index].name = item.officeName;
          this.officeList[index].checked = true;
          this.selectedOffice.push(item.id);
        });
        if (this.officeList.length) {
          this.officeFlag = true;
        }
      });
  }

  getBanksSelected(event: any) {
    this.selectedAccountList = [];
    if (!event.length) {
      this.title = 0;
      this.bankFlag = false;
    } else {
      this.selectedAccountList = event;
      this.title =
        event.length == this.bankAccountList.length ? 'All' : event.length;
      this.bankFlag = true;
    }
    this.validateBankAccountList();
  }

  getOfficesSelected(event: any) {
    this.selectedOffice = [];
    if (!event.length) {
      this.officeTitle = 0;
      this.officeFlag = false;
    } else {
      this.selectedOffice = event;
      this.officeTitle =
        event.length == this.officeList.length ? 'All' : event.length;
      this.officeFlag = true;
    }

    this.validateOfficeList();
  }

  onMultiSelectSelectedOptions(event: any) {}

  clrBankList() {
    this.selectedAccountList = [];
    this.title = 0;
    this.bankAccountList.forEach((item) => (item.checked = false));
    this.bankFlag = false;
    this.validateBankAccountList();
  }

  applyBankFilter(event: any) {}

  public clearFilterPrimaryOffice() {
    this.selectedOffice = [];
    this.officeList.forEach((item) => (item.checked = false));
    this.officeTitle = 0;
    this.officeFlag = false;

    this.validateOfficeList();
  }
}
