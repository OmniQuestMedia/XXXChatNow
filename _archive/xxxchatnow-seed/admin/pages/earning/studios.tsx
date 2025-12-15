import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { SelectStudioDropdown } from '@components/studio/select-studio.dropdown';
import {
  Button, Col,
  DatePicker,
  message,
  PageHeader,
  Row,
  Select,
  Space,
  Statistic
} from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';
import EarningTable from 'src/components/earning/table-list';
import { IEarning } from 'src/interfaces';
import { downloadCsv, getResponseError } from 'src/lib/utils';
import { earningService, settingService } from 'src/services';

import style from './earning.module.less';

const Option = Select;

interface IStates {
  data: IEarning[];
  loading: boolean;
  pagination: {
    pageSize: number;
    total: number;
  };
  offset: number;
  sort: { sortBy: string; sorter: string };
  filter: {};
  stats?: any;
  query?: any;
  target?: string;
  targetId?: any;
  payoutStatus?: string;
  conversionRate: number;
  downloading: boolean;
}

class StudioEarningPage extends PureComponent<any, IStates> {
  static async getInitialProps(ctx) {
    return ctx.query;
  }

  constructor(props: any) {
    super(props);
    this.state = {
      offset: 0,
      data: [],
      loading: false,
      pagination: { pageSize: 10, total: 0 },
      filter: {},
      sort: { sortBy: 'createdAt', sorter: 'desc' },
      stats: null,
      target: 'studio',
      targetId: '',
      payoutStatus: '',
      conversionRate: null,
      downloading: false
    };
  }

  componentDidMount() {
    this.loadData();
    this.loadStats();
    this.loadCurrentConversion();
  }

  // async handleFilter(filter) {
  //   await this.setState({ filter });
  //   this.loadData();
  //   this.loadStats();
  // }

  handleSearchStudio() {
    this.loadData();
    this.loadStats();
  }

  async onHandleTabChange(pagination, filters, sorter) {
    const { sort } = this.state;
    await this.setState({
      offset: (pagination.current - 1) * this.state.pagination.pageSize,
      sort: {
        ...sort,
        sorter: sorter.order === 'ascend' ? 'asc' : 'desc',
        ...(sorter.field && { sortBy: sorter.field })
      }
    });
    this.loadData();
  }

  async onExportCsv() {
    const {
      pagination, filter, query, target, payoutStatus, targetId
    } = this.state;
    try {
      const page = 1;
      this.setState({ filter });
      const url = await earningService.exportCsv({
        limit: pagination.pageSize,
        offset: (page - 1) * this.state.pagination.pageSize,
        sort: this.state.sort.sorter,
        sortBy: this.state.sort.sortBy,
        ...filter,
        ...query,
        target,
        targetId,
        payoutStatus
      });
      message.warning('Downloading, please wait a moment!');
      this.setState({ downloading: true });
      const resp = (await downloadCsv(url, 'admin_studio_earning_export.csv')) as any;
      if (resp && resp.success) {
        message.success('Download successfully!');
        this.setState({ downloading: false });
      }
    } catch (error) {
      message.error('An error occurred, please try again!');
    }
  }

  async setDateRanger(_, dateStrings: string[]) {
    if (!dateStrings[0] && !dateStrings[1]) {
      this.setState({
        query: {},
        sort: { sortBy: 'createdAt', sorter: 'desc' }
      }, () => {
        this.loadData();
        this.loadStats();
      });
    }
    if (dateStrings[0] && dateStrings[1]) {
      this.setState({
        query: { fromDate: new Date(dateStrings[0]).toISOString(), toDate: new Date(dateStrings[1]).toISOString() }
      }, () => {
        this.loadData();
        this.loadStats();
      });
    }
  }

  async loadData() {
    const {
      offset, pagination, filter, sort, query, target, payoutStatus, targetId
    } = this.state;
    // var query = {};
    // if (fromDate && toDate) {
    //   query = Object.assign(query, fromDate, toDate);
    // }
    try {
      this.setState({ loading: true });
      const resp = await earningService.search({
        offset,
        limit: pagination.pageSize,
        ...filter,
        ...sort,
        ...query,
        target,
        targetId,
        payoutStatus
      });
      this.setState({
        data: resp.data.data,
        pagination: { ...this.state.pagination, total: resp.data.total }
      });
    } catch (e) {
      this.showError(e);
    } finally {
      this.setState({ loading: false });
    }
  }

  async loadStats() {
    const {
      query, target, filter, targetId
    } = this.state;
    try {
      const resp = await earningService.stats({
        ...query, target, targetId, ...filter
      });
      await this.setState({ stats: resp });
    } catch (error) {
      this.showError(error);
    }
  }

  async loadCurrentConversion() {
    const res = await settingService.getValueByKeys(['conversionRate']);
    this.setState({
      conversionRate: res.data.conversionRate
    });
  }

  async showError(e) {
    const err = await Promise.resolve(e);
    message.error(getResponseError(err));
  }

