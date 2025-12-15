import NumberFormat from '@components/common/layout/numberformat';
import Price from '@components/price';
import { Button, Popover } from 'antd';
import React from 'react';
import { connect } from 'react-redux';

import style from './token-card.module.less';

interface IProps {
  name: string;
  token: number;
  price: number;
  onBuyToken?: Function;
  buying?: boolean;
  // currencySymbol?: string;
  description?: string;
}

function TokenCard({
  token,
  price,
  name,
  buying = false,
  // currencySymbol = '$',
  description = '',
  onBuyToken = () => { }
}: IProps) {
  return (
    <div className={style['token-card']}>
      <div className="card-image">
        <div className="coin">
          <div className="current-coin">
            <img src="/crown.png" alt="" />
            <span>
              x
              {token}
            </span>
          </div>
        </div>
      </div>
      {/* <NumberFormat value={}/> */}
      <NumberFormat value={token} suffix=" Token for " />
      <Price amount={price} />
      <br />
      <p>{name}</p>
      {description ? (
        <Popover content={description}>
          <div className="description">{description}</div>
        </Popover>
      ) : (
        <div style={{ color: '#000000' }}>No description</div>
      )}
      <Button
        type="primary"
        onClick={() => onBuyToken()}
        loading={buying}
        disabled={buying}
      >
        Buy Now
      </Button>
    </div>
  );
}

const mapStateToProps = (state: any) => ({
  ...state.ui
});
export default connect(mapStateToProps)(TokenCard);
