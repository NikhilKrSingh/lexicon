
/**
 * Multiselect Folder dropdown component
 */
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, ViewEncapsulation } from '@angular/core';
import { DmsService } from 'src/common/swagger-providers/services';
import { IndexDbService } from '../../../index-db.service';
import { UtilsHelper } from '../utils.helper';

@Component({
  selector: 'app-multilevel-folder-dropdown',
  templateUrl: './multilevel-folder-dropdown.component.html',
  styleUrls: ['./multilevel-folder-dropdown.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class MultiLevelFolderDropdownComponent implements OnChanges {

  @HostListener('document:click', ['$event']) onClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  @Output() readonly onSelectionChanged: EventEmitter<any> = new EventEmitter();
  @Input() folderId: any = null;
  @Input() isClientFolder = false;
  currentFolder: any = {};
  folders: any[] = [];
  showDropdown = false;
  title: string;
  displayFlag = false;
  headtitle: string;
  loading = true;
  public oriArr: Array<any> = [];

  constructor(
    private elementRef: ElementRef,
    public indexDbService: IndexDbService,
    private dmsService: DmsService
  ) { }

  ngOnChanges() {
    const folderInfo = UtilsHelper.getObject('multiFolderSelection');
    if (folderInfo && Object.keys(folderInfo).length && folderInfo.parent && folderInfo.current) {
      this.getFolderList(folderInfo.parent, folderInfo.current);
    } else {
      this.getFolderList(this.folderId);
    }
  }

  getFolderList(folderId, selection?) {
    if (folderId) {
      this.getSubFolders(folderId, selection);
    } else {
      this.getTenantFolder();
    }
  }

  async getTenantFolder() {
    try {
      this.loading = true;
      let resp: any = await this.dmsService.v1DmsTenantFolderGet().toPromise();
      resp = JSON.parse(resp).results;
      this.getSubFolders(resp.id);
    } catch (e) {
      this.loading = false;
    }
  }

  async getSubFolders(folderId, triggerSelection?) {
    try {
      this.loading = true;
      let resp: any = await this.dmsService.v1DmsFolderSubFoldersFolderIdGet({ folderId }).toPromise();
      resp = JSON.parse(resp).results;
      this.currentFolder = resp.currentFolder;
      this.folders = resp.subFolders;
      this.oriArr = [...resp.subFolders];
      this.folders.sort(function (x, y) {
        let a = x.name.trim().toUpperCase(),
          b = y.name.trim().toUpperCase();
        return a === b ? 0 : a > b ? 1 : -1;
      });
      this.loading = false;
      if (triggerSelection) {
        this.emitSelectedFolder(triggerSelection);
      }
    } catch (e) {
      this.loading = false;
      this.getTenantFolder();
    }
  }

  /**** function to show/hide dropdown */
  public show() {
    this.showDropdown = !this.showDropdown;
  }



  emitSelectedFolder(item) {
    this.displayFlag = true;
    this.title = item.name;
    this.showDropdown = false;
    this.onSelectionChanged.emit({ id: item.id, name: item.name });
  }

  public updateFilter(e) {
    const searchString = e.target.value;
    let filterList = this.oriArr;
    filterList = filterList.filter(
      item =>
        this.matchName(item, searchString, 'name')
    );

    filterList.sort(function (x, y) {
      let a = x.name.trim().toUpperCase(),
        b = y.name.trim().toUpperCase();
      return a === b ? 0 : a > b ? 1 : -1;
    });
    this.folders = filterList;
  }

  private matchName(
    item: any,
    searchValue: string,
    fieldName: string
  ): boolean {
    const searchName = item[fieldName]
      ? item[fieldName].toString().toUpperCase()
      : '';
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
