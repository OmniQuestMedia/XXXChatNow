import { SORT } from '@services/api-request';
import { authService } from '@services/auth.service';
import classnames from 'classnames';
import moment from 'moment';
import Router from 'next/router';
import {
  IPerformer, ISchedule, IStudio,
  IUser
} from 'src/interfaces';

export function getResponseError(data: any) {
  if (!data) {
    return 'Bad request!';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data.message)) {
    const item = data.message[0];
    if (!item.constraints) {
      return data.error || 'Bad request!';
    }
    return Object.values(item.constraints)[0];
  }

  // TODO - parse for langauge or others
  return typeof data.message === 'string' ? data.message : 'Bad request!';
}

export function isMobile(): boolean {
  if (
    navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i)
  ) {
    return true;
  }

  return false;
}

// eslint-disable-next-line consistent-return
export function getUrlParameter(sParam) {
  const sPageURL = decodeURIComponent(window.location.search.substring(1));
  const sURLVariables = sPageURL.split('&');
  let sParameterName;
  let i;

  for (i = 0; i < sURLVariables.length; i += 1) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : sParameterName[1];
    }
  }
}

export const DAY_OF_WEEK = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday'
};

export function getDefaultSchedule() {
  const defaultVal = { start: null, end: null, closed: true };
  return {
    mon: { ...defaultVal },
    tue: { ...defaultVal },
    wed: { ...defaultVal },
    thu: { ...defaultVal },
    fri: { ...defaultVal },
    sat: { ...defaultVal },
    sun: { ...defaultVal }
  };
}

export function getNextShow(schedule: ISchedule): string {
  let weekDay = parseInt(moment().format('e'), 10);
  let i = 0;
  let nextShow: string;
  const performerShows = Object.keys(schedule).filter(
    (key) => !schedule[key].closed
  );
  do {
    const date = moment().day(weekDay).format('ddd').toLowerCase();
    if (performerShows.indexOf(date) > -1) {
      nextShow = date;
    }
    weekDay += 1;
    i += 1;
  } while (i < 7 && !nextShow);

  if (nextShow) {
    return `${schedule[nextShow].start} ${moment()
      .day(weekDay - 1)
      .format('DD/MM/YYYY')}`;
  }
  return '';
}

export function getSearchData(pagination, filters, sorter, state) {
  let { sort, sortBy, filter } = state;
  const { limit } = state;
  if (filters) {
    Object.keys(filters).forEach((key) => {
      if (filters[key] && filters[key].length) {
        // eslint-disable-next-line prefer-destructuring
        filter[key] = filters[key][0];
      }

      if (!filters[key]) {
        filter[key] = '';
      }
    });
  } else {
    filter = {};
  }

  if (sorter) {
    if (sorter.order) {
      const { field, order } = sorter;
      sort = SORT[order];
      sortBy = field;
    } else {
      sortBy = 'createdAt';
      sort = 'desc';
    }
  }

  return {
    ...state,
    ...filter,
    sort,
    sortBy,
    offset: (pagination.current - 1) * limit
  };
}

export function getBase64(originFileObj, file, status = 'uploading') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    if (originFileObj) {
      reader.readAsDataURL(originFileObj);
      reader.onload = () => resolve({
        ...originFileObj,
        status,
        name: originFileObj.name,
        url: reader.result,
        originFileObj
      });
      reader.onerror = (error) => reject(error);
    } else {
      resolve(file);
    }
  });
}

export function convertConnectionData(data) {
  const arr = data.split('%/%');
  const serverData = arr[1] && JSON.parse(arr[1]);
  const clientData = arr[0] && JSON.parse(arr[0]);
  return {
    serverData,
    clientData
  };
}

export function checkUserLogin(isLoggedIn: boolean, user: IUser | IPerformer | IStudio) {
  if (!isLoggedIn) return false;
  if (!user && !user._id) return false;

  return true;
}

export function getCurrentUser(user: IUser, performer: IPerformer) {
  if (user && user._id) return user;
  if (performer && performer._id) return performer;

  return null;
}

export function isPhysicalProduct(item) {
  if (item && item.type === 'physical') return true;
  return false;
}

export function chatBoxMessageClassName(req) {
  const {
    isMine,
    startsSequence,
    endsSequence,
    data: { type }
  } = req;
  return classnames(
    'message',
    { mine: isMine && type !== 'tip' },
    { tip: type === 'tip' },
    { start: !!startsSequence },
    { end: !!endsSequence }
  );
}

function convertFeetToCm(feet, inch) {
  const [f] = feet.split('.');
  const [i] = inch.split('.');
  return (parseInt(f, 10) * 12 + parseInt(i, 10)) * 2.54;
}

export function formatDataWeight(min = 99, max = 319) {
  let i = min;
  const result = [];
  do {
    result[i] = (i * 0.45).toFixed(2);
    i += 1;
  } while (i < max);
  return result.map((v, index) => ({
    label: `${index}  lbs (${v}kg)`,
    value: `${index} lbs`
  }));
}
export function formatDataHeight(min = 4, max = 7) {
  const result = [];
  for (let feet = min; feet < max; feet += 1) {
    for (let inch = 0; inch <= 11; inch += 1) {
      const a = convertFeetToCm(
        feet.toFixed(1).toString(),
        inch.toFixed(1).toString()
      );
      result.push(`${feet}'${inch}" (${a.toFixed(2)} cm)`);
    }
  }
  return result.map((f) => ({ label: `${f}`, value: `${f}` }));
}

export function formatPrice(price: number, fractionDigits = 2) {
  if (price) {
    return price.toFixed(fractionDigits);
  }

  return '';
}

export function redirect404(ctx = null) {
  if (typeof window !== 'undefined') {
    window.location.href = '/404';
    return;
  }

  if (!ctx) return;

  ctx.res.writeHead && ctx.res.writeHead(302, { Location: '/404' });
  ctx.res.end && ctx.res.end();
}

export function redirect(location: string, ctx = null) {
  if (typeof window !== 'undefined') {
    window.location.href = location;
  }

  ctx.res.writeHead && ctx.res.writeHead(302, { Location: location });
  ctx.res.end && ctx.res.end();
}

export function redirectLogin(ctx) {
  if (typeof window !== 'undefined') {
    authService.removeToken();
    Router.push('/auth/login/user');
    return;
  }

  ctx.res.clearCookie && ctx.res.clearCookie('token');
  ctx.res.clearCookie && ctx.res.clearCookie('role');
  ctx.res.writeHead && ctx.res.writeHead(302, { Location: '/auth/login/user' });
  ctx.res.end && ctx.res.end();
}

export function roundBalance(balance: number) {
  if (balance < 10000) return Math.round(balance);
  return '9999+';
}

export function downloadCsv(url: string, filename: string) {
  const promise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      const blob = new Blob([xhr.response], { type: 'text/csv' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a') as HTMLAnchorElement;
      a.href = href;
      a.setAttribute('download', filename);
      a.click();
      URL.revokeObjectURL(href);
      resolve({ success: true });
    };

    xhr.onerror = (err) => {
      reject(err);
    };

    xhr.open('GET', url);
    xhr.setRequestHeader('Authorization', authService.getToken());
    xhr.responseType = 'blob';
    xhr.send();
  });
  return promise;
}
