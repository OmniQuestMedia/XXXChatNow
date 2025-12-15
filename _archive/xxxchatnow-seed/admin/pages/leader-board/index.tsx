import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import LeaderBoardTableList from '@components/leader-board/leader-board-table-list';
import { getResponseError } from '@lib/utils';
import { leaderBoardService } from '@services/leader-board.service';
import { message } from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';

interface IProps {
  performerId: string;
}

class LeaderBoardListing extends PureComponent<IProps> {
  static async getInitialProps(ctx) {
    return ctx.query;
  }

  state = {
    pagination: {} as any,
    searching: false,
    list: [] as any,
    limit: 10,
    filter: {} as any,
    sortBy: 'createdAt',
    sort: 'desc'
  };

  componentDidMount() {
    if (this.props.performerId) {
      this.setState({
        filter: {
          ...this.state.filter,
          ...{ performerId: this.props.performerId }
        }
      }, () => {
        this.search();
      });
    } else {
      this.search();
    }
  }

  handleTableChange = (pagination, _filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;
    this.setState({
      pagination: pager,
      sortBy: sorter.field || 'createdAt',
      sort: sorter?.order !== 'ascend' ? 'desc' : 'asc'
    });
    this.search(pager.current);
  };

  async handleDeleteLeaderBoard(id: string) {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    try {
      await leaderBoardService.deleteOne(id);
      message.success('Deleted success');
      await this.search(this.state.pagination.current);
    } catch (err: any) {
      const error = await Promise.resolve(err);
      message.error(getResponseError(error));
    }
  }

  async search(page = 1) {
    try {
      this.setState({ searching: true });
      const resp = await leaderBoardService.search({
        ...this.state.filter,
        limit: this.state.limit,
        offset: (page - 1) * this.state.limit,
        sort: this.state.sort,
        sortBy: this.state.sortBy
      });
      this.setState({
        searching: false,
        list: resp.data.data,
        pagination: {
          ...this.state.pagination,
          total: resp.data.total,
          pageSize: this.state.limit
        }
      });
    } catch (e) {
      message.error('An error occurred, please try again!');
      this.setState({ searching: false });
    }
  }

  render() {
    const { list, searching, pagination } = this.state;

    return (
      <>
        <Head>
          <title>Leader Boards</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[{ title: 'Leader Boards' }]}
        />
        <Page>
          <div style={{ marginBottom: '20px' }} />
          <LeaderBoardTableList
            dataSource={list}
            loading={searching}
            pagination={pagination}
            onChange={this.handleTableChange.bind(this)}
            deleteLeaderBoard={this.handleDeleteLeaderBoard.bind(this)}
          />
        </Page>
      </>
    );
  }
}

export default LeaderBoardListing;
