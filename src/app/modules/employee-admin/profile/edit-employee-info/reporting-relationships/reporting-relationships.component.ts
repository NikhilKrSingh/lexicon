import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { map } from 'rxjs/operators';
import { vwIdName } from 'src/common/swagger-providers/models';
import { MiscService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../../shared/error.json';


enum ReportRelationshipType {
  ApprovingManager = 1,
  ReportingManager = 2,
  PracticeManager = 3
}

@Component({
  selector: 'app-edit-reporting-relationships',
  templateUrl: './reporting-relationships.component.html'
})
export class EditReportingRelationshipsComponent implements OnInit {
  @ViewChild('relationForm', {static: false}) relationForm: NgForm;
  public reportingRelations: any;
  public employee: any;
  public employeeList: Array<vwIdName>;
  public relationshipType = ReportRelationshipType;
  public loading = false;
  public selectedPracticeManager: any;
  public selectedApprovingManager: any;
  public selectedDirectManager: any;
  public formSubmitted = false;
  public errorData = (errorData as any).default;

  constructor(
    private activeModal: NgbActiveModal,
    private miscService: MiscService
  ) {
    this.employeeList = [];
  }

  ngOnInit() {
    this.getAllEmployeeList();
  }

  /**
   * Bind Data To Input fields for Managers
   * @memberof EditReportingRelationshipsComponent
   */
  private setFormData() {
    if (this.reportingRelations) {
      if (this.reportingRelations.reportingManager && this.reportingRelations.reportingManager.id) {
        this.selectedDirectManager = this.reportingRelations.reportingManager.id;
      }
      if (this.reportingRelations.approvingManager && this.reportingRelations.approvingManager.id) {
        this.selectedApprovingManager = this.reportingRelations.approvingManager.id;
      }
      if (this.reportingRelations.practiceManager && this.reportingRelations.practiceManager.id) {
        this.selectedPracticeManager = this.reportingRelations.practiceManager.id;
      }

      if (!this.employeeList.some(a => a.id == this.selectedDirectManager)) {
        this.selectedDirectManager = null;
      }

      if (!this.employeeList.some(a => a.id == this.selectedApprovingManager)) {
        this.selectedApprovingManager = null;
      }

      if (!this.employeeList.some(a => a.id == this.selectedPracticeManager)) {
        this.selectedPracticeManager = null;
      }
    }
  }

  private getAllEmployeeList() {
    this.loading = true;
    this.miscService
      .v1MiscEmployeesActiveGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        })
      )
      .subscribe(empList => {
        this.employeeList = empList || [];
        const currentEmployeeIndex = this.employeeList.findIndex(object => object.id === this.employee.id);
        if (currentEmployeeIndex > -1) {
          const employeeData = this.employeeList.splice(currentEmployeeIndex, 1)[0];
          this.employeeList.unshift(employeeData);
        } else {
          const employeeData =  {
            id: this.employee.id,
            name: this.employee.lastName + ', ' + this.employee.firstName
          }
          this.employeeList.unshift(employeeData);
        }
        this.setFormData();
        this.loading = false;
      }, () => {
        this.loading = false;
      });
  }

  dismiss(reason: string) {
    this.activeModal.dismiss(reason);
  }

  save() {
    this.formSubmitted = true;
    if (this.relationForm.invalid) {
      return;
    }
    const selectedManagers = {
      reportingManagerId: this.selectedDirectManager ? this.selectedDirectManager : 0,
      approvingManagerId: this.selectedApprovingManager ? this.selectedApprovingManager : 0,
      practiceManagerId: this.selectedPracticeManager ? this.selectedPracticeManager : 0
    };
    this.activeModal.close(selectedManagers);
  }
}
