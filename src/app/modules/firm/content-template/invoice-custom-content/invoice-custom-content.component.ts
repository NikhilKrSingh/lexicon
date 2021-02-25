import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';
import { finalize, map } from 'rxjs/operators';
import { AppConfigService } from 'src/app/app-config.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { SubscriptionList } from 'src/app/modules/shared/auto-unsubscribe';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import * as errors from 'src/app/modules/shared/error.json';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { TenantProfileService } from 'src/app/service/tenant-profile.service';
import {
  vwBillingSettings, vwCustomContent, vwInvoiceTemplate
} from 'src/common/swagger-providers/models';
import {
  BillingService,
  TenantService,
  TrustAccountService
} from 'src/common/swagger-providers/services';
import { AddTemplateComponent } from '../add-template/add-template.component';



@Component({
  selector: 'app-invoice-custom-content',
  templateUrl: './invoice-custom-content.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class InvoiceCustomContentComponent implements OnInit, OnDestroy {
  subscriptions = new SubscriptionList();
  error_data = (errors as any).default;

  disclaimer: string;
  paymentInstructions: string;
  ein: string;
  public filedata: Array<File> = [];

  public config: any = {
    height: 250,
    menubar: false,
    statusbar: false,
    plugins:
      'image imagetools media  lists link autolink imagetools noneditable',
    toolbar:
      'bold italic underline | alignleft aligncenter alignright alignjustify  | outdent indent bullist numlist img',
    content_css: [
      '//fonts.googleapis.com/css?family=Lato:300,300i,400,400i',
      'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css'
    ],
    setup: (editor, tinymce) => {
      editor.ui.registry.addButton('img', {
        tooltip: 'Add Image',
        plugins: 'noneditable',
        onAction: () => {
          const inputFile = document.createElement('INPUT');
          inputFile.setAttribute('type', 'file');
          inputFile.setAttribute('accept', 'image/*');
          inputFile.setAttribute('style', 'display: none');
          inputFile.click();

          inputFile.addEventListener('change', (e: any) => {
            if (e.path && e.path[0] && e.path[0].files) {
              const file = e.path[0].files[0] as File;
              this.filedata.push(file);
              let reader = new FileReader();
              let url: string | ArrayBuffer = '';
              reader.onload = (event: ProgressEvent) => {
                url = (event.target as FileReader).result;
                editor.insertContent('<img src="' + url + '"><br>');
              };
              reader.readAsDataURL(e.target.files[0]);
            }
          });
        }
      });

    }
  };

  invoiceTemplates: Array<vwInvoiceTemplate>;

  selectedTemplate: vwInvoiceTemplate;
  selectedTemplateCustomContent: vwCustomContent;
  templateHTML: string;

  currentActive: number;

  tenantDetails: any;
  billingSettings: vwBillingSettings;

  public loading = true;
  public trustAccountEnabled: boolean;

  constructor(
    private modalService: NgbModal,
    private billingService: BillingService,
    private tenantProfile: TenantProfileService,
    private toastr: ToastDisplay,
    private dialogService: DialogService,
    private tenantService: TenantService,
    private trustAccountService: TrustAccountService,
    private appConfigService: AppConfigService
  ) {
    this.invoiceTemplates = [];
    this.tenantProfile.enableSave$.next(false);
  }

  ngOnInit() {
    this.subscriptions.savechangesSub = this.tenantProfile.saveChanges$.subscribe(
      res => {
        if (res == 'InvoiceTemplate') {
          this.loading = true;
          this.saveChanges();
        } else {
          this.loading = false;
        }
      }, () => {
        this.loading = false;
    });

    this.checkTrustAccountStatus();

    let userProfile = UtilsHelper.getLoginUser();
    if (userProfile) {
      this.tenantDetails = {
        tenantId: userProfile.tenantId,
        internalLogo: UtilsHelper.getLogo()
      };
      this.getBillingSettings();
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

  private getBillingSettings() {
    this.subscriptions.v1BillingSettingsTenantTenantIdGet = this.billingService
      .v1BillingSettingsTenantTenantIdGet({
        tenantId: this.tenantDetails.tenantId
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          if (res && res.length > 0) {
            this.billingSettings = res[0];
          } else {
            this.billingSettings = {} as vwBillingSettings;
          }

          this.getTemplates();
        }, error => {
          this.loading = false;
      });
  }

  private getTemplates() {
    this.loading = true;
    this.subscriptions.v1BillingGetinvoicetemplateGetSub = this.billingService
      .v1BillingGetinvoicetemplateGet()
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        res => {
          this.invoiceTemplates = res || [];

          if (this.billingSettings) {
            this.invoiceTemplates = _.orderBy(
              this.invoiceTemplates,
              a => a.id == this.billingSettings.invoiceTemplateId,
              ['desc']
            );
          }

          if (this.invoiceTemplates.length > 0) {
            this.selectedTemplate = this.invoiceTemplates[0];
            this.templateHTML = this.selectedTemplate.templateContent;
            this.getCustomContent();
          }
          this.loading = false;
        },
        error => {
          this.loading = false;
        }
      );
  }

  addTemplate() {
    const modalRef = this.modalService.open(AddTemplateComponent, {
      centered: true,
      keyboard: false,
      backdrop: 'static'
    });

    const component = modalRef.componentInstance;

    component.templateType = 'Invoice Template';
    component.acceptedType = '.html';

    component.isValidFile = file => {
      if (!file.type.match('text/html')) {
        this.toastr.showError('Please upload only HTML file.');
        return false;
      } else {
        return true;
      }
    };

    component.validationBeforeSave = (content: string) => {
      if (content) {
        if (
          content.includes('[EIN]') &&
          (
            content.includes('[DISCLAIMERTEXT]') ||
            content.includes('[DisclaimerText]')
           ) &&
          (
            content.includes('[PAYMENT INSTRUCTIONS]') ||
            content.includes('[PaymentInstructionText]')
          )
        ) {
          return true;
        } else {
          this.toastr.showError(
            'Please select a valid Invoice File with correct Placeholders.'
          );
          return false;
        }
      } else {
        this.toastr.showError('Please select a valid Invoice File ');
        return false;
      }
    };

    modalRef.result.then(res => {
      if (res) {
        this.subscriptions.v1BillingAddinvoicetemplatePost =this.billingService
          .v1BillingAddinvoicetemplatePost$Json({
            body: {
              templateContent: res.templateContent,
              templateName: res.templateName
            }
          })
          .pipe(
            map(UtilsHelper.mapData),
            finalize(() => {
            })
          )
          .subscribe(response => {
            if (response && response.length > 0) {
              this.invoiceTemplates = response;
              this.invoiceTemplates = _.orderBy(
                this.invoiceTemplates,
                a => a.id == this.billingSettings.invoiceTemplateId,
                ['desc']
              );
              this.toastr.showSuccess(
                this.error_data.add_invoice_template_success
              );
            } else {
              this.toastr.showError('Some error occured');
            }
          });
      }
    });
  }

  selectTemplate(template: vwInvoiceTemplate) {
    this.tenantProfile.enableSave$.next(false);
    this.selectedTemplate = template;
    this.getCustomContent();
  }

  enableSave() {
    this.tenantProfile.enableSave$.next(true);
  }

  refresh() {
    if (this.selectedTemplate) {
      let div = document.createElement('div');
      div.innerHTML = this.selectedTemplate.templateContent;

      let coverPage  = div.querySelector('#cover-page');
      if (coverPage) {
        let trustAccountingSection = coverPage.querySelector('#trust-accounting-section');
        let trustAccountingPage = div.querySelector('#page-trust-accounting');

        if (this.trustAccountEnabled) {
          trustAccountingSection.classList.add('d-block');
          trustAccountingPage.classList.add('d-block');
        } else {
          trustAccountingSection.classList.add('d-none');
          trustAccountingPage.classList.add('d-none');
        }
      }

      this.templateHTML = div.innerHTML;

      this.templateHTML = this.templateHTML.replace('[EIN]', this.ein || '[EIN]');

      if (this.tenantDetails) {
        this.templateHTML = this.templateHTML.replace(
          /\[TenantLogo\]/g,
          this.tenantDetails.internalLogo || this.appConfigService.appConfig.default_logo
        );
      }

      if (this.disclaimer) {
        this.templateHTML = this.templateHTML.replace(
          '[DISCLAIMERTEXT]',
          this.disclaimer.replace(/\n/g, '<br/> ') || '[DISCLAIMERTEXT]'
        );

        this.templateHTML = this.templateHTML.replace(
          /\[DisclaimerText\]/g,
          this.disclaimer.replace(/\n/g, '<br/> ') || '[DISCLAIMERTEXT]'
        );
      }

      this.templateHTML = this.templateHTML.replace(
        '[PAYMENT INSTRUCTIONS]',
        this.paymentInstructions || '[PAYMENT INSTRUCTIONS]'
      );

      this.templateHTML = this.templateHTML.replace(
        /\[PaymentInstructionText\]/g,
        this.paymentInstructions || '[PAYMENT INSTRUCTIONS]'
      );
    }
  }

  private getCustomContent() {
    this.subscriptions.v1BillingGetinvoicetemplatecontentTemplateIdGet = this.billingService
      .v1BillingGetinvoicetemplatecontentTemplateIdGet({
        templateId: this.selectedTemplate.id
      })
      .pipe(
        map(UtilsHelper.mapData),
        finalize(() => {
        })
      )
      .subscribe(res => {
        if (res) {
          this.selectedTemplateCustomContent = res;
        } else {
          this.selectedTemplateCustomContent = {} as vwCustomContent;
        }

        this.disclaimer = this.selectedTemplateCustomContent.disclaimerText;
        this.paymentInstructions = this.selectedTemplateCustomContent.paymentText;
        this.ein = this.selectedTemplateCustomContent.ein;

        this.refresh();
      });
  }

  saveChanges() {
    const body = {
      invoiceTemplateId: this.selectedTemplate.id,
      disclaimerText: this.disclaimer,
      ein: this.ein,
      paymentText: this.paymentInstructions
    } as vwCustomContent;
    if (
      this.selectedTemplateCustomContent &&
      this.selectedTemplateCustomContent.id
    ) {
      body.id = this.selectedTemplateCustomContent.id;

      this.subscriptions.v1BillingUpdatecustomcontentPut = this.billingService
        .v1BillingUpdatecustomcontentPut$Json({
          body
        })
        .pipe(
          map(UtilsHelper.mapData),
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe(response => {
          if (response > 0) {
            this.loading = false;
            this.selectedTemplateCustomContent = body;
            this.refresh();
            this.toastr.showSuccess('Invoice custom content updated.');
            this.tenantProfile.enableSave$.next(false);
          } else {
            this.loading = false;
            this.toastr.showError('Some error occured');
          }
        }, () => {
          this.loading = false;
        });
    } else {
      this.subscriptions.v1BillingAddcustomcontentPost1 = this.billingService
        .v1BillingAddcustomcontentPost$Json({
          body
        })
        .pipe(
          map(UtilsHelper.mapData),
          finalize(() => {
          })
        )
        .subscribe(response => {
          if (response > 0) {
            this.loading = false;
            this.selectedTemplateCustomContent = body;
            this.selectedTemplateCustomContent.id = response;
            this.toastr.showSuccess('Invoice custom content updated.');
            this.tenantProfile.enableSave$.next(false);
          } else {
            this.loading = false;
            this.toastr.showError('Some error occured');
          }
        }, () => {
          this.loading = false;
        });
    }
  }

  download(row: vwInvoiceTemplate) {
    let copyRow = {...row};
    this.tenantProfile.downloadHTMLTemplate(copyRow);
  }

  delete(row: vwInvoiceTemplate) {
    this.dialogService
      .confirm(
        this.error_data.delete_invoice_template_confirm,
        'Ok',
        'Cancel',
        'Delete Invoice Template'
      )
      .then(res => {
        if (res) {
          this.subscriptions.v1BillingDeleteinvoicetemplateTemplateIdDelete = this.billingService
            .v1BillingDeleteinvoicetemplateTemplateIdDelete({
              templateId: row.id
            })
            .pipe(
              map(UtilsHelper.mapData),
              finalize(() => {
              })
            )
            .subscribe(response => {
              if (response > 0) {
                this.toastr.showSuccess(
                  this.error_data.delete_invoice_template_success
                );
                this.getTemplates();
              } else {
                this.toastr.showError('Some error occured');
              }
            });
        }
      });
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
    if (index == this.currentActive) { this.currentActive = null; }
  }

  async checkTrustAccountStatus(): Promise<any> {
    let resp: any = await this.trustAccountService.v1TrustAccountGetTrustAccountStatusGet$Response().toPromise();
    resp = JSON.parse(resp.body as any).results;
    if (resp) {
      this.trustAccountEnabled = resp;
      this.refresh();
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
