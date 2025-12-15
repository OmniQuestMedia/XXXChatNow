import React from 'react';

import Loader from '../base/loader';

type IPageProps = {
  loading?: boolean;
  className?: string;
  inner?: boolean;
  children: any;
}

export default function Page({
  className = '',
  children,
  loading = false,
  inner = true
}: IPageProps) {
  const loadingStyle = {
    height: 'calc(100vh - 184px)',
    overflow: 'hidden'
  };
  const cName = `${className} ${inner ? 'contentInner' : ''}`;
  return (
    <div
      className={cName}
      style={loading ? loadingStyle : null}
    >
      {loading ? <Loader spinning /> : ''}
      {children}
    </div>
  );
}
