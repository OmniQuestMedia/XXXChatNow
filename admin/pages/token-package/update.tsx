import { BreadcrumbComponent } from '@components/common';
import Loader from '@components/common/base/loader';
import Page from '@components/common/layout/page';
import { getResponseError } from '@lib/utils';
import { message } from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { PureComponent } from 'react';
import { FormTokenPackage } from 'src/components/token-package/form';
import { ITokenPackage, ITokenPackageUpdate } from 'src/interfaces';
import { tokenPackageService } from 'src/services';

interface IProps {
  id: string;
  settings: any;
}
interface IStates {
  submitting: boolean;
  loading: boolean;
  tokenPackage: Partial<ITokenPackage>;
}

class TokenPackageUpdatePage extends PureComponent<IProps, IStates> {
  static async getInitialProps(ctx) {
    return ctx.query;
  }

  constructor(props) {
    super(props);
    this.state = { submitting: false, loading: true, tokenPackage: {} };
  }

  componentDidMount() {
    if (!this.props.id) {
      message.error('Package not found!');
      Router.push('/token-package');
    }
    this.getData();
  }

  handleUpdate(data: ITokenPackageUpdate) {
    this.setState({ submitting: true });
    tokenPackageService.update(this.props.id, data).then(() => {
      message.success('Updated successfully');
      Router.push('/token-package');
    }).catch((e) => {
      const err = Promise.resolve(e);
      message.error(getResponseError(err));
      this.setState({ submitting: false });
    });
  }

  async getData() {
    const resp = await tokenPackageService.findOne(this.props.id);
    this.setState({ loading: false, tokenPackage: resp.data });
  }

  render() {
    const { loading, tokenPackage } = this.state;
    return (
      <>
        <Head>
          <title>Update Token Package</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Token packages', href: '/token-package' },
            { title: 'Update token package' }
          ]}
        />
        <Page>
          { loading ? <Loader /> : <FormTokenPackage onFinish={this.handleUpdate.bind(this)} submitting={this.state.submitting} tokenPackage={tokenPackage} {...this.props} /> }

        </Page>
      </>
    );
  }
}
export default TokenPackageUpdatePage;
