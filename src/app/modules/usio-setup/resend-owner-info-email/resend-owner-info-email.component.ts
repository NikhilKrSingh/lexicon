import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalDismissReasons, NgbModal, NgbModalOptions } from "@ng-bootstrap/ng-bootstrap";
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { UsioService } from 'src/common/swagger-providers/services';
import { IndexDbService } from '../../../index-db.service';
import * as errorData from '../../shared/error.json';

@Component({
  selector: 'app-resend-owner-info-email',
  templateUrl: './resend-owner-info-email.component.html',
  styleUrls: ['./resend-owner-info-email.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ResendOwnerInfoEmailComponent implements OnInit {

  modalOptions: NgbModalOptions;
  closeResult: string;
  public ownerEmailList: any[] =[];
  public ColumnMode = ColumnMode;
  public action: string = null;
  public selectedRow: number = null;
  public email = new FormControl('', [Validators.required, Validators.maxLength(50), Validators.email]);
  public formSubmitted:boolean =  false;
  public errorData: any = (errorData as any).default;
  public accountId: number = null;
  public loading: boolean = false;

  @ViewChild(DatatableComponent, { static: false }) public table: DatatableComponent;
  constructor(
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private indexDbService: IndexDbService,
    private usioService: UsioService,
    private toastService: ToastDisplay,
    private router: Router) { }

  ngOnInit() {
    this.route.queryParams.subscribe(parameter => {
      if(parameter && parameter.id && parameter.email) {
          this.ownerEmailList.push({email: parameter.email});
          this.accountId = parameter.id;
          this.ownerEmailList = [...this.ownerEmailList];
      }
    });
  }

  loadData(id: number){
  }
  openPersonalinfo(content: any, className, winClass, rowIndex?, action?) {
    this.formSubmitted = false;
    this.action = action;
    this.selectedRow = +rowIndex;
    this.email.setValue(this.action == 'edit' ? this.ownerEmailList[rowIndex].email : '');
    this.modalService
      .open(content, {
        size: className,
        windowClass:winClass,
        backdrop: 'static',
        centered: true
      })
      .result.then(
        result => {
          this.closeResult = `Closed with: ${result}`;
          this.action = null;
        },
        reason => {
          this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
        }
      );
  }
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return "by pressing ESC";
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return "by clicking on a backdrop";
    } else {
      return `with: ${reason}`;
    }
  }

  /********* Saves email *********/
  public saveEmail(action, index?) {
    this.formSubmitted = true;
    if(!(this.email && this.email.valid) && !(action == 'remove')) {
      return;
    }
    switch(action) {
      case 'add':
        this.ownerEmailList.push({email: this.email.value});
        if(this.ownerEmailList.length > 4) {
          this.ownerEmailList.splice(3, 1);
        }
        break;
      case 'remove':
        this.ownerEmailList.splice(index, 1);
        break;
      case 'edit':
        this.ownerEmailList.splice(this.selectedRow, 1 , {email: this.email.value});
        break;
    }
    this.ownerEmailList = [...this.ownerEmailList];
    this.formSubmitted = false;
    this.action = null;
    this.selectedRow = null;
    this.email.reset();
    this.modalService.dismissAll();
  }

  /******* Resends email to owners ****/
  public async resendEmailToOwners() {
    this.modalService.dismissAll();
    this.loading = true;
    try {
      const resp: any = await this.usioService
        .v1UsioSendEmailForESignPost$Response({
          bankAccountId: this.accountId,
          tenantId: 0,
          email: this.email.value })
        .toPromise()
        const res: any = resp;
      if(res && res.status == 200) {
        this.toastService.showSuccess('Owner emails sent.');
        this.loading = false;
        await this.indexDbService.removeObject('PendingSignatoryInfo');
        this.router.navigate(['/firm/account-settings']);
      }
    } catch (error) {
      this.loading = false;
    }
  }
}
