import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DownloadFileService } from 'src/app/service/download-file.service';

@Component({
  selector: 'app-view-file',
  templateUrl: './view-file.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class ViewFileComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private fileService: DownloadFileService,
  ) { }

  ngOnInit() {
    const fileId: number = +this.route.snapshot.queryParamMap.get('fileId');
    const fileName: string = this.route.snapshot.queryParamMap.get('filename');
    if (fileId && !isNaN(fileId) && fileName) {
      this.downloadFile(fileId, fileName);
    } else {
      this.closeTab();
    }
  }

  async downloadFile(fileId, fileName) {
    try {
      const response: any = await this.fileService.v1DownloadClientFile(fileId).toPromise();
      const objRes: any = response.body;
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(objRes, fileName);
      } else {
        const blobURL = window.URL.createObjectURL(objRes);
        const anchor = document.createElement('a');
        anchor.download = fileName;
        anchor.href = blobURL;
        anchor.click();
      }
      this.closeTab();
    } catch (err) {
      console.log(err);
      this.closeTab();
    }
  }

  closeTab() {
    const win = window.open('about:blank', '_self', '');
    win.close();
  }
}
