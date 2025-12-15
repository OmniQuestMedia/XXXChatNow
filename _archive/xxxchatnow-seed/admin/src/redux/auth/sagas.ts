import { createSagas } from '@lib/redux';
import { resetAppState } from '@redux/actions';
import { message } from 'antd';
import { flatten } from 'lodash';
import Router from 'next/router';
import { put } from 'redux-saga/effects';
import { ILogin } from 'src/interfaces';
import { authService, userService } from 'src/services';

import { updateCurrentUser } from '../user/actions';
import {
  login, loginFail, loginSuccess, logout, logoutSuccess
} from './actions';

const authSagas = [
  {
    on: login,
    * worker(data: any) {
      try {
        const payload = data.payload as ILogin;
        const resp = (yield authService.login(payload)).data;
        if (resp.isTwoFactorAuthenticationEnabled) {
          localStorage.setItem('verify2FA', JSON.stringify(resp));
          Router.push('/auth/verify-2fa');
          return;
        }
        // store token, update store and redirect to dashboard page
        yield authService.setToken(resp.token);

        const userResp = (yield userService.me()).data;
        if (!userResp.roles.includes('admin')) {
          message.error('You don\'t have permission to access this page');
          yield logout();
          return;
        }
        yield put(updateCurrentUser(userResp));
        yield put(loginSuccess());

        Router.push('/dashboard');
      } catch (e) {
        const error = yield Promise.resolve(e);
        yield put(loginFail(error));
      }
    }
  },

  {
    on: logout,
    * worker() {
      try {
        yield authService.removeToken();
        yield put(logoutSuccess());
        yield put(resetAppState());
        // TODO - should use a better way?
        Router.push('/auth/login');
      } catch (e) {
        // message.error('Something went wrong!');
      }
    }
  }
];

export default flatten(createSagas(authSagas));
