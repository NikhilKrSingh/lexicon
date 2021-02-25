import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import * as _ from 'lodash';
import { AuthGuard } from 'src/app/guards/auth-guard.service';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { ReportService } from 'src/common/swagger-providers/services';
import { arByCriteriaReportModels } from '../../models/ar-criteria.model';

@Component({
  selector: 'app-ar-criteria',
  templateUrl: './ar-criteria.component.html',
  styleUrls: ['./ar-criteria.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ArCriteriaComponent implements OnInit {
  arCriteriaReportForm: FormGroup;
  public rows: Array<any> = [];
  public columnList: any = [];
  public matterList = [];
  public responsibleAttorneyList = [];
  public billingAttorneyList = [];
  public timeKeeperList = [];
  public officeList = [];
  public practiceAreaList = [];
  public matterTypeList = [];
  public officeDisable: boolean = true;
  public isBillingOrResponsibleAttorney: boolean = false;
  public practiceAreaDisableFlag: boolean = false;
  public loading: boolean = false;
  constructor(
    private formBuilder: FormBuilder,
    private reportService: ReportService,
    private exporttocsvService: ExporttocsvService,
    private auth: AuthGuard,
    private pagetitle: Title
  ) { }

  ngOnInit() {
    this.pagetitle.setTitle("AR by Criteria Report");
    this.arCriteriaReport();
    this.checkPowerUser();
  }
  async checkPowerUser() {
    const permissions: any = await this.auth.getPermissions();
    if (permissions.ACCOUNTINGisAdmin || permissions.ACCOUNTINGisEdit
      || permissions.BILLING_MANAGEMENTisAdmin
      || permissions.BILLING_MANAGEMENTisEdit) {
      this.isBillingOrResponsibleAttorney = false;
      this.GetMatters();
    }
    else {
      this.isBillingOrResponsibleAttorney = true;
      this.GetMatters();
    }
  }

  arCriteriaReport() {
    this.arCriteriaReportForm = this.formBuilder.group({
      arReportDate: ['', Validators.required],
      agingBracket: new FormControl('1'),
      selectedBillingAttorney: [],
      selectedResponsibleAttorney: [],
      selectedMatterName: [],
      selectedtimeKeeper: [],
      selectedOffice: [],
      selectedpracticeArea: [],
      selectedmatterType: [],
    });
    this.arCriteriaReportForm.controls['arReportDate'].setValue(this.currentDate());
  }
  submitARCriteriaReport() {
    let data: any = new arByCriteriaReportModels();
    data.arReportDate = this.arCriteriaReportForm.value['arReportDate'];
    data.matter = this.arCriteriaReportForm.value['agingBracket'] == '1' ? true : false;
    data.responsibleAttorney = this.arCriteriaReportForm.value['agingBracket'] == '2' ? true : false;
    data.billingAttorney = this.arCriteriaReportForm.value['agingBracket'] == '3' ? true : false;
    data.timekeeper = this.arCriteriaReportForm.value['agingBracket'] == '4' ? true : false;
    data.office = this.arCriteriaReportForm.value['agingBracket'] == '5' ? true : false;
    data.practiceArea = this.arCriteriaReportForm.value['agingBracket'] == '6' ? true : false;
    data.matterType = this.arCriteriaReportForm.value['agingBracket'] == '7' ? true : false;
    data.groupCodeId = 0;
    var BillingAttorney = this.arCriteriaReportForm.value['selectedBillingAttorney'];
    var ResponsibleAttorney = this.arCriteriaReportForm.value['selectedResponsibleAttorney'];
    var MatterName = this.arCriteriaReportForm.value['selectedMatterName'];
    var timeKeeper = this.arCriteriaReportForm.value['selectedtimeKeeper'];
    var Office = this.arCriteriaReportForm.value['selectedOffice'];
    var practiceArea = this.arCriteriaReportForm.value['selectedpracticeArea'];
    var matterType = this.arCriteriaReportForm.value['selectedmatterType']

    if (BillingAttorney != null) {
      data.groupFilter = BillingAttorney
    }
    else if (ResponsibleAttorney != null) {
      data.groupFilter = ResponsibleAttorney
    }
    else if (MatterName != null) {
      data.groupFilter = MatterName
    }
    else if (timeKeeper != null) {
      data.groupFilter = timeKeeper
    }
    else if (Office != null) {
      data.groupFilter = Office
    }
    else if (practiceArea != null) {
      data.groupFilter = practiceArea
    }

    else if (matterType != null) {
      data.groupFilter = matterType
    }
    else if (BillingAttorney == null && ResponsibleAttorney == null && MatterName == null && timeKeeper == null && Office == null && practiceArea == null && matterType == null) {
      data.groupFilter = null;
    }
    this.loading = true;
    this.reportService.v1ReportArByCriteriaPost$Json$Response({ body: data })
      .subscribe((suc: {}) => {
        this.loading = false;
        const res: any = suc;
        if (res && res.body) {
          var records = JSON.parse(res.body);
          this.rows = [...records.results];
          if (this.rows.length > 0) {
            const keys = Object.keys(this.rows[0]);
            this.addkeysIncolumnlist(keys);
          } else if (data.matter == true && this.rows.length == 0) {
            var columnListHeader = ['MatterNumber', 'MatterName', 'arBalance'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          } else if (data.responsibleAttorney == true && this.rows.length == 0) {
            var columnListHeader = ['attorneyId', 'AttorneyName', 'arBalance'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          } else if (data.billingAttorney == true && this.rows.length == 0) {
            var columnListHeader = ['attorneyId', 'AttorneyName', 'arBalance'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          } else if (data.timekeeper == true && this.rows.length == 0) {
            var columnListHeader = ['TimekeeperID', 'TimekeeperName', 'arBalance'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          } else if (data.office == true && this.rows.length == 0) {
            var columnListHeader = ['OfficeName', 'arBalance'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          } else if (data.practiceArea == true && this.rows.length == 0) {
            var columnListHeader = ['PracticeArea', 'arBalance'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          } else if (data.matterType == true && this.rows.length == 0) {
            var columnListHeader = ['MatterType', 'arBalance'];
            const keys = columnListHeader;
            this.addkeysIncolumnlist(keys);
          }
        }
        this.ExportToCSV('Ar by Criteria');
        console.log(res);
      },(err)=>{
        this.loading = false;
      });
  }
  addkeysIncolumnlist(keys: any[] | string[]) {
    this.columnList = [];
    for (let i = 0; i < keys.length; i++) {
      if(keys[i]=="attorneyId"){
        this.columnList.push({
          Name: keys[i],
          displayName:'Attorney ID'
        });
      }else if(keys[i]=="arBalance"){
        this.columnList.push({
          Name: keys[i],
          displayName: 'AR Balance'
        });
      }else{
        this.columnList.push({
          Name: keys[i],
          displayName: keys[i] = _.startCase(keys[i])
        });
      }     
    }
  }
  ExportToCSV(fileName) {
    const temprows = JSON.parse(JSON.stringify(this.rows));
    const selectedrows = Object.assign([], temprows);
    this.exporttocsvService.downloadReportFile(
      selectedrows,
      this.columnList,
      fileName
    );
  }
  GetColumnHeaderList() {
    return [];
  }
  currentDate() {
    const currentDate = new Date();
    return currentDate.toISOString().substring(0, 10);
  }
  matterChange(event) {
    if (this.matterList.length == 0) {
      this.GetMatters();
    }
    this.arCriteriaReportForm.controls['selectedBillingAttorney'].setValue(null);
    this.arCriteriaReportForm.controls['selectedResponsibleAttorney'].setValue(null);
    this.arCriteriaReportForm.controls['selectedtimeKeeper'].setValue(null);
    this.arCriteriaReportForm.controls['selectedOffice'].setValue(null);
    this.arCriteriaReportForm.controls['selectedpracticeArea'].setValue(null);
    this.arCriteriaReportForm.controls['selectedmatterType'].setValue(null);
    this.responsibleAttorneyList = [];
    this.billingAttorneyList = [];
    this.timeKeeperList = [];
    this.officeList = [];
    this.practiceAreaList = [];
    this.matterTypeList = [];
  }
  GetMatters() {
    return this.reportService.v1ReportGetAllMattersGet$Response({ isRAorBa: this.isBillingOrResponsibleAttorney }).subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.matterList = parsedRes.results;
          if (this.matterList.length == 0) {
            this.matterList = [];
          }
        }
      }
    })
  }
  responsibleAttorneyChange() {
    if (this.responsibleAttorneyList.length == 0) {
      this.getResponsibleAttorney();
    }
    this.arCriteriaReportForm.controls['selectedBillingAttorney'].setValue(null);
    this.arCriteriaReportForm.controls['selectedMatterName'].setValue(null);
    this.arCriteriaReportForm.controls['selectedtimeKeeper'].setValue(null);
    this.arCriteriaReportForm.controls['selectedOffice'].setValue(null);
    this.arCriteriaReportForm.controls['selectedpracticeArea'].setValue(null);
    this.arCriteriaReportForm.controls['selectedmatterType'].setValue(null);
    this.matterList = [];
    this.billingAttorneyList = [];
    this.timeKeeperList = [];
    this.officeList = [];
    this.practiceAreaList = [];
    this.matterTypeList = [];
  }
  getResponsibleAttorney() {
    return this.reportService.v1ReportGetResponsibleAttorneyGet$Response({ isRAorBa: this.isBillingOrResponsibleAttorney }).subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.responsibleAttorneyList = parsedRes.results;
          if (this.responsibleAttorneyList.length == 0) {
            this.responsibleAttorneyList = [];
          }
        }
      }
    })
  }
  billingAttorneyChange() {
    if (this.billingAttorneyList.length == 0) {
      this.getbillingAttorney();
    }
    this.arCriteriaReportForm.controls['selectedResponsibleAttorney'].setValue(null);
    this.arCriteriaReportForm.controls['selectedMatterName'].setValue(null);
    this.arCriteriaReportForm.controls['selectedtimeKeeper'].setValue(null);
    this.arCriteriaReportForm.controls['selectedOffice'].setValue(null);
    this.arCriteriaReportForm.controls['selectedpracticeArea'].setValue(null);
    this.arCriteriaReportForm.controls['selectedmatterType'].setValue(null);
    this.matterList = [];
    this.responsibleAttorneyList = [];
    this.timeKeeperList = [];
    this.officeList = [];
    this.practiceAreaList = [];
    this.matterTypeList = [];
  }
  getbillingAttorney() {
    return this.reportService.v1ReportGetBillingAttorneyGet$Response({ isRAorBa: this.isBillingOrResponsibleAttorney }).subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.billingAttorneyList = parsedRes.results;
          if (this.billingAttorneyList.length == 0) {
            this.billingAttorneyList = [];
          }
        }
      }
    })
  }
  timekeeperChange(event) {
    if (this.timeKeeperList.length == 0) {
      this.GetTimekeepers();
    }
    this.arCriteriaReportForm.controls['selectedBillingAttorney'].setValue(null);
    this.arCriteriaReportForm.controls['selectedResponsibleAttorney'].setValue(null);
    this.arCriteriaReportForm.controls['selectedMatterName'].setValue(null);
    this.arCriteriaReportForm.controls['selectedOffice'].setValue(null);
    this.arCriteriaReportForm.controls['selectedpracticeArea'].setValue(null);
    this.arCriteriaReportForm.controls['selectedmatterType'].setValue(null);
    this.matterList = [];
    this.responsibleAttorneyList = [];
    this.billingAttorneyList = [];
    this.officeList = [];
    this.practiceAreaList = [];
    this.matterTypeList = [];
  }
  GetTimekeepers() {
    return this.reportService.v1ReportGetAllTimeKeepersArByCriteriaGet$Response({ isRAorBa: this.isBillingOrResponsibleAttorney }).subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.timeKeeperList = parsedRes.results;
          if (this.timeKeeperList.length == 0) {
            this.timeKeeperList = [];
          }
        }
      }
    })
  }
  officeChange(event) {
    if (this.officeList.length == 0) {
      this.GetOffice();
    }
    this.arCriteriaReportForm.controls['selectedBillingAttorney'].setValue(null);
    this.arCriteriaReportForm.controls['selectedResponsibleAttorney'].setValue(null);
    this.arCriteriaReportForm.controls['selectedMatterName'].setValue(null);
    this.arCriteriaReportForm.controls['selectedtimeKeeper'].setValue(null);
    this.arCriteriaReportForm.controls['selectedpracticeArea'].setValue(null);
    this.arCriteriaReportForm.controls['selectedmatterType'].setValue(null);
    this.practiceAreaDisableFlag = false;
    this.matterList = [];
    this.responsibleAttorneyList = [];
    this.billingAttorneyList = [];
    this.timeKeeperList = [];
    this.practiceAreaList = [];
    this.matterTypeList = [];
  }
  GetOffice() {
    return this.reportService.v1ReportGetAllOfficesGet$Response().subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.officeList = parsedRes.results;
          if (this.officeList.length == 0) {
            this.officeList = [];
          }
        }
      }
    })
  }
  practiceAreaChanege($event) {
    if (this.practiceAreaList.length == 0) {
      this.getPracticeArea();
    }
    this.arCriteriaReportForm.controls['selectedBillingAttorney'].setValue(null);
    this.arCriteriaReportForm.controls['selectedResponsibleAttorney'].setValue(null);
    this.arCriteriaReportForm.controls['selectedMatterName'].setValue(null);
    this.arCriteriaReportForm.controls['selectedtimeKeeper'].setValue(null);
    this.arCriteriaReportForm.controls['selectedOffice'].setValue(null);
    this.arCriteriaReportForm.controls['selectedmatterType'].setValue(null);
    this.matterList = [];
    this.responsibleAttorneyList = [];
    this.billingAttorneyList = [];
    this.timeKeeperList = [];
    this.officeList = [];
    this.matterTypeList = [];
  }
  getPracticeArea() {
    return this.reportService.v1ReportGetAllPracticeAreasGet$Response().subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.practiceAreaList = parsedRes.results;
          if (this.practiceAreaList.length == 0) {
            this.practiceAreaList = [];
          }
        }
      }
    })
  }
  matterTypeChanege($event) {
    if (this.matterTypeList.length == 0) {
      this.getMatterType();
    }
    this.arCriteriaReportForm.controls['selectedBillingAttorney'].setValue(null);
    this.arCriteriaReportForm.controls['selectedResponsibleAttorney'].setValue(null);
    this.arCriteriaReportForm.controls['selectedMatterName'].setValue(null);
    this.arCriteriaReportForm.controls['selectedtimeKeeper'].setValue(null);
    this.arCriteriaReportForm.controls['selectedOffice'].setValue(null);
    this.arCriteriaReportForm.controls['selectedpracticeArea'].setValue(null);
    this.matterList = [];
    this.responsibleAttorneyList = [];
    this.billingAttorneyList = [];
    this.timeKeeperList = [];
    this.officeList = [];
    this.practiceAreaList = [];
  }
  getMatterType() {
    return this.reportService.v1ReportGetAllMatterTypesGet$Response().subscribe((data: {}) => {
      const res: any = data;
      if (res && res.body) {
        var parsedRes = JSON.parse(res.body);
        if (parsedRes != null) {
          this.matterTypeList = parsedRes.results;
          if (this.matterTypeList.length == 0) {
            this.matterTypeList = [];
          }
        }
      }
    })
  }
}
