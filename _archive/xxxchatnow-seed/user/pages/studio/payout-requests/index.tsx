import Page from '@components/common/layout/page';
import { formatDate } from '@lib/date';
import { getResponseError, getSearchData } from '@lib/utils';
import {
  getStudioPayoutRequest,
  removeStudioPayoutRequest
} from '@redux/studio/actions';
import { payoutRequestService } from '@services/payout-request';
import {
  Button, Col, message, Row, Statistic
} from 'antd';
import dynamic from 'next/dynamic';
import Router from 'next/router';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { ISearch, PayoutRequestInterface } from 'src/interfaces';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const PayoutRequestList = dynamic(() => import('src/components/payout-request/table'), { ssr: false });

interface IProps {
  data: PayoutRequestInterface[];
  total: number;
  error: any;
  searching: boolean;
  getStudioPayoutRequest: Function;
  conversionRate: number;
}

interface IStates extends ISearch {
  filter?: any;
  statsPayout: any;
}

class PerformerPayoutRequestPage extends PureComponent<IProps, IStates> {
  static authenticate = 'studio';

  static layout = 'primary';

  constructor(props: IProps) {
    super(props);
    this.state = {
      limit: 10,
      offset: 0,
      sortBy: 'createdAt',
      sort: 'desc',
      statsPayout: null
    };
  }

  componentDidMount() {
    const { getStudioPayoutRequest: dispatchGetStudioPayoutRequest } = this.props;
    dispatchGetStudioPayoutRequest(this.state);
    this.calculateStatsPayout();
  }

  componentDidUpdate(preProps: IProps, prevStates: IStates) {
    const { getStudioPayoutRequest: dispatchGetStudioPayoutReq, error } = this.props;
    if (prevStates !== this.state) {
      dispatchGetStudioPayoutReq(this.state);
    }

    if (error && error !== preProps.error) {
      message.error(getResponseError(error));
    }
  }

  onChange(pagination, filters, sorter) {
    const oldState = this.state;
    this.setState(getSearchData(pagination, filters, sorter, oldState));
  }

  async calculateStatsPayout() {
    try {
      const resp = await payoutRequestService.studioStats();
      this.setState({ statsPayout: resp.data });
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    }
  }

  render() {
    const {
      data, searching, total, conversionRate
    } = this.props;
    const { limit, statsPayout } = this.state;

    return (
      <div className={style['payout-request-page']}>
        <PageTitle title="Payout Request" />
        <Page>
          <PageHeader
            title="Payout Request"
            extra={(
              <Button
                type="primary"
                onClick={() => Router.push('/studio/payout-requests/create')}
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
                title="Total Tokens [Studio + Models]"
                value={statsPayout?.totalPrice || 0}
                precision={2}
                prefix="$"
              />
            </Col>
            <Col md={3} xs={12}>
              <Statistic
                title="Paid Tokens"
                value={statsPayout?.paidPrice || 0}
                precision={2}
                prefix="$"
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
                prefix="$"
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
        {data ? (
          <PayoutRequestList
            payouts={data}
            searching={searching}
            total={total}
            onChange={this.onChange.bind(this)}
            pageSize={limit}
            // eslint-disable-next-line jsx-a11y/aria-role
            role="studio"
          />
        ) : (
          <p>No request found.</p>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  ...state.studio.studioPayout,
  conversionRate: state.settings.conversionRate
});
const mapDispatch = { getStudioPayoutRequest, removeStudioPayoutRequest };
export default connect(
  mapStateToProps,
  mapDispatch
)(PerformerPayoutRequestPage);
