import { Component, ElementRef, EventEmitter, OnInit, OnDestroy, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize, map } from 'rxjs/operators';
import * as _ from 'lodash';

import { ToastDisplay } from 'src/app/guards/toast-service';
import {
  SubscriptionList
} from 'src/app/modules/shared/auto-unsubscribe';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errors from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { TenantProfileService } from 'src/app/service/tenant-profile.service';
import {
  vwBillingSettings, vwReceiptTemplate
} from 'src/common/swagger-providers/models';
import {
  BillingService
} from 'src/common/swagger-providers/services';
import { AddTemplateComponent } from '../add-template/add-template.component';
@Component({
  selector: 'app-receipt-template',
  templateUrl: './receipt-template.component.html',
  encapsulation: ViewEncapsulation.Emulated,
})
export class ReceiptTemplateComponent implements OnInit, OnDestroy {
  subscriptions = new SubscriptionList();
  error_data = (errors as any).default;

  receiptTemplates: Array<vwReceiptTemplate>;
  selectedTemplate: vwReceiptTemplate;

  @ViewChild('receiptFile', { static: false }) public receiptFileInput: ElementRef<HTMLInputElement>;

  selectedFile: File;
  receiptFileContent: string;

  currentActive: number;

  tenantDetails: any;
  billingSettings: vwBillingSettings;
  public loading = true;

  @Output() readonly previewTemplate = new EventEmitter<vwReceiptTemplate>();
  @Output() readonly doneChanges = new EventEmitter<any>();

  constructor(
    private modalService: NgbModal,
    private billingService: BillingService,
    private tenantProfile: TenantProfileService,
    private dialogService: DialogService,
    private toastr: ToastDisplay
  ) {
    this.receiptTemplates = [];
    this.selectedTemplate = {} as vwReceiptTemplate;
    this.tenantProfile.enableSave$.next(false);
  }

  ngOnInit() {
    this.subscriptions.savechangesSub = this.tenantProfile.saveChanges$.subscribe(
      (res) => {
        if (res == 'ReceiptTemplate') {
          this.saveChanges();
        }
      }
    );

    this.getTemplates();

    let userProfile = UtilsHelper.getLoginUser();
    if (userProfile) {
      this.tenantDetails = {
        tenantId: userProfile.tenantId
      };
    }
  }

  ngOnDestroy() {
    if (this.subscriptions) {
      for (let prop in this.subscriptions) {
        let property = this.subscriptions[prop];
        if (property && typeof property.unsubscribe === 'function') {
          property.unsubscribe();
        }
      }
    }
  }

