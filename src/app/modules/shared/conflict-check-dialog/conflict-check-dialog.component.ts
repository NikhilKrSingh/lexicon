import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { ExporttocsvService } from 'src/app/service/exporttocsv.service';
import { vwConflictPerson } from '../../models';
import * as errors from '../../shared/error.json';

@Component({
  selector: 'app-conflict-check-dialog',
  templateUrl: './conflict-check-dialog.component.html',
  styleUrls: ['./conflict-check-dialog.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class ConflictCheckDialogComponent implements OnInit {
  hasConflicts = true;
  conflicts: Array<vwConflictPerson>;
  blockedUsers: Array<vwConflictPerson>;
  type = 'Potential Client';
  public errorData: any = (errors as any).default;
  public no_conflict_header_msg: string;
  public no_conflict_body_msg: string;
  public conflict_warning_msg: string;
  public pageType: string = 'conflict';
  public saveBtn: boolean = true;

  public ColumnMode = ColumnMode;
  dp = new DatePipe('en-US');

  header = this.errorData.potential_conflict_header;
  message = this.errorData.potential_conflict_message;
  returnButtonText = 'Return to Intake';

  currentActive: number;

  hasBlockedEmployees = false;

  constructor(
    private activeModal: NgbActiveModal,
    private exportToCSVService: ExporttocsvService
  ) {}

  ngOnInit() {
    if (this.pageType === 'createnewpotentialcontact' || this.pageType === 'createnewmatter' || this.pageType === 'convertclient') {
      this.returnButtonText = 'Return to Workflow';
    }
    this.no_conflict_header_msg = (this.pageType === 'createnewpotentialcontact' || this.pageType === 'createnewmatter' || this.pageType === 'convertclient' || this.pageType == 'createclient') ? '0 Potential Conflicts Detected' : this.errorData.no_potential_conflict_header;
    if (this.pageType === 'createnewpotentialcontact') {
      this.no_conflict_body_msg = 'This potential client has no potential conflicts.';
    } else if (this.pageType === 'createnewmatter') {
      this.no_conflict_body_msg = 'This matter has no potential conflicts.';
    } else if (this.pageType == 'createclient') {
      this.no_conflict_body_msg = this.errorData.no_conflict_client;
    } else if (this.pageType === 'convertclient') {
      this.no_conflict_body_msg = 'This client has no potential conflicts.';
      this.message = 'This client has a potential conflict.';
    } else {
      this.no_conflict_body_msg = this.errorData.no_potential_conflict_message;
    }
    this.conflict_warning_msg = this.errorData.potential_conflict_warning;
    if (this.blockedUsers && this.blockedUsers.length > 0) {
      this.hasBlockedEmployees = this.conflicts.some(a => {
        return this.blockedUsers.some(x => x.id == a.id);
      });

      if (this.hasBlockedEmployees) {
        this.conflicts = this.conflicts.filter(a => {
          return !this.blockedUsers.some(x => x.id == a.id);
        });
        for (const data of this.conflicts) {
          data['message'] = this.getMessage(data);
        }
      }
    }
    if(this.conflicts && this.conflicts.length){
      for (const data of this.conflicts) {
        data['message'] = this.getMessage(data);
      }
    }
  }

  disacard() {
    this.activeModal.close('discard');
  }

  close() {
    this.activeModal.close(null);
  }

  save() {
    this.activeModal.close('save');
  }

  getMessage(conflict: vwConflictPerson) {
    let message = this.type;
    if (conflict.conflictObjectType == 'Contact') {
      message += ' is ';
      message += (conflict && conflict.conflictType) ? conflict.conflictType.name : '';
      if (this.type === 'Corporate Contact') {
        message += ' of existing Client/Potential Client';
      } else {
        message += ' of existing Potential client';
      }

      if (conflict.initialConsultDate) {
        message += ' with pending consultation';
        message +=
          '(' +
          this.dp.transform(conflict.initialConsultDate, 'MM/dd/yyyy') +
          ')';
      }
    } else if (conflict.conflictObjectType == 'Association_VS_Client') {
      if (this.type === 'Corporate Contact') {
        message += ' of existing Client/Potential Client or Firm';
      } else {
        message += `'s Association is Client/Potential Client of Firm`;
      }
    } else if (conflict.conflictObjectType == 'Employee') {
      if (this.type === 'Corporate Contact') {
        message += ' is an Firm Employee';
      } else {
        message += `'s Association is an Firm Employee`;
      }
    } else {
      if (this.type === 'Corporate Contact') {
        message += ' is ';
        message += (conflict && conflict.conflictType) ? conflict.conflictType.name : '';
        message += ' of Another Client/Potential Client';
      } else {
        message += `'s Association is Client Association of Another Client/Potential Client`;
      }
    }

    return message;
  }

  /*** open menu on action click */
  openMenu(index: number, event): void {
    setTimeout(() => {
      if (this.currentActive != index) {
        this.currentActive = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        event.target
          .closest('.datatable-row-wrapper')
          .classList.add('datatable-row-hover');
      } else {
        this.currentActive = null;
        event.target
          .closest('.datatable-row-wrapper')
          .classList.remove('datatable-row-hover');
      }
    }, 50);
  }

  /*** closed menu on body click */
  onClickedOutside(event: any, index: number) {
    if (index == this.currentActive) this.currentActive = null;
  }

  viewProfile(row: vwConflictPerson, $event) {
    $event.target.closest('datatable-body-cell').blur();

    let url = `${window.location.protocol}//${window.location.host}`;

    if (row.conflictObjectType == 'Contact') {
      if (this.type === 'Corporate Contact') {
        url += `/contact/create-corporate-contact?contactId=${row.id}&state=view`;
      } else {
        url += `/contact/edit-client-association?clientId=${row.id}&isViewMode=1`;
      }
    } else if (row.conflictObjectType == 'Matter') {
      url += `/contact/edit-client-association?clientId=${row.id}&isViewMode=1`;
    } else if (row.conflictObjectType == 'Association_VS_Client') {
      if (row.clientOrPCGroup && row.clientOrPCGroup.name == 'Contact') {
        url += `/contact/view-potential-client?clientId=${row.id}&state=view`;
      } else {
        url += `/client-view/individual?clientId=${row.id}`;
      }
    } else if (row.conflictObjectType == 'Employee') {
      url += `/employee/profile?employeeId=${row.id}`;
    } else {
      url += `/employee/profile?employeeId=${row.id}`;
    }

    window.open(url, '_blank', `toolbar=yes,scrollbars=yes,resizable=yes,top=100,left=100,width=${window.innerWidth - 200},height=${window.innerHeight - 200}`);
  }

  exporttocsv() {
    let headers = [
      {
        Name: 'conflictType',
        displayName:'Conflict Type ',
        isChecked: true
      },
      {
        Name: 'conflictingParty',
        displayName:'Conflicting Party ',
        isChecked: true
      },
      {
        Name: 'matterName',
        displayName:'Matter Name',
        isChecked: true
      },
      {
        Name: 'clientName',
        displayName:'Client Name ',
        isChecked: true
      }
    ];

    let data = this.conflicts.map(row => {
      return {
        conflictType: this.getMessage(row),
        conflictingParty: (row.lastName || row.firstName) ? (row.lastName ? row.lastName + ' ' + row.firstName : row.firstName) : row.company,
        matterName: row.matterName ? row.matterName.name ? `"${row.matterName.name}"` : '' : '',
        clientName: row.clientName ? row.clientName.name ? `"${row.clientName.name}"` : '' : ''
      }
    });

    let fileName = 'Conflict Check_' + moment(new Date()).format('MMDDYYYYhhmmss');
    this.exportToCSVService.downloadFile(data, headers, fileName);
  }
}
