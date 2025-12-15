import { connect, ConnectedProps } from 'react-redux';

type Props = {
  amount: number;
  textBefore?: string;
  textAfter?: string;
};

const mapStates = (state: any) => ({
  currency: state.settings.currency
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function Price({
  amount = 0,
  currency,
  textBefore = '',
  textAfter = ''
}: Props & PropsFromRedux) {
  const newAmount = (currency?.rate || 1) * amount;
  const { symbol } = currency;

  return <span>{`${textBefore} ${symbol}${newAmount.toFixed(2)} ${textAfter}`}</span>;
}

export default connector(Price);
