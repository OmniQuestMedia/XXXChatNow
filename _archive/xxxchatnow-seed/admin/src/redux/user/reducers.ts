import { createReducers } from '@lib/redux';
import { merge } from 'lodash';
import { IReducerFieldUpdate, IReduxAction, IUser } from 'src/interfaces';

import {
  setReducer,
  setUpdateStatus,
  setUpdating,
  updateCurrentUser,
  updateCurrentUserAvatar,
  updateUserSuccess
} from './actions';

const initialState = {
  current: {
    _id: null,
    avatar: '/user.png',
    name: '',
    email: ''
  },
  updating: false,
  updateSuccess: false
};

const userReducers = [
  {
    on: updateCurrentUser,
    reducer(state: any, data: any) {
      return {
        ...state,
        current: data.payload
      };
    }
  },
  {
    on: updateCurrentUserAvatar,
    reducer(state: any, data: any) {
      return {
        ...state,
        current: {
          ...state.current,
          avatar: data.payload
        }
      };
    }
  },
  {
    on: updateUserSuccess,
    reducer(state: any, data: IReduxAction<IUser>) {
      return {
        ...state,
        updatedUser: data.payload
      };
    }
  },
  {
    on: setUpdating,
    reducer(state: any, data: IReduxAction<boolean>) {
      return {
        ...state,
        updating: data.payload
      };
    }
  },
  {
    on: setUpdateStatus,
    reducer(state: any, data: IReduxAction<boolean>) {
      return {
        ...state,
        updateSuccess: data.payload
      };
    }
  },
  {
    on: setReducer,
    reducer(state: any, data: IReduxAction<IReducerFieldUpdate<any>>) {
      return {
        ...state,
        [data.payload.field]: data.payload.data
      };
    }
  }
];

export default merge({}, createReducers('user', [userReducers], initialState));
