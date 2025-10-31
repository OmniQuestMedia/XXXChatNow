import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { getResponseError } from '@lib/utils';
import { message } from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { FormTokenPackage } from 'src/components/token-package/form';
import { ITokenPackageCreate } from 'src/interfaces';
import { tokenPackageService } from 'src/services';

interface IProps {
  settings: any;
}
interface IStates {
  submitting;
}

class TokenPackageCreatePage extends PureComponent<IProps, IStates> {
  constructor(props) {
    super(props);
    this.state = { submitting: false };
  }

  handleCreate(data: ITokenPackageCreate) {
    this.setState({ submitting: true });
    tokenPackageService.create(data).then(() => {
      message.success('Created successfully');
      Router.push('/token-package');
    }).catch((e) => {
      const err = Promise.resolve(e);
      message.error(getResponseError(err));
      this.setState({ submitting: false });
    });
  }

  render() {
    return (
      <>
        <Head>
          <title>Create Token Package</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Token packages', href: '/token-package' },
            { title: 'Create new token package' }
          ]}
        />
        <Page>
          <FormTokenPackage onFinish={this.handleCreate.bind(this)} submitting={this.state.submitting} {...this.props} />
        </Page>
      </>
    );
  }
}
const mapStates = (state: any) => ({
  settings: state.settings
});

export default connect(mapStates)(TokenPackageCreatePage);
