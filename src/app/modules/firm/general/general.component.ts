import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { forkJoin, fromEvent, Observable, Subscription, throwError } from 'rxjs';
import { catchError, debounceTime, finalize, map, take } from 'rxjs/operators';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as Constant from 'src/app/modules/shared/const';
import { DownloadFileService } from 'src/app/service/download-file.service';
import { TenantProfileService } from 'src/app/service/tenant-profile.service';
import { vwCalendarSettings, vwIdName, vwMatterType, vwPracticeArea } from 'src/common/swagger-providers/models';
import { CalendarService, MiscService, TenantService } from 'src/common/swagger-providers/services';
import * as fromRoot from '../../../store';
import * as fromPermissions from '../../../store/reducers/permission.reducer';
import { Page } from '../../models';
import { PracticeArea, Tenant, vwPracticeAreaList, vwTenantProfile } from '../../models/firm-settinngs.model';
import { DialogService } from '../../shared/dialog.service';
import * as errors from '../../shared/error.json';
import { SharedService } from '../../shared/sharedService';
import { UtilsHelper } from '../../shared/utils.helper';
import { MatterTypeComponent } from './matter-type/matter-type.component';
import { PracticeAreaComponent } from './practice-area/practice-area.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.scss']
})
export class GeneralComponent implements OnInit, OnDestroy, IBackButtonGuard, AfterViewInit {
  tenant: Tenant;
  practiceAreas: Array<vwPracticeAreaList>;
  matterTypes: Array<vwMatterType>;
  tenantProfile: vwTenantProfile;
  internalLogo: File = null;
  Faviconicon: File = null;
  maxFileSize = 5 * 1024 * 1024;
  @ViewChild('logoInput', { static: false }) logoInput: ElementRef<HTMLInputElement>;
  @ViewChild('faviconInput', { static: false }) faviconInput: ElementRef<HTMLInputElement>;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild('tablematterTypes', { static: false }) tablematterTypes: DatatableComponent;
  error_data = (errors as any).default;
  public timeZones: Array<vwIdName>;
  public userDetails;
  public calendarSettings: vwCalendarSettings;
  @Inject(DOCUMENT) private _document: HTMLDocument;
  private permissionSubscribe: Subscription;
  private permissionList$: Observable<fromPermissions.PermissionDataState>;
  public permissionList: any = {};
  public isShowTimeZoneSetting = true;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public footerHeight = 50;
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public pageSelected = 1;
  public counter = Array;
  public messages = {
    emptyMessage: Constant.SharedConstant.NoDataFound
  };

  public pageMatterType = new Page();
  public pageMatterTypeSelector = new FormControl('10');
  public pageMatterTypeSelected = 1;
  public pageSelectedpageMatterType = 1;
  public practiceLoading = true;
  public matterLoading = true;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  public currentActive: number;
  public logoIndex: number = 1;
  public favIndex: number = 2;
  public selectedSystemTimeZoneId: any = 0;
  public uploadFaviconErrorWarning: boolean = false;
  public uploadFaviconSizeErrorWarning:boolean = false;
  public uploadLogoErrorWarning: boolean = false;
  public uploadLogoSizeErrorWarning:boolean = false;
  public originalLogo: File;
  public faviconSrc: any;
  public logoSrc: any;
  public changeTimeZoneValue: any = false;
  public formSubmitted: any = false;
  public selected = [];
  public topbarHeight: number;
  revertFavicon: boolean;
  revertLogo: boolean;

  constructor(
    private store: Store<fromRoot.AppState>,
    private tenantService: TenantService,
    private toaster: ToastDisplay,
    private modalService: NgbModal,
    private dialogService: DialogService,
    private tenantProfileService: TenantProfileService,
    private sharedService: SharedService,
    private miscService: MiscService,
    private calendarService: CalendarService,
    private router: Router,
    private downloadService: DownloadFileService,
    private pagetitle: Title,
    private el: ElementRef,
  ) {
    this.permissionList$ = this.store.select('permissions');
    this.tenant = new Tenant();
    this.tenantProfile = {} as vwTenantProfile;
    this.practiceAreas = [];
    this.matterTypes = [];
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.pageMatterType.pageNumber = 0;
    this.pageMatterType.size = 10;
    this.userDetails = JSON.parse(localStorage.getItem('profile'));
    this.calendarSettings = {};
    router.events.subscribe(val => {
      if (val instanceof NavigationStart === true) {
        this.navigateAwayPressed = true;
      }
    });
  }

