/**
 *Generic Selection Model
 */
export class SelectionModel<T = any> {
  private _data: Array<T>;
  private _isMultiSelectEnabled: boolean;

  constructor(initialData: T[] = [], isMultiSelectEnabled = true) {
    this._data = initialData;
    this._isMultiSelectEnabled = isMultiSelectEnabled;
  }

  public add(item: T) {
    let index = this._data.indexOf(item);
    if (index == -1) {
      this._add(item);
    }
  }

  private _add(item: T) {
    if (this._isMultiSelectEnabled) {
      this._data.push(item);
    } else {
      this._data = [item];
    }
  }

  public remove(item: T) {
    let index = this._data.indexOf(item);
    if (index > -1) {
      this._remove(index);
    }
  }

  private _remove(index: number) {
    if (this._isMultiSelectEnabled) {
      this._data.splice(index, 1);
    } else {
      this._data = [];
    }
  }

  public toggle(item: T) {
    let index = this._data.indexOf(item);
    if (index > -1) {
      this._remove(index);
    } else {
      this._add(item);
    }
  }

  public get selected() {
    if (this._isMultiSelectEnabled) {
      return this._data;
    } else {
      return this._data[0];
    }
  }
}
