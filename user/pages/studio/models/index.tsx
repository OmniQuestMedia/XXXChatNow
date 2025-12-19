import { studioService } from '@services/studio.service';
import { Col, message, Row } from 'antd';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { IPerformer, ISearch } from 'src/interfaces';
import { getResponseError, getSearchData } from 'src/lib';
import { getMembers, updateMemberStatus } from 'src/redux/studio/actions';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));
const StudioModelsSearch = dynamic(() => import('@components/studio/models-manager/search-online-status'), { ssr: false });
const StudioModelsTable = dynamic(() => import('@components/studio/models-manager/studio-models-table'), { ssr: false });

interface IProps {
  data: IPerformer[];
  total: number;
  searching: boolean;
  getMembers: Function;
  updateMemberStatus: Function;
  placeholderAvatarUrl: string;
  pluralTextModel: string;
}
interface IState {
  query: ISearch;
}

class StudioModelsPage extends PureComponent<IProps, IState> {
  static authenticate = 'studio';

  static layout = 'primary';

  constructor(props: IProps) {
    super(props);
    this.state = {
      query: {
        limit: 12,
        offset: 0,
        sortBy: 'createdAt',
        sort: 'desc'
      }
    };
  }

  componentDidMount() {
    const { getMembers: dispatchGetMembers } = this.props;
    const { query } = this.state;
    dispatchGetMembers(query);
  }

  componentDidUpdate(_, prevStates: IState) {
    const { getMembers: dispatchGetMembers } = this.props;
    const { query } = this.state;
    if (prevStates.query !== query) {
      dispatchGetMembers(query);
    }
  }

  handleTableChange(pagination, filters, sorter) {
    const { query } = this.state;
    this.setState({
      query: getSearchData(pagination, filters, sorter, query)
    });
  }

  onSearch(data) {
    const { query } = this.state;
    this.setState({ query: { ...query, ...data } });
  }

  async update(record: IPerformer) {
    try {
      const { updateMemberStatus: dispatchUpdateMemberStatus } = this.props;
      await studioService.updateMemberStatus(
        record._id,
        record.status === 'active' ? 'inactive' : 'active'
      );
      dispatchUpdateMemberStatus(record._id);
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    }
  }

  render() {
    const {
      data, searching, total, placeholderAvatarUrl, pluralTextModel = 'Performers'
    } = this.props;
    const { query } = this.state;
    return (
      <div className={style['studio-models-background']}>
        <PageTitle title={`Studio's ${pluralTextModel}`} />
        <PageHeader
          title={pluralTextModel}
          extra={(
            <Link href="/studio/models/add">
              <a>Add new member</a>
            </Link>
            )}
        />
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
          <StudioModelsTable
            dataSource={data}
            loading={searching}
            pagination={{
              pageSize: query.limit,
              current: Math.round(query.offset / query.limit) + 1,
              total
            }}
            update={this.update.bind(this)}
            onChange={this.handleTableChange.bind(this)}
            placeholderAvatarUrl={placeholderAvatarUrl}
          />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  ...state.studio.members,
  placeholderAvatarUrl: state.ui.placeholderAvatarUrl,
  pluralTextModel: state.ui.pluralTextModel
});
const mapDispatchs = { getMembers, updateMemberStatus };
export default connect(mapStateToProps, mapDispatchs)(StudioModelsPage);
