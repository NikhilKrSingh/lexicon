import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import * as _ from 'lodash';
import { debounceTime } from 'rxjs/operators';
import { ContactsService } from 'src/common/swagger-providers/services/contacts.service';
import { Page } from '../../models/page';
import * as errorData from '../error.json';

@Component({
  selector: 'app-corporate-search',
  templateUrl: './corporate-search.component.html',
  styleUrls: [],
  encapsulation: ViewEncapsulation.Emulated
})
export class CorporateSearchComponent implements OnInit {
  searchInput = new FormControl();
  isLoading = false;
  @Input() hideHeading = false;
  @Input() placeHolderData = 'Search';
  @Input() errCorporateExistinig = false;
  @ViewChild(DatatableComponent, { static: false }) table: DatatableComponent;
  @Output() readonly selectedAssociation = new EventEmitter<any>();
  @Output() readonly isSearch = new EventEmitter<any>();
  searchResultRows: Array<any> = [];

  public ColumnMode = ColumnMode;
  public SelectionType = SelectionType;
  public page = new Page();
  public counter = Array;
  public pageSelector = new FormControl('10');
  public limitArray: Array<number> = [10, 20];
  public existedContactList: Array<any> = [];
  public sortedContactList: Array<any> = [];
  public pageSelected = 1;
  public errorData: any = (errorData as any).default;

  constructor(
    private contactsService: ContactsService
  ) {
    this.page.pageNumber = 0;
    this.page.size = 10;
  }

  ngOnInit() {
    this.getCorporateClients();
    this.searchInput.valueChanges.pipe(debounceTime(500)).subscribe(text => {
      this.isLoading = true;
      if (text && text.trim() !== '') {
        this.sortedContactList = _.filter(this.existedContactList, (o: any) => {
          if (o.lastName.includes(text)
            || o.firstName.includes(text)
            || o.uniqueNumber.includes(text)
            || o.companyName.includes(text)
            || o.uniqueNumber.includes(text)
            || (o.email && o.email.includes(text))
            || (o.firstName && o.lastName && `${o.firstName.trim()}, ${o.lastName.trim()}`.toLowerCase()).includes(text.toLowerCase())
            || (o.lastName && o.firstName && `${o.lastName.trim()}, ${o.firstName.trim()}`.toLowerCase()).includes(text.toLowerCase())
            || (o.firstName && o.lastName && `${o.firstName.trim()} ${o.lastName.trim()}`.toLowerCase()).includes(text.toLowerCase())
            || (o.lastName && o.firstName && `${o.lastName.trim()} ${o.firstName.trim()}`.toLowerCase()).includes(text.toLowerCase())) {
            return o;
          }
        });
      } else {
        this.sortedContactList = this.existedContactList;
      }
      this.updateFooterPage();
      this.isLoading = false;
    });
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
    this.selectedAssociation.emit(row);
  }

  /** update Associations table footer page count */
  updateFooterPage() {
    this.page.totalElements = this.sortedContactList.length;
    this.page.totalPages = Math.ceil(
      this.sortedContactList.length / this.page.size
    );
    this.page.pageNumber = 0;
    this.pageSelected = 1;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

  getCorporateClients(): void {
    this.isLoading = true;
    this.contactsService.v1ContactsCorporateGet().subscribe((res: any) => {
      res = JSON.parse(res as any).results;
      this.isLoading = false;
      if (res.persons) {
        let personArray = res.persons.filter(obj => {
          return obj.status === 'Active' && obj.isVisible;
        });
        this.existedContactList = personArray.map(e => {
          const name = e.name ? e.name.split(',') : e.name;
          return {
            uniqueNumber: e.uniqueNumber ? String(e.uniqueNumber) : '',
            id: e.id,
            personId: e.id,
            fullName: (e.name) ? e.name.trim() : '',
            lastName: name && name[0] ? name[0] : '',
            firstName: name && name[1] ? name[1] : '',
            email: e.email,
            companyName: e.companyName ? e.companyName : '',
            jobTitle: e.jobTitle,
            primaryPhoneNumber: e.phones,
            cellPhoneNumber: e.secondaryContact,
            cellPhone: e.phones,
            status: e.status,
            isPrimary: e.corporateContactTypes.length && e.corporateContactTypes.includes('Primary Contact'),
            isBilling: e.corporateContactTypes.length && e.corporateContactTypes.includes('Billing Contact'),
            isGeneral: e.corporateContactTypes.length && e.corporateContactTypes.includes('General Counsel'),
            isVisible: e.isVisible
          };
        });
        this.sortedContactList = [...this.existedContactList];
        this.updateFooterPage();
      }
    }, err => this.isLoading = false);
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }

    get footerHeight() {
    if (this.sortedContactList) {
      return this.sortedContactList.length > 10 ? 50 : 0;
    } else {
      return 0;
    }
  }
}
