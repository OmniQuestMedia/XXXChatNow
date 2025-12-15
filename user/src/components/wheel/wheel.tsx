import style from './wheel.module.less';
import WheelComponent from './wheel-component';

interface IProps {
  options: string[];
  onFinish: Function;
  performerId: string;
  conversationId: string;
  price: number;
}

export function Wheel({
  options, onFinish, performerId, conversationId, price
}: IProps) {
  const segColors = [
    '#EE4040',
    '#F0CF50',
    '#815CD1',
    '#3DA5E0',
    '#34A24F',
    '#F9AA1F',
    '#EC3F3F',
    '#FF9000'
  ];

  return (
    <div className={style['wheel-component']}>
      <WheelComponent
        segments={options}
        segColors={segColors}
        onFinish={onFinish}
        primaryColor="black"
        contrastColor="white"
        buttonText="Spin"
        isOnlyOnce
        size={160}
        upDuration={1000}
        downDuration={300}
        conversationId={conversationId}
        performerId={performerId}
        fontFamily="Arial"
        price={price}
      />
    </div>
  );
}
