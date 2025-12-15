import Footer from '@components/common/layout/footer';
import Header from '@components/common/layout/header';
import {
  BackTop, Layout
} from 'antd';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

const Popup18plus = dynamic(() => import('@components/common/popup18plus'), { ssr: false });

type Props = {
  children: ReactNode
};

export function PublicLayout({
  children
}: Props) {
  return (
    <Layout id="publicLayout" className="container">
      <Header />
      <div className="content">
        {children}
      </div>
      <Footer />
      <Popup18plus />
      <BackTop
        className="backTop"
        target={() => document.querySelector('#publicLayout') as HTMLElement}
      />
    </Layout>
  );
}

export default PublicLayout;
