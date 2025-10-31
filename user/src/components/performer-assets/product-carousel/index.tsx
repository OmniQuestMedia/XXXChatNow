import { LeftCircleFilled, RightCircleFilled } from '@ant-design/icons';
import {
  Button, Col, Row, Skeleton
} from 'antd';
import Router from 'next/router';
import React from 'react';
import ProductCard from 'src/components/products/product-card';
import { IPerformer, IProduct } from 'src/interfaces';

import style from './product-carousel.module.less';

interface IProps {
  performer: IPerformer;
  products: IProduct[];
  searching: boolean;
  purchaseProduct?: (item: IProduct, type: 'product') => void;
}

function Products({
  performer,
  products,
  searching,
  purchaseProduct = () => {}
}: IProps) {
  const ref = React.useRef(null);
  const [paddleShowing, setPaddleShowing] = React.useState(false);

  React.useEffect(() => {
    const productListElement = document.getElementsByClassName('product-list');
    if (
      productListElement.length
      && productListElement[0].clientWidth < productListElement[0].scrollWidth
    ) {
      setPaddleShowing(true);
    }
  }, [performer]);

  const scrollTo = (width?: number) => {
    const e: HTMLElement = ref.current;
    e.scroll({ left: width, behavior: 'smooth' });
  };

  if (searching) return <Skeleton loading paragraph={{ rows: 4 }} />;
  if (!products.length) return null;

  return (
    <div className={style['product-carousel']}>
      <div className={style['product-header']}>
        <span className={style['shop-name']}>{`${performer.username}'s Shop`}</span>
        <Button type="primary" onClick={() => { Router.push(`/products?username=${performer.username}`); }}>See all Items</Button>
      </div>
      <LeftCircleFilled
        className={style['left-paddle paddle']}
        hidden={!paddleShowing}
        onClick={() => scrollTo(-ref.current.clientWidth)}
      />
      <Row
        className={style['product-list']}
        ref={ref}
        gutter={[
          { sm: 25, xs: 10 },
          { sm: 10, xs: 25 }
        ]}
      >
        {products.map((product) => (
          <Col xl={6} md={8} sm={10} xs={16} key={product._id} className={style['pad12-5']}>
            <ProductCard
              product={product}
              onHandlePurchase={purchaseProduct}
            />
          </Col>
        ))}
      </Row>
      <RightCircleFilled
        hidden={!paddleShowing}
        className={style['right-paddle paddle']}
        onClick={() => scrollTo(ref.current.clientWidth)}
      />
    </div>
  );
}

export default Products;
