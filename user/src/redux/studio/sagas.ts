import { createSagas } from '@lib/redux';
import {
  earningService,
  payoutRequestService,
  studioService
} from '@services/index';
import { flatten, omit } from 'lodash';
import { all, put, select } from 'redux-saga/effects';
import {
  IPerformerBitpay,
  IPerformerDirectDeposit,
  IPerformerPaxum,
  IPerformerPaymentInfoUpdate,
  IReduxAction,
  IResponse,
  IStudio
} from 'src/interfaces';

import {
  getMembers,
  getMembersFail,
  getMembersSearching,
  getMembersSuccess,
  getPerformerRequest,
  getPerformerRequestFail,
  getPerformerRequestSuccess,
  getStudioEarning,
  getStudioEarningFail,
  getStudioEarningSuccess,
  getStudioPayoutRequest,
  getStudioPayoutRequestFail,
  getStudioPayoutRequestSuccess,
  getStudioStats,
  getStudioStatsFail,
  getStudioStatsSuccess,
  setGettingPerformerRequest,
  setGettingStudioEarning,
  setGettingStudioPayoutRequest,
  setUpdatingStudio,
  updateStudio,
  updateStudioBitpay,
  updateStudioDirectDeposit,
  updateStudioFail,
  updateStudioPaxum,
  updateStudioPaymentInfo,
  updateStudioSuccess
} from './actions';

const studioSagas = [
  {
    on: updateStudio,
    * worker(data: IReduxAction<any>) {
      try {
        yield put(setUpdatingStudio());
        const updated: IResponse<IStudio> = yield studioService.update(
          data.payload
        );
        yield put(updateStudioSuccess(updated.data));
      } catch (e) {
        const err = yield Promise.resolve(e);
        yield put(updateStudioFail(err));
      }
    }
  },

  {
    on: updateStudioPaymentInfo,
    * worker(action: IReduxAction<IPerformerPaymentInfoUpdate>) {
      try {
        yield put(setUpdatingStudio());
        const resp: IResponse<IStudio> = yield studioService.updatePaymentInfo(
          action.payload
        );
        yield put(updateStudioSuccess(resp.data));
      } catch (e) {
        const err = yield Promise.resolve(e);
        yield put(updateStudioFail(err));
      }
    }
  },
  {
    on: updateStudioDirectDeposit,
    * worker(action: IReduxAction<IPerformerDirectDeposit>) {
      try {
        yield put(setUpdatingStudio());
        const resp: IResponse<IStudio> = yield studioService.updateDirectDepost(
          action.payload
        );
        yield put(updateStudioSuccess(resp.data));
      } catch (e) {
        const err = yield Promise.resolve(e);
        yield put(updateStudioFail(err));
      }
    }
  },
  {
    on: updateStudioBitpay,
    * worker(action: IReduxAction<IPerformerBitpay>) {
      try {
        yield put(setUpdatingStudio());
        const resp: IResponse<IStudio> = yield studioService.updateBitpay(
          action.payload
        );
        yield put(updateStudioSuccess(resp.data));
      } catch (e) {
        const err = yield Promise.resolve(e);
        yield put(updateStudioFail(err));
      }
    }
  },
  {
    on: updateStudioPaxum,
    * worker(action: IReduxAction<IPerformerPaxum>) {
      try {
        yield put(setUpdatingStudio());
        const resp: IResponse<IStudio> = yield studioService.updatePaxum(
          action.payload
        );
        yield put(updateStudioSuccess(resp.data));
      } catch (e) {
        const err = yield Promise.resolve(e);
        yield put(updateStudioFail(err));
      }
    }
  },
  {
    on: getMembers,
    * worker(action: IReduxAction<any>) {
      try {
        yield put(getMembersSearching());
        const resp = yield studioService.getMembers(action.payload);
        yield put(getMembersSuccess(resp.data));
      } catch (e) {
        const err = yield Promise.resolve(e);
        yield put(getMembersFail(err));
      }
    }
  },
  {
    on: getPerformerRequest,
    * worker(action: IReduxAction<any>) {
      try {
        yield put(setGettingPerformerRequest());
        const resp = yield studioService.getPerformerRequest(action.payload);
        yield put(getPerformerRequestSuccess(resp.data));
      } catch (e) {
        const err = yield Promise.resolve(e);
        yield put(getPerformerRequestFail(err));
      }
    }
  },
  {
    on: getStudioEarning,
    * worker(action: IReduxAction<any>) {
      try {
        yield put(setGettingStudioEarning());
        let difDateQuery = false;
        const earning = yield select((state) => state.performer.earning);
        const { fromDate, toDate } = action.payload;
        const query = omit(action.payload, ['fromDate', 'toDate']);
        if (fromDate && toDate) {
          query.fromDate = fromDate;
          query.toDate = toDate;
        }

        if (earning.toDate !== toDate || earning.fromDate !== fromDate) difDateQuery = true;

        const [resp, stats] = yield all([
          earningService.search(query, 'studio'),
          earning.stats && !difDateQuery
            ? earning.stats
            : earningService.stats(query, 'studio')
        ]);
        yield put(
          getStudioEarningSuccess({ ...query, stats, data: resp.data })
        );
      } catch (e) {
        const err = yield Promise.resolve(e);
        yield put(getStudioEarningFail(err));
      }
    }
  },
  {
    on: getStudioStats,
    * worker() {
      try {
        const resp = yield studioService.stats();
        yield put(getStudioStatsSuccess(resp.data));
      } catch (e) {
        const err = yield Promise.resolve(e);
        yield put(getStudioStatsFail(err));
      }
    }
  },
  {
    on: getStudioPayoutRequest,
    * worker(action: IReduxAction<any>) {
      try {
        yield put(setGettingStudioPayoutRequest());
        const resp = yield payoutRequestService.studioSearch(action.payload);
        yield put(getStudioPayoutRequestSuccess(resp.data));
      } catch (e) {
        const err = yield Promise.resolve(e);
        yield put(getStudioPayoutRequestFail(err));
      }
    }
  }
];

export default flatten([createSagas(studioSagas)]);
