import { getStudioEarning } from '@redux/studio/actions';
import { earningService } from '@services/earning.service';
import {
  Button,
  Col,
  DatePicker,
  message,
  Row,
  Select,
  Space,
  Statistic
} from 'antd';
import { omit } from 'lodash';
import dynamic from 'next/dynamic';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { ISearch } from 'src/interfaces';
import { IEarning } from 'src/interfaces/earning';
import { downloadCsv, getSearchData } from 'src/lib';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const EarningHistoryTable = dynamic(() => import('@components/performer/earning-history-table'), { ssr: false });

const Option = Select;
interface IProps {
  data: IEarning[];
  // error: any;
  stats: any;
  // studio: IStudio;
  total: number;
  searching: boolean;
  success: boolean;
  getStudioEarning: Function;
  singularTextModel: string;
  pluralTextModel: string;
}

interface IStates extends ISearch {
  fromDate?: string;
  toDate?: string;
  payoutStatus?: string;
}

class PerformerProductsPage extends PureComponent<IProps, IStates> {
  static authenticate = 'studio';

  static layout = 'primary';

  constructor(props: IProps) {
    super(props);
    this.state = {
      limit: 10,
      offset: 0,
      sortBy: 'createdAt',
      sort: 'desc',
      payoutStatus: ''
    };
  }

  componentDidMount() {
    const { getStudioEarning: dispatchGetStudioEarning } = this.props;
    dispatchGetStudioEarning(this.state);
  }

  componentDidUpdate(_, prevStates: IStates) {
    const { getStudioEarning: dispatchGetStudioEarning } = this.props;
    if (prevStates !== this.state) {
      dispatchGetStudioEarning(this.state);
    }
  }

  onChange(pagination, filters, sorter) {
    const oldState = this.state;
    this.setState(getSearchData(pagination, filters, sorter, oldState));
  }

  async onExportCsv() {
    try {
      const { fromDate, toDate, payoutStatus } = this.state;
      const datas = omit(this.state, ['fromDate', 'toDate']) as any;
      if (fromDate && toDate) {
        datas.fromDate = fromDate;
        datas.toDate = toDate;
      }

      const url = await earningService.exportCsv({
        ...datas,
        payoutStatus
      }, 'studio');
      const resp = (await downloadCsv(url, 'studio_earning_export.csv')) as any;
      if (resp && resp.success) {
        message.success('Downloading, please check in Download folder');
      }
    } catch (error) {
      message.error('An error occurred, please try again!');
    }
  }

  setDateRanger(_, dateStrings: string[]) {
    if (!dateStrings[0] && !dateStrings[1]) {
      this.setState({
        toDate: null,
        fromDate: null,
        sortBy: 'createdAt',
        sort: 'desc'
      });
      return;
    }

    if (!dateStrings[0] || !dateStrings[1]) return;
    this.setState({ fromDate: new Date(dateStrings[0]).toISOString(), toDate: new Date(dateStrings[1]).toISOString() });
  }

  filterByStatus(status: string) {
    this.setState({ payoutStatus: status });
  }

  render() {
    const {
      data,
      searching,
      total,
      // studio,
      stats,
      success,
      singularTextModel = 'Performer',
      pluralTextModel = 'Performers'
    } = this.props;
    const { limit, payoutStatus } = this.state;
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
      <div className={style['earning-history-page']}>
        <PageTitle title="Earning" />
        <PageHeader
          title="My Earning"
          extra={(
            <Button
              type="primary"
              onClick={this.onExportCsv.bind(this)}
              style={{ width: '100%' }}
            >
              Export CSV
            </Button>
       )}
        />
        <Row className="ant-page-header">
          <Col md={6} xs={24}>
            <div>
              <DatePicker.RangePicker
                disabledDate={() => searching}
                onCalendarChange={this.setDateRanger.bind(this)}
              />
            </div>
          </Col>
          {statuses.length ? (
            <Col md={8} xs={24}>
              <Select<string>
                style={{ width: '90%' }}
                onSelect={(val) => this.filterByStatus(val)}
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
          <Col md={10} xs={24}>
            {success && stats && (
            <Space size="large">
              <Statistic
                title={`Tokens received[Studio + ${pluralTextModel}]`}
                value={stats.data?.studioToModelTotalGrossPrice}
                precision={2}
              />
              <Statistic
                title="Studio share of tokens"
                value={(stats.data?.studioToModelTotalGrossPrice || 0) - (stats.data?.studioToModelTotalNetPrice || 0)}
                precision={2}
              />
              <Statistic
                title={`${singularTextModel} share of tokens`}
                value={stats.data?.studioToModelTotalNetPrice}
                precision={2}
              />
              <Statistic
                title="Paid Tokens"
                value={stats.data?.paidPrice || 0}
                precision={2}
              />
              <Statistic
                title="Unpaid Tokens"
                value={stats.data?.studioToModelTotalUnpaidGrossPrice}
                precision={2}
              />
            </Space>
            )}
          </Col>
        </Row>
        <EarningHistoryTable
          earnings={data}
          searching={searching}
          total={total}
          pageSize={limit}
          onChange={this.onChange.bind(this)}
          role_data="studio"
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  ...state.studio.earning,
  singularTextModel: state.ui.singularTextModel,
  pluralTextModel: state.ui.pluralTextModel,
  studio: state.studio.current
});
const mapDispatch = { getStudioEarning };
export default connect(mapStateToProps, mapDispatch)(PerformerProductsPage);
