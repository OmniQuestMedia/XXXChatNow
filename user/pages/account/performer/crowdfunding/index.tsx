import React, { useEffect, useState } from 'react';
import { Button, Dropdown, Menu, Table, message } from 'antd';
import Router from 'next/router';
import { crowdfundingService } from "@services/crowdfunding.service";
import { getResponseError } from "@lib/utils";
import PageHeader from "@components/common/layout/page-header";
import { EditOutlined ,DeleteOutlined, MenuOutlined } from '@ant-design/icons';
import Link from "next/link";

const CrowdfundingPage = () => {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [listCrowdfunding, setListCrowdfunding] = useState([]);

  const [pagination, setPagination] = useState({
    position: 'center'
  } as any);

  const [query] = useState({
    offset: 0,
    litmit: 10,
    sortBy: 'createdAt',
    sort: 'desc'
  });

  const getCrowdfundings = async () => {
    try {
      setLoading(true);
      const resp = await crowdfundingService.getCrowdfundings(query);
      setListCrowdfunding(resp.data.data);
      setPagination(resp.data.total);
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCrowdfundings();
  }, []);

  const handleDeleteCrowdfunding = async (id: string) => {
    if (!window.confirm('Are you sure to delete this fundraiser?')) {
      return;
    }

    try {
      setDeleting(true);
      await crowdfundingService.deleteCrowdfunding(id);
      message.success('Deleted successfully');
      getCrowdfundings();
    } catch (e) {
      const err = await Promise.resolve(e);
      message.error(getResponseError(err));
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      render(title: string) {
        return <span>{title}</span>
      }
    },
    {
      title: 'Descriptions',
      dataIndex: 'descriptions',
      render(descriptions: string) {
        return <span>{descriptions}</span>
      }
    },
    {
      title: 'Token',
      dataIndex: 'token',
      render(token: string) {
        return <span>{token}</span>
      }
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      render(createdAt: string) {
        return <span>{createdAt}</span>
      }
    },
    {
      title: 'Action',
      dataIndex: '_id',
      render(data, record: any) {
        return (
          <Dropdown
            overlay={(
              <Menu>
                <Menu.Item>
                  <Link href={{ pathname: '/account/performer/crowdfunding/update', query: { id: record._id } }}>
                    <a>
                      <EditOutlined />
                      {' '}
                      Update
                    </a>
                  </Link>
                </Menu.Item>
                <Menu.Item onClick={() => handleDeleteCrowdfunding(record._id)} disabled={deleting}>
                  <DeleteOutlined />
                  {' '}
                  Delete
                </Menu.Item>
              </Menu>
            )}
          >
            <Button><MenuOutlined /></Button>
          </Dropdown>  
        )
      }
    }
  ]

  return (
    <div>
    <PageHeader 
      title="List Crowdfunding"
      extra={
        <Button
          type="primary"
          onClick={() => Router.push('/account/performer/crowdfunding/create')}
        >
          Create a campaign
        </Button>
      }
    />
    <Table
      rowKey="_id"
      columns={columns}
      loading={loading}
      dataSource={listCrowdfunding}
      pagination={pagination}
    />
    </div>
  );
}

export default CrowdfundingPage;
