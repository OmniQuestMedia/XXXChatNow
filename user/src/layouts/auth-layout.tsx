import './auth-layout.module.less';

import Footer from '@components/common/layout/footer';
import Header from '@components/common/layout/header';
import { currentUserSelector } from '@redux/selectors';
import { BackTop, Layout } from 'antd';
import { useRouter } from 'next/router';
import React, { ReactNode, useEffect } from 'react';
import { connect, ConnectedProps } from 'react-redux';

interface DefaultProps {
  children: ReactNode;
  loggedIn: boolean;
}

const mapStateToProps = (state: any) => ({
  loggedIn: state.auth.loggedIn,
  currentUser: currentUserSelector(state)
});
const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

function AuthLayout({
  children,
  loggedIn,
  currentUser
}: DefaultProps & PropsFromRedux) {
  const router = useRouter();

  useEffect(() => {
    if (currentUser?.role === 'studio' && loggedIn) {
      router.push('/studio/account-settings');
      return;
    }

    if (loggedIn) router.push('/');
  }, [loggedIn]);

  return (
    <Layout className="container" id="authLayout">
      <Header />
      <div className="content">
        {children}
      </div>
      <Footer />
      <BackTop className="backTop" />
    </Layout>
  );
}

export default connector(AuthLayout);
