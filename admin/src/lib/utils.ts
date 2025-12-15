import { authService } from '@services/index';
import Router from 'next/router';

export function getResponseError(data: any) {
  if (!data) {
    return '';
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

export function validateUsername(text: string) {
  return /^[a-zA-Z0-9]+$/.test(text);
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

export function redirectLogin(ctx) {
  if (typeof window !== 'undefined') {
    authService.removeToken();
    Router.push('/auth/login');
    return;
  }

  ctx.res.clearCookie && ctx.res.clearCookie('token');
  ctx.res.clearCookie && ctx.res.clearCookie('role');
  ctx.res.writeHead && ctx.res.writeHead(302, { Location: '/auth/login' });
  ctx.res.end && ctx.res.end();
}

export function getUsernameAndName(user) {
  if (!user) return 'N/A';
  const displayName = user.name || [user.firstName, user.lastName].filter((n) => !!n).join(' ') || 'no_name';
  const username = user.username || 'no_username';
  return `${username} / ${displayName}`;
}
