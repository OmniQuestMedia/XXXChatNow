import Page from '@components/common/layout/page';
import { formatDate } from '@lib/date';
import { getResponseError, getSearchData } from '@lib/utils';
import {
  getPayoutRequest
} from '@redux/performer/actions';
import { payoutRequestService } from '@services/payout-request';
import {
  Button, Col, message, Row, Statistic
} from 'antd';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { PayoutRequestInterface } from 'src/interfaces';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const PayoutRequestList = dynamic(() => import('src/components/payout-request/table'), { ssr: false });

interface IProps {
  data: PayoutRequestInterface[];
  total: number;
  error: any;
  searching: boolean;
  getPayoutRequest: Function;
  conversionRate: number;
}

function PerformerPayoutRequestPage({
  getPayoutRequest: dispatchGetPayoutRequest,
  error,
  data,
  searching,
  total,
  conversionRate
}: IProps) {
  const [query, setQuery] = useState({
    limit: 5,
    offset: 0,
    sortBy: 'createdAt',
    sort: 'desc'
  });
  const queryRef = useRef(query);
  const errorRef = useRef(error);

  const [statsPayout, setStatsPayout] = useState<any>();
  const [pendingStatus, setPendingStatus] = useState<boolean>(false);

  const onChange = (pagination, filters, sorter) => {
    setQuery(getSearchData(pagination, filters, sorter, query));
  };

  const calculateStatsPayout = async () => {
    try {
      const resp = await payoutRequestService.stats();
      setStatsPayout(resp.data);
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    }
  };

  const handleCreatePayout = async () => {
    try {
      if (pendingStatus) {
        return message.error('Please wait until your previous request is completed.');
      }
      return Router.push('/account/performer/payout-requests/create');
    } catch (e) {
      const err = await Promise.resolve(e);
      return message.error(getResponseError(err));
    }
  };

  const getPendingRequests = async () => {
    try {
      const resp = await payoutRequestService.getPendingRequests();
      if (resp.data) {
        setPendingStatus(true);
      }
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    }
  };

  useEffect(() => {
    getPendingRequests();
    dispatchGetPayoutRequest(query);
    calculateStatsPayout();
  }, []);

  useEffect(() => {
    if (queryRef.current !== query) {
      dispatchGetPayoutRequest(query);
    }

    if (error && error !== errorRef.current) {
      message.error(getResponseError(error));
    }
  }, [query, error]);

  return (
    <div className={style['payout-request-page']}>
      <PageTitle title="Payout request" />
      <Page>
        <PageHeader
          title="Payout Request"
          extra={(
            <Button
              type="primary"
              onClick={() => handleCreatePayout()}
            >
              Create new Payout Request
            </Button>
          )}
        />
        <Row gutter={24}>
          <Col md={3} xs={12}>
            <Statistic
              title="Current Conversion Rate"
              value={conversionRate}
              precision={2}
            />
          </Col>
          <Col md={3} xs={12}>
            <Statistic
              title="Total Tokens"
              value={statsPayout?.totalPrice || 0}
              precision={2}
            />
          </Col>
          <Col md={3} xs={12}>
            <Statistic
              title="Paid Tokens"
              value={statsPayout?.paidPrice || 0}
              precision={2}
            />
          </Col>
          <Col md={3} xs={12}>
            <Statistic
              title="Paid Amount"
              value={(statsPayout?.paidPrice ? statsPayout.paidPrice * conversionRate : 0)}
              precision={2}
            />
          </Col>
          <Col md={3} xs={12}>
            <Statistic
              title="Unpaid Tokens"
              value={statsPayout?.unpaidPrice || 0}
              precision={2}
            />
          </Col>
          <Col md={3} xs={12}>
            <Statistic
              title="Unpaid Amount"
              value={statsPayout?.unpaidPrice ? statsPayout.unpaidPrice * conversionRate : 0}
              precision={2}
            />
          </Col>
          <Col md={6} xs={12}>
            <Statistic
              title="Last Payout"
              value={statsPayout?.lastPaid?.token || 0}
              precision={2}
            />
            <div>
              <small>
                Request Date:
                {' '}
                {formatDate(statsPayout?.lastPaid?.requestDate)}
              </small>
              <br />
              <small>
                Payment Date:
                {' '}
                {formatDate(statsPayout?.lastPaid?.paymentDate)}
              </small>
            </div>
          </Col>
        </Row>
      </Page>
      <br />
      <PayoutRequestList
        payouts={data}
        searching={searching}
        total={total}
        onChange={onChange.bind(this)}
        pageSize={query.limit}
      />
    </div>
  );
}

PerformerPayoutRequestPage.authenticate = true;
PerformerPayoutRequestPage.layout = 'primary';

const mapStateToProps = (state) => ({
  ...state.performer.payout,
  conversionRate: state.settings.conversionRate
});

const mapDispatch = { getPayoutRequest };

export default connect(mapStateToProps, mapDispatch)(PerformerPayoutRequestPage);
