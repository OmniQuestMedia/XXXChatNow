import Page from '@components/common/layout/page';
import { getEarning } from '@redux/performer/actions';
import { earningService } from '@services/earning.service';
import {
  Button,
  Col,
  DatePicker,
  message,
  Row,
  Select,
  Statistic
} from 'antd';
import { omit } from 'lodash';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { IPerformer } from 'src/interfaces';
import { IEarning } from 'src/interfaces/earning';
import { downloadCsv, getSearchData } from 'src/lib';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const EarningIndependentTable = dynamic(() => import('@components/performer/earning-independent-table'), { ssr: false });
const EarningStudioOperatedTable = dynamic(() => import('@components/performer/earning-studio-operated-table'), { ssr: false });

const Option = Select;

interface IProps {
  data: IEarning[];
  stats: any;
  performer: IPerformer;
  total: number;
  searching: boolean;
  success: boolean;
  getEarning: Function;
  conversionRate: number;
}

function PerformerProductsPage({
  data,
  stats,
  performer,
  total,
  searching,
  success,
  getEarning: dispatchGetEarning,
  conversionRate = 0
}: IProps) {
  const [query, setQuery] = useState({
    toDate: null,
    fromDate: null,
    limit: 10,
    offset: 0,
    sortBy: 'createdAt',
    sort: 'desc'
  });
  const [payoutStatus, setPayoutStatus] = useState('');
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

  useEffect(() => {
    dispatchGetEarning(query);
  }, [query]);

  useEffect(() => {
    dispatchGetEarning({
      ...query,
      payoutStatus
    });
  }, [payoutStatus]);

  const onChange = (pagination, filters, sorter) => {
    const oldState = { ...query };
    setQuery(getSearchData(pagination, filters, sorter, oldState));
  };

  const setDateRanger = (_, dateStrings: string[]) => {
    if (!dateStrings[0] && !dateStrings[1]) {
      setQuery({
        ...query,
        toDate: null,
        fromDate: null,
        sortBy: 'createdAt',
        sort: 'desc'
      });
      return;
    }

    if (!dateStrings[0] || !dateStrings[1]) return;
    setQuery({
      ...query,
      fromDate: new Date(dateStrings[0]).toISOString(),
      toDate: new Date(dateStrings[1]).toISOString()
    });
  };

  const onExportCsv = async () => {
    try {
      const { fromDate, toDate } = query;
      const datas = omit(query, ['fromDate', 'toDate']) as any;
      if (fromDate && toDate) {
        datas.fromDate = fromDate;
        datas.toDate = toDate;
      }

      const url = await earningService.exportCsv({
        ...datas,
        payoutStatus
      });
      const resp = (await downloadCsv(url, 'my_earning_export.csv')) as any;
      if (resp && resp.success) {
        message.success('Downloading, please check in Download folder');
      }
    } catch (error) {
      message.error('An error occurred, please try again!');
    }
  };

  const filterByStatus = (status: string) => {
    setPayoutStatus(status);
  };

  return (
    <div className={style['earning-history-page']}>
      <PageTitle title="Earning" />
      <Page>
        <PageHeader
          title="My Earning"
          extra={(
            <Button
              type="primary"
              onClick={onExportCsv.bind(this)}
              style={{ width: '100%' }}
            >
              Export CSV
            </Button>
          )}
        />
        <Row gutter={24} className={style['ant-page-header']}>
          <Col md={24} xs={24}>
            {performer.studioId ? success && stats && (
            <Row gutter={24}>
              <Col md={4} xs={12}>
                <Statistic
                  title="Current Conversion Rate"
                  value={conversionRate}
                  precision={2}
                />
              </Col>
              <Col md={4} xs={12}>
                <Statistic
                  title="Tokens Received"
                  value={stats.data?.studioToModelTotalNetPrice}
                  precision={2}
                />
              </Col>
              <Col md={4} xs={12}>
                <Statistic
                  title="Paid Tokens"
                  value={stats.data?.paidPrice}
                  precision={2}
                />
              </Col>
              <Col md={4} xs={12}>
                <Statistic
                  title="Paid Amount"
                  value={(stats.data?.paidPrice ? stats.data.paidPrice * conversionRate : 0)}
                  precision={2}
                />
              </Col>
              <Col md={4} xs={12}>
                <Statistic
                  title="Unpaid Tokens"
                  value={stats.data?.studioToModelTotalUnpaidNetPrice}
                  precision={2}
                />
              </Col>
              <Col md={4} xs={12}>
                <Statistic
                  title="Unpaid Amount"
                  value={stats.data?.studioToModelTotalUnpaidNetPrice ? stats.data.studioToModelTotalUnpaidNetPrice * conversionRate : 0}
                  precision={2}
                />
              </Col>
            </Row>
            ) : success && stats && (
              <Row gutter={24}>
                <Col md={4} xs={12}>
                  <Statistic
                    title="Current Conversion Rate"
                    value={conversionRate}
                    precision={2}
                  />
                </Col>
                <Col md={4} xs={12}>
                  <Statistic
                    title="Tokens Received"
                    value={stats.data?.totalPrice}
                    precision={2}
                  />
                </Col>
                <Col md={4} xs={12}>
                  <Statistic
                    title="Paid Tokens"
                    value={stats.data?.paidPrice}
                    precision={2}
                  />
                </Col>
                <Col md={4} xs={12}>
                  <Statistic
                    title="Paid Amount"
                    value={(stats.data?.paidPrice ? stats.data.paidPrice * conversionRate : 0)}
                    precision={2}
                  />
                </Col>
                <Col md={4} xs={12}>
                  <Statistic
                    title="Unpaid Tokens"
                    value={stats.data?.remainingPrice}
                    precision={2}
                  />
                </Col>
                <Col md={4} xs={12}>
                  <Statistic
                    title="Unpaid Amount"
                    value={stats.data?.remainingPrice ? stats.data.remainingPrice * conversionRate : 0}
                    precision={2}
                  />
                </Col>
              </Row>
            )}
          </Col>
          <Col md={24} xs={24}>
            <Row>
              <Col md={4} xs={24}>
                <div>
                  <DatePicker.RangePicker
                    disabledDate={() => searching}
                    onCalendarChange={setDateRanger}
                  />
                </div>
              </Col>
              &nbsp;
              {statuses.length ? (
                <Col md={4} xs={24}>
                  <Select<string>
                    style={{ width: '90%' }}
                    onSelect={(val) => filterByStatus(val)}
                    placeholder="Select status"
                    value={payoutStatus}
                  >
                    <Option value="">All Payout Status</Option>
                    {statuses.map((s) => (
                      <Option key={s.key} value={s.key}>
                        {s.text || s.key}
                      </Option>
                    ))}
                  </Select>
                </Col>
              ) : null}
            </Row>
          </Col>
        </Row>
        <div style={{ marginBottom: '20px' }} />
        {performer.studioId ? (
          <EarningStudioOperatedTable
            earnings={data}
            searching={searching}
            total={total}
            pageSize={query.limit}
            onChange={onChange.bind(this)}
            role_data="model"
          />
        ) : (
          <EarningIndependentTable
            earnings={data}
            searching={searching}
            total={total}
            pageSize={query.limit}
            onChange={onChange.bind(this)}
            role_data="model"
          />
        )}
      </Page>
    </div>
  );
}

PerformerProductsPage.authenticate = true;
PerformerProductsPage.layout = 'primary';

const mapStateToProps = (state) => ({
  ...state.performer.earning,
  performer: state.performer.current,
  conversionRate: state.settings.conversionRate
});

const mapDispatch = { getEarning };
export default connect(mapStateToProps, mapDispatch)(PerformerProductsPage);
