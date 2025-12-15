import storeHolder from '@lib/storeHolder';
import {
  AnyAction,
  configureStore, Store
} from '@reduxjs/toolkit';
import { NextPageContext } from 'next';
import { createWrapper, HYDRATE } from 'next-redux-wrapper';
import createSagaMiddleware, { Task } from 'redux-saga';

import rootReducer from './rootReducer';
import rootSaga from './rootSaga';

export interface SagaStore extends Store {
  sagaTask: Task;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function makeStore(ctx: NextPageContext) {
  const reducer = (state: any, action: AnyAction) => {
    if (action.type === HYDRATE) {
      return {
        ...state, // use previous state
        ...action.payload // apply delta from hydration
      };
    }
    return rootReducer(state, action as never);
  };
  const sagaMiddleware = createSagaMiddleware();
  const store = configureStore({
    middleware: [sagaMiddleware],
    reducer
  }) as SagaStore;

  store.sagaTask = sagaMiddleware.run(rootSaga);
  storeHolder.setStore(store);

  return store;
}

export default makeStore;

export const wrapper = createWrapper<Store<any>>(makeStore, { debug: false });
