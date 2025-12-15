import { createReducers } from '@lib/redux';
import { merge } from 'lodash';

import { updateSettings } from './actions';

// TODO -
const initialState = {
  countries: [],
  ccbillEnabled: false,
  verotelEnabled: false,
  currency: {
    from: 'USD',
    to: 'USD',
    symbol: '$',
    rate: 1
  }
};

const settingReducers = [
  {
    on: updateSettings,
    reducer(state: any, data: any) {
      return {
        ...state,
        ...data.payload
      };
    }
  }
];

export default merge({}, createReducers('settings', [settingReducers], initialState));
