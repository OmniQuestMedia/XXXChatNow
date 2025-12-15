import { merge } from 'lodash';
import { combineReducers } from 'redux';

import auth from './auth/reducers';
import settings from './settings/reducers';
// load reducer here
import ui from './ui/reducers';
import user from './user/reducers';

const reducers = merge(ui, user, auth, settings);

export default combineReducers(reducers);
