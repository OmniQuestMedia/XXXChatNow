import classnames from 'classnames';
import React, { ReactNode } from 'react';

import Loader from '../base/loader';

interface IProps {
  loading?: boolean;
  className?: string;
  inner?: boolean;
  children: ReactNode;
}

export default function Page({
  children,
  className = '',
  inner = false,
  loading = false
}: IProps) {
  const loadingStyle = {
    height: 'calc(100vh - 184px)',
    overflow: 'hidden'
  };
  return (
    <div
      className={classnames(className, {
        contentInner: inner
      })}
      style={loading ? loadingStyle : null}
    >
      {loading ? <Loader spinning /> : ''}
      {children}
    </div>
  );
}
