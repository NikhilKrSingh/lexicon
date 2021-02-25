import { Pipe, PipeTransform } from '@angular/core';
import { vwTrustTransaction } from '../../models/vw-trust-transaction';

@Pipe({
  name: 'accountType',
})
export class AccountTypePipe implements PipeTransform {
  transform(account: string, requiredType: string, requiredType1: string): any {
    if (account == requiredType) {
      return true;
    }

    if (requiredType1 && account == requiredType1) {
      return true;
    }

    return false;
  }
}

@Pipe({
  name: 'sourceType',
})
export class SourceTypePipe implements PipeTransform {
  transform(row: vwTrustTransaction, matterId: any, trustAccountId: any): any {
    if (trustAccountId > 0) {
      if (row.sourceTrustOnlyAccountId && row.matterId === matterId) {
        return 'Source Account';
      } else {
        return 'Target Account';
      }
    } else {
      if (row.sourceIsPrimaryTrust && row.matterId === matterId) {
        return 'Source Account';
      } else {
        return 'Target Account';
      }
    }
  }
}

@Pipe({
  name: 'isSourceType',
})
export class IsSourceTypePipe implements PipeTransform {
  transform(
    row: vwTrustTransaction,
    matterId: any,
    trustAccountId: any
  ): boolean {
    if (row) {
      if (trustAccountId > 0) {
        if (row.sourceTrustOnlyAccountId && row.matterId === matterId) {
          return true;
        } else {
          return false;
        }
      } else {
        if (row.sourceIsPrimaryTrust && row.matterId === matterId) {
          return true;
        } else {
          return false;
        }
      }
    } else {
      return false;
    }
  }
}

@Pipe({
  name: 'isTargetType',
})
export class IsTargetTypePipe implements PipeTransform {
  transform(
    row: vwTrustTransaction,
    matterId: any,
    trustAccountId: any
  ): boolean {
    if (row) {
      if (trustAccountId > 0) {
        if (row.sourceTrustOnlyAccountId && row.matterId === matterId) {
          return false;
        } else {
          return true;
        }
      } else {
        if (row.sourceIsPrimaryTrust && row.matterId === matterId) {
          return false;
        } else {
          return true;
        }
      }
    } else {
      return false;
    }
  }
}

@Pipe({
  name: 'transactionType',
})
export class TransactionTypePipe implements PipeTransform {
  transform(row: vwTrustTransaction, matterId: any, trustAccountId: any): any {
    if (trustAccountId > 0) {
      if (row.sourceTrustOnlyAccountId && row.matterId === matterId) {
        return 'From';
      } else {
        return 'To';
      }
    } else {
      if (row.sourceIsPrimaryTrust && row.matterId === matterId) {
        return 'From';
      } else {
        return 'To';
      }
    }
  }
}
