import '../style/index.less';

import BaseLayout from '@layouts/base-layout';
import { redirect } from '@lib/utils';
import { loginSuccess } from '@redux/auth/actions';
import { updateCurrentPerformer } from '@redux/performer/actions';
import { updateSettings } from '@redux/settings/actions';
import { wrapper } from '@redux/store';
import { updateLiveStreamSettings } from '@redux/streaming/actions';
import { updateCurrentStudio } from '@redux/studio/actions';
import { updateUIValue } from '@redux/ui/actions';
import { updateCurrentUser } from '@redux/user/actions';
import {
  authService,
  performerService,
  studioService,
  userService
} from '@services/index';
import { settingService } from '@services/setting.service';
import cookie from 'cookie';
import { pick } from 'lodash';
import { NextPageContext } from 'next';
import App from 'next/app';
import getConfig from 'next/config';
import Head from 'next/head';
import Router from 'next/router';
import nextCookie from 'next-cookies';
import { GoogleAnalytics } from 'nextjs-google-analytics';
import { Provider } from 'react-redux';
import { END } from 'redux-saga';
import { SETTING_KEYS } from 'src/constants';
import { FirebaseAppProvider } from 'src/firebase/app';
import {
  APIRequest, IResponse, PERFORMER_ROLE, USER_ROLE
} from 'src/services/api-request';
import { Socket } from 'src/socket';

declare global {
  interface Window {
    ReactSocketIO: any;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
  }
}

export const ROLE = {
  STUDIO: 'studio',
  PERFORMER: 'performer',
  USER: 'user'
};
function redirectLogin(ctx: NextPageContext, authenticate: boolean | string) {
  if (typeof window !== 'undefined') {
    authService.removeToken();
    authService.removeRemember();
    if (authenticate && authenticate === ROLE.STUDIO) {
      Router.push('/studio/login');
      return;
    }

    Router.push('/auth/login/user');
    return;
  }

  // fix for production build
  // ctx.res.clearCookie && ctx.res.clearCookie('token');
  const authCookie = cookie.serialize('token', '', {
    maxAge: -1
  });
  ctx.res?.writeHead(302, {
    'Set-Cookie': authCookie,
    Location:
      authenticate && authenticate === ROLE.STUDIO
        ? '/studio/login'
        : '/auth/login/user'
  });
  ctx.res?.end();
}

async function auth(ctx: NextPageContext, store, authenticate: boolean | string = false) {
  try {
    if (typeof window !== 'undefined' && !authenticate) return;
    // TODO - move to a service
    const { token, role } = nextCookie(ctx);
    if (token && role) {
      // dont need to get details but check role and process 403 in this case
      if (
        (role !== 'studio' && authenticate === 'studio')
        || (role !== 'performer' && authenticate === 'performer')
      ) {
        redirect('/403', ctx);
        return;
      }

      authService.setAuthHeaderToken(token);
      let resp: IResponse<any>;
      switch (role) {
        case PERFORMER_ROLE: {
          resp = await performerService.me({
            Authorization: token
          });
          store.dispatch(updateCurrentPerformer(resp.data));
          break;
        }
        case USER_ROLE: {
          resp = await userService.me({
            Authorization: token
          });
          store.dispatch(updateCurrentUser(resp.data));
          break;
        }
        case ROLE.STUDIO: {
          resp = await studioService.me({
            Authorization: token
          });
          store.dispatch(updateCurrentStudio(resp.data));
          break;
        }
        default: break;
      }

      // TODO - check permission
      store.dispatch(loginSuccess());
    } else if (authenticate) {
      redirectLogin(ctx, authenticate);
      return;
    }
  } catch (e) {
    if (authenticate) {
      redirectLogin(ctx, authenticate);
    }
  }
}

