import { HomeOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import PageTitle from '@components/common/page-title';
import { Button, Result } from 'antd';
import Router from 'next/router';

function PaymentSuccess() {
  return (
    <div className="main-container">
      <PageTitle title="Payment success" />
      <Result
        status="success"
        title="Payment Success"
        subTitle="Hi there, your payment has been successfully processed"
        extra={[
          <Button className="secondary" key="console" onClick={() => Router.push('/')}>
            <HomeOutlined />
            BACK HOME
          </Button>,
          <Button key="contact" className="primary" onClick={() => Router.push('/contact-us')}>
            <QuestionCircleOutlined />
            CONTACT US
          </Button>
        ]}
      />
    </div>
  );
}

export default PaymentSuccess;
