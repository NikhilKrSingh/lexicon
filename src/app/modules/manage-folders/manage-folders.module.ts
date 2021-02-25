import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RichTextEditorAllModule } from '@syncfusion/ej2-angular-richtexteditor';
import { MalihuScrollbarModule } from 'ngx-malihu-scrollbar';
import { SharedModule } from '../shared/shared.module';
import { GenerateDocumentComponent } from './generate-document/generate-document.component';
import { ManageFoldersRoutingModule } from './manage-folders-routing.module';
import { ReplaceDocumentComponent } from './replace-document/replace-document.component';
import { UploadDocvComponent } from './upload-docv/upload-docv.component';
import { ViewDocumentComponent } from './view-document/view-document.component';

@NgModule({
  declarations: [ViewDocumentComponent, ReplaceDocumentComponent, GenerateDocumentComponent, UploadDocvComponent],
  imports: [
    CommonModule,
    ManageFoldersRoutingModule,
    SharedModule,
    MalihuScrollbarModule.forRoot(),
    RichTextEditorAllModule
  ]
})
export class ManageFoldersModule { }
