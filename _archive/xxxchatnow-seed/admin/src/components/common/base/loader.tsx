import React from 'react';

import style from './loader.module.less';

interface IProps {
  // eslint-disable-next-line react/require-default-props
  spinning?: boolean,
  // eslint-disable-next-line react/require-default-props
  fullScreen?: boolean
}

function Loader({ spinning = false, fullScreen = false }: IProps) {
  let className = style.loader;
  if (spinning) className += ' hidden';
  if (fullScreen) className += ' fullScreen';
  return (
    <div
      className={className}
    >
      <div className="warpper">
        <div className="inner" />
        <div className="text">LOADING</div>
      </div>
    </div>
  );
}

export default Loader;
