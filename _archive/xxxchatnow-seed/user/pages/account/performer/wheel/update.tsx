import { ArrowLeftOutlined } from '@ant-design/icons';
import { CreateWheelOptionForm } from '@components/wheel/create-form';
import { IWheelOption } from '@interfaces/index';
import { redirect404 } from '@lib/utils';
import { wheelService } from '@services/index';
import {
  Layout, message, PageHeader
} from 'antd';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { IUIConfig } from 'src/interfaces';

interface IProps {
  option: IWheelOption
}

function CreateWheelOptionsPage({ option }: IProps) {
  const ui: IUIConfig = useSelector((state: any) => state.ui);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (payload) => {
    try {
      const data = { ...payload, color: payload.color.hex };
      setLoading(true);
      await wheelService.update(option._id, data);
      message.success('Wheel option updated successfully');
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
          | Update Wheel-Option
        </title>
      </Head>
      <div className="main-container">
        <PageHeader
          onBack={() => router.back()}
          backIcon={<ArrowLeftOutlined />}
          title="Update Wheel-Option"
        />
        <CreateWheelOptionForm
          onFinish={onFinish.bind(this)}
          loading={loading}
          option={option}
        />
      </div>
    </Layout>
  );
}

CreateWheelOptionsPage.authenticate = true;
CreateWheelOptionsPage.onlyPerformer = true;
CreateWheelOptionsPage.layout = 'primary';

CreateWheelOptionsPage.getInitialProps = async (ctx) => {
  try {
    const { query } = ctx;
    const resp = await wheelService.findById(query.id);
    return { option: resp.data };
  } catch (e) {
    return redirect404(ctx);
  }
};

export default CreateWheelOptionsPage;
