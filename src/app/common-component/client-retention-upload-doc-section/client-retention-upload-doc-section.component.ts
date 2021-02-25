import { Component, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { outputs } from '@syncfusion/ej2-angular-richtexteditor/src/rich-text-editor/richtexteditor.component';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { CommonService } from 'src/app/service/common.service';

@Component({
  selector: 'app-client-retention-upload-doc-section',
  templateUrl: './client-retention-upload-doc-section.component.html',
  encapsulation: ViewEncapsulation.Emulated
})

export class ClientRetentionUploadDocSectionComponent implements OnInit, OnDestroy {
  @Output() readonly hideSection = new EventEmitter();
  isOpen = true;
  docsSubs: any;
  fileArray: Array<any> =[];
  isUpoaded: boolean = false;
  constructor(
    public commonService: CommonService,
    public sharedService: SharedService,
  ) {

  }

  ngOnInit(){
    this.docsSubs = this.commonService.clientRetentDocs.subscribe(val => {
      if (Array.isArray(val) && val.length) {
        this.fileArray = val;
      } else {
        this.isUpoaded = true;
        setTimeout(() => {
          this.isOpen = false;
          this.isUpoaded = false;
        }, 3000);
      }
    });
  }

  ngOnDestroy(){
    if(this.docsSubs){
      this.docsSubs.unsubscribe();
    }
  }

  closePanel(){
    this.hideSection.emit(true);
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}