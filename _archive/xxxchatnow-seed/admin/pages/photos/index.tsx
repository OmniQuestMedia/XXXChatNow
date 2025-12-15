import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { SearchFilter } from '@components/common/search-filter';
import { TableListPhoto } from '@components/photo/table-list';
import { photoService } from '@services/photo.service';
import { message } from 'antd';
import Head from 'next/head';
import { PureComponent } from 'react';

interface IProps {
  performerId: string;
  galleryId: string;
}

class Photos extends PureComponent<IProps> {
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

  async componentDidMount() {
    if (this.props.performerId || this.props.galleryId) {
      await this.setState({
        filter: {
          ...this.state.filter,
          ...{
            performerId: this.props.performerId || '',
            galleryId: this.props.galleryId || ''
          }
        }
      });
    }
    this.search();
  }

  handleTableChange = (pagination, filters, sorter) => {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;
    this.setState({
      pagination: pager,
      sortBy: sorter.field || 'createdAt',
      sort: sorter?.order !== 'ascend' ? 'desc' : 'asc'
    }, () => {
      this.search(pager.current);
    });
  };

  handleFilter(filter) {
    this.setState({ filter }, () => {
      this.search();
    });
  }

  async search(page = 1) {
    try {
      this.setState({ searching: true });
      const resp = await photoService.search({
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

  async deletePhoto(id: string) {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }
    try {
      await photoService.delete(id);
      message.success('Deleted successfully');
      await this.search(this.state.pagination.current);
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(err.message || 'An error occurred, please try again!');
    }
  }

  render() {
    const { performerId, galleryId } = this.props;
    const { list, searching, pagination } = this.state;
    const statuses = [
      {
        key: '',
        text: 'All'
      },
      {
        key: 'draft',
        text: 'Draft'
      },
      {
        key: 'active',
        text: 'Active'
      },
      {
        key: 'inactive',
        text: 'Inactive'
      }
    ];

    return (
      <>
        <Head>
          <title>Photos</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Photos' }]} />
        <Page>
          <SearchFilter
            searchWithPerformer
            statuses={statuses}
            onSubmit={this.handleFilter.bind(this)}
            performerId={performerId || ''}
            searchWithGallery
            galleryId={galleryId || ''}
          />
          <div style={{ marginBottom: '20px' }} />
          <TableListPhoto
            dataSource={list}
            rowKey="_id"
            loading={searching}
            pagination={pagination}
            onChange={this.handleTableChange.bind(this)}
            deletePhoto={this.deletePhoto.bind(this)}
          />
        </Page>
      </>
    );
  }
}

export default Photos;
