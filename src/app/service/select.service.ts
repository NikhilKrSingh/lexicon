import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SelectService {

  private selectSource = new BehaviorSubject(null);;

  constructor() {
  }

  newSelection(event) {
    this.selectSource.next(event);
  }

  get newSelection$() {
    return this.selectSource.asObservable();
  }

}


