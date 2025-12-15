import { authService } from '@services/auth.service';
import { userService } from '@services/user.service';
import {
  Image, Input, message, Modal
} from 'antd';
import { useEffect, useState } from 'react';

type IProps = {
  open: boolean;
  onCancel: Function;
};

export default function SetUp2FA({ open, onCancel }: IProps) {
  const [qrCode, setQrCode] = useState<any>();
  const [codeInput, setCodeInput] = useState<Record<string, any>>();

  const loadQrCode = async () => {
    try {
      const { data } = await authService.getQrCode2FA();
      setQrCode(data);
    } catch (error) {
      message.error('An error occurred, please try again!');
    }
  };

  const handleCancel = () => {
    onCancel();
    setCodeInput(null);
  };

  const handleTurnOnOff2FA = async () => {
    try {
      await userService.turnOnOff2FA({ twoFactorAuthenticationCode: codeInput });
      message.success('Updated 2FA successfully!');
      handleCancel();
      window.location.reload();
    } catch (error) {
      const e = await error;
      message.error(e.message || 'An error occurred, please try again!');
    }
  };

  useEffect(() => {
    if (open) {
      loadQrCode();
    }
  }, [open]);

  return (
    <Modal
      title="Set Up 2FA"
      open={open}
      onCancel={() => handleCancel()}
      maskClosable={false}
      onOk={handleTurnOnOff2FA}
      okText="Verify"
    >
      <h3>Enter 2FA code from your app below to verify</h3>
      <div className="text-center">
        <Image className="text-center" src={qrCode} alt={qrCode} preview={false} />
      </div>
      <Input value={codeInput as any} onChange={(e: any) => setCodeInput(e.target.value)} placeholder="Enter your 2FA code" />
    </Modal>
  );
}
