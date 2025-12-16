import { createReducers } from '@lib/redux';
import { merge } from 'lodash';

import {
  loginFail,
  loginRequesting,
  loginSuccess,
  logout,
  performerloginFail,
  performerloginSuccess,
  resetLoginData,
  setUpdatePasswordSubmitting,
  studioLoginFail,
  studioLoginSuccess,
  updatePasswordFail,
  updatePasswordSuccess
} from './actions';

const initialState = {
  loggedIn: false,
  authUser: null,
  performerRegister: {
    data: null,
    success: false,
    submiting: false,
    error: null
  },
  userRegister: {
    data: null,
    success: false,
    submiting: false,
    error: null
  },
  userLogin: {
    requesting: false,
    success: false,
    data: null,
    error: null
  },
  updatePassword: {
    success: false,
    submiting: false,
    error: null
  }
};

const authReducers = [
  {
    on: loginRequesting,
    reducer(state: any) {
      return {
        ...state,
        userLogin: {
          ...state.userLogin,
          requesting: true
        }
      };
    }
  },
  {
    on: loginSuccess,
    reducer(state: any, data: any) {
      return {
        ...state,
        loggedIn: true,
        userLogin: {
          requesting: false,
          error: null,
          data: data.payload,
          success: true
        }
      };
    }
  },
  {
    on: loginFail,
    reducer(state: any, data: any) {
      return {
        ...state,
        loggedIn: false,
        userLogin: {
          requesting: false,
          error: data.payload,
          data: null,
          success: false
        }
      };
    }
  },
  {
    on: performerloginSuccess,
    reducer(state: any, data: any) {
      return {
        ...state,
        loggedIn: true,
        userLogin: {
          requesting: false,
          error: null,
          data: data.payload,
          success: true
        }
      };
    }
  },
  {
    on: performerloginFail,
    reducer(state: any, data: any) {
      return {
        ...state,
        loggedIn: false,
        userLogin: {
          requesting: false,
          error: data.payload,
          data: null,
          success: false
        }
      };
    }
  },
  {
    on: studioLoginSuccess,
    reducer(state: any, data: any) {
      return {
        ...state,
        loggedIn: true,
        userLogin: {
          requesting: false,
          error: null,
          data: data.payload,
          success: true
        }
      };
    }
  },
  {
    on: studioLoginFail,
    reducer(state: any, data: any) {
      return {
        ...state,
        loggedIn: false,
        userLogin: {
          requesting: false,
          error: data.payload,
          data: null,
          success: false
        }
      };
    }
  },
  {
    on: setUpdatePasswordSubmitting,
    reducer(state: any) {
      return {
        ...state,
        updatePassword: {
          ...state.updatePassword,
          submiting: true,
          success: false
        }
      };
    }
  },
  {
    on: updatePasswordSuccess,
    reducer(state: any) {
      return {
        ...state,
        updatePassword: {
          success: true,
          submiting: false,
          error: null
        }
      };
    }
  },
  {
    on: updatePasswordFail,
    reducer(state: any, data: any) {
      return {
        ...state,
        updatePassword: {
          success: false,
          submiting: false,
          error: data.payload
        }
      };
    }
  },
  {
    on: logout,
    reducer() {
      return {
        ...initialState
      };
    }
  },
  {
    on: resetLoginData,
    reducer(state) {
      return {
        ...state,
        userLogin: {
          requesting: false,
          success: false,
          data: null,
          error: null
        }
      };
    }
  }
];

export default merge({}, createReducers('auth', [authReducers], initialState));
