import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { SearchFilter } from '@components/common/search-filter';
import PayoutRequestTable from '@components/payout-request/table-list';
import {
  Col,
  message,
  PageHeader,
  Row,
  Statistic
} from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';
import { IPayoutRequest } from 'src/interfaces';
import { getResponseError } from 'src/lib/utils';
import { payoutRequestService, settingService } from 'src/services';

interface IProps {}
interface IStates {
  loading: boolean;
  data: IPayoutRequest[];
  pagination: {
    total: number;
    pageSize: number;
  };
  sort: {
    sortBy: string;
    sorter: string;
  };
  filter: any;
  offset: number;
  query?: {};
  status?: string;
  sourceType: string;
  conversionRate: number;
}

class PayoutRequestPage extends PureComponent<IProps, IStates> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      loading: false,
      data: [],
      offset: 0,
      pagination: {
        total: 0,
        pageSize: 10
      },
      sort: {
        sortBy: 'createdAt',
        sorter: 'desc'
      },
      filter: {},
      sourceType: 'performer',
      conversionRate: 0
    };
  }

  componentDidMount() {
    this.getList();
    this.loadCurrentConversion();
  }

  async handleFilter(filter) {
    await this.setState({ filter });
    this.getList();
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
    this.getList();
  }

  async getList() {
    const {
      filter,
      offset,
      pagination,
      sort,
      query,
      sourceType
    } = this.state;
    try {
      await this.setState({ loading: true });
      const resp = await payoutRequestService.search({
        ...filter,
        ...sort,
        offset,
        ...query,
        sourceType,
        limit: pagination.pageSize
      });
      await this.setState({
        data: resp.data.data,
        pagination: { ...this.state.pagination, total: resp.data.total }
      });
    } catch (e) {
      this.showError(e);
    } finally {
      this.setState({ loading: false });
    }
  }

  async setDateRanger(_, dateStrings: string[]) {
    if (!dateStrings[0] && !dateStrings[1]) {
      await this.setState({
        query: {},
        sort: { sortBy: 'createdAt', sorter: 'desc' }
      });
      this.getList();
    }
    if (dateStrings[0] && dateStrings[1]) {
      await this.setState({
        query: { fromDate: new Date(dateStrings[0]).toISOString(), toDate: new Date(dateStrings[1]).toISOString() }
      });
      this.getList();
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
      data, loading, pagination, conversionRate
    } = this.state;

    const statuses = [
      { text: 'All', key: '' },
      { text: 'Pending', key: 'pending' },
      { text: 'Approved', key: 'resolved' },
      { text: 'Rejected', key: 'rejected' },
      { text: 'Paid', key: 'done' }
    ];

    return (
      <>
        <Head>
          <title>Payout Request</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Payout Request' }]} />
        <Page>
          <PageHeader
            title="Independent Performer Payment Request"
            style={{ padding: 0 }}
          />
          <Row>
            <Col md={24} xs={12}>
              <Statistic
                style={{ marginRight: '30px', display: 'block', width: '100%' }}
                title="Current Conversion Rate"
                value={conversionRate}
                precision={2}
              />
            </Col>
            <Col md={24} xs={12}>
              <SearchFilter
                notWithKeyWord
                statuses={statuses}
                onSubmit={this.handleFilter.bind(this)}
                searchWithPerformer
                withDatePicker
                setDateRanger={this.setDateRanger.bind(this)}
              />
            </Col>
          </Row>
          <div style={{ marginBottom: '20px' }} />
          {data ? (
            <PayoutRequestTable
              data={data}
              loading={loading}
              rowKey="_id"
              pagination={pagination}
              onChange={this.onHandleTabChange.bind(this)}
            />
          ) : (
            <p>No request found.</p>
          )}
        </Page>
      </>
    );
  }
}
export default PayoutRequestPage;
