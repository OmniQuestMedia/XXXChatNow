import { PlusOutlined } from '@ant-design/icons';
import { TableListWheelOptions } from '@components/wheel/table-list';
import { wheelService } from '@services/index';
import {
  Button, Layout, message, PageHeader
} from 'antd';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { IUIConfig } from 'src/interfaces';

import s from './index.module.less';

function WheelOptionsListingPage() {
  const ui: IUIConfig = useSelector((state: any) => state.ui);
  const router = useRouter();
  const [options, setOptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    try {
      setLoading(true);
      const resp = await wheelService.myList({
        limit: 10,
        offset: 0
      });
      setOptions(resp.data.data);
      setTotal(resp.data.total);
    } catch (error) {
      message.error('Something went wrong. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  const deleteOption = async (id: string) => {
    if (!window.confirm('Are you sure want to delete this option?')) return;
    try {
      setLoading(false);
      await wheelService.delete(id);
      message.success('Deleted success!');
      search();
    } catch (e) {
      const err = (await Promise.resolve(e)) || {};
      message.error(err.message || 'An error occurred, please try again!');
    } finally {
      setLoading(false);
    }
  };

  const onClickCreate = () => {
    if (total >= 7) {
      message.error('You can not create more than 7 options');
      return;
    }
    router.push('/account/performer/wheel/create');
  };

  useEffect(() => {
    search();
  }, []);

  return (
    <Layout>
      <Head>
        <title>
          {`${ui.siteName} | My Wheel-Options`}
        </title>
      </Head>
      <div className={s['setting-wheel-page']}>
        <PageHeader
          title="My Wheel-Options"
        />
        <div>
          <Button type="primary" className="secondary" onClick={() => onClickCreate()}>
            <a>
              <PlusOutlined />
              {' '}
              Create New
            </a>
          </Button>
        </div>
        <div className="table-responsive">
          <TableListWheelOptions
            dataSource={options as any}
            rowKey="_id"
            loading={loading}
            deleteOption={deleteOption.bind(this)}
          />
        </div>
      </div>
    </Layout>
  );
}

WheelOptionsListingPage.authenticate = true;
WheelOptionsListingPage.onlyPerformer = true;
WheelOptionsListingPage.layout = 'primary';

export default WheelOptionsListingPage;
