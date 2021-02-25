import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { finalize, map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { vwMatterResponse } from 'src/app/modules/models';
import { Page } from 'src/app/modules/models/page';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { vwMatterAlert } from 'src/common/swagger-providers/models';
import { MatterService } from 'src/common/swagger-providers/services';
import { CreateMatterAlertComponent } from './create-alert/create-alert.component';

@Component({
  selector: 'app-matter-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnInit {
  public matterId: number;
  public matterDetails: vwMatterResponse;

  public matterAlertList: Array<vwMatterAlert>;
  private originalMatterAlertList: Array<vwMatterAlert>;

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected: number = 1;
  public counter = Array;
  public matterStatusArr: Array<any> = [];
  public matterPriorityArr: Array<any> = [];

  @ViewChild(DatatableComponent, {static: false}) table: DatatableComponent;

  loading = true;

  constructor(
    private matterService: MatterService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private toastr: ToastDisplay,
    private dialogService: DialogService
  ) {
    this.matterAlertList = [];
    this.originalMatterAlertList = [];
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  async ngOnInit() {
    this.route.queryParams.subscribe(params => {
      let matterId = params['matterId'];
      this.matterId = +matterId;
      this.getMatterStatuses().then(() => {
        this.getMatterPriorities().then(() => {
          this.getMatterAlerts();
        });
      });
      this.getMatterDetails();
    });
  }

  /**
   * function to get matter statuses
   */
  async getMatterStatuses(): Promise<any> {
    let resp: any = await this.matterService.v1MatterAlertStatusesGet$Response().toPromise();
    this.matterStatusArr = JSON.parse(resp.body as any).results;
  }

  /**
   * function to get matter priorities
   */
  async getMatterPriorities(): Promise<any> {
    let resp: any = await this.matterService.v1MatterAlertPrioritisGet$Response().toPromise();
    this.matterPriorityArr = JSON.parse(resp.body as any).results;
  }

  private getMatterDetails() {
    this.matterService
      .v1MatterMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwMatterResponse;
        }),
        finalize(() => {
        })
      )
      .subscribe(res => {
        this.matterDetails = res;
      });
  }

  /**
   * Change per page size
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.page.totalPages = Math.ceil(
      this.originalMatterAlertList.length / this.page.size
    );
    this.table.offset = 0;
    this.page.pageNumber = 0;
    this.pageSelected = 1;
  }

  /**
   * Change page number
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
  }

  private getMatterAlerts() {
    this.matterService
      .v1MatterAlertListMatterIdGet({
        matterId: this.matterId
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwMatterAlert>;
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(res => {
        this.originalMatterAlertList = res;
        this.matterAlertList = [...this.originalMatterAlertList];
        this.matterAlertList.map(obj => {
          obj['className'] = 'Informational';
          obj['priority'] = 'INFORMATIONAL';
          if (obj.priorityId) {
            const data: any = this.matterPriorityArr.find(
              matter => matter.id === obj.priorityId
            );
            if (data) {
              obj['className'] = data.name === 'Caution' ? 'Urgent' : data.name;
              obj['priority'] = data.code;
            }
          }
        });
        let matterAlertSortedList = this.matterAlertList.filter(item => item['priority'] === 'CAUTION');
        matterAlertSortedList = matterAlertSortedList.concat(this.matterAlertList.filter(item => item['priority'] === 'WARNING'));
        matterAlertSortedList = matterAlertSortedList.concat(this.matterAlertList.filter(item => item['priority'] === 'INFORMATIONAL'));
        this.matterAlertList = matterAlertSortedList;
        this.matterAlertList.forEach((value, index) => {
          this.matterAlertList[index]['status'] = '--';
          if (value.statusId) {
            const data: any = this.matterStatusArr.filter(matter => matter.id == value.statusId);
            this.matterAlertList[index]['status'] = data[0].name;
          }
        });
        this.page.totalElements = this.originalMatterAlertList.length;
        this.page.totalPages = Math.ceil(
          this.originalMatterAlertList.length / this.page.size
        );
      });
  }

  createMatterAlert() {
    let modalRef = this.modalService.open(CreateMatterAlertComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.matterStatusArr = this.matterStatusArr;
    modalRef.componentInstance.matterPriorityArr = this.matterPriorityArr;
    modalRef.result.then((res: vwMatterAlert) => {
      if (res) {
        res.matterId = this.matterId;
        this.loading = true;
        this.addAlert(res);
      }
    });
  }

  private addAlert(alert: vwMatterAlert) {
    this.matterService
      .v1MatterAlertAddPost$Json({
        body: alert
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        })
      )
      .subscribe(
        newMatterId => {
          if (newMatterId > 0) {
            this.toastr.showSuccess('Matter alert created.');
            this.getMatterAlerts();
          } else {
            this.toastr.showError('Some Error Occured');
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  editMatterAlert(alert: vwMatterAlert, event) {
    event.target.closest('datatable-body-cell').blur();
    let modalRef = this.modalService.open(CreateMatterAlertComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    modalRef.componentInstance.matterStatusArr = this.matterStatusArr;
    modalRef.componentInstance.matterPriorityArr = this.matterPriorityArr;
    let component: CreateMatterAlertComponent = modalRef.componentInstance;
    component.matterAlert = {...alert};

    modalRef.result.then((res: vwMatterAlert) => {
      if (res) {
        res.matterId = this.matterId;
        this.loading = true;
        this.updateAlert(res);
      }
    });
  }

  private updateAlert(alert: vwMatterAlert) {
    this.matterService
      .v1MatterAlertUpdatePut$Json({
        body: alert
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        })
      )
      .subscribe(
        matterId => {
          if (matterId > 0) {
            this.toastr.showSuccess('Matter alert updated.');
            this.getMatterAlerts();
          } else {
            this.toastr.showError('Some Error Occured');
          }
        },
        () => {
          this.loading = false;
        }
      );
  }

  deleteMatterAlert(row: vwMatterAlert, event) {
    event.target.closest('datatable-body-cell').blur();

    this.dialogService
      .confirm(
        'You are about to delete this matter alert. Are you sure you want to continue?',
        'Delete'
      )
      .then(res => {
        if (res) {
          this.loading = true;
          this.delete(row.id);
        }
      });
  }

  private delete(id: number) {
    this.matterService
      .v1MatterAlertDeleteMatterAlertIdDelete({
        matterAlertId: id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as number;
        })
      )
      .subscribe(
        matterId => {
          if (matterId > 0) {
            this.toastr.showSuccess('Matter alert deleted.');
            this.getMatterAlerts();
          } else {
            this.toastr.showError('Some Error Occured');
          }
        },
        () => {
          this.loading = false;
        }
      );
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
