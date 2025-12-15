import { BreadcrumbComponent } from '@components/common';
import Loader from '@components/common/base/loader';
import Page from '@components/common/layout/page';
import { SearchFilter } from '@components/common/search-filter';
import { getResponseError } from '@lib/utils';
import { message } from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';
import { TokenPackageTable } from 'src/components/token-package/table-list';
import { ITokenPackage } from 'src/interfaces';
import { tokenPackageService } from 'src/services';

interface IStates {
  loading: boolean;
  packageList: ITokenPackage[];
  q: string;
  deleteing: boolean;
}

class TokenPage extends PureComponent<any, IStates> {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      deleteing: false,
      packageList: [],
      q: ''
    };
  }

  componentDidMount() {
    this.getData();
  }

  handleDelete(id: string) {
    const { packageList, deleteing } = this.state;
    if (deleteing) {
      message.error('Please wait for prev deleting');
      return;
    }
    if (!window.confirm('Are you sure to delete this package?')) return;

    this.setState({ deleteing: true });
    tokenPackageService
      .delete(id)
      .then(() => {
        this.setState({ packageList: packageList.filter((packageId) => packageId._id !== id) });
        return message.success('Deleted successfully');
      })
      .catch((e) => {
        const err = Promise.resolve(e);
        return message.error(getResponseError(err));
      })
      .finally(() => {
        this.setState({ deleteing: false });
      });
  }

  async getData() {
    const resp = await tokenPackageService.list({
      limit: 100,
      offset: 0,
      q: this.state.q
    });
    await this.setState({ packageList: resp.data.data, loading: false });
  }

  async searchByName(k) {
    await this.setState({ q: k.q });
    this.getData();
  }

  render() {
    const { packageList, loading } = this.state;
    return (
      <>
        <Head>
          <title>Token Packages</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Token packages' }
          ]}
        />
        {loading ? (
          <Loader />
        ) : (
          <Page>
            <SearchFilter onSubmit={this.searchByName.bind(this)} />
            <TokenPackageTable
              dataSource={packageList}
              rowKey="_id"
              delete={this.handleDelete.bind(this)}
            />
          </Page>
        )}
      </>
    );
  }
}

export default TokenPage;
