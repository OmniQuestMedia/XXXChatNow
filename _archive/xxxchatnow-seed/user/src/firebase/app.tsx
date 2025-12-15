import { settingService } from '@services/setting.service';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import {
  createContext, ReactNode, useContext, useEffect, useMemo, useState
} from 'react';

interface Props {
  children: ReactNode;
}

interface Values {
  app: FirebaseApp;
  vapidKey: string;
}

const FirebaseAppContext = createContext<Values>({
  app: null,
  vapidKey: null
});

export function FirebaseAppProvider({ children }: Props) {
  const [app, setApp] = useState<FirebaseApp>();
  const [vapidKey, setVapidKey] = useState();

  useEffect(() => {
    const init = async () => {
      const {
        data: {
          FIREBASE_MESSAGING_SENDER_ID,
          FIREBASE_API_KEY,
          FIREBASE_AUTH_DOMAIN,
          FIREBASE_PROJECT_ID,
          FIREBASE_STORAGE_BUCKET,
          FIREBASE_APPID,
          FIREBASE_MEASUREMENT_ID,
          FIREBASE_WEB_PUSH_KEYPAIR
        }
      } = await settingService.valueByKeys(['FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN', 'FIREBASE_PROJECT_ID', 'FIREBASE_STORAGE_BUCKET', 'FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_APPID', 'FIREBASE_MEASUREMENT_ID', 'FIREBASE_WEB_PUSH_KEYPAIR', 'FIREBASE_WEB_PUSH_KEYPAIR']);
      // const firebaseConfig = {
      //   apiKey: FIREBASE_API_KEY,
      //   authDomain: FIREBASE_AUTH_DOMAIN,
      //   projectId: FIREBASE_PROJECT_ID,
      //   storageBucket: FIREBASE_STORAGE_BUCKET,
      //   messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
      //   appId: FIREBASE_APPID,
      //   measurementId: FIREBASE_MEASUREMENT_ID
      // };
      const firebaseConfig = {
        apiKey: FIREBASE_API_KEY, // 'AIzaSyAsunqGCiurOM_dqEElKeHvxIw3KejhQ90',
        authDomain: FIREBASE_AUTH_DOMAIN, // 'cathysol-portal.firebaseapp.com',
        projectId: FIREBASE_PROJECT_ID, // 'cathysol-portal',
        storageBucket: FIREBASE_STORAGE_BUCKET, // 'cathysol-portal.firebasestorage.app',
        messagingSenderId: FIREBASE_MESSAGING_SENDER_ID, // '638788556336',
        appId: FIREBASE_APPID, // '1:638788556336:web:115fdf2e49c920e0c43ff5',
        measurementId: FIREBASE_MEASUREMENT_ID// 'G-00ZV111E04'
      };
      setApp(initializeApp(firebaseConfig));
      if (FIREBASE_WEB_PUSH_KEYPAIR) {
        setVapidKey(FIREBASE_WEB_PUSH_KEYPAIR);
      }
      if ('serviceWorker' in navigator) {
        const firebaseConfigParams = new URLSearchParams(firebaseConfig).toString();

        navigator.serviceWorker
          .register(`/firebase-messaging-sw.js?${firebaseConfigParams}`);
      }
    };
    init();
  }, []);

  const value = useMemo(() => ({ app, vapidKey }), [app, vapidKey]);

  return (
    <FirebaseAppContext.Provider value={value}>
      {children}
    </FirebaseAppContext.Provider>
  );
}

export const useFCM = () => {
  const { app, vapidKey } = useContext(FirebaseAppContext);
  const [permission, setPermission] = useState('');
  const [token, setToken] = useState('');

  const requestToken = (): Promise<string> => {
    if (typeof navigator.serviceWorker === 'undefined') return Promise.reject(new Error('Browser does not support Notification.'));
    if (permission === 'denied') return Promise.reject(new Error('Please enable Notification.'));

    const messaging = getMessaging(app);
    return getToken(messaging, { vapidKey }).then((currentToken) => {
      if (currentToken) {
        // console.log(currentToken);
        setToken(currentToken);
        return Promise.resolve(currentToken);
      }

      return Promise.reject(new Error('No registration token available. Request permission to generate one.'));
      // eslint-disable-next-line arrow-body-style
    }).catch(() => {
      // console.log('An error occurred while retrieving token. ', err);
      return Promise.reject(new Error('An error occurred while retrieving token.'));
    });
  };

  const requestPermission = () => {
    Notification.requestPermission().then(setPermission);
  };

  useEffect(() => {
    setTimeout(() => {
      requestPermission();
    }, 1000);
  }, []);

  useEffect(() => {
    if (app) requestToken();
  }, [permission, app]);

  return {
    requestToken, permission, setPermission, token
  };
};
