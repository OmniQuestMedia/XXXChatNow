import { BreadcrumbComponent } from '@components/common/breadcrumb';
import Page from '@components/common/layout/page';
import { getResponseError } from '@lib/utils';
import {
  Button, Input, message, Select
} from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { PureComponent } from 'react';
import { orderService } from 'src/services';

interface IProps {
  id: string;
}

interface IStates {
  order: any;
  shippingCode: string;
  deliveryStatus: string;
}

class OrderDetailPage extends PureComponent<IProps, IStates> {
  static authenticate = true;

  static onlyPerformer = true;

  static async getInitialProps(ctx) {
    return ctx.query;
  }

  constructor(props: IProps) {
    super(props);
    this.state = {
      order: null,
      shippingCode: '',
      deliveryStatus: ''
    };
  }

  componentDidMount() {
    this.getData();
  }

  async onUpdate() {
    const { deliveryStatus, shippingCode } = this.state;
    if (!shippingCode) {
      message.error('Missing shipping code');
      return;
    }
    try {
      await orderService.update(this.props.id, {
        deliveryStatus,
        shippingCode
      });
      message.success('Changes saved.');
    } catch (e) {
      message.error(getResponseError(e));
    } finally {
      Router.push('/order');
    }
  }

  async getData() {
    try {
      const order = await orderService.findById(this.props.id);
      await this.setState({
        order: order.data,
        shippingCode: order.data.shippingCode,
        deliveryStatus: order.data.deliveryStatus
      });
    } catch (e) {
      message.error('Can not find order!');
    }
  }

  render() {
    const { order } = this.state;
    return (
      <>
        <Head>
          <title>Order Details</title>
        </Head>
        <BreadcrumbComponent
          breadcrumbs={[
            { title: 'Orders', href: '/order' },
            {
              title: `#${order?.orderNumber}`
            }
          ]}
        />
        <Page>
          {order && (
            <div className="main-container">
              <div style={{ marginBottom: '10px' }}>
                <b>
                  #
                  {order?.orderNumber}
                </b>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Buyer:</strong>
                {' '}
                {order.buyerInfo?.username}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Seller:</strong>
                {' '}
                {order.sellerInfo?.username}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Product:</strong>
                {' '}
                {order.name}
                <br />
                <small>{order.description}</small>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Product type:</strong>
                {' '}
                {order.productType}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Quantity:</strong>
                {' '}
                {order.quantity}
              </div>
              <div style={{ marginBottom: '10px' }}>
                <strong>Total Price:</strong>
                {' '}
                {
                  order.payBy === 'token' ? (
                    <span>
                      {order.totalPrice}
                      {' '}
                      token(s)
                    </span>
                  ) : (
                    <span>
                      $
                      {order.totalPrice}
                    </span>
                  )
                }
              </div>
              {
                order.productType === 'physical'
                  && (
                    <>
                      <div style={{ marginBottom: '10px' }}>
                        <strong>Delivery Address:</strong>
                        {' '}
                        {order.deliveryAddress || 'N/A'}
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <strong>Delivery Postal Code:</strong>
                        {' '}
                        {order.postalCode || 'N/A'}
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        Shipping Code:
                        {' '}
                        <Input
                          placeholder="Enter shipping code here"
                          defaultValue={order.shippingCode}
                          onChange={(e) => this.setState({ shippingCode: e.target.value })}
                        />
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        Delivery Status:
                        {' '}
                        <Select
                          onChange={(e) => this.setState({ deliveryStatus: e })}
                          defaultValue={order.deliveryStatus}
                          style={{ minWidth: '100px' }}
                        >
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
                        </Select>
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <Button danger onClick={this.onUpdate.bind(this)}>
                          Update
                        </Button>
                      </div>
                    </>
                  )
              }
            </div>
          )}
        </Page>
      </>
    );
  }
}

export default OrderDetailPage;
