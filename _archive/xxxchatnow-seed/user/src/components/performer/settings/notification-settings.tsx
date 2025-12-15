import { formatDate } from '@lib/date';
import { getResponseError } from '@lib/utils';
import { notificationService as pushNotificationService } from '@services/notification.service';
import {
  Button, message, Space, Table, TablePaginationConfig
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useFCM } from 'src/firebase/app';

export default function NotificationSettings() {
  const [notification, setNotification] = useState({
    data: [],
    total: 0
  });
  const [loading, setLoading] = useState(false);

  const { requestToken, token } = useFCM();

  const search = async (page = 1) => {
    try {
      setLoading(true);
      const res = await pushNotificationService.search({
        limit: 10,
        offset: (page - 1) * 10
      });
      setNotification(res.data);
    } catch (e) {
      const error = await e;
      message.error(getResponseError(error));
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async () => {
    try {
      const registrationToken = await requestToken();

      await pushNotificationService.create({
        userAgent: navigator.userAgent,
        registrationToken
      });
      message.success('Subscribe success');
      search();
    } catch (e) {
      const error = await e;
      message.error(getResponseError(error));
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm('Are you sure to delete this item?')) return;
    try {
      await pushNotificationService.delete(id);
      message.success('Delete success');
      // search();
      window.location.reload();
    } catch (e) {
      const error = await e;
      message.error(getResponseError(error));
    }
  };

  const unsubscribe = async () => {
    if (!window.confirm('Are you sure to cancel the subscription?')) return;
    try {
      const data = notification.data.find((item) => item.registrationToken === token);
      await pushNotificationService.delete(data._id);
      message.success('Delete success');
      window.location.reload();
    } catch (e) {
      const error = await e;
      message.error(getResponseError(error));
    }
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    search(pagination.current);
  };

  const columns = [{
    title: 'Push Notification Token',
    dataIndex: 'registrationToken',
    key: 'registrationToken',
    width: '300px',
    textWrap: 'word-break',
    render: (tk: string) => tk.slice(0, 40)
  },
  {
    title: 'User Agent',
    dataIndex: 'userAgent',
    key: 'userAgent',
    width: '200px'
  }, {
    title: 'Date',
    key: 'date',
    dataIndex: 'createdAt',
    // width: '200px',
    render: (date: Date) => formatDate(date, 'DD/MM/YYYY HH:mm')
  }, {
    title: '#',
    key: 'action',
    render: (record: any) => (
      <Space>
        <Button onClick={() => onDelete(record._id)}> Delete</Button>
      </Space>
    )
  }];

  useEffect(() => {
    search();
  }, []);

  const isSubscribed = useMemo(() => notification.data.findIndex((item) => item.registrationToken === token) !== -1, [notification, token]);

  return (
    <div>
      <div>
        <Button disabled={loading} type="primary" onClick={isSubscribed ? unsubscribe : subscribe}>{isSubscribed ? 'Unsubscribe' : 'Subscribe'}</Button>
      </div>
      <br />
      <div className="table-responsive">
        <Table
          columns={columns}
          dataSource={notification.data}
          onChange={handleTableChange}
          pagination={{
            showSizeChanger: false,
            total: notification.total,
            pageSize: 10
          }}
        />
      </div>
    </div>
  );
}