  render() {
    const {
      data, loading, pagination, stats, payoutStatus, conversionRate, downloading
    } = this.state;
    // const sourceType = [
    //   { key: '', text: 'All' },
    //   { text: 'Sale Video', key: 'sale_video' },
    //   { text: 'Sale Product', key: 'sale_product' },
    //   { text: 'Sale Photo', key: 'sale_photo' },
    //   { text: 'Tip', key: 'tip' },
    //   { text: 'Private', key: 'private' },
    //   { text: 'Group', key: 'group' }
    // ];
    const statuses = [
      {
        key: 'pending',
        text: 'Pending'
      },
      {
        key: 'approved',
        text: 'Approved'
      },
      {
        key: 'rejected',
        text: 'Rejected'
      },
      {
        key: 'done',
        text: 'Paid'
      }
    ];
    return (
      <>
        <Head>
          <title>Earning</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Studio earning' }]} />
        <Page>
          <PageHeader
            title="Studio Earning"
            style={{ padding: 0, marginBottom: 10 }}
          />
          <Row className="ant-page-header">
            <Col md={24} xs={24}>
              {!loading && stats && (
                <Space size="large" className={style['custom-space']}>
                  <Row>
                    <Col md={4} xs={24}>
                      <Statistic
                        title="Current Conversion Rate"
                        value={conversionRate || 'N/A'}
                        precision={2}
                      />
                    </Col>
                    <Col md={4} xs={12}>
                      <Statistic
                        className="space-custom"
                        title="Tokens Received"
                        value={stats.data.totalPrice - stats.data.remainingPrice}
                        style={{ marginRight: '30px' }}
                        precision={2}
                      />
                    </Col>
                    <Col md={4} xs={12}>
                      <Statistic
                        style={{ marginRight: '30px' }}
                        title="Studio share of tokens"
                        value={stats.data.sharedPrice}
                        precision={2}
                      />
                    </Col>
                    <Col md={3} xs={12}>
                      <Statistic
                        style={{ marginRight: '30px' }}
                        title="Paid Tokens"
                        value={stats.data.paidPrice}
                        precision={2}
                      />
                    </Col>
                    <Col md={3} xs={12}>
                      <Statistic
                        style={{ marginRight: '30px' }}
                        title="Unpaid Tokens"
                        value={stats.data.remainingPrice}
                        precision={2}
                      />
                    </Col>
                    <Col md={3} xs={12}>
                      <Statistic
                        style={{ marginRight: '30px' }}
                        title="Paid Amount"
                        value={conversionRate ? stats.data.paidPrice * conversionRate : conversionRate}
                        precision={2}
                      />
                    </Col>
                    <Col md={3} xs={12}>
                      <Statistic
                        style={{ marginRight: '30px' }}
                        title="Unpaid Amount"
                        value={conversionRate ? stats.data.remainingPrice * conversionRate : conversionRate}
                        precision={2}
                      />
                    </Col>
                  </Row>
                </Space>
              )}
            </Col>
            <Col md={24} xs={24}>
              <Row gutter={24}>
                <Col lg={6} md={12} sm={12} xs={24}>
                  <DatePicker.RangePicker
                    disabledDate={() => loading}
                    onCalendarChange={this.setDateRanger.bind(this)}
                    style={{ width: '100%' }}
                  />

                </Col>
                {statuses.length ? (
                  <Col lg={6} md={12} sm={12} xs={24}>
                    <Select<string>
                      style={{ width: '100%' }}
                      onSelect={(val) => this.setState({ payoutStatus: val }, () => this.loadData())}
                      placeholder="Select status"
                      value={payoutStatus}
                    >
                      <Option value="">All</Option>
                      {statuses.map((s) => (
                        <Option key={s.key} value={s.key}>
                          {s.text || s.key}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                ) : null}
                <Col lg={4} md={10} sm={24} xs={24}>
                  <SelectStudioDropdown
                    placeholder="Search studio"
                    style={{ width: '100%' }}
                    onSelect={(val) => this.setState({ targetId: val || '' })}
                  />
                </Col>
                <Col lg={4} md={10} sm={24} xs={24}>
                  <Button
                    type="primary"
                    onClick={this.handleSearchStudio.bind(this)}
                    style={{ width: '100%' }}
                  >
                    Search
                  </Button>
                </Col>
                <Col lg={4} md={4} sm={24} xs={24}>
                  <Button
                    type="primary"
                    onClick={this.onExportCsv.bind(this)}
                    style={{ width: '100%' }}
                    loading={downloading}
                  >
                    Export CSV
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
          {/* <div>
            <span>Type:</span>
            <SearchFilter
              sourceType={sourceType}
              onSubmit={this.handleFilter.bind(this)}
              notWithKeyWord={true}
            />
          </div> */}

          <div style={{ marginBottom: '20px' }} />
          {data ? (
            <div>
              {/* <SearchFilter
                onSubmit={this.handleFilter.bind(this)}
                notWithKeyWord={true}
                searchWithStudio={true}
              /> */}
              <div style={{ marginBottom: '20px' }} />
              <EarningTable
                dataSource={data}
                rowKey="_id"
                onChange={this.onHandleTabChange.bind(this)}
                pagination={pagination}
                loading={loading}
                role_data="studio"
              />
            </div>
          ) : (
            <p>There are no earning at this time.</p>
          )}
        </Page>
      </>
    );
  }
}

export default StudioEarningPage;
