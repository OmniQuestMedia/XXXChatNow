import {
  CameraOutlined,
  EditOutlined,
  EyeOutlined,
  FileImageOutlined,
  SkinOutlined,
  VideoCameraOutlined
} from '@ant-design/icons';
import { BreadcrumbComponent, DropdownAction } from '@components/common';
import Page from '@components/common/layout/page';
import { SearchFilter } from '@components/performer/search-filter';
import { convertMiliSecsToSecs, formatDate } from '@lib/date';
import { downloadCsv } from '@lib/utils';
import { performerService } from '@services/performer.service';
import {
  message, Modal, Table, Tag
} from 'antd';
import Head from 'next/head';
import Link from 'next/link';
import { PureComponent } from 'react';
import { IPerformer } from 'src/interfaces';

interface IProps {
  studioId: string;
  status: string
}

class Performers extends PureComponent<IProps> {
  static async getInitialProps(ctx) {
    return ctx.query;
  }

  state = {
    pagination: {} as any,
    searching: false,
    list: [],
    limit: 10,
    filter: {} as any,
    sortBy: 'updatedAt',
    sort: 'desc',
    showModal: false,
    pickedPerformer: null as IPerformer
  };

  componentDidMount() {
    const { status } = this.props;
    this.search(1, status);
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      const { status } = this.props;
      this.search(1, status);
    }
  }

  async handleTableChange(pagination, _filters, sorter) {
    const pager = { ...this.state.pagination };
    pager.current = pagination.current;
    await this.setState({
      pagination: pager,
      sortBy: sorter.field || 'updatedAt',
      sort: sorter?.order !== 'ascend' ? 'desc' : 'asc'
    });
    this.search(pager.current);
  }

  handleFilter(filter) {
    this.setState({ filter }, () => {
      this.search();
    });
  }

  async onExportCsv(filter) {
    try {
      const page = 1;
      this.setState({ filter });
      const url = performerService.exportCsv({
        limit: this.state.limit,
        offset: (page - 1) * this.state.limit,
        ...this.state.filter,
        sort: this.state.sort,
        sortBy: this.state.sortBy
      });
      const resp = (await downloadCsv(url, 'performers_export.csv')) as any;
      if (resp && resp.success) {
        message.success('Downloading, please check in Download folder');
      }
    } catch (error) {
      message.error('An error occurred, please try again!');
    }
  }

  async search(page = 1, status = '') {
    try {
      const { studioId } = this.props;
      const { filter } = this.state;
      this.setState({ searching: true });
      if (status) {
        filter.status = status;
      }
      if (studioId) {
        filter.studioId = studioId;
      }
      const query = {
        ...filter,
        limit: this.state.limit,
        offset: (page - 1) * this.state.limit,
        sort: this.state.sort,
        sortBy: this.state.sortBy
      };
      const resp = await performerService.search(query);
      this.setState({
        filter,
        searching: false,
        list: resp.data.data,
        pagination: {
          ...this.state.pagination,
          total: resp.data.total
        }
      });
    } catch (e) {
      message.error('An error occurred, please try again!');
      this.setState({ searching: false });
    }
  }

  // showModal(performer: IPerformer) {
  //   this.setState({ showModal: true, pickedPerformer: performer });
  // }

  render() {
    const {
      list,
      searching,
      pagination,
      pickedPerformer,
      showModal
    } = this.state;
    const showPerformerStats = (performer: IPerformer) => {
      this.setState({ showModal: true, pickedPerformer: performer });
    };
    const closeModal = () => {
      this.setState({ showModal: false });
    };
    function PerformerStats() {
      return (
        <Modal
          title={`${pickedPerformer.username}'s Stats`}
          open={showModal}
          // footer={[
          //   <Button type="primary" onClick={closeModal}>
          //     Close
          //   </Button>
          // ]}
          footer={null}
          onCancel={closeModal}
        >
          <p>
            Total Favorites:
            {pickedPerformer?.stats?.favorites}
          </p>
          <p>
            Total Views:
            {pickedPerformer?.stats?.views}
          </p>
          <p>
            Total Galleries:
            {pickedPerformer?.stats?.totalGalleries}
          </p>
          <p>
            Total Photos:
            {pickedPerformer?.stats?.totalPhotos}
          </p>
          <p>
            Total Videos:
            {pickedPerformer?.stats?.totalVideos}
          </p>
          <p>
            Total Products:
            {pickedPerformer?.stats?.totalProducts}
          </p>
          <p>
            Total Stream Time (HH:mm:ss):
            {' '}
            {convertMiliSecsToSecs(pickedPerformer?.stats?.totalStreamTime || 0)}
          </p>
          <p>
            Total Tokens Earned:
            {(pickedPerformer?.stats?.totalTokenEarned || 0).toFixed(2)}
          </p>
          <p>
            Total Tokens Spent:
            {(pickedPerformer?.stats?.totalTokenSpent || 0).toFixed(2)}
          </p>
        </Modal>
      );
    }
    const columns = [
      {
        title: 'First name',
        dataIndex: 'firstName',
        sorter: true
      },
      {
        title: 'Last name',
        dataIndex: 'lastName',
        sorter: true
      },
      {
        title: 'Username',
        dataIndex: 'username',
        sorter: true
      },
      {
        title: 'Studio',
        dataIndex: 'studioInfo',
        render: (studioInfo) => studioInfo?.name || 'N/A'
      },
      {
        title: 'Email',
        dataIndex: 'email',
        sorter: true
      },
      {
        title: 'Gender',
        dataIndex: 'gender',
        sorter: true,
        render(gender) {
          return <Tag color="orange">{gender}</Tag>;
        }
      },
      {
        title: 'Stats',
        key: 'performerStats',
        render(_, record: IPerformer) {
          return (
            <EyeOutlined
              onClick={() => {
                showPerformerStats(record);
              }}
            />
          );
        }
      },
      {
        title: 'Email Verified',
        dataIndex: 'emailVerified',
        render(emailVerified) {
          return emailVerified ? <Tag color="green">Y</Tag> : <Tag color="red">N</Tag>;
        }
      },
      {
        title: 'Status',
        dataIndex: 'status',
        render(status) {
          switch (status) {
            case 'active':
              return <Tag color="green">Active</Tag>;
            case 'inactive':
              return <Tag color="red">Inactive</Tag>;
            case 'pending-email-confirmation':
              return <Tag color="default">Pending</Tag>;
            default: return <Tag color="default">{status}</Tag>;
          }
        }
      },
      {
        title: 'CreatedAt',
        dataIndex: 'createdAt',
        sorter: true,
        render(date: Date) {
          return <span>{formatDate(date)}</span>;
        }
      },
      {
        title: 'Actions',
        dataIndex: '_id',
        render(id: string) {
          return (
            <DropdownAction
              menuOptions={[
                {
                  key: 'update',
                  name: 'Update',
                  children: (
                    <Link
                      href={{
                        pathname: '/performer/update',
                        query: { id }
                      }}
                      as={`/performer/update?id=${id}`}
                    >
                      <a>
                        <EditOutlined />
                        {' '}
                        Update
                      </a>
                    </Link>
                  )
                },
                {
                  key: 'photo',
                  name: 'Photos',
                  children: (
                    <Link
                      href={{
                        pathname: '/photos',
                        query: { performerId: id }
                      }}
                      as={`/photos?performerId=${id}`}
                    >
                      <a>
                        <CameraOutlined />
                        {' '}
                        Photos
                      </a>
                    </Link>
                  )
                },
                {
                  key: 'gallery',
                  name: 'Galleries',
                  children: (
                    <Link
                      href={{
                        pathname: '/gallery',
                        query: { performerId: id }
                      }}
                      as={`/gallery?performerId=${id}`}
                    >
                      <a>
                        <FileImageOutlined />
                        {' '}
                        Galleries
                      </a>
                    </Link>
                  )
                },
                {
                  key: 'video',
                  name: 'Videos',
                  children: (
                    <Link
                      href={{
                        pathname: '/video',
                        query: { performerId: id }
                      }}
                      as={`/video?performerId=${id}`}
                    >
                      <a>
                        <VideoCameraOutlined />
                        {' '}
                        Videos
                      </a>
                    </Link>
                  )
                },
                {
                  key: 'product',
                  name: 'Products',
                  children: (
                    <Link
                      href={{
                        pathname: '/product',
                        query: { performerId: id }
                      }}
                      as={`/product?performerId=${id}`}
                    >
                      <a>
                        <SkinOutlined />
                        {' '}
                        Products
                      </a>
                    </Link>
                  )
                }
              ]}
            />
          );
        }
      }
    ];
    return (
      <>
        <Head>
          <title>Performers</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Performers' }]} />
        <Page>
          <SearchFilter
            onSubmit={this.handleFilter.bind(this)}
            onExportCsv={this.onExportCsv.bind(this)}
          />
          <div style={{ marginBottom: '20px' }} />
          <Table
            dataSource={list}
            columns={columns}
            rowKey="_id"
            loading={searching}
            pagination={pagination}
            onChange={this.handleTableChange.bind(this)}
            scroll={{ x: 1500, y: 650 }}
          />
          {showModal && <PerformerStats />}
        </Page>
      </>
    );
  }
}

export default Performers;