  private getTemplates() {
    this.loading = true;
    this.subscriptions.v1BillingGetreceipttemplateGetSub = this.billingService
      .v1BillingGetreceipttemplateGet()
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {})
      )
      .subscribe(
        res => {
          this.receiptTemplates = res || [];
          if(this.receiptTemplates && this.receiptTemplates.length){
            this.receiptTemplates = _.sortBy(this.receiptTemplates,'templateName')
          }
          if (this.receiptTemplates.length > 0) {
            this.selectedTemplate = this.receiptTemplates[0];
          }
          this.loading = false;
        },
        error => {
          this.loading = false;
        }
      );
  }

  addTemplate() {
    let modalRef = this.modalService.open(AddTemplateComponent, {
      centered: true,
      keyboard: false,
      backdrop: 'static',
    });

    const component = modalRef.componentInstance;

    component.templateType = 'Receipt Template';
    component.acceptedType = '.html';
    component.readAsDataURL = false;

    component.isValidFile = (file) => {
      if (!file.type.match('text/html')) {
        return false;
      } else {
        return true;
      }
    };

    modalRef.result.then((res) => {
      if (res) {
        this.loading = true;
        this.billingService
          .v1BillingAddreceipttemplatePost$Json({
            body: {
              fileName: res.fileName,
              templateContent: res.templateContent,
              templateName: res.templateName,
            },
          })
          .pipe(map(UtilsHelper.mapData))
          .subscribe((response) => {
            if (response && response.length > 0) {
              this.receiptTemplates = response;
              this.loading = false;
              this.toastr.showSuccess(
                this.error_data.add_reciept_template_success
              );
              this.doneChanges.emit();
            } else {
              this.loading = false;
              this.toastr.showError('Some error occured');
            }
          },err => {
            this.loading = false;
          });
      }
    });
  }

  saveChanges() {
    if (this.receiptFileContent && this.selectedTemplate) {
      const body = {
        id: this.selectedTemplate.id,
        templateName: this.selectedTemplate.templateName,
        templateContent:
          this.receiptFileContent || this.selectedTemplate.templateContent,
      } as vwReceiptTemplate;

      this.billingService
        .v1BillingUpdatereceipttemplatePut$Json({
          body: body,
        })
        .pipe(map(UtilsHelper.mapData))
        .subscribe((response) => {
          if (response && response.length > 0) {
            this.receiptTemplates = response;
            this.toastr.showSuccess(
              this.error_data.edit_reciept_template_success
            );
            this.tenantProfile.enableSave$.next(false);
          } else {
            this.toastr.showError('Some error occured');
          }
        });
    }
  }

  downloadTemplate(row: vwReceiptTemplate) {
    this.tenantProfile.downloadHTMLTemplate(row);
    this.currentActive = null;
  }

  editTemplate(row: vwReceiptTemplate){
    let modalRef = this.modalService.open(AddTemplateComponent, {
      centered: true,
      keyboard: false,
      backdrop: 'static',
    });

    const component = modalRef.componentInstance;
    component.templateId = row.id;
    component.selectedTemplate = row;
    component.templateType = 'Receipt Template';
    component.acceptedType = '.html';
    component.readAsDataURL = false;

    component.isValidFile = (file) => {
      if (!file.type.match('text/html')) {
        return false;
      } else {
        return true;
      }
    };

    modalRef.result.then((res) => {
      if (res) {
        this.loading = true;
        this.billingService
          .v1BillingUpdatereceipttemplatePut$Json({
            body : {
              id: res.id,
              fileName: res.fileName,
              templateContent: res.templateContent,
              templateName: res.templateName
            }
          })
          .pipe(map(UtilsHelper.mapData))
          .subscribe((response) => {
            if (response && response.length > 0) {
              this.receiptTemplates = response;
              this.loading = false;
              this.toastr.showSuccess(
                this.error_data.edit_reciept_template_success
              );
              this.doneChanges.emit();
            } else {
              this.loading = false;
              this.toastr.showError('Some error occured');
            }
          },err => {
            this.loading = false;
          });
      }
    });
  }

  deleteTemplate(row: vwReceiptTemplate) {
    let msg: string = this.error_data.delete_reciept_template_confirm;
    msg = msg.replace('[TemplateName]', row.templateName.trim() + '?');

    this.dialogService
      .confirm(
        msg,
        'Delete',
        'Cancel',
        'Delete Receipt Template',
        true
      )
      .then((res) => {
        if (res) {
          this.loading = true;
          this.billingService
            .v1BillingDeletereceipttemplateTemplateIdDelete({
              templateId: row.id,
            })
            .pipe(
              map(UtilsHelper.mapData),
              finalize(() => {
              })
            )
            .subscribe((response) => {
              if (response > 0) {
                this.toastr.showSuccess(
                  this.error_data.delete_reciept_template_success
                );
                this.getTemplates();
                this.doneChanges.emit();
              } else {
                this.loading = false;
                this.toastr.showError('Some error occured');
              }
            },err => {
              this.loading = false;
            });
        }
      });
  }

  onPreviewTemplate(row: vwReceiptTemplate){
    this.previewTemplate.emit(row);
  }

  onChangeTemplateInUse(row: vwReceiptTemplate){
    this.receiptTemplates.forEach(ele => {
      if(row.id == ele.id){
        ele.templateInUse = true;
        if (
          this.subscriptions.v1BillingMarkReceiptTemplateToUseReceiptTemplateIdGet &&
          this.subscriptions.v1BillingMarkReceiptTemplateToUseReceiptTemplateIdGet.unsubscribe
        ) {
          this.subscriptions.v1BillingMarkReceiptTemplateToUseReceiptTemplateIdGet.unsubscribe();
        }

        this.subscriptions.v1BillingMarkReceiptTemplateToUseReceiptTemplateIdGet = this.billingService.v1BillingMarkReceiptTemplateToUseReceiptTemplateIdGet$Response({receiptTemplateId:row.id})
        .subscribe((response) => {
          this.toastr.showSuccess(`${row.templateName} selected for use.`);
          this.doneChanges.emit();
        });
      } else {
        ele.templateInUse = false
      }
    })
  }
  /*** open menu on action click */
  openMenu(index: number, event): void {
    setTimeout(() => {
      if (this.currentActive != index) {
        this.currentActive = index;
      } else {
        this.currentActive = null;
      }
    }, 50);
  }

  /*** closed menu on body click */
  onClickedOutside(event: any, index: number) {
    if (index == this.currentActive) this.currentActive = null;
  }

  selectFile() {
    this.receiptFileInput.nativeElement.click();
  }

  uploadFile(files: File[]) {
    let file = files[0];

    if (!file.type.match('text/html')) {
      this.receiptFileInput.nativeElement.value = null;
      return;
    }

    this.selectedFile = file;

    let reader = new FileReader();

    reader.onload = () => {
      this.receiptFileContent = reader.result as string;
      this.tenantProfile.enableSave$.next(true);
    };

    reader.readAsText(this.selectedFile);
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
