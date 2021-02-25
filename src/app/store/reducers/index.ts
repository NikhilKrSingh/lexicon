import * as fromPermissionData from './permission.reducer';

export interface AppState {
  permissions: fromPermissionData.PermissionDataState;
}

export const reducers = {
  permissions: fromPermissionData.reducer,
};
