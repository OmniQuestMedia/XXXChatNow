import { HomeOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import PageTitle from '@components/common/page-title';
import { Button, Result } from 'antd';
import Router from 'next/router';

interface P {
  title?: string;
}

function ErrorForbidden({ title = 'Forbidden Access' }: P) {
  return (
    <div className="main-container">
      <PageTitle title={title} />
      <Result
        status="403"
        title={title}
        subTitle="Sorry, you are not authorized to access this page."
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

export default ErrorForbidden;
