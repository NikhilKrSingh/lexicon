import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  ModalDismissReasons,
  NgbModal,
  NgbModalOptions
} from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import {
  GridsterComponent,
  GridsterConfig,
  GridsterItem
} from 'angular-gridster2';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  vwUpdateDashboardWidget, vwUpdateDashboardWidgetItem,
  vwWidgetId
} from 'src/common/swagger-providers/models';
import { DashboardService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import {
  Widget,
  WidgetLibraryResponse,
  WidgetLibraryType
} from '../../models/dashboard.model';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-new-dashboard',
  templateUrl: './new-dashboard.component.html',
  styleUrls: ['./new-dashboard.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class NewDashboardComponent implements OnInit {
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  modalOptions: NgbModalOptions;
  closeResult: string;
  gridsterOpts: GridsterConfig;
  dashboard: Array<GridsterItem> = [];
  public profile;
  editPermitted: boolean;

  widgetLib: Widget[] = [];
  searchedLibrary = [];
  searchedLexWidget: string;

  selectedWidgets = [];

  widgetChanged: any;

  loggedinUser: any;

  loading = true;
  widgetLoading = false;

  originalWidgets: any[] = [];

  @ViewChild(GridsterComponent, { static: false }) gridster: GridsterComponent;

  height = 444;

  constructor(
    private store: Store<fromRoot.AppState>,
    private modalService: NgbModal,
    private dashboardService: DashboardService,
    private pagetitle: Title
  ) {
    this.loggedinUser = UtilsHelper.getLoginUser();
    this.permissionList$ = this.store.select('permissions');
  }

  ngOnInit() {
    this.permissionSubscribe = this.permissionList$.subscribe((obj) => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          if (
            this.permissionList.DASHBOARDisAdmin ||
            this.permissionList.DASHBOARDisEdit
          ) {
            this.editPermitted = true;
          } else {
            this.editPermitted = false;
          }
        }

        this.setOptions();
      }
    });

    this.setOptions();

    this.pagetitle.setTitle('Dashboard');
    this.profile = UtilsHelper.getObject('profile');
    this.getWidgets();
  }

  private setOptions() {
    this.gridsterOpts = {
      itemChangeCallback: this.itemChange.bind(this),
      initCallback: this.gridInit.bind(this),
      maxCols: 2,
      minCols: 2,
      gridType: 'verticalFixed',
      fixedRowHeight: 440,
      setGridSize: true,
      defaultItemRows: 1,
      pushItems: true,
      maxItemRows: 1,
      compactType: 'compactLeft&Up',
      margin: 24,
      swap: true,
      draggable: {
        enabled: this.editPermitted,
        ignoreContent: true,
        dragHandleClass: 'move-btn',
        stop: this.setChanged.bind(this),
      },
      pushDirections: {
        north: true,
        south: true,
        east: false,
        west: false,
      },
      resizable: {
        enabled: this.editPermitted,
        stop: this.setChanged.bind(this),
        handles: {
          n: false,
          s: false,
          e: false,
          w: false,
          ne: false,
          nw: false,
          sw: false,
          se: true,
        },
      },
    };
  }

  itemChange(item, itemComponent) {
    this.calculateOrderWidth();
    if (this.widgetChanged && item.widgetId === this.widgetChanged.widgetId) {
      this.saveWidgets();
    }
    this.widgetChanged = null;
  }

  setChanged(item, itemComponent, event) {
    this.widgetChanged = item;
  }

  gridInit(grid) {
  }

  changedOptions() {
    this.gridsterOpts.api.optionsChanged();
  }

  calculateOrderWidth() {
    this.dashboard = this.dashboard.sort((a, b) =>
      a.y > b.y || (a.y === b.y && a.x > b.x)
        ? 1
        : a.y < b.y || (a.y === b.y && a.x < b.x)
        ? -1
        : 0
    );

    this.dashboard.forEach((widget, i) => {
      widget.order = i + 1;
      if (widget.cols === 2) {
        widget.width = 100;
      } else if (widget.cols === 1) {
        widget.width = 50;
      }
    });
  }

  getWidgets() {
    this.dashboardService
      .v1DashboardGet()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((data: any) => {
        const res = JSON.parse(data).results || [];
        this.originalWidgets = UtilsHelper.clone(res);
        this.setImageType(res);
        this.createDashboard(res);
      });
  }

  private setImageType(widgets: GridsterItem[]) {
    widgets.forEach((a) => {
      this.getTypeImage(a);
    });
  }

  private getTypeImage(item) {
    let imageType = '';
    switch (item.displayType) {
      case 'PIE_CHART':
        imageType = 'pie';
        break;
      case 'LINE_CHART':
        imageType = 'line';
        break;
      case 'BAR_GRAPH':
        imageType = 'bar';
        break;
      case 'STACKED_GRAPH':
        imageType = 'stacked';
        break;
      case 'AREA_GRAPH':
        imageType = 'area';
      case 'TABLE':
        imageType = 'table';
        break;
    }

    if (imageType) {
      item.imageType = imageType;
    } else {
      item.imageType = 'pie';
    }
  }

  createDashboard(widgets: any) {
    widgets.sort((a, b) =>
      a.order < b.order ? -1 : a.order < b.order ? 1 : 0
    );

    let currentRow = 0;
    let previousWidth = 0;
    widgets.forEach((widget) => {
      widget.displayTime = moment(moment(widget.lastRefreshOn).utc(true))
        .local()
        .calendar();
      widget.y = currentRow;
      widget.x = 0;
      if (widget.width === 50) {
        widget.cols = 1;
        if (previousWidth === 50) {
          widget.x = 1;
        }
      } else if (widget.width === 100) {
        widget.cols = 2;
      }
      previousWidth += widget.width;

      if (previousWidth >= 100) {
        currentRow++;
        previousWidth = 0;
      }
      widget.menuOpen = false;
    });
    this.dashboard = widgets;

    this.setHeight();
  }

  setHeight() {
    setTimeout(() => {
      if (this.gridster) {
        this.height = this.gridster.el.offsetHeight;
      }
    }, 1000);
  }

  saveWidgets(edit?: boolean, modal?: any) {
    let newWidgetLayout: vwUpdateDashboardWidget = {};
    if (edit) {
      let widgets = UtilsHelper.clone(this.widgetLib);
      let widgetsToUpdate: Array<vwUpdateDashboardWidgetItem> = [];

      let maxOrder: any = _.maxBy(this.dashboard, (a) => a.order);
      if (maxOrder) {
        maxOrder = +maxOrder.order;
      } else {
        maxOrder = 0;
      }

      widgets.forEach((a) => {
        let w = this.dashboard.find((x) => x.widgetId == a.id);
        if (w) {
          a.order = w.order;
          a.width = w.width;
        } else {
          maxOrder = maxOrder + 1;
          a.order = maxOrder;
          a.width = a.defaultWidth;
        }
      });

      this.dashboard.forEach((wi) => {
        let isSelected = widgets.some(
          (a) => a.id == wi.widgetId && a.selected == true
        );
        if (!isSelected) {
          widgetsToUpdate.push({
            order: wi.order,
            width: wi.width,
            refresh: false,
            toDelete: true,
            widgetId: wi.widgetId,
          });
        } else {
          widgetsToUpdate.push({
            order: wi.order,
            width: wi.width,
            refresh: false,
            toDelete: false,
            widgetId: wi.widgetId,
          });
        }
      });

      let notInDashboard = widgets.filter(
        (a) =>
          this.dashboard.every((x) => x.widgetId != a.id) && a.selected == true
      );
      if (notInDashboard.length > 0) {
        notInDashboard.forEach((wi) => {
          widgetsToUpdate.push({
            order: wi.order,
            width: wi.width,
            refresh: false,
            toDelete: false,
            widgetId: wi.id,
          });
        });
      }

      newWidgetLayout.widgets = widgetsToUpdate;
    } else {
      newWidgetLayout.widgets = this.dashboard.map((a) => {
        return {
          order: a.order,
          widgetId: a.widgetId,
          width: a.width,
          toDelete: false,
          refresh: false
        } as vwUpdateDashboardWidgetItem;
      });
    }

    this.widgetLoading = true;
    this.dashboardService
      .v1DashboardPut$Json({
        body: newWidgetLayout,
      })
      .pipe(
        finalize(() => {
          this.widgetLoading = false;
          if (modal) {
            modal.dismiss();
          }
        })
      )
      .subscribe(
        (data) => {
          if (edit) {
            this.loading = true;
            this.getWidgets();
          }
        },
        (error) => {
          console.log(error);
        }
      );
  }

  removeWidget(widget: any) {
    this.dashboard.splice(this.dashboard.indexOf(widget), 1);
    this.calculateOrderWidth();
    const removed: vwWidgetId = {
      widgetId: widget.widgetId,
    };

    this.loading = true;
    this.dashboardService
      .v1DashboardRemoveWidgetPut$Json({
        body: removed,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        (data: any) => {
          const res = JSON.parse(data).results;
          this.setImageType(res);
          this.createDashboard(res);
        },
        (err) => {
          console.log(err);
        }
      );
  }

  refreshWidget(widget: any) {
    let newWidgetLayout: vwUpdateDashboardWidget = {
      widgets: [
        {
          widgetId: widget.widgetId,
          refresh: true,
          toDelete: false
        },
      ],
    };

    this.loading = true;

    this.dashboardService
      .v1DashboardPut$Json({
        body: newWidgetLayout,
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        (data: any) => {
          const res = JSON.parse(data).results;
          this.setImageType(res);
          this.createDashboard(res);
        },
        (error) => {
          console.log(error);
        }
      );
  }

  getLibrary() {
    this.widgetLoading = true;

    this.widgetLib = [];
    this.searchedLibrary = [];
    this.searchedLexWidget = null;
    this.dashboardService
      .v1DashboardWidgetsLibraryTypeGet({
        libraryType: WidgetLibraryType.FirmWidgetLibrary,
      })
      .pipe(
        finalize(() => {
          this.widgetLoading = false;
        })
      )
      .subscribe((data: any) => {
        const res: WidgetLibraryResponse = JSON.parse(data).results;
        res.firmWidgetLibrary.forEach((libraryWidget) => {
          const isActive = this.dashboard.find(
            (widget) => widget.widgetId === libraryWidget.id
          );

          if (isActive) {
            libraryWidget.selected = true;
          }

          if (libraryWidget.isRequired) {
            libraryWidget.selected = true;
          }

          this.getTypeImage(libraryWidget);
          this.widgetLib.push(libraryWidget);
        });
        this.getSelected();
        this.searchedLibrary = this.widgetLib;
      });
  }

  selectWidget(widget: Widget) {
    if (!widget.isRequired) {
      widget.selected = !widget.selected;
      let w = this.widgetLib.find(
        (libraryWidget) => widget.id === libraryWidget.id
      );

      if (w) {
        w.selected = widget.selected;
      }
      this.getSelected();
    }
  }

  getSelected() {
    this.selectedWidgets = [];
    this.widgetLib.forEach((item) => {
      if (item.selected) {
        this.selectedWidgets.push(item);
      }
    });
  }

  searchLexiconWidgets(search, isNewReq: boolean = false) {
    search = search.trim();
    if (search && search != '' && search.length >= 1) {
      this.searchedLibrary = this.widgetLib.filter(
        (item) =>
          item.name
            .toLowerCase()
            .indexOf(this.searchedLexWidget.toLowerCase()) >= 0 ||
          item.description
            .toLowerCase()
            .indexOf(this.searchedLexWidget.toLowerCase()) >= 0
      );
    } else {
      this.searchedLibrary = this.widgetLib;
    }
  }

  openMenu(item: any) {
    item.menuOpen = !item.menuOpen;
  }

  onClickedOutside(item: any) {
    item.menuOpen = false;
  }

  openPersonalinfo(content: any, className, winClass) {
    this.getLibrary();
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static',
      })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
          this.widgetLib = [];
          this.searchedLibrary = [];
          this.searchedLexWidget = null;
        },
        (reason) => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
          this.widgetLib = [];
          this.searchedLibrary = [];
          this.searchedLexWidget = null;
        }
      );
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj['widgetId'] || obj : index ;
  }
}
