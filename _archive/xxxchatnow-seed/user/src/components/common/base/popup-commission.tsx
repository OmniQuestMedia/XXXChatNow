/* eslint-disable react/sort-comp */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-return-assign */
import './popup.module.less';

import {
  Button, Form, InputNumber, message, Modal
} from 'antd';
import { ModalFuncProps } from 'antd/lib/modal/Modal';
import React, {
  useEffect, useRef, useState
} from 'react';

interface IProps extends ModalFuncProps {
  loading?: boolean;
  onOK?: Function;
  onCancel?: any;
  forceRender?: any;
  submiting?: boolean;
  updatingPerformer?: any;
  onFinish: Function;
  defaultVisible?: boolean;
  ref?: any;
}

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 16 }
};

const validateMessages = {
  required: 'This field is required!'
};

function PopupCommission({
  updatingPerformer = {},
  submiting = false,
  onCancel = () => {},
  onFinish = () => {},
  defaultVisible = false,
  ...props
}: IProps) {
  const formRef = useRef(null);
  const [visible, setVisible] = useState(defaultVisible);
  const updatingPerformerRef = useRef(null);

  const handleChange = () => {
    formRef.current.setFieldsValue({
      tipCommission: updatingPerformer.commissionSetting.tipCommission,
      privateCallCommission: updatingPerformer.commissionSetting.privateCallCommission,
      groupCallCommission: updatingPerformer.commissionSetting.groupCallCommission,
      productCommission: updatingPerformer.commissionSetting.productCommission,
      albumCommission: updatingPerformer.commissionSetting.albumCommission,
      videoCommission: updatingPerformer.commissionSetting.videoCommission
    });
  };

  // did mount and did update
  useEffect(() => {
    if (updatingPerformer !== updatingPerformerRef.current) {
      handleChange();

      updatingPerformerRef.current = updatingPerformer;
    }
  });

  const onCancelHandler = () => {
    onCancel();
    setVisible(false);
  };

  const handleFinish = (values) => {
    onFinish(updatingPerformer._id, values);
  };

  return (
    <Modal
      {...props}
      visible={visible}
      centered
      closeIcon
      className="popup"
      onCancel={onCancelHandler}
      footer={null}
    >
      <Form
        ref={formRef}
        layout="vertical"
        name="form-update-commission"
        onFinish={handleFinish}
        onFinishFailed={() => message.error('Please complete the required fields.')}
        validateMessages={validateMessages}
      >
        <Form.Item
          name="tipCommission"
          label="Tip Commission"
          rules={[
            {
              validator: (_, value) => {
                if (parseInt(value, 10) > 0 && parseInt(value, 10) < 100) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    'Value must be greater than 0 and less than 100'
                  )
                );
              }
            }
          ]}
        >
          <InputNumber min={1} max={99} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="privateCallCommission"
          label="Private Call Commission"
          rules={[
            {
              validator: (_, value) => {
                if (parseInt(value, 10) > 0 && parseInt(value, 10) < 100) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    'Value must be greater than 0 and less than 100'
                  )
                );
              }
            }
          ]}
        >
          <InputNumber min={1} max={99} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="groupCallCommission"
          label="Group Call Commission"
          rules={[
            {
              validator: (_, value) => {
                if (parseInt(value, 10) > 0 && parseInt(value, 10) < 100) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    'Value must be greater than 0 and less than 100'
                  )
                );
              }
            }
          ]}
        >
          <InputNumber min={1} max={99} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="productCommission"
          label="Product Sale Commission"
          rules={[
            {
              validator: (_, value) => {
                if (parseInt(value, 10) > 0 && parseInt(value, 10) < 100) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    'Value must be greater than 0 and less than 100'
                  )
                );
              }
            }
          ]}
        >
          <InputNumber min={1} max={99} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="albumCommission"
          label="Album Sale Commission"
          rules={[
            {
              validator: (_, value) => {
                if (parseInt(value, 10) > 0 && parseInt(value, 10) < 100) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    'Value must be greater than 0 and less than 100'
                  )
                );
              }
            }
          ]}
        >
          <InputNumber min={1} max={99} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="videoCommission"
          label="Video Sale Commission"
          rules={[
            {
              validator: (_, value) => {
                if (parseInt(value, 10) > 0 && parseInt(value, 10) < 100) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    'Value must be greater than 0 and less than 100'
                  )
                );
              }
            }
          ]}
        >
          <InputNumber min={1} max={99} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item wrapperCol={{ ...layout.wrapperCol }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={submiting}
          >
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
export default PopupCommission;
