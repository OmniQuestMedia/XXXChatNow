/* eslint-disable react/require-default-props */
/* eslint-disable no-return-assign */
import Popup from '@components/common/base/popup';
import NumberFormat from '@components/common/layout/numberformat';
import {
  Form, Input, InputNumber, message
} from 'antd';
import { FormInstance } from 'antd/lib/form';
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import {
  capitalizeFirstLetter,
  getResponseError,
  isPhysicalProduct
} from 'src/lib';
import { purchaseItemService } from 'src/services';

import style from './modal-buy-assets.module.less';

interface IProps {
  onSucess?: Function;
  onError?: Function;
  loggedIn?: boolean;
  updateCurrentUserBalance?: Function;
}

const ModalBuyAssets = forwardRef(({
  onSucess, onError, loggedIn, updateCurrentUserBalance
}: IProps, parrentRef) => {
  let form: FormInstance;
  const popupRef = useRef(null);
  const [type, setType] = useState('product');
  const [purchasing, setPurchasing] = useState(false);
  const [item, setItem] = useState(undefined);
  const [footer] = useState([]);
  const [postalCode, setPostalCode] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [quantity, setQuantity] = useState(1);

  const submit = async () => {
    const formError = form.getFieldsError().find((f) => f.errors.length);
    if (formError) return;
    try {
      await purchaseItemService.purchaseItem(
        item._id,
        type,
        form.getFieldsValue()
      );
      if (type === 'product' && item.type === 'digital') {
        message.success('Please check your email to view the digital product');
      } else {
        message.success('Purchased Success');
      }
      updateCurrentUserBalance
        && updateCurrentUserBalance(parseInt(item.token, 10) * quantity * -1);
      onSucess && onSucess(type, item._id, { isBought: true });
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
      onError && onError(error);
    } finally {
      popupRef && popupRef.current.setVisible(false);
      setPurchasing(false);
    }
  };

  const onOk = async () => {
    if (!loggedIn) {
      message.error('Please login to buy this item!');
      return;
    }

    setPurchasing(true);
    isPhysicalProduct(item) ? form.submit() : submit();
  };

  const handleValueChange = (values) => {
    setPostalCode(values.postalCode);
    setDeliveryAddress(values.deliveryAddress);
    setQuantity(values.quantity);
  };

  const showModalBuyAssets = (itemData, productType) => {
    setItem(itemData);
    setType(productType);
    popupRef && popupRef.current.setVisible(true);
  };

  useImperativeHandle(parrentRef, () => ({
    showModalBuyAssets
  }), []);

  return (
    <Popup
      footer={footer}
      title={`Buy ${capitalizeFirstLetter(type)}`}
      okText="Purchase"
      ref={popupRef}
      onOk={onOk.bind(this)}
      loading={purchasing}
      content={
        item && (
          <>
            <Form
              initialValues={{
                postalCode,
                deliveryAddress,
                quantity
              }}
              layout="vertical"
              ref={(ref) => (form = ref)}
              onValuesChange={(_, values: any) => handleValueChange(values)}
              hidden={!isPhysicalProduct(item)}
              onFinish={submit.bind(this)}
              onFinishFailed={() => setPurchasing(false)}
            >
              <Form.Item
                name="deliveryAddress"
                rules={[
                  {
                    required: true,
                    message: 'Please provide delivery address!'
                  }
                ]}
                label="Delivery Address"
              >
                <Input placeholder="Enter your address" />
              </Form.Item>
              <Form.Item name="postalCode" label="Postal Code">
                <Input placeholder="Enter your postal code" />
              </Form.Item>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[
                  {
                    validator(_, value) {
                      if (parseInt(value, 10) < 1) {
                        return Promise.reject(
                          new Error('Quantity must be positive!')
                        );
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber
                  placeholder="Enter quantity"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item>
                <div>
                  {type === 'video' && (
                    <strong>Available high-res Video</strong>
                  )}
                  {type === 'gallery' && (
                    <strong>Available high-res Image</strong>
                  )}
                  {quantity === 1 && (
                    <h3>
                      Buy this
                      <span className={style.color}>
                        {' '}
                        {item.name || item.title}
                        {' '}
                      </span>
                      For
                      <span className={style.color}>
                        {' '}
                        <NumberFormat value={item.token} />
                        {' '}
                      </span>
                      Tokens
                    </h3>
                  )}
                  {quantity > 1 && (
                    <h3>
                      <NumberFormat
                        prefix={`Buy x${quantity} ${item.name || item.title} For `}
                        value={parseInt(item.token, 10) * quantity}
                        suffix=" Tokens"
                      />
                    </h3>
                  )}
                </div>
              </Form.Item>
            </Form>
            <NumberFormat
              hidden={isPhysicalProduct(item)}
              value={parseInt(item.token, 10) * quantity}
              prefix={`Buy ${item.name || item.title} For `}
              suffix=" Tokens"
            />
          </>
        )
      }
    />
  );
});

export default ModalBuyAssets;
