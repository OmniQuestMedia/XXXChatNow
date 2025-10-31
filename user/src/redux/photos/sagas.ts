import { createSagas } from '@lib/redux';
import { flatten } from 'lodash';
import { put } from 'redux-saga/effects';
import {
  IDataResponse, IPhoto,
  IReduxAction, IResponse
} from 'src/interfaces';
import { getResponseError } from 'src/lib';
import { photoService } from 'src/services';

import {
  getPerformerPhotos,
  getPerformerPhotosFail,
  getPerformerPhotosSuccess,
  gettingPerformerPhotos
} from './actions';

const photosSagas = [
  {
    on: getPerformerPhotos,
    * worker(action: IReduxAction<any>) {
      try {
        yield put(gettingPerformerPhotos());
        const resp: IResponse<IDataResponse<IPhoto>> = yield photoService.search(action.payload);
        yield put(getPerformerPhotosSuccess({ data: resp.data.data, total: resp.data.total }));
      } catch (error) {
        const err = getResponseError(error);
        yield put(getPerformerPhotosFail(err));
      }
    }
  }
];

export default flatten([createSagas(photosSagas)]);
