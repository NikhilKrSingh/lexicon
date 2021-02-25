import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { SecurityGroupService } from 'src/common/swagger-providers/services';
import { SharedModule } from '../../shared/shared.module';
import { ListComponent } from './list.component';

let securityGroupMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQ5ODU1NjQsImV4cCI6MTYwNTAyODc2NCwiaWF0IjoxNjA0OTg1NTY0fQ.WMJCMPP5JobE1o2ABvKxjn10I6ixR82OtYKOAr_LnCw",
  "results": [
    {
      "id": 321,
      "tenantId": 1006,
      "name": "view client",
      "readOnly": null,
      "isVisible": true
    },
    {
      "id": 322,
      "tenantId": 1006,
      "name": "GroupForTestingWithDifferentPermissions",
      "readOnly": null,
      "isVisible": true
    },
    {
      "id": 326,
      "tenantId": 1006,
      "name": "6394 8 Sept",
      "readOnly": null,
      "isVisible": true
    },
    {
      "id": 327,
      "tenantId": 1006,
      "name": "vikas group ",
      "readOnly": null,
      "isVisible": true
    },
    {
      "id": 328,
      "tenantId": 1006,
      "name": "Private_Ravi_Do not Use",
      "readOnly": true,
      "isVisible": true
    },
    {
      "id": 329,
      "tenantId": 1006,
      "name": "Deep",
      "readOnly": null,
      "isVisible": true
    },
    {
      "id": 332,
      "tenantId": 1006,
      "name": "View Read Only",
      "readOnly": null,
      "isVisible": true
    },
    {
      "id": 333,
      "tenantId": 1006,
      "name": "jagat Group 1",
      "readOnly": null,
      "isVisible": true
    },
    {
      "id": 334,
      "tenantId": 1006,
      "name": "admin",
      "readOnly": null,
      "isVisible": true
    },
    {
      "id": 356,
      "tenantId": 1006,
      "name": "Snehdeep_Group",
      "readOnly": true,
      "isVisible": false
    }
  ]
}

