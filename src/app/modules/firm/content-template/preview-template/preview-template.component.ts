import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/internal/operators/map';

import { BillingService } from 'src/common/swagger-providers/services';
import { vwReceiptTemplate } from 'src/common/swagger-providers/models/vw-receipt-template';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';

@Component({
  selector: 'app-preview-template',
  templateUrl: './preview-template.component.html',
  styleUrls: ['./preview-template.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class PreviewTemplateComponent implements OnInit {
  loading: boolean;
  receiptTemplate: vwReceiptTemplate;
  templateId: any;

  constructor(
    private router: Router,
    private billingService: BillingService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.templateId = +params.templateId;
      this.getTemplateById();
    });
  }

  getTemplateById() {
    this.loading = true;
    this.billingService
      .v1BillingGetreceipttemplatebyidTemplateIdGet({
        templateId: this.templateId,
      })
      .pipe(map(UtilsHelper.mapData))
      .subscribe(
        (res) => {
          this.receiptTemplate = res;
          this.loading = false;
        },
        (error) => {
          this.loading = false;
        }
      );
  }

  onBack() {
    localStorage.setItem('Template_SelectedTab', 'Receipt Template');
    this.router.navigate(['firm/content-template']);
  }
}
