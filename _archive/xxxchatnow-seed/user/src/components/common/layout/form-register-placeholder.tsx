import React from 'react';

type P = {
  placeholderLoginUrl?: string;
}

export function FormRegisterPlaceHolder({ placeholderLoginUrl = '/background-login.jpg' }: P) {
  return (
    <div
      className="form-register-placeholder"
      style={
      placeholderLoginUrl
        ? { backgroundImage: `url(${placeholderLoginUrl})` }
        : {}
    }
    />
  );
}