  ngOnInit() {
    this.pagetitle.setTitle("General Firm Settings");
    this.originalLogo = this.internalLogo;
    this.permissionSubscribe = this.permissionList$.subscribe(obj => {
      if (obj.loaded) {
        if (obj && obj.datas) {
          this.permissionList = obj.datas;
          this.isShowTimeZoneSetting = !!this.permissionList.TENANT_CONFIGURATIONisAdmin;
        }
      }
    });
    this.getTenantData();
    this.loadSystemTimeZones();
  }

  ngOnDestroy() {
    if (this.permissionSubscribe) {
      this.permissionSubscribe.unsubscribe();
    }
  }

  ngAfterViewInit() {
    const ele = document.querySelectorAll('.top-bar');
    this.topbarHeight = (ele && ele.length > 0) ? ele[0].getBoundingClientRect().height : 0;
  }

  /**
   Timezone
   */
  private loadTimeZones() {
    this.miscService
      .v1MiscTimezonesGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(res => {
        if (res) {
          this.timeZones = res;
        }
      });
  }

  private loadCalendarSettings() {
    this.calendarService
      .v1CalendarSettingsPersonIdGet({
        personId: this.userDetails.id
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res) {
            this.calendarSettings = res;
            if (!this.calendarSettings.timeZoneId) {
              this.calendarSettings.timeZoneId = 'Eastern Standard Time';
            }
            this.calendarSettings.personId = this.userDetails.id;
          }
        },
        () => { }
      );
  }

  /**
   * Gets Tenant Data
   */
  private getTenantData() {
    this.tenantService
      .v1TenantGet({})
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Tenant;
        }),
        finalize(() => { })
      )
      .subscribe(res => {
        if (res) {
          this.tenant = res;
          this.getPracticeArea();
          this.getTenantProfile();
          this.getMatteTypes();
        } else {
          this.toaster.showError(this.error_data.fetch_tenant_data_error);
          this.practiceLoading = false;
          this.matterLoading = false;
        }
      }, () => {
        this.matterLoading = false;
        this.practiceLoading = false;
      });
  }

  /**
   * Get Practice Area for Tenant
   */
  private getPracticeArea() {
    this.tenantService
      .v1TenantPracticeAreaGet({})
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwPracticeAreaList[];
        }),
        finalize(() => { })
      )
      .subscribe(res => {
        this.practiceAreas = res;
        this.updateDatatableFooterPage('Practice');
      }, () => {
        this.practiceLoading = false;
      });
  }

  public getMatteTypes() {
    this.tenantService
      .v1TenantMattertypesGet({})
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwMatterType[];
        }),
        finalize(() => { })
      )
      .subscribe(res => {
        this.matterTypes = res;
        this.matterTypes = _.sortBy(this.matterTypes,(a) =>(a.name || '').toLowerCase())
        this.updateDatatableFooterPage('Matter');
      }, () => {
        this.matterLoading = false;
      });
  }
  public pageChange(e) {
    this.pageSelected = e.page;
  }
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateDatatableFooterPage('Practice');
    }
  }
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage('Practice');
  }
  public pageChangeMatterType(e) {
    this.pageMatterTypeSelected = e.page;
  }
  public changePageMatterType() {
    this.pageMatterType.pageNumber = this.pageMatterTypeSelected - 1;
    if (this.pageMatterTypeSelected == 1) {
      this.updateDatatableFooterPage('Matter');
    }
  }
  public changePageSizeMatterType() {
    this.pageMatterType.size = +this.pageMatterTypeSelector.value;
    this.updateDatatableFooterPage('Matter');
  }

  public getTenantProfile() {
    this.tenantService
      .v1TenantProfileGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as vwTenantProfile;
        }),
        finalize(() => { })
      )
      .subscribe(res => {
        if (res) {
          this.tenantProfile = res;
          this.logoSrc = res.internalLogo;
          if (this.tenantProfile['faviconicon']) {
            this.faviconSrc = this.tenantProfile['faviconicon'];
            document
              .getElementById('appFavicon')
              .setAttribute('href', this.tenantProfile['faviconicon']);
          }
          else {
            this.faviconSrc = this.tenantProfile['faviconicon'];
            document
              .getElementById('appFavicon')
              .setAttribute('href', 'assets/favicon/default-favicon.png');
          }
        }
      });
  }

  /**
   * Add Practice Area
   */
  addPracticeArea() {
    const modalRef = this.modalService.open(PracticeAreaComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    const component = modalRef.componentInstance as PracticeAreaComponent;
    component.practieArea = {} as vwPracticeAreaList;
    modalRef.result.then(res => {
      if (res) {
        this.add(res);
      }
    });
  }

  private add(practiceArea: vwPracticeArea) {
    this.dataEntered = true;
    this.tenantService
      .v1TenantPracticeAreaPost$Json({
        body: practiceArea
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwPracticeAreaList>;
        }),
        finalize(() => { })
      )
      .subscribe(
        res => {
          if (res) {
            this.getPracticeArea();
            this.toaster.showSuccess(this.error_data.add_practice_area_success);
          } else {
            this.toaster.showError(this.error_data.error_occured);
          }
        },
        () => { }
      );
  }

  /**
   * Edit Practice Area
   */
  editPracticeArea(practiceArea: vwPracticeAreaList, $event = null) {

    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }

    const modalRef = this.modalService.open(PracticeAreaComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    const component = modalRef.componentInstance as PracticeAreaComponent;
    component.practieArea = JSON.parse(JSON.stringify(practiceArea));
    modalRef.result.then(res => {
      if (res) {
        this.edit(res);
      }
    });
  }

  private edit(practiceArea: PracticeArea) {
    this.dataEntered = true;
    this.tenantService
      .v1TenantPracticeAreaPut$Json({
        body: practiceArea
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwPracticeAreaList>;
        }),
        finalize(() => { })
      )
      .subscribe(
        res => {
          if (res) {
            this.getPracticeArea();
            this.toaster.showSuccess(
              this.error_data.edit_practice_area_success
            );
          } else {
            this.toaster.showError(this.error_data.error_occured);
          }
        },
        () => { }
      );
  }

  /**
   * Delete Practice Area
   */
  deletePracticeArea(practiceArea: vwPracticeAreaList, $event) {
    $event.stopPropagation();
    $event.target.closest('datatable-body-cell').blur();

    this.dialogService
      .confirm(this.error_data.delete_practice_area_confirm, 'Delete','Cancel','Delete Practice Area')
      .then(res => {
        if (res) {
          this.delete(practiceArea);
        }
      });
  }

  private delete(practiceArea: vwPracticeAreaList) {
    this.dataEntered = true;
    this.tenantService
      .v1TenantPracticeAreaIdDelete({
        id: practiceArea.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwPracticeAreaList>;
        }),
        catchError(error => {
          return throwError(JSON.parse(error.error));
        }),
        finalize(() => { })
      )
      .subscribe(
        res => {
          if (res) {
            this.getPracticeArea();
            this.toaster.showSuccess(
              this.error_data.delete_practice_area_success
            );
          } else {
            this.toaster.showError(this.error_data.error_occured);
          }
        },
        err => { }
      );
  }

  /**
   * Callback event on Save button click
   *
   * Save Data to DB
   */

  onChange(event) {
    this.changeTimeZoneValue = true;
  }

  save() {
    this.dataEntered = false;
    this.formSubmitted = true;
    if (this.tenant.name) {
      if (this.revertFavicon && !this.faviconSrc) {
        this.tenantService.v1TenantDeletefaviconDelete().subscribe(() => {});
      }
      if (this.revertLogo && !this.logoSrc) {
        this.tenantService.v1TenantDeletelogoDelete().subscribe(() => {
          this.sharedService.setLogo(true);
        });
      }
      if (this.selectedSystemTimeZoneId) {
        const timeZone = this.timeZones.filter(
          s => s.id == this.selectedSystemTimeZoneId
        );
        if (timeZone.length > 0 && this.changeTimeZoneValue) {
          this.tenantService
            .v1TenantSetUpdateSystemTimeZonePost$Json({
              body: {
                id: timeZone[0].id.toString(),
                name: timeZone[0].name
              }
            })
            .pipe(
              map(res => {
                return JSON.parse(res as any).results as any;
              })
            )
            .subscribe(
              () => { },
              () => { }
            );
        }
      }
      const saveTenant = this.tenantService.v1TenantPut$Json({
        body: {
          name: this.tenant.name
        }
      });
      const saveTenantProfile = this.tenantProfileService.v1TenantProfilePut(
        this.tenantProfile,
        this.internalLogo,
        this.Faviconicon
      );

      window.scroll({ 
        top: 0, 
        left: 0, 
        behavior  : 'smooth' 
      });
      forkJoin([saveTenant, saveTenantProfile])
        .pipe(
          map(res => {
            return {
              saveTenant: JSON.parse(res[0] as any).results as number,
              saveTenantProfile: res[1].results
            };
          }),
          finalize(() => { })
        )
        .subscribe(
          res => {
            this.formSubmitted = false;
            if (res.saveTenant > 0 && res.saveTenantProfile > 0) {
              this.getTenantProfile();
              this.sharedService.setLogo(true);
              if (this.internalLogo != this.originalLogo) {
                localStorage.removeItem('logo');
              }
              this.toaster.showSuccess(this.error_data.tenant_save_success);
            } else {
              this.toaster.showError(this.error_data.error_occured);
            }
          },
          () => {
            this.formSubmitted = false;
          }
        );
    } else {
      this.scrollToFirstInvalidControl();
      return;
    }
  }

  uploadButtonClick() {
    this.uploadLogoErrorWarning = false;
    this.uploadLogoSizeErrorWarning = false;
    if (this.logoInput) {
      this.logoInput.nativeElement.value = null;
      this.logoInput.nativeElement.click();
    }
  }
  uploadFaviconButtonClick() {
    this.uploadFaviconErrorWarning = false;
    this.uploadFaviconSizeErrorWarning = false;
    if (this.faviconInput) {
      this.faviconInput.nativeElement.value = null;
      this.faviconInput.nativeElement.click();
    }
  }

  public uploadFile(files: File[]) {
    const fileToUpload = files[0];

    if (!UtilsHelper.isValidImageFile(fileToUpload)) {
      this.uploadLogoErrorWarning = true;
    } else {
      const img = new Image();
      let naturalWidth = 0;
      let naturalHeight = 0;
      img.src = window.URL.createObjectURL(fileToUpload);

      img.onload = () => {
        naturalWidth = img.naturalWidth;
        naturalHeight = img.naturalHeight;

        window.URL.revokeObjectURL(img.src);
        if (naturalWidth <= 212 && naturalHeight <= 70) {
          this.dataEntered = true;
          this.internalLogo = fileToUpload;
          const reader = new FileReader();
          reader.onload = (event: ProgressEvent) => {
            this.logoSrc = (event.target as FileReader).result;
          };
          reader.readAsDataURL(fileToUpload);
        } else {
          this.uploadLogoSizeErrorWarning = true;
        }
      };
    }
  }

  public uploadFavicon(files: File[]) {
    const fileToUpload = files[0];
    if (!UtilsHelper.isValidFaviconImage(fileToUpload)) {
      this.uploadFaviconErrorWarning = true;
    } else {
      const img = new Image();
      let naturalWidth = 0;
      let naturalHeight = 0;
      img.src = window.URL.createObjectURL(fileToUpload);

      img.onload = () => {
        naturalWidth = img.naturalWidth;
        naturalHeight = img.naturalHeight;

        window.URL.revokeObjectURL(img.src);
        if (naturalWidth <= 32 && naturalHeight <= 32) {
          this.dataEntered = true;
          this.Faviconicon = fileToUpload;
          const reader = new FileReader();
          reader.onload = (event: ProgressEvent) => {
            this.faviconSrc = (event.target as FileReader).result;
          };
          reader.readAsDataURL(fileToUpload);
        } else {
          this.uploadFaviconSizeErrorWarning = true;
        }
      };
    }
  }

  public uploadFileDragAndDrop(files: Array<File>) {
    this.uploadLogoSizeErrorWarning = false;
    this.uploadLogoErrorWarning = false;
    const filesFromDragAndDrop = files;

    if (filesFromDragAndDrop && filesFromDragAndDrop.length > 0) {
      if (filesFromDragAndDrop.length > 1) {
        this.toaster.showError('Please select only 1 file.');
      } else {
        this.uploadFile(filesFromDragAndDrop);
      }
    }
  }

  public uploadFaviconDragAndDrop(files: Array<File>) {
    this.uploadFaviconErrorWarning = false;
    this.uploadFaviconSizeErrorWarning = false;
    const favicon = files;

    if (favicon && favicon.length > 0) {
      if (favicon.length > 1) {
        this.toaster.showError('Please select only 1 file.');
      } else {
        this.uploadFavicon(favicon);
      }
    }
  }

  /**
   * Callback Event on Cancel button click
   */
  cancel() { }

  addMatterType() {
    const modalRef = this.modalService.open(MatterTypeComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });
    const component = modalRef.componentInstance as MatterTypeComponent;
    component.matterType = {} as vwMatterType;
    component.practiceAreas = this.practiceAreas;

    modalRef.result.then(res => {
      if (res) {
        this.addMatter(res);
      }
    });
  }

  private addMatter(matter: vwMatterType) {
    const data: any = {
      ...matter
    };
    data.tenantId = this.tenant.id;
    this.tenantService
      .v1TenantMattertypePost$Json({
        body: data
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwMatterType>;
        })
      )
      .subscribe(
        res => {
          if (res) {
            this.getMatteTypes();
            this.toaster.showSuccess(this.error_data.add_matter_type_success);
          } else {
            this.toaster.showError(this.error_data.error_occured);
          }
        },
        () => { }
      );
  }

  editMatterType(row: vwMatterType, $event) {

    if ($event && $event.target) {
      $event.stopPropagation();
      $event.target.closest('datatable-body-cell').blur();
    }
    const modalRef = this.modalService.open(MatterTypeComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    const component = modalRef.componentInstance as MatterTypeComponent;
    component.matterType = row;
    component.practiceAreas = this.practiceAreas;

    modalRef.result.then(res => {
      if (res) {
        this.editMatter(res);
      }
    });
  }

  private editMatter(matter: vwMatterType) {
    this.dataEntered = true;
    this.tenantService
      .v1TenantMattertypePut$Json({
        body: matter
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwMatterType>;
        })
      )
      .subscribe(
        res => {
          if (res) {
            this.getMatteTypes();
            this.toaster.showSuccess(this.error_data.edit_matter_type_success);
          } else {
            this.toaster.showError(this.error_data.error_occured);
          }
        },
        () => { }
      );
  }

  deleteMatterType(row: vwMatterType, $event) {
    $event.stopPropagation();
    $event.target.closest('datatable-body-cell').blur();
    this.dialogService
      .confirm(this.error_data.delete_matter_type_confirm, 'Delete','Cancel','Delete Matter Type')
      .then(res => {
        if (res) {
          this.deleteMatter(row);
        }
      });
  }

  private deleteMatter(row: vwMatterType) {
    this.dataEntered = true;
    this.tenantService
      .v1TenantMattertypeIdDelete({
        id: row.id
      })
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as Array<vwMatterType>;
        }),
        catchError(error => {
          return throwError(JSON.parse(error.error));
        }),
        finalize(() => { })
      )
      .subscribe(
        res => {
          if (res) {
            this.matterTypes = res;
            this.updateDatatableFooterPage('Matter');
            this.toaster.showSuccess(this.error_data.delete_matter_type_success);
          } else {
            this.toaster.showError(this.error_data.error_occured);
          }
        },
        err => { }
      );
  }

  /** update Attorney table footer page count */
  updateDatatableFooterPage(type: string) {
    switch (type) {
      case 'Practice':
        this.page.totalElements = this.practiceAreas.length;
        this.page.totalPages = Math.ceil(
          this.practiceAreas.length / this.page.size
        );
        this.page.pageNumber = 0;
        this.pageSelected = 1;
        // Whenever the filter changes, always go back to the first page
        this.table.offset = 0;
        this.practiceLoading = false;
        break;
      case 'Matter':
        this.pageMatterType.totalElements = this.matterTypes.length;
        this.pageMatterType.totalPages = Math.ceil(
          this.matterTypes.length / this.pageMatterType.size
        );
        this.pageMatterType.pageNumber = 0;
        this.pageMatterTypeSelected = 1;
        // Whenever the filter changes, always go back to the first page
        this.tablematterTypes.offset = 0;
        this.matterLoading = false;
        break;
    }
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(event: KeyboardEvent) {
    this.dataEntered = true;
  }

  selectNew() {
    this.dataEntered = true;
  }

  openMenu(index: number, event: any): void {
    setTimeout(() => {
      if (this.currentActive !== index) {
        this.currentActive = index;
      } else {
        this.currentActive = null;
      }
    }, 50);
  }

  onClickedOutside(event: any, index: number) {
    if (index === this.currentActive) {
      this.currentActive = null;
    }
  }

  revertFaviconButton() {
    this.uploadFaviconErrorWarning = false;
    this.uploadFaviconSizeErrorWarning = false;
    this.Faviconicon = null;
    this.faviconSrc = null;
    this.revertFavicon = true;
  }

  revertLogoButton() {
    this.uploadLogoSizeErrorWarning = false;
    this.uploadLogoErrorWarning = false;
    this.internalLogo = null;
    this.logoSrc = null;
    this.revertLogo = true;
  }

  loadSystemTimeZones() {
    this.miscService
      .v1MiscSystemtimezonesGet$Response()
      .subscribe((data: {}) => {
        const res: any = data;
        if (res && res.body) {
          var parsedRes = JSON.parse(res.body);
          if (parsedRes != null && parsedRes.results) {
            let defaultTimeZone;
            for (let i = 0; i < parsedRes.results.length; i++) {
              if (parsedRes.results[i].isSysytemTimeZone == true) {
                this.selectedSystemTimeZoneId = parsedRes.results[i].id;
                break;
              }
              if (parsedRes.results[i].id === 'Eastern Standard Time') {
                defaultTimeZone = parsedRes.results[i].id;
              }
            }
            if (!this.selectedSystemTimeZoneId) {
              this.selectedSystemTimeZoneId = defaultTimeZone;
            }
            this.timeZones = parsedRes.results;
          }
        }
      });
  }

  dismissLogoError() {
    this.uploadLogoErrorWarning = false;
    this.uploadLogoSizeErrorWarning = false;
  }

  dismissFaviconError() {
    this.uploadFaviconErrorWarning = false;
    this.uploadFaviconSizeErrorWarning = false;
  }

  downloadLogoClick() {
    this.uploadLogoSizeErrorWarning = false;
    this.uploadLogoErrorWarning = false;
    let link = document.createElement('a');
    link.download = 'logo';
    if (this.internalLogo) {
      link.href = this.tenantProfile.internalLogo;
    } else {
      link.href = 'assets/images/default-logo-lexicon.png';
    }
    link.click();
  }

  downloadFaviconClick() {
    this.uploadFaviconErrorWarning = false;
    this.uploadFaviconSizeErrorWarning = false;
    let link = document.createElement('a');
    link.download = 'favicon';
    if (this.Faviconicon) {
      link.href = this.tenantProfile.faviconicon;
    } else {
      link.href = 'assets/favicon/default-favicon.png';
    }
    link.click();
  }

  private scrollToFirstInvalidControl() {
    const firstInvalidControl: HTMLElement = this.el.nativeElement.querySelector(
      '.ng-invalid'
    );
    window.scroll({
      top: this.getTopOffset(firstInvalidControl),
      left: 0,
      behavior: 'smooth'
    });
    fromEvent(window, 'scroll').pipe(debounceTime(100),take(1))
    .subscribe(() => firstInvalidControl.focus());
  }

  private getTopOffset(controlEl: HTMLElement): number {
    const labelOffset = 50;
    return controlEl.getBoundingClientRect().top + window.scrollY - (this.topbarHeight + labelOffset);
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

  get practiceAreaFooterHeight() {
    if (this.practiceAreas) {
      return this.practiceAreas.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }

  get matterTypeFooterHeight() {
    if (this.matterTypes) {
      return this.matterTypes.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
