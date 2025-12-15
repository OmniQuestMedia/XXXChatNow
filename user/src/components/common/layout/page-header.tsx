import {
  Divider, PageHeader as AntPageHeader, PageHeaderProps
} from 'antd';

export default function PageHeader({ ...props }: PageHeaderProps) {
  return (
    <>
      <AntPageHeader {...props} />
      <Divider />
    </>
  );
}
