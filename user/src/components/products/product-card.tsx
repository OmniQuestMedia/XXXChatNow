import NumberFormat from '@components/common/layout/numberformat';
import { Tag } from 'antd';
import { IProduct } from 'src/interfaces';
import { defaultColor } from 'src/lib';

import style from './product-card.module.less';

interface IProps {
  product: IProduct;
  onHandlePurchase: Function;
}

export function ProductCard({ product, onHandlePurchase }: IProps) {
  const generateToken = (token: number) => token && (
    <Tag color={token > 0 ? defaultColor.primaryColor : '#ccc'}>
      {token > 0 ? <NumberFormat value={token} suffix=" tokens" /> : 'FREE'}
    </Tag>
  );
  return (
    <div className={style['product-card']} aria-hidden onClick={() => onHandlePurchase(product)}>
      <div className="product-thumb">
        {product.type === 'physical' && (
          <div className="stock ant-tag ant-tag-has-color">
            Stock:
            {' '}
            {product.stock}
          </div>
        )}
        <span className="value">{generateToken(product.token)}</span>
        {product.type === 'digital' && <span className="type-digital">Digital</span>}
        {product.type === 'physical' && <span className="type-digital">Physical</span>}
        <div className="hover-pointer">
          <img alt="" src={product?.image || '/no-image.jpg'} />
        </div>
      </div>
      <div className={style['product-name']}>{product.name}</div>
    </div>
  );
}
export default ProductCard;
