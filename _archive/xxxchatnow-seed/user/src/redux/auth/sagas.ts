import { createSagas } from '@lib/redux';
import { message } from 'antd';
import { flatten } from 'lodash';
import Router from 'next/router';
import { put } from 'redux-saga/effects';
import {
  ILogin,
  IReduxAction,
  IResponse,
  IUpdatePasswordFormData,
  IUser
} from 'src/interfaces';
import {
  authService,
  performerService,
  studioService,
  userService
} from 'src/services';
import {
  PERFORMER_ROLE,
  STUDIO_ROLE,
  USER_ROLE
} from 'src/services/api-request';

import { updateCurrentPerformer } from '../performer/actions';
import { updateCurrentStudio } from '../studio/actions';
import { updateCurrentUser } from '../user/actions';
import {
  login,
  loginFail,
  loginRequesting,
  loginSuccess,
  logout,
  performerlogin,
  performerloginFail,
  performerloginSuccess,
  setUpdatePasswordSubmitting,
  studioLogin,
  studioLoginFail,
  studioLoginSuccess,
  updatePassword,
  updatePasswordFail,
  updatePasswordSuccess
} from './actions';

const authSagas = [
  {
    on: login,
    * worker(data: any) {
      try {
        yield put(loginRequesting());
        const payload = data.payload as ILogin;
        const resp = (yield authService.login(payload)).data;
        // store token, update store and redirect to dashboard page
        yield authService.setAuthHeader(resp.token, USER_ROLE);

        const userResp = (yield userService.me()).data;
        // Set dark mode preference for the user
        const userWithDarkMode = { ...userResp, isDark: true };
        yield put(updateCurrentUser(userWithDarkMode));
        // Set dark mode in localStorage and add class to body
        localStorage.setItem('darkmode', 'true');
        document.body.classList.add('darkmode');
        yield put(loginSuccess());

        Router.push('/');
      } catch (e) {
        const error = yield Promise.resolve(e);
        yield put(loginFail(error));
      }
    }
  },
  {
    on: performerlogin,
    * worker(data: any) {
      try {
        yield put(loginRequesting());
        const payload = data.payload as ILogin;
        const resp = (yield authService.performerLogin(payload)).data;
        // store token, update store and redirect to dashboard page
        yield authService.setAuthHeader(resp.token, PERFORMER_ROLE);
        const performerResp = (yield performerService.me()).data;
        // Set dark mode preference for the performer
        const performerWithDarkMode = { ...performerResp, isDark: true };
        yield put(updateCurrentPerformer(performerWithDarkMode));
        // Set dark mode in localStorage and add class to body
        localStorage.setItem('darkmode', 'true');
        document.body.classList.add('darkmode');
        yield put(performerloginSuccess());
        if (performerResp.verified) {
          Router.push(
            {
              pathname: '/live'
            },
            `/live/lovense/${performerResp.username}`
          );
        } else {
          Router.push('/');
        }
      } catch (e) {
        const error = yield Promise.resolve(e);
        yield put(performerloginFail(error));
      }
    }
  },

  {
    on: studioLogin,
    * worker(data: IReduxAction<ILogin>) {
      try {
        yield put(loginRequesting());
        const payload = data.payload as ILogin;
        const resp = (yield authService.studioLogin(payload)).data;
        // store token, update store and redirect to dashboard page
        yield authService.setAuthHeader(resp.token, STUDIO_ROLE);
        const studioResp = (yield studioService.me()).data;
        // Set dark mode preference for the studio
        const studioWithDarkMode = { ...studioResp, isDark: true };
        yield put(updateCurrentStudio(studioWithDarkMode));
        yield put(updateCurrentUser(studioWithDarkMode));
        // Set dark mode in localStorage and add class to body
        localStorage.setItem('darkmode', 'true');
        document.body.classList.add('darkmode');
        yield put(studioLoginSuccess());
        // Router.push('/studio/account-settings');
      } catch (e) {
        const error = yield Promise.resolve(e);
        yield put(studioLoginFail(error));
      }
    }
  },
  {
    on: logout,
    * worker() {
      try {
        yield authService.removeToken();
        yield authService.removeRemember();
        Router.push('/');
        message.success('Log out!');
      } catch (e) {
        message.error('Something went wrong!');
      }
    }
  },
  {
    on: updatePassword,
    * worker(action: IReduxAction<IUpdatePasswordFormData>) {
      try {
        yield put(setUpdatePasswordSubmitting());
        const resp: IResponse<IUser> = yield authService.updatePassword(
          action.payload
        );
        yield put(updatePasswordSuccess(resp.data));
      } catch (e) {
        const error = yield Promise.resolve(e);
        yield put(updatePasswordFail(error));
      }
    }
  }
];

export default flatten([createSagas(authSagas)]);
