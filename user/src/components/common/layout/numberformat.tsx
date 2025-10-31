import dynamic from 'next/dynamic';
import { NumericFormatProps } from 'react-number-format';

const NumberFormatNoSSR = dynamic<any>(() => import('react-number-format').then((mod) => mod.NumericFormat), {
  ssr: false
});
interface P extends NumericFormatProps { }
export default function NumberFormat({ decimalScale, ...props }: P) {
  return (
    <NumberFormatNoSSR
      {...props}
      displayType="text"
      decimalScale={decimalScale || 2}
      decimalSeparator="."
      thousandSeparator=","
    />
  );
}
