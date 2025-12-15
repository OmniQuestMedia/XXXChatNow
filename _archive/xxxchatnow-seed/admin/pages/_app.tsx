import '../style/index.less';

import BaseLayout from '@layouts/base-layout';
import { redirectLogin } from '@lib/utils';
import { loginSuccess } from '@redux/auth/actions';
import { wrapper } from '@redux/store';
import { updateUIValue } from '@redux/ui/actions';
import { updateCurrentUser } from '@redux/user/actions';
import { APIRequest } from '@services/api-request';
import {
  authService, settingService,
  userService
} from '@services/index';
import { NextPageContext } from 'next';
import App from 'next/app';
import getConfig from 'next/config';
import Head from 'next/head';
import nextCookie from 'next-cookies';
import React from 'react';
import { Provider } from 'react-redux';
import { END } from 'redux-saga';

async function auth(ctx: NextPageContext, store) {
  try {
    const state = store.getState();
    if (state.auth && state.auth.loggedIn) {
      return;
    }
    // TODO - move to a service
    const { token } = nextCookie(ctx);
    if (!token) {
      // log out and redirect to login page
      // TODO - reset app state?
      redirectLogin(ctx);
      return;
    }
    authService.setAuthHeaderToken(token);
    const user = await userService.me({
      Authorization: token
    });
    // TODO - check permission
    if (user.data && !user.data.roles.includes('admin')) {
      redirectLogin(ctx);
      return;
    }
    store.dispatch(loginSuccess());
    store.dispatch(updateCurrentUser(user.data));
  } catch (e) {
    redirectLogin(ctx);
  }
}

async function updateSettingsStore(store, settings) {
  store.dispatch(
    updateUIValue({
      logo: settings.logoUrl,
      siteName: settings.siteName
    })
  );
}

function Application({
  Component,
  ...rest
}: any) {
  const { layout } = Component;
  const { store, props } = wrapper.useWrappedStore(rest);
  return (
    <Provider store={store}>
      <BaseLayout layout={layout}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        </Head>
        <Component {...props.pageProps} />
      </BaseLayout>
    </Provider>
  );
}

Application.getInitialProps = wrapper.getInitialAppProps((store) => async (context) => {
  const { Component, ctx } = context;
  // won't check auth for un-authenticated page such as login, register
  // use static field in the component
  const { authenticate } = Component as any;
  if (authenticate !== false) {
    await auth(ctx, store);
  }
  let settings = {};
  if (typeof window === 'undefined') {
    const { serverRuntimeConfig } = getConfig();
    APIRequest.API_ENDPOINT = serverRuntimeConfig.API_ENDPOINT;

    const resp = await settingService.public();
    // TODO encrypt, decypt header script, footer script or other info if needed
    settings = resp?.data;
    settings && await updateSettingsStore(store, settings);
  }

  // Wait for all page actions to dispatch
  const pageProps = {
    // https://nextjs.org/docs/advanced-features/custom-app#caveats
    ...(await App.getInitialProps(context)).pageProps
  };

  // Stop the saga if on server
  if (typeof window === 'undefined') {
    store.dispatch(END);
    await (store as any).sagaTask.toPromise();
  }

  return {
    pageProps
  };
});

export default Application;
