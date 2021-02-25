/**
 * Multiselect dropdown component
 */
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, ViewEncapsulation } from '@angular/core';
import * as clone from 'clone';

@Component({
  selector: 'app-multilevel-dropdown',
  templateUrl: './multilevel-dropdown.component.html',
  styleUrls: ['./multilevel-dropdown.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class MultiLevelDropdownComponent implements OnInit, OnChanges {

  @HostListener('document:click', ['$event']) onClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
      this.searchValue = '';
      this.displaySubItem = clone(this.allItems);
    }
  }

  @Input() title: string;
  @Input() backgroundColor: string;
  @Input() displaySubItem: any;
  @Input() filterName: string;
  @Input() selections: Array<any>;
  @Output() readonly selectionChanged: EventEmitter<any> = new EventEmitter();
  @Output() readonly multiSelectSelectedOptions: EventEmitter<any> = new EventEmitter();
  @Output() readonly clearFilter: EventEmitter<void> = new EventEmitter();
  @Output() readonly applyFilter: EventEmitter<void> = new EventEmitter();
  public showDropdown: boolean = false;
  private selectMessage: string = '';
  private allItems: any;
  public searchValue: string = '';
  public displayFlag: boolean = false;
  public tempChildArr: any;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {}

  ngOnChanges(changes) {
    if (changes.hasOwnProperty('displaySubItem')) {
      this.displaySubItem = changes.displaySubItem.currentValue;
      this.allItems =  clone(this.displaySubItem);
    }
    if (changes.hasOwnProperty('title')) {
      if (!!changes.title.currentValue)
      this.displayFlag = (this.title === 'All' || this.title === 'Secondary Office(s)' || this.title === 'Practice Area(s)' ||
                          this.title === 'Add employee to a Group') ? true : false ;
    }
    if (changes.hasOwnProperty('selections')) {
      this.selections = changes.selections.currentValue;
    }
  }

  public show() {
    this.showDropdown = !this.showDropdown;
    this.searchValue = '';
    this.displaySubItem = this.allItems;
  }

  public onSearchKeyup(ev: any, i?: number, j?: number, k?: number, l?: number, m?: number, n?:number): void {
    this.searchValue = ev.target.value;
    if (this.searchValue === '') {
      this.replaceObject(i, j, k, l, m, n);
    } else {
      this.filterDatas(i, j, k, l, m, n);
    }
  }

  public filterDatas(i, j, k, l, m, n) {
    if (n || n === 0) {
      this.displaySubItem[i].childArray[j].childArray[k].childArray[l].childArray[m].childArray[n].childArray = this.tempChildArr.filter(item =>
        this.matchName(item, this.searchValue, 'name')
      );
    } else if (m || m === 0) {
      this.displaySubItem[i].childArray[j].childArray[k].childArray[l].childArray[m].childArray = this.tempChildArr.filter(item =>
        this.matchName(item, this.searchValue, 'name')
      );
    } else if (l || l === 0) {
      this.displaySubItem[i].childArray[j].childArray[k].childArray[l].childArray = this.tempChildArr.filter(item =>
        this.matchName(item, this.searchValue, 'name')
      );
    } else if (k || k === 0) {
      this.displaySubItem[i].childArray[j].childArray[k].childArray = this.tempChildArr.filter(item =>
        this.matchName(item, this.searchValue, 'name')
      );
    } else if (j || j === 0) {
      this.displaySubItem[i].childArray[j].childArray = this.tempChildArr.filter(item =>
        this.matchName(item, this.searchValue, 'name')
      );
    } else if (i || i === 0) {
      this.displaySubItem[i].childArray = this.tempChildArr.filter(item =>
        this.matchName(item, this.searchValue, 'name')
      );
    }
  }

  private matchName(item: any, searchValue: string, fieldName): boolean {
    const searchName = item[fieldName] ? item[fieldName].toString().toUpperCase() : '';
    return searchName.search(searchValue.toUpperCase()) > -1;
  }

  public changeSelection(event, itemId, i?, j? ,k?, l?, m?, n?, o?) {
    let changesObj;
    if (o || o === 0) {
      changesObj = this.displaySubItem[i].childArray[j].childArray[k].childArray[l].childArray[m].childArray[o].childArray;
    } else if (n || n === 0) {
      changesObj = this.displaySubItem[i].childArray[j].childArray[k].childArray[l].childArray[m].childArray;
    } else if (m || m === 0) {
      changesObj = this.displaySubItem[i].childArray[j].childArray[k].childArray[l].childArray;
    } else if (l || l === 0) {
      changesObj = this.displaySubItem[i].childArray[j].childArray[k].childArray;
    } else if (k || k === 0) {
      changesObj = this.displaySubItem[i].childArray[j].childArray;
    } else if (j || j === 0) {
      changesObj = this.displaySubItem[i].childArray;
    } else if (i || i === 0) {
      changesObj = this.displaySubItem;
    }
    if (event.srcElement.checked === true) {
      if (itemId === 0) {
        changesObj.map((item, index) => {
          changesObj[index].checked = true;
        });
        this.selections = [itemId];
      } else {
        this.selections.push(itemId);

        changesObj.filter((item, index) => {
          let position = index;
          if (item.id === itemId) {
            changesObj[position].checked = true;
          }
        });
      }
    } else {
      const index: number = this.selections.indexOf(itemId);
      if (index !== -1) {
        this.selections.splice(index, 1);
      }
      if (itemId === 0) {
        changesObj.map((item, index) => {
          changesObj[index].checked = false;
        });
      } else {
        changesObj.filter((item, index) => {
          let position = index;
          if (item.id === itemId) {
            changesObj[position].checked = false;
          }
        });
      }
    }
    this.selectionChanged.emit({selections: this.selections,displaySubItem: this.displaySubItem});
    this.multiSelectSelectedOptions.emit(this.selections);
  }



  public clear() {
    this.clearObject(this.allItems);
    this.clearFilter.emit();
  }

  private clearObject(obj) {
    if (obj) {
      obj.map((item) => {
        item.checked = false;
        if (item.childArray) {
          this.clearObject(item.childArray);
        }
      });
    }
  }

  public apply() {
    this.showDropdown = false;
    this.applyFilter.emit();
  }

  public next(action, i, j?: number, k?: number, l?, m?, n?) {
    if (this.searchValue !== '') {
      this.searchValue = '';
      if (action === 'back') this.replaceObject(i,j, k, l, m, n);
      else this.replaceObject(j, k, l, m, n);
    }
    if (action === 'back') {
      if (n || n === 0) {
        this.tempChildArr = this.displaySubItem[i].childArray[j].childArray[k].childArray[l].childArray[m].childArray;
      } else if (m || m === 0) {
        this.tempChildArr = this.displaySubItem[i].childArray[j].childArray[k].childArray[l].childArray;
      } else if (l || l === 0) {
        this.tempChildArr = this.displaySubItem[i].childArray[j].childArray[k].childArray;
      } else if (k || k === 0) {
        this.tempChildArr = this.displaySubItem[i].childArray[j].childArray;
      } else if (j || j === 0) {
        this.tempChildArr = this.displaySubItem[i].childArray;
      } else if (i || i === 0) {
        this.tempChildArr = this.displaySubItem;
      }
    } else {
      if (n || n === 0) {
        this.tempChildArr = this.displaySubItem[i].childArray[j].childArray[k].childArray[l].childArray[m].childArray[n].childArray;
      } else if (m || m === 0) {
        this.tempChildArr = this.displaySubItem[i].childArray[j].childArray[k].childArray[l].childArray[m].childArray;
      } else if (l || l === 0) {
        this.tempChildArr = this.displaySubItem[i].childArray[j].childArray[k].childArray[l].childArray;
      } else if (k || k === 0) {
        this.tempChildArr = this.displaySubItem[i].childArray[j].childArray[k].childArray;
      } else if (j || j === 0) {
        this.tempChildArr = this.displaySubItem[i].childArray[j].childArray;
      } else if (i || i === 0) {
        this.tempChildArr = this.displaySubItem[i].childArray;
      }
    }
  }

  private replaceObject(i, j?: number, k?: number, l?, m?, n?) {
    if (n || n === 0) {
      this.displaySubItem[i].childArray[j].childArray[k].childArray[l].childArray[m].childArray[n].childArray = this.tempChildArr;
    } else if (m || m === 0) {
      this.displaySubItem[i].childArray[j].childArray[k].childArray[l].childArray[m].childArray = this.tempChildArr;
    } else if (l || l === 0) {
      this.displaySubItem[i].childArray[j].childArray[k].childArray[l].childArray = this.tempChildArr;
    } else if (k || k === 0) {
      this.displaySubItem[i].childArray[j].childArray[k].childArray = this.tempChildArr;
    } else if (j || j === 0) {
      this.displaySubItem[i].childArray[j].childArray = this.tempChildArr;
    } else if (i || i === 0) {
      this.displaySubItem[i].childArray = this.tempChildArr;
    }
  }

  private replaceValue(changesObj) {
    let checkedIds = [];
    changesObj.map(item => {
      if (item.checked) {
        checkedIds.push(item.id);
      }
    });
    if (this.tempChildArr) {
      this.tempChildArr.map((obj) => {
        if (checkedIds.indexOf(obj.id) !== -1) {
          obj.checked = true;
        }
      });
    }
  }
  trackByFn(index: number,obj: any) {
    return obj ? obj['id'] || obj : index ;
  }
}
