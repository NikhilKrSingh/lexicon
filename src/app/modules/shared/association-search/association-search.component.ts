import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { debounceTime } from 'rxjs/operators';
import { MatterService, PersonService } from 'src/common/swagger-providers/services';
import { Page } from '../../models';
import { UtilsHelper } from '../utils.helper';

@Component({
  selector: 'app-association-search',
  templateUrl: './association-search.component.html',
  styleUrls: ['./association-search.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class AssociationSearchComponent implements OnInit {
  searchInput = new FormControl();
  @Input() associationType: string;
  @Input() opposingPartyList: any[] = [];

  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @Output() readonly selectedAssociation = new EventEmitter<any>();

  private originalSearchResultRows: Array<any> = [];
  searchResultRows: Array<any> = [];

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public counter = Array;
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 20];
  public matterAssocLoading: boolean = true;
  public pageSelected = 1;
  public selected: any = [];

  constructor(
    private personService: PersonService,
    private matterService: MatterService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    this.personService
      .v1PersonBygroupGet({ group: this.associationType })
      .subscribe(
        (res: any) => {
          res = JSON.parse(res as any).results;
          const arr =
            this.opposingPartyList && this.opposingPartyList.length
              ? this.opposingPartyList.map(x => x.id)
              : [];
          const tmp = [];

          res.forEach(x => {
            if (arr.indexOf(x.id) === -1) {
              tmp.push(x);
            }
            x.assocName = x.isCompany ? x.companyName : x.name;
          });

          this.matterAssocLoading = false;
          this.originalSearchResultRows = tmp;
          this.searchResultRows = [...this.originalSearchResultRows];
          this.updateFooterPage();
        },
        () => {
          this.matterAssocLoading = false;
        }
      );

    this.initSearch();
  }

  private initSearch() {
    this.searchInput.valueChanges.pipe(debounceTime(100)).subscribe(text => {
      let res = [...this.originalSearchResultRows];

      if (text && text.trim() !== '') {
        res = res.filter(a => {
          return (
            this.matchName(a, 'uniqueNumber', text) ||
            this.matchName(a, 'assocName', text) ||
            this.matchName(a, 'email', text) ||
            this.matchName(a, 'status', text) ||
            this.matchName(a, 'primaryPhone', text) ||
            UtilsHelper.matchFullEmployeeName(a, text)
          );
        });
      }

      const arr =
        this.opposingPartyList && this.opposingPartyList.length
          ? this.opposingPartyList.map(x => x.id)
          : [];
      const tmp = [];
      res.forEach(x => {
        if (arr.indexOf(x.id) === -1) {
          tmp.push(x);
        }
      });

      this.searchResultRows = [...tmp];
      this.updateFooterPage();
    });
  }

  private matchName(item: any, fieldName, searchValue: string): boolean {
    const searchName =
      item && item[fieldName] ? item[fieldName].toString().toLowerCase() : '';
    return searchName.search(searchValue) > -1;
  }

  /**
   * Change per page size
   *
   */
  public changePageSize() {
    this.page.size = +this.pageSelector.value;
    this.updateFooterPage();
  }

  /**
   * Change page number
   *
   */
  public changePage() {
    this.page.pageNumber = this.pageSelected - 1;
    if (this.pageSelected == 1) {
      this.updateFooterPage();
    }
  }

  /**
   * Handle change page number
   */
  public pageChange(e) {
    this.pageSelected = e.page;
  }

  onSelect(row: any) {
    this.selected = row;
    this.selectedAssociation.emit(row);
  }

  /** update Associations table footer page count */
  updateFooterPage() {
    this.page.totalElements = this.searchResultRows.length;
    this.page.totalPages = Math.ceil(
      this.searchResultRows.length / this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

  trackByFn(index: number, obj: any) {
    return obj ? obj['id'] || obj : index;
  }

  get footerHeight() {
    if (this.searchResultRows) {
      return this.searchResultRows.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
