import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { DmsService } from 'src/common/swagger-providers/services';

@Component({
  selector: 'app-matter-documents',
  templateUrl: './documents.component.html',
  encapsulation: ViewEncapsulation.Emulated
})
export class MatterDocumentsComponent implements OnInit {
  @Input() matterId;
  @Input() matterDetails;
  @Input() matterFolderDetails;
  loading = false;

  constructor(
    private dmsService: DmsService
  ) { }

  ngOnInit() {
  }

  async getMatterFolderPath() {
    try {
      this.loading = true;
      const resp = await this.dmsService.v1DmsFolderMatterMatterIdGet$Response({matterId: this.matterId}).toPromise();
      this.matterFolderDetails = JSON.parse(resp.body as any).results;
      this.loading = false;
      console.log(this.matterFolderDetails);
    } catch (err) {
      this.loading = false;
    }
  }
}
