/* eslint-disable react/require-default-props */
import { Button, Modal } from 'antd';
import { ModalFuncProps } from 'antd/lib/modal/Modal';
import {
  forwardRef, ReactNode, useImperativeHandle, useState
} from 'react';

import style from './popup.module.less';

interface IProps extends ModalFuncProps {
  footer?: ReactNode[];
  loading?: boolean;
  onOK?: Function;
  onCancel?: any;
}

const Popup = forwardRef(({
  content,
  footer = null,
  loading = false,
  onOK = () => { },
  onCancel = () => { },
  cancelText = 'Cancel',
  okText = 'OK',
  okButtonProps = {},
  ...props
}: IProps, ref) => {
  const [visible, setVisible] = useState(false);

  const onCancelHandler = () => {
    setVisible(false);
    onCancel();
  };

  useImperativeHandle(ref, () => ({
    setVisible
  }), []);

  let footerComp;
  if (footer) {
    footerComp = [
      <Button key="back" type="default" onClick={onCancelHandler}>
        {cancelText || 'Cancel'}
      </Button>,
      ...footer,
      <Button key="submit" type="primary" onClick={() => onOK()} loading={loading} {...okButtonProps}>
        {okText || 'OK'}
      </Button>
    ];
  } else {
    footerComp = [
      <Button key="back" type="default" onClick={onCancelHandler}>
        {cancelText}
      </Button>,
      <Button key="submit" type="primary" onClick={() => onOK()} disabled={loading} loading={loading} {...okButtonProps}>
        {okText}
      </Button>
    ];
  }
  return (
    <Modal
      {...props}
      visible={visible}
      centered
      closeIcon
      className={style.popup}
      {...(footerComp && footerComp.length && { footerComp })}
      onCancel={onCancelHandler}
    >
      {content}
    </Modal>
  );
});
export default Popup;
