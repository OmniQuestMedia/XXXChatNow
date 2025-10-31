import './index.module.less';

import Page from '@components/common/layout/page';
import { logout } from '@redux/auth/actions';
import Head from 'next/head';
import { PureComponent } from 'react';
import { connect } from 'react-redux';

interface IProps {
  logout: Function;
}

class Logout extends PureComponent<IProps> {
  static authenticate: boolean = false;

  componentDidMount() {
    this.props.logout();
  }

  render() {
    return (
      <Page>
        <Head>
          <title>Log out</title>
        </Head>
        <span>Logout...</span>
      </Page>
    );
  }
}

const mapStates = (state: any) => ({
  sLogout: state.auth.logout
});
export default connect(mapStates, { logout })(Logout);
