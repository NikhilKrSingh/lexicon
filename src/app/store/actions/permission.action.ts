import { Action } from '@ngrx/store';
export const GET_PERMISSION = '[Permission] get permision';
export const GET_PERMISSION_FAILURE = '[Permission] successfully loaded permision';
export const GET_PERMISSION_SUCCESS = '[Permission] failed to load permision';

export class GetPermissionAction implements Action {
  readonly type = GET_PERMISSION;
  constructor(public payload: any) {
  }
}

export class GetPermissionFailedAction implements Action {
  readonly type = GET_PERMISSION_FAILURE;

  constructor() {
  }
}

export class GetPermissionSuccessAction implements Action {
  readonly type = GET_PERMISSION_SUCCESS;
  constructor(public payload: any) {
  }
}

export type PermissionActions = GetPermissionAction | GetPermissionFailedAction | GetPermissionSuccessAction;

