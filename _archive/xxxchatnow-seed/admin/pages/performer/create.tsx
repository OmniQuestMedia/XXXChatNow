import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { AccountForm } from '@components/performer/AccountForm';
import { CommissionSettingForm } from '@components/performer/commission-setting';
import { PerformerDocument } from '@components/performer/Document';
import { PerformerSchedule } from '@components/performer/Schedule';
import { SocialsForm } from '@components/performer/socialsForm';
import { getResponseError, validateUsername } from '@lib/utils';
import { performerCategoryService, performerService } from '@services/index';
import { utilsService } from '@services/utils.service';
import { message, Tabs } from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { createRef, PureComponent } from 'react';
import {
  ICountry,
  ILangguges,
  IPerformerCategory,
  ISchedule
} from 'src/interfaces';

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 16 }
};

interface IProps {
  countries: ICountry[];
  languages: ILangguges[];
  categories: IPerformerCategory[];
}
class PerformerCreate extends PureComponent<IProps> {
  static async getInitialProps() {
    const [countries, languages, categories] = await Promise.all([
      utilsService.countriesList(),
      utilsService.languagesList(),
      performerCategoryService.search({
        sortBy: 'ordering',
        sort: 'asc',
        limit: 100
      })
    ]);
    return {
      countries: countries.data,
      languages: languages.data,
      categories:
        categories.data && categories.data.data ? categories.data.data : []
    };
  }

  state = {
    creating: false
  };

  customFields = {} as any;

  formRef = createRef() as any;

  scheduleValue = {
    mon: {
      start: '00:00',
      end: '',
      closed: true
    },
    tue: {
      start: '00:00',
      end: '',
      closed: true
    },
    wed: {
      start: '00:00',
      end: '',
      closed: true
    },
    thu: {
      start: '00:00',
      end: '',
      closed: true
    },
    fri: {
      start: '00:00',
      end: '',
      closed: true
    },
    sat: {
      start: '00:00',
      end: '',
      closed: true
    },
    sun: {
      start: '00:00',
      end: '',
      closed: true
    }
  } as ISchedule;

  onUploaded(field: string, resp: any) {
    this.customFields[field] = resp.response.data._id;
  }

  onFormRefSubmit() {
    this.formRef.formRefSubmit();
  }

  onChangeTime(dates: [], dateStrings: [string, string], key: string) {
    const start = dateStrings[0];
    const end = dateStrings[1];
    const objectKey = this.scheduleValue[key];
    objectKey.start = start;
    objectKey.end = end;
    this.scheduleValue[key] = { ...this.scheduleValue[key], ...objectKey };
  }

  onChangeCloded(checked: boolean, key: string) {
    const objectKey = this.scheduleValue[key];
    objectKey.closed = checked;
    this.scheduleValue[key] = { ...this.scheduleValue[key], ...objectKey };
  }

  onCreateSocials(values) {
    this.customFields.socials = values;
  }

  onCreateCommissionSetting(values) {
    this.customFields.commissionSetting = values;
    this.onFormRefSubmit();
  }

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

      this.setState({ creating: true });
      const resp = await performerService.create({
        ...data,
        ...this.customFields,
        schedule: this.scheduleValue
      });
      message.success('Updated successfully');
      Router.push(
        {
          pathname: '/performer/update',
          query: { id: resp.data._id }
        },
        `/performer/update?id=${resp.data._id}`,
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
    const { countries, languages, categories } = this.props;

    return (
      <>
        <Head>
          <title>Create performer</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Performers', href: '/performer' },
            { title: 'Create new performer' }
          ]}
        />
        <Page>
          <Tabs defaultActiveKey="basic" tabPosition="left" {...layout}>
            <Tabs.TabPane tab={<span>General info</span>} key="basic">
              <AccountForm
                ref={(el) => {
                  this.formRef = el;
                }}
                onUploaded={this.onUploaded.bind(this)}
                onFinish={this.submit.bind(this)}
                submiting={creating}
                countries={countries}
                languages={languages}
                categories={categories}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span>Socials</span>} key="socials">
              <SocialsForm
                socials={null}
                onFinish={this.onCreateSocials.bind(this)}
                submiting={creating}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span>Document</span>} key="document">
              <PerformerDocument
                update={false}
                onUploaded={this.onUploaded.bind(this)}
                submiting={creating}
                onFormRefSubmit={this.onFormRefSubmit.bind(this)}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab={<span>Schedule</span>} key="schedule">
              <PerformerSchedule
                onChangeCloded={this.onChangeCloded.bind(this)}
                onChangeTime={this.onChangeTime.bind(this)}
                scheduleValue={this.scheduleValue}
                submiting={creating}
                onFormRefSubmit={this.onFormRefSubmit.bind(this)}
              />
            </Tabs.TabPane>
            <Tabs.TabPane
              tab={<span>Commission Setting</span>}
              key="commission"
            >
              <CommissionSettingForm
                submiting={creating}
                onFinish={this.onCreateCommissionSetting.bind(this)}
              />
            </Tabs.TabPane>
          </Tabs>
        </Page>
      </>
    );
  }
}

export default PerformerCreate;
