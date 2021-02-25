import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthGuard } from 'src/app/guards/auth-guard.service';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { ImportExportService } from 'src/app/service/import-export.service';
import { vwResultImport } from '../../models/vwImport.model';
import * as errorData from '../../shared/error.json';

@Component({
  selector: 'app-import-run-import',
  templateUrl: './run-import.component.html',
  styleUrls: ['./run-import.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class RunImportComponent implements OnInit, OnDestroy {

  constructor(
    private activateRoute: ActivatedRoute,
    private toastDisplay: ToastDisplay,
    private importExportService: ImportExportService,
    private auth: AuthGuard,
    private pagetitle: Title
  ) { }
  public importType: string;
  public step: number = 1;
  public errorData: any = (errorData as any).default;
  public csvfile: File;
  public uploading: boolean = false;
  public loading: boolean = false;
  public afterImport: boolean = false;
  public displaySuccessTable: boolean = false;
  public displayFailerTable: boolean = false;
  public uploadingPer: number = 0;
  public successRecords: Array<vwResultImport> = [];
  public failedRecords: Array<vwResultImport> = [];
  private subscribeImport: Subscription;

  async ngOnInit() {
    this.importType = this.activateRoute.snapshot.queryParams.type;
    const permissions: any = await this.auth.getPermissions();
    switch(this.importType) {
      case 'offices':
        this.pagetitle.setTitle("Run Office Import");
        if(!permissions.OFFICE_MANAGEMENTisAdmin) {
          this.toastDisplay.showPermissionError();
        }
        break;
      case 'employees':
        this.pagetitle.setTitle("Run Employee  Import");
        if(!permissions.EMPLOYEE_MANAGEMENTisAdmin) {
          this.toastDisplay.showPermissionError();
        }
        break;
      case 'clients':
        this.pagetitle.setTitle("Run Client  Import");
        break;
      case 'trusts':
        this.pagetitle.setTitle("Run Trust Import");
        if(!permissions.TENANT_CONFIGURATIONisAdmin) {
          this.toastDisplay.showPermissionError();
        }
        break;  
    }
  }

  ngOnDestroy() {
    if (this.subscribeImport) {
      this.subscribeImport.unsubscribe();
    }
  }


  public uploadFileDragAndDrop(files) {
    let filesFromDragAndDrop =files;
    if (filesFromDragAndDrop && filesFromDragAndDrop.length > 0) {
      if(filesFromDragAndDrop[0].type != 'text/csv' && filesFromDragAndDrop[0].type != 'text/plain' && filesFromDragAndDrop[0].type != 'application/vnd.ms-excel'){
        this.toastDisplay.showError(this.errorData.unsupported_import_file_type_error);
        return;
      }
      else if(filesFromDragAndDrop.length > 1) {
        this.toastDisplay.showError(this.errorData.multiple_files_selection_import_error);
      } else {
        this.uploadFile(filesFromDragAndDrop);
      }
    }
  }

  public uploadFile(files: File[]) {
    let fileToUpload = files[0];
    if ( /\.(csv?g)$/i.test(fileToUpload.name)) {
      this.toastDisplay.showError(this.errorData.file_invalid_format);
    } else {
      this.csvfile = fileToUpload;
      this.step = 2;
    }
  }

  public importFile() {
    let importObservable;
    switch(this.importType) {
      case 'offices':
        importObservable = this.importExportService.v1ImportOfficePost(this.csvfile);
        break;
      case 'clients':
        importObservable = this.importExportService.v1ImportClientPost(this.csvfile);
        break;
      case 'employees':
        importObservable = this.importExportService.v1ImportEmployeePost(this.csvfile);
        break;
      case 'trusts':
        importObservable = this.importExportService.v1ImportTrustPost(this.csvfile);
        break;  
    }
    if (importObservable) {
      this.uploading = true;
      this.loading = true;
      this.subscribeImport = importObservable.subscribe(suc => {
        this.afterImport = true;
        this.uploadingPer = 100;
        this.successRecords = suc.success;
        this.failedRecords = suc.failure;
        this.loading = false;
      }, err => {
        let errorMsg = err.error.results;   
        this.toastDisplay.showError(errorMsg);
        this.loading = false;
      });
    }
  }

  public uploadButtonClick() {

  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
