import Script from 'next/script';
import { memo, useEffect } from 'react';

import style from './gtranlate.module.less';

const GTranslate = memo(() => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.gtranslate.net/widgets/latest/float.js';
    document.body.append(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  return <div className="gtranslate_wrapper" />;
});
function GTranslates() {
  return (
    <div className={style.gtranslate}>
      <Script>
        {'window.gtranslateSettings = {"default_language":"en","native_language_names":true,"detect_browser_language":true,"languages":["en","ar","zh-TW","zh-CN","nl","fr","de","hi","id","it","ja","ko","no","pl","pt","ro","ru","sr","es","sv","th","tr","uk"],"wrapper_selector":".gtranslate_wrapper","switcher_horizontal_position":"inline","float_switcher_open_direction":"bottom","flag_style":"3d"}'}
      </Script>
      <div className="gtranslate">
        <GTranslate />
      </div>
    </div>
  );
}
export default GTranslates;
