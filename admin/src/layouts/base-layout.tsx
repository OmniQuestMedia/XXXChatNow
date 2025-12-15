import PrimaryLayout from './primary-layout';
import PublicLayout from './public-layout';

type IDefaultProps = {
  children: any;
  layout?: string;
}

const LayoutMap = {
  primary: PrimaryLayout,
  public: PublicLayout
};

export default function BaseLayout({
  children,
  layout = null
}: IDefaultProps) {
  const Container = layout && LayoutMap[layout] ? LayoutMap[layout] : LayoutMap.primary;
  return (
    <Container>{children}</Container>
  );
}
