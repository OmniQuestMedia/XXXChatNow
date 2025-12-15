import Footer from '@components/common/layout/footer';
import Header from '@components/common/layout/header';
import {
  BackTop, Layout
} from 'antd';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import { ReactNode } from 'react';

import style from './stream-layout.module.less';

const Popup18plus = dynamic(() => import('@components/common/popup18plus'), { ssr: false });

type Props = {
  children: ReactNode
};

export function StreamLayout({
  children
}: Props) {
  return (
    <Layout id="publicLayout" className="container">
      <link
        href="https://unpkg.com/video.js@7.8.3/dist/video-js.css"
        rel="stylesheet"
      />
      <Script src="/lib/adapter-latest.js" />
      <Script src="/lib/webrtc_adaptor.js" />
      <Script src="https://unpkg.com/video.js@7.8.3/dist/video.js" />
      <Script src="https://unpkg.com/@videojs/http-streaming@1.13.3/dist/videojs-http-streaming.js" />
      <Header />
      <div className={style['stream-page']}>
        {children}
      </div>
      <div className="desktop-show">
        <Footer />
      </div>
      <Popup18plus />
      <BackTop
        className="backTop"
        target={() => document.querySelector('#publicLayout') as HTMLElement}
      />
    </Layout>
  );
}

export default StreamLayout;
