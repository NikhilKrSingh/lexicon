import * as permissions from '../actions/permission.action';

export interface PermissionDataState {
  loaded: boolean;
  loading: boolean;
  datas: any;
}

const initialState: PermissionDataState = {
  loaded: false,
  loading: false,
  datas: {},
};

export function reducer(state = initialState, action: permissions.PermissionActions): PermissionDataState {
  switch (action.type) {

    case permissions.GET_PERMISSION: {
      const page = action.payload;
      return Object.assign({}, state, {
        loaded: true,
        loading: false,
        datas: page
      });
    }

    case permissions.GET_PERMISSION_SUCCESS: {
      const data = action.payload;
      return Object.assign({}, state, {
        loaded: true,
        loading: false,
        datas: data
      });
    }

    case permissions.GET_PERMISSION_FAILURE: {
      return Object.assign({}, state, {
        loaded: true,
        loading: false,
        datas: {},
      });
    }

    default:
      return state;
  }
}
/*
 Selectors for the state that will be later
 used in the games-list component
 */
export const getDatas = (state: PermissionDataState) => state.datas;
export const getLoadingState = (state: PermissionDataState) => state.loading;



