import { createReducers } from '@lib/redux';
import { merge } from 'lodash';
import { IReduxAction } from 'src/interfaces';

import {
  accessPrivateRequest, addPrivateRequest, hideWheel, showWheel, updateActivePerformer,
  updateLiveStreamSettings
} from './actions';

const initialState = {
  privateRequests: [],
  settings: {
    viewerURL: '',
    publisherURL: '',
    optionForBroadcast: 'hls',
    optionForPrivate: 'hls',
    secureOption: false
  },
  performer: null
};

const reducers = [
  {
    on: addPrivateRequest,
    reducer(state: any, action: IReduxAction<any>) {
      return {
        ...state,
        privateRequests: [...state.privateRequests, action.payload]
      };
    }
  },
  {
    on: accessPrivateRequest,
    reducer(state: any, action: IReduxAction<string>) {
      return {
        ...state,
        privateRequests: state.privateRequests.filter((p) => p.conversationId !== action.payload)
      };
    }
  },
  {
    on: updateLiveStreamSettings,
    reducer(state: any, action: IReduxAction<any>) {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };
    }
  },
  {
    on: updateActivePerformer,
    reducer(state: any, action: IReduxAction<any>) {
      return {
        ...state,
        performer: action.payload
      };
    }
  },
  {
    on: showWheel,
    reducer(state: any) {
      return {
        ...state,
        visibleWheel: true
      };
    }
  },
  {
    on: hideWheel,
    reducer(state: any) {
      return {
        ...state,
        visibleWheel: false
      };
    }
  }
];
export default merge({}, createReducers('streaming', [reducers], initialState));
