import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {

  trustAccountingStatusSource = new BehaviorSubject(null);
  currentTrustAccountingStatus = this.trustAccountingStatusSource.asObservable();

  notificationCountSource = new BehaviorSubject<number>(null);
  currentNotificationCount = this.notificationCountSource.asObservable();

  constructor() { 
  }

  changeTrustAccountStatus(status: boolean) {
    this.trustAccountingStatusSource.next(status);
  }

  changeNotificationCount(count: number) {
    this.notificationCountSource.next(count);
  }
}

