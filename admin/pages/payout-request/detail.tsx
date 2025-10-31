import { BreadcrumbComponent } from '@components/common/breadcrumb';
import Page from '@components/common/layout/page';
import { getResponseError } from '@lib/utils';
import {
  Button,
  Col,
  Descriptions,
  Input,
  message,
  PageHeader,
  Row,
  Select,
  Spin
} from 'antd';
import { omit } from 'lodash';
import Head from 'next/head';
import Router from 'next/router';
import { PureComponent } from 'react';
import { IPayoutRequest } from 'src/interfaces';
import { formatDate } from 'src/lib/date';
import { payoutRequestService, settingService } from 'src/services';

const { Item } = Descriptions;
const invisibleField = [
  '_id',
  '__v',
  'sourceType',
  'sourceId',
  'sourceInfo',
  'type',
  'createdAt',
  'updatedAt'
];

interface IProps {
  id: string;
}

interface IStates {
  request: IPayoutRequest;
  status: string;
  adminNote: any;
  loading: boolean;
  conversionRate: number;
}

class PayoutDetailPage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static onlyPerformer = true;

  static async getInitialProps(ctx) {
    return ctx.query;
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      request: null,
      status: '',
      adminNote: '',
      loading: true,
      conversionRate: 0
    };
  }

  componentDidMount() {
    this.getData();
    this.loadCurrentConversion();
  }

  async onUpdate(id: string) {
    const {
      status, adminNote, request, conversionRate
    } = this.state;
    try {
      await payoutRequestService.update(id, {
        status,
        adminNote,
        conversionRate
      });
      message.success('Updated successfully');
      if (request.sourceType === 'studio') {
        Router.push('/payout-request/studios');
      }
      if (request.sourceType === 'performer') {
        Router.push('/payout-request');
      }
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    }
  }

  async getData() {
    try {
      this.setState({ loading: true });
      const resp = await payoutRequestService.findById(this.props.id);
      await this.setState({
        request: resp.data,
        status: resp.data.status,
        adminNote: resp.data.adminNote
      });
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      this.setState({ loading: false });
    }
  }

  async loadCurrentConversion() {
    const res = await settingService.getValueByKeys(['conversionRate']);
    this.setState({
      conversionRate: res.data.conversionRate
    });
  }

  render() {
    const {
      request, adminNote, loading, conversionRate
    } = this.state;
    const paymentInfo = [];
    if (request) {
      const { paymentAccountInfo } = request;
      paymentAccountInfo
        && Object.keys(omit(paymentAccountInfo, invisibleField)).forEach(
          (field) => {
            paymentInfo.push(
              <Item label={field}>{paymentAccountInfo[field]}</Item>
            );
          }
        );
    }

    return (
      <>
        <Head>
          <title>Request Details</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Payout Requests', href: '/payout-request' },
            {
              title: request?._id || 'Request Details'
            }
          ]}
        />

        <Page>
          <PageHeader
            title="Payment Request Information"
            style={{ padding: 0, marginBottom: 10 }}
          />

          <Spin spinning={loading} />

          {!loading
            && (request ? (
              <Row>
                <Col md={24} lg={12}>
                  <div>
                    <p>
                      Requester:
                      {' '}
                      <strong>{request.sourceInfo?.username}</strong>
                    </p>
                    <p>
                      Role:
                      {' '}
                      {request.sourceType}
                    </p>
                    <p>
                      Pay Period:
                      {' '}
                      {formatDate(request.fromDate, 'DD/MM/YYYY')}
                      {' '}
                      -
                      {' '}
                      {formatDate(request.toDate, 'DD/MM/YYYY')}
                    </p>
                    <p>
                      Total token request:
                      {' '}
                      {request.tokenMustPay?.toFixed(2)}
                    </p>
                    <p>
                      Previously Paid Tokens:
                      {' '}
                      {request.previousPaidOut}
                    </p>
                    <p>
                      Remaining token must pay:
                      {' '}
                      {request.pendingToken?.toFixed(2)}
                    </p>
                    <p>
                      Current conversion rate:
                      {' '}
                      {conversionRate}
                    </p>
                    <p>
                      Converted Amount:
                      {' '}
                      {(request.pendingToken * conversionRate)?.toFixed(2)}
                    </p>
                    <p>
                      Request Date:
                      {' '}
                      {formatDate(request.fromDate)}
                    </p>
                    <p>
                      Note:
                      {' '}
                      {request.requestNote}
                    </p>
                    <br />
                    <Descriptions
                      title="Payment Account Information"
                      column={1}
                    >
                      {paymentInfo.length > 0 ? paymentInfo : ''}
                    </Descriptions>
                  </div>
                </Col>
                <Col md={24} lg={12}>
                  <div style={{ marginBottom: '10px' }}>
                    <p>Status:</p>
                    <Select
                      style={{ width: '100%' }}
                      onChange={(selectedStatus: string) => this.setState({ status: selectedStatus })}
                      defaultValue={this.state.status || 'N/A'}
                    >
                      <Select.Option key="approved" value="approved">
                        Approved
                      </Select.Option>
                      <Select.Option key="pending" value="pending" disabled>
                        Pending
                      </Select.Option>
                      <Select.Option key="rejected" value="rejected">
                        Rejected
                      </Select.Option>
                      <Select.Option key="done" value="done">
                        Paid
                      </Select.Option>
                    </Select>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <p>Note: </p>
                    <Input.TextArea
                      defaultValue={adminNote}
                      style={{ width: '100%' }}
                      onChange={(v) => {
                        this.setState({ adminNote: v.target.value });
                      }}
                      placeholder="Add your comment here..."
                      autoSize={{ minRows: 3 }}
                    />
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <Button
                      danger
                      onClick={this.onUpdate.bind(this, request._id)}
                    >
                      Update
                    </Button>
                  </div>
                </Col>
              </Row>
            ) : (
              <Row>
                <Col span="24">
                  <p>Request not found.</p>
                </Col>
              </Row>
            ))}
        </Page>
      </>
    );
  }
}

export default PayoutDetailPage;
