import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { ThumbnailBanner } from '@components/banner/thumbnail-banner';
import { BreadcrumbComponent } from '@components/common';
import { DropdownAction } from '@components/common/dropdown-action';
import Page from '@components/common/layout/page';
import { SearchFilter } from '@components/common/search-filter';
import { formatDate } from '@lib/date';
import { bannerService } from '@services/banner.service';
import { message, Table, Tag } from 'antd';
import Head from 'next/head';
import Link from 'next/link';
import { ReactElement, useEffect, useState } from 'react';

function Banners():ReactElement {
  const [list, setList] = useState([]);
  const [searching, setSearching] = useState(false);
  const [pagination, setPagination] = useState({} as any);
  const [filter, setFilter] = useState({});
  const [sort, setSort] = useState('desc');
  const [sortBy, setSortBy] = useState('createdAt');
  const limit = 10;

  const search = async (page = 1) => {
    try {
      setSearching(true);
      const resp = await bannerService.search({
        ...filter,
        limit,
        offset: (page - 1) * limit,
        sort,
        sortBy
      });
      setList(resp.data.data);
      setPagination({
        ...pagination,
        total: resp.data.total,
        pageSize: limit
      });
      setSearching(false);
    } catch (e) {
      message.error('An error occurred, please try again!');
      setSearching(false);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) {
      return;
    }
    try {
      await bannerService.delete(id);
      message.success('Deleted successfully');
      await search(pagination.current);
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(err.message || 'An error occurred, please try again!');
    }
  };

  const handleTableChange = async (paginate, filters, sorter) => {
    const pager = { ...pagination };
    pager.current = paginate.current;

    setPagination(pager);
    setSortBy(sorter.field || 'createdAt');
    setSort(sorter?.order !== 'descend' ? 'asc' : 'desc');

    search(pager.current);
  };

  const handleFilter = async (_filter) => {
    setFilter(_filter);
    search();
  };

  const statuses = [
    {
      key: '',
      text: 'All'
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

  const columns = [
    {
      title: '',
      dataIndex: 'thumbnail',
      render(data, record) {
        return <ThumbnailBanner banner={record} />;
      }
    },
    {
      title: 'Title',
      dataIndex: 'title',
      sorter: true
    },
    {
      title: 'Position',
      dataIndex: 'position',
      sorter: true
    },
    {
      title: 'Status',
      dataIndex: 'status',
      sorter: true,
      render(status: string) {
        switch (status) {
          case 'active':
            return <Tag color="green">Active</Tag>;
          case 'inactive':
            return <Tag color="red">Inactive</Tag>;
          default: return <Tag color="default">{status}</Tag>;
        }
      }
    },
    {
      title: 'Last update',
      dataIndex: 'updatedAt',
      sorter: true,
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      fixed: 'right' as 'right',
      render: (id: string) => (
        <DropdownAction
          menuOptions={[
            {
              key: 'update',
              name: 'Update',
              children: (
                <Link
                  href={{
                    pathname: '/banner/update',
                    query: { id }
                  }}
                  as={`/banner/update?id=${id}`}
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
              key: 'delete',
              name: 'Delete',
              children: (
                <span>
                  <DeleteOutlined />
                  {' '}
                  Delete
                </span>
              ),
              onClick: () => deleteBanner && deleteBanner(id)
            }
          ]}
        />
      )
    }
  ];

  useEffect(() => {
    search();
  }, []);

  return (
    <>
      <Head>
        <title>Banners</title>
      </Head>
      <BreadcrumbComponent breadcrumbs={[{ title: 'Banners' }]} />
      <Page>
        <SearchFilter statuses={statuses} onSubmit={handleFilter.bind(this)} />
        <div style={{ marginBottom: '20px' }} />
        <Table
          dataSource={list}
          columns={columns}
          rowKey="_id"
          loading={searching}
          pagination={pagination}
          onChange={handleTableChange.bind(this)}
          scroll={{ x: 700, y: 650 }}
        />
      </Page>
    </>
  );
}

export default Banners;
