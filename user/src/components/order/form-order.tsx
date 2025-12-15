/* eslint-disable react/require-default-props */

import { DownloadOutlined } from '@ant-design/icons';
import NumberFormat from '@components/common/layout/numberformat';
import Page from '@components/common/layout/page';
import { PerformerUsername } from '@components/performer';
import {
  Button, Form, Input, Select, Space,
  Tag
} from 'antd';
import Router from 'next/router';
import React from 'react';
import { OrderStatus } from 'src/components/order';
import { IOrder } from 'src/interfaces';

import style from './detail.module.less';

interface IProps {
  order: IOrder;
  loading: boolean;
  isUpdating: boolean;
  onFinish: any;
  disableUpdate: boolean;
  isUser?: boolean;
  onDownloadClick?: any;
}

export function FormOrder({
  order,
  loading,
  isUpdating,
  onFinish,
  disableUpdate,
  isUser,
  onDownloadClick
}: IProps) {
  return (
    <Page>
      {order && (
        <div className="main-container">
          <Form
            onFinish={onFinish}
            initialValues={order}
            id={style['form-update-order']}
          >
            <Form.Item wrapperCol={{ sm: { span: 12 } }}>
              <Tag color="magenta">
                #
                {order.orderNumber}
              </Tag>
            </Form.Item>
            <Form.Item label="Buyer">
              {order?.buyerInfo?.displayName || order.buyerInfo?.username || 'N/A'}
            </Form.Item>
            <Form.Item label="Seller">
              {order.sellerSource === 'system' ? (
                'System'
              ) : order?.sellerInfo ? (
                <PerformerUsername performer={order.sellerInfo} />
              ) : (
                'N/A'
              )}
            </Form.Item>
            <Form.Item label="Product name"><div style={{ wordBreak: 'break-word' }}>{order.name}</div></Form.Item>
            <Form.Item label="Product info"><div style={{ wordBreak: 'break-word' }}>{order.description}</div></Form.Item>
            {order.productType === 'digital' && isUser ? (
              <Form.Item>
                <Button icon={<DownloadOutlined />} onClick={onDownloadClick}>
                  Click to Download
                </Button>
              </Form.Item>
            ) : null}

            <Form.Item label="Quantity">{order.quantity}</Form.Item>
            <Form.Item label="Total Price">
              {order.payBy === 'token' ? (
                <NumberFormat value={order.totalPrice} suffix=" tokens" />
              ) : (
                <span>
                  $
                  <NumberFormat value={order.totalPrice} />
                </span>
              )}
            </Form.Item>
            {order.productType === 'physical' ? (
              <>
                <Form.Item label="Delivery Address">
                  {order.deliveryAddress || 'N/A'}
                </Form.Item>
                <Form.Item label="Delivery Postal Code">
                  {order.postalCode || 'N/A'}
                </Form.Item>
                <Form.Item name="shippingCode" label="Shipping Code">
                  {!isUser ? (
                    <Input placeholder="Enter shipping code here" />
                  ) : (
                    order.shippingCode
                  )}
                </Form.Item>
              </>
            ) : null}

            {!disableUpdate && order.productType === 'physical' ? (
              <Form.Item name="deliveryStatus" label="Delivery Status">
                <Select>
                  <Select.Option key="processing" value="processing">
                    Processing
                  </Select.Option>
                  <Select.Option key="shipping" value="shipping">
                    Shipping
                  </Select.Option>
                  <Select.Option key="delivered" value="delivered">
                    Delivered
                  </Select.Option>
                  <Select.Option key="refunded" value="refunded">
                    Refunded
                  </Select.Option>
                  <Select.Option key="created" value="created">
                    Pending
                  </Select.Option>
                </Select>
              </Form.Item>
            ) : null}

            {disableUpdate && order.productType === 'physical' && (
            <Form.Item name="deliveryStatus" label="Delivery Status">
              <OrderStatus status={order.deliveryStatus} />
            </Form.Item>
            )}

            <Form.Item>
              <Space>
                <Button type="primary" onClick={() => Router.back()}>
                  Back
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isUpdating}
                  disabled={loading}
                  hidden={disableUpdate}
                >
                  Update
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      )}
    </Page>
  );
}

export default FormOrder;
