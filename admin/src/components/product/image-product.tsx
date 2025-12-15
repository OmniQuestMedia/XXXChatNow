import { IProductUpdate } from 'src/interfaces';

interface IProps {
  product?: IProductUpdate;
  style?: Record<string, string>;
}

export function ImageProduct({
  product = {} as any,
  style = null
}: IProps) {
  const { image = '/product.png' } = product;
  const url = image || '/product.png';
  return <img src={url} style={style || { width: 70 }} alt="" />;
}

export default ImageProduct;
