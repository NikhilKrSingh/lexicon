import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import * as errorData from '../../shared/error.json';

@Component({
  selector: 'app-wip-aging-report',
  templateUrl: './wip-aging-report.component.html',
  styleUrls: ['./wip-aging-report.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class WipAgingReportComponent implements OnInit {
  public ageBucketList: any[] = [
    { id : 1, name: '30+'},
    { id : 2, name: '60+'},
    { id : 3, name: '90+'},
    { id : 4, name: '120+'},
    { id : 5, name: '180+'}
  ];

  public selectedAge: number = 4;
  public loading: boolean = false;

  public reportFor: any[] = [
    { code: 1, name: 'Responsible Attorney' },
    { code: 2, name: 'Billing Attorney' }
  ];
  public reportBy: any[] = [
    { code: 1, name: 'Attorney/Office/Practice Area/Matter Type' },
    { code: 2, name: 'Attorney/Client/Matter' }
  ];
  public startDateError: boolean = false;
  public formSubmitted: boolean = false;
  public errorData: any = (errorData as any).default;
  public rollUpForm: FormGroup;
  public defaultBody: any;
  public columnListClient: any[] = [
    {
      Name: 'attorneyName',
      displayName: 'Attorney Name'
    },
    {
      Name: 'clientNumber',
      displayName: 'Client Number'
    },
    {
      Name: 'clientName',
      displayName: 'Client Name'
    },
    {
      Name: 'matterNumber',
      displayName: 'Matter Number'
    },
    {
      Name: 'matterName',
      displayName: 'Matter Name'
    },
    {
      Name: 'wipCurrent',
      displayName: 'WIP Current'
    }
  ];

  public columnListOffice = [
    {
      Name: 'attorneyName',
      displayName: 'Attorney Name'
    },
    {
      Name: 'officeName',
      displayName: 'Office Name'
    },
    {
      Name: 'practiceArea',
      displayName: 'Practice Area'
    },
    {
      Name: 'matterType',
      displayName: 'Matter Type'
    },
    {
      Name: 'wipCurrent',
      displayName: 'WIP Current'
    }
  ];

  public body = {}
  public isPowerFlag: any = false;
  public asOfDate: Date = new Date();
  public asOfDateThreshold: Date = new Date();
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private store: Store<fromRoot.AppState>,
  ) {
    this.permissionList$ = this.store.select('permissions');
  }
  ngOnInit() {
    this.rollUpForm = this.fb.group({
      selectedRefundFor: [2, Validators.required],
      selectedRefundBy: [2, Validators.required]
    });
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          const permissionLIst = obj.datas;
          if (permissionLIst.ACCOUNTINGisAdmin || permissionLIst.ACCOUNTINGisEdit
            || permissionLIst.BILLING_MANAGEMENTisAdmin
            || permissionLIst.BILLING_MANAGEMENTisEdit) {
            this.isPowerFlag = true;
          }
        }
      }
    });
  }

  public generateWipAgeReport() {
    let body: any = null;
    this.formSubmitted = true;
    if(!this.selectedAge || this.rollUpForm.invalid || !this.asOfDate) {
      return;
    }

    body = this.createRequestBody();
    this.generateReport(body);
    this.formSubmitted = false;
  }

  public selectRefundFor(event) {
    console.log(event);
  }

  public async generateReport(body) {
    let columnList: any = null;
    let resp:any = null;
    this.loading = true;
    try {
      resp = await this.reportService
        .v1ReportWipAgingReportPost$Json({body})
        .toPromise();
      resp = JSON.parse(resp as any).results;
      if(this.rollUpForm.get('selectedRefundBy').value == 2) {
        columnList = [...this.columnListClient];
        if(this.selectedAge == 1) {
          columnList.push(...[{
              Name: 'wiP30Plus',
              displayName: 'WIP 30-59'
            }]);
        } else  if(this.selectedAge == 2) {
          columnList.push(...[
            {
              Name: 'wiP30_59',
              displayName: 'WIP 30-59'
            },
            {
              Name: 'wiP60Plus',
              displayName: 'WIP 60-89'
            }
          ]);
        } else  if(this.selectedAge == 3) {
          columnList.push(...[
            {
              Name: 'wiP30_59',
              displayName: 'WIP 30-59'
            },
            {
              Name: 'wiP60_89',
              displayName: 'WIP 60-89'
            },
            {
              Name: 'wiP90Plus',
              displayName: 'WIP 90-119'
            }
          ]);
        } else  if(this.selectedAge == 4) {
          columnList.push(...[
            {
              Name: 'wiP30_59',
              displayName: 'WIP 30-59'
            },
            {
              Name: 'wiP60_89',
              displayName: 'WIP 60-89'
            },
            {
              Name: 'wiP90_120',
              displayName: 'WIP 90-119'
            },
            {
              Name: 'wiP120Plus',
              displayName: 'WIP 120-179'
            },
          ]);
        } else  if(this.selectedAge == 5) {
          columnList.push(...[
            {
              Name: 'wiP30_59',
              displayName: 'WIP 30-59'
            },
            {
              Name: 'wiP60_89',
              displayName: 'WIP 60-89'
            },
            {
              Name: 'wiP90_120',
              displayName: 'WIP 90-119'
            },
            {
              Name: 'wiP120_180',
              displayName: 'WIP 120-179'
            },
            {
              Name: 'wiP180Plus',
              displayName: 'WIP 180+'
            }
          ]);
        }
      } else {
        columnList = [...this.columnListOffice];
        if(this.selectedAge == 1) {
          columnList.push(...[{
              Name: 'wiP30Plus',
              displayName: 'WIP 30-59'
            }]);
        } else  if(this.selectedAge == 2) {
          columnList.push(...[
            {
              Name: 'wiP30_59',
              displayName: 'WIP 30-59'
            },
            {
              Name: 'wiP60Plus',
              displayName: 'WIP 60-89'
            }
          ]);
        } else  if(this.selectedAge == 3) {
          columnList.push(...[
            {
              Name: 'wiP30_59',
              displayName: 'WIP 30-59'
            },
            {
              Name: 'wiP60_89',
              displayName: 'WIP 60-89'
            },
            {
              Name: 'wiP90Plus',
              displayName: 'WIP 90-119'
            }
          ]);
        } else  if(this.selectedAge == 4) {
          columnList.push(...[
            {
              Name: 'wiP30_59',
              displayName: 'WIP 30-59'
            },
            {
              Name: 'wiP60_89',
              displayName: 'WIP 60-89'
            },
            {
              Name: 'wiP90_120',
              displayName: 'WIP 90-119'
            },
            {
              Name: 'wiP120Plus',
              displayName: 'WIP 120-179'
            },
          ]);
        } else  if(this.selectedAge == 5) {
          columnList.push(...[
            {
              Name: 'wiP30_59',
              displayName: 'WIP 30-59'
            },
            {
              Name: 'wiP60_89',
              displayName: 'WIP 60-89'
            },
            {
              Name: 'wiP90_120',
              displayName: 'WIP 90-119'
            },
            {
              Name: 'wiP120_180',
              displayName: 'WIP 120-179'
            },
            {
              Name: 'wiP180Plus',
              displayName: 'WIP 180+'
            }
          ]);
        }

      }
      this.ExportToCSV('wip-aging-report', resp, columnList);
      this.loading = false;
    } catch (error) {
      this.loading = false;
    }
  }

  public createRequestBody() {
    this.defaultBody = {
      agingBracket120Plus: false,
      agingBracket180Plus: false,
      agingBracket30: false,
      agingBracket60: false,
      agingBracket90: false,
      agingBracketCurrent: false,
      dateAsOf: moment(this.asOfDate + 'Z').format('YYYY-MM-DDThh:mm:ss'),
      isRollupByOffice: false,
      isRollupByResponsibleAttorney: false,
      powerUserFlag: this.isPowerFlag,
      tenantId: +localStorage.getItem("tenantId")
    }
    if(this.selectedAge == 1) {
      this.defaultBody.agingBracket30 = true;
    } else if(this.selectedAge == 2) {
      this.defaultBody.agingBracket60 = true;
    } else if(this.selectedAge == 3) {
      this.defaultBody.agingBracket90 =true;
    } else if(this.selectedAge == 4) {
      this.defaultBody.agingBracket120Plus = true;
    } else  {
      this.defaultBody.agingBracket180Plus = true;
    }

    if(this.rollUpForm.get('selectedRefundFor').value == 1) {
      this.defaultBody.isRollupByResponsibleAttorney = true;
    }

    if(this.rollUpForm.get('selectedRefundBy').value == 1) {
      this.defaultBody.isRollupByOffice = true;
    }

    return this.defaultBody;
  }

  ExportToCSV(fileName, rows, columnList) {
    const selectedrows = Object.assign([], rows);
    console.log(selectedrows);
    this.exporttocsvService.downloadReportFile(
      selectedrows,
      columnList,
      fileName
    );
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj['code'] || obj : index ;
  }
}
