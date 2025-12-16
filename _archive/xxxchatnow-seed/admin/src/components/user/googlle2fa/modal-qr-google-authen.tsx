import { Button, Modal } from 'antd';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const SetUp2FA = dynamic(() => import('./modal-QR'));

type IProps = {
  open: boolean;
  onCancel: Function;
};

export default function ModalQRGgAuthForm({ open, onCancel }: IProps) {
  const [openModal, setOpenModal] = useState(false);
  const handleOpenSetup = () => {
    setOpenModal(true);
    onCancel();
  };
  return (
    <>
      <Modal
        open={open}
        onCancel={() => onCancel()}
        title="Set Up 2FA"
        okButtonProps={{ style: { display: 'none' } }}
        maskClosable={false}
      >
        <h3>
          To enable the 2FA please click on the create button below and scan the QR code with your favorite authenticator app. If scanning the QR code does not work, you can manually enter the private key by clicking the show private key button after creating the 2FA.
        </h3>
        <Button type="primary" onClick={handleOpenSetup}>Create 2FA QR code</Button>
      </Modal>
      <SetUp2FA open={openModal} onCancel={() => setOpenModal(false)} />
    </>
  );
}
