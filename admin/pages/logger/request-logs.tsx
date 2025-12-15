import {
  EyeOutlined
} from '@ant-design/icons';
import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { formatDate } from '@lib/date';
import { loggerService } from '@services/logger.service';
import {
  Modal,
  Table
} from 'antd';
import { truncate } from 'lodash';
import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';

export function RequestLogs() {
  const [data, setData] = useState({
    data: [],
    total: 0
  });
  const [fetching, setFetching] = useState(false);
  const [details, setDetails] = useState(null);
  const LIMIT = 10;
  const page = useRef(1);

  const columns = [
    {
      title: 'ID',
      dataIndex: '_id'
    },
    {
      title: 'Path',
      dataIndex: 'path'
    },
    {
      title: 'Message',
      dataIndex: '_id',
      render(_id, record: any) {
        const d = JSON.stringify(record);

        return (
          <pre>
            {truncate(d, {
              length: 20
            })}
          </pre>
        );
      }
    },
    {
      title: 'Created at',
      dataIndex: 'createdAt',
      render(date: Date) {
        return <span>{formatDate(date)}</span>;
      }
    },
    {
      title: 'Actions',
      dataIndex: '_id',
      render: (id: string, record: any) => <EyeOutlined onClick={() => setDetails(record)} />
    }
  ];

  const search = async () => {
    setFetching(true);
    const offset = (page.current - 1) * LIMIT;
    const resp = await loggerService.findRequestLogs({
      offset,
      limit: LIMIT
    });
    setData(resp.data);
    setFetching(false);
  };

  const onChange = (p) => {
    page.current = p.current;
    search();
  };

  useEffect(() => {
    search();
  }, []);

  return (
    <>
      <Head>
        <title>Request logs</title>
      </Head>
      <BreadcrumbComponent breadcrumbs={[{ title: 'Request logs' }]} />
      <Page>
        <Table
          dataSource={data.data}
          columns={columns}
          rowKey="_id"
          loading={fetching}
          pagination={{
            total: data.total,
            pageSize: LIMIT,
            showSizeChanger: false
          }}
          onChange={onChange}
        />

        {details
        && (
        <Modal
          open={details}
          onOk={() => setDetails(null)}
          onCancel={() => setDetails(null)}
          footer={null}
          width="large"
          title={details._id}
        >
          <pre>
            {JSON.stringify(details, null, 2)}
          </pre>
        </Modal>
        )}
      </Page>
    </>
  );
}

export default RequestLogs;
