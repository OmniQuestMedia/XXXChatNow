import { createAction } from '@lib/redux';

export const addPrivateRequest = createAction('ADD_PRIVATE_REQUEST');
export const accessPrivateRequest = createAction('ACCESS_PRIVATE_REQUSET');
export const updateLiveStreamSettings = createAction('UPDATE_LIVE_STREAM_SETTINGS');

export const updateActivePerformer = createAction('UPDATE_ACTIVE_PERFORMER');

export const showWheel = createAction('SHOW_WHEEL');
export const hideWheel = createAction('HIDE_WHEEL');
