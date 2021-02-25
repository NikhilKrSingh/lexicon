import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { forkJoin } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { IBackButtonGuard } from 'src/app/guards/back-button-deactivate.guard';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as fromRoot from 'src/app/store';
import { vwNotification } from '../../../../common/models/vwNotification';
import { vwResultSet } from '../../../../common/models/vwResultSet';
import { vwEmployee, vwHierarchy, vwIdName, vwObjectVisibility, vwSecurityGroup, vwSecurityGroupMember, vwSecurityGroupNotification } from '../../../../common/swagger-providers/models';
import { EmployeeService, HierarchyService, MiscService, ModuleConfigurationService, NotificationService, ObjectVisibilityService, SecurityGroupService } from '../../../../common/swagger-providers/services';
import { moduleConfiguration, Page } from '../../models';
import { vwEmailTemplate } from '../../models/email-templates.model';
import * as errorData from '../../shared/error.json';
import { UtilsHelper } from '../../shared/utils.helper';
import { AddUsersComponent } from './add-users/add-users.component';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent implements OnInit, IBackButtonGuard {
  @ViewChild(DatatableComponent, { static: false }) employeeTable: DatatableComponent;
  @ViewChild(DatatableComponent, { static: false }) groupEmployeesTable: DatatableComponent;
  modalOptions: NgbModalOptions;
  closeResult: string;

  employeeId: string;

  saveLoader = false;

  constructor(
    private modalService: NgbModal,
    private activeRoute: ActivatedRoute,
    private GroupService: SecurityGroupService,
    private MiscServ: MiscService,
    private EmpService: EmployeeService,
    private NotiService: NotificationService,
    private ObjectVisService: ObjectVisibilityService,
    private hierService: HierarchyService,
    private router: Router,
    private toastDisplay: ToastDisplay,
    private moduleConfigurationService: ModuleConfigurationService,
    private objectVisibilityService: ObjectVisibilityService,
    private store: Store<fromRoot.AppState>,
    private pagetitle: Title
  ) {
    this.activatedRoute = activeRoute;
    router.events.subscribe(val => {
      if (val instanceof NavigationStart === true) {
        this.navigateAwayPressed = true;
      }
    });

    this.activatedRoute.queryParams.subscribe(params => {
      this.employeeId = params['employeeId'];
    });
  }

  public EditText: string;
  public counter = Array;
  private activatedRoute: ActivatedRoute;
  private groupId: number;
  private groupData: Array<vwSecurityGroup>;
  public pangeSelected: number = 1;
  public pangeSelectedEmp: number = 1;
  public EditGroup: vwSecurityGroup;
  public Offices: Array<vwIdName>;
  public OfficeEmployees: Array<vwEmployee>;
  public oriOfficeEmployees: Array<vwEmployee>;
  public OriginalGroupEmployees: Array<vwEmployee>;
  public GroupEmployees: Array<vwEmployee>;
  public primaryOfficeId: number;
  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public gepage = new Page();
  public pageSelector = new FormControl('10');
  public pageSelectorEmp = new FormControl('10');
  public pageSelectorAddEmp = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selected: Array<any>;
  public searchOfficeEmployee: string = '';
  public notificationData: Array<vwNotification>;
  public availableNotification: Map<number, boolean>;
  public moduleList: Array<moduleConfiguration> = [];
  public groupObjectVisibilty: Array<vwObjectVisibility>;
  public firmData: Array<vwHierarchy>;
  private AddedEmployees: Array<number>;
  private RemovedEmployees: Array<number>;
  private AddedNotifications: Array<number>;
  private RemovedNotifications: Array<number>;
  public title: string = 'All';
  public filterName: string = 'Apply Filter';
  public selections: Array<number> = [];
  public dropdownList: Array<any> = [];
  public messages = {
    emptyMessage: 'No data found.'
  };
  public errorData: any = (errorData as any).default;
  public groupStatus: string;
  public objectVisibility: Array<moduleConfiguration>;

  public searchUser: string;
  public usersLoading: boolean;
  public nameLoading: boolean;
  isOnFirstTab = true;
  backbuttonPressed = false;
  steps = [];
  navigateAwayPressed = false;
  dataEntered = false;
  public addLoading: boolean;
  public permissionsLoading: boolean;
  public emailTemplateLoading: boolean;
  public editGroupErrMsg = '';
  public emailTemplateList: vwEmailTemplate[] = [];
  public groupByEmailTemplateList = [];
  public _groupByEmailTemplateList = [];

  ngOnInit() {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.gepage.pageNumber = 0;
    this.gepage.size = 10;
    if (
      this.activatedRoute.snapshot.queryParams.groupId !== null &&
      this.activatedRoute.snapshot.queryParams.groupId !== undefined
    ) {
      this.groupId = parseInt(this.activatedRoute.snapshot.queryParams.groupId);
      this.EditText = 'Edit';
      this.pagetitle.setTitle('Edit Group');
      this.getEmailTemplateOfGroupid();
    } else {
      this.groupId = -1;
      this.EditText = 'Create New';
      this.pagetitle.setTitle('Create New Group');
      this.getEmailTemplates();
    }
    this.notificationData = new Array<vwNotification>();
    this.OfficeEmployees = new Array<vwEmployee>();
    this.GroupEmployees = new Array<vwEmployee>();
    this.groupObjectVisibilty = new Array<vwObjectVisibility>();
    this.firmData = new Array<vwHierarchy>();
    this.selected = new Array<number>();
    this.EditGroup = { name: '' };
    this.AddedEmployees = new Array<number>();
    this.RemovedEmployees = new Array<number>();
    this.AddedNotifications = new Array<number>();
    this.RemovedNotifications = new Array<number>();
    this.availableNotification = new Map<number, boolean>();
    this.LoadGroup();
    this.getList();
  }

  public getEmailTemplates() {
    this.emailTemplateLoading = true;
    this.GroupService.v1SecurityGroupEmailTemplatesGet$Response().subscribe(
      s => {
        let results: any = s.body;
        let actualData: vwResultSet = JSON.parse(results);
        if (actualData !== null && actualData !== undefined) {
          this.emailTemplateList = actualData.results;
          if (this.emailTemplateList && this.emailTemplateList.length) {
            let data = [];
            let emailTemplates = _.groupBy(
              this.emailTemplateList,
              a => a.templateGroupName
            );
            for (let template in emailTemplates) {
              data.push({
                templateGroupName: template,
                templateGroupData: _.sortBy(emailTemplates[template], a =>
                  (a.description || '').toLowerCase()
                )
              });
            }
            data = _.sortBy(data, a =>
              (a.templateGroupName || '').toLowerCase()
            );
            this.groupByEmailTemplateList = data;
            this._groupByEmailTemplateList = UtilsHelper.clone(
              this.groupByEmailTemplateList
            );
            this.emailTemplateLoading = false;
          } else {
            this.emailTemplateLoading = false;
          }
        } else {
          this.emailTemplateLoading = false;
        }
      },
      err => {
        this.emailTemplateLoading = false;
      }
    );
  }
  public getEmailTemplateOfGroupid() {
    this.emailTemplateLoading = true;
    this.GroupService.v1SecurityGroupNotificationSettingsSecurityGroupIdGet$Response(
      { securityGroupId: this.groupId }
    ).subscribe(
      s => {
        let results: any = s.body;
        let actualData: vwResultSet = JSON.parse(results);
        if (actualData !== null && actualData !== undefined) {
          this.emailTemplateList = actualData.results.emailTemplates;
          if (this.emailTemplateList && this.emailTemplateList.length) {
            let data = [];
            let emailTemplates = _.groupBy(
              this.emailTemplateList,
              a => a.templateGroupName
            );
            for (let template in emailTemplates) {
              data.push({
                templateGroupName: template,
                templateGroupData: _.sortBy(emailTemplates[template], a =>
                  (a.description || '').toLowerCase()
                )
              });
            }
            data = _.sortBy(data, a =>
              (a.templateGroupName || '').toLowerCase()
            );
            this.groupByEmailTemplateList = data;
            this._groupByEmailTemplateList = UtilsHelper.clone(
              this.groupByEmailTemplateList
            );
            this.emailTemplateLoading = false;
          } else {
            this.emailTemplateLoading = false;
          }
        } else {
          this.emailTemplateLoading = false;
        }
      },
      err => {
        this.emailTemplateLoading = false;
      }
    );
  }

  public getList() {
    this.permissionsLoading = true;
    let listObject = [
      this.moduleConfigurationService.v1ModuleConfigurationGet({}),
      this.MiscServ.v1MiscOfficesGet({})
    ];
    if (this.groupId > -1) {
      listObject.push(
        this.ObjectVisService.v1ObjectVisibilityGroupGroupIdGet({
          groupId: this.groupId
        })
      );
    }
    forkJoin(listObject)
      .pipe(
        map(res => {
          if (listObject.length === 3) {
            return {
              moduleList: JSON.parse(res[0] as any).results as Array<
                moduleConfiguration
              >,
              officesList: JSON.parse(res[1] as any).results as Array<vwIdName>,
              groupObjectVisibilty: JSON.parse(res[2] as any).results as Array<
                vwObjectVisibility
              >
            };
          } else {
            return {
              moduleList: JSON.parse(res[0] as any).results as Array<
                moduleConfiguration
              >,
              officesList: JSON.parse(res[1] as any).results as Array<vwIdName>,
              groupObjectVisibilty: []
            };
          }
        }),
        finalize(() => {})
      )
      .subscribe(
        suc => {
          this.permissionsLoading = false;
          this.moduleList = suc.moduleList;
          this.Offices = suc.officesList;
          this.groupObjectVisibilty = suc.groupObjectVisibilty;
          if (this.moduleList && this.moduleList.length > 0) {
            this.moduleList.map(obj => {
              obj.name = obj.moduleName;
              obj.isNoVisibility = obj.deny;

              if (obj.code == 'DASHBOARD') {
                obj.isViewOnly = false;
                obj.isEdit = true;
              } else {
                obj.isViewOnly = !obj.deny;
                obj.isEdit = false;
              }

              obj.isAdmin = false;
              obj.securityGroupObjectVisibilityId = 0;
              const item = this.groupObjectVisibilty.find(
                v => v.code == obj.code
              );
              if (item) {
                obj.id = item.id;
                obj.isNoVisibility = item.isNoVisibility;
                obj.isViewOnly = item.isViewOnly;
                obj.isEdit = item.isEdit;
                obj.isAdmin = item.isAdmin;
                obj.securityGroupId = item.securityGroupId;
                obj.securityGroupObjectVisibilityId =
                  item.securityGroupObjectVisibilityId;
              }
            });
          }
        },
        () => {
          this.permissionsLoading = false;
        }
      );
  }

  public onRadioSelected(rowId: number, evt: any, type: number) {
    const ind = this.moduleList.findIndex(v => v.id == rowId);
    this.dataEntered = true;

    if (ind >= 0) {
      switch (type) {
        case 1:
          this.moduleList[ind].isNoVisibility = evt.target.checked;
          this.moduleList[ind].isViewOnly = false;
          this.moduleList[ind].isEdit = false;
          this.moduleList[ind].isAdmin = false;
          break;
        case 2:
          this.moduleList[ind].isNoVisibility = false;
          this.moduleList[ind].isViewOnly = evt.target.checked;
          this.moduleList[ind].isEdit = false;
          this.moduleList[ind].isAdmin = false;
          break;
        case 3:
          this.moduleList[ind].isNoVisibility = false;
          this.moduleList[ind].isViewOnly = false;
          this.moduleList[ind].isEdit = evt.target.checked;
          this.moduleList[ind].isAdmin = false;
          break;
        case 4:
          this.moduleList[ind].isNoVisibility = false;
          this.moduleList[ind].isViewOnly = false;
          this.moduleList[ind].isEdit = false;
          this.moduleList[ind].isAdmin = evt.target.checked;
          break;
      }
    }
  }

  private LoadGroup() {
    if (this.groupId > -1) {
      this.getGroupInfo();
      this.getGroupUsers();
      this.NotiService.v1NotificationEmailGet$Response().subscribe(
        s => {
          const results: any = s.body;
          const actualData: vwResultSet = JSON.parse(results);
          if (actualData !== null && actualData !== undefined) {
            for (let nCount = 0; nCount < actualData.results.length; nCount++) {
              this.availableNotification.set(
                actualData.results[nCount].id,
                false
              );
            }
            this.notificationData = actualData.results;
            this.NotiService.v1NotificationEmailGroupIdGet$Response({
              groupId: this.groupId
            }).subscribe(
              s => {
                const results: any = s.body;
                const actualData: vwResultSet = JSON.parse(results);
                if (actualData !== null && actualData !== undefined) {
                  const arr: Array<any> = actualData.results;
                  for (let anCount = 0; anCount < arr.length; anCount++) {
                    this.availableNotification.set(arr[anCount].id, true);
                  }
                } else {
                }
              },
              () => {}
            );
          } else {
          }
        },
        () => {}
      );
    }
    //TODO: right now not use, if we use Hierarchy of echelons than use

    this.selections.push(0);
  }

  private getGroupInfo() {
    this.nameLoading = true;
    this.GroupService.v1SecurityGroupGet$Response().subscribe(
      s => {
        let results: any = s.body;
        let actualData: vwResultSet = JSON.parse(results);
        this.nameLoading = false;
        if (actualData !== null && actualData !== undefined) {
          this.groupData = actualData.results;
          this.EditGroup = this.groupData.filter(
            item => item.id === this.groupId
          )[0];
        } else {
          this.nameLoading = false;
        }
      },
      () => {
        this.nameLoading = false;
      }
    );
  }

  private getGroupUsers() {
    this.usersLoading = true;
    this.GroupService.v1SecurityGroupUsersGroupIdGet$Response({
      groupId: this.groupId
    }).subscribe(
      s => {
        this.usersLoading = false;
        let results = s.body as any;
        let actualData = JSON.parse(results);
        if (actualData !== null && actualData !== undefined) {
          this.gepage.pageNumber = 0;
          this.gepage.size = 10;
          this.GroupEmployees = actualData.results || [];
          this.GroupEmployees.forEach(row => {
            if (row.lastName) {
              row['fullName'] = row.lastName + ', ' + row.firstName;
            } else {
              row['fullName'] = row.firstName;
            }
          });
          this.OriginalGroupEmployees = [...this.GroupEmployees];
          this.updateEmpDatatableFooterPage();
          this.usersLoading = false;
        } else {
          this.usersLoading = false;
        }
      },
      () => {
        this.usersLoading = false;
      }
    );
  }

  //TODO: right now not use, if we use Hierarchy of echelons than use

  public searchUsers() {
    let filterList = [...this.OriginalGroupEmployees];

    if (this.searchUser !== '') {
      filterList = filterList.filter(
        item =>
          this.matchName(item, this.searchUser, 'lastName') ||
          this.matchName(item, this.searchUser, 'firstName') ||
          this.matchName(item, this.searchUser, 'primaryOffice') ||
          this.matchName(item, this.searchUser, 'primaryOfficeName') ||
          this.matchName(item, this.searchUser, 'jobTitle') ||
          this.matchName(item, this.searchUser, 'email') ||
          UtilsHelper.matchFullEmployeeName(item, this.searchUser)
      );
    }

    this.GroupEmployees = filterList;
    this.updateEmpDatatableFooterPage();
  }

  /**
   * search record from tables
   *
   * @private
   * @param {*} item
   * @param {string} searchValue
   * @param {*} fieldName
   * @returns {boolean}
   * @memberof ListComponent
   */
  private matchName(item: any, searchValue: string, fieldName): boolean {
    let searchName;
    if (fieldName === 'primaryOffice') {
      searchName =
        item[fieldName] && item[fieldName]['name']
          ? item[fieldName]['name'].toString().toUpperCase()
          : '';
    } else {
      searchName = item[fieldName]
        ? item[fieldName].toString().toUpperCase()
        : '';
    }
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  public pageChangeEmp(e) {
    this.pangeSelectedEmp = e.page;
  }

  public changeEmpPageSize() {
    this.gepage.size = +this.pageSelectorEmp.value;
    this.updateEmpDatatableFooterPage();
  }

  public changePageEmp() {
    this.gepage.pageNumber = this.pangeSelectedEmp - 1;
    if (this.pangeSelectedEmp == 1) {
      this.updateEmpDatatableFooterPage();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  /** update Attorney table footer page count */
  public updateEmpDatatableFooterPage() {
    this.gepage.totalElements = this.GroupEmployees.length;
    this.gepage.totalPages = Math.ceil(
      this.GroupEmployees.length / this.gepage.size
    );
    this.gepage.pageNumber = 0;
    this.pangeSelectedEmp = 1;
    this.groupEmployeesTable.offset = 0;
    UtilsHelper.aftertableInit();
  }

  public OnEmployeesRemoved(rowId: number,content,$event) {
    $event.target.closest('datatable-body-cell').blur();
    this.modalService
      .open(content, {
        windowClass: 'modal-md',
        centered: true,
        backdrop: 'static'
      })
      .result.then(res => {
        if (res) {
          if (this.RemovedEmployees.indexOf(rowId) < 0) {
            this.RemovedEmployees.push(rowId);
            this.dataEntered = true;
          }

          const ind = this.GroupEmployees.findIndex(v => v.id == rowId);
          this.GroupEmployees.splice(ind, 1);
          this.GroupEmployees = [...this.GroupEmployees];

          let indexInSelectedUsers = this.selected.findIndex(a => a.id == rowId);
          if (indexInSelectedUsers > -1) {
            this.selected.splice(indexInSelectedUsers, 1);
            this.selected = [...this.selected];
          }

          this.dataEntered = true;
          this.OriginalGroupEmployees = [...this.GroupEmployees];
          const addeddIndex = this.AddedEmployees.indexOf(rowId);
          if (addeddIndex > -1) {
            this.AddedEmployees.splice(addeddIndex, 1);
          }
          this.updateEmpDatatableFooterPage();
        }
      });
  }

  public OnEmployeesAdded() {
    for (let eCount = 0; eCount < this.selected.length; eCount++) {
      if (this.AddedEmployees.indexOf(this.selected[eCount].id) < 0) {
        this.AddedEmployees.push(this.selected[eCount].id);
        const ind = this.OfficeEmployees.findIndex(
          v => v.id == this.selected[eCount].id
        );
        this.GroupEmployees.push(
          this.OfficeEmployees.filter((v, i) => i == ind)[0]
        );
        this.GroupEmployees.forEach(row => {
          if (row.lastName) {
            row['fullName'] = row.lastName + ', ' + row.firstName;
          } else {
            row['fullName'] = row.firstName;
          }

          if (row.primaryOffice) {
            row['primaryOfficeName'] = row.primaryOffice.name;
          }
        });
        this.GroupEmployees = [...this.GroupEmployees];
        this.OriginalGroupEmployees = [...this.GroupEmployees];
      }
    }
    this.dataEntered = true;

    this.updateEmpDatatableFooterPage();
  }

  public onEmailNotificationChecked(notiId: number, evt: any) {
    if (evt.target.checked == true) {
      let ind = this.AddedNotifications.findIndex(v => v == notiId);
      if (ind < 0) {
        this.AddedNotifications.push(notiId);
      }
      ind = this.RemovedNotifications.findIndex(v => v == notiId);
      if (ind >= 0) {
        this.RemovedNotifications.splice(ind, 1);
      }
    } else {
      let ind = this.RemovedNotifications.findIndex(v => v == notiId);
      if (ind < 0) {
        this.RemovedNotifications.push(notiId);
      }
      ind = this.AddedNotifications.findIndex(v => v == notiId);
      if (ind >= 0) {
        this.AddedNotifications.splice(ind, 1);
      }
    }
  }

  private checkUncheck(ddlList: Array<any>, selId: number) {
    for (let uCount = 0; uCount < ddlList.length; uCount++) {
      if (ddlList[uCount].id == selId) {
        ddlList[uCount].checked = true;
      } else {
        ddlList[uCount].checked = false;
      }
      this.checkUncheck(ddlList[uCount].childArray, selId);
    }
  }

  public getDropdownSelected(event) {
    this.title = '';
    if (event.length > 0) {
      this.title = event.length;
    } else {
      this.title = 'All';
    }
    if (this.selections.length > 0) {
      const tSel = this.selections[this.selections.length - 1];
      this.selections = [];
      this.selections[0] = tSel;
      this.dropdownList.forEach(item => (item.checked = false));
      for (let arCount = 0; arCount < this.dropdownList.length; arCount++) {
        this.checkUncheck(this.dropdownList[arCount].childArray, tSel);
      }
      this.dropdownList = [...this.dropdownList];
    }
  }

  public onMultiSelectSelectedOptions() {}

  public clearFilter() {
    this.selections = [];
    this.dropdownList.forEach(item => (item.checked = false));
    this.title = 'All';
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

  public addNotification(content) {
    this.groupByEmailTemplateList = UtilsHelper.clone(
      this._groupByEmailTemplateList
    );

    this.modalService
      .open(content, {
        windowClass: 'modal-xlg',
        centered: true,
        backdrop: 'static'
      })
      .result.then(res => {
        if (res) {
          this._groupByEmailTemplateList = UtilsHelper.clone(
            this.groupByEmailTemplateList
          );
        }
      });
  }

  private SaveGroup(groupId: number) {
    for (let eCount = 0; eCount < this.RemovedEmployees.length; eCount++) {
      const ind = this.AddedEmployees.findIndex(
        v => v == this.RemovedEmployees[eCount]
      );
      if (ind > 0) {
        this.AddedEmployees.splice(ind, 1);
      }
    }

    var employeeObserbles = [];

    for (let eCount = 0; eCount < this.AddedEmployees.length; eCount++) {
      const viewModel: vwSecurityGroupMember = {};
      viewModel.personId = this.AddedEmployees[eCount];
      const groups = new Array<number>();
      groups.push(groupId);
      viewModel.groupIds = groups;
      employeeObserbles.push(
        this.GroupService.v1SecurityGroupUserPost$Json$Response({
          body: viewModel
        })
      );
    }

    for (let eCount = 0; eCount < this.RemovedEmployees.length; eCount++) {
      const viewModel: vwSecurityGroupMember = {};
      viewModel.personId = this.RemovedEmployees[eCount];
      const groups = new Array<number>();
      groups.push(groupId);
      viewModel.groupIds = groups;
      employeeObserbles.push(
        this.GroupService.v1SecurityGroupUserDelete$Json$Response({
          body: viewModel
        })
      );
    }

    let allTemplates = [];

    for (let temp in this._groupByEmailTemplateList) {
      allTemplates.push(
        ...this._groupByEmailTemplateList[temp].templateGroupData
      );
    }

    let emailNotificationBody = {
      securityGroupId: groupId,
      notifications: allTemplates.map(v => {
        return {
          emailTemplateCode: v.emailTemplateCode,
          isVisible: v.isVisible
        } as vwSecurityGroupNotification;
      })
    };

    if (employeeObserbles.length > 0) {
      forkJoin(employeeObserbles).subscribe(() => {
        this.saveNotificationSettings(emailNotificationBody);
      });
    } else {
      this.saveNotificationSettings(emailNotificationBody);
    }

    for (let nCount = 0; nCount < this.AddedNotifications.length; nCount++) {
      this.NotiService.v1NotificationEmailSecurityGroupIdNotificationIdPost$Response(
        {
          securityGroupId: groupId,
          notificationId: this.AddedNotifications[nCount]
        }
      ).subscribe(() => {});
    }
    for (let nCount = 0; nCount < this.RemovedNotifications.length; nCount++) {
      this.NotiService.v1NotificationEmailSecurityGroupIdNotificationIdDelete$Response(
        {
          securityGroupId: groupId,
          notificationId: this.RemovedNotifications[nCount]
        }
      ).subscribe(() => {});
    }

    if (this.groupStatus === 'create') {
      this.toastDisplay.showSuccess(this.errorData.group_created);
    } else {
      this.toastDisplay.showSuccess(this.errorData.group_updated);
    }
  }

  public onFinalSave() {
    this.dataEntered = false;
    this.editGroupErrMsg = '';
    if (!this.EditGroup.name) {
      this.editGroupErrMsg = this.errorData.new_group_error;
      return;
    }
    if (this.moduleList && this.moduleList.length > 0) {
      let validation = this.moduleList.every(
        obj => obj.isNoVisibility || obj.isViewOnly || obj.isEdit || obj.isAdmin
      );
      if (!validation) {
        this.toastDisplay.showError(this.errorData.permission_required);
        return;
      }
    }

    this.saveLoader = true;

    if (this.groupId < 0) {
      this.groupStatus = 'create';
      let viewModel: vwSecurityGroup = { name: '' };
      viewModel.name = this.EditGroup.name;
      this.GroupService.v1SecurityGroupPost$Json$Response({
        body: viewModel
      }).subscribe(
        s => {
          const results: any = s.body;
          const actualData: vwResultSet = JSON.parse(results);
          if (actualData !== null && actualData !== undefined) {
            this.groupId = actualData.results;
            this.SaveGroup(this.groupId);
            this.savePermission(this.groupId);
            this.router.navigate(['/access-management/list']);
          } else {
            this.saveLoader = false;
          }
        },
        () => {
          this.saveLoader = false;
        }
      );
    } else {
      this.groupStatus = 'update';
      let viewModel: vwSecurityGroup = { name: '' };
      viewModel.id = this.EditGroup.id;
      viewModel.name = this.EditGroup.name;
      viewModel.tenantId = this.EditGroup.tenantId;
      this.savePermission(this.EditGroup.id);
      this.GroupService.v1SecurityGroupPut$Json$Response({
        body: viewModel
      }).subscribe(
        s => {
          const results: any = s.body;
          const actualData: vwResultSet = JSON.parse(results);
          if (actualData !== null && actualData !== undefined) {
            this.groupId = actualData.results;
            this.SaveGroup(this.groupId);
            this.navigateAfterSave();
            this.saveLoader = false;
          } else {
            this.saveLoader = false;
          }
        },
        () => {
          this.saveLoader = false;
        }
      );
    }
  }

  private savePermission(groupId: number) {
    const obs = this.moduleList.map(item => {
      const viewModel: vwObjectVisibility = {};
      viewModel.id = item.id;
      viewModel.name = item.name;
      viewModel.code = item.code;
      viewModel.echelonId = item.echelonId;
      viewModel.echelonName = item.echelonName;
      viewModel.isNoVisibility = item.isNoVisibility;
      viewModel.isViewOnly = item.isViewOnly;
      viewModel.isEdit = item.isEdit;
      viewModel.isAdmin = item.isAdmin;
      viewModel.securityGroupId = groupId;
      viewModel.securityGroupObjectVisibilityId =
        item.securityGroupObjectVisibilityId;
      if (item.securityGroupObjectVisibilityId === 0) {
        viewModel.id = 0;
        return this.ObjectVisService.v1ObjectVisibilityGroupGroupIdPost$Json$Response(
          { groupId: groupId, body: viewModel }
        );
      } else {
        return this.ObjectVisService.v1ObjectVisibilityGroupGroupIdPut$Json$Response(
          { groupId: groupId, body: viewModel }
        );
      }
    });

    forkJoin(obs).subscribe(() => {
      this.reloadPermission();
    });
  }

  public saveNotificationSettings(body) {
    this.GroupService.v1SecurityGroupAddOrUpdateNotificationSettingsPost$Json$Response(
      { body: body }
    ).subscribe(
      s => {},
      () => {}
    );
  }

  private navigateAfterSave() {
    if (this.employeeId) {
      localStorage.setItem('check permissions', 'true');
      this.router.navigate(['/employee/profile'], {
        queryParams: {
          employeeId: this.employeeId
        }
      });
    } else {
      this.router.navigate(['/access-management/list']);
    }
  }

  private reloadPermission() {
    this.objectVisibilityService
      .v1ObjectVisibilityUserGet({})
      .pipe(
        map(res => {
          return JSON.parse(res as any).results as any[];
        })
      )
      .subscribe(permission => {
        let permisionList = permission || [];
        let pList = {};
        if (permisionList && permisionList.length > 0) {
          permisionList.map(obj => {
            UtilsHelper.permission.map(item => {
              pList[obj.code + item] = pList.hasOwnProperty(obj.code + item)
                ? pList[obj.code + item]
                  ? true
                  : obj[item]
                : obj[item];
            });
          });
        }
        this.store.dispatch(new fromRoot.GetPermissionSuccessAction(pList));
      });
  }

  @HostListener('document:keypress', ['$event']) handleKeyboardEvent(
    event: KeyboardEvent
  ) {
    this.dataEntered = true;
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  /**** function to open add usersmodal */
  openAddUsers() {
    let modalRef = this.modalService.open(AddUsersComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });
    modalRef.componentInstance.Offices = {
      offices: this.Offices
    };
    modalRef.componentInstance.alreadyAddedUsers = {
      employees: this.GroupEmployees
    };
    modalRef.result.then(
      result => {
        if (result) {
          this.selected = result.selected;
          this.OfficeEmployees = result.officeEmployees
          this.OnEmployeesAdded();
        }
      },
      reason => {
      }
    );
  }

  get geFooterHeight() {
    if (this.GroupEmployees) {
      return this.GroupEmployees.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
