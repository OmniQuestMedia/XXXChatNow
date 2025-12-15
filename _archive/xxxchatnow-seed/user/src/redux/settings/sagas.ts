import { createSagas } from '@lib/redux';
import { flatten } from 'lodash';
import { put, select } from 'redux-saga/effects';
import { IResponse } from 'src/interfaces';
import { utilsService } from 'src/services';

import { getCountries, requestCurrency, updateSettings } from './actions';

const settingSagas = [
  {
    on: getCountries,
    * worker() {
      try {
        const countries = yield select((state) => state.settings.countries);
        if (countries && countries.length) return;
        const resp: IResponse<any> = yield utilsService.countriesList();
        yield put(updateSettings({ countries: resp.data }));
      } catch (e) {
        // eslint-disable-next-line no-console
      }
    }
  },
  {
    on: requestCurrency,
    * worker() {
      try {
        const resp = yield utilsService.currencyRate();
        yield put(updateSettings({
          currency: resp.data
        }));
        // eslint-disable-next-line no-empty
      } catch {}
    }
  }
];

export default flatten([createSagas(settingSagas)]);
