import { Button, Form, Input } from 'antd';

import style from './referral-link.module.less';

interface IProps {
  linkReferral: string;
  loading: boolean;
  copyLink: Function;
}

function ReferralLink({ linkReferral, loading, copyLink }: IProps) {
  return (
    <Form className={style['referral-link']}>
      <Form.Item>
        <div className="referral-code">
          <Input value={linkReferral} />
          <Button className="primary" disabled={loading || !linkReferral} onClick={() => copyLink()}>COPY LINK</Button>
        </div>
      </Form.Item>
    </Form>
  );
}

export default ReferralLink;
