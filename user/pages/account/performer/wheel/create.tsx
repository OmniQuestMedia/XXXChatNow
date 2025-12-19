import { ArrowLeftOutlined } from '@ant-design/icons';
import { CreateWheelOptionForm } from '@components/wheel/create-form';
import { wheelService } from '@services/index';
import {
  Layout, message, PageHeader
} from 'antd';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { IUIConfig } from 'src/interfaces';

function CreateWheelOptionsPage() {
  const ui: IUIConfig = useSelector((state: any) => state.ui);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onClickCreate = async (payload) => {
    try {
      const data = { ...payload, color: payload.color.hex };
      setLoading(true);
      await wheelService.create(data);
      message.success('Wheel option created successfully');
      router.push('/account/performer/wheel');
    } catch (error) {
      const err = (await Promise.resolve(error)) || {};
      message.error(err.message || 'An error occurred, please try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>
          {ui && ui.siteName}
          {' '}
          | New Wheel-Option
        </title>
      </Head>
      <div className="main-container">
        <PageHeader
          onBack={() => router.back()}
          backIcon={<ArrowLeftOutlined />}
          title="New Wheel-Option"
        />
        <CreateWheelOptionForm
          onFinish={onClickCreate.bind(this)}
          loading={loading}
          option={{} as any}
        />
      </div>
    </Layout>
  );
}

CreateWheelOptionsPage.authenticate = true;
CreateWheelOptionsPage.onlyPerformer = true;
CreateWheelOptionsPage.layout = 'primary';

export default CreateWheelOptionsPage;
