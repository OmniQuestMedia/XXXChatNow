import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import StudioAccountForm from '@components/studio/studio-account-form';
import { getResponseError, validateUsername } from '@lib/utils';
import { studioService } from '@services/index';
import { utilsService } from '@services/utils.service';
import { message, Tabs } from 'antd';
import { omit } from 'lodash';
import Head from 'next/head';
import Router from 'next/router';
import { PureComponent } from 'react';
import { ICountry } from 'src/interfaces';

interface IProps {
  countries: ICountry[];
}
class StudioCreate extends PureComponent<IProps> {
  static async getInitialProps() {
    const [countries] = await Promise.all([
      utilsService.countriesList()
    ]);
    return {
      countries: countries.data
    };
  }

  state = {
    creating: false
  };

  customFields = {};

  async submit(data: any) {
    try {
      if (data.password !== data.rePassword) {
        message.error('Confirm password mismatch!');
        return;
      }

      if (!validateUsername(data.username)) {
        message.error('Username is invalid!');
        return;
      }
      // eslint-disable-next-line
      data = omit(data, ['rePassword']);
      this.setState({ creating: true });
      await studioService.create({
        ...data,
        ...this.customFields
      });
      Router.push(
        {
          pathname: '/studios'
        },
        '/studios',
        {
          shallow: false
        }
      );
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(
        getResponseError(err) || 'An error occurred, please try again!'
      );
    } finally {
      this.setState({ creating: false });
    }
  }

  render() {
    const { creating } = this.state;
    const { countries } = this.props;

    return (
      <>
        <Head>
          <title>Create Studio</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Studio', href: '/studios' },
            { title: 'Create new Studio' }
          ]}
        />
        <Page>
          <Tabs defaultActiveKey="basic" tabPosition="left">
            <Tabs.TabPane tab={<span>General info</span>} key="basic">
              <StudioAccountForm
                onFinish={this.submit.bind(this)}
                submiting={creating}
                countries={countries}
              />
            </Tabs.TabPane>
            {/* <Tabs.TabPane
              tab={<span>Commission Setting</span>}
              key="commission"
            >
              <StudioCommissionForm
                submiting={creating}
                onFinish={this.onCreateStudioCommissionSetting.bind(this)}
              />
            </Tabs.TabPane> */}
          </Tabs>
        </Page>
      </>
    );
  }
}

export default StudioCreate;
