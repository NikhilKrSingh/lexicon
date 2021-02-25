import { Subscription } from 'rxjs';

export class SubscriptionList {
  [key: string]: Subscription;
}

export interface AutoUnsubscribeParams {
  subscriptionListKey: string;
}

export function AutoUnsubscribe(params: AutoUnsubscribeParams) {
  return function(constructor) {
    const original = constructor.prototype.ngOnDestroy;

    constructor.prototype.ngOnDestroy = function() {
      if (params) {
        let key = params.subscriptionListKey;

        if (key) {
          let subscriptionListKeyProp = this[key];

          if (subscriptionListKeyProp instanceof SubscriptionList) {
            for (let prop in subscriptionListKeyProp) {
              let property = subscriptionListKeyProp[prop];
              if (property && typeof property.unsubscribe === 'function') {
                property.unsubscribe();
              }
            }
          }
        }
      }

      if (original && typeof original === 'function') {
        original.apply(this, arguments);
      }
    };
  };
}
