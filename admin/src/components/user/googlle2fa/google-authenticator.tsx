import { Button, Col, Row } from 'antd';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const ModalQRGgAuthForm = dynamic(() => import('./modal-qr-google-authen'));
const Remove2FA = dynamic(() => import('./remove-2FA-authentication'));

type IProps = {
  user: any;
};

export default function GoogleFormAuthentication({ user }: IProps) {
  const [openModalCreateQR, setOpenModalCreateQR] = useState(false);
  const [openModalRemove2FA, setOpenModalRemove2FA] = useState(false);
  return (
    <>
      <Row>
        <Col xs={24} md={24}>
          <h3>Manage 2FA</h3>
          <p>
            Protect your account and content by enabling 2FA. You can use apps such as Authy, Google Authenticator and
            many others to view your 2FA codes.
          </p>
        </Col>
        <Col xs={24} md={24}>
          {user?.isTwoFactorAuthenticationEnabled ? (
            <Button type="primary" onClick={() => setOpenModalRemove2FA(true)}>
              Remove 2FA
            </Button>
          ) : (
            <Button type="primary" onClick={() => setOpenModalCreateQR(true)}>
              Setup 2 Factor Authentication
            </Button>
          )}
        </Col>
      </Row>
      <ModalQRGgAuthForm open={openModalCreateQR} onCancel={() => setOpenModalCreateQR(false)} />
      <Remove2FA open={openModalRemove2FA} onCancel={() => setOpenModalRemove2FA(false)} />
    </>
  );
}
