import { merge } from 'lodash';
import { combineReducers } from 'redux';

import auth from './auth/reducers';
import galleries from './galleries/reducers';
import message from './message/reducers';
import performer from './performer/reducers';
import photos from './photos/reducers';
import products from './products/reducers';
// load reducer here
import settings from './settings/reducers';
import streamMessage from './stream-chat/reducers';
import streaming from './streaming/reducers';
import studio from './studio/reducers';
import ui from './ui/reducers';
import user from './user/reducers';
import videos from './videos/reducers';

const reducers = merge(
  settings,
  ui,
  user,
  auth,
  performer,
  message,
  streamMessage,
  streaming,
  videos,
  photos,
  products,
  galleries,
  studio
);

export default combineReducers(reducers);
