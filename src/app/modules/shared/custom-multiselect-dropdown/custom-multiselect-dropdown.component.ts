/**
 * Multiselect dropdown component
 */
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, ViewEncapsulation, ViewChild } from '@angular/core';
import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-custom-multiselect-dropdown',
  templateUrl: './custom-multiselect-dropdown.component.html',
  styleUrls: ['./custom-multiselect-dropdown.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class CustomMultiselectDropdownComponent implements OnChanges {
  @Input() isDisabled = false;
  @Input() placeholder = 'Search ';
  @Input() clientDropdown = false;
  @Input() zeroForAll: boolean;
  @Input() title: string;
  @Input() backgroundColor: string;
  @Input() displaySubItem: any;
  @Input() filterName: string;
  @Input() selectedMessage = 'filters are selected';
  @Input() selections: Array<any>;
  @Input() showAll:boolean = false;
  @Input() showSearch:boolean = true;
  @Input() unsort:boolean = false;
  @Input() loading:boolean = false;
  @Input() searchValue: string = '';
  @Input() isPerformSearch: boolean = false;

  @Output() readonly selectionChanged: EventEmitter<any> = new EventEmitter();
  @Output() readonly multiSelectSelectedOptions: EventEmitter<any> = new EventEmitter();
  @Output() readonly clearFilter: EventEmitter<void> = new EventEmitter();
  @Output() readonly applyFilter: EventEmitter<void> = new EventEmitter();
  @Output() readonly scrollEnd: EventEmitter<void> = new EventEmitter();
  @Output() readonly isAllStatus: EventEmitter<boolean> = new EventEmitter();
  @Output() readonly search: EventEmitter<string> = new EventEmitter();
  public showDropdown = false;
  private selectMessage = '';
  private allItems: any;
  public displayFlag = false;
  txtQueryChanged: Subject<string> = new Subject<string>();

  titleArr: string[] = [
    'All', 'Secondary Office(s)', 'Practice Area(s)', 'Add employee to a Group',
    'Select office', 'Select client', 'Select company', 'Select contact type' ,
    'Select attorney', 'Select matter type', 'Select association type', 'Select status',
    'Select Co-Owners', 'Select Days', 'Select Categories', 'Select Clients',
    'Select Matters', 'Select a client', 'Select a client association', 'Select employee', 'Select desired time', 'Select document attributes'
  ];
  opts: ISlimScrollOptions;
  scrollEvents: EventEmitter<SlimScrollEvent>;
  public parentChecked:boolean = false;

  /**
   * Handler to close dropdown, clear search on outside click
   * @param event Mouse Click Event
   */
  @HostListener('document:click', ['$event']) public onClickOutside(event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      if (this.showDropdown) {
        this.applyFilter.emit();
      }
      if (event.target.className !== 'icon icon-close' && event.target.className !== 'badge badge-primary mr-8') {
        this.showDropdown = false;
        this.search.emit("");
      }
      this.displaySubItem = this.allItems;
    }
  }

  @ViewChild('searchInput', {static: false}) searchInput: ElementRef;

  constructor(private elementRef: ElementRef) {
    this.txtQueryChanged
            .debounceTime(1000) // wait 1 sec after the last event before emitting last event
            .distinctUntilChanged() // only emit if value is different from previous value
            .subscribe(model => {
              this.isAllStatus.emit(this.parentChecked);
              this.search.emit(this.searchValue);
             });
  }

  ngOnChanges(changes) {
    this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    this.opts = {
      position: 'right',
      barBackground: '#413a93',
      barOpacity: '1',
      barWidth: '4',
      barBorderRadius: '4',
      barMargin: '2px',
      gridOpacity: '1',
      gridBackground: '#e7edf3',
      gridWidth: '8',
      gridMargin: '0',
      gridBorderRadius: '4',
      alwaysVisible: true,
    };
    if (changes.hasOwnProperty('displaySubItem')) {
      this.displaySubItem = changes.displaySubItem.currentValue;
      this.allItems = this.displaySubItem;
    }
    if (changes.hasOwnProperty('title')) {
      if (!!changes.title.currentValue) {
        if(!this.showAll) {
          this.displayFlag = this.titleArr.indexOf(this.title) > -1 ? true : false;
        } else {
          let titleArr:any = [...this.titleArr];
          titleArr.shift();
          this.displayFlag = titleArr.indexOf(this.title) > -1 ? true : false;
        }
      }
    }
    if (changes.hasOwnProperty('selections')) {
      this.selections = changes.selections.currentValue;
    }
    this.displaySubItem = this.displaySubItem ? this.displaySubItem : [];

    if(this.displaySubItem && this.displaySubItem.length) {
      const checkedFalse:boolean = this.displaySubItem.some(e => !e.checked);
      if(!checkedFalse) {
        this.parentChecked = true;
        return;
      }
    }
    this.parentChecked = false;
  }

  @HostListener('scroll', ['$event']) onScroll(event: any) {
    if ((event.target.offsetHeight + event.target.scrollTop >= event.target.scrollHeight - 5)) {
      this.isAllStatus.emit(this.parentChecked);
      this.scrollEnd.emit();
    }
  }

  public show() {
    this.showDropdown = !this.showDropdown;
    this.displaySubItem = this.allItems;
    if(this.showDropdown){
      setTimeout(() => {
        this.searchInput.nativeElement.focus()
      }, 500)
    }
  }

  public onSearchKeyup(ev: any): void {
    this.searchValue = ev.target.value;
    this.txtQueryChanged.next(this.searchValue);
  }

  public filterDatas() {
    this.displaySubItem = this.allItems.filter(item =>
      (this.matchName(item, this.searchValue, 'name') || this.matchName(item, this.searchValue, 'email'))
    );
  }

  private matchName(item: any, searchValue: string, fieldName): boolean {
    const searchName = item[fieldName] ? item[fieldName].toString().toUpperCase() : '';
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  public changeSelection(event, itemId) {
    if (event.srcElement.checked === true) {
      if (itemId === 0 && !this.zeroForAll) {
        this.allItems.map((item, index) => {
          this.allItems[index].checked = true;
        });
        this.selections = [itemId];
      } else {
        this.selections.push(itemId);

        this.allItems.filter((item, index) => {
          const position = index;
          if (item.id === itemId) {
            this.allItems[position].checked = true;
          }
        });
      }
    } else {
      const index: number = this.selections.indexOf(itemId);
      if (index !== -1) {
        this.selections.splice(index, 1);
      }
      if (itemId === 0 && !this.zeroForAll) {
        this.allItems.map((item, idx) => {
          this.allItems[idx].checked = false;
        });
      } else {
        this.allItems.filter((item, idx) => {
          const position = idx;
          if (item.id === itemId) {
            this.allItems[position].checked = false;
          }
        });
      }
    }
    const checkedTrue:boolean = this.allItems.some(e => !e.checked);
    this.displaySubItem = this.allItems;
    this.selectionChanged.emit({selections: this.selections, checked: event.srcElement.checked, allChecked: null, itemId: itemId, isPerformSearch: this.isPerformSearch});
    this.multiSelectSelectedOptions.emit(this.selections);
    if(checkedTrue) {
      this.parentChecked = false;
      this.isAllStatus.emit(this.parentChecked);
      return;
    }
    this.parentChecked = true;
    this.isAllStatus.emit(this.parentChecked);
  }

  public clear() {
    this.parentChecked = false;
    this.clearFilter.emit();
  }

  public apply() {
    this.showDropdown = false;
    this.applyFilter.emit();
    this.search.emit("");
  }

  /**** function to select/deselect all */
  selectDeselectAll(event:any) {
    this.selections = [];
    const checked = (event && event.target && event.target.checked) ? true : false;
    this.displaySubItem.forEach(element => {
      element.checked = checked
    });
    this.selections = this.displaySubItem.filter(item => item.checked).map(item => item.id)
    this.selectionChanged.emit({selections: this.selections, checked: null, allChecked: event.target.checked, itemId: null, isPerformSearch: this.isPerformSearch});
    this.multiSelectSelectedOptions.emit(this.selections);
    this.isAllStatus.emit(this.parentChecked);
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}

