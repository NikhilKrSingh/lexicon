import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize, map } from 'rxjs/operators';
import { CreateNoteError } from 'src/app/modules/models/fillable-form.model';
import { vwBillingSettings, vwIdCodeName } from 'src/common/swagger-providers/models';
import { ClientService } from 'src/common/swagger-providers/services';
import * as errorData from '../../../shared/error.json';
import { UtilsHelper } from '../../utils.helper';

@Component({
  selector: 'app-edit-invoice-preferences',
  templateUrl: './edit-invoice-preferences.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class EditInvoicePreferencesComponent implements OnInit {
  billingSettings: vwBillingSettings;
  invoiceDeliveryList: Array<vwIdCodeName>;
  public pageType: string;
  public clientId: number;
  changeNotes: string;
  invoiceDelivery: number;
  public loading: boolean = false;
  public hasEmailExist: boolean = true;
  createNoteError: CreateNoteError;
  public errorData: any = (errorData as any).default;

  constructor(
    private activeModal: NgbActiveModal,
    private clientService: ClientService
  ) {
    this.createNoteError = new CreateNoteError();
  }

  ngOnInit() {
    if (this.billingSettings && this.billingSettings.invoiceDelivery) {
      this.invoiceDelivery = this.billingSettings.invoiceDelivery.id;
    }
    if (this.pageType === 'matter') {
      this.getClientDetails();
    }
  }

  change() {
    this.billingSettings.invoiceDelivery = {
      id: this.invoiceDelivery
    };
  }

  dismiss() {
    this.activeModal.close(null);
  }

  save() {
    let firstChar: string;
    if (this.changeNotes) {
      firstChar = this.changeNotes.charAt(0)
    }
    const pattern = '[a-zA-Z0-9_]'
    if (this.changeNotes && !firstChar.match(pattern)) {
      this.createNoteError.note = true;
      this.createNoteError.noteMessage = this.errorData.insecure_input;
    } else {
      this.activeModal.close(this.billingSettings);
    }
  }

  private getClientDetails() {
    this.loading = true;
    this.clientService
      .v1ClientClientIdGet({ clientId: this.clientId }).pipe(map(UtilsHelper.mapData),
      finalize(() => {
        this.loading = false;
      }))
      .subscribe(res => {
        this.hasEmailExist = this.hasEmail(res);
        if (!this.hasEmailExist) {
          let paperonly = this.invoiceDeliveryList.find(item => item.code === 'PAPER');
          this.invoiceDelivery = (paperonly) ? paperonly.id : null;
        }
      }, err => {
        this.loading = false;
      }
    );
  }

  public hasEmail(clientDetail) {
    if (clientDetail) {
      if (clientDetail.isCompany) {
        return clientDetail.primaryContactPerson ? !!clientDetail.primaryContactPerson.email : false;
      } else {
        return (clientDetail.email) ? true : false;
      }
    } else {
      return false;
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
