import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { vwResultSet } from 'src/common/models/vwResultSet';
import { ApiConfiguration } from 'src/common/swagger-providers/api-configuration';
import { BaseService } from 'src/common/swagger-providers/base-service';
import { vwInvoiceTemplate, vwReceiptTemplate } from 'src/common/swagger-providers/models';
import { vwTenantProfile } from '../modules/models/firm-settinngs.model';
import { UtilsHelper } from '../modules/shared/utils.helper';

@Injectable({
  providedIn: 'root'
})
export class TenantProfileService extends BaseService {
  readonly V1TenantProfileGetPath = '/v1/Tenant/profile';

  saveChanges$ = new EventEmitter<string>();
  enableSave$ = new EventEmitter<boolean>();

  constructor(config: ApiConfiguration, http: HttpClient) {
    super(config, http);
  }

  v1TenantProfilePut(tenantProfile: vwTenantProfile, logo: File, favicon: File) {
    const formdata = new FormData();

    if (logo) {
      formdata.append('logo', logo, logo.name);
    }

    if (favicon) {
      formdata.append('favicon', favicon, favicon.name);
    }
    formdata.append('id', tenantProfile.id.toString());
    formdata.append('tenantId', tenantProfile.tenantId.toString());

    if (tenantProfile.changeStatusNotes) {
      formdata.append(
        'changeStatusNotes',
        tenantProfile.changeStatusNotes.toString()
      );
    }

    if (tenantProfile.timeDisplayFormat) {
      formdata.append(
        'timeDisplayFormat',
        tenantProfile.timeDisplayFormat.toString()
      );
    }

    if (tenantProfile.timeRoundInterval) {
      formdata.append(
        'timeRoundInterval',
        tenantProfile.timeRoundInterval.toString()
      );
    }

    let url = this.config.rootUrl + this.V1TenantProfileGetPath;

    return this.http.put<vwResultSet<number>>(url, formdata);
  }

  downloadPDFTemplate(row: vwReceiptTemplate | vwInvoiceTemplate) {
    const downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);

    downloadLink.href = row.templateContent;
    downloadLink.target = '_self';
    downloadLink.download = row.templateName;
    downloadLink.click();
  }

  downloadHTMLTemplate(row: vwReceiptTemplate | vwInvoiceTemplate) {
    UtilsHelper.downloadStringAsFile(
      row.templateContent,
      'text/html',
      row.templateName + '.html'
    );
  }
}
