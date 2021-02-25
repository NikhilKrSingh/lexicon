import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, Validators
} from '@angular/forms';
import { Title } from '@angular/platform-browser';
import {
  ModalDismissReasons,
  NgbModal,
  NgbModalOptions
} from '@ng-bootstrap/ng-bootstrap';
import {
  GridsterComponent,
  GridsterConfig,
  GridsterItem
} from 'angular-gridster2';
import * as _ from 'lodash';
import { finalize } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as errors from 'src/app/modules/shared/error.json';
import { vwResultSet } from 'src/common/models/vwResultSet';
import {
  vwCreateWidgetCollectionWidgets,
  vwEditWidgetCollectionWidgets,
  vwUpdateWidget
} from 'src/common/swagger-providers/models';
import { vwCreateWidgetCollection } from 'src/common/swagger-providers/models/vw-create-widget-collection';
import {
  DashboardService, SecurityGroupService
} from 'src/common/swagger-providers/services';
import {
  Widget,
  WidgetCollection,
  WidgetLibraryResponse,
  WidgetLibraryType
} from '../../models/dashboard.model';
import { UtilsHelper } from '../../shared/utils.helper';

@Component({
  selector: 'app-dashboard-configuration',
  templateUrl: './dashboard-configuration.component.html',
  styleUrls: ['./dashboard-configuration.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class DashboardConfigurationComponent implements OnInit {
  public alltabs1: string[] = ['Widget Library', 'Widget Collections'];
  public selecttabs1 = this.alltabs1[0];
  modalOptions: NgbModalOptions;
  closeResult: string;

  public widgetCollections: WidgetCollection[] = [];
  public originalWidgetCollections: WidgetCollection[] = [];

  public firmWidgets: Widget[] = [];
  public copyfirmWidgets: Widget[] = [];
  public lexiconWidgets: Widget[] = [];

  public originalDisplayLexWidgets: Widget[] = [];
  public originalDisplayFirmWidgets: Widget[] = [];

  public originalFirmWidgets: Widget[] = [];

  public displayLexiconWidgets: Widget[] = [];
  public displayFirmWidgets: Widget[] = [];

  public listWidgets: any;
  public dropdownList: any;
  public groupList: any = [];
  public selectedGroupId: number;
  public selectedWidgets: Widget[] = [];
  public requiredWidgets: Widget[] = [];
  public searchedLexWidget: string;
  public searchedWidgetCollection: string;
  public searchedFirmWidget: string;
  public selections: Array<number> = [];

  public isShow;
  public isShow1;
  public imageType: string;
  public selectedEditWidgetCollection: any = [];
  public selectedCopyWidgetCollection: any = [];
  public selectedNumber: number;
  public widgetsLoading: boolean = true;
  public collectionLoading: boolean = true;
  public isEditSelection: boolean = false;
  public newWidgetCollectionForm: FormGroup;
  public createNewCollectionLoader = false;
  public widgetsInCollection: any;
  gridsterOpts: GridsterConfig;
  dashboard: Array<GridsterItem> = [];
  widgetChanged: any;
  widgets: Widget[] = [];
  public profile;
  public selectedDeleteWidgetCollection: any = [];
  public collectionWidth;
  public originalSelectedNumber: number;
  public selectedEditWidgets: any = [];
  public selectedCopyWidgets: any = [];
  public overflowWidgetNames: boolean = false;

  securityGroupIdError = false;
  error_data = (errors as any).default;

  @ViewChild('createGrid', { static: false }) createGrid: GridsterComponent;

  createGridHeight = 444;

  @ViewChild('editGrid', { static: false }) editGrid: GridsterComponent;

  editGridHeight = 444;

  public copy: boolean = false;
  configureWidgetLibrary = false;

  constructor(
    private modalService: NgbModal,
    private toaster: ToastDisplay,
    private groupService: SecurityGroupService,
    private pagetitle: Title,
    private dashboardService: DashboardService,
    private builder: FormBuilder
  ) {}

  ngOnInit() {
    this.pagetitle.setTitle('Dashboard Configuration');
    this.profile = UtilsHelper.getObject('profile');
    this.getWidgets(WidgetLibraryType.Both);
    this.getWidgetCollections();
    this.getGroups();
    this.initNewCollectionForm();
    this.widgets = [];
    this.gridsterOpts = {
      itemChangeCallback: this.itemChange.bind(this),
      initCallback: this.gridInit.bind(this),
      maxCols: 2,
      minCols: 2,
      gridType: 'fixed',
      fixedRowHeight: 300,
      fixedColWidth: 327,
      setGridSize: true,
      defaultItemRows: 1,
      pushItems: true,
      maxItemRows: 1,
      compactType: 'compactUp',
      margin: 24,
      disablePushOnDrag: true,
      draggable: {
        enabled: true,
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
        enabled: true,
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

  selectTab(tab: any) {
    if (this.selecttabs1 != tab) {
      this.selecttabs1 = tab;
      if (this.selecttabs1 == 'Widget Collections') {
        this.getWidgetCollections();
      }
    }
  }

  configWidgetLibrary() {
    this.copyfirmWidgets = UtilsHelper.clone(this.firmWidgets);
    this.configureWidgetLibrary = true;
  }

  saveWidgetLibrary() {
    this.widgetsLoading = true;

    this.dashboardService
      .v1DashboardFirmWidgetLibraryPut$Json$Response({
        body: {
          widgets: this.firmWidgets.map((a) => {
            return {
              id: a.id,
              isRequired: a.isRequired,
              toDelete: a.toDelete,
            } as vwUpdateWidget;
          }),
        },
      })
      .pipe(
        finalize(() => {
          this.widgetsLoading = false;
        })
      )
      .subscribe((res: any) => {
        let r: any = res.body;
        let results: WidgetLibraryResponse = JSON.parse(r).results;

        if (results.firmWidgetLibrary) {
          this.firmWidgets = results.firmWidgetLibrary;
          this.firmWidgets.forEach((widget) => {
            this.getTypeImage(widget);
          });
          this.getRequiredOrDefaultFirmWidgets();
        }

        if (results.lexiconWidgetLibrary) {
          this.lexiconWidgets = results.lexiconWidgetLibrary;
          this.lexiconWidgets.forEach((widget) => {
            this.getTypeImage(widget);
          });
          this.getLexiconWidgetLibraryWidgets();
        }

        this.configureWidgetLibrary = false;
        this.widgetsLoading = false;
      }, () => {
        this.widgetsLoading = false;
      });
  }

  cancelSaveWidgetLibrary() {
    this.firmWidgets = UtilsHelper.clone(this.copyfirmWidgets);
    this.configureWidgetLibrary = false;
  }

  setCreateGridHeight() {
    setTimeout(() => {
      if (this.createGrid) {
        this.createGridHeight = this.createGrid.el.offsetHeight;
      }
    }, 1000);
  }

  setEditGridHeight() {
    setTimeout(() => {
      if (this.editGrid) {
        this.editGridHeight = this.editGrid.el.offsetHeight;
      }
    }, 1000);
  }

  async getWidgets(type) {
    this.widgetsLoading = true;
    const res: any = await this.dashboardService
      .v1DashboardWidgetsLibraryTypeGet$Response({
        libraryType: type,
      })
      .toPromise();
    if (res) {
      let r: any = res.body;
      let results: WidgetLibraryResponse = JSON.parse(r).results;

      if (results.firmWidgetLibrary) {
        this.firmWidgets = results.firmWidgetLibrary;
        this.firmWidgets.forEach((widget) => {
          this.getTypeImage(widget);
        });
        this.getRequiredOrDefaultFirmWidgets();
      } else {
        this.widgetsLoading = false;
      }

      if (results.lexiconWidgetLibrary) {
        this.lexiconWidgets = results.lexiconWidgetLibrary;
        this.lexiconWidgets.forEach((widget) => {
          this.getTypeImage(widget);
        });
        this.getLexiconWidgetLibraryWidgets();
      } else {
        this.widgetsLoading = false;
      }
    } else {
      this.widgetsLoading = false;
    }
  }

  private getLexiconWidgetLibraryWidgets() {
    this.widgetsLoading = true;
    this.displayLexiconWidgets = [];

    this.lexiconWidgets.forEach((data) => {
      if (!this.firmWidgets.some((a) => a.id == data.id)) {
        this.displayLexiconWidgets.push(data);
      }
    });

    this.originalDisplayLexWidgets = UtilsHelper.clone(
      this.displayLexiconWidgets
    );
    setTimeout(() => {
      this.widgetsLoading = false;
    }, 30);
  }

  getRequiredOrDefaultFirmWidgets() {
    this.widgetsLoading = true;
    this.requiredWidgets = this.firmWidgets.filter(
      (data) => data.isRequired || data.isDefault
    );
    setTimeout(() => {
      this.widgetsLoading = false;
    }, 30);
  }

  getWidgetCollections() {
    this.collectionLoading = true;
    this.dashboardService.v1DashboardWidgetCollectionsGet().subscribe(
      (res) => {
        let r: any = res;
        let results = JSON.parse(r).results;
        if (results) {
          this.widgetCollections = results;
          this.sortWidgetsAndAssignImageType();
          this.calculateNumberOfRows();
          this.originalWidgetCollections = this.widgetCollections;
          setTimeout(() => {
            this.collectionLoading = false;
          }, 30);
        }
      },
      () => {
        this.collectionLoading = false;
      }
    );
  }

  private calculateNumberOfRows() {
    if (this.widgetCollections && this.widgetCollections.length > 0) {
      this.widgetCollections = this.widgetCollections.map((a) => {
        a.numberOfRows = 0;
        a.widgetsToDisplay = 0;

        let showeMoreIndex = 0;

        let width = 0;
        if (a.widgets.length > 3) {
          a.widgets.forEach((w, index) => {
            width = w.width + width;

            if (a.numberOfRows == 2 && width >= 50 && showeMoreIndex == 0) {
              showeMoreIndex = index;
            }

            if (width >= 100) {
              width = width - 100;
              a.numberOfRows = a.numberOfRows + 1;
            }

            if (a.numberOfRows == 2 && width >= 50 && showeMoreIndex == 0) {
              showeMoreIndex = index;
            }
          });

          if (showeMoreIndex > 0) {
            if (a.widgets[showeMoreIndex].width == 50) {
              a.showMoreWidth = 50;
            } else {
              a.showMoreWidth = 100;
            }
          }

          a.widgetsToDisplay = showeMoreIndex;

          return a;
        } else {
          a.numberOfRows = 2;
          return a;
        }
      });
    }
  }

  deleteFirmWidget(widget: any, content: any) {
    this.modalService
      .open(content, {
        centered: true,
        backdrop: 'static',
      })
      .result.then((result) => {
        if (result == 'delete') {
          this.delete('widget', widget);
        }
      });
  }

  setEditCollection(item: any) {
    this.selectedEditWidgetCollection = { ...item };
    this.selectedEditWidgetCollection.allWidgets = UtilsHelper.clone(
      this.selectedEditWidgetCollection.widgets
    );
  }

  setCopyCollection(item: any) {
    this.selectedCopyWidgetCollection = { ...item };
    this.selectedCopyWidgetCollection.allWidgets = UtilsHelper.clone(
      this.selectedCopyWidgetCollection.widgets
    );
    this.selectedGroupId = null;
    this.selectedCopyWidgetCollection.securityGroupId = null;
    this.selectedCopyWidgetCollection.securityGroupName = null;
  }

  openPersonalinfo(content: any, className, winClass, type: string) {
    this.widgets = [];
    this.securityGroupIdError = false;

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
          if (result == 'save' && type == 'newCollection') {
            this.saveNewWidgetCollection();
          }
          if (result == 'save' && type == 'editCollection') {
            this.saveEditWidgetCollection();
          }

          if (result == 'save' && type == 'copyCollection') {
            this.saveCopyWidgetCollection();
          }

          if (result == 'delete' && type == 'deleteCollection') {
            this.delete('collection', this.selectedDeleteWidgetCollection);
          }
        },
        (reason) => {
          if (reason == 'Cross click' && type == 'editCollection') {
            this.getWidgetCollections();
          }
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
          this.isEditSelection = false;
        }
      );
    if (type == 'newCollection') {
      this.selectedEditWidgetCollection = [];
      this.selectedCopyWidgetCollection = [];
      this.newWidgetCreate();
    }

    if (type == 'editCollection') {
      this.copy = false;
      this.selectedGroupId = this.selectedEditWidgetCollection.securityGroupId;
      this.widgets = this.selectedEditWidgetCollection.widgets;
      this.createDashboard(this.widgets);

      this.setEditGridHeight();
    }

    if (type == 'copyCollection') {
      this.copy = true;
      this.widgets = this.selectedCopyWidgetCollection.widgets;
      this.createDashboard(this.widgets);

      this.setEditGridHeight();
    }
  }

  delete(type: string, widgetOrCollection: any) {
    if (type == 'collection') {
      let collection = widgetOrCollection;
      this.collectionLoading = true;
      this.dashboardService
        .v1DashboardWidgetCollectionIdDelete({
          widgetCollectionId: collection.id,
        })
        .pipe(
          finalize(() => {
            this.collectionLoading = false;
          })
        )
        .subscribe((res) => {
          let r: any = res;
          let results = JSON.parse(r).results;
          if (results) {
            this.widgetCollections = results || [];
            this.sortWidgetsAndAssignImageType();
            this.calculateNumberOfRows();
            this.originalWidgetCollections = this.widgetCollections;
            this.collectionLoading = false;
          } else {
            this.collectionLoading = false;
          }
        }, () => {
          this.collectionLoading = false;
        });
    } else {
      let index = this.copyfirmWidgets.findIndex(
        (a) => a.id == widgetOrCollection.id
      );
      if (index > -1) {
        widgetOrCollection.toDelete = true;
      } else {
        widgetOrCollection.toDelete = true;
        index = this.firmWidgets.findIndex(
          (a) => a.id == widgetOrCollection.id
        );
        if (index > -1) {
          this.firmWidgets.splice(index, 1);
        }
      }
    }
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

  initNewCollectionForm() {
    this.newWidgetCollectionForm = new FormGroup({
      securityGroupId: new FormControl([null, Validators.required]),
    });
  }

  private getGroups() {
    this.groupService.v1SecurityGroupGet$Response().subscribe(
      (s) => {
        let results: any = s.body;
        let actualData: vwResultSet = JSON.parse(results);
        if (actualData !== null && actualData !== undefined) {
          let groupData = actualData.results;
          groupData = groupData.filter((data) => !data.readOnly);
          let groupIds = groupData.map((m) => m.id);
          this.groupService
            .v1SecurityGroupHierarchyListPost$Json$Response({
              body: groupIds,
            })
            .subscribe(
              (s) => {
                results = s.body;
                let actualData2 = JSON.parse(results);
                if (actualData2) {
                  let sortedList = actualData2.results.sort((a, b) =>
                    a.securityGroup.localeCompare(b.securityGroup)
                  );
                  this.groupList = sortedList;
                }
              },
              () => {
                this.toaster.showError('Other than 200 status code returned');
              }
            );
        } else {
          this.toaster.showError('Api throws error');
        }
      },
      () => {
        this.toaster.showError('Other than 200 status code returned');
      }
    );
  }

  newWidgetCreate() {
    this.widgets = [];
    this.selectedWidgets = [];
    this.createNewCollectionLoader = true;

    this.getWidgets(WidgetLibraryType.Both).then(
      () => {
        this.createNewCollectionLoader = false;
        this.selectedGroupId = null;

        this.displayFirmWidgets = [];
        this.originalDisplayFirmWidgets = [];

        this.requiredWidgets.forEach((widget) => {
          widget.width = 50;
          this.selectedWidgets.push(widget);
        });

        this.displayFirmWidgets = this.firmWidgets.filter(
          (data) => !data.isRequired && !data.isDefault
        );

        this.originalDisplayFirmWidgets = this.displayFirmWidgets;

        this.newWidgetCollectionForm.patchValue({
          securityGroupId: null,
        });
        this.widgets = this.selectedWidgets;

        this.createDashboard(this.widgets);

        this.setCreateGridHeight();
      },
      () => {
        this.createNewCollectionLoader = false;
      }
    );
  }

  validateUserGroup() {
    let securityGroupId;
    if (this.selectedEditWidgetCollection.securityGroupId) {
      securityGroupId = this.selectedGroupId;
    } else {
      securityGroupId = this.newWidgetCollectionForm.value.securityGroupId;
    }
    if (+securityGroupId > 0) {
      this.securityGroupIdError = false;
    }
  }

  validateAndSave(modal: any, type: string) {
    let securityGroupId;
    if (type == 'newCollection') {
      securityGroupId = this.newWidgetCollectionForm.value.securityGroupId;
    } else {
      securityGroupId = this.selectedGroupId;
    }
    if (+securityGroupId > 0) {
      this.securityGroupIdError = false;
    } else {
      this.securityGroupIdError = true;
    }

    if (!this.securityGroupIdError) {
      modal.close('save');
    }
  }

  saveNewWidgetCollection() {
    if (this.newWidgetCollectionForm.valid) {
      this.collectionLoading = true;

      let formVal = this.newWidgetCollectionForm.value;
      let widgetCollection: vwCreateWidgetCollection = {};
      widgetCollection.securityGroupId = formVal.securityGroupId;
      this.calculateOrderWidth(this.selectedWidgets);
      widgetCollection.widgets = this.selectedWidgets.map((a, index) => {
        return {
          order: a.order,
          widgetId: a.id,
          width: a.width > 0 ? a.width : 50,
        } as vwCreateWidgetCollectionWidgets;
      });

      this.dashboardService
        .v1DashboardWidgetCollectionPost$Json({
          body: widgetCollection,
        })
        .pipe(
          finalize(() => {
            this.collectionLoading = false;
          })
        )
        .subscribe((res) => {
          let r: any = res;
          let results = JSON.parse(r).results;
          if (results) {
            this.widgetCollections = results || [];
            this.sortWidgetsAndAssignImageType();
            this.calculateNumberOfRows();
            this.originalWidgetCollections = this.widgetCollections;
            this.collectionLoading = false;
          } else {
            this.collectionLoading = false;
          }
        }, () => {
          this.collectionLoading = false;
        });
    }
  }

  private sortWidgetsAndAssignImageType() {
    this.widgetCollections.forEach((widgetCollection) => {
      widgetCollection.widgets = _.sortBy(
        widgetCollection.widgets,
        (a) => a.order
      );
      widgetCollection.widgets.forEach((widget) => {
        this.getTypeImage(widget);
      });
    });
  }

  calculateOrderWidth(widgtes: Array<GridsterItem>) {
    widgtes = widgtes.sort((a, b) =>
      a.y > b.y || (a.y === b.y && a.x > b.x)
        ? 1
        : a.y < b.y || (a.y === b.y && a.x < b.x)
        ? -1
        : 0
    );

    widgtes.forEach((widget, i) => {
      widget.order = i + 1;
      if (widget.cols === 2) {
        widget.width = 100;
      } else if (widget.cols === 1) {
        widget.width = 50;
      }
    });
  }

  addToWidgetSelections(item) {
    if (!this.selectedWidgets.includes(item)) {
      item.cols = 1;
      item.rows = 1;
      this.selectedWidgets.push(item);
      let index = this.displayFirmWidgets.findIndex((v) => v.id == item.id);
      this.displayFirmWidgets.splice(index, 1);
    }
  }

  clearSelectedWidgets() {
    this.selectedWidgets.forEach((widget) => {
      if (!widget.isRequired && !widget.isDefault) {
        this.displayFirmWidgets.push(widget);
      }
    });
    this.selectedWidgets = this.selectedWidgets.filter(
      (data) => data.isRequired || data.isDefault
    );
  }

  deleteWidget(item) {
    let index = this.selectedWidgets.findIndex((v) => v.id == item.id);
    this.selectedWidgets.splice(index, 1);
    this.displayFirmWidgets.push(item);
  }

  searchLexiconWidgets(search, isNewReq: boolean = false) {
    search = search.trim();
    if (search && search != '' && search.length >= 1) {
      this.displayLexiconWidgets = this.originalDisplayLexWidgets.filter(
        (item) =>
          item.name
            .toLowerCase()
            .indexOf(this.searchedLexWidget.toLowerCase()) >= 0 ||
          item.description
            .toLowerCase()
            .indexOf(this.searchedLexWidget.toLowerCase()) >= 0
      );
    } else {
      this.displayLexiconWidgets = this.originalDisplayLexWidgets;
    }
  }

  searchWidgetCollections(search, isNewReq: boolean = false) {
    search = search.trim();
    if (search && search != '' && search.length >= 1) {
      this.widgetCollections = this.originalWidgetCollections.filter(
        (item) =>
          item.securityGroupName
            .toLowerCase()
            .indexOf(this.searchedWidgetCollection.toLowerCase()) >= 0 ||
          item.widgets.some((widget) => {
            return (
              widget.name
                .toLowerCase()
                .indexOf(this.searchedWidgetCollection.toLowerCase()) >= 0
            );
          })
      );
    } else {
      this.widgetCollections = this.originalWidgetCollections;
    }
  }

  searchFirmWidgets(search, isNewReq: boolean = false, edit: boolean = false) {
    search = search.trim();
    if (search && search != '' && search.length >= 1) {
      if (edit) {
        this.firmWidgets = this.originalFirmWidgets.filter(
          (item) =>
            item.name
              .toLowerCase()
              .indexOf(this.searchedFirmWidget.toLowerCase()) >= 0 ||
            item.description
              .toLowerCase()
              .indexOf(this.searchedFirmWidget.toLowerCase()) >= 0
        );
      } else {
        this.displayFirmWidgets = this.displayFirmWidgets.filter(
          (item) =>
            item.name
              .toLowerCase()
              .indexOf(this.searchedFirmWidget.toLowerCase()) >= 0 ||
            item.description
              .toLowerCase()
              .indexOf(this.searchedFirmWidget.toLowerCase()) >= 0
        );
      }
    } else {
      if (edit) {
        this.firmWidgets = this.originalFirmWidgets;
      } else {
        let newDisplayWidgets = this.originalDisplayFirmWidgets;
        newDisplayWidgets.forEach((widget) => {
          this.selectedWidgets.forEach((selectedWidget) => {
            if (widget.name == selectedWidget.name) {
              let index = newDisplayWidgets.findIndex((v) => v.id == widget.id);
              newDisplayWidgets.splice(index, 1);
            }
          });
        });
        this.displayFirmWidgets = newDisplayWidgets;
      }
    }
  }

  activateWidget(item) {
    if (!this.firmWidgets.includes(item)) {
      this.firmWidgets.push(item);
      this.getLexiconWidgetLibraryWidgets();
    }
  }

  clearAllSelections() {
    this.firmWidgets = this.lexiconWidgets.filter(
      (a) => a.isDefault || a.isRequired
    );
    this.getLexiconWidgetLibraryWidgets();
  }

  getTypeImage(item) {
    this.imageType = '';
    let smallImageType = '';
    switch (item.displayType) {
      case 'PIE_CHART':
        this.imageType = 'pie';
        break;
      case 'LINE_CHART':
        this.imageType = 'line';
        break;
      case 'BAR_GRAPH':
        this.imageType = 'bar';
        break;
      case 'STACKED_GRAPH':
        this.imageType = 'stacked';
        break;
      case 'AREA_GRAPH':
        this.imageType = 'area';
      case 'TABLE':
        this.imageType = 'table';
        if (item.width == 50) {
          smallImageType = 'table-short';
        }
        if (item.width == 100) {
          smallImageType = 'table-long';
        }
        break;
    }

    if (this.imageType) {
      item.imageType = this.imageType;
      item.smallImageType = smallImageType || this.imageType;
    }
  }

  deleteWidgetInCollection(item) {
    let index;
    let widget;
    if (this.copy) {
      index = this.selectedCopyWidgetCollection.widgets.findIndex(
        (v) => v.id == item.id
      );

      this.selectedCopyWidgetCollection.widgets.splice(index, 1);

      widget = this.selectedCopyWidgetCollection.allWidgets.find(
        (v) => v.id == item.id
      );
    } else {
      index = this.selectedEditWidgetCollection.widgets.findIndex(
        (v) => v.id == item.id
      );

      this.selectedEditWidgetCollection.widgets.splice(index, 1);

      widget = this.selectedEditWidgetCollection.allWidgets.find(
        (v) => v.id == item.id
      );
    }

    if (widget) {
      widget.toDelete = true;
    }
  }

  editWidgetSelection() {
    this.originalSelectedNumber = 0;
    this.selectedNumber = 0;

    let maxOrder = _.maxBy(
      this.selectedEditWidgetCollection.widgets,
      (a: any) => a.order
    );
    if (maxOrder) {
      maxOrder = +maxOrder.order;
    }

    this.firmWidgets.forEach((firmWidget) => {
      let widget;
      if (this.copy) {
        widget = this.selectedCopyWidgetCollection.widgets.find(
          (a) => a.id == firmWidget.id
        );
      } else {
        widget = this.selectedEditWidgetCollection.widgets.find(
          (a) => a.id == firmWidget.id
        );
      }

      if (widget) {
        if (!widget.toDelete) {
          firmWidget.selected = 'true';
        } else {
          firmWidget.selected = null;
        }

        firmWidget.order = widget.order;
        firmWidget.width = widget.width;
      } else {
        maxOrder = maxOrder + 1;
        firmWidget.order = maxOrder;
        firmWidget.width = 50;
        firmWidget.selected = null;
      }

      if (firmWidget.selected) {
        this.selectedNumber += 1;
      }
    });

    this.originalFirmWidgets = this.firmWidgets;
    this.originalSelectedNumber = this.selectedNumber;
  }

  revertSelections() {
    this.selectedNumber = this.originalSelectedNumber;
    if (this.copy) {
      this.selectedCopyWidgets.forEach((widget) => {
        delete widget.selected;
      });
    } else {
      this.selectedEditWidgets.forEach((widget) => {
        delete widget.selected;
      });
    }

    this.firmWidgets = this.originalFirmWidgets;
  }

  select(item) {
    item.selected = 'true';
    this.selectedNumber += 1;
    if (this.copy) {
      this.selectedCopyWidgets.push(item);
    } else {
      this.selectedEditWidgets.push(item);
    }
  }

  unselect(item) {
    if (!item.isDefault && !item.isRequired) {
      delete item.selected;
      this.selectedNumber -= 1;
    }
  }

  toggleRequired(item) {
    item.isRequired = !item.isRequired;
  }

  updateWidgetSelections() {
    let updatedWidgets = [];

    let widgets: any[] = UtilsHelper.clone(this.firmWidgets);
    let allExistingWidgets: any[];
    if (this.copy) {
      allExistingWidgets = UtilsHelper.clone(
        this.selectedCopyWidgetCollection.allWidgets
      );
    } else {
      allExistingWidgets = UtilsHelper.clone(
        this.selectedEditWidgetCollection.allWidgets
      );
    }

    widgets.forEach((firmWidget) => {
      firmWidget.widgetId = firmWidget.id;
      if (firmWidget.selected == 'true') {
        firmWidget.toDelete = false;
        updatedWidgets.push(firmWidget);
      } else {
        let existing = allExistingWidgets.find((a) => a.id == firmWidget.id);
        if (existing) {
          firmWidget.toDelete = true;
          updatedWidgets.push(firmWidget);
        }
      }
    });

    if (this.copy) {
      this.selectedCopyWidgetCollection.widgets = updatedWidgets.filter(
        (a) => !a.toDelete
      );
      this.selectedCopyWidgetCollection.allWidgets = updatedWidgets;

      this.createDashboard(this.selectedCopyWidgetCollection.widgets);
    } else {
      this.selectedEditWidgetCollection.widgets = updatedWidgets.filter(
        (a) => !a.toDelete
      );
      this.selectedEditWidgetCollection.allWidgets = updatedWidgets;

      this.createDashboard(this.selectedEditWidgetCollection.widgets);
    }
  }

  saveEditWidgetCollection() {
    this.collectionLoading = true;
    this.selectedEditWidgetCollection.securityGroupId = this.selectedGroupId;
    this.selectedEditWidgetCollection.widgetCollectionId = this.selectedEditWidgetCollection.id;

    this.calculateOrderWidth(this.selectedEditWidgetCollection.widgets);

    const allWidgets = this.selectedEditWidgetCollection.allWidgets.map(
      (widget) => {
        let existing = this.selectedEditWidgetCollection.widgets.find(
          (a) => a.id == widget.id
        );
        if (existing) {
          widget = existing;
        }

        widget.widgetId = widget.id;
        return widget;
      }
    );

    this.selectedEditWidgetCollection.widgets = allWidgets;
    delete this.selectedEditWidgetCollection.allWidgets;

    this.dashboardService
      .v1DashboardWidgetCollectionPut$Json({
        body: this.selectedEditWidgetCollection,
      })
      .pipe(
        finalize(() => {
          this.collectionLoading = false;
        })
      )
      .subscribe((res) => {
        let r: any = res;
        let results = JSON.parse(r).results;
        if (results) {
          this.widgetCollections = results || [];
          this.sortWidgetsAndAssignImageType();
          this.calculateNumberOfRows();
          this.originalWidgetCollections = this.widgetCollections;
          this.collectionLoading = false;
        } else {
          this.collectionLoading = false;
        }
      }, () => {
        this.collectionLoading = false;
      });
  }

  saveCopyWidgetCollection() {
    this.collectionLoading = true;

    let copyCollection: any = {};
    copyCollection.securityGroupId = this.selectedGroupId;
    copyCollection.widgetCollectionId = this.selectedCopyWidgetCollection.id;

    this.calculateOrderWidth(this.selectedCopyWidgetCollection.widgets);

    this.dashboardService
      .v1DashboardCopyWidgetCollectionPost$Json({
        body: {
          securityGroupId: copyCollection.securityGroupId,
          widgetCollectionId: copyCollection.widgetCollectionId,
          widgets: this.selectedCopyWidgetCollection.widgets.map(a => {
            return {
              order: a.order,
              toDelete: false,
              widgetId: a.id,
              width: a.width
            } as vwEditWidgetCollectionWidgets
          })
        },
      })
      .pipe(
        finalize(() => {
          this.collectionLoading = false;
        })
      )
      .subscribe((res) => {
        let r: any = res;
        let results = JSON.parse(r).results;
        if (results) {
          this.widgetCollections = results || [];
          this.sortWidgetsAndAssignImageType();
          this.calculateNumberOfRows();
          this.originalWidgetCollections = this.widgetCollections;
          this.collectionLoading = false;
        } else {
          this.collectionLoading = false;
        }
      }, () => {
        this.collectionLoading = false;
      });
  }

  isTextOverflow(item): boolean {
    let names = '';
    item.widgets.forEach((widget) => {
      names += widget.name + ', ';
    });

    return false;
  }

  itemChange(item, itemComponent) {
    this.widgets.sort((a, b) =>
      a.y > b.y || (a.y === b.y && a.x > b.x)
        ? 1
        : a.y < b.y || (a.y === b.y && a.x < b.x)
        ? -1
        : 0
    );
    this.widgets.forEach((widget, i) => {
      widget.order = i + 1;
    });
    if (this.widgetChanged && item.id === this.widgetChanged.id) {
    }
    this.widgetChanged = null;
  }

  setChanged(item, itemComponent, event) {
    this.widgetChanged = item;
    if ((item.cols == 2)) {
      item.width = 100;
    } else {
      item.width = 50;
    }
    console.log(item, itemComponent, event);
  }

  changedOptions() {
    this.gridsterOpts.api.optionsChanged();
  }

  createDashboard(widgets: Array<any>) {
    widgets.sort((a, b) =>
      a.order < b.order ? -1 : a.order < b.order ? 1 : 0
    );

    let currentRow = 0;
    let previousWidth = 0;
    widgets.forEach((widget) => {
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
      this.setChanged.bind(widget);
    });
  }

  gridInit(grid) {
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
