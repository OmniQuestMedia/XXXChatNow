import { userService } from '@services/user.service';
import { Input, message, Modal } from 'antd';
import { useState } from 'react';

type IProps = {
  open: boolean;
  onCancel: Function;
};

export default function Remove2FA({ open, onCancel }: IProps) {
  const [codeInput, setCodeInput] = useState<Record<string, any>>();

  const handleCancel = () => {
    onCancel();
    setCodeInput(null);
  };

  const handleTurnOnOff2FA = async () => {
    try {
      await userService.turnOnOff2FA({ twoFactorAuthenticationCode: codeInput });
      message.success('Remove 2FA successfully!');
      window.location.reload();
      handleCancel();
    } catch (error) {
      const e = await error;
      message.error(e.message || 'An error occurred, please try again!');
    }
  };

  return (
    <Modal
      title="Remove 2FA"
      open={open}
      onCancel={() => handleCancel()}
      maskClosable={false}
      onOk={handleTurnOnOff2FA}
      okText="Remove"
    >
      <h3>To disable your 2fa, please type in your password and authenticator code. If you lost your authenticator, please contact support.</h3>
      <Input value={codeInput as any} onChange={(e: any) => setCodeInput(e.target.value)} placeholder="Enter your 2FA code" />
    </Modal>
  );
}
