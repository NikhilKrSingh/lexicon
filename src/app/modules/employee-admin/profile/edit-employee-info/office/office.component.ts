import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { map } from 'rxjs/operators';
import { ToastDisplay } from 'src/app/guards/toast-service';
import * as errors from 'src/app/modules/shared/error.json';
import { vwEmployee, vwIdName } from 'src/common/swagger-providers/models';
import { MiscService } from 'src/common/swagger-providers/services';

interface vwIdNameWithChecked extends vwIdName {
  checked: boolean;
}

@Component({
  selector: 'app-edit-office',
  templateUrl: './office.component.html'
})
export class EditOfficeComponent implements OnInit {
  public employee: vwEmployee;
  public title: string;
  public filterName = 'Apply';
  public selections: Array<number> = [];
  public officeList: Array<vwIdNameWithChecked>;
  public primaryOffice: number;
  public formSubmitted = false;
  public selectedMessage: string = 'offices selected';

  errorData = (errors as any).default;
  public loading: boolean = false;

  constructor(
    private activeModal: NgbActiveModal,
    private miscService: MiscService,
    private toastDisplay: ToastDisplay
  ) {
    this.primaryOffice = 0;
  }

  ngOnInit() {
    this.loading = true;
    if (this.employee) {
      if (this.employee.primaryOffice) {
        this.primaryOffice = this.employee.primaryOffice.id;
      }
      this.selections = this.employee.secondaryOffices.map(a => a.id);
      if (this.selections.length > 0) {
        this.title = this.selections.length.toString();
        this.selectedMessage = (this.selections && this.selections.length === 1) ? 'office selected' : 'offices selected';
      } else {
        this.title = 'Select Secondary Office(s)';
      }
    }

    this.miscService
      .v1MiscOfficesGet()
      .pipe(
        map(res => {
          return JSON.parse(res as any).results;
        })
      )
      .subscribe(res => {
        this.officeList = res;
        this.loading = false;
        this.selections.forEach(office => {
          let index = this.officeList.findIndex(a => a.id == office);
          if (index > -1) {
            this.officeList[index].checked = true;
          }
        });
      });
  }

  onPrimaryOfficeChange() {
    if (this.employee && this.officeList) {
      const office = this.officeList.find(a => a.id == this.primaryOffice);
      if (office) {
        this.employee.primaryOffice = office;
      } else {
        this.employee.primaryOffice = null;
      }
    }
  }

  public getDropdownSelected(event) {
    this.title = '';

    if (
      this.employee.primaryOffice &&
      this.employee.secondaryOffices &&
      this.employee.secondaryOffices.length
    ) {
      this.validateSecondaryOffice();
    }

    if (event.length > 0) {
      this.title = event.length;
      this.selectedMessage = (event && event.length === 1) ? 'office selected' : 'offices selected';
    } else {
      this.title = 'Select Secondary Office(s)';
    }
  }

  private validateSecondaryOffice() {
    this.mapSecondaryOffice();

    if (
      this.employee.secondaryOffices.some(
        a => a.id == this.employee.primaryOffice.id
      )
    ) {
      const index = this.employee.secondaryOffices.findIndex(
        s => s.id == this.employee.primaryOffice.id
      );

      if (index > -1) {
        this.employee.secondaryOffices.splice(index, 1);

        setTimeout(() => {
          this.officeList.forEach(item => {
            if (this.employee.primaryOffice.id == item.id) {
              item.checked = false;
            }
          });
        }, 100);

        let sIndex = this.selections.indexOf(this.employee.primaryOffice.id);
        if (sIndex > -1) {
          this.selections.splice(sIndex, 1);
        }

        this.toastDisplay.showError(
          this.errorData.primary_office_not_same_secondary
        );
      }
    }
  }

  public onMultiSelectSelectedOptions(event) {
  }

  public clearFilter() {
    this.selections = [];
    this.officeList.forEach(item => {
      item.checked = false;
    });
    this.title = 'Select Secondary Office(s)';
  }

  public applyFilter() {}

  dismiss(reason) {
    this.activeModal.dismiss(reason);
  }

  private mapSecondaryOffice() {
    if (this.officeList) {
      this.employee.secondaryOffices = this.officeList.filter(a => a.checked);
    }
  }

  save() {
    this.mapSecondaryOffice();
    this.formSubmitted = true;
    if (this.employee.primaryOffice) {
      if (this.employee.secondaryOffices && this.employee.secondaryOffices.length) {
        const index = this.employee.secondaryOffices.findIndex(
          a => a.id == this.employee.primaryOffice.id
        );
        if (index > -1) {
          this.toastDisplay.showError(this.errorData.primary_office_not_same_secondary);
        } else {
          this.activeModal.close(this.employee);
        }
      } else {
        this.activeModal.close(this.employee);
      }
    } else {
      return;
    }
  }
}
