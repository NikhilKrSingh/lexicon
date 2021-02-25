import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IOffice } from 'src/app/modules/models';
import { vwEmployee } from 'src/common/swagger-providers/models';
import { MiscService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../../shared/error.json';
import { finalize } from 'rxjs/operators';


@Component({
  selector: 'app-edit-state',
  templateUrl: './edit-state.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class EditStateComponent implements OnInit {

  public employee: vwEmployee;
  public errorData: any = (errorData as any).default;
  public stateList: Array<IOffice> = [];
  public employeeForm: FormGroup = this.builder.group({
    states: new FormArray([]),
  });
  public stateIds: Array<number> = [];
  public loading: boolean = false;

  constructor(
    private builder: FormBuilder,
    private activeModal: NgbActiveModal,
    private misc: MiscService,
  ) { }

  ngOnInit() {
    this.loading = true;
    this.getState();
    this.stateIds = this.employee.states.map(obj => obj.id);
    const formArray: FormArray = this.employeeForm.get('states') as FormArray;
    /* Selected */
    if (this.stateIds && this.stateIds.length > 0) {
      this.stateIds.map(obj => {
        formArray.push(new FormControl(obj));
      });
    }
  }

  /**
   * Close model pop up
   *
   * @param {*} reason
   * @memberof EditStateComponent
   */
  dismiss(reason) {
    this.activeModal.dismiss(reason);
  }

  /**
   * Handle state select
   *
   * @param {*} event
   */
  public onCheckChange(event) {
    const formArray: FormArray = this.employeeForm.get('states') as FormArray;
    /* Selected */
    if (event.target.checked) {
      // Add a new control in the arrayForm
      formArray.push(new FormControl(event.target.value));
    } else {
      // find the unselected element
      let i: number = 0;
      formArray.controls.forEach((ctrl: FormControl) => {
        if (ctrl.value == event.target.value) {
          // Remove the unselected element from the arrayForm
          formArray.removeAt(i);
          return;
        }
        i++;
      });
    }
  }
  /**
   * Get state list
   *
   */
  public getState() {
    this.misc.v1MiscStatesGet$Response({})
    .pipe(finalize(() => { 
      this.loading = false; 
    }))
    .subscribe( suc => {
      let res: any = suc;
      this.stateList = JSON.parse(res.body).results;
      for(const data of this.stateList) {
        this.stateIds.indexOf(data.id) > -1 ? data['isSelected'] = true : data['isSelected'] = false; 
      }
    }, err => {
      console.log(err)
    });
  }

  /**
   * Save emoloyee details
   *
   * @memberof EditStateComponent
   */
  save() {
    if (this.employeeForm.value.states.length > 0) {
      this.employee['states'] = this.employeeForm.value.states.map(obj => {
        return { id: +obj }
      });
    } else {
      this.employee['states'] = [];
    }
    this.activeModal.close(this.employee);
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
