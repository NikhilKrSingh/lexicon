import {
  Component,



  ElementRef, OnInit,

  ViewChild, ViewEncapsulation, Input
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { TenantProfileService } from 'src/app/service/tenant-profile.service';
import { vwReceiptTemplate } from 'src/common/swagger-providers/models/vw-receipt-template';

@Component({
  selector: 'app-add-template',
  templateUrl: './add-template.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class AddTemplateComponent implements OnInit {
  templateType: string;
  acceptedType: string;
  readAsDataURL = false;
  templateId;
  templateName: string;
  fileName: string;
  selectedTemplate : vwReceiptTemplate;

  selectedFile: File;
  templateContent: string;
  uploadPercent = 100;

  isEdit = false;
  formSubmitted = false;
  showInvalidFormatFile = false;

  @ViewChild('templateFile', { static: false }) public templateFileInput: ElementRef<HTMLInputElement>;

  validationBeforeSave: (content: string) => boolean;

  constructor(
    private activeModal: NgbActiveModal,
    private toastr: ToastDisplay,
    private tenantProfile: TenantProfileService,
  ) {}

  ngOnInit() {
    if(this.templateId){
      this.isEdit = true;
      this.templateName = this.selectedTemplate.templateName;
      this.templateContent = this.selectedTemplate.templateContent;
      this.fileName = this.selectedTemplate.fileName;
    }
  }

  public isValidFile: (file: File) => boolean;

  selectTemplateFile() {
    if(this.templateFileInput){
      this.templateFileInput.nativeElement.value = null;
      this.templateFileInput.nativeElement.click();
    }
  }

  uploadTemplateFile(files: File[]) {
    this.showInvalidFormatFile = false;

    if (files.length > 1) {
      this.toastr.showError('Please select only 1 file');
    } else {
      if (this.isValidFile) {
        if (this.isValidFile(files[0])) {
          this.selectedFile = files[0];
          this.fileName = this.selectedFile.name;

          let fileReader = new FileReader();
          fileReader.onload = () => {
            this.templateContent = fileReader.result as string;
          };

          if (this.readAsDataURL) {
            fileReader.readAsDataURL(this.selectedFile);
          } else {
            fileReader.readAsText(this.selectedFile);
          }
        } else {
          this.showInvalidFormatFile = true;
        }
      }
    }
  }

  close() {
    this.activeModal.close();
  }

  save() {
    this.formSubmitted = true;
    if(!this.templateContent || !this.templateName){
      return;
    }
    if (this.templateContent && this.templateName && this.templateName.trim() != '') {
      if (this.validationBeforeSave) {
        if (this.validationBeforeSave(this.templateContent)) {
          this.finalSave();
        }
      } else {
        this.finalSave();
      }
    }
  }
  finalSave(){
    this.formSubmitted = false;
    if(this.isEdit){
      this.activeModal.close({
        id: this.templateId,
        fileName: this.fileName,
        templateName: this.templateName,
        templateContent: this.templateContent
      });
    }else {
      this.activeModal.close({
        fileName: this.fileName,
        templateName: this.templateName,
        templateContent: this.templateContent
      });
    }
  }
  onCancel(){
    this.selectedFile = null;
    this.fileName = null;
    this.templateContent = null;
  }

  downloadTemplate() {
    this.tenantProfile.downloadHTMLTemplate(this.selectedTemplate);
  }
}
