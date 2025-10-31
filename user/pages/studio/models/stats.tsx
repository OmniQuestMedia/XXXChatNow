import { Col, Row } from 'antd';
import dynamic from 'next/dynamic';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { IPerformer, ISearch } from 'src/interfaces';
import { getSearchData } from 'src/lib';
import { getMembers } from 'src/redux/studio/actions';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const StudioModelsSearch = dynamic(() => import('@components/studio/models-manager/search-online-status'), { ssr: false });
const StudioModelStatsTable = dynamic(() => import('@components/studio/models-manager/studio-models-stats-table'), { ssr: false });

interface IProps {
  data: IPerformer[];
  total: number;
  searching: boolean;
  getMembers: Function;
  singularTextModel: string;
}
interface IState extends ISearch {
  limit: number;
  offset: number;
  sortBy: string;
  sort: string;
  filter?: any;
}

class StudioModelStatsPage extends PureComponent<IProps, IState> {
  static authenticate = 'studio';

  static layout = 'primary';

  constructor(props: IProps) {
    super(props);
    this.state = {
      limit: 12,
      offset: 0,
      sortBy: 'createdAt',
      sort: 'desc',
      filter: {}
    };
  }

  componentDidMount() {
    const { getMembers: dispatchGetMembers } = this.props;
    dispatchGetMembers(this.state);
  }

  componentDidUpdate(_, prevStates: IState) {
    const { getMembers: dispatchGetMembers } = this.props;
    if (prevStates !== this.state) {
      dispatchGetMembers(this.state);
    }
  }

  handleTableChange(pagination, filters, sorter) {
    const state = { ...this.state };
    this.setState(getSearchData(pagination, filters, sorter, state));
  }

  onSearch(data) {
    this.setState(data);
  }

  render() {
    const {
      data, searching, total, singularTextModel = 'Performer'
    } = this.props;
    const { limit } = this.state;
    return (
      <div className={style['studio-models-background']}>
        <PageTitle title={`${singularTextModel} Stats`} />
        <PageHeader title={`${singularTextModel} Stats`} />
        <div className={style['studio-models-box']}>
          <Row>
            <Col xs={24} sm={12}>
              <StudioModelsSearch
                searching={searching}
                onSearch={this.onSearch.bind(this)}
              />
            </Col>
            <Col xs={24} sm={12} />
          </Row>
          <StudioModelStatsTable
            data={data}
            searching={searching}
            total={total}
            onChange={this.handleTableChange.bind(this)}
            pageSize={limit}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  ...state.studio.members,
  singularTextModel: state.ui.singularTextModel
});
const mapDispatchs = { getMembers };
export default connect(mapStateToProps, mapDispatchs)(StudioModelStatsPage);
