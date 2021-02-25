import { HttpResponse } from '@angular/common/http';
import { Component, ElementRef, Input, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NavigationExtras, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as moment from 'moment';
import { ToastDisplay } from 'src/app/guards/toast-service';
import { Page } from 'src/app/modules/models';
import * as Constant from 'src/app/modules/shared/const';
import { DialogService } from 'src/app/modules/shared/dialog.service';
import { SharedService } from 'src/app/modules/shared/sharedService';
import { UtilsHelper } from 'src/app/modules/shared/utils.helper';
import { CommonService } from 'src/app/service/common.service.js';
import { DownloadFileService } from 'src/app/service/download-file.service';
import { DmsService, DocumentSettingService, MiscService } from 'src/common/swagger-providers/services';
import { IndexDbService } from '../../../../../index-db.service';
import * as errorData from '../../../../shared/error.json';


enum DMSFileStatus {
  Unknown = 0,
  SecurityScanInProgress = 1,
  SecurityScanPassed = 2,
  SecurityScanFailedVirus = 3,
  SecurityScanFailedError = 4,
  UploadInProgress = 5,
  UploadDone = 6,
  UploadFailed = 7,
  UploadCancelled = 8,
  UploadRejected = 9,
  GeneratedFile = 10
}

@Component({
  selector: 'app-matter-folder-structure',
  templateUrl: './matter-folder-structure.component.html',
  styleUrls: ['./matter-folder-structure.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class MatterFolderStructureComponent implements OnInit {
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @ViewChild(DatatableComponent, { static: false }) table2: DatatableComponent;
  @ViewChild('WarningPopUp', { static: false }) WarningPopUp: ElementRef;
  @Input() pageType: string;

  public errorData: any = (errorData as any).default;
  public ColumnMode = ColumnMode;
  public messages = { emptyMessage: Constant.SharedConstant.NoDataFound };
  SelectionType = SelectionType;
  public page = new Page();
  public page2 = new Page();
  public pageSelector = new FormControl('10');
  public pageSelector2 = new FormControl('10');
  public limitArray: Array<number> = [10, 30, 50, 100];
  public selected: any;
  public selectedRow: any = [];
  public pangeSelected = 1;
  public pangeSelected2 = 1;
  public counter = Array;
  public columnList = [];
  public sortingArray = [];
  public extensionsArray: Array<any> = UtilsHelper.getDocExtensions();
  public currentActive: number;
  public practiceAreaList: Array<any> = [];
  public folderAndFileList: Array<any> = [];
  public firmInfo: Array<any> = [];
  public isDocumentListing = false;
  public isExist = false;
  public isExistErr = '';
  public sourceName;
  public sourceFileName;
  public fileErrorMsg = '';
  public indexTable: number;
  public renameFolderErr;
  public renameFileErr = '';
  public folderPath = '';
  public warningHeader = '';
  public editFileTitle: any;
  public momentObj = moment;
  public loading = false;
  public createFolderFormSubmitted = false;
  public renameFolderFormSubmitted = false;
  public notEditableFolders = ['Miscellaneous', 'Disbursement Receipts'];
  public folderToDelete = '';
  public esignEnabled = false;
  public docAttributes: Array<any> = [
    { id: 1, name: 'Drafting Template' },
    { id: 2, name: 'Fillable Template' },
    { id: 3, name: 'Contains E-Signature Fields' }
  ];
  public selectedAttArr = [];
  public reqTimout: any;
  public createFolderForm: FormGroup = this.builder.group({
    folderName: new FormControl('', [
      Validators.required,
      Validators.maxLength(100)
    ])
  });
  public editFolderForm: FormGroup = this.builder.group({
    targetName: new FormControl('', [
      Validators.required,
      Validators.maxLength(100)
    ])
  });
  public editFileForm: FormGroup = this.builder.group({
    targetName: new FormControl('', [
      Validators.required,
      Validators.maxLength(100)
    ])
  });
  public fileForm = this.builder.group({
    file: new FormControl(File)
  });

  constructor(
    private misc: MiscService,
    private toastDisplay: ToastDisplay,
    private documentSettingService: DocumentSettingService,
    private modalService: NgbModal,
    private builder: FormBuilder,
    private dialogService: DialogService,
    private dms: DownloadFileService,
    public commonService: CommonService,
    private dmsService: DmsService,
    private sharedService: SharedService,
    private indexdbService: IndexDbService,
    private route: Router
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
    this.page2.pageNumber = 0;
    this.page2.size = 10;
  }

  ngOnInit() {
    this.indexdbService.getObject('firmInfo', res => {
      if (res && res.value) {
        this.firmInfo = res.value;
        this.selected = this.firmInfo[this.firmInfo.length - 1];
        const index = this.firmInfo.indexOf(this.selected);
        this.getFolders(
          this.selected,
          index === 1 ? true : false,
          true,
          'file'
        );
        this.indexdbService.removeObject('firmInfo');
      } else {
        this.getPracticeArea();
      }
    });
    this.getTenantSettings();
  }

  setDocAttr(file) {
    this.docAttributes.map((x: any) => (x.checked = false));
    this.selectedAttArr = [];

    if (file.isDraftingTemplate) {
      const idx = this.docAttributes.findIndex(x => x.id === 1);
      if (idx > -1) {
        (this.docAttributes[idx] as any).checked = true;
        this.selectedAttArr.push(1);
      }
    }

    if (
      file.isFillableTemplate &&
      ['doc', 'docx', 'pdf'].indexOf(
        this.sharedService.getFileExtension(file.name)
      ) > -1
    ) {
      const idx = this.docAttributes.findIndex(x => x.id === 2);
      if (idx > -1) {
        (this.docAttributes[idx] as any).checked = true;
        this.selectedAttArr.push(2);
      }
    }
    // containsESignatureFields
    if (file.containsESignatureFields && ['docx', 'pdf'].indexOf(this.sharedService.getFileExtension(file.name)) > -1 && this.esignEnabled) {
      const idx = this.docAttributes.findIndex(x => x.id === 3);
      if (idx > -1) {
        (this.docAttributes[idx] as any).checked = true;
        this.selectedAttArr.push(3);
      }
    }

    this.getAttributesSelected(this.selectedAttArr);
  }

  resetForm() {
    this.editFileForm.reset();
  }

  getAttributesSelected(event) {
    if (!event.length) {
      this.editFileTitle = 'Select document attributes';
    } else {
      this.editFileTitle = event.length.toString();
      this.selectedAttArr = event;
    }
  }

  getTenantSettings() {
    const userDetails = JSON.parse(localStorage.getItem('profile'));
    this.documentSettingService.v1DocumentSettingTenantTenantIdGet$Response({ tenantId: userDetails.tenantId }).subscribe((res: any) => {
      const result: any = JSON.parse(res.body).results;
      this.esignEnabled = result.isSignatureEnable ? true : false;
      if (result && !result.isSignatureEnable) {
        this.docAttributes = this.docAttributes.filter(x => x.id != 3);
      }
    });
  }

  disableAttributeCheckBoxes(id) {
    const idx = this.docAttributes.findIndex(x => x.id === id);
    if (idx > -1) {
      this.docAttributes[idx].disabled = true;
    }
  }

  changeTargetValue() {
    if (this.isExist) {
      if (!this.editFileForm.value.targetName) {
        this.isExist = false;
      }
    }
  }

  public getPracticeArea() {
    this.firmInfo = [];
    this.loading = true;
    this.misc.v1MiscPracticesGet$Response({}).subscribe(
      suc => {
        this.loading = false;
        const res: any = suc;
        this.practiceAreaList = JSON.parse(res.body).results;
        this.updateDatatableFooterPage();
        UtilsHelper.aftertableInit();
        this.firmInfo.push({ id: 0, name: 'Practice Area' });
      },
      err => {
        this.loading = false;
      }
    );
  }

  openPracticeArea(event: any) {
    if (
      event.type === 'dblclick' &&
      !event.row.fileName &&
      event.row.status !== 'Archived'
    ) {
      const row = event.row;
      this.getFolders(row);
    }
  }

  public getFolders(row, isPractice = true, sort = false, type = '') {
    this.folderAndFileList = [];
    this.loading = true;
    const param = isPractice ? { practiceareaId: row.id } : { practiceareaId: row.id, practiceArea: false };
    this.documentSettingService.v1DocumentSettingPracticeareaPracticeareaIdGet(param).subscribe(suc => {
      const res: any = JSON.parse(suc as any);
      const path = row.path ? row.path : '';
      const item = { id: row.id, name: row.name, path };
      if (this.firmInfo.indexOf(this.selected) === -1) {
        this.firmInfo.push(item);
      }
      this.loading = false;
      this.selected = this.firmInfo[this.firmInfo.length - 1];
      if (res.results) {
        this.folderPath = isPractice ? res.results.path : '';
        let folders = [];
        let files = [];
        res.results.folders.forEach(element => {
          const folder: any = {};
          folder.id = element.id;
          folder.practiceAreaId = element.practiceAreaId;
          folder.name = element.name;
          folder.parentFolderId = element.parentFolderId;
          folder.path = element.folderPath;
          folder.isFolder = true;
          folder.isSystemFolder = element.isSystemFolder;
          folders.push(folder);
        });

        if (sort && type === 'folder') {
          folders = folders.sort((a, b) => (a.id > b.id) ? -1 : 1);
        }
            res.results.files.forEach(element => {
              const file: any = {};
              file.id = element.id;
              file.practiceAreaId = element.practiceAreaId;
              file.name = element.fileName;
              file.parentFolderId = element.folderId;
              file.path = element.filePath;
              file.isFolder = false;
              file.fileSizeInKB = element.fileSizeInKB;
              file.lastUpdated = element.lastUpdated;
              file.dmsFileStatus = element.dmsFileStatus;
              file.isDraftingTemplate = element.isDraftingTemplate;
              file.isFillableTemplate = element.isFillableTemplate;
              file.isPdf =
                this.sharedService.getFileExtension(element.fileName) === 'pdf'
                  ? true
                  : false;
              file.originalFileName = element.originalFileName;
              file.containsESignatureFields = element.containsESignatureFields;
              files.push(file);
            });

            if (sort && type === 'file') {
              files = files.sort((a, b) => (a.id > b.id ? -1 : 1));
            }

            const folderAndFileList = folders.concat(files);

            this.folderAndFileList = [...folderAndFileList];
            this.isDocumentListing = true;
            this.table.selected = [];
            if (this.sourceName) {
              const index = this.folderAndFileList.indexOf(
                this.folderAndFileList.find(
                  s => s.id === this.sourceName.id && s.isFolder
                )
              );
              this.table.selected.push(this.folderAndFileList[index]);
              this.sourceName = null;
            } else {
              this.table.selected.push(this.folderAndFileList[this.indexTable]);
            }
            this.sortingArray = [];
            this.sortingArray = this.folderAndFileList;
            this.SortingFunction();
            this.updateDatatableFooterPage2();
            UtilsHelper.aftertableInit();
          }
        },
        err => {
          this.loading = false;
        }
      );
  }

  updateDatatableFooterPage() {
    this.page.totalElements = this.practiceAreaList.length;
    this.page.totalPages = Math.ceil(
      this.practiceAreaList.length / this.page.size
    );
    this.page.pageNumber = 0;
    this.pangeSelected = 1;
    this.table.offset = 0;
    UtilsHelper.aftertableInit();
  }

  onSelect(row: any, event?: string, index?: number) {
    if (row && row.id >= 0) {
      this.selected = row;
      if (index === 0) {
        this.isDocumentListing = false;
        this.getPracticeArea();
      }
      this.getFolders(row, index === 1 ? true : false);
      if (index) {
        this.firmInfo.length = index;
      }
      this.currentActive = null;
    }
  }

  get f() {
    return this.createFolderForm.controls;
  }

  get renameFolderForm() {
    return this.editFolderForm.controls;
  }

  public createFolder() {
    this.createFolderFormSubmitted = true;
    if (this.createFolderForm.invalid) {
      return;
    }
    const data = { ...this.createFolderForm.value };
    if (this.firmInfo && this.firmInfo.length > 0) {
      const id = this.firmInfo[this.firmInfo.length - 1].id;
      let fullpath = '';
      if (this.folderPath) {
        fullpath = this.folderPath;
      } else if (this.folderAndFileList.length === 0) {
        fullpath = this.selected.path;
      } else {
        fullpath = this.folderAndFileList[0].path.substring(
          0,
          this.folderAndFileList[0].path.lastIndexOf('/')
        );
      }
      const param = {
        id,
        folder: data.folderName,
        currentFolderFullPath: fullpath
      };
      this.documentSettingService
        .v1DocumentSettingAddfolderbypracticeareaPost$Json({ body: param })
        .subscribe(
          response => {
            const res = JSON.parse(response as any);
            const index = this.firmInfo.indexOf(this.selected);
            this.getFolders(
              this.selected,
              index === 1 ? true : false,
              true,
              'folder'
            );
            this.createFolderForm.reset();
            this.modalService.dismissAll();
            this.toastDisplay.showSuccess(this.errorData.folder_added);
            this.indexTable = 0;
          },
          err => {
            if (
              err.status === 500 &&
              err.error.includes('A folder with this name already exists')
            ) {
              this.isExist = true;
              this.isExistErr = 'A folder with this name already exists.';
            }
          }
        );
    }
  }

  openPersonalinfo(content: any, className, winClass) {
    this.createFolderFormSubmitted = false;
    this.modalService
      .open(content, {
        size: className,
        windowClass: winClass,
        centered: true,
        backdrop: 'static'
      })
      .result.then(
        result => {
        },
        reason => {
          this.isExist = false;
          this.isExistErr = '';
          this.createFolderForm.reset();
          this.modalService.dismissAll();
        }
      );
  }

  /*** open menu on action click */
  openMenu(index: number, event): void {
    setTimeout(() => {
      if (this.currentActive !== index) {
        this.currentActive = index;
        const eleArr = document.querySelectorAll('.datatable-row-wrapper');
        eleArr.forEach(ele => {
          ele.classList.remove('datatable-row-hover');
        });
        event.target
          .closest('.datatable-row-wrapper')
          .classList.add('datatable-row-hover');
      } else {
        this.currentActive = null;
        event.target
          .closest('.datatable-row-wrapper')
          .classList.remove('datatable-row-hover');
      }
    }, 50);
  }

  /*** closed menu on body click */
  onClickedOutside(event: any, index: number) {
    if (index === this.currentActive) {
      this.currentActive = null;
    }
  }

  public editFolder(contant, row, $event) {
    $event.target.closest('datatable-body-cell').blur();
    this.renameFolderFormSubmitted = false;
    this.sourceName = row;
    this.editFolderForm.setValue({
      targetName: row.name
    });
    this.openPersonalinfo(contant, '', '');
  }

  public async editFile(contant, row) {
    try {
      this.loading = true;
      let resp: any = await this.dmsService
        .v1DmsDocumentGetSigningStatusDocumentIdGet({ documentId: row.id })
        .toPromise();
      resp = JSON.parse(resp).results;
      this.sourceFileName = row;
      this.editFileForm.patchValue({
        targetName: row.name
      });
      this.setDocAttr(row);
      if (
        ['doc', 'docx', 'pdf'].indexOf(
          this.sharedService.getFileExtension(row.name)
        ) === -1
      ) {
        this.disableAttributeCheckBoxes(2);
      }
      if ((['docx', 'pdf'].indexOf(this.sharedService.getFileExtension(row.name)) === -1) || resp.signingStatus) {
        this.disableAttributeCheckBoxes(3);
      }

      this.openPersonalinfo(contant, '', '');
      this.loading = false;
    } catch (e) {
      this.loading = false;
    }
  }

  public getAttributeSelected(event) {
    if (event && event.length) {
      this.selectedAttArr = event;
      this.editFileTitle = event.length;
    } else {
      this.editFileTitle = 'Select document attributes';
    }
  }

  public clrAttributes() {
    this.selectedAttArr = [];
    this.editFileTitle = 'Select document attributes';
    this.docAttributes.forEach((obj: any) => {
      obj.checked = false;
    });
  }

  public applyFilter() {}

  public onMultiSelectSelectedOptions(event) {}

  public updateFile() {
    const data = { ...this.editFileForm.value };
    this.indexTable = this.folderAndFileList.indexOf(this.table.selected[0]);
    if (!data.targetName) {
      this.isExist = true;
      this.renameFileErr = 'Provide a new File Name';
    } else {
      if (this.firmInfo && this.firmInfo.length > 0) {
        const fileName = this.getEnteredFormattedFileName(data.targetName);
        this.isExist = false;
        const param = {
          id: this.sourceFileName.id,
          fileName,
          isDraftingTemplate: this.selectedAttArr.indexOf(1) > -1 ? true : false,
          isFillableTemplate: this.selectedAttArr.indexOf(2) > -1 ? true : false,
          containsESignatureFields: this.selectedAttArr.indexOf(3) > -1 && this.esignEnabled ? true : !this.esignEnabled ? this.sourceFileName.containsESignatureFields : false,
          folderId: this.sourceFileName.parentFolderId,
          originalFileName: this.sourceFileName.originalFileName
        };
        this.documentSettingService
          .v1DocumentSettingEditFilePut$Json({ body: param })
          .subscribe(
            () => {
              const index = this.firmInfo.indexOf(this.selected);
              this.getFolders(this.selected, index === 1 ? true : false);
              this.editFolderForm.reset();
              this.editFileForm.reset();
              this.modalService.dismissAll();
              this.toastDisplay.showSuccess(this.errorData.document_property_updated);
            },
            err => {
              if (
                err.status === 500 &&
                err.error.includes('A file with this name already exists')
              ) {
                this.isExist = true;
                this.renameFileErr = 'A file with this name already exists.';
              }
            }
          );
      }
    }
  }

  public removeFile(id) {
    this.dialogService
      .confirm(
        'Are you sure you want to delete this document?',
        'Yes, Delete',
        'No',
        'Delete Document'
      )
      .then(res => {
        if (res) {
          this.documentSettingService
            .v1DocumentSettingDeleteFileIdDelete({ id })
            .subscribe(
              () => {
                const index = this.firmInfo.indexOf(this.selected);
                this.getFolders(this.selected, index === 1 ? true : false);
                this.editFolderForm.reset();
                this.modalService.dismissAll();
                this.toastDisplay.showSuccess(
                  'The selected folder and its contents are deleted and disappear from the list.'
                );
              },
              err => {}
            );
        }
      });
  }

  public renameFolder() {
    this.renameFolderFormSubmitted = true;
    if (this.editFolderForm.invalid) {
      return;
    }
    const data = { ...this.editFolderForm.value };
    this.indexTable = this.folderAndFileList.indexOf(this.table.selected[0]);
    if (data.targetName === this.sourceName.name) {
      this.isExist = true;
      this.renameFolderErr = 'Provide a new Folder Name.';
    } else {
      if (this.firmInfo && this.firmInfo.length > 0) {
        this.isExist = false;
        const param = { id: this.sourceName.id, name: data.targetName };
        this.documentSettingService
          .v1DocumentSettingRenameFolderPut$Json({ body: param })
          .subscribe(
            response => {
              const ids = this.folderAndFileList.map(x => parseInt(x.id, 10));
              let maxId = Math.max(...ids);
              maxId++;
              while (this.sourceName.id < maxId) {
                this.sourceName.id++;
              }
              const index = this.firmInfo.indexOf(this.selected);
              this.getFolders(this.selected, index === 1 ? true : false);
              this.editFolderForm.reset();
              this.modalService.dismissAll();
              this.toastDisplay.showSuccess(
                'The new folder name is saved to the database.'
              );
            },
            err => {
              if (
                err.status === 500 &&
                err.error ===
                  'One or more errors occurred. (A folder with this name already exists.);A folder with this name already exists.'
              ) {
                this.isExist = true;
                this.renameFolderErr =
                  'A folder with this name already exists.';
              }
            }
          );
      }
    }
  }

  public removeFolder(id) {
    this.dialogService
      .confirm(
        'This will delete this folder and all its contents. This will not affect existing matters. This operation cannot be undone. Are you sure you want to proceed?',
        'Yes, Delete',
        'No',
        'Delete Folder'
      )
      .then(res => {
        if (res) {
          this.documentSettingService
            .v1DocumentSettingDeleteFolderIdDelete({ id })
            .subscribe(() => {
              const index = this.firmInfo.indexOf(this.selected);
              this.getFolders(this.selected, index === 1 ? true : false);
              this.editFolderForm.reset();
              this.modalService.dismissAll();
              this.toastDisplay.showSuccess(
                this.errorData.folderDeletedAndDisappeared
              );
            });
        }
      });
  }

  public downloadDocument(row, open?: boolean) {
    this.loading = true;
    this.dms.v1DownloadSettingLatestFile(+row.id).subscribe(
      (suc: HttpResponse<Blob>) => {
        const objRes: any = suc.body;
        if (open) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result as string;
            const fileData = base64Data.split(',').pop();
            const file = UtilsHelper.base64toFile(
              fileData,
              `${row.name}_${moment(new Date()).format('MMDDYYYYHHMMSS')}.pdf`,
              'application/pdf'
            );
            const url = URL.createObjectURL(file);
            window.open(url, '_blank');
          };
          reader.readAsDataURL(objRes);
        } else {
          if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(objRes, row.name);
          } else {
            const blobURL = window.URL.createObjectURL(objRes);
            const anchor = document.createElement('a');
            anchor.download = row.name;
            anchor.href = blobURL;
            anchor.click();
          }
        }
        this.modalService.dismissAll();
        this.loading = false;
      },
      err => {
        this.loading = false;
      }
    );
  }

  public openWarningPopUp(row, isDelete) {
    this.warningHeader = isDelete ? 'Delete Folder' : 'Rename Folder';
    this.folderToDelete = row.name;
    this.openPersonalinfo(this.WarningPopUp, '', '');
  }

  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateDatatableFooterPage();
  }

  public changePage() {
    this.page.pageNumber = this.pangeSelected - 1;
    if (this.pangeSelected == 1) {
      this.updateDatatableFooterPage();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  public pageChange(e) {
    this.pangeSelected = e.page;
    UtilsHelper.aftertableInit();
  }

  downloadFolder(id: any, name: string): void {
    this.dms.v1DmsFolderZipDmsFolderIdGet(id).subscribe((res: any) => {
      if (res && res.body) {
        UtilsHelper.downloadZip(res.body, name);
      }
    });
  }

  public SortingFunction() {
    let folders = this.sortingArray.filter(item => {
      if (item.name && !item.name.includes('.')) {
        return item;
      }
    });

    let files = this.sortingArray.filter(item => {
      if (item.name && item.name.includes('.')) {
        return item;
      }
    });

    if (this.table.sorts[0].prop === 'name') {
      if (this.table.sorts[0].dir === 'asc') {
        folders = folders.sort((a, b) =>
          a.name
            ? a.name.localeCompare(b.name)
            : a.fileName.localeCompare(b.fileName)
        );
        files = files.sort((a, b) =>
          a.name
            ? a.name.localeCompare(b.name)
            : a.fileName.localeCompare(b.fileName)
        );
      } else {
        folders = folders.sort((a, b) =>
          b.name
            ? b.name.localeCompare(a.name)
            : b.fileName.localeCompare(a.fileName)
        );
        files = files.sort((a, b) =>
          b.name
            ? b.name.localeCompare(a.name)
            : b.fileName.localeCompare(a.fileName)
        );
      }
    }

    if (this.table.sorts[0].prop === 'category_name') {
      if (this.table.sorts[0].dir === 'asc') {
        files = files.sort((a, b) => a.name ? a.name.localeCompare(b.name) : a.fileName.localeCompare(b.fileName));
      } else {
        files = files.sort((a, b) => b.name ? b.name.localeCompare(a.name) : b.fileName.localeCompare(a.fileName));
      }
    }

    if (this.table.sorts[0].prop === 'fileSizeInKB') {
      if (this.table.sorts[0].dir === 'asc') {
        files = files.sort((a, b) => a.fileSizeInKB - b.fileSizeInKB);
      } else {
        files = files.sort((a, b) => b.fileSizeInKB - a.fileSizeInKB);
      }
    }

    if (this.table.sorts[0].prop === 'lastUpdated') {
      files = files.sort((a, b) => {
        const firstDate = new Date(a.lastUpdated).getTime();
        const secondDate = new Date(b.lastUpdated).getTime();
        return this.table.sorts[0].dir === 'asc'
          ? firstDate - secondDate
          : secondDate - firstDate;
      });
    }

    this.folderAndFileList = folders.concat(files);
  }

  redirectToDocpload() {
    this.indexdbService.addObject('firmInfo', this.firmInfo);
    this.indexdbService.addObject('selectedFolderId', this.selected.id);
    setTimeout(() => {
      this.route.navigate(['/firm/document-setting/upload-document']);
    }, 500);
  }

  retry_cancelScan(row, type?: string, index?: any) {
    const idx = this.folderAndFileList.findIndex(val => val.id == row.id);
    const params: any = {
      id: row.id,
      folderId: row.folderId || row.parentFolderId,
      nameOfFile: row.fileName,
      status: 'Active',
      isFillableTemplate: row.isFillableTemplate,
      isDraftingTemplate: row.isDraftingTemplate,
      ownerId: row.owner ? row.owner.id : null,
      body: { file: null },
      containsESignatureFields: row.iseSignatureField,
      dmsFileStatus: DMSFileStatus.SecurityScanInProgress
    };
    this.loading = true;
    switch (type) {
      case 'remove':
        params.dmsFileStatus = DMSFileStatus.UploadCancelled;
        break;
      case 'retry':
        params.dmsFileStatus = DMSFileStatus.SecurityScanInProgress;
        this.folderAndFileList[idx].dmsFileStatus = 'SecurityScanInProgress';
        break;
    }
    this.documentSettingService
      .v1DocumentSettingDocumentUploadPost(params)
      .subscribe(
        () => {
          if (type === 'remove') {
            this.toastDisplay.showSuccess(
              this.errorData.documentDeletedSuccessfully
            );
          }
          this.loading = false;
          this.getFolders(this.selected, this.firmInfo.indexOf(row) === 1);
        },
        err => {
          this.loading = false;
        }
      );
  }

  fileNameChanged() {
    this.isExist = null;
    let name = this.editFileForm.get('targetName').value;

    if (!name || !name.trim()) {
      return;
    }

    if (this.reqTimout) {
      clearTimeout(this.reqTimout);
      this.reqTimout = null;
    }

    this.reqTimout = setTimeout(async () => {
      try {
        name = this.getEnteredFormattedFileName(name);
        this.loading = true;
        let res: any = await this.dmsService
          .v1DmsPracticeareaFileIsFileExistGet({
            folderId: this.sourceFileName.parentFolderId,
            fileName: name
          })
          .toPromise();

        res = JSON.parse(res).results;
        this.isExist =
          res === +this.sourceFileName.id || !res
            ? false
            : this.errorData.document_exists_err;
        this.isExistErr =
          res === +this.sourceFileName.id || !res
            ? ''
            : 'A file with this name already exists.';
        this.loading = false;
      } catch (e) {
        this.loading = false;
      }
    }, 400);
  }

  getEnteredFormattedFileName(name): string {
    const orgName = this.sourceFileName.originalFileName
      ? this.sourceFileName.originalFileName
      : this.sourceFileName.name;
    if (name.includes('.')) {
      const ext = orgName.substring(
        orgName.lastIndexOf('.') + 1,
        orgName.length
      );
      name = this.extensionsArray.includes(ext)
        ? name.substring(0, +name.lastIndexOf('.'))
        : name;
    }

    name = `${name.trim()}.${orgName.substr(orgName.lastIndexOf('.') + 1)}`;
    return name.trim();
  }

  /**
   * @param id Doc ID
   * Function to replace document
   */
  public replaceDocument(row) {
    let paths = [];
    if (row.path) {
      paths = row.path.split('/');
    } else {
      if (this.selected.path) {
        const path = `${this.selected.folderPath}/${row.fileName}`;
        paths = path.split('/');
      }
    }
    const clientId =
      paths[5] === 'Clients' && paths[6] && !isNaN(+paths[6]) ? paths[6] : null;
    const matterId =
      paths[7] === 'Matters' && paths[8] && !isNaN(+paths[8]) ? paths[8] : null;

    this.indexdbService.addObject('firmInfo', this.firmInfo);

    const navigationExtras: NavigationExtras = {
      queryParams: {
        documentId: row.id,
        folderId: this.selected.id
      }
    };

    if (clientId) {
      navigationExtras.queryParams.clientId = +clientId;
    }

    if (matterId) {
      navigationExtras.queryParams.matterId = +matterId;
    }

    if (this.pageType) {
      navigationExtras.queryParams.matterId = this.pageType;
    }
    this.route.navigate(
      ['/firm/document-setting/replace-document'],
      navigationExtras
    );
  }
  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  updateDatatableFooterPage2() {
    this.page2.totalElements = this.folderAndFileList.length;
    console.log(this.folderAndFileList)
    this.page2.totalPages = Math.ceil(
      this.folderAndFileList.length / this.page2.size
    );
    this.page2.pageNumber = 0;
    this.pangeSelected2 = 1;
    this.table2.offset = 0;
    UtilsHelper.aftertableInit();
  }

  public changePageSize2() {
    this.page2.size = +this.pageSelector2.value;
    this.updateDatatableFooterPage2();
  }

  public changePage2() {
    this.page2.pageNumber = this.pangeSelected2 - 1;
    if (this.pangeSelected2 == 1) {
      this.updateDatatableFooterPage2();
    } else {
      UtilsHelper.aftertableInit();
    }
  }

  public pageChange2(e) {
    this.pangeSelected2 = e.page;
    UtilsHelper.aftertableInit();
  }

  get footerHeight() {
    if (this.practiceAreaList) {
      return this.practiceAreaList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }

  get footerHeight2() {
    if (this.folderAndFileList) {
      return this.folderAndFileList.length > 10 ? 50 : 0
    } else {
      return 0
    }
  }
}