let securityGroupHierarchyMock = {
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY3IiOiIxMzA0IiwiYWN0b3J0IjoiQWRtaW4iLCJhbXIiOiJMZXhpY29uIGRldiIsImF1ZCI6IlRlbmFudEFkbWluQFJlc3BvbnNpYmxlIEF0dG9ybmV5QE9yaWdpbmF0aW5nIEF0dG9ybmV5QEF0dG9ybmV5QEVtcGxveWVlQEJpbGxpbmcgQXR0b3JuZXlAQ29uc3VsdCBBdHRvcm5leUBBZG1pbiBTZXR0aW5nIFRDMSIsImF6cCI6IjEwMDYiLCJlbWFpbCI6IjUiLCJmYW1pbHlfbmFtZSI6IlRlbmFudCBBZG1pbiIsImdlbmRlciI6IiIsIlRpZXIiOiJBc2NlbmRpbmciLCJDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJSZXBvcnRpbmdDb25uZWN0aW9uU3RyaW5nIjoiMU92SDJCQk1LVlMxTGliOWpPODN5TE9RSXNTNk5EYjZ2SjkzOGJtaHBoaXFBSTdUZGpTeDc1MjFNajFhSTlkUmo4SnltT0MxN0J2M2wvMForckVZNTFpQlgvbWQreVVtV09jczdsakR4RkRvTUVoZmRlSXlrRjJPVmFoVkdmOXg2MDl4NHozOU9DUzZ4Z29oR1VBTEpRPT0iLCJuYmYiOjE2MDQ5ODU1NjQsImV4cCI6MTYwNTAyODc2NCwiaWF0IjoxNjA0OTg1NTY0fQ.WMJCMPP5JobE1o2ABvKxjn10I6ixR82OtYKOAr_LnCw",
  "results": [
    {
      "securityGroupId": 321,
      "hierarchyId": 0,
      "securityGroup": "view client",
      "hierarchy": "",
      "sort": 0
    },
    {
      "securityGroupId": 322,
      "hierarchyId": 0,
      "securityGroup": "GroupForTestingWithDifferentPermissions",
      "hierarchy": "",
      "sort": 0
    },
    {
      "securityGroupId": 326,
      "hierarchyId": 0,
      "securityGroup": "6394 8 Sept",
      "hierarchy": "",
      "sort": 0
    },
    {
      "securityGroupId": 327,
      "hierarchyId": 0,
      "securityGroup": "vikas group ",
      "hierarchy": "",
      "sort": 0
    },
    {
      "securityGroupId": 329,
      "hierarchyId": 0,
      "securityGroup": "Deep",
      "hierarchy": "",
      "sort": 0
    },
    {
      "securityGroupId": 332,
      "hierarchyId": 0,
      "securityGroup": "View Read Only",
      "hierarchy": "",
      "sort": 0
    },
    {
      "securityGroupId": 333,
      "hierarchyId": 0,
      "securityGroup": "jagat Group 1",
      "hierarchy": "",
      "sort": 0
    },
    {
      "securityGroupId": 334,
      "hierarchyId": 0,
      "securityGroup": "admin",
      "hierarchy": "",
      "sort": 0
    },
    {
      "securityGroupId": 356,
      "hierarchyId": 0,
      "securityGroup": "Snehdeep_Group",
      "hierarchy": "",
      "sort": 0
    }
  ]
};

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;
  let groupService: SecurityGroupService;
  let toaster: ToastDisplay;
  let router: Router;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        HttpClientTestingModule,
        RouterTestingModule,
        ToastrModule.forRoot({
          closeButton: true
        }),
        BrowserAnimationsModule,
      ],
      declarations: [ ListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListComponent);
    groupService = TestBed.get(SecurityGroupService);
    toaster = TestBed.get(ToastDisplay);
    router = TestBed.get(Router);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('security groups, and groups hierarcy should called in ngOnInIt', () => {
    let res = {body: JSON.stringify(securityGroupMock)};
    let res1 = {body: JSON.stringify(securityGroupHierarchyMock)};
    spyOn(groupService, 'v1SecurityGroupGet$Response').and.returnValue(of(res) as any);
    spyOn(groupService, 'v1SecurityGroupHierarchyListPost$Json$Response').and.returnValue(of(res1) as any);
    spyOn(component, 'calcTotalPages').and.callThrough();
    component.ngOnInit();

    expect(component.tableData.length).toBe(8, 'readOnly true skipped tableData length');
    expect(component.originalData.length).toBe(8);
    expect(component.loading).toBe(false);
    expect(component.calcTotalPages).toHaveBeenCalled();
  });

  it('security groups success, and groups hierarcy other then 200 status code ngOnInIt', () => {
    let res = {body: JSON.stringify(securityGroupMock)};
    spyOn(groupService, 'v1SecurityGroupGet$Response').and.returnValue(of(res) as any);
    spyOn(groupService, 'v1SecurityGroupHierarchyListPost$Json$Response').and.returnValue(throwError({error: 'error'}));
    spyOn(component, 'calcTotalPages').and.callThrough();
    spyOn(toaster, 'showError').and.callThrough();

    component.ngOnInit();

    expect(component.tableData.length).toBe(8, 'readOnly true skipped tableData length');
    expect(component.originalData.length).toBe(8);
    expect(component.loading).toBe(false);
    expect(component.calcTotalPages).toHaveBeenCalled();
    expect(toaster.showError).toHaveBeenCalledWith('Other than 200 status code returned');
  });

  it('security groups error api ngOnInIt', () => {
    let res = {body: null};
    spyOn(groupService, 'v1SecurityGroupGet$Response').and.returnValue(of(res) as any);
    spyOn(toaster, 'showError').and.callThrough();

    component.ngOnInit();

    expect(component.loading).toBe(false);
    expect(toaster.showError).toHaveBeenCalledWith('Api throws error');
  });

  it('security groups catch error Other than 200 status code returned ngOnInIt', () => {
    spyOn(groupService, 'v1SecurityGroupGet$Response').and.returnValue(throwError({error: 'error'}));
    spyOn(toaster, 'showError').and.callThrough();

    component.ngOnInit();

    expect(component.loading).toBe(false);
    expect(toaster.showError).toHaveBeenCalledWith('Other than 200 status code returned');
  });

  it('search by groupname', () => {
    component.originalData = securityGroupMock.results;
    const event = new KeyboardEvent('keyup', {
      bubbles : true, cancelable : true, shiftKey : false
    });
    component.searchGroup = 'view';
    let search = fixture.debugElement.query(By.css('#q1'));
    search.nativeElement.dispatchEvent(event);

    expect(component.tableData.length).toBe(2);
  });

  it('create new group should navigate', () => {
    spyOn(component, 'createNewGroup').and.callThrough();
    const navigateSpy = spyOn(router, 'navigate');

    let createGroupBtn = fixture.debugElement.query(By.css('#create-new-group'));
    createGroupBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.createNewGroup).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/access-management/create']);
  });

  it('edit group should navigate', () => {
    component.tableData = securityGroupMock.results;
    fixture.detectChanges();
    spyOn(component, 'EditGroup').and.callThrough();
    const navigateSpy = spyOn(router, 'navigate');

    let editGroupBtn = fixture.debugElement.query(By.css('#edit-group-index-0'));
    editGroupBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.EditGroup).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/access-management/create'], { queryParams: { groupId: 326 }});
  });

  it('copy group success', () => {
    let res = {body: JSON.stringify({results: true, token: 'fake-token'})};
    component.tableData = securityGroupMock.results;
    fixture.detectChanges();
    spyOn(component, 'CopyGroup').and.callThrough();
    spyOn(groupService, 'v1SecurityGroupDuplicateIdGet$Response').and.returnValue(of(res) as any);

    let copyGroupBtn = fixture.debugElement.query(By.css('#copy-group-index-0'));
    copyGroupBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.CopyGroup).toHaveBeenCalled();
  });

  it('copy group api throw error', () => {
    let res = {body: JSON.stringify(null)};
    component.tableData = securityGroupMock.results;
    fixture.detectChanges();
    spyOn(component, 'CopyGroup').and.callThrough();
    spyOn(groupService, 'v1SecurityGroupDuplicateIdGet$Response').and.returnValue(of(res) as any);
    spyOn(toaster, 'showError').and.callThrough();

    let copyGroupBtn = fixture.debugElement.query(By.css('#copy-group-index-0'));
    copyGroupBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.CopyGroup).toHaveBeenCalled();
    expect(toaster.showError).toHaveBeenCalledWith('Api throws error');
  });

  it('copy group api throw Other than 200 status code returned', () => {
    component.tableData = securityGroupMock.results;
    fixture.detectChanges();
    spyOn(component, 'CopyGroup').and.callThrough();
    spyOn(groupService, 'v1SecurityGroupDuplicateIdGet$Response').and.returnValue(throwError({error: 'error'}));
    spyOn(toaster, 'showError').and.callThrough();

    let copyGroupBtn = fixture.debugElement.query(By.css('#copy-group-index-0'));
    copyGroupBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.CopyGroup).toHaveBeenCalled();
    expect(toaster.showError).toHaveBeenCalledWith('Other than 200 status code returned');
  });

  it('deactive group success', () => {
    let res = {body: JSON.stringify({results: true, token: 'fake-token'})};
    component.tableData = securityGroupMock.results;
    fixture.detectChanges();
    spyOn(component, 'DeactivateGroup').and.callThrough();
    spyOn(groupService, 'v1SecurityGroupIdDelete$Response').and.returnValue(of(res) as any);

    let deactiveBtn = fixture.debugElement.query(By.css('#deactive-group-index-0'));
    deactiveBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.DeactivateGroup).toHaveBeenCalled();
  });

  it('deactive group api throw error', () => {
    let res = {body: JSON.stringify(null)};
    component.tableData = securityGroupMock.results;
    fixture.detectChanges();
    spyOn(component, 'DeactivateGroup').and.callThrough();
    spyOn(groupService, 'v1SecurityGroupIdDelete$Response').and.returnValue(of(res) as any);
    spyOn(toaster, 'showError').and.callThrough();

    let deactiveBtn = fixture.debugElement.query(By.css('#deactive-group-index-0'));
    deactiveBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.DeactivateGroup).toHaveBeenCalled();
    expect(toaster.showError).toHaveBeenCalledWith('Api throws error');
  });

  it('deactive group api throw Other than 200 status code returned', () => {
    component.tableData = securityGroupMock.results;
    fixture.detectChanges();
    spyOn(component, 'DeactivateGroup').and.callThrough();
    spyOn(groupService, 'v1SecurityGroupIdDelete$Response').and.returnValue(throwError({error: 'error'}));
    spyOn(toaster, 'showError').and.callThrough();

    let deactiveBtn = fixture.debugElement.query(By.css('#deactive-group-index-0'));
    deactiveBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.DeactivateGroup).toHaveBeenCalled();
    expect(toaster.showError).toHaveBeenCalledWith('Other than 200 status code returned');
  });

  it('reactivate group success', () => {
    let res = {body: JSON.stringify({results: true, token: 'fake-token'})};
    component.tableData = securityGroupMock.results;
    fixture.detectChanges();
    spyOn(component, 'ReactivateGroup').and.callThrough();
    spyOn(groupService, 'v1SecurityGroupReactivateIdGet$Response').and.returnValue(of(res) as any);

    let reactivateBtn = fixture.debugElement.query(By.css('#reactive-group-index-6'));
    reactivateBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.ReactivateGroup).toHaveBeenCalled();
  });

  it('reactivate group api throw error', () => {
    let res = {body: JSON.stringify(null)};
    component.tableData = securityGroupMock.results;
    fixture.detectChanges();
    spyOn(component, 'ReactivateGroup').and.callThrough();
    spyOn(groupService, 'v1SecurityGroupReactivateIdGet$Response').and.returnValue(of(res) as any);
    spyOn(toaster, 'showError').and.callThrough();

    let reactivateBtn = fixture.debugElement.query(By.css('#reactive-group-index-6'));
    reactivateBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.ReactivateGroup).toHaveBeenCalled();
    expect(toaster.showError).toHaveBeenCalledWith('Api throws error');
  });

  it('reactivate group api throw Other than 200 status code returned', () => {
    component.tableData = securityGroupMock.results;
    fixture.detectChanges();
    spyOn(component, 'ReactivateGroup').and.callThrough();
    spyOn(groupService, 'v1SecurityGroupReactivateIdGet$Response').and.returnValue(throwError({error: 'error'}));
    spyOn(toaster, 'showError').and.callThrough();

    let reactivateBtn = fixture.debugElement.query(By.css('#reactive-group-index-6'));
    reactivateBtn.nativeElement.dispatchEvent(new Event('click'));

    expect(component.ReactivateGroup).toHaveBeenCalled();
    expect(toaster.showError).toHaveBeenCalledWith('Other than 200 status code returned');
  });

  it('on select row should navigate to edit', () => {
    spyOn(component, 'EditGroup').and.callThrough();
    const navigateSpy = spyOn(router, 'navigate');

    const event = {row: {id : 1}, type: 'click'};

    expect(component.EditGroup).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/access-management/create'], { queryParams: { groupId: 1 }});
  });
});
