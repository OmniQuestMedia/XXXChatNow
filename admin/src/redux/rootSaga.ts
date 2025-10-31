import { all, spawn } from 'redux-saga/effects';

import authSagas from './auth/sagas';
import userSagas from './user/sagas';

function* rootSaga() {
  yield all([
    ...authSagas,
    ...userSagas
  ].map(spawn));
}

export default rootSaga;
