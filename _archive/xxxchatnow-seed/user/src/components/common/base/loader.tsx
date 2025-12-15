import classNames from 'classnames';
import React from 'react';

import style from './loader.module.less';

function Loader({ spinning = false, fullScreen = false }: any) {
  return (
    <div
      className={classNames(style.loader, {
        [style.hidden]: !spinning,
        [style.fullScreen]: fullScreen
      })}
    >
      <div className={style.warpper}>
        {/* <div className={style['inner']} /> */}
        <div className={style.text}><img src="/loading-ico.gif" width="65px" alt="" /></div>
      </div>
    </div>
  );
}

export default Loader;
