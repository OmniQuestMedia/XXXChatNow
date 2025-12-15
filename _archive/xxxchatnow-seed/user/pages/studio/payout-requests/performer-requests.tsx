import { getResponseError, getSearchData } from '@lib/utils';
import { getPerformerRequest } from '@redux/studio/actions';
import { message } from 'antd';
import dynamic from 'next/dynamic';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { ISearch, PayoutRequestInterface } from 'src/interfaces';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const PayoutRequestList = dynamic(() => import('src/components/payout-request/studio-performer-request-table'), { ssr: false });

interface IProps {
  data: PayoutRequestInterface[];
  total: number;
  error: any;
  searching: boolean;
  getPerformerRequest: Function;
  singularTextModel: string;
}

interface IStates extends ISearch {
  filter?: any;
}

class PerformerPayoutRequestPage extends PureComponent<IProps, IStates> {
  static authenticate = 'studio';

  static layout = 'primary';

  constructor(props: IProps) {
    super(props);
    this.state = {
      limit: 12,
      offset: 0,
      sortBy: 'createdAt',
      sort: 'desc'
    };
  }

  componentDidMount() {
    const { getPerformerRequest: dispatchGetPerformerRequest } = this.props;
    dispatchGetPerformerRequest(this.state);
  }

  componentDidUpdate(preProps: IProps, prevStates: IStates) {
    const { getPerformerRequest: dispatchGetPerformerRequest, error } = this.props;
    if (prevStates !== this.state) {
      dispatchGetPerformerRequest(this.state);
    }

    if (error && error !== preProps.error) {
      message.error(getResponseError(error));
    }
  }

  onChange(pagination, filters, sorter) {
    const oldState = this.state;
    this.setState(getSearchData(pagination, filters, sorter, oldState));
  }

  render() {
    const {
      data, searching, total, singularTextModel = 'Performer'
    } = this.props;
    const { limit } = this.state;

    return (
      <div className={style['payout-request-page']}>
        <PageTitle title={`${singularTextModel} Payout Request`} />
        <PageHeader title={`${singularTextModel} Payout Request`} />
        <PayoutRequestList
          payouts={data}
          searching={searching}
          total={total}
          onChange={this.onChange.bind(this)}
          pageSize={limit}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  ...state.studio.performerRequests,
  singularTextModel: state.ui.singularTextModel
});
const mapDispatch = { getPerformerRequest };
export default connect(
  mapStateToProps,
  mapDispatch
)(PerformerPayoutRequestPage);
