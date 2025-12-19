import { all, spawn } from 'redux-saga/effects';

import authSagas from './auth/sagas';
import galleriesSagas from './galleries/sagas';
import messageSagas from './message/sagas';
import performerSagas from './performer/sagas';
import photosSagas from './photos/sagas';
import productSagas from './products/sagas';
import settingSagas from './settings/sagas';
import streamMessageSagas from './stream-chat/sagas';
import studioSagas from './studio/sagas';
import userSagas from './user/sagas';
import videosSagas from './videos/sagas';

function* rootSaga() {
  yield all(
    [
      ...authSagas,
      ...userSagas,
      ...performerSagas,
      ...messageSagas,
      ...settingSagas,
      ...streamMessageSagas,
      ...videosSagas,
      ...photosSagas,
      ...productSagas,
      ...galleriesSagas,
      ...studioSagas
    ].map(spawn)
  );
}

export default rootSaga;