function updateSettingsStore(ctx: NextPageContext, settings) {
  try {
    const { store } = ctx;
    store.dispatch(updateSettings({
      tipSound: settings.tipSound,
      siteName: settings.siteName,
      logoUrl: settings.logoUrl,
      userUrl: settings.userUrl,
      defaultOfflineModelImage: settings.defaultOfflineModelImage,
      defaultPrivateCallImage: settings.defaultPrivateCallImage,
      defaultGroupChatImage: settings.defaultGroupChatImage,
      popup18Enabled: settings.popup18Enabled,
      popup18ContentId: settings.popup18ContentId,
      ga: settings.gaCode,
      conversionRate: settings.conversionRate,
      enableInteractiveThumbnails: settings.enableInteractiveThumbnails,
      performerReferralCommission: settings.performerReferralCommission,
      userReferralCommission: settings.userReferralCommission,
      referralEnabled: settings.referralEnabled
    }));
    store.dispatch(
      updateUIValue({
        placeholderAvatarUrl: settings.placeholderAvatarUrl,
        logo: settings.logoUrl,
        siteName: settings.siteName,
        menus: settings.menus,
        currencySymbol: settings.currencySymbol,
        singularTextModel: settings.singularTextModel,
        pluralTextModel: settings.pluralTextModel,
        placeholderLoginUrl: settings.placeholderLoginUrl
      })
    );
    store.dispatch(
      updateLiveStreamSettings(
        pick(settings, [
          SETTING_KEYS.VIEWER_URL,
          SETTING_KEYS.PUBLISHER_URL,
          SETTING_KEYS.SUBSCRIBER_URL,
          SETTING_KEYS.OPTION_FOR_BROADCAST,
          SETTING_KEYS.OPTION_FOR_PRIVATE,
          SETTING_KEYS.OPTION_FOR_GROUP,
          SETTING_KEYS.DEFAULT_OFFLINE_MODEL_IMAGE,
          SETTING_KEYS.DEFAULT_MODEL_PRIVATECALL_WITH_USER_IMAGE,
          SETTING_KEYS.DEFAULT_MODEL_IN_GROUP_CHAT_IMAGE,
          SETTING_KEYS.ANT_MEDIA_APPNAME
        ])
      )
    );
    // TODO - update others like meta data
  } catch (e) {
    // TODO - implement me
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

type IApplication = {
  Component: any;
  pageProps: any;
};

function Application({
  Component,
  ...rest
}: IApplication) {
  const { layout } = Component;
  const { store, props } = wrapper.useWrappedStore(rest);
  const { pageProps } = props;
  const state = store.getState();
  const ga = state.settings?.ga;

  return (
    <Provider store={store}>
      {ga && <GoogleAnalytics trackPageViews gaMeasurementId={ga} />}
      <Head>
        <meta
          name="viewport"
          content="initial-scale=1.0, width=device-width, maximum-scale=1"
        />
      </Head>
      <Socket>
        <FirebaseAppProvider>
          <BaseLayout layout={layout} maintenanceMode={pageProps.maintenanceMode}>
            <Component {...pageProps} />
          </BaseLayout>
        </FirebaseAppProvider>
      </Socket>
    </Provider>
  );
}

Application.getInitialProps = wrapper.getInitialAppProps((store) => async (context) => {
  const { Component, ctx } = context;
  const { serverRuntimeConfig } = getConfig();
  APIRequest.API_ENDPOINT = serverRuntimeConfig.API_ENDPOINT;

  // won't check auth for un-authenticated page such as login, register
  // use static field in the component
  const { authenticate } = Component as any;
  await auth(ctx, store, authenticate);

  let maintenanceMode = false;

  // server side to load settings, once time only
  if (typeof window === 'undefined') {
    const [_settings, menus] = await Promise.all([
      settingService.all(),
      settingService.menus()
    ]);
    // TODO encrypt, decypt header script, footer script or other info if needed
    const settings = _settings.data || {} as any;
    maintenanceMode = !!(settings as any).maintenanceMode;

    updateSettingsStore(ctx, {
      ...settings,
      menus: menus.data
    });
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
    pageProps: {
      ...pageProps,
      maintenanceMode
    }
  };
});

export default Application;
