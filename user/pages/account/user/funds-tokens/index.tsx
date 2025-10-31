import { isUrl } from '@lib/string';
import { tokenPackageService } from '@services/token-package.service';
import {
  Col, Divider,
  message, Row
} from 'antd';
import dynamic from 'next/dynamic';
import React, { PureComponent } from 'react';
import { ITokenPackage } from 'src/interfaces';
import { getResponseError } from 'src/lib/utils';

import style from './index.module.less';

const PageTitle = dynamic(() => import('@components/common/page-title'));
const Loader = dynamic(() => import('@components/common/base/loader'), { ssr: false });
const TokenCard = dynamic(() => import('src/components/common/base/token-card'), { ssr: false });

interface IStates {
  tokens: ITokenPackage[];
  fetching: boolean;
  buying: string;
}

class UserTokensPage extends PureComponent<null, IStates> {
  static authenticate = true;

  static layout = 'primary';

  static getInitialProps(ctx) {
    const { query } = ctx;
    return {
      action: query.action
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      tokens: [],
      fetching: false,
      buying: null
    };
  }

  componentDidMount() {
    this.getTokens();
  }

  async getTokens() {
    try {
      this.setState({ fetching: true });
      const resp = await tokenPackageService.search({
        sortBy: 'ordering',
        sort: 'asc',
        limit: 100
      });
      this.setState({ tokens: resp.data.data || [] });
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      this.setState({ fetching: false });
    }
  }

  async buyToken(tokenPackage: ITokenPackage) {
    try {
      this.setState({ buying: tokenPackage._id });
      const resp = await tokenPackageService.buyTokens(tokenPackage._id);
      if (resp.data) {
        if (isUrl(resp.data.paymentUrl)) {
          window.open(resp.data.paymentUrl);
        }
      }
    } catch (e) {
      const error = await Promise.resolve(e);
      message.error(getResponseError(error));
    } finally {
      this.setState({ buying: null });
    }
  }

  render() {
    const { fetching, tokens, buying } = this.state;
    return (
      <div className={style['funds-tokens-box']}>
        <PageTitle title="Funds - Tokens" />
        <p className="heading-title">
          <span className="heading-left">Buy More Tokens</span>
          <span className="heading-right">[Tokens can be used for purchasing model contents[Videos, Gallery, Products] and tipping models on this platform.]</span>
        </p>
        <Divider />
        <div className="tokens-section">
          <div className="tokens-card">
            <Row>
              {fetching ? (
                <Loader />
              ) : tokens && tokens.length ? (
                tokens.map((item) => (
                  <Col xs={12} md={8} xl={6} xxl={4} key={item._id}>
                    <TokenCard
                      name={item.name}
                      token={item.tokens}
                      price={item.price}
                      description={item.description}
                      onBuyToken={() => this.buyToken(item)}
                      buying={item._id === buying}
                    />
                  </Col>
                ))
              ) : (
                'There is no data'
              )}
            </Row>
          </div>
        </div>
      </div>
    );
  }
}

export default UserTokensPage;
