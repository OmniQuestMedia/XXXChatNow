import { createSelector } from 'reselect';

const userSelecter = (state) => state.user.current;
const performerSelecter = (state) => state.performer.current;
const studioSelecter = (state) => state.studio.current;
const authSelecter = (state) => state.auth;

export const currentUserSelector = createSelector(
  userSelecter,
  performerSelecter,
  studioSelecter,
  authSelecter,
  (user, performer, studio, auth) => {
    if (!auth.loggedIn) return null;

    if (studio?._id) {
      return { ...studio, role: 'studio' };
    }

    if (performer?._id) {
      return { ...performer, role: 'performer' };
    }

    if (user?._id) {
      return { ...user, role: 'user' };
    }

    return null;
  }
);
